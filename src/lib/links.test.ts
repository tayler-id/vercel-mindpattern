import { describe, expect, it } from 'vitest'
import { hostOf, httpUrl } from './links'

/**
 * Source URLs arrive from the open-web crawl, not from this repo, so they
 * reach a render unvalidated. An href is where a bad one turns into a live
 * link: `javascript:` runs, and a bare word resolves against the current page
 * and silently becomes an internal link.
 */

describe('httpUrl', () => {
  it('passes an http or https source URL through unchanged', () => {
    expect(httpUrl('https://arxiv.org/abs/1234')).toBe('https://arxiv.org/abs/1234')
    expect(httpUrl('http://example.com/a?b=c#d')).toBe('http://example.com/a?b=c#d')
  })

  it('refuses a scheme that executes', () => {
    expect(httpUrl('javascript:alert(1)')).toBeNull()
    expect(httpUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(httpUrl('vbscript:msgbox(1)')).toBeNull()
  })

  it('refuses a bare word, which the browser would resolve as a same-site path', () => {
    expect(httpUrl('not-a-url')).toBeNull()
    expect(httpUrl('/s/story-one')).toBeNull()
  })

  it('refuses nothing at all', () => {
    expect(httpUrl('')).toBeNull()
    expect(httpUrl(null)).toBeNull()
    expect(httpUrl(undefined)).toBeNull()
  })
})

describe('hostOf', () => {
  it('drops the www prefix so the anchor names the publisher', () => {
    expect(hostOf('https://www.reuters.com/tech/deal')).toBe('reuters.com')
    expect(hostOf('https://arxiv.org/abs/1234')).toBe('arxiv.org')
  })

  it('falls back rather than putting a broken host in the copy', () => {
    expect(hostOf('not-a-url')).toBe('the source site')
    expect(hostOf(null)).toBe('the source site')
    expect(hostOf('not-a-url', 'the source')).toBe('the source')
  })
})
