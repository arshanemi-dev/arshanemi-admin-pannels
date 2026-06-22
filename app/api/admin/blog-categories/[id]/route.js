import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getItem, updateItem, deleteItem, getCollection } from '@/lib/db'

export async function GET(req, { params }) {
  const { id } = await params
  const cat = await getItem('blog-categories', id)
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(cat)
}

export async function PUT(req, { params }) {
  const { id } = await params
  const body = await req.json()
  const updated = await updateItem('blog-categories', id, body)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  revalidateTag('blog-categories')
  return NextResponse.json(updated)
}

export async function DELETE(req, { params }) {
  const { id } = await params
  const cat = await getItem('blog-categories', id)
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Refuse if any blog references this category slug
  const blogs = await getCollection('blogs')
  const refs = blogs.filter((b) => b.category?.slug === cat.slug)
  if (refs.length > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${refs.length} blog post(s) use this category` },
      { status: 409 }
    )
  }

  await deleteItem('blog-categories', id)
  revalidateTag('blog-categories')
  return NextResponse.json({ ok: true })
}
