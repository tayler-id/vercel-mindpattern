'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { trackEvent } from '@/lib/analytics'

// Sample so vitals don't dominate the event quota. One coin flip per
// page load keeps a load's metrics together.
const SAMPLED = Math.random() < 0.2

/** Reports Core Web Vitals as sampled, privacy-safe analytics events. */
export function WebVitalsTracker() {
  useReportWebVitals((metric) => {
    if (!SAMPLED) return
    trackEvent('web_vital', {
      name: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      rating: metric.rating ?? 'unknown',
      path: window.location.pathname.split('/').slice(0, 2).join('/') || '/',
    })
  })
  return null
}
