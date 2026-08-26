import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CountUp } from './count-up'

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('CountUp', () => {
  let frames: FrameRequestCallback[]
  let cancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    frames = []
    cancel = vi.fn()
    let id = 0
    vi.spyOn(performance, 'now').mockReturnValue(0)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback)
      id += 1
      return id
    }))
    vi.stubGlobal('cancelAnimationFrame', cancel)
    setReducedMotion(false)
  })

  it('animates toward the target value and cancels pending frames on unmount', () => {
    const { unmount } = render(<CountUp value={100} duration={1000} className="metric" />)

    // The first paint carries the real value, not 0: crawlers and slow
    // connections were reading "0 findings indexed" until hydration.
    expect(screen.getByText('100')).toHaveClass('metric')
    act(() => frames.shift()?.(500))
    expect(screen.getByText('88')).toBeInTheDocument()
    act(() => frames.shift()?.(1000))
    expect(screen.getByText('100')).toBeInTheDocument()

    unmount()
    expect(cancel).toHaveBeenCalledWith(2)
  })

  it('sets the final value immediately for reduced-motion users', () => {
    setReducedMotion(true)

    render(<CountUp value={2500} />)

    act(() => frames.shift()?.(0))
    expect(screen.getByText('2,500')).toBeInTheDocument()
  })
})
