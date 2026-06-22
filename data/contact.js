import { COMPANY_ADDRESS, COMPANY_EMAIL, COMPANY_HOURS, COMPANY_PHONE_PRIMARY } from './company.js';

export const contactInfo = [
  { icon: 'MapPin', label: 'Address', value: COMPANY_ADDRESS, href: 'https://goo.gl/maps/your-google-maps-link' },
  { icon: 'Phone',  label: 'Phone',   value: COMPANY_PHONE_PRIMARY, href: `tel:${COMPANY_PHONE_PRIMARY}` },
  { icon: 'Mail',   label: 'Email',   value: COMPANY_EMAIL, href: `mailto:${COMPANY_EMAIL}` },
  { icon: 'Clock',  label: 'Hours',   value: COMPANY_HOURS, href: null },
];

export const contactBudgets = [
  '₹5,000 – ₹15,000 / month',
  '₹15,000 – ₹30,000 / month',
  '₹30,000 – ₹60,000 / month',
  '₹60,000+ / month',
];
