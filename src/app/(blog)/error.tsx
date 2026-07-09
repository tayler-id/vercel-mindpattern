'use client'

/** Route-level error state: a slow or failed backend fetch lands here with a
    retry, instead of a hung click or a blank page. */
export default function ErrorState({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-[720px] px-8 pb-16 pt-16 max-sm:px-5">
      <p className="type-kicker text-primary">Wire interrupted</p>
      <h1
        className="type-display mt-3 text-[clamp(32px,4.4vw,52px)] uppercase leading-[0.95] tracking-[-0.02em] text-ink"
        style={{ fontVariationSettings: '"wdth" 118', fontWeight: 850 }}
      >
        Signal lost
      </h1>
      <p className="mt-4 max-w-[48ch] font-serif text-[15px] leading-relaxed text-ink-soft">
        The research backend didn&rsquo;t answer in time. It is usually back
        within moments — retry, or return to the front page.
      </p>
      <div className="mt-7 flex items-center gap-5">
        <button
          type="button"
          onClick={reset}
          className="border border-line px-4 py-2 font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-panel"
        >
          Retry
        </button>
        <a
          href="/"
          className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink underline decoration-2 underline-offset-[3px]"
        >
          Front page
        </a>
      </div>
    </div>
  )
}
