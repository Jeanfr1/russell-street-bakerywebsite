// Browser QA against the production build (npm run build && npm run preview).
// Captures land in qa/ (gitignored). Usage: node scripts/qa.mjs [base-url]
import fs from 'node:fs/promises';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4191/';
const OUT = new URL('../qa/', import.meta.url).pathname;
await fs.mkdir(OUT, { recursive: true });

const VIEWPORTS = [
  ['320', 320, 640, true],
  ['390', 390, 844, true],
  ['430', 430, 932, true],
  ['tablet', 768, 1024, true],
  ['tablet-land', 1024, 768, false],
  ['laptop-low', 1366, 680, false],
  ['desktop', 1440, 900, false],
  ['wide', 2560, 1440, false],
];
const STATES = [0, 0.18, 0.42, 0.55, 0.75, 1];
const PROCESS_WORDS = /\b(conceptual|concept|edited|original photo|generated|illustrative|transcribed|reconfirm|campaign|mockup|imagegen|TODO|placeholder|lorem)\b/i;

const browser = await chromium.launch({ channel: 'chrome' });
const problems = [];
const note = (m) => {
  problems.push(m);
  console.log('  ✗', m);
};

async function page(opts = {}) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, ...opts });
  const p = await ctx.newPage();
  p.on('console', (msg) => msg.type() === 'error' && note(`console error: ${msg.text()}`));
  p.on('pageerror', (err) => note(`page error: ${err.message}`));
  p.on('requestfailed', (r) => note(`request failed: ${r.url()}`));
  return [ctx, p];
}

for (const [name, width, height, mobile] of VIEWPORTS) {
  console.log(`\n${name} ${width}x${height}`);
  const [ctx, p] = await page({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  // frozen hero states
  for (const s of STATES) {
    await p.goto(`${BASE}?p=${s}`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.scrollTo({ top: document.querySelector('.hero').offsetTop, behavior: 'instant' }));
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${OUT}${name}-p${String(s).replace('.', '')}.png` });
  }
  // full page, natural flow
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const overflow = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  if (overflow[0] !== overflow[1]) note(`${name}: horizontal overflow ${overflow[0]} > ${overflow[1]}`);
  // reveal everything, then capture the sections below the hero
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await p.waitForTimeout(1200);
  const heroEnd = await p.evaluate(() => {
    const h = document.querySelector('.hero');
    return h.offsetTop + h.offsetHeight;
  });
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.screenshot({ path: `${OUT}${name}-sections.png`, fullPage: true, clip: { x: 0, y: heroEnd, width, height: total - heroEnd } });
  const overflow2 = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  if (overflow2[0] !== overflow2[1]) note(`${name}: horizontal overflow after scroll ${overflow2[0]} > ${overflow2[1]}`);
  await ctx.close();
}

// ---------------------------------------------------------------- interactions
console.log('\ninteractions');
{
  const [ctx, p] = await page({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  // hero CTA with a real pointer
  await p.getByRole('link', { name: 'Explore the counter' }).click();
  await p.waitForTimeout(1200);
  const top = await p.evaluate(() => document.getElementById('counter').getBoundingClientRect().top);
  if (Math.abs(top) > 4) note(`CTA → #counter landed at ${top}px`);
  // filters
  for (const [label, n] of [['Pastries', 2], ['Bread', 1], ['Savoury', 1], ['Coffee', 1], ['Everything', 5]]) {
    await p.getByRole('button', { name: label, exact: true }).click();
    const shown = await p.$$eval('.card', (cs) => cs.filter((c) => !c.hidden).length);
    const status = await p.textContent('#selection-status');
    const pressed = await p.getAttribute(`[data-filter] >> text=${label}`, 'aria-pressed');
    if (shown !== n || !status.startsWith(String(n)) || pressed !== 'true') note(`filter ${label}: ${shown} shown, "${status}", pressed=${pressed}`);
  }
  // CTA "Find us in Dublin" from scene 1
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.getByRole('link', { name: 'Find us in Dublin' }).click();
  await p.waitForTimeout(1400);
  const vtop = await p.evaluate(() => document.getElementById('visit').getBoundingClientRect().top);
  if (Math.abs(vtop) > 4) note(`CTA → #visit landed at ${vtop}px`);
  // hash load
  await p.goto(`${BASE}#story`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  const stop = await p.evaluate(() => document.getElementById('story').getBoundingClientRect().top);
  if (Math.abs(stop) > 4) note(`#story hash landed at ${stop}px`);
  // motion toggle
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Reduce motion' }).click();
  const reduced = await p.evaluate(() => [document.documentElement.classList.contains('reduced'), document.querySelector('.hero').offsetHeight, innerHeight]);
  if (!reduced[0]) note('motion toggle did not reduce');
  await p.screenshot({ path: `${OUT}toggle-reduced.png` });
  await p.reload({ waitUntil: 'networkidle' });
  const kept = await p.evaluate(() => document.documentElement.classList.contains('reduced'));
  if (!kept) note('reduced motion preference not kept after reload');
  await p.getByRole('button', { name: 'Enable motion' }).click();
  const back = await p.evaluate(() => !document.documentElement.classList.contains('reduced'));
  if (!back) note('motion toggle did not re-enable');
  // visible text + alts: no production notes
  const text = await p.evaluate(() => document.body.innerText + '\n' + [...document.images].map((i) => i.alt).join('\n'));
  const hit = text.split('\n').filter((l) => PROCESS_WORDS.test(l));
  if (hit.length) note(`process words on page: ${hit.join(' | ')}`);
  const heads = await p.$$eval('h1,h2,h3', (hs) => hs.map((h) => h.tagName + ' ' + h.textContent.trim()));
  console.log('  headings:', heads.join(' / '));
  // natural wheel scroll through the hero, sampled
  await p.goto(BASE, { waitUntil: 'networkidle' });
  for (let i = 0; i < 16; i++) {
    await p.mouse.wheel(0, 140);
    await p.waitForTimeout(90);
    if (i % 3 === 2) await p.screenshot({ path: `${OUT}wheel-${String(i).padStart(2, '0')}.png` });
  }
  await ctx.close();
}
{
  // phone menu with keyboard
  const [ctx, p] = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Menu' }).click();
  const open = await p.getAttribute('.menu-toggle', 'aria-expanded');
  await p.screenshot({ path: `${OUT}390-menu.png` });
  await p.keyboard.press('Escape');
  const closed = await p.getAttribute('.menu-toggle', 'aria-expanded');
  const focused = await p.evaluate(() => document.activeElement?.className);
  if (open !== 'true' || closed !== 'false' || !String(focused).includes('menu-toggle')) note(`menu: open=${open} closed=${closed} focus=${focused}`);
  await p.getByRole('button', { name: 'Menu' }).click();
  await p.getByRole('link', { name: 'Our craft' }).click();
  await p.waitForTimeout(1200);
  const ctop = await p.evaluate(() => document.getElementById('craft').getBoundingClientRect().top);
  if (Math.abs(ctop) > 4) note(`menu → #craft landed at ${ctop}px`);
  // phone bytes on first load
  await ctx.close();
}
for (const [label, opts] of [
  ['nojs', { javaScriptEnabled: false }],
  ['reduced', { reducedMotion: 'reduce' }],
]) {
  for (const [vw, vh] of [[1440, 900], [390, 844]]) {
    const [ctx, p] = await page({ viewport: { width: vw, height: vh }, ...opts });
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.screenshot({ path: `${OUT}${label}-${vw}.png`, fullPage: true });
    const ow = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    if (ow[0] !== ow[1]) note(`${label} ${vw}: overflow ${ow}`);
    await ctx.close();
  }
}
{
  // first-load weight on a phone
  const [ctx, p] = await page({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 3 });
  let bytes = 0;
  const seen = [];
  p.on('response', async (r) => {
    try {
      const b = await r.body();
      bytes += b.length;
      seen.push([r.url().replace(BASE, '/'), b.length]);
    } catch {}
  });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  console.log(`  phone first load (dpr 3): ${(bytes / 1024).toFixed(0)} KB`);
  seen.sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([u, b]) => console.log(`    ${(b / 1024).toFixed(0)} KB ${u}`));
  await ctx.close();
}

await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s)` : '\nall checks passed');
process.exitCode = problems.length ? 1 : 0;
