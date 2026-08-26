import type { Metadata } from 'next'
import { describe, expect, it, vi } from 'vitest'
import { SITE_TITLE } from '@/lib/site'

/** The card src/app/opengraph-image.tsx contributes through the file convention. */
const SITE_CARD = { url: '/opengraph-image', width: 1200, height: 630, type: 'image/png' }

vi.mock('next/font/google', () => ({
  Archivo: () => ({ variable: 'font-archivo' }),
  IBM_Plex_Mono: () => ({ variable: 'font-plex-mono' }),
  Source_Serif_4: () => ({ variable: 'font-source-serif' }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@vercel/analytics/next', () => ({ Analytics: () => null }))
vi.mock('@/components/analytics/page-view', () => ({ PageViewTracker: () => null }))
vi.mock('@/components/analytics/web-vitals', () => ({ WebVitalsTracker: () => null }))
vi.mock('@/components/search/search-hotkey', () => ({ SearchHotkey: () => null }))
vi.mock('@/components/explore/explore-tabs', () => ({ ExploreTabs: () => null }))
vi.mock('@/components/blog-search', () => ({ BlogSearch: () => null }))
vi.mock('@/components/newsletter-signup', () => ({ NewsletterSignup: () => null }))
vi.mock('@/components/consult/inquiry-form', () => ({ InquiryForm: () => null }))
vi.mock('@/components/briefing/audio-briefing-player', () => ({
  AudioBriefingPlayer: () => null,
}))

type CardFields = {
  card?: string
  title?: unknown
  description?: unknown
  images?: unknown
}

const asCard = (value: unknown): CardFields => (value ?? {}) as CardFields

/** The image URLs a resolved openGraph or twitter block would emit. */
function imageUrls(block: unknown): string[] {
  const images = asCard(block).images
  if (!images) return []
  return (Array.isArray(images) ? images : [images]).map((image) =>
    typeof image === 'string' ? image : String((image as { url?: unknown }).url ?? ''),
  )
}

/**
 * The slice of Next's metadata resolution this file is about, ported from
 * `mergeStaticMetadata` and `postProcessMetadata` in
 * next/dist/lib/metadata/resolve-metadata.js.
 *
 * Three rules, in order. A page-level twitter or openGraph object replaces the
 * inherited one whole rather than merging into it. Then, at each level that
 * does not declare `images` of its own, the file-convention card is merged in,
 * which is why the root blocks now declare none. Then the twitter fields the
 * page left unset are filled from the resolved openGraph, then from the page's
 * own title and description.
 *
 * The `images` checks use hasOwnProperty exactly as Next does, so declaring
 * `images: undefined` behaves here the way it behaves in production. Next also
 * runs the resolved title through the layout's title template, which this
 * helper skips: what matters is which page the title came from, not the suffix.
 */
function resolveTwitter(root: Metadata, page: Metadata): CardFields {
  const og: CardFields = { ...asCard(page.openGraph ?? root.openGraph) }
  const level = page.openGraph ?? root.openGraph
  if (!Object.prototype.hasOwnProperty.call(level ?? {}, 'images')) og.images = [SITE_CARD]

  const twitter: CardFields = { ...asCard(page.twitter ?? root.twitter) }
  if (twitter.title === undefined) twitter.title = og.title ?? page.title ?? root.title
  if (twitter.description === undefined) twitter.description = og.description ?? page.description
  const twLevel = page.twitter ?? root.twitter
  const hasTwImages = Boolean(
    Object.prototype.hasOwnProperty.call(twLevel ?? {}, 'images') && twitter.images,
  )
  if (!hasTwImages) twitter.images = og.images
  return twitter
}

const loadRoot = async () => (await import('./layout')).metadata

describe('social card metadata', () => {
  it('defaults the root card to a large image', async () => {
    const root = await loadRoot()

    expect(asCard(root.twitter).card).toBe('summary_large_image')
  })

  it('declares no images in either root block, so the file convention supplies them', async () => {
    // Declaring images here suppressed src/app/opengraph-image.tsx, which costs
    // the ?hash cache-buster crawlers need after the art changes and
    // og:image:type. It also shadowed a page's own card in twitter.
    const root = await loadRoot()

    expect(Object.prototype.hasOwnProperty.call(root.openGraph ?? {}, 'images')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(root.twitter ?? {}, 'images')).toBe(false)
  })

  it('keeps page-specific values out of the root blocks, which pages inherit whole', async () => {
    const root = await loadRoot()

    // A title or description here is served on every page that sets no block
    // of its own, which is how /briefings came to claim the site title.
    expect(asCard(root.twitter).title).toBeUndefined()
    expect(asCard(root.twitter).description).toBeUndefined()
    expect(asCard(root.openGraph).title).toBeUndefined()
    expect(asCard(root.openGraph).description).toBeUndefined()
    // A canonical or og:url of '/' is inherited by six route families, which
    // told Google /briefings was a duplicate of the homepage.
    expect(root.alternates?.canonical).toBeUndefined()
    expect((root.openGraph as { url?: unknown } | undefined)?.url).toBeUndefined()
  })

  it('gives a page with its own card that card, not the site one', async () => {
    // The bug this guards: root twitter.images shadowing a page's own image, so
    // og:image was the story card and twitter:image the generic site card.
    const root = await loadRoot()
    const page: Metadata = { openGraph: { images: [{ url: '/og/story/one.png' }] } }

    expect(imageUrls(resolveTwitter(root, page))).toEqual(['/og/story/one.png'])
  })

  it.each([
    ['explore', () => import('./(explore)/explore/page'), 'AI Research Archive'],
    ['blog', () => import('./(blog)/blog/page'), 'Daily AI Research Briefing Archive'],
    ['work', () => import('./(app)/work/page'), 'Work with me: AI workflows and agentic systems'],
  ])('gives /%s its own large card with an image', async (_name, load, title) => {
    const root = await loadRoot()
    const { metadata } = await load()

    expect(imageUrls(metadata.openGraph)).toEqual(['/opengraph-image'])
    expect(asCard(metadata.twitter).card).toBe('summary_large_image')
    expect(imageUrls(metadata.twitter)).toEqual(['/opengraph-image'])

    const resolved = resolveTwitter(root, metadata)
    expect(resolved.card).toBe('summary_large_image')
    expect(resolved.title).toBe(title)
    expect(imageUrls(resolved)).toEqual(['/opengraph-image'])
  })

  it('resolves a page with no twitter block to a large card and its own title', async () => {
    const root = await loadRoot()
    const { metadata } = await import('./(app)/briefings/page')

    expect(metadata.twitter).toBeUndefined()

    const resolved = resolveTwitter(root, metadata)
    expect(resolved.card).toBe('summary_large_image')
    expect(resolved.title).toBe('Briefings')
    expect(resolved.title).not.toBe(SITE_TITLE)
    expect(resolved.description).toBe(metadata.description)
    expect(imageUrls(resolved)).toEqual(['/opengraph-image'])
  })

  it('gives every route family its own canonical, since the root no longer lends one', async () => {
    const pages = await Promise.all([
      import('./(app)/briefings/page'),
      import('./(explore)/explore/page'),
      import('./(blog)/blog/page'),
      import('./(app)/work/page'),
    ])

    expect(pages.map((page) => page.metadata.alternates?.canonical)).toEqual([
      '/briefings',
      '/explore',
      '/blog',
      '/work',
    ])
  })
})
