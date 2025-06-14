/* scripts/landing-page.js
 * ----------------------------------------------------------
 * Critical code first → extra features only when the browser
 * is idle so they never delay Largest Contentful Paint.
 */

import { initCookieBanner } from './modules/cookieBanner.js';

function loadDeferred() {
  // Dynamic imports split the bundle automatically
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
  // 1 – paint the banner ASAP so the user can interact
  initCookieBanner();

  // 2 – load everything else when we’re no longer blocking render
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadDeferred, { timeout: 3000 });
  } else {
    window.addEventListener('load', loadDeferred);
  }
});
