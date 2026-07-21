import './globals.css';
import Script from 'next/script';
import { headers } from 'next/headers';
import Header from '@/components/layout/Header';
import ToolsNavbar from '@/components/layout/ToolsNavbar';
import Footer from '@/components/layout/Footer';
import SessionManager from '@/components/admin/SessionManager';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import LeadPopup from '@/components/ui/LeadPopup';
import SplashScreen from '@/components/ui/SplashScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { COMPANY_EMAIL, COMPANY_PHONE_PRIMARY, COMPANY_PHONE_SECONDARY, COMPANY_NAME } from '@/data/company';
import { getCachedSingleton } from '@/lib/db';
import { getAllTools } from '@/lib/tools';
import { defaultTheme } from '@/data/defaultTheme';

const SITE_URL = 'https://www.arshanemi.com';
const SITE_NAME = 'Arshanemi';
const OG_IMAGE = `${SITE_URL}/images/arshanemi-logo.png`;

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'Arshanemi — Smart Ecommerce Tools for Modern Sellers',
    template: '%s | Arshanemi',
  },
  description:
    'Arshanemi provides powerful ecommerce tools for product research, competitor analysis, profit calculation, keyword discovery and more — built to help sellers scale faster with data-driven decisions.',
  keywords: [
    'ecommerce tools', 'product research tool', 'competitor analysis', 'profit calculator',
    'Amazon seller tools', 'Flipkart seller tools', 'keyword research ecommerce',
    'dropshipping tools', 'online selling platform', 'ecommerce analytics',
    'Arshanemi', 'ecommerce growth tools India', 'seller intelligence platform',
  ],
  authors: [{ name: 'Arshanemi Team', url: `${SITE_URL}/about` }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Arshanemi — Smart Ecommerce Tools for Modern Sellers',
    description:
      'Powerful ecommerce tools for product research, competitor analysis, profit calculation and keyword discovery. Scale your online business faster.',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Arshanemi — Smart Ecommerce Tools',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@arshanemi',
    creator: '@arshanemi',
    title: 'Arshanemi — Smart Ecommerce Tools for Modern Sellers',
    description:
      'Powerful ecommerce tools for product research, competitor analysis, profit calculation and keyword discovery.',
    images: [OG_IMAGE],
  },

  icons: {
    icon: [
      { url: '/images/arshanemi-logo.png', type: 'image/png', sizes: 'any' },
    ],
    apple: [
      { url: '/images/arshanemi-logo.png', type: 'image/png' },
    ],
    shortcut: '/images/arshanemi-logo.png',
  },

  alternates: {
    canonical: SITE_URL,
  },

  category: 'technology',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'SoftwareApplication'],
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: 'Arshanemi Ecommerce Tools',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: OG_IMAGE,
    width: '400',
    height: '400',
  },
  image: OG_IMAGE,
  description:
    'Arshanemi provides powerful ecommerce tools for product research, competitor analysis, profit calculation and keyword discovery — helping online sellers scale faster.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Tech Park',
    addressLocality: 'Surat',
    addressRegion: 'Gujarat',
    postalCode: '395007',
    addressCountry: 'IN',
  },
  telephone: [COMPANY_PHONE_PRIMARY, COMPANY_PHONE_SECONDARY],
  email: COMPANY_EMAIL,
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  areaServed: [
    { '@type': 'Country', name: 'India' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Ecommerce Tools',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Product Research Tool' } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Competitor Analysis Tool' } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Profit Calculator' } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Keyword Finder' } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Price Tracker' } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Sales Estimator' } },
    ],
  },
  sameAs: [],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description: 'Smart Ecommerce Tools for Modern Sellers',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/tools?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: 'en-IN',
};

const AUTH_ONLY_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password']

export default async function RootLayout({ children }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isAdmin = pathname.startsWith('/settings')
  const isToolsSection = pathname.startsWith('/tools')
  // Auth screens (/login, /signup, ...) render their own full-bleed branded
  // layout — the site Header/Footer would just duplicate/clash with that.
  const hideChrome = isAdmin || AUTH_ONLY_PATHS.includes(pathname)

  const [company, navigation, liveTools, savedTheme] = await Promise.all([
    getCachedSingleton('company').catch(() => ({})),
    getCachedSingleton('navigation').catch(() => ({})),
    getAllTools(),
    getCachedSingleton('theme').catch(() => null),
  ])
  const siteTheme = (savedTheme?.mode) ? savedTheme : defaultTheme

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/images/arshanemi-logo.png" />
        <link rel="shortcut icon" type="image/png" href="/images/arshanemi-logo.png" />
        <link rel="apple-touch-icon" href="/images/arshanemi-logo.png" />
        {!isAdmin && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
          </>
        )}
      </head>
      <body className={`antialiased bg-background text-foreground ${isAdmin ? 'overflow-hidden' : 'min-h-screen flex flex-col'}`}>
        <Script id="theme-init" strategy="beforeInteractive">{`(function(){var d=document.documentElement;try{var raw=localStorage.getItem('arshanemi-theme-config');if(raw){var obj=JSON.parse(raw),data=obj.data,ts=obj.ts;if(Date.now()-ts<600000&&data&&data.mode){var mode=data.mode,colors=data[mode]||{},t=data.typography,br=data.borderRadius;d.setAttribute('data-theme',mode);for(var k in colors)d.style.setProperty('--color-'+k,colors[k]);function rgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)].join(',')}if(colors['accent'])d.style.setProperty('--color-accent-rgb',rgb(colors['accent']));if(colors['accent-light'])d.style.setProperty('--color-accent-light-rgb',rgb(colors['accent-light']));if(colors['accent-vivid'])d.style.setProperty('--color-accent-vivid-rgb',rgb(colors['accent-vivid']));if(colors['cyan'])d.style.setProperty('--color-cyan-rgb',rgb(colors['cyan']));if(t){if(t.fontFamily)d.style.setProperty('--font-sans',t.fontFamily+',ui-sans-serif,system-ui,sans-serif');if(t.scale!=null)d.style.setProperty('--si-font-scale',t.scale);}if(br)for(var k2 in br){if(k2!=='preset')d.style.setProperty(k2==='base'?'--radius':'--radius-'+k2,br[k2]);}return;}}}catch(e){}d.setAttribute('data-theme','dark');})()`}</Script>
        <ThemeProvider>
          <SplashScreen />
          {hideChrome ? (
            children
          ) : (
            <>
              <SessionManager loginPath="/login" />
              {isToolsSection ? (
                <ToolsNavbar tools={liveTools} />
              ) : (
                <Header tools={liveTools} />
              )}
              <main className="flex-1">{children}</main>
              <Footer
                socialLinks={navigation?.socialLinks}
                email={company?.email}
                phonePrimary={company?.phonePrimary}
                phoneSecondary={company?.phoneSecondary}
              />
              <WhatsAppFloat whatsapp={company?.whatsapp} />
              <LeadPopup />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
