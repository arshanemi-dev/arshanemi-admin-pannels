import { getCollection } from '@/lib/db'

export async function getBlogBySlug(slug) {
  const blogs = await getCollection('blogs')
  return blogs.find((b) => b.slug === slug && b.status !== 'draft') ?? null
}

export async function getRelatedBlogs(currentSlug, limit = 3) {
  const all = await getCollection('blogs')
  const current = all.find((b) => b.slug === currentSlug)
  if (!current) return []
  return all
    .filter(
      (b) =>
        b.slug !== currentSlug &&
        b.status !== 'draft' &&
        b.category?.slug === current.category?.slug
    )
    .slice(0, limit)
}

export async function getPublishedBlogs() {
  const blogs = await getCollection('blogs')
  return blogs
    .filter((b) => b.status !== 'draft')
    .sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO))
}

export async function isSlugTaken(slug, excludeId = null) {
  const blogs = await getCollection('blogs')
  return blogs.some((b) => b.slug === slug && b.id !== excludeId)
}

export function generateBlogSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function estimateReadTime(content) {
  if (!Array.isArray(content)) return '1 min'
  const words = content
    .map((b) => {
      if (b.html) return b.html.replace(/<[^>]+>/g, '')
      if (b.text) return b.text
      if (b.items) return b.items.join(' ').replace(/<[^>]+>/g, '')
      if (b.code) return b.code
      return ''
    })
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min`
}

export function formatBlogDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
