'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

const THRESHOLDS = [25, 50, 75, 100] as const

/** Fires scroll_depth events (25/50/75/100) once each per page view. */
export function ScrollDepthTracker({ kind, id }: { kind: string; id: string }) {
  const fired = useRef<Set<number>>(new Set())

  useEffect(() => {
    fired.current = new Set()
    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      const depth = scrollable <= 0 ? 100 : Math.round((window.scrollY / scrollable) * 100)
      for (const threshold of THRESHOLDS) {
        if (depth >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold)
          trackEvent('scroll_depth', { kind, id, depth: threshold })
        }
      }
      if (fired.current.size === THRESHOLDS.length) {
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [kind, id])

  return null
}
