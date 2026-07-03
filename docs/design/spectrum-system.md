# Spectrum Design System — Rabbit Hole / MindPattern

The single source of truth. Every component follows these tokens and specs —
no ad-hoc values. If a needed value doesn't exist here, add it here first.
Companion files: `spectrum-spec.md` (direction + locked decisions),
`src/app/globals.css` (token implementation), `src/lib/topic-color.ts`.

---

## 1. Foundations

### 1.1 Color

| Role | Token | Value | Rules |
|---|---|---|---|
| Page | `--paper` | `#ffffff` | the only page background |
| Raised | `--surface` | `#fafafa` | inputs at rest |
| Tint | `--panel` / `--spine` | `#f2f2f4` / `#f5f5f7` | hovers, inactive pills |
| Text strong | `--ink` | `#0e0e0f` | headlines, values, rules |
| Text prose | `--ink-prose` | `#1d1d20` | serif body only |
| Text secondary | `--ink-soft` | `#55555a` | summaries, labels |
| Text meta | `--ink-faint` | `#77777d` | ≥11px only, never body |
| Hairline | `--line` / `--line-soft` | `#e8e8ea` / `#f0f0f2` | dividers |
| Brand accent | `--accent` | `#e63b12` | CTAs, active nav, LIVE |
| Spectrum 1–4 | `--spectrum-1..4` | `#e63b12 #0797a6 #cf2d7b #f5c518` | topic taxonomy ONLY |
| Yellow text twin | `--spectrum-4-text` | `#a8850b` | yellow as text on white |
| Success | `--ok` | `#0797a6` (teal) | never green |
| Danger | `--destructive` | `#c8290f` | errors only |

Rules: **no green, no gradients, no shadows, no cream.** Topic colors come only
from `topicColor()/topicVars()` — never hand-picked per component. On a color
flood, text is `--tc-on` (white; ink on yellow).

### 1.2 Typography

Faces: **Archivo variable** (`wdth` 62–125) = display + UI. **Source Serif 4**
= long-form prose only. **IBM Plex Mono** = data voice only (kickers, meta,
counts, tags). Never mix voices inside one text block.

Type scale (use these, not arbitrary sizes):

| Token | Size / line | Face + settings | Use |
|---|---|---|---|
| `display-xl` | clamp(40–68px) / 0.95 | Archivo wdth118 w850, uppercase | page h1 |
| `display-lg` | clamp(36–56px) / 0.98 | Archivo wdth114 w850, uppercase | story h1 |
| `display-md` | 25px / 1.04 | Archivo wdth108 w760 | feed row titles |
| `display-sm` | 19px / 1.1 | Archivo wdth107 w720 | related/compact titles |
| `title-xs` | 13.5px / 1.25 | Archivo wdth105 w640 | rail items |
| `body` | 14px / 1.55 | Archivo w400, `--ink-soft` | summaries, UI copy |
| `prose` | 17.5px / 1.7 | Source Serif, `--ink-prose` | article body |
| `dek` | 21px / 1.45 | Source Serif, `--ink-soft` | story deks |
| `kicker` | 11px / 1 | Plex Mono w600, caps, track .14em | kickers, folio labels |
| `meta` | 10.5px / 1.4 | Plex Mono, caps, track .12em | meta lines, tags |

Minimums: mono meta never below 10.5px; `--ink-faint` never below 11px.
Mobile inputs ≥16px (iOS zoom).

### 1.3 Spacing — 4px base scale

Allowed steps: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96` (Tailwind 1–24).
**No arbitrary pixel padding outside this scale.**

| Context | Spec |
|---|---|
| Page gutter | 32px desktop (`px-8`), 20px mobile (`px-5`) |
| Content max-widths | wire page 1240px · prose 720px · story hero 1080px |
| Feed row padding | `py-5 px-4` (20/16); compact rail rows `py-2.5 px-2` |
| Section gap | 40px between major blocks (`mt-10`), 24px inside blocks |
| Kicker → title | 8px. Title → summary 8px. Summary → meta 12px |
| Control padding | pills `px-4 py-2` (16/8); large CTA `px-6 py-3` |
| Grid gaps | main/rail gap 48px (`gap-12`); row internal gap 20px (`gap-5`) |

### 1.4 Shape

Radius: `3px` (inputs, blocks) · `20px` (color-block panels: take, subscribe)
· `999px` (pills) · `50%` (circles). Nothing else. Borders: 1px hairline,
1px ink (row rules), 1.5px ink (controls), 3px ink (section top rules).

### 1.5 Motion

Tokens (in globals.css): `--dur-fast: 150ms` (hovers) · `--dur-med: 280ms`
(floods, sweeps) · `--dur-slow: 500ms` (entrances) · `--ease-swift:
cubic-bezier(.7,0,.2,1)` (things that move) · `--ease-settle:
cubic-bezier(.2,.7,.2,1)` (things that arrive).

| Pattern | Spec |
|---|---|
| Row flood | scaleX 0→1, origin left, `--dur-med --ease-swift` |
| Entrance stagger | `.rise-in`, delay `--i × 80ms`, cap 10 |
| Scroll entry/exit | `view()` timeline, entry 0–60% / exit 30–100%, decorative |
| Nav sweep | 3px underline width 0→100%, `--dur-fast` |
| Count-up | 900ms cubic ease-out, reduced-motion → final value |
| Page transitions | cross-document VT: out 220ms up-fade, in 300ms rise |
| Press feedback | `active:scale-95` (controls), `active:scale-[0.99]` (rows) |

Reduced motion: global CSS kill + JS checks. Never animate layout properties
(width/height/top) — transform/opacity only. No bounce, no parallax abuse.

### 1.6 Z-index scale

`10` sticky header · `20` rail/floating UI · `40` bottom tab bar ·
`50` overlays/sheets · `60` progress rail · `100` skip link. Nothing else.

### 1.7 Iconography

Lucide only, 1.5px stroke, sized 16/20/24. Icons always paired with a mono
label in nav; never color-only meaning.

---

## 2. Components

Every component defines: anatomy, geometry, states (rest/hover/focus/active/
disabled), and mobile variant. States are mandatory — a control without a
focus-visible state is a defect.

### 2.1 CircleBadge (the circle — exact geometry, fixes the padding issue)

Text inside a circle must live in the **inscribed square**: a centered content
box of `70%` of the diameter (`width:70%; height:70%`), flex column, centered,
`gap: 0.25em`, with `overflow:hidden`. Never let text approach the curve.

| Size | Diameter | Content box | Kicker | Title | Sub |
|---|---|---|---|---|---|
| lg (rail/story hero desktop) | 240–300px | 70% | 10px/`.2em` | Archivo wdth112 w820, clamp so ≤3 lines, 22–26px | 10.5px mono |
| md (story hero mobile) | 180–200px | 70% | 9px | 18–20px, ≤3 lines | 10px |
| sm (inline accents) | 48–96px | 70% | — | single glyph/numeral only | — |

Title uses `text-wrap: balance`, `line-height: 1.05`, and is truncated to
3 lines (`-webkit-line-clamp: 3`). Long words: `overflow-wrap: break-word`.
States: hover `scale(1.05) rotate(-2deg)` (`--dur-med --ease-settle`);
focus-visible: 2px ink outline offset 4px; drift animation ±8px 7s alternate.

### 2.2 Buttons

| Variant | Spec |
|---|---|
| Primary | pill, `bg-accent` white text, Archivo w600 13px (or mono caps 11px), `px-6 py-3`; hover: darken 8% + arrow nudge 2px; active scale-95; focus-visible 2px ink outline offset 2px; disabled: `bg-panel text-ink-faint` |
| Secondary | pill, 1.5px ink border, ink text; hover `bg-ink text-white` |
| Ghost | mono caps text + sweep underline |

Min touch target 44×44px (56px in tab bar).

### 2.3 Inputs

White bg, 1.5px ink border, 3px radius, `px-4 py-2.5`, 14px (16px mobile),
mono placeholder `--ink-faint`. Focus: 2px ink outline, offset 0. Valid/invalid
tint border only (`--ok`/`--destructive`). Search inputs get a mono kicker
label above, 8px gap.

### 2.4 Pills (tags, filters, chips)

Solid pill `px-4 py-2` mono caps 10.5px. Topic tag: `bg:var(--tc)`
`color:var(--tc-on)`. Filter: active `bg-ink text-white`, inactive `bg-panel
text-ink` hover `bg-spine`; always both a color AND weight change (not color
alone). Source pill: `bg-panel`, hover `bg-ink text-white translateY(-2px)`.

### 2.5 Feed rows (wire) / compact rows (rail) / related rows

Wire row: grid `[88px 1fr auto] gap-5`, `py-5 px-4`, `.rule-row .flood-row` +
`topicVars`; numeral `.num-outline` 50px; anatomy order kicker→title→summary→
meta (spacing per 1.3). Rail row: grid `[32px 1fr] gap-3 py-2.5`, hairline
top, 8px topic dot, `title-xs`; hover `bg-panel` + 2px topic underline.
Related row: `py-4`, kicker + `display-sm` + 12px circle dot right.

### 2.6 Ticker · 2.7 Folio strip · 2.8 Take block · 2.9 Tab bar

Ticker: 34px tall, hairline bottom, mono 11px `--ink-faint`, ink `<b>` values,
32s loop, duplicated content, static under reduced motion.
Folio: 3px ink top rule, `py-3`, entries as kicker label over 12px ink value,
`gap-9` between entries, wraps.
Take: `bg:var(--tc)` radius 20px `p-7`, white pill label (`--tc` text) then
Archivo wdth106 21px, `--tc-on` text.
Tab bar (mobile nav): 64px + pb-safe, `bg-paper/90 backdrop-blur`, hairline
top; per tab: icon 20px + mono 10px label, active = ink pill (`px-5 py-1.5`)
behind icon+label with white fill; press scale-95. Desktop hidden.

### 2.10 Knowledge graph band

260px desktop / 200px mobile, ink 1px bottom border. Nodes: topic hexes,
r 3–10px by weight; edges ink at 0.15 alpha. Label block top-left: `display-md`
"THE GRAPH" + meta count, 32px from gutter, `pointer-events:none`. Canvas
`aria-hidden`, band has `role="img"` + aria-label. Static frame under
reduced motion.

---

## 3. Accessibility & quality gates

1. WCAG AA contrast everywhere (yellow → `--spectrum-4-text` as text).
2. `:focus-visible` on every interactive element: 2px ink outline.
3. Color never sole carrier of meaning (pair with label/weight/underline).
4. Touch targets ≥44px; tab bar ≥56px.
5. Reduced motion: every animation has a defined final state.
6. Semantic landmarks per page: header/nav/main/aside; one h1.

## 4. Voice

Copy is confident, present tense, no exclamation marks. Kickers name the
taxonomy (topic · date · confidence). Numbers always mono. Labels never
sentence-case: kickers/meta are caps, titles are sentence case (feed) or
uppercase (display h1s).
