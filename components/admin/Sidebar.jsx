'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, Factory, FileText, Tag, BookOpen,
  Users, MessageSquare, Handshake, BarChart2, HelpCircle, Shield,
  Cog, Package, Heart, Phone, Map, Settings, ChevronRight,
  Layers, ExternalLink, Images, TrendingUp, UserCheck, Palette,
  Megaphone, Building2, UserCircle,
} from 'lucide-react'

const masterAdminGroups = [
  {
    label: null,
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'SERVICES',
    items: [
      { label: 'Services', href: '/admin/services', icon: Briefcase },
    ],
  },
  {
    label: 'Industries & Content',
    items: [
      { label: 'Industries',      href: '/admin/industries',      icon: Factory },
       { label: 'SEO Packages',   href: '/admin/seo-packages',     icon: Package },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { label: 'Blog Posts',      href: '/admin/blogs',           icon: FileText },
      { label: 'Blog Categories', href: '/admin/blog-categories', icon: Tag },
      { label: 'Case Studies',    href: '/admin/case-studies',    icon: BookOpen },
      { label: 'Media Library',   href: '/admin/media',           icon: Images },
    ],
  },
  {
    label: 'COMPANIES & USERS',
    items: [
      { label: 'Companies',     href: '/admin/companies', icon: Building2 },
      { label: 'Users',         href: '/admin/users',     icon: Users },
      { label: 'Tools Access',  href: '/admin/settings',  icon: Settings },
    ],
  },
  {
    label: 'LEADS & HR',
    items: [
      { label: 'Leads History',      href: '/admin/leads',      icon: TrendingUp },
      { label: 'Candidates',         href: '/admin/candidates', icon: UserCheck },
    ],
  },
  {
    label: 'TEAM & SOCIAL',
    items: [
      { label: 'Team Members', href: '/admin/team',         icon: Users },
      { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare },
      { label: 'Partners',     href: '/admin/partners',     icon: Handshake },
    ],
  },
  {
    label: 'SITE CONFIG',
    items: [
      { label: 'Stats',          href: '/admin/stats',      icon: BarChart2 },
      { label: 'FAQs',           href: '/admin/faqs',       icon: HelpCircle },
      { label: 'Trust Badges',   href: '/admin/badges',     icon: Shield },
      { label: 'Hero Content',   href: '/admin/hero',       icon: Layers },
      { label: 'CTA Banner',     href: '/admin/cta-banner', icon: Megaphone },
      { label: 'Company Info',   href: '/admin/company',    icon: Cog },
      { label: 'Theme Settings', href: '/admin/theme',      icon: Palette },
    ],
  },
  {
    label: 'PAGES',
    items: [
      { label: 'About Page',     href: '/admin/about',            icon: Layers },
      { label: 'Process Steps',  href: '/admin/process',          icon: Settings },

      { label: 'Careers',        href: '/admin/careers',          icon: Briefcase },
      { label: 'Life at Santhya',href: '/admin/life-at-santhya',  icon: Heart },
      { label: 'Contact Page',   href: '/admin/contact',          icon: Phone },
      { label: 'Navigation',     href: '/admin/navigation',       icon: Map },

    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { label: 'My Profile', href: '/admin/profile', icon: UserCircle },
    ],
  },
]

const adminGroups = [
  {
    label: null,
    items: [
      { label: 'Users',        href: '/admin/users',    icon: Users },
      { label: 'Tools Access', href: '/admin/settings', icon: Settings },
      { label: 'My Profile',   href: '/admin/profile',  icon: UserCircle },
    ],
  },
]

export default function Sidebar({ role = 'master_admin' }) {
  const pathname = usePathname()
  const groups = role === 'admin' ? adminGroups : masterAdminGroups

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 flex-shrink-0 h-full bg-accent flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-accent-hover flex-shrink-0">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Santhya</p>
            <p className="text-white/50 text-[11px]">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav — only this div scrolls */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:transparent
        [&::-webkit-scrollbar-thumb]:bg-white/30
        [&::-webkit-scrollbar-thumb]:rounded-full">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-white/40 text-[10px] font-semibold tracking-widest uppercase px-2 mb-1">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all group ${
                        active
                          ? 'bg-white/15 text-white shadow-sm'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-3 border-t border-accent-hover flex-shrink-0">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white/50 text-xs hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Website
        </Link>
      </div>
    </aside>
  )
}
