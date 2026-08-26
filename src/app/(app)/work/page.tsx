import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { InquiryForm } from '@/components/consult/inquiry-form'
import { SITE_NAME } from '@/lib/site'

const OG_TITLE = 'Work with me: AI workflows and agentic systems'
const OG_DESCRIPTION =
  'AI workflows, agentic systems, and the governance that keeps them shippable. This site is the working example.'

/**
 * A page-level openGraph object replaces the root's rather than merging into
 * it, so this page needs its own image or it unfurls as a bare link. It shares
 * the static site card.
 */
const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'MindPattern, AI workflows and agentic systems',
}

export const metadata: Metadata = {
  title: 'Work with me',
  description:
    'Tayler Ramsay builds AI workflows and agentic systems for companies: with the gates, evals, guardrails and audit trails that make running them unattended a defensible decision.',
  alternates: { canonical: '/work' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: '/work',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

const SERVICES = [
  {
    title: 'Agentic systems',
    body: 'Multi-agent pipelines that do real work end to end — research, triage, drafting, review, publish — and keep doing it when nobody is watching. Not a demo that needs a human standing behind it.',
  },
  {
    title: 'AI workflows',
    body: 'The unglamorous half, which is where the money is. Intake, classification, extraction, summarisation, routing. The work your team does by hand because nobody has modelled it properly yet.',
  },
  {
    title: 'Guardrails and governance',
    body: 'Gates, evals, human-in-the-loop checkpoints, cost ceilings, audit trails, rollback. The layer that turns “we prototyped something with an LLM” into something you can put in front of customers and defend in a review.',
  },
  {
    title: 'Assessment and strategy',
    body: 'An honest read on where AI pays off in your stack and where it won’t. I will tell you when the answer is a database query and a cron job, because sometimes it is.',
  },
]

const STEPS = [
  {
    label: 'One call',
    body: 'Thirty minutes. You describe the problem, I tell you whether I think it is tractable and roughly what it costs.',
  },
  {
    label: 'A scoped pilot',
    body: 'One workflow, fixed scope, running against your real data — so the decision to go further is made on evidence, not a deck.',
  },
  {
    label: 'Build and hand over',
    body: 'Shipped with the gates and evals in place, documented, and operable by your team rather than dependent on me.',
  },
]

export default function WorkPage() {
  return (
    <div className="h-full overflow-y-auto">
      <header className="mx-auto max-w-[720px] px-8 pt-11 max-sm:px-5">
        <p className="rise-in type-kicker text-primary" style={{ '--i': 0 } as CSSProperties}>
          Consulting · Tayler Ramsay
        </p>
        <h1
          className="rise-in type-display mt-2 text-[clamp(2.5rem,6vw,4.25rem)] uppercase leading-[0.95] tracking-[-0.02em] text-ink"
          style={{ '--i': 1, fontVariationSettings: '"wdth" 118', fontWeight: 850 } as CSSProperties}
        >
          AI systems <span className="bg-ink px-[0.12em] text-paper">that hold</span>
        </h1>
        <p
          className="rise-in mt-4 max-w-[56ch] font-serif text-[1.1875rem] leading-[1.5] text-ink-soft"
          style={{ '--i': 2 } as CSSProperties}
        >
          I build AI workflows and agentic systems inside companies — and the governance
          layer that makes them safe to run unattended. Plenty of people will build you a
          demo. The hard part is the version that still behaves on the four hundredth run.
        </p>
      </header>

      <div className="mx-auto max-w-[720px] px-8 pb-24 pt-14 max-sm:px-5">
        <section aria-labelledby="proof">
          <div className="rule-row pt-7">
            <p className="type-kicker text-primary">The proof</p>
            <h2
              id="proof"
              className="type-display mt-3 text-[clamp(22px,2.6vw,30px)] uppercase leading-[1.03] text-ink"
              style={{ fontVariationSettings: '"wdth" 114', fontWeight: 850 }}
            >
              You are standing in it
            </h2>
            <p className="mt-3 font-serif text-[1.0625rem] leading-[1.55] text-ink-prose">
              MindPattern is a thirteen-agent research pipeline that wakes up every night,
              reads the AI landscape across news, papers, GitHub, Reddit, Hacker News and
              arXiv, decides what matters, writes it up, and publishes without a human in
              the loop. Every gate, eval and audit trail I would build for you is running
              on{' '}
              <Link
                href="/"
                className="text-ink underline decoration-line-strong underline-offset-[3px] transition-colors duration-(--dur-fast) hover:text-primary"
              >
                the wire
              </Link>{' '}
              right now. Go and stress-test it before you email me.
            </p>
          </div>
        </section>

        <section aria-labelledby="services" className="mt-14">
          <h2 id="services" className="type-kicker text-primary">
            What I build
          </h2>
          <ol className="mt-4">
            {SERVICES.map((s, i) => (
              <li key={s.title} className="rule-row py-6">
                <div className="flex gap-5">
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 font-mono text-[11px] font-semibold tracking-[0.14em] text-ink-faint"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h3
                      className="type-display text-[19px] uppercase leading-[1.1] text-ink"
                      style={{ fontVariationSettings: '"wdth" 112', fontWeight: 800 }}
                    >
                      {s.title}
                    </h3>
                    <p className="mt-2 font-serif text-[1.0625rem] leading-[1.55] text-ink-soft">
                      {s.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="how" className="mt-14">
          <h2 id="how" className="type-kicker text-primary">
            How it starts
          </h2>
          <ol className="mt-4">
            {STEPS.map((step, i) => (
              <li key={step.label} className="rule-row flex flex-wrap gap-x-6 gap-y-1 py-5">
                <p className="w-[11rem] shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                  <span aria-hidden className="text-ink-faint">
                    {String(i + 1).padStart(2, '0')}
                  </span>{' '}
                  {step.label}
                </p>
                <p className="min-w-[240px] flex-1 font-serif text-[1.0625rem] leading-[1.55] text-ink-soft">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="inquire" className="mt-16">
          <h2 id="inquire" className="sr-only">
            Start a conversation
          </h2>
          <InquiryForm />
        </section>
      </div>
    </div>
  )
}
