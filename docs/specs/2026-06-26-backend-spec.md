# Spec: MindPattern Backend (v3) — Connective APIs for the Rabbit Hole

**Status:** draft for review (spec-driven, Phase 1) · **Date:** 2026-06-26
**Target repo:** `~/Projects/mindpattern-v3` (deploys to `mindpattern.fly.dev`)
**Consumer:** the rabbit-hole frontend (`~/Projects/mindpattern-rabbit-hole`) via its `/api/proxy`.
**Companion:** `2026-06-26-rabbit-hole-rebuild-spec.md` (frontend), `…-m0-m1-tasks.md`.

## 1. Objective
Make the connective vision real. Today the frontend fakes relatedness with "same
section," and only shows ~20–40 of ~14.9k findings. The backend must:
1. Serve the **whole corpus** at scale (browse/paginate 14.9k; real topic counts).
2. Connect findings by **meaning** (embeddings) and by **knowledge graph**
   (shared entities + typed relationships) — not by category.
3. Expose it as clean JSON the frontend (and later, agents) consume.

**Success in one line:** the frontend deletes its `relatedFor()` placeholder and calls
`/api/related/{id}` — and a skill connects to a paper connects to a launch, across categories.

## 2. Stack & what already exists (confirmed in-repo)
- Python · **FastAPI** (`dashboard/app.py`) · SQLite (`memory.db`) · **fastembed** (BAAI/bge-small, 384-dim) · **numpy**. Routers in `dashboard/routes/`; main JSON API in `dashboard/routes/api.py`; **public-path allowlist in `dashboard/auth.py`** (new endpoints must be added there). Deploy: `fly.toml` + `Dockerfile`.
- **Reuse, don't rebuild:**
  - `memory/embeddings.py` — `embed_text`, `embed_texts`, `cosine_similarity`, `batch_similarities`, `serialize_f32`/`deserialize_f32`, `dot_similarity`.
  - `memory/findings.py` — **already implements semantic search** over findings (query → embed → `np.dot` cosine → ranked dicts with `similarity`). Findings have stored f32 embeddings.
  - `kg/schema.py` — KG tables already defined (see below), **not populated**.
- **Existing endpoints:** `/api/findings` (limit/offset/agent/importance), `/api/search` (semantic), `/api/stats`, `/api/sources`, `/api/reports`, `/api/reports/{date}`. Note: `/findings/{id}` exists only as an **HTML** dashboard page — there is **no JSON finding-by-id**.
- **KG schema (exists):** `kg_entities` (id, entity_type, canonical_name), `kg_entity_aliases`, `kg_edges` (subject_id, object_id, predicate, **finding_id** provenance, bi-temporal `valid_at`/`invalid_at`, `invalidated_by`), `kg_communities` (run_date).

## 3. Deliverables (phased)

### Phase B1 — Semantic connection + scale (now; embeddings already exist)
1. **`GET /api/finding/{id}`** → one finding as JSON (id, run_date, agent, title, summary, importance, source_url, source_name). Unblocks the frontend's batch-find workaround.
2. **`GET /api/related/{id}?mode=semantic&limit=8`** → top-K findings by cosine to finding {id}'s **stored** embedding (no re-embed); exclude self; return `[{…finding, similarity}]`. Reuse `deserialize_f32` + `batch_similarities`. Brute force over ~14.8k vectors (<~150ms); optional per-id cache.
3. **`GET /api/findings`** → add a `total` count + stable ordering so the frontend can **infinite-scroll the full 14.9k**.
4. **`GET /api/topics`** → sections with **real counts** (group by agent/section) so Topics reflects the whole corpus, not 20.
5. Add every new path to the **`dashboard/auth.py`** public allowlist.

### Phase B2 — Knowledge graph (the real "connect in other ways")
6. **KG build job** — `python -m kg.build [--since DATE] [--rebuild]`:
   - **Extract entities** (Company/Product/Person/Paper/Model/Org) + **typed edges**
     (`RELEASED`, `ACQUIRED`, `COMPETES_WITH`, `BENCHMARKED_AGAINST`, `PARTNERED_WITH`,
     `AUTHORED_BY`, `FUNDED`, `SUCCEEDS`, `RUNS_ON`…) from each finding's title+summary
     via an LLM pass (claude) with a **constrained** type/predicate vocabulary.
   - Resolve aliases (`kg_entity_aliases`), dedupe entities, write `kg_edges` with
     `finding_id` provenance + `valid_at`. **Idempotent + incremental** (only new findings).
   - Compute **communities** (label-propagation/Louvain) → `kg_communities`.
   - Link findings ↔ entities via a new `finding_entities(finding_id, entity_id, salience)`.
   - **Cost-bounded:** batch, cache, resumable (one-time 14.9k backfill + nightly delta).
7. **`GET /api/related/{id}?mode=graph`** → findings connected to {id} via shared entities / typed edges (1–2 hops), ranked by edge salience + recency.
8. **`GET /api/entity/{slug}`** → entity dossier data: entity + its relationships + findings mentioning it (powers per-entity dossiers, M4).
9. **`GET /api/graph?entity={slug}&depth=1`** → subgraph (nodes+edges) for the graph view.
10. **`GET /api/related/{id}`** (no mode) → **blended** semantic ∪ graph, deduped, ranked.

### Phase B-Synthesis — content-generation agent loop (original web content from the KG)
The site must **generate its own original content** the way the newsletter pipeline does — but
**entity-driven and web-formatted**, not a daily email blob. A scheduled **agent loop** (reusing
the v3 orchestrator/agent patterns):
- **Selects** what deserves a piece: entities/communities ranked by salience, edge density,
  recency, and (later) trending — e.g. "GLM-5.2", "agent supply-chain security".
- **Retrieves** via GraphRAG: the entity's KG neighbourhood + its findings (semantic + graph).
- **Writes original content** in the house voice (reuse `voice.md`/`soul.md` + banned-words) —
  finding patterns and taking a unique angle, **not** summarising:
  - **Entity dossiers** — "everything on X, with a take";
  - **Connection pieces** — the throughline across 2–3 entities/stories;
  - **Trend / what-changed reports**.
- **Outputs web-native structure** (NOT the email markdown blob): a `syntheses` row with
  `kind`, `slug`, `title`, `dek`, `sections` (JSON: heading + body + optional pull-quote),
  linked `entities` + `findings` + `sources`, hero/meta. Deep-linkable; **embedded** so
  generated pieces join the connective graph and surface in `/api/related`.
- **Cadence:** nightly incremental + on-demand for hot entities. Idempotent, cost-bounded, resumable.

13. **CLI `python -m synthesis.run [--kind dossier|connection|trend] [--entity SLUG]`** — the loop.
14. **`GET /api/syntheses`** + **`GET /api/syntheses/{slug}`** — list + read generated web pieces.
15. Generated pieces are first-class connective nodes: own embeddings + entity links → they appear in `/api/related`, `/api/entity`, and the Wire.

### Phase B3 — engagement + agent layer (later; mirrors frontend M2–M4)
11. **`POST /api/event`** + trending: `events(anon_id, type, target, ref_source, ref_campaign, ts)`, time-decayed trending score, anonymous recsys taste vector.
12. **OKF export** (`/okf/` bundle) + **WebMCP** server + `/llms.txt` (agent/GEO layer).

## 4. Commands
```
uvicorn dashboard.app:app --reload          # local API
python -m kg.build --rebuild                # build/populate the KG (one-time backfill)
python -m kg.build --since 2026-06-26       # nightly incremental
python -m synthesis.run --kind dossier      # agent loop: generate web content from the KG
pytest tests/ -k "related or kg or finding or synthesis" # tests
fly deploy                                   # ship to mindpattern.fly.dev (gated)
```

## 5. Project structure (where things go)
```
dashboard/routes/api.py   → add /api/finding/{id}, /api/related/{id}, /api/topics, /api/entity, /api/graph
dashboard/auth.py         → allowlist the new public paths
memory/findings.py        → add related_by_embedding(finding_id, k) (reuse search internals)
kg/build.py               → NEW: entity/edge/community extraction job
kg/query.py               → NEW: graph-related, entity dossier, subgraph reads
synthesis/run.py          → NEW: agent loop generating web content (dossiers/connections/trends)
synthesis/select.py       → NEW: pick entities/communities worth a piece
memory/db.py              → finding_entities, syntheses, syntheses_embeddings, syntheses_links (+ events later)
tests/                    → test_related.py, test_kg_build.py, test_synthesis.py
```

## 6. Code style
Match existing v3: `APIRouter` in `api.py`, sqlite via `memory/db.py`/`dashboard/memory_db.py`, snake_case, type hints, JSON dict responses. Reuse `memory/embeddings` + `memory/findings` helpers (no new vector dep unless latency forces it). KG modules mirror existing `memory/` patterns.

## 7. Testing
- **pytest:** `/api/finding/{id}` shape; `/api/related?mode=semantic` returns sensible neighbours for a known finding (spot-check relevance ≥ threshold, excludes self); KG build extracts entities/edges on a fixture + is idempotent on re-run; `/api/related?mode=graph` returns entity-connected findings; `/api/topics` counts sum to total.
- **Manual:** curl each endpoint against the live corpus before deploy.

## 8. Boundaries
- **Always:** reuse existing embedding/search helpers; register new paths in `auth.py`; keep `finding_id` provenance + bi-temporal validity on edges; idempotent + incremental KG build; return real `total`s.
- **Ask first:** schema changes that drop data; new heavy deps (graph lib / vector index); touching the live pipeline write path; **deploying to Fly**.
- **Never:** block an API request on a full KG rebuild; lose edge→finding provenance; expose write endpoints unauthenticated; fabricate similarity/edges.

## 9. Success criteria (testable)
- `/api/related/{id}?mode=semantic` returns meaning-connected findings **across categories** on real ids; frontend swaps `relatedFor()` → connections are real.
- KG populated over the 14.9k findings: entities + typed edges (with provenance) + communities; `/api/related?mode=graph`, `/api/entity`, `/api/graph` work.
- Wire/Topics browse the **full corpus** (totals + pagination), not 20.
- The **synthesis agent loop** generates original, **web-formatted** pieces (dossier/connection/trend) from the KG in the house voice — deep-linkable, embedded, surfacing in `/api/related` and the Wire — distinct from the daily email newsletter.
- All endpoints live on Fly and consumed by the frontend via `/api/proxy`.

## 10. Decisions (resolved defaults — flag any to change)
1. **KG extraction model** — **Claude Haiku 4.5** for the one-time ~14.9k backfill (cheap at scale), batched + resumable; nightly delta (~70 new/day) is negligible. Escalate only hard cases to Sonnet if extraction quality demands.
2. **Vector index** — **brute-force numpy cosine** over the 14.8k stored embeddings (already how `memory/findings.search` works; <~150ms). Add `sqlite-vec` only if latency regresses.
3. **Vocabulary** — start from a **controlled** entity-type + predicate set defined in `kg/build.py`; extraction may *propose* new predicates that get curated in, not invented freely.
4. **Deploy** — **ship B1 (semantic + scale) to Fly immediately** (additive, read-only, reuses existing infra — no flag needed); deploy B2 (KG) and synthesis once each is verified.
5. **Synthesis loop** — **lead with dossiers + connection pieces** (~3–5/day), **trend reports** fast-follow; written with **Sonnet/Opus** (low volume → quality over cost); nightly + on-demand for hot entities. Web `sections` schema: `[{ heading, body, pullquote? }]` plus linked entities/findings/sources.
6. **Synthesis vs newsletter** — **same voice (`voice.md`), separate pipeline**: entity-driven cadence + web-structured output (not the email blob). Distinct by design.
