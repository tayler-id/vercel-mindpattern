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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex items-center justify-center size-7 border border-primary bg-accent-wash">
            <span className="type-display text-primary text-sm font-[640]">MP</span>
          </div>
          <span className="type-display text-[17px] font-[600] text-ink">
            MindPattern
          </span>
        </div>

        {status === 'done' ? (
          <div className="border border-ink bg-surface p-6">
            <p className="type-kicker text-ink mb-2">
              Unsubscribed
            </p>
            <p className="font-serif text-[13px] text-ink-soft">
              You have been removed from the daily briefing.
            </p>
          </div>
        ) : (
          <div className="border border-ink bg-surface p-6">
            <p className="type-kicker text-ink mb-1">
              Unsubscribe
            </p>
            <p className="font-serif text-[13px] text-ink-soft mb-4">
              Enter your email to stop receiving the daily briefing.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@email.com"
                required
                className="h-8 w-full rounded-sm border border-line bg-paper px-2.5 font-mono text-xs placeholder:text-ink-faint focus:outline-none focus:border-ring"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-8 w-full rounded-sm bg-primary text-primary-foreground font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50"
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
