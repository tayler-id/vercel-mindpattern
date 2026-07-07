import { describe, expect, it } from 'vitest'
import { agentLabel, shortDate } from './format'

describe('agentLabel', () => {
  it('removes common agent suffixes and normalizes separators', () => {
    expect(agentLabel('vibe-coding-researcher')).toBe('VIBE CODING')
    expect(agentLabel('skill-finder')).toBe('SKILL')
  })

  it('trims and uppercases custom labels', () => {
    expect(agentLabel(' custom_agent ')).toBe('CUSTOM AGENT')
  })
})

describe('shortDate', () => {
  it('formats date-only strings as compact US dates', () => {
    expect(shortDate('2026-06-26')).toBe('Jun 26')
  })

  it('formats full ISO date strings', () => {
    expect(shortDate('2026-12-02T15:45:00Z')).toBe('Dec 2')
  })

  it('returns invalid inputs unchanged', () => {
    expect(shortDate('not-a-date')).toBe('not-a-date')
  })
})
