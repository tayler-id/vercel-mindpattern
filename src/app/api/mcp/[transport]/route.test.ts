import { describe, expect, it, vi } from 'vitest'

describe('MCP route', () => {
  it('returns streamable HTTP server metadata', async () => {
    vi.resetModules()
    vi.stubEnv('BACKEND_API_URL', 'https://backend.test')
    const { GET } = await import('./route')

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      mcp_server: 'https://backend.test/mcp',
      transport: 'streamable-http',
      tools: [
        'search_findings',
        'list_findings',
        'get_stats',
        'get_patterns',
        'get_sources',
        'search_skills',
        'list_skills',
        'get_health',
        'list_reports',
        'read_report',
        'search_reports',
      ],
    })
  })
})
