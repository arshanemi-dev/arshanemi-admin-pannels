'use client';

import { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { caseStudies as defaultCaseStudies } from '@/data/caseStudies';
import SectionHeading from '@/components/ui/SectionHeading';
import Badge from '@/components/ui/Badge';

function CaseStudyCard({ cs }) {
  return (
    <div className="flex-[0_0_90%] sm:flex-[0_0_70%] lg:flex-[0_0_45%] xl:flex-[0_0_33%] min-w-0 pl-5">
      <div className="bg-card border border-divider rounded-2xl overflow-hidden h-full flex flex-col hover:border-divider-light hover:shadow-sm transition-all duration-300">
        {/* Image placeholder */}
        <div className="h-48 bg-gradient-to-br from-accent/10 to-cyan/5 relative flex items-center justify-center">
          <TrendingUp size={40} className="text-accent-light opacity-40" />
          <div className="absolute top-3 left-3">
            <Badge variant="accent">{cs.service}</Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge>{cs.industry}</Badge>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-base font-bold text-foreground mb-2">{cs.title}</h3>
          <p className="text-sm text-muted leading-relaxed mb-5 flex-1">{cs.description}</p>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-divider mb-5">
            {cs.metrics.map((m) => (
              <div key={m.label}>
                <div className="text-xl font-bold gradient-text">{m.value}</div>
                <div className="text-xs text-subtle mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-subtle">{cs.client} · {cs.duration}</span>
            <Link
              href="/contact"
              className="text-xs font-semibold text-accent-light hover:text-accent transition-colors"
            >
              View Case Study →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CaseStudiesCarousel({ caseStudies }) {
  const data = caseStudies?.length ? caseStudies : defaultCaseStudies;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="section-pad bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          <SectionHeading
            eyebrow="Case Studies"
            title="Real Results for Real Businesses"
            subtitle="See how we've helped businesses like yours grow their organic traffic and revenue."
            center={false}
          />
          <div className="flex gap-3 shrink-0">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full bg-card border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all flex items-center justify-center"
              aria-label="Previous"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-card border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all flex items-center justify-center"
              aria-label="Next"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-5">
            {data.map((cs) => (
              <CaseStudyCard key={cs.id} cs={cs} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
