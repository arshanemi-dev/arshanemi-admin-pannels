import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { editManyFilesExpiryDate } from '@/lib/db'

export async function PATCH(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids, expiryAt } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
  }
  if (!expiryAt) {
    return NextResponse.json({ error: 'expiryAt is required' }, { status: 400 })
  }

  const updated = await editManyFilesExpiryDate(ids, expiryAt)
  return NextResponse.json({ updated })
}
