# Snake — Product & Functional Specification

This document is the source of truth for **what** the app does. For **how** it is
built, see [ARCHITECTURE.md](./ARCHITECTURE.md). AI agents should read both before
making changes.

## 1. Overview

A modern, responsive, single-page implementation of the classic **Snake** arcade
game. It runs entirely in the browser with no backend. High scores are tracked
locally (in `localStorage`). The UI supports light, dark, and system themes.

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4 (class-based dark mode)
- **Language:** TypeScript (strict)
- **Package manager:** pnpm
- **Persistence:** browser `localStorage` only (no server, no database)

## 2. Goals & non-goals

### Goals

- Fun, snappy, accessible Snake game playable with keyboard, touch, and on-screen
  controls.
- Polished modern UI that looks good in both light and dark themes.
- Local high-score leaderboard that persists between sessions.
- Clean, well-tested, framework-agnostic game logic so behavior is easy to reason
  about and extend.

### Non-goals (out of scope unless explicitly requested)

- Online/multiplayer play, accounts, or server-side score storage.
- Levels/obstacles beyond the open playfield.
- Sound (may be added later; see Future ideas).

## 3. Gameplay rules

- The board is a fixed grid (default **20×20**, see `DEFAULT_CONFIG`).
- The snake starts centered, length **3**, moving **right**, in the `idle` state.
- The snake advances one cell every tick. Tick rate depends on difficulty:
  - Easy: 140 ms, Normal: 100 ms, Hard: 70 ms (`SPEED_LEVELS`).
- Eating food grows the snake by one segment and adds **10 points**
  (`pointsPerFood`). New food spawns on a random empty cell.
- **Game over** when the head hits a wall or the snake's own body.
  - Moving into the cell the tail is vacating **this tick** is allowed.
- **Win** (also ends the game) if the snake fills the entire board (no empty cell
  remains for food).
- Direction changes that would reverse the snake 180° are ignored. Only one
  effective turn is applied per tick (queued via `pendingDirection`) to prevent
  double-turn self-collisions.

## 4. Game states

`idle → running → paused → running → gameover` (see `GameStatus`).

| State      | Meaning                                             |
| ---------- | --------------------------------------------------- |
| `idle`     | New game, not yet started. Overlay: "Ready to play?"|
| `running`  | Simulation ticking.                                 |
| `paused`   | Frozen; overlay: "Paused".                          |
| `gameover` | Ended (crash or win); overlay: score + next action. |

## 5. Controls

| Input                         | Action                          |
| ----------------------------- | ------------------------------- |
| Arrow keys / `WASD`           | Steer (also starts an idle game)|
| `Space`                       | Start / pause / resume          |
| `Enter` (on game over)        | Play again                      |
| Swipe on the board (touch)    | Steer                           |
| On-screen D-pad (mobile only) | Steer                           |
| Start / Pause / Restart btns  | As labeled                      |
| Difficulty segmented control  | Easy / Normal / Hard (only selectable while not playing) |

**Important:** Global keyboard shortcuts must be ignored while an editable element
(e.g. the high-score name input) is focused, so players can type freely.

## 6. High scores

- Up to **10** scores (`MAX_HIGH_SCORES`) are kept, sorted by score descending.
- Each entry stores: `id`, `name`, `score`, `level` (difficulty), `date` (ISO).
- On game over, if the score qualifies (`> 0` and beats the lowest kept score when
  the board is full), the player is prompted for a name (max 20 chars; blank →
  "Anonymous").
- The leaderboard is shown alongside the board and persists in `localStorage`
  under `snake:high-scores`. It syncs across open tabs.
- A "Clear" action wipes the leaderboard.

## 7. Theming

- Three preferences: **light**, **dark**, **system** (default). Stored in
  `localStorage` under `snake:theme`; syncs across tabs.
- The correct theme is applied **before first paint** via an inline script to
  avoid a flash of the wrong theme.
- Colors are defined as CSS custom properties for `:root` (light) and `.dark`.

## 8. Accessibility

- All interactive controls are real `<button>`s with labels; the theme and
  difficulty selectors use `role="radiogroup"`/`radio` with `aria-checked`.
- The canvas has a descriptive `aria-label` including the current score.
- Visible focus rings on all controls; `prefers-reduced-motion` is respected.

## 9. Acceptance criteria

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all pass.
- [ ] Game is playable via keyboard, touch/swipe, and the on-screen D-pad.
- [ ] Scoring, growth, wall/self collision, pause/resume, and restart work.
- [ ] Qualifying scores prompt for a name and appear on the leaderboard; scores
      persist across reloads.
- [ ] Typing a name containing `w/a/s/d`/space does not affect the game.
- [ ] Light, dark, and system themes work with no flash on load.
- [ ] Layout is responsive from ~320 px wide up to desktop.

## 10. Future ideas (not yet implemented)

- Optional wall-wrap mode; obstacles/levels.
- Sound effects and haptics.
- Configurable board size and per-difficulty leaderboards.
- Pause when the tab loses focus.
