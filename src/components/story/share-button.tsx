'use client'

import { useState, useSyncExternalStore } from 'react'
import { Share, Copy, Check } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const noopSubscribe = () => () => {}
const clientHasShare = () => typeof navigator.share === 'function'
const serverHasShare = () => false

const PILL =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-2 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-all duration-(--dur-fast) ease-(--ease-swift) hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-95'

/**
 * Share row (system §2.4 pills): native share sheet where the platform has
 * one, plus explicit X / LinkedIn intents and copy-link everywhere — social
 * sharing never depends on navigator.share support.
 */
export function ShareButton({ title, className = '' }: { title: string; className?: string }) {
  const native = useSyncExternalStore(noopSubscribe, clientHasShare, serverHasShare)
  const [copied, setCopied] = useState(false)

  const url = () => window.location.href
  const shareNative = async () => {
    try {
      await navigator.share({ title, url: url() })
      trackEvent('share', { id: title.slice(0, 60) })
    } catch {
      /* sheet dismissed */
    }
  }
  const open = (intent: string, network: string) => {
    window.open(intent, '_blank', 'noopener,noreferrer,width=640,height=560')
    trackEvent('share', { id: `${network}:${title.slice(0, 50)}` })
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url())
      setCopied(true)
      trackEvent('share', { id: `copy:${title.slice(0, 50)}` })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <span className={`flex flex-wrap items-center gap-2 ${className}`}>
      {native && (
        <button type="button" onClick={shareNative} className={`${PILL} bg-ink text-white hover:bg-primary`}>
          <Share aria-hidden className="h-3.5 w-3.5" />
          Share
        </button>
      )}
      <button
        type="button"
        aria-label="Share on X"
        onClick={() =>
          open(`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`, 'x')
        }
        className={`${PILL} bg-panel text-ink hover:bg-ink hover:text-white`}
      >
        X
      </button>
      <button
        type="button"
        aria-label="Share on LinkedIn"
        onClick={() =>
          open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`, 'linkedin')
        }
        className={`${PILL} bg-panel text-ink hover:bg-ink hover:text-white`}
      >
        LinkedIn
      </button>
      <button type="button" onClick={copy} className={`${PILL} bg-panel text-ink hover:bg-ink hover:text-white`}>
        {copied ? <Check aria-hidden className="h-3.5 w-3.5 text-ok" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </span>
  )
}
