import * as LucideIcons from 'lucide-react';
import { team as defaultTeam } from '@/data/team';
import { companyValues as defaultValues, milestones as defaultMilestones } from '@/data/lifeAtSanthya';
import SectionHeading from '@/components/ui/SectionHeading';
import CTABanner from '@/components/sections/CTABanner';
import { getCachedCollection, getCachedSingleton } from '@/lib/db';

export const metadata = {
  title: 'Life @ Santhya Infotech | Our Culture & Team',
  description: 'Discover what it\'s like to work at Santhya Infotech — our culture, values, team, and the environment we\'ve built together.',
};


export default async function LifeAtSanthyaPage() {
  const [blobTeam, lifeData] = await Promise.all([
    getCachedCollection('team'),
    getCachedSingleton('life-at-santhya'),
  ]);
  const team = blobTeam.length ? blobTeam : defaultTeam;
  const companyValues = lifeData?.companyValues?.length ? lifeData.companyValues : defaultValues;
  const milestones = lifeData?.milestones?.length ? lifeData.milestones : defaultMilestones;

  return (
    <>
      {/* Hero */}
      <section className="relative pt-[120px] pb-16 bg-background overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 60%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-accent-light uppercase bg-accent/8 border border-accent/20 px-3 py-1.5 rounded-full mb-6">
            Our Culture
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
            Life @ <span className="gradient-text">Santhya Infotech</span>
          </h1>
          <p className="text-lg text-muted">
            A place where ambitious people do meaningful work, grow fast, and genuinely enjoy what they do.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Our Values"
            title="What We Stand For"
            subtitle="These principles aren't on a wall — they're in every decision, campaign, and conversation."
          />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {companyValues.map((v) => {
              const Icon = LucideIcons[v.icon] || LucideIcons.Star;
              return (
                <div key={v.title} className="bg-card border border-divider rounded-2xl p-6 hover:border-accent/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-accent/8 border border-accent/20 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-accent-light" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      {team && team.length > 0 && (
        <section className="section-pad bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              badge="Meet the Team"
              title="The People Behind the Results"
              subtitle="A passionate team of SEO specialists, content writers, and digital marketers based in Surat."
            />
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {team.map((member) => (
                <div key={member.name} className="bg-card border border-divider rounded-2xl p-5 text-center hover:border-accent/30 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-accent-light">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{member.name}</h3>
                  <p className="text-xs text-muted mt-1">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="section-pad bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Our Journey"
            title="How We Got Here"
            subtitle="5+ years of consistent growth, one client success story at a time."
          />
          <div className="mt-12 relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-divider" />
            <div className="space-y-8">
              {milestones.map((m) => (
                <div key={m.year} className="flex items-start gap-5 pl-0">
                  <div className="w-4 h-4 rounded-full bg-accent border-2 border-accent/40 shrink-0 mt-0.5 relative z-10" />
                  <div className="flex-1 -mt-0.5">
                    <span className="text-xs font-bold text-accent-light">{m.year}</span>
                    <p className="text-sm text-muted mt-1">{m.desc || m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA to careers */}
      <section className="section-pad bg-background border-y border-divider">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Want to Be Part of This?
          </h2>
          <p className="text-muted mb-8 text-sm">
            We're always looking for people who love digital marketing and want to make an impact.
          </p>
          <a
            href="/careers"
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-accent/90 transition-colors"
          >
            View Open Positions
          </a>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
