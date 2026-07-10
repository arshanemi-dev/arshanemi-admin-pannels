'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import FormField from '@/components/admin/FormField'
import OtpDigitsInput from '@/components/admin/OtpDigitsInput'

const OTP_SECONDS = 60

// Inline "Change email" / "Change mobile" flow: enter the new value, we send
// an OTP to THAT new value (proving ownership of it), then verify + apply.
export default function ChangeContactSection({ type, label, icon: Icon, currentValue, onUpdated }) {
  const [expanded, setExpanded] = useState(false)
  const [step, setStep] = useState('input') // 'input' | 'otp'
  const [newValue, setNewValue] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => {
    if (timer <= 0) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(intervalRef.current)
  }, [timer])

  function reset() {
    setExpanded(false)
    setStep('input')
    setNewValue('')
    setOtp(['', '', '', '', '', ''])
    setTimer(0)
    setError('')
  }

  async function handleSendOtp() {
    setError('')
    if (!newValue.trim()) { setError(`Enter a new ${label.toLowerCase()}`); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-contact-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: newValue.trim() }),
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

  async function handleVerify() {
    const code = otp.join('')
    if (code.length < 6) { setError('Enter all 6 digits'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-contact-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: newValue.trim(), otpCode: code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid or expired OTP'); return }
      onUpdated(data)
      reset()
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
            <Icon className="w-4 h-4 text-subtle" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-subtle">{label}</p>
            <p className="text-sm font-medium text-foreground truncate">{currentValue || 'Not set'}</p>
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
        {expanded && (
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

          {step === 'input' && (
            <>
              <FormField
                label={`New ${label}`} name={`new-${type}`}
                type={type === 'email' ? 'email' : 'text'}
                value={newValue} onChange={(e) => setNewValue(e.target.value)}
                placeholder={type === 'email' ? 'you@example.com' : '10-digit mobile number'}
              />
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="self-start flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</> : 'Send OTP'}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-xs text-subtle -mt-1">
                A 6-digit code was sent to <strong className="text-foreground">{newValue}</strong>.{' '}
                {timer > 0 ? `Expires in ${timer}s` : 'Code expired'}
              </p>
              <OtpDigitsInput value={otp} onChange={setOtp} autoFocus />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVerify}
                  disabled={loading || timer === 0}
                  className="flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
                >
                  {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…</> : `Verify & Update`}
                </button>
                {timer === 0 && (
                  <button onClick={handleSendOtp} disabled={loading} className="text-xs font-medium text-accent hover:underline">
                    Resend code
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
