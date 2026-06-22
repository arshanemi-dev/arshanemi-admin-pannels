'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, Send, AlertCircle } from 'lucide-react';
import { contactBudgets } from '@/data/contact';
import { services as defaultServices } from '@/data/services';

const INITIAL = { name: '', email: '', phone: '', budget: '', service: '', message: '' };

export default function ContactForm({ services }) {
  const serviceList = services?.length ? services : defaultServices.map((s) => s.title);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === 'error') setStatus(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in your name, email, and message.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setStatus('success');
      setForm(INITIAL);
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-card border border-divider rounded-2xl p-8 shadow-sm flex flex-col items-center text-center min-h-[420px] justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">Message Sent!</h3>
        <p className="text-muted text-sm leading-relaxed max-w-xs">
          Thanks for reaching out! Our team will review your project details and get back to you within a few hours.
        </p>
        <button
          onClick={() => setStatus(null)}
          className="mt-6 text-xs font-semibold text-accent-light hover:text-foreground transition-colors underline underline-offset-2"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-divider rounded-2xl p-8 shadow-sm">
      <h2 className="text-xl font-bold text-foreground mb-6">Discuss Your Project</h2>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="cf-name" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              id="cf-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="w-full bg-surface border border-divider rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label htmlFor="cf-email" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              id="cf-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full bg-surface border border-divider rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="cf-phone" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Phone Number</label>
            <input
              id="cf-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full bg-surface border border-divider rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label htmlFor="cf-budget" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Budget</label>
            <select
              id="cf-budget"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              className="w-full bg-surface border border-divider rounded-lg px-4 py-3 text-sm text-muted focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">Select budget</option>
              {contactBudgets.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="cf-service" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Service Required</label>
          <select
            id="cf-service"
            name="service"
            value={form.service}
            onChange={handleChange}
            className="w-full bg-surface border border-divider rounded-lg px-4 py-3 text-sm text-muted focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Select a service</option>
            {serviceList.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="cf-message" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Tell us about your project <span className="text-red-400">*</span>
          </label>
          <textarea
            id="cf-message"
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={5}
            placeholder="Describe your business goals and what you're looking to achieve..."
            required
            className="w-full bg-surface border border-divider rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {status === 'error' && (
          <div className="flex items-start gap-3 text-sm text-red-400 bg-red-400/8 border border-red-400/20 rounded-lg px-4 py-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:from-[#4338ca] hover:to-[#6d28d9] text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/15"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send size={15} />
              Send Message &amp; Get Free Audit
            </>
          )}
        </button>
      </form>
    </div>
  );
}
