import { notFound } from 'next/navigation';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { industries as defaultIndustries, getIndustryBySlug } from '@/data/industries';
import { getServiceBySlug } from '@/data/services';
import { caseStudies as defaultCaseStudies } from '@/data/caseStudies';
import { seoPackages as defaultSeoPackages } from '@/data/seoPackages';
import CTABanner from '@/components/sections/CTABanner';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { CheckCircle, ArrowRight, TrendingUp, Package, Star, Zap } from 'lucide-react';
import { getCachedCollection } from '@/lib/db';

const SITE_URL = 'https://www.santhyainfotech.com';

export async function generateStaticParams() {
  const blobIndustries = await getCachedCollection('industries');
  const list = blobIndustries.length ? blobIndustries : defaultIndustries;
  return list.map((i) => ({ slug: i.slug }));
}

async function resolveIndustryData(slug) {
  const [blobIndustries, blobServices, blobCaseStudies, blobPackages] = await Promise.all([
    getCachedCollection('industries'),
    getCachedCollection('services'),
    getCachedCollection('case-studies'),
    getCachedCollection('seo-packages'),
  ]);
  const industry = blobIndustries.length
    ? blobIndustries.find((i) => i.slug === slug)
    : getIndustryBySlug(slug);
  const services = blobServices.length ? blobServices : null;
  const caseStudies = blobCaseStudies.length ? blobCaseStudies : defaultCaseStudies;
  const seoPackages = blobPackages.length ? blobPackages : defaultSeoPackages;
  return { industry: industry || getIndustryBySlug(slug), services, caseStudies, seoPackages };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { industry } = await resolveIndustryData(slug);
  if (!industry) return {};
  const pageUrl = `${SITE_URL}/industries/${slug}`;
  const description = `Specialized ${industry.name} SEO by Arshanemi. ${industry.description}`;

  return {
    title: `${industry.name} SEO Services in India | Arshanemi`,
    description,
    keywords: [
      `${industry.name.toLowerCase()} SEO`, `SEO for ${industry.name.toLowerCase()}`,
      `${industry.name.toLowerCase()} digital marketing India`, 'SEO agency Surat',
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${industry.name} SEO Services | Arshanemi`,
      description,
      url: pageUrl,
      images: [
        { url: `${SITE_URL}/images/arshanemi-infotech-logo.png`, width: 1200, height: 630, alt: `${industry.name} SEO — Arshanemi` },
      ],
    },
    twitter: {
      title: `${industry.name} SEO Services | Arshanemi`,
      description,
      images: [`${SITE_URL}/images/arshanemi-infotech-logo.png`],
    },
  };
}

function buildBreadcrumbSchema(industry, slug) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Industries', item: `${SITE_URL}/industries` },
      { '@type': 'ListItem', position: 3, name: `${industry.name} SEO`, item: `${SITE_URL}/industries/${slug}` },
    ],
  };
}

function buildServiceSchema(industry, slug) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `${industry.name} SEO`,
    name: `${industry.name} SEO Services by Arshanemi`,
    description: industry.description,
    url: `${SITE_URL}/industries/${slug}`,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: [
      { '@type': 'Country', name: 'India' },
      { '@type': 'Country', name: 'UAE' },
    ],
  };
}

// ── SEO Packages Teaser Strip ─────────────────────────────────────────────────
function PackagesTeaser({ industryName, seoPackages }) {
  const plans = seoPackages.map((pkg) => ({
    name: pkg.name,
    price: `${pkg.currency}${pkg.price}`,
    color: pkg.color,
    popular: pkg.badge === 'Most Popular',
    features: pkg.teaserFeatures,
  }));

  return (
    <section className="section-pad bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-accent/10 border border-accent/20 text-accent-light mb-4">
            <Package size={12} />
            Transparent Pricing
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            {industryName} SEO <span className="gradient-text">Packages & Pricing</span>
          </h2>
          <p className="text-sm text-muted max-w-xl mx-auto">
            No lock-in contracts. Pick the plan that fits your growth goals and budget.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
                plan.popular
                  ? 'border-accent/50 shadow-lg shadow-accent/10'
                  : 'border-divider hover:border-divider-light'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-amber-400 to-orange-500 shadow-md">
                    <Zap size={9} /> Most Popular
                  </span>
                </div>
              )}
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} mb-4 shadow-md`}>
                <span className="text-white font-bold text-sm">{plan.name[0]}</span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">{plan.name} Plan</h3>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-xs text-muted mb-1">/month</span>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted">
                    <CheckCircle size={12} className="text-accent-light shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={`/seo-packages#packages`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light hover:text-accent transition-colors"
              >
                See Full Details <ArrowRight size={11} />
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button href="/seo-packages" size="lg">
            View Full Pricing & Features <ArrowRight size={16} />
          </Button>
          <p className="text-xs text-subtle mt-3">Includes AEO, GEO, AI SEO & Free Audit — No hidden fees</p>
        </div>
      </div>
    </section>
  );
}

// ── Case Studies Teaser ───────────────────────────────────────────────────────
function CaseStudiesTeaser({ industryName, caseStudies }) {
  const relevant = caseStudies.filter(
    (cs) =>
      cs.industry.toLowerCase().includes(industryName.toLowerCase()) ||
      industryName.toLowerCase().includes(cs.industry.toLowerCase())
  ).slice(0, 2);

  const display = relevant.length > 0 ? relevant : caseStudies.slice(0, 2);

  return (
    <section className="section-pad bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent/10 border border-accent/20 text-accent-light mb-4">
              <TrendingUp size={11} />
              Proven Results
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {relevant.length > 0 ? `${industryName} ` : ''}Case Studies
            </h2>
            <p className="text-sm text-muted mt-2 max-w-lg">
              Real businesses, real growth. See how we&apos;ve delivered measurable SEO results.
            </p>
          </div>
          <Button href="/case-studies" variant="secondary" size="md" className="shrink-0">
            All Case Studies <ArrowRight size={14} />
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {display.map((cs) => (
            <div
              key={cs.id}
              className="bg-card border border-divider rounded-2xl overflow-hidden hover:border-divider-light hover:shadow-md transition-all duration-300 group"
            >
              {/* Metrics header */}
              <div className="h-36 bg-gradient-to-br from-accent/10 to-cyan/5 relative flex items-center justify-center px-6 gap-4">
                {cs.metrics.map((m) => (
                  <div key={m.label} className="text-center flex-1">
                    <div className="text-2xl sm:text-3xl font-extrabold gradient-text">{m.value}</div>
                    <div className="text-[10px] text-muted mt-0.5">{m.label}</div>
                  </div>
                ))}
                <TrendingUp size={32} className="absolute right-4 bottom-3 text-accent-light opacity-10 group-hover:opacity-20 transition-opacity" />
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-accent-light transition-colors">
                    {cs.title}
                  </h3>
                  <span className="text-[10px] font-medium text-subtle bg-card-hover border border-divider px-2 py-0.5 rounded shrink-0">
                    {cs.duration}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed mb-4">{cs.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-subtle">{cs.client} · {cs.industry}</span>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent-light hover:text-accent transition-colors"
                  >
                    Get Similar Results <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button href="/case-studies" size="md">
            <Star size={15} />
            Browse All Case Studies
          </Button>
          <Button href="/contact" size="md" variant="secondary">
            Get a Free SEO Audit <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default async function IndustryDetailPage({ params }) {
  const { slug } = await params;
  const { industry, services: blobServices, caseStudies, seoPackages } = await resolveIndustryData(slug);
  if (!industry) notFound();

  const Icon = LucideIcons[industry.icon] || LucideIcons.Briefcase;
  const relatedServices = (industry.services || [])
    .map((s) => blobServices ? blobServices.find((sv) => sv.slug === s) : getServiceBySlug(s))
    .filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(industry, slug)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildServiceSchema(industry, slug)) }}
      />

      {/* Hero */}
      <section className="relative pt-[120px] pb-16 bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 60%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-6">
            <Icon size={28} className="text-accent-light" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
            {industry.name} <span className="gradient-text">SEO Services</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-8">{industry.description}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/contact" size="lg">
              Get Free {industry.name} SEO Audit <ArrowRight size={18} />
            </Button>
            <Button href="/seo-packages" size="lg" variant="secondary">
              <Package size={17} />
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits + Related Services */}
      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionHeading
                eyebrow={`${industry.name} SEO`}
                title={`What We Deliver for ${industry.name} Businesses`}
                center={false}
              />
              <ul className="mt-8 space-y-3">
                {industry.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-muted">
                    <CheckCircle size={16} className="text-accent-light shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              {/* Quick CTA under benefits */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/case-studies" size="sm" variant="secondary">
                  <TrendingUp size={14} />
                  See Case Studies
                </Button>
                <Button href="/seo-packages" size="sm" variant="outline">
                  <Package size={14} />
                  Pricing Plans
                </Button>
              </div>
            </div>
            <div className="bg-card border border-divider rounded-2xl p-8 space-y-5 shadow-sm">
              <p className="text-xs font-semibold text-subtle uppercase tracking-wider">Related Services</p>
              {relatedServices.map((s) => {
                const SIcon = LucideIcons[s.icon] || LucideIcons.Globe;
                return (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <SIcon size={16} className="text-accent-light" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-accent-light transition-colors">{s.title}</p>
                      <p className="text-xs text-muted">{s.shortDesc.slice(0, 55)}…</p>
                    </div>
                    <ArrowRight size={14} className="text-muted group-hover:text-accent-light transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Teaser */}
      <CaseStudiesTeaser industryName={industry.name} caseStudies={caseStudies} />

      {/* SEO Packages Teaser */}
      <PackagesTeaser industryName={industry.name} seoPackages={seoPackages} />

      <CTABanner />
    </>
  );
}
