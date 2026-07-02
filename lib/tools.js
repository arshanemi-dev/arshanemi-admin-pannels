import { getCachedCollection } from '@/lib/db'
import { tools as staticTools } from '@/data/tools'

export async function getAllTools() {
  try {
    const db = await getCachedCollection('tools')
    return db.length ? db : staticTools
  } catch {
    return staticTools
  }
}

export async function getTool(slug) {
  const all = await getAllTools()
  return all.find((t) => t.slug === slug) ?? null
}
