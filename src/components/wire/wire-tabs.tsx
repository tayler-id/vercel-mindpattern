import Link from 'next/link'
import type { CSSProperties } from 'react'

const TABS = [
  { key: 'trending', label: 'Trending', href: '/' },
  { key: 'most-read', label: 'Most Read', href: '/?view=most-read' },
  { key: 'latest', label: 'Latest', href: '/?view=latest' },
  { key: 'topics', label: 'Topics', href: '/?view=topics' },
]

/** Wire view tabs — mono caps with a 3px ink underline that slides in. */
export function WireTabs({ active }: { active: string }) {
  return (
    <div
      className="mt-6 flex gap-6 border-b border-line max-sm:gap-4"
      style={{ '--tc': 'var(--ink)' } as CSSProperties}
    >
      {TABS.map((t) => {
        const on = t.key === active
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            data-active={on || undefined}
            className={`sweep-link type-kicker px-1 pt-2 pb-2.5 transition-colors duration-(--dur-fast) ${
              on ? 'font-semibold text-ink' : 'font-medium text-ink-soft hover:text-ink'
            } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
