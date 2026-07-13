# Handoff — Rabbit Hole feature discovery (2026-07-02)

Discovery/spec work only; no code, no deploys, no pipeline runs.

## Deliverables

Two companion discovery docs, 60 features total:

**`docs/runbooks/2026-07-02-rabbit-hole-feature-discovery-unrestricted.md`** (v2) —
unrestricted pass: 30 revenue-aware features across the whole system. v1 was written
same-day without dedicated idea research and was rewritten after four web-research
passes (agentic commerce/x402/Stripe MPP, intelligence-product monetization
comparables, the AI content-licensing + GEO economy, novel formats/mechanics). All
claims carry inline source links. Organized as three stacks — sell to machines
(#1-10), become the canonical citation (#11-14), human products with proven
comparables (#15-30) — plus a do-this-week enrollment list (Perplexity Comet Plus,
Cloudflare Pay Per Use beta, TollBit, RSL, Otterly, Bing/IndexNow) and open questions
(payment-rail choice, revisiting the Ask decision against HBR's 25%-adoption data,
free/paid line, index-credibility obligations, legal setup, time budget).

**`docs/runbooks/2026-07-02-rabbit-hole-new-feature-discovery.md`** — 30 NEW
website-centered feature proposals for Rabbit Hole as the public intelligence graph,
based on a full study of both repos (v3 backend data model + content workflows,
rabbit-hole routes/APIs/SEO/analytics, specs and prior handoffs).

Contents: current-system summary (with live corpus counts), the "living public
intelligence graph" vision, a 30-row feature table (visitor/agent/both, UX, backend +
website changes, data inputs, MVP, risks, effort, priority, and why each is new
capability rather than a fix), a sequencing note (kg_* population, arc backfill, and
exposing already-collected data are the three big unlocks), and 5 open questions for
Tayler (Ask-answer boundary, dataset licensing, kg backfill cost, alert email scope,
public cost transparency).

Known broken/legacy behavior (legacy /blog + /explore, orphaned chat code, design-system
drift, degenerate reported_on graph) is listed in the doc's §3 and deliberately excluded
from the 30 features.

## State

- Both repos were clean before and during this work; the only changes are this file
  and the two runbooks above (all uncommitted, in `mindpattern-rabbit-hole`).
- No secrets, subscriber data, or Slack bodies were read or quoted.
