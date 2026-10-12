// Single source for the facts and copy on the page, rendered into index.html
// at build time (vite.config.js). Copy: 06-roteiros/CONTEUDO-EN.md.
// Facts: 07-integracao/dados.json and FONTES.md. Nothing here is invented:
// no prices, stock, phone, e-mail, delivery, ordering or tables.
//
// TODO(russell): official logo master (the PNG is a transparent derivation of the profile avatar)
// TODO(russell): full-resolution originals of the nine photos (the current files are screenshots)
// TODO(russell): a dated menu with prices only if the bakery wants one; phone and e-mail stay off until confirmed

export const site = {
  name: 'Russell Street Bakery',
  url: 'https://russell-street-bakery-dublin.vercel.app/', // TODO(russell): final domain → canonical, og:url, drop noindex
  lang: 'en-IE',
  title: 'Russell Street Bakery · The morning, made by hand',
  description:
    'French craft, Dublin mornings. Bread, pastries and Imbibe coffee to take away at Russell Street Bakery, Behan Square, Dublin 1.',
  instagram: {
    handle: '@russellst.bakery',
    url: 'https://www.instagram.com/russellst.bakery/',
  },
  // TODO(russell): replace with the Google place link (cid) once confirmed in Maps
  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=Russell+Street+Bakery+Unit+2+Behan+Square+Russell+Street+Dublin+D01+HX78',
  address: {
    lines: ['Unit 2, Behan Square', 'Russell Street, Dublin 1', 'D01 HX78, Ireland'],
    street: 'Unit 2, Behan Square, Russell Street',
    locality: 'Dublin 1',
    postcode: 'D01 HX78',
    country: 'IE',
    // OpenStreetMap node shop=bakery "Russell Street Bakery" (checked 2026-10-13)
    geo: { lat: 53.3590857, lon: -6.2543962 },
  },
  // From the bakery's own profile (Screenshot 2026-10-12 22.54.37), not the 2023 article.
  // TODO(russell): confirm bank-holiday and Christmas exceptions with the bakery
  hours: [
    { days: 'Monday — Friday', time: '7am — 3pm', schema: ['Mo-Fr', '07:00', '15:00'] },
    { days: 'Saturday — Sunday', time: '7:30am — 3pm', schema: ['Sa-Su', '07:30', '15:00'] },
  ],

  nav: [
    { label: 'The counter', href: '#counter' },
    { label: 'Our craft', href: '#craft' },
    { label: 'Our story', href: '#story' },
  ],

  hero: {
    eyebrow: 'RUSSELL STREET · DUBLIN 1',
    title: ['The morning,', 'made by hand.'],
    intro: ['A little flour. A little patience.', 'A very good reason to get up.'],
    ctas: [
      { label: 'Explore the counter', href: '#counter' },
      { label: 'Find us in Dublin', href: '#visit' },
    ],
    chapters: ['01 / BEFORE THE FIRST BITE', '02 / THE WARMTH BETWEEN', '03 / A STUDY IN LAYERS'],
  },

  signature: {
    eyebrow: 'FRENCH CRAFT · DUBLIN HEART',
    title: ['A study in ', 'layers.'],
    lede: 'Flour. Butter. Time. A little everyday magic.',
    notes: [
      { label: '01 / FLOUR', text: 'Structure, made delicate.' },
      { label: '02 / BUTTER', text: 'Richness in every fold.' },
      { label: '03 / TIME', text: 'Good things, unhurried.' },
    ],
  },

  openingNote: ['BAKED WITH CARE.', 'RUSSELL STREET, DUBLIN 1.', 'TAKE A LITTLE GOODNESS WITH YOU.'],

  counter: {
    eyebrow: '01 / AT THE COUNTER',
    aside: 'A changing selection, throughout the day.',
    title: [['Something ', 'lovely.'], ['Something ', 'for you.']],
    lede:
      'From a crisp morning croissant to a loaf for the table. Discover the bakery’s bread, pastries, sweet things and savoury favourites.',
    filters: [
      { id: 'all', label: 'Everything' },
      { id: 'pastries', label: 'Pastries' },
      { id: 'bread', label: 'Bread' },
      { id: 'savoury', label: 'Savoury' },
      { id: 'coffee', label: 'Coffee' },
    ],
    items: [
      {
        category: 'pastries',
        eyebrow: 'PASTRIES',
        title: 'The morning classics.',
        text: 'Croissants, pain au chocolat and pastries worth slowing down for.',
        photo: 'pastries',
        alt: 'Croissants, pain au chocolat, Danishes and New York rolls laid out on baking paper, each labelled by name',
      },
      {
        category: 'bread',
        eyebrow: 'BREAD',
        title: 'A loaf to bring home.',
        text: 'Sourdough, baguettes and brioche. Ask about the day’s bread.',
        photo: 'bread',
        alt: 'Crusty loaves with a seeded top and an open, golden crust',
      },
      {
        category: 'pastries',
        eyebrow: 'SWEET THINGS',
        title: 'A little more delight.',
        text: 'Pastries and pâtisserie, with a selection that changes with the counter.',
        photo: 'lemon-meringue',
        alt: 'Lemon meringue tarts being torched, the meringue swirls browned at the tips',
      },
      {
        category: 'savoury',
        eyebrow: 'SAVOURY',
        title: 'Lunch, beautifully simple.',
        text: 'Focaccia and sandwiches for the part of the day between sweet things.',
        photo: 'daily-counter',
        alt: 'Trays of focaccia and buns in front of the blue bread racks at the bakery counter',
      },
      {
        category: 'coffee',
        eyebrow: 'IMBIBE COFFEE',
        title: 'The perfect companion.',
        text: 'A proper coffee to take with your favourite bake.',
        photo: 'imbibe-coffee',
        alt: 'A member of the team at the espresso machine, smiling, with tins of Imbibe coffee on the shelf behind',
      },
    ],
    status: (n) => `${n} selection${n === 1 ? '' : 's'} shown.`,
    footer: 'Selection varies. For today’s bakes, follow the bakery or visit the counter.',
    allergens: 'Ask the team about ingredients and allergens.',
    link: 'See what’s baking',
  },

  craft: {
    eyebrow: '02 / THE QUIET WORK',
    title: ['Behind every crust,', 'a pair of hands.'],
    kicker: 'A TRADITION YOU CAN TASTE.',
    steps: ['Folded.', 'Rested.', 'Baked.'],
    text:
      'French baking is a balance of technique and attention. From the dough on the bench to the last crisp layer, the pleasure is in the details.',
    photo: { id: 'bakers-at-work', alt: 'Two bakers shaping dough on a floured bench, one smiling', caption: 'THE CRAFT, AT RUSSELL STREET.' },
    detail: { id: 'croissants-in-progress', alt: 'Rows of shaped croissants on a granite counter, waiting to prove', caption: 'BEFORE THE OVEN.' },
  },

  story: {
    eyebrow: '03 / A DUBLIN ADDRESS',
    aside: 'FRENCH TRADITION. NEIGHBOURHOOD SPIRIT.',
    title: ['An everyday kind', 'of ', 'extraordinary.'],
    paragraphs: [
      'Founded by Thibault Peigne, the baker behind Tartine Organic Bakery, Russell Street Bakery opened beside Croke Park in 2023.',
      'Here, the craft is close to the counter: bread, pastries and coffee, ready to become part of your Dublin morning.',
    ],
    link: { label: 'Make a morning of it', href: '#visit' },
    photo: { id: 'bread-racks', alt: 'A member of the team holding up a pastry beside racks of bread and pastries', caption: 'RUSSELL STREET BAKERY · DUBLIN 1' },
  },

  press: {
    eyebrow: 'IN GOOD COMPANY',
    links: [
      { label: 'All the Food', url: 'https://www.allthefood.ie/single-post/the-two-minute-review-russell-street-bakery' },
      { label: 'Visit Dublin', url: 'https://www.visitdublin.com/guides/best-bakeries-dublin' },
    ],
  },

  visit: {
    eyebrow: '04 / COME BY',
    title: ['Your next', 'good morning.'],
    lede: ['Bread for later. A pastry for now.', 'Find us on Russell Street, Dublin 1.'],
    photo: { id: 'shopfront', alt: 'The Russell Street Bakery shopfront under its slate-blue sign at Behan Square' },
    service: 'Takeaway bakery. No indoor tables or deliveries.',
    updates: 'Check the bakery’s Instagram for holiday updates.',
    directions: 'Get directions',
    follow: 'Follow the bakery',
  },

  footer: {
    signature: ['THE MORNING, MADE BY HAND.', 'RUSSELL STREET · DUBLIN 1'],
    top: 'Back to the top',
  },

  motion: { reduce: 'Reduce motion', enable: 'Enable motion', system: 'Reduced motion' },
};
