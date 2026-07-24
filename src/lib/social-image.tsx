import { ImageResponse } from 'next/og'

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 }

const FALLBACK_TITLE = 'MindPattern — AI Research Intelligence'
const INK = '#0e0e0f'

function titleSize(title: string): number {
  if (title.length > 125) return 44
  if (title.length > 90) return 50
  if (title.length > 60) return 58
  return 66
}

/**
 * Shared social-card renderer for public stories and findings.
 *
 * The long-lived CDN response keeps social crawlers off the content API after
 * the first render. `stale-while-revalidate` means an expired card remains
 * available while Vercel refreshes it in the background.
 */
export function socialImageResponse({
  title,
  kicker,
  accent = INK,
}: {
  title?: string | null
  kicker?: string | null
  accent?: string | null
}) {
  const displayTitle = (title?.trim() || FALLBACK_TITLE).slice(0, 160)
  const displayKicker = kicker?.trim().toUpperCase().slice(0, 80) || ''
  const color = accent || INK

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          background: '#ffffff',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexShrink: 0,
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
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
              fontSize: 28,
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
            width: '100%',
            flexShrink: 0,
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {displayKicker ? (
            <div
              style={{
                display: 'flex',
                marginBottom: 20,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 3,
                color,
              }}
            >
              {displayKicker}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              maxHeight: 310,
              overflow: 'hidden',
              fontSize: titleSize(displayTitle),
              fontWeight: 800,
              letterSpacing: -1,
              lineHeight: 1.06,
              color: INK,
            }}
          >
            {displayTitle}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: 12,
            minHeight: 12,
            flexShrink: 0,
            background: color,
          }}
        />
      </div>
    ),
    {
      ...SOCIAL_IMAGE_SIZE,
      headers: {
        'Cache-Control':
          'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}
