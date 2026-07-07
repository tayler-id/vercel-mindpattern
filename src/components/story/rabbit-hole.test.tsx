import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RabbitHole } from './rabbit-hole'

const initial = {
  id: 1,
  title: 'Initial Finding',
  summary: 'Initial summary',
  agent: 'news-researcher',
  importance: 'high',
  source_name: 'Example Source',
  source_url: 'https://www.youtube.com/watch?v=abcDEF_1234',
}

const related = {
  id: 2,
  title: 'Related Finding',
  summary: 'Related summary',
  agent: 'agents-researcher',
  importance: 'medium',
  source_name: 'Related Source',
  source_url: 'https://related.example/story',
  connector_labels: ['same source'],
  reason: 'Shared source',
}

describe('RabbitHole', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('scrollTo', vi.fn())
  })

  it('renders the initial finding and opens related findings', () => {
    render(<RabbitHole initial={initial as never} initialRelated={[related as never]} />)

    expect(screen.getByRole('heading', { name: 'Initial Finding' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Related Finding/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Source page' })).toHaveAttribute('href', '/source/youtube.com')
    expect(screen.getByRole('button', { name: 'Play video: Initial Finding' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Related Finding/ }))
    expect(screen.getByRole('heading', { name: 'Related Finding' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Initial Finding' }))
    expect(screen.getByRole('heading', { name: 'Initial Finding' })).toBeInTheDocument()
  })

  it('loads related findings for new current items and handles fetch errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 }),
    )

    render(<RabbitHole initial={{ ...initial, id: 10 } as never} initialRelated={[related as never]} />)

    fireEvent.click(screen.getByRole('button', { name: /Related Finding/ }))
    await waitFor(() => expect(screen.getByText('Related signals are unavailable right now.')).toBeInTheDocument())
  })

  it('shows an empty related state when the backend returns no items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ items: [] }) }))

    render(<RabbitHole initial={{ ...initial, id: 20, source_url: '' } as never} initialRelated={[]} />)

    expect(await screen.findByText('No related signals yet.')).toBeInTheDocument()
  })

  it('handles non-array related payloads, current-item clicks, and non-finding targets', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ items: 'bad payload' }) }))

    render(
      <RabbitHole
        initial={{ ...initial, id: 30, source_url: 'https://example.com/story' } as never}
        initialRelated={[
          { ...initial, id: 30, title: 'Initial Finding' } as never,
          { ...related, id: 31, title: 'Story Target', target_url: '/s/story-target' } as never,
          { ...related, id: 32, title: 'Generic label', connector_labels: ['semantic neighbor', 'shared topic'] } as never,
        ]}
      />,
    )

    fireEvent.click(screen.getAllByRole('button', { name: /Initial Finding/ })[1])
    expect(screen.getByRole('heading', { name: 'Initial Finding' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Story Target/ }))
    expect(screen.getByRole('heading', { name: 'Initial Finding' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Generic label/ }))
    expect(await screen.findByText('No related signals yet.')).toBeInTheDocument()
  })
})
