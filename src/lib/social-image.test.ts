import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONTENT_CACHE_CONTROL,
  FALLBACK_CACHE_CONTROL,
  NOT_FOUND_STATUS,
  UNAVAILABLE_STATUS,
  dedash,
  metaLine,
  socialImageResponse,
} from './social-image'

const imageResponseMock = vi.hoisted(() =>
  vi.fn(function ImageResponse(node: unknown, options: Record<string, unknown>) {
    return { node, options }
  }),
)

vi.mock('next/og', () => ({ ImageResponse: imageResponseMock }))

type Card = { node: unknown; options: { status?: number; headers: Record<string, string> } }

const card = (args: Parameters<typeof socialImageResponse>[0]) =>
  socialImageResponse(args) as unknown as Card

/** Every string the card draws, in order. */
function cardText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(cardText).filter(Boolean).join(' ')
  const props = (node as { props?: { children?: unknown } }).props
  return props ? cardText(props.children) : ''
}

/** Every inline style object in the card. */
function cardStyles(node: unknown): Record<string, unknown>[] {
  if (node == null || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(cardStyles)
  const props = (node as { props?: { style?: Record<string, unknown>; children?: unknown } }).props
  if (!props) return []
  return [...(props.style ? [props.style] : []), ...cardStyles(props.children)]
}

/**
 * Mirrors tests/test_prose_gate.py in the pipeline repo: the site and the
 * newsletter must not disagree about what an em-dash becomes.
 */
describe('dedash', () => {
  it('turns a lone em-dash into a colon', () => {
    expect(dedash('Trending now — reader signal')).toBe('Trending now: reader signal')
  })

  it('uses a semicolon when the line already carries a colon', () => {
    expect(dedash('Ships today: the fix — and the test')).toBe(
      'Ships today: the fix; and the test',
    )
  })

  it('turns a parenthetical pair into commas', () => {
    expect(dedash('The fix — three lines — landed')).toBe('The fix, three lines, landed')
  })

  it('leaves three or more in one sentence alone rather than mangling them', () => {
    const busy = 'a — b — c — d'
    expect(dedash(busy)).toBe(busy)
  })

  it('applies the rule per sentence, the way the pipeline gate does', () => {
    // orchestrator/prose_gate.py splits into sentences first, so two sentences
    // carrying one dash each get a colon apiece, not a pair of commas.
    expect(dedash('The fix — one line. The test — two.')).toBe(
      'The fix: one line. The test: two.',
    )
  })

  it('leaves clean text untouched', () => {
    expect(dedash('No dashes here')).toBe('No dashes here')
  })

  it('absorbs the spacing around the dash instead of doubling it', () => {
    expect(dedash('Ramsay Research Agent — August 13, 2026')).toBe(
      'Ramsay Research Agent: August 13, 2026',
    )
  })
})

describe('metaLine', () => {
  it('joins the facts a card has with a middle dot', () => {
    expect(metaLine(['Aug 13', 'github.com', '6 sources'])).toBe('Aug 13 · github.com · 6 sources')
  })

  it('drops blanks instead of leaving a dangling separator', () => {
    expect(metaLine(['Aug 13', null, '  ', undefined])).toBe('Aug 13')
  })

  it('is empty when the record carried nothing', () => {
    expect(metaLine([])).toBe('')
  })
})

describe('social card cache headers', () => {
  beforeEach(() => imageResponseMock.mockClear())

  it('caches a card drawn from real content for a day', () => {
    const { options } = card({ title: 'Two poisoned LiteLLM releases', resolved: true })

    expect(options.headers['Cache-Control']).toBe(CONTENT_CACHE_CONTROL)
    expect(CONTENT_CACHE_CONTROL).toContain('s-maxage=86400')
  })

  it('holds a fallback card for a minute, not for a day', () => {
    // The measured bug: a 10s backend timeout shipped the generic card under
    // the day-long header, so the wrong image stuck to a real story. A short
    // negative TTL gets the real card in front of the next crawl while keeping
    // repeat misses off a box that is already failing its health check.
    const { options } = card({ title: null, resolved: false })

    expect(options.headers['Cache-Control']).toBe(FALLBACK_CACHE_CONTROL)
    expect(FALLBACK_CACHE_CONTROL).toContain('s-maxage=60')
    expect(FALLBACK_CACHE_CONTROL).not.toContain('no-store')
  })

  it('ships an unavailable card under a status a crawler will retry', () => {
    // Bluesky, X, LinkedIn and Slack cache an unfurl per URL and rarely
    // re-scrape, so a 200 with the generic art pins the wrong image for good.
    const { options } = card({ title: null, resolved: false, status: UNAVAILABLE_STATUS })

    expect(options.status).toBe(503)
    expect(NOT_FOUND_STATUS).toBe(404)
  })

  it('leaves the status alone for a card drawn from real content', () => {
    expect(card({ title: 'A real story', resolved: true }).options.status).toBeUndefined()
  })
})

describe('social card layout', () => {
  beforeEach(() => imageResponseMock.mockClear())

  const full = () =>
    card({
      title: 'Two poisoned LiteLLM releases drained developer credentials',
      kicker: 'Models',
      meta: ['Aug 13', 'github.com', '6 sources'],
      accent: '#e63b12',
      accentText: '#b32d0e',
      resolved: true,
    })

  it('draws the masthead, kicker, title, facts line and site host', () => {
    const text = cardText(full().node)

    expect(text).toContain('MINDPATTERN')
    expect(text).toContain('MODELS')
    expect(text).toContain('Two poisoned LiteLLM releases drained developer credentials')
    expect(text).toContain('Aug 13 · github.com · 6 sources')
    expect(text).toContain('mindpattern.ai')
  })

  it('falls back to the site title and drops the kicker and facts line', () => {
    const text = cardText(card({ title: null, kicker: '', meta: [], resolved: false }).node)

    expect(text).toContain('MindPattern - AI Research Intelligence')
    expect(text).toContain('mindpattern.ai')
    expect(text).not.toContain('·')
  })

  it('shrinks the type as the title grows so it stays inside the card', () => {
    const size = (title: string) =>
      cardStyles(card({ title, resolved: true }).node).find(
        (s) => s.fontWeight === 800 && s.letterSpacing === -1,
      )?.fontSize

    expect(size('Short one')).toBe(66)
    expect(size('t'.repeat(70))).toBe(58)
    expect(size('t'.repeat(100))).toBe(50)
    expect(size('t'.repeat(130))).toBe(44)
  })

  it('spends the topic hue on the masthead dot and nothing else', () => {
    // A hue band across the foot of the card is an accent on a rule, cycled per
    // story with no legend to decode it. The dot carries the topic; the band is
    // neutral ink, matching src/app/opengraph-image.tsx.
    const hue = cardStyles(full().node).filter((s) => Object.values(s).includes('#e63b12'))
    const bands = cardStyles(full().node).filter((s) => s.height === 12)

    expect(hue).toHaveLength(1)
    expect(hue[0]).toMatchObject({ background: '#e63b12', borderRadius: 999 })
    expect(bands).toHaveLength(1)
    expect(bands[0].background).toBe('#0e0e0f')
  })

  it('rules the card with one neutral hairline and never an accent', () => {
    const edges = cardStyles(full().node).flatMap((s) =>
      Object.entries(s)
        .filter(([k]) => /^(border(?!Radius)|outline|stroke|ring)/.test(k))
        .map(([, v]) => String(v)),
    )

    expect(edges).toEqual(['1px solid #dcdcd8', '1px solid #dcdcd8'])
    expect(edges.some((edge) => edge.includes('#e63b12'))).toBe(false)
  })

  it('keeps the title in ink, so a pale topic hue never carries the headline', () => {
    const title = cardStyles(
      card({ title: 'Yellow topic', accent: '#f5c518', resolved: true }).node,
    ).find((s) => s.letterSpacing === -1)

    expect(title?.color).toBe('#0e0e0f')
  })

  it('truncates a runaway title and facts line instead of overflowing the card', () => {
    const text = cardText(
      card({ title: 'x'.repeat(400), meta: [`${'y'.repeat(200)}`], resolved: true }).node,
    )

    expect(text).toContain('x'.repeat(160))
    expect(text).not.toContain('x'.repeat(161))
    expect(text).not.toContain('y'.repeat(91))
  })
})
