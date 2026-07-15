# Coin-Wallet Billing System (Razorpay)

## Implementation Status (living section — update this first, every session)

**Payment reconciliation added — pending top-ups no longer rely solely on the client-verify call + webhook.** Direct instruction was a `setInterval`-based retry loop; built instead as a stateless reconciliation sweep, since a `setInterval` inside a Next.js API route has no guarantee of surviving past that one request/serverless-instance (explained to the user, who agreed to the alternative before this was built).
- **`lib/paymentReconciliation.js`** — `reconcilePendingTopups({ userId? })`: finds `wallet_topups` stuck in `status='created'` for 20+ seconds (gives the normal paths a fair head start) with `reconcile_attempts < 3`, calls Razorpay's **Fetch Payments for an Order** API (`lib/razorpay.js`'s new `fetchOrderPayments()`) directly — authoritative, no signature to verify since it's our own secret-key-authenticated call, not client-supplied data. `captured` found → credits via the existing `credit_wallet_topup` RPC (`razorpaySignature: null`). Not resolved and `attempts + 1 >= 3` → `markWalletTopupFailed()`. Otherwise → bumps `reconcile_attempts` and leaves it pending for the next sweep. A Razorpay-side error (rate limit, network) does **not** burn an attempt — left untouched for a fair retry.
- **Schema**: `wallet_topups.reconcile_attempts INTEGER DEFAULT 0`. Base `wallet_system_migration.sql` updated for fresh installs; **`scripts/payment_reconciliation_migration.sql` is what needs to actually run against the live database** (same already-migrated-DB pattern as the coin-expiry and coin-packages-unique-index fixes earlier this session).
- **Three trigger points**, matching what was asked:
  1. **Post-login, user-scoped** — `app/login/page.js` and `app/settings/login/page.js` both fire-and-forget `POST /api/wallet/reconcile` right after `saveAuthTokens()`. Resolves anything this specific user left stuck from a previous session.
  2. **Client-side bounded polling** — `UserWalletPanel.jsx` (Profile → Wallet tab): if the loaded transaction list still shows a `pending` top-up, calls the same endpoint every 10s, capped at 3 attempts per tab-visit (a `useRef` counter, resets on remount — i.e., leaving and returning to the tab). This is the one place a "poll every 10s, retry 3 times" timer is actually safe — it's ordinary client React state tied to a component's lifecycle, not backend process memory.
  3. **Platform-wide cron sweep** — `app/api/cron/reconcile-topups/route.js`, secret-protected (`CRON_SECRET`, checked against `Authorization: Bearer <secret>` — this is also the exact header Vercel Cron sends automatically when that env var is set on the project). `vercel.json` wires it to run every 5 minutes. **Caveat the user should know**: Vercel's Hobby plan only permits daily cron jobs, not every-5-minutes — the `*/5 * * * *` schedule needs a Pro plan, or the schedule adjusted, or an external scheduler (cron-job.org, GitHub Actions, etc.) hitting the same secret-protected URL instead.
- **Not built**: per-batch/FIFO expiry-aware consumption (unrelated to this feature — see the coin-expiry note above) and a retry/backoff strategy for Razorpay API errors beyond "don't burn an attempt" (no exponential backoff, since the cron sweep's own fixed interval already provides natural spacing between attempts).

**Coin expiry is now real — closes a gap flagged since the very first session ("Expiry Date... flagged in-code as a placeholder... since no wallet-expiry column exists anywhere in this system yet").** Per direct instruction: an Expiry column on the Plan page, plus the backend/DB/seeding to back it.
- **Schema**: `coin_packages.validity_days` (admin-set, default 365, how long coins from this package stay valid) and `wallet_topups.validity_days` (snapshot at purchase) + `wallet_topups.expires_at` (set to `credited_at + validity_days` — stamped inside `credit_wallet_topup` itself, not application code, so it can never drift from when the coins actually landed). Base `scripts/wallet_system_migration.sql` updated in place for fresh installs; **`scripts/coin_expiry_migration.sql` is the one to actually run against the already-live database** (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` + `CREATE OR REPLACE FUNCTION credit_wallet_topup` — re-running the whole base file would *not* pick up the new columns, since `CREATE TABLE IF NOT EXISTS` no-ops against tables that already exist, same lesson as the `coin_packages.name` unique-index fix earlier this session).
- **Not built, deliberately**: actual expiry *enforcement* (a scheduled job zeroing out `wallet_credits_total` for coins past their `expires_at`, or FIFO per-batch consumption tracking so a deduct knows which topup batch it drew from). That's a materially bigger feature — this pass only adds the data model + display, matching what was actually asked ("add expiry columns... backend... links to database and seeding"). `getLatestWalletExpiry(userId)` (lib/db.js) is intentionally a simple aggregate (the most recent successful top-up's expiry) rather than a per-batch answer, since nothing consumes coins in a batch-aware way yet.
- **Where it shows**: `CoinPlansTable`'s new **Expiry** column (both `/plan` and `/settings/plan`), a validity chip on the Coin Packages admin cards + a "Validity (Days)" field in that CRUD form, and `ProfileBanner`'s "Valid till" line (was the hardcoded 1-year-out placeholder — now `profile.walletExpiresAt`, sourced fresh in `/api/auth/me` GET/PATCH and `/api/auth/verify-contact-change` so it doesn't blink back to nothing after a profile edit). Banner shows nothing if the user has never completed a paid top-up (no placeholder fallback — an honest "no data" over a fabricated date).
- Seed data (`data/coinPackages.js`) got real validity figures per package (Starter 30d, Growth 60d, Pro/Business/Enterprise 365d each) — same figures the original dummy "Experience" column used, now backing a real column instead of decorative text.

**Public-facing `/plan` and `/profile` added, per direct instruction — the plain 'user' role now has a proper public-site presence instead of only living inside `/settings`.**
- `components/profile/ProfileContent.jsx` (+ moved siblings `ChangeContactSection.jsx`/`ChangePasswordSection.jsx`/`ProfileBanner.jsx`, all from `app/settings/profile/`) is now the single source of truth for the profile experience, rendered at both `/settings/profile` (thin re-export now) and the new `/profile` (public route, wrapped in the normal site Header/Footer via the root layout — not the admin shell).
- `app/profile/page.js` — server component, gates on `getUserFromCookies()`, redirects to `/login` if signed out. Wraps `ProfileContent` in a local `<ToastProvider>` since the public root layout doesn't provide one (only `/settings/layout.js` does).
- `app/plan/page.js` — server component, **not** gated — viewable signed out (a real public pricing page, unlike `/settings/plan`). Fetches `getAllCoinPackages({activeOnly:true})` and `getAllTools()` directly server-side (no API round trip, no auth needed for either). Coins Usage Rates shows the **full** priced catalog here (not "my tools" like `/settings/plan` — there's no "my" for an anonymous visitor, and a pricing page should show everything anyway). Added `buildUsageRateGroups()` to `lib/tools.js` (server-only file) for this — deliberately did **not** import it into the existing `app/settings/plan/page.js` (a client component), since that file has server-only deps (`unstable_cache`) that would break the client bundle; that page keeps its own identical local copy.
- `components/admin/plan/CoinPlansTable.jsx` — "Add Coins" now checks `isLoggedIn()` (from `lib/tokenStore`, the same check `Header.jsx`/`UserMenu.jsx` already use) first: signed out → `router.push('/signup')` instead of attempting checkout; a stale/expired local session that still 401s mid-checkout → `/login` instead. Zero behavior change at `/settings/plan` (always logged in there).
- `components/layout/UserMenu.jsx` + `components/layout/MobileMenu.jsx` — the account-menu link is now role-conditional: `role === 'user'` → "Profile" → `/profile`; `master_admin`/`admin` → "Settings" → `/settings` (unchanged).
- `data/navigation.js` — added `{ label: 'Product Pricing', href: '/plan' }` to the main nav, before "Contact".
- **Known gap, not fixed**: `SessionManager` (the silent access-token-refresh interceptor mounted inside `/settings/layout.js`) is **not** mounted on `/profile` or `/plan` — its `forceLogout()` hardcodes a redirect to `/settings/login`, which is wrong for these public pages, and fixing that needs its redirect target to be configurable. Practical effect: a session on these two pages can go stale after the ~1-day access-token window even though the 7-day refresh token is still good, instead of silently refreshing like it does inside `/settings`. Low-impact (most single visits won't hit it) but worth fixing properly if these pages see real usage.

**Product direction, direct instruction: coins-only — subscriptions and SEO Packages fully removed.** No recurring/subscription billing and no SEO service pricing packages exist in this product at all now. Deleted outright, code and pages both:
- **Subscription scaffold**: `data/dummySubscription.js`, `app/api/admin/subscription/` (route + `cancel/` + `webhook/`), `app/api/admin/plans/route.js`. Nothing else referenced these (the profile page's own subscription card/tab had already been removed in an earlier session per the note in "Decisions already made" below) — deletion was clean, no dangling imports.
- **SEO Packages** (unrelated to billing, but removed in the same pass per direct instruction): `data/seoPackages.js`, `app/seo-packages/` (public pricing page), `app/settings/seo-packages/` (admin CRUD, list/new/`[id]`). This one *was* wired into several other pages, all now cleaned up: `app/industries/[slug]/page.js` lost its `PackagesTeaser` section and 3 CTA buttons/links that pointed at `/seo-packages` (plus the now-unused `Package`/`Zap` icon imports and the `seoPackages` fetch/prop threading), `app/case-studies/CaseStudiesClient.jsx` lost its "View SEO Packages" teaser card, `data/navigation.js` lost the "Pricing Plans"/"Pricing" nav links, `lib/permissions.js`'s `NAV_CONFIG` lost the `seo-packages` admin nav entry, and `scripts/seed.mjs` lost its `seedList(supabase, 'seo-packages', ...)` call and `data/seoPackages.js` import. The generic `app/api/admin/[collection]/route.js` catch-all needed no change — it was never seo-packages-specific.
- If either of these is ever wanted back, it's a rebuild from git history, not a toggle — nothing was stubbed out or feature-flagged, it's gone.

**Backend: built (§1–§7 complete), migration has now been run against Supabase.** `scripts/wallet_system_migration.sql`'s three tables + `deduct_wallet_coins`/`credit_wallet_topup` functions are confirmed live (surfaced by a real Postgres error — `ON CONFLICT (name)` needing a matching unique constraint — when the seed script hit the actual `coin_packages` table). **Known gap from that**: the table was created *before* this file added `UNIQUE (name)`, and `CREATE TABLE IF NOT EXISTS` is a no-op against an already-existing table, so the constraint never retroactively applied. Fixed by switching to a standalone `CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_packages_name ON coin_packages(name);` statement instead of an inline column `UNIQUE` — that line **must be (re-)run in the Supabase SQL Editor** (the whole file is safe to re-run; every `CREATE TABLE`/function is `IF NOT EXISTS`/`OR REPLACE`) before `npm run seed` will succeed. **General lesson for this file going forward**: once a migration has been run once, every subsequent edit to it must be independently idempotent/rerunnable — an inline column constraint added after the fact is silently ineffective, unlike a separate `CREATE ... IF NOT EXISTS` statement. `lib/db.js` has the full coin-packages/wallet-topups/usage-history CRUD + the two RPC wrappers; `lib/razorpay.js` exists (raw-fetch pattern, independent from the old subscription code); `lib/tools.js` has `getToolFeature()`; all of `app/api/wallet/*` (packages, topup/order, topup/verify, webhook, history/usage, history/topups, deduct) and `app/api/admin/{coin-packages,usage-history,payment-history}` exist and build cleanly (`npm run build` passes with zero errors).

**Frontend: fully rewired to the real API this session** — no more dummy `data/*.js` behind any billing page. `app/settings/plan/page.js`, `components/admin/plan/CoinPlansTable.jsx` (now does a real Razorpay Checkout.js flow via `/api/wallet/topup/order` → `/api/wallet/topup/verify`), `app/settings/wallet/page.js`, `components/admin/wallet/UserWalletPanel.jsx`, and `components/admin/coin-use/CoinUsagePanel.jsx` all fetch real endpoints now. Two net-new pieces also landed: `app/settings/coin-packages/` (CRUD, card-grid UI matching the pre-existing `PackageGridSkeleton`, not a `DataTable` — see below) and `components/admin/customer-dashboard/CrossCustomerUsageReport.jsx` (the cross-customer tools/features aggregate from Customer Dashboard report #1, built on the shared `DataTable`, placed above `CustomerDashboardTable` on `/settings/customer-dashboard`). `isPathAllowed` is fixed and `NAV_CONFIG`'s `BILLING & WALLET` group now includes `tools-catalog` and `coin-packages`. Deleted as genuinely dead code once nothing imported them anymore: `data/coinsUsageRates.js`, `data/walletBalances.js`, `data/walletHistory.js`, `data/myWalletHistory.js`, `data/coinUsage.js` (`data/coinPlans.js` kept, trimmed to just the legal-note export).

**Judgment calls made while wiring, not spelled out in the plan text above — record them so they don't get re-litigated:**
- `CoinPlansTable` dropped the two hardcoded "No sign up" / "Sign Up" informational rows — the table now renders exactly what's in `coin_packages` (real, admin-managed), nothing fabricated. If those marketing rows are still wanted, they need to be added back explicitly as static UI, not as fake purchasable packages.
- `CoinPlansTable`'s third column is now **Badge** (`coin_packages.badge`, e.g. "Best Value"), not "Experience" — there is no expiry/validity-duration column anywhere in this system (same gap already called out on the Profile banner), so the old "30 Days / 1 Year" column had nothing real to bind to.
- `CoinsUsageTable`'s **Fix Fees** column is always `0` now — there's no per-feature flat-fee field in the real schema (only `coinCost`), and the plan's own instruction for this swap was "point it at the real source," not "redesign the table."
- Plan page's tools list comes from **`GET /api/tools/my`**, not `/api/admin/tools` — the latter 401s for a plain `user` (`getStaffFromRequest` only allows `master_admin`/`admin`), and the Plan page is a `user`-reachable page. `/api/tools/my` is also the more correct source semantically (pricing shown = tools this viewer actually has access to).
- Coin Packages CRUD is a **card grid**, not the shared `DataTable` the plan text suggested — `components/admin/Skeleton.jsx`'s pre-existing `PackageGridSkeleton` (title+subtitle, edit/delete icon pair, big price line, chip row) was already built for exactly this shape in an earlier session and was otherwise unused; a handful of admin-managed pricing tiers is also a better fit for cards than a sortable/paginated table.
- ~~All 6 features on each of the 5 real embedded tools were priced~~ — **corrected, see below**: only 3 of the 5 real embedded tools are billable now, per direct instruction.

**Correction — only 3 of the 5 real embedded tools are billable, not 5.** Direct instruction: for now, only **PDF Cropper, Background Remover, and Link Generator** should have priced/active features. `Profit & Loss` and `Program Playground` were reverted in `data/tools.js` back to the marketing-only shape (`isActive:false, coinCost:0, apiIdentifier:null` on every feature, `id` kept) — same as the 6 non-embedded tools. All 6 features on each of the 3 remaining billable tools stay `isActive:true` (the plan's instruction was "each feature," per the note directly above). If Profit & Loss / Program Playground come back into scope later, re-apply the pricing that was reverted here (coinCost 1–2 per feature, `apiIdentifier`s prefixed `pl-`/`program-`) rather than re-deriving it from scratch.

**Coin package seed data added**: `data/coinPackages.js` (5 packages — Starter/Growth/Pro/Business/Enterprise, ₹500→500 coins through ₹50,000→80,000 coins, carried over from the original dummy `data/coinPlans.js` numbers) + `scripts/seed.mjs`'s new `seedCoinPackages()`, upserting on `name`. This needs a unique index on `coin_packages.name` to work — see the migration re-run note above; a first attempt added it as an inline column `UNIQUE` which didn't retroactively apply to the already-created live table, fixed by switching to `CREATE UNIQUE INDEX IF NOT EXISTS`. Same re-seed caveat as `seedTools`: re-running `npm run seed` after admins have edited packages through the Coin Packages CRUD will overwrite their edits back to these seed values.

**Frontend: built ahead of the backend, against dummy data, with a different page layout than originally planned.** Five sessions of UI-first iteration produced:

| Page | Route | Built against | Nav entry |
|---|---|---|---|
| Plan | `/settings/plan` | `data/coinPlans.js`, `data/coinsUsageRates.js` | `ACCOUNT` group, all roles |
| Customer Dashboard | `/settings/customer-dashboard` (list) + `/settings/customer-dashboard/[userId]` (per-customer Report, back button) | `data/customers.js`, `data/coinUsageTrend.js` | `COMPANIES & USERS` group, master_admin/admin — `[userId]` inherits the same permission via `isPathAllowed`'s prefix match, no separate nav entry |
| Wallet (admin, cross-user) | `/settings/wallet` | `data/walletBalances.js`, `data/walletHistory.js` | `BILLING & WALLET` group, master_admin/admin |
| Wallet (personal) | Profile page → "Wallet" tab | `data/myWalletHistory.js` + real `walletCreditsTotal/Used/Remaining` | not a nav item — see below |
| Coin Use (personal) | Profile page → "Coin Use" tab, `user` role only | `data/coinUsage.js` | not a nav item — see below |
| Promo Offers (new, adjacent feature) | `/settings/promo-offers` (admin) + a badge on `/settings/plan` (everyone) | `data/promoOffer.js`, localStorage | `BILLING & WALLET` group, master_admin/admin |

None of the original planned pages (`/settings/credit-packages`, `/settings/usage-history`, `/settings/payment-history`, tools-catalog pricing sub-editor) exist. The pages above are **not** those pages — they cover overlapping but different ground (see "Customer Dashboard — clarified scope" below) and were driven by mockups, not this plan. This plan and the live UI need to be reconciled, which is what this revision does.

**Why "Wallet" and "Coin Use" aren't nav items for the `user` role**: `app/settings/layout.js` renders no `Sidebar` at all for `role === 'user'` (single centered page, by design). A NAV_CONFIG entry with `roles: [...,'user']` is technically permission-allowed but has no link to click. So the personal-wallet and per-tool-usage views were built as tabs on the one page a `user` does get (`app/settings/profile/page.js`, tabs: `Profile / Setting / Coin Use / Wallet`) instead. `master_admin`/`admin` reach the cross-user admin Wallet page via the sidebar as originally planned.

**Reusable infrastructure gained along the way** (not in the original plan, but directly useful for it): `components/admin/data-table/` — search, sortable columns, generic dropdown filters, a date/time range filter, a rows-per-page control, and Excel (`exceljs`) + PDF (`jspdf` + `jspdf-autotable`) export, all built on top of the original `components/admin/DataTable.jsx` contract (now a re-export shim, so the 8 pre-existing consumers — Users, Team, Testimonials, Services, Partners, Industries, Case Studies, Blogs — are unaffected). **Use this for `usage-history` and `payment-history` when they're built** — it already does everything §6 originally asked those pages to hand-roll. Also gained: `chart.js` + `react-chartjs-2` (installed for `UsageTrendChart.jsx`) — reuse for any future trend chart rather than adding a second charting library.

**Terminology**: the user asked for "coins" everywhere. Applied to all UI copy this session (`ADD COINS`, `Coins Issued/Used/Remaining`, `Coin Use`, `Coin Cost (Per Use)`, `Coin Balance`, etc.) and to every identifier below that this plan controls and hasn't been built yet — table names, RPC function names, JSON field names all now say `coin`, not `credit`. The one exception, non-negotiable: `users.wallet_credits_total` / `wallet_credits_used` are real, live Supabase columns already in production — renaming them is a schema migration with no upside, not a text edit, and is out of scope. **Every new table/function/field this plan introduces reads from and writes to those two existing columns under their real names, but is itself named with `coin`.** `lib/profile.js`'s `serializeProfile()` output (`walletCreditsTotal/Used/Remaining`) also stays as-is — it's consumed by existing code (`UserFormModal.jsx`, `app/api/admin/users/*`) beyond this feature's boundary.

**Naming convention — strict, file names included, not just copy** (added per direct instruction after a real collision was caught): this codebase already uses "token" for something else entirely — JWT auth (`lib/auth.js`, `lib/tokenStore.js`, `app/api/auth/{login,logout,refresh,signup,verify-otp,reset-password}/route.js`, `components/admin/SessionManager.jsx`, `proxy.js`). The coins feature's original "Token Use" tab — file `components/admin/token-use/TokenUsagePanel.jsx`, data file `data/tokenUsage.js`, constants `TOKEN_USE_RANGES`/`tokenUsageByRange`, tab id `tokenUse` — collided with that on sight: a maintainer grepping for "token" to work on auth would land in the coins feature by mistake, or vice versa. **Fixed this revision**: renamed folder → `components/admin/coin-use/`, `TokenUsagePanel.jsx` → `CoinUsagePanel.jsx`, `data/tokenUsage.js` → `data/coinUsage.js`, `TOKEN_USE_RANGES` → `COIN_USE_RANGES`, `tokenUsageByRange` → `coinUsageByRange`, tab id `tokenUse` → `coinUse`, tab label "Token Use" → "Coin Use". Also caught and fixed the same collision in the pre-existing `WalletCard` component on the admin/master_admin Subscription tab — its card heading literally said "Token Use" too; now "Coin Balance". Verified zero remaining `grep -rn "token"` hits anywhere in this feature's files (`app/settings/profile/page.js`, `data/coinUsage.js`, `components/admin/coin-use/*`) — only the auth system may use that word from here on. **Rule for every future file in this feature, no exceptions**: if it's about coins/wallet, the file name, folder name, exported identifier names, and constant names all say `coin` or `wallet` — never `token`, never `credit` (except the two grandfathered `wallet_credits_*` DB columns called out above). Check `grep -rn "[Tt]oken\|[Cc]redit"` against new files before committing them.

**Amount (₹) vs Coins — was conflated in the dummy data, now split, and this incidentally validates §1's schema.** `data/walletHistory.js` and `data/myWalletHistory.js` originally had one `amount` field doing two jobs — the coin delta shown in the UI (`+1100` / `-5`) was standing in for both "coins granted" and "money paid," which is wrong the moment a plan's price and its coin grant differ (₹1000 buys 1100 coins — already true in `data/coinPlans.js`, the mismatch was just never surfaced in the ledger). Fixed: renamed `amount` → **`coins`** (the coin effect, +granted / -spent) and added **`priceAmount`** (₹ actually paid — `null` on `usage` rows, since spending coins moves no money). Both `app/settings/wallet/page.js` (admin) and `UserWalletPanel.jsx` (personal tab) now render two separate columns, **Amount** (₹) and **Coins**, instead of one. `WalletSummaryStats` gained a **"Total Paid"** tile — sum of `priceAmount` across `type: 'topup', status: 'success'` rows only (pending/failed payments aren't revenue) — rendered with a `₹` prefix, visually distinct from the other four tiles which are plain coin counts. This split isn't a new backend requirement — §1's `wallet_topups` table already has both `amount_paise` (price) and `coins_granted` (coins) as separate columns; the dummy UI data had just drifted out of sync with that design. **When wiring §6**: `priceAmount` ← `wallet_topups.amount_paise / 100`, `coins` ← `coins_granted` (topup rows) or the negated `coins_cost` from `tools_usage_history` (usage rows); "Total Paid" ← `SUM(amount_paise) WHERE status = 'paid'` (in paise — divide by 100 once, server-side, don't repeat the conversion per row).

**Layout — full width, left-aligned, no exceptions for this feature's pages.** Every page/sub-div this feature touches had a `max-w-* mx-auto` (or, for the `user` role shell, `flex justify-center` + `max-w-2xl`) that centered content in a narrow column with dead space on both sides. Removed per direct instruction: `app/settings/plan/page.js`, `app/settings/customer-dashboard/page.js`, `app/settings/customer-dashboard/[userId]/page.js`, `app/settings/wallet/page.js`, the "Profile" tab's wrapper and `UserWalletPanel.jsx` in `app/settings/profile/page.js`, and — the actual root cause for Profile, since a page-level fix alone couldn't have worked — the `user`-role branch of `app/settings/layout.js`, whose `<main>` now uses the same `max-w-screen-2xl`, no-`justify-center` pattern `master_admin`/`admin` already had. **New pages in this feature inherit this: no `mx-auto`, no `max-w-*` on the page-root or card-root div, unless there's a specific reason (a form that genuinely reads worse full-width, say).** Deliberately *not* touched: the ~20 pre-existing settings pages outside this feature (Users, Blogs, Services, etc.) still use `max-w-screen-2xl` on the shared master_admin/admin shell — that's a separate, much larger blast-radius change nobody asked for.

**Profile page — hero banner, and the old header card is gone.** `app/settings/profile/ProfileBanner.jsx` is a gradient hero (same blue→orange as the pricing tables) rendered above the tab bar, visible on every tab: avatar initial, name, a **"{remaining} Coins"** pill wired to the real `profile.walletCreditsRemaining` (not dummy), an **Expiry Date** — flagged in-code as a placeholder, 1 year out, since no wallet-expiry column exists anywhere in this system yet — and, on the right, the **company's** social links (`data/navigation.js`'s `socialLinks`, not a per-user field). Once that existed, the "Profile" tab's own old avatar/name/contact/Edit card was pure duplication, so it's **deleted**; the Edit button that lived on it now lives in the "Basic Information" card's header instead (same `startEdit` handler, just relocated — editing still works identically). Also deleted from the "Coin Use" tab (admin/master_admin branch): the `SubscriptionCard` component, the `subscription` state, its `/api/admin/subscription` fetch in `load()`, and the now-unused `CreditCard` icon import — all dead code once the card was removed. That tab now renders just `WalletCard` alone. **Landmine for future sessions, hit once already**: this project's installed `lucide-react` version has **no brand icons** — `Facebook`, `Instagram`, `Youtube`, `Linkedin`, `Twitter` don't exist as exports (only generic glyphs like `MessageCircle` do). `components/layout/Footer.jsx`'s dynamic `LucideIcons[icon]` lookup silently renders blank for these — a pre-existing, unrelated bug — but a *static* `import { Facebook } from 'lucide-react'` (what `ProfileBanner.jsx` first tried) hard-fails the build. Fixed with local inline SVGs (`FacebookIcon`/`InstagramIcon`/`YoutubeIcon` in `ProfileBanner.jsx`) for the three that don't exist, keeping `MessageCircle` for WhatsApp since that one does. **Check any icon name against `node_modules/lucide-react` before using it in this codebase — don't assume standard lucide-react coverage.**

**Coin Use tab — now backed by one event list, not disconnected pre-baked totals.** `data/coinUsage.js` used to hardcode a `total` and a `tools[]` breakdown separately per range (`This Month`/`Last Month`/`All Time`), authored by hand with no relationship to each other — nothing stopped them from silently disagreeing. Redesigned around `coinUsageHistory` — one flat, dated list of individual usage events (real tool names, not the original "Tool 1..6") — and a single `getUsageForRange(rangeId)` that derives the Total, the per-tool breakdown, **and** a new "Recent Activity" history table (`components/admin/coin-use/UsageHistoryTable.jsx`: Date/Tool/Feature/Coins Used) all from that same array, so the three numbers on screen can't drift apart. Ranges are **sliced** (most recent N events), not filtered against real elapsed time — a genuinely date-filtered range would quietly empty out a couple of months after the fixed 2026 dummy dates recede into the past; slicing keeps all three ranges meaningfully different and non-empty indefinitely. **When wiring §6's Coin Use swap**: replace `getUsageForRange()` with a real query grouped the same way (raw rows → sum for Total, `GROUP BY tool_slug` for the breakdown, raw rows again for history) rather than three separate endpoint calls — the whole point of this redesign was one source of truth, don't reintroduce the split when it goes live.

**Promo Offers — new, adjacent to this plan's scope, not part of it.** Direct request: a discount badge on `/settings/plan` ("10% off, buy before a date, with a referral code") plus an admin panel to manage it. Built as `components/admin/promo/` (`usePromoOffer.js`, `PromoBadge.jsx`, `PromoOfferForm.jsx`) + `data/promoOffer.js` + `app/settings/promo-offers/page.js` (nav: `BILLING & WALLET`, `BadgePercent` icon, master_admin/admin). Unlike everything else in this plan, admin edits here **actually persist** — `usePromoOffer` reads/writes `localStorage` (key `arshanemi_promo_offer`) since there's no backend table for this at all, not even a planned one — so it's a genuinely working config panel (enable/disable, title, description, discount %, referral code, start/end date, a live status pill of `active`/`scheduled`/`expired`/`disabled`, a live preview of the exact badge before saving) without needing a migration. `CoinPlansTable.jsx` reads the same hook and shows a struck-through original price next to the discounted one on rows with a real ₹ amount, so the badge isn't just decorative — the discount actually shows up where you'd buy a plan. **This was never in the original architecture** (§1's three tables don't include anything promo-related) — if this needs to survive past a demo, it needs its own `promo_offers` table (`enabled BOOLEAN`, `title/description VARCHAR`, `discount_percent INTEGER`, `referral_code VARCHAR`, `start_date`/`end_date DATE`) and an `/api/admin/promo-offer` GET/PUT pair (singleton, not a list — there's only ever one active offer in this design) to replace the localStorage hook. Not scheduled in "Next steps" below since it's out of this plan's original scope; add it there if it's going to be built for real.

---

## Customer Dashboard — clarified scope

Per direct clarification: **"Customer Dashboard" is two reports, not one.**

1. **Tools/features-wise coins usage report** — which tool, which feature, how many coins consumed, by whom, aggregated across all customers. Backed by `tools_usage_history` (below) grouped by `tool_slug` + `feature_api_identifier`. **Partially built, per-customer only** — see below. The cross-customer aggregate (all customers combined, by tool/feature) is **not built yet**. `components/admin/plan/CoinsUsageTable.jsx` is a different table entirely — it shows *pricing* (coin cost per feature), not *actual usage*.
2. **User report — login status of users & wallets** — per-customer login state (`Without Login`/`Login`/`Paid`) and wallet balance. Built: `CustomerDashboardTable` (status, tools used, balance, a "Report" link per row) on `/settings/customer-dashboard`.

**These two reports converged into one component**, not two: clicking "Report" on a `CustomerDashboardTable` row navigates to its own route, `app/settings/customer-dashboard/[userId]/page.js` (`userId` in the URL is the customer's id without its leading `#` — Next.js treats `#` as a fragment, not a path segment, so it's stripped on the link and re-added when looked up server-side). That page renders `PageHeader` with `backHref="/settings/customer-dashboard"` (the existing back-button pattern, not a new one) followed by `components/admin/customer-dashboard/CustomerDetailsReport.jsx` — a header info card (User ID/name/mobile/email/first & last login/balance/exp) plus five independently-filterable coin-usage rows (**All Time / Today / 7 Days / Last 30 Days / a custom date range**), each with its own "Tools Wise" dropdown and a Chart.js curve chart (`components/admin/customer-dashboard/UsageTrendChart.jsx`, one row per range = `components/admin/customer-dashboard/ReportRow.jsx`). Dummy trend data comes from `data/coinUsageTrend.js` — a seeded generator (deterministic per `userId:tool:range`, not a static table) rather than hand-written points. This satisfies report #1 *at the per-customer level* — the "Tools Wise" filter is exactly the tool/feature breakdown, just scoped to one customer at a time instead of aggregated across all of them.

(This was originally an inline expand-in-place panel on `/settings/customer-dashboard` itself, driven by client state + scroll-into-view. Moved to a real route on request — a proper back button needs a proper page to go back *from*. If a future session finds leftover `selectedCustomer`/scroll-target plumbing on the list page, that's a regression, not intentional — the list page (`app/settings/customer-dashboard/page.js`) should be a plain server component rendering only `CustomerDashboardTable`.)

There used to be a third piece here — a generic `ReportTable` listing many different dummy customers' login/balance/exp in one flat table, backed by `data/customerReports.js`. **Deleted**: once `CustomerDetailsReport` existed, a flat table of unrelated people served no purpose the per-customer drill-down didn't already cover better. Don't recreate it.

**Gap to close when the backend lands**: (a) wire `CustomerDetailsReport` to real `tools_usage_history` rows for the selected customer (swap `getUsageTrend()` in `data/coinUsageTrend.js` for `getUsageHistoryForUser()` grouped by day) instead of the seeded generator; (b) still need the **cross-customer** aggregate view from report #1 — a new component on `/settings/customer-dashboard`, above or beside `CustomerDashboardTable`, sourced from `getAllUsageHistory()` grouped server-side (`tool`, `feature`, `total coins used`, `unique users`, date range). Build it on the shared `components/admin/data-table/DataTable` (dateKey + export already included for free) — a table, not another chart, since it's many rows of (tool × feature) rather than one curve. Once (a) lands, `CustomerDashboardTable`'s dummy `data/customers.js` gets replaced by a real `getAllUsers()` + wallet-balance join too.

---

## Access Control — who sees what

Direct requirement, stated once here because it governs *every* report in this plan, not just one: **`master_admin` sees everything — all companies' users, all tools, every report. `admin` is scoped to their own company's users and their own granted tools. A plain `user` sees only their own data — their own wallet, their own tool usage, nothing belonging to anyone else.** This isn't a new mechanism to invent — it's the exact company-scoping pattern this codebase already uses for the Users list; it just isn't applied to any of this session's billing/reporting pages yet, because none of them talk to a real database.

**The existing pattern, verified by reading the actual code — reuse it, don't reinvent it:**
- `lib/auth.js`'s `getStaffFromRequest` (`['master_admin','admin']`) / `getAdminFromRequest` (`['master_admin']` only) return the verified JWT payload, which carries `role` and `companyId` from login. **`companyId` is never trusted from the client** — always `staff.companyId` off the verified payload, never a request body/query param of the same name.
- `lib/db.js`'s `getAllUsers({ companyId, role })`, as called by `app/api/admin/users/route.js`, is the reference implementation: `admin` → `getAllUsers({ companyId: staff.companyId, role: 'user' })`; `master_admin` → `getAllUsers()`, no filter. Writes are scoped identically — that same route's POST handler hard-overrides any client-supplied `companyId`/`role` when the caller is an `admin` (so an admin literally cannot write a user into another company, even by tampering with the request body).
- §2's `getAllUsageHistory({userIds, toolSlug, limit})` and §5's `usage-history`/`payment-history` routes already sketch this same shape (`getAllUsers({companyId}) → ids → getAllUsageHistory({userIds})`) — that part of the plan was already right. This section makes it an explicit, named rule and extends it to *every* admin-facing report below, not just those two routes.

**"Tools" scoping is per-user, not per-company — worth stating precisely, since "admin allowed his tools" reads like it could mean a company-wide toggle, and that thing doesn't exist.** Checked `lib/db.js` and `scripts/schema.sql` directly: there is no `company_tools` table and no per-company "enabled tools" column anywhere. Tool access is granted **per user**, via `user_settings.tools_access` (a JSONB array), through the existing "Tools Access" page (`/settings/tools`, nav key `tools-access`). A new `user` starts with zero tools (`data/tools.js`'s `defaultToolsAccessByRole`) until explicitly granted some. An `admin`'s "own tools" concretely means: whichever tools were granted to *the admin's own user row*, which in turn caps what that admin can grant to users in their company — `/api/tools/my` narrows the admin's own grantable catalog before it ever reaches the assignment UI. **For this billing system specifically**: a tool's billable pricing (`coinCost`/`apiIdentifier`/`isActive`, §4) lives on the `tools` table itself, globally — every role that can see a tool at all sees the same price for it (Plan page, Coins Usage Rates). What's scoped per-role is *who fired it* (`tools_usage_history.user_id`), not the tool's existence or its price. Don't build a second, parallel "which tools can this company see" mechanism for billing — reuse `tools_access`, the one that already exists.

**Gap, real and current, not hypothetical.** None of this session's dummy data carries a `companyId` at all — `data/customers.js`, `data/walletBalances.js`, `data/walletHistory.js`, `data/coinUsage.js` are flat arrays keyed only by `userId`, verified by reading all four. Today, an `admin` (not `master_admin`) opening `/settings/wallet` or `/settings/customer-dashboard` sees the **exact same rows** a `master_admin` would — the nav-level `roles: ['master_admin','admin']` check gates the *page*, but nothing scopes the *rows* on it, because there's no company field to scope by. This is consistent with "backend: 0% built" — there's no real per-company data yet — but it means **the dummy data itself needs a `companyId` (or at least a `companyName`) field added before this policy can be demonstrated in the UI at all**, as a small task separate from the real backend work in §1–§7.

**Per-report, concretely, once wired:**

| Report | `master_admin` | `admin` | `user` |
|---|---|---|---|
| `/settings/wallet` (admin ledger) | every company's transactions | own company's users' transactions only | no nav access — own history via Profile → Wallet tab |
| `/settings/customer-dashboard` + `[userId]` detail | every company's customers | own company's customers only | no nav access |
| Cross-customer tools/features usage report (§6, not built yet) | every company, every tool | own company's users, but every tool (tool pricing itself isn't company-scoped — see above) | no nav access |
| Profile → Wallet tab | own personal balance (role is irrelevant here) | own personal balance | own balance + own history only, never another user's |
| Profile → Coin Use tab | n/a (tab shows `WalletCard` instead for staff roles) | n/a | own usage only |
| `/settings/plan` (Plan + Coins Usage Rates + Promo badge) | same content for everyone — pricing/marketing, not a report; nothing to scope | same | same |

**When wiring §6**: every admin-facing report route calls `getStaffFromRequest`, then branches exactly like `app/api/admin/users/route.js` already does — `admin` always gets `{companyId: staff.companyId}` threaded into `getAllUsers`/`getAllUsageHistory`/`getAllWalletTopups`; `master_admin` gets no filter. Never accept a `companyId` from the client for this purpose. The Verification checklist's step 7 ("confirm a company-scoped `admin` only sees their own company's users' rows") is this rule in test form — don't consider §6 done until that step actually passes for a two-company test fixture, not just a single-company demo where the bug can't show up.

---

## Context

The admin panel already manages a catalog of standalone tools (PDF Cropper, Background Remover, etc. — each hosted on its own subdomain outside this repo) and already has `wallet_credits_total`/`wallet_credits_used` columns on `users`. What's missing is the part that turns this into a real billing system: per-tool-feature pricing that admins control, a way for users to buy coins via Razorpay, atomic deduction when a billable action fires in any tool, and full audit trails (usage history + payment history). This plan adds exactly that, fitting into the existing Next.js/Supabase conventions rather than introducing new patterns where existing ones already work.

**Decisions already made with the user:**
1. ~~The existing dummy Razorpay *Subscriptions* scaffold... is left completely untouched.~~ **Superseded by direct instruction**: the scaffold (`data/dummySubscription.js`, `app/api/admin/subscription/*`, `app/api/admin/plans/*`) has since been **deleted outright** — this product is coins-only, no recurring subscription plans at all. See the Implementation Status section's removal note for the full list of what else came out with it (SEO Packages too, a separate and otherwise-unrelated removal requested in the same pass).
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

**Admin — `app/api/admin/*`** — every route below is `master_admin`-vs-`admin` scoped exactly per the "Access Control" section above; don't re-derive the scoping logic per route, thread `staff.companyId` through the same way each time:
- `app/api/admin/coin-packages/route.js` (GET via `getStaffFromRequest`, POST via `getAdminFromRequest`) + `[id]/route.js` (GET/PUT/DELETE, `getAdminFromRequest`) — mirrors `app/api/admin/tools/[id]/route.js` exactly. Not company-scoped — coin packages are global, same as tool pricing.
- `app/api/admin/usage-history/route.js` (GET, `getStaffFromRequest`, `?userId=&toolSlug=&limit=`) — company-scoped for `admin` role via `getAllUsers({companyId})` → ids → `getAllUsageHistory({userIds})`, same scoping already used for the Users list. Add `?groupBy=feature` to serve the Customer Dashboard tools/features report via `getUsageHistoryGroupedByFeature()`.
- `app/api/admin/payment-history/route.js` (GET, `getStaffFromRequest`, same scoping) — lists `wallet_topups`.

---

## 6. Admin UI

**Already built this session** (see Implementation Status table) — wire these to the routes above instead of rebuilding them:
- `app/settings/plan/page.js` (`CoinPlansTable` + `CoinsUsageTable`) — `CoinPlansTable`'s "ADD COINS" button currently just toasts; wire it to `POST /api/wallet/topup/order` → Razorpay Checkout.js (`<Script strategy="lazyOnload">`, same mechanism already used in `app/layout.js`) → `POST /api/wallet/topup/verify` on success. Swap `data/coinPlans.js` for `GET /api/wallet/packages`; swap `data/coinsUsageRates.js` for live tool `coinCost` per §4.
- `app/settings/wallet/page.js` (admin, cross-user) — swap `data/walletBalances.js`/`data/walletHistory.js` for `GET /api/admin/usage-history` + `GET /api/admin/payment-history` (merge into one ledger client-side, or add a combined endpoint if that gets awkward). The filter/search/export UI is already done via the shared `DataTable` — no rebuild needed. `priceAmount`/`coins`/"Total Paid" field mapping is in the Amount vs Coins note above — don't re-derive it.
- `components/admin/wallet/UserWalletPanel.jsx` (Profile → Wallet tab) — swap `data/myWalletHistory.js` for `GET /api/wallet/history/usage` + `GET /api/wallet/history/topups`. Same `priceAmount`/`coins` mapping as the admin table.
- `components/admin/coin-use/CoinUsagePanel.jsx` (Profile → Coin Use tab, `user` role) — swap `getUsageForRange()` (`data/coinUsage.js`) for a real `GET /api/wallet/history/usage?range=` call; keep deriving Total/tool-breakdown/history from the *one* response instead of three separate calls — see the "Coin Use tab" note above for why that matters.

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

**Steps 2–7 below are done as of this session — code exists, builds clean, not yet runtime-verified (needs the migration run first).** Only step 1 (a manual action outside this repo) and the tools-catalog pricing sub-editor remain.

1. ~~Run `scripts/wallet_system_migration.sql` (§1, coin-named tables/functions).~~ Done — confirmed live. **Follow-up still needed**: re-run the file (or just the one `CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_packages_name` line) in the Supabase SQL Editor — the version run originally predates that line, so `coin_packages.name` currently has no unique index and `npm run seed`'s `ON CONFLICT (name)` upsert will fail until it's added.
2. ~~`lib/db.js` additions (§2) + `lib/razorpay.js` (§3).~~ Done.
3. ~~Enrich `data/tools.js` features with `apiIdentifier`/`coinCost`/`isActive` (§4).~~ Done — see the judgment-call note above re: all 6 features per real tool priced, not just one.
4. ~~Build the API routes (§5), then `POST /api/wallet/deduct` (§7).~~ Done.
5. ~~Rewire the five already-built pages from dummy data to these routes (§6, "Already built this session" list).~~ Done.
6. ~~Build the two net-new pieces (§6, "Still to build"): coin-packages CRUD, and the Customer Dashboard tools/features usage report.~~ Done — plus the third "still to build" item, the Features & Pricing sub-editor on `app/settings/tools-catalog/ToolsAdminClient.jsx` (title/icon/desc/apiIdentifier/coinCost/isActive per feature, add/remove rows, `updateTool`'s existing content-merge already handles the partial `features` replace correctly). All three net-new pieces from §6 are now done.
7. ~~Fix `isPathAllowed` (§6).~~ Done.

## Verification

1. `npm run dev` — confirm `/settings/tools-catalog`, `/settings/coin-packages`, `/settings/wallet` all appear correctly in the sidebar per role (master_admin sees everything; admin sees wallet but not coin-packages/tools-catalog; `user` sees neither — reaches their own balance via the Profile page's Wallet tab instead, by design).
2. Create a coin package via the new admin UI; edit a tool's features in `tools-catalog` to set a `coinCost` on one feature.
3. On `/settings/plan`, buy that package with a Razorpay test-mode card; confirm `wallet_topups` transitions `created → paid` and `users.wallet_credits_total` increments by the right amount, and the change shows up on the Profile → Wallet tab.
4. Call `POST /api/wallet/deduct` with a valid Bearer token for that user (curl/Postman) using the tool slug + `apiIdentifier` just priced; confirm `wallet_credits_used` increments, a `tools_usage_history` row appears, and the response's `remainingCoins` is correct.
5. Set the user's remaining balance below the feature's cost and call `deduct` again — confirm a clean `402 insufficient_coins` with no partial state change.
6. Call `deduct` twice with the same `idempotencyKey` — confirm only one deduction happens and the second call returns `duplicate: true` with the same `usageId`.
7. Confirm `/settings/wallet` (admin) and the new Customer Dashboard tools/features report show the rows from steps 3–6, and that a company-scoped `admin` only sees their own company's users' rows — this is the "Access Control" section's rule in test form; use a **two-company** fixture, since a single-company demo can't surface a scoping bug even if one exists.
8. Confirm `admin`-role navigation to `/settings/tools-catalog` or `/settings/coin-packages` directly by URL 404s for `admin` (verifies the `isPathAllowed` fix once done).
