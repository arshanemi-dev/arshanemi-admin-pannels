'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Building2, ArrowLeft, FolderOpen, Users, Globe, Phone, Mail,
  MapPin, Loader2, CheckCircle, XCircle, User,
} from 'lucide-react'

export default function CompanyDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/companies/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    )
  }

  if (!data?.company) {
    return <div className="p-6 text-red-600">Company not found.</div>
  }

  const { company, users } = data
  const companyFolder = `companies/${company.folder_id}`
  const toolsFolder   = `tools/${company.folder_id}`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Companies
      </button>

      {/* Company header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{company.name || <span className="italic text-gray-400">Unnamed Company</span>}</h1>
              {company.slug && <p className="text-sm text-gray-500">@{company.slug}</p>}
            </div>
          </div>
          {company.is_active
            ? <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-1"><CheckCircle className="w-3 h-3" />Active</span>
            : <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 rounded-full px-2.5 py-1"><XCircle className="w-3 h-3" />Inactive</span>
          }
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {company.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /> {company.email}
            </div>
          )}
          {company.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /> {company.phone}
            </div>
          )}
          {company.website && (
            <div className="flex items-center gap-2 text-gray-600">
              <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">
                {company.website}
              </a>
            </div>
          )}
          {company.address && (
            <div className="flex items-start gap-2 text-gray-600 sm:col-span-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /> {company.address}
            </div>
          )}
        </div>
      </div>

      {/* Folder paths */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-indigo-500" /> Storage Folders
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-24 flex-shrink-0">Media</span>
            <code className="text-xs bg-gray-100 text-gray-700 rounded-md px-2.5 py-1 font-mono">{companyFolder}/</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-24 flex-shrink-0">Tools</span>
            <code className="text-xs bg-gray-100 text-gray-700 rounded-md px-2.5 py-1 font-mono">{toolsFolder}/</code>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          All files uploaded by this company live under these Vercel Blob prefixes.
        </p>
      </div>

      {/* Users */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-700">Users ({users.length})</h2>
        </div>
        {users.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No users linked to this company yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email / Mobile</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email || u.mobile}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-xs rounded-full px-2 py-0.5 font-medium ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
