import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getItem, updateItem, deleteItem, getCollection } from '@/lib/db'
import { isSlugTaken, estimateReadTime } from '@/lib/blog'
import { deleteImage } from '@/lib/upload'

export async function GET(req, { params }) {
  const { id } = await params
  const post = await getItem('blogs', id)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(req, { params }) {
  const { id } = await params
  const body = await req.json()
  const { slug, content = [], ...rest } = body

  const existing = await getItem('blogs', id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (slug && slug !== existing.slug && (await isSlugTaken(slug, id))) {
    return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 })
  }

  const updated = await updateItem('blogs', id, {
    ...rest,
    slug: slug || existing.slug,
    content,
    readTime: rest.readTime || estimateReadTime(content),
  })

  revalidateTag('blogs')
  revalidateTag(`blog-${updated.slug}`)
  return NextResponse.json(updated)
}

export async function DELETE(req, { params }) {
  const { id } = await params
  const post = await getItem('blogs', id)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (post.image) await deleteImage(post.image)

  // Also delete any inline image blocks
  if (Array.isArray(post.content)) {
    for (const block of post.content) {
      if (block.type === 'img' && block.src) await deleteImage(block.src)
    }
  }

  await deleteItem('blogs', id)
  revalidateTag('blogs')
  revalidateTag(`blog-${post.slug}`)
  return NextResponse.json({ ok: true })
}
