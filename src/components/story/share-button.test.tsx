import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ShareButton } from './share-button'

const analytics = vi.hoisted(() => ({
  trackEvent: vi.fn(),
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: analytics.trackEvent,
}))

function setNavigatorShare(value: unknown) {
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value,
  })
}

function setClipboardWrite(writeText: unknown) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
}

describe('ShareButton', () => {
  beforeEach(() => {
    analytics.trackEvent.mockReset()
    setNavigatorShare(undefined)
    setClipboardWrite(vi.fn().mockResolvedValue(undefined))
  })

  it('offers explicit social and copy actions when native share is unavailable', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<ShareButton title="Story One" />)

    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Share on X' }))
    fireEvent.click(screen.getByRole('button', { name: 'Share on LinkedIn' }))

    expect(open).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('https://x.com/intent/post?'),
      '_blank',
      'noopener,noreferrer,width=640,height=560',
    )
    expect(open).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('https://www.linkedin.com/sharing/share-offsite/?'),
      '_blank',
      'noopener,noreferrer,width=640,height=560',
    )
    expect(analytics.trackEvent).toHaveBeenCalledWith('share', { id: 'x:Story One' })
    expect(analytics.trackEvent).toHaveBeenCalledWith('share', { id: 'linkedin:Story One' })
  })

  it('uses native share when available and ignores dismissed sheets', async () => {
    const share = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('dismissed'))
    setNavigatorShare(share)

    render(<ShareButton title="Native Story" />)

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'Native Story',
      url: window.location.href,
    }))
    expect(analytics.trackEvent).toHaveBeenCalledWith('share', { id: 'Native Story' })

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await waitFor(() => expect(share).toHaveBeenCalledTimes(2))
  })

  it('copies the current URL, shows the copied state, and resets it', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboardWrite(writeText)

    render(<ShareButton title="Copy Story" className="custom-share" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Copy link/ }))
      await Promise.resolve()
    })
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(screen.getByRole('button', { name: /Copied/ })).toBeInTheDocument()
    expect(analytics.trackEvent).toHaveBeenCalledWith('share', { id: 'copy:Copy Story' })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByRole('button', { name: /Copy link/ })).toBeInTheDocument()
  })

  it('ignores clipboard failures', async () => {
    setClipboardWrite(vi.fn().mockRejectedValue(new Error('denied')))

    render(<ShareButton title="No Clipboard" />)

    fireEvent.click(screen.getByRole('button', { name: /Copy link/ }))
    await waitFor(() => expect(analytics.trackEvent).not.toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /Copy link/ })).toBeInTheDocument()
  })
})
