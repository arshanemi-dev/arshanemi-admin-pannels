import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { signToken, makeAuthCookie } from '@/lib/auth'
import { getUserByEmail, getUserByMobile, createUser, getCompanyByEmail, createCompany, createUserSettings } from '@/lib/db'
import { initCompanyFolders } from '@/lib/media'
import { validatePassword } from '@/lib/validation'

export async function POST(req) {
  const body = await req.json()
  const { name, email, mobile, password, confirm, company: companyInput } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email && !mobile) return NextResponse.json({ error: 'Provide at least an email or mobile number' }, { status: 400 })
  if (password !== confirm) return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })

  const pwError = validatePassword(password)
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

  // Company email is required
  if (!companyInput?.email?.trim()) {
    return NextResponse.json({ error: 'Company email is required' }, { status: 400 })
  }

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

    // Check company email uniqueness
    const existingCompany = await getCompanyByEmail(companyInput.email)
    if (existingCompany) {
      return NextResponse.json({ error: 'A company with this email already exists' }, { status: 409 })
    }

    // Derive folder_id: use slug if company name provided, else random
    let folderId
    if (companyInput.name?.trim()) {
      folderId = companyInput.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      // guard against empty result
      if (!folderId) folderId = `co_${nanoid(8)}`
    } else {
      folderId = `co_${nanoid(8)}`
    }

    // Create company row
    const company = await createCompany({
      name: companyInput.name?.trim() || null,
      email: companyInput.email,
      phone: companyInput.phone?.trim() || null,
      website: companyInput.website?.trim() || null,
      address: companyInput.address?.trim() || null,
      folderId,
    })

    // Initialise blob folders: companies/<folderId>/ + tools/<folderId>/
    await initCompanyFolders(folderId)

    // Create user linked to company
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
