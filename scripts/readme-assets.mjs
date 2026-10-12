// Captures for the README from the production build (npm run build && npm run preview).
// → .github/assets/{banner.png, hero-scroll.gif, desktop-sections.jpg, mobile-screens.jpg}
// Composites are made by scripts/readme-composite.py; the GIF by ffmpeg.
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4191/';
const TMP = new URL('../qa/readme/', import.meta.url).pathname;
const OUT = new URL('../.github/assets/', import.meta.url).pathname;
await fs.rm(TMP, { recursive: true, force: true });
await fs.mkdir(`${TMP}frames`, { recursive: true });
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

// rAF cadence check: a throttled browser would give a false picture of timing
{
  const p = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  const ms = await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => (++n < 30 ? requestAnimationFrame(f) : r((performance.now() - t0) / 30)); requestAnimationFrame(f); }));
  console.log(`rAF ≈ ${ms.toFixed(1)} ms/frame`);
}

// ---- banner: the site's own fonts and croissant pieces on cream
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 520 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.setContent(`<!doctype html><html><head><base href="${BASE}"><style>
    @font-face{font-family:P052;src:url(/fonts/p052-roman-v1.woff2)}@font-face{font-family:P052;font-style:italic;src:url(/fonts/p052-italic-v1.woff2)}
    html,body{margin:0;width:1600px;height:520px;background:#F4EBDD;color:#302821;overflow:hidden}
    .wrap{position:relative;height:100%;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:56px;padding:0 90px}
    .logo{width:150px}h1{font:400 92px/1 P052;letter-spacing:-.03em;margin:0}h1 em{color:#9C623B}
    p{font:500 15px/1.6 system-ui,sans-serif;letter-spacing:.22em;margin:0 0 22px;color:#405665}
    .art{position:absolute;right:-40px;bottom:-40px;width:760px;opacity:.95}
    .rule{position:absolute;left:0;right:0;bottom:0;height:6px;background:#B49E6A}
  </style></head><body><div class="wrap"><img class="logo" src="/img/logo-v1-320.webp"><div><p>RUSSELL STREET · DUBLIN 1</p><h1>The morning,<br><em>made by hand.</em></h1></div></div>
  <img class="art" src="/img/croissant-s3-v1-564.webp" style="width:170px;right:330px;bottom:40px;transform:rotate(0deg)">
  <img class="art" src="/img/croissant-s4-v1-480.webp" style="width:145px;right:170px;bottom:62px;transform:rotate(1deg)">
  <img class="art" src="/img/croissant-s5-v1-764.webp" style="width:230px;right:-30px;bottom:70px;transform:rotate(2deg)">
  <div class="rule"></div></body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}banner.png` });
  await ctx.close();
}

// ---- hero GIF: 60 real scroll positions through the hero at 1440 × 900
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const [top, span] = await p.evaluate(() => {
    const h = document.querySelector('.hero');
    return [h.offsetTop, h.offsetHeight - document.querySelector('.hero-stage').offsetHeight];
  });
  const N = 60;
  let k = 0;
  const shot = async (y, hold = 1) => {
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await p.waitForTimeout(120);
    await settle(p);
    const buf = await p.screenshot();
    for (let i = 0; i < hold; i++) await fs.writeFile(`${TMP}frames/f_${String(k++).padStart(4, '0')}.png`, buf);
  };
  await shot(top, 8);
  for (let i = 1; i < N - 1; i++) await shot(top + (span * i) / (N - 1));
  await shot(top + span, 10);
  // a few frames into the next section, so the hand-off is visible
  for (let i = 1; i <= 6; i++) await shot(top + span + i * 70, i === 6 ? 8 : 1);
  await ctx.close();
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '12', '-i', `${TMP}frames/f_%04d.png`, '-vf',
    // photographic scene: 720 px and 72 colours keep the GIF under 4 MB
    'fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=72:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
    '-loop', '0', `${OUT}hero-scroll.gif`]);
}

// ---- section shots
async function sections(width, height, list, prefix, mobile = false) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  // pass once through the page so every reveal has played and every image has loaded
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); }
  });
  await p.waitForTimeout(1200);
  for (const [name, target] of list) {
    await p.evaluate((t) => {
      if (typeof t === 'number') {
        const h = document.querySelector('.hero');
        window.scrollTo({ top: h.offsetTop + (h.offsetHeight - document.querySelector('.hero-stage').offsetHeight) * t, behavior: 'instant' });
      } else {
        const [sel, dy] = t.split('|');
        window.scrollTo({ top: document.querySelector(sel).getBoundingClientRect().top + scrollY + Number(dy || 0), behavior: 'instant' });
      }
    }, target);
    await p.waitForTimeout(500);
    await settle(p);
    await p.screenshot({ path: `${TMP}${prefix}-${name}.png` });
  }
  await ctx.close();
}
await sections(1440, 900, [['counter', '#counter|150'], ['craft', '#craft|60'], ['story', '#story|40'], ['visit', '#visit|470']], 'desk');
await sections(390, 844, [['hero', 0], ['layers', 1], ['counter', '#counter|300'], ['visit', '#visit|330']], 'mob', true);
await browser.close();
execFileSync(`${process.env.HOME}/anaconda3/bin/python3`, [new URL('./readme-composite.py', import.meta.url).pathname, TMP, OUT], { stdio: 'inherit' });
const st = await fs.stat(`${OUT}hero-scroll.gif`);
console.log(`hero-scroll.gif ${(st.size / 1048576).toFixed(2)} MB`);
