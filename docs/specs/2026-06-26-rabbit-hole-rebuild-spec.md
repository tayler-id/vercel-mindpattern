# Spec: MindPattern — Rabbit-Hole Rebuild (v1)

**Status:** draft for review (Phase 1 / Specify) · **Date:** 2026-06-26
**Supersedes:** the `rebuild/v1-living-scene` line (abandoned). Built fresh off `main`.
**Companion docs:** `docs/plans/2026-06-23-content-system-research.md` (content-system research).

---

## 1. Objective

Build MindPattern as a **connective intelligence source for the AI space** — not a feed that
regurgitates links, but a place that has a **unique take**, **finds patterns**, and **creates
new views** by connecting everything in the field. Take the **rabbit-hole / Signal prototype**
(`prototypes/rabbit-hole.html`) and make it the real product, on live data, with the
connective + agent + analytics machinery baked in from day one.

**Users:** technical readers (researchers/builders) who want to *uncover* intel and follow
threads — and, explicitly, **their AI agents/chatbots**, which must be able to read and query
MindPattern trivially.

**Success in one line:** a visitor lands (from a social post or the newsletter), reads a story,
and falls down a rabbit hole of genuinely-connected stories — while every interaction is
measured, the content is agent-readable, and the system keeps surfacing new connections no
plain aggregator would.

**Non-negotiable principle:** *connection and synthesis over aggregation.* If a feature only
re-lists findings, it's wrong.

## 2. Decisions locked (this rebuild)

- **Branch off `main`** (inherits live SEO/GEO + the fly.dev data proxy). New branch: `rabbit-hole`.
- **No user login.** Personalization is **anonymous** (cookie/localStorage taste-profile).
- **Design = Signal**: light only; Inter (UI) + JetBrains Mono (numerals/labels) + Newsreader
  (serif, briefings); one cobalt accent; **no left-border callouts**; native-app feel on mobile.
- **Browser policy = Chrome-first**: use modern/Chrome features natively *with feature detection
  + graceful fallback*; no heavy polyfills or new deps (inline fallback ≤ ~20 lines or redesign).
- **Content stored "proper"** as structured stories in v3 (no throwaway frontend bridge).
- **Two repos:** frontend `vercel-mindpattern` (Next.js 16) · backend `mindpattern-v3`
  (Python/FastAPI/SQLite/fastembed on fly.dev). Most data/AI/KG work is backend.

## 3. Tech stack

| | |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 (`@theme inline`), shadcn/ui v4 (base-ui, `render` prop), AI SDK v6, Motion (`motion/react`), streamdown, Recharts |
| Backend (v3) | Python, FastAPI, SQLite (`memory.db`), fastembed (BAAI/bge-small, 384-dim), 13-agent pipeline, Resend |
| New for v1 | **OKF** (Open Knowledge Format) bundle export · **WebMCP** agent surface · **Chrome built-in AI** (Prompt/Summarizer/Translator/Language Detector) · GraphRAG synthesis · self-hosted analytics |
| Hosting | Frontend on Vercel; backend on fly.dev (`mindpattern.fly.dev`) |

## 4. Architecture

### 4.1 The connective core (v3 backend)
The "AI brain" is **GraphRAG**: embeddings (recall) + knowledge graph / OKF (structure) →
LLM synthesis (new views).

- **Atoms = findings.** ~14.9k findings, ~14.8k already **embedded**. The deep-linkable unit. No backfill.
- **Connect.** Wire each finding to others by **meaning** (embeddings), **entities + typed edges**
  (KG), **source**, and **time** (the same thread evolving — GLM-5.1 → 5.2). This web *is* the product.
- **Knowledge graph.** Build the `kg_*` tables (schema-only today, **not populated**): entities
  (Company/Product/Person/Paper/…), typed bi-temporal edges (RELEASED/COMPETES_WITH/
  BENCHMARKED_AGAINST/…), Louvain communities; edges keep `finding_id` provenance.
- **The brain generates connective takes over the 14k findings (model "c").** Key fact: the 146
  briefings only ever wrote up a few thousand findings, so **most findings have no written take —
  it cannot come only from briefings.** The **synthesis/GraphRAG layer generates it across the
  corpus**: it **clusters related findings** (shared entity + embedding proximity), **writes a
  connective take per cluster/entity** in the writer's voice (reuse v3 `voice.md` + banned-words),
  and **attaches briefing prose where it exists** as the richest input. Cadence: **nightly for
  trending + on-demand** when something heats up (cost tracks attention). These **enriched
  cluster-takes ARE the Wire units — never raw titles.** Higher-order outputs: **per-entity
  dossiers**, **"Connections" pieces**, **trend reports** *(v1 leads with dossiers + connections)*.
- **OKF bundle (portable, agent-facing twin of the KG).** Emit findings + entities + cluster-takes
  + connections as an [OKF](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
  bundle — cross-linked markdown concept files = a graph any agent reads with zero SDK (also the
  KG view; OKF ships a static visualizer).

### 4.2 Recommendation + trending (YouTube-style)
- **Global trending** (anonymous): time-decayed engagement score + velocity, from real events.
- **Per-visitor "for you"** (anonymous): a cookie/localStorage **taste vector** = mean embedding
  of stories the visitor opens/watches; rank by cosine vs. taste. No login.
- **Related ("rabbit hole"):** `semantic` (embeddings) + `graph` (shared KG entities / typed
  edges). Both blended; never dead-ends.

### 4.3 Analytics + attribution (self-hosted in v3, first-class)
End-to-end, you own the data:
- **Outbound tagging:** every social post + newsletter link gets a tracked URL (UTM + short
  code) → know which post/link drove the visit.
- **On-site events:** page/story views, dwell, rabbit-hole depth, video watch %, subscribe,
  agent/API hits. First-party, cookieless where possible; anonymous visitor id.
- **Feeds:** the trending score, the recsys taste vector, and an **internal dashboard**
  (funnels: social → click → read → subscribe; performance per story/section/topic/source/agent).

### 4.4 Surfaces (frontend — the priority)
1. **Wire** — front page: ranked feed of **enriched cluster-takes** (a finding-with-take, often
   grouping several connected findings) — *never raw titles*. Dense rows: rank · kicker · headline ·
   **the take/angle** · stacked **source favicons** + "N sources" · **velocity badge** ·
   **"via {leader}"** avatar. Global **trending** + anonymous **"for you"** blended.
2. **Story + rabbit hole** — reading view + **"more like this"** (semantic + graph); drill-down
   columns with collapsing trail; **video player** inline when the source is a video; local-AI
   actions (summarize / "ask this story" / translate).
3. **Briefings** — the formatted daily newsletter, long-form (serif), its own section + archive.
4. **Dossiers / Connections / Trends** — the synthesis outputs as first-class pages.
5. **Knowledge graph view** — explorable connections (OKF visualizer-style).
6. **Subscribe** — one-click newsletter signup (Resend), frictionless + sticky CTA.
7. **(internal) Analytics dashboard.**

### 4.5 Agent / GEO layer
- **WebMCP tools** (external agents — *their* AI, not ours): `search_findings`, `get_story`,
  `get_briefing`, `list_trending`, `get_related`, `get_dossier`, `subscribe`.
- **OKF bundle** + **`llms.txt`** + **JSON-LD** on every page → trivially machine-readable
  (this is also the GEO strategy; robots already allow GPTBot/PerplexityBot/ClaudeBot/etc.).

### 4.6 Modern-web-guidance (Chrome-first), woven into every surface
Apply the catalog *as we build*, not as an afterthought, **Chrome-first**: use the modern/Chrome
feature natively + feature-detect + graceful fallback; no heavy polyfills/deps.
- **Rabbit-hole nav** → View Transitions (shared-element) + `prefers-reduced-motion`.
- **Dense Wire** → `content-visibility`/defer-rendering, LCP image priority, `text-wrap: balance`.
- **Local AI** → built-in **Summarizer / Translator / Prompt / Language-Detector** (summarize a
  cluster, "ask this story," translate a briefing) — feature-detected, fallback off-Chrome.
- **Subscribe** → forms guides (validation timing, autofill, ≥16px, accessible errors) for true 1-click.
- **Findability/GEO** → search-hidden-content, JSON-LD, OKF, llms.txt.
- **A11y (WCAG AA)** throughout (labels, focus, skip link, semantics) + Signal / no-left-border.
- Track adherence in a fresh `modern-web-audit.md` scoped to THIS build.

## 5. Data model (v3 `memory.db`, additive)

> **The spine is the existing `findings` corpus — ~14,924 findings, ~14,803 already embedded.**
> Findings are the atomic, deep-linkable unit powering the Wire, rabbit-hole related, trending,
> recsys, KG, and OKF. **No briefing→story backfill** — the embedded corpus already exists, so
> semantic related works across all 14k from day one. The 146 briefings are the long-form
> reading section; briefing prose + generated `syntheses` are the written-take overlay on top of
> findings. (`stories`/`issues` below are an *optional editorial overlay*, not the primary unit.)

```
findings(...)                              -- EXISTS ~14.9k: the atoms / spine (title,summary,source,importance,category,agent,date)
findings_embeddings(finding_id, embedding) -- EXISTS ~14.8k: 384-dim
kg_entities / kg_edges / kg_communities    -- BUILD (kg/schema.py exists): entities, typed bi-temporal edges, communities
finding_entities(finding_id, entity_id, salience)         -- finding <-> KG
clusters(id, kind, slug, label, created_at, refreshed_at) -- a connected group of findings (by entity + embedding)
cluster_findings(cluster_id, finding_id, rank)
takes(id, target_type, target_id, body, voice, model, created_at) -- the GENERATED connective take per cluster/entity; briefing prose attached where it exists
syntheses(id, kind, slug, title, body, created_at)        -- higher-order: dossier|connections|trend
syntheses_links(synthesis_id, target_type, target_id)     -- provenance -> findings/entities/clusters
events(id, ts, anon_id, type, target_type, target_id, ref_source, ref_campaign, meta) -- analytics/attribution
leaders(id, name, handle, platform, avatar_url, ...)      -- thought-leaders + avatars
-- optional editorial overlay only: issues(...) / stories(...) mirror the briefing's own structure
```
- **Leader avatars:** resolve once at ingest (GitHub `github.com/<u>.png`, Bluesky `getProfile`;
  X via fallback/manual), store `avatar_url`.
- **OKF export job:** materialize `findings` + `kg_entities` + `clusters`/`takes` + `syntheses` → markdown bundle.

## 6. API + agent surface (FastAPI)
`/api/feed` (Wire: ranked cluster-takes), `/api/finding/{id}`, `/api/cluster/{slug}`,
`/api/related/{id}?mode=semantic|graph`, `/api/trending`, `/api/dossier/{entity}`,
`/api/connections/{slug}`, `/api/briefings` + `/api/briefings/{date}`, `/api/event` (ingest),
plus **WebMCP** server + **`/okf/`** bundle + **`/llms.txt`**. Frontend reads via the existing proxy.

## 7. Commands
```
# frontend (vercel-mindpattern)
pnpm dev | pnpm build | pnpm lint | pnpm test (vitest) | pnpm e2e (playwright)
# backend (mindpattern-v3)
python run.py [--user ramsay] [--dry-run]   # pipeline
# v1 additions: build-kg, export-okf, synthesis jobs (to be defined in tasks)
```

## 8. Project structure (frontend, new surfaces)
```
src/app/(wire)/page.tsx            → Wire (front page / trending)
src/app/s/[slug]/page.tsx          → Story + rabbit hole
src/app/(briefings)/...            → Briefings (newsletter section + archive)
src/app/dossier/[entity]/          → synthesis: dossiers
src/app/connections/[slug]/        → synthesis: connections
src/app/graph/                     → knowledge-graph view
src/lib/{api,recsys,events,okf}.ts → data, taste vector, analytics, OKF
src/components/{wire,story,briefing,video,graph}/
src/app/{robots,sitemap,llms}.ts   → SEO/GEO (extend existing)
```

## 9. Code style
- Signal tokens in `globals.css` `@theme inline` (light only; cobalt accent; **no left-border**;
  rem font-sizes). Serif (Newsreader) reserved for briefings/long-form.
- shadcn **base** primitive (`render` prop, not `asChild`). Chrome-first features always
  feature-detected:
  ```ts
  if ('Summarizer' in self) { /* on-device summarize */ } else { /* server/skip */ }
  ```
- Synthesis prose obeys v3 `voice.md` (builder voice; banned-words list).

## 10. Testing strategy
- **Vitest** (unit): recsys taste-vector math, related blending, event/attribution parsing, OKF emit.
- **Playwright** (e2e): Wire → story → rabbit-hole depth; subscribe one-click; video load; agent
  endpoints return valid JSON/OKF.
- **Browser verification required** for UX (real `pnpm dev`), per the modern-web-guidance habit.
- Backend: pytest for KG build, synthesis, API shapes.

## 11. Boundaries
- **Always:** feature-detect Chrome-only APIs + fallback; preserve Signal design + no-left-border;
  keep agent endpoints + JSON-LD/OKF in sync with the data; run build+lint+test before commit.
- **Ask first:** schema changes that drop data; new dependency; auth/passkey infra; anything
  touching the live pipeline's delivery path; >5-file sweeps.
- **Never:** commit secrets; regurgitate (ship a feature that only re-lists); break the live
  SEO/GEO on `main`; log PII (emails) to analytics.

## 12. Phasing (architecture baked in; built incrementally)
- **M0 — foundation off `main`:** new branch; port Signal Wire/Story/Briefings/Subscribe onto
  **real data** (findings/reports via proxy); one-click subscribe; video player.
- **M1 — findings as the spine:** expose the ~14k **findings** as the deep-linkable unit;
  `/related?mode=semantic` over the **existing ~14.8k embeddings** (no backfill); Wire on findings;
  optionally attach briefing prose to the findings it covers. (`issues/stories` overlay optional.)
- **M2 — analytics + attribution + trending/recsys:** `events`, outbound tagging, dashboard,
  trending badges, anonymous "for you."
- **M3 — knowledge graph + OKF + agent layer:** build `kg_*`; `/related?mode=graph`; OKF bundle;
  WebMCP; `llms.txt`; graph view; leader avatars.
- **M4 — synthesis brain:** GraphRAG that **clusters findings + generates a connective take per
  cluster/entity over the whole corpus** (the Wire's enriched units), nightly + on-demand;
  then dossiers + Connections + trend reports. Briefing prose attached where it exists.
- **Chrome/modern-web-guidance is threaded across ALL milestones** (see §4.6), Chrome-first,
  tracked in a build-scoped `modern-web-audit.md`.
- **M5 — local AI:** on-device summarize / ask-this-story / translate (Chrome-first).

## 13. Success criteria (testable)
- New design live on `main`-derived branch, **on real data**, no hardcoded content.
- Rabbit hole works: any story → ranked related (semantic + graph), never empty, spans archive.
- Trending reflects real engagement; "for you" adapts within a session (anonymous).
- Full funnel visible: a tagged social link → on-site behavior → subscribe, in the dashboard.
- An external agent can answer a question about MindPattern's content via the OKF bundle / WebMCP
  with no custom integration.
- ≥1 synthesis type (dossier or connections) generating genuinely new, sourced views.
- One-click subscribe; video sources play on-site.
- build + lint + test green; Chrome-first features degrade gracefully off-Chrome.

## 14. Open questions
1. **OKF hosting** — emit the bundle from v3 and serve via the frontend, or host statically? (lean: v3 emits, frontend serves at `/okf/`.)
2. **Synthesis cadence/cost** — dossiers/connections generated per run, on-demand, or nightly? (LLM cost vs freshness.)
3. **WebMCP auth/rate-limit** — fully open vs. light key + rate limit for external agents.
4. **Graph view** — adopt Google's OKF static visualizer vs. build a custom intel-board.
5. **Migration** — RESOLVED: none. The ~14.9k findings (~14.8k embedded) already are the corpus; the connective layer (KG/OKF/related/trending) is built over them. Briefings stay as the reading section.
```
