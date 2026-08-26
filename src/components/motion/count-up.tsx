'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Count-up numeral (rAF, cubic ease-out, ~900ms). Server HTML carries the
 * real value — starting at 0 meant crawlers and slow connections saw
 * "0 findings indexed" until hydration. The 0→value sweep only plays once
 * the browser takes over; reduced-motion users keep the static value.
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
  const [display, setDisplay] = useState(value)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    // Reduced motion jumps to the end on the first frame rather than setting
    // state straight from the effect body, which cascades a second render.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = reduced ? 1 : Math.min((t - t0) / duration, 1)
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
