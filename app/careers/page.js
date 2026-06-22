import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import CTABanner from '@/components/sections/CTABanner';
import CareersJobGrid from '@/components/careers/CareersJobGrid';
import { COMPANY_EMAIL as defaultEmail, COMPANY_HR_EMAIL as defaultHrEmail } from '@/data/company';
import { openings as defaultOpenings, perks as defaultPerks } from '@/data/careers';
import { getCachedCollection, getCachedSingleton } from '@/lib/db';

export const metadata = {
  title: 'Careers | Santhya Infotech',
  description: "Join the Santhya Infotech team. We're hiring passionate SEO and digital marketing professionals in Surat, Gujarat.",
};

export default async function CareersPage() {
  const [careersCollection, company] = await Promise.all([
    getCachedCollection('careers'),
    getCachedSingleton('company'),
  ]);

  const blobOpenings = careersCollection.filter((c) => c.type === 'opening');
  const openings = blobOpenings.length ? blobOpenings : defaultOpenings;
  const perks = defaultPerks;

  const companyEmail = company?.email || defaultEmail;
  const hrEmail = company?.hrEmail || companyEmail || defaultHrEmail;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-[120px] pb-20 bg-background overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 60%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-accent-light uppercase bg-accent/8 border border-accent/20 px-4 py-1.5 rounded-full mb-6">
            We're Hiring
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
            Build Your Career in{' '}
            <span className="gradient-text">Digital Marketing</span>
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            We're looking for passionate, driven professionals to join Santhya Infotech and help our clients dominate search.
          </p>
          <p className="mt-4 text-sm text-subtle">
            Click <strong className="text-muted">View Details &amp; Apply</strong> on any role to see the full JD and submit your application.
          </p>
        </div>
      </section>

      {/* ── Open Positions ────────────────────────────────────── */}
      <section className="section-pad bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Open Positions"
            title="Current Job Openings"
            subtitle="Browse our open roles. Click any card to view the full JD and apply directly — no middleman."
          />

          {/* Client component handles modal + apply form */}
          <CareersJobGrid jobs={openings} hrEmail={hrEmail} />

          <p className="mt-8 text-center text-sm text-muted">
            Don&apos;t see a fit?{' '}
            <Link
              href={`mailto:${hrEmail}?subject=Open Application — Santhya Infotech`}
              className="text-accent-light hover:text-accent transition-colors font-medium"
            >
              Send us your CV anyway
            </Link>{' '}
            — we&apos;re always looking for exceptional people.
          </p>
        </div>
      </section>

      {/* ── Perks ─────────────────────────────────────────────── */}
      <section className="section-pad bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Why Join Us"
            title="Perks &amp; Benefits"
            subtitle="We invest in our team so they can deliver exceptional results for our clients."
          />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {perks.map((perk) => (
              <div
                key={perk}
                className="flex items-start gap-3 bg-card border border-divider rounded-xl p-4"
              >
                <CheckCircle size={16} className="text-accent-light mt-0.5 shrink-0" />
                <span className="text-sm text-muted">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ready to Apply CTA ────────────────────────────────── */}
      <section className="section-pad bg-surface border-y border-divider">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Apply?</h2>
          <p className="text-muted mb-6 text-sm">
            Send your resume and a short intro directly to our HR team. We respond within 2 business days.
          </p>
          <Link
            href={`mailto:${hrEmail}?subject=Career Application — Santhya Infotech`}
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors"
          >
            Email Your CV <ArrowRight size={14} />
          </Link>
          <p className="mt-4 text-xs text-subtle">
            204 Nilkanth Darshan Building, Katargam, Surat, Gujarat 395004
          </p>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
