const mindSubtexts = [
  "Your mind is part of your progress too.",
  "Strong body, strong mindset.",
  "Progress starts in your head.",
  "Taking care of your mind counts.",
  "Today’s mindset shapes tomorrow’s results."
];

const moodResponses = {
  good: [
    "Love to hear that — keep building on it.",
    "Nice. Let’s carry that energy forward."
  ],
  okay: [
    "That’s still progress — showing up matters.",
    "Even steady days move you forward."
  ],
  low: [
    "Thanks for being honest — that takes strength.",
    "Rough days happen. You’re not alone here."
  ],
  stressed: [
    "It’s okay to feel overwhelmed sometimes.",
    "Let’s slow things down for a moment."
  ]
};

const moodButtons = document.querySelectorAll(".mood-option");
const moodResponseEl = document.getElementById("moodResponse");
const mindStreakEl = document.getElementById("mindStreak");
const subtextEl = document.getElementById("mindSubtext");

const todayKey = () => new Date().toISOString().slice(0, 10);

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const randomFrom = (items) => items[Math.floor(Math.random() * items.length)];

const updateStreakDisplay = () => {
  const count = Number(localStorage.getItem("mindStreakCount") || 0);
  const safeCount = Number.isFinite(count) ? count : 0;
  if (mindStreakEl) {
    mindStreakEl.textContent = `🔥 ${safeCount}-day reflection streak`;
  }
};

const applySelectedMood = (mood) => {
  moodButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.mood === mood);
  });
};

const handleMoodSelection = (mood) => {
  const today = todayKey();
  const lastCheckIn = localStorage.getItem("mindCheckInDate");
  let streakCount = Number(localStorage.getItem("mindStreakCount") || 0);

  if (lastCheckIn !== today) {
    streakCount = lastCheckIn === yesterdayKey() ? streakCount + 1 : 1;
    localStorage.setItem("mindStreakCount", String(streakCount));
    localStorage.setItem("mindCheckInDate", today);
  }

  localStorage.setItem("mindMood", mood);
  localStorage.setItem("mindMoodDate", today);

  applySelectedMood(mood);
  updateStreakDisplay();
  if (moodResponseEl) {
    moodResponseEl.textContent = randomFrom(moodResponses[mood]);
  }
};

if (subtextEl) {
  subtextEl.textContent = randomFrom(mindSubtexts);
}

const storedMoodDate = localStorage.getItem("mindMoodDate");
const storedMood = localStorage.getItem("mindMood");
if (storedMood && storedMoodDate === todayKey()) {
  applySelectedMood(storedMood);
}

updateStreakDisplay();

moodButtons.forEach((button) => {
  button.addEventListener("click", () => handleMoodSelection(button.dataset.mood));
});

const modalTriggers = document.querySelectorAll(".reset-tile");
const modals = document.querySelectorAll(".modal");

const closeModal = (modal) => {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  modal.querySelectorAll("input, textarea").forEach((field) => {
    field.value = "";
  });
};

modalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const modal = document.getElementById(`${trigger.dataset.modal}Modal`);
    if (!modal) return;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  });
});

modals.forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });

  modal.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => closeModal(modal));
  });
});

const hamburger = document.getElementById("hamburger-btn");
const navClose = document.getElementById("nav-close");
const mainNav = document.getElementById("main-nav");
const navHelp = document.getElementById("nav-help");

if (hamburger && mainNav) {
  hamburger.addEventListener("click", () => mainNav.classList.toggle("open"));
}

if (navClose && mainNav) {
  navClose.addEventListener("click", () => mainNav.classList.remove("open"));
}

if (navHelp) {
  navHelp.addEventListener("click", (event) => event.preventDefault());
}
