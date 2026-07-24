import { getUserFromCookies } from '@/lib/auth'
import { getTool, getUserToolsAccess } from '@/lib/tools'
import { getFeatureActivations, hasValidCoinBalance, getTotalStorageBytesForUser } from '@/lib/db'

// link-generator's Storage feature is metered (billed monthly for usage over
// a free allowance by scripts/cron-storage-billing.mjs) but is configured
// with fixFeeCoins so its rate shows on the pricing page — without this
// special case, any fixFeeCoins > 0 feature forces the Activate gate below,
// which would wrongly demand upfront payment before a user has stored
// anything at all. Same hardcoded (tool, feature) pair and free-allowance
// constant as that cron script uses — no schema field for a per-feature free
// allowance exists (see that script's comment for why).
const GB = 1024 ** 3
const STORAGE_FEATURE = { toolSlug: 'link-generator', apiIdentifier: 'link-storage-gb-month' }
const STORAGE_FREE_BYTES = (Number(process.env.STORAGE_FREE_GB) || 1) * GB

async function isWithinFreeStorageAllowance(slug, feature, userId) {
  if (slug !== STORAGE_FEATURE.toolSlug || feature.apiIdentifier !== STORAGE_FEATURE.apiIdentifier) return false
  const totalBytes = await getTotalStorageBytesForUser(userId)
  return totalBytes < STORAGE_FREE_BYTES
}

// Generic per-call role allowlist — not tied to any stored per-tool field.
// Pass allowedRoles to restrict a check to specific roles; omit it (or pass
// an empty list) to let every role through untouched.
export function checkRole(payload, allowedRoles) {
  if (!allowedRoles?.length) return true
  return !!payload && allowedRoles.includes(payload.role)
}

// Single server-side gate for /tools/[slug]/use — decides, in order:
//   1. Does the tool exist?
//   2. Does it require login, and if so, is there a valid session? If the
//      tool doesn't require login and the visitor is signed out, access is
//      granted immediately here — steps 3-6 below only apply to signed-in
//      users, since a guest can't hold a grant/activation/balance anyway.
//   3. (optional) Is the user's role in `allowedRoles`, if the caller passed one?
//   4. Has this user been granted the tool (user_settings.tools_access)? If
//      not, the caller renders an inline "contact your admin" notice
//      (kind: 'access_denied') rather than being redirected away — this is
//      an admin-grant problem, not something the user can self-serve on /plan.
//   5. Does any active feature carry a recurring coin-based activation
//      (fixFeeCoins) the user hasn't turned on? If so, the whole tool is
//      gated behind that — the caller renders an inline Activate card
//      (kind: 'activation_required') rather than being redirected away.
//   6. Otherwise, if the tool has coin-cost features, does the user hold a
//      valid (non-expired, non-zero) coin balance to get started? Per-use
//      sufficiency is still enforced later, at actual use time, via
//      /api/wallet/deduct — this only checks there's something to spend.
export async function resolveToolAccess(slug, { allowedRoles } = {}) {
  const tool = await getTool(slug)
  if (!tool) return { kind: 'not_found' }

  const payload = await getUserFromCookies()
  const loggedIn = !!payload?.userId

  if (tool.requiresLogin && !loggedIn) {
    return { kind: 'redirect', to: `/login?next=${encodeURIComponent(`/tools/${slug}/use`)}` }
  }

  // tool.requiresLogin is the only login gate on this page — a guest may
  // open any tool that doesn't require it, even if it has priced features
  // (per direct instruction). Activation/coin-balance checks below only run
  // for logged-in users; a signed-out visitor can't hold an activation or a
  // balance anyway, and per-use coin sufficiency for priced features is
  // still enforced separately at use-time by /api/wallet/deduct (which
  // requires auth), not here.
  if (!loggedIn) {
    return { kind: 'ok', tool }
  }

  const activeFeatures = (tool.features || []).filter((f) => f.isActive)
  const activationFeatures = activeFeatures.filter((f) => f.fixFeeCoins > 0)
  const coinFeatures = activeFeatures.filter((f) => f.coinCost > 0 && !(f.fixFeeCoins > 0))

  if (allowedRoles && !checkRole(payload, allowedRoles)) {
    return { kind: 'redirect', to: `/plan?tool=${slug}&reason=role` }
  }

  const access = await getUserToolsAccess(payload.userId, payload.role)
  if (!access.includes(slug)) {
    return { kind: 'access_denied', tool }
  }

  if (activationFeatures.length) {
    const activations = await getFeatureActivations(payload.userId, [slug])
    let inactiveFeature = null
    for (const f of activationFeatures) {
      if (activations.get(`${slug}::${f.apiIdentifier}`)?.isActive) continue
      if (await isWithinFreeStorageAllowance(slug, f, payload.userId)) continue
      inactiveFeature = f
      break
    }
    if (inactiveFeature) {
      return { kind: 'activation_required', tool, feature: inactiveFeature }
    }
    return { kind: 'ok', tool }
  }

  if (coinFeatures.length) {
    const validCoins = await hasValidCoinBalance(payload.userId)
    if (!validCoins) {
      return { kind: 'redirect', to: `/plan?tool=${slug}&reason=coins` }
    }
  }

  return { kind: 'ok', tool }
}
