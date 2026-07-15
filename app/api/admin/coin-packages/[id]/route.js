import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { getCoinPackageById, updateCoinPackage, deleteCoinPackage } from '@/lib/db'

export async function GET(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const pkg = await getCoinPackageById(id)
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(pkg)
}

export async function PUT(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const data = await req.json()

  if ('coins' in data && (!Number.isFinite(+data.coins) || +data.coins <= 0)) {
    return NextResponse.json({ error: 'Coins must be a positive number' }, { status: 400 })
  }
  if ('pricePaise' in data && (!Number.isFinite(+data.pricePaise) || +data.pricePaise <= 0)) {
    return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
  }

  const updated = await updateCoinPackage(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteCoinPackage(id)
  return NextResponse.json({ ok: true })
}
