import { beforeEach, describe, expect, it, vi } from 'vitest'

const backendFetch = vi.fn()

vi.mock('./api', () => ({
  backendFetch,
}))

describe('mcpTools', () => {
  beforeEach(() => {
    backendFetch.mockReset()
  })

  it('wires each tool to the expected backend request', async () => {
    backendFetch.mockResolvedValue({ ok: true })
    const { mcpTools } = await import('./mcp-tools')

    await mcpTools.search_findings.execute({ query: 'agents', limit: 3 })
    await mcpTools.list_findings.execute({ agent: 'news-researcher', importance: 'high', date: '2026-07-02' })
    await mcpTools.list_findings.execute({})
    await mcpTools.get_stats.execute()
    await mcpTools.get_patterns.execute()
    await mcpTools.get_sources.execute()
    await mcpTools.search_skills.execute({ query: 'testing', limit: 2 })
    await mcpTools.list_skills.execute({ domain: 'agent-patterns' })
    await mcpTools.list_skills.execute({})
    await mcpTools.get_health.execute()
    await mcpTools.list_reports.execute()
    await mcpTools.read_report.execute({ date: '2026-07-02' })
    await mcpTools.search_reports.execute({ query: 'OpenAI', limit: 4 })

    expect(backendFetch.mock.calls).toEqual([
      ['/api/search', { q: 'agents', limit: '3', user: 'ramsay' }],
      ['/api/findings', { user: 'ramsay', agent: 'news-researcher', importance: 'high', date: '2026-07-02' }],
      ['/api/findings', { user: 'ramsay' }],
      ['/api/stats', { user: 'ramsay' }],
      ['/api/patterns', { user: 'ramsay' }],
      ['/api/sources', { user: 'ramsay' }],
      ['/api/skills/search', { q: 'testing', limit: '2', user: 'ramsay' }],
      ['/api/skills', { user: 'ramsay', domain: 'agent-patterns' }],
      ['/api/skills', { user: 'ramsay' }],
      ['/api/health', { user: 'ramsay' }],
      ['/api/reports', { user: 'ramsay' }],
      ['/api/reports/2026-07-02', { user: 'ramsay' }],
      ['/api/reports/search', { q: 'OpenAI', limit: '4', user: 'ramsay' }],
    ])
  })

  it('returns a structured error instead of throwing when backend requests fail', async () => {
    backendFetch.mockRejectedValue(new Error('offline'))
    const { mcpTools } = await import('./mcp-tools')

    await expect(mcpTools.get_stats.execute()).resolves.toEqual({
      error: 'Failed to fetch /api/stats: offline',
    })
  })

  it('stringifies non-Error backend failures', async () => {
    backendFetch.mockRejectedValue('offline')
    const { mcpTools } = await import('./mcp-tools')

    await expect(mcpTools.get_health.execute()).resolves.toEqual({
      error: 'Failed to fetch /api/health: offline',
    })
  })

  it('exports Zod schemas for tool inputs', async () => {
    const { mcpTools } = await import('./mcp-tools')

    expect(mcpTools.search_findings.inputSchema.parse({ query: 'ai' })).toEqual({
      query: 'ai',
      limit: 10,
    })
    expect(mcpTools.list_findings.inputSchema.parse({ importance: 'low' })).toEqual({
      importance: 'low',
    })
    expect(mcpTools.get_stats.inputSchema.parse({})).toEqual({})
  })
})
