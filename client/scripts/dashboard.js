/* ——— PLAN helpers ——— */
function isProUser() {
  /* ✨ If you store the flag under a different key, just swap it here */
  return localStorage.getItem("hasProTracker") === "true";
}

/* Adds the badge (Core / Pro) to the top‑right corner */
function addTrackerBadge() {
  const badge = document.getElementById("trackerBadge");
  const isPro = isProUser();

  if (isPro) {
    badge.className = "pt-extra-container tracker-badge";
    badge.innerHTML = `
      <span class="pt-extra">
        <span class="crown-emoji">👑</span> Pro<br>Tracker
      </span>`;
  } else {
    badge.className = "ct-extra-container tracker-badge";
    badge.innerHTML = `
      <span class="ct-extra">Core<br>Tracker</span>`;
  }
}

/* ---------- 1. Constants ---------- */

// Place these immediately after your noWorkoutStreakMsg and noNutritionStreakMsg definitions:

// 1A – greetings
const firstTimeWelcome = [
  "Welcome — your journey starts here.",
  "Let’s get you moving in the right direction.",
  "Every transformation begins with a single step.",
  "You’ve just unlocked your next chapter.",
  "Here’s to day one — let’s make it count.",
  "You’ve got everything you need to succeed.",
  "Let’s build something great together.",
  "Ready when you are — your journey starts now.",
  "This is where progress begins.",
  "Let’s take that first step toward your goals."
];

const returningWelcome = [
  "Your journey continues — what’s next?",
  "You’ve already made progress — let’s build on it.",
  "Momentum is on your side — keep it going.",
  "Small wins today. Big changes tomorrow.",
  "Let’s keep the streak alive.",
  "You’re showing up — that’s what matters.",
  "Every choice moves you forward. Choose powerfully.",
  "Progress looks good on you.",
  "Stay focused. Stay consistent.",
  "Your future self is proud of you.",
  "Let’s make today count.",
  "Another chance to push forward.",
  "Discipline builds momentum.",
  "Progress is built in moments like this.",
  "What’s your next move?",
  "Keep showing up for yourself.",
  "You’ve come this far — let’s keep going."
];

// 1B – tracker‑card helper messages
const firstTimeWorkoutDesc = [
  "Track your workouts and watch your strength grow.",
  "Your personal workout log — tailored to your goals.",
  "Follow your plan and log each set as you go.",
  "Track your progress wherever you train.",
  "Build consistency and hit new personal bests.",
  "Train with structure, wherever you are.",
  "Progress starts with a plan. Let’s log your first workout.",
  "Stay accountable and see your improvements over time.",
  "Your fitness journey, fully guided and tracked."
];

const noWorkoutStreakMsg = [
  "Let’s get your workout streak started.",
  "No streak yet — today’s a great day to begin.",
  "The first session always counts the most.",
  "Ready to log your first workout?",
  "One workout today. Progress tomorrow.",
  "Every streak starts with one session.",
  "Your workout journey begins with a single rep.",
  "Let’s build momentum together.",
  "Today could be day one of something great.",
  "You’ve got this — let’s start moving."
];

// const lostWorkoutStreakMsg = [
//   "Streak reset — time to rebuild.",
//   "Everyone slips. What matters is you’re here now.",
//   "The past doesn’t define you — today does.",
//   "No pressure. Just progress.",
//   "Your streak starts fresh from today.",
//   "New day. New chance. Let’s go.",
//   "Welcome back — let’s get the momentum going again.",
//   "No worries. Let’s restart that streak.",
//   "Fall off. Get up. Try again.",
//   "Back on track — your next streak starts now."
// ];

// Nutrition parallels
const firstTimeNutritionDesc = [
  "Log your meals and track your macros with ease.",
  "Stay on top of your calories, protein, carbs, and fats.",
  "Get meal suggestions tailored to your goal.",
  "Simple, flexible food tracking designed around you.",
  "Build healthy eating habits one meal at a time.",
  "Your nutrition, simplified and structured.",
  "Track your food, your way — no stress, no restriction.",
  "Fuel your progress with smarter eating choices.",
  "Know what to eat, when, and why — without guesswork.",
  "Create sustainable habits that support your goals."
];

const noNutritionStreakMsg = [
  "Log your first meal to start your streak.",
  "Let’s build a healthy rhythm — one meal at a time.",
  "No streak yet — today’s a perfect starting point.",
  "Start strong with your first meal logged.",
  "Track today’s meals and kick off your progress.",
  "Consistency begins with your next bite.",
  "Let’s get your nutrition streak going.",
  "The best time to start is now.",
  "Your habits begin with what you log today.",
  "Fuel up — and start building consistency."
];

// const lostNutritionStreakMsg = [
//   "No stress — let’s get back to consistent meals.",
//   "You’ve reset your streak — a fresh start begins today.",
//   "Missed a day? Happens to the best of us — let’s log today.",
//   "New day, new meal — your streak starts fresh from here.",
//   "You’re back — let’s rebuild that rhythm.",
//   "Progress isn’t linear. What matters is showing up now.",
//   "The streak’s reset, but the journey continues.",
//   "Let’s bounce back stronger — log today’s meals.",
//   "Consistency is built one day at a time.",
//   "You’ve got this — just take the next step forward."
// ];

// 1C – daily motivation
const dailyMotivationArr = [
  "Small steps today. Big changes tomorrow.",
  "Consistency beats intensity.",
  "Progress is built one choice at a time.",
  "You don’t need to be perfect — just present.",
  "Your future self will thank you for today.",
  "Discipline is the shortcut to momentum.",
  "Slow progress is still progress.",
  "Keep showing up — it’s working.",
  "Your health is your foundation.",
  "Every win starts with a decision to begin."
];

const lostWorkoutStreakMsg   = noWorkoutStreakMsg;
const lostNutritionStreakMsg = noNutritionStreakMsg;

/* ---------- 2. Helpers ---------- */
const $ = sel => document.querySelector(sel);
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* XP utilities (mirrors NT) */
const xpLevels = [10, 20, 40, 70, 100, 130, 160, 190, 220, 250];
const xpNeeded = lvl => (lvl < xpLevels.length ? xpLevels[lvl] : 250);

function renderXP() {
  const xp = +localStorage.getItem("currentXP") || 0;
  const lvl = +localStorage.getItem("currentLevel") || 0;
  const needed = xpNeeded(lvl);
  const pct = Math.min(xp / needed, 1) * 100;

  $("#currentLevel").textContent = `Lvl ${lvl}`;
  $("#xpFill").style.width = pct + "%";
}

/* ---------- 3. Tracker‑specific data fetchers ---------- */

/*  WORKOUTS  --------------------------------------------------- */
function fetchWorkoutInfo() {

  const firstTime = !localStorage.getItem("hasVisitedWorkoutTracker");

  const week = localStorage.getItem("activeWorkoutWeek") || 1;
  const workoutsDone = +localStorage.getItem(`week${week}_workoutsDone`) || 0;
  const workoutsAssigned =
    +localStorage.getItem(`week${week}_workoutsAssigned`) || 0;

  const progressPct =
    workoutsAssigned > 0 ? workoutsDone / workoutsAssigned : 0;

  const streakCount = +localStorage.getItem("streakCount") || 0;
  const streakLost = streakCount === 0 && !firstTime;

  return {
    hasCurrent: workoutsAssigned > 0,
    name: `Week ${week}`,
    progressPct,
    firstTime,
    streakCount,
    streakLost
  };
}

/*  NUTRITION  --------------------------------------------------- */
function fetchNutritionInfo() {
  const firstTime = !localStorage.getItem("hasVisitedNutritionTracker");

  /* figure out which day */
  const week = localStorage.getItem("activeNutritionWeek") || 1;
  const dayIdx = +localStorage.getItem("currentNutritionDayIndex") || 0; // 0‑based
  const day = dayIdx + 1;

  /* how many meals total should we expect? */
  const totalMeals = +localStorage.getItem("mealFrequency") || 4;

  /* count how many of those have a status recorded */
  let mealsLogged = 0;
  for (let m = 1; m <= totalMeals; m++) {
    if (localStorage.getItem(`week${week}_day${day}_meal${m}_status`)) {
      mealsLogged++;
    }
  }

  const streakCount = +localStorage.getItem("nutritionStreakCount") || 0;
  const streakLost = streakCount === 0 && !firstTime;

  return {
    hasCurrentMeals: mealsLogged > 0,
    mealsLogged,
    totalMeals,
    firstTime,
    streakCount,
    streakLost
  };
}

/* ---------- 4. Populate UI ---------- */
function populateGreeting() {
  const user = localStorage.getItem("name") || "Friend";
  const today = new Date();
  const birthday = localStorage.getItem("dob"); // YYYY‑MM‑DD
  const firstVisit = !localStorage.getItem("dashboardVisited");

  let heading = `Welcome${firstVisit ? "" : " back"}, ${user}!`;

  if (birthday) {
    const [y, m, d] = birthday.split("-");
    if (today.getMonth() + 1 === +m && today.getDate() === +d) {
      heading = `Happy Birthday, ${user}! 🎉`;
    }
  }

  $("#welcomeHeading").textContent = heading;
  $("#welcomeSub").textContent = firstVisit
    ? rand(firstTimeWelcome)
    : rand(returningWelcome);

  localStorage.setItem("dashboardVisited", "true");
}

function populateWorkoutCard() {
  const info = fetchWorkoutInfo();
  const statusEl = $("#wtStatus");
  const streakEl = $("#wtStreak");

  if (info.hasCurrent) {
// new
statusEl.textContent = `${info.name}: ${Math.round(info.progressPct*100)}% Complete`;

  } else {
    statusEl.textContent = rand(firstTimeWorkoutDesc);
  }

  if (info.streakCount > 0) {
    streakEl.textContent = `🔥 ${info.streakCount}-day streak`;
  } else {
    streakEl.textContent = info.firstTime
      ? rand(noWorkoutStreakMsg)
      : rand(info.streakLost ? lostWorkoutStreakMsg : noWorkoutStreakMsg);
  }
}

function populateNutritionCard() {
  const info = fetchNutritionInfo();
  const statusEl = $("#ntStatus");
  const streakEl = $("#ntStreak");

  if (info.hasCurrentMeals) {
    statusEl.textContent =
      `Meal Completion: ${info.mealsLogged} out of ${info.totalMeals}`;
  } else {
    statusEl.textContent = rand(firstTimeNutritionDesc);
  }

  if (info.streakCount > 0) {
    streakEl.textContent = `🔥 ${info.streakCount}-day streak`;
  } else {
    streakEl.textContent = info.firstTime
      ? rand(noNutritionStreakMsg)
      : rand(info.streakLost ? lostNutritionStreakMsg : noNutritionStreakMsg);
  }
}

function populateMotivation() {
  const todayKey = new Date().toISOString().slice(0, 10);
  let msg = localStorage.getItem("dashboardMotivationMsg");
  const storedDate = localStorage.getItem("dashboardMotivationDate");

  if (storedDate !== todayKey || !msg) {
    msg = rand(dailyMotivationArr);
    localStorage.setItem("dashboardMotivationMsg", msg);
    localStorage.setItem("dashboardMotivationDate", todayKey);
  }
  $("#motivationMsg").textContent = msg;
}

/* ——— Adjust the UI for Core users ——— */
function applyCoreDashboardChanges() {
  if (isProUser()) return;         // PT customers see the normal dashboard

  /* 1 · Workout card upsell line */
  const wtCardEl = document.getElementById("wtCard");
  wtCardEl.style.background = "rgba(225, 225, 225, 0.85)";
  wtCardEl.style.border     = "1px solid rgba(0, 0, 0, 0.06)";
  const wtCard = document.getElementById("wtCard");
  const upsell = document.createElement("p");
  upsell.className = "core-lock";
  upsell.innerHTML =
    `<span class="lock-emoji">🔓</span> Only Core features active — Adaptive Progression and Insights are locked.`;
  wtCard.insertBefore(upsell, wtCard.querySelector(".cta"));

  /* 2 · Nutrition card lock‑state */
  const ntStatus = document.getElementById("ntStatus");
  ntStatus.innerHTML =
    `<div class="pt-extra-container">
       <span class="crown-emoji">👑</span><span class="pt-extra">Pro Tracker Only</span>
     </div>`;

  const ntStreak = document.getElementById("ntStreak");
  ntStreak.textContent =
    "Hit your macro targets without overthinking — with meals, tracking, and insights aligned to your goal.";

  const ntCTA = document.querySelector("#ntCard .cta");
  ntCTA.textContent = "🔓 Unlock Pro Tracker";
  ntCTA.href        = "offer.html";
  ntCTA.classList.add("pt-cta");

  /* 3 · My Progress card (only visible for Core) */
  document.getElementById("mpCard").style.display = "flex";

  /* 4 · Compare‑plans prompt */
  const motivationSec = document.querySelector(".motivation");
  const comparePrompt = document.querySelector(".compare-plans");
  if (comparePrompt) {
    comparePrompt.style.display = "block";         
    motivationSec.parentNode.insertBefore(comparePrompt, motivationSec);
  }
  const navNutrition = document.getElementById("nav-nutrition");
  if (navNutrition) {
    // 1. swap the text
    navNutrition.textContent = "🔒My Nutrition";
    // 2. remove its link
    navNutrition.removeAttribute("href");
    // 3. visually hint that it’s disabled
    navNutrition.style.cursor = "default";
    navNutrition.style.opacity = "0.6"; // optional, to grey it out

    // 4. prevent any stray clicks
    navNutrition.addEventListener("click", e => e.preventDefault());

    // 5. insert the Pro-only badge right below it
    const badge = document.createElement("div");
    badge.className = "pt-extra-container";  // your existing badge styling
    badge.innerHTML = `
      <span class="crown-emoji">👑</span>
      <span class="pt-extra">Pro Tracker Only</span>
    `;
    // Optional spacing
    badge.style.margin = "4px 0 0 0";
    // insert immediately after the <a>
    navNutrition.insertAdjacentElement("afterend", badge);
  }

  /* 5 · Show first‑workout banner (if applicable) */
  maybeShowFirstWorkoutBanner();
}

function maybeShowFirstWorkoutBanner() {
  if (isProUser()) return;   // Pro users never see it

  const completedASet   = Object.keys(localStorage)
        .some(k => k.startsWith("checkboxState") && localStorage.getItem(k) === "true");

  const clickedFinish   = Object.keys(localStorage)
        .some(k => k.startsWith("workoutFinished_") && localStorage.getItem(k) === "true");

  if (!completedASet && !clickedFinish) return;     // no workout logged yet

  const banner = document.getElementById("firstWorkoutBanner");
  banner.style.display = "block";
  setTimeout(() => banner.classList.add("visible"), 200);
}

/* ---------- 5. Fade‑in on load ---------- */
function reveal() {
  document.querySelectorAll(".fade-in").forEach((el, i) => {
    setTimeout(() => el.classList.add("visible"), i * 200);
  });
}

/* ---------- 6. Init ---------- */
function init() {
  populateGreeting();
  renderXP();
  populateWorkoutCard();
  populateNutritionCard();
  populateMotivation();
  reveal();
  wireUpCardClicks();
  addTrackerBadge();           // badge in the corner
  applyCoreDashboardChanges(); // only runs if user is on Core
  setUpCompareModal();         // modal listeners
  if (isProUser()) {
    const ntSub = document.querySelector('.nt-subtext');
    if (ntSub) ntSub.remove();
    document
    .querySelectorAll('#wtCard a.cta, #ntCard a.cta')
    .forEach(btn => btn.classList.add('pt-cta'));
  }
}

document.addEventListener("DOMContentLoaded", init);

// ───────────────────────────────────────────────────────────
// 7. Card “click outside” handler: 
//    card stays put when clicked, but moves down on any outside click
// ───────────────────────────────────────────────────────────
function wireUpCardClicks() {
  const cards = document.querySelectorAll('.tracker-card');

  cards.forEach(card => {
    // clicking the card itself
    card.addEventListener('click', e => {
      // prevent the global listener from firing
      e.stopPropagation();
      // ensure it’s not shifted down
      card.classList.remove('move-down');
    });
  });

  // clicking anywhere else on the page:
  document.addEventListener('click', () => {
    cards.forEach(card => card.classList.add('move-down'));
  });
}

function setUpCompareModal() {
  const link    = document.getElementById("comparePlansLink");
  const bannerC = document.getElementById("firstWorkoutCompare");  // ← new
  const modal   = document.getElementById("compareModal");
  if (!modal) return;

  const closeBtn = modal.querySelector(".close");

  // existing “Compare Plans” link
  if (link) {
    link.addEventListener("click", e => {
      e.preventDefault();
      modal.classList.add("show");
    });
  }

  // new: banner’s “See What’s Inside” CTA
  if (bannerC) {
    bannerC.addEventListener("click", e => {
      e.preventDefault();
      modal.classList.add("show");
    });
  }

  // close handlers
  closeBtn.addEventListener("click", () => modal.classList.remove("show"));
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("show");
  });
}

const loginModal   = document.getElementById("login-modal");
const faqModal     = document.getElementById("faq-modal");
const btnWorkouts  = document.getElementById("nav-workouts");
const btnNutrition = document.getElementById("nav-nutrition");
const btnHelp      = document.getElementById("nav-help");
const closeBtns    = document.querySelectorAll(".close-btn");
const mainNav   = document.querySelector(".main-nav");
const hamburger = document.getElementById("hamburger-btn");
const navClose  = document.getElementById("nav-close");

// open FAQ modal on Help click
btnHelp.addEventListener("click", e => {
  e.preventDefault();
  faqModal.style.display = "flex";
});

// close any modal
closeBtns.forEach(x =>
  x.addEventListener("click", () => {
    document.getElementById(x.dataset.target).style.display = "none";
  })
);

// hamburger toggles mobile nav
hamburger.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});

navClose.addEventListener("click", () => {
  mainNav.classList.remove("open");
});

// close modals when clicking outside content
[ loginModal, faqModal ].forEach(modal => {
  if (!modal) return;   // ← bail out early if “modal” is null
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });
});