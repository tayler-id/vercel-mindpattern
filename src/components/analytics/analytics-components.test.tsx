import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollDepthTracker } from './scroll-depth'
import { TrackedLink } from './tracked-link'

const analyticsMocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  trackView: vi.fn(),
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: analyticsMocks.trackEvent,
  trackView: analyticsMocks.trackView,
}))

describe('analytics components', () => {
  beforeEach(() => {
    analyticsMocks.trackEvent.mockReset()
    analyticsMocks.trackView.mockReset()
  })

  it('tracks internal and external link clicks', () => {
    const { rerender, getByRole } = render(
      <TrackedLink href="/story" event="internal" eventProps={{ id: 'story' }}>
        Internal
      </TrackedLink>,
    )

    fireEvent.click(getByRole('link', { name: 'Internal' }))
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith('internal', { id: 'story' })

    rerender(
      <TrackedLink href="https://example.com" event="external" external>
        External
      </TrackedLink>,
    )
    expect(getByRole('link', { name: 'External' })).toHaveAttribute('target', '_blank')
    fireEvent.click(getByRole('link', { name: 'External' }))
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith('external', undefined)
  })

  it('tracks scroll depth thresholds once and removes listener after completion', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    })
    const remove = vi.spyOn(window, 'removeEventListener')
    render(<ScrollDepthTracker kind="story" id="story-one" />)

    expect(analyticsMocks.trackView).toHaveBeenCalledWith('story', 'story-one')
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 250 })
    fireEvent.scroll(window)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1000 })
    fireEvent.scroll(window)

    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith('scroll_depth', { kind: 'story', id: 'story-one', depth: 25 })
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith('scroll_depth', { kind: 'story', id: 'story-one', depth: 100 })
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it('tracks full scroll depth immediately when the page is not scrollable', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 500,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    })

    render(<ScrollDepthTracker kind="story" id="short-story" />)

    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith('scroll_depth', { kind: 'story', id: 'short-story', depth: 25 })
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith('scroll_depth', { kind: 'story', id: 'short-story', depth: 50 })
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith('scroll_depth', { kind: 'story', id: 'short-story', depth: 75 })
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith('scroll_depth', { kind: 'story', id: 'short-story', depth: 100 })
  })
})
