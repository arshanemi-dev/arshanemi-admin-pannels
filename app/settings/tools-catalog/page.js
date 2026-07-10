import { getAdminFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCollection } from '@/lib/db'
import ToolsAdminClient from './ToolsAdminClient'

export const metadata = { title: 'Manage Tools — Admin' }

export default async function AdminToolsPage() {
  const admin = await getAdminFromCookies()
  if (!admin) redirect('/settings/login')

  let tools = []
  try { tools = await getCollection('tools') } catch {}

  return <ToolsAdminClient initialTools={tools} />
}
