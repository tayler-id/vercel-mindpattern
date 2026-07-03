import Link from 'next/link'

const TABS = [
  { key: 'trending', label: 'Trending', href: '/' },
  { key: 'most-read', label: 'Most Read', href: '/?view=most-read' },
  { key: 'latest', label: 'Latest', href: '/?view=latest' },
  { key: 'topics', label: 'Topics', href: '/?view=topics' },
]

export function WireTabs({ active }: { active: string }) {
  return (
    <div className="mt-[18px] flex gap-1 border-b border-line">
      {TABS.map((t) => {
        const on = t.key === active
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`type-kicker -mb-px border-b-2 px-3 py-2.5 transition-colors ${
              on ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
