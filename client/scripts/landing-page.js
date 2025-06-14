/*  ---------------------------------------------------------
 *  scripts/landing-page.js
 *  --------------------------------------------------------- */

import { initCookieBanner } from './modules/cookieBanner.js';

function loadNonCritical() {
  Promise.all([
    import('./modules/slider.js'),
    import('./modules/navModal.js'),
    import('./modules/modalLogin.js'),
    // import('./modules/themeToggle.js'),
    // import('./modules/fadeIn.js'),
  ]).then(([slider, nav, login]) => {
    slider.initTestimonialsSlider();
    nav.initNavModal();
    login.initModalLogin();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  /* 1 — banner logic first (cheap, < 4 ms) */
  initCookieBanner();

  /* 2 — defer everything else */
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadNonCritical, { timeout: 3000 });
  } else {
    window.addEventListener('load', loadNonCritical);
  }
});
