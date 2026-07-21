import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars not set')
  return createClient(url, key)
}

// ─── Layout Settings (collections + singletons stored as JSONB) ───────────────

async function readSetting(name) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('layout_settings')
    .select('value')
    .eq('key', name)
    .single()
  if (error || !data) return null
  return data.value
}

async function writeSetting(name, value) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('layout_settings')
    .upsert({ key: name, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

// ─── List Collections ──────────────────────────────────────────────────────────

export async function getCollection(name) {
  const data = await readSetting(name)
  return Array.isArray(data) ? data : []
}

export async function getItem(name, id) {
  const items = await getCollection(name)
  return items.find((i) => i.id === id) ?? null
}

export async function createItem(name, data) {
  const { nanoid } = await import('nanoid')
  const item = { ...data, id: nanoid() }
  const items = await getCollection(name)
  items.unshift(item)
  await writeSetting(name, items)
  return item
}

export async function saveCollection(name, array) {
  await writeSetting(name, array)
}

export async function updateItem(name, id, data) {
  const items = await getCollection(name)
  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...data, id }
  await writeSetting(name, items)
  return items[idx]
}

export async function deleteItem(name, id) {
  const items = await getCollection(name)
  await writeSetting(name, items.filter((i) => i.id !== id))
}

// ─── Singleton Collections ─────────────────────────────────────────────────────

export async function getSingleton(name) {
  return (await readSetting(name)) ?? {}
}

export async function updateSingleton(name, data) {
  await writeSetting(name, data)
  return data
}

// ─── Seed helper ───────────────────────────────────────────────────────────────

export async function seedCollection(name, array) {
  await writeSetting(name, array)
  console.log(`✓ Seeded ${name} (${array.length} items)`)
}

export async function seedSingleton(name, obj) {
  await writeSetting(name, obj)
  console.log(`✓ Seeded singleton: ${name}`)
}

// ─── ISR-cached public reads ───────────────────────────────────────────────────

export function getCachedCollection(name) {
  return unstable_cache(() => getCollection(name), [name], {
    tags: [name],
    revalidate: 3600,
  })()
}

export function getCachedSingleton(name) {
  return unstable_cache(() => getSingleton(name), [name], {
    tags: [name],
    revalidate: 3600,
  })()
}

// ─── Users (separate table) ────────────────────────────────────────────────────

export async function getUserByEmail(email) {
  const supabase = getSupabase()
  const { data } = await supabase.from('users').select('*').eq('email', email).single()
  return data ?? null
}

export async function getUserByMobile(mobile) {
  const supabase = getSupabase()
  const { data } = await supabase.from('users').select('*').eq('mobile', mobile).single()
  return data ?? null
}

export async function getUserById(id) {
  const supabase = getSupabase()
  const { data } = await supabase.from('users').select('*').eq('id', id).single()
  return data ?? null
}

export async function createUser({
  name, email, mobile, passwordHash, role = 'user', companyId = null, otpEnabled = false,
  address1 = null, address2 = null, walletCreditsTotal = 0,
}) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('users')
    .insert({
      name, email, mobile, password_hash: passwordHash, role, company_id: companyId, otp_enabled: otpEnabled,
      address1, address2, wallet_credits_total: walletCreditsTotal,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUserPassword(userId, passwordHash) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

// Excludes master_admin rows — those are only ever managed via scripts/seed.mjs,
// never through the admin Users UI. Pass companyId to scope to one company
// (used by the company-scoped 'admin' role) and/or role to further narrow to
// a single role (the 'admin' role only ever manages plain 'user' accounts,
// never fellow admins).
export async function getAllUsers({ companyId, role } = {}) {
  const supabase = getSupabase()
  let query = supabase
    .from('users')
    .select('id,name,email,mobile,role,company_id,is_active,otp_enabled,address1,address2,wallet_credits_total,wallet_credits_used,created_at')
    .neq('role', 'master_admin')
    .order('created_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  if (role) query = query.eq('role', role)
  const { data } = await query
  return data ?? []
}

// Partial update for admin-managed users (name/email/mobile/role/company/status/otp).
export async function updateUser(id, updates) {
  const supabase = getSupabase()
  const patch = {}
  if ('name' in updates) patch.name = updates.name
  if ('email' in updates) patch.email = updates.email ? updates.email.toLowerCase().trim() : null
  if ('mobile' in updates) patch.mobile = updates.mobile || null
  if ('role' in updates) patch.role = updates.role
  if ('companyId' in updates) patch.company_id = updates.companyId
  if ('isActive' in updates) patch.is_active = updates.isActive
  if ('otpEnabled' in updates) patch.otp_enabled = updates.otpEnabled
  if ('address1' in updates) patch.address1 = updates.address1 || null
  if ('address2' in updates) patch.address2 = updates.address2 || null
  if ('addressCity' in updates) patch.address_city = updates.addressCity || null
  if ('addressState' in updates) patch.address_state = updates.addressState || null
  if ('addressCountry' in updates) patch.address_country = updates.addressCountry || null
  if ('addressPincode' in updates) patch.address_pincode = updates.addressPincode || null
  if ('businessName' in updates) patch.company_name = updates.businessName || null
  if ('gstNumber' in updates) patch.gst_number = updates.gstNumber || null
  if ('walletCreditsTotal' in updates) patch.wallet_credits_total = updates.walletCreditsTotal
  if ('walletCreditsUsed' in updates) patch.wallet_credits_used = updates.walletCreditsUsed
  patch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteUser(id) {
  const supabase = getSupabase()
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw error
}

// ─── OTP (separate table with 60s auto-delete via pg trigger) ─────────────────

export async function createOTP({ identifier, type, otpCode, purpose = 'reset_password' }) {
  const supabase = getSupabase()
  // Delete any existing OTP for this identifier + purpose first (doesn't touch
  // a pending OTP for a different purpose, e.g. login vs password reset)
  await supabase.from('user_otp').delete().eq('identifier', identifier).eq('purpose', purpose)
  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('user_otp')
    .insert({ identifier, type, otp_code: otpCode, purpose, expires_at: expiresAt })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function verifyOTP({ identifier, otpCode, purpose = 'reset_password' }) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('user_otp')
    .select('*')
    .eq('identifier', identifier)
    .eq('otp_code', otpCode)
    .eq('purpose', purpose)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single()
  if (!data) return false
  // Mark as used
  await supabase.from('user_otp').update({ used: true }).eq('id', data.id)
  return true
}

export async function deleteOTP(identifier) {
  const supabase = getSupabase()
  await supabase.from('user_otp').delete().eq('identifier', identifier)
}

// ─── Companies ────────────────────────────────────────────────────────────────

function toCompanySlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export async function getCompanyByEmail(email) {
  const supabase = getSupabase()
  const { data } = await supabase.from('companies').select('*').eq('email', email.toLowerCase().trim()).single()
  return data ?? null
}

export async function getCompanyById(id) {
  const supabase = getSupabase()
  const { data } = await supabase.from('companies').select('*').eq('id', id).single()
  return data ?? null
}

export async function getCompanyBySlug(slug) {
  const supabase = getSupabase()
  const { data } = await supabase.from('companies').select('*').eq('slug', slug).single()
  return data ?? null
}

export async function getAllCompanies() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('companies')
    .select('id,name,slug,email,phone,website,folder_id,is_active,created_at')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getUsersByCompany(companyId) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('users')
    .select('id,name,email,mobile,role,is_active,created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  return data ?? []
}

// Creates a company row. folderId must already be reserved before calling this.
export async function createCompany({ name, email, phone, website, address, folderId }) {
  const supabase = getSupabase()
  const slug = name ? toCompanySlug(name) : null
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: name || null,
      slug,
      email: email.toLowerCase().trim(),
      phone: phone || null,
      website: website || null,
      address: address || null,
      folder_id: folderId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Updates company details. If name changes, updates slug + folder_id.
// Returns { company, folderChanged, oldFolderId, newFolderId }
export async function updateCompany(id, updates) {
  const supabase = getSupabase()
  const current = await getCompanyById(id)
  if (!current) throw new Error('Company not found')

  const patch = {}
  if ('name' in updates) {
    patch.name = updates.name || null
    patch.slug = updates.name ? toCompanySlug(updates.name) : null
    // rename folder only when name changes and a new slug can be derived
    if (patch.slug && patch.slug !== current.slug) {
      patch.folder_id = patch.slug
    }
  }
  if ('email' in updates) patch.email = updates.email.toLowerCase().trim()
  if ('phone' in updates) patch.phone = updates.phone || null
  if ('website' in updates) patch.website = updates.website || null
  if ('address' in updates) patch.address = updates.address || null
  if ('is_active' in updates) patch.is_active = updates.is_active
  patch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('companies')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  const folderChanged = patch.folder_id && patch.folder_id !== current.folder_id
  return {
    company: data,
    folderChanged: !!folderChanged,
    oldFolderId: current.folder_id,
    newFolderId: patch.folder_id ?? current.folder_id,
  }
}

export async function deleteCompany(id) {
  const supabase = getSupabase()
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}

// ─── User Settings (per-user tools access, one row per user) ──────────────────

export async function getUserSettings(userId) {
  const supabase = getSupabase()
  const { data } = await supabase.from('user_settings').select('*').eq('user_id', userId).single()
  return data ?? null
}

export async function getAllUserSettingsMap() {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('user_settings').select('user_id, tools_access')
  if (error) throw error
  const map = {}
  for (const row of data ?? []) map[row.user_id] = row.tools_access
  return map
}

export async function upsertUserToolsAccess(userId, toolsAccess) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, tools_access: toolsAccess, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) throw error
  return toolsAccess
}

// Creates the default user_settings row for a newly created user, granting
// every tool available to their role (see data/tools.js defaultToolsAccessByRole).
export async function createUserSettings(userId, role = 'user') {
  const { defaultToolsAccessByRole } = await import('@/data/tools')
  const toolsAccess = defaultToolsAccessByRole[role] || defaultToolsAccessByRole.user
  return upsertUserToolsAccess(userId, toolsAccess)
}

// ─── Files Expiry (separate table) ───────────────────────────────────────────

export async function getAllFilesExpiry() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('files_expiry')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function insertManyFilesExpiry(items) {
  const { nanoid } = await import('nanoid')
  const supabase = getSupabase()
  const rows = items.map(({ name, expiryAt }) => ({
    id: nanoid(),
    name,
    expiry_at: expiryAt,
  }))
  const { data, error } = await supabase
    .from('files_expiry')
    .upsert(rows, { onConflict: 'name', ignoreDuplicates: false })
    .select()
  if (error) throw error
  return data ?? []
}

export async function deleteManyFilesExpiry(ids) {
  const supabase = getSupabase()
  const { error } = await supabase.from('files_expiry').delete().in('id', ids)
  if (error) throw error
}

export async function editOneFilesExpiry(id, { name, expiryAt }) {
  const supabase = getSupabase()
  const patch = {}
  if (name !== undefined) patch.name = name
  if (expiryAt !== undefined) patch.expiry_at = expiryAt
  const { data, error } = await supabase
    .from('files_expiry')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function editManyFilesExpiryDate(ids, expiryAt) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('files_expiry')
    .update({ expiry_at: expiryAt })
    .in('id', ids)
    .select()
  if (error) throw error
  return data ?? []
}

// ─── Tools (dedicated table — was a single JSONB blob under layout_settings)──
//
// The rich marketing content (features/hero/stats/steps/advantages/faqs) is
// only ever set at seed time — the admin CRUD form (ToolsAdminClient.jsx)
// only edits the flat fields below — so it's bundled into one `content`
// JSONB column instead of being split into more columns/tables. Every
// function here returns/accepts the same flattened shape the old
// getCollection('tools') items had, so no consuming page or API route needs
// to change how it reads a tool object.

const TOOLS_CONTENT_FIELDS = ['features', 'hero', 'stats', 'steps', 'advantages', 'faqs']

function toolRowToItem(row) {
  if (!row) return null
  const { content, short_desc, tool_url, requires_login, created_at, updated_at, ...rest } = row
  return {
    ...rest,
    shortDesc: short_desc,
    toolUrl: tool_url,
    requiresLogin: requires_login,
    ...(content || {}),
  }
}

function toolItemToRow(data) {
  const row = {}
  if ('slug' in data) row.slug = data.slug
  if ('title' in data) row.title = data.title
  if ('icon' in data) row.icon = data.icon ?? null
  if ('shortDesc' in data) row.short_desc = data.shortDesc ?? null
  if ('category' in data) row.category = data.category ?? null
  if ('badge' in data) row.badge = data.badge ?? null
  if ('toolUrl' in data) row.tool_url = data.toolUrl ?? null
  if ('requiresLogin' in data) row.requires_login = !!data.requiresLogin

  const content = {}
  let hasContent = false
  for (const key of TOOLS_CONTENT_FIELDS) {
    if (key in data) { content[key] = data[key]; hasContent = true }
  }
  if (hasContent) row.content = content

  return row
}

export async function getAllToolsFromDB() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toolRowToItem)
}

export async function getToolByIdFromDB(id) {
  const supabase = getSupabase()
  const { data } = await supabase.from('tools').select('*').eq('id', id).single()
  return toolRowToItem(data)
}

export async function getToolBySlugFromDB(slug) {
  const supabase = getSupabase()
  const { data } = await supabase.from('tools').select('*').eq('slug', slug).single()
  return toolRowToItem(data)
}

export async function createTool(data) {
  const { nanoid } = await import('nanoid')
  const supabase = getSupabase()
  const row = { id: nanoid(), ...toolItemToRow(data) }
  const { data: created, error } = await supabase.from('tools').insert(row).select().single()
  if (error) throw error
  return toolRowToItem(created)
}

export async function updateTool(id, data) {
  const supabase = getSupabase()
  const patch = { ...toolItemToRow(data), updated_at: new Date().toISOString() }

  // A partial content update (e.g. only `features` sent) must merge into the
  // existing JSONB blob, not replace it — otherwise hero/stats/steps/etc not
  // present in `data` would be silently wiped from the column.
  if (patch.content) {
    const { data: existing } = await supabase.from('tools').select('content').eq('id', id).single()
    patch.content = { ...(existing?.content || {}), ...patch.content }
  }

  const { data: updated, error } = await supabase
    .from('tools')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !updated) return null
  return toolRowToItem(updated)
}

export async function deleteTool(id) {
  const supabase = getSupabase()
  const { error } = await supabase.from('tools').delete().eq('id', id)
  if (error) throw error
}

// ─── Coin-Wallet Billing (coin_packages / wallet_topups / tools_usage_history) ─
// See plan/my-payment-management.md §1–§2. `users.wallet_credits_total` /
// `wallet_credits_used` (above) stay the single source of truth for balance;
// everything here either feeds those columns (via the RPC wrappers) or
// records history around them.

function coinPackageRowToItem(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    coins: row.coins,
    pricePaise: row.price_paise,
    badge: row.badge,
    validityDays: row.validity_days,
    isActive: row.is_active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAllCoinPackages({ activeOnly = false } = {}) {
  const supabase = getSupabase()
  let query = supabase.from('coin_packages').select('*').order('display_order', { ascending: true })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(coinPackageRowToItem)
}

export async function getCoinPackageById(id) {
  const supabase = getSupabase()
  const { data } = await supabase.from('coin_packages').select('*').eq('id', id).single()
  return coinPackageRowToItem(data)
}

export async function createCoinPackage({ name, coins, pricePaise, badge = null, validityDays = 365, isActive = true, displayOrder = 0 }) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('coin_packages')
    .insert({ name, coins, price_paise: pricePaise, badge, validity_days: validityDays, is_active: isActive, display_order: displayOrder })
    .select()
    .single()
  if (error) throw error
  return coinPackageRowToItem(data)
}

export async function updateCoinPackage(id, updates) {
  const supabase = getSupabase()
  const patch = { updated_at: new Date().toISOString() }
  if ('name' in updates) patch.name = updates.name
  if ('coins' in updates) patch.coins = updates.coins
  if ('pricePaise' in updates) patch.price_paise = updates.pricePaise
  if ('badge' in updates) patch.badge = updates.badge ?? null
  if ('validityDays' in updates) patch.validity_days = updates.validityDays
  if ('isActive' in updates) patch.is_active = updates.isActive
  if ('displayOrder' in updates) patch.display_order = updates.displayOrder

  const { data, error } = await supabase
    .from('coin_packages')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return null
  return coinPackageRowToItem(data)
}

export async function deleteCoinPackage(id) {
  const supabase = getSupabase()
  const { error } = await supabase.from('coin_packages').delete().eq('id', id)
  if (error) throw error
}

function topupRowToItem(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    coinPackageId: row.coin_package_id,
    packageName: row.package_name,
    amountPaise: row.amount_paise,
    coinsGranted: row.coins_granted,
    status: row.status,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    razorpaySignature: row.razorpay_signature,
    failureReason: row.failure_reason,
    validityDays: row.validity_days,
    expiresAt: row.expires_at,
    reconcileAttempts: row.reconcile_attempts,
    creditedAt: row.credited_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    purchaseType: row.purchase_type,
    toolSlug: row.tool_slug,
    featureApiIdentifier: row.feature_api_identifier,
  }
}

export async function createWalletTopup({
  userId, coinPackageId, packageName, amountPaise, coinsGranted, razorpayOrderId,
  validityDays = null, purchaseType = 'coin_topup', toolSlug = null, featureApiIdentifier = null,
}) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('wallet_topups')
    .insert({
      user_id: userId, coin_package_id: coinPackageId, package_name: packageName,
      amount_paise: amountPaise, coins_granted: coinsGranted, razorpay_order_id: razorpayOrderId,
      validity_days: validityDays, status: 'created',
      purchase_type: purchaseType, tool_slug: toolSlug, feature_api_identifier: featureApiIdentifier,
    })
    .select()
    .single()
  if (error) throw error
  return topupRowToItem(data)
}

// Soonest-to-furthest-out expiry doesn't apply here — this app doesn't track
// per-batch coin consumption (a deduct doesn't know which topup "batch" it
// drew from), so a single aggregate expiry is already a simplification. The
// most recent successful top-up's expiry is what's shown on the Profile
// banner as "valid until" — each new top-up naturally pushes this forward.
export async function getLatestWalletExpiry(userId) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('wallet_topups')
    .select('expires_at')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .not('expires_at', 'is', null)
    .order('expires_at', { ascending: false })
    .limit(1)
    .single()
  return data?.expires_at ?? null
}

// "Has enough to get started" check for the tool-use access gate (see
// lib/toolAccess.js) — same balance math as lib/profile.js's serializeProfile
// (wallet_credits_total - wallet_credits_used), plus the expiry rule
// getLatestWalletExpiry already encodes. Not the per-call sufficiency check —
// that stays deduct_wallet_coins's job inside /api/wallet/deduct.
export async function hasValidCoinBalance(userId) {
  const user = await getUserById(userId)
  if (!user) return false
  const remaining = (user.wallet_credits_total ?? 0) - (user.wallet_credits_used ?? 0)
  if (remaining <= 0) return false
  const expiresAt = await getLatestWalletExpiry(userId)
  return !expiresAt || new Date(expiresAt) > new Date()
}

export async function getWalletTopupByOrderId(orderId) {
  const supabase = getSupabase()
  const { data } = await supabase.from('wallet_topups').select('*').eq('razorpay_order_id', orderId).single()
  return topupRowToItem(data)
}

// Orders stuck in 'created' status, old enough that the normal client-verify
// call + webhook have both had a fair chance to land, and not yet at the
// reconciliation attempt cap. Pass userId to scope to one user (the
// post-login check); omitted, sweeps every user's stale orders (the cron
// job) — see lib/paymentReconciliation.js for what actually resolves them.
export async function getStalePendingTopups({ userId, minAgeSeconds = 20, maxAttempts = 3, limit = 100 } = {}) {
  const supabase = getSupabase()
  const cutoff = new Date(Date.now() - minAgeSeconds * 1000).toISOString()
  let query = supabase
    .from('wallet_topups')
    .select('*')
    .eq('status', 'created')
    .lt('reconcile_attempts', maxAttempts)
    .lte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(topupRowToItem)
}

// Caller passes the new count (it already has the current row from
// getStalePendingTopups, so it's just reconcileAttempts + 1) rather than this
// function re-reading and incrementing — keeps this a single plain UPDATE.
export async function setTopupReconcileAttempts(id, attempts) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('wallet_topups')
    .update({ reconcile_attempts: attempts, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function getWalletTopupsForUser(userId, { limit = 100 } = {}) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('wallet_topups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(topupRowToItem)
}

// Admin cross-user ledger — pass userIds to scope to a company (resolved by
// the caller via getAllUsers({companyId}) first, same pattern as usage history).
export async function getAllWalletTopups({ userIds, status, limit = 500 } = {}) {
  const supabase = getSupabase()
  let query = supabase.from('wallet_topups').select('*').order('created_at', { ascending: false }).limit(limit)
  if (userIds?.length) query = query.in('user_id', userIds)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(topupRowToItem)
}

export async function markWalletTopupFailed(orderId, reason) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('wallet_topups')
    .update({ status: 'failed', failure_reason: reason, updated_at: new Date().toISOString() })
    .eq('razorpay_order_id', orderId)
  if (error) throw error
}

// Batch lookup for /api/tools/my — one query for every tool the user has
// access to, returned as a Set of `${toolSlug}::${featureApiIdentifier}` for
// O(1) membership checks while enriching the response.
export async function getPaidFeatureFeeKeys(userId, toolSlugs) {
  if (!toolSlugs?.length) return new Set()
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('wallet_topups')
    .select('tool_slug, feature_api_identifier')
    .eq('user_id', userId)
    .eq('purchase_type', 'tool_fee')
    .eq('status', 'paid')
    .in('tool_slug', toolSlugs)
  if (error) throw error
  return new Set((data ?? []).map((row) => `${row.tool_slug}::${row.feature_api_identifier}`))
}

// Single-key existence check — the authoritative server-side gate used by
// POST /api/wallet/deduct (see plan/tools-pricing-cut-paln.md's security note).
export async function hasUserPaidFeatureFee(userId, toolSlug, featureApiIdentifier) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('wallet_topups')
    .select('id')
    .eq('user_id', userId)
    .eq('purchase_type', 'tool_fee')
    .eq('status', 'paid')
    .eq('tool_slug', toolSlug)
    .eq('feature_api_identifier', featureApiIdentifier)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return !!data
}

function usageRowToItem(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    toolId: row.tool_id,
    toolSlug: row.tool_slug,
    featureId: row.feature_id,
    featureApiIdentifier: row.feature_api_identifier,
    featureTitle: row.feature_title,
    coinsCost: row.coins_cost,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
  }
}

export async function getUsageHistoryForUser(userId, { limit = 100 } = {}) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('tools_usage_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(usageRowToItem)
}

// Admin cross-user usage feed — pass userIds to scope to a company.
export async function getAllUsageHistory({ userIds, toolSlug, limit = 500 } = {}) {
  const supabase = getSupabase()
  let query = supabase.from('tools_usage_history').select('*').order('created_at', { ascending: false }).limit(limit)
  if (userIds?.length) query = query.in('user_id', userIds)
  if (toolSlug) query = query.eq('tool_slug', toolSlug)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(usageRowToItem)
}

// Powers the Customer Dashboard cross-customer "tools/features usage" report —
// groups by (tool_slug, feature_api_identifier), summing coins and counting
// distinct users. Supabase's JS builder has no GROUP BY, so this reduces
// client-side over the filtered row set (fine at this admin-report scale).
export async function getUsageHistoryGroupedByFeature({ userIds, from, to } = {}) {
  const supabase = getSupabase()
  let query = supabase
    .from('tools_usage_history')
    .select('tool_slug, feature_api_identifier, feature_title, coins_cost, user_id, created_at')
  if (userIds?.length) query = query.in('user_id', userIds)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  const { data, error } = await query
  if (error) throw error

  const groups = new Map()
  for (const row of data ?? []) {
    const key = `${row.tool_slug}::${row.feature_api_identifier}`
    if (!groups.has(key)) {
      groups.set(key, {
        toolSlug: row.tool_slug,
        featureApiIdentifier: row.feature_api_identifier,
        featureTitle: row.feature_title,
        totalCoins: 0,
        fireCount: 0,
        userIds: new Set(),
      })
    }
    const g = groups.get(key)
    g.totalCoins += row.coins_cost
    g.fireCount += 1
    g.userIds.add(row.user_id)
  }

  return Array.from(groups.values())
    .map(({ userIds: ids, ...g }) => ({ ...g, uniqueUsers: ids.size }))
    .sort((a, b) => b.totalCoins - a.totalCoins)
}

// Small helper so admin history tables can join in user names client-side,
// same pattern as companyLabel() in app/settings/users/page.js.
export async function getUsersByIds(ids) {
  if (!ids?.length) return []
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('users')
    .select('id,name,email,mobile,company_id')
    .in('id', ids)
  if (error) throw error
  return data ?? []
}

// ─── Atomic RPC wrappers (the correctness-critical piece — see §1's SQL) ──────

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
