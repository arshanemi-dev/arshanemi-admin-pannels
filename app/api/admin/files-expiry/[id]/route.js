import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { editOneFilesExpiry } from '@/lib/db'

export async function PATCH(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, expiryAt } = body

  if (!name && !expiryAt) {
    return NextResponse.json({ error: 'Provide name or expiryAt to update' }, { status: 400 })
  }

  const updated = await editOneFilesExpiry(id, { name, expiryAt })
  return NextResponse.json({ record: updated })
}
