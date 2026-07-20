import { COMPANY_WHATSAPP } from './company.js';
import { tools, toolCategories } from './tools.js';
import { services as defaultServices } from './services.js';
import { industries as defaultIndustries } from './industries.js';

const RESOURCES_DROPDOWN = [
  { label: 'Case Studies',  href: '/case-studies' },
  { label: 'Blog',          href: '/blog' },
  { label: 'Testimonials',  href: '/testimonials' },
  { label: 'About Us',      href: '/about' },
  { label: 'Careers',       href: '/careers' },
];

const COMPANY_LINKS = [
  { label: 'About Us',      href: '/about' },
  { label: 'Our Team',      href: '/about#team' },
  { label: 'Case Studies',  href: '/case-studies' },
  { label: 'Blog',          href: '/blog' },
  { label: 'Contact',       href: '/contact' },
  { label: 'Careers',       href: '/careers' },
];

/**
 * Build nav links — includes a Tools mega-menu derived from toolCategories.
 */
export function buildNavLinks(toolsArr = tools) {
  const categoryMap = new Map();
  for (const t of toolsArr) {
    if (!t.category) continue;
    if (!categoryMap.has(t.category)) categoryMap.set(t.category, []);
    categoryMap.get(t.category).push(t);
  }

  const toolsMegaMenu = [...categoryMap.entries()].map(([catId, catTools]) => {
    const known = toolCategories.find((c) => c.id === catId);
    return {
      category: known ? known.label : catId,
      items: catTools.map((t) => ({ label: t.title, href: t.toolUrl ? `/tools/${t.slug}/use` : `/tools/${t.slug}` })),
    };
  });

  return [
    { label: 'Tools', href: '/tools', megaMenu: toolsMegaMenu },
    { label: 'Resources', href: '#', dropdown: RESOURCES_DROPDOWN },
    { label: 'Product Pricing', href: '/plan' },
    { label: 'Contact',   href: '/contact' },
  ];
}

/**
 * Build footer link lists.
 */
export function buildFooterLinks(servicesArr = defaultServices, industriesArr = defaultIndustries) {
  return {
    company: COMPANY_LINKS,
    services: [
      ...servicesArr.slice(0, 7).map((s) => ({ label: s.title, href: `/services/${s.slug}` })),
      { label: 'All Services →', href: '/services' },
    ],
    industries: [
      ...industriesArr.slice(0, 6).map((ind) => ({ label: ind.name, href: `/industries/${ind.slug}` })),
      { label: 'All Industries →', href: '/industries' },
    ],
  };
}

// Static defaults
export const navLinks    = buildNavLinks(tools);
export const footerLinks = buildFooterLinks();

export const socialLinks = [
  { label: 'Facebook',  href: 'https://facebook.com/arshanemi',  icon: 'Facebook' },
  { label: 'Instagram', href: 'https://instagram.com/arshanemi', icon: 'Instagram' },
  { label: 'LinkedIn',  href: 'https://linkedin.com/company/arshanemi', icon: 'Linkedin' },
  { label: 'Twitter',   href: 'https://twitter.com/arshanemi',   icon: 'Twitter' },
  { label: 'YouTube',   href: 'https://youtube.com/@arshanemi',  icon: 'Youtube' },
  { label: 'WhatsApp',  href: `https://wa.me/${COMPANY_WHATSAPP}`, icon: 'MessageCircle' },
];
