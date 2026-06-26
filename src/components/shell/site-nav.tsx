'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Wire', match: (p: string) => p === '/' },
  { href: '/briefings', label: 'Briefings', match: (p: string) => p.startsWith('/briefings') },
]

/** Header tabs (desktop). */
export function HeaderNav() {
  const pathname = usePathname()
  return (
    <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Primary">
      {TABS.map((t) => {
        const on = t.match(pathname)
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`rounded-lg px-3 py-1.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
              on
                ? 'bg-accent-wash text-primary'
                : 'text-ink-faint hover:bg-spine hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Fixed bottom tab bar (mobile, app-feel). */
export function BottomTabBar() {
  const pathname = usePathname()
  const items = [
    { href: '/', label: 'Wire', icon: '≣', match: (p: string) => p === '/' },
    { href: '/briefings', label: 'Briefings', icon: '▤', match: (p: string) => p.startsWith('/briefings') },
    { href: '/#subscribe', label: 'Subscribe', icon: '✉', match: () => false },
  ]
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-paper/95 backdrop-blur-md sm:hidden"
      aria-label="Primary"
    >
      {items.map((t) => {
        const on = t.match(pathname)
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.05em] ${
              on ? 'text-primary' : 'text-ink-faint'
            }`}
          >
            <span aria-hidden className="text-lg leading-none">
              {t.icon}
            </span>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
