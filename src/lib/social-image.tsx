import { ImageResponse } from 'next/og'
import { SITE_TITLE } from '@/lib/site'

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 }

const FALLBACK_TITLE = SITE_TITLE
const INK = '#0e0e0f'
const MUTED = '#55555a'
const HAIRLINE = '#dcdcd8'
const SITE_HOST = 'mindpattern.ai'

/**
 * Cache header for a card drawn from real content.
 *
 * It says what the page says, so it can sit in the CDN for a day and refresh
 * in the background. `stale-while-revalidate` keeps an expired card available
 * while Vercel re-renders it, which keeps crawlers off the content API.
 */
export const CONTENT_CACHE_CONTROL =
  'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'

/**
 * Cache header for a card the backend could not supply content for.
 *
 * Measured on 2026-08-23: a story slug and the slug "zzz-not-a-real-slug-12345"
 * returned byte-identical cards, both under the header above. One 10s backend
 * timeout therefore pinned the generic card on the CDN for a day, and every
 * crawler that came by copied that image into its own cache, where it lives far
 * longer than we control.
 *
 * A short negative TTL rather than `no-store`, because the misses are the
 * expensive path: a card that is not in the CDN runs a detail fetch against the
 * box that is already failing its health check, and `/og/briefing/<today>`
 * before the 7 AM run publishes is a routine, linked URL. Sixty seconds gets
 * the real card in front of the next crawl while keeping repeat misses off Fly.
 */
export const FALLBACK_CACHE_CONTROL =
  'public, max-age=0, s-maxage=60, stale-while-revalidate=300'

/**
 * HTTP status for a card the backend never answered for.
 *
 * A 200 with the generic art is the worst outcome: Bluesky, X, LinkedIn and
 * Slack cache an unfurl per URL and rarely re-scrape, so the wrong image sticks
 * to a real story for good. A non-200 makes the crawler fall back to the text
 * card and try again later.
 */
export const UNAVAILABLE_STATUS = 503

/** Status for a card whose record the backend genuinely does not have. */
export const NOT_FOUND_STATUS = 404

/**
 * Port of the pipeline's prose gate (orchestrator/prose_gate.py) for card text.
 *
 * The newsletter is stripped of em-dashes before publishing, but a card title
 * can arrive from the backend already carrying one. The daily briefing card
 * unfurls as "Ramsay Research Agent, August 13, 2026" only because of this.
 * Sanitizing here covers every caller, including titles this repo never wrote.
 *
 * Same rule as the pipeline, applied per sentence the way `_sanitize_unprotected`
 * does. A pair inside one sentence reads as a parenthetical and becomes commas;
 * a lone one reads as an appositive and becomes a colon (semicolon if that
 * sentence already has a colon, so no sentence gets two). Three or more in one
 * sentence is past where a mechanical rewrite is safe, so those are left alone.
 */
export function dedash(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => {
      const count = (sentence.match(/—/g) ?? []).length
      if (count === 2) return sentence.replace(/\s*—\s*/g, ', ')
      if (count === 1) return sentence.replace(/\s*—\s*/, sentence.includes(':') ? '; ' : ': ')
      return sentence
    })
    .join(' ')
}

function titleSize(title: string): number {
  if (title.length > 125) return 44
  if (title.length > 90) return 50
  if (title.length > 60) return 58
  return 66
}

/**
 * The facts line under the title: date, source domain, source count. Callers
 * pass whatever the record holds and the blanks drop out, so a story with one
 * source and a story with eight both read as a finished line.
 */
export function metaLine(parts: (string | null | undefined)[]): string {
  return parts
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' · ')
}

/**
 * Shared social-card renderer for stories, findings, briefings and wire views.
 *
 * Layout is masthead, headline, facts line, with one neutral hairline above and
 * below the headline block. The topic hue appears in exactly one place, the
 * masthead dot, as a fill. No border, rule, ring or stroke anywhere in the card
 * carries it, and the foot band is neutral ink so a card is never colour-coded
 * by a hue with no legend to decode it.
 *
 * `resolved` decides the cache header and the status. Every call site states it
 * rather than defaulting, because getting it wrong is exactly the bug this
 * function exists to prevent: `true` means the card is showing real copy (the
 * wire views substitute their own share line and still count), `false` means
 * the card fell back to the site title.
 */
export function socialImageResponse({
  title,
  kicker,
  meta,
  accent,
  accentText,
  resolved,
  status,
}: {
  title?: string | null
  kicker?: string | null
  meta?: (string | null | undefined)[]
  accent?: string | null
  accentText?: string | null
  resolved: boolean
  /** Overrides the 200 an unresolved card would otherwise ship under. */
  status?: number
}) {
  const displayTitle = dedash((title?.trim() || FALLBACK_TITLE).slice(0, 160))
  const displayKicker = dedash(kicker?.trim().toUpperCase().slice(0, 80) || '')
  const displayMeta = metaLine(meta ?? []).slice(0, 90)
  const color = accent || INK
  const kickerColor = accentText || MUTED

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            alignSelf: 'stretch',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            padding: '56px 64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignSelf: 'stretch',
              flexShrink: 0,
              alignItems: 'center',
              gap: 16,
              paddingBottom: 22,
              borderBottom: `1px solid ${HAIRLINE}`,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                flexShrink: 0,
                borderRadius: 999,
                background: color,
              }}
            />
            <div
              style={{
                display: 'flex',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 2,
                color: INK,
              }}
            >
              MINDPATTERN
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'stretch',
              flexShrink: 0,
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {displayKicker ? (
              <div
                style={{
                  display: 'flex',
                  marginBottom: 18,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 3,
                  color: kickerColor,
                }}
              >
                {displayKicker}
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                maxHeight: 320,
                overflow: 'hidden',
                // Leading tight enough to read as a headline, loose enough that
                // the clip does not shave the descenders off the last line.
                paddingBottom: 8,
                fontSize: titleSize(displayTitle),
                fontWeight: 800,
                letterSpacing: -1,
                lineHeight: 1.12,
                color: INK,
              }}
            >
              {displayTitle}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'stretch',
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              paddingTop: 20,
              borderTop: `1px solid ${HAIRLINE}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontSize: 24,
                fontWeight: 500,
                color: MUTED,
              }}
            >
              {displayMeta}
            </div>
            <div
              style={{
                display: 'flex',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                fontSize: 24,
                fontWeight: 600,
                color: INK,
              }}
            >
              {SITE_HOST}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: 12,
            minHeight: 12,
            flexShrink: 0,
            background: INK,
          }}
        />
      </div>
    ),
    {
      ...SOCIAL_IMAGE_SIZE,
      status,
      headers: {
        'Cache-Control': resolved ? CONTENT_CACHE_CONTROL : FALLBACK_CACHE_CONTROL,
      },
    },
  )
}
