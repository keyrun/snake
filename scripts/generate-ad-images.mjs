// Generates branded Google Ads image assets for the Snake site using Playwright.
// Renders on-brand HTML creatives and screenshots them at exact Google Ads sizes.
//
// Requires Playwright. Run from a folder where `playwright` resolves, e.g. the
// clarity-sessions skill folder, or install it (`npm i -D playwright`).
//
//   OUT_DIR  output directory (default: marketing/google-ads/images)

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.OUT_DIR
  ? resolve(process.env.OUT_DIR)
  : resolve(HERE, "..", "marketing", "google-ads", "images");

// Brand palette (matches the site's dark theme in src/app/globals.css).
const C = {
  bg0: "#0a0f1a",
  bg1: "#111827",
  grid: "#172033",
  primary: "#22c55e",
  head: "#4ade80",
  body: "#22c55e",
  food: "#f87171",
  fg: "#e5e7eb",
  muted: "#94a3b8",
};

// A little snake drawn with rounded cells + a food dot, sized in `u` units.
function snakeStrip(u, cells = 6) {
  let s = "";
  for (let i = 0; i < cells; i++) {
    const color = i === 0 ? C.head : C.body;
    s += `<div style="width:${u}px;height:${u}px;border-radius:${u * 0.28}px;background:${color};box-shadow:0 0 ${u * 0.6}px ${color}55"></div>`;
  }
  // food, slightly detached
  s += `<div style="width:${u}px;height:${u}px;border-radius:50%;background:${C.food};margin-left:${u * 0.9}px;box-shadow:0 0 ${u * 0.7}px ${C.food}aa"></div>`;
  return `<div style="display:flex;align-items:center;gap:${u * 0.34}px">${s}</div>`;
}

function logoBadge(px) {
  return `
    <div style="width:${px}px;height:${px}px;border-radius:${px * 0.24}px;
      background:linear-gradient(160deg, ${C.head}, ${C.primary});
      display:grid;place-items:center;font-size:${px * 0.58}px;line-height:1;
      box-shadow:0 ${px * 0.06}px ${px * 0.3}px ${C.primary}66, inset 0 2px 6px #ffffff55;">
      <span>🐍</span>
    </div>`;
}

function baseStyles(w, h) {
  return `
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:${w}px; height:${h}px; }
    .ad {
      position:relative; width:${w}px; height:${h}px; overflow:hidden;
      font-family:'Segoe UI', system-ui, -apple-system, Roboto, sans-serif;
      color:${C.fg};
      background:
        radial-gradient(120% 120% at 12% 8%, ${C.primary}22 0%, transparent 42%),
        radial-gradient(120% 120% at 100% 100%, ${C.food}14 0%, transparent 45%),
        linear-gradient(145deg, ${C.bg0} 0%, ${C.bg1} 100%);
    }
    .grid {
      position:absolute; inset:0; opacity:.5;
      background-image:
        linear-gradient(${C.grid} 1px, transparent 1px),
        linear-gradient(90deg, ${C.grid} 1px, transparent 1px);
      background-size:${Math.round(Math.min(w, h) / 14)}px ${Math.round(Math.min(w, h) / 14)}px;
      mask-image: radial-gradient(120% 100% at 50% 40%, #000 55%, transparent 100%);
    }
    .wordmark { font-weight:800; letter-spacing:-.02em; }
    .pill {
      display:inline-flex; align-items:center; gap:.5em; font-weight:700;
      color:${C.bg0}; background:linear-gradient(160deg, ${C.head}, ${C.primary});
      border-radius:999px; white-space:nowrap;
    }
    .muted { color:${C.muted}; }
  `;
}

// Marketing creative (landscape / square / portrait). `u` = base unit (vmin-ish).
function marketingHTML(w, h, { headline, sub, layout }) {
  const u = Math.min(w, h) / 100; // 1 unit
  const badge = Math.round(u * 12);
  const wordSize = Math.round(u * 8.5);
  const headSize = Math.round(u * (layout === "landscape" ? 12 : 13));
  const subSize = Math.round(u * 5.2);
  const pillSize = Math.round(u * 5.4);
  const pad = Math.round(u * 8);

  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles(w, h)}
    .wrap { position:absolute; inset:0; display:flex; flex-direction:column;
      justify-content:space-between; padding:${pad}px; }
    .brand { display:flex; align-items:center; gap:${Math.round(u * 3.4)}px; }
    .brand .wordmark { font-size:${wordSize}px; }
    .hero { display:flex; flex-direction:column; gap:${Math.round(u * 3)}px; }
    .hero h1 { font-size:${headSize}px; font-weight:800; letter-spacing:-.02em; line-height:1.02; max-width:${Math.round(w * 0.9)}px; }
    .hero .sub { font-size:${subSize}px; }
    .foot { display:flex; align-items:center; justify-content:space-between; gap:${u * 4}px; flex-wrap:wrap; row-gap:${u * 3}px; }
    .pill { font-size:${pillSize}px; padding:${pillSize * 0.6}px ${pillSize * 1.15}px; }
    .url { font-size:${Math.round(u * 4.2)}px; }
  </style></head><body>
    <div class="ad">
      <div class="grid"></div>
      <div class="wrap">
        <div class="brand">${logoBadge(badge)}<span class="wordmark">Snake</span></div>
        <div class="hero">
          <h1>${headline}</h1>
          <div class="sub muted">${sub}</div>
          ${snakeStrip(Math.round(u * 6.5), layout === "portrait" ? 5 : 7)}
        </div>
        <div class="foot">
          <span class="pill">Play now <span style="font-size:1.1em">&rarr;</span></span>
          <span class="url muted">keymangames.vercel.app</span>
        </div>
      </div>
    </div>
  </body></html>`;
}

// Logo creatives — clean, minimal.
function logoSquareHTML(w, h) {
  const u = Math.min(w, h) / 100;
  const badge = Math.round(u * 46);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles(w, h)}
    .wrap { position:absolute; inset:0; display:flex; flex-direction:column; gap:${u * 6}px; align-items:center; justify-content:center; }
    .wordmark { font-size:${Math.round(u * 15)}px; letter-spacing:.02em; }
  </style></head><body>
    <div class="ad"><div class="grid"></div>
      <div class="wrap">${logoBadge(badge)}<div class="wordmark">Snake</div></div>
    </div>
  </body></html>`;
}

function logoLandscapeHTML(w, h) {
  const u = Math.min(w, h) / 100;
  const badge = Math.round(u * 62);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles(w, h)}
    .wrap { position:absolute; inset:0; display:flex; gap:${u * 8}px; align-items:center; justify-content:center; }
    .txt { display:flex; flex-direction:column; }
    .wordmark { font-size:${Math.round(u * 42)}px; line-height:1; }
    .tag { font-size:${Math.round(u * 13)}px; letter-spacing:.06em; text-transform:uppercase; }
  </style></head><body>
    <div class="ad"><div class="grid"></div>
      <div class="wrap">${logoBadge(badge)}
        <div class="txt"><span class="wordmark">Snake</span><span class="tag muted">Keyman Games</span></div>
      </div>
    </div>
  </body></html>`;
}

const CREATIVES = [
  {
    file: "landscape-1200x628.png",
    w: 1200, h: 628,
    html: (w, h) => marketingHTML(w, h, {
      headline: "Beat Your High Score",
      sub: "Free classic Snake &bull; Light &amp; dark mode &bull; No download",
      layout: "landscape",
    }),
  },
  {
    file: "square-1200x1200.png",
    w: 1200, h: 1200,
    html: (w, h) => marketingHTML(w, h, {
      headline: "Play Classic Snake, Free",
      sub: "Slither, grow, and beat your best score in your browser.",
      layout: "square",
    }),
  },
  {
    file: "portrait-960x1200.png",
    w: 960, h: 1200,
    html: (w, h) => marketingHTML(w, h, {
      headline: "Snake. Score. Repeat.",
      sub: "A modern take on the classic arcade game.",
      layout: "portrait",
    }),
  },
  { file: "logo-square-1200x1200.png", w: 1200, h: 1200, html: logoSquareHTML },
  { file: "logo-landscape-1200x300.png", w: 1200, h: 300, html: logoLandscapeHTML },
];

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  for (const c of CREATIVES) {
    const page = await browser.newPage({
      viewport: { width: c.w, height: c.h },
      deviceScaleFactor: 1,
    });
    await page.setContent(c.html(c.w, c.h), { waitUntil: "networkidle" });
    // Give web/emoji fonts a moment to settle.
    await page.waitForTimeout(300);
    const out = join(OUT_DIR, c.file);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: c.w, height: c.h } });
    console.log(`  \u2713 ${c.file}  (${c.w}x${c.h})`);
    await page.close();
  }

  await browser.close();
  console.log(`\nDone. Images written to: ${OUT_DIR}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
