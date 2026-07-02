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
            className={`-mb-px border-b-2 px-3 py-2.5 text-[0.78125rem] font-semibold transition-colors ${
              on ? 'border-primary text-primary' : 'border-transparent text-ink-faint hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
