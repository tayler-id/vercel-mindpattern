'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radio, Newspaper, Mail, Search as SearchIcon } from 'lucide-react'

const HEADER_TABS = [
  { href: '/', label: 'Wire', match: (p: string) => p === '/' },
  { href: '/briefings', label: 'Briefings', match: (p: string) => p.startsWith('/briefings') },
  { href: '/search', label: 'Search', match: (p: string) => p.startsWith('/search') },
]

/** Header tabs (desktop). */
export function HeaderNav() {
  const pathname = usePathname()
  return (
    <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
      {HEADER_TABS.map((t) => {
        const on = t.match(pathname)
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`type-kicker px-3 py-1.5 transition-colors ${
              on ? 'text-primary' : 'text-ink-soft hover:text-ink'
            }`}
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

/** Native-feel bottom tab bar (mobile). */
export function BottomTabBar() {
  const pathname = usePathname()
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-paper/80 backdrop-blur-xl sm:hidden"
      aria-label="Primary"
    >
      {TAB_ITEMS.map((t) => {
        const on = t.match(pathname)
        const Icon = t.icon
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 pb-1.5 pt-2.5 transition-transform active:scale-90 ${
              on ? 'text-primary' : 'text-ink-soft'
            }`}
          >
            <Icon size={24} strokeWidth={on ? 2.4 : 1.9} aria-hidden />
            <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em]">{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
