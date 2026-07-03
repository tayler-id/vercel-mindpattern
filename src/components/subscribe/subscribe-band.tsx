'use client'

import { useId, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

type Status = 'idle' | 'loading' | 'ok' | 'error'

/**
 * Color-block subscribe section — solid ink block, 20px radius, white Archivo
 * display headline, pill white input + white pill button (ink text stays AA
 * on the ink block), mono microcopy. Button hover nudges the arrow.
 */
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
    <section id="subscribe" className="mx-auto mb-16 mt-10 max-w-[1240px] px-8 max-sm:px-5">
      <div className="rounded-[20px] bg-ink px-8 py-10 text-white sm:px-12">
        <div className="flex flex-wrap items-end gap-8">
          <div className="min-w-[240px] flex-1">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/80">
              The Ramsay Research Report
            </p>
            <h2
              className="type-display mt-3 text-[clamp(26px,3.4vw,40px)] uppercase leading-[1.02] text-white"
              style={{ fontVariationSettings: '"wdth" 114', fontWeight: 850 }}
            >
              The daily brief, in your inbox.
            </h2>
            <p className="mt-3 max-w-[52ch] font-mono text-[11.5px] leading-[1.6] tracking-[0.04em] text-white/80">
              The day&rsquo;s top stories, long-form, with sources and a take. No noise,
              unsubscribe anytime.
            </p>
          </div>

          {status === 'ok' ? (
            <p role="status" className="font-mono text-[0.8125rem] font-semibold text-white">
              ✓ {msg}
            </p>
          ) : (
            <form onSubmit={submit} className="flex w-full flex-wrap gap-3 sm:w-auto">
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
                className="w-full min-w-0 rounded-full border-0 bg-white px-6 py-3 text-base text-ink outline-none transition-colors duration-(--dur-fast) placeholder:font-mono placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-[260px]"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group shrink-0 rounded-full bg-white px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform duration-(--dur-fast) hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 disabled:bg-panel disabled:text-ink-faint"
              >
                {status === 'loading' ? '…' : 'Subscribe'}{' '}
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-(--dur-fast) group-hover:translate-x-0.5"
                >
                  →
                </span>
              </button>
            </form>
          )}
        </div>

        {status === 'error' && (
          <p role="alert" className="mt-4 font-mono text-xs font-semibold text-white">
            {msg}
          </p>
        )}
      </div>
    </section>
  )
}
