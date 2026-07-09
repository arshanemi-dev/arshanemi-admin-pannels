import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { signToken, makeAuthCookie } from '@/lib/auth'
import { getUserByEmail, getUserByMobile, createUser, getCompanyByEmail, createCompany, createUserSettings } from '@/lib/db'
import { initCompanyFolders } from '@/lib/media'
import { validatePassword } from '@/lib/validation'
import { DEFAULT_COMPANY } from '@/data/default'

// Direct self-signup no longer spins up a new tenant company per user —
// every signup joins the single shared DEFAULT_COMPANY (see data/default.js,
// also seeded by scripts/seed.mjs) as a plain 'user'. Admin-managed companies
// and 'admin' accounts are created from Admin → Companies / Admin → Users.
async function getOrCreateDefaultCompany() {
  const email = DEFAULT_COMPANY.email.toLowerCase().trim()
  const existing = await getCompanyByEmail(email)
  if (existing) return existing

  let folderId = DEFAULT_COMPANY.name
    ?.toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  if (!folderId) folderId = `co_${nanoid(8)}`

  const company = await createCompany({
    name: DEFAULT_COMPANY.name || null,
    email,
    phone: DEFAULT_COMPANY.phone || null,
    website: DEFAULT_COMPANY.website || null,
    address: DEFAULT_COMPANY.address || null,
    folderId,
  })
  await initCompanyFolders(folderId)
  return company
}

export async function POST(req) {
  const body = await req.json()
  const { name, email, mobile, password, confirm } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email && !mobile) return NextResponse.json({ error: 'Provide at least an email or mobile number' }, { status: 400 })
  if (password !== confirm) return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })

  const pwError = validatePassword(password)
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

  try {
    // Check user duplicates
    if (email) {
      const existing = await getUserByEmail(email.toLowerCase().trim())
      if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }
    if (mobile) {
      const existing = await getUserByMobile(mobile.trim())
      if (existing) return NextResponse.json({ error: 'An account with this mobile number already exists' }, { status: 409 })
    }

    const company = await getOrCreateDefaultCompany()

    // Create user linked to the default company
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser({
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : null,
      mobile: mobile ? mobile.trim() : null,
      passwordHash,
      role: 'user',
      companyId: company.id,
    })

    // Create the default user_settings row — every new user gets full tools
    // access for their role; admin can restrict individual users later.
    try {
      await createUserSettings(user.id, user.role)
    } catch (err) {
      console.error('Failed to create default user_settings:', err)
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyId: company.id,
      folderId: company.folder_id,
    })
    const cookie = makeAuthCookie(token)
    const res = NextResponse.json(
      { ok: true, role: user.role, name: user.name, companyId: company.id },
      { status: 201 }
    )
    res.cookies.set(cookie)
    return res
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 })
  }
}
