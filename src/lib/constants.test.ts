import { describe, expect, it } from 'vitest'
import { AGENTS, DIFFICULTY_COLORS, IMPORTANCE_COLORS } from './constants'

describe('research constants', () => {
  it('defines the public research agent roster', () => {
    expect(AGENTS).toHaveLength(13)
    expect(AGENTS.map((agent) => agent.id)).toEqual([
      'news-researcher',
      'vibe-coding-researcher',
      'thought-leaders-researcher',
      'agents-researcher',
      'projects-researcher',
      'sources-researcher',
      'saas-disruption-researcher',
      'skill-finder',
      'hn-researcher',
      'arxiv-researcher',
      'github-pulse-researcher',
      'rss-researcher',
      'reddit-researcher',
    ])
  })

  it('defines display classes for importance and difficulty levels', () => {
    expect(Object.keys(IMPORTANCE_COLORS)).toEqual(['high', 'medium', 'low'])
    expect(Object.keys(DIFFICULTY_COLORS)).toEqual(['beginner', 'intermediate', 'advanced'])
  })
})
