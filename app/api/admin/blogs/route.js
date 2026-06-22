import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getCollection, saveCollection } from '@/lib/db'
import { isSlugTaken, generateBlogSlug, estimateReadTime } from '@/lib/blog'
import { nanoid } from 'nanoid'

export async function GET() {
  const blogs = await getCollection('blogs')
  return NextResponse.json(blogs)
}

export async function POST(req) {
  const body = await req.json()
  const { title, slug: rawSlug, content = [], status = 'draft', ...rest } = body

  const slug = rawSlug || generateBlogSlug(title || '')
  if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 })

  if (await isSlugTaken(slug)) {
    return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 })
  }

  const now = new Date()
  const post = {
    ...rest,
    id: nanoid(),
    slug,
    title: title || '',
    content,
    status,
    dateISO: rest.dateISO || now.toISOString(),
    date: rest.date || now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    readTime: rest.readTime || estimateReadTime(content),
  }

  const blogs = await getCollection('blogs')
  blogs.unshift(post)
  await saveCollection('blogs', blogs)

  revalidateTag('blogs')
  return NextResponse.json(post, { status: 201 })
}
