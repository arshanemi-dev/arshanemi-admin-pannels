'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, TrendingUp, ExternalLink, MessageCircle,
  Calendar, Globe, Layers, Tag, Quote, ChevronRight,
  Target, Lightbulb, BarChart3, CheckCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

function getSlug(cs) {
  return cs.slug || cs.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function MetricCard({ metric, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card border border-divider rounded-2xl p-6 flex flex-col gap-2 hover:border-divider-light transition-colors relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(54,8,221,0.06)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-3xl sm:text-4xl font-extrabold gradient-text leading-none">{metric.value}</div>
      <div className="text-sm text-muted leading-snug">{metric.label}</div>
    </motion.div>
  );
}

function RelatedCard({ cs }) {
  const slug = getSlug(cs);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card border border-divider rounded-2xl overflow-hidden flex flex-col hover:border-divider-light hover:shadow-lg transition-all duration-300 group"
    >
      <div className="h-32 bg-gradient-to-br from-[rgba(54,8,221,0.15)] via-[rgba(54,8,221,0.06)] to-transparent relative flex items-center justify-center">
        <TrendingUp size={32} className="text-accent-light opacity-30 group-hover:opacity-50 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge variant="accent">{cs.service}</Badge>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex gap-2">
          {(cs.metrics || []).slice(0, 2).map((m) => (
            <div key={m.label} className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1 flex-1 text-center">
              <div className="text-xs font-bold gradient-text">{m.value}</div>
              <div className="text-[9px] text-muted leading-tight">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-foreground mb-2 leading-snug group-hover:text-accent-light transition-colors line-clamp-2">
          {cs.title}
        </h3>
        <p className="text-xs text-muted leading-relaxed mb-4 flex-1 line-clamp-2">{cs.description}</p>
        <Link
          href={`/case-studies/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light hover:text-foreground transition-colors"
        >
          View Case Study <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function CaseStudyDetail({ cs, related, whatsapp }) {
  const waUrl = `https://wa.me/${whatsapp}?text=Hi%2C%20I%27d%20like%20to%20get%20similar%20results%20for%20my%20business.`;

  return (
    <>
      {/* Hero */}
      <section className="relative pt-[110px] pb-16 bg-background overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 15% 60%, rgba(54,8,221,0.22) 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, rgba(54,8,221,0.12) 0%, transparent 50%)',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(54,8,221,0.5)] to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-1.5 text-xs text-muted mb-10"
          >
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight size={12} className="text-subtle" />
            <Link href="/case-studies" className="hover:text-foreground transition-colors">Case Studies</Link>
            <ChevronRight size={12} className="text-subtle" />
            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{cs.title}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left — main heading */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <div className="flex flex-wrap gap-2 mb-5">
                  <Badge variant="accent">{cs.service}</Badge>
                  <Badge>{cs.industry}</Badge>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-foreground mb-5">
                  {cs.title.split('—')[0].trim()}
                  {cs.title.includes('—') && (
                    <>
                      {' '}—{' '}
                      <span className="gradient-text">{cs.title.split('—')[1].trim()}</span>
                    </>
                  )}
                </h1>

                <p className="text-base text-muted leading-relaxed mb-7">{cs.description}</p>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <div className="flex items-center gap-2 bg-surface border border-divider rounded-xl px-3.5 py-2">
                    <Calendar size={13} className="text-accent-light shrink-0" />
                    <span className="text-xs font-medium text-foreground">{cs.duration}</span>
                  </div>
                  {cs.website && (
                    <a
                      href={`https://${cs.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-surface border border-divider rounded-xl px-3.5 py-2 hover:border-divider-light transition-colors"
                    >
                      <Globe size={13} className="text-accent-light shrink-0" />
                      <span className="text-xs font-medium text-foreground">{cs.website}</span>
                      <ExternalLink size={10} className="text-muted" />
                    </a>
                  )}
                  <div className="flex items-center gap-2 bg-surface border border-divider rounded-xl px-3.5 py-2">
                    <Layers size={13} className="text-accent-light shrink-0" />
                    <span className="text-xs font-medium text-foreground">{cs.service}</span>
                  </div>
                </div>

                {/* Client */}
                <div className="flex items-center gap-3 mb-8 bg-surface border border-divider rounded-2xl p-4 w-fit">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgba(54,8,221,0.4)] to-[rgba(54,8,221,0.15)] border border-[rgba(54,8,221,0.3)] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-foreground">
                      {cs.client ? cs.client.charAt(0).toUpperCase() : 'C'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none mb-0.5">{cs.client}</p>
                    <p className="text-xs text-muted">{cs.clientRole}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button href={waUrl} size="md">
                    <MessageCircle size={16} /> Get Similar Results
                  </Button>
                  <Button href="/case-studies" size="md" variant="outline">
                    <ArrowLeft size={16} /> All Case Studies
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Right — metrics grid */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="bg-surface border border-divider rounded-3xl p-7 relative overflow-hidden"
              >
                <div
                  className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(54,8,221,0.18) 0%, transparent 70%)' }}
                />
                <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-5">Key Results</p>
                <div className="grid grid-cols-2 gap-4">
                  {(cs.metrics || []).map((m, i) => (
                    <MetricCard key={m.label} metric={m} index={i} />
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-divider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-muted">Verified results</span>
                  </div>
                  <span className="text-xs text-muted">{cs.duration} project</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-16">

            {/* Left — story content */}
            <div className="lg:col-span-2 space-y-12">

              {/* Challenge */}
              {cs.challenge && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <Target size={16} className="text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">The Challenge</h2>
                  </div>
                  <div className="pl-12 border-l-2 border-divider ml-4">
                    <p className="text-base text-muted leading-relaxed">{cs.challenge}</p>
                  </div>
                </motion.div>
              )}

              {/* Solution */}
              {cs.solution && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-[rgba(54,8,221,0.12)] border border-[rgba(54,8,221,0.25)] flex items-center justify-center shrink-0">
                      <Lightbulb size={16} className="text-accent-light" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Our Approach</h2>
                  </div>
                  <div className="pl-12 border-l-2 border-[rgba(54,8,221,0.3)] ml-4">
                    <p className="text-base text-muted leading-relaxed">{cs.solution}</p>
                  </div>
                </motion.div>
              )}

              {/* Results summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                    <BarChart3 size={16} className="text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">The Results</h2>
                </div>
                <div className="pl-12 ml-4 grid sm:grid-cols-2 gap-4">
                  {(cs.metrics || []).map((m, i) => (
                    <div
                      key={m.label}
                      className="bg-card border border-divider rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle size={16} className="text-green-400" />
                      </div>
                      <div>
                        <div className="text-xl font-extrabold gradient-text leading-none">{m.value}</div>
                        <div className="text-xs text-muted mt-0.5">{m.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Tags */}
              {cs.tags && cs.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Tag size={14} className="text-muted" />
                    <span className="text-sm font-semibold text-foreground">Services Used</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cs.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-sm font-medium text-muted bg-card border border-divider px-3.5 py-1.5 rounded-full hover:border-divider-light hover:text-foreground transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right — sticky sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-5">

                {/* Testimonial */}
                {cs.testimonial && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="bg-card border border-divider rounded-2xl p-6 relative overflow-hidden"
                  >
                    <div
                      className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(54,8,221,0.12) 0%, transparent 70%)' }}
                    />
                    <Quote size={20} className="text-accent-light mb-4 opacity-70" />
                    <p className="text-sm text-muted leading-relaxed italic mb-5">&ldquo;{cs.testimonial}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-divider">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgba(54,8,221,0.4)] to-[rgba(54,8,221,0.1)] border border-[rgba(54,8,221,0.25)] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-foreground">
                          {cs.client ? cs.client.charAt(0).toUpperCase() : 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-none mb-0.5">{cs.client}</p>
                        <p className="text-[11px] text-muted">{cs.clientRole}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Project details */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-card border border-divider rounded-2xl p-6"
                >
                  <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Project Details</p>
                  <dl className="space-y-3">
                    {[
                      { label: 'Client', value: cs.client },
                      { label: 'Industry', value: cs.industry },
                      { label: 'Service', value: cs.service },
                      { label: 'Duration', value: cs.duration },
                      cs.website ? { label: 'Website', value: cs.website, link: `https://${cs.website}` } : null,
                    ].filter(Boolean).map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-2">
                        <dt className="text-xs text-muted shrink-0">{item.label}</dt>
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-accent-light hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            {item.value} <ExternalLink size={9} />
                          </a>
                        ) : (
                          <dd className="text-xs font-medium text-foreground text-right">{item.value}</dd>
                        )}
                      </div>
                    ))}
                  </dl>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="rounded-2xl p-6 text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(54,8,221,0.95) 0%, rgba(30,4,130,1) 100%)' }}
                >
                  <div
                    className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
                  />
                  <p className="text-sm font-bold mb-1">Want results like this?</p>
                  <p className="text-xs text-white/70 leading-relaxed mb-4">
                    Book a free 30-min strategy call. We&apos;ll audit your site and map a growth plan.
                  </p>
                  <Button href={waUrl} size="sm" className="w-full bg-white text-[#3608dd] hover:bg-white/90 shadow-lg">
                    <MessageCircle size={14} /> Book Free Call
                  </Button>
                  <Button href="/contact" size="sm" variant="ghost" className="w-full mt-2 text-white/80 hover:text-white hover:bg-white/10">
                    Send an Enquiry <ArrowRight size={13} />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Case Studies */}
      {related.length > 0 && (
        <section className="section-pad bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-accent-light uppercase tracking-widest mb-1">More Case Studies</p>
                <h2 className="text-2xl font-bold text-foreground">Related Work</h2>
              </div>
              <Link
                href="/case-studies"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light hover:text-foreground transition-colors"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((r) => (
                <RelatedCard key={r.id || r.slug || r.title} cs={r} />
              ))}
            </div>
            <div className="mt-6 sm:hidden text-center">
              <Link href="/case-studies" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light hover:text-foreground transition-colors">
                View All Case Studies <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
