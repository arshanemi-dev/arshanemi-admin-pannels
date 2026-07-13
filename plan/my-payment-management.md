# Razorpay Credit-Wallet Billing System

## Context

The admin panel already manages a catalog of standalone tools (PDF Cropper, Background Remover, etc. — each hosted on its own subdomain outside this repo) and already has `wallet_credits_total`/`wallet_credits_used` columns on `users`. What's missing is the part that turns this into a real billing system: per-tool-feature pricing that admins control, a way for users to buy credits via Razorpay, atomic deduction when a billable action fires in any tool, and full audit trails (usage history + payment history). This plan adds exactly that, fitting into the existing Next.js/Supabase conventions rather than introducing new patterns where existing ones already work.

**Decisions already made with the user:**
1. The existing dummy Razorpay *Subscriptions* scaffold (`data/dummySubscription.js`, `app/api/admin/subscription/*`, `app/api/admin/plans/*` — unused Free/Pro/Business recurring plans) is left **completely untouched**. This is new, independent, parallel code.
2. External tool apps (separate subdomains, not in this repo) authenticate to the credit-deduction API using the **same Bearer JWT** the user already holds (existing CORS + `getAuthPayload()` infrastructure) — no new API-key mechanism.
3. The new billable "features" are **merged into** the existing marketing `features[]` array on each tool (adds `id`, `apiIdentifier`, `creditCost`, `isActive` alongside `icon`/`title`/`desc`), not a separate parallel list.

**Note on repo state:** this repo has concurrent sessions active on it (per prior project memory). During this planning session, another session migrated the `tools` catalog from a JSONB blob to a dedicated `tools` SQL table (commit `46e9964`) and added session-refresh handling (commit `3a5153d`). This plan is written against the *current, committed* state — verify `git log` / the cited files still match before implementing, since the repo is a moving target.

---

## Architecture Overview

- **`users.wallet_credits_total` / `wallet_credits_used`** (already exist) stay the single source of truth for balance. All balance changes go through two new **Postgres functions** (`deduct_wallet_credits`, `credit_wallet_topup`) called via `supabase.rpc()` — this is the one new pattern this codebase doesn't currently use, and it's required because Supabase's JS query builder can't express `WHERE (total - used) >= amount` (a column-vs-column comparison), and a naive JS read-then-write would race under concurrent tool API calls.
- **`tools`** is now a real SQL table (`id, slug, title, ..., content JSONB` where `content.features` holds the marketing+billing array). Billable pricing lives inside `content.features[]` items, edited through the existing tool-catalog admin form.
- **Three new tables**: `credit_packages` (admin-configurable buy packs), `wallet_topups` (payment/purchase history — this is the "wallets_history"/subscriptions-history the user asked for), `tools_usage_history` (every billable API fire).
- **New API surface**: `/api/wallet/*` (any authenticated role, cross-origin capable — balance, packages, buy flow, own history, and the core `deduct` endpoint external tools call) + `/api/admin/*` additions (credit-package CRUD, all-users usage/payment history).
- **Admin UI**: new pages for credit packages and history, a pricing sub-editor bolted onto the existing tools-catalog form, and a "My Wallet" page for every role to buy credits and see their own history.
- **Fixes a pre-existing bug** in `lib/permissions.js`'s `isPathAllowed` (raw `startsWith` prefix match) that would otherwise let the company-scoped `admin` role slip into the master-only `/settings/tools-catalog` page once it's added to nav (`/settings/tools-catalog`.startsWith(`/settings/tools`) === true).

---

## 1. New migration — `scripts/wallet_system_migration.sql`

Follow the existing migration style (`scripts/address_wallet_migration.sql` etc. — header comment, `CREATE TABLE IF NOT EXISTS`, indexes, RLS with a single `"Service role manages X"` policy).

**`credit_packages`** — admin-configurable buy packs:
`id UUID PK`, `name VARCHAR NOT NULL`, `credits INTEGER NOT NULL CHECK (credits > 0)`, `price_paise INTEGER NOT NULL CHECK (price_paise > 0)`, `badge VARCHAR`, `is_active BOOLEAN DEFAULT TRUE`, `display_order INTEGER DEFAULT 0`, `created_at/updated_at`.

**`wallet_topups`** — one row per purchase attempt ("wallets_history" / payment history):
`id UUID PK`, `user_id UUID FK→users`, `credit_package_id UUID FK→credit_packages ON DELETE SET NULL`, `package_name VARCHAR NOT NULL` (snapshot), `amount_paise INTEGER NOT NULL CHECK (>0)`, `credits_granted INTEGER NOT NULL CHECK (>0)`, `status VARCHAR DEFAULT 'created'` (`created|paid|failed|cancelled`), `razorpay_order_id VARCHAR UNIQUE NOT NULL`, `razorpay_payment_id VARCHAR UNIQUE`, `razorpay_signature VARCHAR`, `failure_reason TEXT`, `credited_at TIMESTAMPTZ`, `created_at/updated_at`. Indexes on `user_id`, `status`, `razorpay_order_id`.

**`tools_usage_history`** — every billable API fire:
`id UUID PK`, `user_id UUID FK→users`, `tool_id TEXT FK→tools ON DELETE SET NULL`, `tool_slug VARCHAR NOT NULL` (snapshot), `feature_id TEXT`, `feature_api_identifier VARCHAR NOT NULL`, `feature_title VARCHAR` (snapshot), `credits_cost INTEGER NOT NULL CHECK (>0)` (price at time of firing — never re-looked-up), `idempotency_key VARCHAR`, `created_at TIMESTAMPTZ`. `UNIQUE (user_id, idempotency_key)` — Postgres treats NULLs as distinct, so this only dedupes when a key is actually supplied. Indexes on `user_id`, `tool_slug`, `created_at`.

**Two Postgres functions** (the correctness-critical piece — full SQL below):

```sql
CREATE OR REPLACE FUNCTION deduct_wallet_credits(
  p_user_id UUID, p_amount INTEGER, p_tool_id TEXT, p_tool_slug VARCHAR,
  p_feature_id TEXT, p_feature_api_identifier VARCHAR, p_feature_title VARCHAR,
  p_idempotency_key VARCHAR DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_existing tools_usage_history%ROWTYPE;
  v_row      users%ROWTYPE;
  v_remaining INTEGER;
  v_usage_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM tools_usage_history
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
      SELECT (wallet_credits_total - wallet_credits_used) INTO v_remaining FROM users WHERE id = p_user_id;
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'usageId', v_existing.id,
                                 'creditsCost', v_existing.credits_cost, 'remaining', v_remaining);
    END IF;
  END IF;

  -- Single guarded UPDATE = atomic (Postgres row-locks for the statement,
  -- so concurrent callers serialize here — no SELECT-then-write race window).
  UPDATE users
  SET wallet_credits_used = wallet_credits_used + p_amount, updated_at = NOW()
  WHERE id = p_user_id AND (wallet_credits_total - wallet_credits_used) >= p_amount
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
      SELECT (wallet_credits_total - wallet_credits_used) INTO v_remaining FROM users WHERE id = p_user_id;
      RETURN jsonb_build_object('ok', false, 'error', 'insufficient_credits', 'remaining', v_remaining);
    ELSE
      RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
    END IF;
  END IF;

  BEGIN
    INSERT INTO tools_usage_history (user_id, tool_id, tool_slug, feature_id, feature_api_identifier, feature_title, credits_cost, idempotency_key)
    VALUES (p_user_id, p_tool_id, p_tool_slug, p_feature_id, p_feature_api_identifier, p_feature_title, p_amount, p_idempotency_key)
    RETURNING id INTO v_usage_id;
  EXCEPTION WHEN unique_violation THEN
    -- Lost a race to a concurrent call with the SAME idempotency key that
    -- committed first: undo our own deduction and return its row instead.
    UPDATE users SET wallet_credits_used = wallet_credits_used - p_amount, updated_at = NOW() WHERE id = p_user_id;
    SELECT * INTO v_existing FROM tools_usage_history WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
    SELECT (wallet_credits_total - wallet_credits_used) INTO v_remaining FROM users WHERE id = p_user_id;
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'usageId', v_existing.id,
                               'creditsCost', v_existing.credits_cost, 'remaining', v_remaining);
  END;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'usageId', v_usage_id,
                             'creditsCost', p_amount, 'remaining', v_row.wallet_credits_total - v_row.wallet_credits_used);
END;
$$;

CREATE OR REPLACE FUNCTION credit_wallet_topup(
  p_razorpay_order_id VARCHAR, p_razorpay_payment_id VARCHAR, p_razorpay_signature VARCHAR
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_topup wallet_topups%ROWTYPE;
  v_total INTEGER;
BEGIN
  UPDATE wallet_topups
  SET status = 'paid', razorpay_payment_id = p_razorpay_payment_id,
      razorpay_signature = p_razorpay_signature, credited_at = NOW(), updated_at = NOW()
  WHERE razorpay_order_id = p_razorpay_order_id AND status = 'created'
  RETURNING * INTO v_topup;

  IF NOT FOUND THEN
    SELECT * INTO v_topup FROM wallet_topups WHERE razorpay_order_id = p_razorpay_order_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'order_not_found'); END IF;
    IF v_topup.status = 'paid' THEN
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'topupId', v_topup.id, 'creditsGranted', v_topup.credits_granted);
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'topup_not_payable', 'status', v_topup.status);
  END IF;

  UPDATE users SET wallet_credits_total = wallet_credits_total + v_topup.credits_granted, updated_at = NOW()
  WHERE id = v_topup.user_id RETURNING wallet_credits_total INTO v_total;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'topupId', v_topup.id,
                             'creditsGranted', v_topup.credits_granted, 'newTotal', v_total);
END;
$$;
```

`credit_wallet_topup` is idempotent so it's safe to call from **both** the client-verify route and the webhook (whichever lands first wins; the second becomes a no-op `duplicate: true`). Neither function needs `SECURITY DEFINER` — the server always calls via the service-role Supabase client, which already bypasses RLS like every other table access in this app.

---

## 2. `lib/db.js` additions

New section, same style as the existing `Files Expiry` / `Companies` sections (private `getSupabase()`, snake_case↔camelCase mapping at the boundary):

- **Credit packages**: `getAllCreditPackages({activeOnly})`, `getCreditPackageById(id)`, `createCreditPackage(data)`, `updateCreditPackage(id, data)`, `deleteCreditPackage(id)`.
- **Wallet topups**: `createWalletTopup({userId, creditPackageId, packageName, amountPaise, creditsGranted, razorpayOrderId})`, `getWalletTopupByOrderId(orderId)`, `getWalletTopupsForUser(userId, {limit=100})`, `getAllWalletTopups({userIds, status, limit=500})` (admin view, `.in('user_id', ids)` scoping — same technique already used for `files_expiry` bulk ops), `markWalletTopupFailed(orderId, reason)`.
- **Usage history**: `getUsageHistoryForUser(userId, {limit=100})`, `getAllUsageHistory({userIds, toolSlug, limit=500})`.
- **Atomic RPC wrappers** (the crux):
  ```js
  export async function deductWalletCredits({ userId, amount, toolId, toolSlug, featureId, featureApiIdentifier, featureTitle, idempotencyKey = null }) {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('deduct_wallet_credits', {
      p_user_id: userId, p_amount: amount, p_tool_id: toolId, p_tool_slug: toolSlug,
      p_feature_id: featureId, p_feature_api_identifier: featureApiIdentifier,
      p_feature_title: featureTitle, p_idempotency_key: idempotencyKey,
    })
    if (error) throw error
    return data
  }

  export async function creditWalletTopup({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('credit_wallet_topup', {
      p_razorpay_order_id: razorpayOrderId, p_razorpay_payment_id: razorpayPaymentId, p_razorpay_signature: razorpaySignature,
    })
    if (error) throw error
    return data
  }
  ```
- `getUsersByIds(ids)` — small helper (`select('id,name,email,mobile,company_id').in('id', ids)`) so admin history tables can join in user names client-side, same pattern as `companyLabel()` in `app/settings/users/page.js`.

---

## 3. New `lib/razorpay.js`

Independent from the old subscription code (per decision #1 — don't touch/import it). Reuses existing env vars (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET` — already in `.env.example`, no new ones needed):

- `isConfigured()` — checks key envs are set.
- `createOrder({ amountPaise, currency='INR', notes, receipt })` — `POST /v1/orders` via the same raw-fetch + Basic-auth pattern as the old `razorpay()` helper in `app/api/admin/subscription/route.js` (replicate the pattern, don't import it).
- `verifyPaymentSignature({ orderId, paymentId, signature })` — standard Razorpay Checkout HMAC formula: `hmac_sha256(orderId + '|' + paymentId, key_secret) === signature`.
- `verifyWebhookSignature({ rawBody, signature })` — same raw-body HMAC pattern as the existing `app/api/admin/subscription/webhook/route.js` (replicated, not shared).

---

## 4. `data/tools.js` + `lib/tools.js` changes

Each tool's `features[]` items gain 4 fields — `id`, `apiIdentifier`, `creditCost`, `isActive` — alongside the existing `icon`/`title`/`desc`. Apply to all tools' static seed data: the 5 real embedded apps (`pdf-cropper`, `bg-remover`, `profit-loss`, `program`, `link-generator` — identified by having a `toolUrl`) get real `apiIdentifier`/`creditCost`/`isActive:true` per feature (e.g. PDF Cropper's "Batch Processing" feature → `apiIdentifier: 'crop-batch', creditCost: 5`); the remaining marketing-only tools default to `isActive:false, creditCost:0, apiIdentifier:null`.

New helper in `lib/tools.js`:
```js
export async function getToolFeature(slug, apiIdentifier) {
  const tool = await getTool(slug)   // rides the existing unstable_cache tag 'tools'
  if (!tool) return { tool: null, feature: null }
  const feature = (tool.features || []).find((f) => f.apiIdentifier === apiIdentifier)
  return { tool, feature: feature ?? null }
}
```
No extra DB round-trip on every deduct call — this reuses the cache already invalidated by `revalidateTag('tools')` whenever an admin edits pricing.

**Note**: `scripts/seed.mjs`'s tool seeding does a full-row upsert, not a deep merge — don't re-run it after go-live or it will overwrite admin-made pricing edits (pre-existing risk, not new).

---

## 5. API routes

**User-facing — `app/api/wallet/*`** (outside `/api/admin`, so `proxy.js` only stamps CORS headers and leaves auth to the route via `getAuthPayload(req)` — this is what lets the external tool apps call in cross-origin with their Bearer token):

| Route | Method | Response |
|---|---|---|
| `app/api/wallet/packages/route.js` | GET | active `credit_packages` list |
| `app/api/wallet/topup/order/route.js` | POST `{creditPackageId}` | creates `wallet_topups` row + Razorpay order → `{orderId, amountPaise, keyId, packageName, credits}` |
| `app/api/wallet/topup/verify/route.js` | POST `{razorpayOrderId, razorpayPaymentId, razorpaySignature}` | verifies ownership + signature → `creditWalletTopup()` |
| `app/api/wallet/webhook/route.js` | POST (Razorpay calls this, no user auth) | HMAC-verifies raw body, on `payment.captured`/`order.paid` → `creditWalletTopup()` (idempotent safety net if the client-verify call never lands) |
| `app/api/wallet/history/usage/route.js` | GET `?limit=` | own `tools_usage_history` |
| `app/api/wallet/history/topups/route.js` | GET `?limit=` | own `wallet_topups` |
| **`app/api/wallet/deduct/route.js`** | **POST** | see §7 — the endpoint external tool apps integrate against |

Balance itself needs no new endpoint — `GET /api/auth/me` already returns `walletCreditsTotal/walletCreditsUsed/walletCreditsRemaining` via `lib/profile.js`'s `serializeProfile()`; the wallet page reuses it.

**Admin — `app/api/admin/*`**:
- `app/api/admin/credit-packages/route.js` (GET via `getStaffFromRequest`, POST via `getAdminFromRequest`) + `[id]/route.js` (GET/PUT/DELETE, `getAdminFromRequest`) — mirrors `app/api/admin/tools/[id]/route.js` exactly.
- `app/api/admin/usage-history/route.js` (GET, `getStaffFromRequest`, `?userId=&toolSlug=&limit=`) — company-scoped for `admin` role via `getAllUsers({companyId})` → ids → `getAllUsageHistory({userIds})`, same scoping already used for the Users list.
- `app/api/admin/payment-history/route.js` (GET, `getStaffFromRequest`, same scoping) — lists `wallet_topups`.

---

## 6. Admin UI

Reuse `components/admin/{DataTable, Modal, FormField, PageHeader, ConfirmDialog, Toast (useToast), Skeleton (TableSkeleton/LoadError/PackageGridSkeleton)}` throughout — follow `app/settings/users/page.js`'s pattern (fetch-on-mount + `DataTable` + `Modal`), **not** `ToolsAdminClient.jsx`'s hand-rolled table/modal (legacy inconsistency, don't propagate it further).

1. **`app/settings/credit-packages/page.js`** + `CreditPackagesClient.jsx` — CRUD grid/table for buy packs (name, credits, price, badge, active). Calls `/api/admin/credit-packages*`.
2. **`app/settings/usage-history/page.js`** + `UsageHistoryClient.jsx` — read-only table (user, tool, feature, credits cost, date) with user/tool filters.
3. **`app/settings/payment-history/page.js`** + `PaymentHistoryClient.jsx` — read-only table (user, package, amount, credits granted, status, date).
4. **Feature-pricing sub-editor bolted onto `app/settings/tools-catalog/ToolsAdminClient.jsx`**: a repeatable "Features & Pricing" section in the existing form modal — reuse the file's existing `ICON_OPTIONS`/`autoSlug()` helpers, add `creditCost` number input and `isActive` toggle (matching the existing switch markup already in that file) per row. Submits as part of the same `features` field in the existing PUT/POST body — `updateTool()`'s content-merge logic already handles partial updates correctly, so no new API route is needed here.
5. **`app/settings/wallet/page.js`** + `MyWalletClient.jsx` ("My Wallet", reachable by every role) — balance card (from `/api/auth/me`), credit-pack grid (`PackageGridSkeleton` while loading) with a "Buy" button per pack, Razorpay Checkout.js loaded via `<Script strategy="lazyOnload">` (same `next/script` mechanism already used in `app/layout.js`) → on success, `POST /api/wallet/topup/verify` → refresh balance; two `DataTable`s below for own usage + payment history.

**Required fix — `lib/permissions.js`'s `isPathAllowed`** (currently a raw prefix match that would let `admin` reach the master-only `/settings/tools-catalog` via the `/settings/tools` collision once nav is added):
```js
// before:
return getAllowedHrefsForRole(role).some((href) => href !== '/settings' && pathname.startsWith(href))
// after:
return getAllowedHrefsForRole(role).some(
  (href) => href !== '/settings' && (pathname === href || pathname.startsWith(href + '/'))
)
```

**`components/admin/navIcons.js`**: add `Wrench, CreditCard, History, Receipt, Wallet` to the lucide-react import + `NAV_ICONS` map (this file is a hardcoded whitelist — an unlisted icon name silently renders nothing).

**`lib/permissions.js` `NAV_CONFIG`** — new group (also fixes the currently-orphaned `tools-catalog` page, which has no nav entry today):
```js
{
  label: 'BILLING & WALLET',
  items: [
    { key: 'tools-catalog',   label: 'Tools Catalog',    href: '/settings/tools-catalog',   icon: 'Wrench',     roles: ['master_admin'] },
    { key: 'credit-packages', label: 'Credit Packages',  href: '/settings/credit-packages', icon: 'CreditCard', roles: ['master_admin'], quickAction: true },
    { key: 'usage-history',   label: 'Usage History',    href: '/settings/usage-history',   icon: 'History',    roles: ['master_admin', 'admin'] },
    { key: 'payment-history', label: 'Payment History',  href: '/settings/payment-history', icon: 'Receipt',    roles: ['master_admin', 'admin'] },
  ],
},
```
Plus, in the existing `ACCOUNT` group, after `profile` (so `getLandingPageForRole('user')` still resolves to `/settings/profile` — no unrequested landing-page change):
```js
{ key: 'wallet', label: 'My Wallet', href: '/settings/wallet', icon: 'Wallet', roles: ['master_admin', 'admin', 'user'] },
```

---

## 7. `POST /api/wallet/deduct` — contract for the external tool apps

This is what PDF Cropper, BG Remover, etc. (separate repos) integrate against. Wiring those repos up is out of scope here — this defines the contract only.

**Auth**: `getAuthPayload(req)` (Bearer header priority, cookie fallback) — 401 if missing/invalid.

**Request**:
```json
{ "toolSlug": "pdf-cropper", "featureApiIdentifier": "crop-batch", "idempotencyKey": "optional-client-uuid" }
```

**Success (200)**:
```json
{ "ok": true, "usageId": "uuid", "creditsCost": 5, "remainingCredits": 395, "duplicate": false }
```

**Errors**: `401` unauthorized · `400` missing fields · `404` tool not found · `404` feature not found or `isActive:false` · `402 {error:'Insufficient credits', remainingCredits, requiredCredits}` · `500` unexpected.

Implementation: `getToolFeature(toolSlug, featureApiIdentifier)` → validate existence/active → `deductWalletCredits({userId: payload.userId, amount: feature.creditCost, toolId: tool.id, toolSlug, featureId: feature.id, featureApiIdentifier, featureTitle: feature.title, idempotencyKey})` → map the RPC's `error` field to the status codes above.

`idempotencyKey` is optional — supplying it makes retried calls (e.g. a client retry after a timeout) safe from double-charging via the `UNIQUE(user_id, idempotency_key)` constraint + the compensating-transaction branch in `deduct_wallet_credits`.

---

## Verification

1. Run `scripts/wallet_system_migration.sql` in the Supabase SQL Editor (matches existing manual-migration workflow).
2. `npm run dev` — confirm `/settings/tools-catalog`, `/settings/credit-packages`, `/settings/usage-history`, `/settings/payment-history`, `/settings/wallet` all appear correctly in the sidebar per role (master_admin sees everything; admin sees history + wallet but not credit-packages/tools-catalog; user sees only wallet).
3. Create a credit package via the new admin UI; edit a tool's features in `tools-catalog` to set a `creditCost` on one feature.
4. On `/settings/wallet`, buy that package with a Razorpay test-mode card; confirm `wallet_topups` transitions `created → paid` and `users.wallet_credits_total` increments by the right amount.
5. Call `POST /api/wallet/deduct` with a valid Bearer token for that user (curl/Postman) using the tool slug + `apiIdentifier` just priced; confirm `wallet_credits_used` increments, a `tools_usage_history` row appears, and the response's `remainingCredits` is correct.
6. Set the user's remaining balance below the feature's cost and call `deduct` again — confirm a clean `402 insufficient_credits` with no partial state change.
7. Call `deduct` twice with the same `idempotencyKey` — confirm only one deduction happens and the second call returns `duplicate: true` with the same `usageId`.
8. Confirm the new `usage-history` and `payment-history` admin pages show the rows from steps 4–7, and that a company-scoped `admin` only sees their own company's users' rows.
9. Confirm `admin`-role navigation to `/settings/tools-catalog` directly by URL now 404s (verifies the `isPathAllowed` fix).
</content>
