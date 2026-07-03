'use client'

import { useId, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

type Status = 'idle' | 'loading' | 'ok' | 'error'

export function SubscribeBand() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')
  const id = useId()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    trackEvent('subscribe_submitted', { surface: 'subscribe_band' })
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        trackEvent('subscribe_success', { surface: 'subscribe_band' })
        setStatus('ok')
        setMsg(data.already ? "You're already on the list." : "You're in. Check your inbox.")
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
      <div className="border border-ink bg-accent-wash p-6 sm:p-8">
        <div className="flex flex-wrap items-end gap-6">
          <div className="min-w-[240px] flex-1">
            <div className="type-kicker text-primary">
              The Ramsay Research Report
            </div>
            <h2 className="type-display mt-2 text-[1.75rem] font-[600] text-ink">
              The daily brief, in your inbox.
            </h2>
            <p className="mt-2 max-w-[52ch] font-serif text-[0.9375rem] leading-relaxed text-ink-soft">
              The day&rsquo;s top stories, long-form, with sources and a take. No noise,
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
                className="w-full min-w-0 rounded-sm border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-primary sm:w-[240px]"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="shrink-0 rounded-sm bg-primary px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:brightness-105 active:scale-95 disabled:opacity-60"
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
