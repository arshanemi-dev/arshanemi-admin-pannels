import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { dummyUser } from '@/data/dummyUser'

// Try to get extended user record from DB; fall back to JWT payload + dummy shape
async function resolveUser(payload) {
  try {
    const { getUserById } = await import('@/lib/db')
    const user = await getUserById(payload.userId)
    if (user) {
      return {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        mobile:    user.mobile ?? null,
        role:      user.role,
        avatar:    user.avatar ?? null,
        company:   user.company ?? null,
        is_active: user.is_active,
        createdAt: user.created_at ?? null,
      }
    }
  } catch {
    // DB unavailable — fall through to JWT payload
  }
  return {
    ...dummyUser,
    id:    payload.userId,
    name:  payload.name  ?? dummyUser.name,
    email: payload.email ?? dummyUser.email,
    role:  payload.role  ?? dummyUser.role,
  }
}

export async function GET(req) {
  const payload = await getAuthPayload(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await resolveUser(payload)
  return NextResponse.json(user)
}
