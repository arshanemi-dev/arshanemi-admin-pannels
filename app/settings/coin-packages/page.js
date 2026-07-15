import { getAdminFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllCoinPackages } from '@/lib/db'
import CoinPackagesClient from './CoinPackagesClient'

export const metadata = { title: 'Coin Packages — Admin' }

export default async function CoinPackagesPage() {
  const admin = await getAdminFromCookies()
  if (!admin) redirect('/settings/login')

  let packages = []
  try { packages = await getAllCoinPackages() } catch {}

  return <CoinPackagesClient initialPackages={packages} />
}
