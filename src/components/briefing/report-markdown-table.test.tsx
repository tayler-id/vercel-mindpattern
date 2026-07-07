import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-markdown', () => ({
  default: ({ components }: { components: Record<string, (props: { children: React.ReactNode }) => React.ReactNode> }) => (
    <>{components.table({ children: <tbody><tr><td>Table body</td></tr></tbody> })}</>
  ),
}))

vi.mock('remark-gfm', () => ({
  default: {},
}))

describe('ReportMarkdown table renderer', () => {
  it('wraps rendered markdown tables for horizontal overflow', async () => {
    const { ReportMarkdown } = await import('./report-markdown')

    render(<ReportMarkdown content="table" />)

    expect(screen.getByText('Table body').closest('table')).toHaveAttribute('data-streamdown', 'table')
  })
})
