import { COMPANY_WHATSAPP } from './company.js';
import { tools, toolCategories } from './tools.js';

const RESOURCES_DROPDOWN = [
  { label: 'Case Studies',  href: '/case-studies' },
  { label: 'Blog',          href: '/blog' },
  { label: 'Testimonials',  href: '/testimonials' },
  { label: 'About Us',      href: '/about' },
  { label: 'Careers',       href: '/careers' },
  { label: 'Pricing Plans', href: '/seo-packages' },
];

const COMPANY_LINKS = [
  { label: 'About Us',      href: '/about' },
  { label: 'Our Team',      href: '/about#team' },
  { label: 'Case Studies',  href: '/case-studies' },
  { label: 'Blog',          href: '/blog' },
  { label: 'Contact',       href: '/contact' },
  { label: 'Careers',       href: '/careers' },
  { label: 'Pricing',       href: '/seo-packages' },
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
      items: catTools.map((t) => ({ label: t.title, href: `/tools/${t.slug}` })),
    };
  });

  return [
    { label: 'Tools', href: '/tools', megaMenu: toolsMegaMenu },
    { label: 'Resources', href: '#', dropdown: RESOURCES_DROPDOWN },
    { label: 'Contact',   href: '/contact' },
  ];
}

/**
 * Build footer link lists.
 */
export function buildFooterLinks(toolsArr = tools) {
  return {
    company: COMPANY_LINKS,
    tools: [
      ...toolsArr.map((t) => ({ label: t.title, href: `/tools/${t.slug}` })),
      { label: 'All Tools →', href: '/tools' },
    ],
  };
}

// Static defaults
export const navLinks    = buildNavLinks(tools);
export const footerLinks = buildFooterLinks(tools);

export const socialLinks = [
  { label: 'Facebook',  href: 'https://facebook.com/arshanemi',  icon: 'Facebook' },
  { label: 'Instagram', href: 'https://instagram.com/arshanemi', icon: 'Instagram' },
  { label: 'LinkedIn',  href: 'https://linkedin.com/company/arshanemi', icon: 'Linkedin' },
  { label: 'Twitter',   href: 'https://twitter.com/arshanemi',   icon: 'Twitter' },
  { label: 'YouTube',   href: 'https://youtube.com/@arshanemi',  icon: 'Youtube' },
  { label: 'WhatsApp',  href: `https://wa.me/${COMPANY_WHATSAPP}`, icon: 'MessageCircle' },
];
