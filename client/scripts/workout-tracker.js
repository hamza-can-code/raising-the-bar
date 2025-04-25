// if (localStorage.getItem("hasAWTSubscription") !== "true") {
//   localStorage.setItem("hasAWTSubscription", "true");
// }
// if (localStorage.getItem("hasPOSAddOnForAWT") !== "true") {
//   localStorage.setItem("hasPOSAddOnForAWT", "true");
// }

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
  navNutrition.style.cursor  = "default";
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
  const state = JSON.parse(localStorage.getItem("checkboxState") || "{}");
  state[key] = value;
  localStorage.setItem("checkboxState", JSON.stringify(state));
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
  for (let weekNum = 1; weekNum <= purchasedWeeks; weekNum++) {
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
  for (let week = currentWeekNumber + 1; week <= purchasedWeeks; week++) {
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
let purchasedWeeks = parseInt(localStorage.getItem("purchasedWeeks") || "12");
let requiredWorkoutsPerWeek = parseInt(localStorage.getItem("requiredWorkoutsPerWeek") || "3");
let userGender = localStorage.getItem("userGender") || "male";
let userBodyweight = parseFloat(localStorage.getItem("userBodyweight") || "70"); // in kg
let hasPurchasedAWT = false;
// If either “hasAWTSubscription” == "true" OR “hasPOSAddOnForAWT” == "true", then set hasPurchasedAWT = true
const sub = (localStorage.getItem("hasAWTSubscription") === "true");
const pos = (localStorage.getItem("hasPOSAddOnForAWT") === "true");
if (sub || pos) {
  hasPurchasedAWT = true;
}

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

function initFloatingCTA() {
  const floatingCTA = document.getElementById("floating-cta");
  const ctaStop = document.getElementById("ctaStopContainer");
  if (!floatingCTA || !ctaStop) return;

  /* fade in once after render */
  setTimeout(() => floatingCTA.classList.add("cta-visible"), 250);

  /* track whether we’re currently pinned */
  let pinned = false;

  function handleScroll() {
    const ctaBottom = window.scrollY + window.innerHeight - 20;      // 20px bottom offset
    const stopTop = ctaStop.getBoundingClientRect().top + window.scrollY;

    if (ctaBottom >= stopTop && !pinned) {
      floatingCTA.classList.add("pinned");
      floatingCTA.classList.remove("shadow-active");
      pinned = true;
    } else if (ctaBottom < stopTop && pinned) {
      floatingCTA.classList.remove("pinned");
      if (window.innerWidth >= 768) floatingCTA.classList.add("shadow-active");
      pinned = false;
    }
  }

  function handleResize() {
    if (!pinned && window.innerWidth >= 768) {
      floatingCTA.classList.add("shadow-active");
    } else {
      floatingCTA.classList.remove("shadow-active");
    }
  }

  /* ← here’s the only change: call it once right away: */
  handleResize();
  handleScroll();                // ← dock it immediately under your feature count

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });

  /* click → go to offer page */
  floatingCTA
    .querySelector(".claim-program-btn")
    .addEventListener("click", () => window.location.href = "offer.html");

  setTimeout(() => {
    floatingCTA.classList.add("cta-visible");

    // after the 1.5s fade finishes, kill the transform transition
    setTimeout(() => {
      floatingCTA.classList.remove("fade-in-cta");
    }, 1500);
  }, 250);
}

function renderMyProgressForCore() {
  const cont = document.getElementById("myProgressContainer");
  if (!cont) return;

  // ← grab the right week number from localStorage
  const weekNumber = parseInt(
    localStorage.getItem("activeWorkoutWeek") || "1",
    10
  );

  cont.innerHTML = "";

  /* a) HERO ---------------------------------------------------- */
  cont.insertAdjacentHTML("beforeend", `
    <section id="mp-core-hero">
      <h2>Your Progress Deserves the Full Picture</h2>
      <p>Track your consistency, strength, and body changes — plus smart insights built from your real data.</p>
    </section>
  `);

  // **This** line must use `weekNumber`:
  const stats = getWeeklyStats(weekNumber);
  if (stats.workoutsCompleted > 0) {
    const sum = document.createElement("p");
    sum.style.cssText = "font:500 1rem/1.6 Poppins,sans-serif;text-align:center;margin-bottom:25px";
    sum.textContent =
      `You’ve completed ${stats.workoutsCompleted} workouts and lifted ` +
      `${stats.totalWeight.toLocaleString()} kg this week. Want to see what that adds up to?`;
    cont.appendChild(sum);
  }

  /* c) 5 glass cards ------------------------------------------ */
  const cardInfo = [
    {
      h: "One Score. Total Progress.",
      b: "The Progress Score tracks your effort, consistency, and workouts — all in one evolving number that reflects your long-term growth."
    },
    {
      h: "Your Week in Highlights",
      b: "Get a clear summary of your training — including top lifts, total volume, and personal highlights — all in one motivational snapshot."
    },
    {
      h: "Strength Trends That Guide You",
      b: "Spot patterns in your training with visual graphs and coach insights — built to help you lift smarter, not harder."
    },
    {
      h: "Real Feedback. No Guesswork.",
      b: "Get clear feedback on each lift — so you always know when you're improving, when you've stalled, and what to do next."
    },
    {
      h: "Your Weight. Your Timeline.",
      b: "Log your weight, monitor change over time, and get a projected timeline for your goal — with milestone celebrations to keep you motivated."
    }
  ];

  const wrap = document.createElement("div");
  wrap.id = "mp-core-glass-wrap";
  cardInfo.forEach(ci => {
    const card = document.createElement("div");
    card.className = "mp-glass-card";
    card.innerHTML = `
      <h3>${ci.h}</h3>
      <div class="pt-extra-container">
        <span class="crown-emoji">👑</span>
        <span class="pt-extra">Pro Tracker Only</span>
      </div>
      <p>${ci.b}</p>
    `;
    wrap.appendChild(card);
  });
  cont.appendChild(wrap);


  /* d) feature‑count & bar ------------------------------------ */
  cont.insertAdjacentHTML("beforeend", `
     <p id="mp-core-feature-count">
        You’ve unlocked 23 out of 65 total features.<br>
        Pro Tracker gives you access to 42 additional tools to maximize results.
     </p>
     <div id="mp-core-progress-bar"><div></div></div>
  `);

  if (!document.getElementById("floatingCtaContainer")) {
    cont.insertAdjacentHTML(
      "beforeend",
      `
      <div class="floating-cta-container" id="floatingCtaContainer">
        <div class="floating-cta fade-in-cta" id="floating-cta">
          <button class="claim-program-btn">🔓 Unlock Pro Tracker</button>
        </div>
      </div>
      <!-- stop marker (where CTA docks) -->
      <div id="ctaStopContainer"></div>
      `
    );
  }

  if (!window.__ctaInitDone) {
    initFloatingCTA();
    window.__ctaInitDone = true;
  }

  // Testimonial Section – now rendered after the CTA
  cont.insertAdjacentHTML("beforeend", `
  <div class="testimonial-section fullwidth-testimonial">
    <h2>Real Progress. No Guesswork.</h2>
    <p class="hero-text">
      They stopped guessing and started growing — and so can you.
    </p>
    <div class="testimonial-container">
      <button class="arrow-button prev">❮</button>
      <div class="testimonial-slider"></div>
      <button class="arrow-button next">❯</button>
    </div>
    <div class="dots-container"></div>
  </div>
`);

  const reviews = [
    {
      name: "David",
      text: "The strength graphs showed me I was improving even on the weeks I felt off. That feedback gave me confidence — and helped me stay consistent long enough to gain real muscle.",
      beforeImage: "src/images/harry_chest_before.jpg",
      afterImage: "src/images/harry_chest_after.jpg",
      testImage: "src/images/5-stars.png",
    },
    {

      name: "Maria",
      text: "Seeing my streaks and Progress Score tick up each week made all the difference. I wasn’t just guessing anymore — I could actually see myself improving.",
      beforeImage: "src/images/halima_back_before.jpg",
      afterImage: "src/images/halima_back_after.jpg",
      testImage: "src/images/5-stars.png",
    },
    {
      name: "Lee",
      text: "The Coach Insights and milestone tracking kept me grounded. I’d see a new lowest weight logged or a consistency badge, and it reminded me this was actually working.",
      beforeImage: "src/images/lynn_before.JPEG",
      afterImage: "src/images/lynn_after.png",
      testImage: "src/images/5-stars.png",
    },
  ];

  const sliderContainer = document.querySelector(".testimonial-slider");
  const prevBtn = document.querySelector(".arrow-button.prev");
  const nextBtn = document.querySelector(".arrow-button.next");
  const dotsContainer = document.querySelector(".dots-container");

  let currentIndex = 0;
  let startX = 0;
  let endX = 0;

  // Create a testimonial slot
  function createTestimonialCards() {
    // Clear existing content
    sliderContainer.innerHTML = "";

    reviews.forEach((review, index) => {
      // Create a .testimonial-card
      const card = document.createElement("div");
      card.classList.add("testimonial-card");

      // HTML for each card (similar to your existing structure)
      card.innerHTML = `
            <div class="images">
              <div class="before">
                <img src="${review.beforeImage}" alt="Before">
                <p>Before</p>
              </div>
              <div class="after">
                <img src="${review.afterImage}" alt="After">
                <p>After</p>
              </div>
            </div>
            <p class="review-name">${review.name}</p>
            <div class="five-stars">
              <img src="${review.testImage}" alt="5 Stars">
            </div>
            <p class="review-text">${review.text}</p>
          `;

      sliderContainer.appendChild(card);
    });
  }

  // 2) Create & update the dots
  function createDots() {
    dotsContainer.innerHTML = "";
    reviews.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      if (index === currentIndex) dot.classList.add("active");
      // Clicking a dot => jump to that slide
      dot.addEventListener("click", () => {
        currentIndex = index;
        updateSlider();
      });
      dotsContainer.appendChild(dot);
    });
  }

  // 3) Move the slider to the currentIndex & update dots
  function updateSlider() {
    const slideWidth = sliderContainer.clientWidth; // each card is 100% of this container
    sliderContainer.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

    // Update dots
    const allDots = dotsContainer.querySelectorAll(".dot");
    allDots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentIndex);
    });
  }

  // 4) Arrow button handlers
  function goNext() {
    currentIndex = (currentIndex + 1) % reviews.length;
    updateSlider();
  }
  function goPrev() {
    currentIndex = (currentIndex - 1 + reviews.length) % reviews.length;
    updateSlider();
  }

  // 5) Mobile swipe detection
  function enableSwipe() {
    sliderContainer.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    sliderContainer.addEventListener("touchend", (e) => {
      endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) {
        // Swipe left => next
        goNext();
      } else if (endX - startX > 50) {
        // Swipe right => prev
        goPrev();
      }
    });
  }
  if (typeof createTestimonialCards === "function") {
    createTestimonialCards();                 // your existing helpers
    createDots();
    enableSwipe();
    nextBtn.addEventListener("click", goNext);
    prevBtn.addEventListener("click", goPrev);
    updateSlider();
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

  // SHOW the week/day selectors for My Workouts:
  const weekSelectorFrame = document.querySelector(".week-selector-frame");
  const daySelectorFrame = document.querySelector(".day-selector-frame");
  if (weekSelectorFrame) weekSelectorFrame.style.display = "block";
  if (daySelectorFrame) daySelectorFrame.style.display = "block";
});

myProgressTab.addEventListener("click", () => {
  // Save last selected tab for persistence
  localStorage.setItem("lastSelectedTab", "myProgress");

  // Update tab classes & sections visibility
  myProgressTab.classList.add("active");
  myWorkoutsTab.classList.remove("active");
  myProgressSection.classList.add("active");
  myWorkoutsSection.classList.remove("active");

  // Hide the week/day selectors for My Progress
  const weekSelectorFrame = document.querySelector(".week-selector-frame");
  const daySelectorFrame = document.querySelector(".day-selector-frame");
  if (weekSelectorFrame) weekSelectorFrame.style.display = "none";
  if (daySelectorFrame) daySelectorFrame.style.display = "none";

  // Show or hide the new overview depending on AWT status
  if (hasPurchasedAWT) {
    document.getElementById("myProgressOverview").style.display = "block";
    document.getElementById("noProgressDataMessage").style.display = "none";

    // Update progress score & weekly recap cards
    updateProgressScoreAndMessages();
    renderWeeklyRecapAndImprovements();
    showBodyCompositionSection();
    showTodaysTipIfAny();

    // Retrieve the currently selected exercise (if any) from localStorage.
    // If none is found, fall back to the first exercise from your flattened list.
    let selectedExercise = localStorage.getItem("strengthTrendsSelectedExercise");
    if (!selectedExercise && flattenedExercises.length > 0) {
      selectedExercise = flattenedExercises[0].name;
    }

    // Update trend charts (graphs)
    buildTrendChartsFor(selectedExercise);

    // **NEW:** Update coach insights immediately based on the selected exercise.
    buildCoachInsightsFor(selectedExercise);
  } else {
    // Core users → render the new upsell page instead of "No progress data"
    document.getElementById("myProgressOverview").style.display = "none";
    document.getElementById("noProgressDataMessage").style.display = "none";
    renderMyProgressForCore();
  }
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
function updateProgressScoreAndMessages() {
  const psValueEl = document.getElementById("progressScoreValue");
  const dailyMsgEl = document.getElementById("progressDailyMessage");
  if (!psValueEl || !dailyMsgEl) return;

  // Calculate current aggregated data
  let totalXP = parseInt(localStorage.getItem("currentXP") || "0", 10);
  let totalReps = 0;
  let totalWeight = 0;
  const checkboxState = JSON.parse(localStorage.getItem("checkboxState") || "{}");

  for (let key in checkboxState) {
    if (checkboxState[key] === true) {
      if (key.startsWith("set_") || key.startsWith("fallback_") || key.startsWith("cardio_")) {
        const parts = key.split("_");
        if (parts.length >= 5) {
          const exerciseName = parts.slice(3, parts.length - 1).join("_").toLowerCase();
          const setIndex = parts[parts.length - 1];
          for (let w = 1; w <= purchasedWeeks; w++) {
            for (let d = 1; d <= 7; d++) {
              let repsKey = `${exerciseName}_week${w}_day${d}_set${setIndex}_actualReps`;
              let weightKey = `${exerciseName}_week${w}_day${d}_set${setIndex}_actualWeight`;

              const repsVal = localStorage.getItem(repsKey);
              const weightVal = localStorage.getItem(weightKey);

              if (repsVal) {
                totalReps += parseInt(repsVal, 10) || 0;
              }
              if (weightVal) {
                totalWeight += parseInt(weightVal, 10) || 0;
              }
            }
          }
        }
      }
    }
  }

  // Compute the current aggregator value
  let currentAggregator = totalXP + totalReps + totalWeight;

  // Retrieve the last aggregator checkpoint (defaulting to 0)
  let lastAggregator = parseInt(localStorage.getItem("lastAggregator") || "0", 10);

  // Only add the positive difference
  let newAddition = currentAggregator - lastAggregator;
  if (newAddition < 0) newAddition = 0;

  // Update the progress score by adding only the new addition
  let storedPS = parseInt(localStorage.getItem("progressScore") || "0", 10);
  let finalPS = storedPS + newAddition;
  localStorage.setItem("progressScore", finalPS.toString());

  // Update the checkpoint so that future updates only add new changes.
  localStorage.setItem("lastAggregator", currentAggregator.toString());

  // Update the DOM elements with the new progress score and message.
  psValueEl.textContent = finalPS;

  // Your logic to determine whether the user is on track
  const isFirstWeek = (parseInt(localStorage.getItem("currentWeekIndex") || "0", 10) === 0);
  let onTrack = isFirstWeek ? true : checkLastWeekOnTrack();
  let dailyMsg = onTrack ? getOnTrackMessageForPS(finalPS) : getRandomOffTrackMessage();
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
const totalWeeksToShow = Math.min(purchasedWeeks, twelveWeekProgram.length);

function renderWeekSelector() {
  weekSelectorEl.innerHTML = "";

  // Get the week wrapper element.
  const weekWrapper = document.querySelector(".week-selector-wrapper");

  if (purchasedWeeks === 1) {
    // Only one week: create a single centered week label.
    const div = document.createElement("div");
    div.classList.add("week-box");
    div.textContent = "Week 1";
    div.classList.add("active"); // mark as active
    weekSelectorEl.appendChild(div);

    // Center horizontally and disable horizontal scrolling.
    weekSelectorEl.style.display = "flex";
    weekSelectorEl.style.justifyContent = "center";
    if (weekWrapper) {
      weekWrapper.style.overflowX = "hidden";
    }
  } else {
    // Reset any inline centering and enable scrolling if more than one week.
    weekSelectorEl.style.justifyContent = "";
    weekSelectorEl.style.display = "";
    if (weekWrapper) {
      weekWrapper.style.overflowX = "auto";
    }

    for (let i = 0; i < totalWeeksToShow; i++) {
      const weekNumber = i + 1;
      const div = document.createElement("div");
      div.classList.add("week-box");
      div.textContent = `Week ${weekNumber}`;

      if (i < currentWeekIndex) {
        div.classList.add("completed");
      }
      if (i === currentWeekIndex) {
        div.classList.add("active");
      }

      div.addEventListener("click", () => {
        currentWeekIndex = i;
        localStorage.setItem("currentWeekIndex", currentWeekIndex.toString());

        // Reset the current day to 0 (Day 1) when a new week is selected.
        currentDayIndex = 0;
        localStorage.setItem("currentDayIndex", "0");

        // Ensure all weeks up to the current one are computed:
        fullyPrecomputeAllWeeks();

        updateWeekBoxes();
        renderWorkoutDisplay();
        renderDaySelector();
      });

      weekSelectorEl.appendChild(div);
    }
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

// Call once on load
renderWeekSelector();

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
  const dayCheckbox = document.createElement("input");
  dayCheckbox.type = "checkbox";
  dayCheckbox.classList.add("day-checkbox");

  dayCheckbox.setAttribute("data-checkbox-key", `day_${currentWeekIndex}_${currentDayIndex}`);
  if (loadCheckboxState(`day_${currentWeekIndex}_${currentDayIndex}`)) {
    dayCheckbox.checked = true;
    dayCheckbox.setAttribute("data-xp-awarded", "true");
  }

  dayCheckbox.addEventListener("change", () => {
    const key = dayCheckbox.getAttribute("data-checkbox-key");
  
    if (dayCheckbox.checked) {
      // Only award once, even if they uncheck/recheck
      if (!loadXPAwarded(key)) {
        saveXPAwarded(key);
        addXPForDay(dayData);
        updateActiveWeekOnLog();
      }
      saveCheckboxState(key, true);
  
      const allSections = workoutDisplayEl.querySelectorAll(".collapsible-content");
      allSections.forEach(section => {
        section.style.display = "block";
      });
  
      checkAllExercises();
      setTimeout(autoCheckDayIfAllExercisesAreChecked, 100);
      renderWorkoutDisplay();
  
      if (activeRestTimerExercise) {
        cancelRestTimer();
        activeRestTimerExercise = null;
      }
      updateWeeklyTotals();
      const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
      console.log(
        `[Day Checkbox] Updated Workouts Done for Week ${currentWeekNumber}:`,
        localStorage.getItem(`week${currentWeekNumber}_workoutsDone`)
      );
    } else {
      saveCheckboxState(key, false);
      uncheckAllExercises();
      updateWeeklyTotals();
      const currentWeekNumber = twelveWeekProgram[currentWeekIndex].week;
      console.log(
        `[Day Checkbox] Updated Workouts Done for Week ${currentWeekNumber}:`,
        localStorage.getItem(`week${currentWeekNumber}_workoutsDone`)
      );
    }
  
    setTimeout(updateProgressScoreAndMessages, 0);
  });

  dayHeader.appendChild(dayCheckbox);
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

        finishBtn.addEventListener("click", () => {
          cancelRestTimer();
          showWorkoutRecapPopup(currentWeekIndex, currentDayIndex, "finish");
          setWorkoutFinished(currentWeekIndex, currentDayIndex, true);
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
        updateActiveWeekOnLog()
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
    autoCheckDayIfAllExercisesAreChecked();
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
  autoCheckDayIfAllExercisesAreChecked();
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
        autoCheckDayIfAllExercisesAreChecked();
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
      autoCheckDayIfAllExercisesAreChecked();
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
  const VIDEO_KEY  = "upsell_watchVideo";

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
  incrementWorkoutsThisWeek();
  maybeStartStreak();
}
function addXPForExercise(exObj) {
  addXP(8);
  maybeStartStreak();
}

function autoCheckDayIfAllExercisesAreChecked() {
  const dayKey = `day_${currentWeekIndex}_${currentDayIndex}`;
  const dayCheckboxEl = document.querySelector(`input.day-checkbox[data-checkbox-key="${dayKey}"]`);
  if (!dayCheckboxEl) {
    console.log("[autoCheckDay] Day checkbox not found for key:", dayKey);
    return;
  }

  // Use document.querySelectorAll so we capture all exercise checkboxes on the page.
  const exerciseCheckboxes = document.querySelectorAll(
    `input.exercise-checkbox[data-checkbox-key^="exercise_${currentWeekIndex}_${currentDayIndex}_"]`
  );
  console.log("[autoCheckDay] Found", exerciseCheckboxes.length, "exercise checkboxes for day", dayKey);

  let allChecked = true;
  exerciseCheckboxes.forEach(cb => {
    if (!cb.checked) {
      allChecked = false;
    }
  });

  console.log("[autoCheckDay] All exercise checkboxes checked?", allChecked);

  if (allChecked && !dayCheckboxEl.checked) {
    dayCheckboxEl.checked = true;
    saveCheckboxState(dayKey, true);
    console.log("[autoCheckDay] Day checkbox auto-checked for key:", dayKey);

    // Optionally award day XP if not already done.
    if (!loadXPAwarded(dayKey)) {
      saveXPAwarded(dayKey);
      addXPForDay(); // Pass dayData if needed
    }
    updateProgressScoreAndMessages();
  }
}

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
        autoCheckDayIfAllExercisesAreChecked();
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
          <div id="timerCancelIcon" class="timer-icon-btn cancel-btn">&#x2715</div>
        </div>
  
        <!-- Center: - / Timer / + -->
        <div class="timer-center">
          <button id="timerMinusBtn" class="adjust-btn">-</button>
          <div class="timer-display"></div>
          <button id="timerPlusBtn" class="adjust-btn">+</button>
        </div>
  
        <!-- Right side: Pause / Play -->
        <div class="timer-right">
          <div id="timerPauseIcon" class="timer-icon-btn pause-btn">
            <span class="icon">&#x23F8;</span>
          </div>
          <div id="timerPlayIcon" class="timer-icon-btn play-btn">
            <span class="icon">&#x25BA;</span>
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
            autoCheckDayIfAllExercisesAreChecked();
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
  if (buttonType === "JF" && recommendation.direction === "maintain") {
    console.log("[Popup] User pressed Just Fine and recommendation is maintain => applying changes");
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
      // First re-render the workout UI:
      renderWorkoutDisplay();

      // Then, get fresh DOM references:
      const newExerciseRow = document.querySelector(
        `[data-exercise-key="exercise_${currentWeekIndex}_${currentDayIndex}_${exerciseObj.name}"]`
      );
      if (newExerciseRow) {
        const newDetails = newExerciseRow.querySelector(".exercise-details");
        const newExerciseCheckbox = newExerciseRow.querySelector(".exercise-checkbox");
        // Now auto-check using the new elements:
        autoCheckExerciseIfAllSets(newExerciseCheckbox, newDetails);
      }
      // Optionally, also re-check the day-level checkbox:
      autoCheckDayIfAllExercisesAreChecked();
    });
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
        autoCheckDayIfAllExercisesAreChecked();
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
        autoCheckDayIfAllExercisesAreChecked();
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
        autoCheckDayIfAllExercisesAreChecked();
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
        autoCheckDayIfAllExercisesAreChecked();
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

function renderWeeklyRecapAndImprovements() {
  // 1) Read the user's "active" workout week from localStorage (default to 1 if not set)
  const activeWeek = parseInt(localStorage.getItem("activeWorkoutWeek") || "1", 10);

  // If the user is on Week 1, there's no "previous" week to show.
  if (activeWeek === 1) {
    showWeek1WelcomeCard();  // e.g. “No data yet” message for Week 1
    hideImprovementsSection();
    return;
  }

  // 2) The “previous” week we want to recap is (activeWeek - 1)
  const lastWeekNumber = activeWeek - 1;
  console.log(`[renderWeeklyRecapAndImprovements] Preparing recap for Week ${lastWeekNumber}`);

  // 3) Get the locked recap stats for that week (if already generated, they remain unchanged)
  const stats = getLockedWeeklyRecap(lastWeekNumber);

  // 4) Update the subheading to show the specific week recap
  const recapSubheading = document.getElementById("weeklyRecapSubheading");
  if (recapSubheading) {
    recapSubheading.textContent = `Your Week ${lastWeekNumber} Recap`;
  }

  // 5) Build the 4 mandatory recap cards (Workouts Completed, Total Weight, Total Sets, Total Reps)
  buildWeeklyRecapCards(stats);
  initSwipeableCards("weeklyRecapWrapper", "weeklyRecapCards", "weeklyRecapDots");

  // 6) Check if there's a highlight (e.g. "Most Improved Lift", high XP, or high completion) and add it.
  // const highlight = pickHighlightIfAny(stats);
  // if (highlight) {
  //   addHighlightCard(highlight);
  // }
  renderRecapDots();

  // 7) Check for “Areas for Improvement” (which now includes our locked weekly data)
  const improvements = gatherAreasForImprovement(stats);
  if (improvements.length === 0) {
    hideImprovementsSection(true); // e.g. “You're doing great!” message
  } else {
    showImprovementsSection(improvements);
    initSwipeableCards("areasImprovementWrapper", "areasImprovementCards", "areasImprovementDots");
  }
}

function showWeek1WelcomeCard() {
  const recapSubheading = document.getElementById("weeklyRecapSubheading");
  const recapWrapper = document.getElementById("weeklyRecapWrapper");
  const recapCards = document.getElementById("weeklyRecapCards");
  const recapDots = document.getElementById("weeklyRecapDots");

  if (!recapSubheading || !recapWrapper || !recapCards || !recapDots) return;

  recapSubheading.style.display = "block";
  recapWrapper.style.display = "block";
  recapDots.innerHTML = "";

  // Single card
  recapCards.innerHTML = `
    <div class="recap-card">
      <p class="recap-card-description" style="margin: 0; padding: 0;">
        Welcome to your first week! Your Weekly Recap will show your progress,
        highlights, and improvements each week. Stay consistent, and next week's 
        recap will showcase your achievements!
      </p>
    </div>
  `;
}

function getWeeklyStats(weekNumber) {
  // Determine the zero-based weekIndex that corresponds to the given weekNumber.
  let weekIndex = -1;
  for (let i = 0; i < twelveWeekProgram.length; i++) {
    if (twelveWeekProgram[i].week === weekNumber) {
      weekIndex = i;
      break;
    }
  }

  if (weekIndex === -1) {
    console.warn(`[getWeeklyStats] No data found for week ${weekNumber}.`);
    // Fallback: no data available.
    return {
      workoutsCompleted: 0,
      totalWeight: 0,
      totalSets: 0,
      totalReps: 0,
      xpGained: 0,
      streakAtWeekEnd: 0,
      averageCompletionPct: 0,
      liftsData: {},
      assignedWorkouts: 0,
    };
  }

  const weekObj = twelveWeekProgram[weekIndex];
  const daysInWeek = weekObj.days || [];
  const assignedWorkouts = daysInWeek.length;

  let completedWorkoutsCount = 0;
  let totalWeight = 0;
  let totalSets = 0;
  let totalReps = 0;
  let totalSetsPlanned = 0;
  let totalSetsCompleted = 0;
  let dayCompletionPercents = [];
  let xpFromWeek = 0;

  // Store per-exercise data for improved/stagnant logic.
  let liftsData = {};

  // Retrieve stored checkbox and XP awarded states.
  const checkboxState = JSON.parse(localStorage.getItem("checkboxState") || "{}");
  const awardedState = JSON.parse(localStorage.getItem("awardedState") || "{}");

  daysInWeek.forEach((dayObj, dIndex) => {
    const dayKey = `day_${weekIndex}_${dIndex}`;
    let dayCompleted = !!checkboxState[dayKey];
    if (dayCompleted) {
      completedWorkoutsCount++;
      if (awardedState[dayKey]) {
        // Award day-level XP (+15 XP)
        xpFromWeek += 15;
      }
    }

    let daySetsCount = 0;
    let daySetsCompleted = 0;

    // Go through warmUp, mainWork, coolDown, or a plain exercises array
    const sections = ["warmUp", "mainWork", "coolDown", "exercises"];
    sections.forEach((sec) => {
      if (Array.isArray(dayObj[sec])) {
        dayObj[sec].forEach((ex) => {
          // Might be a single exercise OR a block with sub-exercises
          if (ex.sets && ex.sets > 0) {
            // This is a normal sets-based exercise
            const setsInExercise = ex.sets;
            daySetsCount += setsInExercise;

            // Initialize liftsData if not present
            if (!liftsData[ex.name]) {
              liftsData[ex.name] = {
                weeklyWeightSum: 0,
                setsPerformed: 0,
                finalSetWeight: 0,
                hasBeenPerformed: false,
              };
            }

            // Count how many sets were ticked and sum their weight/reps
            for (let s = 1; s <= setsInExercise; s++) {
              const setKey = `set_${weekIndex}_${dIndex}_${ex.name}_${s}`;
              if (checkboxState[setKey]) {
                daySetsCompleted++;
                if (awardedState[setKey]) {
                  xpFromWeek += 3;
                }
                const awKey = getSetStorageKey(ex.name, weekNumber, dIndex + 1, s, "actualWeight");
                const arKey = getSetStorageKey(ex.name, weekNumber, dIndex + 1, s, "actualReps");

                let wVal = localStorage.getItem(awKey);
                let rVal = localStorage.getItem(arKey);
                let numericW = wVal ? parseFloat(wVal) : 0;
                let numericR = rVal ? parseInt(rVal, 10) : 0;

                // Weight * Reps for each set:
                totalWeight += numericW * numericR;
                totalReps += numericR;
                totalSets++;

                liftsData[ex.name].weeklyWeightSum += numericW;
                liftsData[ex.name].setsPerformed += 1;
                liftsData[ex.name].hasBeenPerformed = true;
                if (s === setsInExercise) {
                  liftsData[ex.name].finalSetWeight = numericW;
                }
              }
            }
          }
          else if (ex.exercises && Array.isArray(ex.exercises)) {
            // This is a block with multiple exercises inside
            ex.exercises.forEach((subEx) => {
              if (subEx.sets && subEx.sets > 0) {
                daySetsCount += subEx.sets;

                if (!liftsData[subEx.name]) {
                  liftsData[subEx.name] = {
                    weeklyWeightSum: 0,
                    setsPerformed: 0,
                    finalSetWeight: 0,
                    hasBeenPerformed: false,
                  };
                }

                for (let s = 1; s <= subEx.sets; s++) {
                  const setKey = `set_${weekIndex}_${dIndex}_${subEx.name}_${s}`;
                  if (checkboxState[setKey]) {
                    daySetsCompleted++;
                    if (awardedState[setKey]) {
                      xpFromWeek += 3;
                    }
                    const awKey = getSetStorageKey(subEx.name, weekNumber, dIndex + 1, s, "actualWeight");
                    const arKey = getSetStorageKey(subEx.name, weekNumber, dIndex + 1, s, "actualReps");

                    let wVal = localStorage.getItem(awKey);
                    let rVal = localStorage.getItem(arKey);
                    let numericW = wVal ? parseFloat(wVal) : 0;
                    let numericR = rVal ? parseInt(rVal, 10) : 0;

                    // Weight * Reps for each set:
                    totalWeight += numericW * numericR;
                    totalReps += numericR;
                    totalSets++;

                    liftsData[subEx.name].weeklyWeightSum += numericW;
                    liftsData[subEx.name].setsPerformed += 1;
                    liftsData[subEx.name].hasBeenPerformed = true;
                    if (s === subEx.sets) {
                      liftsData[subEx.name].finalSetWeight = numericW;
                    }
                  }
                }
              }
            });
          }
        });
      }
    });

    totalSetsPlanned += daySetsCount;
    totalSetsCompleted += daySetsCompleted;

    // Calculate day-level completion (0% if daySetsCount > 0 but user ticked none)
    let dayPct = daySetsCount > 0 ? (daySetsCompleted / daySetsCount) * 100 : 0;
    dayCompletionPercents.push(dayPct);

    // **Console log** the day’s total sets vs. sets ticked and the percentage
    console.log(
      `[getWeeklyStats] Day ${dIndex + 1} - Planned Sets: ${daySetsCount}, Completed Sets: ${daySetsCompleted}, ` +
      `Completion: ${dayPct.toFixed(2)}%`
    );
  });

  let averageCompletionPct = 0;
  if (dayCompletionPercents.length > 0) {
    let sumPct = dayCompletionPercents.reduce((acc, pct) => acc + pct, 0);
    averageCompletionPct = Math.round(sumPct / dayCompletionPercents.length);
  }

  console.log(
    `[getWeeklyStats] For week ${weekNumber} - Average Completion Percentage: ${averageCompletionPct}%`
  );
  console.log(
    `[getWeeklyStats] Total Planned Sets: ${totalSetsPlanned}, Total Completed Sets: ${totalSetsCompleted}`
  );

  return {
    weekNumber: weekNumber,
    workoutsCompleted: completedWorkoutsCount,
    assignedWorkouts: assignedWorkouts,
    totalWeight: totalWeight,
    totalSets: totalSets,
    totalReps: totalReps,
    xpGained: xpFromWeek,
    streakAtWeekEnd: parseInt(localStorage.getItem("streakCount") || "0", 10),
    averageCompletionPct: averageCompletionPct,
    liftsData: liftsData
  };
}

function buildWeeklyRecapCards(stats) {
  const recapSubheading = document.getElementById("weeklyRecapSubheading");
  const recapWrapper = document.getElementById("weeklyRecapWrapper");
  const recapCards = document.getElementById("weeklyRecapCards");
  const recapDots = document.getElementById("weeklyRecapDots");
  if (!recapSubheading || !recapWrapper || !recapCards || !recapDots) return;

  recapSubheading.style.display = "block";
  recapWrapper.style.display = "block";

  // Clear out any previous
  recapCards.innerHTML = "";
  recapDots.innerHTML = "";

  // 1) Workouts Completed
  const card1 = document.createElement("div");
  card1.classList.add("recap-card");
  card1.innerHTML = `
    <div class="recap-card-title"><span class="emoji-bg">🔥</span> Workouts Completed</div>
    <div class="recap-card-value">${stats.workoutsCompleted}/${stats.assignedWorkouts}</div>
  `;
  recapCards.appendChild(card1);

  const topLiftArr = getTop3Lifts(stats);
  if (topLiftArr.length > 0) {
    // pick the single top
    const topLift = topLiftArr[0]; // highest weight
    const cardTopLift = document.createElement("div");
    cardTopLift.classList.add("recap-card");
    cardTopLift.innerHTML = `
      <div class="recap-card-title"><span class="emoji-bg">🚀</span> Top Lift</div>
      <div class="recap-card-description" style="font-size: 1.3rem;">
         <strong>${topLift.exName}</strong>: ${formatWeight(topLift.weight)}
      </div>
    `;
    // Insert it as the second card
    recapCards.appendChild(cardTopLift);
  }

  // 2) Total Weight Lifted
  const card2 = document.createElement("div");
  card2.classList.add("recap-card");
  card2.innerHTML = `
    <div class="recap-card-title"><span class="emoji-bg">🏋️</span> Total Weight Lifted</div>
    <div class="recap-card-value">${formatWeight(stats.totalWeight)}</div>
  `;
  recapCards.appendChild(card2);

  // 3) Total Sets Completed
  const card3 = document.createElement("div");
  card3.classList.add("recap-card");
  card3.innerHTML = `
    <div class="recap-card-title"><span class="emoji-bg">📈</span> Total Sets Completed</div>
    <div class="recap-card-value">${stats.totalSets} Sets</div>
  `;
  recapCards.appendChild(card3);

  // 4) Total Reps Completed
  const card4 = document.createElement("div");
  card4.classList.add("recap-card");
  card4.innerHTML = `
    <div class="recap-card-title"><span class="emoji-bg">💪</span> Total Reps Completed</div>
    <div class="recap-card-value">${stats.totalReps} Reps</div>
  `;
  recapCards.appendChild(card4);

  // 5) *** Top 3 Lifts (NEW) ***
  const top3 = getTop3Lifts(stats); // Call the helper function from above
  // if (top3.length > 0) {
  //   // Build a small list of them, highest to lowest
  //   let topListHTML = "";
  //   top3.forEach(item => {
  //     topListHTML += `<strong>${item.exName}</strong>: ${item.weight} kg<br/>`;
  //   });

  //   const card5 = document.createElement("div");
  //   card5.classList.add("recap-card");
  //   card5.innerHTML = `
  //     <div class="recap-card-title"><span class="emoji-bg">🚀</span>Top 3 Lifts</div>
  //     <div class="recap-card-description">
  //       ${topListHTML}
  //     </div>
  //   `;
  //   recapCards.appendChild(card5);
  // }
}

function pickHighlightIfAny(stats) {

  let possible = [];

  // 1) XP Gained highlight if xpGained > 500
  if (stats.xpGained > 500) {
    possible.push({ type: "xpGained", label: "🚀 Total XP Gained", value: stats.xpGained + " XP" });
  }

  // 2) Streak highlight if streak >= 5
  if (stats.streakAtWeekEnd >= 5) {
    possible.push({ type: "streak", label: "🔥🔥🔥 Active Streak", value: stats.streakAtWeekEnd });
  }

  // 3) Average Completion >= 90% highlight
  if (stats.averageCompletionPct >= 90) {
    possible.push({ type: "completionHigh", label: "📊 Average Completion", value: stats.averageCompletionPct + "%" });
  }

  if (possible.length === 0) {
    return null;
  }
  // If multiple highlights, pick one at random
  return possible[Math.floor(Math.random() * possible.length)];
}

function addHighlightCard(highlight) {
  const recapCards = document.getElementById("weeklyRecapCards");
  if (!recapCards) return;

  let label = highlight.label || "";
  let val = highlight.value || "";

  // Build the highlight card
  const highlightCard = document.createElement("div");
  highlightCard.classList.add("recap-card");
  highlightCard.innerHTML = `
    <div class="recap-card-title">${label}</div>
    <div class="recap-card-value">${val}</div>
  `;
  recapCards.appendChild(highlightCard);
}

function renderRecapDots() {
  const recapCards = document.getElementById("weeklyRecapCards");
  const recapDots = document.getElementById("weeklyRecapDots");
  if (!recapCards || !recapDots) return;

  const cardCount = recapCards.querySelectorAll(".recap-card").length;
  recapDots.innerHTML = "";

  for (let i = 0; i < cardCount; i++) {
    const dot = document.createElement("div");
    dot.classList.add("recap-dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
      // Jump the .recap-cards-inner transform to the i-th card
      const cardWidth = recapCards.clientWidth;
      recapCards.style.transform = `translateX(-${i * cardWidth}px)`;
      // Mark this dot as active
      recapDots.querySelectorAll(".recap-dot").forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
    });
    recapDots.appendChild(dot);
  }
}

function gatherAreasForImprovement(stats) {
  let improvements = [];

  // For example, if average completion < 80%, show an improvement card
  if (typeof stats.averageCompletionPct === "number" && stats.averageCompletionPct < 80) {
    improvements.push({
      type: "completionLow",
      label: "⚠️ Low Completion",
      value: stats.averageCompletionPct + "%",
      weekNum: stats.weekNumber
    });
  }

  return improvements;
}

function hideImprovementsSection(showNoImprovementsMsg = false) {
  const heading = document.getElementById("areasImprovementSubheading");
  const wrapper = document.getElementById("areasImprovementWrapper");
  const noMsg = document.getElementById("areasNoImprovementMessage");
  if (heading) heading.style.display = "none";
  if (wrapper) wrapper.style.display = "none";
  if (noMsg) {
    noMsg.style.display = showNoImprovementsMsg ? "block" : "none";
  }
}

function showImprovementsSection(improvements) {
  const heading = document.getElementById("areasImprovementSubheading");
  const wrapper = document.getElementById("areasImprovementWrapper");
  const cardsInner = document.getElementById("areasImprovementCards");
  const dots = document.getElementById("areasImprovementDots");
  const noMsg = document.getElementById("areasNoImprovementMessage");

  if (!heading || !wrapper || !cardsInner || !dots || !noMsg) return;

  heading.style.display = "block";
  wrapper.style.display = "block";
  noMsg.style.display = "none";

  // Clear out old cards/dots
  cardsInner.innerHTML = "";
  dots.innerHTML = "";

  improvements.sort((a, b) => {
    // Define a custom order:
    const order = ["completionLow", "lowestImprovedLift"];

    // Get each type’s index in the order array
    const indexA = order.indexOf(a.type);
    const indexB = order.indexOf(b.type);

    // If both types are in order array, compare their positions
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one is in the array, that one should come first
    if (indexA !== -1 && indexB === -1) return -1;
    if (indexA === -1 && indexB !== -1) return 1;

    // Otherwise, leave them in place relative to each other
    return 0;
  });

  // 2) Now your forEach will iterate in the new order
  improvements.forEach((imp) => {
    const card = document.createElement("div");
    card.classList.add("recap-card", "improvement-card");

    // Extract the emoji from imp.label and wrap it
    // For example, if label is "⚠️ Low Completion", let's split on space:
    const [emoji, ...rest] = imp.label.split(" ");
    const wrappedEmoji = `<span class="emoji-bgii">${emoji}</span>`;
    const labelText = rest.join(" "); // "Low Completion"

    if (imp.type === "lowestImprovedLift") {
      card.innerHTML = `
        <div class="recap-card-title">
          ${wrappedEmoji} ${labelText}
        </div>
        <div class="recap-card-description">
          Your ${imp.exerciseName} hasn't progressed in ${imp.weeksStagnant || 2} weeks—
          try focusing on form.
          <a href="#" class="recap-link">Click here</a> to watch a tutorial.
        </div>
      `;
    }
    else if (imp.type === "completionLow") {
      card.innerHTML = `
        <div class="recap-card-title">
          ${wrappedEmoji} ${labelText}
        </div>
        <div class="recap-card-description">
          Your average completion for Week ${imp.weekNum} is ${imp.value}.
          Let’s aim for 80% this week!
        </div>
      `;
    }
    else {
      // Fallback for any other improvement type
      card.innerHTML = `
        <div class="recap-card-title">Possible Improvement</div>
        <div class="recap-card-description">
          We noticed an area that can be improved. Keep going!
        </div>
      `;
    }

    cardsInner.appendChild(card);
  });

  // If only 1 improvement, you might hide the swipe dots
  if (improvements.length === 1) {
    dots.style.display = "none";
  } else {
    // Build swipe dots if multiple improvements
    dots.style.display = "flex";
    for (let i = 0; i < improvements.length; i++) {
      const dot = document.createElement("div");
      dot.classList.add("recap-dot");
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => {
        const cardWidth = cardsInner.clientWidth;
        cardsInner.style.transform = `translateX(-${i * cardWidth}px)`;
        dots.querySelectorAll(".recap-dot").forEach(d => d.classList.remove("active"));
        dot.classList.add("active");
      });
      dots.appendChild(dot);
    }
  }
}

function getMostImprovedLiftName(thisWeekNumber) {
  // We need the prior week's data:
  const prevWeekNumber = thisWeekNumber - 1;
  if (prevWeekNumber < 1) {
    // No previous week to compare
    return null;
  }

  const prevStats = getWeeklyStats(prevWeekNumber);
  const currStats = getWeeklyStats(thisWeekNumber);

  if (!prevStats || !currStats) return null;

  const improvements = [];

  // Check every exercise in the current week's stats
  for (const exName in currStats.liftsData) {
    const currLift = currStats.liftsData[exName];
    if (!currLift.hasBeenPerformed) continue; // only consider lifts actually performed

    // Must also exist in prevStats so we can compare
    const prevLift = prevStats.liftsData[exName];
    if (!prevLift || !prevLift.hasBeenPerformed) continue;

    const prevW = prevLift.finalSetWeight || 0;
    const currW = currLift.finalSetWeight || 0;
    if (prevW <= 0 || currW <= 0) continue;

    // Calculate % increase from prev to current
    const pctIncrease = ((currW - prevW) / prevW) * 100;

    // Determine threshold
    let threshold = 0;
    if (prevW < 50) threshold = 7;
    else if (prevW < 100) threshold = 5;
    else threshold = 3;

    // Check if the current lift meets or exceeds that threshold
    if (pctIncrease >= threshold) {
      improvements.push({
        exerciseName: exName,
        pctIncrease
      });
    }
  }

  if (improvements.length === 0) {
    return null;
  }

  // If multiple lifts qualify, pick one at random
  const randomIndex = Math.floor(Math.random() * improvements.length);
  const chosen = improvements[randomIndex];
  return chosen.exerciseName;
}

/**
 * getLowestImprovedLiftName
 *  - Checks the last 3 consecutive weeks: [ (thisWeekNumber - 2), (thisWeekNumber - 1), thisWeekNumber ]
 *  - Skips any week in which the user did NOT actually perform that lift (no sets ticked).
 *  - If a lift shows no improvement for at least 2 consecutive intervals, we count it as “stagnant.”
 *  - Among multiple stagnant lifts, pick the one that’s stagnant the longest; if still tied, pick randomly.
 *  - Also saves each week’s weight difference + % difference to localStorage (so you can use it later).
 *  - Returns an object like { exerciseName: "...", weeksStagnant: 2 } or null if none qualifies.
 */
function getLowestImprovedLiftName(thisWeekNumber) {
  console.log(`[getLowestImprovedLiftName] Checking for stagnant lifts up to week ${thisWeekNumber}...`);

  if (thisWeekNumber < 3) {
    console.log("[getLowestImprovedLiftName] Not enough prior weeks to check (need at least 3).");
    return null;
  }

  const w1 = thisWeekNumber - 2;
  const w2 = thisWeekNumber - 1;
  const w3 = thisWeekNumber; // "this" week

  const statsW1 = getWeeklyStats(w1);
  const statsW2 = getWeeklyStats(w2);
  const statsW3 = getWeeklyStats(w3);

  if (!statsW1 || !statsW2 || !statsW3) {
    console.log(`[getLowestImprovedLiftName] Missing data for weeks ${w1}, ${w2}, or ${w3}.`);
    return null;
  }

  // We'll store all lifts that were actually performed in each week:
  //   liftsW1 = { exName -> finalSetWeight }
  //   liftsW2 = { exName -> finalSetWeight }
  //   liftsW3 = { exName -> finalSetWeight }
  // If a lift wasn’t performed, it won’t appear.
  const liftsW1 = mapLifts(statsW1);
  const liftsW2 = mapLifts(statsW2);
  const liftsW3 = mapLifts(statsW3);

  // We'll gather potential “stagnant” lifts in an array:
  let stagnantCandidates = [];

  // For each exercise performed in week 3, see if it was also performed in weeks 2 and 1:
  for (let exName in liftsW3) {
    const w3Weight = liftsW3[exName];

    if (liftsW2[exName] == null) {
      // Not performed in week2 => skip (can't be “2 consecutive intervals” if a week was skipped).
      continue;
    }
    const w2Weight = liftsW2[exName];

    if (w2Weight < 1 || w3Weight < 1) {
      // If there's basically no real data, skip
      continue;
    }

    // Save the difference from week2 -> week3
    const w2toW3_diff = w3Weight - w2Weight;
    const w2toW3_pct = w2Weight > 0 ? (w2toW3_diff / w2Weight) * 100 : 0;

    // Also store these differences in localStorage for reference, if you like:
    const diffKey = `${exName}__week${w2}_to_week${w3}_weightDiff`;
    const pctKey = `${exName}__week${w2}_to_week${w3}_weightPctDiff`;
    localStorage.setItem(diffKey, w2toW3_diff.toFixed(2));
    localStorage.setItem(pctKey, w2toW3_pct.toFixed(2));

    console.log(`[getLowestImprovedLiftName] => ${exName}, from week${w2} to week${w3}: diff=${w2toW3_diff}, pct=${w2toW3_pct.toFixed(1)}% (saved to localStorage)`);

    // If there's no improvement this interval:
    const noImprovementFromW2toW3 = (w3Weight <= w2Weight);

    // Now check the prior interval: week1 -> week2
    if (liftsW1[exName] == null) {
      // Skipped in week1 => can’t count this as 2 intervals in a row
      continue;
    }
    const w1Weight = liftsW1[exName];
    if (w1Weight < 1) continue;

    const w1toW2_diff = w2Weight - w1Weight;
    const w1toW2_pct = w1Weight > 0 ? (w1toW2_diff / w1Weight) * 100 : 0;

    // Also store that difference:
    const diffKey2 = `${exName}__week${w1}_to_week${w2}_weightDiff`;
    const pctKey2 = `${exName}__week${w1}_to_week${w2}_weightPctDiff`;
    localStorage.setItem(diffKey2, w1toW2_diff.toFixed(2));
    localStorage.setItem(pctKey2, w1toW2_pct.toFixed(2));

    console.log(`[getLowestImprovedLiftName] => ${exName}, from week${w1} to week${w2}: diff=${w1toW2_diff}, pct=${w1toW2_pct.toFixed(1)}% (saved to localStorage)`);

    const noImprovementFromW1toW2 = (w2Weight <= w1Weight);

    // If we have 2 consecutive intervals of no improvement:
    if (noImprovementFromW1toW2 && noImprovementFromW2toW3) {
      // That means at least 2+ weeks of stagnation
      console.log(`[getLowestImprovedLiftName] => ${exName} is STAGNANT in weeks [${w1},${w2},${w3}]!`);
      // We can call this "weeksStagnant=2"
      stagnantCandidates.push({
        exerciseName: exName,
        weeksStagnant: 2
      });
    }
  }

  if (stagnantCandidates.length === 0) {
    console.log("[getLowestImprovedLiftName] => No multi-week stagnation found.");
    return null;
  }

  // If multiple, pick the one that’s “longest stagnant.” If they’re all 2, we pick randomly:
  // (In the future if you want 3+ weeks of stagnation, you could store weeksStagnant=3, etc.)
  const maxStagnant = Math.max(...stagnantCandidates.map(c => c.weeksStagnant));
  const topCandidates = stagnantCandidates.filter(c => c.weeksStagnant === maxStagnant);

  const finalPick = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  console.log(`[getLowestImprovedLiftName] => Returning stagnant lift: ${finalPick.exerciseName}, weeksStagnant=${finalPick.weeksStagnant}`);
  return finalPick;
}

/** Helper that extracts a { exName: finalSetWeight } map from the weeklyStats' liftsData. */
function mapLifts(statsObj) {
  let out = {};
  if (!statsObj || !statsObj.liftsData) return out;
  for (let exName in statsObj.liftsData) {
    let rec = statsObj.liftsData[exName];
    if (rec.hasBeenPerformed && rec.finalSetWeight > 0) {
      out[exName] = rec.finalSetWeight;
    }
  }
  return out;
}

function initSwipeableCards(containerId, cardsInnerId, dotsId) {
  const containerEl = document.getElementById(containerId);
  const cardsInnerEl = document.getElementById(cardsInnerId);
  const dotsEl = document.getElementById(dotsId);
  if (!containerEl || !cardsInnerEl || !dotsEl) return;

  let startX = 0, isSwiping = false, currentIndex = 0;
  const cardCount = cardsInnerEl.querySelectorAll(".recap-card").length;

  function showCardAtIndex(idx) {
    if (idx < 0) idx = cardCount - 1;
    if (idx >= cardCount) idx = 0;
    currentIndex = idx;
    const cardWidth = containerEl.clientWidth;
    cardsInnerEl.style.transform = `translateX(-${idx * cardWidth}px)`;
    updateDots();
  }
  function updateDots() {
    dotsEl.querySelectorAll(".recap-dot").forEach(dot => dot.classList.remove("active"));
    const arr = dotsEl.querySelectorAll(".recap-dot");
    if (arr[currentIndex]) {
      arr[currentIndex].classList.add("active");
    }
  }

  containerEl.addEventListener("touchstart", e => {
    if (e.touches?.length) {
      startX = e.touches[0].clientX;
      isSwiping = true;
    }
  });
  containerEl.addEventListener("touchend", e => {
    if (!isSwiping) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (diff < -40) showCardAtIndex(currentIndex + 1);
    else if (diff > 40) showCardAtIndex(currentIndex - 1);
    isSwiping = false;
  });

  // Build dot elements if needed:
  dotsEl.innerHTML = "";
  for (let i = 0; i < cardCount; i++) {
    const dot = document.createElement("div");
    dot.classList.add("recap-dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => showCardAtIndex(i));
    dotsEl.appendChild(dot);
  }

  // Show the first card by default
  showCardAtIndex(0);
}

function getLockedWeeklyRecap(weekNumber) {
  const storageKey = `weeklyRecapData_week${weekNumber}`;
  let storedData = localStorage.getItem(storageKey);
  if (storedData) {
    try {
      console.log(`[getLockedWeeklyRecap] Using locked data for Week ${weekNumber}`);
      return JSON.parse(storedData);
    } catch (e) {
      console.warn("[getLockedWeeklyRecap] Error parsing locked data; recalculating...");
    }
  }
  // If no locked data exists, compute and save it.
  const stats = getWeeklyStats(weekNumber);
  localStorage.setItem(storageKey, JSON.stringify(stats));
  console.log(`[getLockedWeeklyRecap] Locked data generated for Week ${weekNumber}`);
  return stats;
}

/*******************************************
 *  WEEKLY TOTALS CALCULATION (REVISED)
 *******************************************/
function updateWeeklyTotals() {
  console.log("[updateWeeklyTotals] Recalculating weekly totals...");

  const program = JSON.parse(localStorage.getItem("twelveWeekProgram") || "[]");
  if (!Array.isArray(program) || program.length === 0) return;

  const checkboxState = JSON.parse(localStorage.getItem("checkboxState") || "{}");

  // ❶ READ THE USER’S “workoutDays” (the assigned workouts-per-week)
  const assignedWorkoutsPerWeek = parseInt(localStorage.getItem("workoutDays") || "0", 10);

  program.forEach((weekObj, wIndex) => {
    const wNum = weekObj.week;
    let totalWeight = 0;
    let totalReps = 0;
    let totalSetsDone = 0;
    let completedWorkoutsCount = 0;

    if (Array.isArray(weekObj.days)) {
      weekObj.days.forEach((dayObj, dIndex) => {
        const dayKey = `day_${wIndex}_${dIndex}`;
        if (checkboxState[dayKey]) {
          completedWorkoutsCount++;
        }
        ["warmUp", "mainWork", "coolDown", "exercises"].forEach(section => {
          if (Array.isArray(dayObj[section])) {
            dayObj[section].forEach(item => {
              // Single-exercise vs. block logic
              if (item.sets && item.sets > 0) {
                for (let s = 1; s <= item.sets; s++) {
                  const setKey = `set_${wIndex}_${dIndex}_${item.name}_${s}`;
                  if (checkboxState[setKey]) {
                    totalSetsDone++;
                  }
                  const awKey = getSetStorageKey(item.name, wNum, dIndex + 1, s, "actualWeight");
                  const arKey = getSetStorageKey(item.name, wNum, dIndex + 1, s, "actualReps");
                  totalWeight += parseFloat(localStorage.getItem(awKey) || "0");
                  totalReps += parseInt(localStorage.getItem(arKey) || "0", 10);
                }
              }
              else if (item.exercises && Array.isArray(item.exercises)) {
                item.exercises.forEach(ex => {
                  if (ex.sets && ex.sets > 0) {
                    for (let s = 1; s <= ex.sets; s++) {
                      const setKey = `set_${wIndex}_${dIndex}_${ex.name}_${s}`;
                      if (checkboxState[setKey]) {
                        totalSetsDone++;
                      }
                      const awKey = getSetStorageKey(ex.name, wNum, dIndex + 1, s, "actualWeight");
                      const arKey = getSetStorageKey(ex.name, wNum, dIndex + 1, s, "actualReps");
                      totalWeight += parseFloat(localStorage.getItem(awKey) || "0");
                      totalReps += parseInt(localStorage.getItem(arKey) || "0", 10);
                    }
                  }
                });
              }
            });
          }
        });
      });
    }

    // ❷ STORE THE AGGREGATES FOR *THIS* WEEK
    localStorage.setItem(`week${wNum}_totalWeight`, totalWeight.toString());
    localStorage.setItem(`week${wNum}_totalReps`, totalReps.toString());
    localStorage.setItem(`week${wNum}_totalSets`, totalSetsDone.toString());
    localStorage.setItem(`week${wNum}_workoutsDone`, completedWorkoutsCount.toString());
    console.log(`[updateWeeklyTotals] Week ${wNum} - Workouts Done: ${completedWorkoutsCount} (Assigned: ${assignedWorkoutsPerWeek})`);


    // ❸ Also store how many workouts were assigned (e.g. 4 or 5) for that week
    localStorage.setItem(`week${wNum}_workoutsAssigned`, assignedWorkoutsPerWeek.toString());

    console.log(`[updateWeeklyTotals] Week ${wNum}: Weight=${totalWeight}, Reps=${totalReps}, Sets=${totalSetsDone}, Done=${completedWorkoutsCount}/${assignedWorkoutsPerWeek}`);
  });
  // checkAndResetWorkoutStreak(); TODO
  console.log("[updateWeeklyTotals] Completed update and streak check.");
}

function getTop3Lifts(stats) {
  const results = [];

  // For each exercise in stats.liftsData, finalSetWeight is the heaviest set user did that week
  for (const exName in stats.liftsData) {
    const record = stats.liftsData[exName];
    if (record.hasBeenPerformed && record.finalSetWeight > 0) {
      results.push({
        exName: exName,
        weight: record.finalSetWeight
      });
    }
  }

  // Sort descending by .weight
  results.sort((a, b) => b.weight - a.weight);

  // Return the top 3 (or fewer if user only performed 1-2 lifts)
  return results.slice(0, 3);
}

/***********************************************************************
 * SECTION 88 - STRENGTH & WORKOUT TRENDS
 * 
 *  1) Show/hide the entire section only if user has purchased AWT
 *  2) Build flatten list of unique exercises w/ assigned phase
 *  3) Advanced dropdown + search
 *  4) Three charts (line, stacked bar, heatmap)
 *  5) Coach Insights
 ***********************************************************************/

// (A) We'll show this section only if hasPurchasedAWT
window.addEventListener("load", () => {
  if (hasPurchasedAWT) {
    document.getElementById("strengthWorkoutTrendsHeading").style.display = "block";
    document.getElementById("strengthWorkoutTrendsSection").style.display = "block";
    initStrengthWorkoutTrendsSection();
  }
});

// -----------------------------------------------------
// (B) Flatten the 12-week program => unique exercises
//     Each exercise => { name, muscleGroup, isTechnical, etc. phase:1/2/3 }
// -----------------------------------------------------
function buildFlattenedExerciseList() {
  let uniqueMap = {};

  for (let w = 0; w < twelveWeekProgram.length; w++) {
    const weekObj = twelveWeekProgram[w];
    const weekNumber = weekObj.week;
    const phaseNumber = getPhaseFromWeek(weekNumber);

    // Only parse `weekObj.days[].mainWork`:
    weekObj.days.forEach(dayObj => {
      // dayObj.mainWork is an array of blocks
      if (!Array.isArray(dayObj.mainWork)) return;

      dayObj.mainWork.forEach(block => {
        // Must have blockType === "Resistance Training"
        if (block.blockType !== "Resistance Training") {
          return; // skip it
        }
        // Now block.exercises is the array of actual exercises
        if (Array.isArray(block.exercises)) {
          block.exercises.forEach(ex => {
            let lowerName = (ex.name || "").toLowerCase().trim();
            if (!lowerName) return;

            if (!uniqueMap[lowerName]) {
              // store first phase found
              uniqueMap[lowerName] = {
                ...ex,
                phase: phaseNumber
              };
            }
          });
        }
      });
    });
  }

  // Convert to array and sort by phase, then name:
  let finalList = Object.values(uniqueMap);
  finalList.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase;
    return a.name.localeCompare(b.name);
  });
  return finalList;
}

// We'll build the list once on load
let flattenedExercises = [];

// -----------------------------------------------------
// (C) "initStrengthWorkoutTrendsSection" 
//     - Called once on load if user has AWT
//     - Sets up the dropdown & event listeners
// -----------------------------------------------------
function initStrengthWorkoutTrendsSection() {
  flattenedExercises = buildFlattenedExerciseList();

  // Re-check if we have any exercises at all
  if (flattenedExercises.length === 0) {
    // Edge case: no data
    const heading = document.getElementById("strengthWorkoutTrendsHeading");
    if (heading) heading.textContent = "No Exercises Found";
    return;
  }

  // 1) Read the lastSelectedExercise from localStorage, fallback to the first in the list
  let storedName = localStorage.getItem("strengthTrendsSelectedExercise") || "";
  let defaultEx = flattenedExercises[0];
  if (storedName) {
    // see if it’s in the list
    let found = flattenedExercises.find(e => e.name.toLowerCase() === storedName.toLowerCase());
    if (found) {
      defaultEx = found;
    }
  }

  // 2) Render the dropdown
  buildAdvancedDropdown(flattenedExercises);

  // 3) Set the displayed subheading
  const selNameEl = document.getElementById("selectedExerciseName");
  selNameEl.textContent = defaultEx.name;

  // 4) Generate the 3 charts
  buildTrendChartsFor(defaultEx.name);

  // 5) Generate Coach Insights
  buildCoachInsightsFor(defaultEx.name);

  // 6) Hook up the subheading + chevron to toggle the dropdown
  const chevron = document.getElementById("exerciseDropdownChevron");
  const container = document.getElementById("exerciseDropdownContainer");
  const header = document.querySelector(".exercise-analysis-header");

  function openDropdown() {
    container.classList.remove("hidden");
    chevron.style.transform = "rotate(180deg)";
  }
  function closeDropdown() {
    container.classList.add("hidden");
    chevron.style.transform = "rotate(0deg)";
  }

  header.addEventListener("click", (e) => {
    // Toggle on header click
    if (container.classList.contains("hidden")) {
      openDropdown();
    } else {
      closeDropdown();
    }
  });
  document.addEventListener("click", (e) => {
    // If the container is open, and the click is NOT inside container or header => close
    if (!container.classList.contains("hidden")) {
      if (!container.contains(e.target) && !header.contains(e.target)) {
        closeDropdown();
      }
    }
  });
}

// -----------------------------------------------------
// (D) Build the advanced dropdown with search
// -----------------------------------------------------
function buildAdvancedDropdown(exArray) {
  const listEl = document.getElementById("analysisExerciseList");
  const searchInput = document.getElementById("analysisSearchInput");

  // We'll keep a separate "master" array, and a "filtered" array as user types
  let masterList = exArray.map(e => ({
    name: e.name,
    muscleGroup: e.muscleGroup || "",
    phase: e.phase,  // numeric 1,2,3
  }));

  function renderList(filterTerm = "") {
    listEl.innerHTML = "";
    filterTerm = filterTerm.trim().toLowerCase();

    // Step 1) Filter
    let filtered = masterList.filter(item => {
      // 3 fields: name, muscleGroup, "Phase 1"/"Phase 2"/"Phase 3"
      // plus user might type just "1", "2", or "3"
      const nameMatch = item.name.toLowerCase().includes(filterTerm);
      const muscleMatch = item.muscleGroup.toLowerCase().includes(filterTerm);

      // Check phase text
      const phaseText = `phase ${item.phase}`; // e.g. "phase 1"
      const actualPhaseName = (item.phase === 1) ? "foundational"
        : (item.phase === 2) ? "hypertrophy"
          : "strength";
      const combinedPhase = `phase ${item.phase} ${actualPhaseName.toLowerCase()}`;
      const phaseMatch = phaseText.includes(filterTerm) || actualPhaseName.toLowerCase().includes(filterTerm) || combinedPhase.includes(filterTerm);

      return (nameMatch || muscleMatch || phaseMatch);
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="analysis-no-match">No exercise found</div>`;
      return;
    }

    // Step 2) Group by phase => { 1: [...], 2: [...], 3: [...] }
    let grouped = { 1: [], 2: [], 3: [] };
    filtered.forEach(f => grouped[f.phase].push(f));

    // Step 3) Sort each group alphabetically by name
    for (let p = 1; p <= 3; p++) {
      grouped[p].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Step 4) Render each group with a heading
    for (let p = 1; p <= 3; p++) {
      if (grouped[p].length > 0) {
        // heading
        let headingText = (p === 1) ? "--- Phase 1 ---"
          : (p === 2) ? "--- Phase 2 ---"
            : "--- Phase 3 ---";
        const hEl = document.createElement("div");
        hEl.classList.add("analysis-phase-header");
        hEl.textContent = headingText;
        listEl.appendChild(hEl);

        // items
        grouped[p].forEach(item => {
          const iEl = document.createElement("div");
          iEl.classList.add("analysis-exercise-item");
          iEl.textContent = item.name;
          iEl.addEventListener("click", () => onSelectExercise(item));
          listEl.appendChild(iEl);
        });
      }
    }
  }

  function onSelectExercise(item) {
    // Hide dropdown
    document.getElementById("exerciseDropdownContainer").classList.add("hidden");
    document.getElementById("exerciseDropdownChevron").style.transform = "rotate(0deg)";

    // Update subheading
    const selNameEl = document.getElementById("selectedExerciseName");
    selNameEl.textContent = item.name;

    // Save in localStorage
    localStorage.setItem("strengthTrendsSelectedExercise", item.name);

    // Re-draw charts
    buildTrendChartsFor(item.name);

    // Re-draw coach insights
    buildCoachInsightsFor(item.name);
  }

  // init
  renderList();

  // search on input
  searchInput.addEventListener("input", () => {
    renderList(searchInput.value);
  });
}

// -----------------------------------------------------
// (E) Build the 3 charts for the selected exercise
// -----------------------------------------------------
function buildTrendChartsFor(exerciseName) {
  let dataVolume = gatherVolumeData(exerciseName);
  let dataRepsSets = gatherRepsSetsData(exerciseName);

  renderVolumeLineChart(dataVolume);
  renderRepsSetsChart(dataRepsSets);

  // Pass just { exerciseName } into the heatmap:
  renderConsistencyHeatmap({ exerciseName: exerciseName });

  // Now do your swipeable logic, etc.
  initSwipeableCards("strengthTrendsWrapper", "strengthTrendsCards", "strengthTrendsDots");
}

// (E1) gatherVolumeData -> returns array of objects representing each session
function gatherVolumeData(exerciseName) {
  // We want to find all sessions across the 12 weeks where this exercise is present.
  // Then sum actualWeight*actualReps per set => totalVolume for that session.
  // Return an array sorted by week/day
  let result = [];
  const checkboxState = JSON.parse(localStorage.getItem("checkboxState") || "{}");

  for (let w = 0; w < twelveWeekProgram.length; w++) {
    const weekNumber = twelveWeekProgram[w].week;
    const daysArr = twelveWeekProgram[w].days || [];
    for (let d = 0; d < daysArr.length; d++) {
      if (!isExerciseInDay(daysArr[d], exerciseName)) continue;
      // Summation:
      let totalVol = 0;
      const setsCount = getSetsCountInDay(daysArr[d], exerciseName);
      for (let s = 1; s <= setsCount; s++) {
        const awKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualWeight");
        const arKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualReps");
        let wVal = parseFloat(localStorage.getItem(awKey) || "0");
        let rVal = parseInt(localStorage.getItem(arKey) || "0", 10);
        totalVol += (wVal * rVal);
      }
      if (totalVol > 0) {
        result.push({
          sessionLabel: `W${weekNumber} D${d + 1}`,
          totalVolume: totalVol
        });
      }
    }
  }

  return result;
}

// (E2) gatherRepsSetsData -> for stacked bar
function gatherRepsSetsData(exerciseName) {
  let result = [];
  for (let w = 0; w < twelveWeekProgram.length; w++) {
    const weekNumber = twelveWeekProgram[w].week;
    const daysArr = twelveWeekProgram[w].days || [];
    for (let d = 0; d < daysArr.length; d++) {
      const setsCount = getSetsCountInDay(daysArr[d], exerciseName);
      if (setsCount <= 0) continue;

      let setsPerformed = [];
      for (let s = 1; s <= setsCount; s++) {
        const arKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualReps");
        let rVal = parseInt(localStorage.getItem(arKey) || "0", 10);
        if (rVal < 0) rVal = 0;
        setsPerformed.push(rVal);
      }
      // only push if there's at least one set
      if (setsPerformed.some(x => x > 0)) {
        result.push({
          sessionLabel: `W${weekNumber} D${d + 1}`,
          setsArray: setsPerformed
        });
      }
    }
  }
  return result;
}

// (E3) gatherConsistencyData -> for the heatmap
function gatherConsistencyData(exerciseName) {
  // We break it into 3 phases:
  //   => For each phase, we see which weeks belong (1-4 => P1, 5-8 => P2, 9-12 => P3).
  //   => For each week, see which days the exercise is scheduled.
  //   => Check how many sets were logged vs total sets.
  // We'll mark each scheduled day as green/yellow/red.
  let phases = { 1: [], 2: [], 3: [] };
  // phases[1] => array of {week:1..4, days: [ {dayNum, color} ]}

  for (let w = 0; w < twelveWeekProgram.length; w++) {
    const weekNumber = twelveWeekProgram[w].week;
    const ph = getPhaseFromWeek(weekNumber);
    const daysArr = twelveWeekProgram[w].days || [];
    let daysData = [];
    for (let d = 0; d < daysArr.length; d++) {
      const setsCount = getSetsCountInDay(daysArr[d], exerciseName);
      if (setsCount === 0) continue;  // exercise not scheduled
      // Count how many are actually logged
      let setsLogged = 0;
      for (let s = 1; s <= setsCount; s++) {
        const setKey = `set_${w}_${d}_${exerciseName}_${s}`;
        if (loadCheckboxState(setKey)) {
          setsLogged++;
        }
      }
      // color logic
      let color = "red"; // default if no sets logged
      if (setsLogged > 0 && setsLogged < setsCount) {
        color = "yellow";
      } else if (setsLogged === setsCount) {
        color = "green";
      }
      daysData.push({
        dayNum: d + 1,
        color: color
      });
    }
    phases[ph].push({
      week: weekNumber,
      days: daysData
    });
  }
  return phases;
}

function isExerciseInDay(dayObj, exerciseName) {
  let found = false;
  ["warmUp", "mainWork", "coolDown", "exercises"].forEach(section => {
    if (Array.isArray(dayObj[section])) {
      dayObj[section].forEach(ex => {
        if (ex.exercises && Array.isArray(ex.exercises)) {
          ex.exercises.forEach(sub => {
            if (sub.name === exerciseName) found = true;
          });
        } else {
          if (ex.name === exerciseName) found = true;
        }
      });
    }
  });
  return found;
}

function getSetsCountInDay(dayObj, exerciseName) {
  // return total sets for that exercise
  let totalSets = 0;
  ["warmUp", "mainWork", "coolDown", "exercises"].forEach(section => {
    if (!dayObj[section]) return;
    dayObj[section].forEach(ex => {
      if (ex.exercises && Array.isArray(ex.exercises)) {
        ex.exercises.forEach(sub => {
          if (sub.name === exerciseName) {
            totalSets += (sub.sets || 0);
          }
        });
      } else {
        if (ex.name === exerciseName) {
          totalSets += (ex.sets || 0);
        }
      }
    });
  });
  return totalSets;
}

// -----------------------------------------------------
// (F) Rendering the charts
//     For a simple approach, we’ll assume you have Chart.js or do minimal "vanilla" draws
//     (Below is an example with minimal Chart.js usage. 
//      If you *cannot* load external libs, you'll do custom canvas draws.)
// -----------------------------------------------------
let volumeChartInstance = null;
let repsSetsChartInstance = null;

// (F1) Volume line chart
function renderVolumeLineChart(dataArray) {
  // dataArray => [ {sessionLabel, totalVolume}, ...]
  const ctx = document.getElementById("chartTotalVolume").getContext("2d");
  // Destroy old instance if exists
  if (volumeChartInstance) {
    volumeChartInstance.destroy();
  }
  if (dataArray.length === 0) {
    // If no data, create a blank or small placeholder
    volumeChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          label: "No Data",
          data: []
        }]
      }
    });
    return;
  }
  const labels = dataArray.map(x => x.sessionLabel);
  const volumes = dataArray.map(x =>
    getPreferredWeightUnit() === "lbs" ? kgToLbs(x.totalVolume) : x.totalVolume
  );
  volumeChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Total Volume (${getPreferredWeightUnit()})`,
          data: volumes,
          fill: false,
          tension: 0,
          pointRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              let val = context.parsed.y || 0;
              return "Total: " + formatWeight(val);
            }
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: `Volume (${getPreferredWeightUnit()})`
          }
        },
        x: {
          title: {
            display: true,
            text: "Session"
          }
        }
      }
    }
  });
}

// (F2) Reps & Sets stacked bar
function renderRepsSetsChart(dataArray) {
  const ctx = document.getElementById("chartRepsSets").getContext("2d");
  if (repsSetsChartInstance) {
    repsSetsChartInstance.destroy();
  }

  if (dataArray.length === 0) {
    // Show an empty dataset so user sees axis, title, etc.
    repsSetsChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["No Sessions"],
        datasets: [
          {
            label: "Set 1",
            data: [0],
            backgroundColor: "#cccccc"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: "Session" }
          },
          y: {
            title: { display: true, text: "Reps" }
          }
        },
        plugins: {
          tooltip: {
            enabled: false // or show a minimal tooltip if you want
          }
        }
      }
    });
    return;
  }

  // We need a stacked approach: each set is a dataset
  // But dataArray might vary in how many sets (some sessions might have 3 sets, others 4, etc.)
  // Let’s find the maximum # of sets
  let maxSets = 0;
  dataArray.forEach(item => {
    if (item.setsArray.length > maxSets) {
      maxSets = item.setsArray.length;
    }
  });
  let labels = dataArray.map(x => x.sessionLabel);

  // We'll build maxSets datasets
  let datasets = [];
  for (let s = 0; s < maxSets; s++) {
    // each set => e.g. "Set #1", "Set #2"
    let dataPoints = dataArray.map(sess => {
      // if that session doesn't have a setsArray[s], use 0
      return sess.setsArray[s] || 0;
    });
    datasets.push({
      label: `Set ${s + 1}`,
      data: dataPoints
    });
  }

  repsSetsChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y} reps`;
            },
            footer: function (tooltipItems) {
              // Show total sets, e.g. “Session: 4 sets (12,12,10,10)”
              if (tooltipItems.length > 0) {
                const idx = tooltipItems[0].dataIndex;
                const setsForSession = dataArray[idx].setsArray;
                const count = setsForSession.length;
                const repStr = setsForSession.join(", ");
                return `Session: ${count} sets (${repStr})`;
              }
              return "";
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: "Session"
          }
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: "Reps"
          }
        }
      }
    }
  });
}

// (F3) Consistency Heatmap 
function renderConsistencyHeatmap(dataObj) {
  // 1) Clear out the original container
  const container = document.getElementById("heatmapContainer");
  container.innerHTML = "";

  // 2) Remove any previously-created "extra" heatmap card from a prior call
  const existingExtra = document.getElementById("extraHeatmapCard");
  if (existingExtra) {
    existingExtra.remove();
  }

  // Gather your sessions as before
  const exerciseName = dataObj.exerciseName;
  const activeWeek = parseInt(localStorage.getItem("activeWorkoutWeek") || "1", 10);

  let allSessions = [];
  for (let w = 1; w <= 12; w++) {
    const weekData = twelveWeekProgram.find(weekObj => weekObj.week === w);
    if (!weekData) continue;

    for (let d = 1; d <= 7; d++) {
      if (d - 1 >= weekData.days.length) break;
      const setsCount = getSetsCountInDay(weekData.days[d - 1], exerciseName);
      if (setsCount > 0) {
        let completed = 0;
        for (let s = 1; s <= setsCount; s++) {
          const setKey = `set_${w - 1}_${d - 1}_${exerciseName}_${s}`;
          if (loadCheckboxState(setKey)) {
            completed++;
          }
        }

        // Determine color
        let color = "gray";
        if (completed === setsCount) {
          // fully completed
          if (w === activeWeek) {
            color = "green";
            localStorage.setItem(`heatmapGreen_${exerciseName}_week${w}_day${d}`, "true");
          } else if (w < activeWeek) {
            if (localStorage.getItem(`heatmapGreen_${exerciseName}_week${w}_day${d}`) === "true") {
              color = "green";
            } else {
              color = "blue";
            }
          }
        } else if (completed > 0) {
          color = "yellow";
        } else if (w < activeWeek) {
          color = "red";
        }
        allSessions.push({
          label: `W${w} D${d}`,
          color: color
        });
      }
    }
  }

  // Helper: chunk an array of session objects into rows of 4, 
  // and append them to a given container (the .heatmap-container).
  function appendRowsOf4(sessions, containerEl) {
    const rowSize = 4;
    for (let i = 0; i < sessions.length; i += rowSize) {
      const rowItems = sessions.slice(i, i + rowSize);

      const rowDiv = document.createElement("div");
      rowDiv.style.display = "flex";
      rowDiv.style.gap = "8px";
      rowDiv.style.marginBottom = "8px";

      rowItems.forEach(item => {
        const cell = document.createElement("div");
        cell.classList.add("heatmap-cell");
        cell.textContent = item.label;

        switch (item.color) {
          case "green":
            cell.classList.add("green");
            break;
          case "blue":
            cell.classList.add("blue");
            break;
          case "yellow":
            cell.style.backgroundColor = "#ffc107";
            cell.style.color = "#000";
            break;
          case "red":
            cell.classList.add("red");
            break;
          default:
            cell.style.backgroundColor = "#ccc";
            cell.style.color = "#000";
        }

        rowDiv.appendChild(cell);
      });
      containerEl.appendChild(rowDiv);
    }
  }

  // 3) Display the first 16 cells in the original container
  const firstChunk = allSessions.slice(0, 16);
  appendRowsOf4(firstChunk, container);

  // 4) If there are more than 16 cells, create ONE extra card for the remainder
  if (allSessions.length > 16) {
    const secondChunk = allSessions.slice(16);

    const extraCard = document.createElement("div");
    extraCard.classList.add("recap-card", "trend-card");
    extraCard.id = "extraHeatmapCard";

    const titleEl = document.createElement("div");
    titleEl.classList.add("recap-card-title");
    titleEl.textContent = "Consistency Heatmap";
    extraCard.appendChild(titleEl);

    const extraContainer = document.createElement("div");
    extraContainer.classList.add("heatmap-container");
    extraContainer.id = "extraHeatmapContainer";
    extraCard.appendChild(extraContainer);

    // Append the second chunk of rows to that new container
    appendRowsOf4(secondChunk, extraContainer);

    // Finally, insert this extra card into the .trend-cards slider
    // so it appears as an additional swipe card
    const trendsCards = document.getElementById("strengthTrendsCards");
    trendsCards.appendChild(extraCard);
  }
}

// -----------------------------------------------------
// (G) Coach Insights
// -----------------------------------------------------
function buildCoachInsightsFor(exerciseName) {
  const heading = document.getElementById("coachInsightsHeading");
  const container = document.getElementById("coachInsightsContainer");
  const msgEl = document.getElementById("coachInsightsMessage");
  if (!heading || !container || !msgEl) return;

  // Reset 
  heading.style.display = "none";
  container.style.display = "none";
  msgEl.textContent = "";

  // 1) Determine the user's "current" training week
  //    In practice, we can read activeWorkoutWeek or currentWeekIndex, whichever you prefer.
  let activeW = parseInt(localStorage.getItem("activeWorkoutWeek") || "1", 10);
  if (activeW < 1) activeW = 1;

  // If activeW > purchasedWeeks, clamp
  if (activeW > purchasedWeeks) {
    activeW = purchasedWeeks;
  }

  // 2) If it’s week 1 => show "just getting started..."
  if (activeW === 1) {
    heading.style.display = "block";
    container.style.display = "block";
    msgEl.textContent = "You're just getting started — coach insights will appear once there's more data to analyze.";
    return;
  }

  // 3) Check if the current week is deload
  if (isDeloadWeek(activeW)) {
    // If no prior training week to compare, show “You’re in a deload week...”
    // We also skip the coach insights if 2+ sessions don't exist outside the deload.
    // We'll do a quick check if there's *any* valid training week < activeW that isn't deload
    let anyValid = false;
    for (let w = 1; w < activeW; w++) {
      if (!isDeloadWeek(w)) {
        anyValid = true;
        break;
      }
    }
    heading.style.display = "block";
    container.style.display = "block";
    if (!anyValid) {
      msgEl.textContent = "You're in a deload week — perfect time to recover and reflect. Coach insights will return once you're back in a training phase.";
    } else {
      msgEl.textContent = "You're in a deload week — perfect time to recover and reflect. No new insights for this week.";
    }
    return;
  }

  // 4) Gather all sessions (excluding deload weeks). If fewer than 2 total sessions for this exercise => no insights.
  let sessions = gatherSessionsForExercise(exerciseName, /*excludeDeload=*/true);
  if (sessions.length < 2) {
    heading.style.display = "block";
    container.style.display = "block";
    msgEl.textContent = "You're just getting started with this lift — need at least 2 logged sessions for insights!";
    return;
  }

  // 5) We do 3 checks:
  //    (1) Volume up/down since Week 1
  //    (2) Absolute weight up/down since Week 1
  //    (3) Heaviest top set progress or stagnation
  // We'll compile potential messages, then pick just 1 to display (random or priority-based).

  const earliestSession = sessions[0];  // The first session in a non-deload week
  const currentSession = sessions[sessions.length - 1]; // The most recent

  // (1) Volume difference
  let volDiff = currentSession.totalVolume - earliestSession.totalVolume;
  let volPctDiff = 0;
  if (earliestSession.totalVolume > 0) {
    volPctDiff = (volDiff / earliestSession.totalVolume) * 100;
  }
  // round them nicely
  volDiff = Math.round(volDiff);
  volPctDiff = Math.round(volPctDiff);

  let volumeMsg = "";
  if (volDiff > 0) {
    volumeMsg = `Your volume is up ${formatWeight(volDiff)} since Week 1 — you’re building serious momentum.`;
  } else if (volDiff < 0) {
    volumeMsg = `Volume has dropped ${Math.abs(volDiff)}kg since Week 1 — try dialing in your consistency or intensity.`;
  }

  let volumePctMsg = "";
  if (volPctDiff > 0) {
    volumePctMsg = `Your volume is up ${volPctDiff}% since Week 1 — you’re building serious momentum.`;
  } else if (volPctDiff < 0) {
    volumePctMsg = `Volume has dropped ${Math.abs(volPctDiff)}% since Week 1 — try dialing in your consistency or intensity.`;
  }

  // (2) Weighted top set difference
  // We track the heaviest top set each session => compare earliest vs current
  let topSetDiff = currentSession.topSetWeight - earliestSession.topSetWeight;
  let topSetMsg = "";
  if (topSetDiff > 0) {
    topSetMsg = `Your top set has climbed from ${earliestSession.topSetWeight}kg to ${currentSession.topSetWeight}kg — huge strength gains.`;
  } else if (topSetDiff < 0) {
    let absDiff = Math.abs(topSetDiff);
    topSetMsg = `Your top set dropped by ${absDiff}kg — consider focusing on form or consistent effort.`;
  }

  // (3) Stagnation check: if the last 3 sessions all have the same top set weight
  // or if it hasn't increased in 3+ consecutive sessions.
  let stagnationMsg = checkStagnation(sessions);

  // Build an array of all possible messages that are “true” for the user
  let possibleMessages = [];
  if (volumeMsg) possibleMessages.push(volumeMsg);
  if (volumePctMsg) possibleMessages.push(volumePctMsg);
  if (topSetMsg) possibleMessages.push(topSetMsg);
  if (stagnationMsg) possibleMessages.push(stagnationMsg);

  if (possibleMessages.length === 0) {
    // No changes at all => fallback
    return; // simply hide the coach insights
  }

  // We only display 1 message
  heading.style.display = "block";
  container.style.display = "block";

  // For simplicity, pick at random:
  let chosen = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
  msgEl.innerHTML = chosen;
}

// Helper: gather sessions for the given exercise, ignoring deload weeks, sorted by actual chronological order
// Each session => { weekNum, dayNum, totalVolume, topSetWeight }
function gatherSessionsForExercise(exerciseName, excludeDeload) {
  let arr = [];
  for (let w = 0; w < twelveWeekProgram.length; w++) {
    const weekNumber = twelveWeekProgram[w].week;
    if (excludeDeload && isDeloadWeek(weekNumber)) continue;

    const daysArr = twelveWeekProgram[w].days || [];
    for (let d = 0; d < daysArr.length; d++) {
      const setsCount = getSetsCountInDay(daysArr[d], exerciseName);
      if (setsCount <= 0) continue;
      // sum volume, find top set
      let totalVol = 0;
      let maxSet = 0;
      for (let s = 1; s <= setsCount; s++) {
        const awKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualWeight");
        const arKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualReps");
        let wVal = parseFloat(localStorage.getItem(awKey) || "0");
        let rVal = parseInt(localStorage.getItem(arKey) || "0", 10);
        totalVol += (wVal * rVal);
        if (wVal > maxSet) maxSet = wVal;
      }
      if (totalVol > 0 || maxSet > 0) {
        arr.push({
          weekNum: weekNumber,
          dayNum: d + 1,
          totalVolume: totalVol,
          topSetWeight: maxSet
        });
      }
    }
  }
  // sort by (weekNum ascending, dayNum ascending)
  arr.sort((a, b) => {
    if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
    return a.dayNum - b.dayNum;
  });
  return arr;
}

// Helper: if last 3 consecutive sessions have the same top set weight, we say it's stagnant
function checkStagnation(sessions) {
  if (sessions.length < 3) return "";
  let len = sessions.length;
  let w0 = sessions[len - 3].topSetWeight;
  let w1 = sessions[len - 2].topSetWeight;
  let w2 = sessions[len - 1].topSetWeight;
  if (w0 === w1 && w1 === w2 && w2 > 0) {
    return `You've stayed at ${w2}kg for the past 3 sessions — 
      <a href="tutorial-placeholder.html" target="_blank">click here</a> 
      to focus on form.`;
  }
  return "";
}

/****************************************************************************
 *  BODY COMPOSITION & GOAL PROGRESS LOGIC
 ****************************************************************************/

let bodyWeightChartInstance = null;
let bodyWeightDataPoints = [];
// This will store objects: { date: 'YYYY-MM-DD', weight: number }

function showBodyCompositionSection() {
  const container = document.getElementById("bodyCompositionSection");
  if (!container) return;

  // If user has AWT, show the section:
  if (hasPurchasedAWT) {
    container.style.display = "block";
    initBodyWeightChart();
    loadGoalProgressInputs();
    updateGoalProgressUI();
    checkRecentMilestones();
    showBodyCompCoachInsights();
  } else {
    container.style.display = "none";
  }
}

/** Initialize the line chart for bodyweight **/
function initBodyWeightChart() {
  const ctx = document.getElementById("bodyWeightChart");
  if (!ctx) return;

  // Gather any previously logged data from localStorage
  let stored = localStorage.getItem("bodyWeightLogs") || "[]";
  try {
    bodyWeightDataPoints = JSON.parse(stored);
  } catch (e) {
    bodyWeightDataPoints = [];
  }

  // Sort them by date
  bodyWeightDataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Build labels & data arrays
  const labels = bodyWeightDataPoints.map(dp => dp.date);
  const weights = bodyWeightDataPoints.map(dp =>
    getPreferredWeightUnit() === "lbs" ? kgToLbs(dp.weight) : dp.weight
  );

  if (bodyWeightChartInstance) {
    bodyWeightChartInstance.destroy();
  }

  bodyWeightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Body Weight (${getPreferredWeightUnit()})`,
        data: weights,
        fill: false,
        tension: 0.1,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: "Date"
          }
        },
        y: {
          title: {
            display: true,
            text: `Weight (${getPreferredWeightUnit()})`
          },
          suggestedMin: 0 // or near the user's lowest weight
        }
      }
    }
  });
}

/** Redraw the chart after new logs **/
function updateBodyWeightChart() {
  if (!bodyWeightChartInstance) return;
  // Re-sort the data in case new entries were added
  bodyWeightDataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = bodyWeightDataPoints.map(dp => dp.date);
  const weights = bodyWeightDataPoints.map(dp =>
    getPreferredWeightUnit() === "lbs" ? kgToLbs(dp.weight) : dp.weight
  );

  bodyWeightChartInstance.data.labels = labels;
  bodyWeightChartInstance.data.datasets[0].data = weights;
  bodyWeightChartInstance.update();
}

/** Read stored goal/current from localStorage & populate inputs **/
function loadGoalProgressInputs() {
  const goalWeightInput = document.getElementById("goalWeightInput");
  const goalByDateInput = document.getElementById("goalByDateInput");
  const currentWeightInput = document.getElementById("currentWeightInput");
  // const currentWeightDateInput = document.getElementById("currentWeightDateInput");

  // Stored values are always in kilograms
  const storedGoalKg = parseFloat(localStorage.getItem("userGoalWeight") || "");
  const storedCurrKg = parseFloat(localStorage.getItem("userCurrentWeight") || "");
  const storedGoalDate = localStorage.getItem("userGoalDate") || "";
  const storedCurrDate = localStorage.getItem("userCurrentWeightDate") || "";

  // Determine which unit to display
  const unit = getPreferredWeightUnit(); // "kg" or "lbs"

  // ─── 1) Populate Goal Weight field ─────────────────────────────
  // If we have a saved goal weight, convert to the user’s unit
  if (!isNaN(storedGoalKg)) {
    const displayGoal = unit === "lbs"
      ? kgToLbs(storedGoalKg).toFixed(1)
      : storedGoalKg.toFixed(1);
    goalWeightInput.value = displayGoal;
    goalWeightInput.placeholder = `${displayGoal} ${unit}`;
  } else {
    // no saved value yet, just show placeholder
    goalWeightInput.placeholder = `0.0 ${unit}`;
  }
  if (storedGoalDate) {
    goalByDateInput.value = storedGoalDate;
  }

  // ─── 2) Populate Current Weight field ──────────────────────────
  if (!isNaN(storedCurrKg)) {
    const displayCurr = unit === "lbs"
      ? kgToLbs(storedCurrKg).toFixed(1)
      : storedCurrKg.toFixed(1);
    // leave `value` blank so user types fresh, but show the placeholder
    currentWeightInput.value = "";
    currentWeightInput.placeholder = `${displayCurr} ${unit}`;
  } else {
    currentWeightInput.placeholder = `0.0 ${unit}`;
  }
  if (storedCurrDate) {
    // currentWeightDateInput.placeholder = storedCurrDate;
  }

  // ─── 3) Hook up the "Log Weight" button ────────────────────────
  const logBtn = document.getElementById("logWeightBtn");
  if (logBtn) {
    logBtn.addEventListener("click", handleLogWeight);
  }
}

/** Runs every time we need to recalc the progress bar, headings, etc. **/
function updateGoalProgressUI() {
  // Figure out which title to show based on the user's main goal
  // localStorage might have it stored as "goal" or similar
  const userGoal = localStorage.getItem("goal") || "Weight Loss"; // fallback

  const goalProgressTitle = document.getElementById("goalProgressTitle");
  const goalProgressValue = document.getElementById("goalProgressValue");

  if (userGoal === "Weight Loss") {
    goalProgressTitle.textContent = "Total Weight Loss:";
  } else if (userGoal === "Muscle Gain") {
    goalProgressTitle.textContent = "Total Weight Gained:";
  } else {
    // e.g. "Improve Body Composition"
    goalProgressTitle.textContent = "Weight Change:";
  }

  // The user’s original start weight is stored (?), or we may use localStorage.getItem("userBodyweight")
  const startWeight = parseFloat(localStorage.getItem("weight") || "70"); // user’s original weight

  // The "most recent current" = from localStorage
  const recentWeight = parseFloat(localStorage.getItem("userCurrentWeight") || startWeight);

  // Weight difference
  let diff = recentWeight - startWeight;
  if (userGoal === "Weight Loss") {
    diff = startWeight - recentWeight; // so if they've lost, it’s positive
  }
  goalProgressValue.textContent = ` ${formatWeight(diff)} so far`;
  // (It’ll show negative for weight loss if the userGoal is "Muscle Gain" etc.)

  // Update progress bar
  updateGoalProgressBar();

  // Update estimated time 
  updateEstimatedTimeLeft();
}

/** The main function that runs when user clicks "Log Weight" **/
function handleLogWeight() {
  const goalWeightInput = document.getElementById("goalWeightInput");
  const goalByDateInput = document.getElementById("goalByDateInput");
  const currentWeightInput = document.getElementById("currentWeightInput");

  // Read the raw numbers from the inputs (in user’s unit)
  let rawGoal = parseFloat(goalWeightInput.value || "");
  let rawCurr = parseFloat(currentWeightInput.value || "");

  if (isNaN(rawGoal)) {
    alert("Please enter your goal weight.");
    return;
  }
  if (isNaN(rawCurr)) {
    alert("Please enter your current weight.");
    return;
  }

  let goalDate = goalByDateInput.value;
  if (!goalDate) {
    alert("Please enter your goal date.");
    return;
  }

  // Convert both back to KG for storage/chart logic
  const goalKg = getPreferredWeightUnit() === "lbs"
    ? lbsToKg(rawGoal)
    : rawGoal;
  const currKg = getPreferredWeightUnit() === "lbs"
    ? lbsToKg(rawCurr)
    : rawCurr;

  // Today's date for logging
  const today = new Date().toISOString().slice(0, 10);

  // Persist
  localStorage.setItem("userGoalWeight", goalKg.toString());
  localStorage.setItem("userGoalDate", goalDate);
  localStorage.setItem("userCurrentWeight", currKg.toString());
  localStorage.setItem("userCurrentWeightDate", today);

  // Also add to chart data:
  bodyWeightDataPoints.push({ date: today, weight: currKg });
  localStorage.setItem("bodyWeightLogs", JSON.stringify(bodyWeightDataPoints));

  // Update the UI (placeholders, chart, progress, etc.)
  // — placeholder should continue to show in user unit
  if (getPreferredWeightUnit() === "lbs") {
    currentWeightInput.placeholder = kgToLbs(currKg).toFixed(1);
  } else {
    currentWeightInput.placeholder = currKg.toFixed(1);
  }
  currentWeightInput.value = "";             // clear the entry
  updateBodyWeightChart();                   // redraw chart
  updateGoalProgressUI();                    // progress bar & headings

  // Refresh any coach‑insights/milestones
  localStorage.removeItem("bodyCompCoachInsightDate");
  localStorage.removeItem("bodyCompCoachInsightMessage");
  checkRecentMilestones();
  showBodyCompCoachInsights();
}

/** Calculate the progress bar fill & percentage **/
function updateGoalProgressBar() {
  const startWeight = parseFloat(localStorage.getItem("weight") || "70");
  const userGoal = localStorage.getItem("goal") || "Weight Loss";
  const goalWeight = parseFloat(localStorage.getItem("userGoalWeight") || startWeight);
  const currWeight = parseFloat(localStorage.getItem("userCurrentWeight") || startWeight);

  const fillEl = document.getElementById("weightProgressFill");
  const percentEl = document.getElementById("weightProgressPercent");
  if (!fillEl || !percentEl) return;

  let minVal = Math.min(startWeight, goalWeight);
  let maxVal = Math.max(startWeight, goalWeight);

  if (Math.abs(startWeight - goalWeight) < 0.01) {
    fillEl.style.width = "100%";
    percentEl.textContent = "100%";
    return;
  }

  let totalDist = Math.abs(goalWeight - startWeight);
  let progressDist = 0;

  if (userGoal === "Weight Loss") {
    // If user started heavier, we measure how much they've lost
    progressDist = startWeight - currWeight;
    // -- CHANGE #3a: clamp to 0 if negative (moving away from goal) --
    if (progressDist < 0) progressDist = 0;
    if (progressDist > totalDist) progressDist = totalDist;
  }
  else if (userGoal === "Muscle Gain") {
    progressDist = currWeight - startWeight;
    if (progressDist < 0) progressDist = 0;
    if (progressDist > totalDist) progressDist = totalDist;
  }
  else {
    // "Improve Body Composition" => we decide direction based on whether goalWeight < or > startWeight
    if (goalWeight < startWeight) {
      // Treat it like weight loss
      progressDist = startWeight - currWeight;
      if (progressDist < 0) progressDist = 0;
    } else {
      // Treat it like muscle gain
      progressDist = currWeight - startWeight;
      if (progressDist < 0) progressDist = 0;
    }
    if (progressDist > totalDist) progressDist = totalDist;
  }

  let pct = (progressDist / totalDist) * 100;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;

  fillEl.style.width = pct.toFixed(1) + "%";
  percentEl.textContent = pct.toFixed(1) + "%";
}

/** Estimate time left using either the deficit/surplus approach (if <2 logs) or a linear trend (>=2 logs) **/
function updateEstimatedTimeLeft() {
  const estTimeEl = document.getElementById("estimatedTimeLeft");
  const estGoalDateEl = document.getElementById("estimatedGoalDate");
  const container = document.getElementById("estimatedTimeContainer");
  if (!estTimeEl || !estGoalDateEl || !container) return;

  // Clear old text, hide container by default.
  estTimeEl.textContent = "";
  estGoalDateEl.textContent = "";
  container.style.display = "none";

  const goalWeight = parseFloat(localStorage.getItem("userGoalWeight") || "0");
  const currWeight = parseFloat(localStorage.getItem("userCurrentWeight") || "0");

  // If user hasn't set a goal/current weight, do nothing more.
  if (!goalWeight || !currWeight) {
    return;
  }

  // If we have fewer than 2 logs, use the 7700kcal assumption.
  if (bodyWeightDataPoints.length < 2) {
    let dailyCalsWkKeys = [];
    for (let i = 1; i <= 12; i++) {
      dailyCalsWkKeys.push(`week${i}_dailyCalsWMCO`);
    }

    let totalNetKcal = 0;
    const maintenanceCals = parseInt(localStorage.getItem("maintenanceCals") || "2200", 10);

    for (let i = 0; i < dailyCalsWkKeys.length; i++) {
      let programVal = parseInt(localStorage.getItem(dailyCalsWkKeys[i]) || "0", 10);
      if (programVal > 0) {
        let net = maintenanceCals - programVal;
        totalNetKcal += net * 7;
      }
    }

    let kgChange = totalNetKcal / 7700;
    let needed = Math.abs(goalWeight - currWeight);

    // If net is zero, we can't estimate properly
    if (kgChange === 0) {
      estTimeEl.textContent = "No deficit/surplus found."; // Put a period here
      return; // container stays hidden
    }

    let weeksNeeded = needed / Math.abs(kgChange / 12);
    let wks = Math.ceil(weeksNeeded);
    if (wks < 1) wks = 1;

    // If more than 20 weeks, hide entirely
    if (wks > 20) {
      return;
    }

    // If it’s 1 or 2+ weeks, add a period at the end
    let weekLabel = (wks === 1) ? "1 Week." : `${wks} Weeks.`;

    // Fill the text nodes
    estTimeEl.textContent = weekLabel;

    // Add a period after the date as well
    let now = new Date();
    now.setDate(now.getDate() + wks * 7);
    estGoalDateEl.textContent = formatDateForDisplay(now) + ".";

    // Finally, show the container
    container.style.display = "block";
    return;
  }

  // If we have 2+ logs, do slope approach
  let sorted = [...bodyWeightDataPoints].sort((a, b) => new Date(a.date) - new Date(b.date));
  let firstEntry = sorted[0];
  let lastEntry = sorted[sorted.length - 1];

  let deltaWeight = lastEntry.weight - firstEntry.weight;
  let deltaDays = (new Date(lastEntry.date) - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24);
  if (deltaDays < 1) deltaDays = 1;

  let slopePerDay = deltaWeight / deltaDays;
  let needed = goalWeight - currWeight;

  // If slope is ~0 => “stalled”
  if (Math.abs(slopePerDay) < 0.001) {
    // No display
    return;
  }

  // If negative => user is moving away from goal
  let daysNeeded = needed / slopePerDay;
  if (daysNeeded < 0) {
    return;
  }

  let roundDays = Math.ceil(daysNeeded);
  let wks = Math.ceil(roundDays / 7);
  if (wks < 1) wks = 1;
  if (wks > 20) {
    return;
  }

  let weekLabel = (wks === 1) ? "1 Week." : `${wks} Weeks.`;
  estTimeEl.textContent = weekLabel;

  let now = new Date();
  now.setDate(now.getDate() + roundDays);
  estGoalDateEl.textContent = formatDateForDisplay(now) + ".";

  container.style.display = "block";
}

// Same date formatter as before
function formatDateForDisplay(dateObj) {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return dateObj.toLocaleDateString(undefined, options);
}

/** Check for recent milestone triggers & display a single random message if any. **/
function checkRecentMilestones() {
  const mileEl = document.getElementById("recentMilestones");
  if (!mileEl) return;

  // 1) figure out the user's goal
  const rawGoal = localStorage.getItem("userGoal") || localStorage.getItem("goal") || "";
  const goal = rawGoal.toLowerCase().trim();
  const isWeightLoss = goal.includes("loss");
  const isMuscleGain = goal.includes("gain");
  const isBodyComp   = goal.includes("composition") || goal.includes("comp");

  // 2) collect any milestones
  const triggered = [];

  if (bodyWeightDataPoints.length > 1) {
    const latest = bodyWeightDataPoints[bodyWeightDataPoints.length - 1].weight;

    // lowest
    const lowest = Math.min(...bodyWeightDataPoints.map(p => p.weight));
    if ((isWeightLoss || isBodyComp) && latest === lowest) {
      triggered.push("You've hit a new lowest weight — amazing progress!");
    }

    // highest
    const highest = Math.max(...bodyWeightDataPoints.map(p => p.weight));
    if ((isMuscleGain || isBodyComp) && latest === highest) {
      triggered.push("New peak weight achieved — solid work building mass!");
    }
  }

  // 3) exact goal‐weight check
  const goalWeight = parseFloat(localStorage.getItem("userGoalWeight") || "0");
  const currWeight = parseFloat(localStorage.getItem("userCurrentWeight") || "0");
  if (goalWeight > 0 && Math.abs(currWeight - goalWeight) < 0.1) {
    triggered.push("Goal reached — incredible job sticking with it!");
  }

  // 4) render or hide
  if (triggered.length === 0) {
    mileEl.style.display = "none";
    mileEl.textContent = "";
  } else {
    mileEl.style.display = "block";
    mileEl.classList.add("coach-insights-note");
    mileEl.textContent = triggered[Math.floor(Math.random() * triggered.length)];
  }
}

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

window.addEventListener("load", () => {
  const lastTab = localStorage.getItem("lastSelectedTab") || "myWorkouts";
  if (lastTab === "myProgress") {
    // Programmatically click the "My Progress" tab
    myProgressTab.click();
  } else {
    // default to myWorkouts
    myWorkoutsTab.click();
  }
  const savedTime = localStorage.getItem("restTimerRemaining");
  if (savedTime) {
    const parsedTime = parseInt(savedTime, 10);

    // Only show the timer if there is time left (parsedTime > 0)
    if (parsedTime > 0) {
      showRestTimer(parsedTime);

      // Auto-pause so it doesn’t run immediately
      restTimerPaused = true;

      // Show “Play” instead of “Pause”
      const pauseIcon = document.getElementById("timerPauseIcon");
      const playIcon = document.getElementById("timerPlayIcon");
      if (pauseIcon && playIcon) {
        pauseIcon.style.display = "none";
        playIcon.style.display = "block";
      }

      // If minimized was saved, reflect that
      if (localStorage.getItem("restTimerMinimized") === "true") {
        currentRestTimerElement.classList.add("minimized");
        restTimerMinimized = true;
      }
    } else {
      // If time is 0 or invalid, remove it so the timer won't reappear at 00:00 or 00:01
      localStorage.removeItem("restTimerRemaining");
    }
  }
  addTrackerBadge();
  applyAWTSubscriptionNavLock()
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
  if (!overlay || localStorage.getItem('wt_onboarding_complete')) return;

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
  overlay.addEventListener('click', e => {
    if (e.target.matches('.wt-next-btn')) nextSlide();
    if (e.target.matches('.wt-close-btn')) {
      localStorage.setItem('wt_onboarding_complete', '1');
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
      beforeImg = "src/images/harry_chest_before.jpg";
      afterImg = "src/images/harry_chest_after.jpg";
    } else {
      if (gender === "female") {
        name = "Alice";
        txt = "This changed everything. I feel lighter, healthier, and in control for once.";
        beforeImg = "src/images/halima_back_before.jpg";
        afterImg = "src/images/halima_back_after.jpg";
      } else {
        name = "Bob";
        txt = "I’ve dropped the weight, feel sharper, and finally feel like myself again.";
        beforeImg = "src/images/lynn_before.JPEG";
        afterImg = "src/images/lynn_after.png";
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
        <img src="src/images/5-stars.png" alt="5 Stars" width="100">
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
      const weekKey  = "ctUpsell_shown_week" + (weekIdx + 1);
    
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