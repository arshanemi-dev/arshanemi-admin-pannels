'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

const CHALLENGE_IMAGE =
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&fit=crop';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, delay },
});

/* ── Challenge card — glass style on gradient bg ── */
function ChallengeCard({ item, index }) {
  const Icon = LucideIcons[item.icon] || LucideIcons.AlertCircle;
  return (
    <motion.div
      {...fadeUp(0.05 + index * 0.06)}
      className="group flex gap-4 p-4 rounded-2xl border border-white/15
                 bg-white/8 backdrop-blur-sm
                 hover:border-white/30 hover:bg-white/12
                 transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center
                      justify-center shrink-0 group-hover:bg-white/20 transition-colors">
        <Icon size={17} className="text-cyan-300" />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-white mb-1 leading-snug">{item.title}</h4>
        <p className="text-xs text-indigo-200 leading-relaxed">{item.desc}</p>
      </div>
    </motion.div>
  );
}

/* ── Glass pill on image ── */
function ImagePill({ icon, label }) {
  const Icon = LucideIcons[icon] || LucideIcons.AlertCircle;
  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-3 py-2.5 flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-cyan-300" />
      </div>
      <span className="text-xs font-semibold text-white leading-snug">{label}</span>
    </div>
  );
}

export default function ServiceChallenges({ challenges, service }) {
  const items   = challenges?.items  || [];
  if (!items.length) return null;

  const heading  = challenges?.heading  || `Challenges ${service?.title || 'Our'} Clients Face`;
  const subtext  = challenges?.subtext  || 'Common blockers that silently kill your organic growth — and exactly how we eliminate every one of them.';
  const imageUrl = challenges?.imageUrl || CHALLENGE_IMAGE;

  const badgeItems = items.slice(0, 3);

  return (
    /* ── Exact same gradient as CTABanner + hero ── */
    <section className="section-pad bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-800 relative overflow-hidden">

      {/* Hero-style decorative orbs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

      {/* Dot-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── LEFT — image with glass overlays ── */}
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
                alt={`${service?.title || 'SEO'} challenges — Santhya Infotech`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Blend into indigo/violet gradient */}
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
                  <span className="text-xs font-semibold text-white">Pain Points We Eliminate</span>
                </div>
              </motion.div>

              {/* Top-right floating challenge pills */}
              <div className="absolute top-16 right-5 flex flex-col gap-2.5">
                {badgeItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.38 + i * 0.1 }}
                  >
                    <ImagePill icon={item.icon} label={item.title} />
                  </motion.div>
                ))}
              </div>

              {/* Bottom resolve card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute bottom-5 left-5 right-5"
              >
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <LucideIcons.ShieldCheck size={18} className="text-cyan-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">
                      Santhya Infotech Solves All of These
                    </p>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Proven strategies. Measurable outcomes. Zero guesswork.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Glow ring */}
            <div className="absolute -inset-3 rounded-[32px] border border-white/10 pointer-events-none" />
          </motion.div>

          {/* ── RIGHT — eyebrow + heading + subtitle + scrollable list ── */}
          <motion.div
            initial={{ opacity: 0, x: 36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Eyebrow — matches CTA / hero style */}
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-200 uppercase bg-white/10 border border-white/20 px-3 py-1.5 rounded-full mb-6 self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
              Common Roadblocks
            </span>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              {heading}
            </h2>

            {/* Subtitle */}
            <p className="text-base text-indigo-100 leading-relaxed mb-6">
              {subtext}
            </p>

            {/* Count + scroll hint */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-indigo-200">
                {items.length} challenge{items.length !== 1 ? 's' : ''} identified
              </span>
              {items.length > 4 && (
                <span className="flex items-center gap-1.5 text-xs text-indigo-300 italic">
                  Scroll to see all
                  <LucideIcons.ChevronDown size={12} className="opacity-70" />
                </span>
              )}
            </div>

            {/* Scrollable challenge cards */}
            <div
              className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-2
                         [&::-webkit-scrollbar]:w-1.5
                         [&::-webkit-scrollbar-track]:rounded-full
                         [&::-webkit-scrollbar-track]:bg-white/5
                         [&::-webkit-scrollbar-thumb]:rounded-full
                         [&::-webkit-scrollbar-thumb]:bg-white/20
                         hover:[&::-webkit-scrollbar-thumb]:bg-white/40"
            >
              {items.map((item, i) => (
                <ChallengeCard key={item.title || i} item={item} index={i} />
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
