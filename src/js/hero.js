// The hero scene: from inside the oven (peel + three doughs advancing) to the
// cream "A study in layers" croissant. Numbers from the kit's study
// (08-estudo/portal.js motionAt) and 07-integracao/timeline.json; the peel
// grows about the measured handle joint (src/data/hero.json) instead of the
// study's preset scale, so the blade stays on the baker's handle.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const range = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t);

const PEEL_GROWTH = 0.88 / 0.7 - 1; // kit: scale .70 → .88 during the advance

export function motionAt(p) {
  p = clamp(p);
  const advance = ease(range(p, 0, 0.3));
  return {
    p,
    ovenOpacity: 1 - ease(range(p, 0.35, 0.57)),
    ovenScale: 1 + 0.09 * ease(range(p, 0, 0.4)),
    peelK: 1 + PEEL_GROWTH * advance,
    peelDrift: 2 * advance, // vh-like units of the stage height (kit: 8 → 10vh)
    copyOpacity: 1 - ease(range(p, 0.16, 0.32)),
    copyY: -45 * ease(range(p, 0.12, 0.32)),
    signatureOpacity: ease(range(p, 0.4, 0.6)),
    spread: ease(range(p, 0.6, 1)),
    heatOpacity: 0.22 * Math.sin(Math.PI * range(p, 0.29, 0.53)),
    chapter: p < 0.35 ? 0 : p < 0.62 ? 1 : 2,
  };
}

const STORE = 'russell-motion';

export function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return () => {};
  const root = document.documentElement;
  const stage = hero.querySelector('.hero-stage');
  const signature = hero.querySelector('.signature');
  const floor = hero.querySelector('.hero-floor');
  const chapterEl = hero.querySelector('.chapter');
  const chapters = JSON.parse(chapterEl.dataset.chapters);
  const button = hero.querySelector('.motion-toggle');
  const labels = { reduce: 'Reduce motion', enable: 'Enable motion', system: 'Reduced motion' };
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  // ?p=0.5 freezes the scene at a given progress (QA captures)
  const frozen = new URLSearchParams(location.search).get('p');

  let manual = false;
  try {
    manual = localStorage.getItem(STORE) === 'reduced';
  } catch {}
  let pending = false;
  let lastChapter = -1;
  let copyVisible = true;

  function apply(m) {
    const vars = {
      '--p': m.p.toFixed(4),
      '--oven-opacity': m.ovenOpacity.toFixed(4),
      '--oven-scale': m.ovenScale.toFixed(4),
      '--peel-k': m.peelK.toFixed(4),
      '--peel-drift': m.peelDrift.toFixed(3),
      '--copy-opacity': m.copyOpacity.toFixed(4),
      '--copy-y': `${m.copyY.toFixed(2)}px`,
      '--signature-opacity': m.signatureOpacity.toFixed(4),
      '--spread': m.spread.toFixed(4),
      '--heat-opacity': m.heatOpacity.toFixed(4),
    };
    for (const k in vars) hero.style.setProperty(k, vars[k]);
    if (m.chapter !== lastChapter) {
      chapterEl.textContent = chapters[m.chapter];
      lastChapter = m.chapter;
    }
    floor.classList.toggle('light-scene', m.p > 0.47);
    const hidden = m.p < 0.45;
    signature.inert = hidden;
    signature.setAttribute('aria-hidden', String(hidden));
    copyVisible = m.copyOpacity > 0.5;
  }

  function staticState() {
    for (const k of ['--p', '--oven-opacity', '--oven-scale', '--peel-k', '--peel-drift', '--copy-opacity', '--copy-y', '--signature-opacity', '--spread', '--heat-opacity'])
      hero.style.removeProperty(k);
    chapterEl.textContent = chapters[0];
    lastChapter = -1;
    floor.classList.remove('light-scene');
    signature.inert = false;
    signature.removeAttribute('aria-hidden');
    copyVisible = true;
  }

  function render() {
    pending = false;
    const reduced = manual || media.matches;
    root.classList.toggle('reduced', reduced);
    button.hidden = false;
    button.disabled = media.matches;
    button.setAttribute('aria-pressed', String(reduced));
    button.textContent = media.matches ? labels.system : reduced ? labels.enable : labels.reduce;
    if (reduced) return staticState();
    if (frozen !== null) return apply(motionAt(parseFloat(frozen)));
    const span = Math.max(hero.offsetHeight - stage.offsetHeight, 1);
    apply(motionAt(-hero.getBoundingClientRect().top / span));
  }

  const request = () => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(render);
    }
  };
  const toggle = () => {
    manual = !(manual || media.matches);
    try {
      if (manual) localStorage.setItem(STORE, 'reduced');
      else localStorage.removeItem(STORE);
    } catch {}
    const anchor = hero.getBoundingClientRect().top;
    render();
    // switching layouts changes the hero height: keep the toggle in view
    if (anchor < 0) button.scrollIntoView({ block: 'center' });
    button.focus({ preventScroll: true });
  };

  // keyboard focus on a faded CTA brings the opening scene back into view
  const copy = hero.querySelector('.hero-copy');
  const onFocus = () => {
    if (!copyVisible) window.scrollTo({ top: hero.offsetTop, behavior: 'auto' });
  };

  copy.addEventListener('focusin', onFocus);
  button.addEventListener('click', toggle);
  media.addEventListener?.('change', render);
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  render();

  return () => {
    copy.removeEventListener('focusin', onFocus);
    button.removeEventListener('click', toggle);
    media.removeEventListener?.('change', render);
    window.removeEventListener('scroll', request);
    window.removeEventListener('resize', request);
  };
}
