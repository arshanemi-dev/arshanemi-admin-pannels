# Cross-App Tool Billing Gate (Fix-Fee + Coin-Wallet)

## Context

The admin panel (this repo) already has a complete Coin-Wallet Billing System: coin packages, Razorpay top-ups, per-feature coin costs, usage history, coin expiry tracking, and payment reconciliation. What's never existed is the other half — the actual satellite tool apps (separate repos: Link Generator, PDF Cropper, Background Remover) don't check any of this. A user could open any of them and use every feature for free, regardless of whether the admin granted them access, regardless of coin balance.

This plan wires that gate in. It also introduces one genuinely new concept: a **"Fix Fee"** — a one-time flat ₹ price to unlock a specific *feature* (not a whole tool), distinct from that feature's existing per-use coin cost. This was a placeholder in an old dummy-data column (`fixFees`, hardcoded to `0`) and has never been backed by real schema or logic.

Confirmed decisions (asked directly, all recommended options accepted):
- **Fee payment tracking reuses the existing `wallet_topups` table** via a `purchase_type` discriminator — **no new table**. Keeps the full Razorpay order/payment audit trail and reuses the exact webhook/reconciliation code already built for coins, at the cost of a couple of relaxed CHECK constraints.
- **The fee is a property of the FEATURE, not the tool** — stored directly on each feature object in `data/tools.js`'s `features[]` (alongside the existing `coinCost`), not as a tool-level column. A single tool can have some fee-gated features and some free ones.
- **Link Generator's tool content will be rewritten** — its seeded marketing copy describes a URL-shortener, but the real app (`arshanemi-tools-1`) is a cloud file browser that generates/copies shareable URLs for already-uploaded files. Features/copy will be corrected to match reality; the slug/title/toolUrl stay unchanged (renaming would break existing `tools_access` grants and usage history).
- **Background Remover's coin/fee gate applies only to the 3 paid server tiers** (`medium`/`advanced`/`pro`) — the `normal` tier runs free, client-side, and never calls a server API, so it stays ungated.
- **Batch actions charge a flat fee per action**, not scaled per file/item — matches how `/api/wallet/deduct` already works (a flat, server-controlled `coinCost`, no quantity parameter). No changes needed to the deduct contract's shape.
- **Fix fees default to ₹0 (no paywall) for every feature** — the mechanism ships fully working with every gate open; an admin turns individual features' fees on later via the existing per-feature Tools Catalog editor.

Only 3 tools exist in `data/tools.js` now (confirmed by direct read): `pdf-cropper`, `bg-remover`, `link-generator`. `defaultToolsAccessByRole` derives from this list automatically.

**Security note driving §3 below**: the gate logic in the tool apps is client-side UX, not the actual enforcement. `POST /api/wallet/deduct` must be the one place that authoritatively checks "has this feature's fee been paid" *and* "does this user have enough unexpired coins" — otherwise the fee/coin gate is exactly the kind of insecure, trivially-bypassable client-only check already found (and being removed) in `tools-2`'s existing `pdf-tool-premium` flag.

---

## 1. Schema — new migration `scripts/tool_fee_migration.sql`

Run **after** `wallet_system_migration.sql` / `coin_expiry_migration.sql` / `payment_reconciliation_migration.sql`. Same style as those (header comment, `IF NOT EXISTS`/`OR REPLACE`/guarded `ADD CONSTRAINT`, safe to re-run).

**No new table, no `tools` column.** The fee amount lives in `data/tools.js`'s `features[]` JSONB (already flows through `tools.content` — no schema change needed for the price itself). Only `wallet_topups` needs to grow, to also represent a fee purchase alongside a coin purchase:

```sql
ALTER TABLE wallet_topups
  ADD COLUMN IF NOT EXISTS purchase_type VARCHAR(20) NOT NULL DEFAULT 'coin_topup',
  ADD COLUMN IF NOT EXISTS tool_slug VARCHAR(255),
  ADD COLUMN IF NOT EXISTS feature_api_identifier VARCHAR(255);
-- coin_package_id/package_name/coins_granted/validity_days/expires_at all
-- already exist; package_name is reused as-is for fee rows (holds the
-- feature's title as a human-readable snapshot label — same purpose it
-- already serves for coin packages).

ALTER TABLE wallet_topups DROP CONSTRAINT IF EXISTS wallet_topups_purchase_type_check;
ALTER TABLE wallet_topups ADD CONSTRAINT wallet_topups_purchase_type_check
  CHECK (purchase_type IN ('coin_topup', 'tool_fee'));

-- coins_granted must be >0 for a coin topup, exactly 0 for a fee purchase
ALTER TABLE wallet_topups DROP CONSTRAINT IF EXISTS wallet_topups_coins_granted_check;
ALTER TABLE wallet_topups ADD CONSTRAINT wallet_topups_coins_granted_check CHECK (
  (purchase_type = 'coin_topup' AND coins_granted > 0) OR
  (purchase_type = 'tool_fee' AND coins_granted = 0)
);

-- validity_days is coin-topup-only concept now — make it optional
ALTER TABLE wallet_topups ALTER COLUMN validity_days DROP NOT NULL;
ALTER TABLE wallet_topups DROP CONSTRAINT IF EXISTS wallet_topups_validity_days_check;
ALTER TABLE wallet_topups ADD CONSTRAINT wallet_topups_validity_days_check
  CHECK (validity_days IS NULL OR validity_days > 0);

CREATE INDEX IF NOT EXISTS idx_wallet_topups_purchase_type ON wallet_topups(purchase_type);

-- At most one PAID fee purchase per (user, tool, feature). Coin-topup rows
-- have NULL tool_slug/feature_api_identifier and this index is scoped to
-- purchase_type='tool_fee' anyway, so they never interact with it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_topups_paid_feature_fee
  ON wallet_topups(user_id, tool_slug, feature_api_identifier)
  WHERE purchase_type = 'tool_fee' AND status = 'paid';
```

**`credit_wallet_topup` — re-defined (`CREATE OR REPLACE`, same existing function, no new one) to branch on `purchase_type`:**
```sql
UPDATE wallet_topups
SET status = 'paid', razorpay_payment_id = p_razorpay_payment_id,
    razorpay_signature = p_razorpay_signature, credited_at = NOW(), updated_at = NOW(),
    expires_at = CASE WHEN purchase_type = 'coin_topup'
                       THEN NOW() + (validity_days || ' days')::interval
                       ELSE NULL END          -- fee unlocks never expire
WHERE razorpay_order_id = p_razorpay_order_id AND status = 'created'
RETURNING * INTO v_topup;
...
IF v_topup.purchase_type = 'coin_topup' THEN
  UPDATE users SET wallet_credits_total = wallet_credits_total + v_topup.coins_granted, updated_at = NOW()
  WHERE id = v_topup.user_id RETURNING wallet_credits_total INTO v_total;
END IF;
-- (rest of the function unchanged: duplicate/not-found/not-payable branches)
```
Forcing `expires_at = NULL` for fee rows is what keeps them invisible to `getLatestWalletExpiry()` and the new expiry check below (both already filter on `expires_at IS NOT NULL` / use `MAX()`, which ignores NULLs) — **no changes needed to either of those beyond what's already planned**, this falls out for free.

**Expiry enforcement — extend `deduct_wallet_coins`** (same file, `CREATE OR REPLACE`): insert right after the idempotency short-circuit, before the guarded balance `UPDATE`:
```sql
SELECT MAX(expires_at) INTO v_latest_expiry FROM wallet_topups WHERE user_id = p_user_id AND status = 'paid';
IF v_latest_expiry IS NOT NULL AND v_latest_expiry < NOW() THEN
  RETURN jsonb_build_object('ok', false, 'error', 'coins_expired', 'expiredAt', v_latest_expiry);
END IF;
```
If the user has never completed a paid coin top-up, `v_latest_expiry` is NULL and the check is skipped (no fabricated expiry) — matches the existing aggregate-not-batch simplification already documented for coin expiry.

---

## 2. `lib/db.js` additions

- `createWalletTopup(...)` — extend the existing function's params: add `validityDays = null`, `purchaseType = 'coin_topup'`, `toolSlug = null`, `featureApiIdentifier = null` (all optional, existing coin-topup callers need zero changes). Insert the new columns.
- `topupRowToItem` — add `purchaseType: row.purchase_type`, `toolSlug: row.tool_slug`, `featureApiIdentifier: row.feature_api_identifier`.
- New: `getPaidFeatureFeeKeys(userId, toolSlugs)` — one query (`purchase_type='tool_fee' AND status='paid' AND user_id=? AND tool_slug IN (...)`), returns a `Set` of `` `${toolSlug}::${featureApiIdentifier}` `` for O(1) lookups when enriching `/api/tools/my`'s response.
- New: `hasUserPaidFeatureFee(userId, toolSlug, featureApiIdentifier)` — single-key existence check, used server-side by `/api/wallet/deduct` (the authoritative check — see security note above).
- `getStalePendingTopups`, `getAllWalletTopups`, `getWalletTopupsForUser`, `markWalletTopupFailed`, `creditWalletTopup` — **no changes needed**, they already operate generically on `wallet_topups` rows regardless of `purchase_type`. This is what buying the "reuse the table" design gets for free: reconciliation, the webhook, and both wallet ledgers (admin + personal) automatically include fee purchases with zero new code.

## 3. Admin-panel API surface

**Extend `GET /api/tools/my`** (`app/api/tools/my/route.js`) — enrich each feature, not the tool itself:
```js
const paidKeys = await getPaidFeatureFeeKeys(payload.userId, tools.map(t => t.slug))
const enriched = tools.map(t => ({
  ...t,
  features: (t.features || []).map(f => ({
    ...f,
    fixFeePaise: f.fixFeePaise ?? 0,
    feePaid: !f.fixFeePaise || paidKeys.has(`${t.slug}::${f.apiIdentifier}`),
  })),
}))
```

**New `POST /api/wallet/tool-fee/order`** — body `{toolSlug, featureApiIdentifier}`:
1. `getAuthPayload` → 401. `isConfigured()` → 503.
2. `getToolFeature(toolSlug, featureApiIdentifier)` (existing `lib/tools.js` helper, already used by `/api/wallet/deduct`) → 404 if tool/feature missing; `feature.fixFeePaise <= 0` → 400 `no_fee_configured` (defensive).
3. `hasUserPaidFeatureFee(...)` → if already paid, `200 {ok:true, alreadyPaid:true, toolSlug, featureApiIdentifier}` (not an error).
4. `createOrder({amountPaise: feature.fixFeePaise, notes:{userId, toolSlug, featureApiIdentifier}, receipt: 'fee_'+userId.slice(0,8)+'_'+Date.now()})` (existing `lib/razorpay.js`).
5. `createWalletTopup({userId, packageName: feature.title, amountPaise: feature.fixFeePaise, coinsGranted: 0, razorpayOrderId: order.id, purchaseType: 'tool_fee', toolSlug, featureApiIdentifier, coinPackageId: null, validityDays: null})`.
6. Response: `{orderId, amountPaise, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, featureTitle: feature.title, toolSlug, featureApiIdentifier}` — same shape family as `/api/wallet/topup/order`.

**New `POST /api/wallet/tool-fee/verify`** — body `{razorpayOrderId, razorpayPaymentId, razorpaySignature}`. Structurally identical to `/api/wallet/topup/verify`: look up by order id, check ownership, `verifyPaymentSignature` (reuse as-is), call **the existing** `creditWalletTopup()` RPC wrapper directly — no new RPC needed, `credit_wallet_topup` already branches on `purchase_type` per §1.

**Webhook, reconciliation, both wallet ledgers — no changes needed.** They already key off `wallet_topups` generically; fee purchases ride along automatically once §1/§2 land.

**`/api/wallet/deduct` — add the server-side fee-paid check** (the actual enforcement point, per the security note above):
```js
if (feature.fixFeePaise > 0) {
  const paid = await hasUserPaidFeatureFee(payload.userId, toolSlug, featureApiIdentifier)
  if (!paid) return NextResponse.json({ error: 'fee_required', fixFeePaise: feature.fixFeePaise }, { status: 402 })
}
```
Placed right after the existing `feature.isActive` check, before calling `deductWalletCoins`. Also map the new `coins_expired` RPC error (§1) alongside the existing `insufficient_coins` branch:
```js
if (result.error === 'coins_expired') {
  return NextResponse.json({ error: 'coins_expired', expiredAt: result.expiredAt }, { status: 402 })
}
```

## 4. Admin UI — Tools Catalog per-feature "Fixed Fee" field

`app/settings/tools-catalog/ToolsAdminClient.jsx` already has a per-feature "Features & Pricing" repeatable editor (built earlier this session: title/icon/desc/API identifier/coin cost/active per row). Add **one more field to each feature row**: "Fixed Fee (₹)", converting rupees↔paise the same way `CoinPackagesClient.jsx`'s `priceRupees`/`pricePaise` already does. Defaults to 0. This is the only way an admin turns a specific feature's paywall on — no tool-level field needed.

## 5. Content fix — `data/tools.js`'s `link-generator` entry

Rewrite `shortDesc`, `hero`, `stats`, `steps`, `advantages`, `faqs`, and `features[]` to describe the real product: a cloud file manager (Dropbox-backed) that lets a user browse uploaded files/folders and copy shareable URLs (single or batch), with Excel/JSON export of link lists (matches `arshanemi-tools-1`'s actual `CopyUrlsModal.jsx`/`lib/groupLinks.js` behavior). Keep `slug: 'link-generator'`, `title`, `toolUrl`, `category`, `badge` unchanged (renaming breaks existing `tools_access` grants/usage history). New feature set (shape unchanged: `id`/`icon`/`title`/`desc`/`apiIdentifier`/`coinCost`/`isActive`, now also `fixFeePaise`, defaulting to 0):
- Browse & Upload Files (free — core navigation)
- Copy File URL — single-file copy (`link-copy`, reuse this existing identifier, low coin cost)
- Batch Copy URLs — multi-file selection copy (`link-batch-copy`, new identifier)
- Export Links to Excel (`link-export-excel`, new identifier)
- Export Links to JSON (`link-export-json`, new identifier)
- Folder Organization (free or low cost)

(Exact copy/costs/which-features-get-a-fee are content-writing/business details for implementation or admin-configuration time, not structural decisions — the important part is the `apiIdentifier`s match what gets wired into `FileExplorer.jsx` in §7.)

## 6. Per-tool-app service module — `lib/toolBilling.js` (new file, same name in all 3 repos)

Exports: `getMyTool(toolSlug)`, `createFeeOrder({toolSlug, featureApiIdentifier})`, `verifyFeePayment({...})`, `deductFeatureCoins({toolSlug, featureApiIdentifier, idempotencyKey})`, and `runBillingGate({toolSlug, featureApiIdentifier})` (the waterfall — see §7). One function, one file, one import per call site in every repo.

**Auth transport — build on each app's existing primitives, don't build a shared refresh system:**
- **tools-1**: use `authFetch` from the existing `@/lib/tokenStore` directly (not `lib/adminData.js`'s `apiFetch`, which swallows status codes the gate needs to branch on — 401/402/404/200). `authFetch` already retries once on 401 via its existing refresh flow.
- **tools-2 / tools-3** (thinner auth, no refresh logic): add one small `adminFetch(path, options)` helper *inside* `lib/toolBilling.js` — reads `lt_auth_token` from `localStorage`, calls `${NEXT_PUBLIC_ADMIN_URL}${path}` with a Bearer header; on 401, clears `lt_auth_token`/`lt_auth_user` and dispatches a `window` CustomEvent `billing:auth-expired` (mirrors tools-1's existing `auth:require`/`auth:success` convention). Requires one small addition to each repo's `components/layout/AppShell.jsx`: a listener that flips `authed` back to `false` on that event — same shape as its existing state machine, nothing structurally new.

## 7. The gate — waterfall logic + call sites

```js
async function runBillingGate({ toolSlug, featureApiIdentifier }) {
  if (process.env.NEXT_PUBLIC_IS_CONNECT !== 'true') return { status: 'proceed' } // local mode: zero network calls, unchanged behavior

  const myTool = await getMyTool(toolSlug)
  if (!myTool) return { status: 'blocked', reason: 'access_denied' }

  const feature = myTool.features?.find(f => f.apiIdentifier === featureApiIdentifier)
  if (!feature || !feature.isActive) return { status: 'blocked', reason: 'feature_unavailable' }

  if (feature.fixFeePaise > 0 && !feature.feePaid) {
    return { status: 'blocked', reason: 'fee_required', data: { toolSlug, featureApiIdentifier, featureTitle: feature.title, fixFeePaise: feature.fixFeePaise } }
  }

  if (!feature.coinCost) return { status: 'proceed' } // free feature — never call deduct with amount 0

  const result = await deductFeatureCoins({ toolSlug, featureApiIdentifier, idempotencyKey: crypto.randomUUID() })
  if (result.ok) return { status: 'proceed', data: { usageId: result.usageId, remainingCoins: result.remainingCoins } }
  if (result.error === 'insufficient_coins') return { status: 'blocked', reason: 'insufficient_coins', data: { remainingCoins: result.remainingCoins, requiredCoins: feature.coinCost } }
  if (result.error === 'coins_expired')      return { status: 'blocked', reason: 'coins_expired', data: { expiredAt: result.expiredAt } }
  if (result.error === 'fee_required')       return { status: 'blocked', reason: 'fee_required', data: { toolSlug, featureApiIdentifier, featureTitle: feature.title, fixFeePaise: result.fixFeePaise } } // defense-in-depth: client thought it was paid, server disagreed
  return { status: 'blocked', reason: 'error', data: { message: result.error } }
}
```
Note gate order: access → feature-exists → **fee** → **coin cost**, both fee and coin now checked per-feature (not per-tool), matching §0's confirmed scope. The `fee_required` branch inside the deduct-error handling is a defensive re-check in case client and server state ever disagree (e.g. a stale cached `getMyTool()` response) — the client-side check is UX, `/api/wallet/deduct`'s own check (§3) is truth.

**Call-site pattern** — re-invoke the whole handler after a modal resolves (not split gate/work halves), since "Pay to Unlock" only clears the fee gate; the coin-cost gate still needs to run right after:
```js
async function handleCopyUrls(items) {
  if (!items.length) return
  const gate = await runBillingGate({ toolSlug: 'link-generator', featureApiIdentifier: 'link-copy' })
  if (gate.status === 'blocked') { openBillingModal(gate.reason, gate.data, () => handleCopyUrls(items)); return }
  // ...existing body, unchanged
}
```

Exact insertion points (first statement after any trivial empty-input guard, before real work):
- **tools-1**: `handleCopyUrls` and `handleInlineCopyExcel` in `components/files/FileExplorer.jsx` (~lines 628, 649).
- **tools-2**: `handleProcess` in `app/pdf-tool/page.js` (~line 78). Also **delete** the existing insecure `localStorage.getItem('pdf-tool-premium')` read (line ~54) and the `premium` prop threading into `components/pdf-tool/SortOptions.jsx` — replace with the real gate result on the relevant feature. Its locked/badge visual style is the template to keep, just driven by real data now.
- **tools-3**: `handleProcessImage` in `components/bg-remover/BgRemoverTool.jsx` (~line 157) — gate only the branch that calls `processImageViaProvider`/`runServerTierQueue` (tiers `medium`/`advanced`/`pro`); the `normal` (client-side `worker.postMessage`) branch stays ungated per the confirmed decision. New `apiIdentifier`s needed per tier (existing `bg-remove-*` identifiers key off feature type, not tier — mint `bg-remove-medium`/`bg-remove-advanced`/`bg-remove-pro` instead, replacing the tier-irrelevant existing set for this tool in `data/tools.js`).

## 8. UI — reuse each app's existing `Modal.jsx`, add one orchestrator + 3 content components

New `components/billing/` folder in each repo:
- `AccessUnauthorizedModal.jsx` — "You don't have access to {toolTitle}." Close only, no retry.
- `PayToUnlockModal.jsx` — shows `featureTitle` + `₹{fixFeePaise/100}`; "Pay to Unlock" → `createFeeOrder` → `window.Razorpay({...})` (mirror `components/admin/plan/CoinPlansTable.jsx`'s exact pattern from the admin panel: `key/amount/order_id/handler`) → on success, `verifyFeePayment` → call the passed-in retry callback. Requires `<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />` added once per tool app (none currently load it).
- `InsufficientCoinsModal.jsx` — handles both `insufficient_coins` and `coins_expired` (same shell, different copy). CTA opens `${NEXT_PUBLIC_ADMIN_URL}/plan` in a new tab (`target="_blank" rel="noopener noreferrer"`, matching the existing convention in `tools-2/components/layout/Header.jsx`) — **`/plan`, not `/settings/plan`**, since the tool app only holds a Bearer token, not an admin-panel-origin cookie session that `/settings/plan` would require.
- `BillingGateModal.jsx` — orchestrator, `{reason, data, onClose, onRetry}` → renders the right one of the three above. Each call site only needs one `{reason, data} | null` state slot and one mounted `<BillingGateModal>`.

**Optional follow-up, not blocking**: `UserWalletPanel.jsx`/admin Wallet page's transaction rows will now include `tool_fee` purchases automatically (they already read generically from `wallet_topups`) — their "Coins" column will show `+0` for a fee row, which is accurate but reads a little oddly next to `package_name` (the feature title). Worth a small copy tweak later (e.g. render "Feature Unlock" as the row's type label instead of "Top-up" when `purchaseType === 'tool_fee'`); not required for the gate itself to work correctly.

## Build order

1. Admin panel: run `scripts/tool_fee_migration.sql`, then §2–§4 (data layer, API routes, Tools Catalog field).
2. Verify with curl/Postman before touching any tool repo: set a test feature's fee via the admin UI, confirm `/api/tools/my` returns `fixFeePaise`/`feePaid` per feature correctly; run a full Razorpay test-mode order→verify cycle against the new `/api/wallet/tool-fee/*` routes; confirm `/api/wallet/deduct` returns `402 fee_required` for an unpaid fee-gated feature even if called directly (bypassing the client gate); backdate a `wallet_topups.expires_at` row and confirm `/api/wallet/deduct` returns `402 coins_expired`.
3. Rewrite `link-generator`'s content (§5).
4. Wire tools-1 (Link Generator) fully end-to-end first — most mature existing auth stack, validates the gate design itself in isolation. Set `NEXT_PUBLIC_IS_CONNECT=true`, `NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3000` locally; add `http://localhost:3001` to the admin panel's `ALLOWED_ORIGINS` for this pass. Walk every branch manually: no access → fee unpaid → pay-to-unlock success → insufficient coins → expired coins → success.
5. Replicate to tools-2 (adminFetch/billing:auth-expired addition, remove the insecure `premium` flag).
6. Replicate to tools-3 (tier-scoped gating, new per-tier apiIdentifiers).
7. Final pass: add each tool's real production origin to `ALLOWED_ORIGINS` on the deployed admin panel; confirm CORS end-to-end against deployed origins, not just localhost.

## Verification

- SQL: migration applies cleanly and re-applies without error (idempotent).
- `curl` against `/api/tools/my`, `/api/wallet/tool-fee/order`, `/api/wallet/tool-fee/verify`, `/api/wallet/deduct` with a real JWT — confirm exact response shapes match §3, including the new `fee_required`/`coins_expired` error branches.
- Confirm the existing admin Wallet ledger and Profile → Wallet tab still render correctly with a mix of `coin_topup` and `tool_fee` rows present (no crash, reasonable display even before the optional copy tweak in §8).
- Manual browser walk-through of all gates in tools-1 first (per build-order step 4), then tools-2, then tools-3, in each app's dev server with `NEXT_PUBLIC_IS_CONNECT=true`.
- Confirm `NEXT_PUBLIC_IS_CONNECT=false` in any tool app results in zero behavior change (no network calls to the admin panel, features work exactly as before this change).
- Confirm a Razorpay test-mode fee payment actually flips `feePaid` to `true` on the next `/api/tools/my` call, and that closing the browser mid-payment gets resolved by the existing reconciliation sweep within a few minutes (no new reconciliation code needed — verify this is really true, not just assumed).
