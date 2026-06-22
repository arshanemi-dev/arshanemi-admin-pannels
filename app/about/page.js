import AboutContent from './AboutContent';

const SITE_URL = 'https://www.santhyainfotech.com';

export const metadata = {
  title: 'About Santhya Infotech — SEO Agency Founded by Nand Kishor Yadav',
  description:
    'Learn about Santhya Infotech — our story, mission, and the expert team led by Founder & CEO Nand Kishor Yadav, delivering measurable SEO and digital marketing results in Surat, Gujarat.',
  keywords: [
    'about Santhya Infotech', 'SEO agency Surat story', 'Nand Kishor Yadav', 'digital marketing team Surat',
  ],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About Santhya Infotech — SEO Agency Founded by Nand Kishor Yadav',
    description:
      'Founded by Nand Kishor Yadav, Santhya Infotech is a results-driven SEO & digital marketing agency in Surat. Meet the team behind real Google rankings.',
    url: `${SITE_URL}/about`,
    images: [{ url: `${SITE_URL}/images/santhya-infotech-logo.png`, width: 1200, height: 630, alt: 'Santhya Infotech Team' }],
  },
  twitter: {
    title: 'About Santhya Infotech — SEO Agency Surat',
    description: 'Meet the team delivering real SEO results for businesses across India & UAE.',
    images: [`${SITE_URL}/images/santhya-infotech-logo.png`],
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
