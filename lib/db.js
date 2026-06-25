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

export async function createUser({ name, email, mobile, passwordHash, role = 'user', companyId = null }) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, mobile, password_hash: passwordHash, role, company_id: companyId })
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

export async function getAllUsers() {
  const supabase = getSupabase()
  const { data } = await supabase.from('users').select('id,name,email,mobile,role,is_active,created_at').order('created_at', { ascending: false })
  return data ?? []
}

// ─── OTP (separate table with 60s auto-delete via pg trigger) ─────────────────

export async function createOTP({ identifier, type, otpCode }) {
  const supabase = getSupabase()
  // Delete any existing OTP for this identifier first
  await supabase.from('user_otp').delete().eq('identifier', identifier)
  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('user_otp')
    .insert({ identifier, type, otp_code: otpCode, expires_at: expiresAt })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function verifyOTP({ identifier, otpCode }) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('user_otp')
    .select('*')
    .eq('identifier', identifier)
    .eq('otp_code', otpCode)
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
