'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, CheckCircle, Loader2, ArrowRight, Gift } from 'lucide-react';
import { isLoggedIn } from '@/lib/tokenStore';

const SUBMITTED_KEY = 'si-lead-submitted';
const TIMER_DONE_KEY = 'si-lead-timer-done';
const DELAY_MS = 30_000;

const services = [
  'Local SEO',
  'eCommerce SEO',
  'Google Ads (PPC)',
  'Social Media Marketing',
  'Link Building',
  'Content Writing',
  'YouTube SEO',
  'Other',
];

export default function LeadPopup() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', interest: '' });
  const timerRef = useRef(null);

  useEffect(() => {
    // Signed-in users never see the lead capture popup
    if (isLoggedIn()) return;

    // Already submitted once — never show again
    if (localStorage.getItem(SUBMITTED_KEY)) return;

    // Timer already elapsed in a previous session — show immediately
    if (localStorage.getItem(TIMER_DONE_KEY)) {
      setVisible(true);
      return;
    }

    // First visit — start 30s countdown
    timerRef.current = setTimeout(() => {
      localStorage.setItem(TIMER_DONE_KEY, 'true');
      setVisible(true);
    }, DELAY_MS);

    return () => clearTimeout(timerRef.current);
  }, []);

  function close() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 300);
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem(SUBMITTED_KEY, 'true');
      setSubmitted(true);
      setLoading(false);
      setTimeout(close, 3000);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-popup-title"
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${closing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        <div className="relative w-full max-w-md bg-card border border-divider rounded-2xl shadow-2xl overflow-hidden">

          {/* Gradient top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#06b6d4]" />

          {/* Close button */}
          <button
            onClick={close}
            aria-label="Close popup"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface border border-divider flex items-center justify-center text-subtle hover:text-foreground hover:border-divider-light transition-colors z-10"
          >
            <X size={14} />
          </button>

          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center px-8 py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-5">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">You're All Set!</h2>
              <p className="text-muted text-sm leading-relaxed">
                Thanks, <span className="text-accent-light font-semibold">{form.name}</span>! Our team will reach out to you shortly with your free SEO audit.
              </p>
            </div>
          ) : (
            /* ── Form state ── */
            <div className="px-7 py-7">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <Gift size={22} className="text-accent-light" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={12} className="text-accent-light" />
                    <span className="text-xs font-bold tracking-widest text-accent-light uppercase">Limited Time Offer</span>
                  </div>
                  <h2 id="lead-popup-title" className="text-xl font-bold text-foreground leading-tight">
                    Get Your <span className="gradient-text">Free SEO Audit</span>
                  </h2>
                  <p className="text-subtle text-xs mt-1">
                    Worth ₹5,000 — absolutely free, no commitment.
                  </p>
                </div>
              </div>

              {/* Perks strip */}
              <div className="flex gap-3 mb-6">
                {['Full Site Audit', 'Competitor Gap', 'Action Plan'].map((p) => (
                  <span key={p} className="flex-1 text-center text-[10px] font-semibold text-accent-light bg-accent/8 border border-accent/15 rounded-md py-1.5 px-1 leading-tight">
                    {p}
                  </span>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="lp-name" className="block text-[10px] font-bold text-subtle uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="lp-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="w-full bg-surface border border-divider rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="lp-phone" className="block text-[10px] font-bold text-subtle uppercase tracking-wider mb-1.5">
                      Phone
                    </label>
                    <input
                      id="lp-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-surface border border-divider rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lp-email" className="block text-[10px] font-bold text-subtle uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="lp-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-surface border border-divider rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="lp-interest" className="block text-[10px] font-bold text-subtle uppercase tracking-wider mb-1.5">
                    Service Interested In
                  </label>
                  <select
                    id="lp-interest"
                    name="interest"
                    value={form.interest}
                    onChange={handleChange}
                    className="w-full bg-surface border border-divider rounded-lg px-3 py-2.5 text-sm text-muted focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">Select a service</option>
                    {services.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-400/8 border border-red-400/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:from-[#4338ca] hover:to-[#6d28d9] text-white font-bold text-sm py-3 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1 shadow-lg shadow-indigo-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Claim My Free Audit
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-subtle leading-tight pt-0.5">
                  No spam, ever. We respect your privacy.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
