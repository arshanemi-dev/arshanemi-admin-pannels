import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const COOKIE_NAME = 'arshanemi-token'

export async function signToken(payload, expiresIn = '7d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}

export async function getUserFromRequest(req) {
  const cookie = req.cookies.get(COOKIE_NAME)
  if (!cookie?.value) return null
  return verifyToken(cookie.value)
}

export async function getUserFromCookies() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export function makeAuthCookie(token) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
}

export function clearAuthCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  }
}

// Keep old admin cookie name alias for backward compatibility with admin panel
export { makeAuthCookie as makeAdminCookie }
export const ADMIN_COOKIE = 'admin-token'

export async function getAdminFromRequest(req) {
  const cookie = req.cookies.get(ADMIN_COOKIE) || req.cookies.get(COOKIE_NAME)
  if (!cookie?.value) return null
  const payload = await verifyToken(cookie.value)
  if (!payload) return null
  return payload.role === 'admin' ? payload : null
}

export async function getAdminFromCookies() {
  const cookieStore = await cookies()
  const token = (cookieStore.get(ADMIN_COOKIE) || cookieStore.get(COOKIE_NAME))?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return payload.role === 'admin' ? payload : null
}
