/**
 * Arshanemi — PostgreSQL Seed Script
 * Seeds all content into Supabase layout_settings table + creates default users.
 *
 * Usage:
 *   node --env-file=.env scripts/seed.mjs
 *   npm run seed
 */

import { createClient } from '@supabase/supabase-js'
import { fileURLToPath, pathToFileURL } from 'url'
import { createHash } from 'crypto'
import path from 'path'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href)

// ─── Supabase client ─────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
    process.exit(1)
  }
  return createClient(url, key)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function upsertSetting(supabase, key, value) {
  const { error } = await supabase
    .from('layout_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw new Error(`Failed to upsert ${key}: ${error.message}`)
  const count = Array.isArray(value) ? `${value.length} items` : 'singleton'
  console.log(`  ✓ ${key} (${count})`)
}

async function seedList(supabase, name, array) {
  await upsertSetting(supabase, name, array)
}

async function seedSingleton(supabase, name, obj) {
  await upsertSetting(supabase, name, obj)
}

// ─── nanoid shim ─────────────────────────────────────────────────────────────

async function nid() {
  const { nanoid } = await import('nanoid')
  return nanoid()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Arshanemi — PostgreSQL Seed\n')

  const supabase = getSupabase()

  // ── Import data files ───────────────────────────────────────────────────────
  const { services }        = await imp('data/services.js')
  const { industries }      = await imp('data/industries.js')
  const { blogs }           = await imp('data/blogs.js')
  const { caseStudies }     = await imp('data/caseStudies.js')
  const { testimonials }    = await imp('data/testimonials.js')
  const { team }            = await imp('data/team.js')
  const { faqs }            = await imp('data/faqs.js')
  const { partners }        = await imp('data/partners.js')
  const { openings, perks } = await imp('data/careers.js')
  const { seoPackages }     = await imp('data/seoPackages.js')
  const { tools }           = await imp('data/tools.js')

  const {
    COMPANY_EMAIL, COMPANY_PHONE_PRIMARY, COMPANY_PHONE_SECONDARY,
    COMPANY_WHATSAPP, COMPANY_ADDRESS, COMPANY_HOURS, COMPANY_NAME,
  } = await imp('data/company.js')

  const { stats }                                         = await imp('data/stats.js')
  const { trustBadges }                                   = await imp('data/badges.js')
  const { heroBullets, heroMetrics }                      = await imp('data/heroContent.js')
  const { processSteps, seoProcess }                      = await imp('data/process.js')
  const { aboutValues, aboutServices, whyUs, aboutStats } = await imp('data/about.js')
  const { navLinks, footerLinks, socialLinks }            = await imp('data/navigation.js')
  const { defaultToolsAccessByRole }                      = await imp('data/tools.js')

  // ── List collections ────────────────────────────────────────────────────────
  console.log('📦  Seeding list collections...\n')

  await seedList(supabase, 'services',
    await Promise.all(services.map(async (s) => ({ ...s, id: await nid() }))))

  await seedList(supabase, 'tools',
    await Promise.all(tools.map(async (t) => ({ ...t, id: await nid() }))))

  await seedList(supabase, 'industries',
    await Promise.all(industries.map(async (i) => ({ ...i, id: await nid() }))))

  const blogsWithIds = await Promise.all(
    blogs.map(async (post) => ({ ...post, id: await nid(), status: 'published' }))
  )
  await seedList(supabase, 'blogs', blogsWithIds)

  // Blog categories from blogs
  const categoryMap = new Map()
  blogs.forEach((b) => {
    if (b.category?.slug && !categoryMap.has(b.category.slug))
      categoryMap.set(b.category.slug, b.category)
  })
  const blogCategories = await Promise.all(
    [...categoryMap.values()].map(async (cat) => ({
      id: await nid(), slug: cat.slug, name: cat.name, numericId: cat.id,
      thumbnailBg: 'bg-gradient-to-br from-orange-900/60 to-amber-800/40',
    }))
  )
  await seedList(supabase, 'blog-categories', blogCategories)

  await seedList(supabase, 'case-studies',
    await Promise.all(caseStudies.map(async (cs) => ({ ...cs, id: await nid(), image: null }))))

  await seedList(supabase, 'testimonials',
    await Promise.all(testimonials.map(async (t) => ({ ...t, id: await nid(), avatar: null }))))

  await seedList(supabase, 'team',
    await Promise.all(team.map(async (m) => ({ ...m, id: await nid(), photo: null }))))

  await seedList(supabase, 'faqs',
    await Promise.all(faqs.map(async (f) => ({ ...f, id: await nid() }))))

  await seedList(supabase, 'partners',
    await Promise.all(partners.map(async (p) => ({ ...p, id: await nid() }))))

  const careersItems = [
    ...( (openings || []).map(async (o) => nid().then((id) => ({ ...o, id, type: 'opening' }))) ),
    ...( (perks || []).map(async (p) => nid().then((id) => ({ ...p, id, type: 'perk' }))) ),
  ]
  await seedList(supabase, 'careers', await Promise.all(careersItems))

  await seedList(supabase, 'seo-packages',
    await Promise.all(seoPackages.map(async (p) => ({ ...p, id: await nid() }))))

  // ── Singletons ──────────────────────────────────────────────────────────────
  console.log('\n⚙️   Seeding singletons...\n')

  await seedSingleton(supabase, 'company', {
    name: COMPANY_NAME,
    email: COMPANY_EMAIL,
    phonePrimary: COMPANY_PHONE_PRIMARY,
    phoneSecondary: COMPANY_PHONE_SECONDARY,
    whatsapp: COMPANY_WHATSAPP,
    address: COMPANY_ADDRESS,
    hours: COMPANY_HOURS,
  })

  await seedSingleton(supabase, 'stats',   stats)
  await seedSingleton(supabase, 'badges',  trustBadges)
  await seedSingleton(supabase, 'hero',    { bullets: heroBullets, metrics: heroMetrics })
  await seedSingleton(supabase, 'process', { processSteps, seoProcess })

  await seedSingleton(supabase, 'about', {
    aboutValues:   aboutValues   || [],
    aboutServices: aboutServices || [],
    whyUs:         whyUs         || [],
    aboutStats:    aboutStats    || [],
  })

  await seedSingleton(supabase, 'navigation', {
    navLinks:    navLinks    || [],
    footerLinks: footerLinks || [],
    socialLinks: socialLinks || [],
  })

  // ── Default master admin ────────────────────────────────────────────────────
  // Only the master admin is seeded by default — no demo 'admin'/'user' accounts.
  // Regular users are created through /signup instead.
  console.log('\n👤  Seeding default master admin...\n')

  const SALT_ROUNDS = 10
  const masterAdminHash = await bcrypt.hash('Admin@1234', SALT_ROUNDS)

  const { data: masterAdmin, error: masterAdminErr } = await supabase.from('users').upsert(
    {
      name: 'Master Admin',
      email: 'admin@arshanemi.com',
      mobile: null,
      password_hash: masterAdminHash,
      role: 'master_admin',
      is_active: true,
    },
    { onConflict: 'email', ignoreDuplicates: false }
  ).select().single()
  if (masterAdminErr) console.warn('  ⚠ Master admin:', masterAdminErr.message)
  else console.log('  ✓ admin@arshanemi.com  (Admin@1234)')

  // ── Default user_settings (tools access) ───────────────────────────────────
  console.log('\n🔧  Seeding default user_settings...\n')

  async function seedUserSettings(user, role) {
    if (!user) return
    const toolsAccess = defaultToolsAccessByRole[role] || defaultToolsAccessByRole.user
    const { error } = await supabase.from('user_settings').upsert(
      { user_id: user.id, tools_access: toolsAccess, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    if (error) console.warn(`  ⚠ user_settings for ${user.email}:`, error.message)
    else console.log(`  ✓ user_settings for ${user.email} (${toolsAccess.length} tools)`)
  }

  await seedUserSettings(masterAdmin, 'master_admin')

  console.log('\n✅  Seed complete — all data is live in PostgreSQL!\n')
}

main().catch((err) => {
  console.error('\n❌  Seed failed:', err)
  process.exit(1)
})
