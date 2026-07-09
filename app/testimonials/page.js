import { Star, Quote } from 'lucide-react';
import { testimonials as defaultTestimonials } from '@/data/testimonials';
import SectionHeading from '@/components/ui/SectionHeading';
import CTABanner from '@/components/sections/CTABanner';
import { getCachedCollection } from '@/lib/db';

export const metadata = {
  title: 'Client Testimonials | Arshanemi',
  description: 'Real results from real clients. See what businesses say about Arshanemi\'s SEO and digital marketing services.',
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-divider'}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-card border border-divider rounded-2xl p-6 flex flex-col gap-4 hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <StarRating rating={testimonial.rating} />
        <Quote size={20} className="text-accent/30 shrink-0 mt-0.5" />
      </div>
      <p className="text-sm text-muted leading-relaxed flex-1">"{testimonial.text}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-divider">
        <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-accent-light">
            {testimonial.name.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
          <p className="text-xs text-subtle">{testimonial.role} · {testimonial.company}</p>
        </div>
      </div>
    </div>
  );
}

export default async function TestimonialsPage() {
  const blobTestimonials = await getCachedCollection('testimonials');
  const testimonials = blobTestimonials.length ? blobTestimonials : defaultTestimonials;
  return (
    <>
      {/* Hero */}
      <section className="relative pt-[120px] pb-16 bg-background overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 60%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-accent-light uppercase bg-accent/8 border border-accent/20 px-3 py-1.5 rounded-full mb-6">
            Client Testimonials
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
            Real Results from <span className="gradient-text">Real Clients</span>
          </h1>
          <p className="text-lg text-muted">
            Hear directly from businesses we've helped grow through SEO and digital marketing.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-surface border-y border-divider">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '200+', label: 'Happy Clients' },
            { value: '4.9★', label: 'Average Rating' },
            { value: '98%', label: 'Retention Rate' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl sm:text-3xl font-bold gradient-text mb-1">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="section-pad bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="What Clients Say"
            title="Stories of Growth & Success"
            subtitle="From local clinics to eCommerce stores — real outcomes across every industry we serve."
          />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} testimonial={t} />
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
