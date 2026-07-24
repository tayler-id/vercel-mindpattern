'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

/** Records one first-party page view for the initial route and each path change. */
export function PageViewTracker() {
  const pathname = usePathname()
  const lastPathname = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || lastPathname.current === pathname) return
    lastPathname.current = pathname
    trackPageView(pathname)
  }, [pathname])

  return null
}
