# Research: Content-Heavy Sites + a Content System for MindPattern

> Companion to `handoff-analytics-home-redesign.md` (in the worktree). This corrects the
> design direction: **newsletter *sections* become the stories**, not "homepage = articles,
> newsletters hidden in /blog." It answers the user's first ask — *find content-heavy sites
> and study how they break up and present content* — and ties it back to MindPattern's real data.

---

## 1. The core problem (grounded in the actual codebase)

What a "newsletter" is today:

```ts
// src/lib/types.ts
interface Report { date: string; title: string; content: string; filename: string }
//                                          ^^^^^^^ one markdown blob — no sections
```

- **No structure.** The `##` headings in `content` only *look* like sections after `react-markdown`
  renders them. Nothing in the data knows "Agent News" is a distinct unit.
- **No frontend DB.** Everything is fetched live from `https://mindpattern.fly.dev`; newsletters
  live there as `YYYY-MM-DD.md` files. The frontend is read-only.
- **Structured atoms already exist but are orphaned.** The pipeline emits `Finding` records:
  ```ts
  interface Finding { id; run_date; agent; title; summary; importance; category?; source_url; source_name }
  ```
  These are exactly the kind of addressable, categorizable units we want — but they aren't linked
  to the written newsletter prose.

**Consequence:** every goal on the wishlist — section-as-story, deep linking, "store it proper /
save it another way," richer presentation — reduces to *one move*: **break the blob into structured,
individually-addressable sections.** That is precisely what every content-heavy site below does. The
research isn't about decoration; it's about the data shape that makes the UX possible.

---

## 2. How content-heavy sites break up & present content (the research)

Six patterns, each with named exemplars and how it maps to MindPattern.

### A. The atom/card model — Axios "Smart Brevity"
Each story is a self-contained **card**: a sharp headline, a one-line "why it matters," a few bullets,
then a "go deeper" link. Cards are the fundamental unit — readable in isolation, stackable into a feed,
individually linkable. The whole newsletter is *just a stack of cards*, and any card can stand alone.
- **Maps to:** each newsletter section/item becomes a card with `headline → why it matters → detail → source`.
  This is the single most important pattern for "sections as stories."
- Source: [Axios Smart Brevity](https://www.axios.com/smart-brevity), [Formats Unpacked: Axios](https://www.formatsunpacked.com/p/formats-unpacked-axios)

### B. The story stream / narrative thread — The Verge "StoryStream"
Independent stories about one topic are pulled into a single vertically-scrolling, chronologically
ordered **stream**. A topic overview sits on top; a side panel reminds you each story is part of a
*bigger narrative* and lets you jump between entries. This is almost exactly the user's phrasing:
"sections as stories on the home page with deep linking into other content."
- **Maps to:** the homepage is a stream of section-stories; each section page shows a "more in this
  thread / same category" panel. Topic = the connective tissue.
- Source: [The Verge redesign / StoryStream — Nieman Lab](https://www.niemanlab.org/2022/09/the-verge-goes-back-to-bloggy-basics-with-a-new-redesign/)

### C. One visual per section, scroll the stack — The Pudding
Long-form is split into sections where **each section owns one chart/visual**; the reader scrolls down
"the stack" from section to section. Structure is decided up front ("story contours") from the data,
not improvised. Rhythm and a single focus per section prevent fatigue.
- **Maps to:** a section page (or a long briefing) renders as a stack of focused units — heading +
  body + (optional) one chart/quote/source — instead of a wall of markdown.
- Source: [How The Pudding structures stories as visual essays — Storybench](https://www.storybench.org/pudding-structures-stories-visual-essays/)

### D. Source trail / "show your work" — Bellingcat, The Markup
OSINT and accountability journalism expose **sources and methodology as first-class content**, near the
claim — not buried in an archive. The citation list *is* part of the story's credibility and design.
- **Maps to:** on-brand for the "Wire Room / declassified dossier" aesthetic. Every section-story
  carries a visible **source trail** (you already extract URLs; promote them to structured `sources[]`).
- Source: [Bellingcat](https://www.bellingcat.com/), [Data journalism presentation taxonomies — Wikipedia](https://en.wikipedia.org/wiki/Data_journalism)

### E. Pillar + cluster / topic hubs — internal-linking architecture
A "pillar" topic page links to many "cluster" sub-stories, and every cluster links back to the pillar and
to adjacent clusters — **bidirectional internal linking**. Clean topic subfolders, breadcrumbs, no
query-string routing. This is the mechanism behind "when reading a topic, show other articles in the
same category."
- **Maps to:** topic pages (`/topic/agent-systems`) as pillars; section-stories as clusters; "related
  in {topic}" derived from the section's `category`, not keyword guessing.
- Source: [Topic clusters & pillar pages — Search Engine Land](https://searchengineland.com/guide/topic-clusters), [Siteimprove](https://www.siteimprove.com/blog/pillar-and-cluster-content-strategy/)

### F. Editorial layout primitives — magazine/editorial design
Across content-heavy sites (McKinsey, PrintMag, the editorial-design literature): a **grid**, **pull
quotes**, **sidebars**, generous **whitespace**, and **headings as real anchors** break dense text into
scannable rhythm. Cards-with-image-not-full-text on index pages; full text only on the read page.
- **Maps to:** keep density (the brand wants it) but add rhythm — pull quotes, a stats strip, a source
  sidebar, one idea per block.
- Source: [Content blocks — Sanity](https://www.sanity.io/glossary/content-block), [Best content-heavy editorial designs — New Media Campaigns](https://www.newmediacampaigns.com/blog/best-examples-of-content-heavy-editorial-website-designs), [Modular layout styles — Blocks Edit](https://blocksedit.com/content-code/design-technique-layout-styles/)

---

## 3. How to store it "proper in the DB" — the content model

The user said: *"the newsletter section needs to be stored proper into the DB so if I need it saved in
another way."* That instinct has a name in content engineering: **structured content / COPE (Create
Once, Publish Everywhere)** — turn an undifferentiated blob into **modular chunks managed independently
and recombined per channel** (homepage story, topic stream, the issue page, the email, an API).
- Source: [COPE & structured content — Sanity](https://www.sanity.io/structured-content-101), [Atomic content modeling — Contentful](https://www.contentful.com/resources/atomic-content-modeling-with-contentful/), [Intro to structured content — Digital.gov](https://digital.gov/resources/an-introduction-to-structured-content)

### Concrete shape: Issue → Section → Blocks

Model a newsletter as an **Issue** that contains ordered **Sections**; each Section's body is an array
of typed **blocks** (the [Portable Text](https://www.sanity.io/blog/why-structured-text-is-awesome-and-you-totally-want-it-in-your-cms)
pattern — rich text as queryable JSON instead of a markdown string):

```jsonc
// Issue (the "newsletter" — now a compilation, not the content itself)
{ "id": "2026-06-23", "title": "Daily AI Research Briefing", "date": "2026-06-23",
  "sectionIds": ["sec_agent-news_0623", "sec_research_0623", ...] }

// Section (THE unit — a deep-linkable "story")
{
  "id": "sec_agent-news_0623",
  "slug": "claude-opus-mcp-function-calling",   // its own URL: /s/<slug>
  "issueId": "2026-06-23",
  "topic": "coding-agents",                      // drives "related in category"
  "heading": "Claude Opus gains MCP function calling",
  "whyItMatters": "First-class tool use lands in the flagship model.",  // Axios pattern
  "body": [                                      // Portable Text array-of-blocks
    { "_type": "block", "style": "normal", "children": [{ "_type": "span", "text": "Anthropic shipped…" }] },
    { "_type": "pullquote", "text": "Tool use is now native, not bolted on." },
    { "_type": "block", "style": "h3", "children": [{ "_type": "span", "text": "What changes" }] }
  ],
  "findingIds": [4521, 4522],                    // links the prose to existing structured atoms
  "sources": [                                   // promoted from regex-extracted URLs → first-class
    { "name": "Anthropic Blog", "url": "https://anthropic.com/news/claude-opus" }
  ]
}
```

Why array-of-blocks beats the markdown blob (from the Portable Text research):
- **Deep-linkable & queryable** — a section has an id/slug/topic; you can fetch "sections where topic = X."
- **Reusable / "saved another way"** — the same section renders to the homepage card, the issue page,
  the email, or an API export, with no copy-paste. That's literally the COPE payoff.
- **Re-presentable** — custom block types (`pullquote`, `callout`, `chart`, `sourceTrail`) map to React
  components, so "present the custom written content better" becomes a rendering concern, not a parse hack.
- **Findings get connected** — `findingIds` joins the written prose to the structured atoms that already
  exist, so a story carries its evidence.

### Where this work has to happen (important caveat)
The frontend is **read-only**; the blob is generated and stored on the `fly.dev` backend. So the *proper*
fix is a **backend change**: the pipeline emits structured sections, and the backend stores them
(a `sections` table / document store) and serves `/api/sections`, `/api/issues/{date}`, `/api/topics/{id}`.
- **Pragmatic bridge to prototype the UX now (no backend change):** the blob already contains `##`
  section headers. Parse the markdown into sections **at build/request time** in the frontend
  (`split on h2 → {heading, body, topic via category match, sources via URL extraction}`). This lets us
  build and validate the section-as-story UX immediately, then swap the data source to the real
  `/api/sections` once the backend lands — same components, same shapes. Flag clearly that the bridge is
  a heuristic, not the source of truth.

---

## 4. Recommended direction for MindPattern

1. **Homepage = a stream of section-stories** (StoryStream), grouped/filterable by topic, densest-first.
   Each item is an Axios-style card: `heading → why it matters → 1–2 lines → source`.
2. **Each section-story has its own URL** (`/s/<slug>`), richly presented: dossier card → full read,
   block-rendered body (pull quotes, callouts), a visible **source trail**, and a **"more in this
   thread / same category"** panel (pillar/cluster).
3. **The newsletter issue page** (`/blog/<date>` → `/briefing/<date>`) is the *compiled* view of that
   day's sections — same structured data, different layout. Newsletters and stories stop being two
   different UX objects; they're two *views* of one content system.
4. **Keep the Wire Room aesthetic.** The source-trail / show-your-work / dossier-card patterns are a
   native fit — this direction makes the brand *more* itself, not less.
5. **Custom, not shadcn**, on these new surfaces (per the existing handoff direction); reference
   `~/Projects/stitch-studio` for look-and-feel.

---

## 5. Decisions needed before building

1. **Data path:** build the **frontend markdown→sections bridge first** (fast, no backend), or block on
   the **backend `/api/sections`** schema (proper, slower)? *Recommendation: bridge first to nail the UX,
   backend second.*
2. **What is a "section/story"?** Editorial prose only, or prose **+ linked Findings** as evidence?
   *Recommendation: both — `findingIds` connects them.*
3. **Granularity:** is a "story" a whole `##` section (e.g. "Agent News") or each item within it?
   *Likely each item, so stories are atomic and deep-linkable.*
4. **Scope of this pass:** keep iterating the worktree on `analytics-home-redesign`, or fold into the
   v1 rebuild? (Memory notes a v2 rebuild repo exists — confirm which tree is canonical.)

---

## Sources
- Axios Smart Brevity / card model — https://www.axios.com/smart-brevity · https://www.formatsunpacked.com/p/formats-unpacked-axios
- The Verge StoryStream — https://www.niemanlab.org/2022/09/the-verge-goes-back-to-bloggy-basics-with-a-new-redesign/
- The Pudding visual essays — https://www.storybench.org/pudding-structures-stories-visual-essays/
- Bellingcat / data journalism — https://www.bellingcat.com/ · https://en.wikipedia.org/wiki/Data_journalism
- Topic clusters & pillar pages — https://searchengineland.com/guide/topic-clusters · https://www.siteimprove.com/blog/pillar-and-cluster-content-strategy/
- Structured content / COPE / atomic content — https://www.sanity.io/structured-content-101 · https://www.contentful.com/resources/atomic-content-modeling-with-contentful/ · https://digital.gov/resources/an-introduction-to-structured-content
- Portable Text (array-of-blocks storage) — https://www.sanity.io/blog/why-structured-text-is-awesome-and-you-totally-want-it-in-your-cms · https://www.sanity.io/glossary/content-block
- Editorial/modular layout — https://www.newmediacampaigns.com/blog/best-examples-of-content-heavy-editorial-website-designs · https://blocksedit.com/content-code/design-technique-layout-styles/
