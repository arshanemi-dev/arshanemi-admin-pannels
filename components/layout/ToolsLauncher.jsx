'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LayoutGrid, ArrowRight, Globe } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

function ToolIcon({ name, size = 18 }) {
  const Icon = LucideIcons[name] || Globe;
  return <Icon size={size} />;
}

export default function ToolsLauncher({ tools = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const usableTools = tools.filter((t) => t.toolUrl);
  if (usableTools.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open tools launcher"
        aria-expanded={open}
        className="flex items-center justify-center w-10 h-10 rounded-xl text-muted hover:text-foreground hover:bg-card-hover transition-colors"
      >
        <LayoutGrid size={20} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-72 bg-card border border-divider rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
          <div className="p-3 grid grid-cols-3 gap-1">
            {usableTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}/use`}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center text-muted hover:text-foreground hover:bg-card-hover transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <ToolIcon name={tool.icon} />
                </span>
                <span className="text-[11px] font-medium leading-tight line-clamp-2">{tool.title}</span>
              </Link>
            ))}
          </div>
          <div className="border-t border-divider px-4 py-3 bg-surface flex items-center justify-between">
            <span className="text-xs text-subtle">Quick launch tools</span>
            <Link
              href="/tools"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light hover:text-accent transition-colors"
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
