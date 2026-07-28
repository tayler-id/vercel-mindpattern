import { describe, expect, it } from 'vitest'
import robots from './robots'

describe('robots metadata', () => {
  it('allows pages for readers and AI agents while blocking internal routes', () => {
    const metadata = robots()

    expect(metadata.sitemap).toBe('https://mindpattern.ai/sitemap.xml')
    expect(metadata.host).toBe('https://mindpattern.ai')
    expect(metadata.rules).toContainEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    })
    expect(metadata.rules).toContainEqual({
      userAgent: 'GPTBot',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    })
    expect(metadata.rules).toContainEqual({
      userAgent: 'Claude-SearchBot',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    })
  })
})
