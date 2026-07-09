'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ExternalLink, Mail, Quote, Star, MapPin, Award } from 'lucide-react';
import { team } from '@/data/team';
import { aboutValues, aboutServices, whyUs, aboutStats } from '@/data/about';
import StatsSection from '@/components/sections/StatsSection';
import CTABanner from '@/components/sections/CTABanner';
import SectionHeading from '@/components/ui/SectionHeading';

function TeamCard({ member, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="bg-card border border-divider rounded-2xl p-6 text-center hover:border-accent/30 hover:shadow-md transition-all duration-300 card-glow group"
    >
      <div className="relative w-20 h-20 mx-auto mb-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/40 to-cyan/30 flex items-center justify-center text-white font-bold text-2xl">
          {member.name.charAt(0)}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-accent-light" />
        </div>
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1">{member.name}</h3>
      <p className="text-xs text-accent-light mb-3">{member.role}</p>
      <p className="text-xs text-muted leading-relaxed mb-4">{member.bio}</p>
      <div className="flex justify-center gap-2">
        <a href={member.linkedin} target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all">
          <ExternalLink size={13} />
        </a>
        <a href={`mailto:${member.email}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all">
          <Mail size={13} />
        </a>
      </div>
    </motion.div>
  );
}


export default function AboutContent() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative pt-[120px] pb-24 bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-800 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block text-xs font-semibold tracking-widest text-indigo-200 uppercase bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-5">
              About Us
            </span>
            <p className="text-sm text-indigo-200 font-medium mb-5 tracking-wide">
              सर्चे विजयः, व्यवसाये लाभः &nbsp;—&nbsp; Victory In Search, Profit In Business
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              Where Creativity Meets<br />
              <span className="text-cyan-300">Digital Excellence</span>
            </h1>
            <p className="text-base sm:text-lg text-indigo-100 leading-relaxed max-w-2xl mx-auto mb-10">
              Arshanemi is a Surat-based SEO and digital marketing agency formed with a shared vision — to transform marketing and design into something extraordinary by harnessing the full power of digital technology.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-indigo-200 bg-white/10 border border-white/20 rounded-full px-4 py-2">
              <MapPin size={12} className="text-cyan-300" />
              Katargam, Surat, Gujarat — India
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <SectionHeading eyebrow="Our Story" title="Built on Results, Driven by Data" center={false} />
              <div className="mt-6 space-y-4 text-muted text-sm leading-relaxed">
                <p>Arshanemi was founded with one unwavering mission — to make world-class digital marketing accessible to every business, regardless of size or budget. What began as a small, passionate team in Surat, Gujarat, has grown into a full-service SEO agency trusted by 200+ clients across India and beyond.</p>
                <p>Our Founder & CEO, <span className="text-foreground font-semibold">Nand Kishor Yadav</span>, built this agency on the belief that real growth comes from ethical strategies, radical transparency, and a relentless focus on measurable outcomes. We don't chase vanity metrics; we chase results that move your business forward.</p>
                <p>Today our creative team combines the art and science of digital marketing — transforming concepts into compelling campaigns that rank higher, convert better, and retain customers longer.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {aboutStats.map(({ value, label }) => (
                <div key={label} className="bg-card border border-divider rounded-2xl p-6 text-center hover:border-accent/30 hover:shadow-sm transition-colors">
                  <div className="text-4xl font-bold gradient-text mb-2">{value}</div>
                  <div className="text-xs text-muted">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MISSION / VISION / VALUES ── */}
      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <SectionHeading
              eyebrow="What Drives Us"
              title="Mission, Vision & Values"
              subtitle="Three pillars that shape everything we do — from how we strategize to how we serve each client."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aboutValues.map(({ icon, title, text }, i) => {
              const Icon = LucideIcons[icon] || LucideIcons.Star;
              return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-divider rounded-2xl p-7 hover:border-accent/30 hover:shadow-sm transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/8 border border-accent/20 flex items-center justify-center mb-5 group-hover:bg-accent/15 transition-colors">
                  <Icon size={22} className="text-accent-light" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-3">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{text}</p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <SectionHeading
              eyebrow="What We Do"
              title="Services We Specialize In"
              subtitle="Every service we offer is engineered around one goal — measurable, sustainable growth for your business."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aboutServices.map(({ icon, title, text }, i) => {
              const Icon = LucideIcons[icon] || LucideIcons.Star;
              return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-divider rounded-2xl p-7 hover:border-accent/30 hover:shadow-sm card-glow transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/10 to-cyan/5 border border-accent/20 flex items-center justify-center mb-5">
                  <Icon size={22} className="text-accent-light" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-3">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{text}</p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <StatsSection />

      {/* ── WHY CHOOSE US + TESTIMONIAL ── */}
      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <SectionHeading eyebrow="Why Arshanemi" title="Why Businesses Trust Us" center={false} />
              <p className="mt-4 text-sm text-muted leading-relaxed max-w-md">
                We're not just another agency. We treat your business goals as our own — measuring success by your growth, not our deliverables.
              </p>
              <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {whyUs.map(({ icon, text }) => {
                  const Icon = LucideIcons[icon] || LucideIcons.Star;
                  return (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-accent/8 border border-accent/20 flex items-center justify-center mt-0.5">
                      <Icon size={14} className="text-accent-light" />
                    </div>
                    <span className="text-sm text-muted leading-snug">{text}</span>
                  </li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-800 rounded-2xl p-8"
            >
              <Quote size={32} className="text-white/30 mb-4" />
              <p className="text-white text-base leading-relaxed mb-6">
                "An experienced, dedicated team that will deliver results. They are available all the time and go above and beyond to help. I couldn't ask for a better partner."
              </p>
              <div className="flex items-center gap-3 border-t border-white/20 pt-5">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-white shrink-0">
                  E
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Elio Noti</p>
                  <p className="text-xs text-indigo-200">Owner, Notilimousine — USA</p>
                </div>
                <div className="ml-auto flex gap-0.5 shrink-0">
                  {[0,1,2,3,4].map((i) => (
                    <Star key={i} size={12} className="text-amber-400" style={{ fill: '#fbbf24' }} />
                  ))}
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-white/20 flex items-center gap-3">
                <Award size={16} className="text-cyan-300 shrink-0" />
                <p className="text-xs text-indigo-200">
                  Recognised by <span className="text-white font-medium">DesignRush</span> as a Top SEO Company
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team" className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <SectionHeading
              eyebrow="Meet the Team"
              title="The Experts Behind Your Growth"
              subtitle="Our dedicated specialists work as one team — aligned to your goals and accountable for your results."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {team.map((member, i) => (
              <TeamCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
