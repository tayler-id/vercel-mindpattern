# MindPattern — Project Instructions

## Design Context

### Users
MindPattern is a public-facing product for AI researchers, developers, and anyone tracking the AI landscape. Users come to query an autonomous 13-agent research pipeline through a conversational interface. They expect to quickly surface findings, trends, and intelligence across sources — treating it like a personal research analyst. The audience is technical, opinionated, and values density of information over hand-holding.

### Brand Personality
**Tactical, nerdy, playful.** MindPattern has the soul of a hacker who reads intelligence briefs for fun. It takes its job seriously but doesn't take itself too seriously. The broadsheet aesthetic (a daily intelligence wire, printed) should feel like a lovingly crafted publication — immersive but never campy. Think: serious newsroom meets developer tooling.

### Emotional Goal
**Intrigue & discovery.** Every session should feel like uncovering classified intel. The interface should reward curiosity, make data feel like secrets worth finding, and create moments of "oh, that's interesting." The experience should pull you in, not push information at you.

### Aesthetic Direction — "The Broadsheet"

Full spec with tokens and voice examples: `docs/design/broadsheet-spec.md`. Source of truth for tokens: `src/app/globals.css`.

**Visual tone:** A printed intelligence broadsheet — warm newsprint paper, ink, hairline rules instead of cards, editorial serif display type, one oxblood accent. The signature layout primitive is **the ruled row** (`.rule-row`), with the thick-over-thin `.rule-scotch` for section starts. Light mode only. Subtle print-grain noise overlay on body.

**Typography (4 voices, loaded via next/font in `src/app/layout.tsx`):**
- **Fraunces** (`--font-fraunces`, `.type-display`) — all headlines, story titles, the wordmark. High optical size, weight 500–640, 3x+ size jumps from body.
- **Newsreader** (`font-serif`) — article/briefing prose (17px, 1.72 line-height, `text-ink-prose`), deks in italic, row summaries.
- **IBM Plex Mono** (`font-mono`, `.type-kicker`) — the data voice: kickers, folios, dates, counts, tabs, buttons (11px caps, 0.14em tracking).
- **Archivo** (`font-sans`) — sparing, for small UI copy that isn't data or prose.

**Color palette (hex, in `:root`):** paper `#f7f3ea`, surface `#fdfbf5`, panel `#efe9db`, ink `#171310`, ink-prose `#2b251d`, ink-soft `#5c5443`, ink-faint `#8d8371` (meta ≥11px only), line `#ddd4c2`, **accent/primary = oxblood `#8a2318`** (links, CTAs, live markers), ok/forest `#3d5a37`, charts: oxblood/forest/ochre `#a8781f`/slate-navy `#3e4c63`/warm gray.

**Radius:** `--radius: 0.125rem` (2px) — printed, near-square. **Shadows: none** — rules and background tints do all the lifting. Ranked lists use oversized `.numeral-ghost` Fraunces figures. Thumbnails can take `.plate-duotone` (ink duotone, full color on hover).

**Motion:** motion/react. Staggered fade/rise ≤ 8px on lists. Subtle, purposeful — never decorative.

**References:**
- The New Yorker / WSJ article pages — typography-carried identity, hairline rules, colophon meta blocks
- Quartz — colored uppercase kickers as editorial voice
- The Athletic — ghost numerals on ranked lists, duotone plates, editorial + data density

**Anti-references (never look like these):**
- The "AI-built site" fingerprint: Inter/Geist, cobalt-or-violet accent on white, rounded shadowed cards, bento grids, dot-plus-line eyebrow labels, purple gradients. This site escaped that look deliberately — do not reintroduce any of it.
- Generic ChatGPT clone or corporate dashboard.
- Skeuomorphic spy-theme kitsch (no stamps, no typewriter effects).

### Design Principles

1. **Intelligence density over decoration.** Every pixel should convey information or support comprehension. No filler, no fluff. If a visual element doesn't help the user understand their data, remove it.

2. **Earned delight.** Playfulness lives in the copy ("Operator", "Directives", "OPEN NEW CASE"), the stamp badges, the grid-paper textures — not in bouncy animations or gratuitous color. The world-building IS the delight.

3. **Document, don't decorate.** UI elements should feel like artifacts from a real intelligence operation: case files, field reports, status boards. Design decisions should answer "would this exist in a Wire Room?" not "does this look pretty?"

4. **Accessible by default.** WCAG AA compliance is required. All color contrast ratios must pass, focus states must be visible, and `prefers-reduced-motion` must be respected. The dense, small-text aesthetic doesn't excuse poor accessibility.

5. **Keyboard-first, friction-free.** Inspired by Linear — interactions should be fast, precise, and keyboard-navigable. The interface should get out of the way and let the user operate.

## Tech Stack

- Next.js 16, React 19, App Router
- Tailwind CSS v4 (no tailwind.config — use `@theme inline` in globals.css)
- shadcn/ui v4 with `base` primitive (NOT radix) — components use `render` prop, not `asChild`
- AI SDK v6 (`@ai-sdk/react`, `useChat`, `DefaultChatTransport`)
- Motion (`motion/react`) for animations
- Recharts for data visualization
- `streamdown` for streaming markdown rendering
