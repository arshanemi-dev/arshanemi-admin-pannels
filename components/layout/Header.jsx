'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export default function Header({ tools = [] }) {
  const isScrolled = useScrollHeader(50);
  const [user, setUser] = useState(null);
  const { theme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setUser(isLoggedIn() ? getStoredUser() : null);
  }, []);

  const usableTools = tools.filter((t) => t.toolUrl);

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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
          {/* Logo + Title — icon kept in the DOM but hidden, name stays visible */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="hidden w-9 h-9 rounded-xl bg-accent items-center justify-center shrink-0">
              <span className="text-white font-bold text-base">A</span>
            </div>
            <span className="text-foreground font-bold text-lg tracking-tight">
              Arshanemi
            </span>
          </Link>

          {/* Tools — direct urls only, no dropdown; on mobile these drop to their own centered row below the navbar, on desktop they sit centered in the middle of the same row */}
          <nav className="order-3 md:order-2 w-full md:w-auto md:flex-1 flex flex-wrap items-center justify-center gap-2 min-w-0">
            {usableTools.map((tool) => {
              const isActive = pathname === `/tools/${tool.slug}/use`;
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}/use`}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all duration-200',
                    isActive
                      ? 'bg-accent/10 border-accent/40 text-accent-light'
                      : 'border-transparent text-muted hover:text-accent-light hover:bg-accent/5 hover:border-accent/20'
                  )}
                >
                  <ToolIcon name={tool.icon} />
                  {tool.title}
                </Link>
              );
            })}
          </nav>

          {/* Plan, Login/Profile, Help & Support */}
          <div className="order-2 md:order-3 ml-auto md:ml-0 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 shrink-0">
            <Link href="/plan" className="text-sm font-medium text-muted hover:text-accent-light transition-colors whitespace-nowrap">
              Plan
            </Link>
            <Button href="/contact" size="sm">
              Help & Support
            </Button>
            {user ? (
              <UserMenu user={user} onLogout={() => setUser(null)} />
            ) : (
              <Button href="/login" variant="outline" size="sm">
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
