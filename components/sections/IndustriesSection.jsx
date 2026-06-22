'use client';

import { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import { industries as defaultIndustries } from '@/data/industries';
import SectionHeading from '@/components/ui/SectionHeading';

function IndustryCard({ industry }) {
  const Icon = LucideIcons[industry.icon] || LucideIcons.Briefcase;

  return (
    <div className="flex-[0_0_76%] sm:flex-[0_0_46%] lg:flex-[0_0_28%] xl:flex-[0_0_21%] min-w-0 pl-5">
      <Link href={`/industries/${industry.slug}`} className="group block h-full">
        <div className="bg-card border border-divider rounded-2xl p-6 h-full flex flex-col hover:border-accent/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-accent/8 border border-accent/15 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
            <Icon size={22} className="text-accent-light" />
          </div>

          <h3 className="text-sm font-bold text-foreground mb-2">{industry.name}</h3>

          <p className="text-xs text-muted leading-relaxed flex-1 mb-4 line-clamp-3">
            {industry.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {(industry.benefits || []).slice(0, 2).map((b) => (
              <span
                key={b}
                className="text-[10px] bg-surface border border-divider text-subtle px-2 py-0.5 rounded-full"
              >
                {b}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-accent-light group-hover:gap-2 transition-all duration-200">
            Explore Industry <ChevronRight size={12} />
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function IndustriesSection({ industries }) {
  const data = industries?.length ? industries : defaultIndustries;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: true },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="section-pad bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          <SectionHeading
            eyebrow="Industries We Serve"
            title="SEO Expertise Across Every Sector"
            subtitle="We understand your industry's unique challenges and build strategies that speak directly to your target audience."
            center={false}
          />
          <div className="flex gap-3 shrink-0">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full bg-card border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all flex items-center justify-center"
              aria-label="Previous industry"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-card border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all flex items-center justify-center"
              aria-label="Next industry"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-5">
              {data.map((industry) => (
                <IndustryCard key={industry.slug} industry={industry} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
