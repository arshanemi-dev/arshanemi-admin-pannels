'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Menu, ArrowRight } from 'lucide-react';
import { navLinks as defaultNavLinks } from '@/data/navigation';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { isLoggedIn, getStoredUser } from '@/lib/tokenStore';
import MobileMenu from './MobileMenu';
import ToolsLauncher from './ToolsLauncher';
import UserMenu from './UserMenu';
import Button from '@/components/ui/Button';

function DropdownMenu({ items }) {
  return (
    <div className="absolute top-full left-0 mt-3 w-60 bg-card border border-divider rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
      <div className="py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-card-hover transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MegaMenu({ groups, allHref }) {
  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-card border border-divider rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
      style={{ width: '720px' }}
    >
      <div className="grid grid-cols-3 divide-x divide-divider">
        {groups.map((group) => (
          <div key={group.category} className="p-5">
            <p className="text-[10px] font-bold tracking-widest text-accent-light uppercase mb-3 px-2">
              {group.category}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-2 py-2 text-sm text-muted hover:text-foreground hover:bg-card-hover rounded-lg transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-divider px-6 py-3 bg-surface flex items-center justify-between">
        <span className="text-xs text-subtle">Explore our full service suite</span>
        <Link
          href={allHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light hover:text-accent transition-colors"
        >
          View All Services <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function NavItem({ link }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!link.dropdown && !link.megaMenu) {
    return (
      <Link
        href={link.href}
        className="text-sm font-medium text-muted hover:text-foreground transition-colors py-2"
      >
        {link.label}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground transition-colors py-2"
      >
        {link.label}
        <ChevronDown
          size={14}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        link.megaMenu
          ? <MegaMenu groups={link.megaMenu} allHref={link.href} />
          : <DropdownMenu items={link.dropdown} />
      )}
    </div>
  );
}

export default function Header({ navLinks: navLinksProp, tools = [] }) {
  const navLinks = navLinksProp || defaultNavLinks;
  const isScrolled = useScrollHeader(50);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    setUser(isLoggedIn() ? getStoredUser() : null);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-40 transition-all duration-300',
          isScrolled
            ? cn(
                'bg-background/95 backdrop-blur-md border-b border-divider',
                theme === 'dark' ? 'shadow-lg shadow-black/30' : 'shadow-sm shadow-slate-200/80'
              )
            : 'bg-background/80 backdrop-blur-sm border-b border-divider/30'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-base">A</span>
              </div>
              <span className="text-foreground font-bold text-lg hidden sm:block tracking-tight">
                Arshanemi
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <NavItem key={link.label} link={link} />
              ))}
            </nav>

            {/* Tools launcher + CTA + Theme toggle + Mobile toggle */}
            <div className="flex items-center gap-2">
              <ToolsLauncher tools={tools} />

              {user ? (
                <UserMenu user={user} onLogout={() => setUser(null)} />
              ) : (
                <>
                  <Button href="/login" variant="outline" size="sm" className="hidden sm:inline-flex">
                    Login
                  </Button>
                  <Button href="/contact" size="sm" className="hidden sm:inline-flex">
                    Get Free Audit
                  </Button>
                </>
              )}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-muted hover:text-foreground hover:bg-card-hover transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} navLinks={navLinks} />
    </>
  );
}
