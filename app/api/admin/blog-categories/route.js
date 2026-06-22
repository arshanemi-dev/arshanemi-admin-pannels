import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getCollection, createItem } from '@/lib/db'

export async function GET() {
  const categories = await getCollection('blog-categories')
  return NextResponse.json(categories)
}

export async function POST(req) {
  const body = await req.json()
  const category = await createItem('blog-categories', body)
  revalidateTag('blog-categories')
  return NextResponse.json(category, { status: 201 })
}
