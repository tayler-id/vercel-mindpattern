import { describe, expect, it } from 'vitest'
import { leaderFrom, sectionLabel, sourceDomain, sourceLabel } from './sections'

describe('sectionLabel', () => {
  it('uses configured labels for known agents', () => {
    expect(sectionLabel('agents-researcher')).toBe('AGENTS')
    expect(sectionLabel('github-pulse-researcher')).toBe('TOOLS')
  })

  it('falls back to a normalized agent id', () => {
    expect(sectionLabel('custom-pulse')).toBe('CUSTOM')
  })
})

describe('sourceLabel', () => {
  it('prefers a cleaned source name', () => {
    expect(sourceLabel('The Wire — Article Title (2026)', null)).toBe('The Wire')
    expect(sourceLabel('Example - Follow-up', null)).toBe('Example')
  })

  it('falls back to the domain or web', () => {
    expect(sourceLabel('', 'https://www.example.com/story')).toBe('example.com')
    expect(sourceLabel(' (2026) ', 'https://fallback.example/story')).toBe('fallback.example')
    expect(sourceLabel(null, 'not a url')).toBe('web')
    expect(sourceLabel(null, null)).toBe('web')
  })
})

describe('sourceDomain', () => {
  it('normalizes URL hostnames', () => {
    expect(sourceDomain('https://www.Example.com/post')).toBe('example.com')
  })

  it('returns null for missing or invalid URLs', () => {
    expect(sourceDomain(null)).toBeNull()
    expect(sourceDomain('not a url')).toBeNull()
  })
})

describe('leaderFrom', () => {
  it('extracts X/Twitter leaders while skipping reserved paths', () => {
    expect(leaderFrom('https://x.com/tayler/status/1')).toEqual({
      name: '@tayler',
      avatar: 'https://unavatar.io/x/tayler',
      platform: 'x',
    })
    expect(leaderFrom('https://twitter.com/search?q=ai')).toBeNull()
  })

  it('extracts Bluesky leaders', () => {
    expect(leaderFrom('https://bsky.app/profile/example.bsky.social/post/1')).toEqual({
      name: 'example',
      avatar: 'https://unavatar.io/bluesky/example.bsky.social',
      platform: 'bluesky',
    })
  })

  it('returns null for missing, invalid, or unsupported source URLs', () => {
    expect(leaderFrom(null)).toBeNull()
    expect(leaderFrom('not a url')).toBeNull()
    expect(leaderFrom('https://example.com/tayler')).toBeNull()
  })
})
