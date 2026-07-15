import { NextResponse } from 'next/server'
import { getAdminFromRequest, getStaffFromRequest } from '@/lib/auth'
import { getAllCoinPackages, createCoinPackage } from '@/lib/db'

// Coin packages are global, not company-scoped (same as tool pricing) — any
// staff role can read the catalog, only master_admin can create.
export async function GET(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const packages = await getAllCoinPackages()
  return NextResponse.json(packages)
}

export async function POST(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, coins, pricePaise, badge, validityDays, isActive, displayOrder } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!Number.isFinite(+coins) || +coins <= 0) {
    return NextResponse.json({ error: 'Coins must be a positive number' }, { status: 400 })
  }
  if (!Number.isFinite(+pricePaise) || +pricePaise <= 0) {
    return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
  }
  if (validityDays != null && (!Number.isFinite(+validityDays) || +validityDays <= 0)) {
    return NextResponse.json({ error: 'Validity days must be a positive number' }, { status: 400 })
  }

  try {
    const pkg = await createCoinPackage({
      name: name.trim(),
      coins: +coins,
      pricePaise: +pricePaise,
      badge: badge?.trim() || null,
      validityDays: Number.isFinite(+validityDays) ? +validityDays : 365,
      isActive: isActive ?? true,
      displayOrder: Number.isFinite(+displayOrder) ? +displayOrder : 0,
    })
    return NextResponse.json(pkg, { status: 201 })
  } catch (err) {
    console.error('Create coin package error:', err)
    return NextResponse.json({ error: err.message || 'Could not create package' }, { status: 500 })
  }
}
