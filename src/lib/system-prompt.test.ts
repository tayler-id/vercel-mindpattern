import { describe, expect, it } from 'vitest'
import { SYSTEM_PROMPT } from './system-prompt'

describe('SYSTEM_PROMPT', () => {
  it('describes the assistant role, tool behavior, agents, and writing rules', () => {
    expect(SYSTEM_PROMPT).toContain('MindPattern AI')
    expect(SYSTEM_PROMPT).toContain("Today's date is")
    expect(SYSTEM_PROMPT).toContain('NEVER use em dashes')
    expect(SYSTEM_PROMPT).toContain('ALWAYS use your tools')
    expect(SYSTEM_PROMPT).toContain('news-researcher')
    expect(SYSTEM_PROMPT).toContain('search_findings')
    expect(SYSTEM_PROMPT).toContain('read_report')
  })
})
