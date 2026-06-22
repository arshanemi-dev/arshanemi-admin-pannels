import { cn } from '@/lib/utils';

export default function SectionHeading({ eyebrow, title, subtitle, center = true, className }) {
  return (
    <div className={cn('max-w-3xl', center && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p className="inline-block text-sm font-semibold text-accent-light tracking-widest uppercase mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
