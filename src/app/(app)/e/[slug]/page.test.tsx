import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BackendError } from '@/lib/api'

const api = vi.hoisted(() => ({ getEntity: vi.fn(), getNarrativeArc: vi.fn() }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  ...api,
}))

const connection = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('next/server', () => ({ connection }))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

vi.mock('@/components/json-ld', () => ({
  JsonLd: () => <script data-testid="json-ld" />,
}))

import EntityPage, { generateMetadata, generateStaticParams } from './page'
// The arc route shipped its error handling in the same change and needs the
// same api and next/server mocks, so its cases live here rather than in a
// second file that would duplicate all of the setup above.
import ArcPage, {
  generateMetadata as arcMetadata,
  generateStaticParams as arcStaticParams,
} from '../../arc/[id]/page'

// setup.ts calls vi.restoreAllMocks() in afterEach, which restores spies but
// does not clear a vi.fn()'s call history. Without this, connection() call
// counts accumulate across the whole file and an assertion in a later case
// passes on history left by an earlier one.
beforeEach(() => {
  connection.mockClear()
  api.getEntity.mockReset()
  api.getNarrativeArc.mockReset()
})

/** What a wedged Fly box produces: an abort past the 10s budget. */
const timeout = () => BackendError.timeout('/api/entities/openai')

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

describe('entity page metadata', () => {
  it('returns a complete card when the backend times out', async () => {
    // /api/entities/{slug} does graph LIKE scans over 15.6k findings and can
    // parse every report file in one request. It was the slowest endpoint on
    // the box and this page had no try/catch, so every /e/ click 500'd with
    // no og tags at all.
    api.getEntity.mockRejectedValueOnce(timeout())

    const meta = await generateMetadata(params('openai'))

    expect(meta.title).toBeTruthy()
    expect(meta.openGraph?.images).toBeTruthy()
    expect(meta.twitter?.card).toBe('summary_large_image')
    expect(meta.robots).toMatchObject({ index: false })
  })

  it('marks a degraded head dynamic so it is never cached', async () => {
    // The body already does this. Before the head did too, a timed-out head
    // paired with a body that happened to succeed wrote a fully correct entity
    // page into the ISR cache carrying robots {index:false} and the
    // slug-derived title, and served it to every reader and crawler for the
    // next 3600s. Google reads a persistent 200 + noindex as "remove this
    // URL", so that is worse than the 500 it replaced.
    api.getEntity.mockRejectedValueOnce(timeout())

    await generateMetadata(params('openai'))

    expect(connection).toHaveBeenCalled()
  })

  it('does not mark the happy path dynamic', async () => {
    api.getEntity.mockResolvedValueOnce({ slug: 'openai', name: 'OpenAI' })

    await generateMetadata(params('openai'))

    expect(connection).not.toHaveBeenCalled()
  })

  it('answers a malformed slug as not found, not a crash', async () => {
    // Next hands params already decoded, so /e/%25 arrives as '%'. Bare
    // decodeURIComponent('%') throws URIError, which was a 500 on a route
    // whose whole job here is to answer 404.
    const meta = await generateMetadata(params('%'))

    expect(meta.title).toBe('Entity not found')
    expect(api.getEntity).not.toHaveBeenCalled()
  })

  it('carries a share card on the happy path', async () => {
    api.getEntity.mockResolvedValueOnce({ slug: 'openai', name: 'OpenAI' })

    const meta = await generateMetadata(params('openai'))

    expect(meta.title).toContain('OpenAI')
    expect(meta.openGraph?.images).toBeTruthy()
    expect(meta.twitter?.card).toBe('summary_large_image')
  })

  it('still reports a genuine 404 as not found', async () => {
    api.getEntity.mockResolvedValueOnce(null)
    const meta = await generateMetadata(params('nope'))
    expect(meta.title).toBe('Entity not found')
  })
})

describe('entity page body', () => {
  it('degrades instead of throwing when the backend is unreachable', async () => {
    api.getEntity.mockRejectedValueOnce(timeout())

    render(await EntityPage(params('openai')))

    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(connection).toHaveBeenCalled()
  })

  it('a missing entity is still a real 404', async () => {
    api.getEntity.mockResolvedValueOnce(null)
    await expect(EntityPage(params('nope'))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('a malformed slug is a 404, not a URIError', async () => {
    await expect(EntityPage(params('%'))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('an unexpected error is not swallowed', async () => {
    api.getEntity.mockRejectedValueOnce(new RangeError('bug'))
    await expect(EntityPage(params('openai'))).rejects.toThrow('bug')
  })
})

describe('entity page caching', () => {
  it('opts into on-demand ISR', () => {
    // Without generateStaticParams, Next 16 drops the revalidate export and
    // re-renders every entity click against Fly.
    expect(generateStaticParams()).toEqual([])
  })

  it('points the degraded card at the entity, not the error page', async () => {
    api.getEntity.mockRejectedValueOnce(timeout())

    const meta = await generateMetadata(params('OpenAI'))

    expect(meta.alternates?.canonical).toBe('/e/openai')
    expect(meta.openGraph?.url).toBe('/e/openai')
    expect(meta.openGraph?.type).toBe('website')
    expect(meta.openGraph?.images).toMatchObject([{ width: 1200, height: 630 }])
    // A stub titled from the slug must stay out of the index, but its links
    // out are real pages and still worth following.
    expect(meta.robots).toMatchObject({ index: false, follow: true })
  })

  it('does not swallow an unexpected error in the head', async () => {
    api.getEntity.mockRejectedValueOnce(new RangeError('bug'))
    await expect(generateMetadata(params('openai'))).rejects.toThrow('bug')
  })
})

const arcParams = (id: string, date?: string) => ({
  params: Promise.resolve({ id }),
  searchParams: Promise.resolve(date ? { date } : {}),
})

describe('arc page', () => {
  it('opts into on-demand ISR', () => {
    expect(arcStaticParams()).toEqual([])
  })

  it('returns a complete card when the backend times out', async () => {
    api.getNarrativeArc.mockRejectedValueOnce(timeout())

    const meta = await arcMetadata(arcParams('agent-pricing', '2026-08-23'))

    expect(meta.title).toBeTruthy()
    expect(meta.openGraph?.images).toMatchObject([{ width: 1200, height: 630 }])
    expect(meta.twitter?.card).toBe('summary_large_image')
    expect(meta.robots).toMatchObject({ index: false, follow: true })
  })

  it('carries a share card on the happy path', async () => {
    api.getNarrativeArc.mockResolvedValueOnce({ id: 'agent-pricing', title: 'Agent pricing', summary: 'A summary' })

    const meta = await arcMetadata(arcParams('agent-pricing', '2026-08-23'))

    expect(meta.title).toBe('Agent pricing narrative arc')
    expect(meta.openGraph?.images).toBeTruthy()
    expect(meta.twitter?.card).toBe('summary_large_image')
  })

  it('degrades instead of throwing when the backend is unreachable', async () => {
    api.getNarrativeArc.mockRejectedValueOnce(timeout())

    render(await ArcPage(arcParams('agent-pricing', '2026-08-23')))

    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Briefing for 2026-08-23' })).toBeTruthy()
    expect(connection).toHaveBeenCalled()
  })

  it('marks a degraded head dynamic so it is never cached', async () => {
    api.getNarrativeArc.mockRejectedValueOnce(timeout())

    await arcMetadata(arcParams('agent-pricing', '2026-08-23'))

    expect(connection).toHaveBeenCalled()
  })

  it('answers a malformed id as not found, not a crash', async () => {
    const meta = await arcMetadata(arcParams('%', '2026-08-23'))

    expect(meta.title).toBe('Arc not found')
    await expect(ArcPage(arcParams('%', '2026-08-23'))).rejects.toThrow('NEXT_NOT_FOUND')
    expect(api.getNarrativeArc).not.toHaveBeenCalled()
  })

  it('a missing arc is still a real 404', async () => {
    api.getNarrativeArc.mockResolvedValueOnce(null)
    await expect(ArcPage(arcParams('agent-pricing', '2026-08-23'))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('an unexpected error is not swallowed', async () => {
    api.getNarrativeArc.mockRejectedValueOnce(new RangeError('bug'))
    await expect(ArcPage(arcParams('agent-pricing', '2026-08-23'))).rejects.toThrow('bug')
  })
})
