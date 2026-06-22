export const industries = [
  {
    slug: 'healthcare',
    name: 'Healthcare',
    icon: 'HeartPulse',
    description: 'Help patients find your practice online with healthcare-specific SEO strategies that comply with medical advertising guidelines.',
    benefits: ['Patient Acquisition', 'HIPAA-Compliant Content', 'Local Search Dominance', 'Reputation Management'],
    services: ['local-seo', 'google-my-business', 'content-writing'],
  },
  {
    slug: 'dental',
    name: 'Dental',
    icon: 'Smile',
    description: 'Attract new dental patients in your area with targeted local SEO and Google Ads campaigns.',
    benefits: ['New Patient Bookings', 'Google Maps Ranking', 'Review Generation', 'Competitor Analysis'],
    services: ['local-seo', 'google-ads', 'google-my-business'],
  },
  {
    slug: 'law-firm',
    name: 'Law Firm',
    icon: 'Scale',
    description: 'Get in front of potential clients searching for legal services with authoritative content and local SEO.',
    benefits: ['High-Intent Traffic', 'Practice Area Pages', 'Authority Building', 'Lead Generation'],
    services: ['local-seo', 'content-writing', 'link-building'],
  },
  {
    slug: 'real-estate',
    name: 'Real Estate',
    icon: 'Home',
    description: 'Generate more property inquiries and leads with real estate SEO and location-based targeting.',
    benefits: ['Listing Visibility', 'Neighborhood SEO', 'IDX Optimization', 'Lead Capture Pages'],
    services: ['local-seo', 'ecommerce-seo', 'google-ads'],
  },
  {
    slug: 'hospitality',
    name: 'Hotels & Hospitality',
    icon: 'BedDouble',
    description: 'Increase direct bookings and reduce OTA dependency with hotel-specific SEO strategies.',
    benefits: ['Direct Booking Growth', 'Google Hotel Ads', 'Local Visibility', 'Review Optimization'],
    services: ['local-seo', 'google-my-business', 'google-ads'],
  },
  {
    slug: 'ecommerce',
    name: 'eCommerce',
    icon: 'ShoppingBag',
    description: 'Drive more organic product sales with comprehensive eCommerce SEO including technical fixes and content strategy.',
    benefits: ['Product Page Rankings', 'Category SEO', 'Shopping Ads', 'Abandoned Cart Recovery'],
    services: ['ecommerce-seo', 'shopify-seo', 'woocommerce-seo'],
  },
  {
    slug: 'gym-fitness',
    name: 'Gym & Fitness',
    icon: 'Dumbbell',
    description: 'Attract local fitness enthusiasts and gym members with targeted local SEO and social media marketing.',
    benefits: ['Membership Growth', 'Class Visibility', 'Social Proof', 'Local Dominance'],
    services: ['local-seo', 'social-media-marketing', 'google-my-business'],
  },
  {
    slug: 'salon-spa',
    name: 'Salon & Spa',
    icon: 'Scissors',
    description: 'Fill your appointment book with beauty clients using local SEO and reputation management.',
    benefits: ['Appointment Bookings', 'Google Maps Visibility', 'Review Management', 'Instagram Growth'],
    services: ['local-seo', 'social-media-marketing', 'google-my-business'],
  },
  {
    slug: 'doctors',
    name: 'Doctors & Clinics',
    icon: 'Stethoscope',
    description: 'Help patients find your clinic online through medical SEO and Google Business Profile optimization.',
    benefits: ['Patient Discovery', 'Appointment Scheduling', 'Trust Building', 'Telehealth Visibility'],
    services: ['local-seo', 'content-writing', 'google-my-business'],
  },
];

export function getIndustryBySlug(slug) {
  return industries.find((i) => i.slug === slug);
}
