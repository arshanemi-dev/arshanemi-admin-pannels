'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ChevronDown, Phone, ArrowRight } from 'lucide-react';
import { navLinks as defaultNavLinks } from '@/data/navigation';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { COMPANY_PHONE_PRIMARY } from '@/data/company';

function MobileNavItem({ link, onClose }) {
  const [open, setOpen] = useState(false);

  if (!link.dropdown && !link.megaMenu) {
    return (
      <Link
        href={link.href}
        onClick={onClose}
        className="flex items-center justify-between py-4 text-base font-medium text-muted hover:text-foreground transition-colors border-b border-divider"
      >
        {link.label}
      </Link>
    );
  }

  if (link.megaMenu) {
    return (
      <div className="border-b border-divider">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-between w-full py-4 text-base font-medium text-muted hover:text-foreground transition-colors"
        >
          {link.label}
          <ChevronDown
            size={16}
            className={cn('transition-transform duration-200', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div className="pb-4 space-y-4">
            {link.megaMenu.map((group) => (
              <div key={group.category}>
                <p className="text-[10px] font-bold tracking-widest text-accent-light uppercase mb-2 pl-3">
                  {group.category}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-2.5 py-2 pl-3 text-sm text-subtle hover:text-foreground transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link
              href={link.href}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 pl-3 text-xs font-semibold text-accent-light hover:text-accent transition-colors"
            >
              View All Services <ArrowRight size={11} />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-divider">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-4 text-base font-medium text-muted hover:text-foreground transition-colors"
      >
        {link.label}
        <ChevronDown
          size={16}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="pb-3 pl-3 space-y-0.5">
          {link.dropdown.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-2.5 py-2.5 text-sm text-subtle hover:text-foreground transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileMenu({ open, onClose, navLinks }) {
  const links = navLinks || defaultNavLinks;
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-card border-l border-divider z-50 transition-transform duration-300 ease-out flex flex-col shadow-2xl shadow-black/70',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <Image
              src="/images/santhya-infotech-logo.png"
              alt="Santhya Infotech"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-foreground font-bold text-base">Santhya Infotech</span>
          </Link>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-card-hover transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-5 py-2">
          {links.map((link) => (
            <MobileNavItem key={link.label} link={link} onClose={onClose} />
          ))}
        </nav>

        {/* Bottom CTAs */}
        <div className="px-5 py-5 space-y-3 border-t border-divider">
          <Button href="/contact" className="w-full" onClick={onClose}>
            Get Free SEO Audit
          </Button>
          <a
            href={`tel:${COMPANY_PHONE_PRIMARY}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm text-muted border border-divider hover:border-accent/50 hover:text-foreground transition-all duration-200"
          >
            <Phone size={14} />
            {COMPANY_PHONE_PRIMARY}
          </a>
        </div>
      </div>
    </>
  );
}
