'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, MessageCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import CTABanner from '@/components/sections/CTABanner';

function PricingCard({ pkg, index, whatsapp }) {
  const isPopular = pkg.badge === 'Most Popular';
  const isBestValue = pkg.badge === 'Best Value';
  const isFeatured = isPopular || isBestValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative flex flex-col rounded-3xl border transition-all duration-300 ${
        isFeatured
          ? 'border-accent/50 bg-card shadow-2xl shadow-accent/10 scale-[1.03] z-10'
          : 'border-divider bg-card hover:border-divider-light hover:shadow-lg'
      }`}
    >
      {pkg.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${pkg.color} shadow-lg`}>
            <Zap size={11} />
            {pkg.badge}
          </span>
        </div>
      )}
      <div className="p-8 pb-6">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${pkg.color} mb-4 shadow-lg`}>
            <span className="text-white font-bold text-base">{pkg.name[0]}</span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">{pkg.name}</h3>
          <p className="text-sm text-muted">{pkg.tagline}</p>
        </div>
        <div className="mb-6">
          <div className="flex items-end gap-1">
            <span className="text-2xl font-semibold text-muted">{pkg.currency}</span>
            <span className="text-5xl font-extrabold text-foreground leading-none">{pkg.price}</span>
            <span className="text-sm text-muted mb-1">/{pkg.period}</span>
          </div>
        </div>
        <div className="space-y-3">
          <Button
            href={`https://wa.me/${whatsapp}?text=Hi%2C%20I%27m%20interested%20in%20the%20${pkg.name}%20SEO%20Package%20at%20%24${pkg.price}%2Fmonth.`}
            size="md"
            className={`w-full ${isFeatured ? '' : 'bg-card border border-divider text-foreground hover:border-accent hover:bg-card-hover'}`}
            variant={isFeatured ? 'primary' : 'secondary'}
          >
            {pkg.cta} <ArrowRight size={15} />
          </Button>
          <Button href="/contact" size="md" variant="ghost" className="w-full text-muted hover:text-foreground text-xs">
            Request Custom Quote
          </Button>
        </div>
      </div>
      <div className="mx-8 border-t border-divider" />
      <div className="p-8 pt-6 flex-1">
        <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-4">What&apos;s included</p>
        <ul className="space-y-3">
          {(pkg.features || []).map((f) => {
            const included = f.value !== false;
            return (
              <li key={f.label} className="flex items-center gap-3">
                {included ? <Check size={14} className="text-accent-light shrink-0" /> : <X size={14} className="text-subtle shrink-0" />}
                <span className={`text-sm flex-1 ${included ? 'text-muted' : 'text-subtle line-through'}`}>{f.label}</span>
                {included && typeof f.value === 'string' && (
                  <span className="text-xs font-semibold text-foreground bg-card-hover px-2 py-0.5 rounded-md shrink-0">{f.value}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}

function BenefitCard({ item, index }) {
  const Icon = LucideIcons[item.icon] || LucideIcons.Star;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      className="bg-card border border-divider rounded-2xl p-6 hover:border-divider-light hover:shadow-sm transition-all duration-300 group"
    >
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
        <Icon size={18} className="text-accent-light" />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-2">{item.title}</h3>
      <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
    </motion.div>
  );
}

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="border border-divider rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-card-hover transition-colors"
      >
        <span className="text-sm font-semibold text-foreground">{item.q}</span>
        {open ? <ChevronUp size={16} className="text-accent-light shrink-0" /> : <ChevronDown size={16} className="text-muted shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-muted leading-relaxed">{item.a}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function SeoPackagesClient({ seoPackages, packageBenefits, packageFaqs, packageTrustStrip, packageSocialProof, whatsapp }) {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-[120px] pb-20 bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 65%)' }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-accent/10 border border-accent/20 text-accent-light mb-6">
              <Zap size={12} /> Transparent Pricing — No Hidden Fees
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mb-5">
              SEO Packages That<br />
              <span className="gradient-text">Actually Deliver Results</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
              Choose the plan that fits your growth goals. Every package includes full-service SEO — from technical audits to content, backlinks, and monthly reporting.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button href="#packages" size="lg">View Packages <ArrowRight size={17} /></Button>
              <Button href={`https://wa.me/${whatsapp}?text=Hi%2C%20I%20want%20a%20free%20SEO%20audit.`} size="lg" variant="secondary">
                <MessageCircle size={17} /> Free SEO Audit
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <div className="bg-surface border-y border-divider py-5">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {packageTrustStrip.map((t) => <span key={t} className="text-sm text-muted font-medium">{t}</span>)}
        </div>
      </div>

      {/* Pricing Cards */}
      <section id="packages" className="section-pad bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Our Packages" title="Simple, Transparent Pricing" subtitle="All packages include full-service SEO. No hidden fees, no surprises." />
          <div className="mt-14 grid md:grid-cols-3 gap-6 items-start">
            {seoPackages.map((pkg, i) => <PricingCard key={pkg.id || pkg.name} pkg={pkg} index={i} whatsapp={whatsapp} />)}
          </div>
          <p className="text-center text-sm text-subtle mt-10">
            Need something custom?{' '}
            <Link href="/contact" className="text-accent-light hover:text-accent font-semibold transition-colors">Contact us for a tailored quote →</Link>
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Every Package Includes" title="8 Pillars of Our SEO Strategy" subtitle="We don't do checkbox SEO. Every deliverable is tied to rankings, traffic, and leads." />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {packageBenefits.map((b, i) => <BenefitCard key={b.title} item={b} index={i} />)}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-background border-y border-divider">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {packageSocialProof.map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="FAQ" title="Questions About Our SEO Packages" subtitle="Everything you need to know before choosing a plan." />
          <div className="mt-10 space-y-3">
            {packageFaqs.map((faq, i) => <FaqItem key={faq.q} item={faq} index={i} />)}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
