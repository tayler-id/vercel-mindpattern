# The Wire Room UI Revamp — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform MindPattern from a generic dark AI dashboard into "The Wire Room" — a declassified intelligence dossier aesthetic with manila backgrounds, monospaced typography, stamp-style badges, and filing cabinet navigation.

**Architecture:** Purely visual revamp — same routes, same data fetching, same API. Swap the color system to warm manila/cream, replace Geist with JetBrains Mono, rebuild sidebar with shadcn Sidebar component, restyle all components to match the intelligence dossier metaphor. Fix all shadcn convention violations along the way.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui (base-nova), JetBrains Mono (Google Fonts), Motion, Recharts

---

## Task 1: Add missing shadcn components

**Files:**
- Modify: `src/components/ui/` (new files added by CLI)

**Step 1: Install sidebar, select, and alert components**

Run:
```bash
bunx shadcn@latest add sidebar select alert --yes
```

**Step 2: Verify components were added**

Run:
```bash
ls src/components/ui/sidebar.tsx src/components/ui/select.tsx src/components/ui/alert.tsx
```
Expected: All three files exist.

**Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shadcn sidebar, select, alert components"
```

---

## Task 2: Color system + typography + texture

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: Replace globals.css with Wire Room color system**

Replace the entire `:root` block and remove the dark-only assumption. Add:
- JetBrains Mono import via `@import url()`
- Manila/cream color palette in oklch
- Paper grain noise texture as CSS background
- Grid paper utility class for chart containers
- Stamp rotation utility

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-navy: var(--navy);
  --color-olive: var(--olive);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --background: oklch(0.94 0.01 80);
  --foreground: oklch(0.15 0.01 80);
  --card: oklch(0.91 0.01 80);
  --card-foreground: oklch(0.15 0.01 80);
  --popover: oklch(0.93 0.01 80);
  --popover-foreground: oklch(0.15 0.01 80);
  --primary: oklch(0.45 0.18 25);
  --primary-foreground: oklch(0.96 0.01 80);
  --secondary: oklch(0.40 0.05 145);
  --secondary-foreground: oklch(0.96 0.01 80);
  --muted: oklch(0.88 0.01 80);
  --muted-foreground: oklch(0.45 0.02 60);
  --accent: oklch(0.35 0.08 250);
  --accent-foreground: oklch(0.96 0.01 80);
  --destructive: oklch(0.45 0.18 25);
  --destructive-foreground: oklch(0.96 0.01 80);
  --border: oklch(0.82 0.02 80);
  --input: oklch(0.82 0.02 80);
  --ring: oklch(0.45 0.18 25);
  --radius: 0.25rem;
  --navy: oklch(0.35 0.08 250);
  --olive: oklch(0.40 0.05 145);

  --sidebar: oklch(0.92 0.01 80);
  --sidebar-foreground: oklch(0.45 0.02 60);
  --sidebar-primary: oklch(0.45 0.18 25);
  --sidebar-primary-foreground: oklch(0.96 0.01 80);
  --sidebar-accent: oklch(0.88 0.02 80);
  --sidebar-accent-foreground: oklch(0.15 0.01 80);
  --sidebar-border: oklch(0.82 0.02 80);
  --sidebar-ring: oklch(0.45 0.18 25);

  --chart-1: oklch(0.40 0.05 145);
  --chart-2: oklch(0.35 0.08 250);
  --chart-3: oklch(0.45 0.18 25);
  --chart-4: oklch(0.65 0.12 80);
  --chart-5: oklch(0.30 0.02 80);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  }
}

/* Stamp aesthetic — slight tilt for badges */
.stamp {
  display: inline-block;
  transform: rotate(-2deg);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

/* Grid paper background for chart containers */
.grid-paper {
  background-image:
    linear-gradient(to right, oklch(0.82 0.02 80 / 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(0.82 0.02 80 / 0.3) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* Typewriter cursor blink for loading states */
@keyframes typewriter-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
.typewriter-cursor {
  animation: typewriter-blink 1s step-end infinite;
}

/* Dossier card inset shadow */
.dossier-card {
  box-shadow: inset 0 1px 3px oklch(0 0 0 / 0.06);
}
```

**Step 2: Update layout.tsx — swap Geist for JetBrains Mono**

Replace font imports. Remove `dark` class from `<html>`. Use JetBrains Mono as both sans and mono font.

```tsx
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'MindPattern -- AI Research Intelligence',
  description: 'Conversational interface to your autonomous AI research pipeline',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

**Step 3: Run dev server to verify colors/fonts load**

Run: `bunx next dev` (check manually in browser)
Expected: Manila background, JetBrains Mono text, paper grain visible.

**Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: wire room color system, JetBrains Mono, paper texture"
```

---

## Task 3: Rebuild sidebar as filing cabinet index

**Files:**
- Rewrite: `src/components/sidebar.tsx`
- Modify: `src/app/(chat)/layout.tsx`
- Modify: `src/app/(blog)/layout.tsx`
- Modify: `src/app/(explore)/layout.tsx`

**Step 1: Rewrite sidebar.tsx using shadcn Sidebar**

Replace the entire hand-rolled sidebar with shadcn's `Sidebar` component. Use lucide-react icons instead of inline SVGs. Filing cabinet aesthetic: tight text labels, uppercase section headers, utilitarian nav. Fix all shadcn violations: `gap-*` not `space-y-*`, `size-*` not `w-* h-*`, `cn()` for conditionals.

Key elements:
- `SidebarProvider` + `Sidebar` + `SidebarContent` + `SidebarGroup` composition
- `SidebarHeader` with "MINDPATTERN" in uppercase tracked type
- `SidebarMenu` / `SidebarMenuItem` / `SidebarMenuButton` for nav items
- `SidebarFooter` with collapse trigger
- Use `Plus`, `BookOpen`, `LayoutGrid`, `PanelLeftClose` from lucide-react
- `data-icon` on icons per shadcn rules

**Step 2: Update all three layout files**

All three layouts (`(chat)`, `(blog)`, `(explore)`) need `SidebarProvider` wrapping. Since they're identical structure, update each to use the new sidebar.

**Step 3: Verify sidebar renders correctly**

Run dev server, check all three routes (`/`, `/blog`, `/explore`).
Expected: Filing cabinet sidebar with uppercase labels, no inline SVGs.

**Step 4: Commit**

```bash
git add src/components/sidebar.tsx src/app/\(chat\)/layout.tsx src/app/\(blog\)/layout.tsx src/app/\(explore\)/layout.tsx
git commit -m "feat: rebuild sidebar as filing cabinet using shadcn Sidebar"
```

---

## Task 4: Chat interface — Wire Room styling

**Files:**
- Modify: `src/components/chat/chat-interface.tsx`
- Modify: `src/components/chat/empty-state.tsx`
- Modify: `src/components/chat/message-content.tsx`

**Step 1: Restyle chat-interface.tsx**

- Replace inline SVGs with lucide-react icons (`Send`, `Square`)
- Replace manual provider toggle buttons with proper styling (uppercase labels, stamp-red active state)
- Fix `space-y-6` to `flex flex-col gap-6`
- User bubbles: subtle card background, right-aligned, no rounded-2xl (use sharp corners like a note card)
- Assistant messages: typewritten style, left-aligned, full width
- Textarea: manila card background, border, monospaced placeholder
- Bottom bar: "USING [PROVIDER]" as an uppercase label

**Step 2: Restyle empty-state.tsx**

- Replace the gradient "M" logo with a manila folder stamp design
- Title: "OPEN NEW CASE" in uppercase, stamp-red, slight rotation
- Subtitle: typewriter-style briefing text
- Suggestion cards: numbered directives like `01. Show me the stats` with manila card background, dossier-entry feel
- Remove emoji icons, replace with sequential numbers or classification codes

**Step 3: Restyle message-content.tsx**

- Markdown: remove `prose-invert`, use standard prose with foreground colors
- Tool loading state: `[QUERYING: tool_name]` with typewriter cursor `block` instead of pulse dot
- Fix `space-y-4` to `flex flex-col gap-4`
- Fix `space-y-2` to `flex flex-col gap-2`
- Fix `w-2 h-2` to `size-2`

**Step 4: Verify chat page renders correctly**

Run dev server, check `/` route.
Expected: Manila themed chat, stamp-style empty state, monospaced text.

**Step 5: Commit**

```bash
git add src/components/chat/
git commit -m "feat: wire room chat interface, dossier empty state, typewriter messages"
```

---

## Task 5: Explore page — file folder tabs + shadcn Select

**Files:**
- Modify: `src/components/explore/explore-tabs.tsx`

**Step 1: Replace raw `<select>` elements with shadcn Select**

In `AllFindingsTab` and `SkillsTab`, replace the three raw `<select>` elements with shadcn `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` / `SelectGroup`. Use proper composition per shadcn rules.

**Step 2: Restyle the tabs**

- Tab triggers: uppercase, tracked, monospaced — like file folder tabs
- Remove icon sizing classes (let shadcn handle it via `data-icon`)
- Fix all `space-y-*` to `flex flex-col gap-*`

**Step 3: Restyle helper components**

- `LoadingSkeleton`: use typewriter cursor blink instead of default skeleton animation
- `ErrorMessage`: use shadcn `Alert` with destructive variant instead of custom div
- `EmptyState`: `[NO RECORDS FOUND]` in stamp style instead of plain text

**Step 4: Verify explore page renders**

Run dev server, check `/explore` route and all tabs.
Expected: File folder tabs, shadcn selects, stamp-style empty states.

**Step 5: Commit**

```bash
git add src/components/explore/explore-tabs.tsx
git commit -m "feat: wire room explore tabs, shadcn Select, stamp empty states"
```

---

## Task 6: Gen-UI components — dossier card styling

**Files:**
- Modify: `src/components/gen-ui/finding-cards.tsx`
- Modify: `src/components/gen-ui/stats-overview.tsx`
- Modify: `src/components/gen-ui/health-dashboard.tsx`
- Modify: `src/components/gen-ui/pattern-list.tsx`
- Modify: `src/components/gen-ui/source-table.tsx`
- Modify: `src/components/gen-ui/skill-cards.tsx`
- Modify: `src/components/gen-ui/report-list.tsx`
- Modify: `src/components/gen-ui/report-viewer.tsx`
- Modify: `src/components/gen-ui/report-search-results.tsx`

**Step 1: Update finding-cards.tsx**

- Use proper `Card` / `CardHeader` / `CardContent` composition
- Classification badges: stamp style with `rotate(-2deg)`, uppercase
- Replace hardcoded colors (`IMPORTANCE_COLORS`) with semantic: high=primary (red stamp), medium=olive, low=muted
- Fix `space-y-2` to `flex flex-col gap-2`
- Add `dossier-card` class for inset shadow
- Dateline format: `[DATE: 2026-03-07]` style

**Step 2: Update stats-overview.tsx**

- Replace hardcoded hex colors (`#60a5fa`, etc.) with CSS variable references using `var(--chart-1)` through `var(--chart-5)`
- Counter cards: uppercase labels, monospaced values, no colored backgrounds — use border-left accent instead
- Area chart: grid-paper background, muted line colors, no gradients
- Bar chart: olive/navy/charcoal fills instead of rainbow

**Step 3: Update health-dashboard.tsx**

- Same chart color fixes as stats-overview
- MetricCard: border-left accent color instead of colored text
- Replace hardcoded `STATUS_COLORS` hex values with semantic CSS vars
- Line chart: thin, precise lines on grid-paper
- Recent errors: dossier entry style with classification stamp

**Step 4: Update remaining gen-ui components**

- `pattern-list.tsx`: dossier card styling, stamp badges
- `source-table.tsx`: use shadcn Table if installed, or at minimum proper semantic colors
- `skill-cards.tsx`: dossier cards with difficulty classification stamps
- `report-list.tsx`: briefing entries with dateline headers
- `report-viewer.tsx`: full dossier page layout
- `report-search-results.tsx`: search result entries

Fix in ALL gen-ui components:
- `space-y-*` to `flex flex-col gap-*`
- `w-* h-*` to `size-*` where equal
- Hardcoded hex colors to semantic tokens or chart vars
- Proper Card composition where applicable

**Step 5: Verify all gen-ui components render**

Run dev server, trigger each tool via chat or check explore tabs.

**Step 6: Commit**

```bash
git add src/components/gen-ui/
git commit -m "feat: wire room gen-ui components, dossier cards, semantic chart colors"
```

---

## Task 7: Blog pages — briefing archive

**Files:**
- Modify: `src/components/blog-search.tsx`
- Modify: `src/app/(blog)/blog/page.tsx`
- Modify: `src/app/(blog)/blog/[date]/page.tsx` (if exists)

**Step 1: Restyle blog-search.tsx**

- Replace custom `SearchIcon` SVG with lucide-react `Search`
- Report entries: dossier style with dateline, classification markers
- Replace inline SVG chevron with lucide-react `ChevronRight`
- Fix `space-y-*` to `flex flex-col gap-*`

**Step 2: Restyle blog/page.tsx**

- "BRIEFING ARCHIVE" header in uppercase, tracked
- Replace custom empty state SVG with stamp-style `[NO BRIEFINGS ON FILE]`
- Fix `w-12 h-12` to `size-12`

**Step 3: Check blog/[date]/page.tsx if it exists**

Read the file, apply consistent dossier styling.

**Step 4: Commit**

```bash
git add src/components/blog-search.tsx src/app/\(blog\)/
git commit -m "feat: wire room blog archive, briefing entry styling"
```

---

## Task 8: Final polish + constants cleanup

**Files:**
- Modify: `src/lib/constants.ts` (if IMPORTANCE_COLORS needs updating)
- All files: final sweep for remaining violations

**Step 1: Update IMPORTANCE_COLORS in constants**

Replace hardcoded Tailwind color classes with semantic token classes matching the Wire Room palette.

**Step 2: Final sweep**

Search all `.tsx` files for:
- Any remaining `space-y-` or `space-x-` usage
- Any remaining `w-N h-N` that should be `size-N`
- Any remaining inline SVGs that should be lucide-react
- Any remaining hardcoded hex colors
- Any remaining raw `<select>` elements

**Step 3: Run build to verify no errors**

Run: `bunx next build`
Expected: Build succeeds with no errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: final wire room polish, remaining shadcn violations"
```

---

## Execution Notes

- **No tests needed** — this is a purely visual revamp with no logic changes
- **Dev server** should be running throughout for visual verification
- **shadcn skill** context says: base=base (not radix), iconLibrary=lucide, aliases use `@/`
- **Do not touch**: API routes, `src/lib/types.ts`, `src/lib/api.ts`, `src/lib/constants.ts` (except IMPORTANCE_COLORS)
- **Font note**: `--font-sans` CSS var is no longer used. The whole app uses `font-mono` (JetBrains Mono)
- **Radius**: Reduced to `0.25rem` base — sharp corners fit the utilitarian aesthetic
