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
    <section id="subscribe" className="mx-auto mb-12 mt-4 max-w-[1080px] px-4 max-sm:px-3">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(11,13,18,.04)] sm:p-8">
        <div className="flex flex-wrap items-end gap-6">
          <div className="min-w-[240px] flex-1">
            <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary">
              The Briefing
            </div>
            <h2 className="mt-2 font-serif text-[1.625rem] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
              Get the signal, once a day.
            </h2>
            <p className="mt-2 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink-soft">
              The day&rsquo;s top stories — long-form, with sources and a take. No noise,
              unsubscribe anytime.
            </p>
          </div>

          {status === 'ok' ? (
            <p role="status" className="font-mono text-[0.8125rem] font-semibold text-ok">
              ✓ {msg}
            </p>
          ) : (
            <form onSubmit={submit} className="flex w-full gap-2.5 sm:w-auto">
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
                className="w-full min-w-0 rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-wash)] sm:w-[240px]"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="shrink-0 rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:brightness-105 active:scale-95 disabled:opacity-60"
              >
                {status === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
        </div>

        {status === 'error' && (
          <p role="alert" className="mt-3 font-mono text-xs text-destructive">
            {msg}
          </p>
        )}
      </div>
    </section>
  )
}
