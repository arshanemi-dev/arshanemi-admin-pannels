'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react'

function PasswordRule({ met, text }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-400' : 'text-subtle'}`}>
      {met ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {text}
    </li>
  )
}

function checkPassword(pw) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
}

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const rules = checkPassword(form.password)
  const pwValid = Object.values(rules).every(Boolean)
  const pwMatch = form.password && form.confirm === form.password

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!pwValid) { setError('Password does not meet all requirements'); return }
    if (!pwMatch)  { setError('Passwords do not match'); return }
    if (!form.email && !form.mobile) { setError('Provide at least an email or mobile number'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Signup failed'); return }
      router.push('/tools')
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-white font-semibold text-lg">Arshanemi</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-snug mb-4">
            Join 12,000+<br />smart sellers<br />on Arshanemi.
          </h1>
          <ul className="space-y-3 text-orange-200 text-sm">
            {['Free account — no credit card required', 'Explore our suite of ecommerce tools', 'Real-time product & market data', 'Secure & private — your data stays yours'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-orange-300 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-orange-300 text-sm">© {new Date().getFullYear()} Arshanemi. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-foreground">Arshanemi</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Create your account</h2>
          <p className="text-muted text-sm mb-8">
            Already have one?&nbsp;
            <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Full Name" required>
              <input
                type="text" required placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-base"
              />
            </Field>

            <Field label="Email Address">
              <input
                type="email" placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input-base"
              />
            </Field>

            <Field label="Mobile Number">
              <input
                type="tel" placeholder="10-digit mobile number"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                className="input-base"
              />
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="input-base pr-11"
                />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <ul className="mt-2 space-y-1">
                  <PasswordRule met={rules.length}  text="At least 8 characters" />
                  <PasswordRule met={rules.upper}   text="One uppercase letter (A-Z)" />
                  <PasswordRule met={rules.number}  text="One number (0-9)" />
                  <PasswordRule met={rules.special} text="One special character (!@#$…)" />
                </ul>
              )}
            </Field>

            <Field label="Confirm Password" required>
              <input
                type="password" required placeholder="Re-enter password"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                className={`input-base ${form.confirm && !pwMatch ? 'border-red-500/60' : ''}`}
              />
              {form.confirm && !pwMatch && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </Field>

            <button
              type="submit" disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {loading ? <><Loader2 className="animate-spin" size={16} /> Creating account…</> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-divider-light);
          background: var(--color-card);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: var(--color-foreground);
        }
        .input-base::placeholder { color: var(--color-subtle); }
        .input-base:focus { outline: none; ring: 2px solid var(--color-accent); border-color: var(--color-accent); }
      `}</style>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted">
        {label}{required && <span className="text-accent ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
