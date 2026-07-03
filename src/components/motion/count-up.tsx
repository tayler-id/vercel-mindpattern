'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Count-up numeral (rAF, cubic ease-out, ~900ms). Starts at 0 on first paint
 * (matches the approved mockup) and settles on the real value; reduced-motion
 * users get the final value immediately.
 */
export function CountUp({
  value,
  duration = 900,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    const tick = (t: number) => {
      if (reduced) {
        setDisplay(value)
        return
      }
      const p = Math.min((t - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(value * eased))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [value, duration])

  return <span className={className}>{display.toLocaleString('en-US')}</span>
}
