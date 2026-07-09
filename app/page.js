import HeroSection from '@/components/sections/HeroSection';
import LogosTicker from '@/components/sections/LogosTicker';
import StatsSection from '@/components/sections/StatsSection';
import ServicesGrid from '@/components/sections/ServicesGrid';
import ProcessSection from '@/components/sections/ProcessSection';
import IndustriesSection from '@/components/sections/IndustriesSection';
import CaseStudiesCarousel from '@/components/sections/CaseStudiesCarousel';
import TestimonialsCarousel from '@/components/sections/TestimonialsCarousel';
import TrustBadges from '@/components/sections/TrustBadges';
import FAQSection from '@/components/sections/FAQSection';
import CTABanner from '@/components/sections/CTABanner';
import { COMPANY_EMAIL, COMPANY_PHONE_PRIMARY } from '@/data/company';
import { getCachedCollection, getCachedSingleton } from '@/lib/db';

const SITE_URL = 'https://www.santhyainfotech.com';

export const metadata = {
  title: 'SEO & Digital Marketing Agency in Surat, Gujarat | #1 Ranked',
  description:
    "Rank higher on Google and grow your business with Arshanemi — Surat's #1 SEO & digital marketing agency. Local SEO, eCommerce SEO, Google Ads, Link Building & more. Free SEO audit available.",
  keywords: [
    'SEO agency Surat', 'best SEO company Surat', 'digital marketing agency Surat Gujarat',
    'local SEO services', 'ecommerce SEO India', 'Google Ads management',
    'search engine optimization Surat', 'SEO consultant Gujarat', 'free SEO audit',
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Arshanemi — #1 SEO & Digital Marketing Agency in Surat',
    description:
      "Rank higher on Google and grow your business with Surat's leading SEO & digital marketing agency. Local SEO, eCommerce SEO, Google Ads, and more. Free audit available.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/images/arshanemi-infotech-logo.png`,
        width: 1200,
        height: 630,
        alt: 'Arshanemi — SEO & Digital Marketing Agency Surat',
      },
    ],
  },
  twitter: {
    title: 'Arshanemi — #1 SEO & Digital Marketing Agency in Surat',
    description:
      "Rank higher on Google and grow your business with Surat's leading SEO agency. Free SEO audit available.",
    images: [`${SITE_URL}/images/arshanemi-infotech-logo.png`],
  },
};

const homepageFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What SEO services does Arshanemi offer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Arshanemi offers Local SEO, eCommerce SEO, Shopify SEO, WooCommerce SEO, Technical SEO, Link Building, Google Ads (PPC), Social Media Marketing, Content Writing, YouTube SEO, Google My Business Optimization, and White Label SEO services.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Arshanemi based in Surat?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Arshanemi is headquartered at 204 Nilkanth Darshan Building, Katargam, Surat, Gujarat 395004, India. We serve clients across India, UAE, and globally.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does SEO take to show results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SEO is a long-term investment. Most businesses start seeing measurable improvements in 3–6 months, with significant ranking gains typically occurring between 6–12 months. Results depend on competition, domain authority, and the scope of work.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer a free SEO audit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Yes! We offer a comprehensive free SEO audit for your website. Contact us via phone (${COMPANY_PHONE_PRIMARY}), email (${COMPANY_EMAIL}), or WhatsApp to get started — no commitment required.`,
      },
    },
    {
      '@type': 'Question',
      name: 'What industries does Arshanemi serve?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We specialize in SEO for Healthcare, Dental, Law Firms, Real Estate, Hotels & Hospitality, eCommerce, Gyms & Fitness, Restaurants, Education, and many more industries across India and UAE.',
      },
    },
  ],
};

export default async function HomePage() {
  const [
    services, industries, testimonials, caseStudies, partners,
    stats, faqs, hero, processData, badges, company,
  ] = await Promise.all([
    getCachedCollection('services'),
    getCachedCollection('industries'),
    getCachedCollection('testimonials'),
    getCachedCollection('case-studies'),
    getCachedCollection('partners'),
    getCachedSingleton('stats'),
    getCachedCollection('faqs'),
    getCachedSingleton('hero'),
    getCachedSingleton('process'),
    getCachedSingleton('badges'),
    getCachedSingleton('company'),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqSchema) }}
      />
      <HeroSection
        phone={company?.phonePrimary}
        bullets={hero?.bullets}
        metrics={hero?.metrics}
      />
      <LogosTicker partners={partners} />
      <StatsSection stats={Array.isArray(stats) ? stats : undefined} />
      <ServicesGrid services={services} />
      <ProcessSection processSteps={processData?.processSteps} />
      <IndustriesSection industries={industries} />
      <CaseStudiesCarousel caseStudies={caseStudies} />
      <TestimonialsCarousel testimonials={testimonials} />
      <TrustBadges trustBadges={Array.isArray(badges) ? badges : undefined} />
      <FAQSection faqs={faqs} />
      <CTABanner
        email={company?.email}
        phonePrimary={company?.phonePrimary}
        phoneSecondary={company?.phoneSecondary}
        whatsapp={company?.whatsapp}
      />
    </>
  );
}
