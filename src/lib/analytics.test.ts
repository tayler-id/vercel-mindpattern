// @vitest-environment-options { "url": "https://mindpattern.ai/" }
import { track } from '@vercel/analytics'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isDevTraffic, trackEvent, trackView } from './analytics'

/**
 * The module refuses to send from localhost and the LAN, so these tests run on
 * the production origin. jsdom's default `http://localhost:3000/` made every
 * beacon a no-op and the assertions below unfalsifiable.
 */

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
    sessionStorage.clear()
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

  it('sends nothing once this browser has opted out', () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    setSendBeacon(sendBeacon)
    localStorage.setItem('mp_optout', '1')

    trackEvent('blocked')
    trackView('story', 'blocked-story')

    expect(sendBeacon).not.toHaveBeenCalled()
  })

  it('applies ?mp_optout on load, so a page that fires no events still honours it', async () => {
    // The flags are read once when the module loads, which is what makes the
    // homepage honour ?mp_optout=1 even though it tracks nothing itself.
    const sendBeacon = vi.fn().mockReturnValue(true)
    setSendBeacon(sendBeacon)
    history.replaceState(null, '', '/?mp_optout=1')

    vi.resetModules()
    const optedOut = await import('./analytics')
    expect(localStorage.getItem('mp_optout')).toBe('1')
    optedOut.trackEvent('blocked')
    expect(sendBeacon).not.toHaveBeenCalled()

    history.replaceState(null, '', '/?mp_optout=0')
    vi.resetModules()
    const optedIn = await import('./analytics')
    expect(localStorage.getItem('mp_optout')).toBeNull()
    optedIn.trackEvent('allowed')
    expect(sendBeacon).toHaveBeenCalled()
  })

  it('only sends story view beacons for story views', () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    setSendBeacon(sendBeacon)

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

  it('never sends from localhost or the LAN', () => {
    // Dev traffic must not reach the event store, which is why this file runs
    // on the production origin in the first place. jsdom will not let a test
    // rewrite location.hostname, so drive the check itself.
    expect(isDevTraffic('localhost')).toBe(true)
    expect(isDevTraffic('127.0.0.1')).toBe(true)
    expect(isDevTraffic('192.168.1.24')).toBe(true)
    expect(isDevTraffic('10.0.0.4')).toBe(true)
    expect(isDevTraffic('studio.local')).toBe(true)
    expect(isDevTraffic('mindpattern.ai')).toBe(false)
    expect(isDevTraffic('mindpattern.fly.dev')).toBe(false)
  })
})
