import { ImageResponse } from 'next/og'
import { SITE_TITLE } from '@/lib/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = SITE_TITLE

export default function OgImage() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 999, background: '#e63b12' }} />
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2, color: '#0e0e0f' }}>
            MINDPATTERN
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 110, fontWeight: 800, color: '#0e0e0f', lineHeight: 1 }}>
            The Wire
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: '#55555a' }}>
            15,000+ findings · daily briefings · source-backed stories
          </div>
        </div>
        <div style={{ display: 'flex', height: 14, background: '#0e0e0f' }} />
      </div>
    ),
    size,
  )
}
