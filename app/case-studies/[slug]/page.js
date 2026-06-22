import { notFound } from 'next/navigation';
import { getCachedCollection, getCachedSingleton } from '@/lib/db';
import { caseStudies as defaultCaseStudies } from '@/data/caseStudies';
import { COMPANY_WHATSAPP } from '@/data/company';
import CTABanner from '@/components/sections/CTABanner';
import CaseStudyDetail from './CaseStudyDetail';

const SITE_URL = 'https://www.santhyainfotech.com';

function getSlug(cs) {
  return cs.slug || cs.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function resolveStudy(slug) {
  const blob = await getCachedCollection('case-studies');
  const list = blob.length ? blob : defaultCaseStudies;
  return list.find((cs) => getSlug(cs) === slug) ?? null;
}

export async function generateStaticParams() {
  const blob = await getCachedCollection('case-studies');
  const list = blob.length ? blob : defaultCaseStudies;
  return list.map((cs) => ({ slug: getSlug(cs) }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cs = await resolveStudy(slug);
  if (!cs) return {};
  const pageUrl = `${SITE_URL}/case-studies/${slug}`;
  return {
    title: `${cs.title} | Case Study — Santhya Infotech`,
    description: cs.description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${cs.title} | Santhya Infotech`,
      description: cs.description,
      url: pageUrl,
      images: [{ url: cs.image || `${SITE_URL}/images/santhya-infotech-logo.png`, width: 1200, height: 630, alt: cs.title }],
    },
    twitter: {
      title: `${cs.title} | Santhya Infotech`,
      description: cs.description,
      images: [cs.image || `${SITE_URL}/images/santhya-infotech-logo.png`],
    },
  };
}

function buildSchema(cs, slug) {
  const pageUrl = `${SITE_URL}/case-studies/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cs.title,
    description: cs.description,
    url: pageUrl,
    author: { '@type': 'Organization', name: 'Santhya Infotech', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Santhya Infotech', url: SITE_URL },
    ...(cs.image ? { image: cs.image } : {}),
  };
}

function buildBreadcrumbSchema(cs, slug) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Case Studies', item: `${SITE_URL}/case-studies` },
      { '@type': 'ListItem', position: 3, name: cs.title, item: `${SITE_URL}/case-studies/${slug}` },
    ],
  };
}

export default async function CaseStudyDetailPage({ params }) {
  const { slug } = await params;
  const [cs, blob, company] = await Promise.all([
    resolveStudy(slug),
    getCachedCollection('case-studies'),
    getCachedSingleton('company'),
  ]);

  if (!cs) notFound();

  const allStudies = blob.length ? blob : defaultCaseStudies;
  const related = allStudies
    .filter((s) => getSlug(s) !== slug && (s.industry === cs.industry || s.service === cs.service))
    .slice(0, 3);
  const fallbackRelated = allStudies.filter((s) => getSlug(s) !== slug).slice(0, 3);

  const whatsapp = company?.whatsapp || COMPANY_WHATSAPP;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSchema(cs, slug)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(cs, slug)) }} />
      <CaseStudyDetail cs={cs} related={related.length ? related : fallbackRelated} whatsapp={whatsapp} />
      <CTABanner />
    </>
  );
}
