import { track } from '@vercel/analytics'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { trackEvent, trackView } from './analytics'

const mockedTrack = vi.mocked(track)

function setSendBeacon(sendBeacon: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    value: sendBeacon,
  })
}

describe('analytics helpers', () => {
  beforeEach(() => {
    localStorage.clear()
    history.replaceState(null, '', '/')
    vi.stubGlobal('fetch', vi.fn())
  })

  it('tracks events through Vercel Analytics and the first-party beacon', async () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    setSendBeacon(sendBeacon)

    trackEvent('source_click', { domain: 'example.com', depth: 25 })

    expect(mockedTrack).toHaveBeenCalledWith('source_click', { domain: 'example.com', depth: 25 })
    expect(sendBeacon).toHaveBeenCalledWith('/api/proxy/event', expect.any(Blob))
    const payload = JSON.parse(await sendBeacon.mock.calls[0][1].text())
    expect(payload).toMatchObject({
      type: 'source_click',
      target: 'example.com',
      path: '/',
      ref_domain: '',
      value: 25,
    })
    expect(payload.anon_id).toHaveLength(24)
  })

  it('falls back to fetch when sendBeacon is unavailable or returns false', () => {
    const sendBeacon = vi.fn().mockReturnValue(false)
    const fetchMock = vi.fn().mockResolvedValue(new Response(null))
    setSendBeacon(sendBeacon)
    vi.stubGlobal('fetch', fetchMock)

    trackEvent('open', { id: 42 })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/proxy/event',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
        keepalive: true,
      }),
    )
  })

  it('swallows rejected fetch fallbacks', async () => {
    const sendBeacon = vi.fn().mockReturnValue(false)
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    setSendBeacon(sendBeacon)
    vi.stubGlobal('fetch', fetchMock)

    expect(() => trackEvent('fetch-failed', { id: 'story-one' })).not.toThrow()
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/proxy/event',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
        keepalive: true,
      }),
    )
  })

  it('respects opt-out and opt-in query flags', () => {
    const sendBeacon = vi.fn()
    setSendBeacon(sendBeacon)

    history.replaceState(null, '', '/?mp_optout=1')
    trackEvent('blocked')
    expect(sendBeacon).not.toHaveBeenCalled()
    expect(localStorage.getItem('mp_optout')).toBe('1')

    history.replaceState(null, '', '/?mp_optout=0')
    trackEvent('allowed')
    expect(sendBeacon).toHaveBeenCalled()
    expect(localStorage.getItem('mp_optout')).toBeNull()
  })

  it('only sends story view beacons for story views', () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    setSendBeacon(sendBeacon)

    history.replaceState(null, '', '/?mp_optout=1')
    trackView('story', 'blocked-story')
    expect(sendBeacon).not.toHaveBeenCalled()

    history.replaceState(null, '', '/?mp_optout=0')
    trackView('source', 'example.com')
    expect(sendBeacon).not.toHaveBeenCalled()

    trackView('story', 'story-one')
    expect(sendBeacon).toHaveBeenCalledWith('/api/proxy/event', expect.any(Blob))
  })

  it('fails silently when analytics calls throw', () => {
    const sendBeacon = vi.fn(() => {
      throw new Error('blocked')
    })
    setSendBeacon(sendBeacon)
    mockedTrack.mockImplementationOnce(() => {
      throw new Error('blocked')
    })

    expect(() => trackEvent('throwing')).not.toThrow()
  })

  it('continues when browser storage is unavailable', () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    setSendBeacon(sendBeacon)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })

    expect(() => trackEvent('storage-blocked')).not.toThrow()
    expect(sendBeacon).toHaveBeenCalled()
  })
})
