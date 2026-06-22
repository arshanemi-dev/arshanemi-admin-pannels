import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSingleton, updateSingleton } from '@/lib/db'

export async function GET(req, { params }) {
  const { name } = await params
  const data = await getSingleton(name)
  return NextResponse.json(data)
}

export async function PUT(req, { params }) {
  const { name } = await params
  const body = await req.json()
  const updated = await updateSingleton(name, body)
  revalidateTag(name)
  return NextResponse.json(updated)
}
