import { notFound } from 'next/navigation';
import { services as defaultServices, getServiceBySlug } from '@/data/services';
import { caseStudies as defaultCaseStudies } from '@/data/caseStudies';
import { industries as defaultIndustries } from '@/data/industries';
import CTABanner from '@/components/sections/CTABanner';
import FAQSection from '@/components/sections/FAQSection';
import ServiceDetail from './ServiceDetail';
import { getCachedCollection } from '@/lib/db';

const SITE_URL = 'https://www.santhyainfotech.com';

async function resolveServiceData(slug) {
  const blobServices = await getCachedCollection('services');
  const staticService = getServiceBySlug(slug);
  const blobService = blobServices.length ? blobServices.find((s) => s.slug === slug) : null;
  // Merge static defaults with blob data — blob wins field-by-field, but static fills any gap
  // so that hero/process/whyUs/faqs always render even before re-seeding
  const resolved = blobService ? { ...staticService, ...blobService } : staticService;
  return { service: resolved, content: resolved || {} };
}

export async function generateStaticParams() {
  const blobServices = await getCachedCollection('services');
  const list = blobServices.length ? blobServices : defaultServices;
  return list.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { service, content } = await resolveServiceData(slug);
  if (!service) return {};
  const description = content?.hero?.subtext || service.shortDesc;
  const pageUrl = `${SITE_URL}/services/${slug}`;

  return {
    title: `${service.title} Services in India | Arshanemi`,
    description,
    keywords: [
      `${service.title.toLowerCase()} services`, `${service.title.toLowerCase()} agency India`,
      `${service.title.toLowerCase()} Surat`, 'SEO agency Surat', 'Arshanemi',
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${service.title} Services | Arshanemi`,
      description,
      url: pageUrl,
      images: [
        { url: `${SITE_URL}/images/arshanemi-infotech-logo.png`, width: 1200, height: 630, alt: `${service.title} — Arshanemi` },
      ],
    },
    twitter: {
      title: `${service.title} Services | Arshanemi`,
      description,
      images: [`${SITE_URL}/images/arshanemi-infotech-logo.png`],
    },
  };
}

function buildServiceSchema(service, content, slug) {
  const pageUrl = `${SITE_URL}/services/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${pageUrl}/#service`,
    serviceType: service.title,
    name: `${service.title} by Arshanemi`,
    description: content?.hero?.subtext || service.shortDesc,
    url: pageUrl,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: [
      { '@type': 'Country', name: 'India' },
      { '@type': 'Country', name: 'UAE' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${service.title} Features`,
      itemListElement: (service.features || []).map((f, i) => ({
        '@type': 'Offer',
        position: i + 1,
        itemOffered: {
          '@type': 'Service',
          name: typeof f === 'string' ? f : f.title,
          description: typeof f === 'string' ? '' : (f.desc || ''),
        },
      })),
    },
  };
}

function buildBreadcrumbSchema(service, slug) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE_URL}/services` },
      { '@type': 'ListItem', position: 3, name: service.title, item: `${SITE_URL}/services/${slug}` },
    ],
  };
}

function buildFaqSchema(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question || faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer || faq.a,
      },
    })),
  };
}

export default async function ServiceDetailPage({ params }) {
  const { slug } = await params;
  const [{ service, content }, blobCaseStudies, blobIndustries] = await Promise.all([
    resolveServiceData(slug),
    getCachedCollection('case-studies'),
    getCachedCollection('industries'),
  ]);
  if (!service) notFound();
  const faqSchema = buildFaqSchema(content.faqs);

  const caseStudies = blobCaseStudies.length ? blobCaseStudies : defaultCaseStudies;
  const industries = blobIndustries.length ? blobIndustries : defaultIndustries;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildServiceSchema(service, content, slug)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(service, slug)) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <ServiceDetail service={service} content={content} caseStudies={caseStudies} industries={industries} />
      <FAQSection
        faqs={content.faqs}
        title={`${service.title} FAQs`}
        subtitle={`Common questions about our ${service.title.toLowerCase()} services.`}
      />
      <CTABanner />
    </>
  );
}
