import { NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { getCollection, createItem } from '@/lib/db'

const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }

// Revalidates every public page that renders services or industries so changes appear
// immediately without waiting for the 1-hour ISR TTL to expire.
// Called after any create/update/delete on these collections.
function revalidatePublicPages(collection, item) {
  if (collection === 'services') {
    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/services')
    if (item?.slug) revalidatePath(`/services/${item.slug}`)
  } else if (collection === 'industries') {
    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/industries')
    if (item?.slug) revalidatePath(`/industries/${item.slug}`)
  } else if (collection === 'case-studies') {
    revalidatePath('/case-studies')
    const slug = item?.slug || (item?.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null)
    if (slug) revalidatePath(`/case-studies/${slug}`)
  }
}

export async function GET(req, { params }) {
  const { collection } = await params
  const data = await getCollection(collection)
  return NextResponse.json(data, { headers: NO_CACHE })
}

export async function POST(req, { params }) {
  const { collection } = await params
  const body = await req.json()
  const item = await createItem(collection, body)
  revalidateTag(collection)
  revalidatePublicPages(collection, item)
  return NextResponse.json(item, { status: 201, headers: NO_CACHE })
}
