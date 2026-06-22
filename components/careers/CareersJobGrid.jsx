'use client'
import { useState, useEffect } from 'react'
import {
  X, MapPin, Clock, Briefcase, ArrowRight, Upload,
  CheckCircle, ChevronLeft, Loader2, FileText,
} from 'lucide-react'

/* ─── Skill badge — pure theme tokens ───────────────────────── */
function SkillBadge({ label }) {
  return (
    <span className="text-xs bg-surface border border-divider text-subtle px-2.5 py-1 rounded-full">
      {label}
    </span>
  )
}

/* ─── Section label inside modal ────────────────────────────── */
function ModalLabel({ children }) {
  return (
    <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
      {children}
    </h4>
  )
}

/* ─── Job Card ───────────────────────────────────────────────── */
function JobCard({ job, onSelect }) {
  return (
    <div className="group bg-card border border-divider rounded-2xl p-6 hover:border-accent/40 hover:bg-card-hover transition-all duration-300 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-foreground mb-1">{job.title}</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1"><Briefcase size={11} /> {job.jobType || job.type}</span>
            <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {job.experience}</span>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-accent-light bg-accent/8 border border-accent/20 px-3 py-1 rounded-full">
          Hiring
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5 flex-1">
        {(job.skills || []).map((s) => <SkillBadge key={s} label={s} />)}
      </div>

      <button
        onClick={() => onSelect(job)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light group-hover:gap-2.5 transition-all self-start mt-auto"
      >
        View Details &amp; Apply <ArrowRight size={12} />
      </button>
    </div>
  )
}

/* ─── Apply Form ─────────────────────────────────────────────── */
function ApplyForm({ job, onBack, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', coverLetter: '' })
  const [resume, setResume] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!resume) { setError('Please upload your resume.'); return }
    setSubmitting(true)
    setError('')

    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('email', form.email)
    fd.append('phone', form.phone)
    fd.append('coverLetter', form.coverLetter)
    fd.append('jobTitle', job.title)
    fd.append('resume', resume)

    try {
      const res = await fetch('/api/careers/apply', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) onSuccess(form.name)
      else setError(data.error || 'Something went wrong. Please try again.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full bg-card border border-divider rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder-subtle focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-subtle hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft size={14} /> Back to Job Details
      </button>

      <h3 className="text-base font-bold text-foreground">
        Apply for <span className="text-accent-light">{job.title}</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted mb-1.5 block">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input required value={form.name} onChange={set('name')} placeholder="Ravi Kumar" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted mb-1.5 block">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="ravi@email.com" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted mb-1.5 block">Phone Number</label>
        <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={inputCls} />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted mb-1.5 block">
          Cover Letter <span className="text-subtle">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={form.coverLetter}
          onChange={set('coverLetter')}
          placeholder="Tell us why you're a great fit for this role…"
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Resume Upload */}
      <div>
        <label className="text-xs font-semibold text-muted mb-1.5 block">
          Resume <span className="text-red-400">*</span>
        </label>
        <label className="flex items-center gap-3 bg-card border border-dashed border-divider-light rounded-xl px-4 py-4 cursor-pointer hover:border-accent/50 hover:bg-card-hover transition-all group">
          {resume ? (
            <>
              <FileText size={18} className="text-accent-light shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">{resume.name}</span>
              <span className="text-xs text-subtle">{(resume.size / 1024).toFixed(0)} KB</span>
            </>
          ) : (
            <>
              <Upload size={18} className="text-subtle group-hover:text-accent-light shrink-0 transition-colors" />
              <span className="text-sm text-subtle group-hover:text-muted transition-colors">
                Click to upload your resume
              </span>
            </>
          )}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => { setResume(e.target.files[0]); setError('') }}
          />
        </label>
        <p className="text-xs text-subtle mt-1.5">Accepted: PDF, DOC, DOCX — Max 5 MB</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-lg shadow-accent/20"
      >
        {submitting
          ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
          : <>Submit Application <ArrowRight size={14} /></>
        }
      </button>
    </form>
  )
}

/* ─── Job Detail View ────────────────────────────────────────── */
function JobDetail({ job, onApply }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Info chips */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Briefcase, label: 'Type',       value: job.jobType || job.type },
          { icon: MapPin,    label: 'Location',   value: job.location },
          { icon: Clock,     label: 'Experience', value: job.experience },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border border-divider rounded-xl p-3 text-center">
            <Icon size={14} className="text-accent-light mx-auto mb-1" />
            <p className="text-[10px] text-subtle uppercase font-semibold tracking-wide mb-0.5">{label}</p>
            <p className="text-xs text-foreground font-medium leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div>
        <ModalLabel>Skills Required</ModalLabel>
        <div className="flex flex-wrap gap-2">
          {(job.skills || []).map((s) => <SkillBadge key={s} label={s} />)}
        </div>
      </div>

      {/* Job Description */}
      {job.description && (
        <div>
          <ModalLabel>Job Description</ModalLabel>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>
      )}

      <button
        onClick={onApply}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-cyan hover:opacity-90 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-accent/20 mt-2"
      >
        Apply for this Position <ArrowRight size={15} />
      </button>
    </div>
  )
}

/* ─── Success Screen ─────────────────────────────────────────── */
function SuccessScreen({ name, jobTitle, onClose }) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
        <CheckCircle size={36} className="text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h3>
      <p className="text-sm text-muted max-w-sm leading-relaxed mb-1">
        Thank you, <strong className="text-foreground">{name}</strong>! Your application for{' '}
        <strong className="text-accent-light">{jobTitle}</strong> has been received.
      </p>
      <p className="text-sm text-subtle mb-8">
        Our HR team will review it and get back to you within 2 business days.
      </p>
      <button
        onClick={onClose}
        className="px-8 py-2.5 rounded-xl bg-card border border-divider text-sm text-muted hover:text-foreground hover:border-divider-light transition-all"
      >
        Close
      </button>
    </div>
  )
}

/* ─── Main Export ────────────────────────────────────────────── */
export default function CareersJobGrid({ jobs }) {
  const [selectedJob, setSelectedJob] = useState(null)
  const [view, setView] = useState('detail')
  const [applicantName, setApplicantName] = useState('')

  useEffect(() => {
    document.body.style.overflow = selectedJob ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedJob])

  function openJob(job) {
    setSelectedJob(job)
    setView('detail')
    setApplicantName('')
  }

  function closeModal() { setSelectedJob(null) }

  function handleSuccess(name) {
    setApplicantName(name)
    setView('success')
  }

  return (
    <>
      {/* Job Cards Grid */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {jobs.map((job) => (
          <JobCard key={job.id || job.title} job={job} onSelect={openJob} />
        ))}
      </div>

      {/* Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Job details: ${selectedJob.title}`}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeModal} />

          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-background border border-divider rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

            {/* Header — gradient uses CSS vars so it respects theme */}
            <div
              className="flex items-start justify-between gap-4 px-6 py-5 shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--color-accent-rgb)) 0%, rgba(var(--color-accent-rgb),0.75) 55%, rgb(var(--color-cyan-rgb)) 100%)',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold tracking-[2px] text-white/60 uppercase mb-1">
                  {view === 'apply' ? 'Application Form' : view === 'success' ? 'Done' : 'Job Opening'}
                </p>
                <h2 className="text-lg font-bold text-white truncate">{selectedJob.title}</h2>
                {view === 'detail' && (
                  <p className="text-sm text-white/65 mt-0.5">
                    {selectedJob.jobType || selectedJob.type} · {selectedJob.location}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="shrink-0 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                <X size={15} className="text-white" />
              </button>
            </div>

            {/* Scrollable body */}
            <div
              className="flex-1 overflow-y-auto p-6
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:transparent
                [&::-webkit-scrollbar-thumb]:bg-divider-light
                [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {view === 'detail' && (
                <JobDetail job={selectedJob} onApply={() => setView('apply')} />
              )}
              {view === 'apply' && (
                <ApplyForm job={selectedJob} onBack={() => setView('detail')} onSuccess={handleSuccess} />
              )}
              {view === 'success' && (
                <SuccessScreen name={applicantName} jobTitle={selectedJob.title} onClose={closeModal} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
