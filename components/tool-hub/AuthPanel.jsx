'use client'
import { useState } from 'react'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A11.998 11.998 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1Z" />
    <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.26 6.62l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
  </svg>
)

export default function AuthPanel({ toolName, onAuthenticated }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) { setError(signUpError.message); return }
        if (data.session) {
          onAuthenticated?.()
        } else {
          setInfo('Check your email to confirm your account, then sign in.')
          setMode('signin')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) { setError(signInError.message); return }
        onAuthenticated?.()
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/tool-hub` },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
    // On success the browser redirects away — no need to reset loading state.
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-card border border-divider rounded-2xl p-6">
      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
        <Lock size={18} />
      </div>
      <h3 className="text-foreground font-bold text-lg mb-1">
        Sign in to use {toolName}
      </h3>
      <p className="text-muted text-sm mb-6">
        This tool requires an account. Sign in or create one to continue.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}
      {info && (
        <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-xl px-4 py-3 mb-4">
          {info}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2 border border-divider-light bg-card-hover hover:bg-divider text-foreground font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-60 mb-4"
      >
        {googleLoading ? <Loader2 className="animate-spin" size={16} /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-divider" />
        <span className="text-xs text-subtle">or</span>
        <div className="flex-1 h-px bg-divider" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-divider-light bg-background px-4 py-2.5 text-sm text-foreground placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
        />
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full rounded-xl border border-divider-light bg-background px-4 py-2.5 pr-11 text-sm text-foreground placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="animate-spin" size={16} /> {mode === 'signup' ? 'Creating account…' : 'Signing in…'}</>
            : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-4">
        {mode === 'signup' ? (
          <>Already have an account?{' '}
            <button type="button" onClick={() => setMode('signin')} className="text-accent hover:underline font-medium">
              Sign in
            </button>
          </>
        ) : (
          <>Don&apos;t have an account?{' '}
            <button type="button" onClick={() => setMode('signup')} className="text-accent hover:underline font-medium">
              Sign up free
            </button>
          </>
        )}
      </p>
    </div>
  )
}
