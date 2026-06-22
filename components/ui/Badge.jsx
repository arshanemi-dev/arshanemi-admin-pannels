import { cn } from '@/lib/utils';

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-card border border-divider text-muted',
    accent: 'bg-accent/10 border border-accent/20 text-accent-light',
    success: 'bg-green-500/10 border border-green-500/20 text-green-400',
    cyan: 'bg-cyan/10 border border-cyan/20 text-cyan',
  };

  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
