// Generates Microsoft Clarity session recordings by driving the deployed Snake
// game with Playwright across Chrome, Edge, and Firefox using varied usage flows.
//
// Each "session" runs in a fresh browser context (isolated cookies/storage) so
// Clarity assigns a new user + session id. Clarity data is flushed by leaving the
// page (navigating to about:blank triggers unload -> sendBeacon) before close.

import { chromium, firefox } from "playwright";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const URL = process.env.TARGET_URL || "https://keymangames.vercel.app/";
const TOTAL = Number(process.env.SESSIONS || 25);
const HEADLESS = process.env.HEADLESS === "1";
const HERE = dirname(fileURLToPath(import.meta.url));
const CSV_PATH =
  process.env.CSV_PATH ||
  join(HERE, `clarity-metadata-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`);

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const OPP = { up: "down", down: "up", left: "right", right: "left" };

// Reads the canvas to locate the snake head + food and the current score.
const SAMPLE = () => {
  const canvas = document.querySelector("canvas");
  const scoreEl = document.querySelectorAll(".tabular-nums")[0];
  const score = scoreEl ? parseInt(scoreEl.textContent, 10) || 0 : 0;
  const gameover = document.body.innerText.includes("Game over");
  if (!canvas) return { head: null, food: null, score, gameover };
  const ctx = canvas.getContext("2d");
  const cols = 20, rows = 20;
  const cw = canvas.width / cols, ch = canvas.height / rows;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let head = null, food = null;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const px = Math.floor(x * cw + cw / 2), py = Math.floor(y * ch + ch / 2);
      const i = (py * canvas.width + px) * 4;
      const r = img[i], g = img[i + 1], b = img[i + 2];
      if (r > 180 && g < 140 && b < 140) food = { x, y };
      if (g > 190 && b > 112 && r < 140) head = { x, y };
    }
  return { head, food, score, gameover };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Human-like mouse movement -----------------------------------------
// Moves the cursor along a quadratic bézier curve with an eased, variable-speed
// step profile, small jitter, and occasional overshoot-and-correct, so Clarity
// records natural-looking pointer trails instead of straight teleports.

const rand = (a, b) => a + Math.random() * (b - a);

// Track a virtual cursor position so successive moves are continuous.
function ensureCursor(page) {
  if (!page.__cursor) {
    const vs = page.viewportSize() || { width: 1280, height: 800 };
    page.__cursor = { x: vs.width / 2, y: vs.height / 2 };
  }
  return page.__cursor;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

async function humanMoveTo(page, tx, ty) {
  const cur = ensureCursor(page);
  const sx = cur.x, sy = cur.y;
  const dist = Math.hypot(tx - sx, ty - sy);
  if (dist < 2) return;
  // Control point offset perpendicular to the path -> curved arc.
  const mx = (sx + tx) / 2, my = (sy + ty) / 2;
  const nx = -(ty - sy), ny = tx - sx;
  const nlen = Math.hypot(nx, ny) || 1;
  const bow = rand(-0.25, 0.25) * dist;
  const cx = mx + (nx / nlen) * bow;
  const cy = my + (ny / nlen) * bow;
  const steps = Math.max(12, Math.min(45, Math.round(dist / rand(8, 16))));
  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps);
    const u = 1 - t;
    let x = u * u * sx + 2 * u * t * cx + t * t * tx;
    let y = u * u * sy + 2 * u * t * cy + t * t * ty;
    if (i < steps) {
      x += rand(-1.2, 1.2);
      y += rand(-1.2, 1.2);
    }
    await page.mouse.move(x, y);
    cur.x = x;
    cur.y = y;
    if (Math.random() < 0.12) await sleep(rand(10, 45)); // brief hesitation
    else await sleep(rand(3, 12));
  }
  // Occasional slight overshoot then settle onto the exact target.
  if (Math.random() < 0.3) {
    const ox = tx + rand(-6, 6), oy = ty + rand(-6, 6);
    await page.mouse.move(ox, oy);
    await sleep(rand(30, 90));
    await page.mouse.move(tx, ty);
  }
  cur.x = tx;
  cur.y = ty;
}

// Idle "human" wandering: a few natural moves with reading-style pauses.
async function wander(page, moves = 6) {
  const vs = page.viewportSize() || { width: 1280, height: 800 };
  for (let i = 0; i < moves; i++) {
    const x = rand(40, vs.width - 60);
    const y = rand(40, vs.height - 120);
    await humanMoveTo(page, x, y);
    await sleep(rand(220, 650));
  }
}

// Move the cursor onto an element the way a person would before clicking.
async function humanHover(page, locator) {
  try {
    const el = (typeof locator === "string" ? page.locator(locator) : locator).first();
    const box = await el.boundingBox();
    if (!box) return false;
    await humanMoveTo(page, box.x + box.width * rand(0.3, 0.7), box.y + box.height * rand(0.3, 0.7));
    await sleep(rand(80, 220));
    return true;
  } catch {
    return false;
  }
}

async function clickIf(page, locator, timeout = 1500) {
  try {
    const el = (typeof locator === "string" ? page.locator(locator) : locator).first();
    await el.waitFor({ state: "visible", timeout });
    await humanHover(page, el); // move cursor over naturally before clicking
    await el.click({ timeout });
    return true;
  } catch {
    return false;
  }
}

// Small, natural cursor drift used to keep pointer activity alive during play.
async function driftMouse(page) {
  const cur = ensureCursor(page);
  const vs = page.viewportSize() || { width: 1280, height: 800 };
  const x = Math.max(20, Math.min(vs.width - 20, cur.x + rand(-90, 90)));
  const y = Math.max(20, Math.min(vs.height - 40, cur.y + rand(-70, 70)));
  await humanMoveTo(page, x, y);
}

// Drive the snake toward food to actually score points (keyboard input).
async function playToScore(page, { target = 20, maxMs = 22000 } = {}) {
  const deadline = Date.now() + maxMs;
  await page.keyboard.press("ArrowUp");
  let last = "up";
  let ticks = 0;
  while (Date.now() < deadline) {
    const info = await page.evaluate(SAMPLE);
    if (info.gameover || info.score >= target) return info;
    if (info.head && info.food) {
      let dir = null;
      if (info.head.x !== info.food.x) dir = info.food.x > info.head.x ? "right" : "left";
      else if (info.head.y !== info.food.y) dir = info.food.y > info.head.y ? "down" : "up";
      if (dir && dir !== OPP[last]) {
        await page.keyboard.press("Arrow" + cap(dir));
        last = dir;
      }
    }
    // Occasionally drift the cursor naturally while playing.
    if (++ticks % 12 === 0) await driftMouse(page);
    await sleep(85);
  }
  return page.evaluate(SAMPLE);
}

async function crashSoon(page) {
  await page.keyboard.press("ArrowUp"); // start + head up toward the wall
  await sleep(2600);
}

async function maybeSaveHighScore(page, name) {
  const input = page.locator('input[aria-label="Your name"]');
  try {
    await input.waitFor({ state: "visible", timeout: 1500 });
    await humanHover(page, input); // move to the field before clicking
    await input.click();
    await page.keyboard.type(name, { delay: 90 });
    await sleep(400);
    await clickIf(page, page.getByRole("button", { name: "Save score" }));
    return true;
  } catch {
    return false;
  }
}

/* ----------------------------- Scenarios ------------------------------- */

async function casualBrowse(page) {
  await wander(page, 5);
  await page.mouse.wheel(0, 400);
  await sleep(800);
  await humanHover(page, page.getByText("How to play").first());
  await wander(page, 4);
  await page.mouse.wheel(0, -300);
  await sleep(600);
}

async function quickCrash(page) {
  await wander(page, 2);
  await crashSoon(page);
  await sleep(1200);
  await clickIf(page, page.getByRole("button", { name: "Play again" }));
  await sleep(1000);
}

async function playAndSave(page, name) {
  await wander(page, 2);
  const info = await playToScore(page, { target: 30, maxMs: 24000 });
  if (!info.gameover) await crashSoon(page);
  await sleep(1000);
  await maybeSaveHighScore(page, name);
  await sleep(1200);
}

async function themeExplorer(page) {
  for (const t of ["Light theme", "Dark theme", "System theme"]) {
    await clickIf(page, `button[aria-label="${t}"]`);
    await sleep(900);
    await wander(page, 2);
  }
  await playToScore(page, { target: 10, maxMs: 12000 });
  await sleep(800);
}

async function difficultyRun(page, level) {
  await clickIf(page, page.getByRole("radio", { name: level }));
  await sleep(500);
  const info = await playToScore(page, { target: 20, maxMs: 18000 });
  if (!info.gameover) await crashSoon(page);
  await sleep(1000);
}

async function pauseResume(page) {
  await page.keyboard.press("ArrowRight");
  await sleep(1500);
  await page.keyboard.press(" ");
  await sleep(1500); // paused overlay
  await wander(page, 2);
  await page.keyboard.press(" ");
  await playToScore(page, { target: 20, maxMs: 12000 });
  await sleep(800);
}

async function multiRound(page) {
  for (let r = 0; r < 2; r++) {
    await crashSoon(page);
    await sleep(1000);
    await clickIf(page, page.getByRole("button", { name: "Play again" }));
    await sleep(800);
  }
}

async function clearScores(page, name) {
  // Ensure there is something to clear, then clear it.
  const info = await playToScore(page, { target: 10, maxMs: 15000 });
  if (!info.gameover) await crashSoon(page);
  await sleep(900);
  await maybeSaveHighScore(page, name);
  await sleep(800);
  await clickIf(page, page.getByRole("button", { name: "Clear" }));
  await sleep(1000);
}

async function readInstructions(page) {
  await page.mouse.wheel(0, 300);
  await sleep(700);
  for (const kbd of ["WASD", "Space"]) {
    await humanHover(page, page.getByText(kbd, { exact: true }).first());
    await sleep(rand(400, 800));
  }
  await clickIf(page, 'button[aria-label="Dark theme"]');
  await wander(page, 3);
}

async function mobileDpad(page) {
  // Narrow viewport shows the on-screen D-pad.
  const dirs = ["Move up", "Move right", "Move down", "Move left", "Move right", "Move up"];
  for (const d of dirs) {
    await clickIf(page, page.getByRole("button", { name: d }), 800);
    await sleep(500);
  }
  await sleep(1500);
}

// Scenario table. `mobile` scenarios need a touch/narrow context (chromium only).
const SCENARIOS = [
  { name: "casual-browse", run: casualBrowse },
  { name: "quick-crash", run: quickCrash },
  { name: "play-and-save", run: (p) => playAndSave(p, "Ada") },
  { name: "theme-explorer", run: themeExplorer },
  { name: "hard-mode", run: (p) => difficultyRun(p, "Hard") },
  { name: "easy-mode", run: (p) => difficultyRun(p, "Easy") },
  { name: "pause-resume", run: pauseResume },
  { name: "multi-round", run: multiRound },
  { name: "clear-scores", run: (p) => clearScores(p, "Grace") },
  { name: "read-instructions", run: readInstructions },
  { name: "play-and-save-2", run: (p) => playAndSave(p, "Linus") },
  { name: "mobile-dpad", run: mobileDpad, mobile: true },
];

/* ----------------------------- Runner ---------------------------------- */

// Pull Clarity's own session metadata via the public JS API:
//   clarity("metadata", (d) => { ... })
// The callback fires once metadata is ready (userId, sessionId, pageId, etc.).
// Returns the raw metadata object, or null if Clarity never initialized.
async function getClarityMetadata(page, timeoutMs = 10000) {
  try {
    return await page.evaluate((timeout) => {
      return new Promise((resolve) => {
        let settled = false;
        const finish = (d) => {
          if (settled) return;
          settled = true;
          resolve(d ?? null);
        };
        const tryRegister = () => {
          try {
            if (typeof window.clarity === "function") {
              // Clarity invokes this callback with the metadata JSON.
              window.clarity("metadata", (d) => finish(d));
              return true;
            }
          } catch {
            /* clarity queue not ready yet */
          }
          return false;
        };
        if (!tryRegister()) {
          const iv = setInterval(() => {
            if (tryRegister()) clearInterval(iv);
          }, 300);
          setTimeout(() => clearInterval(iv), timeout);
        }
        setTimeout(() => finish(null), timeout);
      });
    }, timeoutMs);
  } catch {
    return null;
  }
}

// Write collected rows to CSV. Columns = fixed fields + the union of all
// metadata keys observed across sessions (so any extra fields are captured).
function writeCsv(rows, path) {
  const base = ["index", "browser", "scenario", "device", "clarityUploads", "capturedAt", "url"];
  const metaKeys = [];
  for (const r of rows)
    for (const k of Object.keys(r.metadata || {}))
      if (!metaKeys.includes(k)) metaKeys.push(k);
  const headers = [...base, ...metaKeys.map((k) => `meta.${k}`)];

  const esc = (v) => {
    if (v == null) return "";
    let s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [headers.join(",")];
  for (const r of rows) {
    const cells = [
      r.index,
      r.browser,
      r.scenario,
      r.device,
      r.clarityUploads,
      r.capturedAt,
      r.url,
      ...metaKeys.map((k) => (r.metadata ? r.metadata[k] : "")),
    ];
    lines.push(cells.map(esc).join(","));
  }
  writeFileSync(path, lines.join("\n") + "\n", "utf8");
}

async function runSession(browser, engine, index, scenario) {
  const isChromium = engine !== "firefox";
  const useMobile = scenario.mobile && isChromium;
  const contextOpts = useMobile
    ? {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      }
    : { viewport: { width: 1280, height: 800 } };

  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();
  let uploads = 0;
  page.on("response", (res) => {
    if (res.url().includes("clarity.ms/collect")) uploads++;
  });

  const label = `#${String(index + 1).padStart(2, "0")} ${engine.padEnd(7)} ${scenario.name}`;
  let metadata = null;
  let ok = false;

  // Per-session watchdog: a single stalled session must not freeze the batch.
  const SESSION_TIMEOUT = Number(process.env.SESSION_TIMEOUT_MS || 90000);
  const timeout = (ms) =>
    new Promise((_, reject) => setTimeout(() => reject(new Error(`session timeout after ${ms}ms`)), ms));

  const work = (async () => {
    await page.goto(URL, { waitUntil: "load", timeout: 45000 });
    // Wait for Clarity to initialize.
    await page.waitForResponse((r) => r.url().includes("clarity.ms/tag/"), { timeout: 15000 }).catch(() => {});
    await sleep(1500);

    // Fallback for a mobile scenario that landed on Firefox: play with keyboard.
    if (scenario.mobile && !useMobile) {
      await playToScore(page, { target: 15, maxMs: 15000 });
    } else {
      await scenario.run(page);
    }

    // Let Clarity's periodic uploader run.
    await sleep(4000);
    // Capture Clarity session metadata via its JS API before leaving the page.
    metadata = await getClarityMetadata(page);
    // Flush on unload.
    await page.goto("about:blank").catch(() => {});
    await sleep(1500);
  })();

  try {
    await Promise.race([work, timeout(SESSION_TIMEOUT)]);
    ok = true;
    const sid = metadata?.sessionId ?? "n/a";
    console.log(`  ✓ ${label}  (uploads: ${uploads}, session: ${sid})`);
  } catch (err) {
    console.log(`  ✗ ${label}  ERROR: ${err.message.split("\n")[0]}`);
  } finally {
    // Bound the close too, so a wedged context can't hang the run.
    await Promise.race([context.close().catch(() => {}), sleep(5000)]);
  }
  return {
    index: index + 1,
    browser: engine,
    scenario: scenario.name,
    device: useMobile ? "mobile" : "desktop",
    clarityUploads: uploads,
    capturedAt: new Date().toISOString(),
    url: URL,
    metadata,
    ok,
  };
}

async function main() {
  console.log(`Target: ${URL}`);
  console.log(`Sessions: ${TOTAL}  Headless: ${HEADLESS}\n`);

  const launchers = {
    chrome: () => chromium.launch({ channel: "chrome", headless: HEADLESS }),
    edge: () => chromium.launch({ channel: "msedge", headless: HEADLESS }),
    // Firefox headed can be very slow/unreliable under heavy system load; allow
    // forcing it headless independently (HEADLESS_FIREFOX=1) while keeping the
    // Chromium browsers headed.
    firefox: () => firefox.launch({ headless: HEADLESS || process.env.HEADLESS_FIREFOX === "1" }),
  };
  const order = ["chrome", "edge", "firefox"];
  const browsers = {};

  // Launch (or relaunch) a browser for an engine, bounding the launch time.
  const ensureBrowser = async (engine) => {
    if (browsers[engine]) return browsers[engine];
    console.log(`Launching ${engine}...`);
    const b = await Promise.race([
      launchers[engine](),
      new Promise((_, rej) => setTimeout(() => rej(new Error(`${engine} launch timeout`)), Number(process.env.LAUNCH_TIMEOUT_MS || 180000))),
    ]);
    browsers[engine] = b;
    return b;
  };

  const rows = [];
  let totalUploads = 0;
  let failures = 0;
  for (let i = 0; i < TOTAL; i++) {
    const engine = order[i % order.length];
    const scenario = SCENARIOS[i % SCENARIOS.length];

    let browser;
    try {
      browser = await ensureBrowser(engine);
    } catch (err) {
      console.log(`  ✗ #${String(i + 1).padStart(2, "0")} ${engine} launch failed: ${err.message}`);
      browsers[engine] = null;
      failures++;
      continue;
    }

    const row = await runSession(browser, engine, i, scenario);
    rows.push(row);
    totalUploads += row.clarityUploads;

    // If a session failed, the browser may be wedged — relaunch it next time.
    if (!row.ok) {
      failures++;
      try {
        await Promise.race([browsers[engine]?.close().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]);
      } catch {
        /* ignore */
      }
      browsers[engine] = null;
    }
  }

  for (const b of Object.values(browsers)) {
    if (b) await b.close().catch(() => {});
  }

  writeCsv(rows, CSV_PATH);
  const withMeta = rows.filter((r) => r.metadata).length;
  const ok = rows.filter((r) => r.ok).length;
  console.log(`\nDone. ${ok}/${TOTAL} sessions succeeded (${failures} failure(s)). Total Clarity uploads observed: ${totalUploads}.`);
  console.log(`Metadata captured for ${withMeta} session(s).`);
  console.log(`CSV written to: ${CSV_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
