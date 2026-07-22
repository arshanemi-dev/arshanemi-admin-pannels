import { getUserFromCookies } from '@/lib/auth'
import { getTool, getUserToolsAccess } from '@/lib/tools'
import { getFeatureActivations, hasValidCoinBalance } from '@/lib/db'

// Generic per-call role allowlist — not tied to any stored per-tool field.
// Pass allowedRoles to restrict a check to specific roles; omit it (or pass
// an empty list) to let every role through untouched.
export function checkRole(payload, allowedRoles) {
  if (!allowedRoles?.length) return true
  return !!payload && allowedRoles.includes(payload.role)
}

// Single server-side gate for /tools/[slug]/use — decides, in order:
//   1. Does the tool exist?
//   2. Does it require login, and if so, is there a valid session?
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

  const activeFeatures = (tool.features || []).filter((f) => f.isActive)
  const activationFeatures = activeFeatures.filter((f) => f.fixFeeCoins > 0)
  const coinFeatures = activeFeatures.filter((f) => f.coinCost > 0 && !(f.fixFeeCoins > 0))

  if (!loggedIn) {
    // Can't check "already activated" or hold a coin balance without an
    // account — but unlike the requiresLogin branch above, this tool never
    // actually demanded login (its own config says requiresLogin: false); it
    // just happens to have a priced feature an anonymous visitor can't use.
    // That's a "you're logged out" state, not a "this tool requires an
    // account" state, so send them back to / rather than forcing a login flow.
    if (activationFeatures.length || coinFeatures.length) {
      return { kind: 'redirect', to: '/' }
    }
    return { kind: 'ok', tool }
  }

  if (allowedRoles && !checkRole(payload, allowedRoles)) {
    return { kind: 'redirect', to: `/plan?tool=${slug}&reason=role` }
  }

  const access = await getUserToolsAccess(payload.userId, payload.role)
  if (!access.includes(slug)) {
    return { kind: 'access_denied', tool }
  }

  if (activationFeatures.length) {
    const activations = await getFeatureActivations(payload.userId, [slug])
    const inactiveFeature = activationFeatures.find((f) => !activations.get(`${slug}::${f.apiIdentifier}`)?.isActive)
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
