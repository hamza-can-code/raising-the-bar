// client/scripts/modules/fadeIn.js

export function initFadeIn() {
    const els = document.querySelectorAll(".fade-in");
    els.forEach((el, i) => {
      setTimeout(() => el.classList.add("visible"), i * 500);
    });
  }
  