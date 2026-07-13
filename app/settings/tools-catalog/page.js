import { getAdminFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllToolsFromDB } from '@/lib/db'
import ToolsAdminClient from './ToolsAdminClient'

export const metadata = { title: 'Manage Tools — Admin' }

export default async function AdminToolsPage() {
  const admin = await getAdminFromCookies()
  if (!admin) redirect('/settings/login')

  let tools = []
  try { tools = await getAllToolsFromDB() } catch {}

  return <ToolsAdminClient initialTools={tools} />
}
