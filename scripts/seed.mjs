/**
 * Arshanemi — PostgreSQL Seed Script
 * Seeds all content into Supabase layout_settings table (tools go into their
 * own `tools` table instead — see scripts/tools_table_migration.sql — and
 * coin_packages go into its own table too — see
 * scripts/wallet_system_migration.sql) + creates default users.
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
import { nanoid } from 'nanoid'

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

// tools live in their own table now (not layout_settings) — see
// lib/db.js's toolItemToRow/toolRowToItem for the same flat+content split
// used by the app's runtime CRUD. Upserts on `slug` (the stable business
// key); `id` gets a fresh nanoid on every reseed, which is harmless since
// nothing references a tool by id — Tools Access grants store slugs.
const TOOLS_CONTENT_FIELDS = ['features', 'hero', 'stats', 'steps', 'advantages', 'faqs']

async function seedTools(supabase, tools) {
  const rows = await Promise.all(tools.map(async (t) => {
    const content = {}
    for (const key of TOOLS_CONTENT_FIELDS) if (t[key] !== undefined) content[key] = t[key]
    return {
      id: await nid(),
      slug: t.slug,
      title: t.title,
      icon: t.icon ?? null,
      short_desc: t.shortDesc ?? null,
      category: t.category ?? null,
      badge: t.badge ?? null,
      tool_url: t.toolUrl ?? null,
      requires_login: !!t.requiresLogin,
      content,
      updated_at: new Date().toISOString(),
    }
  }))
  const { error } = await supabase.from('tools').upsert(rows, { onConflict: 'slug' })
  if (error) throw new Error(`Failed to upsert tools: ${error.message}`)
  console.log(`  ✓ tools (${rows.length} items)`)
}

// coin_packages — Coin-Wallet Billing System's buy packs (see
// scripts/wallet_system_migration.sql, unique on `name`). Re-running this
// upserts by name, so hand-edited price/coins changes made through the admin
// Coin Packages CRUD get overwritten on reseed — same pre-existing risk as
// seedTools above, not new.
async function seedCoinPackages(supabase, packages) {
  const rows = packages.map((p) => ({
    name: p.name,
    coins: p.coins,
    price_paise: p.pricePaise,
    badge: p.badge ?? null,
    validity_days: p.validityDays ?? 365,
    is_active: p.isActive ?? true,
    display_order: p.displayOrder ?? 0,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('coin_packages').upsert(rows, { onConflict: 'name' })
  if (error) throw new Error(`Failed to upsert coin_packages: ${error.message}`)
  console.log(`  ✓ coin_packages (${rows.length} items)`)
}

// lib/tools.js's getAllTools() wraps the DB read in unstable_cache(['tools'],
// { tags:['tools'], revalidate:3600 }) — only invalidated by an explicit
// revalidateTag('tools') call (from the admin Tools Catalog's PUT route) or
// natural 1hr expiry. seedTools() above writes straight to Supabase via the
// REST client, entirely outside Next's request lifecycle, so nothing ever
// calls revalidateTag — without this, a freshly reseeded tools table stays
// invisible to the running app for up to an hour. Reuses the existing
// generic app/api/revalidate/route.js rather than adding a new endpoint.
async function revalidateCache(tags) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${siteUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    console.log(`  ✓ Revalidated cache tag(s): ${tags.join(', ')}`)
  } catch (err) {
    console.warn(
      `  ⚠ Could not revalidate cache tag(s) [${tags.join(', ')}] at ${siteUrl}/api/revalidate — ` +
      `is the Next.js server running there? Seeded data will still appear, just not until the ` +
      `cache's own 1hr window expires. (${err.message})`
    )
  }
}

// ─── nanoid shim ─────────────────────────────────────────────────────────────

async function nid() {
  const { nanoid } = await import('nanoid')
  return nanoid()
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
  const { tools }           = await imp('data/tools.js')
  const { coinPackages }    = await imp('data/coinPackages.js')

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
  const { defaultPromoOffer }                             = await imp('data/promoOffer.js')
  const { DEFAULT_COMPANY, MASTER_ADMIN, DEFAULT_COMPANY_ADMIN, ADDITIONAL_ADMINS } = await imp('data/default.js')

  // ── List collections ────────────────────────────────────────────────────────
  console.log('📦  Seeding list collections...\n')

  await seedList(supabase, 'services',
    await Promise.all(services.map(async (s) => ({ ...s, id: await nid() }))))

  await seedTools(supabase, tools)
  await revalidateCache(['tools'])

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

  // ── Coin-Wallet Billing System ──────────────────────────────────────────────
  console.log('\n💰  Seeding coin packages...\n')

  await seedCoinPackages(supabase, coinPackages)

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

  await seedSingleton(supabase, 'promoOffer', defaultPromoOffer)

  // ── Default tenant company ──────────────────────────────────────────────────
  // This is the multi-tenant `companies` row (users/roles/companies system) —
  // distinct from the `company` singleton seeded above, which is the site's
  // own public contact-info block.
  console.log('\n🏢  Seeding default company...\n')

  const defaultCompanyEmail = DEFAULT_COMPANY.email.toLowerCase().trim()
  let { data: defaultCompany } = await supabase
    .from('companies')
    .select('*')
    .eq('email', defaultCompanyEmail)
    .single()

  if (!defaultCompany) {
    const slug = toCompanySlug(DEFAULT_COMPANY.name)
    const folderId = slug || `co_${nanoid(8)}`
    const { data: createdCompany, error: companyErr } = await supabase
      .from('companies')
      .insert({
        name: DEFAULT_COMPANY.name,
        slug,
        email: defaultCompanyEmail,
        phone: DEFAULT_COMPANY.phone || null,
        website: DEFAULT_COMPANY.website || null,
        address: DEFAULT_COMPANY.address || null,
        folder_id: folderId,
      })
      .select()
      .single()
    if (companyErr) {
      console.warn('  ⚠ Default company:', companyErr.message)
    } else {
      defaultCompany = createdCompany
      console.log(`  ✓ Created company "${defaultCompany.name}" (${defaultCompany.email})`)
      try {
        const { initCompanyFolders } = await imp('lib/media.js')
        await initCompanyFolders(folderId)
        console.log(`  ✓ Initialised blob storage folders for "${folderId}"`)
      } catch (err) {
        console.warn('  ⚠ Could not initialise blob storage folders (Vercel Blob not configured?):', err.message)
      }
    }
  } else {
    console.log(`  ✓ Company "${defaultCompany.name}" already exists (${defaultCompany.email})`)
  }

  // ── Default master admin + company admin ────────────────────────────────────
  // master_admin has full platform access; the company admin is scoped to
  // DEFAULT_COMPANY (role 'admin'). Regular 'user' accounts are created
  // through /signup or Admin → Users instead.
  console.log('\n👤  Seeding default admin accounts...\n')

  const SALT_ROUNDS = 10
  const masterAdminHash = await bcrypt.hash(MASTER_ADMIN.password, SALT_ROUNDS)

  const { data: masterAdmin, error: masterAdminErr } = await supabase.from('users').upsert(
    {
      name: MASTER_ADMIN.name,
      email: MASTER_ADMIN.email.toLowerCase().trim(),
      mobile: null,
      password_hash: masterAdminHash,
      role: 'master_admin',
      is_active: true,
    },
    { onConflict: 'email', ignoreDuplicates: false }
  ).select().single()
  if (masterAdminErr) console.warn('  ⚠ Master admin:', masterAdminErr.message)
  else console.log(`  ✓ ${masterAdmin.email}  (${MASTER_ADMIN.password})`)

  let companyAdmin = null
  if (defaultCompany) {
    const companyAdminHash = await bcrypt.hash(DEFAULT_COMPANY_ADMIN.password, SALT_ROUNDS)
    const { data: createdCompanyAdmin, error: companyAdminErr } = await supabase.from('users').upsert(
      {
        name: DEFAULT_COMPANY_ADMIN.name,
        email: DEFAULT_COMPANY_ADMIN.email.toLowerCase().trim(),
        mobile: null,
        password_hash: companyAdminHash,
        role: 'admin',
        company_id: defaultCompany.id,
        is_active: true,
        // otp_enabled intentionally omitted — defaults to FALSE once
        // scripts/otp_enabled_migration.sql has been run; omitting it keeps
        // this script working before that migration too.
      },
      { onConflict: 'email', ignoreDuplicates: false }
    ).select().single()
    if (companyAdminErr) console.warn('  ⚠ Company admin:', companyAdminErr.message)
    else {
      companyAdmin = createdCompanyAdmin
      console.log(`  ✓ ${companyAdmin.email}  (${DEFAULT_COMPANY_ADMIN.password})  — role: admin, company: ${defaultCompany.name}`)
    }
  }

  // Extra default admins beyond the one above — see data/default.js's
  // ADDITIONAL_ADMINS comment for how to add more.
  const extraAdmins = []
  if (defaultCompany) {
    for (const admin of ADDITIONAL_ADMINS) {
      const adminHash = await bcrypt.hash(admin.password, SALT_ROUNDS)
      const { data: createdAdmin, error: adminErr } = await supabase.from('users').upsert(
        {
          name: admin.name,
          email: admin.email.toLowerCase().trim(),
          mobile: null,
          password_hash: adminHash,
          role: admin.role,
          company_id: defaultCompany.id,
          is_active: true,
        },
        { onConflict: 'email', ignoreDuplicates: false }
      ).select().single()
      if (adminErr) console.warn(`  ⚠ ${admin.email}:`, adminErr.message)
      else {
        extraAdmins.push(createdAdmin)
        console.log(`  ✓ ${createdAdmin.email}  (${admin.password})  — role: ${admin.role}, company: ${defaultCompany.name}`)
      }
    }
  }

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
  await seedUserSettings(companyAdmin, 'admin')
  for (const admin of extraAdmins) await seedUserSettings(admin, admin.role)

  console.log('\n✅  Seed complete — all data is live in PostgreSQL!\n')
}

main().catch((err) => {
  console.error('\n❌  Seed failed:', err)
  process.exit(1)
})
