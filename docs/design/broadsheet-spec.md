# Broadsheet — Rabbit Hole visual system

The site reads as a printed intelligence broadsheet: warm newsprint paper, ink,
hairline rules, editorial serif display type, a mono "data voice", one oxblood
accent. **UX, DOM structure, routes, copy, and data logic are unchanged — this is
a visual-layer system only.**

## Why (context for anyone editing)

The previous look (Inter + cobalt `#2f6bff` + white rounded cards on `#fbfcfd`)
was the textbook generic-AI-site fingerprint. The escape, per verified research:
ban default fonts, non-blue-violet palette, ONE layout primitive repeated as a
signature, layered warm backgrounds. Our signature primitive is **the ruled row**.

## Tokens (defined in `src/app/globals.css`)

| Token / class | Value | Use |
|---|---|---|
| `bg-paper` | `#f7f3ea` | page background |
| `bg-surface` | `#fdfbf5` | elevated paper (inputs, sticky header) |
| `bg-panel` / `bg-spine` | `#efe9db` / `#f1ecdf` | tinted zones, hover states |
| `text-ink` | `#171310` | headlines, strong text |
| `text-ink-prose` | `#2b251d` | serif body copy |
| `text-ink-soft` / `text-ink-faint` | `#5c5443` / `#8d8371` | secondary / meta |
| `border-line` / `border-line-soft` | `#ddd4c2` / `#e9e2d2` | hairlines |
| `text-primary` / `bg-primary` | `#8a2318` oxblood | THE accent: links, CTAs, live markers |
| `bg-accent-wash` | `#f0e2d8` | subtle accent background |
| `text-ok` | `#3d5a37` forest | success/positive |
| charts 1–5 | oxblood, forest, ochre `#a8781f`, slate-navy `#3e4c63`, warm gray | Recharts |

## Type

- `.type-display` — **Fraunces** (var `--font-fraunces`, `font-display` Tailwind
  utility also works): all headlines/h1/h2, story titles, the wordmark. Weight
  500–640 via `font-[560]` etc. Sizes jump 3x+ from body (e.g. 13px meta → 40–56px h1).
- `font-serif` — **Newsreader**: article/briefing body, deks (italic), row summaries.
- `font-mono` — **IBM Plex Mono**: `.type-kicker` (11px caps, tracked 0.14em) for
  kickers, folios, dates, counts, tab labels, buttons. Numbers/data always mono.
- `font-sans` — **Archivo**: sparing, for small UI copy that isn't data or prose.

## Primitives (already in globals.css)

- `.rule-scotch` — thick-over-thin newspaper rule. Section starts, header bottom,
  major dividers. Use sparingly (1–2 per screen).
- `.rule-row` — 1px hairline top border. THE repeated feed/list primitive.
- `.numeral-ghost` — oversized Fraunces ranking numerals (e.g. `text-[44px]`),
  22% ink. Replaces the old small number column in ranked lists.
- `.type-kicker` — mono caps label. Oxblood (`text-primary`) for section kickers,
  `text-ink-faint` for meta folios.
- `.plate-duotone` — grayscale/sepia filter for thumbnails; full color on hover.

## Hard rules

1. **No cards.** Replace `rounded-xl/2xl border bg-white shadow-*` boxes with
   ruled rows or ruled sections. Where a box is truly needed (subscribe band,
   "The take"): full 1px border `border-ink` or top+bottom rules, square corners,
   `bg-surface` or `bg-accent-wash`, NO shadow.
2. **No left-border accent callouts** (`border-l-*` + tint). Ever. Use top rules,
   full borders, or tinted panels instead.
3. **Radius:** `rounded-none` (or default `rounded-sm` = 2px on inputs/buttons).
   Kill every `rounded-lg/xl/2xl/full` except avatars/favicons dots may stay circular.
4. **Shadows:** none. Remove all `shadow-[...rgba(11,13,18...)]`. Hover = `bg-spine`
   or `bg-panel` tint + underline, not lift.
5. **No cobalt, no gradients, no glows.** `text-primary` now resolves to oxblood —
   keep semantic classes, delete any literal blues/violets.
6. **No dot-plus-line "eyebrow" labels** (AI tell). Kickers are plain tracked caps.
7. Buttons: square, mono caps 11–12px, `bg-primary text-primary-foreground` for
   primary CTA; secondary = 1px `border-ink` on paper, hover `bg-panel`.
8. Motion: keep existing motion/react patterns but subtle (fade/rise ≤ 8px);
   respect reduced-motion (already global).
9. WCAG AA: ink-faint only for ≥11px meta; never body text. Oxblood on paper
   passes AA at all sizes.

## Voice examples

Wire row (ranked):
```tsx
<article className="rule-row group grid grid-cols-[56px_1fr] gap-4 py-4">
  <span className="numeral-ghost text-[44px]" aria-hidden>{rank}</span>
  <div>
    <span className="type-kicker text-primary">{topic}</span>
    <h3 className="type-display text-[22px] font-[560] group-hover:underline">{title}</h3>
    <p className="font-serif text-[15px] text-ink-soft">{summary}</p>
    <p className="type-kicker text-ink-faint">{date} · {sources} sources</p>
  </div>
</article>
```

Section head:
```tsx
<div className="rule-scotch pt-2">
  <h2 className="type-kicker text-ink">Most read</h2>
</div>
```
