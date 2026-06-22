'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Phone, Mail, ArrowRight, MessageCircle, CheckCircle, Zap, Users, TrendingUp, Award } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  COMPANY_EMAIL as defaultEmail,
  COMPANY_PHONE_PRIMARY as defaultPhonePrimary,
  COMPANY_PHONE_SECONDARY as defaultPhoneSecondary,
  COMPANY_WHATSAPP as defaultWhatsapp,
} from '@/data/company';

const TRUST_ICONS = { Zap, Users, TrendingUp, Award, CheckCircle };

const DEFAULTS = {
  eyebrow: 'Free SEO Consultation',
  headline: 'Ready to Grow Your Business',
  highlightWord: 'Online?',
  description: "Get a free, no-obligation SEO audit worth ₹5,000. Our experts will analyze your website and show you exactly where you're losing rankings and traffic.",
  primaryCTA: 'Get Free SEO Audit',
  primaryHref: '/contact',
  secondaryCTA: 'WhatsApp Us',
  imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80&fit=crop',
  trustPoints: [
    { icon: 'Zap', text: 'Results in 30 Days' },
    { icon: 'Users', text: '100+ Happy Clients' },
    { icon: 'TrendingUp', text: 'Proven ROI Growth' },
    { icon: 'Award', text: '5+ Years Experience' },
  ],
  metrics: [
    { value: '300K+', label: 'Impressions' },
    { value: '98%',   label: 'Retention' },
    { value: '50K+',  label: 'Sessions / Mo' },
    { value: '5X',    label: 'Avg ROI' },
  ],
};

/* ── Glass pill overlaid on image — white glass to match hero orbs ── */
function StatPill({ value, label }) {
  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex flex-col">
      <span className="text-xl font-black text-white leading-none">{value}</span>
      <span className="text-[11px] text-indigo-200 mt-0.5">{label}</span>
    </div>
  );
}

export default function CTABanner({ email, phonePrimary, phoneSecondary, whatsapp }) {
  const [data, setData] = useState(DEFAULTS);

  useEffect(() => {
    fetch('/api/admin/singleton/cta-banner', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Object.keys(d).length) setData({ ...DEFAULTS, ...d }); })
      .catch(() => {});
  }, []);

  const displayEmail    = email          || defaultEmail;
  const displayPhone1   = phonePrimary   || defaultPhonePrimary;
  const displayPhone2   = phoneSecondary || defaultPhoneSecondary;
  const displayWhatsapp = whatsapp       || defaultWhatsapp;

  const trustPoints = data.trustPoints?.length ? data.trustPoints : DEFAULTS.trustPoints;
  const metrics     = data.metrics?.length     ? data.metrics     : DEFAULTS.metrics;
  const imageUrl    = data.imageUrl            || DEFAULTS.imageUrl;

  return (
    /* ── Hero-identical gradient background ── */
    <section className="section-pad bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-800 relative overflow-hidden">

      {/* Hero-style decorative orbs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

      {/* Hero-style dot-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── LEFT — Image with glass stats overlay ── */}
          <motion.div
            initial={{ opacity: 0, x: -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.75 }}
            className="relative"
          >
            <div className="relative h-[480px] sm:h-[520px] rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/40">
              <Image
                src={imageUrl}
                alt="Santhya Infotech — SEO Growth Team"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Image overlays blend into the indigo/violet gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-violet-900/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 via-transparent to-transparent" />

              {/* Top-left live badge */}
              <motion.div
                initial={{ opacity: 0, y: -14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute top-5 left-5"
              >
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-4 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                  <span className="text-xs font-semibold text-white">Live Reporting Dashboard</span>
                </div>
              </motion.div>

              {/* Top-right single stat */}
              <motion.div
                initial={{ opacity: 0, x: 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="absolute top-5 right-5"
              >
                <StatPill value={metrics[0]?.value || '300K+'} label={metrics[0]?.label || 'Impressions'} />
              </motion.div>

              {/* Bottom 3-column stat grid */}
              <div className="absolute bottom-5 left-5 right-5">
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: 0.5 }}
                  className="grid grid-cols-3 gap-3"
                >
                  {metrics.slice(1, 4).map((m, i) => (
                    <StatPill key={i} value={m.value} label={m.label} />
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Subtle glow ring matching hero orb style */}
            <div className="absolute -inset-3 rounded-[32px] border border-white/10 pointer-events-none" />
          </motion.div>

          {/* ── RIGHT — CTA content, all white/indigo-100 text ── */}
          <motion.div
            initial={{ opacity: 0, x: 36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Eyebrow — matches hero trust badge style */}
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-200 uppercase bg-white/10 border border-white/20 px-3 py-1.5 rounded-full mb-6 self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
              {data.eyebrow}
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
              {data.headline}{' '}
              {data.highlightWord && (
                <span className="text-cyan-300">{data.highlightWord}</span>
              )}
            </h2>

            <p className="text-base text-indigo-100 leading-relaxed mb-8">
              {data.description}
            </p>

            {/* Trust checkpoints */}
            <div className="flex flex-col gap-3 mb-8">
              {trustPoints.map((pt, i) => {
                const TrustIcon = TRUST_ICONS[pt.icon] || CheckCircle;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <TrustIcon size={14} className="text-cyan-300" />
                    </div>
                    <span className="text-sm text-indigo-100">{pt.text}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA buttons — identical to hero */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Button
                href={data.primaryHref || '/contact'}
                size="lg"
                className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg shadow-indigo-900/30"
              >
                {data.primaryCTA} <ArrowRight size={18} />
              </Button>
              <Button
                href={`https://wa.me/${displayWhatsapp}?text=Hi%2C%20I%20want%20a%20free%20SEO%20audit.`}
                size="lg"
                className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10 hover:border-white"
              >
                <MessageCircle size={18} /> {data.secondaryCTA}
              </Button>
            </div>

            {/* Contact row */}
            <div className="flex flex-wrap gap-5 pt-6 border-t border-white/20">
              <a href={`tel:${displayPhone1}`} className="flex items-center gap-2.5 text-sm text-indigo-100 hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Phone size={13} className="text-cyan-300" />
                </div>
                {displayPhone1}
              </a>
              <a href={`tel:${displayPhone2}`} className="flex items-center gap-2.5 text-sm text-indigo-100 hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Phone size={13} className="text-cyan-300" />
                </div>
                {displayPhone2}
              </a>
              <a href={`mailto:${displayEmail}`} className="flex items-center gap-2.5 text-sm text-indigo-100 hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Mail size={13} className="text-cyan-300" />
                </div>
                {displayEmail}
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
