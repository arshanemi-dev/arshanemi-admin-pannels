'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ArrowRight, CheckCircle, Phone, MessageCircle, Clock, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import CaseStudiesCarousel from '@/components/sections/CaseStudiesCarousel';
import IndustriesSection from '@/components/sections/IndustriesSection';
import ServiceChallenges from '@/components/sections/ServiceChallenges';
import ServiceBlogsCarousel from '@/components/sections/ServiceBlogsCarousel';
import { COMPANY_PHONE_PRIMARY, COMPANY_WHATSAPP } from '@/data/company';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, delay },
});

/* ─── Hero ─── */
function ServiceHero({ service, content }) {
  const Icon = LucideIcons[service.icon] || LucideIcons.Globe;
  const headline = content.hero?.headline || `${service.title} Services`;
  const subtext = content.hero?.subtext || service.shortDesc;

  return (
    <section className="relative pt-[120px] pb-20 bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-800 overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div {...fadeUp(0)}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-6">
            <Icon size={28} className="text-cyan-300" />
          </div>
        </motion.div>

        <motion.h1 {...fadeUp(0.1)} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
          {headline}
        </motion.h1>

        <motion.p {...fadeUp(0.2)} className="text-lg text-indigo-100 max-w-2xl mx-auto leading-relaxed mb-8">
          {subtext}
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <Button href="/contact" size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg">
            Get Free Consultation <ArrowRight size={18} />
          </Button>
          <Button href={`https://wa.me/${COMPANY_WHATSAPP}`} size="lg" className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10 hover:border-white">
            <MessageCircle size={18} /> WhatsApp Us
          </Button>
        </motion.div>

        <motion.div {...fadeUp(0.4)} className="flex flex-wrap items-center justify-center gap-6 text-sm text-indigo-200">
          {['5+ Years Experience', '98% Client Retention', '100% White-Hat', 'Free Audit Included'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-cyan-300" /> {t}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Stats Strip ─── */
function StatsStrip({ stats }) {
  if (!stats?.length) return null;
  return (
    <section className="bg-surface border-b border-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-divider">
          {stats.map((s, i) => (
            <motion.div key={s.label} {...fadeUp(i * 0.08)} className="py-8 px-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">{s.value}</div>
              <div className="text-sm text-muted">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features — Left Tabs + Right Detail ─── */
function FeaturesGrid({ service }) {
  const list = service.features || [];
  const [active, setActive] = useState(0);
  if (!list.length) return null;

  const current = list[active] || list[0];
  const FeatureIcon = LucideIcons[current?.icon] || LucideIcons.CheckCircle;
  const title = typeof current === 'string' ? current : current?.title;
  const desc  = typeof current === 'string' ? '' : current?.desc;

  return (
    <section className="section-pad bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp()} className="mb-14">
          <SectionHeading
            eyebrow="What's Included"
            title={`Our ${service.title} Services`}
            subtitle={`A comprehensive, results-driven approach to ${service.title.toLowerCase()} tailored to your business goals.`}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Tab list */}
          <motion.div {...fadeUp(0.08)} className="lg:col-span-2 flex flex-col gap-1.5">
            {list.map((f, i) => {
              const tabTitle = typeof f === 'string' ? f : f.title;
              const TabIcon  = LucideIcons[f.icon] || LucideIcons.CheckCircle;
              const isActive = i === active;
              return (
                <button
                  key={tabTitle}
                  onClick={() => setActive(i)}
                  className={`group flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-accent/10 border-accent/30 text-foreground shadow-sm'
                      : 'bg-card border-divider text-muted hover:border-divider-light hover:bg-card-hover'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-accent/20 border border-accent/30'
                      : 'bg-surface border border-divider group-hover:bg-accent/8'
                  }`}>
                    <TabIcon size={15} className={isActive ? 'text-accent-light' : 'text-muted group-hover:text-accent-light'} />
                  </div>
                  <span className={`text-sm font-medium leading-snug flex-1 ${isActive ? 'text-foreground' : ''}`}>
                    {tabTitle}
                  </span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-accent-light shrink-0" />}
                </button>
              );
            })}
          </motion.div>

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-3"
            >
              <div className="bg-card border border-divider rounded-2xl p-8 h-full min-h-[320px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent/3 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                    <FeatureIcon size={26} className="text-accent-light" />
                  </div>
                  <p className="text-xs font-semibold text-accent-light uppercase tracking-widest mb-2">
                    {service.title} · Feature {active + 1}/{list.length}
                  </p>
                  <h3 className="text-xl font-bold text-foreground mb-4 leading-snug">{title}</h3>
                  {desc && <p className="text-muted leading-relaxed mb-6">{desc}</p>}
                  <div className="flex flex-wrap gap-2">
                    {['Proven Strategy', 'Measurable Results', 'Expert Execution', 'Monthly Reporting'].map((chip) => (
                      <span key={chip} className="text-xs bg-surface border border-divider text-subtle px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <CheckCircle size={11} className="text-accent-light" /> {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ─── How We Work (Process Steps) ─── */
function ProcessSteps({ process: steps }) {
  if (!steps?.length) return null;
  return (
    <section className="section-pad bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp()} className="mb-14">
          <SectionHeading eyebrow="How We Work" title="Our Proven Process" subtitle="A structured, transparent process designed to deliver measurable results at every step." />
        </motion.div>
        <div className="relative">
          <div className="hidden lg:block absolute top-8 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-divider to-transparent" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={step.step} {...fadeUp(i * 0.08)} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-card border border-divider flex items-center justify-center shrink-0 relative shadow-sm">
                    <span className="text-xl font-bold gradient-text">{step.step}</span>
                    {i < steps.length - 1 && (
                      <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent/40" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                </div>
                <p className="text-sm text-muted leading-relaxed pl-20">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Why Choose Us ─── */
function WhyChooseUs({ whyUs, service }) {
  const items = whyUs || [];
  if (!items.length) return null;
  return (
    <section className="section-pad bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp()} className="mb-14">
          <SectionHeading eyebrow="Why Choose Us" title="The Santhya Infotech Advantage" subtitle={`What makes our ${service.title.toLowerCase()} services different from every other agency.`} />
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => {
            const ItemIcon = LucideIcons[item.icon] || LucideIcons.CheckCircle;
            return (
              <motion.div key={item.title} {...fadeUp(i * 0.07)} className="flex gap-4 p-6 bg-card border border-divider rounded-2xl hover:border-accent/30 hover:shadow-sm transition-all">
                <div className="w-11 h-11 rounded-xl bg-accent/8 border border-accent/20 flex items-center justify-center shrink-0">
                  <ItemIcon size={20} className="text-accent-light" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Mid-page CTA ─── */
function MidCTA({ service }) {
  return (
    <section className="py-16 bg-surface border-y border-divider">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div {...fadeUp()}>
          <p className="text-sm font-semibold text-accent-light uppercase tracking-widest mb-3">Ready to Start?</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Get a Free {service.title} Audit
          </h2>
          <p className="text-muted mb-8">
            Let our experts analyze your current {service.title.toLowerCase()} performance and show you exactly where the growth opportunities are — completely free.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/contact" size="lg">
              Request Free Audit <ArrowRight size={18} />
            </Button>
            <a href={`tel:${COMPANY_PHONE_PRIMARY}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground transition-colors">
              <Phone size={16} className="text-accent" /> {COMPANY_PHONE_PRIMARY}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Root export ─── */
export default function ServiceDetail({ service, content, caseStudies, industries }) {
  return (
    <>
      <ServiceHero service={service} content={content} />
      <StatsStrip stats={content.stats} />
      <FeaturesGrid service={service} />
      <ServiceChallenges challenges={content.challenges || service.challenges} service={service} />
      <ProcessSteps process={content.process} />
      <WhyChooseUs whyUs={content.whyUs} service={service} />
      <CaseStudiesCarousel caseStudies={caseStudies} />
      <ServiceBlogsCarousel />
      <IndustriesSection industries={industries} />
      <MidCTA service={service} />
    </>
  );
}
