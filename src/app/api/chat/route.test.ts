import { describe, expect, it } from 'vitest'
import { POST, maxDuration } from './route'

describe('chat route', () => {
  it('keeps chat disabled while shipping the graph-backed experience', async () => {
    const response = await POST()

    await expect(response.json()).resolves.toEqual({
      error: 'Chat is disabled while Rabbit Hole ships the graph-backed intelligence experience.',
    })
    expect(response.status).toBe(410)
    expect(maxDuration).toBe(5)
  })
})
