'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, LogOut } from 'lucide-react';
import { clearAuthTokens } from '@/lib/tokenStore';

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuthTokens();
      setOpen(false);
      onLogout?.();
      router.push('/login');
      router.refresh();
    }
  }

  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-64 bg-card border border-divider rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-divider">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'Account'}</p>
              <p className="text-xs text-subtle truncate">{user?.email}</p>
            </div>
          </div>
          <div className="py-2">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-card-hover transition-colors"
            >
              <Settings size={16} />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-muted hover:text-red-500 hover:bg-card-hover transition-colors disabled:opacity-60"
            >
              <LogOut size={16} />
              {loading ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
