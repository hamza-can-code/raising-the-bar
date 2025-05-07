/* ───── loader utilities (shared) ───── */
function setLoaderScale(rawPct = 0){
  /* ease + small overshoot */
  const eased = rawPct < 1
    ? 0.8 + 0.6 * rawPct                // grows 0.8 → 1.4
    : 1.4 - 0.4 * Math.min((rawPct - 1)*6, 1);
  document.documentElement.style.setProperty('--scale', eased.toFixed(3));
}
function startIdlePulse(){
  document.querySelector('.loader-logo')?.classList.add('pulsing');
}
function stopIdlePulse(){
  document.querySelector('.loader-logo')?.classList.remove('pulsing');
}
function fadeOutLoader(){
  const overlay = document.getElementById('loaderOverlay');
  if(!overlay) return;
  overlay.classList.add('fade-out');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once:true });
}

async function sendWorkoutLog(workoutData) {
  const token = localStorage.getItem('token');

  if (!token) return console.error('No token found, cannot log workout.');
  if (!workoutData || !workoutData.exercises || workoutData.exercises.length === 0) {
    console.warn('⚠️ No exercises found, skipping workout log.');
    return;
  }

  try {
    const res = await fetch('/api/logWorkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workoutData)
    });

    if (!res.ok) {
      throw new Error('Failed to log workout');
    }

    console.log('✅ Workout log saved to backend');
  } catch (err) {
    console.error('❌ Error saving workout log:', err.message);
  }
}

function formatExerciseKey(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-()]/g, '')
    .replace(/_+/g, '_');
}

function buildUserProgress() {
  const userProgress = {
    xp: Number(localStorage.getItem('currentXP')) || 0,
    currentLevel: Number(localStorage.getItem('currentLevel')) || 1,
    progressScore: Number(localStorage.getItem('progressScore')),
    streak: {
      count: Number(localStorage.getItem('streakCount')) || 0,
      startDate: localStorage.getItem('streakStartDate') || null,
    },
    program: {
      startDate: localStorage.getItem('programStartDate') || null,
      activeWorkoutWeek: Number(localStorage.getItem('activeWorkoutWeek')) || 1,
      activeNutritionWeek: Number(localStorage.getItem('activeNutritionWeek')) || 1,
      completedThisWeek: Number(localStorage.getItem('completedThisWeek')) || 0,
      weeklyStats: {}
    },
    workoutLogs: JSON.parse(localStorage.getItem('workoutLogs') || '[]'),
    awardedState: JSON.parse(localStorage.getItem('awardedState') || '{}'),
    checkboxState: JSON.parse(localStorage.getItem('checkboxState') || '{}'),
    workoutStarted: {},
    workoutFinished: {},
    recapShown: JSON.parse(localStorage.getItem('currentWorkoutRecapShown') || '{}'),
    upsells: {
      ctUpsellFirstWorkout: localStorage.getItem('ctUpsell_shown_firstWorkout') === 'true'
    },
    profile: {
      goalWeight: parseFloat(localStorage.getItem('userGoalWeight') || '0'),
      goalDate: localStorage.getItem('userGoalDate') || '',
      currentWeight: parseFloat(localStorage.getItem('userCurrentWeight') || '0'),
      currentWeightDate: localStorage.getItem('userCurrentWeightDate') || ''
    },
    bodyWeightLogs: JSON.parse(localStorage.getItem('bodyWeightLogs') || '[]'),

    // ← existing setValues
    setValues: {}
  };

  for (let key in localStorage) {
    if (key.startsWith('workoutStarted_')) {
      userProgress.workoutStarted[key] = localStorage.getItem(key) === 'true';
    }
    if (key.startsWith('workoutFinished_')) {
      userProgress.workoutFinished[key] = localStorage.getItem(key) === 'true';
    }
  }

  for (let i = 1; i <= 12; i++) {
    userProgress.program.weeklyStats[`week${i}`] = {
      workoutsDone: Number(localStorage.getItem(`week${i}_workoutsDone`)) || 0,
      totalReps: Number(localStorage.getItem(`week${i}_totalReps`)) || 0,
      totalSets: Number(localStorage.getItem(`week${i}_totalSets`)) || 0,
      totalWeight: Number(localStorage.getItem(`week${i}_totalWeight`)) || 0,
    };
  }

  const setValues = {};
  Object.keys(localStorage).forEach(k => {
    if (/_set\d+_(actual|suggested)(Reps|Weight|Duration)$/.test(k)) {
      setValues[k] = localStorage.getItem(k);
    }
  });
  userProgress.setValues = setValues;

  userProgress.ds_onboarding_complete =
    localStorage.getItem('ds_onboarding_complete') === '1';
  userProgress.wt_onboarding_complete =
    localStorage.getItem('wt_onboarding_complete') === '1';

  return userProgress;
}

async function saveMyProgressToServer(progressOverride = null) {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('[saveMyProgressToServer] No auth token – aborting');
    return;
  }

  // Use the supplied object or build a fresh one.
  const payload = progressOverride || buildUserProgress();

  try {
    const res = await fetch('/api/workouts/saveUserProgress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error('❌ saveMyProgressToServer:', await res.text());
    } else {
      console.log('✅ Workout-side snapshot updated',
        new Date().toLocaleTimeString());
    }
  } catch (err) {
    console.error('❌ saveMyProgressToServer:', err.message);
  }
}

async function saveUserProgress(userProgress) {
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('No token found, cannot save user progress.');
    return;
  }

  try {
    const res = await fetch('/api/workouts/saveUserProgress', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userProgress)
    });

    if (!res.ok) {
      throw new Error('Failed to save user progress');
    }

    console.log('✅ User progress saved to backend');
  } catch (err) {
    console.error('❌ Error saving user progress:', err.message);
  }
}

async function handleWorkoutCompletion(currentWeekIndex, currentDayIndex) {
  const workoutData = extractWorkoutData(currentWeekIndex, currentDayIndex);
  if (workoutData) {
    await sendWorkoutLog(workoutData);
  }

  // ① Recalculate & persist the latest Progress Score
  updateProgressScoreAndMessages();

  // ② Now build the snapshot (it will include the updated PS)
  const userProgress = buildUserProgress();
  localStorage.setItem('userProgress', JSON.stringify(userProgress));

  // ③ Finally send it to the server
  await saveUserProgress(userProgress);
}

// ─── NORMALISE & RETURN CONSISTENT XP / LEVEL ──────────────────────────────
function normaliseXPandLevel() {
  let xp = Number(localStorage.getItem('currentXP')) || 0;
  let lvl = Number(localStorage.getItem('currentLevel')) || 0;

  while (xp >= xpNeededForLevel(lvl)) {          // “carry” overflow XP upward
    xp -= xpNeededForLevel(lvl);
    lvl++;
  }

  localStorage.setItem('currentXP', xp);
  localStorage.setItem('currentLevel', lvl);

  return { xp, lvl };                            // feed the result back
}

async function loadUserProgress() {
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('❌ No token found.');
    return;
  }

  try {
    const res = await fetch('/api/progress/getUserProgress', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn('⚠️ No user progress found.');
      return;
    }

    const progress = await res.json();

    // if (progress.ds_onboarding_complete === true) {
    //   localStorage.setItem('ds_onboarding_complete', '1');
    // }
    // if (progress.wt_onboarding_complete === true) {
    //   localStorage.setItem('wt_onboarding_complete', '1');
    // }

    if (progress) {
      Object.entries(progress).forEach(([key, value]) => {
        if (typeof value === "object") {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          localStorage.setItem(key, value);
        }
      });
    }

    // Now restore it to localStorage
    localStorage.setItem('currentXP', progress.xp);
    localStorage.setItem('currentLevel', progress.currentLevel);
    localStorage.setItem('progressScore', progress.progressScore || 0);
    localStorage.setItem('streakCount', progress.streak.count);
    localStorage.setItem('streakStartDate', progress.streak.startDate);
    localStorage.setItem('programStartDate', progress.program.startDate);
    localStorage.setItem('activeWorkoutWeek', progress.program.activeWorkoutWeek);
    localStorage.setItem('activeNutritionWeek', progress.program.activeNutritionWeek);
    localStorage.setItem('completedThisWeek', progress.program.completedThisWeek);

    for (let week in progress.program.weeklyStats) {
      const stats = progress.program.weeklyStats[week];
      localStorage.setItem(`${week}_workoutsDone`, stats.workoutsDone);
      localStorage.setItem(`${week}_totalReps`, stats.totalReps);
      localStorage.setItem(`${week}_totalSets`, stats.totalSets);
      localStorage.setItem(`${week}_totalWeight`, stats.totalWeight);
    }

    if (progress.workoutLogs) {
      localStorage.setItem('workoutLogs', JSON.stringify(progress.workoutLogs));
    }
    if (progress.awardedState) {
      localStorage.setItem('awardedState', JSON.stringify(progress.awardedState));
    }
    if (progress.checkboxState) {
      const local = JSON.parse(localStorage.getItem('checkboxState') || '{}');
      const merged = { ...progress.checkboxState, ...local }; // local wins
      localStorage.setItem('checkboxState', JSON.stringify(merged));
    }
    if (progress.workoutStarted) {
      for (let key in progress.workoutStarted) {
        localStorage.setItem(key, progress.workoutStarted[key]);
      }
    }
    if (progress.workoutFinished) {
      for (let key in progress.workoutFinished) {
        localStorage.setItem(key, progress.workoutFinished[key]);
      }
    }
    if (progress.recapShown) {
      localStorage.setItem('currentWorkoutRecapShown', JSON.stringify(progress.recapShown));
    }
    if (progress.upsells && progress.upsells.ctUpsellFirstWorkout) {
      localStorage.setItem('ctUpsell_shown_firstWorkout', 'true');
    }

    console.log('✅ User progress restored from server');
    const { xp, lvl } = normaliseXPandLevel();
    currentXP = xp;
    currentLevel = lvl;

    // 2. Update UI elements
    updateLevelLabel(currentLevel);

    const xpFill = document.getElementById('xpBarFill');
    if (xpFill) {
      const needed = xpNeededForLevel(currentLevel);
      xpFill.style.transition = 'none';
      xpFill.style.width = (Math.min(currentXP / needed, 1) * 100) + '%';
    }

    const stickyFill = document.getElementById('stickyXpBarFill');
    if (stickyFill) {
      const needed = xpNeededForLevel(currentLevel);
      stickyFill.style.transition = 'none';
      stickyFill.style.width = (Math.min(currentXP / needed, 1) * 100) + '%';
    }

    // ─── restore every set-level key we saved earlier ───
    if (progress.setValues) {
      Object.entries(progress.setValues).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
    }
  } catch (err) {
    console.error('❌ Error loading user progress:', err);
  }
}

function extractWorkoutData(currentWeekIndex, currentDayIndex) {
  const weekData = twelveWeekProgram[currentWeekIndex];
  if (!weekData) return null;

  const dayData = weekData.days[currentDayIndex];
  if (!dayData) return null;

  const exercises = [];

  if (dayData.mainWork && Array.isArray(dayData.mainWork)) {
    dayData.mainWork.forEach(block => {
      if (block.exercises && Array.isArray(block.exercises)) {
        block.exercises.forEach((exercise) => {
          const sets = [];
          let setIndex = 1;

          while (true) {
            const repsKey = `${formatExerciseKey(exercise.name)}_week${currentWeekIndex + 1}_day${currentDayIndex + 1}_set${setIndex}_actualReps`;
            const weightKey = `${formatExerciseKey(exercise.name)}_week${currentWeekIndex + 1}_day${currentDayIndex + 1}_set${setIndex}_actualWeight`;

            const reps = localStorage.getItem(repsKey);
            const weight = localStorage.getItem(weightKey);

            if (reps !== null && weight !== null) {
              sets.push({
                reps: Number(reps),
                weight: Number(weight),
              });
              setIndex++;
            } else {
              break; // No more sets found for this exercise
            }
          }

          if (sets.length > 0) {
            exercises.push({
              name: exercise.name,
              sets: sets
            });
          }
        });
      }
    });
  }

  return {
    week: weekData.week,
    day: dayData.dayLabel || `Day ${currentDayIndex + 1}`,
    date: new Date(),
    exercises: exercises,
  };
}

let saveProgressDebounce;
function queueProgressSave() {
  clearTimeout(saveProgressDebounce);
  saveProgressDebounce = setTimeout(() => {
    const payload = buildUserProgress();          // you already have this
    saveMyProgressToServer(payload);              // existing API helper
  }, 1500);   // waits 1½ s – avoids hammering the API
}

// if (localStorage.getItem("hasAWTSubscription") !== "true") {
//   localStorage.setItem("hasAWTSubscription", "true");
// }
// if (localStorage.getItem("hasPOSAddOnForAWT") !== "true") {
//   localStorage.setItem("hasPOSAddOnForAWT", "true");
// }

let purchasedWeeks = 0;                 // will be fetched
const planName = localStorage.getItem('planName') || '';

// helpers
const isProSub = planName === 'Pro Tracker Subscription';
const isTwelve = planName === '12-Week Program';
const isFourWeek = planName === '4-Week Program';
const isOneWeek = planName === '1-Week Program';

/* 1)  Initialise the AWT flag from the plan name alone
      (will be confirmed again after we hit the API)          */
let hasPurchasedAWT = isProSub || isTwelve;

/*  ⬇ Sync legacy localStorage keys so the rest of the site
      can stay untouched                                       */
if (isProSub) {
  localStorage.setItem('hasAWTSubscription', 'true');
  localStorage.removeItem('hasPOSAddOnForAWT');
} else if (isTwelve) {
  localStorage.setItem('hasPOSAddOnForAWT', 'true');
  localStorage.removeItem('hasAWTSubscription');
} else {
  localStorage.removeItem('hasAWTSubscription');
  localStorage.removeItem('hasPOSAddOnForAWT');
}

window.hasPurchasedAWT = hasPurchasedAWT;   // other scripts read this

function getPurchasedWeeks() {
  if (typeof purchasedWeeks === 'number') return purchasedWeeks;
  return Number(localStorage.getItem('purchasedWeeks') || 0);
}

async function fetchPurchasedWeeks() {
  try {
    /* 1) call the back-end — works for subscriptions only ------------- */
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');

    const res = await fetch('/api/access', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());

    const { unlockedWeeks, subscriptionActive } = await res.json();

    /* 2) decide                                                         */
    if (isProSub && subscriptionActive) {
      // real subscription → trust the DB
      purchasedWeeks = unlockedWeeks || 4;        // 4 on first billing cycle
      hasPurchasedAWT = true;
    } else if (isTwelve) {
      purchasedWeeks = 12;
      hasPurchasedAWT = true;
    } else if (isFourWeek) {
      purchasedWeeks = 4;
      hasPurchasedAWT = false;
    } else if (isOneWeek) {
      purchasedWeeks = 1;
      hasPurchasedAWT = false;
    } else {
      purchasedWeeks = 0;
      hasPurchasedAWT = false;
    }
  } catch (err) {
    /* 3) network/auth failed – pure front-end fallback ---------------- */
    if (isTwelve) purchasedWeeks = 12;
    else if (isFourWeek) purchasedWeeks = 4;
    else if (isOneWeek) purchasedWeeks = 1;
    else if (isProSub) purchasedWeeks = 4;
    else purchasedWeeks = 0;

    hasPurchasedAWT = isTwelve || isProSub;
    console.warn('[Access-fetch] Fallback →', purchasedWeeks, 'weeks –', err.message);
  }

  /* 4) persist + tell the rest of the page --------------------------- */
  localStorage.setItem('purchasedWeeks', String(purchasedWeeks));
  window.hasPurchasedAWT = hasPurchasedAWT;

  renderWeekSelector();
  renderDaySelector();
  if (typeof fullyPrecomputeAllWeeks === 'function') fullyPrecomputeAllWeeks();
  if (typeof renderWorkoutDisplay === 'function') renderWorkoutDisplay();
  if (typeof renderDailyMealDisplay === 'function') renderDailyMealDisplay();
}

/* run once on load */
fetchPurchasedWeeks();

/* Fire once on load */
window.addEventListener('DOMContentLoaded', fetchPurchasedWeeks);

(async function bootWorkoutTracker(){

  /* 0 · splash immediately */
  startIdlePulse();

  const token = localStorage.getItem('token');
  if(!token){ location.href = 'log-in.html'; return; }

  try{
    /* 1 · auth-check once */
    const res = await fetch('/api/auth/me', {
      headers:{ Authorization:`Bearer ${token}` }
    });
    if(!res.ok) throw new Error('Invalid token');

    /* 2 · long-running tasks we want to track */
    const tasks = [
      loadUserProgress(),   // your existing fn (already declared)
      fetchPurchasedWeeks() // existing fn
    ];

    /* 2A · animated progress */
    let target = 0, current = 0;
    const bump = () => { target += 1 / tasks.length; };

    (function raf(){
      current += (target - current) * 0.12;
      setLoaderScale(current);
      if(current < 1.01) requestAnimationFrame(raf);
    })();

    await Promise.all(tasks.map(p => p.then(bump, bump)));
    stopIdlePulse();

    /* 3 · now that data is ready, call any render/setup functions
           (if yours live elsewhere, invoke them here) */
    if(typeof renderWeekSelector   === 'function') renderWeekSelector();
    if(typeof renderDaySelector    === 'function') renderDaySelector();
    if(typeof renderWorkoutDisplay === 'function') renderWorkoutDisplay();

    /* 4 · graceful exit */
    setLoaderScale(1.05);
    setTimeout(fadeOutLoader, 180);

  }catch(err){
    console.error('[WT boot]', err);
    localStorage.removeItem('token');
    location.href = 'log-in.html';
  }
})();

let exerciseExpansionState = JSON.parse(localStorage.getItem("exerciseExpansionState") || "{}");
let currentWeekIndex = parseInt(localStorage.getItem("currentWeekIndex") || "0", 10);
let lastFinishButtonType = null;
let performancePopupTimeout = null;
let performancePopupSchedule = null;

function kgToLbs(kg) { return kg * 2.2046226218; }
function lbsToKg(lbs) { return lbs / 2.2046226218; }

// 2) Which unit we’re in
const getPreferredWeightUnit = () => {
  const raw = (localStorage.getItem('weightUnit') || 'kg').trim().toLowerCase();
  return (raw === 'lb' || raw === 'lbs') ? 'lbs' : 'kg';
};

// 3) Parse user input → always return kg
function normaliseUserWeightInput(raw) {
  const n = parseFloat(raw);
  if (isNaN(n)) return 0;
  return getPreferredWeightUnit() === 'lbs'
    ? lbsToKg(n)
    : n;
}

// 4) Format any kg value for display
function formatWeight(kg, dp = 1) {
  return getPreferredWeightUnit() === 'lbs'
    ? `${kgToLbs(kg).toFixed(dp)} lbs`
    : `${kg.toFixed(dp)} kg`;
}

function addTrackerBadge() {
  const badge = document.getElementById("trackerBadge");
  // use your actual AWT flag:
  if (hasPurchasedAWT) {
    badge.className = "pt-extra-container tracker-badge";
    badge.innerHTML = `
      <span class="pt-extra-badge">
        <span class="crown-emoji-badge">👑</span>
        Pro<br>Tracker
      </span>`;
  } else {
    badge.className = "ct-extra-container tracker-badge";
    badge.innerHTML = `
      <span class="ct-extra-badge">
        Core<br>Tracker
      </span>`;
  }
}

function applyAWTSubscriptionNavLock() {
  if (hasPurchasedAWT) return;

  const navNutrition = document.getElementById("nav-nutrition");
  if (!navNutrition) return;

  // ← if we’ve already locked it, bail out
  if (navNutrition.dataset.locked === "true") return;
  navNutrition.dataset.locked = "true";

  // 1️⃣ Change label to locked
  navNutrition.textContent = "🔒My Nutrition";
  // 2️⃣ Remove its href
  navNutrition.removeAttribute("href");
  // 3️⃣ Grey it out
  navNutrition.style.cursor = "default";
  navNutrition.style.opacity = "0.6";
  // 4️⃣ Block stray clicks
  navNutrition.addEventListener("click", e => e.preventDefault());

  // 5️⃣ Insert the Pro-only badge
  const badge = document.createElement("div");
  badge.className = "pt-extra-container";
  badge.innerHTML = `
    <span class="crown-emoji">👑</span>
    <span class="pt-extra">Pro Tracker Only</span>
  `;
  badge.style.margin = "4px 0 0";
  navNutrition.insertAdjacentElement("afterend", badge);
}

document.addEventListener("DOMContentLoaded", applyAWTSubscriptionNavLock);


/***************************************************
 * SHARED ACTIVE WEEK LOGIC
 ***************************************************/

/**
 * Call this function every time the user logs an event—
 * in Nutrition Tracker after logging/swapping a meal,
 * and in Workout Tracker after ticking a set, exercise, or day checkbox.
 */
function updateActiveWeekOnLog() {
  // 1. Set programStartDate if not already set (marks Week 1)
  if (!localStorage.getItem("programStartDate")) {
    let now = new Date();
    setToMidnight(now);
    localStorage.setItem("programStartDate", now.toISOString());
    console.log("Program start date set to:", now.toString());
  }
  // Always use current time (at midnight)
  let now = new Date();
  setToMidnight(now);

  // 2. If we have not yet locked Week 2, do so when we first enter Week 2.
  if (!localStorage.getItem("week2LockedDate")) {
    let weekNumNormal = calculateWeekFromProgramStart(); // based on programStartDate
    if (weekNumNormal >= 2) {
      // Determine what the expected Week 2 start would be
      let programStart = new Date(localStorage.getItem("programStartDate"));
      setToMidnight(programStart);
      let expectedWeek2Start = new Date(programStart);
      expectedWeek2Start.setDate(expectedWeek2Start.getDate() + 7);
      // If the current time is earlier than the expected Week 2 start,
      // lock Week 2 to now (the early log date)
      if (now < expectedWeek2Start) {
        localStorage.setItem("week2LockedDate", now.toISOString());
        console.log("Locked Week 2 start to (early log):", now.toString());
      } else {
        // Otherwise, lock it to the expected date
        localStorage.setItem("week2LockedDate", expectedWeek2Start.toISOString());
        console.log("Locked Week 2 start to expected date:", expectedWeek2Start.toString());
      }
    }
  } else {
    // 3. If Week 2 is already locked and the new log occurs before the locked time,
    // update the locked date to the earlier timestamp.
    let lockedDate = new Date(localStorage.getItem("week2LockedDate"));
    if (now < lockedDate) {
      localStorage.setItem("week2LockedDate", now.toISOString());
      console.log("Updated locked Week 2 start to an earlier time:", now.toString());
    }
  }

  // 4. Determine the active week using our unified logic:
  let activeWeek = calculateActiveWeek();

  // 5. To prevent a future log (one that would push active week ahead) from “resetting” things,
  // if the calculated active week is lower than what we already have stored in activeWeek, ignore it.
  // (For example, if the user logs in a future week that isn’t yet reached by 7‑day increments,
  // do not update—just keep the current active week.)
  let storedNutritionWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
  if (activeWeek < storedNutritionWeek) {
    activeWeek = storedNutritionWeek;
  }

  // 6. Save the active week so both trackers remain in sync.
  localStorage.setItem("activeNutritionWeek", String(activeWeek));
  localStorage.setItem("activeWorkoutWeek", String(activeWeek));

  // 7. For debugging: print the complete 12‑week calendar using the locked Week 2 date.
  print12WeekCalendar();

  console.log("Active week updated to:", activeWeek);
}


/**
 * Calculates the week number from programStartDate.
 * This is used only if Week 2 isn’t locked yet.
 */
function calculateWeekFromProgramStart() {
  const startStr = localStorage.getItem("programStartDate");
  if (!startStr) return 1;
  const startDate = new Date(startStr);
  let now = new Date();
  setToMidnight(now);
  const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  let weekNum = Math.floor(diffDays / 7) + 1;
  if (weekNum < 1) weekNum = 1;
  if (weekNum > 12) weekNum = 12;
  return weekNum;
}

/**
 * Calculates the week number from the locked Week 2 date.
 * Week 2 is locked to the time of the first log in Week 2.
 * Subsequent weeks are calculated as: activeWeek = 2 + floor((now - lockedDate)/7).
 */
function calculateWeekFromLockedDate() {
  const lockedStr = localStorage.getItem("week2LockedDate");
  if (!lockedStr) return calculateWeekFromProgramStart();
  const lockedDate = new Date(lockedStr);
  let now = new Date();
  setToMidnight(now);
  const diffDays = Math.floor((now - lockedDate) / (1000 * 60 * 60 * 24));
  let offset = Math.floor(diffDays / 7);
  let weekNum = 2 + offset;
  if (weekNum < 2) weekNum = 2;
  if (weekNum > 12) weekNum = 12;
  return weekNum;
}

/**
 * Returns the active week number.
 * If Week 2 is locked, uses the locked logic; otherwise, uses the normal calculation.
 */
function calculateActiveWeek() {
  if (localStorage.getItem("week2LockedDate")) {
    return calculateWeekFromLockedDate();
  }
  return calculateWeekFromProgramStart();
}

/**
 * Sets a given Date object to midnight (00:00:00.000).
 */
function setToMidnight(d) {
  d.setHours(0, 0, 0, 0);
}

/**
 * For debugging: prints the full 12‑week schedule based on programStartDate and locked Week 2.
 */
function print12WeekCalendar() {
  let lines = [];
  // Week 1 always begins at programStartDate.
  let progStart = new Date(localStorage.getItem("programStartDate"));
  setToMidnight(progStart);
  lines.push(`Week 1 starts on ${progStart.toLocaleDateString()}`);

  let week2Date;
  if (localStorage.getItem("week2LockedDate")) {
    week2Date = new Date(localStorage.getItem("week2LockedDate"));
  } else {
    week2Date = new Date(progStart);
    week2Date.setDate(week2Date.getDate() + 7);
  }
  setToMidnight(week2Date);
  lines.push(`Week 2 starts on ${week2Date.toLocaleDateString()}`);

  // Weeks 3–12 are based on the locked Week 2 date.
  for (let w = 3; w <= 12; w++) {
    let temp = new Date(week2Date);
    temp.setDate(temp.getDate() + (w - 2) * 7);
    setToMidnight(temp);
    lines.push(`Week ${w} starts on ${temp.toLocaleDateString()}`);
  }
  console.log("12 Week Calendar Dates:\n" + lines.join("\n"));
}

/************************************************/

// Helper to save a single exercise’s “expanded” boolean to localStorage.
function saveExerciseExpansion(key, isExpanded) {
  exerciseExpansionState[key] = isExpanded;
  localStorage.setItem("exerciseExpansionState", JSON.stringify(exerciseExpansionState));
}

// Helper to read an exercise’s expansion.
function getExerciseExpansion(key) {
  // Return true if we’ve previously stored true, else false
  return exerciseExpansionState[key] === true;
}

/************************************************
 * Day-Based LocalStorage Helpers (in FULL)
 ************************************************/
function isWorkoutStarted(weekIndex, dayIndex) {
  return localStorage.getItem(`workoutStarted_w${weekIndex}_d${dayIndex}`) === "true";
}
function setWorkoutStarted(weekIndex, dayIndex, isStarted) {
  localStorage.setItem(`workoutStarted_w${weekIndex}_d${dayIndex}`, isStarted ? "true" : "false");
}

function isWorkoutFinished(weekIndex, dayIndex) {
  return localStorage.getItem(`workoutFinished_w${weekIndex}_d${dayIndex}`) === "true";
}
function setWorkoutFinished(weekIndex, dayIndex, isFinished) {
  localStorage.setItem(
    `workoutFinished_w${weekIndex}_d${dayIndex}`,
    isFinished ? "true" : "false"
  );

  // ⚠️ make sure to call the global one
  window.maybeShowCoreUpsell(weekIndex, dayIndex);
  incrementWorkoutsThisWeek();
  maybeStartStreak();
}

function isRecapShown(weekIndex, dayIndex) {
  return localStorage.getItem(`recapShown_w${weekIndex}_d${dayIndex}`) === "true";
}
function setRecapShown(weekIndex, dayIndex, shown) {
  localStorage.setItem(`recapShown_w${weekIndex}_d${dayIndex}`, shown ? "true" : "false");
}

/***************************************
 * 1) NAVIGATION PAGE REFINEMENTS 
 *    (Based on mealFrequency)
 ***************************************/

let restTimerDelayTimeout = null; // must be global

let mealFrequency = localStorage.getItem("mealFrequency") || 3;

if (parseInt(mealFrequency, 10) === 2) {
  // Custom logic for mealFrequency == 2 (if needed)
} else {
  // Default behavior for mealFrequency == 3
}

/***************************************
 *  AWT POP-UP RANDOM TEXTS
 ***************************************/
const buttonTexts = {
  tooEasy: [
    "Too Easy",
    "Felt Like a Warm-Up", // Capitalized "Up" for consistency
    "Barely Broke a Sweat",
    "Too Light",
    "Lightweight, Baby!",
    "Might as Well Be a Rest Day", // Consistent capitalization
    "Needed More Challenge",
  ],
  justFine: [
    "Just Right",
    "Challenging but Doable",
    "Good Difficulty",
    "Felt Perfect",
    "Well-Balanced Effort",
    "Pushed but in Control",
    "The Sweet Spot", // Consistent capitalization
  ],
  tooHard: [
    "Too Hard",
    "Struggled to Finish",
    "Pushed Beyond Limits",
    "Way Too Intense",
    "Am I Fighting for My Life?", // Capitalized for uniformity
    "You Tryna Kill Me?", // "Tryna" is fine for tone, but capitalized for UI consistency
    "Almost Met My Maker",
  ],
};

/********************************************************************
 * Section 90 - Additional Random Text Arrays
 ********************************************************************/

const feelingGoodResponses = [
  "All good 😊",
  "Feeling great!",
  "Energised and ready 💪",
  "I'm in a good place",
  "Feeling strong today",
  "I’m thriving!",
  "Feeling positive",
  "Ready to smash it",
  "Pretty amazing actually",
  "Can’t complain!"
];

const feelingNeutralResponses = [
  "Just fine",
  "Doing okay",
  "Not bad, not great",
  "Getting through the day",
  "I’m alright",
  "Could be better, could be worse",
  "Holding steady",
  "Meh – somewhere in the middle",
  "Coasting today",
  "Neutral vibes"
];

const feelingLowResponses = [
  "Not great 😞",
  "Struggling a bit",
  "Feeling low today",
  "Physically off",
  "Mentally drained",
  "Not in a good headspace",
  "Could use a break",
  "Worn out",
  "Rough day",
  "Not feeling like myself"
];

// For the final "How was your workout?" question:
const workoutPositiveResponses = [
  "Crushed it 💥",
  "Felt amazing!",
  "One of my best sessions",
  "Strong and focused",
  "That was 🔥",
  "Loved it!",
  "Felt in the zone",
  "Really happy with that",
  "Smashed every set",
  "Pushed myself and it paid off"
];

const workoutOkayResponses = [
  "It was okay",
  "Got it done",
  "Average session",
  "Nothing special, but solid",
  "Not my best, not my worst",
  "Went through the motions",
  "Showed up, did the work",
  "Kept it steady",
  "Mild but productive",
  "Just a regular session"
];

const workoutNegativeResponses = [
  "Tough one 😣",
  "Felt off today",
  "Struggled to focus",
  "Not happy with it",
  "Didn't feel strong",
  "Energy wasn’t there",
  "Had to cut it short",
  "One of those days",
  "Pretty rough session",
  "Felt like a setback"
];

// Helper to pick a random item from an array
function getRandomItem(arr) {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

/********************************************************************
 * Section 90 - State Variables 
 ********************************************************************/

// We also store if the user has *shown* the final recap for this day:
function isRecapShown() {
  return localStorage.getItem("currentWorkoutRecapShown") === "true";
}
function setRecapShown(val) {
  localStorage.setItem("currentWorkoutRecapShown", val ? "true" : "false");
}

function isCardioExercise(ex) {
  // Either detect a 'duration' field OR check if the name is in a known list of cardio exercises.
  // Adjust the list as needed:
  const cardioNames = [
    "Stationary Bike",
    "Rowing Machine",
    "Treadmill",
    "Elliptical",
    "Cycling",
    "Running",
    "Jogging",
    "Skipping"
  ];

  // If the exercise has a 'duration' OR its name is in our known cardio list:
  return ex.duration || cardioNames.includes(ex.name);
}

function getSetStorageKey(exerciseName, weekNum, dayNum, setIndex, field) {
  // field can be "actualWeight" or "suggestedWeight" or "actualReps", etc.
  // e.g., bench_press_week2_day1_set3_actualWeight
  const safeName = exerciseName.toLowerCase().replace(/\s+/g, "_");
  return `${safeName}_week${weekNum}_day${dayNum}_set${setIndex}_${field}`;
}

function loadSetValue(exerciseName, weekNum, dayNum, setIndex, field) {
  const key = getSetStorageKey(exerciseName, weekNum, dayNum, setIndex, field);
  const val = localStorage.getItem(key);
  if (val !== null) return parseFloat(val);
  return null;
}


function saveSetValue(exerciseName, weekNum, dayNum, setIndex, field, numericValue) {
  const key = getSetStorageKey(exerciseName, weekNum, dayNum, setIndex, field);
  localStorage.setItem(key, numericValue.toString());
}

function getDefaultSuggestedWeight(exObj, currentWeekNumber, dayNumber, setIndex) {
  // 1) If there's already a stored suggestedWeight in localStorage, load it
  const prevStored = loadSetValue(exObj.name, currentWeekNumber, dayNumber, setIndex, "suggestedWeight");
  if (prevStored !== null && prevStored !== 0) {
    // Already have a nonzero suggestion => use it
    return prevStored;
  }

  // 2) If that’s missing or zero => forcibly recalc from progressive overload
  //    But first ensure exObj has muscleGroup, typeOfMovement, etc.
  if (!exObj.muscleGroup || exObj.muscleGroup.trim() === "") {
    console.warn(`[getDefaultSuggestedWeight] Missing muscleGroup for "${exObj.name}", using "chest" fallback.`);
    exObj.muscleGroup = "chest"; // fallback
  }
  if (!exObj.typeOfMovement || exObj.typeOfMovement.trim() === "") {
    console.warn(`[getDefaultSuggestedWeight] Missing typeOfMovement for "${exObj.name}", using "compound" fallback.`);
    exObj.typeOfMovement = "compound"; // fallback
  }

  // For “compound” vs “isolation”
  const isIsolation = exObj.typeOfMovement.toLowerCase() !== "compound";

  // Actually call your progressive logic
  let newSuggestion = getProgressiveWeight(exObj, isIsolation, currentWeekNumber);
  if (!newSuggestion || newSuggestion < 0) {
    newSuggestion = 10; // Some minimal fallback, e.g. 10 kg
  }

  saveSetValue(exObj.name, currentWeekNumber, dayNumber, setIndex, "suggestedWeight", newSuggestion);
  return newSuggestion;
}

function cascadeSuggestedWeightForward(ex, currentWeekNumber, dayNumber, fromSetIndex, newSuggested, isManualOverride = false) {
  const totalSets = ex.sets || 1;
  const multiplier = isDeloadWeek(currentWeekNumber) ? 1 : 1; // no extra multiplier in deload week
  console.log(`[cascadeSuggestedWeightForward] ${ex.name} week ${currentWeekNumber}: cascading from set ${fromSetIndex} value ${newSuggested} with multiplier ${multiplier}`);
  for (let s = fromSetIndex + 1; s <= totalSets; s++) {
    saveSetValue(ex.name, currentWeekNumber, dayNumber, s, "suggestedWeight", newSuggested * multiplier);
  }
}

function finalizeLastSetAsBaseline(ex, finalSetTypedWeight, currentWeekNumber, purchasedWeeks, dayNumber) {
  if (!canUseAdaptiveWeights()) return false;
  // Retrieve active workout week from localStorage.
  const activeWorkoutWeek = parseInt(localStorage.getItem("activeWorkoutWeek") || "0", 10);
  console.log(`[finalizeLastSetAsBaseline] Active workout week from storage: ${activeWorkoutWeek}`);

  // Only update the baseline if the override comes from the active workout week or later.
  if (currentWeekNumber < activeWorkoutWeek) {
    console.log(`[finalizeLastSetAsBaseline] ${ex.name}: override in week ${currentWeekNumber} ignored because active workout is in week ${activeWorkoutWeek}.`);
    return false; // Baseline update ignored.
  }

  let progression = JSON.parse(localStorage.getItem("exerciseProgression") || "{}");
  if (!progression[ex.name]) progression[ex.name] = {};

  // Store the finalSetTypedWeight as the new baseline for the current week.
  progression[ex.name][currentWeekNumber] = finalSetTypedWeight;

  // Clear out future weeks so they re-compute.
  for (let w = currentWeekNumber + 1; w <= purchasedWeeks; w++) {
    delete progression[ex.name][w];
  }
  localStorage.setItem("exerciseProgression", JSON.stringify(progression));

  // Recompute all weeks so the new baseline is used.
  fullyPrecomputeAllWeeks();
  clearSameWeekSubsequentDaysSuggestedWeights(ex.name, currentWeekNumber, dayNumber);

  console.log(`[finalizeLastSetAsBaseline] ${ex.name}: final set => ${finalSetTypedWeight} kg (active workout), new baseline applied`);
  return true; // Baseline updated.
}

function isSetsBased(ex) {
  // If there's a numeric sets or reps, treat it as sets-based
  return (ex.sets && ex.sets > 0) || (ex.reps && ex.reps > 0);
}

function loadCheckboxState(key) {
  const state = JSON.parse(localStorage.getItem("checkboxState") || "{}");
  return state[key] === true;
}

function saveCheckboxState(key, value) {
  const state = JSON.parse(localStorage.getItem('checkboxState') || '{}');

  // no-op if nothing changed ↓ (saves a network call)
  if (state[key] === value) return;

  state[key] = value;
  localStorage.setItem('checkboxState', JSON.stringify(state));
  queueProgressSave();
}

function loadXPAwarded(key) {
  const awardedState = JSON.parse(localStorage.getItem("awardedState") || "{}");
  return awardedState[key] === true;
}

function saveXPAwarded(key) {
  const awardedState = JSON.parse(localStorage.getItem("awardedState") || "{}");
  awardedState[key] = true;
  localStorage.setItem("awardedState", JSON.stringify(awardedState));
}

function hasShownAWTForSet(weekIndex, dayIndex, exerciseName, setIndex) {
  return localStorage.getItem(`awtShown_${weekIndex}_${dayIndex}_${exerciseName}_set${setIndex}`) === "true";
}
function setAWTShownForSet(weekIndex, dayIndex, exerciseName, setIndex) {
  localStorage.setItem(`awtShown_${weekIndex}_${dayIndex}_${exerciseName}_set${setIndex}`, "true");
}

/***************************************
 *  ADAPTIVE CONFIG & HELPER FUNCTIONS
 ***************************************/

const MAX_WEIGHT_CAP = 500;

function getProgressiveWeight(ex, isIsolation, currentWeekNumber) {
  const exKey = ex.name; // unique key for this exercise
  let progression = JSON.parse(localStorage.getItem("exerciseProgression") || "{}");
  if (!progression[exKey]) {
    progression[exKey] = {};
  }

  // If already computed for this week, then:
  if (progression[exKey][currentWeekNumber] != null) {
    if (isDeloadWeek(currentWeekNumber)) {
      // Recalculate the display weight using the stored baseline
      const baseline = progression[exKey][currentWeekNumber];
      const deloaded = roundToNearestHalfKg(baseline * 0.85);
      console.log(`[getProgressiveWeight] (Deload week) Using stored baseline for ${exKey} in week ${currentWeekNumber}: baseline=${baseline} => display=${deloaded}`);
      return deloaded;
    } else {
      const rounded = roundToNearestHalfKg(progression[exKey][currentWeekNumber]);
      console.log(`[getProgressiveWeight] Using existing weight for ${exKey} in week ${currentWeekNumber}: ${rounded} kg`);
      return rounded;
    }
  }

  // Base case: week 1 uses the initial weight.
  if (currentWeekNumber === 1) {
    let base = ex.suggestedWeight || ex.weight;
    if (!base || base === 0) {
      const phase = getPhaseFromWeek(1);
      base = getBaselineWeight(ex.muscleGroup, ex.typeOfMovement, userGender, userBodyweight, phase);
    }
    progression[exKey][1] = base;
    localStorage.setItem("exerciseProgression", JSON.stringify(progression));
    console.log(`[getProgressiveWeight] For ${exKey} in week 1, storing base => ${base}`);
    return roundToNearestHalfKg(base);
  }

  // Ensure the previous week is computed.
  if (progression[exKey][currentWeekNumber - 1] == null) {
    getProgressiveWeight(ex, isIsolation, currentWeekNumber - 1);
    progression = JSON.parse(localStorage.getItem("exerciseProgression") || "{}");
  }
  let prevWeekWeight = progression[exKey][currentWeekNumber - 1] || 0;
  console.log(`[getProgressiveWeight] Found previous week's data for ${exKey} in week ${currentWeekNumber - 1}: ${prevWeekWeight}`);

  // --- Deload week logic ---
  if (isDeloadWeek(currentWeekNumber)) {
    // Store the baseline (unreduced) for future weeks...
    progression[exKey][currentWeekNumber] = prevWeekWeight;
    localStorage.setItem("exerciseProgression", JSON.stringify(progression));
    const displayWeight = roundToNearestHalfKg(prevWeekWeight * 0.85);
    console.log(`[getProgressiveWeight] Deload week for ${exKey} in week ${currentWeekNumber}: baseline=${prevWeekWeight}, display=${displayWeight}`);
    return displayWeight;
  }

  // --- Standard progressive overload ---
  const phase = getPhaseFromWeek(currentWeekNumber);
  const ratePct = isIsolation
    ? basePO[phase]["isolation"].ratePct
    : basePO[phase]["compound"].ratePct;
  let finalUnrounded = prevWeekWeight * (1 + ratePct / 100);
  if (finalUnrounded > MAX_WEIGHT_CAP) {
    console.warn(`[getProgressiveWeight] Computed weight ${finalUnrounded} exceeds cap (${MAX_WEIGHT_CAP} kg). Reverting to previous week’s weight.`);
    // Alternatively, you could cap the weight:
    // finalUnrounded = MAX_WEIGHT_CAP;
    // Or simply not update the progression:
    progression[exKey][currentWeekNumber] = prevWeekWeight;
    localStorage.setItem("exerciseProgression", JSON.stringify(progression));
    return roundToNearestHalfKg(prevWeekWeight);
  }
  progression[exKey][currentWeekNumber] = finalUnrounded;
  localStorage.setItem("exerciseProgression", JSON.stringify(progression));
  const finalRounded = roundToNearestHalfKg(finalUnrounded);
  console.log(`[getProgressiveWeight] Final (rounded) for ${exKey}, week ${currentWeekNumber} => ${finalRounded} kg`);
  return finalRounded;
}

// For rounding weights to nearest 0.5 kg
function roundToNearestHalfKg(value) {
  if (getPreferredWeightUnit() === 'lbs') {
    // work in lbs, round to 0.5, convert back to kg
    const lbs = kgToLbs(value);
    const lbsRnd = Math.round(lbs * 2) / 2;
    return lbsToKg(lbsRnd);
  }
  return Math.round(value * 2) / 2;  // 0.5 kg steps
}


// Phase determination
function getPhaseFromWeek(weekNumber) {
  if (weekNumber <= 4) return 1;   // Foundational
  if (weekNumber <= 8) return 2;   // Hypertrophy
  return 3;                        // Strength
}

function isDeloadWeek(weekNumber) {
  return [4, 8, 12].includes(weekNumber);
}

// Baseline multiplier by phase
const phaseMultipliers = {
  1: 0.8,   // Foundational
  2: 1.0,   // Hypertrophy
  3: 1.15,  // Strength
};

// For the initial “calculatedWeight” (before progressive overload).
// This references the muscleGroup + typeOfMovement + user gender + user bodyweight.
function getBaselineWeight(muscleGroup, typeOfMovement, gender, userBodyweight, phase) {
  let percentage = 0;
  // Step 1: Based on muscleGroup & typeOfMovement & gender
  // (use the percentages outlined in your spec)
  switch (muscleGroup.toLowerCase()) {
    case "chest":
      if (typeOfMovement.toLowerCase() === "compound") {
        percentage = (gender === "male") ? 0.40 : 0.30;
      } else {
        percentage = (gender === "male") ? 0.15 : 0.10;
      }
      break;
    case "back":
      if (typeOfMovement.toLowerCase() === "compound") {
        percentage = (gender === "male") ? 0.50 : 0.40;
      } else {
        percentage = (gender === "male") ? 0.20 : 0.15;
      }
      break;
    case "traps":
      if (typeOfMovement.toLowerCase() === "compound") {
        percentage = (gender === "male") ? 0.35 : 0.25;
      } else {
        percentage = (gender === "male") ? 0.15 : 0.10;
      }
      break;
    case "shoulders":
      if (typeOfMovement.toLowerCase() === "compound") {
        percentage = (gender === "male") ? 0.30 : 0.20;
      } else {
        percentage = (gender === "male") ? 0.10 : 0.05;
      }
      break;
    case "quads":
      if (typeOfMovement.toLowerCase() === "compound") {
        percentage = (gender === "male") ? 0.50 : 0.40;
      } else {
        percentage = (gender === "male") ? 0.20 : 0.15;
      }
      break;
    case "hamstrings":
      if (typeOfMovement.toLowerCase() === "compound") {
        percentage = (gender === "male") ? 0.40 : 0.30;
      } else {
        percentage = (gender === "male") ? 0.20 : 0.15;
      }
      break;
    case "biceps":
      // biceps are isolation
      percentage = (gender === "male") ? 0.15 : 0.10;
      break;
    case "triceps":
      // triceps are isolation
      percentage = (gender === "male") ? 0.15 : 0.10;
      break;
    default:
      // fallback if unknown
      percentage = (gender === "male") ? 0.20 : 0.15;
      break;
  }

  // Step 2: Multiply by the phase multiplier
  const multiplier = phaseMultipliers[phase] || 1.0;
  let rawWeight = userBodyweight * percentage * multiplier;

  // Round to nearest 0.5
  return roundToNearestHalfKg(rawWeight);
}

// Progressive Overload default rates
// { phase: { compound: { ratePct, minIncrement, maxIncrement }, isolation: {...} } }
const basePO = {
  1: { // Foundational
    compound: { ratePct: 1.25, minKg: 0.5, maxKg: 1.25 },
    isolation: { ratePct: 1.1, minKg: 0.25, maxKg: 0.5 },
  },
  2: { // Hypertrophy
    compound: { ratePct: 2.5, minKg: 1.25, maxKg: 2.5 },
    isolation: { ratePct: 1.25, minKg: 0.5, maxKg: 1.0 },
  },
  3: { // Strength
    compound: { ratePct: 3.0, minKg: 1.5, maxKg: 3.0 },
    isolation: { ratePct: 1.5, minKg: 0.5, maxKg: 1.5 },
  },
};

// Helper for applying progressive overload % and bounding it by min/max (rounded).
function applyProgressiveOverload(currentWeight, muscleGroup, typeOfMovement, phase) {
  const isCompound = (typeOfMovement.toLowerCase() === "compound");
  const poData = basePO[phase][isCompound ? "compound" : "isolation"];

  const increment = currentWeight * (poData.ratePct / 100);
  let bounded = increment;
  if (bounded < poData.minKg) bounded = poData.minKg;
  if (bounded > poData.maxKg) bounded = poData.maxKg;

  const newWeight = currentWeight + bounded;
  return roundToNearestHalfKg(newWeight);
}

// We also need the *intra-workout* threshold-based changes (like +2%, +3%, etc.)
// This does not replace the standard PO, it’s an immediate increase/decrease if
// the user crushes (or fails) the set mid-workout:
function adjustWeightBasedOnRepPerformance(currentWeight, muscleGroup, typeOfMovement, percentChange) {
  // percentChange might be +2, -3, etc.
  const isCompound = (typeOfMovement.toLowerCase() === "compound");
  let delta = currentWeight * (percentChange / 100);

  // We also have “min” and “max” ranges depending on phase & whether compound or isolation.
  // For example, your instructions said for Foundational & user hits 15+ reps => +2% with min 0.75 kg, max 1.5 kg if compound, etc.
  // You might build a small data structure or pass in the min & max as arguments. 
  // Here, we assume you pass them in or you keep them in a separate object. 
  // For clarity, let's keep it simple:
  // (You’ll see an example of usage below in the actual threshold logic.)
  return roundToNearestHalfKg(currentWeight + delta);
}
// function precomputeProgressiveOverload() {
//   // Ensure weeks are processed in order (assuming twelveWeekProgram is sorted by week)
//   twelveWeekProgram.forEach(weekObj => {
//     const weekNumber = weekObj.week; // e.g., 1, 2, 3...

//     // Loop through each day in the week.
//     weekObj.days.forEach(dayObj => {
//       // Check if the day has sections (warmUp, mainWork, coolDown) or just exercises.
//       if (dayObj.warmUp || dayObj.mainWork || dayObj.coolDown) {
//         if (Array.isArray(dayObj.warmUp)) {
//           dayObj.warmUp.forEach(ex => computePOForExercise(ex, weekNumber));
//         }
//         if (Array.isArray(dayObj.mainWork)) {
//           dayObj.mainWork.forEach(ex => computePOForExercise(ex, weekNumber));
//         }
//         if (Array.isArray(dayObj.coolDown)) {
//           dayObj.coolDown.forEach(ex => computePOForExercise(ex, weekNumber));
//         }
//       } else if (Array.isArray(dayObj.exercises)) {
//         dayObj.exercises.forEach(ex => computePOForExercise(ex, weekNumber));
//       }
//     });
//   });
// }

function computePOForExercise(ex, weekNumber) {
  // Define currentWeekNumber – if weekNumber is provided, use it;
  // otherwise, derive it from the global currentWeekIndex.
  const currentWeekNumber = weekNumber || ((twelveWeekProgram[currentWeekIndex] && twelveWeekProgram[currentWeekIndex].week) || 1);

  // Only run for resistance training exercises (with muscleGroup & typeOfMovement)
  if (ex.muscleGroup && ex.typeOfMovement && isSetsBased(ex)) {
    // 1) Ensure a baseline if ex.weight is missing
    if (!ex.weight) {
      ex.weight = getBaselineWeight(
        ex.muscleGroup,
        ex.typeOfMovement,
        userGender,
        userBodyweight,
        getPhaseFromWeek(currentWeekNumber)
      );
    }
    console.log(`[computePOForExercise] Before processing ${ex.name} in week ${weekNumber}, manualWeightOverrides =`, ex.manualWeightOverrides);

    const hasManualOverrides =
      ex.manualWeightOverrides && Object.keys(ex.manualWeightOverrides).length > 0;

    const isThisWeek = (twelveWeekProgram[currentWeekIndex]
      && twelveWeekProgram[currentWeekIndex].week === currentWeekNumber);

    // Only recalc ex.suggestedWeight if it's NOT the current week 
    // or if there are zero manual overrides for this exercise.
    if (!isThisWeek || !hasManualOverrides) {
      ex.suggestedWeight = getProgressiveWeight(
        ex,
        (ex.typeOfMovement.toLowerCase() !== "compound"),
        currentWeekNumber
      );
    }
  }
}

function fullyPrecomputeAllWeeks() {
  // Load the existing progression
  let progression = JSON.parse(localStorage.getItem("exerciseProgression") || "{}");

  // Retrieve currentWeekIndex from localStorage (defaulting to 0) and determine the active week number
  const currentWeekIndexStored = parseInt(localStorage.getItem("currentWeekIndex") || "0", 10);
  const activeWeek = (twelveWeekProgram[currentWeekIndexStored] && twelveWeekProgram[currentWeekIndexStored].week) || 1;

  // For dynamic updates, clear any stored progression for weeks after the active week.
  for (let exName in progression) {
    for (let weekStr in progression[exName]) {
      const weekNum = parseInt(weekStr, 10);
      if (weekNum > activeWeek) {
        delete progression[exName][weekStr];
      }
    }
  }
  localStorage.setItem("exerciseProgression", JSON.stringify(progression));

  // Create a week map from twelveWeekProgram (keyed by week number)
  const weekMap = {};
  twelveWeekProgram.forEach(w => {
    weekMap[w.week] = w;
  });

  // Loop through weeks 1 to purchasedWeeks and recalc each exercise if not a deload week.
  for (let weekNum = 1; weekNum <= getPurchasedWeeks(); weekNum++) {
    const weekObj = weekMap[weekNum];
    if (!weekObj) continue; // Skip missing weeks

    weekObj.days.forEach(dayObj => {
      // Process each section that might hold exercises
      ["warmUp", "mainWork", "coolDown", "exercises"].forEach(section => {
        if (Array.isArray(dayObj[section])) {
          dayObj[section].forEach(ex => {
            // For all weeks after the active week, always recalc (unless the user manually overrode this week)
            if (!isDeloadWeek(weekNum)) {
              computePOForExercise(ex, weekNum);
            } else {
              // For deload weeks, you might want to recalc the display value (using your existing deload logic)
              // You can call computePOForExercise(ex, weekNum) here as well if desired.
              computePOForExercise(ex, weekNum);
            }
          });
        }
      });
    });
  }
}

function clearFutureSuggestedWeights(exName, currentWeekNumber, purchasedWeeks) {
  const safeName = exName.toLowerCase().replace(/\s+/g, "_");
  // Loop over weeks after the current week
  for (let week = currentWeekNumber + 1; week <= getPurchasedWeeks(); week++) {
    // Iterate over all keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Check if the key belongs to this exercise and is for a week > currentWeekNumber and is a suggested weight
      if (key.startsWith(`${safeName}_week${week}_`) && key.endsWith("_suggestedWeight")) {
        localStorage.removeItem(key);
      }
    }
  }
}

function clearSameWeekSubsequentDaysSuggestedWeights(exName, currentWeekNumber, fromDayNumber) {
  const safeName = exName.toLowerCase().replace(/\s+/g, "_");

  // Loop over each day from (fromDayNumber + 1) to day 7 of the week.
  for (let d = fromDayNumber + 1; d <= 7; d++) {
    // Loop through each set (assuming an upper bound of 10 sets)
    for (let s = 1; s <= 10; s++) {
      const key = `${safeName}_week${currentWeekNumber}_day${d}_set${s}_suggestedWeight`;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`[clearSameWeekSubsequentDaysSuggestedWeights] Removed ${key}`);
      }
    }
  }
}

/***************************************
 * 2) WORKOUT TRACKER CORE 
 ***************************************/

let userName = localStorage.getItem("name") || "User";
let hasVisited = localStorage.getItem("hasVisitedWorkoutTracker") === "true";
// let purchasedWeeks = parseInt(localStorage.getItem("purchasedWeeks") || "12");
let requiredWorkoutsPerWeek = parseInt(localStorage.getItem("requiredWorkoutsPerWeek") || "3");
let userGender = localStorage.getItem("userGender") || "male";
let userBodyweight = parseFloat(localStorage.getItem("userBodyweight") || "70"); // in kg
// let hasPurchasedAWT = false;
// const sub = (localStorage.getItem("hasAWTSubscription") === "true");
// const pos = (localStorage.getItem("hasPOSAddOnForAWT") === "true");
// if (sub || pos) {
//   hasPurchasedAWT = true;
// }

/* ──────────────────────────────────────────────────────────────
 *  SECTION 105 · SMART TRIGGER‑BASED UPSELLS  (Core users only)
 * ────────────────────────────────────────────────────────────── */

/* -------------------------------------------------------------
   0 · Session‑scoped flags & helpers
------------------------------------------------------------- */
// let corePrecisionOverrideCount = 0;
const orig_handleWeightBlur = window.handleWeightBlur;
let coreUpsellShown_precision = false;  // max 1 / workout
let coreUpsellShown_rep = false;  // max 1 / workout
let coreUpsellShown_random = false;  // exactly 1 / workout

const isCoreUser = () => hasPurchasedAWT !== true;

/* resets the above flags whenever a new Day page is opened */
function resetCoreUpsellSessionFlags() {
  corePrecisionOverrideCount = 0;
  coreUpsellShown_precision = false;
  coreUpsellShown_rep = false;
  coreUpsellShown_random = false;

  // Clear persistent “shown” flags so Type 1 (and the others) can fire again
  localStorage.removeItem(_coreKey('precision'));
  localStorage.removeItem(_coreKey('rep'));
  localStorage.removeItem(_coreKey('enc'));
}

window.addEventListener("load", resetCoreUpsellSessionFlags);

/* -------------------------------------------------------------
   1 · Universal pop‑up builder (same styling/animation as others)
------------------------------------------------------------- */
// ──────────────────────────────────────────────────────────────────────
// CORE Up‑sell: message definitions + helpers
// ──────────────────────────────────────────────────────────────────────

// 0 · Are they on Core?

// 1 · Your 6 random encouragement messages (Type 3)
const proEncouragementMessages = [
  {
    title: "That set told us something.",
    subtext:
      "Pro picks up on patterns like this — and updates your targets automatically to keep you progressing."
  },
  {
    title: "We’re already learning from your performance.",
    subtext:
      "With Pro, that data turns into smarter workouts — no second guessing, just seamless progress."
  },
  {
    title: "There’s more happening than you think.",
    subtext:
      "Pro tracks how each set feels — and adjusts weights, reps, and volume to match your pace."
  },
  {
    title: "Progress trends like yours don’t go unnoticed.",
    subtext:
      "Pro adapts in the background — ensuring your training evolves with every set."
  },
  {
    title: "Pro would’ve optimized that for you.",
    subtext:
      "The system already sees what’s happening — now it just needs permission to adapt."
  },
  {
    title: "You’re clearly committed.",
    subtext:
      "Pro learns from every session and evolves with you — no plateaus, just progress."
  },
  {
    title: "Momentum like this deserves more.",
    subtext:
      "Pro keeps the ball rolling — intelligently adjusting your workouts behind the scenes."
  }
];

// 2 · Universal pop‑up builder (reuses .performance-popup styling + animation)
function showCoreUpsellPopup(title, subtext) {
  if (!isCoreUser()) return;
  const old = document.getElementById("coreUpsellPopup");
  if (old) old.remove();

  const wrap = document.createElement("div");
  wrap.id = "coreUpsellPopup";
  wrap.className = "performance-popup";
  wrap.innerHTML = `
    <div class="popup-content-wrap">
      <div class="popup-title">${title}</div>
      <div class="popup-subtext">${subtext}</div>
      <div class="popup-button-container">
        <a href="offer.html" class="upsell-cta">🔓 Unlock Pro Tracker</a>
      </div>
      <div class="popup-button-container">
        <button class="maybe-later" style="opacity:0">Maybe later</button>
      </div>
      <div class="popup-progress-bar">
        <div class="popup-progress-fill" style="width:100%"></div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  // slide‑up
  requestAnimationFrame(() => wrap.classList.add("visible"));
  // fade in maybe‑later & hook close
  setTimeout(() => {
    const ml = wrap.querySelector(".maybe-later");
    if (ml) {
      ml.style.opacity = 1;
      ml.addEventListener(
        "click",
        () => wrap.classList.remove("visible") & setTimeout(() => wrap.remove(), 300),
        { once: true }
      );
    }
  }, 5000);
  // auto‑dismiss bar
  let t = 8,
    bar = wrap.querySelector(".popup-progress-fill");
  const int = setInterval(() => {
    t -= 0.1;
    if (t <= 0) {
      clearInterval(int);
      wrap.classList.remove("visible");
      setTimeout(() => wrap.remove(), 300);
    } else {
      bar.style.width = (t / 8) * 100 + "%";
    }
  }, 100);
}

// localStorage key helper
function _coreKey(type) {
  return `coreUpsell_${type}_shown_w${currentWeekIndex}_d${currentDayIndex}`;
}

// 3 · Type 1: Precision‑based (≥2 weight overrides, sets 2+)
let corePrecisionOverrideCount = 0;
function maybeShowCorePrecisionUpsell() {
  if (corePrecisionOverrideCount < 2) return;

  const key = _coreKey('precision');
  if (sessionStorage.getItem(key)) return;   // now session‐scoped
  sessionStorage.setItem(key, 'true');

  showCoreUpsellPopup(
    "We saw that — Pro would’ve adapted instantly.",
    "You’ve adjusted your weights a few times — Pro learns from your input and updates the rest of your sets and future sessions for you. No manual work, no guesswork."
  );
}

// 4 · Type 2: Rep‑range‑based (outside suggested reps)
function maybeShowCoreRepUpsell(isTooEasy) {
  if (!isCoreUser() || localStorage.getItem(_coreKey("precision"))) return;
  const key = _coreKey("rep");
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "true");
  if (isTooEasy) {
    showCoreUpsellPopup(
      "You’re clearly leveling up. Pro keeps pace.",
      "You went beyond your target — Pro tracks performance trends and adapts over time, so your plan evolves as you do. We’re always two steps ahead."
    );
  } else {
    showCoreUpsellPopup(
      "Struggled this set? Pro adjusts to match.",
      "Fell short of your rep target? Pro tracks your performance and eases back when needed — so you’re always training at the right level."
    );
  }
}

window.hasPurchasedAWT = hasPurchasedAWT;

function maybeShowCoreRandomUpsell() {
  // 1) Bail for Pro/AWT users
  if (window.hasPurchasedAWT) return;

  // 2) Only once per workout
  const key = _coreKey('enc');
  if (localStorage.getItem(key)) return;

  // 3) Fire the upsell
  const pick = proEncouragementMessages[
    Math.floor(Math.random() * proEncouragementMessages.length)
  ];
  showCoreUpsellPopup(pick.title, pick.subtext);
  localStorage.setItem(key, 'true');
}

/* -------------------------------------------------------------
 * END SECTION 105
 * ----------------------------------------------------------- */

const canUseAdaptiveWeights = () => hasPurchasedAWT === true;

// Example: "twelveWeekProgram" data structure as an array of weeks
let twelveWeekProgram = JSON.parse(localStorage.getItem("twelveWeekProgram") || "[]");
if (Array.isArray(twelveWeekProgram)) {
  twelveWeekProgram.forEach(week => {
    week.days.forEach(day => {
      ["exercises", "warmUp", "mainWork", "coolDown"].forEach(section => {
        if (Array.isArray(day[section])) {
          day[section].forEach(ex => {
            if (!ex.manualWeightOverrides) {
              ex.manualWeightOverrides = {};
            }
          });
        }
      });
    });
  });
}
console.log("On reload, twelveWeekProgram =", twelveWeekProgram);

localStorage.setItem("twelveWeekProgram", JSON.stringify(twelveWeekProgram));
// The crucial line: precompute *all* weeks in ascending order:
fullyPrecomputeAllWeeks();

/***************************************
 * 3) HEADING (Welcome vs. Welcome Back)
 ***************************************/

// Helper to determine if today is the user's birthday
function isBirthday() {
  const dobStr = localStorage.getItem("dob"); // e.g. "1999-11-11"
  if (!dobStr) return false;  // if no DOB exists, just return false
  const dobDate = new Date(dobStr);
  const today = new Date();
  // Compare month and day only
  return dobDate.getMonth() === today.getMonth() && dobDate.getDate() === today.getDate();
}

const welcomeHeading = document.getElementById("welcome-heading");
if (isBirthday()) {
  welcomeHeading.textContent = `Happy Birthday, ${userName}!`;
} else if (!hasVisited) {
  welcomeHeading.textContent = `Welcome, ${userName}!`;
  localStorage.setItem("hasVisitedWorkoutTracker", "true");
} else {
  welcomeHeading.textContent = `Welcome back, ${userName}!`;
}

/***************************************
 * 4) STREAK LOGIC & MESSAGING 
 ***************************************/
let streakCount = parseInt(localStorage.getItem("streakCount") || "0");
let streakStartDate = localStorage.getItem("streakStartDate");

const streakMessages = {
  active: [
    (streakCount) => `🔥 You’re on a ${streakCount}-workout streak! Keep this momentum alive!`,
    (streakCount) => `🔥 ${streakCount} ${streakCount === 1 ? 'workout' : 'workouts'} logged—you’re building something great!`,
    (streakCount) => `🔥 Consistency is key! ${streakCount} ${streakCount === 1 ? 'workout' : 'workouts'} in a row and counting!`,
    (streakCount) => `🔥 You’re in the zone! ${streakCount} ${streakCount === 1 ? 'workout' : 'workouts'} completed—keep going strong!`,
    (streakCount) => `🔥 Success is built on habits. ${streakCount} solid ${streakCount === 1 ? 'workout' : 'workouts'} in the books!`
  ],
  atRisk: [
    "⏳ Your streak is at risk! Log a workout today to keep it alive!",
    "⏳ You’re so close to keeping your streak! Just one more workout!",
    "⏳ You’ve been crushing it! Don’t let your streak slip—let’s keep it going!",
    "⏳ One small step today keeps your momentum alive!",
    "⏳ Almost there! Keep your consistency strong with today’s workout."
  ],
  milestone: [
    "🏆 Huge milestone! {streakCount} workouts completed—you’re on fire!",
    "🏆 Huge milestone! {streakCount} workouts in a row!",
    "🏆 Success is built on consistency—{streakCount} workouts done and growing!",
    "🏆 {streakCount} workouts strong! Keep up the incredible effort!",
    "🏆 Your discipline is paying off! {streakCount} streak—what’s next?"
  ],
  firstTime: [
    "🚀 Every great journey starts with one step—let’s begin!",
    "🚀 Ready to kickstart your journey? Your first workout awaits!",
    "🚀 It’s never too late to start fresh—today is Day 1!",
    "🚀 You’ve got this! Let’s make Day 1 count.",
    "🚀 Success starts with one step. Let’s go!"
  ]
};

const workoutStreakResetMessages = [
  "❌ Your workout streak just reset. Let’s bounce back stronger tomorrow!",
  "❌ Missed a session? No big deal. Restart your streak today!",
  "❌ Your streak ended, but your momentum doesn’t have to—let’s keep pushing!",
  "❌ Streak broken. Happens to everyone—what matters is your next move.",
  "❌ One off week won’t define your progress. Let’s build it back up!",
  "❌ You’ve lost your workout streak, but your journey is far from over.",
  "❌ Consistency dipped, but you’re still in the game—reset and go again!",
  "❌ Your streak reset this week. Let’s set the tone with your next session!",
  "❌ It’s a fresh week and a fresh chance—time to start a new streak!",
  "❌ Life happens. Recommit, reset, and let’s make this week count!"
];

function getRandomWorkoutStreakResetMessage() {
  const idx = Math.floor(Math.random() * workoutStreakResetMessages.length);
  return workoutStreakResetMessages[idx];
}

function resetWorkoutStreak() {
  streakCount = 0;
  localStorage.setItem("streakCount", "0");
  localStorage.setItem("workoutStreakReset", "true");

  // Update the DOM element for the streak message.
  const streakMessageEl = document.getElementById("streak-message");
  if (streakMessageEl) {
    streakMessageEl.textContent = getStreakMessage();
  }
}

function checkAndResetWorkoutStreak() {
  // Get the current active week (from localStorage; default to 1 if not set)
  const activeWeek = parseInt(localStorage.getItem("activeWorkoutWeek") || "1", 10);

  // We only check if there’s at least one completed week behind.
  if (activeWeek > 1) {
    // For the previous week (activeWeek - 1):
    const prevWeek = activeWeek - 1;
    const workoutsDone = parseInt(localStorage.getItem("week" + prevWeek + "_workoutsDone") || "0", 10);
    const workoutsAssigned = parseInt(localStorage.getItem("week" + prevWeek + "_workoutsAssigned") || "0", 10);

    console.log("[Streak Check] For week", prevWeek, "- Workouts done:", workoutsDone, "Assigned:", workoutsAssigned);

    if (workoutsDone < workoutsAssigned) {
      // User did not complete all assigned workouts – reset the streak.
      resetWorkoutStreak();
    }
  }
}

function getRandomStreakMessage(type, sc) {
  let arr;
  if (type === "active") {
    arr = streakMessages.active;
  } else if (type === "atRisk") {
    arr = streakMessages.atRisk;
  } else if (type === "milestone") {
    arr = streakMessages.milestone;
  } else if (type === "firstTime") {
    arr = streakMessages.firstTime;
  } else if (type === "reset") {
    arr = workoutStreakResetMessages;
  } else {
    arr = streakMessages.active; // fallback
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  const msg = arr[randomIndex];
  return (typeof msg === "function") ? msg(sc) : msg.replace("{streakCount}", sc);
}

function isUserAtRisk() {
  if (!streakStartDate) return false;
  const now = new Date();
  const start = new Date(streakStartDate);
  const daysDiff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const dayOfWeek = daysDiff % 7;
  let completedThisWeek = parseInt(localStorage.getItem("completedThisWeek") || "0");
  const workoutsNeeded = requiredWorkoutsPerWeek - completedThisWeek;
  const daysLeft = 7 - dayOfWeek;
  return (workoutsNeeded >= daysLeft && workoutsNeeded > 0);
}

function getStreakMessage() {
  const storedStart = localStorage.getItem("streakStartDate");
  if (!storedStart) {
    // Never started a streak.
    return getRandomStreakMessage("firstTime", 0);
  }
  // If the reset flag is set, show a reset message.
  if (localStorage.getItem("workoutStreakReset") === "true") {
    return getRandomStreakMessage("reset", 0);
  }
  // Otherwise, if there is a streak already, check milestones or at-risk.
  const milestoneList = [5, 10, 20, 50];
  if (milestoneList.includes(streakCount)) {
    return getRandomStreakMessage("milestone", streakCount);
  }
  if (isUserAtRisk()) {
    return getRandomStreakMessage("atRisk", streakCount);
  }
  return getRandomStreakMessage("active", streakCount);
}

const streakMessageEl = document.getElementById("streak-message");
streakMessageEl.textContent = getStreakMessage();

/***************************************
 * 5) XP SYSTEM (Dynamic Animation Approach, Slower Fill)
 ***************************************/

let xpRecentlyGained = false;
let stickyHeaderTimerId = null;
let xpAnimationStartTime = 0;
let stickyHeaderForceVisible = false;

// Global state (retrieved on load)
let currentXP = parseInt(localStorage.getItem("currentXP") || "0");
let currentLevel = parseInt(localStorage.getItem("currentLevel") || "0");

// Global flag and variables for animation control.
let xpBarAnimating = false;
let xpBarAnimationFrameId = null;

// This variable tracks the XP currently shown on the progress bar.
let displayedXP = currentXP;

// XP thresholds per level.
const xpLevels = [10, 20, 40, 70, 100, 130, 160, 190, 220, 250];
function xpNeededForLevel(level) {
  if (level < xpLevels.length) return xpLevels[level];
  return 250;
}

// Adjust this value to slow down or speed up the fill animation.
// Lower value means slower interpolation.
const animationSpeed = 0.05; // try 0.05 for a slower fill, 0.2 was faster

/**
 * addXP:
 * - Immediately updates the XP state and localStorage.
 * - Triggers the "+XP" popup.
 * - Starts (or continues) the dynamic animation loop.
 */
function addXP(amount) {
  console.log("addXP called with amount =", amount);
  if (amount <= 0) return;

  // Trigger the "+XP" popup.
  animateXPGain(amount);

  // Update XP immediately.
  const oldXP = currentXP;
  currentXP += amount;
  localStorage.setItem("currentXP", currentXP.toString());
  console.log("XP updated immediately from", oldXP, "to", currentXP);

  xpRecentlyGained = true;

  // Reset any previous timer.
  if (stickyHeaderTimerId) clearTimeout(stickyHeaderTimerId);
  stickyHeaderTimerId = setTimeout(() => {
    xpRecentlyGained = false;
  }, 3000);

  // Immediately check visibility in case the main bar is offscreen.
  checkProgressBarVisibility();

  if (!xpBarAnimating) {
    xpBarAnimating = true;
    xpAnimationStartTime = Date.now();
    xpBarAnimationFrameId = requestAnimationFrame(updateXPBarAnimation);
  }
}

function updateXPBarAnimation() {
  const xpNeeded = xpNeededForLevel(currentLevel);
  const xpBarFill = document.getElementById("xpBarFill");

  // Determine target XP for this level.
  let targetXP = currentXP < xpNeeded ? currentXP : xpNeeded;
  let diff = targetXP - displayedXP;

  if (Math.abs(diff) > 0.01) {
    displayedXP += diff * animationSpeed;
  } else {
    displayedXP = targetXP;
  }

  let percent = (displayedXP / xpNeeded) * 100;
  xpBarFill.style.transition = "none";
  xpBarFill.style.width = percent + "%";

  // Update sticky header's progress bar.
  const stickyXpBarFill = document.getElementById("stickyXpBarFill");
  if (stickyXpBarFill) {
    stickyXpBarFill.style.transition = "none";
    stickyXpBarFill.style.width = percent + "%";
  }

  // Update sticky header visibility every frame.
  checkProgressBarVisibility();

  if (displayedXP >= xpNeeded) {
    cancelAnimationFrame(xpBarAnimationFrameId);
    // Force the sticky header to remain visible.
    stickyHeaderForceVisible = true;

    // Level up immediately:
    currentXP -= xpNeeded;
    localStorage.setItem("currentXP", currentXP.toString());
    currentLevel++;
    localStorage.setItem("currentLevel", currentLevel.toString());
    updateLevelLabel(currentLevel);
    displayedXP = 0;
    snapXPBarToZero();
    xpAnimationStartTime = 0;
    if (currentXP > 0) {
      xpAnimationStartTime = Date.now();
      xpBarAnimationFrameId = requestAnimationFrame(updateXPBarAnimation);
    } else {
      xpBarAnimating = false;
    }

    // After an extra 1000ms, clear the force flag and update header visibility.
    setTimeout(() => {
      stickyHeaderForceVisible = false;
      xpRecentlyGained = false;
      // Let checkProgressBarVisibility update the header (instead of forcing removal here)
      checkProgressBarVisibility();
    }, 3000);
  } else {
    xpBarAnimationFrameId = requestAnimationFrame(updateXPBarAnimation);
  }
}

/**
 * Instantly snap the XP bar to 0% (used after a level-up).
 */
function snapXPBarToZero() {
  const xpBarFill = document.getElementById("xpBarFill");
  xpBarFill.style.transition = "none";
  xpBarFill.style.width = "0%";
  xpBarFill.offsetWidth; // Force reflow.
}

/**
 * Updates the "Lvl X" label.
 */
function updateLevelLabel(lvl) {
  const label = document.getElementById("current-level");
  if (label) {
    label.textContent = `Lvl ${lvl}`;
  }
  // Also update sticky header level
  const stickyLabel = document.getElementById("stickyCurrentLevel");
  if (stickyLabel) {
    stickyLabel.textContent = `Lvl ${lvl}`;
  }
}

/**
 * Simple "+X XP" popup animation.
 */
function animateXPGain(amount) {
  const mainEl = document.getElementById("xp-gain-animation");
  const stickyEl = document.getElementById("sticky-xp-gain-animation");

  // Animate the main XP element immediately.
  if (mainEl) {
    // Clear any existing timeout so the new animation overrides the previous one.
    if (mainEl.timeoutId) {
      clearTimeout(mainEl.timeoutId);
    }
    mainEl.textContent = `+${amount} XP`;
    mainEl.style.opacity = "1";
    mainEl.style.transform = "translateY(-10px)";
    // Hold static for 2 seconds then fade out.
    mainEl.timeoutId = setTimeout(() => {
      mainEl.style.opacity = "0";
      mainEl.style.transform = "translateY(0px)";
    }, 2000);
  }

  // Delay the sticky header's animation by 300ms.
  if (stickyEl) {
    if (stickyEl.timeoutId) {
      clearTimeout(stickyEl.timeoutId);
    }
    setTimeout(() => {
      stickyEl.textContent = `+${amount} XP`;
      stickyEl.style.opacity = "1";
      stickyEl.style.transform = "translateY(-10px)";
      stickyEl.timeoutId = setTimeout(() => {
        stickyEl.style.opacity = "0";
        stickyEl.style.transform = "translateY(0px)";
      }, 2000);
    }, 300);
  }
}

// On page load, update the level label and progress bar.
window.addEventListener("load", () => {
  updateLevelLabel(currentLevel);
  const xpBarFill = document.getElementById("xpBarFill");
  const xpNeeded = xpNeededForLevel(currentLevel);
  const percent = Math.min((currentXP / xpNeeded) * 100, 100);
  xpBarFill.style.transition = "none";
  xpBarFill.style.width = percent + "%";

  // Also update the sticky header's bar:
  const stickyXpBarFill = document.getElementById("stickyXpBarFill");
  if (stickyXpBarFill) {
    stickyXpBarFill.style.transition = "none";
    stickyXpBarFill.style.width = percent + "%";
  }

  // Clear any queued animations if applicable.
  animationQueue = [];

  // >>> NEW: Log the current active workout week for debugging
  const activeWeek = localStorage.getItem("activeWorkoutWeek") || "1";
  console.log("Active Workout Week on page load:", activeWeek);
});


function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

function checkProgressBarVisibility() {
  const mainXPContainer = document.querySelector('.xp-bar-container');
  const stickyHeader = document.getElementById('stickyHeader');
  if (!mainXPContainer || !stickyHeader) return;

  // If the main XP container is in the viewport, hide the sticky header.
  if (isElementInViewport(mainXPContainer)) {
    stickyHeader.classList.remove('visible');
    return;
  }

  // Otherwise, show it only if XP was recently gained or it's forced.
  if (xpRecentlyGained || stickyHeaderForceVisible) {
    stickyHeader.classList.add('visible');
  } else {
    stickyHeader.classList.remove('visible');
  }
}

/***************************************
 * 6) TAB SELECTION
 ***************************************/
const myWorkoutsTab = document.getElementById("myWorkoutsTab");
const myProgressTab = document.getElementById("myProgressTab");
const myWorkoutsSection = document.getElementById("myWorkoutsSection");
const myProgressSection = document.getElementById("myProgressSection");

myWorkoutsTab.addEventListener("click", () => {
  localStorage.setItem("lastSelectedTab", "myWorkouts");
  myWorkoutsTab.classList.add("active");
  myProgressTab.classList.remove("active");
  myWorkoutsSection.classList.add("active");
  myProgressSection.classList.remove("active");
  document.querySelector(".week-selector-frame").style.display = "block";
  document.querySelector(".day-selector-frame").style.display = "block";
});

// ------------------------------------------------
// 2) Info icon pop-up for "Progress Score" explanation
// ------------------------------------------------
const progressInfoIcon = document.getElementById("progressInfoIcon");
const progressInfoPopup = document.getElementById("progressInfoPopup");

if (progressInfoIcon && progressInfoPopup) {
  progressInfoIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    if (progressInfoPopup.classList.contains("show")) {
      progressInfoPopup.classList.remove("show");
    } else {
      progressInfoPopup.classList.add("show");
    }
  });

  // Hide the popup if user clicks anywhere else
  document.addEventListener("click", (e) => {
    if (!progressInfoIcon.contains(e.target) && !progressInfoPopup.contains(e.target)) {
      progressInfoPopup.classList.remove("show");
    }
  });
}

const heatmapInfoIcon = document.getElementById("heatmapInfoIcon");
const heatmapInfoPopup = document.getElementById("heatmapInfoPopup");

if (heatmapInfoIcon && heatmapInfoPopup) {
  heatmapInfoIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    heatmapInfoPopup.classList.add("show");
  });

  document.addEventListener("click", (e) => {
    if (!heatmapInfoIcon.contains(e.target) && !heatmapInfoPopup.contains(e.target)) {
      heatmapInfoPopup.classList.remove("show");
    }
  });
}

// ------------------------------------------------
// 3) Progress Score Calculation
//    Based on: XP + sum of all reps + sum of all weight
//    Then multiplied by streak factor (cap at 1.5).
//    Rounded to nearest whole number.
// ------------------------------------------------

// (A) Master arrays of daily On-Track messages by PS range
const onTrackMessages = [
  {
    range: [0, 0],
    messages: [
      "Your journey starts here. Take the first step!",
      "Every great transformation begins with day one. Let’s go!",
      "The hardest part is starting. You’ve got this!",
      "Every rep, every set, every session counts. Time to begin!",
      "Start strong, stay consistent, and the results will come!",
      "Right now, you’re building the foundation for a stronger you!",
      "A year from now, you’ll wish you started today—so let’s go!",
      "You're at the starting line of something amazing. Let’s get moving!"
    ]
  },
  {
    range: [1, 500],
    messages: [
      "You're off to a strong start! Keep the momentum going!",
      "Consistency beats intensity. One step at a time!",
      "You're building the foundation—stay on track!",
      "Every session is an investment in your future self!",
      "Small wins add up. Keep showing up!",
      "You’ve completed more workouts than 20% of users—solid start!",
      "Your consistency is already putting you ahead of others!",
      "Your first gains are happening—trust the process!"
    ]
  },
  {
    range: [501, 1000],
    messages: [
      "You're ahead of 25% of users! Momentum is building!",
      "You’re getting stronger with every session—keep pushing!",
      "Your dedication is showing. Stay locked in!",
      "You’ve come this far—why stop now?",
      "Progress is happening. Keep stacking those wins!",
      "You’ve logged more training sessions than 30% of users!",
      "Compared to lifters who started when you did, you’re ahead of most!",
      "Your training volume is climbing fast—keep at it!"
    ]
  },
  {
    range: [1001, 2500],
    messages: [
      "You're now in the top 50% of users! Your hard work is paying off!",
      "Strength isn’t just physical—it’s built through discipline!",
      "Top 50% and climbing. Keep the momentum going!",
      "Your consistency is what separates you. Stay the course!",
      "You’ve now trained more than half of all users. Keep pushing!",
      "Your lifts are improving—your body is adapting to the challenge!",
      "Your consistency is putting you ahead of 50% of users at your level!",
      "This is where real results start showing—keep up the grind!"
    ]
  },
  {
    range: [2501, 5000],
    messages: [
      "You’re outperforming 65% of users! Keep raising the bar!",
      "You’re now among the most dedicated. Stay focused!",
      "Your discipline is creating real results. Keep going!",
      "The top tier is within reach—let’s lock in!",
      "Your Progress Score is higher than 70% of users who started at the same time!",
      "You’ve lifted more total weight than 75% of lifters at your experience level!",
      "Your volume and consistency are elite—keep dominating!",
      "Your training logs show serious improvement—don’t slow down now!"
    ]
  },
  {
    range: [5001, 7500],
    messages: [
      "You’re in the top 30%! Your consistency is elite!",
      "Every session is making you stronger. Keep climbing!",
      "You’re proving that effort pays off. Keep dominating!",
      "Your training is next-level. Keep setting the standard!",
      "There’s no stopping you now. The top is near!",
      "Your streak is among the longest of all lifters—relentless!",
      "Your lifts have increased by over 20% since starting—unreal progress!",
      "You’re outworking 80% of users who started with you—powerful progress!"
    ]
  },
  {
    range: [7501, 9999],
    messages: [
      "You’re in the top 15%! That’s elite territory!",
      "Only the most dedicated reach this level—keep leading!",
      "You’re stronger, faster, and more consistent than most. Keep rising!",
      "The best keep pushing—you're one of them!",
      "Your effort is putting you in rare company. Own it!",
      "Your training volume is now among the highest of all users!",
      "You’ve logged more workouts than 90% of users who started with you!",
      "Your lifts are in the top percentile of your category—keep thriving!"
    ]
  },
  {
    range: [10000, Infinity],
    messages: [
      "🔥 Top 10% Achiever! You’re setting the standard!",
      "You’ve reached elite status. Only the best make it here!",
      "You’re among the strongest and most consistent. A true leader!",
      "This isn’t just fitness—it’s mastery. Keep dominating!",
      "Your strength, endurance, and discipline are elite!",
      "Less than 10% of users have hit this milestone—congratulations!",
      "Your consistency rivals top-tier lifters—you're setting the bar!",
      "Your lifts are in the elite category. Keep proving what’s possible!"
    ]
  }
];

// (B) Off-Track messages (same for all PS)
const offTrackMessages = [
  "A small setback isn’t the end—get back into rhythm this week!",
  "Missed last week? No problem! Let’s lock in and crush this one!",
  "Your fitness journey isn’t about perfection—it’s about progress. Keep going!",
  "One tough week won’t define you. Let’s make this one count!",
  "A new week = a fresh start. Time to get back on track!",
  "You’re just one workout away from getting back on track—let’s go!",
  "Refocus, reset, and get moving. Your progress is waiting!",
  "Start with one workout. Build the habit. Success will follow!",
  "Missed a few sessions? No worries—today is a great day to start again!",
  "Your future self will thank you for showing up today!",
  "Your goals haven’t changed, and neither has your ability to reach them!",
  "A strong comeback always starts with one step forward. Let’s get it!",
  "Progress isn’t linear. Keep moving forward, and you’ll get there!",
  "Let’s turn last week’s lesson into this week’s success!",
  "Every champion has tough weeks. The difference? They keep going!"
];

// (C) Master function to recalc and display the user’s PS
function getWorkoutStreakMultiplier() {
  const streakCount = parseInt(localStorage.getItem("streakCount") || "0", 10);
  return Math.min(1 + streakCount * 0.05, 1.5);
}

// (C) Master function to recalc and display the user’s PS
function updateProgressScoreAndMessages() {
  const psValueEl = document.getElementById("progressScoreValue");
  const dailyMsgEl = document.getElementById("progressDailyMessage");
  if (!psValueEl || !dailyMsgEl) return;

  // 1) Recalculate aggregates
  let totalXP = parseInt(localStorage.getItem("currentXP") || "0", 10);
  let totalReps = 0;
  let totalWeight = 0;
  const checkboxState = JSON.parse(localStorage.getItem("checkboxState") || "{}");

  for (let key in checkboxState) {
    if (checkboxState[key] === true &&
      (key.startsWith("set_") || key.startsWith("fallback_") || key.startsWith("cardio_"))) {
      const parts = key.split("_");
      if (parts.length >= 5) {
        const exName = parts.slice(3, parts.length - 1).join("_").toLowerCase();
        const setIndex = parts[parts.length - 1];
        for (let w = 1; w <= purchasedWeeks; w++) {
          for (let d = 1; d <= 7; d++) {
            const repsKey = `${exName}_week${w}_day${d}_set${setIndex}_actualReps`;
            const weightKey = `${exName}_week${w}_day${d}_set${setIndex}_actualWeight`;
            totalReps += parseInt(localStorage.getItem(repsKey) || "0", 10);
            totalWeight += parseInt(localStorage.getItem(weightKey) || "0", 10);
          }
        }
      }
    }
  }

  // 2) Compute diff since last time
  const currentAggregator = totalXP + totalReps + totalWeight;
  let lastAggregator = parseInt(localStorage.getItem("lastAggregator") || "0", 10);
  let newAddition = currentAggregator - lastAggregator;
  if (newAddition < 0) newAddition = 0;

  // ── APPLY STREAK MULTIPLIER ──
  newAddition = Math.round(newAddition * getWorkoutStreakMultiplier());

  // 3) Bump the stored PS by **only** that positive, multiplied diff
  let storedPS = parseInt(localStorage.getItem("progressScore") || "0", 10);
  let finalPS = storedPS + newAddition;
  localStorage.setItem("progressScore", finalPS.toString());

  // 4) Save the new checkpoint so future diffs are always positive
  localStorage.setItem("lastAggregator", currentAggregator.toString());

  // 5) Update the DOM
  psValueEl.textContent = finalPS;

  const isFirstWeek = (parseInt(localStorage.getItem("currentWeekIndex") || "0", 10) === 0);
  const onTrack = isFirstWeek ? true : checkLastWeekOnTrack();
  const dailyMsg = onTrack
    ? getOnTrackMessageForPS(finalPS)
    : getRandomOffTrackMessage();

  dailyMsgEl.textContent = dailyMsg;
  console.log("[PS] Done updating. Final PS =", finalPS);
}

// Helper: check if user met last week's required workouts
function checkLastWeekOnTrack() {
  // Your existing "minimum amount of workouts per week" logic is based on workoutsDays variable.
  // We'll see if they ticked enough day/exercise boxes last week.
  const workoutDaysSetting = parseInt(localStorage.getItem("workoutsDays") || "0", 10);

  // Map the needed # of workouts to the setting
  let needed = 1;
  switch (workoutDaysSetting) {
    case 1: needed = 1; break;
    case 2: needed = 2; break;
    case 3: needed = 2; break;
    case 4: needed = 3; break;
    case 5: needed = 4; break;
    case 6: needed = 5; break;
    case 7: needed = 6; break;
    default: needed = 2; break;
  }

  // Identify "last week index"
  const lastWeekIndex = currentWeekIndex - 1;
  if (lastWeekIndex < 0) {
    // If there's literally no "previous week," treat as on-track (some people do off-track by default, but you requested first week => use the threshold messages).
    return true;
  }

  // Count how many unique days had at least 1 checkbox ticked in the last week
  let daysCompleted = 0;
  const state = JSON.parse(localStorage.getItem("checkboxState") || "{}");
  const dayBoxesPrefix = `day_${lastWeekIndex}_`;
  // For each day in that last week, see if the day checkbox is checked or if any exercise/set checkbox is checked
  // to know if that day was “done.” Simplify: we can just check `day_${lastWeekIndex}_${dayIndex}`
  const theWeekData = twelveWeekProgram[lastWeekIndex];
  if (!theWeekData) return false; // fallback

  theWeekData.days.forEach((dayObj, dIdx) => {
    const dayKey = `day_${lastWeekIndex}_${dIdx}`;
    // If dayKey was checked => user definitely did that day
    if (state[dayKey] === true) {
      daysCompleted++;
    } else {
      // else see if any exercise in that day was checked
      // (but your code usually sets the day checked if ANY set was checked, so the dayKey might suffice)
      // We'll do a fallback approach:
      const exPrefix = `exercise_${lastWeekIndex}_${dIdx}_`;
      const setPrefix = `set_${lastWeekIndex}_${dIdx}_`;
      let foundOne = false;
      for (let k in state) {
        if (k.startsWith(exPrefix) && state[k] === true) {
          foundOne = true;
          break;
        }
        if (k.startsWith(setPrefix) && state[k] === true) {
          foundOne = true;
          break;
        }
      }
      if (foundOne) daysCompleted++;
    }
  });

  return daysCompleted >= needed;
}

// Helper: pick a random On-Track message from the correct range
function getOnTrackMessageForPS(finalPS) {
  // find which range [min, max] includes finalPS
  for (let i = 0; i < onTrackMessages.length; i++) {
    let r = onTrackMessages[i].range;
    if (finalPS >= r[0] && finalPS <= r[1]) {
      let arr = onTrackMessages[i].messages;
      return arr[Math.floor(Math.random() * arr.length)];
    }
    // if r[1] is Infinity, it also works
    if (r[1] === Infinity && finalPS >= r[0]) {
      let arr = onTrackMessages[i].messages;
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }
  // fallback (shouldn’t happen):
  return "Keep it up! Every workout counts.";
}

// Helper: pick random Off-Track message
function getRandomOffTrackMessage() {
  return offTrackMessages[Math.floor(Math.random() * offTrackMessages.length)];
}

/***************************************
 * COLLAPSIBLE STATES SETUP
 ***************************************/
// Load from localStorage once, so it persists across day/week changes
let collapsibleStates = JSON.parse(localStorage.getItem("collapsibleStates") || "{}");
// Default all sections to "expanded" (true) initially, if undefined
if (typeof collapsibleStates.warmUp === "undefined") collapsibleStates.warmUp = true;
if (typeof collapsibleStates.mainWork === "undefined") collapsibleStates.mainWork = true;
if (typeof collapsibleStates.coolDown === "undefined") collapsibleStates.coolDown = true;

/** Save the collapsible state to localStorage whenever it changes. */
function saveCollapsibleStates() {
  localStorage.setItem("collapsibleStates", JSON.stringify(collapsibleStates));
}

/***************************************
 * 7) WEEK SELECTION
 ***************************************/
const weekSelectorEl = document.getElementById("weekSelector");
const totalWeeksToShow = twelveWeekProgram.length;

function renderWeekSelector() {
  weekSelectorEl.innerHTML = "";
  const weekWrapper = document.querySelector(".week-selector-wrapper");

  // always allow scrolling
  weekSelectorEl.style.display = "";
  weekSelectorEl.style.justifyContent = "";
  if (weekWrapper) {
    weekWrapper.style.overflowX = "auto";
  }

  // ensure at least week 1 is always unlocked
  const unlocked = Math.max(1, getPurchasedWeeks());

  for (let i = 0; i < twelveWeekProgram.length; i++) {
    const weekNumber = i + 1;
    const div = document.createElement("div");
    div.classList.add("week-box");

    if (i >= unlocked) {
      // LOCKED
      div.classList.add("locked");
      div.innerHTML = `🔒 Week ${weekNumber}`;
    } else {
      // UNLOCKED
      div.textContent = `Week ${weekNumber}`;
      if (i < currentWeekIndex) div.classList.add("completed");
      if (i === currentWeekIndex) div.classList.add("active");
      div.addEventListener("click", () => {
        currentWeekIndex = i;
        localStorage.setItem("currentWeekIndex", String(i));
        currentDayIndex = 0;
        localStorage.setItem("currentDayIndex", "0");
        fullyPrecomputeAllWeeks();
        updateWeekBoxes();
        renderWorkoutDisplay();
        renderDaySelector();
      });
    }

    weekSelectorEl.appendChild(div);
  }
}

function updateWeekBoxes() {
  const boxes = weekSelectorEl.querySelectorAll(".week-box");
  boxes.forEach((box, index) => {
    box.classList.remove("active");
    if (index === currentWeekIndex) {
      box.classList.add("active");
    }
  });
}

/***************************************
 * 8) DAY SELECTION
 ***************************************/
const daySelectorEl = document.getElementById("daySelector");
let currentDayIndex = parseInt(localStorage.getItem("currentDayIndex") || "0", 10);

function renderDaySelector() {
  daySelectorEl.innerHTML = "";
  const currentWeekData = twelveWeekProgram[currentWeekIndex];
  if (!currentWeekData) return;

  const daysInWeek = currentWeekData.days || [];

  // Get the day selector wrapper element.
  const dayWrapper = document.querySelector(".day-selector-wrapper");

  // If there are 1-3 days, center them and disable horizontal scrolling.
  if (daysInWeek.length <= 3) {
    daySelectorEl.style.display = "flex";
    daySelectorEl.style.justifyContent = "center";
    if (dayWrapper) {
      dayWrapper.style.overflowX = "hidden";
    }
  } else {
    daySelectorEl.style.justifyContent = "";
    daySelectorEl.style.display = "";
    if (dayWrapper) {
      dayWrapper.style.overflowX = "auto";
    }
  }

  for (let i = 0; i < daysInWeek.length; i++) {
    const dayNumber = i + 1;
    const div = document.createElement("div");
    div.classList.add("day-box");
    div.textContent = `Day ${dayNumber}`;

    if (i === currentDayIndex) {
      div.classList.add("active");
    }

    div.addEventListener("click", () => {
      currentDayIndex = i;
      localStorage.setItem("currentDayIndex", currentDayIndex.toString());
      updateDayBoxes();
      renderWorkoutDisplay();
      // fadeLabelsWithGradientFor(".day-selector-wrapper", ".day-box");
      // initializeHorizontalFade(".day-selector-wrapper");
    });

    daySelectorEl.appendChild(div);
  }

  // After populating, update gradient fade on the day boxes
  // fadeLabelsWithGradientFor(".day-selector-wrapper", ".day-box");
}

function updateDayBoxes() {
  const boxes = daySelectorEl.querySelectorAll(".day-box");
  boxes.forEach((box, index) => {
    box.classList.remove("active");
    if (index === currentDayIndex) {
      box.classList.add("active");
    }
  });
}

// Call once on load
renderDaySelector();

/***************************************
 * 9) WORKOUT DISPLAY (Exercises, Sets)
 ***************************************/
const workoutDisplayEl = document.getElementById("workoutDisplay");

/***************************************
 * RENDERING THE WORKOUT & EXERCISES
 ***************************************/

function renderWorkoutDisplay() {
  // 1) Clear & fetch day data as usual
  const workoutDisplayEl = document.getElementById("workoutDisplay");
  workoutDisplayEl.innerHTML = "";
  const currentWeekData = twelveWeekProgram[currentWeekIndex];
  if (!currentWeekData) return;
  const dayData = currentWeekData.days[currentDayIndex];
  if (!dayData) return;


  // Identify which phase (1 = Foundational, 2 = Hypertrophy, 3 = Strength)
  const phase = getPhaseFromWeek(currentWeekData.week);

  // 1) Day Header
  const dayHeader = document.createElement("div");
  dayHeader.classList.add("workout-day-header");

  const title = document.createElement("h3");
  title.classList.add("day-title");
  title.textContent = `Week ${currentWeekData.week} - Day ${currentDayIndex + 1}`;
  dayHeader.appendChild(title);

  // Day-level checkbox
  // const dayCheckbox = document.createElement("input");
  // dayCheckbox.type = "checkbox";
  // dayCheckbox.classList.add("day-checkbox");

  // dayCheckbox.setAttribute("data-checkbox-key", `day_${currentWeekIndex}_${currentDayIndex}`);
  // if (loadCheckboxState(`day_${currentWeekIndex}_${currentDayIndex}`)) {
  //   dayCheckbox.checked = true;
  //   dayCheckbox.setAttribute("data-xp-awarded", "true");
  // }

  // dayCheckbox.addEventListener("change", () => {
  //   const key = dayCheckbox.getAttribute("data-checkbox-key");

  //   if (dayCheckbox.checked) {
  //     // Only award once, even if they uncheck/recheck
  //     if (!loadXPAwarded(key)) {
  //       saveXPAwarded(key);
  //       addXPForDay(dayData);
  //       updateActiveWeekOnLog();
  //     }
  //     saveCheckboxState(key, true);

  //     const allSections = workoutDisplayEl.querySelectorAll(".collapsible-content");
  //     allSections.forEach(section => {
  //       section.style.display = "block";
  //     });

  //     checkAllExercises();
  //     setTimeout(autoCheckDayIfAllExercisesAreChecked, 100);
  //     renderWorkoutDisplay();

  //     if (activeRestTimerExercise) {
  //       cancelRestTimer();
  //       activeRestTimerExercise = null;
  //     }
  //     updateWeeklyTotals();
  //     const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
  //     console.log(
  //       `[Day Checkbox] Updated Workouts Done for Week ${currentWeekNumber}:`,
  //       localStorage.getItem(`week${currentWeekNumber}_workoutsDone`)
  //     );
  //   } else {
  //     saveCheckboxState(key, false);
  //     uncheckAllExercises();
  //     updateWeeklyTotals();
  //     const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
  //     console.log(
  //       `[Day Checkbox] Updated Workouts Done for Week ${currentWeekNumber}:`,
  //       localStorage.getItem(`week${currentWeekNumber}_workoutsDone`)
  //     );
  //   }

  //   setTimeout(updateProgressScoreAndMessages, 0);
  // });

  // dayHeader.appendChild(dayCheckbox);
  workoutDisplayEl.appendChild(dayHeader);

  const startButtonContainer = document.createElement("div");
  startButtonContainer.id = "startButtonContainer";
  workoutDisplayEl.appendChild(startButtonContainer);

  // --- Check if this Day is started or finished ---
  const started = isWorkoutStarted(currentWeekIndex, currentDayIndex);
  const finished = isWorkoutFinished(currentWeekIndex, currentDayIndex);

  // If not started => show "Start"
  if (!started) {
    const startBtn = document.createElement("button");
    startBtn.classList.add("start-workout-btn");
    startBtn.textContent = "Start";
    // Ensure an opacity transition is applied
    startBtn.style.transition = "opacity 0.3s ease";

    startBtn.addEventListener("click", () => {
      // Fade out the button
      startBtn.style.opacity = "0";
      // After the fade-out is complete (300ms), execute the start logic
      setTimeout(() => {
        setWorkoutStarted(currentWeekIndex, currentDayIndex, true);
        showStartWorkoutPopup();

        // Smooth-scroll to Warm-Up
        const warmUpHeader = document.querySelector(".collapsible-header");
        if (warmUpHeader) {
          const headerY = warmUpHeader.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({
            top: headerY,
            behavior: "smooth",
          });
        }
        renderWorkoutDisplay();
      }, 300);
    });
    startButtonContainer.appendChild(startBtn);
  }

  // 2) Collapsible Sections: Warm-Up, Main Work, Cool-Down
  //    (If your data doesn't have these, fallback to dayData.exercises.)
  if (dayData.warmUp || dayData.mainWork || dayData.coolDown) {
    renderCollapsibleSection("Warm-Up", dayData.warmUp, "warmUp");
    renderCollapsibleSection("Main Work", dayData.mainWork, "mainWork");
    renderCollapsibleSection("Cool-Down", dayData.coolDown, "coolDown");

    const finishButtonContainer = document.createElement("div");
    finishButtonContainer.id = "finishButtonContainer";
    workoutDisplayEl.appendChild(finishButtonContainer);

    if (started) {
      let currentButtonType = "";
      if (!finished) {
        currentButtonType = "finish";
        const finishBtn = document.createElement("button");
        finishBtn.classList.add("finish-workout-btn");
        finishBtn.textContent = "Finish";

        // If the same type was shown last time, show immediately.
        if (lastFinishButtonType === currentButtonType) {
          finishBtn.style.opacity = "1";
        } else {
          finishBtn.style.opacity = "0";
          finishBtn.style.transition = "opacity 0.3s ease";
          setTimeout(() => {
            finishBtn.style.opacity = "1";
          }, 10);
        }

        finishBtn.addEventListener("click", async () => {
          cancelRestTimer();

          // — simulate the old day‐checkbox logic —
          const dayKey = `day_${currentWeekIndex}_${currentDayIndex}`;
          if (!loadXPAwarded(dayKey)) {
            saveXPAwarded(dayKey);
            addXPForDay(dayData);
            updateActiveWeekOnLog();
          }
          saveCheckboxState(dayKey, true);

          // checkAllExercises();
          // autoCheckDayIfAllExercisesAreChecked();
          updateWeeklyTotals();

          // — now finish the workout as before —
          showWorkoutRecapPopup(currentWeekIndex, currentDayIndex, "finish");
          setWorkoutFinished(currentWeekIndex, currentDayIndex, true);

          // 🧠 Replace this:
          // const workoutData = extractWorkoutData(currentWeekIndex, currentDayIndex);
          // sendWorkoutLog(workoutData);

          // 🚀 With this:
          await handleWorkoutCompletion(currentWeekIndex, currentDayIndex);
          await saveMyProgressToServer();
        });
        finishButtonContainer.appendChild(finishBtn);
      } else {
        currentButtonType = "summary";
        const summaryBtn = document.createElement("button");
        summaryBtn.classList.add("summary-workout-btn");
        summaryBtn.textContent = "Summary";

        if (lastFinishButtonType === currentButtonType) {
          summaryBtn.style.opacity = "1";
        } else {
          summaryBtn.style.opacity = "0";
          summaryBtn.style.transition = "opacity 0.3s ease";
          setTimeout(() => {
            summaryBtn.style.opacity = "1";
          }, 10);
        }

        summaryBtn.addEventListener("click", () => {
          showWorkoutRecapPopup(currentWeekIndex, currentDayIndex, "summary");
        });
        finishButtonContainer.appendChild(summaryBtn);
      }
      // Save the current type for the next render
      lastFinishButtonType = currentButtonType;
    }
  } else {
    // If your data only has "exercises":
    renderCollapsibleSection("Main Work", dayData.exercises, "mainWork");
  }
}

function renderCollapsibleSection(sectionTitle, exercisesArray, sectionKey) {
  if (!exercisesArray || !Array.isArray(exercisesArray) || exercisesArray.length === 0) {
    return; // No items in this section, skip
  }

  const sectionContainer = document.createElement("div");
  sectionContainer.classList.add("collapsible-section");

  // Collapsible header
  const header = document.createElement("div");
  header.classList.add("collapsible-header");

  // ">" for collapsed, "v" for expanded
  const arrow = document.createElement("span");
  arrow.classList.add("collapsible-arrow");
  arrow.textContent = collapsibleStates[sectionKey] ? "v" : ">";

  const titleSpan = document.createElement("span");
  titleSpan.textContent = sectionTitle;

  header.appendChild(arrow);
  header.appendChild(titleSpan);

  // Collapsible content container
  const content = document.createElement("div");
  content.classList.add("collapsible-content");
  content.style.display = collapsibleStates[sectionKey] ? "block" : "none";

  // Toggle on header click
  header.addEventListener("click", () => {
    collapsibleStates[sectionKey] = !collapsibleStates[sectionKey];
    arrow.textContent = collapsibleStates[sectionKey] ? "v" : ">";
    content.style.display = collapsibleStates[sectionKey] ? "block" : "none";
    saveCollapsibleStates();
  });

  // Render each exercise
  exercisesArray.forEach((item) => {
    if (item.exercises && Array.isArray(item.exercises)) {
      item.exercises.forEach((ex) => {
        renderExercise(ex, content, sectionKey);
      });
    } else {
      renderExercise(item, content, sectionKey);
    }
  });

  sectionContainer.appendChild(header);
  sectionContainer.appendChild(content);
  workoutDisplayEl.appendChild(sectionContainer);
}

function renderExercise(ex, parentEl, sectionKey) {
  const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
  const dayNumber = currentDayIndex + 1;

  // include sectionKey so warmUp vs mainWork stay separate
  const expansionKey = `expand_${sectionKey}_${currentWeekIndex}_${currentDayIndex}_${ex.name}`;

  // Helper: Is this exercise cardio?
  function isCardio(exercise) {
    const cardioNames = [
      "Stationary Bike",
      "Rowing Machine",
      "Treadmill",
      "Elliptical",
      "Cycling",
      "Running",
      "Skipping"
    ];
    return (
      cardioNames.includes(exercise.name) ||
      exercise.duration ||
      exercise.allocatedMinutes
    );
  }

  // Helper: Is this exercise sets-based?
  function isSetsBased(exercise) {
    return (exercise.sets && exercise.sets > 0) || (exercise.reps && exercise.reps > 0);
  }

  // Create the main "exercise-row"
  const exerciseRow = document.createElement("div");
  exerciseRow.classList.add("exercise-row");

  // Unique identifier for the exercise (used for checkbox states, etc.), namespaced by sectionKey
  const exerciseKey = `exercise_${sectionKey}_${currentWeekIndex}_${currentDayIndex}_${ex.name}`;
  exerciseRow.setAttribute("data-checkbox-key", exerciseKey);
  exerciseRow.setAttribute("data-exercise-key", exerciseKey);

  // Info / label
  const exerciseInfo = document.createElement("div");
  exerciseInfo.classList.add("exercise-info");
  const nameSpan = document.createElement("span");
  nameSpan.classList.add("exercise-label");
  nameSpan.textContent = ex.name || "Unnamed Exercise";
  exerciseInfo.appendChild(nameSpan);

  // Exercise-level checkbox
  const exerciseCheckbox = document.createElement("input");
  exerciseCheckbox.type = "checkbox";
  exerciseCheckbox.classList.add("exercise-checkbox");
  exerciseCheckbox.setAttribute("data-checkbox-key", exerciseKey);
  if (loadCheckboxState(exerciseKey)) {
    exerciseCheckbox.checked = true;
    exerciseCheckbox.setAttribute("data-xp-awarded", "true");
  }
  exerciseCheckbox.addEventListener("change", () => {
    const key = exerciseCheckbox.getAttribute("data-checkbox-key");
    if (exerciseCheckbox.checked) {
      if (!loadXPAwarded(key)) {
        saveXPAwarded(key);
        addXPForExercise(ex);
        updateActiveWeekOnLog();
        updateProgressScoreAndMessages();
      }
      saveCheckboxState(key, true);
      checkAllSetsForExercise(details);
      if (ex.rest && !activeRestTimerExercise) {
        startRestTimerWithDelay(ex);
      }
    } else {
      saveCheckboxState(key, false);
      uncheckAllSetsForExercise(details);
      if (activeRestTimerExercise && activeRestTimerExercise === ex.name) {
        cancelRestTimer();
        activeRestTimerExercise = null;
      }
    }
  });

  // The hidden area (details) where sets are rendered
  const details = document.createElement("div");
  details.classList.add("exercise-details");

  // Expand/collapse arrow
  const arrow = document.createElement("div");
  arrow.classList.add("exercise-arrow"); // We'll add either "expanded" or "collapsed" based on saved state
  // Restore expansion state using our helper:
  const wasExpanded = getExerciseExpansion(expansionKey);
  // If we have no stored entry for this key, or it's explicitly true:
  if (wasExpanded) {
    arrow.classList.add("expanded");
    arrow.textContent = "v";
    details.classList.add("expanded");
  } else {
    arrow.classList.add("collapsed");
    arrow.textContent = ">";
  }

  const setContainer = document.createElement("div");
  setContainer.classList.add("set-container");
  details.appendChild(setContainer);

  // Attach arrow click event to toggle expansion/collapse
  arrow.addEventListener("click", () => {
    const currentlyExpanded = arrow.classList.contains("expanded");
    const newExpanded = !currentlyExpanded;
    if (newExpanded) {
      arrow.classList.remove("collapsed");
      arrow.classList.add("expanded");
      arrow.textContent = "v";
      details.classList.add("expanded");
    } else {
      arrow.classList.remove("expanded");
      arrow.classList.add("collapsed");
      arrow.textContent = ">";
      details.classList.remove("expanded");
    }
    // Save the new expansion state so it persists across re-renders
    saveExerciseExpansion(expansionKey, newExpanded);
  });

  // Expand/collapse on row click (if not clicking an input, button, or the arrow itself)
  exerciseRow.addEventListener("click", (evt) => {
    if (
      evt.target.tagName.toLowerCase() === 'input' ||
      evt.target.closest('button') ||
      evt.target === arrow
    ) {
      return;
    }
    arrow.click();
  });

  // Append arrow, info, and checkbox to the exercise row
  exerciseRow.appendChild(arrow);
  exerciseRow.appendChild(exerciseInfo);
  exerciseRow.appendChild(exerciseCheckbox);

  // ============ RENDER SETS or DURATION =============
  if (isCardio(ex)) {
    // Cardio: show duration input
    // Cardio: show duration input
    const durationRow = document.createElement("div");
    durationRow.classList.add("set-row", "bordered-row", "duration-row");

    const durationLabel = document.createElement("div");
    durationLabel.classList.add("duration-label");
    durationLabel.textContent = "Time";
    durationRow.appendChild(durationLabel);

    const durationInput = document.createElement("input");
    durationInput.type = "text";
    durationInput.classList.add("input-field", "duration-input");
    // If mainWork has allocatedMinutes, otherwise fallback
    durationInput.placeholder = (sectionKey === "mainWork")
      ? (ex.allocatedMinutes ? ex.allocatedMinutes + " minutes" : "e.g. 5 minutes")
      : (ex.duration || "e.g. 5 minutes");
    durationRow.appendChild(durationInput);

    // Cardio set checkbox
    const setCheckbox = document.createElement("input");
    setCheckbox.type = "checkbox";
    setCheckbox.classList.add("set-checkbox", "duration-checkbox");
    // include sectionKey so warm-up and main-work don't share the same key
    // … after you’ve created durationRow, durationInput and setCheckbox …

    // 1) give each cardio checkbox its own key, scoped by sectionKey
    const setKey = `cardio_${sectionKey}_${currentWeekIndex}_${currentDayIndex}_${ex.name}`;
    setCheckbox.setAttribute("data-checkbox-key", setKey);

    // 2) initialize from storage
    if (loadCheckboxState(setKey)) {
      setCheckbox.checked = true;
      setCheckbox.setAttribute("data-xp-awarded", "true");
    }

    // 3) wire up change handler
    setCheckbox.addEventListener("change", () => {
      // only care when it becomes checked
      if (!setCheckbox.checked) {
        saveCheckboxState(setKey, false);
        durationInput.readOnly = false;
        renderWorkoutDisplay();
        // autoCheckDayIfAllExercisesAreChecked();
        updateActiveWeekOnLog();
        return;
      }

      // debug: verify you’re using the new key
      console.log(`[Cardio] checkbox key: ${setKey}`);

      // award XP once
      if (!loadXPAwarded(setKey)) {
        saveXPAwarded(setKey);
        addXP(3);
        maybeStartStreak();
      }

      // persist the check
      saveCheckboxState(setKey, true);

      // auto-tick the exercise if all sets are done
      autoCheckExerciseIfAllSets(exerciseCheckbox, details);

      // start rest timer if needed
      if (ex.rest && !activeRestTimerExercise) {
        startRestTimerWithDelay(ex);
      }

      // lock the duration input and solidify its value
      durationInput.readOnly = true;
      if (!durationInput.value.trim()) {
        let ph = durationInput.placeholder.trim();
        let unit = ph.match(/seconds?/i) ? " seconds" : " minutes";
        let num = parseInt(ph, 10);
        if (!isNaN(num)) {
          durationInput.value = num + unit;
          saveSetValue(ex.name, currentWeekNumber, dayNumber, 1, "actualDuration", num);
          console.log(`[Cardio] Duration solidified to ${num}${unit}`);
        }
      }

      // re-render and bubble up
      renderWorkoutDisplay();
      // autoCheckDayIfAllExercisesAreChecked();
      updateActiveWeekOnLog();
    });

    // 4) finally append your checkbox back into the row
    durationRow.appendChild(setCheckbox);
    setContainer.appendChild(durationRow);


  } else if (isSetsBased(ex)) {
    const totalSets = ex.sets || 1;
    for (let s = 1; s <= totalSets; s++) {
      const setRow = document.createElement("div");
      setRow.classList.add("set-row", "bordered-row");
      setRow.setAttribute("data-set-index", s);

      const skippedKey = `set_${currentWeekIndex}_${currentDayIndex}_${ex.name}_${s}_skipped`;
      const isSkipped = (localStorage.getItem(skippedKey) === "true");

      if (isSkipped) {
        // Create just ONE element for the skipped message
        const skippedCell = document.createElement("div");
        skippedCell.classList.add("skipped-set-message");

        // If your set-row is a grid with 4 columns, let this cell span all columns:
        skippedCell.style.gridColumn = "1 / span 4";

        skippedCell.textContent = "This set was skipped after changing exercises.";
        setRow.appendChild(skippedCell);

        // Then append the row to the container and skip the rest
        setContainer.appendChild(setRow);
        continue;
      }

      // "Set X" label
      const setLabel = document.createElement("div");
      setLabel.classList.add("set-label");
      setLabel.textContent = `Set ${s}`;
      setRow.appendChild(setLabel);

      // Directly create Reps Input (removed the changed-message block)
      const repsInput = document.createElement("input");
      repsInput.type = "number";
      repsInput.classList.add("input-field");

      // Load typed reps if any
      const storedActualReps = loadSetValue(ex.name, currentWeekNumber, dayNumber, s, "actualReps");
      if (storedActualReps !== null) {
        repsInput.value = storedActualReps;
      } else {
        // fallback to ex.reps or just blank
        repsInput.placeholder = ex.reps ? `${ex.reps} reps` : "reps";
      }

      // On blur => save typed reps
      repsInput.addEventListener("blur", () => {
        const val = parseInt(repsInput.value, 10);
        if (!isNaN(val)) {
          saveSetValue(ex.name, currentWeekNumber, dayNumber, s, "actualReps", val);
        }
      });
      setRow.appendChild(repsInput);

      // Weight Input (skip if warmUp)
      let weightInput = null;
      if (sectionKey !== "warmUp") {
        // create the input element
        weightInput = document.createElement("input");
        weightInput.classList.add("input-field");

        if (ex.isBodyweight) {
          // bodyweight exercises get a readonly “Bodyweight” field
          weightInput.type = "text";
          weightInput.readOnly = true;
          weightInput.placeholder = "Bodyweight";
        } else {
          // normal weighted movement
          weightInput.type = "number";

          // 1) Load any user override (always stored in kg)
          const storedActualW = loadSetValue(ex.name, currentWeekNumber, dayNumber, s, "actualWeight");
          if (storedActualW != null && storedActualW !== 0) {
            const displayVal = getPreferredWeightUnit() === "lbs"
              ? kgToLbs(storedActualW).toFixed(1)
              : storedActualW.toFixed(1);
            weightInput.value = displayVal;
          } else {
            // 2) Else show suggested placeholder in user’s unit
            let suggested = loadSetValue(ex.name, currentWeekNumber, dayNumber, s, "suggestedWeight");
            if (suggested == null || suggested === 0) {
              suggested = getDefaultSuggestedWeight(ex, currentWeekNumber, dayNumber, s);
            }
            weightInput.placeholder = formatWeight(suggested);
          }

          const MAX_WEIGHT_CAP = 500;

          // ─── weight → kg helper ──────────────────────
          function toKg(num) {
            return getPreferredWeightUnit() === 'lbs'
              ? lbsToKg(num)
              : num;
          }


          // On blur: if the user types a new weight…
          weightInput.addEventListener("blur", () => {
            const raw = parseFloat(weightInput.value || weightInput.placeholder.replace(/[^\d.]/g, ""));
            const userW = isNaN(raw) ? NaN : toKg(raw);  // use your global toKg()
            if (!isNaN(userW) && userW > MAX_WEIGHT_CAP) {
              showCapPopup("weight");
              weightInput.value = "";
              return;
            }
            if (!hasPurchasedAWT) {
              // find which set this is:
              const setIdx = parseInt(
                weightInput.closest(".set-row")?.dataset?.setIndex || "1",
                10
              );
              if (setIdx >= 2) {
                maybeShowCorePrecisionUpsell();
              }
            }
            if (!isNaN(userW) && userW > 0) {
              // Save the user-typed weight as the actual weight for this set.
              saveSetValue(ex.name, currentWeekNumber, dayNumber, s, "actualWeight", userW);
              if (!canUseAdaptiveWeights()) {
                // Core‑Tracker: stop here.  Nothing else changes.
                refreshSetPlaceholdersForExercise(ex);
                return;
              }
              console.log(`[ManualOverride] Set #${s} for "${ex.name}" changed to ${formatWeight(userW)}`);

              // Retrieve the active workout week from localStorage.
              let activeWorkoutWeek = parseInt(localStorage.getItem("activeWorkoutWeek") || "0", 10);
              // If currentWeekNumber is less than the active workout week, ignore this override.
              if (currentWeekNumber < activeWorkoutWeek) {
                console.log(`[ManualOverride] Override in week ${currentWeekNumber} ignored because active workout is in week ${activeWorkoutWeek}`);
                return;
              }

              // If not the final set, cascade the override to subsequent sets.
              if (s < totalSets) {
                cascadeSuggestedWeightForward(ex, currentWeekNumber, dayNumber, s, userW, true);
                // If the final set's suggested weight now equals the user override, update the baseline.
                const finalSetVal = loadSetValue(ex.name, currentWeekNumber, dayNumber, totalSets, "suggestedWeight");
                if (finalSetVal === userW) {
                  const updated = finalizeLastSetAsBaseline(ex, userW, currentWeekNumber, purchasedWeeks, dayNumber);
                  if (updated) {
                    console.log(`[finalizeLastSetAsBaseline] ${ex.name}: cascade override – new baseline => ${userW} kg`);
                  } else {
                    console.log(`[finalizeLastSetAsBaseline] ${ex.name}: cascade override ignored (inactive workout)`);
                  }
                }
              } else if (s === totalSets) {
                // For the final set in the workout, update the baseline directly.
                const updated = finalizeLastSetAsBaseline(ex, userW, currentWeekNumber, purchasedWeeks, dayNumber);
                if (updated) {
                  console.log(`[finalizeLastSetAsBaseline] ${ex.name}: final set => ${userW} kg => new baseline`);
                } else {
                  console.log(`[finalizeLastSetAsBaseline] ${ex.name}: final set override ignored (inactive workout)`);
                }
              }

              // Clear out future suggested weights so they will recalc dynamically.
              clearFutureSuggestedWeights(ex.name, currentWeekNumber, purchasedWeeks);
              // Refresh the UI placeholders so that the new suggested weight appears.
              refreshSetPlaceholdersForExercise(ex);
            }
          });
        }

        setRow.appendChild(weightInput);
      } else {
        // warmUp => no weight input
        const emptyDiv = document.createElement("div");
        setRow.appendChild(emptyDiv);
      }

      // Set-level checkbox
      const setKey = `set_${currentWeekIndex}_${currentDayIndex}_${ex.name}_${s}`;
      const setCheckbox = document.createElement("input");
      setCheckbox.type = "checkbox";
      setCheckbox.classList.add("set-checkbox");
      setCheckbox.setAttribute("data-checkbox-key", setKey);
      if (loadCheckboxState(setKey)) {
        setCheckbox.checked = true;
      }
      setCheckbox.addEventListener("change", () => {
        if (setCheckbox.checked) {
          // only for mainWork, after set 2
          if (!hasPurchasedAWT && sectionKey === "mainWork" && s >= 3) {
            const dayData = twelveWeekProgram[currentWeekIndex].days[currentDayIndex];

            // is this *exactly* the first exercise in mainWork?
            const isFirstExercise =
              Array.isArray(dayData.mainWork) &&
              dayData.mainWork.length &&
              dayData.mainWork[0]?.name === ex.name;

            if (!isFirstExercise) {
              maybeShowCoreRandomUpsell();   // second exercise (or later) → show
            }
          }
          // Get the user-entered rep value (if any) and weight value (if applicable)
          let repVal = NaN;
          if (repsInput.value.trim() !== "") {
            repVal = parseInt(repsInput.value, 10);
          } else if (repsInput.placeholder) {
            const ph = repsInput.placeholder.trim();
            if (ph.includes('-')) {
              // “12-15 reps” → take the lower bound → 12
              repVal = parseInt(ph.split('-')[0], 10);
            } else {
              repVal = parseInt(ph.replace(/[^\d.]/g, ""), 10);
            }
          }

          // Read weight and convert to KG no matter user’s unit
          let weightVal = null;
          if (weightInput && weightInput.type === "number") {
            // try the typed value first
            const rawString = weightInput.value.trim() !== ""
              ? weightInput.value
              : weightInput.placeholder;
            // pull out any digits / dots
            const num = parseFloat(rawString.replace(/[^\d.]/g, ""));
            if (!isNaN(num)) {
              // now convert if they’re in lbs
              if (getPreferredWeightUnit() === "lbs") {
                weightVal = lbsToKg(num);
              } else {
                weightVal = num;
              }
            }
          }

          // Cap checks — abort + popup if out of bounds
          const repOver = !isNaN(repVal) && repVal > 50;
          const weightOver = weightVal !== null && !isNaN(weightVal) && weightVal > 500;

          if (repOver && weightOver) {
            showCapPopup("both");
            setCheckbox.checked = false;
            return;
          } else if (repOver) {
            showCapPopup("rep");
            setCheckbox.checked = false;
            return;
          } else if (weightOver) {
            showCapPopup("weight");
            setCheckbox.checked = false;
            return;
          }
        }

        // Continue with the normal flow if the values are within the caps.
        const key = setKey;

        if (setCheckbox.checked) {
          console.log(`[Checkbox] Set checkbox for "${ex.name}", set #${s} was just checked.`);

          // (1) Save the checkbox state immediately so it remains checked.
          if (!loadCheckboxState(key)) {
            console.log(`[Checkbox] Saving checkbox state in localStorage => ${key}: true`);
            saveCheckboxState(key, true);
          }

          // (2) Update activeWorkoutWeek if needed.
          let storedActiveWeek = parseInt(localStorage.getItem("activeWorkoutWeek") || "0", 10);
          if (currentWeekNumber > storedActiveWeek) {
            localStorage.setItem("activeWorkoutWeek", currentWeekNumber.toString());
            console.log(`[Checkbox] Updated activeWorkoutWeek to ${currentWeekNumber}`);
          }

          // Force the reps input to lose focus so its value is current.
          repsInput.blur();

          // 2) grab whatever they typed (might be NaN)
          let repValNew = parseInt(repsInput.value, 10);

          // 3) figure out your suggested range *first*
          const defaultSuggestedReps = ex.suggestedReps || ex.reps || "12-15";

          // 4) if they left it blank, treat it as the *lower* bound
          if (isNaN(repValNew)) {
            const range = parseSuggestedReps(defaultSuggestedReps);
            if (range) repValNew = range.min;
          }

          // 5) now save/solidify that value
          saveSetValue(ex.name, currentWeekNumber, dayNumber, s, "actualReps", repValNew);
          repsInput.value = repValNew;
          console.log("[Checkbox] repVal:", repValNew, "defaultSuggestedReps:", defaultSuggestedReps);

          let phase = getPhaseFromWeek(currentWeekNumber);
          console.log("[Checkbox] Current phase:", phase);

          // Determine the weight value used for the set.
          let actualWKg = NaN;
          let weightValNew = 0;
          if (weightInput) {
            const unit = getPreferredWeightUnit();       // "kg" or "lbs"
            const typed = weightInput.value.trim();

            // 1) figure out the “raw” number they gave us, in their unit
            let rawVal;
            if (typed !== "") {
              rawVal = parseFloat(typed);
            } else {
              // fall back to stripping out digits from the placeholder
              rawVal = parseFloat(weightInput.placeholder.replace(/[^\d.]/g, ""));
            }

            // 2) normalize it into kilograms for all of our internal logic
            const actualWKg = unit === "lbs"
              ? toKg(rawVal)
              : rawVal;

            // 3) only accept sane positive numbers
            if (!isNaN(actualWKg) && actualWKg > 0) {
              weightValNew = actualWKg;
              console.log(
                `[Checkbox] Normalized actualWeight=${actualWKg.toFixed(2)} kg` +
                ` (from ${rawVal} ${unit})`
              );

              // 4) save it in kg
              saveSetValue(
                ex.name,
                currentWeekNumber,
                dayNumber,
                s,
                "actualWeight",
                actualWKg
              );
              const awKey = getSetStorageKey(
                ex.name,
                currentWeekNumber,
                dayNumber,
                s,
                "actualWeight"
              );
              console.log(`Saved: ${awKey} = ${localStorage.getItem(awKey)}`);
              const displayUnit = getPreferredWeightUnit();
              const displayNumber = displayUnit === "lbs"
                ? kgToLbs(actualWKg).toFixed(1)
                : actualWKg.toFixed(1);
              weightInput.value = `${displayNumber} ${displayUnit}`;
            } else {
              // if something’s invalid, fall back to zero
              weightValNew = 0;
            }
          }

          // ── now you can safely call your intra‑workout logic ──
          handleIntraWorkoutRepLogic(
            ex,
            repValNew,
            s,
            defaultSuggestedReps,
            weightValNew,
            exerciseCheckbox,
            details
          );

          // If no reps value is entered, auto-solidify the reps value from suggested range.
          if (!repsInput.value || repsInput.value.trim() === "") {
            let range = parseSuggestedReps(defaultSuggestedReps);
            if (range) {
              repsInput.value = range.min;
              saveSetValue(ex.name, currentWeekNumber, dayNumber, s, "actualReps", range.min);
              console.log(`[Checkbox] Automatically solidified reps for set #${s} to ${range.min}`);
              const arKey = getSetStorageKey(ex.name, currentWeekNumber, dayNumber, s, "actualReps");
              console.log(`Saved: ${arKey} = ${localStorage.getItem(arKey)}`);
            }
          }

          // Check if AWT is purchased and if the popup for advanced logic should be triggered.
          const awtShownKey = `awtShown_${currentWeekIndex}_${currentDayIndex}_${ex.name}_set${s}`;

          // 1) If this set falls outside the suggested range, always check for a popup
          if (shouldShowPopup(phase, repValNew, defaultSuggestedReps)) {
            const range = parseSuggestedReps(defaultSuggestedReps);
            const isTooEasy = repValNew > range.max;

            // ── 2a) Pro users: advanced‑logic popup once ──
            if (hasPurchasedAWT && !localStorage.getItem(awtShownKey)) {
              console.log("[Checkbox] AWT not yet shown for this set, triggering advanced logic popup.");
              if (currentRestTimerElement?.classList.contains("visible")) {
                currentRestTimerElement.classList.remove("visible");
                setTimeout(() => {
                  cancelRestTimer();
                  setTimeout(() => {
                    handleIntraWorkoutRepLogic(ex, repValNew, s, defaultSuggestedReps, weightValNew, exerciseCheckbox, details);
                    setAWTShownForSet(currentWeekIndex, currentDayIndex, ex.name, s);
                  }, 300);
                }, 300);
              } else {
                handleIntraWorkoutRepLogic(ex, repValNew, s, defaultSuggestedReps, weightValNew, exerciseCheckbox, details);
                setAWTShownForSet(currentWeekIndex, currentDayIndex, ex.name, s);
              }
              return;  // skip normal flow once popup shown
            }
            // ── 2b) Core users: upsell ──
            else if (!hasPurchasedAWT) {
              maybeShowCoreRepUpsell(isTooEasy);
              // and then fall through to proceed()
            }
          }

          // NORMAL FLOW: Proceed normally.
          const proceed = () => {
            if (!loadXPAwarded(key)) {
              saveXPAwarded(key);
              addXP(3);
              maybeStartStreak();
              updateActiveWeekOnLog();
            }
            // cbDispatchEventForChange(setCheckbox); 
            autoCheckExerciseIfAllSets(exerciseCheckbox, details);
            if (ex.rest) {
              startRestTimerWithDelay(ex);
            }
            repsInput.readOnly = true;
            repsInput.style.color = "#333";
            if (weightInput) {
              weightInput.readOnly = true;
              weightInput.style.color = "#333";
            }
          };

          if (currentRestTimerElement && currentRestTimerElement.classList.contains("visible")) {
            console.log("[Checkbox] Normal flow => pop-away current rest timer first.");
            currentRestTimerElement.classList.remove("visible");
            setTimeout(() => {
              cancelRestTimer();
              setTimeout(() => {
                console.log("[Checkbox] Proceeding with normal flow after timer cancellation.");
                proceed();
              }, 300);
            }, 300);
          } else {
            console.log("[Checkbox] No active rest timer => proceed immediately.");
            proceed();
          }
          refreshSetPlaceholdersForExercise(ex);
          if (s === totalSets && !isNaN(weightValNew) && weightValNew > 0) {
            console.log(`[Checkbox] Final set #${s} => finalize baseline with weight=${weightValNew}`);
            finalizeLastSetAsBaseline(ex, weightValNew, currentWeekNumber, purchasedWeeks);
          }
        } else {
          // UNCHECKED branch: revert checkbox state to allow user editing.
          console.log(`[Checkbox] Unchecked => removing checkbox state from localStorage => ${key}`);
          saveCheckboxState(key, false);
          repsInput.readOnly = false;
          repsInput.style.color = "";
          if (weightInput) {
            weightInput.readOnly = false;
            weightInput.style.color = "";
          }
        }
        // Store the current expansion state of the row if applicable.
        if (arrow) {
          const isRowCurrentlyExpanded = arrow.classList.contains("expanded");
          saveExerciseExpansion(expansionKey, isRowCurrentlyExpanded);
        }
        // Update the UI.
        renderWorkoutDisplay();

        // Re-run auto-check for this exercise on the newly rendered elements
        renderWorkoutDisplay();
        const freshExerciseCheckbox = document.querySelector(
          `input.exercise-checkbox[data-checkbox-key="${exerciseKey}"]`
        );
        if (freshExerciseCheckbox) {
          const freshDetails = freshExerciseCheckbox
            .closest('.exercise-row')
            .nextElementSibling;
          autoCheckExerciseIfAllSets(freshExerciseCheckbox, freshDetails);
        }
        // autoCheckDayIfAllExercisesAreChecked();
        updateWeeklyTotals();

        return;
      });
      setRow.appendChild(setCheckbox);
      const changedMarkerKey = setKey + "_changedMidWorkout";
      if (localStorage.getItem(changedMarkerKey) === "true") {
        setRow.classList.add("changed-set-highlight");
      }
      setContainer.appendChild(setRow);
    }
  }
  else {
    // Fallback if no sets/reps/duration found
    const setRow = document.createElement("div");
    setRow.classList.add("set-row", "bordered-row");

    const setLabel = document.createElement("div");
    setLabel.classList.add("set-label");
    setLabel.textContent = "Set 1";
    setRow.appendChild(setLabel);

    const repsInput = document.createElement("input");
    repsInput.type = "number";
    repsInput.classList.add("input-field");
    repsInput.placeholder = (sectionKey === "warmUp")
      ? (ex.reps || "reps")
      : (ex.reps ? `${ex.reps} reps` : "reps");
    setRow.appendChild(repsInput);

    if (sectionKey !== "warmUp") {
      const weightInput = document.createElement("input");
      weightInput.type = "number";
      weightInput.classList.add("input-field");
      weightInput.placeholder = "0 kg";
      setRow.appendChild(weightInput);
    } else {
      // warm-up => no weight field
      const emptyDiv = document.createElement("div");
      setRow.appendChild(emptyDiv);
    }

    const fallbackKey = `fallback_${currentWeekIndex}_${currentDayIndex}_${ex.name}_set1`;
    const setCheckbox = document.createElement("input");
    setCheckbox.type = "checkbox";
    setCheckbox.classList.add("set-checkbox");
    setCheckbox.setAttribute("data-checkbox-key", fallbackKey);

    if (loadCheckboxState(fallbackKey)) {
      setCheckbox.checked = true;
    }

    setCheckbox.addEventListener("change", () => {
      if (setCheckbox.checked) {
        if (!loadXPAwarded(fallbackKey)) {
          saveXPAwarded(fallbackKey);
          addXP(3);
        }
        saveCheckboxState(fallbackKey, true);
        startRestTimerWithDelay(ex);
        updateActiveWeekOnLog()
        // lock
        repsInput.readOnly = true;
      } else {
        saveCheckboxState(fallbackKey, false);
        repsInput.readOnly = false;
      }
      // autoCheckDayIfAllExercisesAreChecked();
    });
    setRow.appendChild(setCheckbox);
    setContainer.appendChild(setRow);
  }

  // =========== Buttons row (Change Exercise / Watch Video) ===========
  const isResistanceTraining =
    sectionKey === "mainWork" &&
    !isCardio(ex) &&
    isSetsBased(ex);

  if (isResistanceTraining) {
    const buttonsRow = document.createElement("div");
    buttonsRow.classList.add("set-row", "buttons-row");

    // placeholder to align with set-label column
    buttonsRow.appendChild(document.createElement("div"));

    // helper to lock a button in purple with new text
    const styleAsLocked = (btn, newText) => {
      btn.style.transition = "background-color 0.3s ease";
      btn.style.backgroundColor = "#9333EA";
      btn.textContent = newText;
    };

    // session-storage keys so we only lock once per page load
    const CHANGE_KEY = "upsell_changeExercise";
    const VIDEO_KEY = "upsell_watchVideo";

    // ─ Change / Smart-Swap button ───────────────────────────────
    const changeExerciseBtn = document.createElement("button");
    changeExerciseBtn.classList.add("exercise-btn");
    changeExerciseBtn.textContent = hasPurchasedAWT
      ? "Change Exercise"
      : "Smart Swap";
    // if already upsold this session, lock immediately
    if (!hasPurchasedAWT && sessionStorage.getItem(CHANGE_KEY)) {
      styleAsLocked(changeExerciseBtn, "🔒Smart Swap");
    }
    changeExerciseBtn.addEventListener("click", e => {
      e.preventDefault();
      if (hasPurchasedAWT) {
        showChangeExercisePopup(ex, details, exerciseRow);
      } else {
        showCoreUpsellPopup(
          "Want smarter swaps?",
          "Unlock Pro to get expert-curated alternatives, tailored to your setup and goals."
        );
        sessionStorage.setItem(CHANGE_KEY, "true");
        styleAsLocked(changeExerciseBtn, "🔒Smart Swap");
      }
    });
    buttonsRow.appendChild(changeExerciseBtn);

    // ─ Video Tutorial button ────────────────────────────────────
    const watchVideoBtn = document.createElement("button");
    watchVideoBtn.classList.add("exercise-btn");
    watchVideoBtn.textContent = hasPurchasedAWT
      ? "Watch Video"
      : "Video Tutorial";
    if (!hasPurchasedAWT && sessionStorage.getItem(VIDEO_KEY)) {
      styleAsLocked(watchVideoBtn, "🔒Video Tutorial");
    }
    watchVideoBtn.addEventListener("click", e => {
      e.preventDefault();
      if (hasPurchasedAWT) {
        alert("Watch Video not implemented yet.");
      } else {
        showCoreUpsellPopup(
          "Not sure if your form is right?",
          "Pro gives you in-app, step-by-step videos so you can lift with confidence."
        );
        sessionStorage.setItem(VIDEO_KEY, "true");
        styleAsLocked(watchVideoBtn, "🔒Video Tutorial");
      }
    });
    buttonsRow.appendChild(watchVideoBtn);

    // placeholder for the checkbox-column alignment
    buttonsRow.appendChild(document.createElement("div"));

    setContainer.appendChild(buttonsRow);
  }
  // Append everything
  parentEl.appendChild(exerciseRow);
  parentEl.appendChild(details);
  refreshSetPlaceholdersForExercise(ex);
}

// --- Utility functions below (same as before, adapted to new structure) ---

// Check/uncheck all sets within a given exercise details section.
function checkAllSetsForExercise(detailsSection) {
  const setCheckboxes = detailsSection.querySelectorAll(".set-checkbox");
  setCheckboxes.forEach(cb => {
    const key = cb.getAttribute("data-checkbox-key");
    if (!cb.checked) {
      cb.checked = true;
      saveCheckboxState(key, true);
      // Award XP once only via localStorage
      if (!loadXPAwarded(key)) {
        saveXPAwarded(key);
        addXP(3);
        maybeStartStreak();
        updateProgressScoreAndMessages();
      }
      // Manually dispatch a change event so the set checkbox's own handler runs.
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

function uncheckAllSetsForExercise(detailsSection) {
  const setCheckboxes = detailsSection.querySelectorAll(".set-checkbox");
  setCheckboxes.forEach(cb => {
    cb.checked = false;
  });
}

function checkAllExercises() {
  const exerciseCheckboxes = workoutDisplayEl.querySelectorAll(".exercise-checkbox");
  exerciseCheckboxes.forEach(cb => {
    const key = cb.getAttribute("data-checkbox-key");
    if (!cb.checked) {
      cb.checked = true;
      saveCheckboxState(key, true);
      if (!loadXPAwarded(key)) {
        saveXPAwarded(key);
        addXPForExercise({});
        updateProgressScoreAndMessages();
      }
      // NEW: Fire the same event the user would have triggered
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  const setCheckboxes = workoutDisplayEl.querySelectorAll(".set-checkbox");
  setCheckboxes.forEach(cb => {
    const key = cb.getAttribute("data-checkbox-key");
    if (!cb.checked) {
      cb.checked = true;
      saveCheckboxState(key, true);
      if (!loadXPAwarded(key)) {
        saveXPAwarded(key);
        addXP(3);
        maybeStartStreak();
        updateProgressScoreAndMessages();
      }
      // NEW: Fire the same event here, too!
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

function checkAllSetsForExercise(detailsSection) {
  const setCheckboxes = detailsSection.querySelectorAll(".set-checkbox");
  setCheckboxes.forEach(cb => {
    const key = cb.getAttribute("data-checkbox-key");
    if (!cb.checked) {
      cb.checked = true;
      saveCheckboxState(key, true);
      // Award XP once only via localStorage
      if (!loadXPAwarded(key)) {
        saveXPAwarded(key);
        addXP(3);
        maybeStartStreak();
        updateProgressScoreAndMessages();
      }
      // Manually dispatch a change event so the set checkbox's own handler runs.
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

function uncheckAllExercises() {
  const exerciseCheckboxes = workoutDisplayEl.querySelectorAll(".exercise-checkbox");
  exerciseCheckboxes.forEach(cb => {
    const key = cb.getAttribute("data-checkbox-key");
    cb.checked = false;
    saveCheckboxState(key, false);
  });
  const setCheckboxes = workoutDisplayEl.querySelectorAll(".set-checkbox");
  setCheckboxes.forEach(cb => {
    const key = cb.getAttribute("data-checkbox-key");
    cb.checked = false;
    saveCheckboxState(key, false);
  });
}

function uncheckAllSetsForExercise(detailsSection) {
  const setCheckboxes = detailsSection.querySelectorAll(".set-checkbox");
  setCheckboxes.forEach(cb => {
    const key = cb.getAttribute("data-checkbox-key");
    cb.checked = false;
    saveCheckboxState(key, false);
  });
}

// XP awarding for entire day or exercise
function addXPForDay(dayObj) {
  addXP(15);
  // incrementWorkoutsThisWeek();
  // maybeStartStreak();
}
function addXPForExercise(exObj) {
  addXP(8);
  maybeStartStreak();
}

// function autoCheckDayIfAllExercisesAreChecked() {
//   const dayKey = `day_${currentWeekIndex}_${currentDayIndex}`;
//   const dayCheckboxEl = document.querySelector(`input.day-checkbox[data-checkbox-key="${dayKey}"]`);
//   if (!dayCheckboxEl) {
//     console.log("[autoCheckDay] Day checkbox not found for key:", dayKey);
//     return;
//   }

//   // Use document.querySelectorAll so we capture all exercise checkboxes on the page.
//   const exerciseCheckboxes = document.querySelectorAll(
//     `input.exercise-checkbox[data-checkbox-key^="exercise_${currentWeekIndex}_${currentDayIndex}_"]`
//   );
//   console.log("[autoCheckDay] Found", exerciseCheckboxes.length, "exercise checkboxes for day", dayKey);

//   let allChecked = true;
//   exerciseCheckboxes.forEach(cb => {
//     if (!cb.checked) {
//       allChecked = false;
//     }
//   });

//   console.log("[autoCheckDay] All exercise checkboxes checked?", allChecked);

//   if (allChecked && !dayCheckboxEl.checked) {
//     dayCheckboxEl.checked = true;
//     saveCheckboxState(dayKey, true);
//     console.log("[autoCheckDay] Day checkbox auto-checked for key:", dayKey);

//     // Optionally award day XP if not already done.
//     if (!loadXPAwarded(dayKey)) {
//       saveXPAwarded(dayKey);
//       addXPForDay(); // Pass dayData if needed
//     }
//     updateProgressScoreAndMessages();
//   }
// }

// Auto-check the exercise if all sets are checked
function autoCheckExerciseIfAllSets(exCheckbox, detailsSection) {
  // If no detailsSection was passed (or it came back null), try to derive it:
  if (!detailsSection) {
    const row = exCheckbox.closest('.exercise-row');
    if (row && row.nextElementSibling && row.nextElementSibling.classList.contains('exercise-details')) {
      detailsSection = row.nextElementSibling;
    }
  }

  if (!detailsSection) {
    console.warn("autoCheckExerciseIfAllSets called with null detailsSection");
    return;
  }

  // Now proceed with your existing logic:
  const setCbs = detailsSection.querySelectorAll(".set-checkbox");
  let allChecked = true;
  setCbs.forEach(cb => {
    if (!cb.checked) allChecked = false;
  });

  if (allChecked && !exCheckbox.checked) {
    const key = exCheckbox.getAttribute("data-checkbox-key");
    exCheckbox.checked = true;
    saveCheckboxState(key, true);
    if (!loadXPAwarded(key)) {
      saveXPAwarded(key);
      addXPForExercise({});
      updateProgressScoreAndMessages();
    }
    // Cancel any rest timer if applicable:
    if (activeRestTimerExercise) {
      cancelRestTimer();
      activeRestTimerExercise = null;
    }
  }
}

// --- Helper to re-query fresh DOM after re-render ---
function recheckExerciseAuto() {
  // Delay slightly to let the DOM re-render.
  setTimeout(() => {
    const selector = `[data-exercise-key="exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}"]`;
    const newExerciseRow = document.querySelector(selector);
    if (newExerciseRow) {
      const newDetails = newExerciseRow.querySelector(".exercise-details");
      const newExerciseCheckbox = newExerciseRow.querySelector(".exercise-checkbox");
      if (newDetails && newExerciseCheckbox) {
        autoCheckExerciseIfAllSets(newExerciseCheckbox, newDetails);
        // autoCheckDayIfAllExercisesAreChecked();
      } else {
        console.warn("Recheck: New exercise row found but details or checkbox missing.");
      }
    } else {
      console.warn("Recheck: New exercise row not found using selector:", selector);
    }
  }, 50);
}

// Finally, call it once initially:
renderWorkoutDisplay();

/***************************************
 *  handleIntraWorkoutRepLogic WITH AWT POP-UP
 ***************************************/
function handleIntraWorkoutRepLogic(exerciseObj, userReps, currentSetIndex, defaultSuggestedReps, userWeight = 0, exerciseCheckbox, details) {
  console.log("[handleIntraWorkoutRepLogic] Checking AWT status for", exerciseObj.name);
  if (!hasPurchasedAWT) {
    console.log(`User has NOT purchased AWT. Skipping advanced rep logic for "${exerciseObj.name}".`);
    return;
  }

  if (!exerciseObj.suggestedReps) {
    exerciseObj.suggestedReps = defaultSuggestedReps || exerciseObj.reps || "12-15";
    console.log(`[handleIntraWorkoutRepLogic] Defaulting suggestedReps to ${exerciseObj.suggestedReps} for "${exerciseObj.name}".`);
  }

  console.log(`[handleIntraWorkoutRepLogic] AWT enabled. Checking rep performance for "${exerciseObj.name}" with rep value ${userReps}.`);
  let suggestedRange = parseSuggestedReps(exerciseObj.suggestedReps);
  let isInsideRange = suggestedRange && userReps >= suggestedRange.min && userReps <= suggestedRange.max;
  console.log(`User input: ${userReps}. Suggested range: ${exerciseObj.suggestedReps}. Inside range? ${isInsideRange}`);

  if (isInsideRange) {
    console.log(`No pop-up needed for "${exerciseObj.name}"—User matched suggested range.`);
    return;
  }

  const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
  const phase = getPhaseFromWeek(currentWeekNumber);
  let hardLimit, easyLimit;
  if (phase === 1) {
    hardLimit = 9; easyLimit = 15;
  } else if (phase === 2) {
    hardLimit = 5; easyLimit = 13;
  } else {
    hardLimit = 3; easyLimit = 9;
  }
  // If userReps is between (hardLimit + 1) and (easyLimit - 1), bail out:
  if (userReps > hardLimit && userReps < easyLimit) {
    console.log(
      `[handleIntraWorkoutRepLogic] Rep=${userReps} in ` +
      `mid-range for phase ${phase}; skipping popup.`
    );
    return;
  }

  let recommendedAdjustment = getAWTChangesForRepResult(exerciseObj, userReps, userWeight);
  console.log(`[handleIntraWorkoutRepLogic] Outside range—will trigger XP animation then popup for "${exerciseObj.name}". Recommendation:`, recommendedAdjustment);

  // Trigger XP first
  addXP(3);

  // Delay showing the pop-up until the XP animation finishes
  setTimeout(() => {
    showPerformancePopup(exerciseObj, userReps, currentSetIndex, recommendedAdjustment, exerciseCheckbox, details);
  }, 2500);
}

function shouldShowPopup(phase, userReps, suggestedReps) {
  let range = parseSuggestedReps(suggestedReps);
  if (!range) return false;

  // If the suggested range is "0-9" and userReps is between 10 and 12, skip pop-up
  if (suggestedReps.trim() === "0-9" && userReps >= 10 && userReps <= 12) {
    return false;
  }

  switch (phase) {
    case 1: // Foundational (unchanged logic)
      if (userReps >= 15) return true;
      if (userReps <= 9) return true;
      return false;

    case 2: // Hypertrophy — Fix: trigger if userReps > 12
      if (userReps >= 13) return true;    // "Too Easy"
      if (userReps <= 5) return true;     // "Too Hard"
      return false;

    case 3: // Strength — Fix: trigger if userReps > 8
      if (userReps >= 9) return true;     // "Too Easy"
      if (userReps <= 3) return true;     // "Too Hard"
      return false;

    default:
      return false;
  }
}

function getCurrentSuggestedWeight(exerciseObj) {
  // 1) If localStorage has a suggestedWeight for the *current set*, use that
  const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
  const dayNumber = currentDayIndex + 1;
  // If you want to check the *current set*, you'd pass in sIndex, but if not known here, skip.

  // 2) Otherwise fallback to exerciseObj.suggestedWeight if present
  if (typeof exerciseObj.suggestedWeight === "number" && exerciseObj.suggestedWeight > 0) {
    return exerciseObj.suggestedWeight;
  }

  // 3) Otherwise fallback to ex.weight
  if (typeof exerciseObj.weight === "number" && exerciseObj.weight > 0) {
    return exerciseObj.weight;
  }

  // 4) If all else fails, fallback to 10
  return 10;
}

/***************************************
 * parseSuggestedReps("12-15") => {min:12, max:15}
 ***************************************/
function parseSuggestedReps(repString) {
  if (!repString) return null;
  let parts = repString.split("-");
  if (parts.length === 2) {
    let min = parseInt(parts[0], 10);
    let max = parseInt(parts[1], 10);
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max };
    }
  }
  let single = parseInt(repString, 10);
  if (!isNaN(single)) {
    return { min: single, max: single };
  }
  return null;
}

/***************************************
 * getAWTChangesForRepResult 
 * - Returns an object describing recommended changes
 ***************************************/
function getAWTChangesForRepResult(exerciseObj, userReps, userWeight = 0) {
  const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
  const phase = getPhaseFromWeek(currentWeekNumber);
  const isCompound = (exerciseObj.typeOfMovement || "").toLowerCase().includes("compound");

  // Use userWeight if provided; otherwise fall back to the current suggested weight
  const baseSuggestedWeight = (userWeight && userWeight > 0)
    ? userWeight
    : getCurrentSuggestedWeight(exerciseObj);

  let recommendation = {
    suggestedReps: exerciseObj.suggestedReps || exerciseObj.reps || "12-15",
    newWeight: baseSuggestedWeight,
    restTime: getDefaultRestTimeForPhase(phase),
    reason: ""
  };

  console.log(`[getAWTChangesForRepResult] Starting.
    phase=${phase}, isCompound=${isCompound},
    baseSuggestedWeight=${baseSuggestedWeight}, userReps=${userReps}`);

  switch (phase) {
    case 1: // Foundational
      if (userReps >= 15) {
        recommendation.suggestedReps = "12-15";
        recommendation.newWeight = baseSuggestedWeight + (isCompound ? 1.5 : 0.5);
        recommendation.restTime = 45;
        recommendation.reason = "User hit >=15 reps => +fixed increment";
      } else if (userReps <= 9) {
        exerciseObj.failCountInThisPhase = (exerciseObj.failCountInThisPhase || 0) + 1;
        if (exerciseObj.failCountInThisPhase === 1) {
          recommendation.suggestedReps = "12-15"; //10-12
          recommendation.newWeight = baseSuggestedWeight - (isCompound ? 2 : 1);
          recommendation.restTime = 60;
          recommendation.reason = "First fail <9 => fixed decrement";
        } else {
          if (userReps <= 5) {
            recommendation.newWeight = baseSuggestedWeight - (isCompound ? 3 : 1.5);
            recommendation.reason = "2x fail with rep <=5 => bigger decrement";
          } else {
            recommendation.newWeight = baseSuggestedWeight - (isCompound ? 2 : 1);
            recommendation.reason = "2x fail but close => moderate decrement";
          }
          recommendation.suggestedReps = "12-15"; //10-12
          recommendation.restTime = 60;
        }
      } else {
        if (userReps >= 10 && userReps < 12) {
          recommendation.suggestedReps = "12-15"; //10-12
          recommendation.reason = "Rep in 12-15 => maintain weight";
        } else {
          recommendation.suggestedReps = "12-15";
          recommendation.reason = "Rep in 12–15 => maintain weight";
        }
        recommendation.newWeight = baseSuggestedWeight;
        recommendation.restTime = 45;
      }
      break;
    case 2: // Hypertrophy
      if (userReps >= 12) {
        recommendation.suggestedReps = "8-12";
        recommendation.newWeight = baseSuggestedWeight + (isCompound ? 2.5 : 1);
        recommendation.restTime = 90;
        recommendation.reason = "Hypertrophy => user hit >=12 => fixed increment";
      } else if (userReps <= 5) {
        exerciseObj.failCountInThisPhase = (exerciseObj.failCountInThisPhase || 0) + 1;
        if (exerciseObj.failCountInThisPhase === 1) {
          recommendation.suggestedReps = "8-12";
          recommendation.newWeight = baseSuggestedWeight - (isCompound ? 3 : 1.5);
          recommendation.restTime = 120;
          recommendation.reason = "Hypertrophy => first fail <=5 => fixed decrement";
        } else {
          if (userReps <= 3) {
            recommendation.newWeight = baseSuggestedWeight - (isCompound ? 4 : 2);
            recommendation.reason = "2x fail <=3 => bigger decrement";
          } else {
            recommendation.newWeight = baseSuggestedWeight - (isCompound ? 3 : 1.5);
            recommendation.reason = "2x fail but close => moderate decrement";
          }
          recommendation.suggestedReps = "8-12";
          recommendation.restTime = 120;
        }
      } else {
        if (userReps >= 8) {
          recommendation.suggestedReps = "8-12";
          recommendation.reason = "Hypertrophy => rep in 8–12 => maintain";
        } else {
          recommendation.suggestedReps = "8-12";
          recommendation.reason = "Hypertrophy => rep in 6–8 => maintain";
        }
        recommendation.newWeight = baseSuggestedWeight;
        recommendation.restTime = 90;
      }
      break;
    case 3: // Strength
    default:
      if (userReps >= 8) {
        recommendation.suggestedReps = "6-8";
        recommendation.newWeight = baseSuggestedWeight + (isCompound ? 4 : 2);
        recommendation.restTime = 180;
        recommendation.reason = "Strength => user hit >=8 => fixed increment";
      } else if (userReps <= 3) {
        exerciseObj.failCountInThisPhase = (exerciseObj.failCountInThisPhase || 0) + 1;
        if (exerciseObj.failCountInThisPhase === 1) {
          recommendation.suggestedReps = "6-8";
          recommendation.newWeight = baseSuggestedWeight - (isCompound ? 5 : 2.5);
          recommendation.restTime = 225;
          recommendation.reason = "Strength => first fail <=3 => fixed decrement";
        } else {
          if (userReps <= 1) {
            recommendation.newWeight = baseSuggestedWeight - (isCompound ? 6 : 3);
            recommendation.reason = "2x fail <=1 => bigger decrement";
          } else {
            recommendation.newWeight = baseSuggestedWeight - (isCompound ? 5 : 2.5);
            recommendation.reason = "2x fail but close => moderate decrement";
          }
          recommendation.suggestedReps = "6-8";
          recommendation.restTime = 225;
        }
      } else {
        if (userReps >= 6) {
          recommendation.suggestedReps = "6-8";
          recommendation.reason = "Strength => rep in 6–8 => maintain weight";
          recommendation.restTime = 180;
        } else {
          recommendation.suggestedReps = "6-8";
          recommendation.reason = "Strength => rep in 4–6 => maintain weight";
          recommendation.restTime = 180;
        }
        recommendation.newWeight = baseSuggestedWeight;
      }
      break;
  }

  // Set the direction explicitly
  if (recommendation.newWeight > baseSuggestedWeight) {
    recommendation.direction = "increase";
  } else if (recommendation.newWeight < baseSuggestedWeight) {
    recommendation.direction = "decrease";
  } else {
    recommendation.direction = "maintain";
  }

  // 1) Convert undefined/NaN to 0
  // 2) Round to 0.5 increments
  // 3) Clamp to minimum 1 kg
  const safeValue = recommendation.newWeight || 0;  // if NaN => becomes 0
  const rounded = roundToNearestHalfKg(safeValue);
  recommendation.newWeight = (isNaN(rounded) || rounded < 1) ? 1 : rounded;

  console.log(`[getAWTChangesForRepResult] Proposed => 
    newReps: ${recommendation.suggestedReps}, 
    newWeight: ${recommendation.newWeight} kg, 
    restTime: ${recommendation.restTime}, 
    reason: ${recommendation.reason}, 
    direction: ${recommendation.direction}`);

  return recommendation;
}

/***************************************
 * getDefaultRestTimeForPhase
 * - 45s (Phase 1), 90s (Phase 2), 180s (Phase 3)
 ***************************************/
function getDefaultRestTimeForPhase(phase) {
  if (phase === 1) return 45;
  if (phase === 2) return 90;
  if (phase === 3) return 180;
  return 60; // fallback
}

/**
 * Applies a positive or negative percentage change with a min/max absolute bound
 * and returns the new rounded weight.
 */
function applyAdaptiveIncrement(currentWeight, percentChange, minDelta, maxDelta) {
  const rawDelta = currentWeight * (percentChange / 100);
  let bounded = rawDelta;
  if (percentChange >= 0) {
    if (bounded < minDelta) bounded = minDelta;
    if (bounded > maxDelta) bounded = maxDelta;
  } else {
    // Negative - clamp the absolute value
    if (Math.abs(bounded) < minDelta) bounded = -minDelta;
    if (Math.abs(bounded) > maxDelta) bounded = -maxDelta;
  }
  const newWeight = currentWeight + bounded;
  return roundToNearestHalfKg(newWeight);
}

function refreshSetPlaceholdersForExercise(exerciseObj) {
  const exerciseKey = `exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}`;
  const setRows = document.querySelectorAll(
    `[data-exercise-key="${exerciseKey}"] .set-row`
  );
  const weekNum = twelveWeekProgram[currentWeekIndex].week;
  const dayNum = currentDayIndex + 1;
  const unit = getPreferredWeightUnit();    // "kg" or "lbs"

  setRows.forEach(row => {
    const sIndex = parseInt(row.dataset.setIndex, 10);
    if (!sIndex) return;

    // ── REPS (unchanged) ──
    const repsInput = row.querySelector(".input-field:nth-of-type(1)");
    if (repsInput) {
      const actualRepsKey = getSetStorageKey(
        exerciseObj.name, weekNum, dayNum, sIndex, "actualReps"
      );
      const storedAR = localStorage.getItem(actualRepsKey);
      if (storedAR) {
        repsInput.value = storedAR;
      } else {
        const suggRepsKey = getSetStorageKey(
          exerciseObj.name, weekNum, dayNum, sIndex, "suggestedReps"
        );
        const storedSR = localStorage.getItem(suggRepsKey);
        if (storedSR) repsInput.placeholder = storedSR + " reps";
      }
    }

    // ── WEIGHT ──
    const weightInput = row.querySelector(".input-field:nth-of-type(2)");
    if (weightInput) {
      const actualWKey = getSetStorageKey(
        exerciseObj.name, weekNum, dayNum, sIndex, "actualWeight"
      );
      const storedAW = localStorage.getItem(actualWKey);

      if (storedAW) {
        // storedAW is in kg internally ⇒ convert it back to the user’s unit
        const kgVal = parseFloat(storedAW);
        const displayVal = unit === "lbs"
          ? kgToLbs(kgVal)
          : kgVal;
        // **show it in the input’s value** so the user sees “42.0 lbs” not a kg placeholder
        weightInput.value = displayVal.toFixed(1) + " " + unit;
        weightInput.placeholder = "";               // clear any old placeholder
      } else {
        // no override → show suggested
        const suggWKey = getSetStorageKey(
          exerciseObj.name, weekNum, dayNum, sIndex, "suggestedWeight"
        );
        let storedSug = parseFloat(localStorage.getItem(suggWKey));
        if (isNaN(storedSug) || storedSug <= 0) storedSug = 1;

        const displaySug = unit === "lbs"
          ? kgToLbs(storedSug)
          : storedSug;

        // only set placeholder, leave .value untouched
        weightInput.placeholder = displaySug.toFixed(1) + " " + unit;
      }
    }

    // ── DURATION (unchanged) ──
    const durationInput = row.querySelector(".duration-input");
    if (durationInput) {
      const actualDKey = getSetStorageKey(
        exerciseObj.name, weekNum, dayNum, sIndex, "actualDuration"
      );
      const storedDur = localStorage.getItem(actualDKey);
      if (storedDur) {
        let unitSuffix = "";
        if (durationInput.placeholder.toLowerCase().includes("seconds")) {
          unitSuffix = " seconds";
        } else if (durationInput.placeholder.toLowerCase().includes("minutes")) {
          unitSuffix = " minutes";
        }
        durationInput.value = storedDur + unitSuffix;
      }
    }
  });
}

function solidifySetValuesForExercise(exerciseObj) {
  const exerciseKey = `exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}`;
  const setRows = document.querySelectorAll(`[data-exercise-key="${exerciseKey}"] .set-row`);
  const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
  const dayNumber = currentDayIndex + 1;

  setRows.forEach((row) => {
    // If a set row doesn’t have a numeric set-index (e.g. fallback row), assume index 1.
    const sIndex = parseInt(row.getAttribute("data-set-index"), 10) || 1;
    // Loop over each input field in the row.
    const inputs = row.querySelectorAll(".input-field");
    inputs.forEach((input, idx) => {
      // If this is a duration input (used for cardio or cool-down duration),
      // and the value is empty, then solidify by copying the placeholder.
      if (input.classList.contains("duration-input")) {
        if (!input.value || input.value.trim() === "") {
          let durationPlaceholder = input.placeholder.replace(" minutes", "").trim();
          let durationVal = parseInt(durationPlaceholder, 10);
          if (!isNaN(durationVal)) {
            input.value = durationVal + " minutes";
            // Save to localStorage with a field name of "actualDuration"
            saveSetValue(exerciseObj.name, currentWeekNumber, dayNumber, sIndex, "actualDuration", durationVal);
            console.log(`[solidifySetValuesForExercise] Set #${sIndex} duration solidified to ${durationVal} minutes`);
          }
        }
      }
      // Else if the input is a number type (assumed to be for reps or weight)
      else if (input.type === "number") {
        // For reps input (assumed to be the first number input)
        if (idx === 0 && (!input.value || input.value.trim() === "")) {
          let repPlaceholder = input.placeholder.replace(" reps", "").trim();
          let repRange = parseSuggestedReps(repPlaceholder);
          if (repRange) {
            input.value = repRange.min;
            saveSetValue(exerciseObj.name, currentWeekNumber, dayNumber, sIndex, "actualReps", repRange.min);
            console.log(`[solidifySetValuesForExercise] Set #${sIndex} reps solidified to ${repRange.min}`);
          }
        }
        // For weight input (assumed to be the second number input)
        if (inputs.length > 1 && idx === 1 && (!input.value || input.value.trim() === "")) {
          let weightPlaceholder = input.placeholder.replace(" kg", "").trim();
          let weightVal = parseFloat(weightPlaceholder);
          if (!isNaN(weightVal)) {
            input.value = weightVal;
            saveSetValue(exerciseObj.name, currentWeekNumber, dayNumber, sIndex, "actualWeight", weightVal);
            console.log(`[solidifySetValuesForExercise] Set #${sIndex} weight solidified to ${weightVal} kg`);
          }
        }
      }
    });
  });
}

/***************************************
 * 10) PREVIOUS / NEXT WORKOUT BUTTONS
 ***************************************/
const prevBtn = document.getElementById("prevWorkoutBtn");
const nextBtn = document.getElementById("nextWorkoutBtn");

prevBtn.addEventListener("click", () => {
  let newDayIndex = currentDayIndex - 1;
  if (newDayIndex < 0) {
    let newWeekIndex = currentWeekIndex - 1;
    if (newWeekIndex >= 0) {
      currentWeekIndex = newWeekIndex;
      const w = twelveWeekProgram[currentWeekIndex];
      if (w && w.days) {
        newDayIndex = w.days.length - 1;
      } else {
        newDayIndex = 0;
      }
    } else {
      newDayIndex = 0;
    }
  }
  currentDayIndex = Math.max(0, newDayIndex);
  renderWeekSelector();
  renderDaySelector();
  renderWorkoutDisplay();
});

nextBtn.addEventListener("click", () => {
  const w = twelveWeekProgram[currentWeekIndex];
  const daysLen = w?.days?.length || 0;
  let newDayIndex = currentDayIndex + 1;
  if (newDayIndex >= daysLen) {
    let newWeekIndex = currentWeekIndex + 1;
    if (newWeekIndex < totalWeeksToShow) {
      currentWeekIndex = newWeekIndex;
      newDayIndex = 0;
    } else {
      newDayIndex = daysLen - 1;
    }
  }
  currentDayIndex = newDayIndex;
  renderWeekSelector();
  renderDaySelector();
  renderWorkoutDisplay();
});

/***************************************
 * 11) STREAK-RELATED HELPERS
 ***************************************/
function maybeStartStreak() {
  // If a reset flag exists OR if the streak count is 0, then immediately initialize the streak.
  if (localStorage.getItem("workoutStreakReset") === "true" ||
    !streakCount || parseInt(streakCount, 10) === 0) {
    // Remove the reset flag if present.
    localStorage.removeItem("workoutStreakReset");

    // Set the streak count to 1 immediately.
    streakCount = 1;
    localStorage.setItem("streakCount", streakCount.toString());

    // Update the UI right away to show the active-streak message.
    if (streakMessageEl) {
      streakMessageEl.textContent = getStreakMessage();
    }
  }

  // If there's no streakStartDate saved, set it now.
  if (!localStorage.getItem("streakStartDate")) {
    let now = new Date();
    setToMidnight(now); // assuming this function is defined elsewhere
    streakStartDate = now.toISOString();
    localStorage.setItem("streakStartDate", streakStartDate);
  }
}

function incrementWorkoutsThisWeek() {
  let completedThisWeek = parseInt(localStorage.getItem("completedThisWeek") || "0");
  completedThisWeek += 1;
  localStorage.setItem("completedThisWeek", completedThisWeek.toString());
  if (completedThisWeek >= requiredWorkoutsPerWeek) {
    streakCount++;
    localStorage.setItem("streakCount", streakCount.toString());
    streakMessageEl.textContent = getStreakMessage();
  }
}

/***************************************
 * 12) REST TIMER FUNCTIONALITY (DEBUGGING)
 ***************************************/
let restTimerInterval = null;
let restTimerRemaining = 0;
let restTimerPaused = false;
let restTimerMinimized = false;
let currentRestTimerElement = null;
let activeRestTimerExercise = null; // tracks which exercise’s timer is active

// Creates (if needed) and displays the rest timer with the given seconds.
function showRestTimer(seconds) {
  // console.log("[showRestTimer] Called with seconds:", seconds, "(stack trace below)");
  console.trace();
  if (isNaN(seconds)) {
    // console.warn("[showRestTimer] Invalid seconds value:", seconds);
    return;
  }

  let timerEl = document.getElementById("restTimer");
  if (!timerEl) {
    console.log("[showRestTimer] Timer element not found. Creating new one.");
    timerEl = document.createElement("div");
    timerEl.id = "restTimer";
    timerEl.innerHTML = `
      <div class="timer-header-row">
        <!-- Left side: Cancel icon -->
        <div class="timer-left">
          <div id="timerCancelIcon" class="timer-icon-btn cancel-btn">
            <span class="icon">
              <i class="fa-solid fa-xmark"></i>
            </span>
          </div>
        </div>
  
        <!-- Center: - / Timer / + -->
        <div class="timer-center">
          <button id="timerMinusBtn" class="adjust-btn">-</button>
          <div class="timer-display"></div>
          <button id="timerPlusBtn" class="adjust-btn">+</button>
        </div>
  
        <!-- Right side: Pause / Play -->
        <div class="timer-right">
        <div class="timer-right">
          <div id="timerPauseIcon" class="timer-icon-btn pause-btn">
            <span class="icon"><i class="fa-solid fa-pause"></i></span>
          </div>
          <div id="timerPlayIcon" class="timer-icon-btn play-btn">
            <span class="icon"><i class="fa-solid fa-play"></i></span>
          </div>
        </div>
      </div>
  
      <!-- The sleek chevron arrow for minimized state -->
      <div id="timerExpandArrow" class="timer-expand-arrow">
        <span class="arrow-icon">&#9652;</span>
      </div>
    `;
    document.body.appendChild(timerEl);
    console.log("[showRestTimer] Timer element created and appended.");
  }

  // Track the timer element
  currentRestTimerElement = timerEl;
  restTimerRemaining = seconds;
  // New timer always starts in playing state
  restTimerPaused = false;

  // Check and apply the saved minimized preference.
  // If the saved value is "true", mark as minimized and attach the click-to-expand listener.
  if (localStorage.getItem("restTimerMinimized") === "true") {
    restTimerMinimized = true;
    timerEl.classList.add("minimized");
    timerEl.addEventListener("click", onMinimizedClick);
  } else {
    restTimerMinimized = false;
    timerEl.classList.remove("minimized");
    timerEl.removeEventListener("click", onMinimizedClick);
  }

  updateRestTimerDisplay();

  // Ensure the new timer always starts in playing state:
  // Show the pause button and hide the play button.
  const pauseIcon = document.getElementById("timerPauseIcon");
  const playIcon = document.getElementById("timerPlayIcon");
  if (pauseIcon && playIcon) {
    pauseIcon.style.display = "block";
    playIcon.style.display = "none";
  }

  // Button events
  document.getElementById("timerMinusBtn").onclick = () => adjustRestTimer(-10);
  document.getElementById("timerPlusBtn").onclick = () => adjustRestTimer(10);

  // Cancel button minimizes (only this button triggers minimization when expanded)
  document.getElementById("timerCancelIcon").onclick = () => {
    toggleMinimizeRestTimer();
  };

  // Pause/Play toggle
  document.getElementById("timerPauseIcon").onclick = () => {
    restTimerPaused = true;
    document.getElementById("timerPauseIcon").style.display = "none";
    document.getElementById("timerPlayIcon").style.display = "block";
  };
  document.getElementById("timerPlayIcon").onclick = () => {
    restTimerPaused = false;
    document.getElementById("timerPlayIcon").style.display = "none";
    document.getElementById("timerPauseIcon").style.display = "block";
  };

  // The chevron arrow’s click handler—prevent it from bubbling
  const expandArrow = document.getElementById("timerExpandArrow");
  if (expandArrow) {
    expandArrow.onclick = (e) => {
      e.stopPropagation();
      toggleMinimizeRestTimer();
    };
  }

  // Slide the timer down
  void timerEl.offsetWidth; // force reflow
  requestAnimationFrame(() => {
    timerEl.classList.add("visible");
  });

  startRestTimerInterval();
}

function toggleMinimizeRestTimer() {
  if (!currentRestTimerElement) return;

  // Toggle the minimized state and store the preference
  restTimerMinimized = !restTimerMinimized;
  localStorage.setItem("restTimerMinimized", restTimerMinimized.toString());

  if (restTimerMinimized) {
    // Animate slide-up (leaving 20px visible)
    currentRestTimerElement.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
    currentRestTimerElement.style.transform = "translateY(calc(-100% + 20px))";
    currentRestTimerElement.style.opacity = "1";
    setTimeout(() => {
      currentRestTimerElement.classList.add("minimized");
      // Attach the click-to-expand listener for the minimized state
      currentRestTimerElement.addEventListener("click", onMinimizedClick);
      // Clear inline styles so CSS takes over next time
      currentRestTimerElement.style.transition = "";
      currentRestTimerElement.style.opacity = "";
    }, 300);
  } else {
    // Remove the minimized class and its click listener
    currentRestTimerElement.classList.remove("minimized");
    currentRestTimerElement.removeEventListener("click", onMinimizedClick);
    // Animate slide-down / restore full height
    currentRestTimerElement.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
    currentRestTimerElement.style.transform = "translateY(0)";
    currentRestTimerElement.style.opacity = "1";
    setTimeout(() => {
      currentRestTimerElement.style.transition = "";
    }, 300);
  }
}

function onMinimizedClick(e) {
  // When minimized, clicking anywhere on the timer expands it.
  if (restTimerMinimized) {
    e.stopPropagation();
    toggleMinimizeRestTimer();
  }
}

function cancelRestTimer() {
  if (restTimerInterval) clearInterval(restTimerInterval);
  restTimerInterval = null;
  restTimerRemaining = 0;

  // Remove only the timer countdown and pause state so it won't reappear on reload.
  localStorage.removeItem("restTimerRemaining");
  localStorage.removeItem("restTimerPaused");
  // Note: We no longer remove "restTimerMinimized" to preserve the minimized preference.

  if (currentRestTimerElement) {
    // If minimized, remove that class so it can slide up from full height.
    currentRestTimerElement.classList.remove("minimized");
    // Also remove the click-to-expand event listener.
    currentRestTimerElement.removeEventListener("click", onMinimizedClick);
    // Remove the visible class to trigger the normal “pop away” transition.
    currentRestTimerElement.classList.remove("visible");

    // Clear inline transforms so the CSS can take over.
    currentRestTimerElement.style.transform = "";
    currentRestTimerElement.style.transition = "";
    currentRestTimerElement.style.opacity = "";

    const elementToRemove = currentRestTimerElement;
    setTimeout(() => {
      if (elementToRemove && !elementToRemove.classList.contains("visible")) {
        console.log("[cancelRestTimer] Timer hidden.");
        // Optionally: elementToRemove.remove();
      }
    }, 300);

    currentRestTimerElement = null;
  }
  activeRestTimerExercise = null;
}

// Updates the timer display to mm:ss format.
function updateRestTimerDisplay() {
  if (!currentRestTimerElement) return;
  const displayEl = currentRestTimerElement.querySelector(".timer-display");
  const minutes = Math.floor(restTimerRemaining / 60);
  const seconds = restTimerRemaining % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  displayEl.textContent = `${mm}:${ss}`;

  localStorage.setItem("restTimerRemaining", restTimerRemaining.toString());
  localStorage.setItem("restTimerPaused", restTimerPaused.toString());
}

// Starts the countdown interval.
function startRestTimerInterval() {
  if (restTimerInterval) clearInterval(restTimerInterval);
  restTimerInterval = setInterval(() => {
    if (!restTimerPaused) {
      restTimerRemaining--;
      if (restTimerRemaining <= 0) {
        cancelRestTimer();
      } else {
        updateRestTimerDisplay();
      }
    }
  }, 1000);
}

// Adjust time +/- delta
function adjustRestTimer(delta) {
  restTimerRemaining = Math.max(0, restTimerRemaining + delta);
  updateRestTimerDisplay();
}

function startRestTimerImmediately(newTime) {
  console.log("[startRestTimerImmediately] Starting new rest timer with time:", newTime);
  if (currentRestTimerElement && currentRestTimerElement.classList.contains("visible")) {
    console.log("[startRestTimerImmediately] Active rest timer found. Triggering pop-away animation.");
    // Remove the "visible" class to trigger the pop-away (fade out) animation.
    currentRestTimerElement.classList.remove("visible");
    // Wait for the pop-away animation to finish.
    setTimeout(() => {
      cancelRestTimer();
      // Wait a bit more to ensure the old timer is fully cleared,
      // then show the new timer with the updated rest time.
      setTimeout(() => {
        showRestTimer(newTime);
      }, 300);
    }, 300);
  } else {
    showRestTimer(newTime);
  }
}

/***************************************
 * Optional “shouldStartRestTimerForExercise” + delayed start
 ***************************************/
function shouldStartRestTimerForExercise(ex) {
  console.log("[shouldStartRestTimerForExercise] Checking:", ex.name, "rest:", ex.rest);
  if (!ex.rest) return false;
  const restSeconds = parseInt(ex.rest, 10);
  if (isNaN(restSeconds)) return false;

  const dayKey = `day_${currentWeekIndex}_${currentDayIndex}`;
  if (loadCheckboxState(dayKey)) {
    console.log("[shouldStartRestTimerForExercise] Day is fully checked => skip timer.");
    return false;
  }

  // If you want to skip if the exercise is fully checked, do so here too
  // e.g. if (loadCheckboxState(`exercise_${currentWeekIndex}_${currentDayIndex}_${ex.name}`)) return false;

  return true;
}


function startRestTimerWithDelay(ex) {
  console.log("[startRestTimerWithDelay] Scheduling a 3500ms delay for:", ex.name);
  if (restTimerDelayTimeout) clearTimeout(restTimerDelayTimeout);
  restTimerDelayTimeout = setTimeout(() => {
    console.log("[startRestTimerWithDelay] Timeout fired for:", ex.name);
    if (shouldStartRestTimerForExercise(ex) && !activeRestTimerExercise) {
      console.log("[startRestTimerWithDelay] => showRestTimer called for:", ex.name);
      activeRestTimerExercise = ex.name;
      const restSeconds = parseInt(ex.rest, 10) || 45;
      showRestTimer(restSeconds);
    }
  }, 3500);
}

/******************************************
 * showPerformancePopup(exerciseObj, userReps, recommendation)
 ******************************************/

let performancePopupTimer = null;
let fallbackYesNoActive = false;

function showPerformancePopup(exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details) {
  // if a popup is already scheduled or visible, bail out
  if (performancePopupSchedule || performancePopupTimer || document.getElementById("performancePopup")) {
    return;
  }

  console.log(`[showPerformancePopup] Scheduling for "${exerciseObj.name}". userReps=${userReps}. Recommendation=`, recommendation);

  performancePopupSchedule = setTimeout(() => {
    performancePopupSchedule = null;    // clear the schedule handle
    actuallyShowPopup(exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details);
  }, 800);
}

function actuallyShowPopup(exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details) {

  if (performancePopupSchedule) {
    clearTimeout(performancePopupSchedule);
    performancePopupSchedule = null;
  }

  const existing = document.getElementById("performancePopup");
  if (existing) existing.remove();

  if (performancePopupTimer) {
    clearInterval(performancePopupTimer);
    performancePopupTimer = null;
  }

  const popup = document.createElement("div");
  popup.id = "performancePopup";
  popup.classList.add("performance-popup");

  const contentWrap = document.createElement("div");
  contentWrap.classList.add("popup-content-wrap");

  const title = document.createElement("div");
  title.classList.add("popup-title");
  title.textContent = "How was your set?";
  contentWrap.appendChild(title);

  const easyText = randomText(buttonTexts.tooEasy);
  const fineText = randomText(buttonTexts.justFine);
  const hardText = randomText(buttonTexts.tooHard);

  const btnContainer = document.createElement("div");
  btnContainer.classList.add("popup-button-container");

  btnContainer.appendChild((() => {
    const btn = document.createElement("button");
    btn.classList.add("popup-btn-easy");
    btn.textContent = easyText;
    btn.addEventListener("click", () => handlePerformanceClick("TE", exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details));
    return btn;
  })());

  btnContainer.appendChild((() => {
    const btn = document.createElement("button");
    btn.classList.add("popup-btn-fine");
    btn.textContent = fineText;
    btn.addEventListener("click", () => handlePerformanceClick("JF", exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details));
    return btn;
  })());

  btnContainer.appendChild((() => {
    const btn = document.createElement("button");
    btn.classList.add("popup-btn-hard");
    btn.textContent = hardText;
    btn.addEventListener("click", () => handlePerformanceClick("TH", exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details));
    return btn;
  })());

  contentWrap.appendChild(btnContainer);

  const progressBar = document.createElement("div");
  progressBar.classList.add("popup-progress-bar");
  const progressFill = document.createElement("div");
  progressFill.classList.add("popup-progress-fill");
  progressBar.appendChild(progressFill);
  contentWrap.appendChild(progressBar);

  popup.appendChild(contentWrap);
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.classList.add("visible");
  });

  let timeLeft = 7;
  performancePopupTimer = setInterval(() => {
    timeLeft -= 0.1;
    if (timeLeft <= 0) {
      clearInterval(performancePopupTimer);
      performancePopupTimer = null;
      if (!fallbackYesNoActive) {
        console.log("[Popup] No user interaction, auto-applying recommended changes...");
        applyAWTChanges(exerciseObj, recommendation);
        closePerformancePopup(() => {
          if (exerciseObj.rest) {
            if (restTimerDelayTimeout) {
              clearTimeout(restTimerDelayTimeout);
              restTimerDelayTimeout = null;
              console.log("[Pop-up logic] Cleared delayed timer so it won't re-fire.");
            }
            startRestTimerImmediately(recommendation.restTime);
          }
          // Re-render the workout display and then obtain fresh DOM references.
          renderWorkoutDisplay();
          const newExerciseRow = document.querySelector(
            `[data-exercise-key="exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}"]`
          );
          if (newExerciseRow) {
            const newDetails = newExerciseRow.querySelector(".exercise-details");
            const newExerciseCheckbox = newExerciseRow.querySelector(".exercise-checkbox");
            autoCheckExerciseIfAllSets(newExerciseCheckbox, newDetails);
            // autoCheckDayIfAllExercisesAreChecked();
          }
        });
      }
    }
    const pct = (timeLeft / 7) * 100;
    progressFill.style.width = pct + "%";
  }, 100);
}

/********************************************************************
 * Section 90 - "How are you feeling?" Popup
 ********************************************************************/
let feelingPopupTimer = null;

function showStartWorkoutPopup() {
  // Only show the pop-up if AWT has been purchased.
  if (!hasPurchasedAWT) return;

  // If there's an existing element, remove it
  const existingEl = document.getElementById("startWorkoutPopup");
  if (existingEl) existingEl.remove();

  // Create a fresh popup
  const popup = document.createElement("div");
  popup.id = "startWorkoutPopup";

  popup.innerHTML = `
    <div class="popup-content-wrap">
      <div class="popup-title">How are you feeling?</div>
      <div class="popup-button-container" id="feelingResponseButtons"></div>
      <!-- progress bar -->
      <div class="popup-progress-bar">
        <div class="popup-progress-fill" id="feelingProgressFill" style="width:100%;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.classList.add("visible");
  });

  // Add the three color-coded buttons (as before)
  const btnContainer = popup.querySelector("#feelingResponseButtons");
  const goodBtn = document.createElement("button");
  goodBtn.classList.add("popup-btn-easy");
  goodBtn.textContent = getRandomItem(feelingGoodResponses);
  goodBtn.addEventListener("click", closeFeelingPopup);

  const neutralBtn = document.createElement("button");
  neutralBtn.classList.add("popup-btn-fine");
  neutralBtn.textContent = getRandomItem(feelingNeutralResponses);
  neutralBtn.addEventListener("click", closeFeelingPopup);

  const lowBtn = document.createElement("button");
  lowBtn.classList.add("popup-btn-hard");
  lowBtn.textContent = getRandomItem(feelingLowResponses);
  lowBtn.addEventListener("click", closeFeelingPopup);

  btnContainer.appendChild(goodBtn);
  btnContainer.appendChild(neutralBtn);
  btnContainer.appendChild(lowBtn);

  let timeLeft = 7.0;
  const progressFill = document.getElementById("feelingProgressFill");
  feelingPopupTimer = setInterval(() => {
    timeLeft -= 0.1;
    if (timeLeft <= 0) {
      closeFeelingPopup();
    } else {
      const pct = (timeLeft / 7.0) * 100;
      progressFill.style.width = pct + "%";
    }
  }, 100);
}

function closeFeelingPopup() {
  if (feelingPopupTimer) {
    clearInterval(feelingPopupTimer);
    feelingPopupTimer = null;
  }
  const popup = document.getElementById("startWorkoutPopup");
  if (popup) {
    popup.classList.remove("visible");
    setTimeout(() => popup.remove(), 300);
  }
}

// Helper for choosing random text
function randomText(arr) {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

// The main click handler for TE / JF / TH:
function handlePerformanceClick(buttonType, exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details) {
  console.log("[handlePerformanceClick] NEW VERSION: user pressed=", buttonType);
  console.log("🚨 I am in the new handlePerformanceClick function 🚨");
  console.log(`[handlePerformanceClick] recommendation.direction = ${recommendation.direction}`);

  // IMPORTANT: cancel the fallback timer so it won't auto-apply changes later
  if (performancePopupTimer) {
    clearInterval(performancePopupTimer);
    performancePopupTimer = null;
  }

  // Use the recommendation.direction property to decide if we skip the fallback:
  // if (buttonType === "JF" && recommendation.direction === "maintain") {
  //     console.log("[Popup] User pressed Just Fine and recommendation is maintain => applying changes");
  //     closePerformancePopup(() => {
  //       if (exerciseObj.rest) {
  //         if (restTimerDelayTimeout) {
  //           clearTimeout(restTimerDelayTimeout);
  //           restTimerDelayTimeout = null;
  //           console.log("[Pop-up logic] Cleared delayed timer so it won't re-fire.");
  //         }
  //         exerciseObj.rest = null;
  //         console.log("[Pop-up logic] ex.rest set to null => skipping normal delayed timer");
  //         startRestTimerImmediately(recommendation.restTime);
  //       }
  //       // First re-render the workout UI:
  //       renderWorkoutDisplay();

  //       // Then, get fresh DOM references:
  //       const newExerciseRow = document.querySelector(
  //         `[data-exercise-key="exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}"]`
  //       );
  //       if (newExerciseRow) {
  //         const newDetails = newExerciseRow.querySelector(".exercise-details");
  //         const newExerciseCheckbox = newExerciseRow.querySelector(".exercise-checkbox");
  //         // Now auto-check using the new elements:
  //         autoCheckExerciseIfAllSets(newExerciseCheckbox, newDetails);
  //       }
  //     });
  //     return;
  //   }

  if (buttonType === "JF") {
    if (recommendation.direction === "maintain") {
      closePerformancePopup(() => {
        if (exerciseObj.rest) {
          if (restTimerDelayTimeout) {
            clearTimeout(restTimerDelayTimeout);
            restTimerDelayTimeout = null;
          }
          startRestTimerImmediately(exerciseObj.rest);
        }
        renderWorkoutDisplay();
        const sel = `[data-exercise-key="exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}"]`;
        const row = document.querySelector(sel);
        if (row) {
          const newCheckbox = row.querySelector(".exercise-checkbox");
          const newDetails = row.nextElementSibling;
          autoCheckExerciseIfAllSets(newCheckbox, newDetails);
        }
      });
    } else {
      showFallbackYesNo(exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details);
    }
    return;
  }

  if (buttonType === "TE" && recommendation.direction === "increase") {
    console.log("[Popup] User pressed Too Easy and recommendation indicates increase => applying changes");
    applyAWTChanges(exerciseObj, recommendation);
    closePerformancePopup(() => {
      if (exerciseObj.rest) {
        if (restTimerDelayTimeout) {
          clearTimeout(restTimerDelayTimeout);
          restTimerDelayTimeout = null;
          console.log("[Pop-up logic] Cleared delayed timer so it won't re-fire.");
        }
        exerciseObj.rest = null;
        console.log("[Pop-up logic] ex.rest set to null => skipping normal delayed timer");
        startRestTimerImmediately(recommendation.restTime);
      }
      renderWorkoutDisplay();
      const newExerciseRow = document.querySelector(
        `[data-exercise-key="exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}"]`
      );
      if (newExerciseRow) {
        const newDetails = newExerciseRow.querySelector(".exercise-details");
        const newExerciseCheckbox = newExerciseRow.querySelector(".exercise-checkbox");
        autoCheckExerciseIfAllSets(newExerciseCheckbox, newDetails);
        // autoCheckDayIfAllExercisesAreChecked();
      }
    });
    return;
  }

  if (buttonType === "TH" && recommendation.direction === "decrease") {
    console.log("[Popup] User pressed Too Hard and recommendation indicates decrease => applying changes");
    applyAWTChanges(exerciseObj, recommendation);
    closePerformancePopup(() => {
      if (exerciseObj.rest) {
        if (restTimerDelayTimeout) {
          clearTimeout(restTimerDelayTimeout);
          restTimerDelayTimeout = null;
          console.log("[Pop-up logic] Cleared delayed timer so it won't re-fire.");
        }
        exerciseObj.rest = null;
        console.log("[Pop-up logic] ex.rest set to null => skipping normal delayed timer");
        startRestTimerImmediately(recommendation.restTime);
      }
      renderWorkoutDisplay();
      const newExerciseRow = document.querySelector(
        `[data-exercise-key="exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}"]`
      );
      if (newExerciseRow) {
        const newDetails = newExerciseRow.querySelector(".exercise-details");
        const newExerciseCheckbox = newExerciseRow.querySelector(".exercise-checkbox");
        autoCheckExerciseIfAllSets(newExerciseCheckbox, newDetails);
        // autoCheckDayIfAllExercisesAreChecked();
      }
    });
    return;
  }

  // Otherwise, if there's a mismatch between what the user pressed and what is recommended, show the fallback.
  console.log("[Popup] Mismatch detected => showing fallback yes/no");
  showFallbackYesNo(exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details);
}

// “Are you sure?” fallback
function showFallbackYesNo(exerciseObj, userReps, currentSetIndex, recommendation, exerciseCheckbox, details) {
  fallbackYesNoActive = true;
  console.log("[Popup] Mismatch detected => showing fallback question...");

  const popup = document.getElementById("performancePopup");
  if (!popup) return;

  const contentWrap = popup.querySelector(".popup-content-wrap");
  if (!contentWrap) return;
  contentWrap.innerHTML = "";

  const fallbackTitle = document.createElement("div");
  fallbackTitle.classList.add("popup-title");
  fallbackTitle.textContent = "Are you sure?";
  contentWrap.appendChild(fallbackTitle);

  const subText = document.createElement("div");
  subText.classList.add("popup-subtext");
  subText.innerHTML = `You logged <strong>${userReps}</strong> reps instead of the suggested <strong>${exerciseObj.suggestedReps}</strong>.<br>` +
    `Based on this, we've calculated the best adjustments. Would you like to apply these changes?`;
  contentWrap.appendChild(subText);

  const fallbackBtnContainer = document.createElement("div");
  fallbackBtnContainer.classList.add("popup-button-container");

  const btnYes = document.createElement("button");
  const btnNo = document.createElement("button");

  btnYes.classList.add("popup-btn-easy");
  btnYes.textContent = "Yes, Please";
  btnNo.classList.add("popup-btn-hard");
  btnNo.textContent = "No, Thanks";

  btnYes.addEventListener("click", () => {
    console.log("[Popup Fallback] User chose YES => applying recommended changes");
    applyAWTChanges(exerciseObj, recommendation);
    setAWTShownForSet(currentWeekIndex, currentDayIndex, exerciseObj.name, currentSetIndex);
    closePerformancePopup(() => {
      if (exerciseObj.rest) {
        console.log("[Popup Fallback] Starting rest timer after 'Yes, Please'.");
        if (restTimerDelayTimeout) {
          clearTimeout(restTimerDelayTimeout);
          restTimerDelayTimeout = null;
          console.log("[Pop-up logic] Cleared delayed timer so it won't re-fire.");
        }
        startRestTimerImmediately(recommendation.restTime);
      }
      renderWorkoutDisplay();
      const newExerciseRow = document.querySelector(
        `[data-exercise-key="exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}"]`
      );
      if (newExerciseRow) {
        const newDetails = newExerciseRow.querySelector(".exercise-details");
        const newExerciseCheckbox = newExerciseRow.querySelector(".exercise-checkbox");
        autoCheckExerciseIfAllSets(newExerciseCheckbox, newDetails);
        // autoCheckDayIfAllExercisesAreChecked();
      }
    });
  });

  btnNo.addEventListener("click", () => {
    console.log("[Popup Fallback] User chose NO => retaining manual override and resetting UI");
    closePerformancePopup(() => {
      if (exerciseObj.rest) {
        console.log("[Popup Fallback] Starting rest timer after 'No, Thanks' with old rest time:", exerciseObj.rest);
        const oldRest = parseInt(exerciseObj.rest, 10) || 45;
        startRestTimerImmediately(oldRest);
      }

      // Re-render so that your manually saved actualWeight shows up again,
      // and so that any cascadeSuggestedWeightForward from your blur has taken effect
      renderWorkoutDisplay();

      // Re-select the refreshed elements and re-run the auto-checkers
      const newExerciseRow = document.querySelector(
        `[data-exercise-key="exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}"]`
      );
      if (newExerciseRow) {
        const newDetails = newExerciseRow.querySelector(".exercise-details");
        const newExerciseCheckbox = newExerciseRow.querySelector(".exercise-checkbox");
        autoCheckExerciseIfAllSets(newExerciseCheckbox, newDetails);
        // autoCheckDayIfAllExercisesAreChecked();
      }
      updateWeeklyTotals();
    });
  });

  fallbackBtnContainer.appendChild(btnYes);
  fallbackBtnContainer.appendChild(btnNo);
  contentWrap.appendChild(fallbackBtnContainer);
}

// Actually apply the recommended changes to the exercise object 
// & save them to localStorage so future sets/workouts see them
function applyAWTChanges(exerciseObj, recommendation) {
  const oldWeight = getCurrentSuggestedWeight(exerciseObj);
  console.log(`[applyAWTChanges] Called for ${exerciseObj.name}. 
    oldWeight=${oldWeight}, newWeight=${recommendation.newWeight}, newReps=${recommendation.suggestedReps}`);

  // Update the exercise-level fields (in-memory)
  exerciseObj.suggestedReps = recommendation.suggestedReps;
  exerciseObj.suggestedWeight = recommendation.newWeight;
  exerciseObj.rest = recommendation.restTime.toString();

  // 1) Clear future suggested weights so progressive overload recalculates from new baseline
  const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
  clearFutureSuggestedWeights(exerciseObj.name, currentWeekNumber, purchasedWeeks);

  // 2) Also store the new suggestions in localStorage for *all* sets in this day that don't have an "actualWeight"/"actualReps" override
  const dayNumber = currentDayIndex + 1;
  const totalSets = exerciseObj.sets || 1;
  for (let s = 1; s <= totalSets; s++) {
    const actualWKey = getSetStorageKey(exerciseObj.name, currentWeekNumber, dayNumber, s, "actualWeight");
    if (!localStorage.getItem(actualWKey)) {
      const suggWKey = getSetStorageKey(exerciseObj.name, currentWeekNumber, dayNumber, s, "suggestedWeight");
      localStorage.setItem(suggWKey, recommendation.newWeight.toString());
    }
    const actualRepsKey = getSetStorageKey(exerciseObj.name, currentWeekNumber, dayNumber, s, "actualReps");
    if (!localStorage.getItem(actualRepsKey)) {
      const suggRepsKey = getSetStorageKey(exerciseObj.name, currentWeekNumber, dayNumber, s, "suggestedReps");
      localStorage.setItem(suggRepsKey, recommendation.suggestedReps);
    }
  }

  // 3) Cascade the new weight to subsequent sets that do not have a user override
  cascadeWeightWithinCurrentWorkout(exerciseObj, recommendation.newWeight);

  // 4) Cascade the new rep range
  cascadeRepsWithinCurrentWorkout(exerciseObj, recommendation.suggestedReps);

  // 5) Optionally finalize the new weight as the future PO baseline if the last set isn’t user-overridden
  const lastSetIndex = totalSets;
  // const dayNumber = currentDayIndex + 1;
  finalizeLastSetAsBaseline(
    exerciseObj,
    recommendation.newWeight,
    currentWeekNumber,
    purchasedWeeks,
    dayNumber
  );

  // 6) Finally, refresh placeholders so the new weight & rep range show in the UI
  refreshSetPlaceholdersForExercise(exerciseObj);
}

/**
 * cascadeWeightWithinCurrentWorkout(exerciseObj, newWeight)
 * - Updates localStorage for all subsequent sets in the current Day
 *   to show the new suggestedWeight, _unless_ a user typed an actualWeight override.
 */
function cascadeWeightWithinCurrentWorkout(exerciseObj, newWeight) {
  console.log(`[cascadeWeightWithinCurrentWorkout] Updating subsequent sets in the same workout to weight=${newWeight}`);
  const currentWeekData = twelveWeekProgram[currentWeekIndex];
  if (!currentWeekData) return;

  const dayData = currentWeekData.days[currentDayIndex];
  if (!dayData) return;

  // Check warmUp, mainWork, coolDown, exercises
  const sections = ["warmUp", "mainWork", "coolDown", "exercises"];
  for (let sectionKey of sections) {
    if (Array.isArray(dayData[sectionKey])) {
      for (let exItem of dayData[sectionKey]) {
        if (exItem.name === exerciseObj.name) {
          // Found the matching exercise object in the day data
          const totalSets = exItem.sets || 1;
          for (let sIndex = 1; sIndex <= totalSets; sIndex++) {
            // If there's a user override for actualWeight, skip
            const actualWeightKey = getSetStorageKey(exItem.name, currentWeekData.week, currentDayIndex + 1, sIndex, "actualWeight");
            if (localStorage.getItem(actualWeightKey)) {
              continue; // user typed a manual weight => skip
            }
            // Otherwise, update the localStorage "suggestedWeight"
            const suggWeightKey = getSetStorageKey(exItem.name, currentWeekData.week, currentDayIndex + 1, sIndex, "suggestedWeight");
            console.log(`   [cascadeWeight] localStorage["${suggWeightKey}"] = ${newWeight}`);
            localStorage.setItem(suggWeightKey, newWeight.toString());
          }
        }
      }
    }
  }
}

function cascadeRepsWithinCurrentWorkout(exerciseObj, newRepRange) {
  console.log(`[cascadeRepsWithinCurrentWorkout] Updating subsequent sets in the same workout to repRange="${newRepRange}"`);
  const currentWeekData = twelveWeekProgram[currentWeekIndex];
  if (!currentWeekData) return;

  const dayData = currentWeekData.days[currentDayIndex];
  if (!dayData) return;

  const sections = ["warmUp", "mainWork", "coolDown", "exercises"];
  for (let sectionKey of sections) {
    if (Array.isArray(dayData[sectionKey])) {
      for (let exItem of dayData[sectionKey]) {
        if (exItem.name === exerciseObj.name) {
          const totalSets = exItem.sets || 1;
          for (let sIndex = 1; sIndex <= totalSets; sIndex++) {
            // If there's an actualReps typed by the user, skip overriding.
            const actualRepsKey = getSetStorageKey(exItem.name, currentWeekData.week, currentDayIndex + 1, sIndex, "actualReps");
            if (localStorage.getItem(actualRepsKey)) {
              continue; // user typed actual reps => skip
            }
            // Otherwise, store the new recommended rep range as "suggestedReps"
            // so we can read it in refreshSetPlaceholdersForExercise
            const suggRepsKey = getSetStorageKey(exItem.name, currentWeekData.week, currentDayIndex + 1, sIndex, "suggestedReps");
            console.log(`   [cascadeReps] localStorage["${suggRepsKey}"] = "${newRepRange}"`);
            localStorage.setItem(suggRepsKey, newRepRange);
          }
        }
      }
    }
  }
}

// Close & remove the pop-up from DOM
function closePerformancePopup(callback) {
  // clear the schedule if it’s still waiting
  if (performancePopupSchedule) {
    clearTimeout(performancePopupSchedule);
    performancePopupSchedule = null;
  }
  // clear the countdown timer
  if (performancePopupTimer) {
    clearInterval(performancePopupTimer);
    performancePopupTimer = null;
  }
  fallbackYesNoActive = false;

  const popup = document.getElementById("performancePopup");
  if (!popup) {
    if (callback) callback();
    return;
  }
  // Remove the "visible" class to trigger the fade-out animation.
  popup.classList.remove("visible");
  setTimeout(() => {
    if (popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
    console.log("[Popup] Pop-up closed.");
    if (callback) callback();
  }, 500);
}

function showCapPopup(type) {
  let message = "";
  if (type === "rep") {
    message = "The rep value cannot exceed 50. Please enter a value of 50 or below.";
  } else if (type === "weight") {
    message = "The weight value cannot exceed 500 kg. Please enter a value of 500 kg or below.";
  } else if (type === "both") {
    message =
      "The rep value cannot exceed 50 and the weight value cannot exceed 500 kg. Please adjust your inputs accordingly.";
  }

  // Create the pop-up element using the provided id from your CSS.
  const popup = document.createElement("div");
  popup.id = "performancePopup"; // <-- Match the CSS id!
  // (No further classes are needed unless you want additional ones)

  // Build the inner content using your provided structure.
  const contentWrap = document.createElement("div");
  contentWrap.classList.add("popup-content-wrap");

  // Title row
  const titleEl = document.createElement("div");
  titleEl.classList.add("popup-title");
  titleEl.textContent = "Input Error";
  contentWrap.appendChild(titleEl);

  // Message (subtext)
  const subtextEl = document.createElement("div");
  subtextEl.classList.add("popup-subtext");
  subtextEl.textContent = message;
  contentWrap.appendChild(subtextEl);

  // Button container with a Close button
  const btnContainer = document.createElement("div");
  btnContainer.classList.add("popup-button-container");

  const closeBtn = document.createElement("button");
  closeBtn.classList.add("popup-btn-gray");
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", () => {
    popup.classList.remove("visible");
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 300);
  });
  btnContainer.appendChild(closeBtn);

  contentWrap.appendChild(btnContainer);
  popup.appendChild(contentWrap);

  // Append the popup directly to the body so fixed positioning works as expected.
  document.body.appendChild(popup);

  // Use requestAnimationFrame to ensure the element is rendered before adding the class,
  // which will trigger the slide-up animation from the bottom.
  requestAnimationFrame(() => {
    popup.classList.add("visible");
  });
}

/**************************************************************/
/*      Weekly Recap & Areas for Improvement                  */
/**************************************************************/



/****************************************************************************
 *  TODAY’S TIP FEATURE
 ****************************************************************************/

function showTodaysTipIfAny() {
  const tipHeading = document.getElementById("todaysTipHeading");
  const tipCard = document.getElementById("todaysTipCard");
  if (!tipHeading || !tipCard) return;

  // Get today's date in YYYY-MM-DD format.
  const todayDateStr = new Date().toISOString().slice(0, 10);
  // Use Workout Tracker–specific keys.
  const storedTipDate = localStorage.getItem("todaysTipDate_WT");
  let tip;

  if (storedTipDate === todayDateStr) {
    // Tip already generated today—use the stored tip.
    tip = localStorage.getItem("todaysTip_WT");
  } else {
    // Decide whether to pick a generic tip (70%) or goal-specific tip (30%).
    const useGoalSpecific = Math.random() < 0.30;
    const userGoal = localStorage.getItem("goal") || "Weight Loss";
    let tipArray;

    if (useGoalSpecific) {
      "Form first, weight second — clean reps lead to real results.",
        "Small improvements over time beat random intensity. Stick with the plan.",
        "Recovery is where the growth happens — don’t skip your rest days.",
        "Don’t fear deloads — your body needs time to consolidate gains.",
        "A strong warm-up sets the tone for a better session — take it seriously.",
        "Track your workouts like you track your meals — data drives progress.",
        "If your energy is low, lower the volume — showing up still counts.",
        "Sleep is a performance tool — aim for 7–9 hours to recover properly.",
        "Even 20-minute workouts count — never underestimate consistency.",
        "Training isn’t just about doing more — it’s about doing better over time.",
        "Your body won’t always feel 100%, but showing up builds momentum.",
        "Progress isn’t always visible — trust the process and the work you’re putting in.",
        "Be patient with plateaus — they often come right before a breakthrough.",
        "Training with purpose beats training randomly — follow the plan, not the mood.",
        "Improvement is the goal — not perfection. Keep showing up."
      const weightLossTips = [
        "Lifting while losing fat helps preserve muscle and shape — don’t skip strength work!",
        "More isn’t always better — overtraining while dieting can increase fatigue. Balance matters.",
        "Even if fat loss is your goal, progressive overload should still guide your training.",
        "You burn calories after your workout too — especially with resistance training.",
        "Short on time? A 30-minute strength session is still valuable — consistency beats perfection.",
        "Strength gains are still possible in a deficit — especially if you're newer to lifting.",
        "Prioritize sleep and recovery — fat loss is harder when you’re chronically tired.",
        "Don't worry if strength plateaus slightly while dieting — holding ground is still a win.",
        "Walks and strength sessions pair perfectly for fat loss — aim for both each week.",
        "Focus on getting stronger, even slowly — it keeps your metabolism higher while cutting."
      ];
      const muscleGainTips = [
        "Train with intent — mind-muscle connection matters, especially in higher-rep sets.",
        "Track your lifts — if the numbers are going up, you’re on the right track.",
        "Muscle is built through progressive overload — increase reps, sets, or weight weekly.",
        "Don’t neglect rest between sets — recovering fully helps maximize hypertrophy.",
        "You don’t grow in the gym — you stimulate growth, then recover to actually build.",
        "Compound lifts are your foundation — squat, press, pull, and hinge every week.",
        "Start each session with your hardest lift — fresh energy builds more muscle.",
        "Train close to failure — those last reps matter most for muscle growth.",
        "Make your last set your best — finish strong to drive adaptation.",
        "Log your reps and sets — muscle gain is easier when progress is tracked."
      ];
      const recompTips = [
        "Recomp progress is slow but real — strength gains with stable weight = success.",
        "Progressive overload remains king — keep adding weight or reps each week.",
        "Track your lifts just like your meals — performance drives body change.",
        "Train hard, recover harder — recovery is just as critical in a recomp phase.",
        "Focus on execution, not just numbers — cleaner form = better results over time.",
        "You can’t out-train poor recovery — don’t skip rest days.",
        "Monitor your top sets — are you lifting more this month than last?",
        "Strength PRs without scale weight changes? That’s recomposition magic.",
        "In a recomp, the gym isn’t just for burning calories — it's where you reshape.",
        "Keep a steady routine — your body thrives on repeated signals."
      ];

      // Choose tip array based on goal.
      if (userGoal === "Muscle Gain") {
        tipArray = muscleGainTips;
      } else if (userGoal === "Improve Body Composition") {
        tipArray = recompTips;
      } else {
        tipArray = weightLossTips;
      }
    } else {
      // Otherwise, use the generic tip array.
      // (Assuming generalTrainingTips is declared elsewhere.)
      tipArray = generalTrainingTips;
    }

    tip = tipArray[Math.floor(Math.random() * tipArray.length)];
    localStorage.setItem("todaysTip_WT", tip);
    localStorage.setItem("todaysTipDate_WT", todayDateStr);
  }

  // Display the tip.
  tipHeading.style.display = "block";
  tipCard.style.display = "block";
  tipCard.textContent = tip;
}

/**
 * Show a randomized "Coach Insight" (Body Composition version) under 
 * #bodyCompCoachInsightsHeading and #bodyCompCoachInsightsContainer, once per day.
 */
function showBodyCompCoachInsights() {
  const headingEl = document.getElementById("bodyCompCoachInsightsHeading");
  const containerEl = document.getElementById("bodyCompCoachInsightsContainer");
  const messageEl = document.getElementById("bodyCompCoachInsightsMessage");
  if (!headingEl || !containerEl || !messageEl) return;

  // 1) Check if user even has a current goal or any logs.
  const userGoal = localStorage.getItem("goal") || "Weight Loss";
  const bodyWeightLogs = JSON.parse(localStorage.getItem("bodyWeightLogs") || "[]");
  if (bodyWeightLogs.length === 0) {
    headingEl.style.display = "none";
    containerEl.style.display = "none";
    return;
  }

  // 2) We used to do a daily date check here, but we removed it so we can refresh insights 
  //    whenever a new milestone or updated weight is logged.

  // 3) We'll still generate a random type of insight:
  const randomType = Math.floor(Math.random() * 4) + 1;
  let insightText = "";

  switch (randomType) {
    case 1:
      insightText = getGoalTimelineTrackingInsight();
      break;
    case 2:
      insightText = getWeightStagnationInsight(userGoal, bodyWeightLogs);
      break;
    case 3:
      insightText = getLoggingBehaviorInsight();
      break;
    case 4:
      insightText = getMilestoneHighlightInsight(userGoal, bodyWeightLogs);
      break;
  }

  if (!insightText) {
    // If no particular insight triggered, use a generic fallback
    insightText = "Keep going! Consistency unlocks results.";
  }

  headingEl.style.display = "block";
  containerEl.style.display = "block";
  messageEl.textContent = insightText;

  // 4) We may still store the final text to localStorage if you like, 
  //    but we’re NOT blocking re-generation by date:
  localStorage.setItem("bodyCompCoachInsightDate", ""); // or remove it entirely
  localStorage.setItem("bodyCompCoachInsightMessage", insightText);
}

/** 
 *  (Type 1) Goal Timeline Tracking
 *   We compare userGoalDate vs. a projected date, or see if user is behind.
 *   For simplicity, we use your “estimatedGoalDate” from the code that updates 
 *   #estimatedGoalDate, then compute the difference in days. 
 */
function getGoalTimelineTrackingInsight() {
  const userGoalDate = localStorage.getItem("userGoalDate"); // "YYYY-MM-DD"
  const estimated = document.getElementById("estimatedGoalDate")?.textContent || "-";
  if (!userGoalDate || !estimated || estimated === "-") return "";

  try {
    const gDate = new Date(userGoalDate);
    const eDate = new Date(estimated + " 00:00:00"); // parse the displayed text if it’s e.g. "28 Mar 2025"
    // If we can’t parse, return
    if (isNaN(gDate.getTime()) || isNaN(eDate.getTime())) return "";

    const diffDays = Math.floor((eDate - gDate) / (1000 * 60 * 60 * 24));
    const formatDate = (d) => d.toDateString().slice(4); // e.g. "Mar 28 2025"

    if (diffDays <= 0) {
      // On track or ahead
      return `You're on track to reach your goal ahead of schedule — projected by ${formatDate(eDate)}. Great job!`;
    } else if (diffDays <= 10) {
      return `You're projected to reach your goal by ${formatDate(eDate)} — just ${diffDays} days late. Consider slightly reducing calories or increasing steps.`;
    } else {
      return `You're falling behind your goal. At this pace, you'll reach it by ${formatDate(eDate)} — ${diffDays} days late. Try tightening your routine or updating your goal date.`;
    }
  } catch (err) {
    return "";
  }
}

/** 
 *  (Type 2) Weight Stagnation or Unexpected Trends 
 *    We detect events like “No change for 2+ weeks,” “Rapid gain,” etc. 
 *    This is a minimal example that checks the last 2-3 logs. 
 */
function getWeightStagnationInsight(userGoal, logs) {
  if (logs.length < 2) return "";

  // Sort logs by date
  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  // Compare the earliest vs. latest in a 2+ week range, or just do a direct check:
  const lastEntry = sorted[sorted.length - 1];
  const secondLast = sorted[sorted.length - 2];

  const weightDiff = lastEntry.weight - secondLast.weight;
  const dayDiff = (new Date(lastEntry.date) - new Date(secondLast.date)) / (1000 * 60 * 60 * 24);

  // If they weigh the same across 14+ days => plateau
  if (Math.abs(weightDiff) < 0.1 && dayDiff >= 14) {
    if (userGoal === "Weight Loss") {
      return "Weight has plateaued for 2+ weeks — you may want to slightly lower calories or increase NEAT.";
    } else if (userGoal === "Muscle Gain") {
      return "Your weight hasn’t changed for 2+ weeks — consider increasing calories slightly to keep progressing.";
    } else {
      return "Weight stability is expected during a recomp. Focus on performance & consistency!";
    }
  }
  // For a “rapid” weekly change, check if > 1kg in ~7 days
  if (dayDiff <= 9 && Math.abs(weightDiff) >= 1) {
    const goingUp = weightDiff > 0;
    if (userGoal === "Weight Loss") {
      if (goingUp) {
        return "Your weight is rising despite aiming to lose weight — review food tracking, sodium, and sleep.";
      } else {
        return "That’s a big drop — fast progress feels great, but be mindful of sustainability.";
      }
    } else if (userGoal === "Muscle Gain") {
      if (!goingUp) {
        return "Significant weight loss wasn’t expected — review your calorie intake and recovery.";
      } else {
        return "Big gains this week — make sure it’s not just bloat. Focus on quality food, not just quantity.";
      }
    } else {
      // Improve Body Composition 
      if (!goingUp) {
        return "Quick weight drop can happen — keep an eye on energy levels and performance.";
      } else {
        return "Weight gain isn’t uncommon in recomp phases — check your lifts’ progress.";
      }
    }
  }

  // If no condition triggered
  return "";
}

/** 
 *  (Type 3) Logging Behavior 
 *    Example checks how many times user logged weight in the last 7 days.
 */
function getLoggingBehaviorInsight() {
  const logs = JSON.parse(localStorage.getItem("bodyWeightLogs") || "[]");
  if (logs.length === 0) return "";

  // Count how many logs are within the last 7 days
  const now = new Date();
  let weeklyCount = 0;
  logs.forEach(entry => {
    const logDate = new Date(entry.date);
    if ((now - logDate) <= 7 * 86400000) {
      weeklyCount++;
    }
  });

  if (weeklyCount === 0) {
    return "No logs this week — don’t forget to log your weight for accurate tracking!";
  } else if (weeklyCount === 1) {
    return "Only 1 log this week — try to log at least 2–3x per week for better accuracy.";
  } else if (weeklyCount >= 3) {
    return "Great consistency — logging your weight 3+ times weekly improves accuracy!";
  }
  return ""; // If 2 logs, no specific message
}

/** 
 *  (Type 4) Milestone Highlights 
 *    Check for partial progress (25%, 50%, 75%) or new lowest/highest weight, etc.
 */
/** 
 *  (Type 4) Milestone Highlights 
 *    Check for partial progress (25%, 50%, 75%) or new lowest/highest weight, etc.
 */
function getMilestoneHighlightInsight(userGoal, logs) {
  if (logs.length < 2) return "";

  // 4a) Check 25%/50%/75% of user’s weight-difference goal
  const startWeight = parseFloat(localStorage.getItem("weight") || "70");
  const goalWeight = parseFloat(localStorage.getItem("userGoalWeight") || startWeight);
  const currentWeight = parseFloat(localStorage.getItem("userCurrentWeight") || startWeight);
  if (startWeight === goalWeight) return "";

  const totalDiffNeeded = Math.abs(goalWeight - startWeight);
  let progressSoFar = Math.abs(currentWeight - startWeight);
  if (userGoal === "Weight Loss" && (currentWeight > startWeight)) {
    // if they moved in the wrong direction for weight loss, skip
    progressSoFar = 0;
  }
  if (userGoal === "Muscle Gain" && (currentWeight < startWeight)) {
    progressSoFar = 0;
  }

  const ratio = (progressSoFar / totalDiffNeeded);
  const milestonePct = Math.round(ratio * 100); // e.g. 50 => 50%

  if (milestonePct >= 25 && milestonePct < 30) {
    return "You've completed 25% of your goal — off to a solid start!";
  } else if (milestonePct >= 50 && milestonePct < 60) {
    return "You've completed 50% of your goal — you're halfway there!";
  } else if (milestonePct >= 75 && milestonePct < 85) {
    return "You've completed 75% of your goal — the finish line is in sight!";
  }

  // 4b) New lowest / highest weight 
  // Sort logs from lowest to highest 
  const sortedAsc = [...logs].sort((a, b) => a.weight - b.weight);
  const minWeight = sortedAsc[0].weight;
  const sortedDesc = [...logs].sort((a, b) => b.weight - a.weight);
  const maxWeight = sortedDesc[0].weight;
  const latestWeight = logs[logs.length - 1].weight;

  if (latestWeight === minWeight && userGoal === "Weight Loss") {
    return "You've hit a new lowest weight — incredible work!";
  }
  if (latestWeight === maxWeight && userGoal === "Muscle Gain") {
    return "You've hit a new highest weight — great job packing on mass!";
  }
  if (latestWeight === minWeight && userGoal === "Improve Body Composition") {
    return "New lowest scale reading — keep focusing on performance & visuals for a true recomp!";
  }
  if (latestWeight === maxWeight && userGoal === "Improve Body Composition") {
    return "New highest scale reading — remember, recomps can see small fluctuations. Check measurements & strength!";
  }

  // 4c) Maintained same weight for 2+ weeks => for "Improve Body Composition"
  if (userGoal === "Improve Body Composition") {
    // Define a small tolerance (in kg) to account for minor fluctuations
    const tolerance = 0.1;
    // Sort logs chronologically
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const lastLog = sortedLogs[sortedLogs.length - 1];
    // Find a log at least 14 days older than the last log
    let log14DaysAgo = sortedLogs.find(log => {
      const diffDays = (new Date(lastLog.date) - new Date(log.date)) / (1000 * 60 * 60 * 24);
      return diffDays >= 14;
    });
    if (log14DaysAgo && Math.abs(lastLog.weight - log14DaysAgo.weight) < tolerance) {
      return "Stable weight for 2+ weeks — ideal for recomposition!";
    }
  }

  // If no condition triggered
  return "";
}

/********************************************************************
 * Section 90 - "Workout Recap" Popup
 ********************************************************************/

function showWorkoutRecapPopup(weekIndex, dayIndex, mode = "finish") {
  // Remove any existing popup DOM
  const existing = document.getElementById("workoutRecapPopup");
  if (existing) existing.remove();

  // Gather day-level stats (computed from localStorage)
  const stats = getDayStats(weekIndex, dayIndex);

  // Select a recap message based on the completion percentage
  const completion = stats.completionPct || 0;
  const completionMessagesAbove70 = [
    { title: "Great Work", message: "Your consistency is paying off." },
    { title: "Well Done", message: "You’re building serious momentum." },
    { title: "Crushed It", message: "That session really pushed you forward." },
    { title: "Strong Session", message: "Every rep is bringing you closer to your goals." },
    { title: "You Showed Up", message: "And it’s paying off big time." },
    { title: "Nice One!", message: "You’re setting the standard for yourself." },
    { title: "You’re On Track", message: "Keep stacking those wins." },
    { title: "Another One Done", message: "Consistency is your secret weapon." },
    { title: "Momentum Looks Good", message: "Stay in this rhythm — it’s working." },
    { title: "Good Work", message: "That was a solid session. Keep going!" }
  ];
  const completionMessagesBelow70 = [
    { title: "Still Progress", message: "Showing up matters — you did that." },
    { title: "One Step Closer", message: "Even a partial session keeps the habit alive." },
    { title: "You Made Time", message: "That’s more than most would do today." },
    { title: "Not Every Day Is Perfect", message: "But effort like this still counts." },
    { title: "You’re Still In It", message: "That’s a win in itself." },
    { title: "It All Adds Up", message: "Small efforts build big results." },
    { title: "You Didn’t Quit", message: "That’s a win in itself." },
    { title: "Proud of You", message: "Especially on the tough days." },
    { title: "It Was Enough Today", message: "Some progress is always better than none." },
    { title: "You Showed Up", message: "Keep going — better days are coming." }
  ];
  const chosenArray = (completion >= 70) ? completionMessagesAbove70 : completionMessagesBelow70;
  const pick = chosenArray[Math.floor(Math.random() * chosenArray.length)];

  // Determine if we are on a small screen.
  // HOWEVER, if mode is "summary", always show the normal layout.
  const isSmallScreen = (mode === "summary") ? false : (window.innerWidth <= 375);

  // Begin building the popup HTML content.
  let popupHTML = `<div class="popup-content-wrap">`;

  // On larger screens (or forced normal), add the title and message.
  if (!isSmallScreen) {
    // Only add them for finish or summary modes.
    if (mode === "finish" || mode === "summary") {
      popupHTML += `<div class="popup-title">${pick.title}</div>
                    <div class="popup-subtext">${pick.message}</div>`;
    }
  }

  // Common recap data block (appears on all screens)
  popupHTML += `
    <div style="width: 100%; text-align:center; margin: 5px; background: #EDE7DB; padding: 12px; border-radius: 5px; border: 1px solid #D8CFC0;">
      <div><strong>🔥 Workout Completion</strong><br>${stats.completionPct}%</div>
      <br>
      <div><strong>🚀 Top Lift</strong><br>${stats.topLiftName}</div>
      <br>
      <div><strong>🏋️ Total Weight</strong><br>${formatWeight(stats.totalWeight)}</div>
      <br>
      <div><strong>📈 Total Sets</strong><br>${stats.totalSets}</div>
      <br>
      <div><strong>💪 Total Reps</strong><br>${stats.totalReps}</div>
    </div>
  `;

  // For finish mode, place "How was your workout?" heading with extra margin at the top of the buttons.
  if (mode === "finish") {
    popupHTML += `<h4 style="margin-top: 0; margin-bottom:10px; font-size:1.1rem;">How was your workout?</h4>`;
  }

  // Build the button container (common to both modes)
  popupHTML += `<div class="popup-button-container recap-question-buttons" id="recapWorkoutFeelBtns"></div>`;
  popupHTML += `</div>`; // Close .popup-content-wrap

  // Create and append the popup element
  const popup = document.createElement("div");
  popup.id = "workoutRecapPopup";
  popup.innerHTML = popupHTML;
  document.body.appendChild(popup);

  // Animate in the popup
  requestAnimationFrame(() => {
    popup.classList.add("visible");
  });

  // Build button contents based on the mode.
  const finalBtnContainer = popup.querySelector("#recapWorkoutFeelBtns");
  finalBtnContainer.innerHTML = "";

  if (mode === "finish") {
    // For finishing the workout (show 3 state buttons if AWT purchased)
    if (hasPurchasedAWT) {
      const posBtn = document.createElement("button");
      posBtn.classList.add("popup-btn-easy");
      posBtn.textContent = getRandomItem(workoutPositiveResponses);
      posBtn.addEventListener("click", () => {
        closeRecapPopup(weekIndex, dayIndex);
        setRecapShown(weekIndex, dayIndex, true);
      });

      const okBtn = document.createElement("button");
      okBtn.classList.add("popup-btn-fine");
      okBtn.textContent = getRandomItem(workoutOkayResponses);
      okBtn.addEventListener("click", () => {
        closeRecapPopup(weekIndex, dayIndex);
        setRecapShown(weekIndex, dayIndex, true);
      });

      const negBtn = document.createElement("button");
      negBtn.classList.add("popup-btn-hard");
      negBtn.textContent = getRandomItem(workoutNegativeResponses);
      negBtn.addEventListener("click", () => {
        closeRecapPopup(weekIndex, dayIndex);
        setRecapShown(weekIndex, dayIndex, true);
      });

      finalBtnContainer.appendChild(posBtn);
      finalBtnContainer.appendChild(okBtn);
      finalBtnContainer.appendChild(negBtn);
    } else {
      // Fallback for non-AWT users in finish mode: show just a Close button.
      const closeBtn = document.createElement("button");
      closeBtn.classList.add("popup-btn-gray");
      closeBtn.textContent = "Close";
      closeBtn.addEventListener("click", () => {
        closeRecapPopup(weekIndex, dayIndex);
      });
      finalBtnContainer.appendChild(closeBtn);
    }
  } else if (mode === "summary") {
    // In summary mode, always show a single Close button.
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("popup-btn-gray");
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", () => {
      closeRecapPopup(weekIndex, dayIndex);
    });
    finalBtnContainer.appendChild(closeBtn);
  }
}

function closeRecapPopup(weekIdx, dayIdx) {
  const recapEl = document.getElementById("workoutRecapPopup");
  if (recapEl) {
    recapEl.classList.remove("visible");
    setTimeout(() => recapEl.remove(), 300);
  }
  // Mark that the recap was shown, so we can hide the summary button if desired
  setRecapShown(weekIdx, dayIdx, true);

  // Re-render to show the "Summary" button or remove it, etc.
  renderWorkoutDisplay();
}

function getDayStats(weekIdx, dayIdx) {
  const program = JSON.parse(localStorage.getItem("twelveWeekProgram") || "[]");
  const checkboxState = JSON.parse(localStorage.getItem("checkboxState") || "{}");
  if (!program[weekIdx] || !program[weekIdx].days[dayIdx]) {
    return { completionPct: 0, topLiftName: 'N/A', totalWeight: 0, totalSets: 0, totalReps: 0 };
  }

  const dayData = program[weekIdx].days[dayIdx];

  let setsPlanned = 0;
  let setsCompleted = 0;
  let totalWeight = 0;
  let totalReps = 0;
  let heaviestWeight = 0;    // track the single heaviest set
  let heaviestExercise = ""; // name of the exercise with that heaviest set

  // Go through warmUp, mainWork, coolDown, or if your data calls it dayData.exercises
  const sections = ["warmUp", "mainWork", "coolDown", "exercises"];
  sections.forEach(sectionKey => {
    if (!Array.isArray(dayData[sectionKey])) return;

    dayData[sectionKey].forEach(exItem => {
      // Some items may themselves have a `.exercises` array (if it's a “block”).
      // We'll flatten so we always process exercise objects.
      const toProcess = (exItem.exercises && Array.isArray(exItem.exercises))
        ? exItem.exercises
        : [exItem];

      toProcess.forEach(ex => {
        const exName = ex.name;
        const plannedSets = ex.sets || 0;

        for (let s = 1; s <= plannedSets; s++) {
          setsPlanned++;

          // The set checkbox might look like:
          //   "set_0_1_Assisted Pull-Ups_2"
          //   "set_{weekIdx}_{dayIdx}_{exName}_{setNumber}"
          const setKey = `set_${weekIdx}_${dayIdx}_${exName}_${s}`;
          if (checkboxState[setKey]) {
            setsCompleted++;

            // If checked, load “actualWeight” & “actualReps” from localStorage
            // We assume your getSetStorageKey or a similar naming scheme:
            const weightKey = `${exName.toLowerCase().replaceAll(" ", "_")}_week${weekIdx + 1}_day${dayIdx + 1}_set${s}_actualWeight`;
            const repsKey = `${exName.toLowerCase().replaceAll(" ", "_")}_week${weekIdx + 1}_day${dayIdx + 1}_set${s}_actualReps`;

            const wVal = parseFloat(localStorage.getItem(weightKey) || "0");
            const rVal = parseInt(localStorage.getItem(repsKey) || "0");

            totalWeight += (wVal * rVal);
            totalReps += rVal;

            if (wVal > heaviestWeight) {
              heaviestWeight = wVal;
              heaviestExercise = exName;
            }
          }
        }
      });
    });
  });

  let completionPct = 0;
  if (setsPlanned > 0) {
    completionPct = Math.round((setsCompleted / setsPlanned) * 100);
  }

  return {
    completionPct,
    topLiftName: (heaviestWeight > 0) ? heaviestExercise : "N/A",
    totalWeight,
    totalSets: setsCompleted,
    totalReps
  };
}

/** Example stubs for day-level calculations (replace with your actual logic) **/
function calculateDayCompletionPercentage(weekIdx, dayIdx) {
  // e.g. “(completed sets / total sets) * 100”
  // or use your existing day-level logic
  return 80; // example
}
function findTopLiftForDay(weekIdx, dayIdx) { return "Barbell Squat"; }
function findTotalWeightForDay(weekIdx, dayIdx) { return 500; }
function findTotalSetsForDay(weekIdx, dayIdx) { return 36; }
function findTotalRepsForDay(weekIdx, dayIdx) { return 120; }

/*******************************************************
 * A) SHOW CHANGE EXERCISE POPUP & HANDLER
 *******************************************************/

// Helper: Looks up an exercise object by name from a global array (adjust as needed)
function getExerciseByName(name) {
  if (window.allExercises && Array.isArray(window.allExercises)) {
    return window.allExercises.find(
      exObj => exObj.name.toLowerCase() === name.toLowerCase()
    );
  }
  return null;
}

function showChangeExercisePopup(ex, details, exerciseRow) {
  // 1) Remove existing pop-up if present
  const existing = document.getElementById("changeExercisePopup");
  if (existing) {
    existing.remove();
  }

  console.log("[showChangeExercisePopup] Called with ex =", ex);

  // 2) Build the container
  const popup = document.createElement("div");
  popup.id = "changeExercisePopup";

  // The inner wrap
  const wrap = document.createElement("div");
  wrap.classList.add("popup-content-wrap");

  // 3) Title + subtext
  const titleEl = document.createElement("div");
  titleEl.classList.add("popup-title");
  titleEl.textContent = "Here’s what we suggest for you 👇";
  wrap.appendChild(titleEl);

  const subtextEl = document.createElement("div");
  subtextEl.classList.add("popup-subtext");
  subtextEl.innerHTML =
    "💪 These are equally effective options if you feel like switching things up today.";
  wrap.appendChild(subtextEl);

  // 4) Search container + input
  const searchContainer = document.createElement("div");
  searchContainer.classList.add("search-container");
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search for a suggested alternative…";
  searchContainer.appendChild(searchInput);
  wrap.appendChild(searchContainer);

  // 5) Build the suggestions list
  const altListContainer = document.createElement("div");
  altListContainer.classList.add("alternative-ex-list");

  // Retrieve the alternatives array from ex.alternativeExercises
  let altExercises = Array.isArray(ex.alternativeExercises)
    ? ex.alternativeExercises.slice()
    : [];

  console.log("[showChangeExercisePopup] raw altExercises (before filter) =", altExercises);

  // Filter out any alternative that matches the current exercise name
  altExercises = altExercises.filter(item => {
    let itemName = "";
    if (typeof item === "object" && item.name) {
      itemName = item.name;
    } else if (typeof item === "string") {
      itemName = item;
    }
    return itemName.toLowerCase() !== ex.name.toLowerCase();
  });

  console.log("[showChangeExercisePopup] altExercises (after filter) =", altExercises);

  // Convert items that are strings into objects using a lookup (if available)
  altExercises = altExercises.map(item => {
    if (typeof item === "string") {
      const lookup = getExerciseByName(item);
      if (lookup) {
        return lookup; // use the object with isTechnical, tutorialUrl, etc.
      } else {
        // If not found, return an object with default isTechnical value (adjust as needed)
        return { name: item, isTechnical: true, tutorialUrl: "" };
      }
    }
    return item;
  });

  // Check if at least one alternative has an isTechnical property
  const hasTechnicalFlag =
    altExercises.length > 0 &&
    altExercises.every(item => typeof item === "object" && "isTechnical" in item);
  console.log("[showChangeExercisePopup] hasTechnicalFlag =", hasTechnicalFlag);

  // Prepare arrays for grouping alternatives
  let easier = [];
  let harder = [];

  if (hasTechnicalFlag) {
    altExercises.forEach(item => {
      if (item.isTechnical === false) {
        easier.push(item);
      } else {
        harder.push(item);
      }
    });
    console.log("[showChangeExercisePopup] easier =", easier);
    console.log("[showChangeExercisePopup] harder =", harder);
  }

  const hasMix = easier.length > 0 && harder.length > 0;

  // Build the list (segmented if there is a mix)
  if (hasTechnicalFlag && hasMix) {
    // Easier Alternatives
    const easierHeader = document.createElement("div");
    easierHeader.classList.add("alt-ex-header");
    easierHeader.textContent = "Easier Alternatives";
    altListContainer.appendChild(easierHeader);

    easier.forEach(item => {
      const row = document.createElement("div");
      row.classList.add("alt-ex-item");
      row.dataset.tutorialUrl = item.tutorialUrl || "";
      row.textContent = item.name;
      altListContainer.appendChild(row);
    });

    // Other Great Options with extra class for top border styling
    const harderHeader = document.createElement("div");
    harderHeader.classList.add("alt-ex-header", "alt-ex-header--other");
    harderHeader.textContent = "Other Great Options";
    altListContainer.appendChild(harderHeader);

    harder.forEach(item => {
      const row = document.createElement("div");
      row.classList.add("alt-ex-item");
      row.dataset.tutorialUrl = item.tutorialUrl || "";
      row.textContent = item.name;
      altListContainer.appendChild(row);
    });
  } else {
    // If not a mix, simply list all alternatives
    altExercises.forEach(item => {
      const row = document.createElement("div");
      row.classList.add("alt-ex-item");
      row.dataset.tutorialUrl = item.tutorialUrl || "";
      row.textContent = item.name;
      altListContainer.appendChild(row);
    });
  }

  // Center the list container and ensure it matches the width of the search container
  altListContainer.style.width = "100%";
  altListContainer.style.margin = "0 auto";

  wrap.appendChild(altListContainer);

  // 6) Buttons row: "Watch Tutorial" (blue) and "Got It!" (gray)
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("popup-button-container");
  wrap.appendChild(buttonContainer);

  const watchBtn = document.createElement("button");
  watchBtn.textContent = "Watch Tutorial";
  watchBtn.classList.add("popup-btn-blue");
  watchBtn.disabled = true;
  buttonContainer.appendChild(watchBtn);

  const gotItBtn = document.createElement("button");
  gotItBtn.textContent = "Got It!";
  gotItBtn.classList.add("popup-btn-gray");
  buttonContainer.appendChild(gotItBtn);

  // 7) Insert everything and animate in
  popup.appendChild(wrap);
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.classList.add("visible");
  });

  // 8) Handle user selecting an item from the list
  let selectedTutorialUrl = "";
  altListContainer.addEventListener("click", e => {
    const item = e.target.closest(".alt-ex-item");
    if (!item) return;

    // Remove highlight from all items
    altListContainer.querySelectorAll(".alt-ex-item").forEach(el => {
      el.style.backgroundColor = "";
      el.style.color = "";
    });

    // Highlight the clicked item
    item.style.backgroundColor = "#007BFF";
    item.style.color = "#fff";

    selectedTutorialUrl = item.dataset.tutorialUrl || "";
    watchBtn.disabled = false;
  });

  // 9) Filter logic for the search input
  searchInput.addEventListener("input", () => {
    const filterVal = searchInput.value.toLowerCase().trim();
    const items = altListContainer.querySelectorAll(".alt-ex-item, .alt-ex-header");
    items.forEach(el => {
      if (el.classList.contains("alt-ex-header")) {
        el.style.display = filterVal ? "none" : "";
      } else {
        const textVal = el.textContent.toLowerCase();
        el.style.display = textVal.includes(filterVal) ? "" : "none";
      }
    });
  });

  // 10) "Watch Tutorial" button action
  watchBtn.addEventListener("click", () => {
    window.open(
      selectedTutorialUrl || "https://example.com/tutorial-placeholder",
      "_blank"
    );
  });

  // 11) "Got It!" button: close the pop-up
  gotItBtn.addEventListener("click", () => {
    closeChangeExercisePopup();
  });

  // Close function
  function closeChangeExercisePopup() {
    popup.classList.remove("visible");
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 300);
  }
}

/***************************************
 * Show with fade-in on load
 ***************************************/
window.addEventListener('scroll', checkProgressBarVisibility);
window.addEventListener("load", () => {
  document.querySelectorAll(".fade-in").forEach(el => {
    el.classList.add("visible");
  });
});

window.addEventListener("load", async () => {
  await loadUserProgress(); // 🧠 First fetch progress and update localStorage

  // 🛠️ NOW we can safely do everything that depends on localStorage
  addTrackerBadge();
  applyAWTSubscriptionNavLock();

  const lastTab = localStorage.getItem("lastSelectedTab") || "myWorkouts";
  if (lastTab === "myProgress") {
    myProgressTab.click();
  } else {
    myWorkoutsTab.click();
  }

  const savedTime = localStorage.getItem("restTimerRemaining");
  if (savedTime) {
    const parsedTime = parseInt(savedTime, 10);

    if (parsedTime > 0) {
      showRestTimer(parsedTime);
      restTimerPaused = true;

      const pauseIcon = document.getElementById("timerPauseIcon");
      const playIcon = document.getElementById("timerPlayIcon");
      if (pauseIcon && playIcon) {
        pauseIcon.style.display = "none";
        playIcon.style.display = "block";
      }

      if (localStorage.getItem("restTimerMinimized") === "true") {
        currentRestTimerElement.classList.add("minimized");
        restTimerMinimized = true;
      }
    } else {
      localStorage.removeItem("restTimerRemaining");
    }
  }
});

/* ────────────────────────────────────────────────────────────────
   SECTION 103 · Workout‑Tracker Onboarding
──────────────────────────────────────────────────────────────── */

(function () {
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
      goalLines = `<span class="wt-emoji-goal">🔥</span> Your goal weight is ${fmtW(userGoalWeight)} — let’s move toward it with purpose.`;
    } else {
      goalLines = `<span class="wt-emoji-goal">🔥</span> You’re focused on getting leaner and stronger — we’ll guide you there.`;
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
      `<span>🔥</span> This time is different — because you’re ready.`,
      `Let’s turn your effort into real, lasting results.`
    ],
    "gain muscle": [
      `<span>💪</span> You’re building something — and it starts today.`,
      `With every session, you’re getting stronger than yesterday.`
    ],
    "improve body composition": [
      `<span>🔥</span> You’re in control now.`,
      `Stronger, leaner, more confident — that’s where this leads.`
    ]
  };

  // early‑out if already seen
  const overlay = document.getElementById('wtOnboardingOverlay');
  const wtSeen = localStorage.getItem('wt_onboarding_complete');
  if (!overlay || wtSeen === '1' || wtSeen === 'true') return;

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
  overlay.addEventListener('click', async e => {
    // 1) Next-button → advance the slider
    if (e.target.matches('.wt-next-btn')) {
      nextSlide();
      return;
    }

    // 2) Close-button → mark complete + dismiss
    if (e.target.matches('.wt-close-btn')) {
      localStorage.setItem('wt_onboarding_complete', '1');

      // Persist immediately
      const payload = {
        ...buildUserProgress(),
        wt_onboarding_complete: true
      };

      // POST to the same “saveMyProgress” route that Dashboard uses
      await fetch('/api/progress/saveMyProgress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress: payload })
      }).catch(() => { });

      overlay.classList.add('closing');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    }
  });

  // show it
  overlay.classList.add('open');
  goToSlide(0);

})();

/* ───────────────────────────────────────────────────────────────
   SECTION 105 · Core‑Tracker ➜ Pro‑Tracker Upsell Logic
   (shows 1 × “first workout” & 1 × “first week complete”)
──────────────────────────────────────────────────────────────── */

/************  CONFIG  ************/
const celebrationMessages = [
  "🎉 Week {n} complete — you’re on a roll!",
  "🔥 You wrapped up Week {n} strong!",
  "🚀 Week {n} finished — and you’re just getting started.",
  "🎯 Week {n} done. That’s how consistency is built.",
  "💪 Another win. Week {n} ✅.",
  "🥇 Week {n} down — and you’re leveling up fast.",
  "🎖️ Week {n} is in the books. Let’s keep it going!",
  "🎉 Finished Week {n}? That deserves a celebration.",
  "🔥 You stuck with it through Week {n}. Impressive.",
  "🚀 Week {n} — complete. Momentum looks good on you.",
  "💪 Solid effort this week. Week {n} was yours.",
  "🎯 Week {n} progress locked in — ready to unlock more?",
  "🎖️ Done with Week {n}? You’re ahead of the curve.",
  "🥇 Another step forward. Week {n} complete!",
  "🎉 Great finish to Week {n} — let’s take it even further.",
];

const motivationalSubtexts = [
  "Momentum is on your side — Pro helps it grow.",
  "Your plan should evolve with you. That’s what Pro does.",
  "Real progress needs smart tracking. Pro handles that.",
  "Train smarter, not harder — Pro makes it simple.",
  "You’ve built the habit — now build the results.",
  "Consistency matters. Pro keeps it sustainable.",
  "You bring the effort. Pro brings the strategy.",
  "Every session counts — let Pro make it compound.",
  "Build momentum that sticks. Pro makes it happen.",
  "You’ve started — now let Pro unlock your next level."
];

/************  RENDER MODAL  ************/
function renderUpsellModal(opts) {
  /* scaffold overlay + card */
  const overlay = document.createElement("div");
  overlay.id = "coreUpsellOverlay";

  const card = document.createElement("div");
  card.className = "core-upsell-card";
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  /* tiny confetti + fade-in */
  import("https://cdn.skypack.dev/canvas-confetti")
    .then(({ default: confetti }) => confetti({ particleCount: 150, spread: 80, origin: { y: .3 } }));
  requestAnimationFrame(() => overlay.classList.add("visible"));

  /* create the scrollable content wrapper */
  const content = document.createElement("div");
  content.className = "modal-content";
  card.appendChild(content);

  /* --------  Top Heading  -------- */
  const h3 = document.createElement("h3");
  h3.className = "upsell-heading";
  if (opts.type === "first") {
    h3.textContent = "🎉 You just finished your first workout!";
  } else {
    const msg = celebrationMessages[
      Math.floor(Math.random() * celebrationMessages.length)
    ];
    h3.textContent = msg.replace("{n}", opts.weekNumber);
  }
  content.appendChild(h3);

  /* --------  Static sub‑text  -------- */
  const pTop = document.createElement("p");
  pTop.textContent = "Stay consistent. Pro adapts as you grow.";
  content.appendChild(pTop);

  /* --------  Mini‑testimonial  -------- */
  content.appendChild(buildMiniTestimonial());

  /* --------  Quote line  -------- */
  const pLine = document.createElement("p");
  pLine.textContent = "This is the moment many users decide to go Pro — and for good reason.";
  Object.assign(pLine.style, {
    fontStyle: "italic",
    fontSize: "0.95rem",
    color: "#444",
    margin: "0",
    textAlign: "center",
    lineHeight: "1.4"
  });
  content.appendChild(pLine);

  /* --------  CTA footer (sticky)  -------- */
  const footer = document.createElement("div");
  footer.className = "cta-footer";

  // —— move timer into footer ——
  const timerWrap = document.createElement("div");
  timerWrap.className = "timer-container";
  timerWrap.innerHTML = `
      <div class="timer-text">
        <span class="discount-label">⏳ Unlock Pro today for £9.99:</span>
        <span class="time-remaining" id="countdownTimer">10:00</span>
      </div>`;
  footer.appendChild(timerWrap);
  startTenMinuteCountdown(timerWrap.querySelector("#countdownTimer"));

  // —— then CTA & Maybe later ——
  const cta = document.createElement("a");
  cta.className = "cta";
  cta.textContent = "🔓 Unlock Pro Tracker";
  // **instead** of cta.href = "offer.html", we’ll intercept the click:
  cta.addEventListener("click", e => {
    e.preventDefault();
    // pull the live "MM:SS" off the modal
    const timerEl = timerWrap.querySelector("#countdownTimer");
    if (timerEl) {
      const [mm, ss] = timerEl.textContent.split(":").map(Number);
      const remainingMs = (mm * 60 + ss) * 1000;
      // compute the absolute deadline for the offer page
      const resumeOfferEnd = Date.now() + remainingMs;
      localStorage.setItem("offerResumeEnd", resumeOfferEnd);
    }
    // now navigate
    window.location.href = "offer.html";
  });
  footer.appendChild(cta);

  const laterBtn = document.createElement("button");
  laterBtn.className = "maybe-later";
  laterBtn.textContent = "Maybe later";
  laterBtn.addEventListener("click", closeOverlay);
  footer.appendChild(laterBtn);

  // fade‑in “Maybe later” after 5s
  setTimeout(() => laterBtn.classList.add("show"), 5000);

  // finally, add footer to card
  overlay.appendChild(footer);

  /* fade-in “Maybe later” after 5s */
  setTimeout(() => laterBtn.classList.add("show"), 5000);

  /* close on outside click */
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeOverlay();
  });

  function closeOverlay() {
    overlay.classList.remove("visible");
    setTimeout(() => overlay.remove(), 350);
  }
}

/* ---------------------------------------------------------------- */
/* Helper – countdown mm:ss                                         */
/* ---------------------------------------------------------------- */
function startTenMinuteCountdown(el) {
  let remaining = 600; // seconds
  const tick = () => {
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    el.textContent = `${m}:${s}`;
    remaining--;
    if (remaining >= 0) setTimeout(tick, 1000);
  };
  tick();
}

/* ---------------------------------------------------------------- */
/* Helper – testimonial builder                                     */
/* ---------------------------------------------------------------- */
function buildMiniTestimonial() {
  const userGoal = (localStorage.getItem("goal") || "").toLowerCase();
  const gender = (localStorage.getItem("userGender") || "male").toLowerCase();

  let name, txt, beforeImg, afterImg;
  if (userGoal.includes("gain")) {
    name = "Max";
    txt = "Nothing worked until this. Now I train with confidence — and real progress.";
    beforeImg = "../assets/harry_chest_before.jpg";
    afterImg = "../assets/harry_chest_after.jpg";
  } else {
    if (gender === "female") {
      name = "Alice";
      txt = "This changed everything. I feel lighter, healthier, and in control for once.";
      beforeImg = "../assets/halima_back_before.jpg";
      afterImg = "../assets/halima_back_after.jpg";
    } else {
      name = "Lee";
      txt = "I’ve dropped the weight, feel sharper, and finally feel like myself again.";
      beforeImg = "../assets/lynn_before.JPEG";
      afterImg = "../assets/lynn_after.png";
    }
  }

  const wrap = document.createElement("div");
  wrap.className = "testimonial-mini";
  wrap.innerHTML = `
    <div class="images">
      <div><img src="${beforeImg}" alt="Before"><p>Before</p></div>
      <div><img src="${afterImg}"  alt="After"><p>After</p></div>
    </div>

    <div class="name-stars">
      <p class="review-name">${name}</p>
      <div class="five-stars">
        <img src="../assets/5-stars.png" alt="5 Stars" width="100">
      </div>
    </div>

    <p class="review-text-mini">${txt}</p>`;
  return wrap;
}

/* ---------------------------------------------------------------- */
/* Helper – comparison snapshot                                     */
/* ---------------------------------------------------------------- */
// function buildComparisonSnapshot() {
//   const box = document.createElement("div");
//   box.className = "compare-box";
//   box.innerHTML = `
//     <h4>Here’s What You Unlock with Pro</h4>
//     <table class="compare-table">
//       <tr><td>XP System</td>                     <td>✅ XP&nbsp;+ Progress Score</td></tr>
//       <tr><td>Workout Logging</td>               <td>✅ Adaptive Progression</td></tr>
//       <tr><td>❌ Nutrition Tracker</td>           <td>✅ Full Meal Plans + Macro Tracking</td></tr>
//       <tr><td>❌ Coach Insights</td>              <td>✅ Personalized Tips & Trends</td></tr>
//       <tr><td>❌ Video Tutorials</td>             <td>✅ Expert Form Guidance</td></tr>
//       <tr><td>❌ Community Challenges</td>        <td>✅ Monthly Challenges & Rankings</td></tr>
//     </table>`;
//   return box;
// }

/* ---------------------------------------------------------------- */
/* Expose to global (for console testing)                           */
/* ---------------------------------------------------------------- */
(function () {
  function maybeShowCoreUpsell(weekIdx, dayIdx) {
    // 1) Bail for Pro/AWT users
    if (window.hasPurchasedAWT) return;

    // 2) Only if they've actually finished it
    if (!isWorkoutFinished(weekIdx, dayIdx)) return;

    const firstKey = "ctUpsell_shown_firstWorkout";
    const weekKey = "ctUpsell_shown_week" + (weekIdx + 1);

    // 3) First workout ever
    if (!localStorage.getItem(firstKey)) {
      localStorage.setItem(firstKey, "true");
      renderUpsellModal({ type: "first" });
      return;
    }

    // 4) Last workout day of the week
    if (!localStorage.getItem(weekKey)) {
      const program = window.twelveWeekProgram || [];
      const week = program[weekIdx];
      if (!week) return;

      const allDone = week.days.every((_, d) =>
        localStorage.getItem(`workoutFinished_w${weekIdx}_d${d}`) === "true"
      );

      if (allDone) {
        localStorage.setItem(weekKey, "true");
        renderUpsellModal({ type: "week", weekNumber: weekIdx + 1 });
      }
    }
  }

  // expose it
  window.maybeShowCoreUpsell = maybeShowCoreUpsell;
})();

// A) Count precision‑overrides on weight blur
document.addEventListener(
  "blur",
  (e) => {
    const input = e.target;
    // only weight‑inputs (kg) for Core
    if (
      !isCoreUser() ||
      !input.matches('.input-field[type="number"]') ||
      !input.placeholder.includes("kg")
    )
      return;

    const w = parseFloat(input.value);
    if (isNaN(w)) return;
    const idx = parseInt(
      input.closest(".set-row")?.dataset.setIndex || "1",
      10
    );
    if (idx < 2) return;

    corePrecisionOverrideCount++;
    maybeShowCorePrecisionUpsell();
  },
  true
);

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

document.addEventListener('DOMContentLoaded', async () => {
  // 1) lock Pro/Nav as before
  applyAWTSubscriptionNavLock();

  // 2) fetch & restore server-side progress into localStorage
  await loadUserProgress();

  // 3) rehydrate your in-memory program & stats
  twelveWeekProgram = JSON.parse(localStorage.getItem('twelveWeekProgram') || '[]');
  fullyPrecomputeAllWeeks();

  // 4) rebuild the UI immediately
  renderWeekSelector();
  renderDaySelector();
  renderWorkoutDisplay();
});