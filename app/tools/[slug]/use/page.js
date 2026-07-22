import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTool } from '@/lib/tools'
import { resolveToolAccess } from '@/lib/toolAccess'
import ToolUseClient from '@/components/tools/ToolUseClient'
import PremiumFeatureGate from '@/components/tools/PremiumFeatureGate'
import AccessDeniedGate from '@/components/tools/AccessDeniedGate'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const tool = await getTool(slug)
  if (!tool) return {}
  return { title: `Use ${tool.title}` }
}

export default async function ToolUsePage({ params }) {
  const { slug } = await params
  const access = await resolveToolAccess(slug)
  if (access.kind === 'not_found') notFound()
  if (access.kind === 'redirect') redirect(access.to)

  if (access.kind === 'access_denied') {
    return (
      <div className="h-[100vh] bg-background pt-24 pb-10">
        <AccessDeniedGate tool={access.tool} />
      </div>
    )
  }

  if (access.kind === 'activation_required') {
    return (
      <div className="min-h-screen bg-background pt-24 pb-10">
        <PremiumFeatureGate tool={access.tool} feature={access.feature} />
      </div>
    )
  }

  const { tool } = access

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">


      {tool.toolUrl ? (
        <ToolUseClient tool={tool} />
      ) : (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16 bg-card border border-divider rounded-2xl">
            <p className="text-foreground font-medium mb-1">This tool isn&apos;t available yet</p>
            <p className="text-muted text-sm">Check back soon, or explore the tool details in the meantime.</p>
          </div>
        </div>
      )}
    </div>
  )
}
