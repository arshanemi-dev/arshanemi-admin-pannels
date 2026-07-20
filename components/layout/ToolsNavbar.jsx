'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { isLoggedIn, getStoredUser } from '@/lib/tokenStore';
import UserMenu from './UserMenu';
import Button from '@/components/ui/Button';

function ToolIcon({ name, size = 15 }) {
  const Icon = LucideIcons[name] || Globe;
  return <Icon size={size} />;
}

export default function ToolsNavbar({ tools = [] }) {
  const isScrolled = useScrollHeader(50);
  const [user, setUser] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    setUser(isLoggedIn() ? getStoredUser() : null);
  }, []);

  const usableTools = tools.filter((t) => t.toolUrl).slice(0, 3);

  return (
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
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-[72px] gap-3">
          {/* Empty spacer — balances the right-side group so the logo stays dead-center */}
          <span aria-hidden="true" />

          {/* Logo + Title, centered */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 justify-self-center">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-base">A</span>
            </div>
            <span className="text-foreground font-bold text-lg hidden sm:block tracking-tight">
              Arshanemi
            </span>
          </Link>

          {/* Tools (direct links, no dropdown) + Login/Profile + CTA */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            {usableTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}/use`}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-muted hover:text-foreground hover:bg-card-hover transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <ToolIcon name={tool.icon} />
                </span>
                <span className="text-sm font-medium hidden md:block whitespace-nowrap">
                  {tool.title}
                </span>
              </Link>
            ))}

            {user ? (
              <UserMenu user={user} onLogout={() => setUser(null)} />
            ) : (
              <>
                <Button href="/login" variant="outline" size="sm" className="hidden sm:inline-flex">
                  Login
                </Button>
                <Button href="/contact" size="sm">
                  Get Free Audit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
