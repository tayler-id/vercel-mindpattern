# MindPattern — Project Instructions

## Design Context

### Users
MindPattern is a public-facing product for AI researchers, developers, and anyone tracking the AI landscape. Users come to query an autonomous 13-agent research pipeline through a conversational interface. They expect to quickly surface findings, trends, and intelligence across sources — treating it like a personal research analyst. The audience is technical, opinionated, and values density of information over hand-holding.

### Brand Personality
**Tactical, nerdy, playful.** MindPattern has the soul of a hacker who reads intelligence briefs for fun. It takes its job seriously but doesn't take itself too seriously. The "Wire Room" aesthetic (declassified dossier, intelligence ops) should feel like a lovingly crafted world — immersive but never campy. Think: spy-thriller meets developer tooling.

### Emotional Goal
**Intrigue & discovery.** Every session should feel like uncovering classified intel. The interface should reward curiosity, make data feel like secrets worth finding, and create moments of "oh, that's interesting." The experience should pull you in, not push information at you.

### Aesthetic Direction

**Visual tone:** Dense, monospaced, paper-textured — a physical intelligence dossier rendered digitally. Uppercase tracking, stamp badges, grid-paper chart backgrounds, inset-shadow "dossier cards." Light mode only (manila/cream palette).

**Typography:** JetBrains Mono everywhere. Both `--font-sans` and `--font-mono` resolve to it. Labels are 10-12px, uppercase, heavily tracked. Body text is 13px with generous line-height.

**Color palette (oklch):**
- Background: warm cream `oklch(0.94 0.01 80)`
- Foreground: near-black `oklch(0.15 0.01 80)`
- Primary (red): `oklch(0.45 0.18 25)` — stamps, accents, errors
- Secondary/olive: `oklch(0.40 0.05 145)` — success states, agent badges
- Accent/navy: `oklch(0.35 0.08 250)` — links, chart fills, informational
- Muted: warm gray `oklch(0.88 0.01 80)` background, `oklch(0.45 0.02 60)` text
- Custom tokens: `--navy`, `--olive` beyond standard shadcn

**Radius:** 0.25rem base — almost no rounding. Sharp, angular, document-like.

**Texture:** SVG fractal noise overlay on body (opacity 0.03), `.grid-paper` crosshatch on chart containers.

**Motion:** Framer Motion (via `motion/react`). Staggered fade-in/slide-up on lists and cards. Subtle, purposeful — never decorative.

**References:**
- Perplexity — clean research interface, source citations, conversational search
- Linear — polished developer tool, keyboard-first, precise interactions
- The Intercept / Bellingcat — investigative dossier presentation of findings

**Anti-references (never look like these):**
- Generic ChatGPT clone — no plain white chat bubbles, no generic AI assistant aesthetic
- Corporate dashboard — no Salesforce/Tableau bloat, no enterprise feel
- Skeuomorphic/retro kitsch — don't overdo the spy theme into camp territory

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
