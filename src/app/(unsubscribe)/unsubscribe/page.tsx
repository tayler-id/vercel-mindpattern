'use client'

import { useState } from 'react'

export default function UnsubscribePage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-5 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-baseline gap-1 mb-8">
          <span
            className="type-display text-[17px] uppercase text-ink"
            style={{ fontVariationSettings: '"wdth" 122', fontWeight: 880 }}
          >
            MindPattern
          </span>
          <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden />
        </div>

        {status === 'done' ? (
          <div className="rounded-[3px] border-[1.5px] border-ink bg-paper p-6">
            <p className="type-kicker text-ok mb-2">
              Unsubscribed
            </p>
            <p className="font-mono text-[11px] tracking-[0.08em] text-ink-soft">
              You have been removed from the daily briefing.
            </p>
          </div>
        ) : (
          <div className="rounded-[3px] border-[1.5px] border-ink bg-paper p-6">
            <p className="type-kicker text-ink mb-2">
              Unsubscribe
            </p>
            <p className="text-[14px] leading-[1.55] text-ink-soft mb-4">
              Enter your email to stop receiving the daily briefing.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@email.com"
                required
                aria-label="Email address"
                className="h-11 w-full rounded-full border-[1.5px] border-ink bg-paper px-4 font-mono text-[16px] md:h-9 md:text-xs placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-11 w-full rounded-full bg-primary px-6 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-all hover:bg-[#c8290f] active:scale-95 disabled:bg-panel disabled:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:h-9"
              >
                {status === 'loading' ? 'Processing...' : 'Unsubscribe'}
              </button>
              {status === 'error' && (
                <p className="type-kicker text-destructive">
                  Something went wrong. Try again.
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
