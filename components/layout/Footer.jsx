import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react';
import { buildFooterLinks, socialLinks as defaultSocialLinks } from '@/data/navigation';
import { getCachedCollection } from '@/lib/db';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import {
  COMPANY_EMAIL as defaultEmail,
  COMPANY_PHONE_PRIMARY as defaultPhone1,
  COMPANY_PHONE_SECONDARY as defaultPhone2,
} from '@/data/company';


const PLATFORM_COLORS = {
  Facebook: '#1877F2',
  Instagram: '#E4405F',
  Linkedin: '#0A66C2',
  Twitter: '#1DA1F2',
  Youtube: '#FF0000',
  MessageCircle: '#25D366',
  Send: '#26A5E4',
  Github: '#ffffff',
  Pin: '#E60023',
};

function SocialIcon({ icon, href, label }) {
  const Icon = LucideIcons[icon];
  const brandColor = PLATFORM_COLORS[icon] || '#6366f1';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      style={{ '--brand-color': brandColor }}
      className="social-icon w-9 h-9 flex items-center justify-center rounded-full bg-card border border-divider text-muted transition-all duration-200"
    >
      {Icon ? <Icon size={15} /> : null}
    </a>
  );
}

function FooterLink({ href, children }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-200"
    >
      <span className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors duration-200 shrink-0" />
      {children}
    </Link>
  );
}

export default async function Footer({ socialLinks, email, phonePrimary, phoneSecondary }) {
  const [blobServices, blobIndustries] = await Promise.all([
    getCachedCollection('services'),
    getCachedCollection('industries'),
  ]);
  const footerLinks = buildFooterLinks(blobServices, blobIndustries);

  const links = socialLinks?.length ? socialLinks : defaultSocialLinks;
  const displayEmail = email || defaultEmail;
  const displayPhone1 = phonePrimary || defaultPhone1;
  const displayPhone2 = phoneSecondary || defaultPhone2;
  return (
    <footer className="relative bg-background border-t border-divider overflow-hidden">

      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-t from-accent/8 to-transparent blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* CTA Banner */}
        <div className="py-12 border-b border-divider">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Ready to Dominate Search Rankings?
              </h2>
              <p className="text-muted mt-1.5 text-sm">
                Let&apos;s build a strategy that drives real, measurable growth for your business.
              </p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#06b6d4] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
            >
              Get Free SEO Audit <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Main grid */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
               <Image
                              src="/images/santhya-infotech-logo.png"
                              alt="Santhya Infotech"
                              width={36}
                              height={36}
                              className="rounded-xl"
                              priority
                            />
              <span className="text-foreground font-bold text-lg">Santhya Infotech</span>
            </Link>
            <p className="text-sm text-muted leading-relaxed mb-6">
              Results-driven SEO &amp; digital marketing agency helping businesses rank higher, grow faster, and win online.
            </p>
            <div className="flex gap-2 flex-wrap">
              {links.map((s) => (
                <SocialIcon key={s.label} {...s} />
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-5">
              Services
            </h3>
            <ul className="space-y-3">
              {footerLinks.services.map((l,i) => (
                <li key={i}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-5">
              Industries
            </h3>
            <ul className="space-y-3">
              {footerLinks.industries.map((l, i) => (
                <li key={i}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-5">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((l,i) => (
                <li key={i}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-5">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-muted leading-snug">
                  204 Nilkanth Darshan Building, Katargam, Surat, Gujarat 395004
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <Phone size={14} className="text-accent shrink-0 mt-0.5" />
                <div className="text-sm text-muted space-y-1">
                  <a href={`tel:${displayPhone1}`} className="block hover:text-foreground transition-colors">
                    {displayPhone1}
                  </a>
                  <a href={`tel:${displayPhone2}`} className="block hover:text-foreground transition-colors">
                    {displayPhone2}
                  </a>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <Mail size={14} className="text-accent shrink-0 mt-0.5" />
                <a href={`mailto:${displayEmail}`} className="text-sm text-muted hover:text-foreground transition-colors break-all">
                  {displayEmail}
                </a>
              </li>
              <li className="flex gap-3 items-start">
                <Clock size={14} className="text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-muted">Mon–Sat: 9 AM – 9 PM IST</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-divider flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-subtle">
            © {new Date().getFullYear()} Santhya Infotech. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-subtle text-xs">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors px-2">
              Privacy Policy
            </Link>
            <span className="text-divider-light">·</span>
            <Link href="/terms" className="hover:text-foreground transition-colors px-2">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
