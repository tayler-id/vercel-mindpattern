# Rabbit Hole frontend development guide

## Scope

This repository is the public Next.js frontend for MindPattern. The Python pipeline, content engine, API, dashboard, and canonical generated artifacts live in `/Users/taylerramsay/Projects/mindpattern-v3`.

Before UI work, read `CLAUDE.md` and `docs/design/spectrum-system.md`. Spectrum is the design source of truth.

## Working rules

- Inspect `git status --short` before editing and preserve unrelated user work.
- Use Next.js 16, React 19, the App Router, Tailwind CSS v4, and the existing Base UI/shadcn primitives.
- Keep topic color consistent across every story touchpoint. Treat `top-5-stories-today` as a ranking flag, never a topic.
- Preserve the broadsheet language: ink rules, dense information, crisp white, no green, cream, cards, shadows, or decorative left-border callouts.
- Meet WCAG AA, visible focus, keyboard navigation, touch behavior, and reduced-motion requirements.
- Preserve API contracts from the backend. Coordinate any response-shape change in `mindpattern-v3` first.
- Ask before adding dependencies, changing analytics behavior, or altering public indexing and metadata policy.
- Do not deploy, publish, or change external services unless the task explicitly includes it.

## Commands

```sh
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm build
```

The package has no automated test script. Run all three gates for meaningful frontend changes.

For a local production-style smoke, run the backend on port 8010, then:

```sh
BACKEND_API_URL=http://127.0.0.1:8010 pnpm start --hostname 127.0.0.1 --port 3010
```

Use `pnpm dev --hostname 127.0.0.1 --port 3010` for interactive development. Validate affected flows in a real browser, including console and network errors, responsive layout, keyboard navigation, and reduced motion.

Finish with `git diff --check` and `git status --short`, and report exact verification plus anything not run.
