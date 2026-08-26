import { describe, expect, it, vi, beforeEach } from 'vitest'

const imageResponseMock = vi.hoisted(() =>
  vi.fn(function ImageResponse(node: React.ReactNode, options: Record<string, unknown>) {
    return { node, options }
  }),
)

const api = vi.hoisted(() => ({
  getStory: vi.fn(),
}))

vi.mock('next/og', () => ({
  ImageResponse: imageResponseMock,
}))

// backendOutcome and the typed errors stay real: the route's three-way split
// between loaded, missing, and unavailable runs through them.
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getStory: api.getStory,
}))

describe('metadata and image routes', () => {
  beforeEach(() => {
    imageResponseMock.mockClear()
    api.getStory.mockReset()
  })

  it('returns the web app manifest', async () => {
    const { default: manifest } = await import('./manifest')

    expect(manifest()).toMatchObject({
      name: 'MindPattern',
      short_name: 'MindPattern',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ffffff',
      icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
    })
  })

  it('builds the default Open Graph image response', async () => {
    const image = await import('./opengraph-image')

    expect(image.size).toEqual({ width: 1200, height: 630 })
    expect(image.contentType).toBe('image/png')
    expect(image.alt).toBe('MindPattern - AI Research Intelligence')
    expect(image.default()).toEqual({
      node: expect.any(Object),
      options: { width: 1200, height: 630 },
    })
  })

  it('builds story Open Graph images from story data and fallbacks', async () => {
    const route = await import('./og/story/[slug]/route')
    api.getStory.mockResolvedValueOnce({
      title: 'A very long story title '.repeat(8),
      section_id: 'models',
      issue_date: '2026-07-02',
    })

    expect(route.revalidate).toBe(3600)
    await expect(
      route.GET(new Request('https://mindpattern.ai/og/story/story-one'), {
        params: Promise.resolve({ slug: 'story-one' }),
      }),
    ).resolves.toEqual({
      node: expect.any(Object),
      // socialImageResponse also sets the CDN cache headers; the size is what
      // this test is about.
      options: expect.objectContaining({ width: 1200, height: 630 }),
    })
    expect(api.getStory).toHaveBeenCalledWith('story-one')

    const { BackendError } = await import('@/lib/api')
    api.getStory.mockRejectedValueOnce(BackendError.timeout('/api/stories/missing'))
    await expect(
      route.GET(new Request('https://mindpattern.ai/og/story/missing'), {
        params: Promise.resolve({ slug: 'missing' }),
      }),
    ).resolves.toEqual({
      node: expect.any(Object),
      options: expect.objectContaining({ width: 1200, height: 630, status: 503 }),
    })
    expect(imageResponseMock).toHaveBeenCalledTimes(2)
  })
})
