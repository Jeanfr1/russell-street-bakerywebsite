// Web copies of the kit's masters → public/img/*-v1-<width>.<ext> plus a
// manifest (src/data/images.json) that src/render.js turns into <picture>.
// Masters in the kit folders are only read. Upscaled sources come from
// scripts/upscale.py (assets-src/upscaled/), crops from src/data/photos.json.
// Bump VERSION when a picture changes: /img is served as immutable.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'img');
const VERSION = 'v1';
const r = (...p) => path.join(ROOT, ...p);

const photos = JSON.parse(await fs.readFile(r('src/data/photos.json'), 'utf8'));
const hero = JSON.parse(await fs.readFile(r('src/data/hero.json'), 'utf8'));

const exists = (p) => fs.access(p).then(() => true, () => false);

// alpha: keep transparency (no JPEG), quality tuned per kind
async function emit(id, input, { widths, alpha = false, jpg = true, q = {} }) {
  if (!want(id)) return;
  const meta = await sharp(input).metadata();
  const ws = [...new Set(widths.filter((w) => w < meta.width).concat(meta.width))].sort((a, b) => a - b);
  const entry = { w: meta.width, h: meta.height, widths: ws, alpha, formats: alpha ? ['avif', 'webp'] : ['avif', 'webp', 'jpg'] };
  if (!jpg) entry.formats = ['avif', 'webp'];
  for (const w of ws) {
    const base = sharp(input).resize({ width: w, withoutEnlargement: true });
    const name = (ext) => path.join(OUT, `${id}-${VERSION}-${w}.${ext}`);
    await base.clone().avif({ quality: q.avif ?? 55, effort: 6 }).toFile(name('avif'));
    await base.clone().webp({ quality: q.webp ?? 78, alphaQuality: 90, effort: 6 }).toFile(name('webp'));
    if (!alpha && jpg) await base.clone().flatten({ background: '#F4EBDD' }).jpeg({ quality: q.jpg ?? 80, mozjpeg: true }).toFile(name('jpg'));
  }
  manifest[id] = entry;
  console.log(`${id}: ${meta.width}x${meta.height} → ${ws.join(', ')}`);
}

async function source(id, fallback) {
  const up = r('assets-src/upscaled', `${id}.png`);
  if (await exists(up)) return up;
  console.warn(`! ${id}: no upscaled copy, using the 1x source`);
  return fallback;
}

// `node scripts/build-images.mjs oven-plate shopfront` rebuilds only those ids
const only = new Set(process.argv.slice(2));
const want = (id) => !only.size || only.has(id);
const manifestPath = r('src/data/images.json');
const manifest = only.size && (await exists(manifestPath)) ? JSON.parse(await fs.readFile(manifestPath, 'utf8')).images : {};
await fs.mkdir(OUT, { recursive: true });
for (const f of await fs.readdir(OUT)) {
  const id = f.split(`-${VERSION}-`)[0];
  if (f.includes(`-${VERSION}-`) && want(id)) await fs.rm(path.join(OUT, f));
}

// ---- hero: oven plate and the peel layer (already cut to its content box)
if (want('oven-plate')) await emit('oven-plate', await source('oven-plate', r('03-hero/forno-fundo.png')), {
  widths: [960, 1600, 2400, 3072], q: { avif: 52, webp: 76 },
});
if (want('peel')) {
  const [x, y, w, h] = hero.peel.content_rect;
  const up = r('assets-src/upscaled/peel.png');
  const input = (await exists(up)) ? up : await sharp(r('05-camadas/pa-e-massas.png')).extract({ left: x, top: y, width: w, height: h }).png().toBuffer();
  await emit('peel', input, { widths: [960, 1600, 2400, 3012], alpha: true, q: { avif: 60, webp: 82 } });
}

// ---- croissant pieces (scripts/measure-hero.py cut them from the master)
for (const p of hero.croissant.pieces) {
  const id = `croissant-${p.id}`;
  if (!want(id)) continue;
  const input = await source(id, r('assets-src/layers', `${id}.png`));
  const meta = await sharp(input).metadata();
  await emit(id, input, { widths: [Math.round(meta.width / 2)], alpha: true, q: { avif: 62, webp: 82 } });
}

// ---- real photos, cropped to hide the Instagram interface
for (const [id, spec] of Object.entries(photos)) {
  if (!want(id)) continue;
  let input;
  if (spec.upscale) input = await source(id, null);
  if (!input) {
    const [x, y, w, h] = spec.rect;
    input = await sharp(r(spec.src)).extract({ left: x, top: y, width: w, height: h }).removeAlpha().png().toBuffer();
  }
  await emit(id, input, { widths: [480, 800, 1200, 1600] });
}

// ---- logo (transparent derivation of the profile avatar), favicons
if (want('logo')) {
  const logo = r('01-identidade/logo-transparente.png');
  const trimmed = await sharp(logo).trim({ threshold: 1 }).png().toBuffer();
  const pad = await sharp(trimmed).extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await emit('logo', await sharp(pad).resize(320).png().toBuffer(), { widths: [160, 320], alpha: true, q: { avif: 70, webp: 90 } });
  await sharp(pad).resize(320).png({ compressionLevel: 9, palette: true }).toFile(path.join(OUT, `logo-${VERSION}-320.png`));
  const disc = await sharp(pad).resize(512).flatten({ background: '#F4EBDD' }).png().toBuffer();
  const round = Buffer.from('<svg width="512" height="512"><circle cx="256" cy="256" r="256" fill="#fff"/></svg>');
  const icon = await sharp(disc).composite([{ input: round, blend: 'dest-in' }]).png().toBuffer();
  await sharp(icon).resize(32).png().toFile(r('public/favicon-32.png'));
  await sharp(disc).resize(180).png().toFile(r('public/apple-touch-icon.png'));
  await sharp(icon).resize(192).png().toFile(r('public/icon-192.png'));
}

await fs.writeFile(r('src/data/images.json'), JSON.stringify({ version: VERSION, images: manifest }, null, 2) + '\n');
console.log('manifest → src/data/images.json');
