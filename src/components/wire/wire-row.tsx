import Link from 'next/link'
import type { Finding } from '@/lib/types'
import { faviconFor } from '@/lib/favicon'
import { agentLabel } from '@/lib/format'

const IMPORTANCE: Record<Finding['importance'], string> = {
  high: 'text-primary',
  medium: 'text-ink-soft',
  low: 'text-ink-faint',
}

export function WireRow({ finding, rank }: { finding: Finding; rank: number }) {
  const fav = faviconFor(finding.source_url)
  const hot = finding.importance === 'high'

  return (
    <Link
      href={`/f/${finding.id}`}
      className="cv-auto grid grid-cols-[26px_1fr_auto] items-center gap-4 rounded-[10px] border-b border-line-soft px-3 py-3.5 transition-[background,box-shadow] hover:border-b-transparent hover:bg-card hover:shadow-[0_1px_2px_rgba(11,13,18,.05),0_12px_32px_-22px_rgba(11,13,18,.32)] sm:px-4"
    >
      <span
        className={`text-right font-mono text-sm tabular-nums ${
          hot ? 'font-bold text-primary' : 'font-medium text-ink-faint'
        }`}
      >
        {rank}
      </span>

      <div className="min-w-0">
        <div className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-primary">
          {agentLabel(finding.agent)}
        </div>
        <h3 className="mt-1 text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
          {finding.title}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[0.65625rem] text-ink-faint">
          {fav && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fav}
              alt=""
              width={13}
              height={13}
              loading="lazy"
              className="size-[13px] rounded-[3px] bg-spine"
            />
          )}
          <span className="truncate">{finding.source_name ?? 'source'}</span>
        </div>
      </div>

      <span
        className={`hidden font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] sm:block ${IMPORTANCE[finding.importance]}`}
      >
        {finding.importance}
      </span>
    </Link>
  )
}
