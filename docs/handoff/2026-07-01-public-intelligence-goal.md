# Goal run — Rabbit Hole public intelligence site (2026-07-01)

Runbook for the /goal: make Rabbit Hole the public MindPattern intelligence product.
Repos: v3 (backend/content machine) + rabbit-hole (site). Both on
`feature/rabbit-hole-public-intelligence-site`.

## Phase 1 — Reproduce bad behavior · DONE

Evidence captured 2026-07-01 against live `mindpattern.fly.dev` + local `next dev`
(port 3100, default backend = live).

Story tested: `/s/2026-07-01-vercel-and-shopify-are-rebuilding-hydrogen-from-scratch`

1. **Raw graph trail was the main story UX.** Page rendered a "Graph trail" section
   with raw relationships (`part of issue`, `cites source url`, `mentions entity`),
   each row repeating the story slug as "evidence".
2. **Junk entities.** Live `entity_refs` included `Announced`; `topic_terms` included
   `announced, being, easy, burned, dominant`. Cause: naive `_ENTITY_RE` extractor in
   v3 `orchestrator/site_content.py`.
3. **No related paths.** Live `related_paths: []` on every story checked.
4. **Junk entity pages crawlable.** `/e/announced` rendered a full entity page.
5. **Broken links.** `/e/mcp`, `/e/gpt`, `/e/cve` 404'd from briefing pages; topic/arc
   edges carried empty target_urls.

## Phases 2-3 — Reader-facing related paths · DONE
- v3 `orchestrator/story_related.py` (new, pure): evidence-backed related paths —
  shared entity/source/topic/finding/arc + temporal continuation ("What happened
  next" / "Earlier coverage"), contrast ("Tension"), downstream implication, and
  semantic neighbor via stored finding embeddings (threshold 0.45). Text signals
  only fire on top of shared graph evidence — no fabricated links.
- `GET /api/stories/{slug}` returns populated `related_paths` with reader-facing
  `connector_labels` + prose `reason`; story list gets a 5-min mtime-aware cache
  (detail request: 1.9s cold → 42ms warm).
- FE story page: raw "Graph trail" section deleted; "Related stories" (connector
  labels + evidence-backed reasons) is the connection UX. Left-border take callout
  replaced with bordered tinted card.
- Tests: `tests/test_story_related_paths.py` (11), contract test updated to assert
  populated reader-facing related paths.

## Phase 4 — Entity/topic noise filtered · DONE
- Single source of truth: `_TOPIC_STOPWORDS` (site_content) extended with generic
  verbs/adjectives; API filters (`_is_public_entity_ref`, `_public_story_topic_terms`,
  `_public_story_edges`) drop junk from entity_refs, topic_terms, and graph_edges.
- Entity-page blocklist now includes the noise set → `/e/announced` 404s.
- Tests: `tests/test_public_entity_noise.py` (7).

## Phase 5 — Link audit · DONE
- Crawl of 12 seed pages → 482 unique internal links → **0 bad** (was 3).
- Short acronym allowlist (`mcp, gpt, cve, aws, gcp`) so real acronym entities
  resolve while junk stays blocked.
- Engine arc edges now point at the real `/arc/{id}?date=` route (was `/arcs/…`).

## Phase 6 — v3 agentic website-content pipeline · DONE
Runs in the SITE_CONTENT phase after newsletter DELIVER; fails open; newsletter
untouched (CRITICAL_PHASES and DELIVER paths unmodified).
- **Story writer agent**: `orchestrator/site_writer.py` — env-gated
  (`MP_SITE_STORY_WRITER=claude`) live copywriter over `claude -p` (same
  subscription boundary as newsletter agents; no new providers/credentials).
  Copy validated (required fields, length caps, no invented URLs) and re-run
  through the quality gate; any failure falls back to deterministic copy.
- **Dossiers**: `orchestrator/site_dossiers.py` — evidence-only entity/source
  dossier artifacts (timeline, top sources, relationships); junk slugs filtered;
  written to `reports/{user}/site-dossiers/…`; refreshed each pipeline run
  (`MP_SITE_DOSSIERS_DISABLED=1` to skip). 31 artifacts generated locally.
- **Arc wiring**: engine loads narrative-arc memberships → stories carry real
  `arc_ids`; corpus ledger reports real arc coverage.
- **Public API**: `GET /api/dossiers/entities/{slug}`, `GET /api/dossiers/sources/{domain}`;
  `/api/entities/{slug}` embeds its dossier; `/api/dossiers` allowlisted.
- Existing collector/candidates/graph-packs/quality-gate/artifact-writer stack
  retained (deterministic experts remain the test/dry-run boundary).
- Tests: `tests/test_site_writer.py` (8), `tests/test_site_dossiers.py` (7).

## Phase 7 — Rabbit Hole renders artifacts · DONE
- Entity pages render the compiled dossier (take when present, dated timeline,
  top-source chips). Verified on `/e/arxiv` against local artifacts.
- Story/briefing/entity/source/finding/arc routes all verified 200 against the
  local content machine; templates are fully dynamic (no hand-built pages).

## Phase 8 — SEO/AEO · DONE
- v3 `GET /api/site/sitemap`: published story slugs+dates, dossier-backed entity/
  source slugs, briefing dates (substantive pages only — no thin-page spam).
- FE `sitemap.xml` now lists the full public graph: 4,277 URLs locally
  (3,976 stories, 136 briefings, 132 blog, 15 entities, 15 sources).
- Canonical URLs confirmed on story/entity/source/arc/briefing/blog; added to
  finding pages (+ noindex on missing findings). JSON-LD + robots already solid.

## Phase 9 — Privacy-safe analytics · DONE
- Vercel Analytics (pageviews/referrers) + custom events: `related_click` (with
  connector labels), `entity_click`, `source_click`, `outbound_source_click`,
  `briefing_click`, `scroll_depth` (25/50/75/100 on stories + briefings),
  `subscribe_submitted`/`subscribe_success` (both surfaces, never the email),
  `web_vital` via next/web-vitals sampled at 20%. No PII anywhere; all fire-and-forget.

## Verification
- v3: `pytest tests/` → **1429 passed** (was 1410 passing + 3 stale failures).
- rabbit-hole: `pnpm build` clean, `pnpm lint` clean.
- Link audit: 482 internal links, 0 bad.
- Local smoke: story page shows Related stories with readable connectors, clean
  entities, no raw trail; `/e/announced` 404; sitemap covers the graph.

## Commits
v3 (`feature/rabbit-hole-public-intelligence-site`):
- `2ad7af8` test: cover SITE_CONTENT in pipeline phase order
- `ed7bd71` feat: reader-facing story related paths + graph noise filtering
- `c4df4a4` fix: resolve short acronym entity pages (mcp, gpt, cve)
- `6843c0d` feat: agentic site writer, dossier artifacts, arc wiring
- (sitemap endpoint commit follows)

rabbit-hole (`feature/rabbit-hole-public-intelligence-site`):
- `e196771` feat: make related stories the story-page connection UX
- `472b9ea` feat: render content-machine entity dossiers
- (sitemap commit) feat: sitemap covers the full public graph
- `cf35e3a` feat: privacy-safe analytics events

## Deploy status
**Not deployed** — Fly/Vercel deploys are gated per the goal. Live site still
shows the old behavior until deploy. Deploy order: v3 first (API additive,
read-only), then rabbit-hole.

## Left dirty on purpose (pre-existing, unrelated)
- v3: `run-launchd.sh` + `tests/test_launchd_wrapper.py` (skip-social default),
  `data/ramsay/*` runtime data (never commit), `data/social-drafts/eic-topic.json`.
- v3 untracked: `reports/ramsay/site-dossiers/` (runtime artifacts, gitignored).

## Env gates (all default-safe)
- `MP_SITE_STORY_WRITER=claude` — enable the live story copywriter.
- `MP_SITE_STORY_WRITER_MODEL` — override writer model (default claude-sonnet-5).
- `MP_SITE_DOSSIERS_DISABLED=1` — skip dossier refresh.
- `MP_SITE_CONTENT_DISABLED=1` / `MP_SITE_CONTENT_MAX_STORIES` — unchanged.
