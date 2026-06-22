import Link from 'next/link';
import { partners as defaultPartners } from '@/data/partners';

function LogoCard({ title, url }) {
  return (
    <div className="flex items-center justify-center p-2 my-2 border border-divider bg-card rounded-xl transition-all duration-300 hover:border-divider-light hover:bg-card-hover">
      <img src={url} alt={title} className="max-h-18 max-w-full object-contain" />
    </div>
  );
}

function LogoColumn({ logos, direction, duration }) {
  const doubled = [...logos, ...logos];
  return (
    <div className="ticker-v-wrap ticker-v-fade overflow-hidden h-60 lg:h-[360px]">
      <div
        className={direction === 'down' ? 'ticker-v-down' : 'ticker-v-up'}
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((p, i) => (
          <LogoCard key={`${p.name}-${i}`} title={p.title} url={p.url} />
        ))}
      </div>
    </div>
  );
}

export default function LogosTicker({ partners }) {
  const data = partners?.length ? partners : defaultPartners;
  const columns = [
    data.filter((_, i) => i % 3 === 0),
    data.filter((_, i) => i % 3 === 1),
    data.filter((_, i) => i % 3 === 2),
  ];

  return (
    <section className="py-16 bg-surface border-y border-divider overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-10 xl:gap-16">

          {/* Left: 3 vertical columns — col1&3 scroll down, col2 scrolls up */}
          <div className="w-full lg:w-[58%] grid grid-cols-3 gap-3">
            <LogoColumn logos={columns[0]} direction="down" duration={20} />
            <LogoColumn logos={columns[1]} direction="up"   duration={26} />
            <LogoColumn logos={columns[2]} direction="down" duration={23} />
          </div>

          {/* Vertical divider (desktop only) */}
          <div className="hidden lg:block w-px self-stretch bg-divider shrink-0" />

          {/* Right: Company identity + CTA */}
          <div className="w-full lg:w-[38%] flex flex-col items-center content-center lg:items-start text-center lg:text-left gap-5">
            <div className="flex items-center justify-center lg:justify-start w-full" style={{ justifyContent: 'center' }}>
            <img
              src="/images/santhya-infotech-logo.png"
              alt="Santhya Infotech"
              className="h-28 w-auto"
            />
            </div>

            <div className="leading-tight flex space-x-4 justify-center w-full" style={{ justifyContent: 'center' }}>
              <p className="text-4xl xl:text-5xl font-bold text-foreground ">Santhya</p>
              <p className="text-4xl xl:text-5xl font-bold  text-foreground ">Infotech</p>
            </div>
<div className="flex flex-col items-center justify-center gap-3 w-full" style={{ justifyContent: 'center' }}>
            <p className="text-muted text-base leading-relaxed max-w-xs text-center"  >
              Trusted by ambitious brands across India &amp; UAE. We build digital experiences that drive real growth.
            </p>
            </div>
<div className="flex flex-col items-center justify-center gap-3 w-full" style={{ justifyContent: 'center' }}>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Contact Us
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
