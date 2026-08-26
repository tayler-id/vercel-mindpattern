'use client'

import { useId, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

type Status = 'idle' | 'loading' | 'ok' | 'error'

const STAGES = [
  { value: 'exploring', label: 'Still exploring what AI could do here' },
  { value: 'scoped', label: 'Have a specific project in mind' },
  { value: 'building', label: 'Already building, need help making it hold' },
] as const

const FIELD_CLASS =
  'mt-2 w-full rounded-[3px] border-[1.5px] border-ink bg-paper px-4 py-2.5 font-sans text-[16px] text-ink outline-none placeholder:font-mono placeholder:text-[13px] placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-ink sm:text-[14px]'

const LABEL_CLASS = 'type-kicker block text-ink-soft'

/**
 * Inquiry form → /api/inquire → Resend. Four real fields plus a hidden
 * honeypot: enough to qualify without turning a first contact into a
 * questionnaire. Mirrors SubscribeBand's status machine.
 */
export function InquiryForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')
  const ids = useId()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setStatus('loading')
    trackEvent('inquiry_submitted', { surface: 'work_page' })
    try {
      const res = await fetch('/api/inquire', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        trackEvent('inquiry_success', { surface: 'work_page' })
        setStatus('ok')
        form.reset()
      } else {
        setStatus('error')
        setMsg(body.error || 'Something went wrong. Try again.')
      }
    } catch {
      setStatus('error')
      setMsg('Network error. Try again in a moment.')
    }
  }

  if (status === 'ok') {
    return (
      <div role="status" className="rule-row pt-7">
        <p className="type-kicker text-primary">Received</p>
        <p className="mt-3 font-serif text-[1.0625rem] leading-[1.55] text-ink-prose">
          That landed in my inbox. I read every one of these myself and I&rsquo;ll come
          back to you within two working days — usually sooner.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rule-row pt-7">
      <p className="type-kicker text-primary">Start a conversation</p>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-name`} className={LABEL_CLASS}>
            Name
          </label>
          <input
            id={`${ids}-name`}
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Ada Lovelace"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor={`${ids}-email`} className={LABEL_CLASS}>
            Email
          </label>
          <input
            id={`${ids}-email`}
            name="email"
            type="email"
            inputMode="email"
            required
            maxLength={200}
            autoComplete="email"
            placeholder="you@company.com"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor={`${ids}-company`} className={LABEL_CLASS}>
            Company <span className="text-ink-faint">— optional</span>
          </label>
          <input
            id={`${ids}-company`}
            name="company"
            maxLength={120}
            autoComplete="organization"
            placeholder="Where you work"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor={`${ids}-stage`} className={LABEL_CLASS}>
            Where you are
          </label>
          <select id={`${ids}-stage`} name="stage" defaultValue="scoped" className={FIELD_CLASS}>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={`${ids}-message`} className={LABEL_CLASS}>
          What are you trying to build?
        </label>
        <textarea
          id={`${ids}-message`}
          name="message"
          required
          rows={5}
          maxLength={4000}
          placeholder="The workflow you want automated, the thing that keeps breaking, or the decision you’re stuck on. Detail helps — I’d rather read a lot than a little."
          className={`${FIELD_CLASS} resize-y leading-[1.55]`}
        />
      </div>

      {/* Honeypot — real people never see it, bots fill everything. */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${ids}-website`}>Website</label>
        <input id={`${ids}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="group rounded-full bg-ink px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-[transform,filter] duration-(--dur-fast) hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95 disabled:bg-panel disabled:text-ink-faint"
        >
          {status === 'loading' ? 'Sending…' : 'Send it'}{' '}
          <span
            aria-hidden
            className="inline-block transition-transform duration-(--dur-fast) group-hover:translate-x-0.5"
          >
            →
          </span>
        </button>
        <p className="font-mono text-[11px] leading-[1.5] tracking-[0.04em] text-ink-faint">
          Goes straight to my inbox. No CRM, no drip sequence.
        </p>
      </div>

      {status === 'error' && (
        <p role="alert" className="mt-4 font-mono text-xs font-semibold text-primary">
          {msg}
        </p>
      )}
    </form>
  )
}
