import { getCachedCollection, getCachedSingleton } from '@/lib/db';
import { seoPackages as defaultPackages, packageBenefits, packageFaqs, packageTrustStrip, packageSocialProof } from '@/data/seoPackages';
import { COMPANY_WHATSAPP } from '@/data/company';
import SeoPackagesClient from './SeoPackagesClient';

const SITE_URL = 'https://www.santhyainfotech.com';

export const metadata = {
  title: 'SEO Packages & Pricing | Santhya Infotech',
  description: 'Transparent SEO packages starting from $150/month. Choose Starter, Growth, or Pro — all include full-service SEO with no hidden fees.',
  alternates: { canonical: `${SITE_URL}/seo-packages` },
};

export default async function SeoPackagesPage() {
  const [blobPackages, company] = await Promise.all([
    getCachedCollection('seo-packages'),
    getCachedSingleton('company'),
  ]);
  const seoPackages = blobPackages.length ? blobPackages : defaultPackages;
  const whatsapp = company?.whatsapp || COMPANY_WHATSAPP;

  return (
    <SeoPackagesClient
      seoPackages={seoPackages}
      packageBenefits={packageBenefits}
      packageFaqs={packageFaqs}
      packageTrustStrip={packageTrustStrip}
      packageSocialProof={packageSocialProof}
      whatsapp={whatsapp}
    />
  );
}
