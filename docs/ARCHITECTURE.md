# Snake — Architecture

Technical companion to [SPEC.md](./SPEC.md). Read this before modifying code.

## Tech stack

| Concern          | Choice                                   |
| ---------------- | ---------------------------------------- |
| Framework        | Next.js 16 (App Router), React 19        |
| Language         | TypeScript (strict)                      |
| Styling          | Tailwind CSS v4 (`@import "tailwindcss"`)|
| Package manager  | pnpm (`packageManager` field pins it)    |
| Testing          | Vitest + jsdom (+ Testing Library avail.)|
| Persistence      | `localStorage` via a small store layer   |

> **Next.js 16 note:** This is a newer major version than most training data.
> `AGENTS.md` points to the bundled docs under `node_modules/next/dist/docs/`.
> Consult them before using unfamiliar APIs.

## Design principles

1. **Pure game core.** All game rules live in `src/lib/game/` as pure functions
   with **no React and no DOM**. State transitions are immutable
   (`(state, input) -> newState`). This makes the rules trivially unit-testable
   and portable. Randomness is injected (`Rng`) so tests are deterministic.
2. **Thin React layer.** Components render state and translate user input into
   engine calls. They hold as little logic as possible.
3. **External stores for browser state.** `localStorage`-backed state (theme,
   high scores) is exposed through `useSyncExternalStore`, which avoids
   `setState`-in-effect anti-patterns, prevents hydration mismatches (server
   snapshot is empty/default), and gives cross-tab sync for free.
4. **No flash of wrong theme.** An inline script in `<head>` applies the theme
   class before first paint (the official Next.js pattern).

## Directory map

```
src/
  app/
    layout.tsx          Root layout: fonts, metadata, theme init script, provider
    page.tsx            Home page: header, <SnakeGame/>, footer
    globals.css         Tailwind import, theme CSS variables, dark variant
  components/
    theme/
      theme-provider.tsx  ThemeProvider + useTheme + themeInitScript (external stores)
      theme-toggle.tsx    Light/Dark/System segmented control
    game/
      snake-game.tsx      Orchestrator: state, game loop, input, layout (client)
      game-board.tsx      Canvas renderer (DPR-aware); redraws on state/theme change
      game-overlay.tsx    Idle/Paused/GameOver overlays + high-score name form
      score-panel.tsx     Score / Best / Length stat cards
      high-scores.tsx     Leaderboard list
      direction-pad.tsx   On-screen D-pad (mobile only)
  lib/
    game/
      types.ts          Point, Direction, GameStatus, GameConfig, GameState, Rng
      constants.ts      DEFAULT_CONFIG, SPEED_LEVELS, INITIAL_SNAKE_LENGTH
      engine.ts         Pure engine: createInitialState, setDirection, tick, ...
      engine.test.ts    Engine unit tests
    storage/
      high-scores.ts    localStorage CRUD + validation + external store
      high-scores.test.ts
    hooks/
      use-game-loop.ts  requestAnimationFrame fixed-timestep loop
      use-high-scores.ts useSyncExternalStore wrapper over the storage module
```

## Game engine API (`src/lib/game/engine.ts`)

All functions are pure and return a new `GameState` (or a primitive).

- `createInitialState(config, rng?) → GameState` — idle game, snake centered.
- `setDirection(state, dir) → GameState` — queues a turn; ignores reversals;
  starts an idle game.
- `start / pause / resume(state) → GameState` — status transitions.
- `tick(state, rng?) → GameState` — advances one step while `running`; handles
  movement, eating/growth, scoring, wall/self collision, and win detection.
- Helpers: `spawnFood`, `pointsEqual`, `isReversal`.

**Invariants to preserve when editing:**

- `tick` is a no-op unless `status === "running"`.
- Turning into the tail's vacated cell is legal; turning into any other body
  cell ends the game.
- `pendingDirection` is applied at `tick` time (one effective turn per tick).
- `spawnFood` returns `null` only when the board is full (→ win/game over).

## Rendering (`game-board.tsx`)

- Draws to a `<canvas>` scaled by `devicePixelRatio` for crisp visuals.
- Reads colors from CSS custom properties (`--board-bg`, `--snake-head`, etc.) so
  it automatically matches the active theme.
- Redraws when `state`, `size`, or `themeKey` (the resolved theme) changes.

## Game loop (`use-game-loop.ts`)

- Fixed-timestep accumulator driven by `requestAnimationFrame` (no drift; pauses
  automatically when the tab is backgrounded).
- Pass `null` as the delay to stop the loop (used when not `running`).

## Theming (`theme-provider.tsx` + `globals.css`)

- Preference (`light|dark|system`) is read via `useSyncExternalStore` from
  `localStorage` (`snake:theme`); system changes are tracked via `matchMedia`.
- `resolvedTheme` = preference, or the OS value when preference is `system`.
- A `useEffect` toggles the `.dark` class and `color-scheme` on `<html>`.
- `themeInitScript` (exported string) runs in `<head>` to apply the class before
  paint. **Keep it in sync with the resolve logic if you change theme keys.**
- Tailwind v4 dark mode is enabled via `@custom-variant dark (&:where(.dark, .dark *))`.

## Styling conventions

- Use the semantic Tailwind color utilities backed by CSS vars: `bg-surface`,
  `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`,
  `text-primary-foreground`. Add new tokens in `globals.css` (both `:root` and
  `.dark`) and expose them under `@theme inline`.
- Prefer semantic tokens over hard-coded hex so both themes stay consistent.

## Commands

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `pnpm dev`        | Start the dev server             |
| `pnpm build`      | Production build                 |
| `pnpm start`      | Serve the production build       |
| `pnpm lint`       | ESLint (Next + React hooks rules)|
| `pnpm typecheck`  | `tsc --noEmit`                   |
| `pnpm test`       | Run Vitest once                  |
| `pnpm test:watch` | Vitest in watch mode             |

## Testing conventions

- Put unit tests next to the code as `*.test.ts(x)`.
- The game engine must stay fully covered by pure unit tests. Use the injectable
  `Rng` for determinism (e.g. `() => 0` picks the first empty cell).
- Storage tests use jsdom's `localStorage`; clear it in `beforeEach`.

## Gotchas / lessons learned

- **React 19 lint rules are strict.** `react-hooks/set-state-in-effect` and
  `react-hooks/refs` are enabled. Do not call `setState` synchronously in an
  effect for one-time reads — use `useSyncExternalStore` or lazy init. Update
  refs inside an effect, not during render.
- **Keyboard vs. text input.** The global `keydown` handler in `snake-game.tsx`
  returns early when the event target is an `INPUT`/`TEXTAREA`/`contentEditable`
  element, so typing a high-score name (including `w/a/s/d`/space/Enter) doesn't
  drive the game. Preserve this guard.
- **Hydration.** `<html>` uses `suppressHydrationWarning` because the inline
  script mutates its class before React hydrates.
