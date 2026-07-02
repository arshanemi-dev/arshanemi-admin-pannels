import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTool } from '@/lib/tools'
import ToolUseClient from '@/components/tools/ToolUseClient'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const tool = await getTool(slug)
  if (!tool) return {}
  return { title: `Use ${tool.title}` }
}

export default async function ToolUsePage({ params }) {
  const { slug } = await params
  const tool = await getTool(slug)
  if (!tool) notFound()

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
