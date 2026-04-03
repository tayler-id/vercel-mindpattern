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
          <div className="flex items-center justify-center size-7 border border-primary bg-primary/10">
            <span className="text-primary text-xs font-bold">MP</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">
            MindPattern
          </span>
        </div>

        {status === 'done' ? (
          <div className="border border-border dossier-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Unsubscribed
            </p>
            <p className="text-xs text-muted-foreground">
              You have been removed from the daily briefing.
            </p>
          </div>
        ) : (
          <div className="border border-border dossier-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
              Unsubscribe
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Enter your email to stop receiving the daily briefing.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@email.com"
                required
                className="h-8 w-full border border-input bg-transparent px-2.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-8 w-full border border-destructive bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider hover:bg-destructive/20 disabled:opacity-50"
              >
                {status === 'loading' ? 'Processing...' : 'Unsubscribe'}
              </button>
              {status === 'error' && (
                <p className="text-[10px] text-destructive uppercase tracking-wider">
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
