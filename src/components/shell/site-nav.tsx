'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radio, Newspaper, Mail, Search as SearchIcon } from 'lucide-react'

const HEADER_TABS = [
  { href: '/', label: 'Wire', match: (p: string) => p === '/' },
  { href: '/briefings', label: 'Briefings', match: (p: string) => p.startsWith('/briefings') },
  { href: '/search', label: 'Search', match: (p: string) => p.startsWith('/search') },
]

/** Header nav (desktop only) — ghost sweep-links, mono caps. */
export function HeaderNav() {
  const pathname = usePathname()
  return (
    <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
      {HEADER_TABS.map((t) => {
        const on = t.match(pathname)
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            data-active={on || undefined}
            className={`sweep-link type-kicker py-2 transition-colors duration-(--dur-fast) ${
              on ? 'font-semibold text-ink' : 'font-medium text-ink-soft hover:text-ink'
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

/** Native-feel bottom tab bar — THE nav on mobile (spectrum-system §2.9). */
export function BottomTabBar() {
  const pathname = usePathname()
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-paper/90 backdrop-blur-xl sm:hidden"
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
            className="flex h-16 min-h-14 flex-1 items-center justify-center transition-transform duration-(--dur-fast) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink active:scale-95"
          >
            <span
              className={`flex flex-col items-center gap-0.5 rounded-full px-5 py-1.5 transition-colors duration-(--dur-fast) ${
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
