# Spectrum — Rabbit Hole visual system

Crisp white + near-black with giant variable-width grotesque type, where **every
research topic owns a saturated color**. Color IS the taxonomy: kickers, tag
chips, chart fills, hover floods. The site must feel ALIVE — motion is a
first-class requirement, not decoration. **UX, DOM structure, routes, copy, and
data logic unchanged.**

Supersedes `broadsheet-spec.md` (rejected: read as Anthropic/Claude branding).
Also rejected: terminals/mono-heavy consoles, cream+serif, Inter/cobalt/cards.

## Tokens (`src/app/globals.css`)

| Token / class | Value | Use |
|---|---|---|
| `bg-paper` | `#ffffff` | page |
| `bg-surface` | `#fafafa` | inputs, raised zones |
| `bg-panel` / `bg-spine` | `#f2f2f4` | tinted zones, hovers |
| `text-ink` | `#0e0e0f` | type |
| `text-ink-prose` | `#1d1d20` | serif article body |
| `text-ink-soft` / `text-ink-faint` | `#55555a` / `#77777d` | secondary / meta (faint ≥11px only) |
| `border-line` / `border-line-soft` | `#e8e8ea` / `#f0f0f2` | hairlines |
| `border-ink` | `#0e0e0f` | row rules (feed rows use INK rules, not gray) |
| `text-primary` / `bg-primary` | `#e63b12` | brand accent (wordmark, CTAs, active nav) |
| `--spectrum-1..5` | `#e63b12` `#0a8f3c` `#0797a6` `#cf2d7b` `#f5c518` | topic colors (also `--chart-1..5`) |
| `--spectrum-5-text` | `#a8850b` | yellow's AA text variant on white |

Topic → color: `topicColor(name)` in `src/lib/topic-color.ts` hashes a
topic/section string to a stable `var(--spectrum-N)` (and its text variant).
Rows/pages set `--tc` (+ `--tc-text`) inline from it; components style with
`var(--tc)`.

## Type (loaded in `src/app/layout.tsx`)

- **Archivo variable** (`--font-archivo`, axes wdth 62–125) — EVERYTHING except
  prose/data. Display voice `.type-display`: wdth ~112, weight 750–880,
  tight leading. Wordmark/h1s can go wdth 120+ uppercase. 3x+ size jumps.
- **Source Serif 4** (`font-serif`) — long-form article/briefing body only,
  17.5px, line-height 1.7, `text-ink-prose`.
- **IBM Plex Mono** (`font-mono`, `.type-kicker`) — data voice: kickers, dates,
  counts, meta, tags, ticker. 10.5–11.5px caps, tracked. Use sparingly — this
  must NOT read as a terminal.

## Primitives (in globals.css, @layer components)

- `.type-display` — Archivo wide/heavy display voice.
- `.type-kicker` — mono caps label, colored `var(--tc)` or ink-faint for folios.
- `.rule-row` — 1px INK top border; THE feed primitive.
- `.num-outline` — outlined numerals (`-webkit-text-stroke: 1.5px currentColor`,
  transparent fill, Archivo wdth 125 wght 900).
- `.flood-row` — signature move: `::before` panel in `var(--tc)` scales from
  scaleX(0) origin-left to full on hover (.28s cubic-bezier(.7,0,.2,1));
  row text flips to white (or ink for yellow via `--tc-text-on`). Apply to
  wire rows, related-story rows, briefing index rows.
- `.tag-chip` — 1.5px border in `var(--tc)`, mono caps, 3px radius.
- `.rise-in` + stagger — entrance: opacity 0 / translateY(14px) → settled,
  .5s cubic-bezier(.2,.7,.2,1), delay .1s × index (cap ~10).
- `.ticker` — marquee strip (30s linear infinite) for the stats/topics line.
- Count-up: `<CountUp>` client component (rAF, cubic ease-out, ~900ms).

## Motion rules (LIFE is required)

1. Every list staggers in. Every interactive element has a hover state that
   MOVES something (flood, underline sweep, outline→fill numeral, chip fill).
2. Nav links: 3px underline sweeps in from left (.22s).
3. Numbers (stats, counts) count up on mount.
4. The wire status line is a live ticker with topic-color dots.
5. Durations 150–500ms, cubic-bezier(.7,0,.2,1) or (.2,.7,.2,1). No bounce,
   no parallax, no scroll-jacking.
6. `prefers-reduced-motion`: global kill switch already in globals.css; JS
   effects must check `useReducedMotion()`/matchMedia and render final state.

## Hard rules

- No cards/shadows: ink-ruled rows and color blocks carry structure. Where a
  box is needed: 1.5–2px solid border (ink or `var(--tc)`), 3px radius, flat.
- NEVER left-border accent callouts. No dot+line eyebrows. No gradients, no
  glows, no cream/beige, no cobalt-on-white, no serif display faces.
- Buttons: `bg-primary` white text (or `bg-ink`), Archivo semibold 13px or mono
  caps, 3px radius, hover shifts background darker + underline/arrow nudge.
- WCAG AA: yellow `#f5c518` never as text on white — use `--spectrum-5-text`;
  on yellow floods text is ink. ink-faint only ≥11px.
- Charts (Recharts): flat `--chart-1..5` fills, mono 10–11px ticks, square
  flat tooltips.

## Voice example — wire row

```tsx
<article
  className="flood-row rule-row group grid grid-cols-[96px_1fr_auto] gap-5 px-4 py-5"
  style={{ '--tc': topicColor(section).base, '--tc-text': topicColor(section).text }}
>
  <span className="num-outline text-[54px]" aria-hidden>{rank}</span>
  <div>
    <p className="type-kicker" style={{ color: 'var(--tc-text)' }}>{section} · {date}</p>
    <h3 className="type-display text-[27px]">{title}</h3>
    <p className="text-[14.5px] text-ink-soft">{summary}</p>
    <p className="type-kicker text-ink-faint">{source} · {n} sources</p>
  </div>
  <span className="tag-chip self-center">{section}</span>
</article>
```

## Addendum — user-locked decisions (2026-07-02, supersedes anything above)

1. **No green anywhere.** Spectrum is 4 hues: red-orange `#e63b12`, teal
   `#0797a6`, magenta `#cf2d7b`, yellow `#f5c518` (text twin `#a8850b`).
   `--ok` is now teal. Success states: teal, never green.
2. **No bordered square chips.** Tags/chips are SOLID PILLS (`border-radius:999px`,
   colored bg, white/ink text) — `.tag-chip` in globals is already updated.
   Circles are a brand motif (user picked Quartz-circles + SuperHi shapes).
3. **Ticker is monochrome** — ink/gray mono text scrolling (topic counts as text),
   NO colored dots strip, NO red/green dots. Subtle.
4. **Homepage layout**: main ranked wire list stays as the centerpiece
   (num-outline + flood rows); ADD a right-hand rail (desktop ≥1024px) with
   (a) a giant circle linking to today's briefing (topic-color bg, drifts
   gently, scales on hover) and (b) "THE FULL WIRE" — the complete story list
   (100+), compact rows (mono index + small colored dot + title), NOT cropped
   in an inner scrollbox — page scrolls naturally.
5. **Knowledge graph (this is a RABBIT HOLE)**: a three.js band on the
   homepage between the ticker and the h1 (~260px, full-bleed, ink bottom
   border, label "THE GRAPH" + finding count top-left). White bg, thin ink
   edges (opacity ~.15), nodes = topic-colored dots (sized by weight), slow
   drift + subtle pointer parallax, staggered scale-in on load; static frame
   under reduced motion; dispose renderer on unmount. Use REAL data (stories/
   entities/sections from the same queries the wire uses); keep it decorative
   but real (clicking a node can navigate to the story/entity if cheap).
6. **Filtering & search must be right**: wire search input, section filter,
   and "with take" toggle restyled as first-class Spectrum controls — ink-
   bordered input on white with crisp focus (2px ink outline), filters as
   PILLS (active = solid topic color/ink, inactive = panel bg), instant
   feedback, mono labels. Same for /search page: filter pills, result rows
   as flood rows.
7. **Motion everywhere** (already tokenized): rows slide in AND out via
   scroll-driven `view()` timelines (`.scroll-rise` + add slide-out exit
   range on feeds), staggered `.rise-in` on first paint, `.flood-row`
   hovers, sweep-link nav, count-up stats, cross-document view transitions
   (already global). Respect reduced motion everywhere.
8. **Mobile = app**: shrink-header on scroll (`.shrink-header` mobile),
   bottom tab bar with pb-safe + active pill state + press scale, manifest +
   appleWebApp meta (done), Web Share API button on story pages
   (navigator.share, render only if supported), overscroll containment,
   16px+ inputs (no iOS zoom), tap targets ≥44px.
9. **Wordmark is ALL INK.** No red/colored "PATTERN" half. `MINDPATTERN` in
   Archivo wdth ~122 wght ~880, solid ink. At most a tiny accent circle-dot
   after it — nothing else colored in the wordmark.
10. **Mobile nav is DIFFERENT from desktop (real app feel).** Mobile: compact
    header = wordmark only (shrinks on scroll via .shrink-header), NO inline
    nav links; the BottomTabBar IS the navigation — ≥56px touch targets,
    icon + 10px mono label per tab, active tab gets a solid ink (or accent)
    pill behind icon+label, press feedback `active:scale-95`, `pb-safe`,
    `bg-paper/90 backdrop-blur`. Desktop (≥sm): top nav sweep-links, tab bar
    hidden. Inputs ≥16px font on mobile (no iOS zoom).
