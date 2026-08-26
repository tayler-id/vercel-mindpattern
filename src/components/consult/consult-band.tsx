import Link from 'next/link'

/**
 * Copy in both of these follows the writer's rules in mindpattern-v3
 * `docs/specs/site-writer-rules.md` and `data/ramsay/mindpattern/voice.md`:
 * no em dashes, contractions always, no banned words, varied sentence length.
 */

/**
 * Broadsheet ear — one thin ruled line at the very top of the wire. Mono, one
 * sentence, one link. Sits above the ticker so the offer is visible without
 * scrolling; the sentence drops on small screens and the link survives.
 */
export function ConsultRibbon() {
  return (
    <div className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-8 py-2 max-sm:px-5">
        <span className="type-kicker shrink-0 text-primary">Consulting</span>
        <p className="min-w-0 flex-1 font-mono text-[11px] leading-[1.5] tracking-[0.04em] text-ink-soft max-sm:hidden">
          I build agentic systems and AI workflows for companies.
        </p>
        <Link
          href="/work"
          className="group ml-auto shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink underline decoration-line-strong underline-offset-[3px] transition-colors duration-(--dur-fast) hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Work with me{' '}
          <span
            aria-hidden
            className="inline-block no-underline transition-transform duration-(--dur-fast) group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </div>
    </div>
  )
}

/**
 * Terminal band under the subscribe block. Built as an ink-ruled section, not
 * a marketing hero (PRODUCT.md anti-references): mono kicker, one display
 * line, one paragraph, one pill. Ink pill rather than accent so it doesn't
 * fight the accent Subscribe CTA in the header.
 */
export function ConsultBand() {
  return (
    <section id="consulting" className="mx-auto max-w-[1240px] px-8 pb-20 max-sm:px-5">
      <div className="rule-row flex flex-wrap items-end justify-between gap-x-12 gap-y-6 pt-7">
        <div className="min-w-[280px] max-w-[64ch] flex-1">
          <p className="type-kicker text-primary">Open channel</p>
          <h2
            className="type-display mt-3 text-[clamp(24px,3vw,34px)] uppercase leading-[1.03] text-ink"
            style={{ fontVariationSettings: '"wdth" 114', fontWeight: 850 }}
          >
            This wire runs itself.
          </h2>
          <p className="mt-3 font-serif text-[1.0625rem] leading-[1.55] text-ink-soft">
            Thirteen agents wake up every night, decide what matters, and publish it.
            Nobody reviews the output first. That only works because of the gates, evals
            and audit trails underneath. I build the same thing inside companies: AI
            workflows, agentic systems, and the governance that keeps them shippable.
          </p>
        </div>

        <Link
          href="/work"
          className="group shrink-0 rounded-full bg-ink px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-[transform,filter] duration-(--dur-fast) hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95"
        >
          Start a conversation{' '}
          <span
            aria-hidden
            className="inline-block transition-transform duration-(--dur-fast) group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  )
}
