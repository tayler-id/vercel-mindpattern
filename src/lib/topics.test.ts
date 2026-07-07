import { describe, expect, it } from 'vitest'
import { TOP5_SECTION, isTop5, kickerLabel, topicFor, topicForAgent, topicStyleVars } from './topics'

describe('topic helpers', () => {
  it('maps section and agent identifiers to canonical topics', () => {
    expect(topicFor(' Models ')?.label).toBe('Models')
    expect(topicForAgent(' VIBE-CODING-RESEARCHER ')?.label).toBe('Vibe Coding')
    expect(topicFor('unknown')).toBeNull()
    expect(topicForAgent('unknown')).toBeNull()
  })

  it('handles top-five, agent, fallback, and neutral labels', () => {
    expect(isTop5(TOP5_SECTION)).toBe(true)
    expect(isTop5('models')).toBe(false)
    expect(kickerLabel(TOP5_SECTION)).toBe('Top 5')
    expect(kickerLabel('agents-researcher')).toBe('Agents')
    expect(kickerLabel('news-researcher')).toBe('News')
    expect(kickerLabel('missing')).toBe('')
    expect(kickerLabel(null)).toBe('')
  })

  it('returns topic and neutral CSS variables', () => {
    expect(topicStyleVars(topicFor('skills-of-the-day'))).toEqual({
      '--tc': '#f5c518',
      '--tc-text': '#8a6d0a',
      '--tc-on': '#0e0e0f',
    })
    expect(topicStyleVars(null)).toEqual({
      '--tc': 'var(--ink)',
      '--tc-text': 'var(--ink-soft)',
      '--tc-on': '#ffffff',
    })
  })
})
