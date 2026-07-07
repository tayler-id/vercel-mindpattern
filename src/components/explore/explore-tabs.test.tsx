import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExploreTabs } from './explore-tabs'

vi.mock('@/components/ui/tabs', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  const TabContext = React.createContext<{ value: string; setValue: (value: string) => void } | null>(null)

  return {
    Tabs: ({ defaultValue, children }: { defaultValue: string; children: ReactNode }) => {
      const [value, setValue] = React.useState(defaultValue)
      return <TabContext.Provider value={{ value, setValue }}><div data-slot="tabs">{children}</div></TabContext.Provider>
    },
    TabsList: ({ children }: { children: ReactNode }) => <div data-slot="tabs-list">{children}</div>,
    TabsTrigger: ({ value, children }: { value: string; children: ReactNode }) => {
      const context = React.useContext(TabContext)
      return <button type="button" onClick={() => context?.setValue(value)}>{children}</button>
    },
    TabsContent: ({ value, children }: { value: string; children: ReactNode }) => {
      const context = React.useContext(TabContext)
      return context?.value === value ? <section data-tab={value}>{children}</section> : null
    },
  }
})

vi.mock('@/components/ui/select', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  const SelectContext = React.createContext<{ onValueChange?: (value: string) => void } | null>(null)

  return {
    Select: ({
      children,
      onValueChange,
      value,
    }: {
      children: ReactNode
      onValueChange?: (value: string) => void
      value?: string
    }) => (
      <SelectContext.Provider value={{ onValueChange }}>
        <div data-slot="select" data-value={value}>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children }: { children: ReactNode }) => <div data-slot="select-trigger">{children}</div>,
    SelectValue: () => <span data-slot="select-value" />,
    SelectContent: ({ children }: { children: ReactNode }) => <div data-slot="select-content">{children}</div>,
    SelectGroup: ({ children }: { children: ReactNode }) => <div data-slot="select-group">{children}</div>,
    SelectItem: ({ value, children }: { value: string; children: ReactNode }) => {
      const context = React.useContext(SelectContext)
      return <button type="button" onClick={() => context?.onValueChange?.(value)}>{children}</button>
    },
  }
})

vi.mock('@/components/gen-ui/finding-cards', () => ({
  FindingCards: ({ data }: { data: Array<{ title: string }> }) => (
    <div data-testid="finding-cards" data-count={data.length}>
      {data.map((item) => <span key={item.title}>{item.title}</span>)}
    </div>
  ),
}))

vi.mock('@/components/gen-ui/pattern-list', () => ({
  PatternList: ({ data }: { data: Array<{ theme: string }> }) => (
    <div data-testid="pattern-list">{data.map((item) => item.theme).join(',')}</div>
  ),
}))

vi.mock('@/components/gen-ui/source-table', () => ({
  SourceTable: ({ data }: { data: Array<{ url_domain: string }> }) => (
    <div data-testid="source-table">{data.map((item) => item.url_domain).join(',')}</div>
  ),
}))

vi.mock('@/components/gen-ui/skill-cards', () => ({
  SkillCards: ({ data }: { data: Array<{ title: string }> }) => (
    <div data-testid="skill-cards">{data.map((item) => item.title).join(',')}</div>
  ),
}))

vi.mock('@/components/gen-ui/health-dashboard', () => ({
  HealthDashboard: ({ data }: { data: { pipeline_runs?: unknown[] } | null }) => (
    <div data-testid="health-dashboard">{data?.pipeline_runs?.length ?? 0}</div>
  ),
}))

const makeFinding = (id: number, title = `Finding ${id}`) => ({
  id,
  title,
  summary: `Summary ${id}`,
  importance: id % 2 ? 'high' : 'medium',
  run_date: id % 2 ? '2026-07-02' : '2026-07-01',
  agent: id % 2 ? 'news-researcher' : 'agents-researcher',
  source_name: 'Source',
  source_url: `https://example.com/${id}`,
})

function response(data: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: vi.fn().mockResolvedValue(data),
  }
}

async function advanceDebounce() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350))
  })
}

describe('ExploreTabs', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('searches after debounce and shows result, empty, and error states', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      const query = url.searchParams.get('q')
      if (query === 'broken') throw new Error('Search failed')
      if (query === 'none') return response([])
      return response([makeFinding(1, 'Search Result')])
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<ExploreTabs />)
    expect(screen.getByText('[NO RECORDS FOUND]')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('SEARCH ALL FINDINGS...'), {
      target: { value: 'agents' },
    })
    await advanceDebounce()
    expect(await screen.findByText('Search Result')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/proxy/search?q=agents'))

    fireEvent.change(screen.getByPlaceholderText('SEARCH ALL FINDINGS...'), {
      target: { value: 'none' },
    })
    await advanceDebounce()
    expect(await screen.findByText('No results match your query')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('SEARCH ALL FINDINGS...'), {
      target: { value: 'broken' },
    })
    await advanceDebounce()
    expect(await screen.findByText('[ERROR] Search failed')).toBeInTheDocument()
  })

  it('loads findings, paginates, and refetches when filters change', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      if (url.searchParams.has('date')) return response([makeFinding(30, 'Date Filtered')])
      if (url.searchParams.has('importance')) return response([makeFinding(20, 'Importance Filtered')])
      if (url.searchParams.has('agent')) return response([makeFinding(10, 'Agent Filtered')])
      return response(Array.from({ length: 25 }, (_, index) => makeFinding(index + 1)))
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<ExploreTabs />)
    fireEvent.click(screen.getByRole('button', { name: /Findings/ }))

    expect(await screen.findByText('Finding 1')).toBeInTheDocument()
    expect(screen.getByTestId('finding-cards')).toHaveAttribute('data-count', '20')
    fireEvent.click(screen.getByRole('button', { name: /Load more \(5 remaining\)/ }))
    expect(screen.getByTestId('finding-cards')).toHaveAttribute('data-count', '25')

    fireEvent.click(screen.getByRole('button', { name: 'news' }))
    expect(await screen.findByText('Agent Filtered')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('agent=news-researcher')))

    fireEvent.click(screen.getByRole('button', { name: 'High' }))
    expect(await screen.findByText('Importance Filtered')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('importance=high')))

    fireEvent.click(screen.getByRole('button', { name: '2026-07-01' }))
    expect(await screen.findByText('Date Filtered')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('date=2026-07-01')))
  })

  it('loads source, pattern, skill, health, and static system tabs', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      const path = url.pathname.replace('/api/proxy/', '')
      if (path === 'sources') {
        return response([
          { url_domain: 'low.example', display_name: 'Low', high_value_count: 1, hit_count: 5 },
          { url_domain: 'high.example', display_name: 'High', high_value_count: 5, hit_count: 5 },
        ])
      }
      if (path === 'patterns') return response([{ theme: 'Agent routing' }])
      if (path === 'skill-domains') return response(['agents', '', 'browser'])
      if (path === 'skills/search') return response([{ title: 'Search skill' }])
      if (path === 'skills') {
        return response(url.searchParams.get('domain') === 'browser' ? [{ title: 'Browser skill' }] : [{ title: 'Default skill' }])
      }
      if (path === 'health') return response({ pipeline_runs: [{ run_date: '2026-07-02' }] })
      return response([])
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<ExploreTabs />)
    fireEvent.click(screen.getByRole('button', { name: /Sources/ }))
    expect(await screen.findByTestId('source-table')).toHaveTextContent('high.example,low.example')

    fireEvent.click(screen.getByRole('button', { name: /Patterns/ }))
    expect(await screen.findByTestId('pattern-list')).toHaveTextContent('Agent routing')

    fireEvent.click(screen.getByRole('button', { name: /Skills/ }))
    expect(await screen.findByTestId('skill-cards')).toHaveTextContent('Default skill')
    fireEvent.click(screen.getByRole('button', { name: 'browser' }))
    expect(await screen.findByTestId('skill-cards')).toHaveTextContent('Browser skill')
    fireEvent.change(screen.getByPlaceholderText('SEARCH SKILLS...'), { target: { value: 'search' } })
    await advanceDebounce()
    expect(await screen.findByTestId('skill-cards')).toHaveTextContent('Search skill')

    fireEvent.click(screen.getByRole('button', { name: /Health/ }))
    expect(await screen.findByTestId('health-dashboard')).toHaveTextContent('1')

    fireEvent.click(screen.getByRole('button', { name: /System/ }))
    expect(screen.getByText('System Architecture')).toBeInTheDocument()
    expect(screen.getByText('news-researcher')).toBeInTheDocument()
    expect(screen.getByText('finding_embeddings')).toBeInTheDocument()
  })

  it('shows empty and error states for data tabs', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      const path = url.pathname.replace('/api/proxy/', '')
      if (path === 'findings') return response([])
      if (path === 'sources') return response([], { ok: false, status: 503 })
      if (path === 'patterns') return response([])
      if (path === 'skill-domains') throw new Error('ignored')
      if (path === 'skills') return response([])
      if (path === 'health') throw new Error('Health failed')
      return response([])
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<ExploreTabs />)
    fireEvent.click(screen.getByRole('button', { name: /Findings/ }))
    expect(await screen.findByText('No findings match your filters')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Sources/ }))
    expect(await screen.findByText('[ERROR] Fetch failed: 503')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Patterns/ }))
    expect(await screen.findByText('No patterns detected yet')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Skills/ }))
    expect(await screen.findByText('No skills found')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Health/ }))
    expect(await screen.findByText('[ERROR] Health failed')).toBeInTheDocument()
  })

  it('shows error states for findings, patterns, skills list, and skill search', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      const path = url.pathname.replace('/api/proxy/', '')
      if (path === 'findings') throw new Error('Findings failed')
      if (path === 'patterns') throw new Error('Patterns failed')
      if (path === 'skill-domains') return response(['agents'])
      if (path === 'skills/search') throw new Error('Skill search failed')
      if (path === 'skills') throw new Error('Skills failed')
      return response([])
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<ExploreTabs />)
    fireEvent.click(screen.getByRole('button', { name: /Findings/ }))
    expect(await screen.findByText('[ERROR] Findings failed')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Patterns/ }))
    expect(await screen.findByText('[ERROR] Patterns failed')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Skills/ }))
    expect(await screen.findByText('[ERROR] Skills failed')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('SEARCH SKILLS...'), { target: { value: 'bad' } })
    await advanceDebounce()
    expect(await screen.findByText('[ERROR] Skill search failed')).toBeInTheDocument()
  })
})
