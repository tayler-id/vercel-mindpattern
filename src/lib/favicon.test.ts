import { describe, expect, it } from 'vitest'
import { faviconFor } from './favicon'

describe('faviconFor', () => {
  it('returns null for empty values', () => {
    expect(faviconFor(null)).toBeNull()
    expect(faviconFor(undefined)).toBeNull()
    expect(faviconFor('   ')).toBeNull()
  })

  it('extracts and normalizes a hostname from a URL', () => {
    expect(faviconFor('https://www.example.com/post?id=1')).toBe(
      'https://www.google.com/s2/favicons?domain=example.com&sz=64',
    )
  })

  it('uses a raw domain if URL parsing is not needed or fails', () => {
    expect(faviconFor('www.example.com', 32)).toBe(
      'https://www.google.com/s2/favicons?domain=example.com&sz=32',
    )
    expect(faviconFor('https://')).toBe(
      'https://www.google.com/s2/favicons?domain=https%3A%2F%2F&sz=64',
    )
  })
})
