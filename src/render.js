// Build-time renderer: turns src/data/*.js|json into the page markup.
// Called by the Vite plugin in vite.config.js (dev and build), so the shipped
// HTML is complete without JavaScript.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const readJSON = (f) => JSON.parse(fs.readFileSync(path.join(DIR, 'data', f), 'utf8'));

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ext = (url) => (/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : '');
const ARROW = '<span class="arrow" aria-hidden="true">↗</span>';
const newTab = '<span class="sr-only"> (opens in a new tab)</span>';

export async function render() {
  const { site } = await import(`${pathToFileURL(path.join(DIR, 'data', 'site.js')).href}?t=${Date.now()}`);
  const { version, images } = readJSON('images.json');
  const hero = readJSON('hero.json');
  const map = fs.readFileSync(path.join(DIR, 'data', 'map.svg'), 'utf8');

  // <picture> with AVIF/WebP (+ JPEG for opaque photos) and intrinsic size
  function picture(id, { alt = '', sizes = '100vw', cls = '', loading = 'lazy', priority = false } = {}) {
    const m = images[id];
    if (!m) throw new Error(`no image "${id}" in images.json — run npm run images`);
    const set = (e) => m.widths.map((w) => `/img/${id}-${version}-${w}.${e} ${w}w`).join(', ');
    const fallback = m.alpha ? 'webp' : 'jpg';
    const fw = m.widths.find((w) => w >= 960) ?? m.widths[m.widths.length - 1];
    const h = Math.round((m.h * fw) / m.w);
    return `<picture${cls ? ` class="${cls}"` : ''}><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">${
      m.alpha ? '' : `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">`
    }<img src="/img/${id}-${version}-${fw}.${fallback}" srcset="${set(fallback)}" sizes="${sizes}" width="${fw}" height="${h}" alt="${esc(alt)}"${
      priority ? ' fetchpriority="high"' : ` loading="${loading}"`
    } decoding="async"></picture>`;
  }

  const em = ([plain, italic]) => `${esc(plain)}<em>${esc(italic)}</em>`;

  // ------------------------------------------------------------ header
  const header = `
<a class="skip" href="#main">Skip to content</a>
<header class="header">
  <a class="header-link header-visit" href="#visit">Visit us ${ARROW}</a>
  <nav class="nav" id="site-nav" aria-label="Main">
    <ul>
      ${site.nav.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('\n      ')}
      <li class="nav-extra"><a href="#visit">Visit us</a></li>
      <li class="nav-extra"><a href="${site.instagram.url}"${ext(site.instagram.url)}>Instagram ${ARROW}${newTab}</a></li>
    </ul>
  </nav>
  <a class="brand" href="#top" aria-label="${esc(site.name)}, back to the top">${picture('logo', { sizes: '96px', loading: 'eager' })}</a>
  <div class="header-end">
    <a class="header-link header-visit-wide" href="#visit">Visit us ${ARROW}</a>
    <a class="header-link header-ig" href="${site.instagram.url}"${ext(site.instagram.url)}>Instagram ${ARROW}${newTab}</a>
    <button class="menu-toggle" type="button" aria-controls="site-nav" aria-expanded="false">Menu</button>
  </div>
</header>`;

  // ------------------------------------------------------------ hero
  const P = hero.peel;
  const [W, H] = hero.canvas;
  const pct = (v, of) => `${((v / of) * 100).toFixed(3)}%`;
  const [cx, cy, cw, ch] = P.content_rect;
  // the croissant box shows the canvas region that holds the art
  const ART = { x: 40, y: 104, w: 1470, h: 800 };
  const pieces = hero.croissant.pieces
    .map((pc) => {
      const style = `--l:${pct(pc.x - ART.x, ART.w)};--t:${pct(pc.y - ART.y, ART.h)};--w:${pct(pc.w, ART.w)}`;
      const frac = (pc.w / ART.w).toFixed(3);
      return `<div class="piece piece-${pc.id}" style="${style}">${picture(`croissant-${pc.id}`, {
        sizes: `(max-width: 860px) calc(118vw * ${frac}), calc(min(86vw, 1300px) * ${frac})`,
      })}</div>`;
    })
    .join('');

  const heroHtml = `
<section class="hero" id="top" aria-labelledby="hero-title" style="--fx:65%">
  <div class="hero-stage">
    <div class="oven">
      <div class="scene" aria-hidden="true">
        <div class="camera">
          ${picture('oven-plate', { cls: 'plate', sizes: 'max(100vw, 150vh)', priority: true })}
          <div class="peel-advance" style="--jx:${pct(P.joint[0], W)};--jy:${pct(P.joint[1], H)}">
            <div class="peel-reg" style="--tx:${pct(P.tx, W)};--ty:${pct(P.ty, H)};--rot:${P.rotation_deg}deg;--s:${P.scale}">
              <div class="peel" style="--l:${pct(cx, W)};--t:${pct(cy, H)};--w:${pct(cw, W)}">${picture('peel', {
                sizes: 'max(100vw, 150vh)',
                priority: true,
              })}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="oven-shade" aria-hidden="true"></div>
      <div class="hero-copy">
        <p class="eyebrow">${esc(site.hero.eyebrow)}</p>
        <h1 id="hero-title">${esc(site.hero.title[0])}<br><em>${esc(site.hero.title[1])}</em></h1>
        <p class="hero-intro">${site.hero.intro.map(esc).join('<br>')}</p>
        <div class="hero-actions">
          <a class="button button-cream" href="${site.hero.ctas[0].href}">${esc(site.hero.ctas[0].label)} ${ARROW}</a>
          <a class="text-link text-link-light" href="${site.hero.ctas[1].href}">${esc(site.hero.ctas[1].label)} ${ARROW}</a>
        </div>
      </div>
    </div>
    <div class="heat" aria-hidden="true"></div>
    <div class="signature" id="signature" aria-labelledby="signature-title">
      <div class="signature-heading">
        <p class="eyebrow">${esc(site.signature.eyebrow)}</p>
        <h2 id="signature-title">${em(site.signature.title)}</h2>
        <p>${esc(site.signature.lede)}</p>
      </div>
      <div class="croissant" aria-hidden="true"><div class="croissant-art">${pieces}</div></div>
      <ul class="signature-notes">
        ${site.signature.notes.map((n) => `<li><b>${esc(n.label)}</b>${esc(n.text)}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="hero-floor">
      <span class="chapter" data-chapters='${JSON.stringify(site.hero.chapters)}'>${esc(site.hero.chapters[0])}</span>
      <a class="floor-link" href="#counter">SCROLL TO DISCOVER <span aria-hidden="true">↓</span></a>
      <button class="motion-toggle" type="button" aria-pressed="false" hidden>${esc(site.motion.reduce)}</button>
    </div>
    <div class="progress" aria-hidden="true"><span></span></div>
  </div>
</section>`;

  const STAR = '<svg class="star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1v18M2.2 5.5l15.6 9M2.2 14.5l15.6-9"/></svg>';
  const note = `
<div class="opening-note">${site.openingNote.map((t) => `<span>${esc(t)}</span>`).join(STAR)}</div>`;

  // ------------------------------------------------------------ counter
  const c = site.counter;
  const counter = `
<section class="section counter" id="counter" aria-labelledby="counter-title">
  <div class="section-top"><p class="eyebrow">${esc(c.eyebrow)}</p><p class="aside">${esc(c.aside)}</p></div>
  <div class="counter-heading">
    <h2 id="counter-title" class="reveal">${c.title.map(em).join('<br>')}</h2>
    <p class="lede reveal">${esc(c.lede)}</p>
  </div>
  <div class="filters" role="group" aria-label="Browse the bakery selection">
    ${c.filters.map((f, i) => `<button type="button" data-filter="${f.id}" aria-pressed="${i === 0}">${esc(f.label)}</button>`).join('\n    ')}
  </div>
  <p class="sr-only" id="selection-status" aria-live="polite">${esc(c.status(c.items.length))}</p>
  <ul class="selection" aria-label="The bakery selection">
    ${c.items
      .map(
        (it) => `<li class="card reveal" data-category="${it.category}">
      <div class="card-photo">${picture(it.photo, { alt: it.alt, sizes: '(max-width: 560px) 88vw, (max-width: 860px) 44vw, 30vw' })}</div>
      <p class="eyebrow">${esc(it.eyebrow)}</p>
      <h3>${esc(it.title)}</h3>
      <p>${esc(it.text)}</p>
    </li>`,
      )
      .join('\n    ')}
    <li class="card-note">
      <p class="note-title">${esc(c.footer.split('. ')[0])}.</p>
      <p>${esc(c.footer.split('. ').slice(1).join('. '))}</p>
      <p class="small">${esc(c.allergens)}</p>
      <a class="text-link" href="${site.instagram.url}"${ext(site.instagram.url)}>${esc(c.link)} ${ARROW}${newTab}</a>
    </li>
  </ul>
</section>`;

  // ------------------------------------------------------------ craft
  const k = site.craft;
  const craft = `
<section class="section craft" id="craft" aria-labelledby="craft-title">
  <div class="craft-top">
    <p class="eyebrow">${esc(k.eyebrow)}</p>
    <h2 id="craft-title" class="reveal">${esc(k.title[0])}<br><em>${esc(k.title[1])}</em></h2>
  </div>
  <div class="craft-layout">
    <figure class="craft-photo reveal">${picture(k.photo.id, { alt: k.photo.alt, sizes: '(max-width: 860px) 88vw, 46vw' })}<figcaption>${esc(k.photo.caption)}</figcaption></figure>
    <div class="craft-copy">
      <p class="eyebrow">${esc(k.kicker)}</p>
      <p class="steps reveal" aria-label="${esc(k.steps.join(' '))}">${k.steps
        .map((s, i) => (i === k.steps.length - 1 ? `<em>${esc(s)}</em>` : esc(s)))
        .join('<br>')}</p>
      <p class="craft-text">${esc(k.text)}</p>
      <figure class="dough-photo reveal">${picture(k.detail.id, { alt: k.detail.alt, sizes: '(max-width: 860px) 60vw, 22vw' })}<figcaption>${esc(k.detail.caption)}</figcaption></figure>
    </div>
  </div>
</section>`;

  // ------------------------------------------------------------ story
  const s = site.story;
  const story = `
<section class="section story" id="story" aria-labelledby="story-title">
  <div class="section-top"><p class="eyebrow">${esc(s.eyebrow)}</p><p class="aside">${esc(s.aside)}</p></div>
  <div class="story-layout">
    <div class="story-copy">
      <h2 id="story-title" class="reveal">${esc(s.title[0])}<br>${esc(s.title[1])}<em>${esc(s.title[2])}</em></h2>
      ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
      <a class="text-link" href="${s.link.href}">${esc(s.link.label)} ${ARROW}</a>
    </div>
    <figure class="story-photo reveal">${picture(s.photo.id, { alt: s.photo.alt, sizes: '(max-width: 860px) 80vw, 36vw' })}<figcaption>${esc(s.photo.caption)}</figcaption></figure>
  </div>
</section>`;

  // ------------------------------------------------------------ press
  const pr = site.press;
  const press = `
<section class="press" aria-label="${esc(pr.eyebrow.toLowerCase())}">
  <p class="eyebrow">${esc(pr.eyebrow)}</p>
  <p class="press-line">Discover Russell Street Bakery in<br>${pr.links
    .map((l) => `<a href="${l.url}"${ext(l.url)}>${esc(l.label)} ${ARROW}${newTab}</a>`)
    .join(' and ')}.</p>
</section>`;

  // ------------------------------------------------------------ visit
  const v = site.visit;
  const visit = `
<section class="section visit" id="visit" aria-labelledby="visit-title">
  <div class="visit-heading">
    <p class="eyebrow">${esc(v.eyebrow)}</p>
    <h2 id="visit-title" class="reveal">${esc(v.title[0])}<br><em>${esc(v.title[1])}</em></h2>
    <p class="lede">${v.lede.map(esc).join('<br>')}</p>
  </div>
  <div class="visit-layout">
    <figure class="visit-photo reveal">${picture(v.photo.id, { alt: v.photo.alt, sizes: '(max-width: 860px) 88vw, 52vw' })}</figure>
    <div class="visit-details">
      <h3>${esc(site.name)}</h3>
      <address>${site.address.lines.map(esc).join('<br>')}</address>
      <dl class="hours">
        ${site.hours.map((h) => `<div><dt>${esc(h.days)}</dt><dd>${esc(h.time)}</dd></div>`).join('\n        ')}
      </dl>
      <p class="small">${esc(v.service)}<br>${esc(v.updates)}</p>
      <div class="visit-actions">
        <a class="button button-slate" href="${site.mapUrl}"${ext(site.mapUrl)}>${esc(v.directions)} ${ARROW}${newTab}</a>
        <a class="text-link" href="${site.instagram.url}"${ext(site.instagram.url)}>${esc(v.follow)} ${ARROW}${newTab}</a>
      </div>
    </div>
  </div>
  <figure class="map reveal">
    ${map.trim()}
    <figcaption><span>Behan Square · Russell Street · Dublin 1</span><span class="credit">© <a href="https://www.openstreetmap.org/copyright"${ext('https://')}>OpenStreetMap contributors${newTab}</a></span></figcaption>
  </figure>
</section>`;

  // ------------------------------------------------------------ footer
  const footer = `
<footer class="footer">
  <a class="footer-brand" href="#top" aria-label="${esc(site.name)}, back to the top">${picture('logo', { sizes: '80px' })}</a>
  <p>${site.footer.signature.map(esc).join('<br>')}</p>
  <a class="text-link" href="${site.instagram.url}"${ext(site.instagram.url)}>${esc(site.instagram.handle)} ${ARROW}${newTab}</a>
  <a class="text-link" href="#top">${esc(site.footer.top)} <span aria-hidden="true">↑</span></a>
</footer>`;

  const app = `${header}
<main id="main">${heroHtml}${note}${counter}${craft}${story}${press}${visit}
</main>${footer}`;

  // ------------------------------------------------------------ head
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: site.name,
    url: site.url,
    image: `${site.url}og-v1.jpg`,
    servesCuisine: 'French',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: 'Dublin',
      postalCode: site.address.postcode,
      addressCountry: site.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.address.geo.lat, longitude: site.address.geo.lon },
    openingHoursSpecification: site.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.schema[0] === 'Mo-Fr' ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] : ['Saturday', 'Sunday'],
      opens: h.schema[1],
      closes: h.schema[2],
    })),
    sameAs: [site.instagram.url],
  };
  const plate = images['oven-plate'];
  const head = `
  <title>${esc(site.title)}</title>
  <meta name="description" content="${esc(site.description)}">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#F4EBDD">
  <link rel="canonical" href="${site.url}">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/fonts/p052-roman-v1.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/p052-italic-v1.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" as="image" type="image/avif" imagesrcset="${plate.widths.map((w) => `/img/oven-plate-${version}-${w}.avif ${w}w`).join(', ')}" imagesizes="max(100vw, 150vh)" fetchpriority="high">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${site.url}">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(site.title)}">
  <meta property="og:description" content="${esc(site.description)}">
  <meta property="og:image" content="${site.url}og-v1.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_IE">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>`;

  return { head, app };
}
