'use client'

import { useId, useState } from 'react'

type Status = 'idle' | 'loading' | 'ok' | 'error'

export function SubscribeBand() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')
  const id = useId()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('ok')
        setMsg(data.already ? "You're already on the list." : "You're in — check your inbox.")
      } else {
        setStatus('error')
        setMsg(data.error || 'Something went wrong. Try again.')
      }
    } catch {
      setStatus('error')
      setMsg('Network error. Try again.')
    }
  }

  return (
    <section
      id="subscribe"
      className="mx-auto mb-11 mt-2.5 flex max-w-[1080px] flex-wrap items-center gap-5 rounded-2xl border border-line bg-card px-6 py-5 shadow-[0_1px_2px_rgba(11,13,18,.04)]"
    >
      <div className="min-w-[220px] flex-1">
        <div className="text-lg font-bold tracking-[-0.02em] text-ink">
          One email a day. The signal, written long-form.
        </div>
        <p className="mt-1 max-w-[46ch] text-[0.8125rem] text-ink-soft">
          The top stories with their sources and a take — no noise, unsubscribe anytime.
        </p>
      </div>

      {status === 'ok' ? (
        <p role="status" className="font-mono text-[0.8125rem] font-semibold text-ok">
          {msg}
        </p>
      ) : (
        <form onSubmit={submit} className="flex gap-2.5">
          <label htmlFor={id} className="sr-only">
            Email address
          </label>
          <input
            id={id}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={status === 'error'}
            className="min-w-[230px] rounded-[10px] border border-line bg-card px-3.5 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-wash)]"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-[10px] bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground transition-[filter] hover:brightness-105 disabled:opacity-60"
          >
            {status === 'loading' ? '…' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p role="alert" className="w-full font-mono text-xs text-destructive">
          {msg}
        </p>
      )}
    </section>
  )
}
