import '@fontsource-variable/jost/wght.css';
import './styles/main.css';
import { initHero } from './js/hero.js';
import { initFilters, initMenu, initReveal } from './js/ui.js';

const cleanups = [initHero(), initMenu(), initFilters(), initReveal()];

if (import.meta.hot) import.meta.hot.dispose(() => cleanups.forEach((fn) => fn()));
