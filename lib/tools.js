import { unstable_cache } from 'next/cache'
import { getAllToolsFromDB } from '@/lib/db'
import { tools as staticTools } from '@/data/tools'

// Same cache tag ('tools') as before the table migration, so the existing
// revalidateTag('tools') calls in app/api/admin/tools/*/route.js still
// invalidate this without any changes there.
const getCachedTools = unstable_cache(
  () => getAllToolsFromDB(),
  ['tools'],
  { tags: ['tools'], revalidate: 3600 }
)

export async function getAllTools() {
  try {
    const db = await getCachedTools()
    return db.length ? db : staticTools
  } catch {
    return staticTools
  }
}

export async function getTool(slug) {
  const all = await getAllTools()
  return all.find((t) => t.slug === slug) ?? null
}
