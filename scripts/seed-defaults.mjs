/**
 * Arshanemi — Default Company & Admin Accounts Seed Script
 *
 * Idempotent: safe to run repeatedly. Creates the default tenant company
 * (if it doesn't already exist by email), then upserts the master admin and
 * a company-scoped admin account for it, using the constants in
 * data/default.js.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-defaults.mjs
 *   npm run seed:defaults
 */

import { createClient } from '@supabase/supabase-js'
import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href)

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
    process.exit(1)
  }
  return createClient(url, key)
}

function toCompanySlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

async function seedUserSettings(supabase, defaultToolsAccessByRole, user, role) {
  if (!user) return
  const toolsAccess = defaultToolsAccessByRole[role] || defaultToolsAccessByRole.user
  const { error } = await supabase.from('user_settings').upsert(
    { user_id: user.id, tools_access: toolsAccess, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) console.warn(`  ⚠ user_settings for ${user.email}:`, error.message)
  else console.log(`  ✓ user_settings for ${user.email} (${toolsAccess.length} tools)`)
}

async function main() {
  console.log('\n🌱  Arshanemi — Default Company & Admins Seed\n')

  const supabase = getSupabase()
  const { DEFAULT_COMPANY, MASTER_ADMIN, DEFAULT_COMPANY_ADMIN } = await imp('data/default.js')
  const { defaultToolsAccessByRole } = await imp('data/tools.js')

  // ── 1. Default company ──────────────────────────────────────────────────────
  console.log('🏢  Ensuring default company...\n')

  const companyEmail = DEFAULT_COMPANY.email.toLowerCase().trim()
  let { data: company } = await supabase.from('companies').select('*').eq('email', companyEmail).single()

  if (!company) {
    const slug = toCompanySlug(DEFAULT_COMPANY.name)
    const folderId = slug || `co_${nanoid(8)}`
    const { data: created, error } = await supabase
      .from('companies')
      .insert({
        name: DEFAULT_COMPANY.name,
        slug,
        email: companyEmail,
        phone: DEFAULT_COMPANY.phone || null,
        website: DEFAULT_COMPANY.website || null,
        address: DEFAULT_COMPANY.address || null,
        folder_id: folderId,
      })
      .select()
      .single()
    if (error) { console.error('❌ Could not create default company:', error.message); process.exit(1) }
    company = created
    console.log(`  ✓ Created company "${company.name}" (${company.email})`)

    try {
      const { initCompanyFolders } = await imp('lib/media.js')
      await initCompanyFolders(folderId)
      console.log(`  ✓ Initialised blob storage folders for "${folderId}"`)
    } catch (err) {
      console.warn('  ⚠ Could not initialise blob storage folders (Vercel Blob not configured?):', err.message)
    }
  } else {
    console.log(`  ✓ Company "${company.name}" already exists (${company.email})`)
  }

  // ── 2. Master admin ─────────────────────────────────────────────────────────
  console.log('\n👤  Ensuring master admin...\n')

  const masterAdminHash = await bcrypt.hash(MASTER_ADMIN.password, 10)
  const { data: masterAdmin, error: masterAdminErr } = await supabase
    .from('users')
    .upsert(
      {
        name: MASTER_ADMIN.name,
        email: MASTER_ADMIN.email.toLowerCase().trim(),
        password_hash: masterAdminHash,
        role: 'master_admin',
        is_active: true,
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )
    .select()
    .single()
  if (masterAdminErr) console.warn('  ⚠ Master admin:', masterAdminErr.message)
  else console.log(`  ✓ ${masterAdmin.email}  (${MASTER_ADMIN.password})`)

  // ── 3. Company admin ─────────────────────────────────────────────────────────
  console.log('\n👤  Ensuring company admin...\n')

  const adminHash = await bcrypt.hash(DEFAULT_COMPANY_ADMIN.password, 10)
  const { data: companyAdmin, error: companyAdminErr } = await supabase
    .from('users')
    .upsert(
      {
        name: DEFAULT_COMPANY_ADMIN.name,
        email: DEFAULT_COMPANY_ADMIN.email.toLowerCase().trim(),
        password_hash: adminHash,
        role: 'admin',
        company_id: company.id,
        is_active: true,
        // otp_enabled intentionally omitted — defaults to FALSE at the DB
        // level once scripts/otp_enabled_migration.sql has been run; omitting
        // it here keeps this script working before that migration too.
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )
    .select()
    .single()
  if (companyAdminErr) console.warn('  ⚠ Company admin:', companyAdminErr.message)
  else console.log(`  ✓ ${companyAdmin.email}  (${DEFAULT_COMPANY_ADMIN.password})  — role: admin, company: ${company.name}`)

  // ── 4. Default tools access for both ────────────────────────────────────────
  console.log('\n🔧  Ensuring default tools access...\n')

  await seedUserSettings(supabase, defaultToolsAccessByRole, masterAdmin, 'master_admin')
  await seedUserSettings(supabase, defaultToolsAccessByRole, companyAdmin, 'admin')

  console.log('\n✅  Done — default company and admin accounts are ready!')
  console.log('   ⚠️  These use default passwords from data/default.js — change them after first login.\n')
}

main().catch((err) => {
  console.error('\n❌  Seed failed:', err)
  process.exit(1)
})
