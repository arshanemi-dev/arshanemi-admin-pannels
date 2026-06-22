import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { industries as defaultIndustries } from '@/data/industries';
import SectionHeading from '@/components/ui/SectionHeading';
import CTABanner from '@/components/sections/CTABanner';
import { ArrowRight } from 'lucide-react';
import { getCachedCollection } from '@/lib/db';

const SITE_URL = 'https://www.santhyainfotech.com';

export const metadata = {
  title: 'Industries We Serve — Specialized SEO for Every Sector',
  description:
    'Santhya Infotech delivers specialized SEO strategies for Healthcare, Dental, Law Firms, Real Estate, Hotels, eCommerce, Gyms, Restaurants, Salons, Education, and more.',
  keywords: [
    'industry-specific SEO', 'healthcare SEO', 'dental SEO', 'law firm SEO', 'real estate SEO India',
    'hotel SEO', 'ecommerce SEO', 'gym SEO', 'restaurant SEO Surat',
  ],
  alternates: { canonical: `${SITE_URL}/industries` },
  openGraph: {
    title: 'Industries We Serve — Specialized SEO | Santhya Infotech',
    description:
      'Specialized SEO strategies for Healthcare, Dental, Law, Real Estate, Hotels, eCommerce, and 20+ more industries across India & UAE.',
    url: `${SITE_URL}/industries`,
    images: [{ url: `${SITE_URL}/images/santhya-infotech-logo.png`, width: 1200, height: 630, alt: 'Santhya Infotech Industries' }],
  },
  twitter: {
    title: 'Industries We Serve | Santhya Infotech',
    description: 'Industry-specific SEO strategies for 20+ sectors across India & UAE.',
    images: [`${SITE_URL}/images/santhya-infotech-logo.png`],
  },
};

function IndustryCard({ industry }) {
  const Icon = LucideIcons[industry.icon] || LucideIcons.Briefcase;
  return (
    <Link
      href={`/industries/${industry.slug}`}
      className="group bg-card border border-divider rounded-2xl p-6 hover:border-accent/50 hover:bg-card-hover card-glow transition-all duration-300 flex flex-col shadow-sm"
    >
      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
        <Icon size={22} className="text-accent-light" />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-2">{industry.name}</h3>
      <p className="text-xs text-muted leading-relaxed flex-1 mb-4">{industry.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {industry.benefits.map((b) => (
          <span key={b} className="text-xs bg-surface border border-divider text-subtle px-2 py-0.5 rounded-full">{b}</span>
        ))}
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light group-hover:gap-2.5 transition-all">
        Learn More <ArrowRight size={11} />
      </span>
    </Link>
  );
}

export default async function IndustriesPage() {
  const blobIndustries = await getCachedCollection('industries');
  const industries = blobIndustries.length ? blobIndustries : defaultIndustries;

  return (
    <>
      <section className="relative pt-[120px] pb-16 bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 60%)' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-accent-light uppercase bg-accent/8 border border-accent/20 px-3 py-1.5 rounded-full mb-6">Industries</span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
            SEO for <span className="gradient-text">Every Industry</span>
          </h1>
          <p className="text-lg text-muted">We understand your sector's unique challenges and craft strategies that speak directly to your target customers.</p>
        </div>
      </section>

      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry) => <IndustryCard key={industry.slug} industry={industry} />)}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
