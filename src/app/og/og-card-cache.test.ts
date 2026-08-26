import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BackendError } from '@/lib/api'

const socialImageResponse = vi.hoisted(() => vi.fn(() => 'card'))

const api = vi.hoisted(() => ({
  getStory: vi.fn(),
  getFinding: vi.fn(),
  getReport: vi.fn(),
}))

// Only the loaders are stubbed. backendOutcome, the typed errors, and the
// status constants stay real, because the split between "missing" and
// "unavailable" is what these tests are about.
vi.mock('@/lib/social-image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/social-image')>()),
  socialImageResponse,
}))
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  ...api,
}))

const timeout = () => BackendError.timeout('/api/detail')
const notFound = () => new BackendError(404, '/api/detail')

type CardArgs = {
  title?: string | null
  kicker?: string | null
  meta?: (string | null | undefined)[]
  accent?: string | null
  accentText?: string | null
  resolved?: boolean
  status?: number
}

const lastCard = () => socialImageResponse.mock.calls.at(-1)?.[0] as unknown as CardArgs

async function storyCard(slug: string) {
  const route = await import('./story/[slug]/route')
  await route.GET(new Request(`https://mindpattern.ai/og/story/${slug}`), {
    params: Promise.resolve({ slug }),
  })
  return lastCard()
}

async function findingCard(id: string) {
  const route = await import('./finding/[id]/route')
  await route.GET(new Request(`https://mindpattern.ai/og/finding/${id}`), {
    params: Promise.resolve({ id }),
  })
  return lastCard()
}

async function briefingCard(date: string) {
  const route = await import('./briefing/[date]/route')
  await route.GET(new Request(`https://mindpattern.ai/og/briefing/${date}`), {
    params: Promise.resolve({ date }),
  })
  return lastCard()
}

beforeEach(() => {
  socialImageResponse.mockClear()
  api.getStory.mockReset()
  api.getFinding.mockReset()
  api.getReport.mockReset()
})

describe('story social card', () => {
  it('draws the story and marks it cacheable', async () => {
    api.getStory.mockResolvedValue({
      title: 'Two poisoned LiteLLM releases drained credentials',
      section_id: 'models',
      issue_date: '2026-08-13',
      source_refs: [
        { url: 'https://github.com/x', domain: 'github.com', title: 'x' },
        { url: 'https://news.ycombinator.com/y', domain: 'news.ycombinator.com', title: 'y' },
      ],
    })

    expect(await storyCard('poisoned-litellm')).toEqual({
      title: 'Two poisoned LiteLLM releases drained credentials',
      kicker: 'Models',
      meta: ['Aug 13', 'github.com', '2 sources'],
      accent: '#e63b12',
      accentText: '#b32d0e',
      resolved: true,
    })
    expect(api.getStory).toHaveBeenCalledWith('poisoned-litellm')
  })

  it('names one source by its domain rather than counting it', async () => {
    api.getStory.mockResolvedValue({
      title: 'One source only',
      issue_date: '2026-08-13',
      source_refs: [{ url: 'https://arxiv.org/abs/1', domain: 'arxiv.org', title: 'a' }],
    })

    expect((await storyCard('one-source')).meta).toEqual(['Aug 13', 'arxiv.org', null])
  })

  it('answers a timeout with a retryable status, not a 200 generic card', async () => {
    // The measured incident: /api/stories exceeded the 10s abort, the card fell
    // back to the site title under a 200, and every platform that unfurled the
    // link copied that image into a cache we do not control.
    api.getStory.mockRejectedValue(timeout())

    expect(await storyCard('poisoned-litellm')).toEqual({ resolved: false, status: 503 })
  })

  it('answers a slug the backend does not have with a cacheable 404', async () => {
    api.getStory.mockResolvedValue(null)

    expect(await storyCard('zzz-not-a-real-slug-12345')).toMatchObject({
      resolved: false,
      status: 404,
    })
  })

  it('never fetches for a slug that could not be one', async () => {
    expect(await storyCard('../../etc/passwd')).toMatchObject({ resolved: false, status: 404 })
    expect(api.getStory).not.toHaveBeenCalled()
  })

  it('strips a .png suffix before asking the backend', async () => {
    api.getStory.mockResolvedValue(null)

    await storyCard('poisoned-litellm.png')
    expect(api.getStory).toHaveBeenCalledWith('poisoned-litellm')
  })
})

describe('finding social card', () => {
  it('draws the finding and marks it cacheable', async () => {
    api.getFinding.mockResolvedValue({
      title: 'A finding worth sharing',
      agent: 'arxiv-researcher',
      run_date: '2026-08-13',
      source_url: 'https://www.arxiv.org/abs/2601.00001',
      source_refs: [{ url: 'a', domain: 'a', title: 'a' }, { url: 'b', domain: 'b', title: 'b' }],
    })

    expect(await findingCard('4210')).toEqual({
      title: 'A finding worth sharing',
      kicker: 'Research',
      meta: ['Aug 13', 'arxiv.org', '2 sources'],
      accent: '#cf2d7b',
      accentText: '#ad2465',
      resolved: true,
    })
    expect(api.getFinding).toHaveBeenCalledWith(4210)
  })

  it('answers a degraded backend with a retryable status', async () => {
    api.getFinding.mockRejectedValue(timeout())

    expect(await findingCard('4210')).toMatchObject({ resolved: false, status: 503 })
  })

  it('answers an id that is not a finding id with a cacheable 404', async () => {
    expect(await findingCard('not-an-id')).toMatchObject({ resolved: false, status: 404 })
    expect(api.getFinding).not.toHaveBeenCalled()
  })

  it('leaves the facts line empty when the finding carries no source', async () => {
    api.getFinding.mockResolvedValue({ title: 'Bare finding', agent: 'orchestrator' })

    expect(await findingCard('7')).toMatchObject({
      kicker: 'Desk',
      meta: [null, null, null],
      accent: undefined,
      resolved: true,
    })
  })
})

describe('briefing social card', () => {
  it('draws the briefing with its section count and marks it cacheable', async () => {
    api.getReport.mockResolvedValue({
      title: 'Ramsay Research Agent — August 13, 2026',
      content: '# Briefing\n\n## Models\ntext\n\n## Agents\ntext\n\n### Sub\n\n## Tools\n',
    })

    expect(await briefingCard('2026-08-13')).toEqual({
      title: 'Ramsay Research Agent — August 13, 2026',
      kicker: 'Daily briefing',
      meta: ['Aug 13', '3 sections'],
      resolved: true,
    })
    expect(api.getReport).toHaveBeenCalledWith('2026-08-13')
  })

  it('answers a date with no briefing with a cacheable 404', async () => {
    // The backend answers a missing date with a 200 `null` body, so a date the
    // pipeline has not reached yet must not cache its generic card all day.
    api.getReport.mockResolvedValue(null)

    expect(await briefingCard('2026-08-24')).toEqual({
      kicker: 'Daily briefing',
      meta: ['Aug 24'],
      resolved: false,
      status: 404,
    })
  })

  it('answers a real 404 on the date endpoint the same way', async () => {
    api.getReport.mockRejectedValue(notFound())

    expect(await briefingCard('2026-08-24')).toMatchObject({ resolved: false, status: 404 })
  })

  it('answers a degraded backend with a retryable status', async () => {
    api.getReport.mockRejectedValue(timeout())

    expect(await briefingCard('2026-08-13')).toMatchObject({ resolved: false, status: 503 })
  })

  it('draws nothing from an unvalidated date segment and never fetches it', async () => {
    // shortDate returns its input unchanged when it will not parse, so an
    // arbitrary segment was drawn straight onto a MindPattern-branded card.
    expect(await briefingCard('Buy%20cheap%20pills')).toEqual({
      kicker: 'Daily briefing',
      meta: [null],
      resolved: false,
      status: 404,
    })
    expect(api.getReport).not.toHaveBeenCalled()
  })
})

describe('every card route', () => {
  it('puts the real Cache-Control on the response it returns', async () => {
    // End to end through the real socialImageResponse, so a route that stopped
    // passing `resolved` would fail here rather than pass a mock assertion.
    const { CONTENT_CACHE_CONTROL, FALLBACK_CACHE_CONTROL } = await import('@/lib/social-image')
    socialImageResponse.mockImplementationOnce(
      (await vi.importActual<typeof import('@/lib/social-image')>('@/lib/social-image'))
        .socialImageResponse as never,
    )
    api.getStory.mockResolvedValue({ title: 'A real story', source_refs: [] })
    const route = await import('./story/[slug]/route')

    const ok = (await route.GET(new Request('https://mindpattern.ai/og/story/one'), {
      params: Promise.resolve({ slug: 'one' }),
    })) as Response
    expect(ok.headers.get('Cache-Control')).toBe(CONTENT_CACHE_CONTROL)
    expect(ok.status).toBe(200)

    socialImageResponse.mockImplementationOnce(
      (await vi.importActual<typeof import('@/lib/social-image')>('@/lib/social-image'))
        .socialImageResponse as never,
    )
    api.getStory.mockRejectedValue(timeout())
    const down = (await route.GET(new Request('https://mindpattern.ai/og/story/one'), {
      params: Promise.resolve({ slug: 'one' }),
    })) as Response
    expect(down.headers.get('Cache-Control')).toBe(FALLBACK_CACHE_CONTROL)
    expect(down.status).toBe(503)
  })
})
