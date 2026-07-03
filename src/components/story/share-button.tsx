'use client'

import { useSyncExternalStore } from 'react'
import { Share } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const noopSubscribe = () => () => {}
const clientHasShare = () => typeof navigator.share === 'function'
const serverHasShare = () => false

/**
 * Web Share pill (Addendum 8). Capability read via useSyncExternalStore so
 * the server render and first client render agree (no hydration mismatch,
 * no setState-in-effect); renders nothing where navigator.share is missing.
 */
export function ShareButton({ title, className = '' }: { title: string; className?: string }) {
  const supported = useSyncExternalStore(noopSubscribe, clientHasShare, serverHasShare)

  if (!supported) return null

  const share = async () => {
    try {
      await navigator.share({ title, url: window.location.href })
      trackEvent('share', { id: title.slice(0, 60) })
    } catch {
      /* user dismissed the sheet — fine */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 ${className}`}
    >
      <Share aria-hidden className="h-3.5 w-3.5" />
      Share
    </button>
  )
}
