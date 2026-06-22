import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'
import { getSingleton, updateSingleton } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { defaultTheme } from '@/data/defaultTheme'

export async function GET() {
  try {
    const saved = await getSingleton('theme')
    const theme = saved && Object.keys(saved).length > 0 ? saved : defaultTheme
    return NextResponse.json(theme, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json(defaultTheme)
  }
}

export async function PUT(req) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    if (!body?.dark || !body?.light || !body?.typography || !body?.borderRadius) {
      return NextResponse.json({ error: 'Invalid theme payload' }, { status: 400 })
    }
    await updateSingleton('theme', body)
    revalidateTag('theme')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Failed to save theme' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await updateSingleton('theme', defaultTheme)
    revalidateTag('theme')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Failed to reset theme' }, { status: 500 })
  }
}
