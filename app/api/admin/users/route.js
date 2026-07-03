import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { getAllUsers } from '@/lib/db'

export async function GET(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = await getAllUsers()
  return NextResponse.json(users)
}
