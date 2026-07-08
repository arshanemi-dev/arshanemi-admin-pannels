import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envText = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '')
}

const BASE = 'http://localhost:3000'
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

let pass = 0, fail = 0
function check(label, cond, extra = '') {
  if (cond) { pass++; console.log(`  OK   ${label}`) }
  else { fail++; console.log(`  FAIL ${label} ${extra}`) }
}

async function getOtp(identifier, purpose) {
  const { data } = await supabase
    .from('user_otp')
    .select('*')
    .eq('identifier', identifier)
    .eq('purpose', purpose)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data?.otp_code
}

function cookieHeader(setCookieArr) {
  return (setCookieArr || []).map((c) => c.split(';')[0]).join('; ')
}

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  let json = null
  try { json = await res.json() } catch {}
  return { status: res.status, json }
}

async function loginForCookie(identifier, password, otpCode) {
  const body = otpCode ? { identifier, otpCode } : { identifier, password }
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : []
  const json = await res.json().catch(() => ({}))
  return { cookie: cookieHeader(setCookie), json }
}

async function getPage(path, cookie) {
  return fetch(BASE + path, { headers: { Cookie: cookie }, redirect: 'manual' })
}

async function main() {
  console.log('\n=== 1. master_admin login (password step -> OTP) ===')
  let r = await req('/api/auth/login', { method: 'POST', body: { identifier: 'arshanemi@gmail.com', password: 'Admin@1234' } })
  check('password step returns otpRequired', r.json?.otpRequired === true, JSON.stringify(r.json))

  const otp1 = await getOtp('arshanemi@gmail.com', 'login_otp')
  check('otp row found in DB', !!otp1)

  r = await req('/api/auth/login', { method: 'POST', body: { identifier: 'arshanemi@gmail.com', otpCode: otp1 } })
  check('otp step returns accessToken', !!r.json?.accessToken, JSON.stringify(r.json))
  const masterToken = r.json?.accessToken

  console.log('\n=== 2. GET /api/auth/me as master_admin ===')
  r = await req('/api/auth/me', { token: masterToken })
  check('me returns master_admin role', r.json?.role === 'master_admin', JSON.stringify(r.json))

  console.log('\n=== 3. Create two temp test companies ===')
  const stamp = Date.now()
  r = await req('/api/admin/companies', { method: 'POST', token: masterToken, body: { name: 'QA Smoke Test Co', email: `qa-smoke-${stamp}@example.com` } })
  check('company A created', r.status === 201, JSON.stringify(r.json))
  const companyA = r.json?.company

  r = await req('/api/admin/companies', { method: 'POST', token: masterToken, body: { name: 'QA Smoke Test Co 2', email: `qa-smoke2-${stamp}@example.com` } })
  check('company B created', r.status === 201, JSON.stringify(r.json))
  const companyB = r.json?.company

  console.log('\n=== 4. Create admin user in company A ===')
  const adminEmail = `qa-admin-${stamp}@example.com`
  r = await req('/api/admin/users', { method: 'POST', token: masterToken, body: { name: 'QA Admin', email: adminEmail, password: 'Qwerty1!', role: 'admin', companyId: companyA.id, otpEnabled: false } })
  check('admin user created', r.status === 201, JSON.stringify(r.json))
  const adminUser = r.json

  console.log('\n=== 5. Create a foreign user in company B (to test cross-company isolation) ===')
  const foreignEmail = `qa-foreign-${stamp}@example.com`
  r = await req('/api/admin/users', { method: 'POST', token: masterToken, body: { name: 'QA Foreign', email: foreignEmail, password: 'Qwerty1!', role: 'user', companyId: companyB.id, otpEnabled: false } })
  check('foreign user created', r.status === 201, JSON.stringify(r.json))
  const foreignUser = r.json

  console.log('\n=== 6. master_admin cannot be created via API ===')
  r = await req('/api/admin/users', { method: 'POST', token: masterToken, body: { name: 'Sneaky', email: `qa-sneaky-${stamp}@example.com`, password: 'Qwerty1!', role: 'master_admin', companyId: companyA.id } })
  check('role=master_admin rejected', r.status === 400, JSON.stringify(r.json))

  console.log('\n=== 7. Login as the admin user (no OTP, otpEnabled=false) ===')
  r = await req('/api/auth/login', { method: 'POST', body: { identifier: adminEmail, password: 'Qwerty1!' } })
  check('admin login succeeds directly (no OTP)', !!r.json?.accessToken, JSON.stringify(r.json))
  check('admin role in response', r.json?.user?.role === 'admin')
  const adminToken = r.json?.accessToken

  console.log('\n=== 8. Admin cannot access master-only endpoint ===')
  r = await req('/api/admin/companies', { token: adminToken })
  check('admin gets 401 on companies list', r.status === 401, `status=${r.status}`)

  console.log('\n=== 9. Admin creates a plain user; role/companyId spoofing is ignored ===')
  const userEmail = `qa-user-${stamp}@example.com`
  r = await req('/api/admin/users', { method: 'POST', token: adminToken, body: { name: 'QA User', email: userEmail, password: 'Qwerty1!', role: 'master_admin', companyId: companyB.id, otpEnabled: false } })
  check('user created (201) despite spoofed role/companyId', r.status === 201, JSON.stringify(r.json))
  check('role forced to user', r.json?.role === 'user', JSON.stringify(r.json))
  check("companyId forced to admin's own company (A, not spoofed B)", r.json?.companyId === companyA.id, JSON.stringify(r.json))
  const plainUser = r.json

  console.log('\n=== 10. Admin\'s users list is scoped to own company only ===')
  r = await req('/api/admin/users', { token: adminToken })
  check('list has exactly 2 users (admin + plain user), no foreign user', Array.isArray(r.json) && r.json.length === 2 && !r.json.some((u) => u.id === foreignUser.id), `len=${r.json?.length}`)
  check('no master_admin leaked into list', !r.json.some((u) => u.role === 'master_admin'))

  console.log('\n=== 11. Cross-company isolation: admin cannot see/edit/delete the foreign user ===')
  r = await req(`/api/admin/users/${foreignUser.id}`, { method: 'PATCH', token: adminToken, body: { name: 'Hacked' } })
  check('PATCH foreign user -> 404', r.status === 404, `status=${r.status}`)
  r = await req(`/api/admin/users/${foreignUser.id}`, { method: 'DELETE', token: adminToken })
  check('DELETE foreign user -> 404', r.status === 404, `status=${r.status}`)
  r = await req(`/api/admin/users/${foreignUser.id}/password`, { method: 'PATCH', token: adminToken, body: { password: 'Whatever1!' } })
  check('PATCH foreign user password -> 404', r.status === 404, `status=${r.status}`)

  console.log('\n=== 12. Admin edits the plain user; role/company edits are ignored ===')
  r = await req(`/api/admin/users/${plainUser.id}`, { method: 'PATCH', token: adminToken, body: { name: 'QA User Renamed', role: 'admin', companyId: companyB.id } })
  check('edit succeeds', r.status === 200, JSON.stringify(r.json))
  check('name updated', r.json?.name === 'QA User Renamed')
  check('role NOT changed by admin', r.json?.role === 'user', JSON.stringify(r.json))
  check('companyId NOT changed by admin', r.json?.companyId === companyA.id, JSON.stringify(r.json))

  console.log('\n=== 13. Admin sets a direct password for the plain user; they can log in with it ===')
  r = await req(`/api/admin/users/${plainUser.id}/password`, { method: 'PATCH', token: adminToken, body: { password: 'NewPass1!' } })
  check('password set', r.status === 200, JSON.stringify(r.json))
  r = await req('/api/auth/login', { method: 'POST', body: { identifier: userEmail, password: 'NewPass1!' } })
  check('plain user logs in with admin-set password', !!r.json?.accessToken, JSON.stringify(r.json))

  console.log('\n=== 14. Toggle otp_enabled on the plain user; login now requires OTP ===')
  r = await req(`/api/admin/users/${plainUser.id}`, { method: 'PATCH', token: adminToken, body: { otpEnabled: true } })
  check('otpEnabled turned on', r.json?.otpEnabled === true, JSON.stringify(r.json))
  r = await req('/api/auth/login', { method: 'POST', body: { identifier: userEmail, password: 'NewPass1!' } })
  check('login now returns otpRequired for this user', r.json?.otpRequired === true, JSON.stringify(r.json))
  const otp2 = await getOtp(userEmail, 'login_otp')
  check('otp generated for plain user login', !!otp2)
  r = await req('/api/auth/login', { method: 'POST', body: { identifier: userEmail, otpCode: otp2 } })
  check('otp login completes', !!r.json?.accessToken, JSON.stringify(r.json))
  const userToken = r.json?.accessToken

  console.log('\n=== 15. Profile endpoint (/api/auth/me) per role ===')
  r = await req('/api/auth/me', { token: adminToken })
  check('admin profile shows companyName', r.json?.companyName === 'QA Smoke Test Co', JSON.stringify(r.json))
  r = await req('/api/auth/me', { token: userToken })
  check('user profile shows otpEnabled true', r.json?.otpEnabled === true, JSON.stringify(r.json))

  console.log('\n=== 16. OTP-based self-service password reset (Profile / login "Forgot password" flow) ===')
  r = await req('/api/auth/send-otp', { method: 'POST', body: { identifier: userEmail, type: 'email' } })
  check('send-otp ok', r.status === 200, JSON.stringify(r.json))
  const otp3 = await getOtp(userEmail, 'reset_password')
  check('reset OTP generated', !!otp3)
  r = await req('/api/auth/verify-otp', { method: 'POST', body: { identifier: userEmail, otpCode: otp3 } })
  check('verify-otp returns resetToken', !!r.json?.resetToken, JSON.stringify(r.json))
  r = await req('/api/auth/reset-password', { method: 'POST', body: { token: r.json.resetToken, password: 'FinalPass1!' } })
  check('reset-password ok', r.status === 200, JSON.stringify(r.json))

  console.log('\n=== 17. Page-level gating (HTML routes, cookie sessions) ===')
  const adminLogin = await loginForCookie(adminEmail, 'Qwerty1!')
  let page = await getPage('/admin', adminLogin.cookie)
  check('admin GET /admin redirects (307/308)', [307, 308].includes(page.status), `status=${page.status}`)
  check('redirect target is /admin/users', (page.headers.get('location') || '').includes('/admin/users'))

  page = await getPage('/admin/companies', adminLogin.cookie)
  check('admin GET /admin/companies is 404', page.status === 404, `status=${page.status}`)

  page = await getPage('/admin/users', adminLogin.cookie)
  check('admin GET /admin/users is 200', page.status === 200, `status=${page.status}`)

  page = await getPage('/admin/profile', adminLogin.cookie)
  check('admin GET /admin/profile is 200', page.status === 200, `status=${page.status}`)

  // plain user now has otp_enabled=true and password FinalPass1! (post step 16)
  let p = await loginForCookie(userEmail, 'FinalPass1!')
  check('plain user password step returns otpRequired (cookie flow)', p.json?.otpRequired === true, JSON.stringify(p.json))
  const otp4 = await getOtp(userEmail, 'login_otp')
  const userLogin = await loginForCookie(userEmail, undefined, otp4)
  check('plain user cookie login completes', !!userLogin.cookie)

  page = await getPage('/admin', userLogin.cookie)
  check('user GET /admin redirects to /admin/profile', (page.headers.get('location') || '').includes('/admin/profile'), `status=${page.status}`)

  page = await getPage('/admin/users', userLogin.cookie)
  check('user GET /admin/users is 404', page.status === 404, `status=${page.status}`)

  page = await getPage('/admin/profile', userLogin.cookie)
  check('user GET /admin/profile is 200', page.status === 200, `status=${page.status}`)

  console.log('\n=== 18. Cleanup: delete all QA test records ===')
  r = await req(`/api/admin/users/${plainUser.id}`, { method: 'DELETE', token: masterToken })
  check('deleted plain user', r.status === 200)
  r = await req(`/api/admin/users/${adminUser.id}`, { method: 'DELETE', token: masterToken })
  check('deleted admin user', r.status === 200)
  r = await req(`/api/admin/users/${foreignUser.id}`, { method: 'DELETE', token: masterToken })
  check('deleted foreign user', r.status === 200)
  r = await req(`/api/admin/companies/${companyA.id}`, { method: 'DELETE', token: masterToken })
  check('deleted test company A', r.status === 200)
  r = await req(`/api/admin/companies/${companyB.id}`, { method: 'DELETE', token: masterToken })
  check('deleted test company B', r.status === 200)

  console.log(`\n\n${pass} passed, ${fail} failed\n`)
  process.exit(fail ? 1 : 0)
}

main().catch((err) => { console.error(err); process.exit(1) })
