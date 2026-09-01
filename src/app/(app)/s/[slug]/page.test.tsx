import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BackendError } from '@/lib/api'

const api = vi.hoisted(() => ({ getStory: vi.fn() }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  ...api,
}))

// The page calls connection() to keep a degraded render out of the full route
// cache. Outside a request there is no work store to mark, so stub it and
// assert the call instead.
const connection = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('next/server', () => ({ connection }))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

/** What a wedged Fly box actually produces: an abort past the 10s budget. */
const timeout = () => BackendError.timeout('/api/stories/openai-ships-a-new-model')

vi.mock('@/components/json-ld', () => ({
  JsonLd: ({ data }: { data: Record<string, unknown> }) => (
    <script data-testid="json-ld">{JSON.stringify(data)}</script>
  ),
}))
vi.mock('@/components/analytics/scroll-depth', () => ({
  ScrollDepthTracker: () => <span data-testid="scroll-depth" />,
}))
vi.mock('@/components/briefing/report-markdown', () => ({
  ReportMarkdown: ({ content }: { content: string }) => <article>{content}</article>,
}))
vi.mock('@/components/story/share-button', () => ({
  ShareButton: () => <button type="button">Share</button>,
}))
vi.mock('@/components/subscribe/subscribe-band', () => ({
  SubscribeBand: (props: { surface?: string; headline?: string }) => (
    <section data-testid="subscribe-band" data-surface={props.surface}>
      {props.headline}
    </section>
  ),
}))

const story = {
  kind: 'story',
  id: 'story-one',
  slug: 'story-one',
  title: 'Story One',
  summary: 'Story summary',
  dek: 'Story dek',
  take: '',
  why_now: '',
  body_markdown: 'Story body',
  body_excerpt: '',
  issue_date: '2026-08-23',
  issue_url: '',
  issue_title: 'Issue title',
  confidence: 'source-backed',
  source_refs: [
    { url: 'https://arxiv.org/abs/1234', domain: 'arxiv.org', title: 'The paper everyone quoted' },
    { url: 'https://www.reuters.com/tech/deal', domain: 'reuters.com', title: '' },
  ],
  entity_refs: [],
  finding_ids: [],
  arc_ids: [],
  related_paths: [],
  labels: ['ai'],
  json_ld_ready: true,
  claim_evidence: [
    { claim: 'Claim with a matching source', source_url: 'https://arxiv.org/abs/1234', finding_id: 1 },
    { claim: 'Claim with an unlisted source', source_url: 'https://www.theverge.com/post', finding_id: null },
    { claim: 'Claim with an unparseable source', source_url: 'not-a-url', finding_id: null },
  ],
  provenance: {
    redaction_status: 'passed',
    ai_generated: true,
    source_story_unit_id: 'unit-1',
    source_finding_ids: [1],
  },
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

async function loadPage() {
  return import('./page')
}

describe('story page metadata when the backend is slow', () => {
  beforeEach(() => {
    api.getStory.mockReset()
    connection.mockClear()
  })

  it('returns a complete card instead of throwing when the fetch times out', async () => {
    api.getStory.mockRejectedValueOnce(timeout())
    const page = await loadPage()

    const meta = await page.generateMetadata(params('openai-ships-a-new-model'))

    expect(meta.title).toBe('Openai ships a new model')
    expect(meta.alternates?.canonical).toBe('/s/openai-ships-a-new-model')
    expect(meta.openGraph).toMatchObject({
      type: 'article',
      url: '/s/openai-ships-a-new-model',
      title: 'Openai ships a new model',
    })
    expect(meta.openGraph?.description).toBeTruthy()
    expect(meta.openGraph?.images).toEqual([
      expect.objectContaining({ url: '/og/story/openai-ships-a-new-model.png', width: 1200, height: 630 }),
    ])
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' })
    expect(meta.twitter?.images).toEqual([
      expect.objectContaining({ url: '/og/story/openai-ships-a-new-model.png' }),
    ])
    // Any regex-valid slug reaches this branch, real or not, so the shell must
    // not be indexable as the story. follow stays on for the links out.
    expect(meta.robots).toEqual({ index: false, follow: true })
  })

  it('sends a 5xx down the same degraded path as a timeout', async () => {
    // Fly's proxy gives up with a 502 under load, which is the same outage.
    api.getStory.mockRejectedValueOnce(new BackendError(502, '/api/stories/one'))
    const page = await loadPage()

    const meta = await page.generateMetadata(params('openai-ships-a-new-model'))

    expect(meta.title).toBe('Openai ships a new model')
    expect(meta.robots).toEqual({ index: false, follow: true })
  })

  it('lets a defect out instead of reporting it to readers as a slow minute', async () => {
    const bug = new TypeError('story.source_refs is not iterable')
    api.getStory.mockRejectedValueOnce(bug)
    const page = await loadPage()

    await expect(page.generateMetadata(params('story-one'))).rejects.toBe(bug)
  })

  it('keeps the real story card when the fetch succeeds', async () => {
    api.getStory.mockResolvedValueOnce(story)
    const page = await loadPage()

    const meta = await page.generateMetadata(params('Story-One'))

    expect(meta.title).toBe('Story One')
    expect(meta.description).toBe('Story summary')
    expect(meta.openGraph).toMatchObject({ type: 'article', publishedTime: '2026-08-23' })
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' })
    // A real story stays indexable. noindex belongs to the degraded shell only.
    expect(meta.robots).toBeUndefined()
  })

  it('falls back to the site description when the story carries no prose', async () => {
    api.getStory.mockResolvedValueOnce({ ...story, summary: '', dek: '', take: '' })
    const page = await loadPage()

    const meta = await page.generateMetadata(params('story-one'))

    expect(meta.description).toContain('MindPattern')
  })

  it('still reports a missing story as not found', async () => {
    api.getStory.mockResolvedValueOnce(null)
    const page = await loadPage()

    const notFoundCard = { title: 'Story not found', robots: { index: false, follow: false } }
    await expect(page.generateMetadata(params('missing'))).resolves.toEqual(notFoundCard)
    await expect(page.generateMetadata(params('../bad'))).resolves.toEqual(notFoundCard)
  })
})

describe('story page body when the backend is slow', () => {
  beforeEach(() => {
    api.getStory.mockReset()
    connection.mockClear()
  })

  it('renders a way onward instead of throwing on a timeout', async () => {
    api.getStory.mockRejectedValueOnce(timeout())
    const page = await loadPage()

    render(await page.default(params('openai-ships-a-new-model')))

    expect(screen.getByRole('heading', { name: 'Openai ships a new model' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retry' })).toHaveAttribute(
      'href',
      '/s/openai-ships-a-new-model',
    )
    expect(screen.getByRole('link', { name: 'Briefing archive' })).toHaveAttribute('href', '/briefings')
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/explore')
  })

  it('keeps the degraded render out of the route cache', async () => {
    // `revalidate = 86400` stores a successful render for a day. Without this
    // the shell would replace a good story page every time a revalidation
    // landed inside the 7 AM slow window, which is most mornings.
    api.getStory.mockRejectedValueOnce(timeout())
    const page = await loadPage()

    await page.default(params('openai-ships-a-new-model'))

    expect(connection).toHaveBeenCalledTimes(1)
  })

  it('keeps a genuine 404 a 404', async () => {
    api.getStory.mockResolvedValueOnce(null)
    const page = await loadPage()

    await expect(page.default(params('missing'))).rejects.toThrow('NEXT_NOT_FOUND')
    expect(connection).not.toHaveBeenCalled()
  })

  it('lets a defect reach the error boundary instead of showing a retry page', async () => {
    const bug = new TypeError('cannot read properties of undefined')
    api.getStory.mockRejectedValueOnce(bug)
    const page = await loadPage()

    await expect(page.default(params('story-one'))).rejects.toBe(bug)
    expect(connection).not.toHaveBeenCalled()
  })
})

describe('story page outbound links', () => {
  beforeEach(() => {
    api.getStory.mockReset()
  })

  it('links the source trail out to the source URL and keeps the internal route', async () => {
    api.getStory.mockResolvedValueOnce(story)
    const page = await loadPage()

    render(await page.default(params('story-one')))

    // The same title also names the claim-evidence anchor, so take the first,
    // which is the source trail.
    const [external] = screen.getAllByRole('link', { name: 'The paper everyone quoted' })
    expect(external).toHaveAttribute('href', 'https://arxiv.org/abs/1234')
    expect(external).toHaveAttribute('target', '_blank')
    // noopener closes the window.opener hole. noreferrer is deliberately not
    // here: it strips the Referer header, so the sites a story links out to
    // never saw mindpattern.ai in their referral logs.
    expect(external.getAttribute('rel')).toBe('noopener')
    expect(external.getAttribute('rel')).not.toContain('nofollow')

    expect(screen.getByRole('link', { name: 'More from arxiv.org' })).toHaveAttribute(
      'href',
      '/source/arxiv.org',
    )
  })

  it('labels a titleless source with its path, not just the site', async () => {
    api.getStory.mockResolvedValueOnce(story)
    const page = await loadPage()

    render(await page.default(params('story-one')))

    expect(screen.getByRole('link', { name: 'reuters.com/tech/deal' })).toHaveAttribute(
      'href',
      'https://www.reuters.com/tech/deal',
    )
  })

  it('names the claim evidence anchor after what it points at', async () => {
    api.getStory.mockResolvedValueOnce(story)
    const page = await loadPage()

    render(await page.default(params('story-one')))

    expect(screen.queryByRole('link', { name: 'Source' })).not.toBeInTheDocument()
    // The listed source lends its title; an unlisted one names its page path,
    // because three anchors reading "GitHub" hid the owner's own project link.
    expect(screen.getAllByRole('link', { name: 'The paper everyone quoted' })).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'theverge.com/post' })).toHaveAttribute(
      'href',
      'https://www.theverge.com/post',
    )
  })

  it('refuses to link a source URL that is not http', async () => {
    // Source URLs come from the open-web crawl. "not-a-url" in an href
    // resolves against the current page and silently becomes /s/not-a-url,
    // and a javascript: one would run.
    api.getStory.mockResolvedValueOnce({
      ...story,
      source_refs: [
        { url: 'javascript:alert(1)', domain: 'evil.example', title: 'Not a source' },
      ],
    })
    const page = await loadPage()

    render(await page.default(params('story-one')))

    expect(screen.queryByRole('link', { name: 'Not a source' })).not.toBeInTheDocument()
    expect(screen.getByText('Not a source')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'More from evil.example' })).toHaveAttribute(
      'href',
      '/source/evil.example',
    )
    expect(screen.queryByRole('link', { name: 'the source site' })).not.toBeInTheDocument()
    expect(screen.getByText('the source site')).toBeInTheDocument()
  })
})

// ── Retention: the page must offer a reader something to do next ──
// Evidence basis (see the retention report, 2026-08-29): related-story blocks
// convert when the headline leads and the label is plain; graph vocabulary
// ("Shared entity: GAIA / Tension") is written for the graph, not a reader.
// The subscribe form goes where the finished reader is — after related — and
// the headline must be visible on first paint, not opacity-0 behind .rise-in.

const relatedStory = {
  ...story,
  related_paths: [
    {
      kind: 'story', id: 'r1', slug: 'r-one', title: 'Related One',
      target_url: '/s/r-one', reason: 'Linked by a graph relationship (Anthropic benchmarked against GAIA); both cover Agent.',
      summary: 'A reader-facing summary of related one.',
      connector_labels: ['Shared entity: GAIA', 'Earlier coverage', 'Tension'],
    },
    {
      kind: 'story', id: 'r2', slug: 'r-two', title: 'Related Two',
      target_url: '/s/r-two', reason: 'Linked by a graph relationship.',
      summary: '', connector_labels: ['Same source domain'],
    },
    { kind: 'story', id: 'r3', slug: 'r-three', title: 'Related Three', target_url: '/s/r-three', reason: '', summary: '', connector_labels: [] },
    { kind: 'story', id: 'r4', slug: 'r-four', title: 'Related Four', target_url: '/s/r-four', reason: '', summary: '', connector_labels: [] },
    { kind: 'story', id: 'r5', slug: 'r-five', title: 'Related Five', target_url: '/s/r-five', reason: '', summary: '', connector_labels: [] },
    { kind: 'story', id: 'r6', slug: 'r-six', title: 'Related Six', target_url: '/s/r-six', reason: '', summary: '', connector_labels: [] },
    { kind: 'story', id: 'r7', slug: 'r-seven', title: 'Related Seven', target_url: '/s/r-seven', reason: '', summary: '', connector_labels: [] },
  ],
}

describe('story page retention affordances', () => {
  beforeEach(() => {
    api.getStory.mockReset()
  })

  it('leads each related item with its headline and drops the graph vocabulary', async () => {
    api.getStory.mockResolvedValueOnce(relatedStory)
    const page = await loadPage()

    render(await page.default(params('story-one')))

    expect(screen.getByRole('link', { name: /Related One/ })).toHaveAttribute('href', '/s/r-one')
    // The machine-written connector kicker and reason sentence stay out of the
    // reader's view; the summary is the invitation.
    expect(screen.queryByText(/Shared entity/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Linked by a graph relationship/i)).not.toBeInTheDocument()
    expect(screen.getByText('A reader-facing summary of related one.')).toBeInTheDocument()
  })

  it('offers at most six related stories', async () => {
    api.getStory.mockResolvedValueOnce(relatedStory)
    const page = await loadPage()

    render(await page.default(params('story-one')))

    expect(screen.getByText('Related Six')).toBeInTheDocument()
    expect(screen.queryByText('Related Seven')).not.toBeInTheDocument()
  })

  it('still renders a related item without a target as plain text', async () => {
    api.getStory.mockResolvedValueOnce({
      ...story,
      related_paths: [
        { kind: 'story', id: 'r0', title: 'Untargeted', reason: '', summary: 'No link.', connector_labels: [] },
      ],
    })
    const page = await loadPage()

    render(await page.default(params('story-one')))

    expect(screen.getByText('Untargeted')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Untargeted/ })).not.toBeInTheDocument()
  })

  it('puts the subscribe form after related stories and before the source trail', async () => {
    api.getStory.mockResolvedValueOnce(relatedStory)
    const page = await loadPage()

    const { container } = render(await page.default(params('story-one')))

    const band = screen.getByTestId('subscribe-band')
    expect(band).toHaveAttribute('data-surface', 'story_page')
    const related = screen.getByRole('heading', { name: 'Related stories' })
    const sourceTrail = screen.getByRole('heading', { name: 'Source trail' })
    // DOCUMENT_POSITION_FOLLOWING = 4: argument follows the node.
    expect(related.compareDocumentPosition(band) & 4).toBeTruthy()
    expect(band.compareDocumentPosition(sourceTrail) & 4).toBeTruthy()
    expect(container.querySelectorAll('[data-testid="subscribe-band"]')).toHaveLength(1)
  })

  it('renders the subscribe form even when there are no related stories', async () => {
    api.getStory.mockResolvedValueOnce(story)
    const page = await loadPage()

    render(await page.default(params('story-one')))

    expect(screen.getByTestId('subscribe-band')).toHaveAttribute('data-surface', 'story_page')
  })

  it('shows the headline and dek on first paint instead of animating from opacity 0', async () => {
    api.getStory.mockResolvedValueOnce(relatedStory)
    const page = await loadPage()

    render(await page.default(params('story-one')))

    expect(screen.getByRole('heading', { name: 'Story One' })).not.toHaveClass('rise-in')
    expect(screen.getByText('Story dek')).not.toHaveClass('rise-in')
  })
})
