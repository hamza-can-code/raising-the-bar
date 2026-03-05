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

approachItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    approachItems.forEach((other) => {
      if (other !== item) {
        other.open = false;
      }
    });
  });
});
