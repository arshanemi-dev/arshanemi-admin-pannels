'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import { processSteps as defaultProcessSteps } from '@/data/process';

export default function ProcessSection({ processSteps }) {
  const data = processSteps?.length ? processSteps : defaultProcessSteps;
  return (
    <section className="section-pad bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <SectionHeading
            eyebrow="How We Work"
            title="Our 3-Step SEO Process"
            subtitle="A proven, transparent process that delivers consistent results for businesses of all sizes."
          />
        </motion.div>

        <div className="relative">
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-divider to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
            {data.map((step, i) => {
              const Icon = LucideIcons[step.icon] || LucideIcons.Star;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative text-center lg:text-left"
                >
                  <div className="inline-flex lg:flex items-center justify-center w-24 h-24 rounded-2xl bg-card border border-divider mb-6 mx-auto lg:mx-0 relative shadow-sm">
                    <Icon size={32} className="text-accent-light" />
                    <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>

                  <div className="text-xs text-subtle font-semibold tracking-widest uppercase mb-2">{step.number}</div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed mb-5">{step.description}</p>

                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    {step.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-surface border border-divider text-subtle px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
