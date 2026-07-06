---
name: clarity-sessions
description: Generate Microsoft Clarity session recordings by driving the deployed site with Playwright across Chrome, Edge, and Firefox using varied, human-like usage flows. Use when asked to create/seed Clarity sessions, generate session recordings, or produce synthetic traffic for analytics testing.
---

# Clarity Session Generator

Drives the deployed Snake site with real browsers (Playwright) to produce
**Microsoft Clarity** session recordings. Each run creates N sessions distributed
across **Chrome, Edge, and Firefox**, each in a fresh browser context (so Clarity
logs a new user + session), performing a different usage scenario with
**human-like mouse movement**.

Clarity is delivered through the site's Google Tag Manager container
(`GTM-K47STP9P` → Clarity project `xicv743um0`), so it fires on the deployed URL
automatically — no code changes are needed to record.

## When to use

- "Create N Clarity sessions / session recordings"
- "Generate synthetic traffic across Chrome/Edge/Firefox"
- Seeding the Clarity dashboard with varied usage for testing dashboards, heatmaps,
  or funnels.

## Prerequisites

- Node.js 18+ and network access to the target URL.
- Google Chrome and Microsoft Edge installed (used via Playwright channels
  `chrome` / `msedge`). Firefox uses Playwright's bundled build.

## Setup (first run only)

From the skill folder (`.github/skills/clarity-sessions/`):

```bash
npm run setup   # installs playwright + downloads the Firefox browser
```

## Run

```bash
# Default: 25 sessions against the deployed site, headed browsers
npm run generate

# Or with options via env vars:
#   TARGET_URL  site to record (default https://keymangames.vercel.app/)
#   SESSIONS    number of sessions (default 25)
#   HEADLESS    "1" for headless (faster, less realistic), default headed
TARGET_URL="https://keymangames.vercel.app/" SESSIONS=25 node generate-sessions.mjs
```

On Windows PowerShell:

```powershell
$env:SESSIONS=25; $env:TARGET_URL="https://keymangames.vercel.app/"; node generate-sessions.mjs
```

The script prints a per-session line with the browser, scenario, and the number
of `k.clarity.ms/collect` uploads observed, plus a final total. A healthy session
shows 3+ uploads. Recordings appear in the Clarity dashboard within a few minutes.

## What it does

- **Browser mix:** round-robins Chrome → Edge → Firefox (25 sessions ≈ 9/8/8).
- **Fresh context per session:** new cookies/storage ⇒ a distinct Clarity user +
  session each time.
- **12 usage scenarios** cycled across sessions: `casual-browse`, `quick-crash`,
  `play-and-save` (auto-plays, scores, enters a name, saves to the leaderboard),
  `theme-explorer` (Light/Dark/System), `hard-mode`, `easy-mode`, `pause-resume`,
  `multi-round`, `clear-scores`, `read-instructions`, and `mobile-dpad` (narrow
  mobile viewport using the on-screen D-pad; falls back to keyboard on Firefox,
  which doesn't support mobile emulation).
- **Human-like input:** the cursor follows curved (bézier) paths with eased,
  variable speed, jitter, hesitations, and occasional overshoot-and-correct. The
  cursor is **always moved onto an interactive element before clicking it**
  (`humanHover` inside `clickIf`, and before every direct click). It also drifts
  naturally during gameplay.
- **Clarity flush:** after interacting, each session waits for Clarity's periodic
  uploader, then navigates to `about:blank` so the unload/`sendBeacon` flush fires
  before the context closes.

## Customizing

- **More/less sessions:** set `SESSIONS`.
- **Different site:** set `TARGET_URL` (any host where the Clarity tag loads).
- **Add a scenario:** write an `async function myScenario(page)` in
  `generate-sessions.mjs` and add `{ name, run }` to the `SCENARIOS` array. Set
  `mobile: true` if it needs the narrow/touch context (chromium only).
- **Speed:** `HEADLESS=1` runs faster but is less representative of real users.

## Notes / gotchas

- The auto-play logic reads the `<canvas>` pixels to find the snake head and food;
  it depends on the current theme colors (`--snake-head`, `--food`). If the board
  palette changes substantially, update the color thresholds in the `SAMPLE`
  function.
- Firefox in Playwright does not support `isMobile`/touch emulation, so mobile
  scenarios assigned to Firefox fall back to a keyboard play flow.
- Keep sessions reasonably paced; Clarity may drop sessions with almost no
  activity or duration.
