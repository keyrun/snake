# 🐍 Snake

A modern, responsive implementation of the classic **Snake** arcade game, built
with Next.js and Tailwind CSS. Plays entirely in your browser — with light/dark
themes and a locally-tracked high-score leaderboard.

![Tech](https://img.shields.io/badge/Next.js-16-black) ![Tech](https://img.shields.io/badge/React-19-149eca) ![Tech](https://img.shields.io/badge/Tailwind-v4-38bdf8) ![Tech](https://img.shields.io/badge/TypeScript-strict-3178c6)

## Features

- 🎮 Smooth, classic Snake gameplay with three difficulty levels
- ⌨️ Keyboard (arrows / WASD), 📱 touch/swipe, and an on-screen D-pad
- 🏆 Local high-score leaderboard (top 10), persisted in `localStorage`
- 🌗 Light, dark, and system themes — with no flash on load
- ♿ Accessible controls and 📐 responsive layout (mobile → desktop)
- 🧪 Pure, unit-tested game engine

## Getting started

Requires **Node.js 20+** and **pnpm**.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command           | Purpose                            |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | Start the development server       |
| `pnpm build`      | Create a production build          |
| `pnpm start`      | Serve the production build         |
| `pnpm lint`       | Run ESLint                         |
| `pnpm typecheck`  | Type-check with `tsc --noEmit`     |
| `pnpm test`       | Run the unit tests (Vitest)        |
| `pnpm test:watch` | Run tests in watch mode            |

## How to play

- **Steer:** Arrow keys or `WASD` (also starts the game). Swipe on the board or
  use the on-screen D-pad on touch devices.
- **Pause / resume:** `Space`.
- **Goal:** eat the food to grow and score. Avoid the walls and your own tail.

## Documentation

- [docs/SPEC.md](./docs/SPEC.md) — product & functional specification.
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — technical architecture.
- [AGENTS.md](./AGENTS.md) — guidance for AI agents contributing to this repo.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Vitest · pnpm. No backend — high scores live in the browser only.
