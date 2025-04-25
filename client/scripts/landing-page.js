import { initThemeToggle }        from "./modules/themeToggle.js";
import { initFadeIn }             from "./modules/fadeIn.js";
import { initTestimonialsSlider } from "./modules/slider.js";
import { initCookieBanner }       from "./modules/cookieBanner.js";
import { initNavModal }           from "./modules/navModal.js";

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initFadeIn();
  initTestimonialsSlider();
  initCookieBanner();
  initNavModal();
});
