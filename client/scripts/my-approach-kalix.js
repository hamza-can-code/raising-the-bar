const hamburger = document.getElementById('hamburger-btn');
const navClose = document.getElementById('nav-close');
const mainNav = document.getElementById('main-nav');
const navHelp = document.getElementById('nav-help');

if (hamburger && mainNav) {
  hamburger.addEventListener('click', () => mainNav.classList.toggle('open'));
}

if (navClose && mainNav) {
  navClose.addEventListener('click', () => mainNav.classList.remove('open'));
}

if (navHelp) {
  navHelp.addEventListener('click', (event) => event.preventDefault());
}

const approachItems = Array.from(document.querySelectorAll('.approach-item'));
const mobileAccordion = window.matchMedia('(max-width: 768px)');

approachItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;

    approachItems.forEach((other) => {
      if (other !== item) {
        other.open = false;
      }
    });

    if (!mobileAccordion.matches) return;

    const summary = item.querySelector('summary');
    if (!summary) return;

    requestAnimationFrame(() => {
      const summaryTop = window.scrollY + summary.getBoundingClientRect().top;
      const targetTop = Math.max(summaryTop - 20, 0);

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    });
  });
});
