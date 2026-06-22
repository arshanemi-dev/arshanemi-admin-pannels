'use client';

import { Users, CheckCircle, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';
import { stats as defaultStats } from '@/data/stats';

const iconMap = { Users, CheckCircle, Calendar, TrendingUp };

function StatCard({ stat, delay }) {
  const { ref, isInView } = useInView();
  const count = useCountUp(stat.value, 2000, isInView);
  const Icon = iconMap[stat.icon] || CheckCircle;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
      className="text-center p-6 lg:p-8"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/8 border border-accent/20 mb-4">
        <Icon size={22} className="text-accent-light" />
      </div>
      <div className="text-4xl lg:text-5xl font-bold text-foreground mb-1">
        {count}{stat.suffix}
      </div>
      <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
      <div className="text-xs text-subtle">{stat.description}</div>
    </motion.div>
  );
}

export default function StatsSection({ stats }) {
  const data = stats?.length ? stats : defaultStats;
  return (
    <section className="section-pad bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 bg-divider rounded-2xl overflow-hidden border border-divider">
          {data.map((stat, i) => (
            <div key={stat.label} className="bg-card">
              <StatCard stat={stat} delay={i * 0.1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
