import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { afterEach, vi } from 'vitest'

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}))

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useReducedMotion: () => false,
  motion: new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, initial: _initial, animate: _animate, transition: _transition, exit: _exit, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
          void [_initial, _animate, _transition, _exit]
          return React.createElement(tag, props, children)
        },
    },
  ),
}))

vi.mock('recharts', () => {
  const Chart = ({ children, data }: { children?: React.ReactNode; data?: unknown[] }) => (
    React.createElement('div', { 'data-testid': 'chart', 'data-count': data?.length ?? 0 }, children)
  )
  const Primitive = ({ children, content, dataKey, tickFormatter }: { children?: React.ReactNode; content?: (props: unknown) => React.ReactNode; dataKey?: string; tickFormatter?: (value: number) => string }) => (
    React.createElement(
      'div',
      { 'data-testid': dataKey ? `chart-${dataKey}` : 'chart-primitive', 'data-tick': tickFormatter?.(70) },
      content ? content({ active: true, payload: [{ value: 1, payload: { name: 'Example', highValue: 1, total: 2, score: 90, findings: 3, sources: 2, success: 1, warning: 1, error: 1 } }], label: '07-02' }) : children,
    )
  )
  return {
    Area: Primitive,
    AreaChart: Chart,
    Bar: Primitive,
    BarChart: Chart,
    Line: Primitive,
    LineChart: Chart,
    Legend: Primitive,
    ReferenceLine: Primitive,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'responsive-chart' }, children),
    Tooltip: Primitive,
    XAxis: Primitive,
    YAxis: Primitive,
  }
})

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  configurable: true,
  value: vi.fn(),
})

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock,
})

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock,
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})
