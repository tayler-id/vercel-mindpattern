import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsMobile } from './use-mobile'

function Probe() {
  return <span>{useIsMobile() ? 'mobile' : 'desktop'}</span>
}

describe('useIsMobile', () => {
  let change: (() => void) | null

  beforeEach(() => {
    change = null
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn((_event: string, callback: () => void) => {
          change = callback
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('tracks the mobile breakpoint and updates on media changes', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    render(<Probe />)

    expect(screen.getByText('desktop')).toBeInTheDocument()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 })
    act(() => {
      change?.()
    })
    expect(screen.getByText('mobile')).toBeInTheDocument()
  })
})
