/* ───── loader utilities ───── */
function setLoaderScale(rawPct = 0) {
  // ease & overshoot: convert 0-1 to a nicer curve
  const eased = rawPct < 1
    ? 0.8 + 0.6 * rawPct              // 0.8 → 1.4
    : 1.4 - 0.4 * Math.min((rawPct - 1) * 6, 1);  // overshoot then settle

  document.documentElement
    .style.setProperty('--scale', eased.toFixed(3));
}

function startIdlePulse() {
  document.querySelector('.loader-logo')?.classList.add('pulsing');
}

function stopIdlePulse() {
  document.querySelector('.loader-logo')?.classList.remove('pulsing');
}

function fadeOutLoader() {
  const overlay = document.getElementById('loaderOverlay');
  if (!overlay) return;
  overlay.classList.add('fade-out');
  overlay.addEventListener('transitionend', () => overlay.remove(),
    { once: true });
}


(async function protectAndInit() {

  /* 0 · show splash instantly */
  startIdlePulse();

  const token = localStorage.getItem('token');
  if (!token) { location.href = 'log-in-carter.html'; return; }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Invalid token');

    /* 1 · kick off work + smooth progress ****************************************/
    const tasks = [
      decideProStatus(token),
      fetchAndStorePreferences(token),
      loadUserProgressSafe()
    ];
    let target = 0, current = 0;
    const bump = () => { target += 1 / tasks.length; };

    /* animation loop */
    (function raf() {
      // lerp toward target
      current += (target - current) * 0.12;
      setLoaderScale(current);
      if (current < 1.01) requestAnimationFrame(raf);
    })();

    await Promise.all(tasks.map(p => p.then(bump, bump)));
    stopIdlePulse();   // progress has taken over

    // console.log('✅ Preferences and Progress loaded');

    /* 2 · render dashboard *******************************************************/
    runDsOnboarding();
    initDashboard();

    /* 3 · graceful exit **********************************************************/
    setLoaderScale(1.05);          // overshoot a hair
    setTimeout(fadeOutLoader, 180); // let the bounce settle first

  } catch (err) {
    // console.error('❌ Boot error:', err);
    localStorage.removeItem('token');
    location.href = 'log-in-carter.html';
  }
})();

// async function decideProStatus(token)) {
//   const planFromLS = localStorage.getItem('planName') || '';

//   /* 1)  quick front-end guess so the UI doesn’t flash blank  */
//   let isPro = planFromLS === '12-Week Program' || planFromLS === 'Pro Tracker';

//   /* 2) hit the backend for the real numbers                  */
//   try {
//     const res = await fetch(`/api/access?ts=${Date.now()}`, {     // ⬅️ cache-buster
//       cache: 'no-store',                                        // ⬅️ double safety
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     if (res.ok) {
//       const { unlockedWeeks = 0, subscriptionActive = false } = await res.json();

//       /* ---------- infer the plan if none stored ---------- */
//       let plan = planFromLS;
//       if (!plan) {
//         if (subscriptionActive) plan = 'Pro Tracker';
//         else if (unlockedWeeks >= 12) plan = '12-Week Program';
//         else if (unlockedWeeks >= 4) plan = '4-Week Program';
//         else if (unlockedWeeks >= 1) plan = '1-Week Program';
//         localStorage.setItem('planName', plan);
//       }

//       /* ---------- final Pro decision --------------------- */
//       if (plan === 'Pro Tracker') isPro = subscriptionActive;
//       else if (plan === '12-Week Program') isPro = true;
//       else isPro = false;

//       /* expose weeks to the workout tracker                */
//       localStorage.setItem('purchasedWeeks', String(unlockedWeeks));
//     }
//   } catch (err) {
//     // console.warn('[decideProStatus] backend unreachable – using best guess:', err.message);
//   }

//   localStorage.setItem('hasProTracker', isPro ? 'true' : 'false');
//   // console.log('🔧 Pro-Tracker flag set →', isPro);
// }

async function decideProStatus() {
  /*  ��  FORCE these three flags on every load  💥 */
  localStorage.setItem('hasProTracker',  'true');   // ← tells UI “Pro”
  localStorage.setItem('purchasedWeeks', '12');     // ← lets workouts show
  localStorage.setItem('planName',       'Pro Tracker');

  /*  If some other code still calls this with a token or
      awaits its Promise, we return a resolved Promise to keep
      the call-site happy.                                         */
  return true;
}

async function loadUserProgressSafe() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}` };

  // 1) Fetch the Workout‐tracker snapshot
  let workoutProgress = {};
  try {
    const res = await fetch('/api/workouts/getUserProgress', {
      method: 'GET',
      headers
    });
    if (res.ok) {
      workoutProgress = await res.json();
    } else if (res.status !== 404) {
      // console.error('❌ /api/workouts/getUserProgress failed:', res.statusText);
    }
  } catch (err) {
    // console.error('❌ Error fetching workouts/getUserProgress:', err);
  }

  // 2) Fetch the Dashboard snapshot (for ds_onboarding_complete)
  let dashboardProgress = {};
  try {
    const res = await fetch('/api/progress/getUserProgress', {
      method: 'GET',
      headers
    });
    if (res.ok) {
      dashboardProgress = await res.json();
    } else if (res.status !== 404) {
      // console.error('❌ /api/progress/getUserProgress failed:', res.statusText);
    }
  } catch (err) {
    // console.error('❌ Error fetching progress/getUserProgress:', err);
  }

  let nutritionProgress = {};
  try {
    const res = await fetch('/api/nutrition/getUserProgress', { headers });
    if (res.ok) nutritionProgress = await res.json();
    else if (res.status !== 404) {
      // console.error('❌ /api/nutrition/getUserProgress failed:', res.statusText);
    }
  } catch (err) {
    // console.error('❌ Error fetching nutrition/getUserProgress:', err);
  }

  // 3) Merge them (dashboardProgress wins on flags)
  const progress = {
    ...workoutProgress,
    ...dashboardProgress,
    ...nutritionProgress
  };

  // 4) Write core fields
  localStorage.setItem('currentXP', progress.xp ?? 0);
  localStorage.setItem('currentLevel', progress.currentLevel ?? 1);
  localStorage.setItem('streakCount', progress.streak?.count ?? 0);
  localStorage.setItem('streakStartDate', progress.streak?.startDate ?? '');

  localStorage.setItem(
    'nutritionStreakCount',
    progress.nutritionStreakCount
    ?? progress.streakCount              // in case it’s flat
    ?? progress.nutritionStreak?.count
    ?? 0
  );
  localStorage.setItem(
    'nutritionStreakStartDate',
    progress.nutritionStreakStartDate
    ?? progress.streakStartDate
    ?? progress.nutritionStreak?.startDate
    ?? ''
  );

  localStorage.setItem('programStartDate', progress.program?.startDate ?? '');
  localStorage.setItem('activeWorkoutWeek',
    progress.program?.activeWorkoutWeek ?? 1);
  localStorage.setItem('activeNutritionWeek',
    progress.program?.activeNutritionWeek ?? 1);
  localStorage.setItem('completedThisWeek',
    progress.program?.completedThisWeek ?? 0);

  if (progress.program?.weeklyStats) {
    for (const wk in progress.program.weeklyStats) {
      const s = progress.program.weeklyStats[wk];
      if (!s) continue;
      localStorage.setItem(`${wk}_workoutsDone`, s.workoutsDone ?? 0);
      localStorage.setItem(`${wk}_totalReps`, s.totalReps ?? 0);
      localStorage.setItem(`${wk}_totalSets`, s.totalSets ?? 0);
      localStorage.setItem(`${wk}_totalWeight`, s.totalWeight ?? 0);
    }
  }

  // 5) Simple object/boolean blobs
  if (progress.checkboxState) {
    for (const k in progress.checkboxState) {
      localStorage.setItem(k, progress.checkboxState[k] ? 'true' : 'false');
    }
  }
  if (progress.awardedState) {
    for (const k in progress.awardedState) {
      localStorage.setItem(k, progress.awardedState[k] ? 'true' : 'false');
    }
  }
  if (progress.workoutStarted) {
    for (const k in progress.workoutStarted) {
      localStorage.setItem(k, progress.workoutStarted[k] ? 'true' : 'false');
    }
  }
  if (progress.workoutFinished) {
    for (const k in progress.workoutFinished) {
      localStorage.setItem(k, progress.workoutFinished[k] ? 'true' : 'false');
    }
  }
  if (progress.recapShown) {
    localStorage.setItem('currentWorkoutRecapShown',
      JSON.stringify(progress.recapShown));
  }
  if (progress.setValues) {
    for (const k in progress.setValues) {
      localStorage.setItem(k, progress.setValues[k]);
    }
  }

  // 6) **Onboarding flags** – only ever flip false→true
  if (dashboardProgress.ds_onboarding_complete === true) {
    localStorage.setItem('ds_onboarding_complete', '1');
  }
  if (workoutProgress.wt_onboarding_complete === true) {
    localStorage.setItem('wt_onboarding_complete', '1');
  }

  // console.log('✅ Full user progress restored (merged endpoints)');
  const { xp, lvl } = normaliseXPandLevel();
  // console.log(`🔄 Normalised to XP=${xp}, Level=${lvl}`);
}

// ✨ New helper
async function fetchAndStorePreferences(token) {
  try {
    const res = await fetch('/api/getUserPreferences', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch preferences');
    }

    const data = await res.json();

    // Store fields in localStorage (match your existing system)
    if (data.goal) localStorage.setItem('goal', data.goal);
    if (data.goalDriver) localStorage.setItem('goalDriver', data.goalDriver);
    if (data.units) localStorage.setItem('weightUnit', data.units);
    if (data.startWeight) localStorage.setItem('weight', data.startWeight);
    if (data.goalWeight) localStorage.setItem('userGoalWeight', data.goalWeight);
    if (data.goalDate) localStorage.setItem('userGoalDate', data.goalDate);
    if (data.activityLevel) localStorage.setItem('activityLevel', data.activityLevel);
    if (data.workoutExperience) localStorage.setItem('fitnessLevel', data.workoutExperience);
    if (Array.isArray(data.dietaryPreferences)) {
      localStorage.setItem('dietaryRestrictions', data.dietaryPreferences[0] || '');
    }
    if (typeof data.mealsPerDay === 'number') {
      localStorage.setItem('mealFrequency', data.mealsPerDay.toString());
    }

    // console.log('✅ Preferences loaded into localStorage');
  } catch (err) {
    // console.error('❌ Failed to fetch/store preferences:', err);
    alert('Could not load your preferences. Please try re-logging in.');
  }
}

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
    badge.className = "";
    badge.innerHTML = `
      <span>
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

const lostWorkoutStreakMsg = noWorkoutStreakMsg;
const lostNutritionStreakMsg = noNutritionStreakMsg;

/* ---------- 2. Helpers ---------- */
const $ = sel => document.querySelector(sel);
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* XP utilities (mirrors NT) */
const xpLevels = [10, 20, 40, 70, 100, 130, 160, 190, 220, 250];
const xpNeeded = lvl => (lvl < xpLevels.length ? xpLevels[lvl] : 250);

function normaliseXPandLevel() {
  let xp = Number(localStorage.getItem('currentXP')) || 0;
  let lvl = Number(localStorage.getItem('currentLevel')) || 0;

  // carry overflow XP upward
  while (xp >= xpNeeded(lvl)) {
    xp -= xpNeeded(lvl);
    lvl++;
  }

  localStorage.setItem('currentXP', xp);
  localStorage.setItem('currentLevel', lvl);

  return { xp, lvl };
}

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
    statusEl.textContent = `${info.name}: ${Math.round(info.progressPct * 100)}% Complete`;

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
  wtCardEl.style.border = "1px solid rgba(0, 0, 0, 0.06)";
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
  ntCTA.href = "offer-carter.html";
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
      <span></span>
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

  const completedASet = Object.keys(localStorage)
    .some(k => k.startsWith("checkboxState") && localStorage.getItem(k) === "true");

  const clickedFinish = Object.keys(localStorage)
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

/* ---------- Referral urgency timer ---------- */
const REFERRAL_TIMER_KEY = 'referralCountdownDeadline';
const REFERRAL_TIMER_DONE_KEY = 'referralCountdownExpired';
const REFERRAL_TIMER_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function setUpReferralCountdown() {
  const wrapper = document.getElementById('referralCountdown');
  if (!wrapper) return;

  const valueEl = wrapper.querySelector('.referral-banner__timer-value');
  if (!valueEl) return;

  if (localStorage.getItem(REFERRAL_TIMER_DONE_KEY) === 'true') {
    wrapper.style.display = 'none';
    wrapper.setAttribute('aria-hidden', 'true');
    return;
  }

  const now = Date.now();
  let deadline = Number.parseInt(localStorage.getItem(REFERRAL_TIMER_KEY), 10);

  if (!Number.isFinite(deadline)) {
    deadline = now + REFERRAL_TIMER_DURATION;
    localStorage.setItem(REFERRAL_TIMER_KEY, String(deadline));
  }

  if (deadline <= now) {
    wrapper.style.display = 'none';
    wrapper.setAttribute('aria-hidden', 'true');
    localStorage.setItem(REFERRAL_TIMER_DONE_KEY, 'true');
    localStorage.removeItem(REFERRAL_TIMER_KEY);
    return;
  }

  const update = () => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      valueEl.textContent = '00:00:00';
      clearInterval(intervalId);
      wrapper.style.display = 'none';
      wrapper.setAttribute('aria-hidden', 'true');
      localStorage.setItem(REFERRAL_TIMER_DONE_KEY, 'true');
      localStorage.removeItem(REFERRAL_TIMER_KEY);
      return;
    }

    valueEl.textContent = formatCountdown(remaining);
  };

  valueEl.textContent = formatCountdown(deadline - now);
  const intervalId = setInterval(update, 1000);
}

/* ---------- 6. Init ---------- */

function initDashboard() {
  populateGreeting();
  renderXP();
  populateWorkoutCard();
  populateNutritionCard();
  populateMotivation();
  reveal();
    setUpReferralCountdown();
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
  const link = document.getElementById("comparePlansLink");
  const bannerC = document.getElementById("firstWorkoutCompare");  // ← new
  const modal = document.getElementById("compareModal");
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

const loginModal = document.getElementById("login-modal");
const faqModal = document.getElementById("faq-modal");
const btnWorkouts = document.getElementById("nav-workouts");
const btnNutrition = document.getElementById("nav-nutrition");
const btnHelp = document.getElementById("nav-help");
const closeBtns = document.querySelectorAll(".close-btn");
const mainNav = document.querySelector(".main-nav");
const hamburger = document.getElementById("hamburger-btn");
const navClose = document.getElementById("nav-close");

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
[loginModal, faqModal].forEach(modal => {
  if (!modal) return;   // ← bail out early if “modal” is null
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });
});
function runDsOnboarding() {
  const overlay = document.getElementById('wtOnboardingOverlay');
  if (!overlay) return;

  // **this must be the very first check**
  if (localStorage.getItem('ds_onboarding_complete') === '1') return;

  // helper to read localStorage
  function ls(key) {
    const v = localStorage.getItem(key);
    return v === null ? undefined : v;
  }

  // pull user data
  const name = ls('name') || 'Athlete';
  const goalRaw = ls('goal') || '';
  const kgToLbs = w => w * 2.2046226218;
  const getPref = () => (ls('weightUnit') || 'kg').toLowerCase();
  const fmtW = kg => (getPref() === 'lbs'
    ? `${kgToLbs(kg).toFixed(1)} lbs`
    : `${kg.toFixed(1)} kg`);
  const goalDriver = ls('goalDriver');
  const userGoalWeight = parseFloat(ls('userGoalWeight'));
  const weight = parseFloat(ls('weight'));
  const goal = goalRaw.toLowerCase().trim();

  // build the goal line with <span> emoji
  let goalLines = '';

  if (goal.includes('lose weight')) {
    if (!isNaN(weight) && !isNaN(userGoalWeight) && weight > userGoalWeight) {
      goalLines = `<span class="wt-emoji-goal">🔥</span> Your goal is to lose ${fmtW(weight - userGoalWeight)}.`;
    } else {
      goalLines = `<span class="wt-emoji-goal">🔥</span> You’re here to lose weight — and we’ll help you do it, one workout at a time.`;
    }
  } else if (goal.includes('gain muscle')) {
    if (!isNaN(weight) && !isNaN(userGoalWeight) && userGoalWeight > weight) {
      goalLines = `<span class="wt-emoji-goal">💪</span> You’re aiming to gain ${fmtW(userGoalWeight - weight)} of muscle.`;
    } else {
      goalLines = `<span class="wt-emoji-goal">💪</span> You’re here to build strength and gain muscle — let’s make it happen.`;
    }
  } else if (goal.includes('improve body composition')) {
    if (!isNaN(weight) && !isNaN(userGoalWeight) && Math.abs(userGoalWeight - weight) < 3) {
      goalLines = `<span class="wt-emoji-goal">🔥</span> You’re focused on getting leaner and stronger — we’ll guide you there.`;
    } else if (!isNaN(userGoalWeight)) {
      goalLines = `<span class="wt-emoji-goal">��</span> Your goal weight is ${fmtW(userGoalWeight)} — let’s move toward it with purpose.`;
    } else {
      goalLines = `<span class="wt-emoji-goal">��</span> You’re focused on getting leaner and stronger — we’ll guide you there.`;
    }
  }

  // driver lines with <span> emoji
  const driverLines = {
    "A wedding or special event":
      `<span class="wt-emoji-goal">💍</span> Let’s help you feel incredible on the big day.`,
    "An upcoming holiday":
      `<span class="wt-emoji-goal">✈️</span> We’ll help you feel confident stepping off that plane — and even better in your photos.`,
    "A recent breakup or life change":
      `<span class="wt-emoji-goal">🚀</span> This is a powerful reset — and we’re with you every step of the way.`,
    "I want to feel confident in my body again":
      `<span class="wt-emoji-goal">🚀</span> Let’s rebuild that confidence, one workout at a time.`,
    "I'm tired of feeling tired or unmotivated":
      `<span class="wt-emoji-goal">🚀</span> We’ll help you take back your energy and momentum.`,
    "I’m doing this for my mental and emotional health":
      `<span class="wt-emoji-goal">🚀</span> Strong body, strong mind — this is for all of you.`,
    "I’ve let things slip and want to get back on track":
      `<span class="wt-emoji-goal">🚀</span> No judgment. Just forward progress from here on out.`,
    "I want to build discipline and stop starting over":
      `<span class="wt-emoji-goal">🚀</span> Consistency starts now — and this time, it’s different.`,
    "I just feel ready for a change":
      `<span class="wt-emoji-goal">🌱</span> New chapter unlocked. Let’s make it your strongest yet.`
  };

  // motivation copy for step 3
  const motivationCopy = {
    "lose weight": [
      `<span>🔥</span> You’ve got everything you need — now it’s time to put it to work.`,
      `Every check-in, every session — one step closer to your goal.`
    ],
    "gain muscle": [
      `<span>💪</span> This is where progress happens — and it starts today.`,
      `Each session builds strength and moves you forward.`
    ],
    "improve body composition": [
      `<span>🔥</span> Ready to transform? It all starts here.`,
      `Stronger, leaner, more focused — one step at a time.`
    ]
  };


  // early‑out if already seen
  // const overlay = document.getElementById('wtOnboardingOverlay');
  if (!overlay || localStorage.getItem('ds_onboarding_complete')) return;

  // element refs
  const slider = overlay.querySelector('.wt-onboarding-slider');
  const dotsWrap = document.getElementById('wtOnboardingDots');
  const cards = [...slider.children];
  let index = 0;

  slider.style.width = `${cards.length * 100}%`;

  // fill card 1
  const s1 = cards[0];
  s1.querySelector('.wt-title').innerHTML = `🎯 Let’s get started, ${name}!`;
  s1.querySelector('.wt-goal').innerHTML = goalLines;
  s1.querySelector('.wt-driver').innerHTML = driverLines[goalDriver] || '';

  // fill card 3
  const s3 = cards[cards.length - 1];
  const [t3, sub3] = motivationCopy[goal] || ['You’re ready.', 'Let’s begin.'];
  s3.querySelector('.wt-title').innerHTML = t3;
  s3.querySelector('.wt-subtitle').innerHTML = sub3;

  // build dots
  cards.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'wt-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });

  // slide logic
  function goToSlide(n) {
    index = Math.max(0, Math.min(cards.length - 1, n));
    const pct = -(index * (100 / cards.length));
    slider.style.transform = `translateX(${pct}%)`;
    dotsWrap.querySelectorAll('.wt-dot')
      .forEach((d, i) => d.classList.toggle('active', i === index));
    revealLines(cards[index]);
  }
  function nextSlide() { goToSlide(index + 1); }

  // touch‑swipe
  let startX = null;
  overlay.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  overlay.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 60) dx < 0 ? nextSlide() : goToSlide(index - 1);
    startX = null;
  });

  // one‑time reveal
  function revealLines(card) {
    if (card.dataset.revealed === 'true') {
      card.querySelectorAll('.wt-line').forEach(l => l.classList.add('show'));
      return;
    }
    card.dataset.revealed = 'true';
    card.querySelectorAll('.wt-line').forEach((el, i) => {
      setTimeout(() => el.classList.add('show'), 300 * i);
    });
  }

  // button wiring
  const nextButtons = overlay.querySelectorAll('.wt-next-btn');
  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      nextSlide();
    });
  });

  // when you click the Close button, mark complete + dismiss
  overlay.addEventListener('click', async e => {
    if (!e.target.matches('.wt-close-btn')) return;

    /* mark locally */
    localStorage.setItem('ds_onboarding_complete', '1');

    /* persist to backend immediately */
    await fetch('/api/dashboard/setOnboardingComplete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).catch(() => { });

    overlay.classList.add('closing');
    overlay.addEventListener('transitionend', () => overlay.remove(),
      { once: true });
  });

  // show it
  overlay.classList.add('open');
  goToSlide(0);
}