import { getCachedCollection, getCachedSingleton } from '@/lib/db';
import { caseStudies as defaultCaseStudies, caseStudyStats } from '@/data/caseStudies';
import { COMPANY_WHATSAPP } from '@/data/company';
import { seoProcess } from '@/data/process';
import { caseStudyTestimonials } from '@/data/testimonials';
import CaseStudiesClient from './CaseStudiesClient';

export const metadata = {
  title: 'Case Studies | Santhya Infotech',
  description: 'Real SEO results for real businesses. Browse Santhya Infotech case studies across Healthcare, eCommerce, Real Estate, and more.',
};

export default async function CaseStudiesPage() {
  const [blobCaseStudies, company] = await Promise.all([
    getCachedCollection('case-studies'),
    getCachedSingleton('company'),
  ]);
  const caseStudies = blobCaseStudies.length ? blobCaseStudies : defaultCaseStudies;
  const whatsapp = company?.whatsapp || COMPANY_WHATSAPP;

  return (
    <CaseStudiesClient
      caseStudies={caseStudies}
      caseStudyStats={caseStudyStats}
      seoProcess={seoProcess}
      caseStudyTestimonials={caseStudyTestimonials}
      whatsapp={whatsapp}
    />
  );
}
