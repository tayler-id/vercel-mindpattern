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
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
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
