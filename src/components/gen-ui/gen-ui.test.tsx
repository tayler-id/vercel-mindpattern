import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FindingCards } from './finding-cards'
import { HealthDashboard } from './health-dashboard'
import { PatternList } from './pattern-list'
import { SkillCards } from './skill-cards'
import { SourceTable } from './source-table'

const finding = {
  id: 1,
  title: 'Agent finding',
  summary: 'Useful finding summary',
  importance: 'high',
  run_date: '2026-07-02',
  agent: 'news-researcher',
  source_name: 'Source One',
  source_url: 'https://example.com/story',
  similarity: 0.87,
}

describe('gen-ui components', () => {
  it('renders empty states for absent data', () => {
    const { container } = render(
      <>
        <FindingCards data={[]} />
        <PatternList data={[]} />
        <SkillCards data={[]} />
        <SourceTable data={[]} />
        <HealthDashboard data={null} />
      </>,
    )

    expect(screen.getByText('[NO FINDINGS ON FILE]')).toBeInTheDocument()
    expect(screen.getByText('[NO PATTERNS DETECTED]')).toBeInTheDocument()
    expect(screen.getByText('[NO SKILLS ON FILE]')).toBeInTheDocument()
    expect(screen.getByText('[NO SOURCES ON FILE]')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('Quality Score')
  })

  it('renders finding cards with links, badges, limits, and source fallback text', () => {
    const { rerender } = render(
      <FindingCards
        data={[
          finding,
          { ...finding, id: 2, title: 'Unlinked finding', importance: 'unknown', source_url: '', source_name: 'Source Two', similarity: undefined },
        ]}
        limit={1}
      />,
    )

    expect(screen.getByRole('link', { name: 'Agent finding' })).toHaveAttribute('href', 'https://example.com/story')
    expect(screen.getByText('87%')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('news')).toBeInTheDocument()
    expect(screen.queryByText('Unlinked finding')).not.toBeInTheDocument()

    rerender(
      <FindingCards
        data={[
          { ...finding, id: 2, title: 'Unlinked finding', importance: 'unknown', source_url: '', source_name: 'Source Two', similarity: undefined },
        ]}
      />,
    )
    expect(screen.getByText('Unlinked finding')).toBeInTheDocument()
    expect(screen.getByText('Source Two')).toBeInTheDocument()
    expect(screen.getByText('unknown')).toBeInTheDocument()
  })

  it('renders pattern strength and day spans', () => {
    render(
      <PatternList
        data={[
          {
            theme: 'Model routing',
            description: 'Repeated routing pattern',
            recurrence_count: 3,
            first_seen: '2026-07-01',
            last_seen: '2026-07-04',
          },
        ]}
      />,
    )

    expect(screen.getByText('Model routing')).toBeInTheDocument()
    expect(screen.getByText('Repeated routing pattern')).toBeInTheDocument()
    expect(screen.getByText('3x')).toBeInTheDocument()
    expect(screen.getByText('3d')).toBeInTheDocument()
  })

  it('renders skill cards and toggles steps', () => {
    const { rerender } = render(
      <SkillCards
        data={[
          {
            id: 1,
            title: 'Prompt routing',
            description: 'Route prompts by task type',
            difficulty: 'advanced',
            domain: 'agents',
            run_date: '2026-07-02',
            source_name: 'Guide',
            source_url: 'https://example.com/guide',
            steps: '1. Detect intent\n2. Route',
            similarity: 0.92,
          },
          {
            id: 2,
            title: 'No source skill',
            description: 'Skill without URL',
            difficulty: 'unknown',
            domain: 'ops',
            run_date: '2026-07-02',
            source_name: 'Note',
          },
        ]}
        limit={1}
      />,
    )

    expect(screen.getByRole('link', { name: 'Prompt routing' })).toHaveAttribute('href', 'https://example.com/guide')
    expect(screen.getByText(/92% match/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Show steps/ }))
    expect(screen.getByText(/Detect intent/)).toBeInTheDocument()
    expect(screen.queryByText('No source skill')).not.toBeInTheDocument()

    rerender(
      <SkillCards
        data={[
          {
            id: 2,
            title: 'No source skill',
            description: 'Skill without URL',
            difficulty: 'unknown',
            domain: 'ops',
            run_date: '2026-07-02',
            source_name: 'Note',
          },
        ]}
      />,
    )
    expect(screen.getByText('No source skill')).toBeInTheDocument()
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Show steps/ })).not.toBeInTheDocument()
  })

  it('renders source table quality states', () => {
    render(
      <SourceTable
        data={[
          { url_domain: 'good.example', display_name: 'Good Source', high_value_count: 8, hit_count: 10, last_seen: '2026-07-02' },
          { url_domain: 'mid.example', high_value_count: 3, hit_count: 10, last_seen: '2026-07-01' },
          { url_domain: 'zero.example', high_value_count: 0, hit_count: 0, last_seen: '2026-06-30' },
        ]}
      />,
    )

    expect(screen.getByText('Top sources by high-value findings')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Good Source' })).toHaveAttribute('href', 'https://good.example')
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders health dashboard metrics, trend, agent activity, and recent errors', () => {
    render(
      <HealthDashboard
        data={{
          pipeline_runs: [
            { run_date: '2026-07-01', overall_score: 0.7, total_findings: 10, unique_sources: 4, high_value_count: 2 },
            { run_date: '2026-07-02', overall_score: 0.8, total_findings: 12, unique_sources: 5, high_value_count: 3 },
          ],
          agent_stats: [
            { agent: 'news-researcher', note_type: 'success', count: 5 },
            { agent: 'news-researcher', note_type: 'warning', count: 1 },
            { agent: 'agents-researcher', note_type: 'error', count: 2 },
          ],
          approval_summary: { pending: 2, decided: 7 },
          recent_errors: [
            { note_type: 'error', agent: 'news-researcher', run_date: '2026-07-02', content: 'Failed to fetch source' },
            { note_type: 'warning', agent: 'agents-researcher', run_date: '2026-07-01', content: 'Low confidence' },
          ],
        }}
      />,
    )

    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('+10% from prev')).toBeInTheDocument()
    expect(screen.getByText('Pipeline quality trend')).toBeInTheDocument()
    expect(screen.getByText('Daily findings volume')).toBeInTheDocument()
    expect(screen.getByText('Agent activity')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch source')).toBeInTheDocument()
  })
})
