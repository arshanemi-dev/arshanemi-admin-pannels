'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { trustBadges as defaultBadges } from '@/data/badges';

export default function TrustBadges({ trustBadges }) {
  const data = trustBadges?.length ? trustBadges : defaultBadges;
  return (
    <section className="py-14 bg-surface border-y border-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold text-subtle uppercase tracking-widest mb-10">
          Trusted, Certified & Award-Winning
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {data.map((badge, i) => {
            const Icon = LucideIcons[badge.icon] || LucideIcons.Star;
            return (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex flex-col items-center text-center p-4 bg-card border border-divider rounded-xl hover:border-accent/30 hover:shadow-sm transition-all group"
              >
                <Icon size={28} className="text-subtle group-hover:text-accent-light transition-colors mb-3" />
                <p className="text-xs font-semibold text-foreground">{badge.label}</p>
                <p className="text-xs text-subtle mt-0.5">{badge.sub}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
