# Spec: Make mindpattern.ai links fast and reliable

**Date:** 2026-07-08 · **Status:** DRAFT — awaiting Tayler's review
**Repos:** `mindpattern-rabbit-hole` (Next.js frontend, Vercel) + `mindpattern-v3` (FastAPI backend, Fly.io)

## Objective

Every link on mindpattern.ai responds in under ~1s, all day, every day —
including right after the nightly publish, including deep archive stories,
entity pages, source pages, and finding pages. Slowness must never look like
breakage: if something is slow, the reader sees a loading state, never a
frozen click.

## Confirmed root causes (from the 2026-07-08 investigation)

Evidence gathered by two audits (frontend fetch map + backend endpoint cost
audit) and live measurements. Numbered by severity.

### Backend (mindpattern-v3, one shared-cpu-2x Fly machine)

1. **One event loop does everything, and almost every handler blocks it.**
   uvicorn runs a single worker (`start.sh:12`); every public handler is
   `async def` doing synchronous sqlite / file reads / numpy / ONNX inference
   directly on the loop. One expensive request stalls the whole server —
   including `/healthz`, which then fails Fly's 5s check and makes the edge
   drop traffic (links "don't work at all").
2. **Uncached full-corpus endpoints.** Measured hanging >30s live:
   - `/api/entities/{slug}` (`api.py:2503`): 2 DB connections + graph LIKE
     scans over 15.6k findings + can parse **all 157 report files** in one
     request. Feeds `/e/…` pages.
   - `/api/finding/{id}` + `/api/findings/{id}` (`api.py:777,810`):
     ~1,000–1,800 sqlite queries per request (related-paths). Feeds `/f/…`.
   - `/api/related/{id}` (`api.py:819`): deserializes + dots all 15.5k
     embeddings (~24 MB) per request. Feeds rabbit-hole drills.
   - `/api/search`, `/api/search/site`, `/api/skills/search`: ONNX embedding
     inference + full 15.5k-row scan per keystroke-ish request.
   - `/api/issues/{date}/structured` (`api.py:1680`): parses the report +
     **every one of 136 story JSONs** per request. Feeds briefing pages.
   - `/api/sources/{domain}` → feeds `/source/…` (measured >30s).
   - `/api/reports/search`: reads all 157 md files per request.
3. **Connection churn:** every request opens a fresh sqlite connection and
   re-runs `PRAGMA journal_mode=WAL` (`api.py:448`); the events DB re-runs its
   schema script per open and fsyncs per event.
4. **Shared machine:** the Slack bot and pipeline post-generation (`claude -p`)
   compete for the same 2 shared vCPUs.

### Frontend (mindpattern-rabbit-hole on Vercel)

5. **No fetch timeout anywhere that matters.** `backendFetch` (`src/lib/api.ts:29`)
   and the client proxy (`src/app/api/proxy/[...path]/route.ts`) wait forever.
   A bogged backend = a silently hung page.
6. **No loading/error boundaries.** Zero `loading.tsx` / `error.tsx` files. A
   slow render shows nothing — indistinguishable from a dead link. (Only
   exception: the rabbit-hole drill component has an 8s abort.)
7. **Everything re-renders on demand with a 60s cache.** No
   `generateStaticParams`; every route exports `revalidate = 60`, so the whole
   archive perpetually goes cold. `/briefings` and `/blog/[date]` are
   `force-dynamic` (no cache at all).
8. **Traffic amplifiers:** sitemap hands the full archive to 13+ AI crawlers
   with no crawl-delay (`app/robots.ts`); homepage viewport-prefetches dozens
   of story routes; homepage itself makes ~8–10 backend calls including a
   sequential 6-call pagination loop (`(app)/page.tsx:36-49`); middleware
   POSTs `/api/event` to Fly for every bot page hit.

### Already fixed and deployed (2026-07-07/08)

- Story list rebuild off the event loop + cached (bug #1, `f7960ca`).
- Story embedding index cached, single-flight (`92a143d`).
- `/api/stories/{slug}` full-response cache keyed by content fingerprint +
  bounded enrichment concurrency (`748b729`).
- Result: story links (`/s/…`) now 0.2–0.7s. Entity/source/finding links and
  post-publish warm-up remain broken — this spec covers them.

## The Fix — three phases

### Phase 1 — Stop the bleeding (backend, ship this week)

Apply the proven story-endpoint recipe to every Tier-S/A endpoint:

- Move each blocking handler body into `asyncio.to_thread`, gated by the
  existing enrichment semaphore so bursts can't starve the loop.
- Add module-level TTL + fingerprint caches (same pattern as
  `_STORY_RESPONSE_CACHE`) for: entities, finding/related, structured issues,
  sources-by-domain, reports list/search, stats, sitemap.
- One shared read-only sqlite connection (or small pool) instead of
  open-per-request; stop re-running WAL pragma and events schema per request.
- Keep `/healthz` trivially cheap and never behind any shared lock.

**Acceptance:** with the cache cold, a parallel crawl of 20 mixed URLs
(`/e/…`, `/f/…`, `/source/…`, `/s/…`) never fails the health check and every
request completes < 10s; warm, every request < 1s.

### Phase 2 — Make slowness invisible (frontend, ship same week)

- `backendFetch` + proxy route: 10s `AbortSignal` timeout; story/briefing
  pages degrade gracefully (render without the slow fragment) instead of
  hanging.
- Add `loading.tsx` for `(app)` routes (skeleton wire-rows per Spectrum
  system) and `error.tsx` with a retry.
- Raise `revalidate` to 1 hour on `/s`, `/e`, `/source`, `/f`, `/arc` pages;
  remove `force-dynamic` from `/briefings` and `/blog/[date]`; replace the
  home page's sequential pagination loop with one `limit=300` call (or a
  backend `stories/index` endpoint).
- `prefetch={false}` on the full-archive rail (keep prefetch for the top
  fold); add `crawlDelay` for the AI crawler pack in `robots.ts`.

**Acceptance:** clicking any link always changes the screen within ~200ms
(loading state); no route can hang the browser tab; Vercel data-cache hit
ratio measurably up.

### Phase 3 — Durable architecture (next)

- **Precompute at publish:** the nightly pipeline writes finished story JSON
  (related paths included) and entity/source/finding page payloads to disk;
  request path becomes "read a file." Server-side caches stay as fallback for
  archive gaps.
- **Purge-on-publish:** after the nightly sync, the pipeline pings a Next.js
  revalidation webhook so pages update within minutes while cache TTLs stay
  long (site freshness target: within ~15 min of publish).
- Consider `uvicorn[standard]` + 2 workers once caches are process-safe, and
  a sqlite vector index (or precomputed neighbor lists) to retire the 15.5k
  embedding scans entirely.

## Commands

- Backend tests: `cd ~/Projects/mindpattern-v3 && .venv/bin/python -m pytest tests/ -q`
- Backend compile gate (Fly is Python 3.11): `python3.11 -m py_compile dashboard/routes/api.py`
- Backend deploy: `~/.fly/bin/flyctl deploy -a mindpattern --strategy immediate`
- Frontend dev: `cd ~/Projects/mindpattern-rabbit-hole && npm run dev`
- Frontend build check: `npm run build`
- Live smoke: `curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://mindpattern.ai/<path>`

## Boundaries

- **Always:** run backend tests + `py_compile` (3.11) before any Fly deploy;
  measure live latency before and after each deploy; keep `/healthz` cheap.
- **Ask first:** Fly machine size/worker-count changes; new dependencies;
  anything that changes what readers see (loading skeleton design included —
  must follow the Spectrum system, no cards/shadows/left-border callouts).
- **Never:** deploy without the compile gate; cache private/unsanitized data;
  break the nightly pipeline's publish path.

## Success criteria

1. Any link (story, entity, source, finding, briefing) warm: < 1s TTFB.
2. Cold-cache worst case: < 10s AND the reader sees a loading state, never a
   frozen click.
3. Fly health check green through a full crawler sweep of the sitemap.
4. Morning after a nightly publish: new content visible within 15 min, site
   snappy throughout the refresh (no thundering-herd relapse).

## Open questions (need Tayler's call)

1. **Precompute at publish (Phase 3)** — recommended; OK to extend the
   pipeline for it?
2. **Freshness window** — is "new content live within ~15 min of nightly
   publish" acceptable? (Enables the long cache TTLs.)
3. **Infra budget** — software-only first (recommended), or also bump the Fly
   machine for headroom while phases land?
