<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Snake — Agent Guide

A browser-only Snake game (Next.js 16 + React 19 + Tailwind v4 + TypeScript),
using **pnpm**. Read the specs before making changes:

- [docs/SPEC.md](./docs/SPEC.md) — product & functional requirements (the "what").
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — technical design (the "how").

## Quick rules

- **Package manager is pnpm.** Do not use npm/yarn. Install: `pnpm install`.
- **Keep game logic pure.** All rules live in `src/lib/game/` with no React/DOM
  and immutable state transitions. Add/adjust unit tests in `engine.test.ts`.
- **Browser state via `useSyncExternalStore`.** Theme and high scores are
  `localStorage`-backed external stores (avoids `setState`-in-effect lint errors
  and hydration mismatches). Follow the existing pattern.
- **React 19 hooks lint is strict.** No synchronous `setState` in effects; update
  refs in effects, not during render.
- **Preserve the keyboard guard** in `src/components/game/snake-game.tsx` so game
  shortcuts are ignored while typing in inputs.
- **Theme without flash:** the inline `themeInitScript` runs in `<head>`. Keep it
  in sync with the resolve logic in `theme-provider.tsx`.
- **Styling:** use the semantic Tailwind tokens (`bg-surface`, `text-foreground`,
  `border-border`, `bg-primary`, …) defined in `src/app/globals.css` for both
  `:root` and `.dark`.

## Before you finish

Run and make sure all pass:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
