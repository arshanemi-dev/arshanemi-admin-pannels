// Single source of truth for "which role can reach which /settings route."
// Server-only — imported by the settings layout guard, the settings
// dashboard, and the /api/auth/permissions route. Never import this from a
// 'use client' component; it's the backend side of what used to be two
// separate hardcoded arrays (Sidebar.jsx's nav groups + layout.js's
// ALLOWED_PREFIXES). Icons are string names (not components) so this stays
// JSON-serializable for the API route.

export const NAV_CONFIG = [
  {
    label: null,
    items: [
      { key: 'dashboard', label: 'Dashboard', href: '/settings', icon: 'LayoutDashboard', roles: ['master_admin'] },
    ],
  },
  {
    label: 'SERVICES',
    items: [
      { key: 'services', label: 'Services', href: '/settings/services', icon: 'Briefcase', roles: ['master_admin'] },
    ],
  },
  {
    label: 'Industries & Content',
    items: [
      { key: 'industries', label: 'Industries', href: '/settings/industries', icon: 'Factory', roles: ['master_admin'] },
      { key: 'seo-packages', label: 'SEO Packages', href: '/settings/seo-packages', icon: 'Package', roles: ['master_admin'] },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { key: 'blogs', label: 'Blog Posts', href: '/settings/blogs', icon: 'FileText', roles: ['master_admin'] },
      { key: 'blog-categories', label: 'Blog Categories', href: '/settings/blog-categories', icon: 'Tag', roles: ['master_admin'] },
      { key: 'case-studies', label: 'Case Studies', href: '/settings/case-studies', icon: 'BookOpen', roles: ['master_admin'] },
      { key: 'media', label: 'Media Library', href: '/settings/media', icon: 'Images', roles: ['master_admin'] },
    ],
  },
  {
    label: 'COMPANIES & USERS',
    items: [
      { key: 'companies', label: 'Companies', href: '/settings/companies', icon: 'Building2', roles: ['master_admin'], quickAction: true },
      { key: 'users', label: 'Users', href: '/settings/users', icon: 'Users', roles: ['master_admin', 'admin'], quickAction: true },
      { key: 'tools-access', label: 'Tools Access', href: '/settings/tools', icon: 'Settings', roles: ['master_admin', 'admin'] },
    ],
  },
  {
    label: 'LEADS & HR',
    items: [
      { key: 'leads', label: 'Leads History', href: '/settings/leads', icon: 'TrendingUp', roles: ['master_admin'] },
      { key: 'candidates', label: 'Candidates', href: '/settings/candidates', icon: 'UserCheck', roles: ['master_admin'] },
    ],
  },
  {
    label: 'TEAM & SOCIAL',
    items: [
      { key: 'team', label: 'Team Members', href: '/settings/team', icon: 'Users', roles: ['master_admin'] },
      { key: 'testimonials', label: 'Testimonials', href: '/settings/testimonials', icon: 'MessageSquare', roles: ['master_admin'] },
      { key: 'partners', label: 'Partners', href: '/settings/partners', icon: 'Handshake', roles: ['master_admin'] },
    ],
  },
  {
    label: 'SITE CONFIG',
    items: [
      { key: 'stats', label: 'Stats', href: '/settings/stats', icon: 'BarChart2', roles: ['master_admin'] },
      { key: 'faqs', label: 'FAQs', href: '/settings/faqs', icon: 'HelpCircle', roles: ['master_admin'] },
      { key: 'badges', label: 'Trust Badges', href: '/settings/badges', icon: 'Shield', roles: ['master_admin'] },
      { key: 'hero', label: 'Hero Content', href: '/settings/hero', icon: 'Layers', roles: ['master_admin'] },
      { key: 'cta-banner', label: 'CTA Banner', href: '/settings/cta-banner', icon: 'Megaphone', roles: ['master_admin'] },
      { key: 'company', label: 'Company Info', href: '/settings/company', icon: 'Cog', roles: ['master_admin'], quickAction: true },
      { key: 'theme', label: 'Theme Settings', href: '/settings/theme', icon: 'Palette', roles: ['master_admin'] },
    ],
  },
  {
    label: 'PAGES',
    items: [
      { key: 'about', label: 'About Page', href: '/settings/about', icon: 'Layers', roles: ['master_admin'] },
      { key: 'process', label: 'Process Steps', href: '/settings/process', icon: 'Settings', roles: ['master_admin'] },
      { key: 'careers', label: 'Careers', href: '/settings/careers', icon: 'Briefcase', roles: ['master_admin'] },
      { key: 'life-at-arshanemi', label: 'Life at Arshanemi', href: '/settings/life-at-arshanemi', icon: 'Heart', roles: ['master_admin'] },
      { key: 'contact', label: 'Contact Page', href: '/settings/contact', icon: 'Phone', roles: ['master_admin'] },
      { key: 'navigation', label: 'Navigation', href: '/settings/navigation', icon: 'Map', roles: ['master_admin'] },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { key: 'profile', label: 'My Profile', href: '/settings/profile', icon: 'UserCircle', roles: ['master_admin', 'admin', 'user'] },
    ],
  },
]

function filterItem(item, role) {
  return item.roles.includes(role)
}

export function getNavForRole(role) {
  return NAV_CONFIG
    .map((group) => ({ ...group, items: group.items.filter((item) => filterItem(item, role)) }))
    .filter((group) => group.items.length > 0)
}

export function getAllowedHrefsForRole(role) {
  return getNavForRole(role).flatMap((group) => group.items.map((item) => item.href))
}

export function isPathAllowed(pathname, role) {
  if (role === 'master_admin') return true
  return getAllowedHrefsForRole(role).some((href) => href !== '/settings' && pathname.startsWith(href))
}

export function getLandingPageForRole(role) {
  if (role === 'master_admin') return '/settings'
  const hrefs = getAllowedHrefsForRole(role).filter((href) => href !== '/settings')
  return hrefs[0] || '/settings/profile'
}
