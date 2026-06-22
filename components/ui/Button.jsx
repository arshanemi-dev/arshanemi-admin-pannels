'use client';

import { cn } from '@/lib/utils';

export default function Button({ children, variant = 'primary', size = 'md', className, href, onClick, type = 'button', disabled, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-[#6366f1] to-[#06b6d4] text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20',
    secondary: 'bg-card border border-divider text-foreground hover:border-accent hover:bg-card-hover active:scale-[0.98]',
    ghost: 'text-muted hover:text-foreground hover:bg-card active:scale-[0.98]',
    outline: 'border border-accent text-accent hover:bg-accent hover:text-white active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
}
