'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export function NewsletterSignup({ className }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    trackEvent('subscribe_submitted', { surface: 'newsletter_signup' })
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        trackEvent('subscribe_success', { surface: 'newsletter_signup' })
        setStatus('ok')
        setMessage(data.already ? 'ALREADY ON FILE' : 'SUBSCRIBED')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'TRANSMISSION FAILED')
      }
    } catch {
      setStatus('error')
      setMessage('NETWORK ERROR')
    }
  }

  if (status === 'ok') {
    return (
      <div className={className}>
        <div className="border border-line bg-surface p-3">
          <p className="type-kicker text-ok">
            {message}
          </p>
          <p className="font-mono text-[11px] tracking-[0.08em] text-ink-faint mt-1">
            Daily briefings inbound.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="type-kicker text-ink-faint mb-2">
        Daily Intel Briefing
      </p>
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          placeholder="agent@email.com"
          required
          className="h-7 flex-1 min-w-0 rounded-sm border border-line bg-surface px-2 font-mono text-xs placeholder:text-ink-faint focus:outline-none focus:border-ring"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-7 px-2 rounded-sm bg-primary text-primary-foreground font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="size-3" />
        </button>
      </form>
      {status === 'error' && (
        <p className="type-kicker text-destructive mt-1">
          {message}
        </p>
      )}
    </div>
  )
}
