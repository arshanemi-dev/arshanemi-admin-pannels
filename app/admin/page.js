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
        <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
        <p className="text-gray-500 mt-1 text-sm">
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
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            {link.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </div>

      {/* Section cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Content Sections
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAT_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-orange-200 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                {card.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Singleton pages */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
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
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
