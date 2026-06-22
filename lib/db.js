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

export async function createUser({ name, email, mobile, passwordHash, role = 'user' }) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, mobile, password_hash: passwordHash, role })
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
