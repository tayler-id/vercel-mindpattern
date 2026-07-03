'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export function NewsletterSignup({
  className,
  variant = 'default',
}: {
  className?: string
  /** 'onAccent' restyles the controls for placement on a solid accent color-block. */
  variant?: 'default' | 'onAccent'
}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const onAccent = variant === 'onAccent'

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
        {onAccent ? (
          <div className="inline-flex flex-col gap-1 rounded-[12px] bg-white px-4 py-3">
            <p className="type-kicker text-ok">{message}</p>
            <p className="font-mono text-[11px] tracking-[0.08em] text-ink-soft">
              Daily briefings inbound.
            </p>
          </div>
        ) : (
          <>
            <p className="type-kicker text-ok">{message}</p>
            <p className="font-mono text-[11px] tracking-[0.08em] text-ink-faint mt-1">
              Daily briefings inbound.
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {!onAccent && (
        <p className="type-kicker text-ink-faint mb-2">
          Daily Intel Briefing
        </p>
      )}
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
          aria-label="Email address"
          className={cn(
            'h-11 flex-1 min-w-0 rounded-full px-4 font-mono text-[16px] md:h-9 md:text-xs outline-none transition-colors',
            onAccent
              ? 'border-0 bg-white text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
              : 'border-[1.5px] border-ink bg-paper text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
          )}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'flex h-11 shrink-0 items-center gap-1 rounded-full px-4 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 md:h-9 md:px-3.5',
            onAccent
              ? 'bg-ink text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
              : 'bg-primary text-white hover:bg-[#c8290f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
          )}
        >
          <Send className="size-3" aria-hidden />
          <span className="sr-only">Subscribe</span>
        </button>
      </form>
      {status === 'error' && (
        <p className={cn('type-kicker mt-1.5', onAccent ? 'text-white' : 'text-destructive')}>
          {message}
        </p>
      )}
    </div>
  )
}
