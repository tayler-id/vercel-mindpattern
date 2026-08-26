import type { Metadata } from 'next'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BackendError } from '@/lib/api'

/**
 * A slow Fly backend used to take the social card down with it: the fetch in
 * `generateMetadata` threw, the route answered 500, and the page went out with
 * no og: or twitter: tags at all. Two of the three newest stories did that on
 * 2026-08-23. The briefing page had a second failure mode, returning bare
 * "Briefing not found" metadata for a date that exists, which inherits the
 * root card and unfurls the newsletter link as the generic site link.
 *
 * These tests hold every route to the same contract: never reject, always emit
 * a complete card, and only call a date genuinely absent when the archive list
 * came back and said so.
 */

const api = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  getAudioBriefing: vi.fn(),
  getFeed: vi.fn(),
  getFinding: vi.fn(),
  getFindings: vi.fn(),
  getPopular: vi.fn(),
  getRelated: vi.fn(),
  getReport: vi.fn(),
  getReports: vi.fn(),
  lookupArchive: vi.fn(),
  getStats: vi.fn(),
  getStories: vi.fn(),
  getStructuredIssue: vi.fn(),
  getTrending: vi.fn(),
}))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  ...api,
}))

// Each degraded render calls connection() so it is never written to the full
// route cache. There is no work store outside a request, so stub and assert it.
const connection = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('next/server', () => ({ connection }))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  usePathname: () => '/briefings',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/components/json-ld', () => ({ JsonLd: () => null }))
vi.mock('@/components/analytics/scroll-depth', () => ({ ScrollDepthTracker: () => null }))
vi.mock('@/components/briefing/audio-briefing-player', () => ({ AudioBriefingPlayer: () => null }))
vi.mock('@/components/briefing/report-markdown', () => ({ ReportMarkdown: () => null }))
vi.mock('@/components/story/rabbit-hole', () => ({ RabbitHole: () => null }))
vi.mock('@/components/story/share-button', () => ({ ShareButton: () => null }))

const report = {
  date: '2026-08-23',
  title: 'The agent stack consolidates',
  content: '# The agent stack consolidates\n\nBody.',
  filename: '2026-08-23.md',
}

const listItem = {
  date: '2026-08-23',
  title: 'The agent stack consolidates',
  filename: '2026-08-23.md',
  size: 4200,
}

const finding = {
  id: 1234,
  title: 'Finding One',
  summary: 'Finding summary',
  agent: 'news-researcher',
  run_date: '2026-08-23',
}

const timeout = () => BackendError.timeout('/api/detail')
const proxyFailure = () => new BackendError(503, '/api/detail')

// Both date routes ask lookupArchive which of the three states a date is in.
// Turning a backend into one of those states is api.test.ts's job; this file
// starts from the state and holds the page to what it does with it.
const listed = { state: 'listed' as const, list: [listItem], title: listItem.title }
const absent = { state: 'absent' as const, list: [listItem] }
const archiveDown = { state: 'unreachable' as const, list: [] }

/**
 * The card contract every route has to meet, degraded or not.
 *
 * `degraded` also decides the robots block. A card built without the record
 * behind it is reachable for any well-formed id, so it is noindex, and the
 * render that carries it is kept out of the route cache by connection().
 */
function expectCompleteCard(
  meta: Metadata,
  expected: {
    title: string
    url: string
    type: 'article' | 'website'
    image: string
    degraded?: boolean
  },
) {
  expect(meta).toMatchObject({
    title: expected.title,
    description: expect.any(String),
    openGraph: {
      type: expected.type,
      siteName: 'MindPattern',
      title: expected.title,
      description: expect.any(String),
      url: expected.url,
      images: [
        {
          url: expected.image,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: expect.stringContaining('MindPattern'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: expected.title,
      images: [expect.objectContaining({ url: expected.image })],
    },
  })
  expect(meta.robots).toEqual(
    expected.degraded ? { index: false, follow: true } : undefined,
  )
}

describe('metadata survives a slow backend', () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset())
    connection.mockClear()
  })

  describe('/f/[id]', () => {
    it('builds the full card from the finding', async () => {
      api.getFinding.mockResolvedValueOnce(finding)
      const page = await import('./(app)/f/[id]/page')

      const meta = await page.generateMetadata({ params: Promise.resolve({ id: '1234' }) })

      expectCompleteCard(meta, {
        title: 'Finding One',
        url: '/f/1234',
        type: 'article',
        image: '/og/finding/1234.png',
      })
      expect(meta.openGraph).toMatchObject({ publishedTime: '2026-08-23' })
    })

    it('still emits a card when the fetch times out', async () => {
      api.getFinding.mockRejectedValueOnce(timeout())
      const page = await import('./(app)/f/[id]/page')

      const meta = await page.generateMetadata({ params: Promise.resolve({ id: '1234' }) })

      expectCompleteCard(meta, {
        title: 'Finding 1234',
        url: '/f/1234',
        type: 'article',
        image: '/og/finding/1234.png',
        degraded: true,
      })
    })

    it('treats a proxy 5xx as the same outage as a timeout', async () => {
      api.getFinding.mockRejectedValueOnce(proxyFailure())
      const page = await import('./(app)/f/[id]/page')

      const meta = await page.generateMetadata({ params: Promise.resolve({ id: '1234' }) })

      expect(meta.title).toBe('Finding 1234')
      expect(meta.robots).toEqual({ index: false, follow: true })
    })

    it('builds a card for a finding row with no summary instead of rejecting', async () => {
      // generateMetadata rejecting is the 500-with-no-og-tags being fixed here.
      api.getFinding.mockResolvedValueOnce({ id: 1234, title: 'Finding One' })
      const page = await import('./(app)/f/[id]/page')

      const meta = await page.generateMetadata({ params: Promise.resolve({ id: '1234' }) })

      expect(meta.title).toBe('Finding One')
      expect(meta.description).toContain('MindPattern')
    })

    it('lets a defect through rather than dressing it as a slow backend', async () => {
      const bug = new TypeError('finding.title is not a function')
      api.getFinding.mockRejectedValueOnce(bug)
      const page = await import('./(app)/f/[id]/page')

      await expect(
        page.generateMetadata({ params: Promise.resolve({ id: '1234' }) }),
      ).rejects.toBe(bug)
    })

    it('marks a missing finding not found, and skips the fetch for a non-numeric id', async () => {
      api.getFinding.mockResolvedValueOnce(null)
      const page = await import('./(app)/f/[id]/page')

      await expect(
        page.generateMetadata({ params: Promise.resolve({ id: '1234' }) }),
      ).resolves.toMatchObject({ title: 'Finding not found' })

      await expect(
        page.generateMetadata({ params: Promise.resolve({ id: 'not-a-number' }) }),
      ).resolves.toMatchObject({ title: 'Finding not found' })
      expect(api.getFinding).toHaveBeenCalledTimes(1)
    })

    it('renders a retry page instead of a 500 when the finding fetch fails', async () => {
      api.getFinding.mockRejectedValueOnce(timeout())
      api.getRelated.mockRejectedValueOnce(timeout())
      const page = await import('./(app)/f/[id]/page')

      render(await page.default({ params: Promise.resolve({ id: '1234' }) }))

      expect(screen.getByRole('heading', { name: 'Finding 1234' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Retry' })).toHaveAttribute('href', '/f/1234')
      expect(screen.getByRole('link', { name: 'Briefing archive' })).toHaveAttribute('href', '/briefings')
      expect(connection).toHaveBeenCalledTimes(1)

      api.getFinding.mockResolvedValueOnce(null)
      api.getRelated.mockResolvedValueOnce({ items: [] })
      await expect(page.default({ params: Promise.resolve({ id: '1234' }) })).rejects.toThrow('NEXT_NOT_FOUND')
      expect(connection).toHaveBeenCalledTimes(1)
    })
  })

  describe('/briefings/[date]', () => {
    it('builds the full card from the report', async () => {
      api.lookupArchive.mockResolvedValue(listed)
      api.getReport.mockResolvedValueOnce(report)
      const page = await import('./(app)/briefings/[date]/page')

      const meta = await page.generateMetadata({ params: Promise.resolve({ date: '2026-08-23' }) })

      expectCompleteCard(meta, {
        title: 'The agent stack consolidates',
        url: '/briefings/2026-08-23',
        type: 'article',
        image: '/og/briefing/2026-08-23',
      })
    })

    it('keeps the archive title when the report fetch times out', async () => {
      api.lookupArchive.mockResolvedValue(listed)
      api.getReport.mockRejectedValueOnce(timeout())
      const page = await import('./(app)/briefings/[date]/page')

      const meta = await page.generateMetadata({ params: Promise.resolve({ date: '2026-08-23' }) })

      expectCompleteCard(meta, {
        title: 'The agent stack consolidates',
        url: '/briefings/2026-08-23',
        type: 'article',
        image: '/og/briefing/2026-08-23',
        degraded: true,
      })
    })

    it('names the briefing from the date when the whole backend is down', async () => {
      api.lookupArchive.mockResolvedValue(archiveDown)
      api.getReport.mockRejectedValueOnce(timeout())
      const page = await import('./(app)/briefings/[date]/page')

      const meta = await page.generateMetadata({ params: Promise.resolve({ date: '2026-08-23' }) })

      expectCompleteCard(meta, {
        title: 'Daily AI research briefing for 2026-08-23',
        url: '/briefings/2026-08-23',
        type: 'article',
        image: '/og/briefing/2026-08-23',
        degraded: true,
      })
    })

    it('keeps a real 404 on the date endpoint a not-found, not a retry page', async () => {
      api.lookupArchive.mockResolvedValue(listed)
      api.getReport.mockRejectedValue(new BackendError(404, '/api/reports/2026-08-23'))
      api.getAudioBriefing.mockResolvedValue(null)
      api.getStructuredIssue.mockResolvedValue(null)
      const page = await import('./(app)/briefings/[date]/page')

      await expect(
        page.default({ params: Promise.resolve({ date: '2026-08-23' }) }),
      ).rejects.toThrow('NEXT_NOT_FOUND')
      expect(connection).not.toHaveBeenCalled()
    })

    it('marks a date the archive rules out not found, without touching the date endpoint', async () => {
      api.lookupArchive.mockResolvedValue(absent)
      const page = await import('./(app)/briefings/[date]/page')

      await expect(
        page.generateMetadata({ params: Promise.resolve({ date: '2030-01-01' }) }),
      ).resolves.toMatchObject({ title: 'Briefing not found', robots: { index: false, follow: false } })

      // A malformed segment never reaches the backend at all.
      await expect(
        page.generateMetadata({ params: Promise.resolve({ date: 'not-a-date' }) }),
      ).resolves.toMatchObject({ title: 'Briefing not found' })
      expect(api.getReport).not.toHaveBeenCalled()
      expect(api.lookupArchive).toHaveBeenCalledTimes(1)
    })

    it('renders a retry page instead of a 500 when the report fetch fails', async () => {
      api.lookupArchive.mockResolvedValue(listed)
      api.getReport.mockRejectedValueOnce(timeout())
      api.getAudioBriefing.mockResolvedValue(null)
      api.getStructuredIssue.mockResolvedValue(null)
      const page = await import('./(app)/briefings/[date]/page')

      render(await page.default({ params: Promise.resolve({ date: '2026-08-23' }) }))
      expect(
        screen.getByText(/The briefing for 2026-08-23 could not be loaded\./),
      ).toBeInTheDocument()
      // "Retry in a minute" is only true if this render is not cached for an hour.
      expect(connection).toHaveBeenCalledTimes(1)

      api.getReport.mockResolvedValueOnce(null)
      await expect(
        page.default({ params: Promise.resolve({ date: '2026-08-23' }) }),
      ).rejects.toThrow('NEXT_NOT_FOUND')

      await expect(
        page.default({ params: Promise.resolve({ date: 'not-a-date' }) }),
      ).rejects.toThrow('NEXT_NOT_FOUND')
    })
  })

  describe('/blog/[date]', () => {
    /** Both date routes now read the archive and the report the same way. */
    function serveBackend(opts: {
      archive?: typeof listed | typeof absent | typeof archiveDown
      report?: unknown
    }) {
      api.lookupArchive.mockResolvedValue(opts.archive ?? listed)
      api.getReport.mockImplementation(() =>
        opts.report instanceof Error ? Promise.reject(opts.report) : Promise.resolve(opts.report),
      )
    }

    it('builds the full card and points it at the briefings canonical', async () => {
      serveBackend({ report })
      const page = await import('./(blog)/blog/[date]/page')

      const meta = await page.generateMetadata({ params: Promise.resolve({ date: '2026-08-23' }) })

      expectCompleteCard(meta, {
        title: 'The agent stack consolidates',
        url: '/briefings/2026-08-23',
        type: 'article',
        image: '/og/briefing/2026-08-23',
      })
      expect(meta.alternates).toMatchObject({ canonical: '/briefings/2026-08-23' })
    })

    it('still emits a card when both endpoints time out', async () => {
      serveBackend({ archive: archiveDown, report: timeout() })
      const page = await import('./(blog)/blog/[date]/page')

      const meta = await page.generateMetadata({ params: Promise.resolve({ date: '2026-08-23' }) })

      expectCompleteCard(meta, {
        title: 'Daily AI research briefing for 2026-08-23',
        url: '/briefings/2026-08-23',
        type: 'article',
        image: '/og/briefing/2026-08-23',
        degraded: true,
      })
    })

    it('marks a date the archive rules out not found', async () => {
      serveBackend({ archive: absent, report })
      const page = await import('./(blog)/blog/[date]/page')

      await expect(
        page.generateMetadata({ params: Promise.resolve({ date: '2030-01-01' }) }),
      ).resolves.toMatchObject({
        title: 'AI Research Briefing Not Found',
        robots: { index: false, follow: false },
      })
    })

    it('renders a retry page instead of a 500 when the report fetch fails', async () => {
      serveBackend({ report: timeout() })
      const page = await import('./(blog)/blog/[date]/page')

      render(await page.default({ params: Promise.resolve({ date: '2026-08-23' }) }))
      expect(screen.getByText('[BRIEFING UNAVAILABLE]')).toBeInTheDocument()
      expect(connection).toHaveBeenCalledTimes(1)

      serveBackend({ report: null })
      await expect(
        page.default({ params: Promise.resolve({ date: '2026-08-23' }) }),
      ).rejects.toThrow('NEXT_NOT_FOUND')

      await expect(
        page.default({ params: Promise.resolve({ date: 'not-a-date' }) }),
      ).rejects.toThrow('NEXT_NOT_FOUND')
    })
  })

  describe('/', () => {
    it('builds every view card without a backend call', async () => {
      const page = await import('./(app)/page')

      expectCompleteCard(await page.generateMetadata({ searchParams: Promise.resolve({}) }), {
        title: 'MindPattern - AI Research Intelligence',
        url: '/',
        type: 'website',
        image: '/og/view/trending',
      })
      expectCompleteCard(
        await page.generateMetadata({ searchParams: Promise.resolve({ view: 'latest' }) }),
        {
          title: 'Latest signals · most recent first',
          url: '/?view=latest',
          type: 'website',
          image: '/og/view/latest',
        },
      )

      expect(Object.values(api).every((mock) => mock.mock.calls.length === 0)).toBe(true)
    })
  })
})
