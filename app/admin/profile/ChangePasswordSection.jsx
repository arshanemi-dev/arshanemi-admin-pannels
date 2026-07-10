'use client'
import { useEffect, useRef, useState } from 'react'
import { KeyRound, Loader2, X, CheckCircle2, Mail, Phone } from 'lucide-react'
import FormField from '@/components/admin/FormField'
import OtpDigitsInput from '@/components/admin/OtpDigitsInput'

const OTP_SECONDS = 60

// Inline "Change password" flow — pick which channel (email or mobile, if
// both are on file) receives the OTP, verify it, then set a new password.
// Reuses the existing send-otp / verify-otp / reset-password endpoints.
export default function ChangePasswordSection({ email, mobile, onDone }) {
  const [expanded, setExpanded] = useState(false)
  const [channel, setChannel] = useState(email ? 'email' : 'mobile')
  const [step, setStep] = useState('channel') // 'channel' | 'otp' | 'password' | 'done'
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [timer, setTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const intervalRef = useRef(null)

  const identifier = channel === 'email' ? email : mobile

  useEffect(() => {
    if (timer <= 0) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(intervalRef.current)
  }, [timer])

  function reset() {
    setExpanded(false)
    setStep('channel')
    setOtp(['', '', '', '', '', ''])
    setResetToken('')
    setPassword('')
    setConfirm('')
    setTimer(0)
    setError('')
  }

  async function handleSendOtp() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type: channel }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send OTP'); return }
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      setTimer(OTP_SECONDS)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join('')
    if (code.length < 6) { setError('Enter all 6 digits'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otpCode: code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid or expired OTP'); return }
      setResetToken(data.resetToken)
      setStep('password')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetPassword() {
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to reset password'); return }
      setStep('done')
      onDone?.()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-divider rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4 text-subtle" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-subtle">Password</p>
            <p className="text-sm font-medium text-foreground">••••••••</p>
          </div>
        </div>
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs font-medium text-accent hover:text-accent-hover flex-shrink-0"
          >
            Change
          </button>
        )}
        {expanded && step !== 'done' && (
          <button onClick={reset} className="text-subtle hover:text-muted flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-divider pt-4 flex flex-col gap-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>
          )}

          {step === 'channel' && (
            <>
              {email && mobile && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted">Send verification code via</label>
                  <div className="flex items-center gap-1 p-1 bg-surface rounded-lg w-fit">
                    <button
                      type="button" onClick={() => setChannel('email')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        channel === 'email' ? 'bg-card text-foreground shadow-sm' : 'text-subtle hover:text-muted'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                    <button
                      type="button" onClick={() => setChannel('mobile')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        channel === 'mobile' ? 'bg-card text-foreground shadow-sm' : 'text-subtle hover:text-muted'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" /> Mobile
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-subtle">
                We'll send a 6-digit code to <strong className="text-foreground">{identifier}</strong>.
              </p>
              <button
                onClick={handleSendOtp}
                disabled={loading || !identifier}
                className="self-start flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</> : 'Send OTP'}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-xs text-subtle -mt-1">
                A 6-digit code was sent to <strong className="text-foreground">{identifier}</strong>.{' '}
                {timer > 0 ? `Expires in ${timer}s` : 'Code expired'}
              </p>
              <OtpDigitsInput value={otp} onChange={setOtp} autoFocus />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || timer === 0}
                  className="flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
                >
                  {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…</> : 'Verify Code'}
                </button>
                {timer === 0 && (
                  <button onClick={handleSendOtp} disabled={loading} className="text-xs font-medium text-accent hover:underline">
                    Resend code
                  </button>
                )}
              </div>
            </>
          )}

          {step === 'password' && (
            <>
              <FormField
                label="New Password" name="new-password" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                hint="Min 8 characters, 1 uppercase letter, 1 number, 1 special character"
              />
              <FormField
                label="Confirm Password" name="confirm-password" type="password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
              />
              <button
                onClick={handleSetPassword}
                disabled={loading || !password || !confirm}
                className="self-start flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…</> : 'Update Password'}
              </button>
            </>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-muted">Password changed successfully.</p>
              <button onClick={reset} className="text-xs font-medium text-accent hover:underline">Close</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
