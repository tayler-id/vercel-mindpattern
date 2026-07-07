import { describe, expect, it } from 'vitest'
import { absoluteUrl, shortReportDescription, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from './site'

describe('site constants', () => {
  it('exports the public site metadata', () => {
    expect(SITE_URL).toBe('https://mindpattern.ai')
    expect(SITE_NAME).toBe('MindPattern')
    expect(SITE_TITLE).toContain('MindPattern')
    expect(SITE_DESCRIPTION).toContain('autonomous AI research pipeline')
  })
})

describe('absoluteUrl', () => {
  it('resolves paths against the configured site URL', () => {
    expect(absoluteUrl('/briefings')).toBe('https://mindpattern.ai/briefings')
  })

  it('defaults to the site root', () => {
    expect(absoluteUrl()).toBe('https://mindpattern.ai/')
  })
})

describe('shortReportDescription', () => {
  it('describes a daily report with its title and date', () => {
    expect(shortReportDescription('Daily Briefing', '2026-07-02')).toBe(
      'Daily Briefing is a MindPattern daily AI research briefing for 2026-07-02, summarizing high-signal AI news, agent frameworks, developer tools, research papers, sources, and patterns.',
    )
  })
})
