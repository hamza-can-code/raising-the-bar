const trainingItems = document.querySelectorAll('.training-columns .food-card li');

trainingItems.forEach((item) => {
  const [exerciseName, ...details] = item.textContent.split(' — ');

  if (!exerciseName || details.length === 0) return;

  const name = document.createElement('strong');
  name.className = 'exercise-name';
  name.textContent = exerciseName.trim();

  const detail = document.createElement('span');
  detail.className = 'exercise-detail';
  detail.textContent = ` — ${details.join(' — ').trim()}`;

  item.textContent = '';
  item.append(name, detail);
});

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
