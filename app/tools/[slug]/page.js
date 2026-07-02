import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import { getAllTools, getTool } from '@/lib/tools'
import * as LucideIcons from 'lucide-react'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const tool = await getTool(slug)
  if (!tool) return {}
  return {
    title: tool.title,
    description: tool.hero?.subtext || tool.shortDesc,
  }
}

function Icon({ name, size = 20 }) {
  const C = LucideIcons[name] || LucideIcons.Wrench
  return <C size={size} />
}

export default async function ToolDetailPage({ params }) {
  const { slug } = await params
  const tool = await getTool(slug)
  if (!tool) notFound()

  const allTools = await getAllTools()
  const related = allTools.filter((t) => t.slug !== tool.slug).slice(0, 3)

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="section-pad border-b border-divider bg-surface relative overflow-hidden">
        <div className="hero-blob absolute inset-0 pointer-events-none" aria-hidden />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1 mb-10 lg:mb-0">
              <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4 transition-colors">
                ← All Tools
              </Link>

              {tool.badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4">
                  {tool.badge}
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Icon name={tool.icon} size={26} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {tool.title}
                </h1>
              </div>

              <p className="text-muted text-lg leading-relaxed mb-8 max-w-xl">
                {tool.hero?.subtext || tool.shortDesc}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href={`/tools/${tool.slug}/use`}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  {tool.requiresLogin && <Lock size={14} />}
                  Start Using This Tool <ArrowRight size={16} />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 border border-divider-light text-muted hover:text-foreground hover:border-accent/40 font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Create Free Account
                </Link>
              </div>
            </div>

            {/* Stats */}
            {tool.stats && (
              <div className="grid grid-cols-2 gap-4 lg:w-72 shrink-0">
                {tool.stats.map((s) => (
                  <div key={s.label} className="bg-card border border-divider rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold gradient-text">{s.value}</p>
                    <p className="text-xs text-muted mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      {tool.features && (
        <section className="section-pad border-b border-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              What&apos;s Inside the Tool
            </h2>
            <p className="text-muted mb-10">Everything you get when you open {tool.title}.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tool.features.map((f) => (
                <div key={f.title} className="bg-card border border-divider rounded-2xl p-5 hover:border-accent/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                    <Icon name={f.icon} size={18} />
                  </div>
                  <h3 className="text-foreground font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Steps */}
      {tool.steps && (
        <section className="section-pad border-b border-divider bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              How to Use {tool.title}
            </h2>
            <p className="text-muted mb-12">Step-by-step guide — get results in under 5 minutes.</p>
            <div className="relative">
              <div className="hidden lg:block absolute left-8 top-0 bottom-0 w-px bg-divider-light" aria-hidden />
              <div className="space-y-8">
                {tool.steps.map((s, i) => (
                  <div key={s.step} className="flex gap-6 lg:gap-10">
                    <div className="relative flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-accent text-white font-bold text-lg flex items-center justify-center shrink-0 z-10">
                        {s.step}
                      </div>
                      {i < tool.steps.length - 1 && (
                        <div className="flex-1 w-px bg-divider-light mt-2 lg:hidden" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <h3 className="text-foreground font-bold text-lg mb-2">{s.title}</h3>
                      <p className="text-muted leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Advantages */}
      {tool.advantages && (
        <section className="section-pad border-b border-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-10">
              Why Use {tool.title}?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {tool.advantages.map((a) => (
                <div key={a.title} className="flex gap-4 bg-card border border-divider rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Icon name={a.icon} size={18} />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">{a.title}</h3>
                    <p className="text-muted text-sm">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      {tool.faqs && (
        <section className="section-pad border-b border-divider bg-surface">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {tool.faqs.map((faq) => (
                <details key={faq.question} className="group bg-card border border-divider rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer text-foreground font-medium select-none list-none hover:bg-card-hover transition-colors">
                    {faq.question}
                    <span className="text-accent shrink-0 text-lg group-open:rotate-45 transition-transform duration-200">+</span>
                  </summary>
                  <div className="px-6 pb-5 text-muted text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Login gate CTA */}
      <section className="section-pad">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-card border border-accent/20 rounded-3xl p-10">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-5">
              <Lock size={24} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Ready to use {tool.title}?
            </h2>
            <p className="text-muted mb-8">
              Log in to your Arshanemi account to access this tool.
              No account yet? Sign up free — takes 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors"
              >
                Log In to Start <ArrowRight size={16} />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 border border-divider-light text-muted hover:text-foreground hover:border-accent/40 font-medium px-8 py-3 rounded-xl transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      {related.length > 0 && (
        <section className="section-pad bg-surface border-t border-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-foreground mb-6">Other Tools You Might Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="flex items-start gap-4 bg-card border border-divider rounded-2xl p-5 hover:border-accent/30 card-glow transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Icon name={t.icon} size={18} />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-sm mb-1">{t.title}</h3>
                    <p className="text-muted text-xs leading-relaxed line-clamp-2">{t.shortDesc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
