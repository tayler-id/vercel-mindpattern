'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'
import { Radio, Newspaper, Mail, Search as SearchIcon } from 'lucide-react'

const HEADER_TABS = [
  { href: '/', label: 'Wire', match: (p: string) => p === '/' },
  { href: '/briefings', label: 'Briefings', match: (p: string) => p.startsWith('/briefings') },
  { href: '/search', label: 'Search', match: (p: string) => p.startsWith('/search') },
]

/**
 * Shared sliding-pill hook: positions one ink pill under the target item by
 * writing styles straight to the DOM (no setState in effects). The first
 * placement is instant; every later move slides (--dur-med / --ease-swift).
 */
function useSlidingPill(
  target: number | null,
  itemRefs: React.RefObject<Array<HTMLElement | null>>,
  containerRef: React.RefObject<HTMLElement | null>,
) {
  const pillRef = useRef<HTMLSpanElement>(null)
  const placedOnce = useRef(false)

  useLayoutEffect(() => {
    const pill = pillRef.current
    const container = containerRef.current
    if (!pill || !container) return
    const place = () => {
      const el = target == null ? null : itemRefs.current[target]
      if (!el) {
        pill.style.opacity = '0'
        return
      }
      if (!placedOnce.current) {
        pill.style.transition = 'none'
      }
      pill.style.opacity = '1'
      pill.style.left = `${el.offsetLeft}px`
      pill.style.top = `${el.offsetTop}px`
      pill.style.width = `${el.offsetWidth}px`
      pill.style.height = `${el.offsetHeight}px`
      if (!placedOnce.current) {
        // commit the first position without animating, then enable sliding
        void pill.offsetWidth
        pill.style.transition = ''
        placedOnce.current = true
      }
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(container)
    return () => ro.disconnect()
  }, [target, itemRefs, containerRef])

  return pillRef
}

const PILL_CLASS =
  'pointer-events-none absolute rounded-full bg-ink opacity-0 transition-[left,top,width,height,opacity] duration-(--dur-med) ease-(--ease-swift) motion-reduce:transition-none'

/**
 * Header nav (desktop only) — one solid ink pill SLIDES between items:
 * it tracks hover and settles back on the active route.
 */
export function HeaderNav() {
  const pathname = usePathname()
  const activeIndex = HEADER_TABS.findIndex((t) => t.match(pathname))
  const [hover, setHover] = useState<number | null>(null)
  const itemRefs = useRef<Array<HTMLElement | null>>([])
  const navRef = useRef<HTMLElement>(null)

  const target = hover ?? (activeIndex >= 0 ? activeIndex : null)
  const pillRef = useSlidingPill(target, itemRefs, navRef)

  return (
    <nav
      ref={navRef}
      className="relative hidden items-center gap-2 sm:flex"
      aria-label="Primary"
      onMouseLeave={() => setHover(null)}
    >
      <span aria-hidden ref={pillRef} className={PILL_CLASS} />
      {HEADER_TABS.map((t, i) => {
        const on = t.match(pathname)
        const covered = target === i
        return (
          <Link
            key={t.href}
            href={t.href}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            aria-current={on ? 'page' : undefined}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className={`type-kicker relative z-10 rounded-full px-4 py-2.5 transition-colors duration-(--dur-med) ${
              covered ? 'font-semibold text-white' : on ? 'font-semibold text-ink' : 'font-medium text-ink-soft'
            } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

const TAB_ITEMS = [
  { href: '/', label: 'Wire', icon: Radio, match: (p: string) => p === '/' },
  { href: '/briefings', label: 'Briefings', icon: Newspaper, match: (p: string) => p.startsWith('/briefings') },
  { href: '/search', label: 'Search', icon: SearchIcon, match: (p: string) => p.startsWith('/search') },
  { href: '/#subscribe', label: 'Subscribe', icon: Mail, match: () => false },
]

/**
 * Native-feel bottom tab bar — THE nav on mobile (spectrum-system §2.9).
 * One ink pill SLIDES between tabs on navigation; the covered tab's icon and
 * label flip to white. View transitions make the page follow the same beat.
 */
export function BottomTabBar() {
  const pathname = usePathname()
  const activeIndex = TAB_ITEMS.findIndex((t) => t.match(pathname))
  const target = activeIndex >= 0 ? activeIndex : null

  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-paper/90 backdrop-blur-xl sm:hidden"
      aria-label="Primary"
    >
      {TAB_ITEMS.map((t, i) => {
        const on = i === target
        const Icon = t.icon
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className="flex h-16 min-h-14 flex-1 items-center justify-center transition-transform duration-(--dur-fast) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink active:scale-95"
          >
            <span
              className={`relative z-10 flex flex-col items-center gap-0.5 rounded-full px-5 py-1.5 transition-colors duration-(--dur-med) ${
                on ? 'bg-ink text-white' : 'text-ink-soft'
              }`}
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em]">
                {t.label}
              </span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
