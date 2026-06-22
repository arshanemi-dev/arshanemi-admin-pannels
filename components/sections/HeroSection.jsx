'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Phone } from 'lucide-react';
import Button from '@/components/ui/Button';
import { COMPANY_PHONE_PRIMARY as defaultPhone } from '@/data/company';
import { heroBullets as defaultBullets, heroMetrics as defaultMetrics } from '@/data/heroContent';

export default function HeroSection({ phone, bullets, metrics }) {
  const displayPhone = phone || defaultPhone;
  const displayBullets = bullets?.length ? bullets : defaultBullets;
  const displayMetrics = metrics?.length ? metrics : defaultMetrics;
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-800 pt-[72px]">
      {/* Soft gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-blob absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-50"
          style={{
            background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)',
            animation: 'gradientPulse 10s ease-in-out infinite reverse',
          }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block text-xs font-semibold tracking-widest text-white uppercase bg-accent/8 border border-accent/20 px-3 py-1.5 rounded-full mb-6">
                #1 SEO Agency in Surat, Gujarat
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight text-white"
            >
              Rank Higher.{' '}
              <span className="text-white">Grow Faster.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-white leading-relaxed max-w-xl"
            >
              We help businesses dominate Google search, attract qualified leads, and achieve sustainable online growth through AI-powered SEO and digital marketing.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {displayBullets.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-white">
                  <CheckCircle size={16} className="text-white shrink-0" />
                  {b}
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Button href="/contact" size="lg">
                Get Free SEO Audit
                <ArrowRight size={18} />
              </Button>
              <Button href="/services" variant="secondary" size="lg">
                View Services
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 flex items-center gap-3"
            >
              <a
                href={`tel:${displayPhone}`}
                className="flex items-center gap-2 text-sm text-white hover:text-white transition-colors"
              >
                <Phone size={14} className="text-white" />
                {displayPhone}
              </a>
              <span className="text-divider">|</span>
              <span className="text-sm text-white">Mon–Sat 9AM–9PM IST</span>
            </motion.div>
          </div>

          {/* Right — Visual card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Main card */}
              <div className="bg-card border border-divider rounded-2xl p-8 shadow-xl shadow-black/40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center">
                    <CheckCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-accent">SEO Performance</p>
                    <p className="text-xs text-accent">Last 90 days</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {displayMetrics.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-foreground">{item.label}</span>
                        <span className=".text-foreground font-semibold">{item.value}</span>
                      </div>
                      <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                          style={{ width: item.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-green-500/30 .text-foreground">
                98% Client Retention
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card border border-divider text-foreground text-xs font-semibold px-4 py-3 rounded-xl shadow-md">
                ⭐ 5.0 Google Reviews
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
