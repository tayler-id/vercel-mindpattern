// @vitest-environment-options { "url": "https://mindpattern.ai/" }
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 2026-08-26: the site reported 757 unique readers on a day with 14,278 bot
 * hits, at 1.02 page views per reader and fewer story views than readers. Both
 * ratios are the signature of an identity minted per page load rather than per
 * visitor.
 *
 * anonId() read localStorage, then sessionStorage, then fell back to a
 * module-level variable. A page navigation reloads the module, so anything that
 * refuses both storages got a brand new id on every page: one crawler over
 * forty pages counted as forty new readers.
 *
 * A first-party cookie survives a navigation on its own permission, so it
 * catches the case both storages miss. When even that fails the event is
 * marked non-durable, so the dashboard can report a number it can stand behind
 * instead of counting the same visitor forty times.
 */

const ID_RE = /^[a-z0-9]{8,24}$/

function freshModule() {
  vi.resetModules()
  return import('./analytics')
}

/** A browser that refuses localStorage and sessionStorage, as a hardened
 *  privacy profile or a headless crawler does. */
function blockStorage() {
  const throwing = {
    getItem: () => {
      throw new Error('denied')
    },
    setItem: () => {
      throw new Error('denied')
    },
    removeItem: () => {},
  }
  vi.stubGlobal('localStorage', throwing)
  vi.stubGlobal('sessionStorage', throwing)
}

describe('reader identity survives a page load', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    document.cookie = 'mp_anon=; Max-Age=0; path=/'
  })

  it('reuses the same id across a navigation when storage is blocked', async () => {
    blockStorage()

    const first = (await freshModule()).__anonIdForTests()
    // A navigation: the module is re-evaluated, so any in-memory id is gone.
    const second = (await freshModule()).__anonIdForTests()

    expect(first).toMatch(ID_RE)
    expect(second).toBe(first)
  })

  it('writes the id to a first-party cookie', async () => {
    blockStorage()
    const id = (await freshModule()).__anonIdForTests()
    expect(document.cookie).toContain(`mp_anon=${id}`)
  })

  it('still prefers localStorage when it works', async () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    })

    const id = (await freshModule()).__anonIdForTests()
    expect(store.get('mp_anon')).toBe(id)
  })

  it('rejects a tampered cookie rather than trusting it', async () => {
    blockStorage()
    document.cookie = 'mp_anon=../../etc/passwd; path=/'
    const id = (await freshModule()).__anonIdForTests()
    expect(id).toMatch(ID_RE)
    expect(id).not.toContain('/')
  })

  it('marks an event non-durable when nothing can hold the id', async () => {
    blockStorage()
    // Cookies off too: writes silently do nothing. Restored afterwards, or it
    // leaks into every test that follows.
    const original = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
    Object.defineProperty(document, 'cookie', {
      get: () => '',
      set: () => {},
      configurable: true,
    })
    try {
      const mod = await freshModule()
      expect(mod.__anonDurableForTests()).toBe(false)
    } finally {
      delete (document as unknown as Record<string, unknown>).cookie
      if (original) Object.defineProperty(Document.prototype, 'cookie', original)
    }
  })

  it('reports durable when the id round-trips', async () => {
    blockStorage()
    const mod = await freshModule()
    mod.__anonIdForTests()
    expect(mod.__anonDurableForTests()).toBe(true)
  })
})

/**
 * The flag only matters if it leaves the browser. The backend stores a
 * `durable` column per event (memory/events_db.py in mindpattern-v3), and the
 * dashboard splits readers it can count from churn it cannot. These tests pin
 * the posted body, because a flag computed but never sent is the bug the
 * 2026-08-26 numbers already shipped once.
 */
describe('the event payload carries the durable flag', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    sessionStorage.clear()
    document.cookie = 'mp_anon=; Max-Age=0; path=/'
    vi.stubGlobal('fetch', vi.fn())
  })

  function captureBeacon() {
    const sendBeacon = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    })
    return sendBeacon
  }

  async function postedBody(sendBeacon: ReturnType<typeof vi.fn>) {
    expect(sendBeacon).toHaveBeenCalledWith('/api/proxy/event', expect.any(Blob))
    return JSON.parse(await sendBeacon.mock.calls[0][1].text())
  }

  it('sends durable: 1 when the id persists on first visit', async () => {
    const sendBeacon = captureBeacon()
    const mod = await freshModule()
    mod.trackEvent('source_click', { domain: 'example.com' })
    const body = await postedBody(sendBeacon)
    expect(body.durable).toBe(1)
    expect(body.anon_id).toMatch(ID_RE)
  })

  it('sends durable: 1 for a returning reader whose id came from localStorage', async () => {
    localStorage.setItem('mp_anon', 'returningreader12345')
    const sendBeacon = captureBeacon()
    const mod = await freshModule()
    mod.trackPageView('/s/some-story')
    const body = await postedBody(sendBeacon)
    expect(body.anon_id).toBe('returningreader12345')
    expect(body.durable).toBe(1)
  })

  it('sends durable: 0 when nothing on the client can hold the id', async () => {
    blockStorage()
    const original = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
    Object.defineProperty(document, 'cookie', {
      get: () => '',
      set: () => {},
      configurable: true,
    })
    try {
      const sendBeacon = captureBeacon()
      const mod = await freshModule()
      mod.trackPageView('/s/some-story')
      const body = await postedBody(sendBeacon)
      expect(body.durable).toBe(0)
      expect(body.anon_id).toMatch(ID_RE)
    } finally {
      delete (document as unknown as Record<string, unknown>).cookie
      if (original) Object.defineProperty(Document.prototype, 'cookie', original)
    }
  })
})
