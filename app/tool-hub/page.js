import { Zap } from 'lucide-react'
import { getCachedCollection } from '@/lib/db'
import ToolHubClient from '@/components/tool-hub/ToolHubClient'

export const metadata = {
  title: 'Tool Hub',
  description: 'Access embedded tools directly inside Santhya Infotech — no separate accounts, no extra tabs.',
}

export default async function ToolHubPage() {
  let items = []
  try { items = await getCachedCollection('toolHub') } catch {}
  const tools = items
    .filter((t) => t.enabled)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div className="min-h-screen bg-background">
      <section className="section-pad border-b border-divider bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-6">
            <Zap size={12} />
            Tool Hub
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
            Tools, right where you <span className="gradient-text">need them</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Open any tool below without leaving this page. Some tools are open to everyone,
            others ask you to sign in first.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ToolHubClient tools={tools} />
        </div>
      </section>
    </div>
  )
}
