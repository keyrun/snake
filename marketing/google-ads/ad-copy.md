# Google Ads — Snake (Keyman Games)

Copy‑paste assets for a Google Ads asset group (Performance Max / Responsive
Display). Character counts are shown in parentheses and are within Google's
limits. Final URL: https://keymangames.vercel.app/

## Business name (≤ 25)

- Keyman Games (12)

## Headlines (≤ 30 characters) — provide 3–15; here are 10

1. Play Snake — Free Online (24)
2. Classic Snake Game (18)
3. Beat Your High Score (20)
4. Free Browser Snake (18)
5. Snake: Light & Dark Mode (24)
6. Modern Snake Game (17)
7. Play Snake Now (14)
8. No Download, Just Play (21)
9. Slither. Score. Repeat. (23)
10. High‑Score Snake Game (21)

## Long headlines (≤ 90 characters) — provide up to 5

1. Play the classic Snake game free in your browser — no download, no sign‑up. (74)
2. Modern Snake with light & dark themes and local high‑score tracking. (67)
3. Slither, grow, and beat your best in this fast, free browser Snake game. (71)
4. The classic arcade Snake game, reimagined for modern browsers. (61)
5. Free online Snake — play on desktop or mobile and chase a new high score. (73)

## Descriptions (≤ 90 characters) — provide up to 5

1. Free browser Snake game. Eat, grow, and beat your high score. Play now! (70)
2. Keyboard, swipe, or touch controls. Light & dark mode. No install needed. (72)
3. Fast, modern, and free. Your high scores save locally. Play in any browser. (74)
4. Three difficulty levels and smooth controls. Beat your best score today! (71)
5. No downloads, no sign‑up — just pure classic Snake fun. Start playing now. (73)

## Call to action

- Suggested: **Play now** (or "Play game")

## Images (in ./images)

| File | Purpose | Ratio | Dimensions |
| --- | --- | --- | --- |
| `landscape-1200x628.png` | Marketing image (landscape) | 1.91:1 | 1200 × 628 |
| `square-1200x1200.png` | Marketing image (square) | 1:1 | 1200 × 1200 |
| `portrait-960x1200.png` | Marketing image (portrait) | 4:5 | 960 × 1200 |
| `logo-square-1200x1200.png` | Logo (square) | 1:1 | 1200 × 1200 |
| `logo-landscape-1200x300.png` | Logo (landscape) | 4:1 | 1200 × 300 |

Regenerate the images with Playwright (Chrome installed locally):

```
# from repo root, with playwright available
OUT_DIR=marketing/google-ads/images node scripts/generate-ad-images.mjs
```

See `scripts/generate-ad-images.mjs` for the generator (edit headlines,
colors, or sizes there).
