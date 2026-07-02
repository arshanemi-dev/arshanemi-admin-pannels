import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { getAllTools } from '@/lib/tools'
import * as LucideIcons from 'lucide-react'

export const metadata = {
  title: 'Ecommerce Tools',
  description: 'Browse all Arshanemi ecommerce tools — product research, competitor analysis, profit calculator, keyword finder, price tracker, and sales estimator.',
}

function ToolIcon({ name, size = 22 }) {
  const Icon = LucideIcons[name] || LucideIcons.Wrench
  return <Icon size={size} />
}

export default async function ToolsPage() {
  const allTools = await getAllTools()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="section-pad border-b border-divider bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-6">
            <Zap size={12} />
            Ecommerce Intelligence Suite
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
            All the Tools You Need to
            <br />
            <span className="gradient-text">Sell Smarter</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto mb-8">
            Six powerful ecommerce tools in one platform — from product discovery
            to profit calculation. Start free, scale when ready.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-divider-light text-muted hover:text-foreground hover:border-accent/40 font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="section-pad">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-pad bg-surface border-t border-divider">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Ready to Start Selling Smarter?
          </h2>
          <p className="text-muted mb-8">
            Create a free account in 60 seconds. No credit card required.
            Full access to all tool free tiers immediately.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
          >
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}

function ToolCard({ tool }) {
  return (
    <div className="group relative flex flex-col bg-card border border-divider rounded-2xl p-6 hover:border-accent/40 card-glow transition-all duration-200">
      {tool.badge && (
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
          {tool.badge}
        </span>
      )}

      <Link href={`/tools/${tool.slug}`} className="flex flex-col flex-1">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
          <ToolIcon name={tool.icon} />
        </div>

        <h3 className="text-foreground font-bold text-lg mb-2 group-hover:text-accent transition-colors">
          {tool.title}
        </h3>
        <p className="text-muted text-sm leading-relaxed flex-1 mb-5">
          {tool.shortDesc}
        </p>

        {tool.features && (
          <ul className="space-y-1.5 mb-5">
            {tool.features.slice(0, 3).map((f) => (
              <li key={f.title} className="flex items-center gap-2 text-xs text-muted">
                <span className="w-1 h-1 rounded-full bg-accent/60 shrink-0" />
                {f.title}
              </li>
            ))}
          </ul>
        )}
      </Link>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href={`/tools/${tool.slug}`}
          className="flex items-center gap-1.5 text-accent-light text-sm font-semibold group-hover:gap-2.5 transition-all"
        >
          Explore Tool <ArrowRight size={14} />
        </Link>
        {tool.toolUrl && (
          <Link
            href={`/tools/${tool.slug}/use`}
            className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            Use Tool
          </Link>
        )}
      </div>
    </div>
  )
}
