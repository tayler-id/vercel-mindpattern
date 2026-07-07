import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

type Metric = {
  name: string
  value: number
  rating?: string
}

async function loadTracker(sampleValue: number) {
  vi.resetModules()
  vi.spyOn(Math, 'random').mockReturnValue(sampleValue)

  let callback: ((metric: Metric) => void) | undefined
  const trackEvent = vi.fn()
  const useReportWebVitals = vi.fn((cb: (metric: Metric) => void) => {
    callback = cb
  })

  vi.doMock('next/web-vitals', () => ({ useReportWebVitals }))
  vi.doMock('@/lib/analytics', () => ({ trackEvent }))

  const { WebVitalsTracker } = await import('./web-vitals')
  return { WebVitalsTracker, callback: () => callback, trackEvent, useReportWebVitals }
}

describe('WebVitalsTracker', () => {
  it('registers web vital reporting but skips unsampled page loads', async () => {
    const { WebVitalsTracker, callback, trackEvent, useReportWebVitals } = await loadTracker(0.9)

    render(<WebVitalsTracker />)
    expect(useReportWebVitals).toHaveBeenCalledOnce()
    callback()?.({ name: 'LCP', value: 1200, rating: 'good' })

    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('tracks sampled metrics with normalized values and shallow paths', async () => {
    window.history.pushState({}, '', '/story/deep/path')
    const { WebVitalsTracker, callback, trackEvent } = await loadTracker(0.1)

    render(<WebVitalsTracker />)
    callback()?.({ name: 'CLS', value: 0.1234 })
    callback()?.({ name: 'FCP', value: 456.7, rating: 'needs-improvement' })

    expect(trackEvent).toHaveBeenNthCalledWith(1, 'web_vital', {
      name: 'CLS',
      value: 123,
      rating: 'unknown',
      path: '/story',
    })
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'web_vital', {
      name: 'FCP',
      value: 457,
      rating: 'needs-improvement',
      path: '/story',
    })
  })
})
