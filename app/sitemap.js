import { services as defaultServices } from '@/data/services';
import { industries as defaultIndustries } from '@/data/industries';
import { getCachedCollection } from '@/lib/db';

const SITE_URL = 'https://www.santhyainfotech.com';

const staticRoutes = [
  { url: '/',               changeFrequency: 'weekly',  priority: 1.0 },
  { url: '/about',          changeFrequency: 'monthly', priority: 0.8 },
  { url: '/services',       changeFrequency: 'weekly',  priority: 0.9 },
  { url: '/industries',     changeFrequency: 'monthly', priority: 0.8 },
  { url: '/blog',           changeFrequency: 'daily',   priority: 0.8 },
  { url: '/contact',        changeFrequency: 'monthly', priority: 0.9 },
  { url: '/testimonials',   changeFrequency: 'monthly', priority: 0.6 },
  { url: '/careers',        changeFrequency: 'monthly', priority: 0.6 },
  { url: '/life-at-santhya',changeFrequency: 'monthly', priority: 0.5 },
];

export default async function sitemap() {
  const now = new Date().toISOString();

  const [blobServices, blobIndustries] = await Promise.all([
    getCachedCollection('services'),
    getCachedCollection('industries'),
  ]);
  const services = blobServices.length ? blobServices : defaultServices;
  const industries = blobIndustries.length ? blobIndustries : defaultIndustries;

  const statics = staticRoutes.map(({ url, changeFrequency, priority }) => ({
    url: `${SITE_URL}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const servicePages = services.map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  const industryPages = industries.map((i) => ({
    url: `${SITE_URL}/industries/${i.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  return [...statics, ...servicePages, ...industryPages];
}
