'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { trackEvent, type AnalyticsProps } from '@/lib/analytics'

interface TrackedLinkProps {
  href: string
  event: string
  eventProps?: AnalyticsProps
  className?: string
  external?: boolean
  children: ReactNode
}

/** Link that fires a privacy-safe analytics event on click. */
export function TrackedLink({
  href,
  event,
  eventProps,
  className,
  external,
  children,
}: TrackedLinkProps) {
  const onClick = () => trackEvent(event, eventProps)
  if (external) {
    return (
      // `noopener` alone, deliberately. It is what closes the window.opener
      // hole, and every current browser implies it for target="_blank" anyway.
      // `noreferrer` also strips the Referer header, so the sites a story links
      // out to never saw mindpattern.ai in their referral logs. Link equity
      // flows from the href either way; this is the half that gets noticed.
      <a href={href} target="_blank" rel="noopener" className={className} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}
