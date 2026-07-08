import Link from 'next/link'
import { ShieldOff } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
          <ShieldOff className="w-7 h-7 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">404 — Page not found</h1>
        <p className="text-sm text-gray-500 mb-8">
          Either this page doesn&apos;t exist, or your account doesn&apos;t have access to it.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Back to your dashboard
        </Link>
      </div>
    </div>
  )
}
