'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ArrowRight, MessageCircle, CheckCircle, Star } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SectionHeading from '@/components/ui/SectionHeading';
import CTABanner from '@/components/sections/CTABanner';

const ALL = 'All';

function getSlug(cs) {
  return cs.slug || cs.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function CaseStudyCard({ cs, index }) {
  const slug = getSlug(cs);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="bg-card border border-divider rounded-2xl overflow-hidden flex flex-col hover:border-divider-light hover:shadow-xl transition-all duration-300 group"
    >
      {/* Card image area */}
      <div className="h-44 relative flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(54,8,221,0.18) 0%, rgba(54,8,221,0.06) 60%, rgba(0,0,0,0) 100%)' }}
      >
        <TrendingUp size={48} className="text-accent-light opacity-25 group-hover:opacity-40 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <Badge variant="accent">{cs.service}</Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge>{cs.industry}</Badge>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex gap-3">
          {cs.metrics.slice(0, 2).map((m) => (
            <div key={m.label} className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5 flex-1 text-center">
              <div className="text-sm font-bold gradient-text">{m.value}</div>
              <div className="text-[10px] text-muted leading-tight">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-foreground mb-2 leading-snug group-hover:text-accent-light transition-colors">
          {cs.title}
        </h3>
        <p className="text-xs text-muted leading-relaxed mb-5 flex-1">{cs.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {(cs.tags || []).map((tag) => (
            <span key={tag} className="text-[10px] font-medium text-muted bg-surface border border-divider-light px-2.5 py-1 rounded-md">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-divider">
          <div>
            <p className="text-xs font-semibold text-foreground">{cs.client}</p>
            <p className="text-[10px] text-muted">{cs.duration} · {cs.industry}</p>
          </div>
          <Link
            href={`/case-studies/${slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent-light hover:text-foreground transition-colors"
          >
            View Details <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialCard({ t, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
      className="bg-card border border-divider rounded-2xl p-6 flex flex-col gap-4"
    >
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-sm text-muted leading-relaxed flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
      <div className="flex items-center justify-between pt-3 border-t border-divider">
        <div>
          <p className="text-sm font-semibold text-foreground">{t.name}</p>
          <p className="text-xs text-muted">{t.role}</p>
        </div>
        <span className="text-xs font-bold text-accent-light bg-[rgba(54,8,221,0.12)] border border-[rgba(54,8,221,0.25)] px-2.5 py-1 rounded-full">
          {t.result}
        </span>
      </div>
    </motion.div>
  );
}

function ProcessStep({ step, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex gap-4 items-start"
    >
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-[rgba(54,8,221,0.12)] border border-[rgba(54,8,221,0.25)] flex items-center justify-center">
        <span className="text-xs font-bold text-accent-light">{step.step}</span>
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
        <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function CaseStudiesClient({ caseStudies, caseStudyStats, seoProcess, caseStudyTestimonials, whatsapp }) {
  const [active, setActive] = useState(ALL);

  const categories = [ALL, ...Array.from(new Set(caseStudies.map((c) => c.industry)))];
  const filtered = active === ALL ? caseStudies : caseStudies.filter((c) => c.industry === active);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-[120px] pb-20 bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(54,8,221,0.2) 0%, transparent 65%)' }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(54,8,221,0.5)] to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[rgba(54,8,221,0.12)] border border-[rgba(54,8,221,0.25)] text-accent-light mb-6">
              <TrendingUp size={12} />
              Proven SEO Results
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mb-5">
              Real Businesses.<br />
              <span className="gradient-text">Real Results.</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
              We let our work speak. Browse case studies across industries and see exactly how Santhya Infotech drives organic traffic, leads, and revenue.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button href="#case-studies" size="lg">View Case Studies <ArrowRight size={17} /></Button>
              <Button href={`https://wa.me/${whatsapp}?text=Hi%2C%20I%27d%20like%20to%20book%20a%20free%20strategy%20call.`} size="lg" variant="secondary">
                <MessageCircle size={17} /> Book Strategy Call
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-14 bg-surface border-y border-divider">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {caseStudyStats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                <div className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section id="case-studies" className="section-pad bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Case Studies" title="Our Work Across Industries" subtitle="Filter by industry to find case studies most relevant to your business." />
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActive(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${active === cat ? 'bg-accent text-white shadow-lg shadow-[rgba(54,8,221,0.35)]' : 'bg-card border border-divider text-muted hover:text-foreground hover:border-divider-light'}`}>
                {cat}
              </button>
            ))}
          </div>
          <motion.div layout className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((cs, i) => <CaseStudyCard key={cs.id || cs.title} cs={cs} index={i} />)}
            </AnimatePresence>
          </motion.div>
          {filtered.length === 0 && <p className="text-center text-muted text-sm mt-10">No case studies in this category yet.</p>}
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Client Feedback" title="What Our Clients Say" subtitle="Don't just take our word for it — hear directly from businesses we've helped grow." />
          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            {caseStudyTestimonials.map((t, i) => <TestimonialCard key={t.name} t={t} index={i} />)}
          </div>
          <div className="mt-8 text-center">
            <Link href="/testimonials" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light hover:text-foreground transition-colors">
              View All Testimonials <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Our SEO Process */}
      <section className="section-pad bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <SectionHeading eyebrow="Our Process" title="How We Deliver Results" subtitle="A proven 7-step methodology that we run for every client, every time." center={false} />
              <div className="mt-10 space-y-6">
                {seoProcess.map((s, i) => <ProcessStep key={s.step} step={s} index={i} />)}
              </div>
            </div>
            <div className="sticky top-28">
              <motion.div
                initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6 }}
                className="rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(54,8,221,0.95) 0%, rgba(30,4,130,1) 100%)' }}
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <span className="inline-block text-xs font-bold tracking-widest uppercase bg-white/10 border border-white/20 px-3 py-1.5 rounded-full mb-6">Free Strategy Call</span>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">Want Results Like These?</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-8">Book a free 30-minute strategy call. We&apos;ll audit your website, show you what&apos;s holding back your rankings, and map a clear growth path.</p>
                <ul className="space-y-3 mb-8">
                  {['Free website & competitor audit', 'Custom keyword opportunity report', 'No-pressure strategy roadmap', 'Clear ROI projection'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white/80">
                      <CheckCircle size={15} className="text-white/60 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <div className="space-y-3">
                  <Button href={`https://wa.me/${whatsapp}?text=Hi%2C%20I%27d%20like%20to%20book%20a%20free%20SEO%20strategy%20call.`} size="lg" className="w-full bg-white text-[#3608dd] hover:bg-white/90 shadow-lg">
                    <MessageCircle size={17} /> Book via WhatsApp
                  </Button>
                  <Button href="/contact" size="lg" className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20">
                    Send an Enquiry <ArrowRight size={17} />
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-5 bg-card border border-divider rounded-2xl p-6 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-bold text-foreground mb-0.5">View SEO Packages</p>
                  <p className="text-xs text-muted">Starting from $150/month — transparent pricing.</p>
                </div>
                <Button href="/seo-packages" size="sm" variant="outline">See Plans <ArrowRight size={13} /></Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
