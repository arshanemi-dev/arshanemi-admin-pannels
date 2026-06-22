import * as LucideIcons from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import ContactForm from '@/components/sections/ContactForm';
import { COMPANY_EMAIL, COMPANY_PHONE_PRIMARY, COMPANY_WHATSAPP } from '@/data/company';
import { contactInfo } from '@/data/contact';
import { getCachedCollection } from '@/lib/db';
import { services as defaultServices } from '@/data/services';

const SITE_URL = 'https://www.santhyainfotech.com';

export const metadata = {
  title: 'Contact Santhya Infotech — Free SEO Audit & Consultation',
  description:
    `Contact Santhya Infotech for a free SEO audit and digital marketing consultation. Call ${COMPANY_PHONE_PRIMARY}, email ${COMPANY_EMAIL}, or WhatsApp us. Based in Surat, Gujarat.`,
  keywords: [
    'contact Santhya Infotech', 'free SEO audit Surat', 'SEO consultation India',
    'digital marketing agency contact', 'SEO agency Surat phone number',
  ],
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: 'Contact Santhya Infotech — Free SEO Audit & Consultation',
    description:
      'Get a free SEO audit and consultation from Surat\'s leading digital marketing agency. Call, email, or WhatsApp us today — no commitment required.',
    url: `${SITE_URL}/contact`,
    images: [{ url: `${SITE_URL}/images/santhya-infotech-logo.png`, width: 1200, height: 630, alt: 'Contact Santhya Infotech' }],
  },
  twitter: {
    title: 'Contact Santhya Infotech — Free SEO Audit',
    description: 'Get a free SEO audit from Surat\'s leading digital marketing agency. No commitment required.',
    images: [`${SITE_URL}/images/santhya-infotech-logo.png`],
  },
};


const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'ProfessionalService'],
  '@id': `${SITE_URL}/#organization`,
  name: 'Santhya Infotech',
  image: `${SITE_URL}/images/santhya-infotech-logo.png`,
  url: SITE_URL,
  telephone: COMPANY_PHONE_PRIMARY,
  email: COMPANY_EMAIL,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '204 Nilkanth Darshan Building, Katargam',
    addressLocality: 'Surat',
    addressRegion: 'Gujarat',
    postalCode: '395004',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '21.2102',
    longitude: '72.8311',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '21:00',
    },
  ],
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, Net Banking, UPI',
};

export default async function ContactPage() {
  const blobServices = await getCachedCollection('services');
  const serviceTitles = (blobServices.length ? blobServices : defaultServices).map((s) => s.title);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {/* Hero */}
      <section className="relative pt-[120px] pb-16 bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 60%)' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-accent-light uppercase bg-accent/8 border border-accent/20 px-3 py-1.5 rounded-full mb-6">
            Get In Touch
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
            Let's Grow Your Business <span className="gradient-text">Together</span>
          </h1>
          <p className="text-muted text-lg">Get a free SEO audit and consultation — no commitment required.</p>
        </div>
      </section>

      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Form — service list comes from services.js / blob */}
            <ContactForm services={serviceTitles} />

            {/* Info */}
            <div className="space-y-6">
              <div>
                <SectionHeading
                  eyebrow="Contact Info"
                  title="We're Here to Help"
                  subtitle="Reach out via call, email, or WhatsApp — our team responds within a few hours."
                  center={false}
                />
              </div>

              <div className="space-y-4">
                {contactInfo.map(({ icon, label, value, href }) => {
                  const Icon = LucideIcons[icon] || LucideIcons.MapPin;
                  return (
                  <div key={label} className="flex gap-4 bg-card border border-divider rounded-xl p-5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-accent-light" />
                    </div>
                    <div>
                      <p className="text-xs text-subtle font-semibold uppercase tracking-wider mb-1">{label}</p>
                      {href
                        ? <a href={href} className="text-sm text-muted hover:text-foreground transition-colors">{value}</a>
                        : <p className="text-sm text-muted">{value}</p>
                      }
                    </div>
                  </div>
                  );
                })}
              </div>

              <a
                href={`https://wa.me/${COMPANY_WHATSAPP}?text=Hi%2C%20I%20want%20a%20free%20SEO%20audit.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-card border border-green-500/30 rounded-xl p-5 hover:border-green-500/60 hover:bg-card-hover transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <MessageCircle size={18} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">WhatsApp Us</p>
                  <p className="text-xs text-muted">Quick response — usually within 30 minutes</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
