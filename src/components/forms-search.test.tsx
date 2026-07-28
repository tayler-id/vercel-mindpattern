import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BlogSearch } from './blog-search'
import { NewsletterSignup } from './newsletter-signup'
import { SearchClient } from './search/search-client'
import { SearchHotkey } from './search/search-hotkey'
import { SubscribeBand } from './subscribe/subscribe-band'

const navMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  queryParams: new URLSearchParams(),
}))
const analyticsMocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navMocks.replace, push: navMocks.push }),
  useSearchParams: () => navMocks.queryParams,
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: analyticsMocks.trackEvent,
}))

describe('form and search components', () => {
  beforeEach(() => {
    navMocks.replace.mockReset()
    navMocks.push.mockReset()
    analyticsMocks.trackEvent.mockReset()
    navMocks.queryParams = new URLSearchParams()
  })

  it('filters blog reports by title', () => {
    render(
      <BlogSearch
        reports={[
          { date: '2026-07-01', title: 'OpenAI Report', size: 4000 },
          { date: '2026-07-02', title: 'Anthropic Report', size: 1000 },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: /OpenAI Report/ })).toHaveAttribute('href', '/blog/2026-07-01')
    fireEvent.change(screen.getByPlaceholderText('SEARCH BRIEFINGS...'), { target: { value: 'anthropic' } })
    expect(screen.queryByText('OpenAI Report')).not.toBeInTheDocument()
    expect(screen.getByText('Anthropic Report')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('SEARCH BRIEFINGS...'), { target: { value: 'missing' } })
    expect(screen.getByText('[NO MATCHING BRIEFINGS]')).toBeInTheDocument()
  })

  it('submits newsletter signup success, duplicate, error, and network branches', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ already: false }) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ already: true }) })
      .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({ error: 'Bad email' }) })
      .mockRejectedValueOnce(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = render(<NewsletterSignup key="new" />)
    fireEvent.change(screen.getByPlaceholderText('agent@email.com'), { target: { value: 'a@example.com' } })
    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('SUBSCRIBED')).toBeInTheDocument()

    rerender(<NewsletterSignup key="duplicate" />)
    fireEvent.change(screen.getByPlaceholderText('agent@email.com'), { target: { value: 'a@example.com' } })
    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('ALREADY ON FILE')).toBeInTheDocument()

    rerender(<NewsletterSignup key="error" />)
    fireEvent.change(screen.getByPlaceholderText('agent@email.com'), { target: { value: 'bad@example.com' } })
    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('Bad email')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('agent@email.com'), { target: { value: 'retry@example.com' } })
    expect(screen.queryByText('Bad email')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('NETWORK ERROR')).toBeInTheDocument()

    rerender(<NewsletterSignup key="empty" />)
    fireEvent.submit(screen.getByRole('button').closest('form')!)
    expect(fetchMock).toHaveBeenCalledTimes(4)

    fetchMock.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ already: false }) })
    rerender(<NewsletterSignup key="accent" variant="onAccent" className="accent-form" />)
    expect(screen.queryByText('Daily Intel Briefing')).not.toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('agent@email.com'), { target: { value: 'accent@example.com' } })
    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('SUBSCRIBED')).toBeInTheDocument()
  })

  it('submits subscribe band success, duplicate, server error, invalid JSON, and network branches', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ already: true }) })
      .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({ error: 'Denied' }) })
      .mockResolvedValueOnce({ ok: false, json: vi.fn().mockRejectedValue(new Error('bad json')) })
      .mockRejectedValueOnce(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = render(<SubscribeBand key="success" />)
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByRole('status')).toHaveTextContent("You're in. Check your inbox.")

    rerender(<SubscribeBand key="duplicate" />)
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByRole('status')).toHaveTextContent("You're already on the list.")

    rerender(<SubscribeBand key="server-error" />)
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Denied')

    rerender(<SubscribeBand key="json-error" />)
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.')

    rerender(<SubscribeBand key="network-error" />)
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Network error. Try again.')
  })

  it('handles search hotkey navigation', () => {
    render(<SearchHotkey />)

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(navMocks.push).toHaveBeenCalledWith('/search')
    fireEvent.keyDown(window, { key: 'K', ctrlKey: true })
    expect(navMocks.push).toHaveBeenCalledWith('/search')
    fireEvent.keyDown(window, { key: 'x', metaKey: true })
    expect(navMocks.push).toHaveBeenCalledTimes(2)
  })

  it('runs site search from initial params, toggles types, and handles empty/error states', async () => {
    navMocks.queryParams = new URLSearchParams('q=agents&types=stories,findings')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          groups: {
            stories: [{ slug: 'story-one', title: 'Story One', summary: 'Summary', issue_date: '2026-07-02', target_url: '/s/story-one', has_take: true }],
            findings: [{ id: 1, title: 'Finding One', summary: 'Finding', run_date: '2026-07-02', target_url: '/f/1' }],
            entities: [{ slug: 'openai', name: 'OpenAI', mention_count: 2, target_url: '/e/openai' }],
            sources: [{ domain: 'example.com', name: 'Example', hit_count: 3, target_url: '/source/example.com' }],
          },
        }),
      })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ groups: {} }) })
    vi.stubGlobal('fetch', fetchMock)

    render(<SearchClient />)

    expect(await screen.findByText('Story One')).toBeInTheDocument()
    expect(screen.getByText('2026-07-02 · with take')).toBeInTheDocument()
    expect(screen.getByText('Finding One')).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('example.com · 3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'sources' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Nothing matched. Try fewer words.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Query'), { target: { value: '' } })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
    })
    expect(navMocks.replace).toHaveBeenCalledWith('/search?q=&types=stories,findings,sources', { scroll: false })
    expect(screen.queryByText('Nothing matched. Try fewer words.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'stories' }))
    fireEvent.click(screen.getByRole('button', { name: 'findings' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('debounces changed searches, preserves the last change, and ignores empty type toggles', async () => {
    navMocks.queryParams = new URLSearchParams('types=stories')
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        groups: {
          stories: [{ slug: 'single-story', title: 'Single Story', summary: 'Summary', issue_date: '2026-07-02', target_url: '/s/single-story', has_take: false }],
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<SearchClient />)

    fireEvent.click(screen.getByRole('button', { name: 'stories' }))
    expect(fetchMock).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Query'), { target: { value: 'first' } })
    fireEvent.change(screen.getByLabelText('Query'), { target: { value: 'second' } })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
    })

    expect(navMocks.replace).toHaveBeenCalledWith('/search?q=second&types=stories', { scroll: false })
    expect(await screen.findByText('1 result')).toBeInTheDocument()
    expect(screen.getByText('2026-07-02')).toBeInTheDocument()
  })
})
