import { beforeEach, describe, expect, it, vi } from 'vitest'

const socialImageResponse = vi.hoisted(() => vi.fn(() => 'card'))

const api = vi.hoisted(() => ({
  getTrending: vi.fn(),
  getPopular: vi.fn(),
  getStories: vi.fn(),
}))

vi.mock('@/lib/social-image', () => ({ socialImageResponse }))
vi.mock('@/lib/api', () => api)

const story = (title: string) => ({
  items: [{ title, issue_date: '2026-08-13' }],
})

async function card(view: string) {
  const route = await import('./[view]/route')
  await route.GET(new Request(`https://mindpattern.ai/og/view/${view}`), {
    params: Promise.resolve({ view }),
  })
  return socialImageResponse.mock.calls.at(-1)?.[0] as {
    title: string
    kicker: string
    resolved: boolean
  }
}

describe('wire view social card', () => {
  beforeEach(() => {
    socialImageResponse.mockClear()
    api.getTrending.mockReset()
    api.getPopular.mockReset()
    api.getStories.mockReset()
  })

  it('leads with the top trending story, not the ranking method', async () => {
    api.getTrending.mockResolvedValue(story('Two poisoned LiteLLM releases drained credentials'))

    expect(await card('trending')).toEqual({
      title: 'Two poisoned LiteLLM releases drained credentials',
      kicker: 'Trending now · Aug 13',
      resolved: true,
    })
    expect(api.getTrending).toHaveBeenCalledWith({ limit: 1 })
  })

  it('reads each view from its own ranking', async () => {
    api.getPopular.mockResolvedValue(story('The all-time favorite'))
    api.getStories.mockResolvedValue(story('The newest signal'))

    expect((await card('most-read')).title).toBe('The all-time favorite')
    expect((await card('latest')).title).toBe('The newest signal')
    expect(api.getPopular).toHaveBeenCalledWith({ limit: 1 })
    expect(api.getStories).toHaveBeenCalledWith({ limit: 1 })
  })

  it('falls back to the view share line when the backend is unreachable', async () => {
    // The backend times out at 10s and the card still has to render — that
    // path is what put a blank generic card on every finding share.
    api.getTrending.mockRejectedValue(new Error('timeout'))

    // The share line is copy written for this view, not the generic site
    // title, so the card still counts as resolved and caches for a day.
    expect(await card('trending')).toEqual({
      title: 'Trending now on MindPattern',
      kicker: 'The Wire · Live',
      resolved: true,
    })
  })

  it('falls back when the backend answers with no stories', async () => {
    api.getTrending.mockResolvedValue({ items: [] })

    expect((await card('trending')).title).toBe('Trending now on MindPattern')
  })

  it('shares the trending lead for the topics view, which only regroups', async () => {
    api.getTrending.mockResolvedValue(story('The lead story'))

    expect((await card('topics')).title).toBe('The lead story')
  })

  it('resolves an unknown view to trending rather than rendering nothing', async () => {
    api.getTrending.mockResolvedValue(story('The lead story'))

    expect((await card('bogus.png')).title).toBe('The lead story')
  })
})
