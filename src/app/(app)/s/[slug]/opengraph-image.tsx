import { ImageResponse } from 'next/og'
import { getStory } from '@/lib/api'
import { kickerLabel } from '@/lib/topics'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'MindPattern story'

export default async function StoryOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const story = await getStory(slug).catch(() => null)
  const title = story?.title ?? 'MindPattern'
  const kicker = [kickerLabel(story?.section_id), story?.issue_date]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase()
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: '#e63b12' }} />
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2, color: '#0e0e0f' }}>
            MINDPATTERN
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {kicker ? (
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, letterSpacing: 3, color: '#e63b12', marginBottom: 20 }}>
              {kicker}
            </div>
          ) : null}
          <div style={{ fontSize: title.length > 90 ? 52 : 64, fontWeight: 800, color: '#0e0e0f', lineHeight: 1.1 }}>
            {title.slice(0, 160)}
          </div>
        </div>
        <div style={{ display: 'flex', height: 12, background: '#0e0e0f' }} />
      </div>
    ),
    size,
  )
}
