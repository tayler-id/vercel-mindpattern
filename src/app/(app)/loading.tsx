const ROW_WIDTHS = ['72%', '58%', '81%', '64%', '76%', '52%', '69%', '61%']

/** Route-level loading state: skeleton wire rows so a slow fetch reads as
    "the wire is coming in," never as a dead link. */
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-[1240px] px-8 pb-16 pt-11 max-sm:px-5"
      role="status"
      aria-label="Loading"
    >
      <p className="type-kicker flex items-center gap-2 text-ink-soft">
        <span
          className="inline-block size-1.5 animate-pulse rounded-full bg-ink-soft"
          aria-hidden
        />
        Fetching from the wire…
      </p>
      <div className="mt-8 max-w-[820px]">
        {ROW_WIDTHS.map((width, i) => (
          <div
            key={i}
            className="grid grid-cols-[32px_1fr] items-center gap-3 border-t border-line px-2 py-4"
          >
            <span className="font-mono text-[10.5px] text-ink-soft">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className="h-3.5 animate-pulse rounded-sm bg-panel"
              style={{ width, animationDelay: `${i * 90}ms` }}
            />
          </div>
        ))}
        <div className="border-t border-line" />
      </div>
    </div>
  )
}
