# Backend Plan & Tasks — Connective APIs (v3)

Companion to `2026-06-26-backend-spec.md`. Tasks for B1 (now) + B2 (KG) + B-Synthesis.
B3 stays plan-level. **Repos:** most tasks in `~/Projects/mindpattern-v3`; frontend
consumers marked `[FE]` in `~/Projects/mindpattern-rabbit-hole`. Each backend phase
ends with a **gated Fly deploy** (your explicit go).

## Architecture decisions (from spec §10)
- Reuse `memory/embeddings.py` + `memory/findings.py` (semantic search already exists).
- KG extraction = Claude Haiku 4.5, batched/resumable; brute-force numpy cosine (no new dep).
- Ship B1 to Fly immediately (additive, read-only); B2 + synthesis when verified.
- New public paths must be added to `dashboard/auth.py` allowlist.

## Dependency graph
```
B1 (semantic + scale)            B2 (knowledge graph)              B-Synthesis (agent loop)
 BT1 finding/{id} ─┐              BT7 extract(1) ─ BT8 build ─┬─ BT10 backfill ─ BT11 query ─ BT12 graph APIs
 BT2 related_by_emb ┼─ BT3 /related?semantic                 └─ BT9 communities
 BT4 findings+total │                                  (needs B1 deployed)        (needs B2 populated)
 BT5 /topics        │                                                      BT14 tables ─ BT15 select ─ BT16 run ─ BT17 APIs
 └─[FE] BT6 wire/related on real data                                                              └─[FE] BT18 render
```

---
## Phase B1 — Semantic connection + scale  (v3; fast)

### BT1 — `GET /api/finding/{id}` (JSON)
**Desc:** JSON single-finding endpoint (today only an HTML route exists).
**Acceptance:** returns id, run_date, agent, title, summary, importance, source_url, source_name; 404 on missing.
**Verify:** `curl /api/finding/14907` → JSON; pytest shape.
**Deps:** none. **Files:** `dashboard/routes/api.py`, `dashboard/auth.py`. **Size:** S.

### BT2 — `related_by_embedding(finding_id, k)` (reuse)
**Desc:** load finding {id}'s **stored** embedding, `batch_similarities` vs all, top-K excl self.
**Acceptance:** returns ranked findings + `similarity`; no re-embed; <~150ms.
**Verify:** pytest — known finding → sensible neighbours, self excluded.
**Deps:** none. **Files:** `memory/findings.py`. **Size:** S–M.

### BT3 — `GET /api/related/{id}?mode=semantic`
**Desc:** endpoint over BT2 (`limit` param, default 8).
**Acceptance:** `[{…finding, similarity}]`; cross-category neighbours.
**Verify:** `curl /api/related/14907?mode=semantic` → relevant set.
**Deps:** BT2. **Files:** `dashboard/routes/api.py`, `dashboard/auth.py`. **Size:** S.

### BT4 — `GET /api/findings` returns `total` + stable order
**Desc:** add total count + deterministic order (id desc) so FE can paginate the full 14.9k.
**Acceptance:** response carries `total`; limit/offset walk the whole corpus consistently.
**Verify:** `curl '/api/findings?limit=50&offset=14900'` → tail of corpus; total ≈ 14,924.
**Deps:** none. **Files:** `dashboard/routes/api.py`. **Size:** S.

### BT5 — `GET /api/topics`
**Desc:** sections (agent→section) with **real counts** over the whole corpus.
**Acceptance:** `[{section, count}]` summing to total.
**Verify:** curl; counts match `/api/stats` by_agent.
**Deps:** none. **Files:** `dashboard/routes/api.py`, `dashboard/auth.py`. **Size:** S.

### BT6 [FE] — wire rabbit hole + browse to real data
**Desc:** replace `relatedFor()` placeholder with `/api/related?mode=semantic`; infinite-scroll Wire/Topics over `/api/findings` + `total`.
**Acceptance:** drill shows real semantic related; Wire/Topics browse full corpus.
**Verify:** browser — drill connects across categories; scroll loads more.
**Deps:** BT3, BT4, BT5 deployed. **Files:** `lib/api.ts`, `components/story/rabbit-hole.tsx`, `app/(app)/page.tsx`. **Size:** M.

### ✅ Checkpoint B1 (gated deploy)
- [ ] pytest green; curl all 4 endpoints on real data
- [ ] **`fly deploy`** (your go) → live on `mindpattern.fly.dev`
- [ ] [FE] rabbit hole connects by meaning; Wire browses 14.9k

---
## Phase B2 — Knowledge graph

### BT7 — extraction vocab + single-finding extract
**Desc:** controlled entity-type + predicate set; LLM (Haiku) prompt → entities+edges for ONE finding.
**Acceptance:** given a finding, returns typed entities + edges (constrained vocab) as structured data.
**Verify:** pytest on a fixture finding → expected entities/edges.
**Deps:** none. **Files:** `kg/build.py` (extract + vocab). **Size:** M.

### BT8a — entity upsert + alias dedupe
**Desc:** given extracted entities (BT7), upsert into `kg_entities`, resolve aliases (`kg_entity_aliases`), dedupe by canonical_name + type.
**Acceptance:** entities upserted; aliases linked; same entity across findings → one row.
**Verify:** pytest — two findings naming "GLM-5.2"/"GLM 5.2" → one entity + alias.
**Deps:** BT7. **Files:** `kg/build.py`, `memory/db.py` (finding_entities). **Size:** S–M.

### BT8b — edge writing + incremental driver
**Desc:** write `kg_edges` (finding_id provenance, `valid_at`); link `finding_entities`; driver iterates findings, idempotent + incremental (`--since`), resumable.
**Acceptance:** edges carry provenance; re-run idempotent (no dupes); `--since` processes only new findings.
**Verify:** pytest on a 20-finding fixture; re-run → stable counts.
**Deps:** BT8a. **Files:** `kg/build.py`. **Size:** S–M.

### BT9 — communities
**Desc:** label-propagation over kg_edges → `kg_communities`.
**Acceptance:** entities grouped into communities for a run_date.
**Verify:** pytest on fixture graph → ≥1 community.
**Deps:** BT8b. **Files:** `kg/build.py`. **Size:** S–M.

### BT10 — backfill the 14.9k corpus
**Desc:** run `python -m kg.build --rebuild` (Haiku, batched, resumable, cost-logged).
**Acceptance:** KG populated over all findings; cost recorded; resumable on interrupt.
**Verify:** counts (entities/edges) sane; spot-check edges have provenance.
**Deps:** BT8b, BT9. **Files:** job run (no new code). **Size:** M *(runtime/cost, not code)*.

### BT11 — `kg/query.py` reads
**Desc:** `graph_related(finding_id)`, `entity_dossier(slug)`, `subgraph(slug, depth)`.
**Acceptance:** functions return entity-connected findings / dossier / nodes+edges.
**Verify:** pytest on populated fixture.
**Deps:** BT8b. **Files:** `kg/query.py`. **Size:** M.

### BT12 — graph API endpoints
**Desc:** `/api/related/{id}?mode=graph`, `/api/entity/{slug}`, `/api/graph`; default `/api/related` = blended semantic∪graph.
**Acceptance:** endpoints return real graph connections; blended deduped/ranked.
**Verify:** curl each on real ids; allowlisted.
**Deps:** BT11. **Files:** `dashboard/routes/api.py`, `dashboard/auth.py`. **Size:** M.

### ✅ Checkpoint B2 (gated deploy)
- [ ] KG populated + idempotent; graph/entity/graph endpoints green
- [ ] **`fly deploy`** → live
- [ ] [FE] BT13: rabbit hole uses blended related; entity dossier + graph view *(separate FE task)*

---
## Phase B-Synthesis — content agent loop

### BT14 — syntheses schema
**Desc:** `syntheses(id, kind, slug, title, dek, sections JSON, created_at, refreshed_at)`, `syntheses_embeddings`, `syntheses_links`.
**Acceptance:** tables created; init idempotent.
**Verify:** schema init test. **Deps:** none. **Files:** `memory/db.py`. **Size:** S.

### BT15 — `synthesis/select.py`
**Desc:** rank entities/communities worth a piece (salience, edge density, recency).
**Acceptance:** returns prioritized targets with kind hint.
**Verify:** pytest on populated KG fixture. **Deps:** BT8b. **Files:** `synthesis/select.py`. **Size:** S–M.

### BT16a — GraphRAG generate (one piece)
**Desc:** retrieve an entity's KG neighbourhood + findings → generate a dossier/connection in voice (`voice.md`) as structured `sections` JSON (heading/body/pullquote) + title/dek.
**Acceptance:** returns a web-structured piece for a target; obeys voice + banned-words.
**Verify:** `python -m synthesis.generate --entity <slug> --kind dossier` → structured JSON; manual read for voice/quality.
**Deps:** BT11. **Files:** `synthesis/generate.py`. **Size:** M.

### BT16b — persist + embed + loop driver
**Desc:** write `syntheses` row + embedding + `syntheses_links`; loop over BT15-selected targets; idempotent (refresh not dupe); on-demand + nightly.
**Acceptance:** generated piece stored, embedded, linked; re-run refreshes; loop runs over top targets.
**Verify:** `python -m synthesis.run --kind dossier` → rows + embeddings; re-run stable counts.
**Deps:** BT16a, BT14, BT15. **Files:** `synthesis/run.py`. **Size:** S–M.

### BT17 — syntheses APIs + inclusion in related
**Desc:** `/api/syntheses`, `/api/syntheses/{slug}`; include syntheses in `/api/related`.
**Acceptance:** list/read work; generated pieces surface in related.
**Verify:** curl; a synthesis appears in a finding's related. **Deps:** BT16b. **Files:** `dashboard/routes/api.py`, `dashboard/auth.py`, `kg/query.py`. **Size:** S–M.

### ✅ Checkpoint B-Synthesis (gated deploy)
- [ ] loop generates web-formatted dossiers/connections in voice; embedded + linked
- [ ] **`fly deploy`** → live; [FE] BT18 renders synthesis pages + surfaces them on the Wire

## Parallelization
- **B1**: BT1/BT2/BT4/BT5 independent → parallel; BT3 after BT2; BT6 after deploy.
- **B2**: BT7→BT8a→BT8b→(BT9, BT11) ; BT10 after BT8b/BT9 ; BT12 after BT11.
- **B-Synthesis**: BT14 parallel with B2; BT15→BT16a→BT16b after KG populated (BT10).

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| KG extraction quality/cost over 14.9k | High | Haiku + constrained vocab; batch/resumable; sample-validate before full backfill (BT7→BT10) |
| Fly deploy breaks live backend | High | B1 additive/read-only; deploy gated + smoke-tested; roll back on error |
| Synthesis voice/quality | Med | reuse voice.md + eval gate before publish; start low volume |
| cosine latency at scale | Low | brute-force fine at 14.8k; sqlite-vec only if needed |

## Open items for your go
- Confirm **B1 → Fly deploy** is authorized once green (read-only, additive).
- KG backfill (BT10) will incur Haiku cost over 14.9k findings — proceed?
