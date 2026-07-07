import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BriefingCircle } from './briefing-circle'
import { SourceFavicon } from './source-favicon'
import { StoryWireRow } from './story-wire-row'
import { TrendIndicator } from './trend-indicator'
import { ViaAvatar } from './via-avatar'
import { WireList } from './wire-list'
import { WireRow } from './wire-row'
import { WireTabs } from './wire-tabs'
import { FullWireRail } from './full-wire-rail'
import { WireTicker } from './wire-ticker'

const story = {
  kind: 'story',
  id: 'story-one',
  slug: 'story-one',
  title: 'Story One',
  summary: 'Story summary',
  issue_date: '2026-07-02',
  confidence: 'source-backed',
  take: 'A take',
  body_excerpt: '',
  source_refs: [{ url: 'https://www.example.com/story', domain: 'example.com', title: 'Example Source' }],
  entity_refs: [{ slug: 'openai', name: 'OpenAI' }],
  finding_ids: [],
  arc_ids: [],
  related_paths: [],
  labels: [],
  json_ld_ready: true,
  claim_evidence: [],
  section_id: 'news-researcher',
  provenance: {},
  trend: 'up',
  views: 1200,
}

describe('wire components', () => {
  it('renders trend states', () => {
    const { rerender } = render(<TrendIndicator trend="up" />)
    expect(screen.getByLabelText('trending up')).toBeInTheDocument()
    rerender(<TrendIndicator trend="down" />)
    expect(screen.getByLabelText('trending down')).toBeInTheDocument()
    rerender(<TrendIndicator trend="flat" />)
    expect(screen.getByLabelText('steady')).toBeInTheDocument()
    rerender(<TrendIndicator trend="unknown" />)
    expect(screen.queryByLabelText(/trending|steady/)).not.toBeInTheDocument()
  })

  it('renders favicons and avatar fallbacks after image errors', () => {
    const { container } = render(
      <>
        <SourceFavicon url="https://www.example.com/story" name="Example" />
        <SourceFavicon url={null} name="Fallback" />
        <ViaAvatar name="@tayler" avatar="https://avatar.test/tayler.png" />
      </>,
    )

    const images = container.querySelectorAll('img')
    expect(images[0]).toHaveAttribute('src', expect.stringContaining('domain=example.com'))
    fireEvent.error(images[0])
    fireEvent.error(images[1])
    expect(screen.getByText('E')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('via @tayler')).toBeInTheDocument()
  })

  it('renders wire tabs and active state', () => {
    render(<WireTabs active="latest" />)

    expect(screen.getByRole('link', { name: 'Trending' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Latest' })).toHaveAttribute('aria-current', 'page')
  })

  it('renders story and finding wire rows', () => {
    render(
      <>
        <StoryWireRow story={story as never} rank={1} />
        <WireRow
          rank={4}
          finding={{
            id: 9,
            title: 'Finding title',
            summary: 'Finding summary',
            agent: 'vibe-coding-researcher',
            source_name: 'X post',
            source_url: 'https://x.com/tayler/status/1',
          } as never}
        />
      </>,
    )

    expect(screen.getByRole('link', { name: /Story One/ })).toHaveAttribute('href', '/s/story-one')
    expect(screen.getByText('1,200 reads')).toBeInTheDocument()
    expect(screen.getByText('1 sources')).toBeInTheDocument()
    expect(screen.getByText('1 entities')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Finding title/ })).toHaveAttribute('href', '/f/9')
    expect(screen.getAllByText('Vibe Coding').length).toBeGreaterThan(0)
    expect(screen.getAllByText((_content, element) => element?.textContent === 'via @tayler').length).toBeGreaterThan(0)
  })

  it('renders compact wire fallbacks and ticker details', () => {
    render(
      <>
        <StoryWireRow
          story={{
            ...story,
            slug: 'fallback-story',
            title: 'Fallback Story',
            section_id: 'top-5-stories-today',
            summary: '',
            source_refs: [],
            entity_refs: [],
            source_count: 2,
            entity_count: 0,
            views: undefined,
          } as never}
          rank={2}
        />
        <WireRow
          finding={{
            id: 10,
            title: 'Bare finding',
            summary: '',
            agent: 'unknown-agent',
            source_name: '',
            source_url: '',
          } as never}
          rank={10}
        />
        <FullWireRail stories={[story as never]} total={1} />
        <WireTicker
          stats={{
            findings: 12345,
            sources: 50,
            by_date: {},
            by_agent: { 'news-researcher': 3, 'agents-researcher': 2 },
          } as never}
          today={7}
        />
      </>,
    )

    expect(screen.getByRole('link', { name: /Fallback Story/i })).toHaveAttribute('href', '/s/fallback-story')
    expect(screen.getByText('Top 5 · 2026-07-02 · source-backed')).toBeInTheDocument()
    expect(screen.getByText('2 sources')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Bare finding/i })).toHaveAttribute('href', '/f/10')
    expect(screen.getByText('1 stories')).toBeInTheDocument()
    expect(screen.getByText(/12,345 findings indexed/)).toBeInTheDocument()
  })

  it('filters, searches archive, and loads more stories', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          items: [{ ...story, slug: 'story-two', id: 'story-two', title: 'Story Two' }],
          total: 2,
          has_more: false,
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          groups: {
            stories: [
              {
                slug: 'archive-story',
                title: 'Archive Story',
                summary: 'Archive summary',
                issue_date: '2026-07-01',
                target_url: '/s/archive-story',
                has_take: true,
                section_id: 'news-researcher',
              },
            ],
          },
          totals: { stories: 1, stories_corpus: 2 },
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          groups: {
            stories: [
              {
                slug: 'query-story',
                title: 'Query Story',
                summary: 'Query summary',
                issue_date: '2026-07-02',
                target_url: '/s/query-story',
                has_take: false,
                section_id: 'models',
                source_count: 3,
                entity_count: 2,
              },
            ],
          },
          totals: { stories: 2, stories_corpus: 10 },
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          groups: { stories: [] },
          totals: { stories: 0, stories_corpus: 10 },
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          groups: {
            stories: [
              {
                slug: 'query-story-two',
                title: 'Query Story Two',
                summary: 'Query summary two',
                issue_date: '2026-07-03',
                target_url: '/s/query-story-two',
                has_take: true,
                section_id: 'models',
              },
            ],
          },
          totals: { stories: 2, stories_corpus: 10 },
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    render(<WireList stories={[story as never]} canLoadMore />)

    fireEvent.click(screen.getByRole('button', { name: /Load more/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/proxy/stories?user=ramsay&limit=50&offset=1'))

    fireEvent.click(screen.getByRole('button', { name: 'With take' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/proxy/search/site?')))
    expect(await screen.findByText('Archive Story')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search the wire'), { target: { value: 'query' } })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('q=query')))
    expect(await screen.findByText('Query Story')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Show more \(1 of 2\)/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Show more/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('offset=1')))

    fireEvent.change(screen.getByLabelText('Filter by section'), { target: { value: 'models' } })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('section=models')))
  })

  it('shows empty search states when archive lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<WireList stories={[]} />)

    fireEvent.click(screen.getByRole('button', { name: 'With take' }))

    expect(await screen.findByText('No stories match that search.')).toBeInTheDocument()
  })

  it('shows local empty state and keeps load-more available after failed pagination', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const { rerender } = render(<WireList stories={[]} />)

    expect(screen.getByText('Nothing matches those filters.')).toBeInTheDocument()

    rerender(<WireList stories={[story as never]} canLoadMore />)
    fireEvent.click(screen.getByRole('button', { name: /Load more/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Load more/ })).not.toBeDisabled())
  })

  it('renders the briefing circle for today and older reports', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-07T12:00:00Z'))
    const { rerender } = render(
      <BriefingCircle report={{ date: '2026-07-07', title: 'Today', filename: 'today.md', size: 2760 }} />,
    )

    expect(screen.getByRole('link')).toHaveAttribute('href', '/briefings/2026-07-07')
    expect(screen.getByText("Today's briefing")).toBeInTheDocument()
    expect(screen.getByText('July 7, 2026')).toBeInTheDocument()
    expect(screen.getByText('≈460 words · 2 min')).toBeInTheDocument()

    rerender(<BriefingCircle report={{ date: '2026-07-02', title: 'Older', filename: 'older.md', size: 0 }} />)
    expect(screen.getByText('Latest briefing')).toBeInTheDocument()
    expect(screen.getByText('July 2, 2026')).toBeInTheDocument()
    expect(screen.getByText('≈1 words · 1 min')).toBeInTheDocument()
  })
})
