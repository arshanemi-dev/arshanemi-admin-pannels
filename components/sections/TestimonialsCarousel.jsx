'use client';

import { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, ArrowRight, Quote } from 'lucide-react';
import { testimonials as defaultTestimonials } from '@/data/testimonials';
import SectionHeading from '@/components/ui/SectionHeading';

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-divider'} />
      ))}
    </div>
  );
}

function TestimonialCard({ t }) {
  return (
    <div className="flex-[0_0_90%] sm:flex-[0_0_70%] lg:flex-[0_0_48%] min-w-0 pl-5">
      <div className="bg-card border border-divider rounded-2xl p-6 lg:p-8 h-full flex flex-col shadow-sm">
        <Quote size={28} className="text-accent/20 mb-4 shrink-0" />
        <p className="text-sm text-muted leading-relaxed flex-1 mb-6">"{t.text}"</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-cyan/50 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {t.name[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-subtle">{t.role}, {t.company}</p>
            </div>
          </div>
          <Stars rating={t.rating} />
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsCarousel({ testimonials }) {
  const data = testimonials?.length ? testimonials : defaultTestimonials;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
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
            eyebrow="Client Testimonials"
            title="What Our Clients Say"
            subtitle="Don't take our word for it — hear from the businesses we've helped grow."
            center={false}
          />
          <div className="flex gap-3 shrink-0">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full bg-card border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all flex items-center justify-center"
              aria-label="Previous testimonial"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-card border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all flex items-center justify-center"
              aria-label="Next testimonial"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-5">
            {data.map((t, i) => (
              <TestimonialCard key={i} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
