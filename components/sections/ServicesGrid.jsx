'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import { services as defaultServices } from '@/data/services';
import SectionHeading from '@/components/ui/SectionHeading';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function ServiceCard({ service }) {
  const Icon = LucideIcons[service.icon] || LucideIcons.Globe;

  return (
    <motion.div variants={item}>
      <Link
        href={`/services/${service.slug}`}
        className="group block bg-card border border-divider rounded-2xl p-6 hover:border-accent/50 hover:bg-card-hover card-glow transition-all duration-300"
      >
        <div className="w-11 h-11 rounded-xl bg-accent/8 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
          <Icon size={20} className="text-accent-light" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">{service.title}</h3>
        <p className="text-sm text-muted leading-relaxed mb-4">{service.shortDesc}</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light group-hover:gap-2.5 transition-all">
          Learn More <ArrowRight size={12} />
        </span>
      </Link>
    </motion.div>
  );
}

export default function ServicesGrid({ services }) {
  const data = services?.length ? services : defaultServices;
  const featured = data.slice(0, 8);
  return (
    <section className="section-pad bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <SectionHeading
            eyebrow="What We Do"
            title="Our SEO & Digital Marketing Services"
            subtitle="From local SEO to enterprise-level digital strategies, we offer a complete suite of services tailored to your business goals."
          />
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {featured.map((service,i) => (

            <ServiceCard key={i} service={service} />
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent-light hover:text-accent border border-accent/30 hover:border-accent px-6 py-3 rounded-lg transition-all duration-200"
          >
            View All Services <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
