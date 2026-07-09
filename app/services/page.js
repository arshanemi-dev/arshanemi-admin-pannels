import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { services as defaultServices, serviceCategories } from '@/data/services';
import SectionHeading from '@/components/ui/SectionHeading';
import CTABanner from '@/components/sections/CTABanner';
import { ArrowRight } from 'lucide-react';
import { getCachedCollection } from '@/lib/db';

const SITE_URL = 'https://www.santhyainfotech.com';

export const metadata = {
  title: 'SEO & Digital Marketing Services in Surat | All Services',
  description:
    "Explore Arshanemi's complete SEO and digital marketing services — Local SEO, eCommerce SEO, Shopify SEO, Link Building, Google Ads, Social Media Marketing, Content Writing, and more.",
  keywords: [
    'SEO services Surat', 'digital marketing services', 'local SEO', 'ecommerce SEO services',
    'link building India', 'Google Ads management', 'social media marketing',
    'technical SEO audit', 'content writing SEO',
  ],
  alternates: { canonical: `${SITE_URL}/services` },
  openGraph: {
    title: 'SEO & Digital Marketing Services | Arshanemi',
    description:
      "Complete SEO and digital marketing services from Surat's leading agency. Local SEO, eCommerce SEO, Google Ads, Link Building & more.",
    url: `${SITE_URL}/services`,
    images: [{ url: `${SITE_URL}/images/arshanemi-infotech-logo.png`, width: 1200, height: 630, alt: 'Arshanemi Services' }],
  },
  twitter: {
    title: 'SEO & Digital Marketing Services | Arshanemi',
    description: 'Complete SEO and digital marketing solutions for businesses in India & UAE.',
    images: [`${SITE_URL}/images/arshanemi-infotech-logo.png`],
  },
};

function ServiceCard({ service }) {
  const Icon = LucideIcons[service.icon] || LucideIcons.Globe;
  const featureLabels = service.features.map((f) => (typeof f === 'string' ? f : f.title));
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group bg-card border border-divider rounded-2xl p-6 hover:border-accent/50 hover:bg-card-hover card-glow transition-all duration-300 flex flex-col"
    >
      <div className="w-11 h-11 rounded-xl bg-accent/8 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
        <Icon size={20} className="text-accent-light" />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-2">{service.title}</h3>
      <p className="text-xs text-muted leading-relaxed flex-1 mb-4">{service.shortDesc}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {featureLabels.slice(0, 3).map((f) => (
          <span key={f} className="text-xs bg-surface border border-divider text-subtle px-2 py-0.5 rounded-full">{f}</span>
        ))}
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light group-hover:gap-2.5 transition-all">
        Learn More <ArrowRight size={11} />
      </span>
    </Link>
  );
}

export default async function ServicesPage() {
  const blobServices = await getCachedCollection('services');
  const services = blobServices.length ? blobServices : defaultServices;

  // Derive unique categories in order of first appearance, using known labels where possible
  const categoryMap = new Map();
  for (const s of services) {
    if (!s.category) continue;
    if (!categoryMap.has(s.category)) categoryMap.set(s.category, []);
    categoryMap.get(s.category).push(s);
  }
  const categories = [...categoryMap.entries()].map(([catId, catServices]) => {
    const known = serviceCategories.find((c) => c.id === catId);
    return { id: catId, label: known ? known.label : catId, services: catServices };
  });

  return (
    <>
      {/* Hero */}
      <section className="relative pt-[120px] pb-16 bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 60%)' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-accent-light uppercase bg-accent/8 border border-accent/20 px-3 py-1.5 rounded-full mb-6">
            Our Services
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
            Complete SEO & <span className="gradient-text">Digital Marketing</span> Solutions
          </h1>
          <p className="text-lg text-muted">From local SEO to enterprise digital strategies — every service tailored to your business goals.</p>
        </div>
      </section>

      {/* Services grouped by category — works with any category values */}
      {categories.map((cat) => (
        <section key={cat.id} className="section-pad bg-surface first:pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-foreground mb-8 pb-4 border-b border-divider capitalize">{cat.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {cat.services.map((s) => <ServiceCard key={s.slug} service={s} />)}
            </div>
          </div>
        </section>
      ))}

      <CTABanner />
    </>
  );
}
