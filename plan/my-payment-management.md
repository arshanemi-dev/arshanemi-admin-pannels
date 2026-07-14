# Coin-Wallet Billing System (Razorpay)

## Implementation Status (living section — update this first, every session)

**Backend: 0% built.** Verified by direct inspection, not assumption — none of these exist yet:
`scripts/wallet_system_migration.sql`, any `credit_packages`/`wallet_topups`/`tools_usage_history` table or reference in `lib/db.js`, `app/api/wallet/*`, `app/api/admin/credit-packages/*`, `lib/razorpay.js`, or `apiIdentifier`/`creditCost`/`isActive` fields on `data/tools.js` features. `users.wallet_credits_total`/`wallet_credits_used` are the only real, live pieces of this system.

**Frontend: built ahead of the backend, against dummy data, with a different page layout than originally planned.** Five sessions of UI-first iteration produced:

| Page | Route | Built against | Nav entry |
|---|---|---|---|
| Plan | `/settings/plan` | `data/coinPlans.js`, `data/coinsUsageRates.js` | `ACCOUNT` group, all roles |
| Customer Dashboard | `/settings/customer-dashboard` | `data/customers.js`, `data/customerReports.js` | `COMPANIES & USERS` group, master_admin/admin |
| Wallet (admin, cross-user) | `/settings/wallet` | `data/walletBalances.js`, `data/walletHistory.js` | `BILLING & WALLET` group, master_admin/admin |
| Wallet (personal) | Profile page → "Wallet" tab | `data/myWalletHistory.js` + real `walletCreditsTotal/Used/Remaining` | not a nav item — see below |
| Coin Use (personal) | Profile page → "Coin Use" tab, `user` role only | `data/coinUsage.js` | not a nav item — see below |

None of the original planned pages (`/settings/credit-packages`, `/settings/usage-history`, `/settings/payment-history`, tools-catalog pricing sub-editor) exist. The pages above are **not** those pages — they cover overlapping but different ground (see "Customer Dashboard — clarified scope" below) and were driven by mockups, not this plan. This plan and the live UI need to be reconciled, which is what this revision does.

**Why "Wallet" and "Coin Use" aren't nav items for the `user` role**: `app/settings/layout.js` renders no `Sidebar` at all for `role === 'user'` (single centered page, by design). A NAV_CONFIG entry with `roles: [...,'user']` is technically permission-allowed but has no link to click. So the personal-wallet and per-tool-usage views were built as tabs on the one page a `user` does get (`app/settings/profile/page.js`, tabs: `Profile / Setting / Coin Use / Wallet`) instead. `master_admin`/`admin` reach the cross-user admin Wallet page via the sidebar as originally planned.

**Reusable infrastructure gained along the way** (not in the original plan, but directly useful for it): `components/admin/data-table/` — search, sortable columns, generic dropdown filters, a date/time range filter, a rows-per-page control, and Excel (`exceljs`) + PDF (`jspdf` + `jspdf-autotable`) export, all built on top of the original `components/admin/DataTable.jsx` contract (now a re-export shim, so the 8 pre-existing consumers — Users, Team, Testimonials, Services, Partners, Industries, Case Studies, Blogs — are unaffected). **Use this for `usage-history` and `payment-history` when they're built** — it already does everything §6 originally asked those pages to hand-roll.

**Terminology**: the user asked for "coins" everywhere. Applied to all UI copy this session (`ADD COINS`, `Coins Issued/Used/Remaining`, `Coin Use`, `Coin Cost (Per Use)`, `Coin Balance`, etc.) and to every identifier below that this plan controls and hasn't been built yet — table names, RPC function names, JSON field names all now say `coin`, not `credit`. The one exception, non-negotiable: `users.wallet_credits_total` / `wallet_credits_used` are real, live Supabase columns already in production — renaming them is a schema migration with no upside, not a text edit, and is out of scope. **Every new table/function/field this plan introduces reads from and writes to those two existing columns under their real names, but is itself named with `coin`.** `lib/profile.js`'s `serializeProfile()` output (`walletCreditsTotal/Used/Remaining`) also stays as-is — it's consumed by existing code (`UserFormModal.jsx`, `app/api/admin/users/*`) beyond this feature's boundary.

**Naming convention — strict, file names included, not just copy** (added per direct instruction after a real collision was caught): this codebase already uses "token" for something else entirely — JWT auth (`lib/auth.js`, `lib/tokenStore.js`, `app/api/auth/{login,logout,refresh,signup,verify-otp,reset-password}/route.js`, `components/admin/SessionManager.jsx`, `proxy.js`). The coins feature's original "Token Use" tab — file `components/admin/token-use/TokenUsagePanel.jsx`, data file `data/tokenUsage.js`, constants `TOKEN_USE_RANGES`/`tokenUsageByRange`, tab id `tokenUse` — collided with that on sight: a maintainer grepping for "token" to work on auth would land in the coins feature by mistake, or vice versa. **Fixed this revision**: renamed folder → `components/admin/coin-use/`, `TokenUsagePanel.jsx` → `CoinUsagePanel.jsx`, `data/tokenUsage.js` → `data/coinUsage.js`, `TOKEN_USE_RANGES` → `COIN_USE_RANGES`, `tokenUsageByRange` → `coinUsageByRange`, tab id `tokenUse` → `coinUse`, tab label "Token Use" → "Coin Use". Also caught and fixed the same collision in the pre-existing `WalletCard` component on the admin/master_admin Subscription tab — its card heading literally said "Token Use" too; now "Coin Balance". Verified zero remaining `grep -rn "token"` hits anywhere in this feature's files (`app/settings/profile/page.js`, `data/coinUsage.js`, `components/admin/coin-use/*`) — only the auth system may use that word from here on. **Rule for every future file in this feature, no exceptions**: if it's about coins/wallet, the file name, folder name, exported identifier names, and constant names all say `coin` or `wallet` — never `token`, never `credit` (except the two grandfathered `wallet_credits_*` DB columns called out above). Check `grep -rn "[Tt]oken\|[Cc]redit"` against new files before committing them.

---

## Customer Dashboard — clarified scope

Per direct clarification: **"Customer Dashboard" is two reports, not one.**

1. **Tools/features-wise coins usage report** — which tool, which feature, how many coins consumed, by whom, aggregated across all customers. Backed by `tools_usage_history` (below) grouped by `tool_slug` + `feature_api_identifier`. **Not built yet.** The closest existing thing is `components/admin/plan/CoinsUsageTable.jsx`, but that shows *pricing* (coin cost per feature), not *actual usage* — a different table reading a different source. The Coin Use tab's `ToolCoinTable` (`components/admin/coin-use/ToolCoinTable.jsx`) shows a usage breakdown, but scoped to one signed-in `user`, not cross-customer.
2. **User report — login status of users & wallets** — per-customer login state (`Without Login`/`Login`/`Paid`) and wallet balance. This is what's already built: `CustomerDashboardTable` (status, tools used, balance, a "Report" jump-link) + `ReportTable` (login history, balance, expiry) on `/settings/customer-dashboard`.

**Gap to close when the backend lands**: add a third component to `/settings/customer-dashboard` — a cross-customer tools/features coins-usage table (`tool`, `feature`, `total coins used`, `unique users`, date range), sourced from `getAllUsageHistory()` grouped server-side or client-side. Build it on the shared `components/admin/data-table/DataTable` (dateKey + export already included for free). Once built, `CustomerDashboardTable`/`ReportTable`'s dummy data (`data/customers.js`, `data/customerReports.js`) gets replaced by a real `getAllUsers()` + wallet-balance join, and the "Report" jump-link's target becomes real per-user history instead of a static list.

---

## Context

The admin panel already manages a catalog of standalone tools (PDF Cropper, Background Remover, etc. — each hosted on its own subdomain outside this repo) and already has `wallet_credits_total`/`wallet_credits_used` columns on `users`. What's missing is the part that turns this into a real billing system: per-tool-feature pricing that admins control, a way for users to buy coins via Razorpay, atomic deduction when a billable action fires in any tool, and full audit trails (usage history + payment history). This plan adds exactly that, fitting into the existing Next.js/Supabase conventions rather than introducing new patterns where existing ones already work.

**Decisions already made with the user:**
1. The existing dummy Razorpay *Subscriptions* scaffold (`data/dummySubscription.js`, `app/api/admin/subscription/*`, `app/api/admin/plans/*` — unused Free/Pro/Business recurring plans) is left **completely untouched**. This is new, independent, parallel code.
2. External tool apps (separate subdomains, not in this repo) authenticate to the coin-deduction API using the **same Bearer JWT** the user already holds (existing CORS + `getAuthPayload()` infrastructure) — no new API-key mechanism.
3. The new billable "features" are **merged into** the existing marketing `features[]` array on each tool (adds `id`, `apiIdentifier`, `coinCost`, `isActive` alongside `icon`/`title`/`desc`), not a separate parallel list.
4. **(New)** All product-facing terminology is "coins," not "credits" — see Terminology above. New backend identifiers reflect this; the two real, pre-existing `wallet_credits_*` columns don't change.

**Note on repo state:** this repo has concurrent sessions active on it (per prior project memory). Re-verify `git log` / the cited files still match before implementing — the repo is a moving target, and this revision itself is evidence of that (five UI-only sessions landed between this plan's first draft and today).

---

## Architecture Overview

- **`users.wallet_credits_total` / `wallet_credits_used`** (already exist, real column names, unchanged) stay the single source of truth for balance. All balance changes go through two new **Postgres functions** (`deduct_wallet_coins`, `credit_wallet_topup`) called via `supabase.rpc()` — this is the one new pattern this codebase doesn't currently use, and it's required because Supabase's JS query builder can't express `WHERE (total - used) >= amount` (a column-vs-column comparison), and a naive JS read-then-write would race under concurrent tool API calls.
- **`tools`** is a real SQL table (`id, slug, title, ..., content JSONB` where `content.features` holds the marketing+billing array). Billable pricing lives inside `content.features[]` items, edited through the existing tool-catalog admin form. **Not yet enriched** — no tool currently has `apiIdentifier`/`coinCost`/`isActive` on its features.
- **Three new tables**: `coin_packages` (admin-configurable buy packs), `wallet_topups` (payment/purchase history), `tools_usage_history` (every billable API fire, `coins_cost` column).
- **New API surface**: `/api/wallet/*` (any authenticated role, cross-origin capable — balance, packages, buy flow, own history, and the core `deduct` endpoint external tools call) + `/api/admin/*` additions (coin-package CRUD, all-users usage/payment history).
- **Admin UI**: the cross-customer usage-report gap described above, a coin-package CRUD page, a pricing sub-editor bolted onto the existing tools-catalog form, and wiring the *already-built* Plan/Wallet/Customer-Dashboard/Coin-Use pages to real data instead of `data/*.js` dummy files.
- **Fixes a pre-existing bug, still unfixed** in `lib/permissions.js`'s `isPathAllowed` (raw `startsWith` prefix match — `pathname.startsWith(href)` with no boundary check). Not yet a live collision, but `/settings/plan` and `/settings/tools` (the `tools-access` key) are exactly the kind of sibling-prefix pair this breaks on the next page added with a similar name. Fix below, unchanged from the original plan.

---

## 1. New migration — `scripts/wallet_system_migration.sql`

Follow the existing migration style (`scripts/address_wallet_migration.sql` etc. — header comment, `CREATE TABLE IF NOT EXISTS`, indexes, RLS with a single `"Service role manages X"` policy).

**`coin_packages`** — admin-configurable buy packs:
`id UUID PK`, `name VARCHAR NOT NULL`, `coins INTEGER NOT NULL CHECK (coins > 0)`, `price_paise INTEGER NOT NULL CHECK (price_paise > 0)`, `badge VARCHAR`, `is_active BOOLEAN DEFAULT TRUE`, `display_order INTEGER DEFAULT 0`, `created_at/updated_at`.

**`wallet_topups`** — one row per purchase attempt (payment history):
`id UUID PK`, `user_id UUID FK→users`, `coin_package_id UUID FK→coin_packages ON DELETE SET NULL`, `package_name VARCHAR NOT NULL` (snapshot), `amount_paise INTEGER NOT NULL CHECK (>0)`, `coins_granted INTEGER NOT NULL CHECK (>0)`, `status VARCHAR DEFAULT 'created'` (`created|paid|failed|cancelled`), `razorpay_order_id VARCHAR UNIQUE NOT NULL`, `razorpay_payment_id VARCHAR UNIQUE`, `razorpay_signature VARCHAR`, `failure_reason TEXT`, `credited_at TIMESTAMPTZ`, `created_at/updated_at`. Indexes on `user_id`, `status`, `razorpay_order_id`.

**`tools_usage_history`** — every billable API fire:
`id UUID PK`, `user_id UUID FK→users`, `tool_id TEXT FK→tools ON DELETE SET NULL`, `tool_slug VARCHAR NOT NULL` (snapshot), `feature_id TEXT`, `feature_api_identifier VARCHAR NOT NULL`, `feature_title VARCHAR` (snapshot), `coins_cost INTEGER NOT NULL CHECK (>0)` (price at time of firing — never re-looked-up), `idempotency_key VARCHAR`, `created_at TIMESTAMPTZ`. `UNIQUE (user_id, idempotency_key)` — Postgres treats NULLs as distinct, so this only dedupes when a key is actually supplied. Indexes on `user_id`, `tool_slug`, `created_at`. **This is the source table for the "tools/features-wise coins usage report" half of Customer Dashboard** — group by `tool_slug, feature_api_identifier` for that view.

**Two Postgres functions** (the correctness-critical piece — full SQL below, renamed to `coin`, bodies otherwise identical to the original draft):

```sql
CREATE OR REPLACE FUNCTION deduct_wallet_coins(
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
                                 'coinsCost', v_existing.coins_cost, 'remaining', v_remaining);
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
      RETURN jsonb_build_object('ok', false, 'error', 'insufficient_coins', 'remaining', v_remaining);
    ELSE
      RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
    END IF;
  END IF;

  BEGIN
    INSERT INTO tools_usage_history (user_id, tool_id, tool_slug, feature_id, feature_api_identifier, feature_title, coins_cost, idempotency_key)
    VALUES (p_user_id, p_tool_id, p_tool_slug, p_feature_id, p_feature_api_identifier, p_feature_title, p_amount, p_idempotency_key)
    RETURNING id INTO v_usage_id;
  EXCEPTION WHEN unique_violation THEN
    -- Lost a race to a concurrent call with the SAME idempotency key that
    -- committed first: undo our own deduction and return its row instead.
    UPDATE users SET wallet_credits_used = wallet_credits_used - p_amount, updated_at = NOW() WHERE id = p_user_id;
    SELECT * INTO v_existing FROM tools_usage_history WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
    SELECT (wallet_credits_total - wallet_credits_used) INTO v_remaining FROM users WHERE id = p_user_id;
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'usageId', v_existing.id,
                               'coinsCost', v_existing.coins_cost, 'remaining', v_remaining);
  END;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'usageId', v_usage_id,
                             'coinsCost', p_amount, 'remaining', v_row.wallet_credits_total - v_row.wallet_credits_used);
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
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'topupId', v_topup.id, 'coinsGranted', v_topup.coins_granted);
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'topup_not_payable', 'status', v_topup.status);
  END IF;

  UPDATE users SET wallet_credits_total = wallet_credits_total + v_topup.coins_granted, updated_at = NOW()
  WHERE id = v_topup.user_id RETURNING wallet_credits_total INTO v_total;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'topupId', v_topup.id,
                             'coinsGranted', v_topup.coins_granted, 'newTotal', v_total);
END;
$$;
```

`credit_wallet_topup` keeps its name — "credit" as a verb (accounting: increase a balance) is standard and unambiguous; it's the *noun* usage ("credits" as the currency) that's being replaced by "coins" everywhere else. It's idempotent so it's safe to call from **both** the client-verify route and the webhook (whichever lands first wins; the second becomes a no-op `duplicate: true`). Neither function needs `SECURITY DEFINER` — the server always calls via the service-role Supabase client, which already bypasses RLS like every other table access in this app.

---

## 2. `lib/db.js` additions

New section, same style as the existing `Files Expiry` / `Companies` sections (private `getSupabase()`, snake_case↔camelCase mapping at the boundary):

- **Coin packages**: `getAllCoinPackages({activeOnly})`, `getCoinPackageById(id)`, `createCoinPackage(data)`, `updateCoinPackage(id, data)`, `deleteCoinPackage(id)`.
- **Wallet topups**: `createWalletTopup({userId, coinPackageId, packageName, amountPaise, coinsGranted, razorpayOrderId})`, `getWalletTopupByOrderId(orderId)`, `getWalletTopupsForUser(userId, {limit=100})`, `getAllWalletTopups({userIds, status, limit=500})` (admin view, `.in('user_id', ids)` scoping — same technique already used for `files_expiry` bulk ops), `markWalletTopupFailed(orderId, reason)`.
- **Usage history**: `getUsageHistoryForUser(userId, {limit=100})`, `getAllUsageHistory({userIds, toolSlug, limit=500})`. Add `getUsageHistoryGroupedByFeature({userIds, from, to})` — powers the Customer Dashboard tools/features usage report (§ Customer Dashboard above); groups `tools_usage_history` by `tool_slug, feature_api_identifier`, sums `coins_cost`, counts distinct `user_id`.
- **Atomic RPC wrappers** (the crux):
  ```js
  export async function deductWalletCoins({ userId, amount, toolId, toolSlug, featureId, featureApiIdentifier, featureTitle, idempotencyKey = null }) {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('deduct_wallet_coins', {
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

Unchanged from the original draft — independent from the old subscription code (per decision #1 — don't touch/import it). Reuses existing env vars (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET` — already in `.env.example`, no new ones needed):

- `isConfigured()` — checks key envs are set.
- `createOrder({ amountPaise, currency='INR', notes, receipt })` — `POST /v1/orders` via the same raw-fetch + Basic-auth pattern as the old `razorpay()` helper in `app/api/admin/subscription/route.js` (replicate the pattern, don't import it).
- `verifyPaymentSignature({ orderId, paymentId, signature })` — standard Razorpay Checkout HMAC formula: `hmac_sha256(orderId + '|' + paymentId, key_secret) === signature`.
- `verifyWebhookSignature({ rawBody, signature })` — same raw-body HMAC pattern as the existing `app/api/admin/subscription/webhook/route.js` (replicated, not shared).

---

## 4. `data/tools.js` + `lib/tools.js` changes

Each tool's `features[]` items gain 4 fields — `id`, `apiIdentifier`, `coinCost`, `isActive` — alongside the existing `icon`/`title`/`desc`. Apply to all tools' static seed data: the 5 real embedded apps (`pdf-cropper`, `bg-remover`, `profit-loss`, `program`, `link-generator` — identified by having a `toolUrl`) get real `apiIdentifier`/`coinCost`/`isActive:true` per feature (e.g. PDF Cropper's "Batch Processing" feature → `apiIdentifier: 'crop-batch', coinCost: 5`); the remaining marketing-only tools default to `isActive:false, coinCost:0, apiIdentifier:null`.

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

**Once this lands**: `components/admin/plan/CoinsUsageTable.jsx` (currently reading static `data/coinsUsageRates.js`) should read live `coinCost` per feature instead — it's already the exact right shape (`productName` → tool title, `variants[]` → features), just pointed at the wrong source.

---

## 5. API routes

**User-facing — `app/api/wallet/*`** (outside `/api/admin`, so `proxy.js` only stamps CORS headers and leaves auth to the route via `getAuthPayload(req)` — this is what lets the external tool apps call in cross-origin with their Bearer token):

| Route | Method | Response |
|---|---|---|
| `app/api/wallet/packages/route.js` | GET | active `coin_packages` list |
| `app/api/wallet/topup/order/route.js` | POST `{coinPackageId}` | creates `wallet_topups` row + Razorpay order → `{orderId, amountPaise, keyId, packageName, coins}` |
| `app/api/wallet/topup/verify/route.js` | POST `{razorpayOrderId, razorpayPaymentId, razorpaySignature}` | verifies ownership + signature → `creditWalletTopup()` |
| `app/api/wallet/webhook/route.js` | POST (Razorpay calls this, no user auth) | HMAC-verifies raw body, on `payment.captured`/`order.paid` → `creditWalletTopup()` (idempotent safety net if the client-verify call never lands) |
| `app/api/wallet/history/usage/route.js` | GET `?limit=` | own `tools_usage_history` |
| `app/api/wallet/history/topups/route.js` | GET `?limit=` | own `wallet_topups` |
| **`app/api/wallet/deduct/route.js`** | **POST** | see §7 — the endpoint external tool apps integrate against |

Balance itself needs no new endpoint — `GET /api/auth/me` already returns `walletCreditsTotal/walletCreditsUsed/walletCreditsRemaining` via `lib/profile.js`'s `serializeProfile()`; `UserWalletPanel.jsx` already reuses it and keeps doing so.

**Admin — `app/api/admin/*`**:
- `app/api/admin/coin-packages/route.js` (GET via `getStaffFromRequest`, POST via `getAdminFromRequest`) + `[id]/route.js` (GET/PUT/DELETE, `getAdminFromRequest`) — mirrors `app/api/admin/tools/[id]/route.js` exactly.
- `app/api/admin/usage-history/route.js` (GET, `getStaffFromRequest`, `?userId=&toolSlug=&limit=`) — company-scoped for `admin` role via `getAllUsers({companyId})` → ids → `getAllUsageHistory({userIds})`, same scoping already used for the Users list. Add `?groupBy=feature` to serve the Customer Dashboard tools/features report via `getUsageHistoryGroupedByFeature()`.
- `app/api/admin/payment-history/route.js` (GET, `getStaffFromRequest`, same scoping) — lists `wallet_topups`.

---

## 6. Admin UI

**Already built this session** (see Implementation Status table) — wire these to the routes above instead of rebuilding them:
- `app/settings/plan/page.js` (`CoinPlansTable` + `CoinsUsageTable`) — `CoinPlansTable`'s "ADD COINS" button currently just toasts; wire it to `POST /api/wallet/topup/order` → Razorpay Checkout.js (`<Script strategy="lazyOnload">`, same mechanism already used in `app/layout.js`) → `POST /api/wallet/topup/verify` on success. Swap `data/coinPlans.js` for `GET /api/wallet/packages`; swap `data/coinsUsageRates.js` for live tool `coinCost` per §4.
- `app/settings/wallet/page.js` (admin, cross-user) — swap `data/walletBalances.js`/`data/walletHistory.js` for `GET /api/admin/usage-history` + `GET /api/admin/payment-history` (merge into one ledger client-side, or add a combined endpoint if that gets awkward). The filter/search/export UI is already done via the shared `DataTable` — no rebuild needed.
- `components/admin/wallet/UserWalletPanel.jsx` (Profile → Wallet tab) — swap `data/myWalletHistory.js` for `GET /api/wallet/history/usage` + `GET /api/wallet/history/topups`.
- `components/admin/coin-use/CoinUsagePanel.jsx` (Profile → Coin Use tab, `user` role) — swap `data/coinUsage.js` for `GET /api/wallet/history/usage` grouped by tool + a real time-range param.

**Still to build, net-new:**
1. **`app/settings/coin-packages/page.js`** + `CoinPackagesClient.jsx` — CRUD grid/table for buy packs (name, coins, price, badge, active). Calls `/api/admin/coin-packages*`. Use the shared `components/admin/data-table/DataTable` for the list.
2. **Tools/features coins-usage report** — new component on `/settings/customer-dashboard`, per the "Customer Dashboard — clarified scope" section above. Built on the shared `DataTable` (dateKey + export already included).
3. **Feature-pricing sub-editor bolted onto `app/settings/tools-catalog/ToolsAdminClient.jsx`**: a repeatable "Features & Pricing" section in the existing form modal — reuse the file's existing `ICON_OPTIONS`/`autoSlug()` helpers, add `coinCost` number input and `isActive` toggle (matching the existing switch markup already in that file) per row. Submits as part of the same `features` field in the existing PUT/POST body — `updateTool()`'s content-merge logic already handles partial updates correctly, so no new API route is needed here.

**Required fix — `lib/permissions.js`'s `isPathAllowed`** (still unfixed, currently a raw prefix match):
```js
// before:
return getAllowedHrefsForRole(role).some((href) => href !== '/settings' && pathname.startsWith(href))
// after:
return getAllowedHrefsForRole(role).some(
  (href) => href !== '/settings' && (pathname === href || pathname.startsWith(href + '/'))
)
```

**`components/admin/navIcons.js`**: `CreditCard` and `Wallet` are already imported and mapped (added this session for the `plan` and `wallet` nav entries). Still need `History` and `Receipt` for the two new pages above (`Wrench` already exists for `tools-catalog`, still unused in nav — see below).

**`lib/permissions.js` `NAV_CONFIG`** — current live state has `plan` (ACCOUNT, all roles), `customer-dashboard` (COMPANIES & USERS, master_admin/admin), and `wallet` (new BILLING & WALLET group, master_admin/admin). Still needed in the `BILLING & WALLET` group:
```js
{
  label: 'BILLING & WALLET',
  items: [
    { key: 'tools-catalog',  label: 'Tools Catalog',   href: '/settings/tools-catalog',  icon: 'Wrench',  roles: ['master_admin'] }, // currently orphaned — no nav entry today
    { key: 'coin-packages',  label: 'Coin Packages',   href: '/settings/coin-packages',  icon: 'CreditCard', roles: ['master_admin'], quickAction: true },
    { key: 'wallet',         label: 'Wallet',          href: '/settings/wallet',         icon: 'Wallet',  roles: ['master_admin', 'admin'] }, // already live
  ],
},
```
`usage-history`/`payment-history` don't need their own nav entries or pages — that content now lives inside the already-built `/settings/wallet` (payment side) and the Customer Dashboard tools/features report (usage side), per the clarified scope above. Don't rebuild them as separate pages.

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
{ "ok": true, "usageId": "uuid", "coinsCost": 5, "remainingCoins": 395, "duplicate": false }
```

**Errors**: `401` unauthorized · `400` missing fields · `404` tool not found · `404` feature not found or `isActive:false` · `402 {error:'insufficient_coins', remainingCoins, requiredCoins}` · `500` unexpected.

Implementation: `getToolFeature(toolSlug, featureApiIdentifier)` → validate existence/active → `deductWalletCoins({userId: payload.userId, amount: feature.coinCost, toolId: tool.id, toolSlug, featureId: feature.id, featureApiIdentifier, featureTitle: feature.title, idempotencyKey})` → map the RPC's `error` field to the status codes above.

`idempotencyKey` is optional — supplying it makes retried calls (e.g. a client retry after a timeout) safe from double-charging via the `UNIQUE(user_id, idempotency_key)` constraint + the compensating-transaction branch in `deduct_wallet_coins`.

---

## Next steps, in order

1. Run `scripts/wallet_system_migration.sql` (§1, coin-named tables/functions) in the Supabase SQL Editor.
2. `lib/db.js` additions (§2) + `lib/razorpay.js` (§3).
3. Enrich `data/tools.js` features with `apiIdentifier`/`coinCost`/`isActive` (§4) — nothing downstream works without real pricing data.
4. Build the API routes (§5), then `POST /api/wallet/deduct` (§7) last, since it depends on everything above.
5. Rewire the five already-built pages from dummy data to these routes (§6, "Already built this session" list) — this is where most of this session's UI work starts paying off.
6. Build the two net-new pieces (§6, "Still to build"): coin-packages CRUD, and the Customer Dashboard tools/features usage report.
7. Fix `isPathAllowed` (§6) — cheap, do it whenever convenient, but don't ship `coin-packages` to nav before it, since that's exactly the prefix-collision shape the bug bites on.

## Verification

1. `npm run dev` — confirm `/settings/tools-catalog`, `/settings/coin-packages`, `/settings/wallet` all appear correctly in the sidebar per role (master_admin sees everything; admin sees wallet but not coin-packages/tools-catalog; `user` sees neither — reaches their own balance via the Profile page's Wallet tab instead, by design).
2. Create a coin package via the new admin UI; edit a tool's features in `tools-catalog` to set a `coinCost` on one feature.
3. On `/settings/plan`, buy that package with a Razorpay test-mode card; confirm `wallet_topups` transitions `created → paid` and `users.wallet_credits_total` increments by the right amount, and the change shows up on the Profile → Wallet tab.
4. Call `POST /api/wallet/deduct` with a valid Bearer token for that user (curl/Postman) using the tool slug + `apiIdentifier` just priced; confirm `wallet_credits_used` increments, a `tools_usage_history` row appears, and the response's `remainingCoins` is correct.
5. Set the user's remaining balance below the feature's cost and call `deduct` again — confirm a clean `402 insufficient_coins` with no partial state change.
6. Call `deduct` twice with the same `idempotencyKey` — confirm only one deduction happens and the second call returns `duplicate: true` with the same `usageId`.
7. Confirm `/settings/wallet` (admin) and the new Customer Dashboard tools/features report show the rows from steps 3–6, and that a company-scoped `admin` only sees their own company's users' rows.
8. Confirm `admin`-role navigation to `/settings/tools-catalog` or `/settings/coin-packages` directly by URL 404s for `admin` (verifies the `isPathAllowed` fix once done).
