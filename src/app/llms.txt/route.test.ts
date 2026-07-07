import { beforeEach, describe, expect, it, vi } from 'vitest'

const getStories = vi.fn()

vi.mock('@/lib/api', () => ({
  getStories,
}))

describe('llms.txt route', () => {
  beforeEach(() => {
    getStories.mockReset()
  })

  it('serves current story links for AI agents', async () => {
    getStories.mockResolvedValue({
      total: 1234,
      items: [
        {
          title: 'First story',
          slug: 'first-story',
          summary: 'A useful summary',
        },
        {
          title: 'Second story',
          slug: 'second-story',
          summary: null,
        },
      ],
    })
    const { GET, revalidate } = await import('./route')

    const response = await GET()
    const body = await response.text()

    expect(revalidate).toBe(3600)
    expect(getStories).toHaveBeenCalledWith({ limit: 50 })
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600')
    expect(body).toContain('1,234 source-backed stories')
    expect(body).toContain('- [First story](https://mindpattern.ai/s/first-story): A useful summary')
    expect(body).toContain('- [Second story](https://mindpattern.ai/s/second-story): ')
  })

  it('falls back to the Wire link when stories cannot be fetched', async () => {
    getStories.mockRejectedValue(new Error('backend down'))
    const { GET } = await import('./route')

    const body = await (await GET()).text()

    expect(body).toContain('0 source-backed stories')
    expect(body).toContain('- [The Wire](https://mindpattern.ai/): latest stories')
  })
})
