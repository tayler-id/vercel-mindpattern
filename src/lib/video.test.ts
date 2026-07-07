import { describe, expect, it } from 'vitest'
import { youtubeId } from './video'

describe('youtubeId', () => {
  it('returns null for empty or non-YouTube URLs', () => {
    expect(youtubeId(null)).toBeNull()
    expect(youtubeId(undefined)).toBeNull()
    expect(youtubeId('https://example.com/watch?v=abcdefghijk')).toBeNull()
  })

  it('extracts IDs from common YouTube URL shapes', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=abcDEF_1234')).toBe('abcDEF_1234')
    expect(youtubeId('https://youtube.com/embed/abcDEF_1234')).toBe('abcDEF_1234')
    expect(youtubeId('https://youtube.com/shorts/abcDEF_1234')).toBe('abcDEF_1234')
    expect(youtubeId('https://youtu.be/abcDEF_1234')).toBe('abcDEF_1234')
  })
})
