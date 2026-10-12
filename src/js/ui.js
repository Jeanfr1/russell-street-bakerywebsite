// Menu, counter filters and section reveals.

export function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return () => {};
  const setOpen = (open, { focus = false } = {}) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    if (open) nav.querySelector('a')?.focus();
    else if (focus) toggle.focus();
  };
  const onToggle = () => setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  const onNav = (e) => {
    if (e.target.closest('a')) setOpen(false);
  };
  const onKey = (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false, { focus: true });
  };
  const onDoc = (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  };
  const wide = window.matchMedia('(min-width: 861px)');
  const onWide = () => wide.matches && setOpen(false);
  toggle.addEventListener('click', onToggle);
  nav.addEventListener('click', onNav);
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', onDoc);
  wide.addEventListener?.('change', onWide);
  return () => {
    toggle.removeEventListener('click', onToggle);
    nav.removeEventListener('click', onNav);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('click', onDoc);
    wide.removeEventListener?.('change', onWide);
  };
}

export function initFilters() {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.card[data-category]')];
  const status = document.getElementById('selection-status');
  if (!buttons.length) return () => {};
  const select = (category) => {
    let shown = 0;
    for (const card of cards) {
      const hide = category !== 'all' && card.dataset.category !== category;
      const wasHidden = card.hidden;
      card.hidden = hide;
      card.classList.remove('is-entering');
      if (!hide) {
        shown++;
        card.classList.add('in');
        if (wasHidden) {
          void card.offsetWidth;
          card.classList.add('is-entering');
        }
      }
    }
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.filter === category));
    status.textContent = `${shown} selection${shown === 1 ? '' : 's'} shown.`;
  };
  const handlers = buttons.map((b) => {
    const h = () => select(b.dataset.filter);
    b.addEventListener('click', h);
    return [b, h];
  });
  return () => handlers.forEach(([b, h]) => b.removeEventListener('click', h));
}

export function initReveal() {
  const root = document.documentElement;
  if (root.classList.contains('reduced') || !('IntersectionObserver' in window)) return () => {};
  const items = [...document.querySelectorAll('.reveal')];
  // only hide what is still below the fold; the rest is already seen
  const below = items.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.92);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  root.classList.add('reveal-on');
  for (const el of items) if (!below.includes(el)) el.classList.add('in');
  below.forEach((el) => io.observe(el));
  // turning motion off mid-page shows everything at once
  // (classList.remove always rewrites the attribute, so guard it and stop
  // observing first, or the observer would feed itself)
  const mo = new MutationObserver(() => {
    if (root.classList.contains('reduced')) {
      mo.disconnect();
      io.disconnect();
      if (root.classList.contains('reveal-on')) root.classList.remove('reveal-on');
    }
  });
  mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  return () => {
    io.disconnect();
    mo.disconnect();
  };
}
