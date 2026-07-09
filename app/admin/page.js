import Link from 'next/link'
import {
  Briefcase, Factory, FileText, Tag, BookOpen, Users,
  MessageSquare, Handshake, HelpCircle, Package, ArrowRight, Wrench
} from 'lucide-react'

const STAT_CARDS = [
  { label: 'Tools',    icon: Wrench,   href: '/admin/tools',    color: 'bg-orange-50 text-orange-600' },
  { label: 'Services', icon: Briefcase, href: '/admin/services', color: 'bg-amber-50 text-amber-600' },
  { label: 'Industries', icon: Factory, href: '/admin/industries', color: 'bg-violet-50 text-violet-600' },
  { label: 'Blog Posts', icon: FileText, href: '/admin/blogs', color: 'bg-blue-50 text-blue-600' },
  { label: 'Case Studies', icon: BookOpen, href: '/admin/case-studies', color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Team Members', icon: Users, href: '/admin/team', color: 'bg-orange-50 text-orange-600' },
  { label: 'Testimonials', icon: MessageSquare, href: '/admin/testimonials', color: 'bg-pink-50 text-pink-600' },
  { label: 'Partners', icon: Handshake, href: '/admin/partners', color: 'bg-yellow-50 text-yellow-600' },
  { label: 'FAQs', icon: HelpCircle, href: '/admin/faqs', color: 'bg-cyan-50 text-cyan-600' },
  { label: 'SEO Packages', icon: Package, href: '/admin/seo-packages', color: 'bg-rose-50 text-rose-600' },
  { label: 'Blog Categories', icon: Tag, href: '/admin/blog-categories', color: 'bg-teal-50 text-teal-600' },
]

const QUICK_LINKS = [
  { label: 'Manage Tools', href: '/admin/tools', primary: true },
  { label: 'New Blog Post', href: '/admin/blogs/new', primary: false },
  { label: 'Edit Company Info', href: '/admin/company', primary: false },
  { label: 'Update Hero Content', href: '/admin/hero', primary: false },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back!</h2>
        <p className="text-subtle mt-1 text-sm">
          Manage your website content from the sections below.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              link.primary
                ? 'bg-accent hover:bg-accent-hover text-white'
                : 'bg-card hover:bg-surface text-muted border border-divider'
            }`}
          >
            {link.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </div>

      {/* Section cards */}
      <div>
        <h3 className="text-sm font-semibold text-subtle uppercase tracking-wider mb-4">
          Content Sections
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAT_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-card rounded-xl border border-divider p-5 hover:shadow-md hover:border-accent/30 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                {card.label}
              </p>
              <p className="text-xs text-subtle mt-0.5 flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Singleton pages */}
      <div>
        <h3 className="text-sm font-semibold text-subtle uppercase tracking-wider mb-4">
          Page Settings
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Company Info', href: '/admin/company' },
            { label: 'Stats', href: '/admin/stats' },
            { label: 'Trust Badges', href: '/admin/badges' },
            { label: 'Hero Content', href: '/admin/hero' },
            { label: 'About Page', href: '/admin/about' },
            { label: 'Process Steps', href: '/admin/process' },
            { label: 'Life at Arshanemi', href: '/admin/life-at-santhya' },
            { label: 'Contact Page', href: '/admin/contact' },
            { label: 'Navigation', href: '/admin/navigation' },
            { label: 'Service Content', href: '/admin/service-content' },
            { label: 'Careers', href: '/admin/careers' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-card border border-divider rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-accent/10 hover:text-accent-hover hover:border-accent/30 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
