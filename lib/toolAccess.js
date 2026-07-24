import { getUserFromCookies } from '@/lib/auth'
import { getTool, getUserToolsAccess } from '@/lib/tools'

// Single server-side gate for /tools/[slug]/use — decides, in order:
//   1. Does the tool exist?
//   2. Does it require login, and if so, is there a valid session? If the
//      tool doesn't require login and the visitor is signed out, access is
//      granted immediately here.
//   3. Has this user been granted the tool (user_settings.tools_access)? If
//      not, the caller renders an inline "contact your admin" notice
//      (kind: 'access_denied').
// Fee/activation/coin-balance are deliberately NOT pre-checked here — that's
// all enforced per-use by /api/wallet/deduct (the tool apps' one and only
// billing enforcement point), and recurring-feature activation is a
// self-service action on /settings/plan (FeatureActivationPanel), not
// something that should block opening the tool at all. Gating the whole
// tool upfront just because one feature carries a fee blocked genuinely free
// features on the same tool for no reason.
export async function resolveToolAccess(slug) {
  const tool = await getTool(slug)
  if (!tool) return { kind: 'not_found' }

  const payload = await getUserFromCookies()
  const loggedIn = !!payload?.userId

  if (tool.requiresLogin && !loggedIn) {
    return { kind: 'redirect', to: `/login?next=${encodeURIComponent(`/tools/${slug}/use`)}` }
  }

  if (!loggedIn) {
    return { kind: 'ok', tool }
  }

  const access = await getUserToolsAccess(payload.userId, payload.role)
  if (!access.includes(slug)) {
    return { kind: 'access_denied', tool }
  }

  return { kind: 'ok', tool }
}
