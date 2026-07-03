# MindPattern — Project Instructions

## Design Context

### Users
MindPattern is a public-facing product for AI researchers, developers, and anyone tracking the AI landscape. Users come to query an autonomous 13-agent research pipeline through a conversational interface. They expect to quickly surface findings, trends, and intelligence across sources — treating it like a personal research analyst. The audience is technical, opinionated, and values density of information over hand-holding.

### Brand Personality
**Tactical, nerdy, playful.** MindPattern has the soul of a hacker who reads intelligence briefs for fun. It takes its job seriously but doesn't take itself too seriously. The broadsheet aesthetic (a daily intelligence wire, printed) should feel like a lovingly crafted publication — immersive but never campy. Think: serious newsroom meets developer tooling.

### Emotional Goal
**Intrigue & discovery.** Every session should feel like uncovering classified intel. The interface should reward curiosity, make data feel like secrets worth finding, and create moments of "oh, that's interesting." The experience should pull you in, not push information at you.

### Aesthetic Direction — "Spectrum"

Authoritative docs: `docs/design/spectrum-system.md` (full design system: type
scale, spacing, motion tokens, component specs, gates) and
`docs/design/audit-2026-07-02.md` (data model + decisions). Tokens:
`src/app/globals.css`. Topic taxonomy + colors: `src/lib/topics.ts`.

**Visual tone:** crisp white + ink, Archivo variable-width display type,
Source Serif prose, IBM Plex Mono data voice. **Color = category**: the 11
pipeline sections map to fixed hues in the topic registry; a story's hue is
identical at every touchpoint (row kicker/numeral/pill, hover flood, graph
node, story-page accents). `top-5-stories-today` is a rank flag, never a
topic. No green (vetoed), no cream, no cards, no shadows, no left-border
callouts, wordmark all ink. Signature primitives: the ink-ruled row and the
topic-color flood (hover on desktop, press on touch).

### Design Principles

1. **Intelligence density over decoration.** Every pixel should convey information or support comprehension. No filler, no fluff. If a visual element doesn't help the user understand their data, remove it.

2. **Earned delight.** Playfulness lives in the copy, the topic-color floods, the draggable knowledge graph — not in bouncy animations or gratuitous color. The world-building IS the delight.

3. **Document, don't decorate.** UI elements should read like a live intelligence wire: ruled rows, folio strips, honest labels. Rules and color carry information, never decoration.

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
