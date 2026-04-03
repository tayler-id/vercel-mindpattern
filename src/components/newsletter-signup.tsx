'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

export function NewsletterSignup({ className }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
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
        <div className="border border-secondary/40 bg-secondary/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
            {message}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Daily briefings inbound.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
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
          className="h-7 flex-1 min-w-0 border border-input bg-transparent px-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-7 px-2 border border-primary bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="size-3" />
        </button>
      </form>
      {status === 'error' && (
        <p className="text-[10px] text-destructive mt-1 uppercase tracking-wider">
          {message}
        </p>
      )}
    </div>
  )
}
