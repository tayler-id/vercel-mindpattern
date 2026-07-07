import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  getAudioBriefing: vi.fn(),
  getAudioBriefings: vi.fn(),
  getEntity: vi.fn(),
  getFeed: vi.fn(),
  getFinding: vi.fn(),
  getFindings: vi.fn(),
  getNarrativeArc: vi.fn(),
  getPopular: vi.fn(),
  getRelated: vi.fn(),
  getReport: vi.fn(),
  getReports: vi.fn(),
  getSourceByDomain: vi.fn(),
  getStats: vi.fn(),
  getStory: vi.fn(),
  getStories: vi.fn(),
  getStructuredIssue: vi.fn(),
  getTrending: vi.fn(),
}))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  ...api,
  backendAssetUrl: (path: string) => `https://assets.test${path}`,
}))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  usePathname: () => '/briefings',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/components/json-ld', () => ({
  JsonLd: ({ data }: { data: Record<string, unknown> }) => <script data-testid="json-ld">{JSON.stringify(data)}</script>,
}))
vi.mock('@/components/analytics/scroll-depth', () => ({
  ScrollDepthTracker: ({ kind, id }: { kind: string; id: string }) => <span data-testid="scroll-depth">{kind}:{id}</span>,
}))
vi.mock('@/components/analytics/tracked-link', () => ({
  TrackedLink: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/components/briefing/audio-briefing-player', () => ({
  AudioBriefingPlayer: ({ audio, compact }: { audio: { date: string }; compact?: boolean }) => (
    <div data-testid={compact ? 'audio-compact' : 'audio'}>{audio.date}</div>
  ),
}))
vi.mock('@/components/briefing/report-markdown', () => ({
  ReportMarkdown: ({ content }: { content: string }) => <article>{content}</article>,
}))
vi.mock('@/components/wire/wire-list', () => ({
  WireList: ({ stories, canLoadMore }: { stories: { title: string }[]; canLoadMore?: boolean }) => (
    <div data-testid="wire-list">{stories.map((story) => story.title).join(',')}:{String(canLoadMore)}</div>
  ),
}))
vi.mock('@/components/wire/wire-row', () => ({
  WireRow: ({ finding, rank }: { finding: { title: string }; rank: number }) => <div data-testid="wire-row">{rank}:{finding.title}</div>,
}))
vi.mock('@/components/wire/wire-tabs', () => ({
  WireTabs: ({ active }: { active: string }) => <div data-testid="wire-tabs">{active}</div>,
}))
vi.mock('@/components/subscribe/subscribe-band', () => ({
  SubscribeBand: () => <div data-testid="subscribe-band" />,
}))
vi.mock('@/components/story/rabbit-hole', () => ({
  RabbitHole: ({ initial, initialRelated }: { initial: { title: string }; initialRelated: unknown[] }) => (
    <div data-testid="rabbit-hole">{initial.title}:{initialRelated.length}</div>
  ),
}))
vi.mock('@/components/wire/source-favicon', () => ({
  SourceFavicon: ({ name }: { name: string }) => <span>{name}</span>,
}))
vi.mock('@/components/blog-search', () => ({
  BlogSearch: ({ reports }: { reports: { title: string }[] }) => <div data-testid="blog-search">{reports.map((r) => r.title).join(',')}</div>,
}))
vi.mock('@/components/newsletter-signup', () => ({
  NewsletterSignup: () => <div data-testid="newsletter-signup" />,
}))
vi.mock('@/components/explore/explore-tabs', () => ({
  ExploreTabs: () => <div data-testid="explore-tabs" />,
}))
vi.mock('@/components/search/search-client', () => ({
  SearchClient: () => <div data-testid="search-client" />,
}))

const report = {
  date: '2026-07-02',
  title: 'Daily Briefing',
  subtitle: 'A subtitle',
  size: 4000,
  content: '# Briefing\n\nSource https://example.com/a.',
}

const finding = {
  id: 1,
  title: 'Finding One',
  summary: 'Finding summary',
  agent: 'news-researcher',
  run_date: '2026-07-02',
  source_name: 'Example',
  source_url: 'https://example.com',
}

const story = {
  kind: 'story',
  id: 'story-one',
  slug: 'story-one',
  title: 'Story One',
  summary: 'Story summary',
  dek: 'Story dek',
  take: 'Story take',
  why_now: 'It matters now',
  body_markdown: 'Story body',
  body_excerpt: '',
  issue_date: '2026-07-02',
  issue_url: '',
  issue_title: 'Issue title',
  confidence: 'source-backed',
  source_refs: [{ url: 'https://example.com/story', domain: 'example.com', title: 'Example Source' }],
  entity_refs: [{ id: 'entity-1', slug: 'openai', name: 'OpenAI' }],
  finding_ids: [],
  arc_ids: [],
  related_paths: [
    { id: 'rel-1', slug: 'related-story', target_url: '/s/related-story', title: 'Related Story', reason: 'Shared source', connector_labels: ['source'] },
    { id: 'rel-2', target_url: '', title: 'Unlinked Story', summary: 'No URL', connector_labels: [] },
  ],
  labels: ['ai'],
  json_ld_ready: true,
  claim_evidence: [{ claim: 'Claim one', source_url: 'https://example.com/source', finding_id: 1 }],
  provenance: {
    redaction_status: 'passed',
    ai_generated: true,
    source_story_unit_id: '',
    source_finding_ids: [1],
  },
}

const arc = {
  id: 'arc-one',
  title: 'Arc One',
  summary: 'Arc summary',
  status: 'active',
  evidence_count: 2,
  date_count: 1,
  source_domain_count: 1,
  evidence: [
    { finding_id: 1, source_url: 'https://example.com/a', source_name: 'Example', agent: 'news-researcher', run_date: '2026-07-02', title: 'Evidence One', summary: 'Evidence summary' },
    { finding_id: null, source_url: '', source_name: '', agent: 'agents-researcher', run_date: '2026-07-02', title: 'Evidence Two', summary: 'Evidence summary' },
  ],
}

const entity = {
  slug: 'openai',
  name: 'OpenAI',
  issue_dates: ['2026-07-02'],
  counts: { story_units: 2, findings: 1, relationships: 3, sources: 1 },
  pagination: { has_more: true, limit: 40 },
  dossier: {
    date: '2026-07-02',
    confidence: 'high',
    take: 'Dossier take',
    timeline: [{ date: '2026-07-02', items: [{ finding_id: 1, target_url: '/f/1', title: 'Timeline Finding' }] }],
    top_sources: [{ domain: 'example.com', finding_count: 2, target_url: '/source/example.com' }],
  },
  findings: [{ ...finding, target_url: '/f/1', relationship: 'reported_on' }],
  relationships: [
    { source: 'entity_graph_provenance', relationship: 'powers', related_entity: 'ChatGPT', related_entity_slug: 'chatgpt', fact_text: 'Powers ChatGPT', target_url: '/f/1' },
    { source: 'findings_text', relationship: 'reported_on', related_entity: 'Unknown Entity', related_entity_slug: 'unknown', fact_text: 'Mentioned', target_url: '' },
    { source: 'custom', relationship: '', entity_a: 'OpenAI', entity_b: 'Model', fact_text: '', target_url: '' },
  ],
  source_trail: [{ url: 'https://example.com/a', domain: 'example.com', title: 'Example Source' }],
  graph_sources: ['entity_graph_provenance'],
}

const issue = {
  story_units: [
    {
      id: 'story-one',
      title: 'Story One',
      entity_ids: ['openai', 'agent'],
      source_refs: [{ domain: 'example.com' }, { domain: 'example.com' }],
      published_story: { target_url: '/s/story-one' },
    },
    {
      id: 'story-two',
      title: 'Story Two',
      entity_ids: [],
      source_refs: [],
      published_story: null,
    },
  ],
  source_trail: [{ domain: 'example.com' }, { domain: 'example.com' }],
  entities: [{ slug: 'openai', name: 'OpenAI' }],
}

describe('app route pages', () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset())
  })

  it('renders the wire page for trending, cold-start fallback, latest, most-read, topics, and empty fallback', async () => {
    api.getStats.mockResolvedValue({
      findings: 1000,
      sources: 20,
      by_date: { '2026-07-02': 9 },
      by_agent: { 'news-researcher': 9 },
    })
    api.getTrending.mockResolvedValueOnce({ items: [story] }).mockResolvedValueOnce({ items: [] })
    api.getStories
      .mockResolvedValueOnce({ items: [story] })
      .mockResolvedValueOnce({ items: [{ ...story, slug: 'story-two', title: 'Story Two' }] })
      .mockResolvedValueOnce({ items: [story] })
      .mockResolvedValueOnce({ items: [{ ...story, slug: 'story-three', title: 'Story Three' }] })
    api.getFeed.mockResolvedValue({ items: [finding] })
    api.getPopular.mockResolvedValue({ items: [story] })
    api.getFindings.mockResolvedValue([finding])
    api.getReports.mockResolvedValue([])
    const { default: WirePage } = await import('./(app)/page')

    render(await WirePage({ searchParams: Promise.resolve({ view: 'trending' }) }))
    expect(screen.getByRole('heading', { name: /Trending now/i })).toBeInTheDocument()
    expect(screen.getByTestId('wire-list')).toHaveTextContent('Story Two,Story One:false')

    render(await WirePage({ searchParams: Promise.resolve({ view: 'latest' }) }))
    expect(screen.getByTestId('wire-row')).toHaveTextContent('1:Finding One')

    render(await WirePage({ searchParams: Promise.resolve({ view: 'most-read' }) }))
    expect(screen.getByRole('heading', { name: /Most read/i })).toBeInTheDocument()

    render(await WirePage({ searchParams: Promise.resolve({ view: 'topics' }) }))
    expect(screen.getByText('NEWS')).toBeInTheDocument()

    api.getTrending.mockRejectedValueOnce(new Error('down'))
    api.getFindings.mockRejectedValueOnce(new Error('down'))
    render(await WirePage({ searchParams: Promise.resolve({ view: 'bad-view' }) }))
    expect(screen.getByText('The wire is quiet. Nothing is loading right now.')).toBeInTheDocument()
  })

  it('renders the wire page archive pagination, report rail, and stats/report fallbacks', async () => {
    api.getStats.mockRejectedValueOnce(new Error('stats down'))
    api.getReports.mockResolvedValueOnce([
      { date: '2026-07-01', title: 'Older', filename: 'older.md', size: 100 },
      { date: '2026-07-03', title: 'Newest', filename: 'newest.md', size: 2300 },
    ])
    api.getStories
      .mockResolvedValueOnce({ items: [story], total: 75, has_more: true })
      .mockResolvedValueOnce({ items: [{ ...story, slug: 'archive-two', title: 'Archive Two' }], total: 75, has_more: false })
    api.getTrending.mockResolvedValue({ items: [{ ...story, entity_refs: [{ slug: 'entity-one' }] }] })
    const { default: WirePage } = await import('./(app)/page')

    render(await WirePage({ searchParams: Promise.resolve({ view: 'trending' }) }))

    expect(screen.getByRole('link', { name: /Latest briefing/ })).toHaveAttribute('href', '/briefings/2026-07-03')
    expect(screen.getByText('latest 2 of 75')).toBeInTheDocument()

    api.getStats.mockResolvedValueOnce({
      findings: 10,
      sources: 2,
      by_date: {},
      by_agent: {},
    })
    api.getReports.mockRejectedValueOnce(new Error('reports down'))
    api.getStories.mockRejectedValueOnce(new Error('archive down'))
    api.getFeed.mockResolvedValueOnce({
      items: [{ ...finding, entities: [{ slug: 'openai' }] }],
    })
    render(await WirePage({ searchParams: Promise.resolve({ view: 'latest' }) }))
    expect(screen.getByTestId('wire-row')).toHaveTextContent('1:Finding One')
  })

  it('renders briefing archive success and error states', async () => {
    api.getReports.mockResolvedValueOnce([report]).mockRejectedValueOnce(new Error('down'))
    api.getAudioBriefings.mockResolvedValueOnce([{ date: '2026-07-02' }]).mockRejectedValueOnce(new Error('down'))
    const { default: BriefingsPage, metadata, dynamic } = await import('./(app)/briefings/page')

    expect(metadata.title).toBe('Briefings')
    expect(dynamic).toBe('force-dynamic')
    render(await BriefingsPage())
    expect(screen.getByRole('link', { name: /Daily Briefing/ })).toHaveAttribute('href', '/briefings/2026-07-02')
    expect(screen.getByTestId('audio-compact')).toHaveTextContent('2026-07-02')

    render(await BriefingsPage())
    expect(screen.getByText("Couldn’t load the archive. Refresh in a moment.")).toBeInTheDocument()
  })

  it('renders briefing detail metadata, graph trail, navigation, and missing report state', async () => {
    api.getReport.mockResolvedValueOnce(report).mockResolvedValueOnce(report)
    api.getReports.mockResolvedValue([{ date: '2026-07-01' }, { date: '2026-07-02' }, { date: '2026-07-03' }])
    api.getAudioBriefing.mockResolvedValue({ date: '2026-07-02' })
    api.getStructuredIssue.mockResolvedValue(issue)
    const page = await import('./(app)/briefings/[date]/page')

    await expect(page.generateMetadata({ params: Promise.resolve({ date: '2026-07-02' }) })).resolves.toMatchObject({
      title: 'Daily Briefing',
      alternates: { canonical: '/briefings/2026-07-02' },
    })
    render(await page.default({ params: Promise.resolve({ date: '2026-07-02' }) }))
    expect(screen.getByText('Graph trail')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Story One/ })).toHaveAttribute('href', '/s/story-one')
    expect(screen.getByRole('link', { name: 'OpenAI' })).toHaveAttribute('href', '/e/openai')
    expect(screen.getByRole('link', { name: /Jul 1/ })).toHaveAttribute('href', '/briefings/2026-07-01')

    api.getReport.mockRejectedValueOnce(new Error('missing')).mockRejectedValueOnce(new Error('missing'))
    await expect(page.generateMetadata({ params: Promise.resolve({ date: '2026-07-04' }) })).resolves.toMatchObject({
      title: 'Briefing not found',
    })
    render(await page.default({ params: Promise.resolve({ date: '2026-07-04' }) }))
    expect(screen.getByText('The briefing for 2026-07-04 could not be loaded.')).toBeInTheDocument()
  })

  it('renders briefing detail title stripping and graph trail fallbacks', async () => {
    const graphIssue = {
      story_units: [
        {
          id: 'plain-story',
          slug: 'plain-story',
          title: 'Plain Story',
          entity_ids: ['beta'],
          source_refs: [{ domain: 'beta.example' }],
          published_story: null,
        },
        {
          id: 'alpha-story',
          slug: 'alpha-story',
          title: 'Alpha Story',
          entity_ids: ['alpha'],
          source_refs: [{ domain: 'alpha.example' }],
          published_story: null,
        },
      ],
      source_trail: [{ domain: 'beta.example' }, { domain: 'alpha.example' }],
      entities: [{ slug: 'beta', name: 'Beta' }, { slug: 'alpha', name: 'Alpha' }],
    }
    api.getReport.mockResolvedValue({
      ...report,
      title: 'Daily Briefing',
      content: '# Different Heading\n\nBriefing body',
    })
    api.getReports.mockResolvedValue([{ date: '2026-07-02' }])
    api.getAudioBriefing.mockResolvedValue(null)
    api.getStructuredIssue.mockResolvedValueOnce({
      story_units: [],
      source_trail: [],
      entities: [],
    }).mockResolvedValueOnce(graphIssue)
    const page = await import('./(app)/briefings/[date]/page')

    render(await page.default({ params: Promise.resolve({ date: '2026-07-02' }) }))
    expect(screen.queryByText('Graph trail')).not.toBeInTheDocument()
    expect(screen.getAllByText((_content, element) => element?.textContent?.includes('# Different Heading') ?? false).length).toBeGreaterThan(0)

    render(await page.default({ params: Promise.resolve({ date: '2026-07-02' }) }))
    expect(screen.getByText('Plain Story')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '/e/alpha')
  })

  it('renders finding detail metadata and not-found branches', async () => {
    api.getFinding.mockResolvedValueOnce(finding).mockResolvedValueOnce(finding).mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    api.getRelated.mockResolvedValue({ items: [finding] })
    const page = await import('./(app)/f/[id]/page')

    await expect(page.generateMetadata({ params: Promise.resolve({ id: '1' }) })).resolves.toMatchObject({
      title: 'Finding One',
      alternates: { canonical: '/f/1' },
    })
    render(await page.default({ params: Promise.resolve({ id: '1' }) }))
    expect(screen.getByTestId('rabbit-hole')).toHaveTextContent('Finding One:1')
    await expect(page.generateMetadata({ params: Promise.resolve({ id: '404' }) })).resolves.toMatchObject({
      title: 'Finding not found',
    })
    await expect(page.default({ params: Promise.resolve({ id: '404' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('renders arc metadata, evidence, invalid params, and not-found branches', async () => {
    api.getNarrativeArc.mockResolvedValueOnce(arc).mockResolvedValueOnce(arc).mockResolvedValueOnce(null)
    const page = await import('./(app)/arc/[id]/page')

    await expect(page.generateMetadata({ params: Promise.resolve({ id: 'Arc-One' }), searchParams: Promise.resolve({ date: '2026-07-02' }) })).resolves.toMatchObject({
      title: 'Arc One narrative arc',
    })
    render(await page.default({ params: Promise.resolve({ id: 'Arc-One' }), searchParams: Promise.resolve({ date: '2026-07-02' }) }))
    expect(screen.getByRole('heading', { name: 'Arc One' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Evidence One' })).toHaveAttribute('href', '/f/1')
    expect(screen.getByText('Evidence Two')).toBeInTheDocument()
    await expect(page.generateMetadata({ params: Promise.resolve({ id: '../bad' }), searchParams: Promise.resolve({ date: 'bad' }) })).resolves.toMatchObject({
      title: 'Arc not found',
    })
    await expect(page.default({ params: Promise.resolve({ id: 'arc-one' }), searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(page.default({ params: Promise.resolve({ id: 'arc-one' }), searchParams: Promise.resolve({ date: '2026-07-02' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('renders story metadata, full story sections, and not-found branches', async () => {
    api.getStory.mockResolvedValueOnce(story).mockResolvedValueOnce(story).mockResolvedValueOnce(null)
    const page = await import('./(app)/s/[slug]/page')

    await expect(page.generateMetadata({ params: Promise.resolve({ slug: 'Story-One' }) })).resolves.toMatchObject({
      title: 'Story One',
      alternates: { canonical: '/s/story-one' },
    })
    render(await page.default({ params: Promise.resolve({ slug: 'Story-One' }) }))
    expect(screen.getByRole('heading', { name: 'Story One' })).toBeInTheDocument()
    expect(screen.getByText('The take')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Related Story/ })).toHaveAttribute('href', '/s/related-story')
    expect(screen.getByRole('link', { name: 'Example Source' })).toHaveAttribute('href', '/source/example.com')
    expect(screen.getByRole('link', { name: 'OpenAI' })).toHaveAttribute('href', '/e/openai')
    expect(screen.getByRole('link', { name: 'Finding 1' })).toHaveAttribute('href', '/f/1')
    await expect(page.generateMetadata({ params: Promise.resolve({ slug: '../bad' }) })).resolves.toMatchObject({
      title: 'Story not found',
    })
    await expect(page.default({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('renders story fallback content, top-five labeling, repeated related labels, and provenance fallbacks', async () => {
    api.getStory.mockResolvedValueOnce({
      ...story,
      slug: 'top-five-story',
      title: 'Top Five Story',
      summary: '',
      dek: '',
      take: '',
      why_now: '',
      body_markdown: '',
      body_excerpt: 'Fallback body',
      section_id: 'top-5-stories-today',
      issue_url: '/custom-issue',
      issue_title: '',
      source_refs: [{ url: 'https://example.com/no-title', domain: 'example.com', title: '' }],
      entity_refs: [],
      related_paths: [
        { id: 'same-1', slug: 'same-1', target_url: '/s/same-1', title: 'Same One', summary: 'First summary', connector_labels: ['same source'] },
        { id: 'same-2', slug: 'same-2', target_url: '', title: 'Same Two', summary: 'Second summary', connector_labels: ['same source'] },
      ],
      claim_evidence: [
        { claim: 'Claim without finding', source_url: '', finding_id: null },
      ],
      provenance: {
        redaction_status: 'passed',
        ai_generated: false,
        source_story_unit_id: '',
        source_finding_ids: [],
      },
      labels: [],
    })
    const page = await import('./(app)/s/[slug]/page')

    render(await page.default({ params: Promise.resolve({ slug: 'top-five-story' }) }))

    expect(screen.getByText('Top 5 · 2026-07-02 · source-backed')).toBeInTheDocument()
    expect(screen.getByText('Fallback body')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Same One/ })).toHaveAttribute('href', '/s/same-1')
    expect(screen.getByText('Same Two')).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()
    expect(screen.getByText('no')).toBeInTheDocument()
    expect(screen.getByText('site artifact')).toBeInTheDocument()
    expect(screen.getAllByText('source-backed').length).toBeGreaterThan(0)
  })

  it('renders entity metadata, dossier, relationships, and not-found branches', async () => {
    api.getEntity.mockResolvedValueOnce(entity).mockResolvedValueOnce(entity).mockResolvedValueOnce(null)
    const page = await import('./(app)/e/[slug]/page')

    await expect(page.generateMetadata({ params: Promise.resolve({ slug: 'OpenAI' }) })).resolves.toMatchObject({
      title: 'OpenAI intelligence trail',
    })
    render(await page.default({ params: Promise.resolve({ slug: 'OpenAI' }) }))
    expect(screen.getByRole('heading', { name: 'OpenAI' })).toBeInTheDocument()
    expect(screen.getByText('Showing the first 40 findings. More graph evidence exists in the corpus.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Timeline Finding' })).toHaveAttribute('href', '/f/1')
    expect(screen.getByRole('link', { name: 'ChatGPT' })).toHaveAttribute('href', '/e/chatgpt')
    expect(screen.getByText('OpenAI -> Model')).toBeInTheDocument()
    expect(screen.getByText('entity graph provenance')).toBeInTheDocument()
    await expect(page.generateMetadata({ params: Promise.resolve({ slug: '../bad' }) })).resolves.toMatchObject({
      title: 'Entity not found',
    })
    await expect(page.default({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('renders source metadata, source details, and not-found branches', async () => {
    api.getSourceByDomain.mockResolvedValueOnce({
      display_name: 'Example Source',
      counts: { findings: 1 },
      hit_count: 12,
      high_value_count: 5,
      last_seen: '2026-07-02',
      findings: [finding],
      entities: [{ slug: 'openai', name: 'OpenAI' }],
    }).mockRejectedValueOnce(new Error('missing'))
    const page = await import('./(app)/source/[domain]/page')

    await expect(page.generateMetadata({ params: Promise.resolve({ domain: 'www.Example.com' }) })).resolves.toMatchObject({
      title: 'example.com source trail',
    })
    render(await page.default({ params: Promise.resolve({ domain: 'www.Example.com' }) }))
    expect(screen.getByRole('heading', { name: 'Example Source' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'OpenAI' })).toHaveAttribute('href', '/e/openai')
    expect(screen.getByRole('link', { name: /Finding One/ })).toHaveAttribute('href', '/f/1')
    expect(screen.getByRole('link', { name: 'Open latest cited source' })).toHaveAttribute('href', 'https://example.com')
    await expect(page.generateMetadata({ params: Promise.resolve({ domain: '../bad' }) })).resolves.toMatchObject({
      title: 'Source not found',
    })
    await expect(page.default({ params: Promise.resolve({ domain: 'missing.com' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('renders blog archive and blog post success and fallback branches', async () => {
    api.backendFetch
      .mockResolvedValueOnce([report])
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({
        ...report,
        content: `# Briefing\n\n## Section\n\n### Detail\n\nParagraph with **strong** text and [source](https://example.com/a).\n\n- Bullet\n\n1. Step\n\n> Quote\n\n\`code\`\n\n---\n\n| A | B |\n| - | - |\n| 1 | 2 |`,
      })
      .mockResolvedValueOnce({
        ...report,
        content: `# Briefing\n\n## Section\n\n### Detail\n\nParagraph with **strong** text and [source](https://example.com/a).\n\n- Bullet\n\n1. Step\n\n> Quote\n\n\`code\`\n\n---\n\n| A | B |\n| - | - |\n| 1 | 2 |`,
      })
      .mockResolvedValueOnce([{ date: '2026-07-01' }, { date: '2026-07-02' }, { date: '2026-07-03' }])
      .mockResolvedValueOnce(report)
      .mockResolvedValueOnce([{ date: '2026-07-02' }, { date: '2026-07-03' }])
      .mockResolvedValueOnce(report)
      .mockResolvedValueOnce([{ date: '2026-07-01' }, { date: '2026-07-02' }])
      .mockRejectedValueOnce(new Error('missing'))
      .mockRejectedValueOnce(new Error('missing'))
    const archive = await import('./(blog)/blog/page')
    const post = await import('./(blog)/blog/[date]/page')

    render(await archive.default())
    expect(screen.getByTestId('blog-search')).toHaveTextContent('Daily Briefing')
    render(await archive.default())
    expect(screen.getByText('[NO BRIEFINGS ON FILE]')).toBeInTheDocument()

    await expect(post.generateMetadata({ params: Promise.resolve({ date: '2026-07-02' }) })).resolves.toMatchObject({
      title: 'Daily Briefing',
    })
    render(await post.default({ params: Promise.resolve({ date: '2026-07-02' }) }))
    expect(screen.getByRole('heading', { name: 'Briefing' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'source' })).toHaveAttribute('href', 'https://example.com/a')
    expect(screen.getByRole('heading', { name: 'Section' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Detail' })).toBeInTheDocument()
    expect(screen.getByText('strong')).toBeInTheDocument()
    expect(screen.getByText('Bullet')).toBeInTheDocument()
    expect(screen.getByText('Step')).toBeInTheDocument()
    expect(screen.getByText('Quote')).toBeInTheDocument()
    expect(screen.getByText('code')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /\[2026-07-01\]/ })).toHaveAttribute('href', '/blog/2026-07-01')
    expect(screen.getByRole('link', { name: /\[2026-07-03\]/ })).toHaveAttribute('href', '/blog/2026-07-03')
    render(await post.default({ params: Promise.resolve({ date: '2026-07-02' }) }))
    expect(screen.getAllByRole('link', { name: /\[2026-07-03\]/ }).at(-1)).toHaveAttribute('href', '/blog/2026-07-03')
    render(await post.default({ params: Promise.resolve({ date: '2026-07-02' }) }))
    expect(screen.getAllByRole('link', { name: /\[2026-07-01\]/ }).at(-1)).toHaveAttribute('href', '/blog/2026-07-01')
    await expect(post.generateMetadata({ params: Promise.resolve({ date: '2026-07-04' }) })).resolves.toMatchObject({
      title: 'AI Research Briefing Not Found',
    })
    render(await post.default({ params: Promise.resolve({ date: '2026-07-04' }) }))
    expect(screen.getByText('[REPORT NOT FOUND]')).toBeInTheDocument()
  })

  it('renders static search, explore, and unsubscribe pages', async () => {
    const Template = (await import('./(app)/template')).default
    const search = await import('./(app)/search/page')
    const explore = await import('./(explore)/explore/page')
    const unsubscribe = await import('./(unsubscribe)/unsubscribe/page')
    const SearchPage = search.default
    const ExplorePage = explore.default
    const UnsubscribePage = unsubscribe.default

    render(<Template>Template child</Template>)
    expect(screen.getByText('Template child')).toBeInTheDocument()
    render(<SearchPage />)
    expect(screen.getByTestId('search-client')).toBeInTheDocument()
    render(<ExplorePage />)
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false }).mockRejectedValueOnce(new Error('offline')))
    render(<UnsubscribePage />)
    expect(screen.getByRole('button', { name: 'Unsubscribe' })).toBeInTheDocument()
  })
})
