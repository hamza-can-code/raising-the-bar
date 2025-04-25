/*********************************************
 * NUTRITION TRACKER 
 * 
 * This file is structured similarly to workout-tracker.js,
 * but adapted for the new "Nutrition Tracker" features.
 *********************************************/

if (localStorage.getItem("hasAWTSubscription") !== "true") {
  localStorage.setItem("hasAWTSubscription", "true");
}
if (localStorage.getItem("hasPOSAddOnForAWT") !== "true") {
  localStorage.setItem("hasPOSAddOnForAWT", "true");
}

const sub = (localStorage.getItem("hasAWTSubscription") === "true");
const pos = (localStorage.getItem("hasPOSAddOnForAWT") === "true");
if (sub || pos) {
  hasPurchasedAWT = true;
}

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

// Fade-in elements
const fadeInElements = document.querySelectorAll(".fade-in");
fadeInElements.forEach((element, index) => {
  setTimeout(() => {
    element.classList.add("visible");
  }, index * 500);
});

if (window.previousSummaryExists === undefined) {
  window.previousSummaryExists = false;
}

if (window.previousMealPrepExists === undefined) {
  window.previousMealPrepExists = false;
}

// Register a plugin that applies a shadow before drawing the datasets.
Chart.register({
  id: 'shadowPlugin',
  // Before drawing the datasets, save the context, and set the shadow options.
  beforeDatasetsDraw: (chart, args, pluginOptions) => {
    const ctx = chart.ctx;
    // Save the current state so we can restore later.
    ctx.save();
    // Set shadow options – adjust as needed for a subtle shadow.
    ctx.shadowColor = pluginOptions.shadowColor || 'rgba(0, 0, 0, 0.04)';
    ctx.shadowBlur = pluginOptions.shadowBlur || 5;
    ctx.shadowOffsetX = pluginOptions.shadowOffsetX || 3;
    ctx.shadowOffsetY = pluginOptions.shadowOffsetY || 3;
  },
  // After the datasets are drawn, restore the context to remove the shadow.
  afterDatasetsDraw: (chart, args, pluginOptions) => {
    chart.ctx.restore();
  }
});

// let cardCount = 6;
let macroChartRef = null;
let macroChartInstance = null;

function updateActiveWeek() {
  // 1. Get programStartDate from localStorage.
  //    If it isn’t set, use today’s date (at midnight) and save it.
  let rawStart = localStorage.getItem("programStartDate");
  if (!rawStart) {
    const today = new Date();
    setToMidnight(today);
    rawStart = today.toISOString();
    localStorage.setItem("programStartDate", rawStart);
    console.log("Program start date set to today:", today.toString());
  }
  
  // 2. Calculate the calendar week based on programStartDate
  const startDate = new Date(rawStart);
  const now = new Date();
  const diffTime = now - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let calendarWeek = Math.floor(diffDays / 7) + 1;
  if (calendarWeek < 1) {
    calendarWeek = 1;
  }

  // 3. Get any locked active week (set when logging in a later week)
  let lockedActiveWeek = parseInt(localStorage.getItem("lockedActiveWeek") || "0", 10);
  let activeWeek = 0;
  if (lockedActiveWeek > 0 && calendarWeek < 3) {
    activeWeek = lockedActiveWeek;
  } else {
    // NEW: If the calendar suggests Week 2 but no meal data exists, force activeWeek to remain 1.
    if (calendarWeek === 2 && !hasNutritionData()) {
      activeWeek = 1;
    } else {
      activeWeek = calendarWeek;
    }
    // For Weeks 3 and beyond, clear any locked value.
    if (calendarWeek >= 3) {
      localStorage.removeItem("lockedActiveWeek");
    }
  }

  // 4. Save the active week for both trackers.
  localStorage.setItem("activeWorkoutWeek", activeWeek.toString());
  localStorage.setItem("activeNutritionWeek", activeWeek.toString());

  console.log(`Active week updated: Week ${activeWeek}`);
  console.log("12 Week Calendar Dates:");
  for (let w = 1; w <= 12; w++) {
    let weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (w - 1) * 7);
    console.log(`Week ${w} starts on ${weekStart.toLocaleDateString()}`);
  }
  return activeWeek;
}

/***************************************************
 * SHARED ACTIVE WEEK LOGIC
 ***************************************************/

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

///////////////////////////
// 1) Shared XP System
///////////////////////////
let currentXP = parseInt(localStorage.getItem("currentXP") || "0", 10);
let currentLevel = parseInt(localStorage.getItem("currentLevel") || "0", 10);
let xpBarAnimating = false;
let xpAnimationFrameId = null;
let displayedXP = currentXP;
let xpRecentlyGained = false;
let stickyHeaderForceVisible = false;
let stickyHeaderTimerId = null;
let previousFillPercent = 0;

const xpLevels = [10, 20, 40, 70, 100, 130, 160, 190, 220, 250];
function xpNeededForLevel(level) {
  if (level < xpLevels.length) return xpLevels[level];
  return 250;
}

function updateLevelLabel(lvl) {
  const label = document.getElementById("current-level");
  if (label) label.textContent = `Lvl ${lvl}`;
  const stickyLabel = document.getElementById("stickyCurrentLevel");
  if (stickyLabel) stickyLabel.textContent = `Lvl ${lvl}`;
}

function animateXPGain(amount) {
  const mainEl = document.getElementById("xp-gain-animation");
  const stickyEl = document.getElementById("sticky-xp-gain-animation");
  if (mainEl) {
    if (mainEl.timeoutId) clearTimeout(mainEl.timeoutId);
    mainEl.textContent = `+${amount} XP`;
    mainEl.style.opacity = "1";
    mainEl.style.transform = "translateY(-10px)";
    mainEl.timeoutId = setTimeout(() => {
      mainEl.style.opacity = "0";
      mainEl.style.transform = "translateY(0px)";
    }, 2000);
  }
  if (stickyEl) {
    if (stickyEl.timeoutId) clearTimeout(stickyEl.timeoutId);
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

function getNutritionStreakMultiplier() {
  // For example, each day in the streak adds 5% extra XP, up to a maximum multiplier of 1.5
  return Math.min(1 + (nutritionStreakCount * 0.05), 1.5);
}

function addXP(amount) {
  if (amount <= 0) return;

  animateXPGain(amount);

  const oldXP = currentXP;
  currentXP += amount;
  localStorage.setItem("currentXP", currentXP.toString());

  // NEW: Update the progress score aggregator with a streak multiplier.
  // Retrieve the current progress score (or 0 if not set)
  let currentProgressScore = parseInt(localStorage.getItem("progressScore") || "0", 10);
  // Calculate the multiplier based on the nutrition streak
  let streakMultiplier = getNutritionStreakMultiplier();
  // Multiply the XP amount by the streak multiplier
  let xpAddition = Math.round(amount * streakMultiplier);
  currentProgressScore += xpAddition;
  localStorage.setItem("progressScore", currentProgressScore.toString());

  xpRecentlyGained = true;

  if (stickyHeaderTimerId) clearTimeout(stickyHeaderTimerId);
  stickyHeaderTimerId = setTimeout(() => {
    xpRecentlyGained = false;
  }, 3000);

  checkProgressBarVisibility();

  if (!xpBarAnimating) {
    xpBarAnimating = true;
    requestAnimationFrame(updateXPBarAnimation);
  }
}

function updateXPBarAnimation() {
  const xpBarFill = document.getElementById("xpBarFill");
  if (!xpBarFill) return;
  const xpNeeded = xpNeededForLevel(currentLevel);
  let targetXP = (currentXP < xpNeeded) ? currentXP : xpNeeded;
  let diff = targetXP - displayedXP;
  const animationSpeed = 0.05;

  if (Math.abs(diff) > 0.01) {
    displayedXP += diff * animationSpeed;
  } else {
    displayedXP = targetXP;
  }

  let percent = (displayedXP / xpNeeded) * 100;
  if (percent > 100) percent = 100;

  // Force reflow before updating width
  xpBarFill.offsetWidth;
  xpBarFill.style.width = percent.toFixed(0) + "%";

  const stickyFill = document.getElementById("stickyXpBarFill");
  if (stickyFill) {
    // Force reflow on stickyFill as well
    stickyFill.offsetWidth;
    stickyFill.style.width = percent.toFixed(0) + "%";
  }

  checkProgressBarVisibility();

  if (displayedXP >= xpNeeded) {
    cancelAnimationFrame(xpBarAnimationFrameId);
    stickyHeaderForceVisible = true;
    currentXP -= xpNeeded;
    localStorage.setItem("currentXP", currentXP.toString());
    currentLevel++;
    localStorage.setItem("currentLevel", currentLevel.toString());
    updateLevelLabel(currentLevel);
    displayedXP = 0;
    xpBarFill.style.width = "0%";
    if (stickyFill) stickyFill.style.width = "0%";
    if (currentXP > 0) {
      requestAnimationFrame(updateXPBarAnimation);
    } else {
      xpBarAnimating = false;
    }
    setTimeout(() => {
      stickyHeaderForceVisible = false;
      xpRecentlyGained = false;
      checkProgressBarVisibility();
    }, 3000);
  } else {
    xpBarAnimationFrameId = requestAnimationFrame(updateXPBarAnimation);
  }
}


function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

function checkProgressBarVisibility() {
  const mainXPContainer = document.querySelector(".xp-bar-container");
  const stickyHeader = document.getElementById("stickyHeader");
  if (!mainXPContainer || !stickyHeader) return;
  if (isElementInViewport(mainXPContainer)) {
    stickyHeader.classList.remove("visible");
    return;
  }
  if (xpRecentlyGained || stickyHeaderForceVisible) {
    stickyHeader.classList.add("visible");
  } else {
    stickyHeader.classList.remove("visible");
  }
}

window.addEventListener("scroll", checkProgressBarVisibility);

function updateNutritionProgressScore() {
  // Retrieve the progress score from localStorage.
  const storedPS = parseInt(localStorage.getItem("progressScore") || "0", 10);

  const psEl = document.getElementById("nutritionProgressScoreValue");
  if (!psEl) return;
  psEl.textContent = storedPS.toString();

  // Get elements for the track message and daily message.
  const trackMsgEl = document.getElementById("nutritionProgressTrackStatus");
  const dailyMsgEl = document.getElementById("nutritionProgressDailyMessage");

  // Determine if the user is on track.
  const onTrack = checkIfUserIsOnTrackForNutrition(); // Your custom logic.
  
  if (onTrack) {
    trackMsgEl.textContent = "";
    // Use the caching function so that the message is only re-randomized once per day,
    // or when the user's progress score moves to a new threshold.
    dailyMsgEl.textContent = getNutritionMessage(storedPS);
  } else {
    trackMsgEl.textContent = "You might be off-track. Let’s refocus this week!";
    dailyMsgEl.textContent = getRandomOffTrackMessageForNutrition();
  }
}

const nutritionOnTrackMessages = [
  {
    range: [0, 0],
    messages: [
      "Your nutrition journey starts here. Every meal is a step forward!",
      "Welcome to day one—let’s build habits that last a lifetime!",
      "Each bite is a building block toward your transformation.",
      "You're laying the foundation for better health—stay consistent!",
      "Small actions create big change. Let’s begin your nutrition journey!",
      "The first step is showing up—your future self thanks you already!",
      "A year from now, you’ll be glad you tracked your first meal today!",
      "It all starts with one day of mindful eating. Let’s go!"
    ]
  },
  {
    range: [1, 500],
    messages: [
      "Solid start! You're building momentum meal by meal!",
      "You’ve logged more meals than 20% of users—keep it up!",
      "Great job staying consistent! Nutrition wins are stacking up.",
      "Meal tracking is becoming a habit—and it's paying off!",
      "You’re already ahead of the pack—keep fueling your progress!",
      "You’re showing early signs of real commitment. Stay focused!",
      "Compared to others at this stage, you’re off to a strong start!",
      "You’re building nutritional discipline—one plate at a time!"
    ]
  },
  {
    range: [501, 1000],
    messages: [
      "You're ahead of 25% of users! Keep fueling wisely!",
      "You’re staying consistent and it's showing—awesome work!",
      "Your nutrition habits are taking shape. Stay locked in!",
      "You’ve logged more meals than 30% of users—solid dedication!",
      "Meal quality and consistency are putting you ahead!",
      "Your mindful eating is turning into measurable progress!",
      "You're on track to become a role model in discipline—keep going!",
      "Your meals are starting to reflect your goals—keep aiming high!"
    ]
  },
  {
    range: [1001, 2500],
    messages: [
      "Top 50%! Your nutrition game is strong and getting stronger!",
      "You’ve logged more meals than 50% of users—excellent consistency!",
      "Your adherence is setting you apart—stay on the path!",
      "Elite status! Keep nourishing your goals!",
      "Your meal tracking is more consistent than most—amazing progress!",
      "You're mastering consistency—this is where the magic happens!",
      "You’re proving that sustainable nutrition is achievable!",
      "You’re officially above average—let’s aim higher!"
    ]
  },
  {
    range: [2501, 5000],
    messages: [
      "You're outperforming 65% of users—this is elite consistency!",
      "You’re proving that healthy eating can be a lifestyle!",
      "Your adherence is top-tier—keep raising the standard!",
      "You've stayed on track longer than most—proud work!",
      "Your nutrition score is higher than 70% of users—impressive!",
      "You’ve shown more discipline than 3 out of 4 users at your level!",
      "Your food choices reflect long-term thinking—keep going!",
      "This is what high-level nutrition looks like. Stay the course!"
    ]
  },
  {
    range: [5001, 7500],
    messages: [
      "You’re in the top 30%! Your nutrition is elite!",
      "Your commitment is reflected in every logged meal!",
      "You’re proving that long-term habits lead to big results!",
      "Your consistency is top-class. You’re showing how it’s done!",
      "You’re crushing it—nutrition mastery is within reach!",
      "Your balance, consistency, and discipline are next level!",
      "You’re outperforming 80% of others—keep proving what’s possible!"
    ]
  },
  {
    range: [7501, 9999],
    messages: [
      "Top 15%! You’re mastering both discipline and flexibility!",
      "Only the most consistent reach this level—be proud!",
      "You’ve maintained better nutrition than most—phenomenal work!",
      "You’ve made tracking second nature—this is elite behavior!",
      "You’re a nutrition veteran now—keep setting the standard!",
      "You’ve outperformed 90% of users—what a journey!",
      "You’re proving that commitment to nutrition is powerful!",
      "You’ve turned healthy eating into a lifestyle—well done!"
    ]
  },
  {
    range: [10000, Infinity],
    messages: [
      "🔥 Top 10%! You're leading the nutrition elite!",
      "You’ve achieved legendary consistency—only a few get here!",
      "Your nutrition habits are elite—true mastery in action!",
      "You’re in rare company—less than 10% reach this level!",
      "Your dedication is off the charts. You’re setting the bar!",
      "Your meals tell the story of someone fully committed to change!",
      "Your consistency rivals top-tier performers—nutrition mastery achieved!",
      "You’ve made elite-level nutrition your new normal. Incredible!"
    ]
  }
];


// Off-track messages (displayed regardless of progress score).
const nutritionOffTrackMessages = [
  "Slipped up? It’s okay—your next meal is a fresh opportunity.",
  "Your nutrition doesn’t have to be perfect—it just needs to be consistent. You’ve got this!",
  "Missed a few meals or went off-plan? Refocus and get back to your goals today.",
  "Every healthy routine has its ups and downs—what matters is that you keep going.",
  "Yesterday doesn’t define you—today is your chance to realign with your goals.",
  "One off day won’t undo your progress. Let’s get back on track!",
  "Progress isn’t linear. Recommit to your plan and move forward with confidence!",
  "A strong comeback starts with one intentional meal. Let’s begin again!",
  "Skipped logging? No problem. Reset today and keep building momentum!",
  "Your goals haven’t changed—neither has your ability to reach them!",
  "Everyone has slip-ups. What sets you apart is how you bounce back!",
  "Missed your targets? Shake it off and fuel up for a better day!",
  "Your nutrition journey is about long-term change. Stay in the game!",
  "Let last week’s challenges fuel this week’s success. You’ve got this!",
  "Great habits aren’t built overnight. Keep showing up, meal by meal!"
];

// Global caching variables to update the daily message only once per day or when the PS category changes.
let currentNutritionMessage = "";
let currentNutritionMessageDate = "";
let currentNutritionPSCategoryIndex = -1;

function checkIfUserIsOnTrackForNutrition() {
  // For example, you might consider the user “on-track” if their progress score is non-negative
  const progressScore = parseInt(localStorage.getItem("progressScore") || "0", 10);
  return progressScore >= 0; // Update this condition based on your real criteria
}

// Returns the index (i.e., PS category) in the nutritionOnTrackMessages array given the current progress score (psVal).
function getNutritionPSRangeCategory(psVal) {
  for (let i = 0; i < nutritionOnTrackMessages.length; i++) {
    const { range } = nutritionOnTrackMessages[i];
    if (psVal >= range[0] && psVal <= range[1]) {
      return i;
    }
  }
  return -1;
}

// Returns a random on-track message based on the user's progress score.
function getRandomOnTrackMessageForNutrition(psVal) {
  const catIndex = getNutritionPSRangeCategory(psVal);
  let messages = [];
  if (catIndex === -1) {
    messages = [
      "Keep making healthy choices—each meal is a step forward!",
      "Stay consistent for lasting nutrition success!"
    ];
  } else {
    messages = nutritionOnTrackMessages[catIndex].messages;
  }
  return messages[Math.floor(Math.random() * messages.length)];
}

// Returns a random off-track message.
function getRandomOffTrackMessageForNutrition() {
  return nutritionOffTrackMessages[Math.floor(Math.random() * nutritionOffTrackMessages.length)];
}

// Returns a daily nutrition message that updates either once per day or when the PS category changes.
// The function takes the current progress score (psVal) as a parameter.
function getNutritionMessage(psVal) {
  const today = new Date().toDateString();
  const onTrack = checkIfUserIsOnTrackForNutrition();
  const currentCatIndex = onTrack ? getNutritionPSRangeCategory(psVal) : -1;

  // Update the message if the day has changed or if the user's PS category has changed.
  if (
    currentNutritionMessageDate !== today ||
    (onTrack && currentNutritionPSCategoryIndex !== currentCatIndex)
  ) {
    if (onTrack) {
      currentNutritionMessage = getRandomOnTrackMessageForNutrition(psVal);
      currentNutritionPSCategoryIndex = currentCatIndex;
    } else {
      currentNutritionMessage = getRandomOffTrackMessageForNutrition();
      currentNutritionPSCategoryIndex = -1;
    }
    currentNutritionMessageDate = today;
  }
  return currentNutritionMessage;
}

function showTodaysTipForNutrition() {
  const tipHeading = document.getElementById("todaysTipHeading");
  const tipCard = document.getElementById("todaysTipCard");
  if (!tipHeading || !tipCard) return;

  // Always display the tip elements
  tipHeading.style.display = "block";
  tipCard.style.display = "block";

  // Get today's date in YYYY-MM-DD format
  const todayDateStr = new Date().toISOString().slice(0, 10);
  // Notice the key change: using "todaysTipDate_NT" and "todaysTip_NT" for the Nutrition Tracker.
  const storedTipDate = localStorage.getItem("todaysTipDate_NT");
  let tip;

  if (storedTipDate === todayDateStr) {
    // If the stored tip is from today, use it.
    tip = localStorage.getItem("todaysTip_NT");
  } else {
    // Generate a new tip.
    const userGoal = (localStorage.getItem("nutritionGoal") || "weight loss").toLowerCase().trim();

    const genericNutritionTips = [
      "Fat loss isn't always linear — some weeks your body just holds onto water. Stay consistent.",
      "Hydration matters. Even mild dehydration can impact your performance and mood.",
      "If you miss a meal, don't panic — just refocus and keep going. One slip doesn't ruin your progress.",
      "Planning your meals ahead of time reduces decision fatigue and helps you stay on track.",
      "Whole foods tend to be more satisfying and nutrient-dense than ultra-processed ones.",
      "Tracking is about awareness, not perfection. Use it as a tool, not a source of guilt.",
      "Sleep and stress have a bigger impact on nutrition than most people realize. Prioritize recovery.",
      "Don't underestimate the power of routine — simple habits done daily drive long-term results."
    ];

    const weightLossTips = [
      "Walking more each day is an underrated fat loss tool — even 2,000 extra steps helps.",
      "If you're constantly hungry, add more fiber-rich foods like veggies, oats, or beans.",
      "Volume eating works — fill your plate with low-calorie, high-volume foods to stay satisfied.",
      "Start your meals with protein and veggies — it helps regulate hunger and blood sugar.",
      "Liquid calories add up fast. Be mindful of juices, soft drinks, and fancy coffees.",
      "Weighing food for a week or two can reveal hidden calorie sources and improve accuracy.",
      "Set your kitchen up for success — keep your go-to healthy foods within easy reach.",
      "Fat loss is mostly about consistency — don't chase perfection, chase better habits."
    ];

    const muscleGainTips = [
      "Don't fear carbs — they fuel your workouts and help replenish energy stores.",
      "Protein timing isn’t everything, but getting enough total protein each day is essential.",
      "To build muscle, you need a surplus — don’t undereat out of fear of fat gain.",
      "Nutrient-dense meals make bulking cleaner and easier to sustain long-term.",
      "Post-workout meals should prioritize protein and carbs — it kickstarts recovery.",
      "Consistent eating supports consistent training. Don’t skip meals when gaining.",
      "Appetite low? Try calorie-dense foods like nuts, oils, smoothies, and dried fruit.",
      "Muscle gain is slow and steady — focus on progress in the gym and at the table."
    ];

    const recompTips = [
      "Protein is key during recomposition — aim for high intake and consistency.",
      "Recomposition thrives on structure — nail your training, nutrition, and sleep.",
      "Track both gym performance and nutrition — both need to progress together.",
      "Small calorie deficits or maintenance intake with high protein is the sweet spot.",
      "Meal timing matters a little more during recomp — fuel your workouts wisely.",
      "Recomposition takes time — trust the process and track trends, not daily changes.",
      "Strength gains without weight gain? You’re likely building muscle and burning fat.",
      "Keep your meals consistent — the fewer variables, the easier it is to see what works."
    ];

    // 70% chance to pick a generic tip, 30% for goal-specific tip
    const isGoalPick = (Math.random() < 0.30);
    let tipArray = genericNutritionTips;
    if (isGoalPick) {
      if (userGoal.includes("loss")) tipArray = weightLossTips;
      else if (userGoal.includes("muscle")) tipArray = muscleGainTips;
      else tipArray = recompTips;
    }
    tip = tipArray[Math.floor(Math.random() * tipArray.length)];

    // Store the new tip and today's date using NT-specific keys.
    localStorage.setItem("todaysTip_NT", tip);
    localStorage.setItem("todaysTipDate_NT", todayDateStr);
  }
  tipCard.textContent = tip;
}

///////////////////////////
// 2) Nutrition Streak
///////////////////////////

// Streak: user logs all assigned meals for the active day => +1 streak
// If they skip or miss, streak resets.

let nutritionStreakCount = parseInt(localStorage.getItem("nutritionStreakCount") || "0", 10);
let nutritionStreakActiveDate = localStorage.getItem("nutritionStreakActiveDate") || "";
// If the user logs all meals for a day, we store that day as "success".

const nutritionStreakMessages = {
  active: [
    (streakCount) => `🔥 You’re on a ${streakCount}-day nutrition streak! Keep fueling that progress!`,
    (streakCount) => `🔥 ${streakCount} ${streakCount === 1 ? 'day' : 'days'} of consistent meals—your body is thanking you!`,
    (streakCount) => `🔥 Consistency tastes great! ${streakCount} ${streakCount === 1 ? 'day' : 'days'} of clean tracking!`,
    (streakCount) => `🔥 You’re staying on top of your goals—${streakCount} ${streakCount === 1 ? 'day' : 'days'} strong!`,
    (streakCount) => `🔥 Meal by meal, day by day—${streakCount} logged ${streakCount === 1 ? 'day' : 'days'}!`
  ],
  milestone: [
    (streakCount) =>
      `🏆 Huge milestone! ${streakCount} ${streakCount === 1 ? 'day' : 'days'} of nutrition consistency—amazing work!`,
    (streakCount) =>
      `🏆 ${streakCount} ${streakCount === 1 ? 'day' : 'days'} in a row! Your dedication is showing!`,
    (streakCount) =>
      `🏆 You're mastering your meals—${streakCount} ${streakCount === 1 ? 'day' : 'days'} logged without missing a beat!`,
    (streakCount) =>
      `🏆 Meal streak: ${streakCount} ${streakCount === 1 ? 'day' : 'days'}. Keep setting the standard!`,
    (streakCount) =>
      `🏆 ${streakCount} ${streakCount === 1 ? 'day' : 'days'} strong—your nutrition game is elite!`
  ],
  reset: [
    "❌ Your nutrition streak just reset. Let’s start fresh today!",
    "❌ You missed a day—but every day is a new chance to restart!",
    "❌ Streak broken. Happens to the best—pick it back up tomorrow!",
    "❌ One day off doesn't define you. Let's begin again!",
    "❌ You’ve lost your streak, but your journey continues—day one starts now."
  ],
  firstTime: [
    "🍽️ Let's start your first nutrition streak—log your meals and make today count!",
    "🍽️ This is your Day 1! Build your streak one meal at a time.",
    "🍽️ Welcome to your nutrition tracker—start logging to begin your journey!",
    "🍽️ Your streak starts today—ready to fuel your transformation?",
    "🍽️ One day at a time. Let’s log today’s meals and start strong!"
  ]
};

function getRandomStreakMessage(type, sc) {
  const arr = nutritionStreakMessages[type];
  const idx = Math.floor(Math.random() * arr.length);
  let msg = arr[idx];
  if (typeof msg === "function") {
    return msg(sc);
  }
  return msg.replace("{streakCount}", sc);
}

function updateNutritionStreakDisplay() {
  const streakEl = document.getElementById("nutrition-streak-message");
  if (!streakEl) return;

  if (nutritionStreakCount === 0) {
    // firstTime
    const msg = getRandomStreakMessage("firstTime", 0);
    streakEl.textContent = msg;
  } else {
    // check milestone
    const milestoneList = [5, 10, 20, 50];
    if (milestoneList.includes(nutritionStreakCount)) {
      const milestoneMsg = getRandomStreakMessage("milestone", nutritionStreakCount);
      streakEl.textContent = milestoneMsg;
    } else {
      // active
      const activeMsg = getRandomStreakMessage("active", nutritionStreakCount);
      streakEl.textContent = activeMsg;
    }
  }
}

// Called if user fails to log all meals or chooses "skip" => resets streak
function resetNutritionStreak() {
  nutritionStreakCount = 0;
  localStorage.setItem("nutritionStreakCount", "0");
  const resetMsg = getRandomStreakMessage("reset", 0);
  const streakEl = document.getElementById("nutrition-streak-message");
  if (streakEl) streakEl.textContent = resetMsg;
}

function incrementNutritionStreak() {
  nutritionStreakCount++;
  localStorage.setItem("nutritionStreakCount", nutritionStreakCount.toString());
  updateNutritionStreakDisplay();
}


////////////////////////////
// 3) Tab Selection
////////////////////////////

const myNutritionTab = document.getElementById("myNutritionTab");
const myProgressTab = document.getElementById("myProgressTab");
const myNutritionSection = document.getElementById("myNutritionSection");
const myProgressSection = document.getElementById("myProgressSection");

myNutritionTab.addEventListener("click", () => {
  localStorage.setItem("lastSelectedNutritionTab", "myNutrition");
  myNutritionTab.classList.add("active");
  myProgressTab.classList.remove("active");
  myNutritionSection.classList.add("active");
  myProgressSection.classList.remove("active");
  document.querySelector(".week-selector-frame").style.display = "block";
  document.querySelector(".day-selector-frame").style.display = "block";
});

myProgressTab.addEventListener("click", () => {
  localStorage.setItem("lastSelectedNutritionTab", "myProgress");
  myProgressTab.classList.add("active");
  myNutritionTab.classList.remove("active");
  myProgressSection.classList.add("active");
  myNutritionSection.classList.remove("active");

  // Hide the week/day selectors
  document.querySelector(".week-selector-frame").style.display = "none";
  document.querySelector(".day-selector-frame").style.display = "none";

  // Always display the My Progress Overview regardless of logged data
  document.getElementById("myProgressOverview").style.display = "block";
  // document.getElementById("noNutritionProgressDataMessage").style.display = "none";

  // Trigger all your progress logic as usual:
  updateNutritionProgressScore();
  showTodaysTipForNutrition();
  renderWeeklyRecap();
  showMacroBreakdownSection();
  showNutritionTrendsSection();
  showBodyCompositionSection();
});

////////////////////////////
// 4) Data & Week/Day Setup
////////////////////////////

// Example structure stored in localStorage: "twelveWeekMealPlan"
const mealPlanData = JSON.parse(localStorage.getItem("twelveWeekMealPlan") || "[]");
// Some users may have a 12-week plan, or less. We'll limit ourselves to however many are in the array.
let totalWeeks = mealPlanData.length;
let mealPrepPopupVisible = false;
if (totalWeeks > 12) totalWeeks = 12;

let currentWeekIndex = parseInt(localStorage.getItem("currentNutritionWeekIndex") || "0", 10);
let currentDayIndex = parseInt(localStorage.getItem("currentNutritionDayIndex") || "0", 10);

function renderWeekSelector() {
  const weekSelector = document.getElementById("weekSelector");
  if (!weekSelector) return;
  weekSelector.innerHTML = "";
  if (totalWeeks <= 0) return;

  for (let i = 0; i < totalWeeks; i++) {
    const wBox = document.createElement("div");
    wBox.classList.add("week-box");
    const wNumber = mealPlanData[i].week;
    wBox.textContent = `Week ${wNumber}`;

    if (i === currentWeekIndex) {
      wBox.classList.add("active");
    }

    wBox.addEventListener("click", () => {
      currentWeekIndex = i;
      // Reset currentDayIndex to 0 (Day 1) whenever a new week is selected
      currentDayIndex = 0;
      localStorage.setItem("currentNutritionWeekIndex", currentWeekIndex.toString());
      localStorage.setItem("currentNutritionDayIndex", "0");
      updateWeekBoxes();
      renderDaySelector();
      renderDailyMealDisplay();
    });

    weekSelector.appendChild(wBox);
  }
}

function updateWeekBoxes() {
  const boxes = document.querySelectorAll("#weekSelector .week-box");
  boxes.forEach((box, idx) => {
    box.classList.remove("active");
    if (idx === currentWeekIndex) {
      box.classList.add("active");
    }
  });
}

function renderDaySelector() {
  const daySelector = document.getElementById("daySelector");
  if (!daySelector) return;
  daySelector.innerHTML = "";
  const weekObj = mealPlanData[currentWeekIndex];
  if (!weekObj || !weekObj.days) return;
  const daysInWeek = weekObj.days.length;

  for (let d = 0; d < daysInWeek; d++) {
    const dBox = document.createElement("div");
    dBox.classList.add("day-box");
    dBox.textContent = `Day ${d + 1}`;
    if (d === currentDayIndex) {
      dBox.classList.add("active");
    }
    dBox.addEventListener("click", () => {
      currentDayIndex = d;
      localStorage.setItem("currentNutritionDayIndex", currentDayIndex.toString());
      updateDayBoxes();
      renderDailyMealDisplay();
    });
    daySelector.appendChild(dBox);
  }
}

function updateDayBoxes() {
  const dayBoxes = document.querySelectorAll("#daySelector .day-box");
  dayBoxes.forEach((box, idx) => {
    box.classList.remove("active");
    if (idx === currentDayIndex) {
      box.classList.add("active");
    }
  });
}

const prevDayBtn = document.getElementById("prevDayBtn");
const nextDayBtn = document.getElementById("nextDayBtn");
prevDayBtn.addEventListener("click", () => {
  if (currentWeekIndex < 0) currentWeekIndex = 0;
  const wObj = mealPlanData[currentWeekIndex];
  if (!wObj) return;
  let dayCount = wObj.days.length;
  let newDayIndex = currentDayIndex - 1;
  if (newDayIndex < 0) {
    let newWeekIndex = currentWeekIndex - 1;
    if (newWeekIndex >= 0) {
      currentWeekIndex = newWeekIndex;
      dayCount = mealPlanData[currentWeekIndex].days.length;
      newDayIndex = dayCount - 1;
    } else {
      newDayIndex = 0;
    }
  }
  currentDayIndex = newDayIndex;
  localStorage.setItem("currentNutritionWeekIndex", currentWeekIndex.toString());
  localStorage.setItem("currentNutritionDayIndex", currentDayIndex.toString());
  renderWeekSelector();
  renderDaySelector();
  renderDailyMealDisplay();
});

nextDayBtn.addEventListener("click", () => {
  const wObj = mealPlanData[currentWeekIndex];
  if (!wObj) return;
  let dayCount = wObj.days.length;
  let newDayIndex = currentDayIndex + 1;
  if (newDayIndex >= dayCount) {
    let newWeekIndex = currentWeekIndex + 1;
    if (newWeekIndex < totalWeeks) {
      currentWeekIndex = newWeekIndex;
      newDayIndex = 0;
    } else {
      newDayIndex = dayCount - 1;
    }
  }
  currentDayIndex = newDayIndex;
  localStorage.setItem("currentNutritionWeekIndex", currentWeekIndex.toString());
  localStorage.setItem("currentNutritionDayIndex", currentDayIndex.toString());
  renderWeekSelector();
  renderDaySelector();
  renderDailyMealDisplay();
});


////////////////////////////
// 5) Daily Meal Display
////////////////////////////

function renderDailyMealDisplay() {
  const container = document.getElementById("dailyMealDisplay");
  if (!container) return;
  container.innerHTML = "";

  const myNutritionSection = document.getElementById("myNutritionSection");
  // First, remove any old leftover button to avoid duplicates:
  const existingMPMBtn = document.getElementById("mealPrepModeBtn");
  if (existingMPMBtn) {
    existingMPMBtn.remove();
  }

  // Show button only if dayIndex == 0 (which is "Day 1" in the UI)
  if (currentDayIndex === 0) {  // Only Day 1 has a Meal Prep Mode button
    const mealPrepBtn = document.createElement("button");
    mealPrepBtn.id = "mealPrepModeBtn";
    mealPrepBtn.textContent = "🧑‍🍳 Meal Prep Mode";
    mealPrepBtn.style.width = "100%";
    mealPrepBtn.style.backgroundColor = "#007BFF";
    mealPrepBtn.style.color = "#fff";
    mealPrepBtn.style.padding = "14px 20px";
    mealPrepBtn.style.fontSize = "1rem";
    mealPrepBtn.style.border = "none";
    mealPrepBtn.style.borderRadius = "5px";
    mealPrepBtn.style.cursor = "pointer";
    mealPrepBtn.style.display = "block";
    mealPrepBtn.style.margin = "0 auto 20px auto"; // center + spacing
    mealPrepBtn.style.boxShadow = "0px 6px 8px rgba(0, 0, 0, 0.1)";
    mealPrepBtn.style.transition = "opacity 0.5s ease";

    // Use the previous flag to determine whether to animate
    if (window.previousMealPrepExists) {
      mealPrepBtn.style.opacity = "1"; // Already seen before—no fade-in.
    } else {
      mealPrepBtn.style.opacity = "0"; // Start hidden
      // Force reflow to ensure transition works (if needed)
      mealPrepBtn.offsetWidth;
      setTimeout(() => {
        mealPrepBtn.style.opacity = "1"; // Fade in after 200ms.
      }, 200);
    }

    mealPrepBtn.addEventListener("click", () => {
      showMealPrepModePopup(currentWeekIndex);
    });

    // Insert the button above the daily summary container:
    myNutritionSection.insertBefore(mealPrepBtn, container);

    // Set flag so that next day with a button will NOT fade in
    window.previousMealPrepExists = true;
  } else {
    // For days without the Meal Prep Mode button, reset the flag
    window.previousMealPrepExists = false;
  }

  const weekObj = mealPlanData[currentWeekIndex];
  if (!weekObj) return;
  const dayObj = weekObj.days[currentDayIndex];
  if (!dayObj) return;

  // 1) Create a top "Day Info" box
  const dayInfoDiv = document.createElement("div");
  dayInfoDiv.classList.add("day-info-container");

  const header = document.createElement("div");
  header.classList.add("day-info-header");
  header.textContent = `Week ${weekObj.week} - Day ${dayObj.day || (currentDayIndex + 1)}`;
  dayInfoDiv.appendChild(header);

  // Example date logic (could be more advanced if you store actual calendar date)
  // For demonstration, let's just generate a "fake" date based on a start date
  // but we'll keep it simple unless you have a real date.
  // If "finalTotalCals" is dayObj.finalTotalCals, we can read the localStorage macros for this week.
  const dayStatsDiv = document.createElement("div");
  dayStatsDiv.classList.add("day-info-stats");

  // Inside renderDailyMealDisplay():
  const assignedDate = calculateDayDateStringFull(weekObj, dayObj);
  const dateLine = document.createElement("div");
  dateLine.textContent = `📆 ${assignedDate}`;
  dayStatsDiv.appendChild(dateLine);


  const mealPlanMeals = Object.keys(dayObj.meals || {});
  const totalMealsToday = mealPlanMeals.length;

  // We'll read the daily total cals & macros from localStorage using your keys like week1_dailyCalsWMCO, etc.
  const wNum = weekObj.week;
  // Example keys: 
  //   `week${wNum}_dailyCalsWMCO`
  //   `week${wNum}_proteinWMCO`
  //   `week${wNum}_carbsWMCO`
  //   `week${wNum}_fatsWMCO`
  const totalDailyCals = parseInt(localStorage.getItem(`week${wNum}_dailyCalsWMCO`) || dayObj.finalTotalCals || "2000", 10);
  const totalProtein = parseInt(localStorage.getItem(`week${wNum}_proteinWMCO`) || "150", 10);
  const totalCarbs = parseInt(localStorage.getItem(`week${wNum}_carbsWMCO`) || "200", 10);
  const totalFats = parseInt(localStorage.getItem(`week${wNum}_fatsWMCO`) || "70", 10);

  // Calculate how many cals/macros are used up from localStorage
  // We'll iterate the meals to see if each meal is "logged" or "swapped" with known cals/macros
  let calsConsumed = 0;
  let proteinConsumed = 0;
  let carbsConsumed = 0;
  let fatsConsumed = 0;
  let mealsLoggedCount = 0;
  let mealsInteractedCount = 0; // logged or skipped or swapped

  mealPlanMeals.forEach((mealKey, idx) => {
    const mealData = dayObj.meals[mealKey];
    // We'll store statuses in localStorage under something like `weekX_dayY_mealKey_status`
    const mealStatusKey = `week${wNum}_day${dayObj.day}_meal${idx + 1}_status`;
    const mealStatus = localStorage.getItem(mealStatusKey) || ""; // "", "logged", "skipped", "swapped"
    if (mealStatus) {
      mealsInteractedCount++;
    }
    if (mealStatus === "logged" || mealStatus === "swapped") {
      // Then we add its macros/cals
      const mealCalsKey = `week${wNum}_day${dayObj.day}_meal${idx + 1}_cals`;
      const mealProteinKey = `week${wNum}_day${dayObj.day}_meal${idx + 1}_protein`;
      const mealCarbsKey = `week${wNum}_day${dayObj.day}_meal${idx + 1}_carbs`;
      const mealFatsKey = `week${wNum}_day${dayObj.day}_meal${idx + 1}_fats`;

      const mCals = parseFloat(localStorage.getItem(mealCalsKey) || mealData.calories || 0);
      const mProt = parseFloat(localStorage.getItem(mealProteinKey) || mealData.protein || 0);
      const mCarb = parseFloat(localStorage.getItem(mealCarbsKey) || mealData.carbs || 0);
      const mFat = parseFloat(localStorage.getItem(mealFatsKey) || mealData.fats || 0);

      calsConsumed += mCals;
      proteinConsumed += mProt;
      carbsConsumed += mCarb;
      fatsConsumed += mFat;
      mealsLoggedCount++;
    }
  });

  // If user consumed EXACT default plan for all assigned meals with no skip/swap, we set cals/macros to full
  if (mealsLoggedCount === totalMealsToday) {
    // Check if all are "logged" in their default form (no swap). But for simplicity, 
    // the spec says if they logged all original assigned meals with no skip or swap, 
    // cals and macros are set to 100% full. We'll do a small check:
    let allWereDefault = true;
    mealPlanMeals.forEach((mealKey, idx) => {
      const mealStatusKey = `week${wNum}_day${dayObj.day}_meal${idx + 1}_status`;
      const st = localStorage.getItem(mealStatusKey) || "";
      if (st !== "logged") {
        allWereDefault = false;
      }
    });
    if (allWereDefault) {
      calsConsumed = totalDailyCals;
      proteinConsumed = totalProtein;
      carbsConsumed = totalCarbs;
      fatsConsumed = totalFats;
    }
  }

  // If cals consumed goes beyond the daily target, we just keep it for calculations, 
  // but visually the progress bar caps at 100%.
  const calsLeft = totalDailyCals - calsConsumed;
  let protLeft = totalProtein - proteinConsumed;
  let carbLeft = totalCarbs - carbsConsumed;
  let fatLeft = totalFats - fatsConsumed;

  if (calsLeft <= 0) {
    // automatically set macros left to 0 if cals left = 0 or less
    protLeft = 0;
    carbLeft = 0;
    fatLeft = 0;
  } else {
    // clamp them at not below 0 if there's small difference
    if (protLeft < 0) protLeft = 0;
    if (carbLeft < 0) carbLeft = 0;
    if (fatLeft < 0) fatLeft = 0;
  }

  const completionLine = document.createElement("div");
  const mealCompletionText = (mealsLoggedCount < totalMealsToday)
    ? `🍽️ Meal Completion: <strong>${mealsLoggedCount} of ${totalMealsToday}</strong>`
    : `🥇 All meals logged for today! Great discipline!`;
  completionLine.innerHTML = mealCompletionText;
  dayStatsDiv.appendChild(completionLine);

  const calsLeftLine = document.createElement("div");
  calsLeftLine.innerHTML = `🔥 Calories Left: <strong>${calsLeft > 0 ? calsLeft : 0} kcal</strong>`;
  dayStatsDiv.appendChild(calsLeftLine);

  const macrosLeftLine = document.createElement("div");
  macrosLeftLine.innerHTML = `
  Macros Left:
  🍗 <strong>${protLeft}g</strong> 
  🍚 <strong>${carbLeft}g</strong> 
  🥑 <strong>${fatLeft}g</strong>
  `;
  dayStatsDiv.appendChild(macrosLeftLine);

  // Progress Bar
  // Progress Bar
  const progressBarContainer = document.createElement("div");
  progressBarContainer.classList.add("calorie-progress-bar");
  const progressFill = document.createElement("div");
  progressFill.classList.add("calorie-progress-fill");

  // Calculate the new fill percentage based on calories consumed
  let fillPercent = 0;
  if (totalDailyCals > 0) {
    fillPercent = (calsConsumed / totalDailyCals) * 100;
  }
  if (fillPercent > 100) fillPercent = 100;

  // Instead of resetting to 0, initialize the width at the previous fill percentage
  progressFill.style.width = previousFillPercent + "%";
  progressBarContainer.appendChild(progressFill);
  dayStatsDiv.appendChild(progressBarContainer);

  // Animate from the previous fill percentage to the new fill percentage
  requestAnimationFrame(() => {
    // Force reflow if needed
    progressFill.offsetWidth;
    progressFill.style.width = fillPercent.toFixed(0) + "%";
  });

  // Update the global variable for next time
  previousFillPercent = fillPercent;

  // If user has interacted with all meals, we may show a day-level message
  const dayMessage = document.createElement("div");
  dayMessage.classList.add("nutrition-day-message");
  // only show if mealsInteractedCount == totalMealsToday
  if (mealsInteractedCount === totalMealsToday) {
    const within5pct = Math.abs(totalDailyCals - calsConsumed) <= totalDailyCals * 0.05;
    const overEaten = calsConsumed > totalDailyCals * 1.05;
    const underEaten = calsConsumed < totalDailyCals * 0.70; // 30% under

    if (within5pct) {
      // success messages
      const successArr = [
        "✅ You nailed it! Your calories and macros are spot on today—keep it up!",
        "✅ Amazing discipline—today’s nutrition was perfectly balanced.",
        "✅ Full marks! You’ve hit your targets with precision—your body will thank you.",
        "✅ That’s how it’s done—every gram accounted for. Excellent work!",
        "✅ Nutrition locked in for the day. Let’s keep this momentum going tomorrow!"
      ];
      const r = Math.floor(Math.random() * successArr.length);
      dayMessage.textContent = successArr[r];
    } else if (overEaten) {
      // overeat
      const overArr = [
        "⚠️ You went a little over today—no stress, just reset and refocus tomorrow.",
        "⚠️ Overshot your target slightly. Happens to the best—consistency is what matters most.",
        "⚠️ You exceeded your daily goal, but progress isn’t about perfection. Let’s tighten things up next time.",
        "⚠️ Today wasn’t perfect, and that’s okay. One day won’t derail your journey.",
        "⚠️ You’ve eaten above your target—consider adjusting portions tomorrow to stay on track."
      ];
      const r = Math.floor(Math.random() * overArr.length);
      dayMessage.textContent = overArr[r];
    } else if (underEaten) {
      // under
      const underArr = [
        "⏳ You’re quite under your target today—consider adding a snack or light meal to fuel recovery.",
        "⏳ Undereating can slow your progress—try to hit your target for steady results.",
        "⏳ Looks like you're low on calories today—fuel matters just as much as training.",
        "⏳ Skipping too many calories may affect your energy. Let’s try to hit closer to your goal tomorrow.",
        "⏳ That’s a big gap in intake—consistency helps your body adapt and thrive."
      ];
      const r = Math.floor(Math.random() * underArr.length);
      dayMessage.textContent = underArr[r];
    }
    dayMessage.classList.add("visible");

    // Use a day-specific flag to freeze this day’s streak only once.
    const streakCountedKey = `week${wNum}_day${dayObj.day}_streakCounted`;
    if (!localStorage.getItem(streakCountedKey)) {
      let anySkip = false;
      mealPlanMeals.forEach((mealKey, idx) => {
        const mealStatusKey = `week${wNum}_day${dayObj.day}_meal${idx + 1}_status`;
        const st = localStorage.getItem(mealStatusKey) || "";
        if (st === "skipped") {
          anySkip = true;
        }
      });
      if (!anySkip) {
        // Increment the streak only if there are no skips on this day.
        incrementNutritionStreak();
      }
      // Freeze the streak value for this day (regardless of skip presence)
      localStorage.setItem(`week${wNum}_day${dayObj.day}_streak`, nutritionStreakCount.toString());
      localStorage.setItem(streakCountedKey, "true");
    }
  }

  dayStatsDiv.appendChild(dayMessage);

  dayInfoDiv.appendChild(dayStatsDiv);
  container.appendChild(dayInfoDiv);

  // 2) Render each meal in collapsible style
  mealPlanMeals.forEach((mealKey, idx) => {
    const mealData = dayObj.meals[mealKey];
    renderMealCard(container, mealData, idx + 1, totalMealsToday, wNum, dayObj.day);
  });
  // Remove any existing summary button before possibly re-adding it
  const existingSummaryBtn = document.getElementById("summaryBtn");
  if (existingSummaryBtn) {
    existingSummaryBtn.remove();
  }
  if (totalMealsToday > 0 && mealsInteractedCount === totalMealsToday) {
    const summaryBtn = document.createElement("button");
    summaryBtn.id = "summaryBtn";
    summaryBtn.textContent = "Summary";
    summaryBtn.style.marginTop = "20px";
    summaryBtn.style.padding = "14px";
    summaryBtn.style.fontSize = "1.1rem";
    summaryBtn.style.width = "100%";
    summaryBtn.style.backgroundColor = "#007BFF";
    summaryBtn.style.color = "#fff";
    summaryBtn.style.border = "none";
    summaryBtn.style.borderRadius = "5px";
    summaryBtn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
    summaryBtn.style.transition = "opacity 0.5s ease";
    if (window.previousSummaryExists) {
      summaryBtn.style.opacity = "1";
    } else {
      summaryBtn.style.opacity = "0";
      setTimeout(() => {
        summaryBtn.style.opacity = "1";
      }, 200);
    }
    summaryBtn.addEventListener("click", () => {
      showSummaryPopup();
    });
    document.getElementById("dailyMealDisplay").appendChild(summaryBtn);
    window.previousSummaryExists = true;
  } else {
    window.previousSummaryExists = false;
  }
}

function calculateDayDateString(weekNumber, dayNumber) {
  const wNum = parseInt(weekNumber, 10);
  const dNum = parseInt(dayNumber, 10);
  if (isNaN(wNum) || isNaN(dNum)) {
    console.warn("Invalid week/day:", weekNumber, dayNumber);
    return "Invalid Date";
  }
  const rawStart = localStorage.getItem("programStartDate") || "2025-04-01";
  const baseDate = new Date(rawStart);
  const offsetDays = (wNum - 1) * 7 + (dNum - 1);
  baseDate.setDate(baseDate.getDate() + offsetDays);
  // Updated options: show weekday, month and day only (omit year)
  const options = {
    weekday: "long",
    month: "long",
    day: "numeric"
  };
  return baseDate.toLocaleDateString(undefined, options);
}

// For dailyMealDisplay – returns FULL date (with year)
function calculateDayDateStringFull(weekObj, dayObj) {
  // Get the program start date or fallback
  const rawStart = localStorage.getItem("programStartDate") || "2025-04-01";
  const baseDate = new Date(rawStart);

  // Compute the day offset based on the week and day number.
  // Assumes dayObj.day is a number between 1 and 7, and weekObj.week is 1-based.
  const offsetDays = (weekObj.week - 1) * 7 + (dayObj.day - 1);
  baseDate.setDate(baseDate.getDate() + offsetDays);

  // Format without the year.
  // Options: Weekday, month, and day only.
  const options = {
    weekday: "long",
    month: "long",
    day: "numeric"
  };

  return baseDate.toLocaleDateString(undefined, options);
}

// (B) For weekly recap – omits the year
function calculateDayDateStringNoYear(weekNumber, dayNumber) {
  const wNum = parseInt(weekNumber, 10);
  const dNum = parseInt(dayNumber, 10);
  if (isNaN(wNum) || isNaN(dNum)) {
    console.warn("Invalid week/day:", weekNumber, dayNumber);
    return "Invalid Date";
  }
  const rawStart = localStorage.getItem("programStartDate") || "2025-04-01";
  const baseDate = new Date(rawStart);

  // offsetDays = (wNum - 1)*7 + (dNum - 1)
  const offsetDays = (wNum - 1) * 7 + (dNum - 1);
  baseDate.setDate(baseDate.getDate() + offsetDays);

  // "Wednesday, April 23" (no year)
  const options = { weekday: "long", month: "long", day: "numeric" };
  return baseDate.toLocaleDateString(undefined, options);
}

function calculateDayDateString(weekNumber, dayNumber) {
  // This retrieves the program start from localStorage or uses a fallback.
  const rawStart = localStorage.getItem("programStartDate") || "2025-04-01";
  const startDate = new Date(rawStart);

  // Convert dayNumber to an integer
  const dNum = parseInt(dayNumber, 10) || 1;
  // The offset is (weekNumber - 1)*7 + (dNum - 1)
  const offsetDays = (parseInt(weekNumber, 10) - 1) * 7 + (dNum - 1);
  startDate.setDate(startDate.getDate() + offsetDays);

  // Format the resulting date however you like, e.g., "Monday, April 1"
  const options = { weekday: "long", month: "long", day: "numeric" };
  return startDate.toLocaleDateString(undefined, options);
}

//////////////////////////////
// 6) Rendering a Single Meal Card
//////////////////////////////

function renderMealCard(parent, mealData, mealIndex, totalMealsToday, wNum, dayNum) {
  // Provide default values if mealData is null or undefined
  if (!mealData) {
    mealData = {
      mealName: "Default Meal",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      ingredients: [],
      recipe: []
    };
  }

  // We'll read the meal status & swapped name from localStorage:
  const mealStatusKey = `week${wNum}_day${dayNum}_meal${mealIndex}_status`;
  const mealStatus = localStorage.getItem(mealStatusKey) || ""; // "", "logged", "swapped", "skipped"

  // If swapped, we also retrieve the swapped name + macros from localStorage
  let swappedNameKey = `week${wNum}_day${dayNum}_meal${mealIndex}_swappedName`;
  let swappedName = localStorage.getItem(swappedNameKey) || "";

  // Retrieve macros/calories, falling back to mealData values or 0
  let displayedCals = parseFloat(localStorage.getItem(`week${wNum}_day${dayNum}_meal${mealIndex}_cals`)) || mealData.calories || 0;
  let displayedProtein = parseFloat(localStorage.getItem(`week${wNum}_day${dayNum}_meal${mealIndex}_protein`)) || mealData.protein || 0;
  let displayedCarbs = parseFloat(localStorage.getItem(`week${wNum}_day${dayNum}_meal${mealIndex}_carbs`)) || mealData.carbs || 0;
  let displayedFats = parseFloat(localStorage.getItem(`week${wNum}_day${dayNum}_meal${mealIndex}_fats`)) || mealData.fats || 0;

  // Decide which meal name to display
  const actualMealName = (mealStatus === "swapped" && swappedName)
    ? swappedName
    : (mealData.mealName || `Meal ${mealIndex}`);

  const mealCard = document.createElement("div");
  mealCard.classList.add("meal-card");

  // HEADER
  const header = document.createElement("div");
  header.classList.add("meal-card-header");

  // e.g., green-logged if meal is logged, grey-skipped if skipped
  if (mealStatus === "logged" || mealStatus === "swapped") {
    header.classList.add("green-logged");
  } else if (mealStatus === "skipped") {
    header.classList.add("grey-skipped");
  }

  // Meal title
  const title = document.createElement("h3");
  title.classList.add("meal-card-title");
  // Strikethrough if skipped
  if (mealStatus === "skipped") {
    title.style.textDecoration = "line-through";
    title.style.textDecorationThickness = "2px"; // Increase thickness
  }
  title.textContent = actualMealName;  // e.g., "Chicken & Rice"
  header.appendChild(title);

  // Arrow span
  const arrowSpan = document.createElement("span");
  arrowSpan.classList.add("meal-card-arrow");
  arrowSpan.textContent = ">";
  header.appendChild(arrowSpan);

  // A unique expansion key for localStorage
  const expansionKey = `mealCardExpansion_week${wNum}_day${dayNum}_${mealData.mealName}`;
  // Attach it to the .meal-card so we can find & collapse others
  mealCard.dataset.expansionKey = expansionKey;

  // Restore expansion state if previously saved:
  if (localStorage.getItem(expansionKey) === "true") {
    arrowSpan.classList.add("expanded");
  }

  mealCard.appendChild(header);

  // COLLAPSIBLE DETAILS
  const details = document.createElement("div");
  details.classList.add("meal-details");
  // If saved state was "true," expand details
  if (localStorage.getItem(expansionKey) === "true") {
    details.classList.add("expanded");
  }
  mealCard.appendChild(details);

  // AUTO-COLLAPSE LOGIC WHEN CLICKING THE HEADER
  header.addEventListener("click", () => {
    const isCurrentlyExpanded = details.classList.contains("expanded");

    // Collapse all other meal cards (existing logic)...
    if (!isCurrentlyExpanded) {
      const allMealCards = document.querySelectorAll(".meal-card");
      allMealCards.forEach(card => {
        if (card !== mealCard) {
          const otherArrow = card.querySelector(".meal-card-arrow");
          const otherDetails = card.querySelector(".meal-details");
          if (otherArrow && otherArrow.classList.contains("expanded")) {
            otherArrow.classList.remove("expanded");
          }
          if (otherDetails && otherDetails.classList.contains("expanded")) {
            otherDetails.classList.remove("expanded");
          }
          // Update localStorage for the other card’s expansion key if needed
          const otherKey = card.dataset.expansionKey;
          if (otherKey) {
            localStorage.setItem(otherKey, "false");
          }
        }
      });
    }

    // **Collapse any expanded sub-sections in THIS card:**
    const subSections = mealCard.querySelectorAll(".meal-subsection-content.expanded");
    subSections.forEach(section => {
      section.classList.remove("expanded");
      const subArrow = section.previousElementSibling.querySelector(".meal-subtitle-arrow");
      if (subArrow) {
        subArrow.classList.remove("expanded");
      }
    });

    // Toggle THIS card's expansion (existing logic):
    if (isCurrentlyExpanded) {
      arrowSpan.classList.remove("expanded");
      details.classList.remove("expanded");
      localStorage.setItem(expansionKey, "false");
    } else {
      arrowSpan.classList.add("expanded");
      details.classList.add("expanded");
      localStorage.setItem(expansionKey, "true");
    }
  });

  const hideIngAndRecipe = (mealStatus === "swapped");
  function macrosContentGenerator() {
    return (
      `Calories: ${displayedCals}<br>` +
      `🍗 Protein: ${displayedProtein}g 🍚 Carbs: ${displayedCarbs}g 🥑 Fats: ${displayedFats}g`
    );
  }
  const macrosRow = createSubCollapse("🔍 Macros", macrosContentGenerator);
  details.appendChild(macrosRow);

  // If not swapped, show ingredients and recipe
  if (!hideIngAndRecipe) {
    // Ingredients sub-collapse
    const ingRow = createSubCollapse("🧂Ingredients", () => {
      let html = "";
      if (Array.isArray(mealData.ingredients)) {
        mealData.ingredients.forEach(item => {
          if (typeof item === "object") {
            html += `${item.name} ${item.quantity || ""}${item.unit || ""}<br>`;
          } else {
            html += item + "<br>";
          }
        });
      }
      return html || "No ingredients data.";
    });
    details.appendChild(ingRow);

    // Recipe sub-collapse
    const recipeRow = createSubCollapse("📝 Recipe", () => {
      let html = "";
      if (Array.isArray(mealData.recipe)) {
        mealData.recipe.forEach(step => {
          html += step + "<br>";
        });
      }
      return html || "No recipe data.";
    });
    details.appendChild(recipeRow);
  }

  // Actions / buttons area
  const actionsDiv = document.createElement("div");

  if (mealStatus === "logged" || mealStatus === "swapped") {
    // Show a status message
    const statusMsg = document.createElement("div");
    statusMsg.classList.add("meal-status-message");
    statusMsg.textContent = (mealStatus === "swapped")
      ? "✅ Swapped & Logged"
      : "✅ Meal Logged";

    // Random sub-message
    if (mealStatus === "swapped") {
      // Reuse the same "meal logged" messages or a custom array if you prefer
      const mealLoggedMessages = [
        "One step closer to your goals!",
        "Fueling your progress—nice work!",
        "That one’s in the books. Great job!",
        "Keep the streak going strong!",
        "Another win for your nutrition!",
        "Well played. Every meal counts!",
        "Another one down—let’s keep it up!",
        "On track and crushing it!",
        "Discipline looks good on you.",
        "Fuel = logged. Let’s move!"
      ];
      const rnd = Math.floor(Math.random() * mealLoggedMessages.length);
      const subMsg = document.createElement("div");
      subMsg.textContent = mealLoggedMessages[rnd];
      subMsg.style.fontSize = "0.95rem";
      subMsg.style.marginTop = "4px";
      subMsg.style.textAlign = "center";

      actionsDiv.appendChild(statusMsg);
      actionsDiv.appendChild(subMsg);
    } else {
      // logged normal
      const mealLoggedMessages = [
        "One step closer to your goals!",
        "Fueling your progress—nice work!",
        "That one’s in the books. Great job!",
        "Keep the streak going strong!",
        "Another win for your nutrition!",
        "Well played. Every meal counts!",
        "Another one down—let’s keep it up!",
        "On track and crushing it!",
        "Discipline looks good on you.",
        "Fuel = logged. Let’s move!"
      ];
      const rnd = Math.floor(Math.random() * mealLoggedMessages.length);
      const subMsg = document.createElement("div");
      subMsg.textContent = mealLoggedMessages[rnd];
      subMsg.style.fontSize = "0.95rem";
      subMsg.style.marginTop = "4px";
      subMsg.style.textAlign = "center";

      actionsDiv.appendChild(statusMsg);
      actionsDiv.appendChild(subMsg);
    }
  } else if (mealStatus === "skipped") {
    // Show a "skipped" message
    const statusMsg = document.createElement("div");
    statusMsg.classList.add("meal-status-message");
    statusMsg.textContent = "🚫 Meal Skipped";

    const mealSkippedMessages = [
      "It’s okay to have an off moment. Just get back on track with the next one.",
      "Skipped meals happen. Refocus and hit the next one.",
      "One skipped meal won’t ruin your progress—keep going.",
      "No worries—what matters most is what you do next.",
      "You’ve acknowledged it—now let’s make the next one count.",
      "Sometimes life gets in the way. Just stay in the game.",
      "Progress > perfection. You’ve got this.",
      "Let’s bounce back with the next meal!",
      "It’s a small detour. Stay the course.",
      "Consistency is built over time—not from a single meal."
    ];
    const rnd = Math.floor(Math.random() * mealSkippedMessages.length);
    const subMsg = document.createElement("div");
    subMsg.textContent = mealSkippedMessages[rnd];
    subMsg.style.fontSize = "0.9rem";
    subMsg.style.marginTop = "4px";
    subMsg.style.textAlign = "center";

    actionsDiv.appendChild(statusMsg);
    actionsDiv.appendChild(subMsg);
  } else {
    // Not logged/skipped/swapped => show buttons
    actionsDiv.classList.add("meal-actions");

    const logBtn = document.createElement("button");
    logBtn.classList.add("log-meal-btn");
    logBtn.textContent = "Log Meal";
    logBtn.addEventListener("click", () => handleLogMeal(mealData, wNum, dayNum, mealIndex));
    actionsDiv.appendChild(logBtn);

    const swapBtn = document.createElement("button");
    swapBtn.classList.add("swap-meal-btn");
    swapBtn.textContent = "Swap Meal";
    swapBtn.addEventListener("click", () => handleSwapMeal(mealData, wNum, dayNum, mealIndex));
    actionsDiv.appendChild(swapBtn);

    const skipBtn = document.createElement("button");
    skipBtn.classList.add("skip-meal-btn");
    skipBtn.textContent = "Skip Meal";
    skipBtn.addEventListener("click", () => handleSkipMeal(mealData, wNum, dayNum, mealIndex));
    actionsDiv.appendChild(skipBtn);

  }

  details.appendChild(actionsDiv);
  parent.appendChild(mealCard);
}


function createSubCollapse(titleText, contentGenerator) {
  const container = document.createElement("div");

  // Create the header for the sub-collapse
  const subHeader = document.createElement("div");
  subHeader.classList.add("meal-subtitle");

  // Build left container for emoji and text
  const leftDiv = document.createElement("div");
  leftDiv.style.display = "inline-flex";
  leftDiv.style.alignItems = "center";
  leftDiv.style.gap = "6px";

  // Check if the title starts with a known emoji and set it up
  const knownEmojis = ["🔍", "🧂", "📝"];
  let firstEmoji = "";
  let restText = titleText;
  for (let e of knownEmojis) {
    if (titleText.startsWith(e)) {
      firstEmoji = e;
      restText = titleText.slice(e.length).trim();
      break;
    }
  }
  if (firstEmoji) {
    const emojiSpan = document.createElement("span");
    emojiSpan.classList.add("emoji");
    // Set emoji background color based on type
    if (firstEmoji === "🔍") {
      emojiSpan.classList.add("macros-emoji");
    } else if (firstEmoji === "🧂") {
      emojiSpan.classList.add("ingredients-emoji");
    } else if (firstEmoji === "📝") {
      emojiSpan.classList.add("recipe-emoji");
    }
    emojiSpan.textContent = firstEmoji;
    leftDiv.appendChild(emojiSpan);
  }
  // Append the remaining text
  const textSpan = document.createElement("span");
  textSpan.textContent = restText;
  leftDiv.appendChild(textSpan);

  // Create the arrow indicator
  const arrow = document.createElement("span");
  arrow.classList.add("meal-subtitle-arrow");
  arrow.textContent = ">";
  subHeader.appendChild(leftDiv);
  subHeader.appendChild(arrow);

  // Create the content container that will expand/collapse
  const contentEl = document.createElement("div");
  contentEl.classList.add("meal-subsection-content");

  // Set the appropriate class for styling based on title
  if (titleText.toLowerCase().includes("macro")) {
    contentEl.classList.add("macros-content");
  } else if (titleText.toLowerCase().includes("ingredient")) {
    contentEl.classList.add("ingredients-content");
  } else if (titleText.toLowerCase().includes("recipe")) {
    contentEl.classList.add("recipe-content");
  }

  // Toggle event to expand/collapse (state not saved)
  subHeader.addEventListener("click", () => {
    const expanded = contentEl.classList.contains("expanded");
    if (expanded) {
      arrow.classList.remove("expanded");
      contentEl.classList.remove("expanded");
    } else {
      arrow.classList.add("expanded");
      contentEl.classList.add("expanded");
      if (contentEl.innerHTML.trim() === "") {
        contentEl.innerHTML = contentGenerator();
      }
    }
  });

  container.appendChild(subHeader);
  container.appendChild(contentEl);
  return container;
}

//////////////////////////////
// 7) Button Logic
//////////////////////////////

function handleLogMeal(mealData, wNum, dayNum, mealIndex) {
  // Check if the current log is from a week higher than the current active week
  const currentLogWeek = mealPlanData[currentWeekIndex].week; // e.g., if the user selected Week 2
  let activeNutritionWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
  if (currentLogWeek > activeNutritionWeek && activeNutritionWeek < 3) {
    // User is logging in a later week (Week 2) early.
    localStorage.setItem("lockedActiveWeek", currentLogWeek.toString());
    activeNutritionWeek = currentLogWeek;
    localStorage.setItem("activeNutritionWeek", activeNutritionWeek.toString());
    localStorage.setItem("activeWorkoutWeek", activeNutritionWeek.toString());
    console.log(`User logged in Week ${currentLogWeek} early. Locked active week to Week ${currentLogWeek}`);
  }

  // Continue with the usual logging...
  const mealStatusKey = `week${wNum}_day${dayNum}_meal${mealIndex}_status`;
  localStorage.setItem(mealStatusKey, "logged");
  // Save meal macros/calories (as before)…
  localStorage.setItem(`week${wNum}_day${dayNum}_meal${mealIndex}_cals`, mealData.calories.toString());
  localStorage.setItem(`week${wNum}_day${dayNum}_meal${mealIndex}_protein`, mealData.protein.toString());
  localStorage.setItem(`week${wNum}_day${dayNum}_meal${mealIndex}_carbs`, mealData.carbs.toString());
  localStorage.setItem(`week${wNum}_day${dayNum}_meal${mealIndex}_fats`, mealData.fats.toString());

  // Award XP (with streak multiplier, etc.)
  addXP(50);

  // Re-render the day display.
  renderDailyMealDisplay();
  updateActiveWeekOnLog()
}

function handleSwapMeal(mealData, wNum, dayNum, mealIndex) {
  // Show the pop-up that asks user to pick from previously saved meals or type new
  showSwapMealPopup(mealData, wNum, dayNum, mealIndex);
  updateActiveWeekOnLog()
}

function handleSkipMeal(mealData, wNum, dayNum, mealIndex) {
  showSkipMealPopup(mealData, wNum, dayNum, mealIndex);
  updateActiveWeekOnLog()
}

////////////////////////////
// 8) Swap Meal Pop-up
////////////////////////////

function showSwapMealPopup(mealData, wNum, dayNum, mealIndex) {
  // Remove existing if present
  const existing = document.getElementById("swapMealPopup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "swapMealPopup";

  const contentDiv = document.createElement("div");
  contentDiv.classList.add("swap-popup-content");

  const titleEl = document.createElement("div");
  titleEl.classList.add("swap-popup-title");
  titleEl.textContent = "What do you want to swap your meal to?";
  contentDiv.appendChild(titleEl);

  // Search area + list
  const searchContainer = document.createElement("div");
  searchContainer.classList.add("swap-search-container");

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Looking for a meal you liked?";
  searchContainer.appendChild(searchInput);

  const listDiv = document.createElement("div");
  listDiv.classList.add("swap-list");
  searchContainer.appendChild(listDiv);

  contentDiv.appendChild(searchContainer);

  // We'll store "previously logged" meals in localStorage as "savedMealsList" => array of {name, cals, protein, carbs, fats}
  let savedMealsList = JSON.parse(localStorage.getItem("savedMealsList") || "[]");

  function renderSavedMeals(searchTerm) {
    listDiv.innerHTML = "";
    let filtered = savedMealsList;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = savedMealsList.filter(m => m.name.toLowerCase().includes(term));
    }
    if (filtered.length === 0) {
      const noRes = document.createElement("div");
      noRes.textContent = "No saved meals found.";
      noRes.style.textAlign = "center";
      noRes.style.color = "#555";
      listDiv.appendChild(noRes);
      return;
    }
    filtered.forEach(item => {
      const row = document.createElement("div");
      row.classList.add("swap-item");
      row.textContent = item.name;
      row.addEventListener("click", () => {
        mealNameInput.value = item.name;
        mealCalsInput.value = item.cals;
        mealProtInput.value = item.protein;
        mealCarbsInput.value = item.carbs;
        mealFatsInput.value = item.fats;
        checkSwapFormInputs();
      });
      listDiv.appendChild(row);
    });

  }
  renderSavedMeals("");

  searchInput.addEventListener("input", () => {
    const val = searchInput.value;
    renderSavedMeals(val);
  });

  // 5 subheadings + input fields
  // 5 subheadings + input fields
  const formDiv = document.createElement("div");
  formDiv.classList.add("swap-form-container");

  // --- Meal Name ---
  const mealNameLabel = document.createElement("label");
  mealNameLabel.classList.add("swap-label");
  mealNameLabel.textContent = "🥘 Meal Name";
  const mealNameInput = document.createElement("input");
  mealNameInput.type = "text";
  mealNameInput.classList.add("swap-input");
  mealNameInput.placeholder = "e.g. Chicken Stir-Fry with Brown Rice";
  formDiv.appendChild(mealNameLabel);
  formDiv.appendChild(mealNameInput);

  // --- Calories ---
  const calsLabel = document.createElement("label");
  calsLabel.classList.add("swap-label");
  calsLabel.textContent = "🔥 Calories";
  const mealCalsInput = document.createElement("input");
  mealCalsInput.type = "number";
  mealCalsInput.classList.add("swap-input");
  mealCalsInput.placeholder = "Enter total calories (e.g. 520 kcals)";
  formDiv.appendChild(calsLabel);
  formDiv.appendChild(mealCalsInput);

  // --- Macros Container for Protein, Carbs, Fats ---
  const macrosContainer = document.createElement("div");
  macrosContainer.classList.add("macros-container");

  // Protein
  const protLabel = document.createElement("label");
  protLabel.classList.add("swap-label");
  protLabel.textContent = "🍗 Protein";
  const mealProtInput = document.createElement("input");
  mealProtInput.type = "number";
  mealProtInput.classList.add("swap-input");
  mealProtInput.placeholder = "Grams of protein (e.g. 42g)";

  // Carbs
  const carbsLabel = document.createElement("label");
  carbsLabel.classList.add("swap-label");
  carbsLabel.textContent = "🍚 Carbs";
  const mealCarbsInput = document.createElement("input");
  mealCarbsInput.type = "number";
  mealCarbsInput.classList.add("swap-input");
  mealCarbsInput.placeholder = "Grams of carbs (e.g. 60g)";

  // Fats
  const fatsLabel = document.createElement("label");
  fatsLabel.classList.add("swap-label");
  fatsLabel.textContent = "🥑 Fats";
  const mealFatsInput = document.createElement("input");
  mealFatsInput.type = "number";
  mealFatsInput.classList.add("swap-input");
  mealFatsInput.placeholder = "Grams of fats (e.g. 15g)";

  // Check for small screen and update placeholders and add centering class
  const isSmallScreen = window.matchMedia("(max-width: 375px)").matches;
  if (isSmallScreen) {
    mealProtInput.placeholder = "Protein (g)";
    mealCarbsInput.placeholder = "Carbs (g)";
    mealFatsInput.placeholder = "Fats (g)";

    mealProtInput.classList.add("center-placeholder");
    mealCarbsInput.classList.add("center-placeholder");
    mealFatsInput.classList.add("center-placeholder");
  }

  // Append macro inputs to container
  macrosContainer.appendChild(protLabel);
  macrosContainer.appendChild(mealProtInput);
  macrosContainer.appendChild(carbsLabel);
  macrosContainer.appendChild(mealCarbsInput);
  macrosContainer.appendChild(fatsLabel);
  macrosContainer.appendChild(mealFatsInput);

  // Append macros container to formDiv
  formDiv.appendChild(macrosContainer);

  // Append formDiv to contentDiv
  contentDiv.appendChild(formDiv);

  /* -----------------------------------------------------------
     Helper function to calculate macros from calories
     Using default percentages: 30% protein, 50% carbs, 20% fat.
     Conversion: Protein & Carbs: 4 cal/g, Fat: 9 cal/g.
  ----------------------------------------------------------- */
  function calculateMacrosFromCalories(calories) {
    const proteinGrams = Math.round((calories * 0.30) / 4);
    const carbsGrams = Math.round((calories * 0.40) / 4);
    const fatsGrams = Math.round((calories * 0.30) / 9);
    return { protein: proteinGrams, carbs: carbsGrams, fats: fatsGrams };
  }

  /* -----------------------------------------------------------
     Override flags: if a user manually focuses on a macro input,
     that field’s auto-update will be disabled.
  ----------------------------------------------------------- */
  let overrideMacros = { protein: false, carbs: false, fats: false };

  mealProtInput.addEventListener("focus", () => { overrideMacros.protein = true; });
  mealCarbsInput.addEventListener("focus", () => { overrideMacros.carbs = true; });
  mealFatsInput.addEventListener("focus", () => { overrideMacros.fats = true; });

  // On blur, if the field is cleared, remove the override so it can be updated
  mealProtInput.addEventListener("blur", () => { if (mealProtInput.value.trim() === "") overrideMacros.protein = false; });
  mealCarbsInput.addEventListener("blur", () => { if (mealCarbsInput.value.trim() === "") overrideMacros.carbs = false; });
  mealFatsInput.addEventListener("blur", () => { if (mealFatsInput.value.trim() === "") overrideMacros.fats = false; });

  /* -----------------------------------------------------------
     Dynamic update of macros as user types in Calorie input.
     Only update a macro field if it hasn’t been manually overridden.
  ----------------------------------------------------------- */
  mealCalsInput.addEventListener("input", () => {
    const calories = parseFloat(mealCalsInput.value);
    if (!isNaN(calories)) {
      const macros = calculateMacrosFromCalories(calories);
      if (!overrideMacros.protein) {
        mealProtInput.value = macros.protein;
      }
      if (!overrideMacros.carbs) {
        mealCarbsInput.value = macros.carbs;
      }
      if (!overrideMacros.fats) {
        mealFatsInput.value = macros.fats;
      }
    } else {
      // Optionally clear macros if calories is invalid
      if (!overrideMacros.protein) mealProtInput.value = "";
      if (!overrideMacros.carbs) mealCarbsInput.value = "";
      if (!overrideMacros.fats) mealFatsInput.value = "";
    }
    checkSwapFormInputs();
  });

  /* -----------------------------------------------------------
     Function to check that all input fields are filled,
     enabling the "Swap Meal" button when they are.
  ----------------------------------------------------------- */
  function checkSwapFormInputs() {
    if (
      mealNameInput.value.trim() !== "" &&
      mealCalsInput.value.trim() !== "" &&
      mealProtInput.value.trim() !== "" &&
      mealCarbsInput.value.trim() !== "" &&
      mealFatsInput.value.trim() !== ""
    ) {
      confirmBtn.disabled = false;
    } else {
      confirmBtn.disabled = true;
    }
  }

  // Attach event listeners to non-calorie fields as well
  mealNameInput.addEventListener("input", checkSwapFormInputs);
  mealProtInput.addEventListener("input", checkSwapFormInputs);
  mealCarbsInput.addEventListener("input", checkSwapFormInputs);
  mealFatsInput.addEventListener("input", checkSwapFormInputs);

  /* -----------------------------------------------------------
     Confirm / Cancel Buttons block
  ----------------------------------------------------------- */
  const btnContainer = document.createElement("div");
  btnContainer.classList.add("swap-btn-container");

  const confirmBtn = document.createElement("button");
  confirmBtn.id = "confirmSwapMealBtn";
  confirmBtn.textContent = "Swap Meal";
  confirmBtn.disabled = true; // Initially disabled
  btnContainer.appendChild(confirmBtn);

  /* -----------------------------------------------------------
     Confirm button click handler
  ----------------------------------------------------------- */
  confirmBtn.addEventListener("click", () => {
    const nameVal = mealNameInput.value.trim();
    const calsVal = parseFloat(mealCalsInput.value.trim());
    const protVal = parseFloat(mealProtInput.value.trim());
    const carbVal = parseFloat(mealCarbsInput.value.trim());
    const fatVal = parseFloat(mealFatsInput.value.trim());

    if (!nameVal || isNaN(calsVal) || isNaN(protVal) || isNaN(carbVal) || isNaN(fatVal)) {
      alert("Please fill in all meal fields properly.");
      return;
    }

    // 1) Save the original meal name for tracking
    const originalMealKey = `week${wNum}_day${dayNum}_meal${mealIndex}_originalMealName`;
    localStorage.setItem(originalMealKey, mealData.mealName || "");

    // 2) Update or add to savedMealsList
    let existingIndex = savedMealsList.findIndex(m => m.name.toLowerCase() === nameVal.toLowerCase());
    if (existingIndex >= 0) {
      savedMealsList[existingIndex].name = nameVal;
      savedMealsList[existingIndex].cals = calsVal;
      savedMealsList[existingIndex].protein = protVal;
      savedMealsList[existingIndex].carbs = carbVal;
      savedMealsList[existingIndex].fats = fatVal;
    } else {
      savedMealsList.push({
        name: nameVal,
        cals: calsVal,
        protein: protVal,
        carbs: carbVal,
        fats: fatVal
      });
    }
    localStorage.setItem("savedMealsList", JSON.stringify(savedMealsList));

    // 3) Mark the meal as "swapped"
    const mealStatusKey = `week${wNum}_day${dayNum}_meal${mealIndex}_status`;
    localStorage.setItem(mealStatusKey, "swapped");

    // 4) Store macros/calories for daily totals
    const mealCalsKey = `week${wNum}_day${dayNum}_meal${mealIndex}_cals`;
    const mealProtKey = `week${wNum}_day${dayNum}_meal${mealIndex}_protein`;
    const mealCarbsKey = `week${wNum}_day${dayNum}_meal${mealIndex}_carbs`;
    const mealFatsKey = `week${wNum}_day${dayNum}_meal${mealIndex}_fats`;
    localStorage.setItem(mealCalsKey, calsVal.toString());
    localStorage.setItem(mealProtKey, protVal.toString());
    localStorage.setItem(mealCarbsKey, carbVal.toString());
    localStorage.setItem(mealFatsKey, fatVal.toString());

    // 5) Store the swapped meal name so the UI updates
    const swappedNameKey = `week${wNum}_day${dayNum}_meal${mealIndex}_swappedName`;
    localStorage.setItem(swappedNameKey, nameVal);

    // 6) Award XP
    addXP(50);

    // 7) Close popup & re-render
    closeSwapMealPopup();
    renderDailyMealDisplay();
  });

  btnContainer.appendChild(confirmBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.id = "cancelSwapMealBtn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    closeSwapMealPopup();
  });
  btnContainer.appendChild(cancelBtn);

  contentDiv.appendChild(btnContainer);

  popup.appendChild(contentDiv);
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.classList.add("visible");
  });

  function closeSwapMealPopup() {
    popup.classList.remove("visible");
    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 300);
  }
}

function showSkipMealPopup(mealData, wNum, dayNum, mealIndex) {
  // Remove existing skip pop-up if present
  const existing = document.getElementById("skipMealPopup");
  if (existing) existing.remove();

  // Create the pop-up container
  const popup = document.createElement("div");
  popup.id = "skipMealPopup";
  popup.style.position = "fixed";
  popup.style.bottom = "0";
  popup.style.left = "0";
  popup.style.width = "93%";
  popup.style.background = "#F6EFE3";
  popup.style.boxShadow = "0 -4px 8px rgba(0, 0, 0, 0.2)";
  popup.style.transform = "translateY(100%)";
  popup.style.transition = "transform 0.3s ease-out";
  popup.style.zIndex = "1200";
  popup.style.overflow = "hidden";
  popup.style.padding = "20px 15px";
  popup.style.fontFamily = '"Poppins", sans-serif';

  // Inner content container (reuse the same class as swap popup for styling)
  const contentDiv = document.createElement("div");
  contentDiv.classList.add("swap-popup-content");

  // Title
  const titleEl = document.createElement("div");
  titleEl.classList.add("swap-popup-title");
  titleEl.textContent = "Skip This Meal?";
  contentDiv.appendChild(titleEl);

  // Body container (holds the streak warning and main body text)
  const bodyContainer = document.createElement("div");
  bodyContainer.style.textAlign = "center";
  bodyContainer.style.marginTop = "10px";

  // Use the *global* streak count to show a warning if user is on a streak
  if (nutritionStreakCount > 0) {
    const upcomingStreak = nutritionStreakCount + 1;
    let streakWarningMessage = "";

    // If the *upcoming* streak is 3, or divisible by 5 or 7, show milestoneTeaseMessages
    if (upcomingStreak === 3 || upcomingStreak % 5 === 0 || upcomingStreak % 7 === 0) {
      const milestoneTeaseMessages = [
        `🎯 You're just 1 meal away from a new milestone! Let’s lock it in.`,
        `🚀 Almost there — complete this meal to hit a <strong>${upcomingStreak}-day</strong> streak!`,
        `🏆 One more and you’ll reach your next streak badge! Stay on track.`,
        `🔥 You’ve come so far — don’t stop now. A <strong>${upcomingStreak}-day</strong> streak is within reach!`,
        `🎉 Big milestone ahead! Just this meal left to make it a <strong>${upcomingStreak}-day</strong> streak.`,
        `💪 One step away from greatness — keep that streak alive!`,
        `🔓 You're on the edge of unlocking a new streak tier — finish this meal strong!`,
        `🥇 One more and you're part of the elite <strong>${upcomingStreak}-day</strong> club.`,
        `⏳ Just a bit more consistency and you’ll reach your next reward!`,
        `🎖️ Nearing victory — hit <strong>${upcomingStreak}-day</strong> by logging this meal!`
      ];
      streakWarningMessage = milestoneTeaseMessages[Math.floor(Math.random() * milestoneTeaseMessages.length)];
    } else {
      // Otherwise, show normal streak warning messages
      const streakMessages = [
        `⚠️ You’re on a <strong>${nutritionStreakCount}-day</strong> nutrition streak! Skipping this meal will reset it.`,
        `⏳ You’ve logged <strong>${nutritionStreakCount}</strong> days in a row — keep the momentum going!`,
        `🔥 You've been consistent for a <strong>${nutritionStreakCount}-day</strong> streak! Don’t break the streak now.`,
        `🚀 Every meal counts — you're building a strong <strong>${nutritionStreakCount}-day</strong> routine.`,
        `📈 Progress is stacking up! Skipping now resets your <strong>${nutritionStreakCount}-day</strong> streak.`,
        `🏅 You're on a roll — a <strong>${nutritionStreakCount}-day</strong> streak! Don’t let a skipped meal set you back.`,
        `🚀 A <strong>${nutritionStreakCount}-day</strong> streak! Each meal builds the foundation for your goals.`,
        `🔥 Streak in progress! Push through day <strong>${upcomingStreak}</strong>!`,
        `🚀 Momentum is everything — you're <strong>${nutritionStreakCount}-day</strong> deep, finish strong!`,
        `💡 Just a heads-up: skipping this will reset your current <strong>${nutritionStreakCount}-day</strong> streak.`
      ];
      streakWarningMessage = streakMessages[Math.floor(Math.random() * streakMessages.length)];
    }

    // Create the streak warning element using innerHTML so the <strong> tags render properly:
    const streakWarning = document.createElement("div");
    streakWarning.classList.add("skip-streak-warning");
    streakWarning.innerHTML = streakWarningMessage;
    streakWarning.style.marginBottom = "10px";
    bodyContainer.appendChild(streakWarning);
  }

  // Main body text
  const bodyText = document.createElement("div");
  bodyText.textContent =
    "Skipping meals now and then is totally okay — just make sure it aligns with your goals. Would you like to skip this one?";
  bodyContainer.appendChild(bodyText);

  contentDiv.appendChild(bodyContainer);

  // Buttons container (vertically stacked)
  const btnContainer = document.createElement("div");
  btnContainer.classList.add("swap-btn-container");

  // "Yes, Skip Meal" button (red)
  const yesBtn = document.createElement("button");
  yesBtn.id = "confirmSkipMealBtn";
  yesBtn.textContent = "Yes, Skip Meal";
  yesBtn.style.backgroundColor = "#FF6B6B"; // red
  yesBtn.style.color = "#000";
  yesBtn.style.border = "none";
  yesBtn.style.borderRadius = "5px";
  yesBtn.style.padding = "16px";
  yesBtn.style.fontSize = "1.1rem";
  yesBtn.style.fontWeight = "600";
  yesBtn.style.width = "100%";
  yesBtn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
  yesBtn.style.marginBottom = "10px";
  yesBtn.addEventListener("click", () => {
    // Mark the meal as "skipped"
    const mealStatusKey = `week${wNum}_day${dayNum}_meal${mealIndex}_status`;
    localStorage.setItem(mealStatusKey, "skipped");

    // Zero out macros
    const mealCalsKey = `week${wNum}_day${dayNum}_meal${mealIndex}_cals`;
    const mealProtKey = `week${wNum}_day${dayNum}_meal${mealIndex}_protein`;
    const mealCarbsKey = `week${wNum}_day${dayNum}_meal${mealIndex}_carbs`;
    const mealFatsKey = `week${wNum}_day${dayNum}_meal${mealIndex}_fats`;
    localStorage.setItem(mealCalsKey, "0");
    localStorage.setItem(mealProtKey, "0");
    localStorage.setItem(mealCarbsKey, "0");
    localStorage.setItem(mealFatsKey, "0");

    // Reset the nutrition streak
    resetNutritionStreak();

    closeSkipMealPopup();
    renderDailyMealDisplay();
  });
  btnContainer.appendChild(yesBtn);

  // "Go Back" button (gray)
  const goBackBtn = document.createElement("button");
  goBackBtn.id = "cancelSkipMealBtn";
  goBackBtn.textContent = "Go Back";
  goBackBtn.style.backgroundColor = "#B0B0B0";
  goBackBtn.style.color = "#fff";
  goBackBtn.style.border = "none";
  goBackBtn.style.borderRadius = "5px";
  goBackBtn.style.padding = "16px";
  goBackBtn.style.fontSize = "1.1rem";
  goBackBtn.style.fontWeight = "600";
  goBackBtn.style.width = "100%";
  goBackBtn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
  goBackBtn.addEventListener("click", () => {
    closeSkipMealPopup();
  });
  btnContainer.appendChild(goBackBtn);

  contentDiv.appendChild(btnContainer);
  popup.appendChild(contentDiv);
  document.body.appendChild(popup);

  // Animate the pop-up into view
  requestAnimationFrame(() => {
    popup.classList.add("visible");
    popup.style.transform = "translateY(0)";
  });

  function closeSkipMealPopup() {
    popup.style.transform = "translateY(100%)";
    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 300);
  }
}


function showSummaryPopup() {
  // --- RE-CALCULATE DAILY TOTALS (simulate similar logic to renderDailyMealDisplay) ---
  const weekObj = mealPlanData[currentWeekIndex];
  const dayObj = weekObj.days[currentDayIndex];
  const wNum = weekObj.week;
  const mealPlanMeals = Object.keys(dayObj.meals || {});
  const totalMealsToday = mealPlanMeals.length;

  let calsConsumed = 0, proteinConsumed = 0, carbsConsumed = 0, fatsConsumed = 0;
  let mealsLoggedCount = 0, skippedCount = 0, mealsInteractedCount = 0;

  mealPlanMeals.forEach((mealKey, idx) => {
    const mealStatusKey = `week${wNum}_day${dayObj.day}_meal${idx + 1}_status`;
    const status = localStorage.getItem(mealStatusKey) || "";
    if (status === "logged" || status === "swapped") {
      mealsLoggedCount++;
      mealsInteractedCount++;
      const mealData = dayObj.meals[mealKey];
      const mCals = parseFloat(localStorage.getItem(`week${wNum}_day${dayObj.day}_meal${idx + 1}_cals`)) || mealData.calories || 0;
      const mProt = parseFloat(localStorage.getItem(`week${wNum}_day${dayObj.day}_meal${idx + 1}_protein`)) || mealData.protein || 0;
      const mCarb = parseFloat(localStorage.getItem(`week${wNum}_day${dayObj.day}_meal${idx + 1}_carbs`)) || mealData.carbs || 0;
      const mFat = parseFloat(localStorage.getItem(`week${wNum}_day${dayObj.day}_meal${idx + 1}_fats`)) || mealData.fats || 0;
      calsConsumed += mCals;
      proteinConsumed += mProt;
      carbsConsumed += mCarb;
      fatsConsumed += mFat;
    } else if (status === "skipped") {
      skippedCount++;
      mealsInteractedCount++;
    }
  });

  // Retrieve target values
  const totalDailyCals = parseInt(localStorage.getItem(`week${wNum}_dailyCalsWMCO`) || dayObj.finalTotalCals || "2000", 10);
  const totalProtein = parseInt(localStorage.getItem(`week${wNum}_proteinWMCO`) || "150", 10);
  const totalCarbs = parseInt(localStorage.getItem(`week${wNum}_carbsWMCO`) || "200", 10);
  const totalFats = parseInt(localStorage.getItem(`week${wNum}_fatsWMCO`) || "70", 10);

  // --- Get the frozen streak value for this day (stored when the day was completed) ---
  const dayStreakStr = localStorage.getItem(`week${wNum}_day${dayObj.day}_streak`) || "0";
  const dayStreak = parseInt(dayStreakStr, 10);

  // --- CALORIE CRITERIA ---
  const calDiff = Math.abs(totalDailyCals - calsConsumed);
  const within5 = (calDiff <= totalDailyCals * 0.05);
  const overEaten = (calsConsumed > totalDailyCals * 1.05);
  const underEaten = (calsConsumed < totalDailyCals * 0.70);

  const isSmallScreen = window.matchMedia("(max-width: 375px)").matches;

  let headerOptions = [], subtextOptions = [];
  if (within5) {
    headerOptions = [
      "Nailed it!",
      "Spot on!",
      "On the money!",
      "Fuelled to perform!",
      "Perfectly balanced!"
    ];
    subtextOptions = [
      "You stayed right on track with your nutrition — well done!",
      "Great job hitting your target today. This is how progress is made!",
      "You fueled your body with exactly what it needed. Keep this up!",
      "That’s the kind of consistency that gets results.",
      "Bang on — your dedication is showing!"
    ];
  } else if (overEaten) {
    headerOptions = [
      "No big deal.",
      "It happens!",
      "Tomorrow’s a new chance.",
      "Don’t sweat it.",
      "Progress isn’t linear."
    ];
    subtextOptions = [
      "One high-calorie day won’t derail your journey — just refocus tomorrow.",
      "You might’ve gone a little over, but it’s your weekly average that matters most.",
      "Don’t beat yourself up — enjoy it, then get back on track.",
      "Every day is a data point, not a pass/fail test.",
      "Balance is key — move forward with intention tomorrow."
    ];
  } else if (underEaten) {
    headerOptions = [
      "You showed up.",
      "It’s okay to have light days.",
      "Still proud of you.",
      "Progress takes patience.",
      "Let’s aim higher tomorrow."
    ];
    subtextOptions = [
      "Even low-calorie days count — just try to get closer to your target next time.",
      "It happens! Let’s make sure your body gets what it needs tomorrow.",
      "Eating too little can slow things down — fuel up when you can.",
      "Remember: consistency over perfection. You’ve still moved forward.",
      "Tomorrow’s a great opportunity to hit your targets again."
    ];
  } else {
    headerOptions = [
      "Nailed it!",
      "Spot on!",
      "On the money!",
      "Fuelled to perform!",
      "Perfectly balanced!"
    ];
    subtextOptions = [
      "You stayed right on track with your nutrition — well done!",
      "Great job hitting your target today. This is how progress is made!",
      "You fueled your body with exactly what it needed. Keep this up!",
      "That’s the kind of consistency that gets results.",
      "Bang on — your dedication is showing!"
    ];
  }

  // Randomly select header/subtext messages (these don't need to be frozen)
  const headerText = headerOptions[Math.floor(Math.random() * headerOptions.length)];
  let subtextText = "";
  if (!isSmallScreen) {
    subtextText = subtextOptions[Math.floor(Math.random() * subtextOptions.length)];
    if (headerText === "Perfectly balanced!" && Math.random() < 0.5) {
      subtextText = "As all things should be...🫰";
    }
  }

  // --- CREATE THE SUMMARY POP-UP ---
  const popup = document.createElement("div");
  popup.id = "summaryPopup";
  popup.style.position = "fixed";
  popup.style.bottom = "0";
  popup.style.left = "0";
  popup.style.width = "93%";
  popup.style.background = "#F6EFE3";
  popup.style.boxShadow = "0 -4px 8px rgba(0, 0, 0, 0.2)";
  popup.style.transform = "translateY(100%)";
  popup.style.transition = "transform 0.3s ease-out";
  popup.style.zIndex = "1200";
  popup.style.overflow = "hidden";
  popup.style.padding = "20px 15px";
  popup.style.fontFamily = '"Poppins", sans-serif';

  const contentDiv = document.createElement("div");
  contentDiv.classList.add("swap-popup-content");

  // Header Section
  const titleEl = document.createElement("div");
  titleEl.classList.add("swap-popup-title");
  titleEl.textContent = headerText;
  // Adjust margin-bottom based on screen size
  titleEl.style.marginBottom = isSmallScreen ? "5px" : "15px";
  contentDiv.appendChild(titleEl);

  // Only add subtext if not on a small screen
  if (!isSmallScreen && subtextText) {
    const subtextEl = document.createElement("div");
    subtextEl.style.textAlign = "center";
    subtextEl.style.marginTop = "5px";
    subtextEl.textContent = subtextText;
    contentDiv.appendChild(subtextEl);
  }

  // Divider with reduced margin on small screens
  const divider = document.createElement("hr");
  divider.style.margin = isSmallScreen ? "5px 0" : "15px 0";
  contentDiv.appendChild(divider);

  // Summary Details Section (Meal Completion & Macros)
  const summaryDetails = document.createElement("div");
  // Center the summary details on the popup
  summaryDetails.style.textAlign = "center";
  summaryDetails.style.fontSize = "1rem";
  summaryDetails.style.lineHeight = "1.5";

  let emoji = "🍽️";
  if (mealsLoggedCount === totalMealsToday && skippedCount === 0) {
    emoji = "🎉";
  }

  let mealCompletionHTML = `${emoji} Meal Completion: <strong>${mealsLoggedCount} of ${totalMealsToday} meals logged</strong>`;
  if (skippedCount > 0) {
    mealCompletionHTML += ` (<strong>${skippedCount} skipped</strong>)`;
  }

  // Then use mealCompletionHTML directly in your summaryDetails.innerHTML
  summaryDetails.innerHTML = `
    <div style="text-align: center; background: #EDE7DB; padding: 12px; border-radius: 5px; border: 1px solid #D8CFC0;">
      ${mealCompletionHTML}<br><br>
      🔥 Calories: <strong>${calsConsumed}</strong> / <strong>${totalDailyCals}</strong><br>
      🍗 Protein: <strong>${proteinConsumed}g</strong> / <strong>${totalProtein}g</strong><br>
      🍚 Carbs: <strong>${carbsConsumed}g</strong> / <strong>${totalCarbs}g</strong><br>
      🥑 Fats: <strong>${fatsConsumed}g</strong> / <strong>${totalFats}g</strong>
    </div>
  `;
  contentDiv.appendChild(summaryDetails);

  // Active Streak Message (using frozen dayStreak)
  if (dayStreak > 0) {
    const streakMsgKey = `week${wNum}_day${dayObj.day}_activeStreakMessage`;
    let streakMessage = localStorage.getItem(streakMsgKey);
    if (!streakMessage) {
      // If no stored message exists, generate one:
      const milestoneMapping = {
        3: "🎉 You've hit a 3-day streak! The habit is forming — keep the momentum going.",
        5: "🥳 5 days strong! You’re building something powerful.",
        7: "🏅 1 full week of consistency — amazing dedication!",
        10: "🚀 10-day streak! You're creating real, lasting change.",
        14: "🧱 2 weeks straight — your discipline is becoming unshakable.",
        15: "🔥 15 days in — that’s a serious streak!",
        20: "🌟 20-day streak! Your effort is really showing.",
        21: "🎖️ 3 weeks deep — momentum is unstoppable now.",
        25: "🏆 25 days of showing up — elite consistency.",
        28: "🧠 4 full weeks tracked — that’s a milestone worth celebrating!",
        30: "💫 30-day streak! You’ve built the habit and the mindset.",
        35: "⚔️ 5 weeks strong — you’re raising the bar every day.",
        40: "🔥 40 days in — your commitment is undeniable.",
        49: "🔒 7 full weeks — you’re locked in.",
        50: "🎯 50-day streak! That’s world-class consistency."
      };
      if (milestoneMapping[dayStreak]) {
        streakMessage = milestoneMapping[dayStreak];
      } else {
        const activeStreakMessages = [
          (streakCount) =>
            `✅ You've stayed on track for ${streakCount} ${streakCount === 1 ? 'day' : 'days'} — keep it up!`,
          (streakCount) =>
            `🔥 That’s ${streakCount} ${streakCount === 1 ? 'day' : 'days'} of consistency. It’s showing!`,
          (streakCount) =>
            `📈 ${streakCount} ${streakCount === 1 ? 'day' : 'days'} deep — your habits are becoming your lifestyle.`,
          (streakCount) =>
            `🧱 Brick by brick — ${streakCount} ${streakCount === 1 ? 'day' : 'days'} stacked!`,
          (streakCount) =>
            `🥗 ${streakCount}-${streakCount === 1 ? 'day' : 'days'} streak and counting. Your future self is proud.`,
          (streakCount) =>
            `🎯 You're building real momentum — ${streakCount} ${streakCount === 1 ? 'day' : 'days'} strong.`,
          (streakCount) =>
            `💪 ${streakCount} ${streakCount === 1 ? 'day' : 'days'} straight. You're not just eating better, you're *becoming* better.`,
          (streakCount) =>
            `🧠 Discipline unlocked: ${streakCount}-${streakCount === 1 ? 'day' : 'days'} streak.`,
          (streakCount) =>
            `⏳ ${streakCount} ${streakCount === 1 ? 'day' : 'days'} of progress. Every meal has moved you forward.`
        ];        
        streakMessage = activeStreakMessages[Math.floor(Math.random() * activeStreakMessages.length)];
      }
      // Freeze the message for this day
      localStorage.setItem(streakMsgKey, streakMessage);
    }
    const streakMessageEl = document.createElement("div");
    streakMessageEl.style.textAlign = "center";
    streakMessageEl.style.marginTop = "10px";
    streakMessageEl.style.fontWeight = "bold";
    streakMessageEl.textContent = streakMessage;
    contentDiv.appendChild(streakMessageEl);
  }

  // Feedback Buttons or Single Close Button (based on whether feedback has been given)
  const feedbackKey = `nutritionFeedbackGiven_${wNum}_${dayObj.day}`;
  const feedbackGiven = localStorage.getItem(feedbackKey);

  if (!feedbackGiven) {
    const feedbackSubheading = document.createElement("div");
    feedbackSubheading.style.textAlign = "center";
    feedbackSubheading.style.marginTop = "15px";
    feedbackSubheading.style.fontWeight = "bold";
    feedbackSubheading.textContent = "How did you feel about your nutrition today?";
    contentDiv.appendChild(feedbackSubheading);
  }

  const btnContainerFeedback = document.createElement("div");
  btnContainerFeedback.classList.add("swap-btn-container");

  if (feedbackGiven) {
    const closeBtn = document.createElement("button");
    closeBtn.id = "closeSummaryFeedbackBtn";
    closeBtn.textContent = "Close";
    closeBtn.style.backgroundColor = "#B0B0B0";
    closeBtn.style.color = "#fff";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "5px";
    closeBtn.style.padding = "16px";
    closeBtn.style.fontSize = "1.1rem";
    closeBtn.style.fontWeight = "600";
    closeBtn.style.width = "100%";
    closeBtn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
    closeBtn.addEventListener("click", () => {
      closeSummaryPopup();
    });
    btnContainerFeedback.appendChild(closeBtn);
  } else {
    // (Existing logic for three feedback buttons)
    const greenFeedbacks = [
      "Felt Great",
      "On Point",
      "Crushed It",
      "Very Happy",
      "Nailed It",
      "Solid Day",
      "Proud of Today",
      "Energised"
    ];
    const yellowFeedbacks = [
      "It Was Okay",
      "Not Bad",
      "Could Be Better",
      "Average Day",
      "So-So",
      "Nothing Special",
      "Just Meh",
      "Decent Enough"
    ];
    const redFeedbacks = [
      "Off Day",
      "Not Great",
      "Struggled Today",
      "Felt Off",
      "Missed the Mark",
      "Couldn’t Stick to It",
      "Tough One",
      "Didn’t Go to Plan"
    ];

    const greenBtn = document.createElement("button");
    greenBtn.textContent = greenFeedbacks[Math.floor(Math.random() * greenFeedbacks.length)];
    greenBtn.style.backgroundColor = "#6FCF97";
    greenBtn.style.color = "#000";
    greenBtn.style.border = "none";
    greenBtn.style.borderRadius = "5px";
    greenBtn.style.padding = "16px";
    greenBtn.style.fontSize = "1.1rem";
    greenBtn.style.fontWeight = "600";
    greenBtn.style.width = "100%";
    greenBtn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
    greenBtn.addEventListener("click", () => {
      localStorage.setItem(feedbackKey, "green");
      closeSummaryPopup();
    });
    btnContainerFeedback.appendChild(greenBtn);

    const yellowBtn = document.createElement("button");
    yellowBtn.textContent = yellowFeedbacks[Math.floor(Math.random() * yellowFeedbacks.length)];
    yellowBtn.style.backgroundColor = "#F4D06F";
    yellowBtn.style.color = "#000";
    yellowBtn.style.border = "none";
    yellowBtn.style.borderRadius = "5px";
    yellowBtn.style.padding = "16px";
    yellowBtn.style.fontSize = "1.1rem";
    yellowBtn.style.fontWeight = "600";
    yellowBtn.style.width = "100%";
    yellowBtn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
    yellowBtn.addEventListener("click", () => {
      localStorage.setItem(feedbackKey, "yellow");
      closeSummaryPopup();
    });
    btnContainerFeedback.appendChild(yellowBtn);

    const redBtn = document.createElement("button");
    redBtn.textContent = redFeedbacks[Math.floor(Math.random() * redFeedbacks.length)];
    redBtn.style.backgroundColor = "#FF6B6B";
    redBtn.style.color = "#000";
    redBtn.style.border = "none";
    redBtn.style.borderRadius = "5px";
    redBtn.style.padding = "16px";
    redBtn.style.fontSize = "1.1rem";
    redBtn.style.fontWeight = "600";
    redBtn.style.width = "100%";
    redBtn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
    redBtn.addEventListener("click", () => {
      localStorage.setItem(feedbackKey, "red");
      closeSummaryPopup();
    });
    btnContainerFeedback.appendChild(redBtn);
  }

  contentDiv.appendChild(btnContainerFeedback);
  popup.appendChild(contentDiv);
  document.body.appendChild(popup);

  // Animate popup into view
  requestAnimationFrame(() => {
    popup.classList.add("visible");
    popup.style.transform = "translateY(0)";
  });

  function closeSummaryPopup() {
    popup.style.transform = "translateY(100%)";
    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 300);
  }
}

/********************************************
 * (NEW) Show Meal Prep Mode Popup
 ********************************************/
function showMealPrepModePopup(weekIndex) {
  if (mealPrepPopupVisible) return; // Don’t open twice
  mealPrepPopupVisible = true;

  // Create the pop-up container (styling similar to swap/skip popups)
  const popup = document.createElement("div");
  popup.id = "mealPrepModePopup";
  popup.style.position = "fixed";
  popup.style.bottom = "0";
  popup.style.left = "0";
  popup.style.width = "93%";
  popup.style.background = "#F6EFE3";
  popup.style.boxShadow = "0 -4px 8px rgba(0, 0, 0, 0.2)";
  popup.style.transform = "translateY(100%)";
  popup.style.transition = "transform 0.3s ease-out";
  popup.style.zIndex = "1200";
  popup.style.overflow = "hidden";
  popup.style.padding = "20px 15px";
  popup.style.fontFamily = '"Poppins", sans-serif';

  // Inner content wrapper (reuse .swap-popup-content styles for consistency)
  const contentDiv = document.createElement("div");
  contentDiv.classList.add("swap-popup-content");

  // 1) Title: "🧑‍🍳 Meal Prep Mode - Week X"
  const weekNumber = mealPlanData[weekIndex].week;
  const titleEl = document.createElement("div");
  titleEl.classList.add("swap-popup-title");
  titleEl.textContent = `🧑‍🍳 Meal Prep Mode - Week ${weekNumber}`;
  contentDiv.appendChild(titleEl);

  // 2) Tab selectors: "📅 Weekly Summary" & "🛒 Shopping List"
  const tabsWrapper = document.createElement("div");
  tabsWrapper.style.display = "flex";
  tabsWrapper.style.justifyContent = "center";
  tabsWrapper.style.borderBottom = "2px solid #ccc";
  tabsWrapper.style.marginTop = "10px";

  // We’ll track which tab is active with a local variable
  let activeTab = "summary"; // default

  const summaryTab = document.createElement("div");
  summaryTab.textContent = "📅 Weekly Summary";
  summaryTab.style.flex = "1";
  summaryTab.style.textAlign = "center";
  summaryTab.style.padding = "12px";
  summaryTab.style.cursor = "pointer";
  summaryTab.style.fontWeight = "bold";
  summaryTab.style.fontSize = "18px";
  summaryTab.classList.add("active"); // default active styling
  summaryTab.style.borderBottom = "2px solid #007BFF";

  const shoppingTab = document.createElement("div");
  shoppingTab.innerHTML = "🛒 Shopping <br> List";
  shoppingTab.style.flex = "1";
  shoppingTab.style.textAlign = "center";
  shoppingTab.style.padding = "12px";
  shoppingTab.style.cursor = "pointer";
  shoppingTab.style.fontWeight = "bold";
  shoppingTab.style.fontSize = "18px";

  // Click handlers to toggle
  summaryTab.addEventListener("click", () => {
    if (activeTab !== "summary") {
      activeTab = "summary";
      summaryTab.classList.add("active");
      summaryTab.style.borderBottom = "2px solid #007BFF";
      shoppingTab.classList.remove("active");
      shoppingTab.style.borderBottom = "none";
      weeklySummaryContent.style.display = "block";
      shoppingListContent.style.display = "none";
      // Fade out the Copy List button (its space remains reserved)
      copyListBtn.style.opacity = "0";
      copyListBtn.style.pointerEvents = "none";
    }
  });

  shoppingTab.addEventListener("click", () => {
    if (activeTab !== "shopping") {
      activeTab = "shopping";
      shoppingTab.classList.add("active");
      shoppingTab.style.borderBottom = "2px solid #007BFF";
      summaryTab.classList.remove("active");
      summaryTab.style.borderBottom = "none";
      weeklySummaryContent.style.display = "none";
      shoppingListContent.style.display = "block";
      // Fade in the Copy List button (space remains reserved)
      copyListBtn.style.opacity = "1";
      copyListBtn.style.pointerEvents = "auto";
    }
  });

  tabsWrapper.appendChild(summaryTab);
  tabsWrapper.appendChild(shoppingTab);
  contentDiv.appendChild(tabsWrapper);

  // 3) The content containers for each tab
  const weeklySummaryContent = document.createElement("div");
  weeklySummaryContent.style.display = "block"; // default tab is summary
  weeklySummaryContent.style.overflowY = "auto";
  weeklySummaryContent.style.maxHeight = "340px";
  weeklySummaryContent.style.marginTop = "10px";
  weeklySummaryContent.style.paddingRight = "8px";
  weeklySummaryContent.style.backgroundColor = "#F2E9DA";
  weeklySummaryContent.style.padding = "0 16px";
  weeklySummaryContent.style.borderRadius = "12px";
  weeklySummaryContent.style.border = "1px solid #D8CFC0";

  const shoppingListContent = document.createElement("div");
  shoppingListContent.style.display = "none";
  shoppingListContent.style.overflowY = "auto";
  shoppingListContent.style.maxHeight = "340px";
  shoppingListContent.style.marginTop = "10px";
  shoppingListContent.style.paddingRight = "8px";
  shoppingListContent.style.backgroundColor = "#F2E9DA";
  shoppingListContent.style.padding = "0 16px";
  shoppingListContent.style.borderRadius = "12px";
  shoppingListContent.style.border = "1px solid #D8CFC0";

  // Populate the "Weekly Summary" tab
  weeklySummaryContent.innerHTML = buildWeeklySummaryHTML(weekIndex);

  // Populate the "Shopping List" tab
  shoppingListContent.innerHTML = buildShoppingListHTML(weekIndex);

  contentDiv.appendChild(weeklySummaryContent);
  contentDiv.appendChild(shoppingListContent);

  // 4) Copy List & Close buttons (stacked)
  const buttonWrapper = document.createElement("div");
  buttonWrapper.style.display = "flex";
  buttonWrapper.style.flexDirection = "column";
  buttonWrapper.style.gap = "10px";
  buttonWrapper.style.marginTop = "10px";

  // "Copy List" button (only shows if "Shopping List" tab is active)
  const copyListBtn = document.createElement("button");
  copyListBtn.textContent = "Copy List";
  copyListBtn.style.backgroundColor = "#007BFF";
  copyListBtn.style.color = "#fff";
  copyListBtn.style.padding = "16px";
  copyListBtn.style.fontSize = "1.1rem";
  copyListBtn.style.fontWeight = "600";
  copyListBtn.style.border = "none";
  copyListBtn.style.borderRadius = "5px";
  copyListBtn.style.cursor = "pointer";
  copyListBtn.style.transition = "opacity 0.4s ease";
  // Always reserve space by keeping display:block; initially, set opacity to 0 and disable pointer events.
  copyListBtn.style.display = "block";
  copyListBtn.style.opacity = "0";
  copyListBtn.style.pointerEvents = "none";

  // Above it, show the "🧾 Shopping list copied!" message after copying
  const copyConfirmMsg = document.createElement("div");
  copyConfirmMsg.textContent = "🧾 Shopping list copied!";
  copyConfirmMsg.style.fontWeight = "bold";
  copyConfirmMsg.style.textAlign = "center";
  copyConfirmMsg.style.marginBottom = "5px";
  copyConfirmMsg.style.opacity = "0";
  copyConfirmMsg.style.transition = "opacity 0.5s ease";

  copyListBtn.addEventListener("click", () => {
    // Copy the entire Shopping List content to clipboard
    const range = document.createRange();
    range.selectNode(shoppingListContent);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    try {
      document.execCommand("copy");
      sel.removeAllRanges();
      // Show the "copied" message
      copyConfirmMsg.style.opacity = "1";
      setTimeout(() => {
        copyConfirmMsg.style.opacity = "0";
        // After a 1-second delay, close the popup
        closeMealPrepModePopup();
      }, 1000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  });

  // "Close" button (always visible)
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.backgroundColor = "#B0B0B0";
  closeBtn.style.color = "#fff";
  closeBtn.style.padding = "16px";
  closeBtn.style.fontSize = "1.1rem";
  closeBtn.style.fontWeight = "600";
  closeBtn.style.border = "none";
  closeBtn.style.borderRadius = "6px";
  closeBtn.style.cursor = "pointer";

  closeBtn.addEventListener("click", () => {
    closeMealPrepModePopup();
  });

  // Append the "copied" msg, buttons to wrapper
  buttonWrapper.appendChild(copyConfirmMsg);
  buttonWrapper.appendChild(copyListBtn);
  buttonWrapper.appendChild(closeBtn);

  contentDiv.appendChild(buttonWrapper);
  popup.appendChild(contentDiv);
  document.body.appendChild(popup);

  // Animate pop-up into view
  requestAnimationFrame(() => {
    popup.style.transform = "translateY(0)";
  });

  function closeMealPrepModePopup() {
    popup.style.transform = "translateY(100%)";
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
      mealPrepPopupVisible = false;
    }, 300);
  }
  // Add swipe gesture detection to switch tabs
  let touchstartX = 0;
  let touchendX = 0;
  const gestureZone = popup; // attach to the entire popup

  gestureZone.addEventListener('touchstart', function (event) {
    touchstartX = event.changedTouches[0].screenX;
  }, false);

  gestureZone.addEventListener('touchend', function (event) {
    touchendX = event.changedTouches[0].screenX;
    handleGesture();
  }, false);

  function handleGesture() {
    const delta = touchendX - touchstartX;
    const swipeThreshold = 50; // minimum px required for a swipe
    if (Math.abs(delta) > swipeThreshold) {
      if (delta < 0 && activeTab === "summary") {
        // Swipe left on summary tab: switch to shopping tab
        shoppingTab.click();
      } else if (delta > 0 && activeTab === "shopping") {
        // Swipe right on shopping tab: switch to summary tab
        summaryTab.click();
      }
    }
  }
}
/********************************************
 * (NEW) Build "Weekly Summary" HTML
 ********************************************/
function buildWeeklySummaryHTML(weekIdx) {
  // Retrieve the correct week object from your mealPlanData
  const mealPlanData = JSON.parse(localStorage.getItem("twelveWeekMealPlan") || "[]");
  const weekData = mealPlanData[weekIdx];
  if (!weekData || !weekData.days) {
    return "<div>No data for this week.</div>";
  }

  // We'll build one big HTML string for the entire week's summary
  let html = `
    <!-- The parent scroll container can have its own background if desired.
         But we'll handle that in the "weeklySummaryContent" style in showMealPrepModePopup. -->
    <div style="box-sizing: border-box;">
  `;

  weekData.days.forEach((dayItem) => {
    // dayItem.day = "1", "2", etc.
    // weekData.week might be "3" for "Week 3"
    const assignedDate = calculateDayDateString(weekData.week, dayItem.day);

    // Start a soft background box for this Day
    html += `
      <div
        style="
          background-color:#EDE7DB;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          margin-top: 16px;
          border: 1px solid #D8CFC0;
        "
      >
        <!-- Day Title -->
        <div class="day-title"
             style="font-weight: 700; margin-bottom: 4px; text-align: center; font-family: 'Poppins', sans-serif;">
          Day ${dayItem.day} - ${assignedDate}
        </div>
    `;

    // List possible meal categories in the user’s chosen order
    const possibleCategories = [
      { key: "Breakfast", emoji: "🥚 Breakfast:" },
      { key: "Lunch", emoji: "🥗 Lunch:" },
      { key: "Dinner", emoji: "🍽️ Dinner:" },
      { key: "Snack", emoji: "🍎 Snack:" }
    ];

    // For each category that actually exists for this day, show it
    possibleCategories.forEach(catObj => {
      const catKey = catObj.key;
      if (dayItem.meals && dayItem.meals[catKey]) {
        const meal = dayItem.meals[catKey];
        // Category label
        html += `
          <div class="meal-category" style="margin-top: 6px;">
            ${catObj.emoji}
          </div>
          <!-- Bold meal name, with some indent/spacing -->
          <div class="meal-name"
               style="margin-bottom: 8px; margin-left: 28px; font-family: 'Arial', sans-serif;">
            <strong>${meal.mealName}</strong>
          </div>
        `;
      }
    });

    // Close the day block
    html += `</div>`;
  });

  // Close the main container
  html += `</div>`;
  return html;
}

/********************************************
 *Build "Shopping List" HTML
 ********************************************/
function buildShoppingListHTML(weekIdx) {
  const weekData = mealPlanData[weekIdx];
  if (!weekData || !weekData.days) return "<div>No data for this week.</div>";

  // Categories mapping with keys for grouping
  const categoryMap = {
    protein: { title: "🥩 Protein", items: [] },
    carbs: { title: "🍚 Carbs / Grains", items: [] },
    vegetables: { title: "🥦 Vegetables", items: [] },
    fruits: { title: "🍎 Fruits", items: [] },
    dairy: { title: "🥛 Dairy & Alternatives", items: [] },
    pantry: { title: "🧂 Pantry / Spices", items: [] },
    misc: { title: "🧺 Miscellaneous", items: [] }
  };

  // Helper to capitalize words
  function capitalizeWords(str) {
    return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
  }

  // Merge logic: For each ingredient, sum quantity if it appears more than once.
  function addOrMergeIngredient(cat, ing) {
    const nameKey = ing.name.toLowerCase();
    const catObj = categoryMap[cat];
    if (!catObj) return;
    let existing = catObj.items.find(it => it.key === nameKey);
    if (!existing) {
      existing = {
        key: nameKey,
        displayName: ing.name,
        quantity: 0,
        unit: ing.unit || "",
        wholeItem: ing.wholeItem || false,
        singular: ing.singular || "",
        plural: ing.plural || ""
      };
      catObj.items.push(existing);
    }
    existing.quantity += (ing.quantity || 0);
  }

  // Loop through days, meals, and ingredients
  weekData.days.forEach(dayItem => {
    const mealsObj = dayItem.meals || {};
    Object.keys(mealsObj).forEach(catKey => {
      const meal = mealsObj[catKey];
      if (meal.ingredients && Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach(ing => {
          const ingCat = ing.category || "misc";
          addOrMergeIngredient(ingCat, ing);
        });
      }
    });
  });

  // Build the HTML string
  let html = "";

  Object.keys(categoryMap).forEach(cat => {
    const catData = categoryMap[cat];
    if (catData.items.length === 0) return; // skip empty category

    // Wrap each segment in its own styled box:
    html += `
    <div style="
      background-color: #EDE7DB;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      margin-top: 16px;
      border: 1px solid #D8CFC0;
    ">
      <div style="text-align: center; font-weight: bold; margin-bottom: 8px;">
        ${catData.title}
      </div>
  `;

    catData.items.forEach(itemObj => {
      const cName = capitalizeWords(itemObj.displayName || "Item");
      let displayLine = "";
      if (itemObj.wholeItem) {
        const q = Math.round(itemObj.quantity);
        if (q === 1 && itemObj.singular) {
          displayLine = `${q} ${capitalizeWords(itemObj.singular)}`;
        } else if (q > 1 && itemObj.plural) {
          displayLine = `${q} ${capitalizeWords(itemObj.plural)}`;
        } else {
          displayLine = `${q} ${cName}`;
        }
      } else {
        const q = Math.round(itemObj.quantity);
        if (itemObj.unit) {
          displayLine = `${cName}: ${q}${itemObj.unit}`;
        } else {
          displayLine = `${cName}: ${q}`;
        }
      }
      html += `<div style="margin-left: 15px;">- ${displayLine}</div>`;
    });
    html += `</div>`;
  });

  return html;
}

function hasNutritionData() {
  // Return true if there's at least 1 meal logged or 1 week completed, etc.
  // Simplest check: if user has completed any meal in localStorage
  // e.g., scan for a “_status=logged” or similar
  const keys = Object.keys(localStorage);
  return keys.some(k => k.endsWith("_status") && (localStorage.getItem(k) === "logged" || localStorage.getItem(k) === "swapped"));
}

document.addEventListener("DOMContentLoaded", function () {
  // *******************************
  // 1) Nutrition Progress Info Pop-up
  // *******************************
  const progressInfoIcon = document.getElementById("nutritionProgressInfoIcon");
  const progressInfoPopup = document.getElementById("nutritionProgressInfoPopup");

  if (progressInfoIcon && progressInfoPopup) {
    // Toggle the popup when the icon is clicked.
    progressInfoIcon.addEventListener("click", function (e) {
      e.stopPropagation();
      progressInfoPopup.classList.toggle("show");
    });

    // Hide the popup when clicking outside the icon and the popup.
    document.addEventListener("click", function (e) {
      if (!progressInfoIcon.contains(e.target) && !progressInfoPopup.contains(e.target)) {
        progressInfoPopup.classList.remove("show");
      }
    });
  }

  // *************************************
  // 2) Heatmap Cards Info Pop-up Handling
  // *************************************
  // This assumes that all the heatmap info icons in your dynamically created heatmap cards have IDs that begin with "heatmapInfoIconNut"
  // (for example: "heatmapInfoIconNut1", "heatmapInfoIconNut2", etc.)
  // Also assume you have a single popup element with the ID "heatmapInfoPopup" (with the same styling and content as in your Workout Tracker).
  const heatmapIcons = document.querySelectorAll('[id^="heatmapInfoIconNut"]');
  const heatmapPopup = document.getElementById("heatmapInfoPopup");

  if (heatmapIcons.length > 0 && heatmapPopup) {
    // Attach click listeners to each info icon.
    heatmapIcons.forEach(icon => {
      icon.addEventListener("click", function (e) {
        e.stopPropagation();
        // Show the popup (you can add a class "show" in your CSS to make it visible)
        heatmapPopup.classList.add("show");
      });
    });

    // Close the heatmap popup if the user clicks outside any of the icons or the popup.
    document.addEventListener("click", function (e) {
      let clickedOnAnyIcon = false;
      heatmapIcons.forEach(icon => {
        if (icon.contains(e.target)) {
          clickedOnAnyIcon = true;
        }
      });
      if (!clickedOnAnyIcon && !heatmapPopup.contains(e.target)) {
        heatmapPopup.classList.remove("show");
      }
    });
  }
});

function renderWeeklyRecap() {
  // Determine the active week.
  const activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
  if (activeWeek === 1) {
    // Week 1: no recap yet.
    const container = document.getElementById("nutritionWeeklyRecapCards");
    container.innerHTML = `
      <div class="recap-card">
        <p>It’s your first week. Keep logging meals, 
           and we’ll show your recap once Week 2 starts!</p>
      </div>`;
    document.getElementById("nutritionWeeklyRecapDots").innerHTML = "";
    return;
  }

  // Update the subheading using your HTML element id (here it's "weeklyRecapSubheading")
  const recapSubheading = document.getElementById("weeklyRecapSubheading");
  if (recapSubheading) {
    recapSubheading.textContent = `Your Week ${activeWeek - 1} Recap`;
  }

  // Use the locked recap data for the previous week
  const lastWeekNum = activeWeek - 1;
  const stats = getLockedNutritionRecap(lastWeekNum);

  // Render the recap cards as before.
  const recapWrapper = document.getElementById("nutritionWeeklyRecapCards");
  recapWrapper.innerHTML = "";

  // Card 1: Meal Completion
  let card1 = document.createElement("div");
  card1.classList.add("recap-card");
  card1.innerHTML = `
    <div class="recap-card-title">
      <span class="emoji-bg">🍽️</span> Meal Completion
    </div>
    <div class="recap-card-value">${stats.mealCompletion}</div>
  `;
  recapWrapper.appendChild(card1);

  // Card 2: Best Day
  let card2 = document.createElement("div");
  card2.classList.add("recap-card");
  card2.innerHTML = `
  <div class="recap-card-title">
    <span class="emoji-bg">🚀</span> Best Day
  </div>
  <div class="recap-card-value">${stats.bestDay || "N/A"}</div>
`;
  recapWrapper.appendChild(card2);


  // Card 3: Total Calories
  let card3 = document.createElement("div");
  card3.classList.add("recap-card");
  card3.innerHTML = `
    <div class="recap-card-title">
      <span class="emoji-bg">🔥</span> Total Calories
    </div>
    <div class="recap-card-value">${stats.totalCals} kcals</div>
  `;
  recapWrapper.appendChild(card3);

  // Card 4: Total Protein
  let card4 = document.createElement("div");
  card4.classList.add("recap-card");
  card4.innerHTML = `
    <div class="recap-card-title">
      <span class="emoji-bg">🍗</span> Total Protein
    </div>
    <div class="recap-card-value">${stats.totalProtein}g</div>
  `;
  recapWrapper.appendChild(card4);

  // Card 5: Total Carbs
  let card5 = document.createElement("div");
  card5.classList.add("recap-card");
  card5.innerHTML = `
    <div class="recap-card-title">
      <span class="emoji-bg">🍚</span> Total Carbs
    </div>
    <div class="recap-card-value">${stats.totalCarbs}g</div>
  `;
  recapWrapper.appendChild(card5);

  // Card 6: Total Fats
  let card6 = document.createElement("div");
  card6.classList.add("recap-card");
  card6.innerHTML = `
    <div class="recap-card-title">
      <span class="emoji-bg">🥑</span> Total Fats
    </div>
    <div class="recap-card-value">${stats.totalFats}g</div>
  `;
  recapWrapper.appendChild(card6);

  // Build dot indicators and initialize swipe navigation.
  buildRecapDots("nutritionWeeklyRecapCards", "nutritionWeeklyRecapDots");
  initNutritionSwipeableRecapCards();
  const improvements = gatherAreasForImprovementNutrition(stats);
  showImprovementsSection(improvements);
}

// Add this function to your NT script
function initNutritionSwipeableRecapCards() {
  const cardsContainer = document.getElementById("nutritionWeeklyRecapCards");
  const dotsContainer = document.getElementById("nutritionWeeklyRecapDots");
  if (!cardsContainer) return;

  let startX = 0;
  let currentIndex = 0;
  const cardElements = cardsContainer.querySelectorAll(".recap-card");
  const totalCards = cardElements.length;

  // Ensure the container starts at index 0.
  cardsContainer.style.transform = `translateX(0px)`;

  cardsContainer.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length > 0) {
      startX = e.touches[0].clientX;
    }
  });

  cardsContainer.addEventListener("touchend", (e) => {
    let endX = e.changedTouches[0].clientX;
    let diff = endX - startX;
    // Threshold
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        // Swiped left => next card
        currentIndex = (currentIndex + 1) % totalCards;
      } else {
        // Swiped right => previous card
        currentIndex = (currentIndex - 1 + totalCards) % totalCards;
      }
      let containerWidth = cardsContainer.clientWidth;
      cardsContainer.style.transform = `translateX(-${currentIndex * containerWidth}px)`;

      // Update dots
      dotsContainer.querySelectorAll(".recap-dot").forEach(d => d.classList.remove("active"));
      let dotArray = Array.from(dotsContainer.querySelectorAll(".recap-dot"));
      if (dotArray[currentIndex]) {
        dotArray[currentIndex].classList.add("active");
      }
    }
  });
}

function getNutritionWeekStats(weekNum) {
  // Ensure weekNum is treated as an integer.
  const weekNumber = parseInt(weekNum, 10);

  // Retrieve the meal plan data and find the week object.
  const mealPlanData = JSON.parse(localStorage.getItem("twelveWeekMealPlan") || "[]");
  const weekObj = mealPlanData.find(w => parseInt(w.week, 10) === weekNumber);
  if (!weekObj) {
    return {
      mealCompletion: "0/0",
      mealCompletionPct: 0,
      bestDay: "",
      totalCals: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0
    };
  }

  // Calculate the total number of meals in the week.
  let totalMeals = 0;
  weekObj.days.forEach(day => {
    totalMeals += Object.keys(day.meals || {}).length;
  });

  // Initialize counters for completed meals and macronutrients.
  let completedMeals = 0;
  let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;

  // For determining the best day (highest adherence).
  let bestDayAdherence = 0;
  let bestDayLabel = "";

  // Process each day in the week.
  weekObj.days.forEach(day => {
    let dayCals = 0, dayTargetCals = 0;
    let dayProtein = 0, dayTargetProtein = 0;
    let dayCarbs = 0, dayTargetCarbs = 0;
    let dayFats = 0, dayTargetFats = 0;

    // For each meal in the day.
    const dayMealKeys = Object.keys(day.meals || {});
    dayMealKeys.forEach((mealKey, idx) => {
      const mealStatusKey = `week${weekNumber}_day${day.day}_meal${idx + 1}_status`;
      const statusVal = localStorage.getItem(mealStatusKey) || "";
      if (statusVal === "logged" || statusVal === "swapped") {
        completedMeals++;
        // Retrieve actual logged values.
        const calsKey = `week${weekNumber}_day${day.day}_meal${idx + 1}_cals`;
        const protKey = `week${weekNumber}_day${day.day}_meal${idx + 1}_protein`;
        const carbKey = `week${weekNumber}_day${day.day}_meal${idx + 1}_carbs`;
        const fatKey = `week${weekNumber}_day${day.day}_meal${idx + 1}_fats`;
        dayCals += parseFloat(localStorage.getItem(calsKey) || "0");
        dayProtein += parseFloat(localStorage.getItem(protKey) || "0");
        dayCarbs += parseFloat(localStorage.getItem(carbKey) || "0");
        dayFats += parseFloat(localStorage.getItem(fatKey) || "0");
      }
      // Sum up the planned (target) macros from the meal plan.
      const planMeal = day.meals[mealKey];
      if (planMeal) {
        dayTargetCals += planMeal.calories || 0;
        dayTargetProtein += planMeal.protein || 0;
        dayTargetCarbs += planMeal.carbs || 0;
        dayTargetFats += planMeal.fats || 0;
      }
    });

    // Accumulate day totals.
    totalCals += dayCals;
    totalProtein += dayProtein;
    totalCarbs += dayCarbs;
    totalFats += dayFats;

    // Calculate day-level adherence to target calories.
    let adherence = 0;
    if (dayTargetCals > 0) {
      let ratio = dayCals / dayTargetCals;
      if (ratio > 1) ratio = 1 / ratio;
      adherence = ratio * 100;
    }

    // Update the best day if this day shows a higher adherence.
    if (adherence > bestDayAdherence) {
      bestDayAdherence = adherence;
      // Parse day.day in case it’s a string.
      const dayIndex = parseInt(day.day, 10);
      // Use your helper (calculateDayDateStringNoYear) to get a formatted day label.
      bestDayLabel = calculateDayDateStringNoYear(weekNum, dayIndex);
    }
  });

  const mealCompletion = `${completedMeals}/${totalMeals}`;
  const mealCompletionPct = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;

  return {
    mealCompletion,
    mealCompletionPct,
    bestDay: bestDayLabel,
    totalCals: Math.round(totalCals),
    totalProtein: Math.round(totalProtein),
    totalCarbs: Math.round(totalCarbs),
    totalFats: Math.round(totalFats)
  };
}


function buildRecapDots(cardsId, dotsId) {
  const cardsContainer = document.getElementById(cardsId);
  const dotsContainer = document.getElementById(dotsId);
  if (!cardsContainer || !dotsContainer) return;

  const cardCount = cardsContainer.querySelectorAll(".recap-card").length;
  dotsContainer.innerHTML = "";
  if (cardCount <= 1) return; // no dots needed if only 1 card

  for (let i = 0; i < cardCount; i++) {
    const dot = document.createElement("div");
    dot.classList.add("recap-dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
      const width = cardsContainer.clientWidth;
      cardsContainer.style.transform = `translateX(-${i * width}px)`;
      // update active dot
      dotsContainer.querySelectorAll(".recap-dot").forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
    });
    dotsContainer.appendChild(dot);
  }
}

function getLockedNutritionRecap(weekNumber) {
  const storageKey = `nutritionWeeklyRecapData_week${weekNumber}`;
  let storedData = localStorage.getItem(storageKey);
  if (storedData) {
    try {
      console.log(`[getLockedNutritionRecap] Using locked data for Week ${weekNumber}`);
      return JSON.parse(storedData);
    } catch (e) {
      console.warn("[getLockedNutritionRecap] Error parsing locked data; recalculating...");
    }
  }
  // No locked data exists—compute and then lock it.
  const stats = getNutritionWeekStats(weekNumber);
  localStorage.setItem(storageKey, JSON.stringify(stats));
  console.log(`[getLockedNutritionRecap] Locked data generated for Week ${weekNumber}`);
  return stats;
}

function gatherAreasForImprovementNutrition(stats) {
  // If no recap stats provided, try to get the locked recap from last week or use a fallback for Week 1.
  if (!stats || !stats.mealCompletion) {
    let activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
    if (activeWeek > 1) {
      let prevWeek = activeWeek - 1;
      stats = getLockedNutritionRecap(prevWeek);
    } else {
      stats = { mealCompletion: "0/1" };
    }
  }

  // Parse the meal completion percentage.
  let mealCompletionPct = 0;
  if (stats.mealCompletion) {
    const parts = stats.mealCompletion.split("/");
    if (parts.length === 2) {
      const completed = parseFloat(parts[0]) || 0;
      const total = parseFloat(parts[1]) || 1; // avoid division by zero
      mealCompletionPct = Math.round((completed / total) * 100);
    }
  }

  // Determine which week to display (use the previous week if activeWeek > 1)
  let activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
  let previousWeek = (activeWeek > 1) ? (activeWeek - 1) : 1;

  let improvements = [];
  // Only if mealCompletion is below 80% add an improvement suggestion.
  if (mealCompletionPct < 80) {
    improvements.push({
      type: "completionLow",
      label: '<span class="emoji-bgii">⚠️</span> Low Completion',
      value: mealCompletionPct + "%",
      weekNum: previousWeek
    });
  }
  return improvements;
}

function showImprovementsSection(improvements) {
  // Check if active week is 1.
  const activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
  if (activeWeek === 1) {
    // Do not show improvements – clear all related elements.
    const heading = document.getElementById("areasImprovementSubheading");
    const wrapper = document.getElementById("areasImprovementWrapper");
    const cardsInner = document.getElementById("areasImprovementCards");
    const dots = document.getElementById("areasImprovementDots");
    const noMsg = document.getElementById("areasNoImprovementMessage");
    if (heading) heading.style.display = "none";
    if (wrapper) wrapper.style.display = "none";
    if (cardsInner) cardsInner.innerHTML = "";
    if (dots) dots.innerHTML = "";
    if (noMsg) noMsg.style.display = "none";
    return;
  }

  // If not in Week 1, then render the improvements normally.
  if (!improvements || improvements.length === 0) {
    // Show positive "Keep going" message if no issues.
    const noMsg = document.getElementById("areasNoImprovementMessage");
    if (noMsg) {
      noMsg.textContent = "You’re doing great, keep up the fantastic work!";
      noMsg.style.display = "block";
    }
    // Also hide the improvements wrapper.
    const heading = document.getElementById("areasImprovementSubheading");
    const wrapper = document.getElementById("areasImprovementWrapper");
    if (heading) heading.style.display = "none";
    if (wrapper) wrapper.style.display = "none";
    return;
  }

  const heading = document.getElementById("areasImprovementSubheading");
  const wrapper = document.getElementById("areasImprovementWrapper");
  const cardsInner = document.getElementById("areasImprovementCards");
  const dots = document.getElementById("areasImprovementDots");
  const noMsg = document.getElementById("areasNoImprovementMessage");
  if (!heading || !wrapper || !cardsInner || !dots || !noMsg) return;

  noMsg.style.display = "none";
  heading.style.display = "block";
  wrapper.style.display = "block";
  cardsInner.innerHTML = "";
  dots.innerHTML = "";

  improvements.forEach((imp, i) => {
    const card = document.createElement("div");
    card.classList.add("recap-card", "improvement-card");
    card.innerHTML = `
      <div class="recap-card-title">
        ${imp.label}
      </div>
      <div class="recap-card-description">
        Your average completion for Week ${imp.weekNum} is ${imp.value}. Let’s aim for 80% this week!
      </div>
    `;
    cardsInner.appendChild(card);
  });

  // (Optional) Build swipe dots if you have multiple improvement cards.
}

function buildMacroDropdown() {
  const listEl = document.getElementById("macroBreakdownWeekList");
  listEl.innerHTML = "";

  // First item: Program to Date.
  const progItem = document.createElement("div");
  progItem.classList.add("analysis-exercise-item");
  progItem.textContent = "Program to Date";
  progItem.addEventListener("click", () => {
    document.getElementById("macroSelectedWeekLabel").textContent = "Program to Date";
    document.getElementById("macroDropdownContainer").classList.add("hidden");
    document.getElementById("macroDropdownChevron").style.transform = "rotate(0deg)";
    renderMacroBreakdownFor("Program to Date");
  });
  listEl.appendChild(progItem);

  // Then add each week up to the active week.
  const activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
  for (let w = 1; w <= activeWeek; w++) {
    const weekItem = document.createElement("div");
    weekItem.classList.add("analysis-exercise-item");
    weekItem.textContent = "Week " + w;
    weekItem.addEventListener("click", () => {
      document.getElementById("macroSelectedWeekLabel").textContent = "Week " + w;
      document.getElementById("macroDropdownContainer").classList.add("hidden");
      document.getElementById("macroDropdownChevron").style.transform = "rotate(0deg)";
      renderMacroBreakdownFor(w);
    });
    listEl.appendChild(weekItem);
  }
}

function showMacroBreakdownSection() {
  const container = document.getElementById("macroBreakdownContainer");
  if (!container) return;

  // Ensure the Macro Breakdown container is visible.
  container.style.display = "block";

  // Build the dropdown list.
  buildMacroDropdown();

  // Read the last selected option (defaulting to "Program to Date").
  let lastSelection = localStorage.getItem("macroBreakdownOption") || "Program to Date";
  // Display "Week X" if it’s a week number.
  const displayOption = (lastSelection === "Program to Date") ? lastSelection : "Week " + lastSelection;
  document.getElementById("macroSelectedWeekLabel").textContent = displayOption;

  // Render the breakdown for the last selection.
  renderMacroBreakdownFor(lastSelection);

  // Get dropdown header elements.
  const header = document.getElementById("macroDropdownHeader");
  const dropdown = document.getElementById("macroDropdownContainer");
  const chevron = document.getElementById("macroDropdownChevron");

  // Bind the header click event only once.
  if (!header.dataset.bound) {
    header.addEventListener("click", function (e) {
      // Prevent propagation so the global handler doesn't immediately close the dropdown.
      e.stopPropagation();
      if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        chevron.style.transform = "rotate(180deg)";
      } else {
        dropdown.classList.add("hidden");
        chevron.style.transform = "rotate(0deg)";
      }
    });
    header.dataset.bound = "true";
  }

  // Attach a global click handler if not already bound.
  if (!document.documentElement.dataset.globalDropdownBound) {
    document.addEventListener("click", function (e) {
      // If the click target is not inside the header or dropdown, close the dropdown.
      if (dropdown && !dropdown.contains(e.target) && e.target !== header) {
        dropdown.classList.add("hidden");
        chevron.style.transform = "rotate(0deg)";
      }
    });
    document.documentElement.dataset.globalDropdownBound = "true";
  }
}

function renderMacroBreakdownFor(selection) {
  let data;
  if (selection === "Program to Date") {
    data = computeMacroBreakdownProgramToDate();
  } else {
    // Assume selection is a week number.
    const weekNum = parseInt(selection, 10);
    const activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
    if (weekNum < activeWeek) {
      // Use frozen data for past weeks.
      data = getLockedMacroBreakdown(weekNum);
    } else {
      // Active week: compute live.
      data = computeMacroBreakdown(weekNum);
    }
  }

  // Draw the updated doughnut chart.
  drawMacroBreakdownChart(data);

  // Update Macro Match Score display.
  const score = computeMacroMatchScore(data);
  document.getElementById("macroMatchScoreDisplay").textContent = Math.round(score) + "% Accuracy";

  // Remember this selection for future visits.
  localStorage.setItem("macroBreakdownOption", selection);
}

// (NEW) Creates a styled dropdown in #macroBreakdownWeekSelector 
function buildMacroWeekDropdown(maxWeek) {
  const container = document.getElementById("macroBreakdownWeekSelector");
  if (!container) return;

  container.innerHTML = "";
  // Create the outer dropdown wrapper
  const ddWrapper = document.createElement("div");
  ddWrapper.classList.add("macro-dropdown-container");

  // The selected (clickable) heading
  const selectedEl = document.createElement("div");
  selectedEl.classList.add("macro-dropdown-selected");
  selectedEl.id = "macroDropdownSelected";
  selectedEl.textContent = `Select Week`;

  // Chevron
  const chevron = document.createElement("span");
  chevron.classList.add("macro-dropdown-chevron");
  chevron.textContent = ">";
  selectedEl.appendChild(chevron);

  // The list 
  const listEl = document.createElement("div");
  listEl.classList.add("macro-dropdown-list");
  listEl.id = "macroDropdownList";

  // If user completed 1..maxWeek
  if (maxWeek < 1) {
    // edge case
    const noWeeksEl = document.createElement("div");
    noWeeksEl.classList.add("macro-dropdown-no-weeks");
    noWeeksEl.textContent = "No completed weeks yet.";
    listEl.appendChild(noWeeksEl);
  } else {
    for (let w = 1; w <= maxWeek; w++) {
      const itemEl = document.createElement("div");
      itemEl.classList.add("macro-dropdown-item");
      itemEl.textContent = `Week ${w}`;
      itemEl.addEventListener("click", () => {
        // set the heading
        selectedEl.firstChild.textContent = `Week ${w}`; // firstChild is the text node
        // close the dropdown
        listEl.classList.remove("show");
        chevron.classList.remove("rotate");

        // Now call your existing macro breakdown logic
        renderMacroBreakdownFor(w);
      });
      listEl.appendChild(itemEl);
    }
    const ptdEl = document.createElement("div");
    ptdEl.classList.add("macro-dropdown-item");
    ptdEl.textContent = "Program to Date";
    ptdEl.addEventListener("click", () => {
      selectedEl.firstChild.textContent = "Program to Date";
      listEl.classList.remove("show");
      chevron.classList.remove("rotate");
      renderMacroBreakdownForWeek("program");
    });
    listEl.appendChild(ptdEl);
  }

  // Toggle on click
  selectedEl.addEventListener("click", () => {
    if (listEl.classList.contains("show")) {
      listEl.classList.remove("show");
      chevron.classList.remove("rotate");
    } else {
      listEl.classList.add("show");
      chevron.classList.add("rotate");
      renderMacroBreakdownFor("Program to Date");
    }
  });

  // Append
  ddWrapper.appendChild(selectedEl);
  ddWrapper.appendChild(listEl);
  container.appendChild(ddWrapper);
}

function computeMacroBreakdown(weekNum) {
  let planProtein = 0, planCarbs = 0, planFats = 0;
  let userProtein = 0, userCarbs = 0, userFats = 0;
  // example keys: week1_proteinWMCO => multiply by 7
  const pKey = `week${weekNum}_proteinWMCO`;
  const cKey = `week${weekNum}_carbsWMCO`;
  const fKey = `week${weekNum}_fatsWMCO`;

  planProtein = parseFloat(localStorage.getItem(pKey) || "0") * 7;
  planCarbs = parseFloat(localStorage.getItem(cKey) || "0") * 7;
  planFats = parseFloat(localStorage.getItem(fKey) || "0") * 7;

  // for user’s actual macros, re-sum the daily from meal logs:
  const mealPlanData = JSON.parse(localStorage.getItem("twelveWeekMealPlan") || "[]");
  const wObj = mealPlanData.find(w => w.week === weekNum);
  if (wObj) {
    wObj.days.forEach((day) => {
      const dayMealKeys = Object.keys(day.meals || {});
      dayMealKeys.forEach((mealKey, idx) => {
        let status = localStorage.getItem(`week${weekNum}_day${day.day}_meal${idx + 1}_status`) || "";
        if (status === "logged" || status === "swapped") {
          userProtein += parseFloat(localStorage.getItem(`week${weekNum}_day${day.day}_meal${idx + 1}_protein`) || "0");
          userCarbs += parseFloat(localStorage.getItem(`week${weekNum}_day${day.day}_meal${idx + 1}_carbs`) || "0");
          userFats += parseFloat(localStorage.getItem(`week${weekNum}_day${day.day}_meal${idx + 1}_fats`) || "0");
        }
      });
    });
  }

  return {
    planProtein, planCarbs, planFats,
    userProtein, userCarbs, userFats
  };
}

function computeMacroBreakdownProgramToDate() {
  // Get the current active week (defaulting to 1 if not set).
  let activeWeek = parseInt(localStorage.getItem("activeNutritionWeek"), 10) || 1;
  let totalPlanProtein = 0, totalPlanCarbs = 0, totalPlanFats = 0;
  let totalUserProtein = 0, totalUserCarbs = 0, totalUserFats = 0;

  // For weeks before the active week, use locked (frozen) values.
  for (let week = 1; week < activeWeek; week++) {
    let breakdown = getLockedMacroBreakdown(week);
    totalPlanProtein += breakdown.planProtein;
    totalPlanCarbs += breakdown.planCarbs;
    totalPlanFats += breakdown.planFats;
    totalUserProtein += breakdown.userProtein;
    totalUserCarbs += breakdown.userCarbs;
    totalUserFats += breakdown.userFats;
  }

  // For the active week, compute live.
  let activeBreakdown = computeMacroBreakdown(activeWeek);
  totalPlanProtein += activeBreakdown.planProtein;
  totalPlanCarbs += activeBreakdown.planCarbs;
  totalPlanFats += activeBreakdown.planFats;
  totalUserProtein += activeBreakdown.userProtein;
  totalUserCarbs += activeBreakdown.userCarbs;
  totalUserFats += activeBreakdown.userFats;

  return {
    planProtein: totalPlanProtein,
    planCarbs: totalPlanCarbs,
    planFats: totalPlanFats,
    userProtein: totalUserProtein,
    userCarbs: totalUserCarbs,
    userFats: totalUserFats
  };
}

function computeMacroMatchScore({ planProtein, planCarbs, planFats, userProtein, userCarbs, userFats }) {
  // Weighted approach e.g. 30/40/30 from your logic
  const totalPlan = planProtein + planCarbs + planFats;
  if (totalPlan <= 0) return 0;

  // Each macro’s “% of plan”
  let protPctHit = (userProtein / planProtein) * 100;
  if (protPctHit > 100) protPctHit = 100;
  let carbPctHit = (userCarbs / planCarbs) * 100;
  if (carbPctHit > 100) carbPctHit = 100;
  let fatPctHit = (userFats / planFats) * 100;
  if (fatPctHit > 100) fatPctHit = 100;

  // Weighted by 30%, 40%, 30%
  return (0.30 * protPctHit) + (0.40 * carbPctHit) + (0.30 * fatPctHit);
}

function drawMacroBreakdownChart({ 
  planProtein, planCarbs, planFats,
  userProtein, userCarbs, userFats}) {
  // 1) Compute "achieved" vs "remaining" for each macro.
  //    Achieved is the min of (userVal, planVal); Remainder is planVal - achieved.
  const protAchieved = Math.min(userProtein, planProtein);
  const protRemaining = planProtein - protAchieved;

  const carbAchieved = Math.min(userCarbs, planCarbs);
  const carbRemaining = planCarbs - carbAchieved;

  const fatAchieved = Math.min(userFats, planFats);
  const fatRemaining = planFats - fatAchieved;

  // 2) Build the two data arrays:
  //    Inner ring (index 0) => "Target Macros" => [planProtein, planCarbs, planFats]
  //    Outer ring (index 1) => "Actual Macros" => [protAchieved, protRemaining, carbAchieved, carbRemaining, fatAchieved, fatRemaining]
  const innerData = [planProtein, planCarbs, planFats];
  const outerData = [
    protAchieved, protRemaining,
    carbAchieved, carbRemaining,
    fatAchieved, fatRemaining
  ];

  // 3) Colors for macros
  const proteinColor = "#7ED6A2";   // greenish
  const carbColor    = "#5DADEC";   // bluish
  const fatColor     = "#FFC75F";   // yellowish
  const greyColor    = "#E0E0E0";

  // Outer ring uses pairs: Achieved color, then grey for remainder
  const outerColors = [
    proteinColor, greyColor,
    carbColor,    greyColor,
    fatColor,     greyColor
  ];

  // 4) Grab our chart canvas
  const ctx = document.getElementById("macroBreakdownChart");
  if (!ctx) return;
  const chartCtx = ctx.getContext("2d");

  // If you have a global variable for the chart instance, destroy it first:
  if (window.macroChartInstance) {
    window.macroChartInstance.destroy();
  }

  // 5) Create new Chart.js instance
  window.macroChartInstance = new Chart(chartCtx, {
    type: "doughnut",
    data: {
      // The "labels" array is used to identify the macro name [Protein, Carbs, Fats].
      // We'll re‑use these for the tooltip text:
      labels: ["Protein", "Carbs", "Fats"],
      datasets: [
        {
          label: "Target Macros",   // <— Inner ring
          data: innerData,
          backgroundColor: [proteinColor, carbColor, fatColor],
          borderWidth: 0,
          radius: "70%",       // smaller radius => sits inside
          cutout: "60%",       // thickness of the ring
          borderSkipped: false
        },
        {
          label: "Actual Macros",  // <— Outer ring
          data: outerData,
          backgroundColor: outerColors,
          borderWidth: 0,
          radius: "100%",      // extends out to full
          cutout: "85%",       // 15% thickness
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      rotation: 270,   // start at the top
      circumference: 360,
      plugins: {
        tooltip: {
          callbacks: {
            // Override the title callback to suppress the default title.
            title: function () {
              return '';
            },
            label: function (context) {
              const dsLabel = context.dataset.label || "";
              const index = context.dataIndex;
              if (dsLabel === "Target Macros") {
                const macroLabel = context.chart.data.labels[index] || "";
                return `${macroLabel} Target: ${context.parsed}g`;
              } else if (dsLabel === "Actual Macros") {
                const macroIndex = Math.floor(index / 2);
                const macroLabel = context.chart.data.labels[macroIndex] || "";
                if (index % 2 === 0) {
                  return `${macroLabel} Achieved: ${context.parsed}g`;
                } else {
                  return `${macroLabel} Remaining: ${context.parsed}g`;
                }
              }
              return `${context.parsed}g`;
            }
          }
        }
      }
    }
  });
}

function getLockedMacroBreakdown(weekNum) {
  const storageKey = `macroBreakdownData_week${weekNum}`;
  let storedData = localStorage.getItem(storageKey);
  if (storedData) {
    try {
      console.log(`[getLockedMacroBreakdown] Using locked data for Week ${weekNum}`);
      return JSON.parse(storedData);
    } catch (e) {
      console.warn("[getLockedMacroBreakdown] Error parsing locked data; recalculating...");
    }
  }
  // Compute and lock the data for future use.
  const data = computeMacroBreakdown(weekNum);
  localStorage.setItem(storageKey, JSON.stringify(data));
  console.log(`[getLockedMacroBreakdown] Locked data generated for Week ${weekNum}`);
  return data;
}

// START OF NUTRITION TRENDS CODE
function showNutritionTrendsSection() {
  // Insert a heading + container in your "myProgressOverview" if not already present:
  const trendsHeading = document.getElementById("nutritionTrendsHeading");
  const trendsSection = document.getElementById("nutritionTrendsSection");
  if (!trendsHeading || !trendsSection) return;

  // Show them (similar to how you do with Macro Breakdown).
  trendsHeading.style.display = "block";
  trendsSection.style.display = "block";

  // Re‑build the same dropdown list as the Macro Breakdown has:
  buildNutritionTrendsDropdown();

  // Read last selection from localStorage or default to "Program to Date":
  let lastSel = localStorage.getItem("nutritionTrendsOption") || "Program to Date";
  if (lastSel !== "Program to Date" && !lastSel.startsWith("Week ")) {
    // fallback
    lastSel = "Program to Date";
  }
  document.getElementById("nutritionTrendsSelectedWeekLabel").textContent = lastSel;

  // Render for that selection:
  renderNutritionTrendsFor(lastSel);

  // Link the header/click to toggle the dropdown, same as your Macro breakdown approach:
  const ddHeader = document.getElementById("nutritionTrendsDropdownHeader");
  const ddContainer = document.getElementById("nutritionTrendsDropdownContainer");
  const ddChevron = document.getElementById("nutritionTrendsDropdownChevron");
  if (!ddHeader || !ddContainer || !ddChevron) return;
  if (!ddHeader.dataset.bound) {
    ddHeader.addEventListener("click", (e) => {
      e.stopPropagation();
      if (ddContainer.classList.contains("hidden")) {
        ddContainer.classList.remove("hidden");
        ddChevron.style.transform = "rotate(180deg)";
      } else {
        ddContainer.classList.add("hidden");
        ddChevron.style.transform = "rotate(0deg)";
      }
    });
    ddHeader.dataset.bound = "true";
  }

  // global click to close
  if (!document.documentElement.dataset.nutTrendsDropdownBound) {
    document.addEventListener("click", (ev) => {
      if (!ddContainer.contains(ev.target) && ev.target !== ddHeader) {
        ddContainer.classList.add("hidden");
        ddChevron.style.transform = "rotate(0deg)";
      }
    });
    document.documentElement.dataset.nutTrendsDropdownBound = "true";
  }
}

/** Build the dropdown items: "Program to Date" + each week up to the active week. */
function buildNutritionTrendsDropdown() {
  const listEl = document.getElementById("nutritionTrendsWeekList");
  if (!listEl) return;
  listEl.innerHTML = "";

  // Always add “Program to Date”
  const progItem = document.createElement("div");
  progItem.classList.add("analysis-exercise-item");
  progItem.textContent = "Program to Date";
  progItem.addEventListener("click", () => {
    document.getElementById("nutritionTrendsSelectedWeekLabel").textContent = "Program to Date";
    document.getElementById("nutritionTrendsDropdownContainer").classList.add("hidden");
    document.getElementById("nutritionTrendsDropdownChevron").style.transform = "rotate(0deg)";
    renderNutritionTrendsFor("Program to Date");
  });
  listEl.appendChild(progItem);

  // Then each “Week 1.. up to active week”
  const activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
  for (let w = 1; w <= activeWeek; w++) {
    const wItem = document.createElement("div");
    wItem.classList.add("analysis-exercise-item");
    wItem.textContent = "Week " + w;
    wItem.addEventListener("click", () => {
      document.getElementById("nutritionTrendsSelectedWeekLabel").textContent = "Week " + w;
      document.getElementById("nutritionTrendsDropdownContainer").classList.add("hidden");
      document.getElementById("nutritionTrendsDropdownChevron").style.transform = "rotate(0deg)";
      renderNutritionTrendsFor(w);
    });
    listEl.appendChild(wItem);
  }
}

function renderNutritionTrendsFor(selection) {
  if (typeof selection === "number") {
    selection = "Week " + selection;
  }
  const container = document.getElementById("nutritionTrendsCards");
  const dots = document.getElementById("nutritionTrendsDots");
  if (!container || !dots) return;
  
  // Clear existing content and reset swipe position.
  container.innerHTML = "";
  dots.innerHTML = "";
  container.style.transform = "translateX(0px)";
  
  // Save the user's selection.
  localStorage.setItem("nutritionTrendsOption", selection);
  
  // 1) Build the “Calories Over Time” card.
  const calCard = document.createElement("div");
  calCard.classList.add("trend-card");
  calCard.innerHTML = `
    <div class="trend-card-title">Calories Over Time</div>
    <canvas id="caloriesOverTimeChart" style="width:100%; max-height:250px;"></canvas>
  `;
  container.appendChild(calCard);
  
  // 2) Build the “Protein Over Time” card.
  const protCard = document.createElement("div");
  protCard.classList.add("trend-card");
  protCard.innerHTML = `
    <div class="trend-card-title">Protein Over Time</div>
    <canvas id="proteinOverTimeChart" style="width:100%; max-height:250px;"></canvas>
  `;
  container.appendChild(protCard);
  
  // 3) Build the “Surplus/Deficit Tracker” card.
  const sdCard = document.createElement("div");
  sdCard.classList.add("trend-card");
  sdCard.innerHTML = `
    <div class="trend-card-title">Surplus/Deficit Tracker</div>
    <canvas id="surplusDeficitChart" style="width:100%; max-height:250px;"></canvas>
  `;
  container.appendChild(sdCard);
  
  // 4) Build Meal Logging Heatmap cards.
  buildMealLoggingHeatmapCards(selection, container);
  
  // Build dot indicators and initialize swipe navigation.
  initSwipeableNutritionTrendCards();
  
  // Compute data and draw charts.
  const { calData, protData, surplusData } = computeTrendsData(selection);
  drawCaloriesOverTimeChart(calData);
  drawProteinOverTimeChart(protData);
  drawSurplusDeficitChart(surplusData);
  
  // 5) Build the Areas for Improvement section.
  // Here the gatherAreasForImprovementNutrition function will automatically generate
  // a stats object if none is passed.
  const improvements = gatherAreasForImprovementNutrition();
  showImprovementsSection(improvements);
  
  // 6) Finally, build the Coach Insights card underneath the trend cards.
  buildNutritionCoachInsights(selection);
}


function computeTrendsData(selection) {
  let calData = [];
  let protData = [];
  let surplusData = [];

  // We'll use a helper to get the day-by-day.  Pseudocode:
  if (selection === "Program to Date") {
    const activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
    for (let w = 1; w <= activeWeek; w++) {
      let daily = gatherWeekDayData(w);
      daily.forEach(obj => {
        calData.push({
          date: obj.dateStr,
          calsConsumed: obj.calsConsumed,
          calsTarget: obj.calsTarget
        });
        protData.push({
          date: obj.dateStr,
          protConsumed: obj.protConsumed,
          protTarget: obj.protTarget
        });
        surplusData.push({
          date: obj.dateStr,
          difference: obj.calsConsumed - obj.calsTarget
        });
      });
    }
  } else {
    // e.g. selection === "Week 2"
    let wNum = parseInt(selection.replace("Week ", ""), 10);
    let daily = gatherWeekDayData(wNum);
    daily.forEach(obj => {
      calData.push({
        date: obj.dateStr,
        calsConsumed: obj.calsConsumed,
        calsTarget: obj.calsTarget
      });
      protData.push({
        date: obj.dateStr,
        protConsumed: obj.protConsumed,
        protTarget: obj.protTarget
      });
      surplusData.push({
        date: obj.dateStr,
        difference: obj.calsConsumed - obj.calsTarget
      });
    });
  }

  return { calData, protData, surplusData };
}

function gatherWeekDayData(weekNum) {
  const arr = [];
  const plan = JSON.parse(localStorage.getItem("twelveWeekMealPlan") || "[]");
  const wObj = plan.find(w => w.week === weekNum);
  if (!wObj) return arr;

  // Get target from localStorage: e.g. `week1_dailyCalsWMCO`, `week1_proteinWMCO`
  let calsTarget = parseInt(localStorage.getItem(`week${weekNum}_dailyCalsWMCO`) || "2000", 10);
  let protTarget = parseInt(localStorage.getItem(`week${weekNum}_proteinWMCO`) || "150", 10);

  wObj.days.forEach(dObj => {
    // dateStr
    let dateStr = calculateDayDateString(weekNum, dObj.day);

    // Sum consumed cals/prot
    let calsSum = 0;
    let protSum = 0;
    const mealKeys = Object.keys(dObj.meals || {});
    mealKeys.forEach((mk, i) => {
      const mealStatusKey = `week${weekNum}_day${dObj.day}_meal${i + 1}_status`;
      const st = localStorage.getItem(mealStatusKey) || "";
      if (st === "logged" || st === "swapped") {
        const cKey = `week${weekNum}_day${dObj.day}_meal${i + 1}_cals`;
        const pKey = `week${weekNum}_day${dObj.day}_meal${i + 1}_protein`;
        calsSum += parseFloat(localStorage.getItem(cKey) || "0");
        protSum += parseFloat(localStorage.getItem(pKey) || "0");
      }
    });

    arr.push({
      dateStr,
      calsConsumed: Math.round(calsSum),
      calsTarget: calsTarget,
      protConsumed: Math.round(protSum),
      protTarget: protTarget
    });
  });

  return arr;
}

/** drawCaloriesOverTimeChart(calData): draws a line chart in #caloriesOverTimeChart */
function drawCaloriesOverTimeChart(calData) {
  // If no data or chart canvas is missing, skip
  const canvasEl = document.getElementById("caloriesOverTimeChart");
  if (!canvasEl) return;

  // Extract x = date, y1 = cals consumed, y2 = cals target
  let labels = calData.map(d => d.date);
  let consumed = calData.map(d => d.calsConsumed);
  let target = calData.map(d => d.calsTarget);

  // Use Chart.js or any other approach:
  new Chart(canvasEl.getContext("2d"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Calories Consumed",
          data: consumed,
          fill: false,
          tension: 0
        },
        {
          label: "Calorie Target",
          data: target,
          fill: false,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: "Calories" }
        },
        x: {
          title: { display: true, text: "Date" }
        }
      }
    }
  });
}

/** drawProteinOverTimeChart(protData): line chart in #proteinOverTimeChart */
function drawProteinOverTimeChart(protData) {
  const canvasEl = document.getElementById("proteinOverTimeChart");
  if (!canvasEl) return;

  let labels = protData.map(d => d.date);
  let consumed = protData.map(d => d.protConsumed);
  let target = protData.map(d => d.protTarget);

  new Chart(canvasEl.getContext("2d"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Protein Consumed",
          data: consumed,
          fill: false
        },
        {
          label: "Protein Target",
          data: target,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: "Protein (g)" }
        },
        x: {
          title: { display: true, text: "Date" }
        }
      }
    }
  });
}

/** drawSurplusDeficitChart(surplusData): bar chart in #surplusDeficitChart */
function drawSurplusDeficitChart(surplusData) {
  const canvasEl = document.getElementById("surplusDeficitChart");
  if (!canvasEl) return;

  // Extract labels and differences from surplusData.
  let labels = surplusData.map(d => d.date);
  let diffs = surplusData.map(d => d.difference);

  // Define the consistency heatmap colors.
  const consistencyColors = {
    green: "#69c779",
    yellow: "#ffc107",
    red: "#ff7878"
  };

  // Use a rough target value (e.g., 2000) for demonstration and define thresholds.
  const target = 2000;
  const lower10 = 1800;
  const upper10 = 2200;
  const lower20 = 1600;
  const upper20 = 2400;

  // Compute the background color for each bar by comparing (target + diff) against thresholds.
  let backgroundColors = diffs.map(val => {
    let consumed = target + val;
    if (consumed >= lower10 && consumed <= upper10) {
      return consistencyColors.green;
    } else if ((consumed < lower10 && consumed >= lower20) || (consumed > upper10 && consumed <= upper20)) {
      return consistencyColors.yellow;
    } else {
      return consistencyColors.red;
    }
  });

  new Chart(canvasEl.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Calorie Difference (Consumed - Target)",
          data: diffs,
          backgroundColor: backgroundColors
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: "Day" }
        },
        y: {
          title: { display: true, text: "Surplus/Deficit (kcal)" },
          min: -2000,
          max: 2000
        }
      }
    }
  });
}


function buildMealLoggingHeatmapCards(selection, containerEl) {
  // We'll read from localStorage if the user purchased the 4 or 12 week program:
  let isFourWeek = (localStorage.getItem("fourWeekProgram") === "true");
  let totalWeeks = isFourWeek ? 4 : 12;
  let totalDaysInProgram = totalWeeks * 7; // e.g. 28 or 84

  if (selection.startsWith("Week ")) {
    // Single "Week X" - render 7 day cells in rows with 4 cells per row.
    let wNum = parseInt(selection.replace("Week ", ""), 10);
    const singleCard = document.createElement("div");
    singleCard.classList.add("trend-card");
    singleCard.innerHTML = `
      <div class="recap-card-title">
        Consistency Heatmap
        <span class="info-icon" id="heatmapInfoIconNut">i</span>
      </div>
      <div class="heatmap-container" style="margin-top:10px;"></div>
    `;
    containerEl.appendChild(singleCard);

    let ctn = singleCard.querySelector(".heatmap-container");
    let daysData = getDaysHeatmapForWeek(wNum);

    // Render the cells in rows of 4.
    for (let i = 0; i < daysData.length; i += 4) {
      let rowItems = daysData.slice(i, i + 4);
      let rowDiv = document.createElement("div");
      rowDiv.style.display = "flex";
      rowDiv.style.gap = "6px";
      rowItems.forEach(item => {
        let cell = document.createElement("div");
        cell.classList.add("heatmap-cell");
        cell.textContent = item.label;
        applyCellColor(cell, item.color);
        rowDiv.appendChild(cell);
      });
      ctn.appendChild(rowDiv);
    }
    return; // done
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

  // If “Program to Date,” we have to chunk all possible days so far
  // e.g. if totalWeeks=12 => up to 84 days 
  // but if the user is only on activeWeek=5, we might only have 35 days so far. 
  const activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
  const actualDaysSoFar = (activeWeek > totalWeeks ? totalWeeks : activeWeek) * 7;
  // We'll build an array of day objects, then chunk them 16 at a time.
  let bigArr = [];
  for (let w = 1; w <= (activeWeek > totalWeeks ? totalWeeks : activeWeek); w++) {
    let weekDays = getDaysHeatmapForWeek(w);
    bigArr = bigArr.concat(weekDays);
  }

  // Now chunk into groups of 16
  let chunkSize = 16;
  let offset = 0;
  let cardIndex = 0;
  while (offset < bigArr.length) {
    let chunk = bigArr.slice(offset, offset + chunkSize);
    offset += chunkSize;
    cardIndex++;

    const chunkCard = document.createElement("div");
    chunkCard.classList.add("trend-card");
    chunkCard.innerHTML = `
      <div class="recap-card-title">
        Consistency Heatmap
        <span class="info-icon info-icon-smaller" id="heatmapInfoIconNut${cardIndex}">i</span>
      </div>
      <div class="heatmap-container" style="margin-top:10px;"></div>
    `;
    containerEl.appendChild(chunkCard);

    const ctn = chunkCard.querySelector(".heatmap-container");
    // Render chunk in rows of 4 for a 4x4 grid:
    for (let i = 0; i < chunk.length; i += 4) {
      let rowItems = chunk.slice(i, i + 4);
      let rowDiv = document.createElement("div");
      rowDiv.style.display = "flex";
      rowDiv.style.gap = "6px";
      rowItems.forEach(it => {
        let cell = document.createElement("div");
        cell.classList.add("heatmap-cell");
        cell.textContent = it.label;
        applyCellColor(cell, it.color);
        rowDiv.appendChild(cell);
      });
      ctn.appendChild(rowDiv);
    }
  }
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

/** getDaysHeatmapForWeek(wNum) => returns array of 7 objects: { label, color } */
function getDaysHeatmapForWeek(wNum) {
  let arr = [];
  let plan = JSON.parse(localStorage.getItem("twelveWeekMealPlan") || "[]");
  let wObj = plan.find(w => w.week === wNum);
  if (!wObj || !wObj.days) return arr;

  wObj.days.forEach(dObj => {
    let dayLabel = `W${wNum} D${dObj.day}`;
    let color = "grey"; // default if future day
    // We check if it's a future day. Compare wNum to activeWeek:
    const activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
    if (wNum < activeWeek) {
      // Past or present week => check meal statuses
      let totalMeals = Object.keys(dObj.meals || {}).length;
      if (totalMeals === 0) {
        // No assigned meals? Then might be grey or something else
        color = "grey";
      } else {
        let mealsLogged = 0;
        let allLoggedButLoggedEarlier = false;
        let anyLoggedThisDay = false;
        Object.keys(dObj.meals || {}).forEach((mk, idx) => {
          let stKey = `week${wNum}_day${dObj.day}_meal${idx + 1}_status`;
          let stVal = localStorage.getItem(stKey) || "";
          if (stVal === "logged" || stVal === "swapped") {
            mealsLogged++;
            // we must check if they actually logged it on the correct day or a previous day => 
            // If your logic stores something like `loggedDate` for each meal, you'd check it. 
            // For simplicity, let's say we do not have that. We'll skip the "blue" logic or 
            // assume all logged on time => green if 100%. 
          }
        });

        if (mealsLogged === totalMeals) {
          color = "green";
        } else if (mealsLogged > 0) {
          color = "yellow";
        } else {
          color = "red";
        }
      }
    }
    else if (wNum === activeWeek) {
      // Current week => same logic, except if day is in the future?
      let now = new Date();
      let dayDate = new Date(calculateDayDateString(wNum, dObj.day));
      if (dayDate > now) {
        color = "grey";
      } else {
        // same partial logging logic 
        let totalMeals = Object.keys(dObj.meals || {}).length;
        let mealsLogged = 0;
        Object.keys(dObj.meals || {}).forEach((mk, idx) => {
          let stKey = `week${wNum}_day${dObj.day}_meal${idx + 1}_status`;
          let stVal = localStorage.getItem(stKey) || "";
          if (stVal === "logged" || stVal === "swapped") mealsLogged++;
        });

        if (mealsLogged === totalMeals) color = "green";
        else if (mealsLogged > 0) color = "yellow";
        else color = "red";
      }
    }
    // else => wNum>activeWeek => grey

    arr.push({ label: dayLabel, color: color });
  });
  return arr;
}

/** applyCellColor(cellDiv, color) => sets the background color & text as per your style */
function applyCellColor(cell, color) {
  if (color === "green") {
    cell.style.backgroundColor = "#69c779";
    cell.style.color = "#fff";
  } else if (color === "blue") {
    cell.style.backgroundColor = "#5A8DEE";
    cell.style.color = "#fff";
  } else if (color === "yellow") {
    cell.style.backgroundColor = "#ffc107";
    cell.style.color = "#fff";
  } else if (color === "red") {
    cell.style.backgroundColor = "#ff7878";
    cell.style.color = "#fff";
  } else {
    // grey
    cell.style.backgroundColor = "#bfbfbf";
    cell.style.color = "#000";
  }
}

/** Setup swipe logic for the trend cards container with “dots.” */
function initSwipeableNutritionTrendCards() {
  const cardsContainer = document.getElementById("nutritionTrendsCards");
  const dotsContainer = document.getElementById("nutritionTrendsDots");
  if (!cardsContainer || !dotsContainer) return;

  let cardCount = cardsContainer.querySelectorAll(".trend-card").length;
  if (cardCount <= 1) return; // no swipe needed if only 1

  // Build dot elements
  dotsContainer.innerHTML = "";
  for (let i = 0; i < cardCount; i++) {
    let dot = document.createElement("div");
    dot.classList.add("recap-dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
      let w = cardsContainer.clientWidth;
      cardsContainer.style.transform = `translateX(-${i * w}px)`;
      // update active dot
      dotsContainer.querySelectorAll(".recap-dot").forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
    });
    dotsContainer.appendChild(dot);
  }

  // Implement the typical “touchstart/touchend” approach:
  let startX = 0;
  let currentIndex = 0;
  cardsContainer.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) startX = e.touches[0].clientX;
  });
  cardsContainer.addEventListener("touchend", (e) => {
    let endX = e.changedTouches[0].clientX;
    let diff = endX - startX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        // left swipe => next
        currentIndex = (currentIndex + 1) % cardCount;
      } else {
        currentIndex = (currentIndex - 1 + cardCount) % cardCount;
      }
      let w = cardsContainer.clientWidth;
      cardsContainer.style.transform = `translateX(-${currentIndex * w}px)`;
      dotsContainer.querySelectorAll(".recap-dot").forEach(d => d.classList.remove("active"));
      let dotArr = [...dotsContainer.querySelectorAll(".recap-dot")];
      if (dotArr[currentIndex]) dotArr[currentIndex].classList.add("active");
    }
  });
}

function generateNutritionCoachInsight(selection) {
  // If the user has chosen "Program to Date", aggregate data from all completed weeks.
  if (selection === "Program to Date") {
    let activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
    if (activeWeek === 1) {
      return "Keep logging your meals. Once your first week is complete, you'll get insights on your progress!";
    }
    
    // Aggregate totals for weeks 1 to activeWeek-1
    let aggregate = {
      totalCals: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      daysCount: 0
    };
    for (let w = 1; w < activeWeek; w++) {
      let weekStats = getLockedNutritionRecap(w);
      if (weekStats) {
        aggregate.totalCals += weekStats.totalCals || 0;
        aggregate.totalProtein += weekStats.totalProtein || 0;
        aggregate.totalCarbs += weekStats.totalCarbs || 0;
        aggregate.totalFats += weekStats.totalFats || 0;
        aggregate.daysCount += 7; // assuming 7-day week
      }
    }
    let avgCals = aggregate.totalCals / aggregate.daysCount;
    let avgProtein = aggregate.totalProtein / aggregate.daysCount;
    let avgCarbs = aggregate.totalCarbs / aggregate.daysCount;
    let avgFats = aggregate.totalFats / aggregate.daysCount;
    // Use targets from the last completed week.
    let targetCals = parseInt(localStorage.getItem(`week${activeWeek - 1}_dailyCalsWMCO`) || "2000", 10);
    let targetProtein = parseInt(localStorage.getItem(`week${activeWeek - 1}_proteinWMCO`) || "150", 10);
    let targetCarbs = parseInt(localStorage.getItem(`week${activeWeek - 1}_carbsWMCO`) || "200", 10);
    let targetFats = parseInt(localStorage.getItem(`week${activeWeek - 1}_fatsWMCO`) || "70", 10);

    let messages = [];
    // Calorie insights:
    if (Math.abs(avgCals - targetCals) < 50) {
      messages.push(`Across your program so far, you nailed your calorie target with an average of ${Math.round(avgCals)} kcal/day—excellent consistency!`);
    }
    if (avgCals > (targetCals + 80) && avgCals < (targetCals + 200)) {
      messages.push(`You averaged ${Math.round(avgCals)} kcal/day—only ${Math.round(avgCals - targetCals)} kcal above target. A slight adjustment might help.`);
    }
    if (avgCals < (targetCals - 150)) {
      messages.push(`You're averaging ${Math.round(avgCals)} kcal/day, which is ${Math.round(targetCals - avgCals)} kcal below your target. Consider increasing your intake.`);
    }
    if (avgCals > (targetCals + 400)) {
      messages.push(`Your average calorie intake is ${Math.round(avgCals)} kcal/day—over ${Math.round(avgCals - targetCals)} kcal above target. Scaling back slightly might help.`);
    }
    // Protein insights:
    if (Math.abs(avgProtein - targetProtein) < 10) {
      messages.push(`Your protein intake is on point at an average of ${Math.round(avgProtein)}g/day.`);
    }
    if (avgProtein < (targetProtein - 15)) {
      messages.push(`Your protein average is ${Math.round(avgProtein)}g/day, below your target of ${targetProtein}g. Consider boosting protein.`);
    }
    // Fat insight:
    if (avgFats < 40) {
      messages.push(`Your average fat intake is only ${Math.round(avgFats)}g/day, which is lower than recommended. Adding healthy fats can help your recovery.`);
    }
    if (messages.length === 0) {
      messages.push("Your nutrition is tracking well with no major deviations—great job!");
    }
    return messages[Math.floor(Math.random() * messages.length)];
  }
  // If the user has selected a specific week (e.g., "Week 1", "Week 2", ...)
  else if (typeof selection === "string" && selection.startsWith("Week ")) {
    let selectedWeek = parseInt(selection.replace("Week ", ""), 10);
    // For Week 1: if active week is still 1, show default encouragement.
    // Once active week is 2 or above, use Week 1's data.
    if (selectedWeek === 1) {
      let activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
      if (activeWeek === 1) {
        return "Keep logging your meals. Once your first week is complete, you'll get insights on your progress!";
      } else {
        let stats = getLockedNutritionRecap(1);
        let avgCals = stats.totalCals / 7;
        let avgProtein = stats.totalProtein / 7;
        let avgCarbs = stats.totalCarbs / 7;
        let avgFats = stats.totalFats / 7;
        let targetCals = parseInt(localStorage.getItem(`week1_dailyCalsWMCO`) || "2000", 10);
        let targetProtein = parseInt(localStorage.getItem(`week1_proteinWMCO`) || "150", 10);
        let targetCarbs = parseInt(localStorage.getItem(`week1_carbsWMCO`) || "200", 10);
        let targetFats = parseInt(localStorage.getItem(`week1_fatsWMCO`) || "70", 10);
        let messages = [];
        if (Math.abs(avgCals - targetCals) < 50) {
          messages.push(`In Week 1, you hit your calorie target with an average of ${Math.round(avgCals)} kcal/day—excellent work!`);
        }
        if (avgCals > (targetCals + 80) && avgCals < (targetCals + 200)) {
          messages.push(`In Week 1, you averaged ${Math.round(avgCals)} kcal/day—only ${Math.round(avgCals - targetCals)} kcal above target.`);
        }
        if (avgCals < (targetCals - 150)) {
          messages.push(`In Week 1, your calorie intake averaged ${Math.round(avgCals)} kcal/day, which is ${Math.round(targetCals - avgCals)} kcal below target. Consider increasing your intake.`);
        }
        if (avgCals > (targetCals + 400)) {
          messages.push(`In Week 1, your calorie intake was ${Math.round(avgCals)} kcal/day—over ${Math.round(avgCals - targetCals)} kcal above target. You might consider scaling back.`);
        }
        if (Math.abs(avgProtein - targetProtein) < 10) {
          messages.push(`In Week 1, you achieved a great protein intake averaging ${Math.round(avgProtein)}g/day.`);
        }
        if (avgProtein < (targetProtein - 15)) {
          messages.push(`In Week 1, your protein was ${Math.round(avgProtein)}g/day, below the target of ${targetProtein}g.`);
        }
        if (avgFats < 40) {
          messages.push(`In Week 1, your fat intake was only ${Math.round(avgFats)}g/day—consider adding healthy fats for recovery.`);
        }
        if (messages.length === 0) {
          messages.push("Week 1 was solid—your nutrition targets were well met!");
        }
        return messages[Math.floor(Math.random() * messages.length)];
      }
    }
    // For weeks greater than 1, use that week's locked data.
    else if (selectedWeek > 1) {
      let stats = getLockedNutritionRecap(selectedWeek);
      let avgCals = stats.totalCals / 7;
      let avgProtein = stats.totalProtein / 7;
      let avgCarbs = stats.totalCarbs / 7;
      let avgFats = stats.totalFats / 7;
      let targetCals = parseInt(localStorage.getItem(`week${selectedWeek}_dailyCalsWMCO`) || "2000", 10);
      let targetProtein = parseInt(localStorage.getItem(`week${selectedWeek}_proteinWMCO`) || "150", 10);
      let targetCarbs = parseInt(localStorage.getItem(`week${selectedWeek}_carbsWMCO`) || "200", 10);
      let targetFats = parseInt(localStorage.getItem(`week${selectedWeek}_fatsWMCO`) || "70", 10);
      let messages = [];
      if (Math.abs(avgCals - targetCals) < 50) {
        messages.push(`In Week ${selectedWeek}, you hit your calorie target with an average of ${Math.round(avgCals)} kcal/day—excellent work!`);
      }
      if (avgCals > (targetCals + 80) && avgCals < (targetCals + 200)) {
        messages.push(`In Week ${selectedWeek}, you averaged ${Math.round(avgCals)} kcal/day—only ${Math.round(avgCals - targetCals)} kcal above target.`);
      }
      if (avgCals < (targetCals - 150)) {
        messages.push(`In Week ${selectedWeek}, your calorie intake averaged ${Math.round(avgCals)} kcal/day, which is ${Math.round(targetCals - avgCals)} kcal below target. Consider increasing your intake.`);
      }
      if (avgCals > (targetCals + 400)) {
        messages.push(`In Week ${selectedWeek}, your calorie intake was ${Math.round(avgCals)} kcal/day—over ${Math.round(avgCals - targetCals)} kcal above target. You might consider scaling back.`);
      }
      if (Math.abs(avgProtein - targetProtein) < 10) {
        messages.push(`In Week ${selectedWeek}, you achieved a great protein intake averaging ${Math.round(avgProtein)}g/day.`);
      }
      if (avgProtein < (targetProtein - 15)) {
        messages.push(`In Week ${selectedWeek}, your protein was ${Math.round(avgProtein)}g/day, below the target of ${targetProtein}g.`);
      }
      if (avgFats < 40) {
        messages.push(`In Week ${selectedWeek}, your fat intake was only ${Math.round(avgFats)}g/day—consider adding healthy fats for recovery.`);
      }
      if (messages.length === 0) {
        messages.push(`Week ${selectedWeek} was solid—your nutrition targets were well met!`);
      }
      return messages[Math.floor(Math.random() * messages.length)];
    }
    // Fallback: use the most recent completed week.
    else {
      let activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
      if (activeWeek === 1) {
        return "Keep logging your meals. Once your first week is complete, you'll get insights on your progress!";
      }
      let lastWeek = activeWeek - 1;
      let stats = getLockedNutritionRecap(lastWeek);
      let avgCals = stats.totalCals / 7;
      let avgProtein = stats.totalProtein / 7;
      let avgCarbs = stats.totalCarbs / 7;
      let avgFats = stats.totalFats / 7;
      let targetCals = parseInt(localStorage.getItem(`week${lastWeek}_dailyCalsWMCO`) || "2000", 10);
      let targetProtein = parseInt(localStorage.getItem(`week${lastWeek}_proteinWMCO`) || "150", 10);
      let targetCarbs = parseInt(localStorage.getItem(`week${lastWeek}_carbsWMCO`) || "200", 10);
      let targetFats = parseInt(localStorage.getItem(`week${lastWeek}_fatsWMCO`) || "70", 10);
      let messages = [];
      if (Math.abs(avgCals - targetCals) < 50) {
        messages.push(`Your calorie target was nailed last week with an average of ${Math.round(avgCals)} kcal/day!`);
      }
      if (avgCals > (targetCals + 80) && avgCals < (targetCals + 200)) {
        messages.push(`Last week, you averaged ${Math.round(avgCals)} kcal/day—only ${Math.round(avgCals - targetCals)} kcal above target.`);
      }
      if (avgCals < (targetCals - 150)) {
        messages.push(`Your calorie intake last week was ${Math.round(avgCals)} kcal/day, which is ${Math.round(targetCals - avgCals)} kcal below target. Consider increasing your intake.`);
      }
      if (avgCals > (targetCals + 400)) {
        messages.push(`Last week, your calorie intake was ${Math.round(avgCals)} kcal/day—over ${Math.round(avgCals - targetCals)} kcal above target.`);
      }
      if (Math.abs(avgProtein - targetProtein) < 10) {
        messages.push(`You hit your protein target last week, averaging ${Math.round(avgProtein)}g/day!`);
      }
      if (avgProtein < (targetProtein - 15)) {
        messages.push(`Your protein was below target last week, at an average of ${Math.round(avgProtein)}g/day.`);
      }
      if (avgFats < 40) {
        messages.push(`Your fat intake was only ${Math.round(avgFats)}g/day last week—consider adding healthy fats for recovery.`);
      }
      if (messages.length === 0) {
        messages.push("No major deviations from your nutrition targets last week—great job!");
      }
      return messages[Math.floor(Math.random() * messages.length)];
    }
  }
  // Default fallback: use the most recent completed week.
  else {
    let activeWeek = parseInt(localStorage.getItem("activeNutritionWeek") || "1", 10);
    if (activeWeek === 1) {
      return "Keep logging your meals. Once your first week is complete, you'll get insights on your progress!";
    }
    let lastWeek = activeWeek - 1;
    let stats = getLockedNutritionRecap(lastWeek);
    let avgCals = stats.totalCals / 7;
    let avgProtein = stats.totalProtein / 7;
    let avgCarbs = stats.totalCarbs / 7;
    let avgFats = stats.totalFats / 7;
    let targetCals = parseInt(localStorage.getItem(`week${lastWeek}_dailyCalsWMCO`) || "2000", 10);
    let targetProtein = parseInt(localStorage.getItem(`week${lastWeek}_proteinWMCO`) || "150", 10);
    let targetCarbs = parseInt(localStorage.getItem(`week${lastWeek}_carbsWMCO`) || "200", 10);
    let targetFats = parseInt(localStorage.getItem(`week${lastWeek}_fatsWMCO`) || "70", 10);
    let messages = [];
    if (Math.abs(avgCals - targetCals) < 50) {
      messages.push(`Your calorie target was nailed last week with an average of ${Math.round(avgCals)} kcal/day!`);
    }
    if (avgCals > (targetCals + 80) && avgCals < (targetCals + 200)) {
      messages.push(`Last week, you averaged ${Math.round(avgCals)} kcal/day—only ${Math.round(avgCals - targetCals)} kcal above target.`);
    }
    if (avgCals < (targetCals - 150)) {
      messages.push(`Your calorie intake last week was ${Math.round(avgCals)} kcal/day, which is ${Math.round(targetCals - avgCals)} kcal below target. Consider increasing your intake.`);
    }
    if (avgCals > (targetCals + 400)) {
      messages.push(`Last week, your calorie intake was ${Math.round(avgCals)} kcal/day—over ${Math.round(avgCals - targetCals)} kcal above target.`);
    }
    if (Math.abs(avgProtein - targetProtein) < 10) {
      messages.push(`You hit your protein target last week, averaging ${Math.round(avgProtein)}g/day!`);
    }
    if (avgProtein < (targetProtein - 15)) {
      messages.push(`Your protein was below target last week, at an average of ${Math.round(avgProtein)}g/day.`);
    }
    if (avgFats < 40) {
      messages.push(`Your fat intake was only ${Math.round(avgFats)}g/day last week—consider adding healthy fats for recovery.`);
    }
    if (messages.length === 0) {
      messages.push("No major deviations from your nutrition targets last week—great job!");
    }
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

function buildNutritionCoachInsights(selection) {
  // Find the container that will hold our Coach Insights card.
  const coachContainer = document.getElementById("nutritionCoachInsightsContainer");
  if (!coachContainer) {
    console.warn("nutritionCoachInsightsContainer not found in DOM.");
    return;
  }
  
  // Clear out any existing content.
  coachContainer.innerHTML = "";
  
  // Create the card element.
  const card = document.createElement("div");
  card.classList.add("coach-insights-note");
  
  // Create a heading for the card.
  const heading = document.createElement("h3");
  heading.textContent = "Coach Insights";
  card.appendChild(heading);
  
  // Generate the insight message using the selection.
  const insightMessage = generateNutritionCoachInsight(selection);
  
  // Create a paragraph element to display the insight.
  const messageEl = document.createElement("p");
  messageEl.innerHTML = insightMessage;
  card.appendChild(messageEl);
  
  // Append the insight card to the container.
  coachContainer.appendChild(card);
  
  // Optionally add a fade-in effect.
  setTimeout(() => {
    card.classList.add("visible");
  }, 50);
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
  const goalWeightInput        = document.getElementById("goalWeightInput");
  const goalByDateInput        = document.getElementById("goalByDateInput");
  const currentWeightInput     = document.getElementById("currentWeightInput");
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
    goalWeightInput.value       = displayGoal;
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
    currentWeightInput.value       = "";
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

////////////////////////////
// On Load / Init
////////////////////////////

// Use event delegation on a parent container that always exists
document.getElementById("nutritionTrendsWrapper").addEventListener("click", function(e) {
  // Check if the clicked element (or one of its parents) is an info icon.
  // Adjust the selector if needed (e.g., if you're using a specific class for your info icons).
  let infoIcon = e.target.closest(".info-icon");
  
  // Check if it's one of our heatmap info icons (IDs beginning with "heatmapInfoIconNut")
  if (infoIcon && infoIcon.id && infoIcon.id.indexOf("heatmapInfoIconNut") === 0) {
    // Prevent further propagation so that the global click doesn't immediately hide it
    e.stopPropagation();
    
    // Get the popup element
    const heatmapPopup = document.getElementById("heatmapInfoPopup");
    if (heatmapPopup) {
      // Show the popup by updating inline styles:
      heatmapPopup.style.opacity = "1";
      heatmapPopup.style.pointerEvents = "auto";
    }
  } else {
    // If the click is not on the icon (or its child) and not on the popup itself, hide the popup.
    const heatmapPopup = document.getElementById("heatmapInfoPopup");
    if (heatmapPopup && !heatmapPopup.contains(e.target)) {
      heatmapPopup.style.opacity = "0";
      heatmapPopup.style.pointerEvents = "none";
    }
  }
});

document.addEventListener("DOMContentLoaded", function() {
  // Select all heatmap info icons (whose id starts with 'heatmapInfoIconNut')
  const heatmapIcons = document.querySelectorAll('[id^="heatmapInfoIconNut"]');
  // Get the popup element – ensure it exists in your HTML.
  const heatmapPopup = document.getElementById("heatmapInfoPopup");
  
  if (heatmapPopup) {
    // Set the desired default inline styles on the popup.
    Object.assign(heatmapPopup.style, {
      position: "absolute",
      top: "calc(27% + 5px)", // positioned just below the icon with some gap
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0, 0, 0, 0.85)",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "4px",
      width: "90%",
      fontSize: "1.1rem",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
      opacity: "0",         // initially hidden
      pointerEvents: "none", // so that it doesn’t interfere with clicks
      transition: "opacity 0.3s ease",
      zIndex: "999"
    });
  }
  
  // Add click event to each heatmap info icon.
  heatmapIcons.forEach(icon => {
    icon.addEventListener("click", function(e) {
      e.stopPropagation(); // Prevent the event from bubbling so that the document click handler doesn't immediately hide the popup.
      if (heatmapPopup) {
        // Show the popup by setting opacity and pointer events.
        heatmapPopup.style.opacity = "1";
        heatmapPopup.style.pointerEvents = "auto";
      }
    });
  });
  
  // Hide the popup when clicking outside of any info icon or the popup itself.
  document.addEventListener("click", function(e) {
    let clickedOnIcon = false;
    heatmapIcons.forEach(icon => {
      if (icon.contains(e.target)) {
        clickedOnIcon = true;
      }
    });
    if (heatmapPopup && !clickedOnIcon && !heatmapPopup.contains(e.target)) {
      heatmapPopup.style.opacity = "0";
      heatmapPopup.style.pointerEvents = "none";
    }
  });
});

window.addEventListener("load", () => {
  // Retrieve the user's name (with a default)
  const userName = localStorage.getItem("name") || "User";
  // Check if the user has visited before
  const hasVisitedNutrition = localStorage.getItem("hasVisitedNutritionTracker") === "true";
  const welcomeHeading = document.getElementById("welcome-heading");

  // Helper function to determine if today is the user's birthday
  function isBirthday() {
    const dobStr = localStorage.getItem("dob"); // e.g. "1999-11-11"
    if (!dobStr) return false; // no DOB found in storage
    const dobDate = new Date(dobStr);
    const today = new Date();
    return dobDate.getMonth() === today.getMonth() && dobDate.getDate() === today.getDate();
  }

  // Update the greeting based on birthday or visit history
  if (isBirthday()) {
    welcomeHeading.textContent = `Happy Birthday, ${userName}!`;
  } else if (!hasVisitedNutrition) {
    welcomeHeading.textContent = `Welcome, ${userName}!`;
    localStorage.setItem("hasVisitedNutritionTracker", "true");
  } else {
    welcomeHeading.textContent = `Welcome back, ${userName}!`;
  }

  // Restore last selected tab
  const lastTab = localStorage.getItem("lastSelectedNutritionTab") || "myNutrition";
  if (lastTab === "myProgress") {
    const myProgressTab = document.getElementById("myProgressTab");
    if (myProgressTab) {
      myProgressTab.click();
    }
  } else {
    const myNutritionTab = document.getElementById("myNutritionTab");
    if (myNutritionTab) {
      myNutritionTab.click();
    }
  }

  // Restore scroll position
  const savedScrollPosition = localStorage.getItem("scrollPosition");
  if (savedScrollPosition) {
    window.scrollTo(0, parseInt(savedScrollPosition, 10));
  }

  // Save scroll position before unload
  window.addEventListener("beforeunload", () => {
    localStorage.setItem("scrollPosition", window.pageYOffset.toString());
  });

  const activeWeek = updateActiveWeek();
  console.log(`Nutrition Tracker active week: ${activeWeek}`);

  // Initialize XP bar, streak display, selectors, daily display, etc.
  updateLevelLabel(currentLevel);
  let xpNeeded = xpNeededForLevel(currentLevel);
  let percent = Math.min((currentXP / xpNeeded) * 100, 100);
  const xpBarFill = document.getElementById("xpBarFill");
  xpBarFill.style.width = percent + "%";
  const stickyBarFill = document.getElementById("stickyXpBarFill");
  if (stickyBarFill) stickyBarFill.style.width = percent + "%";

  updateNutritionStreakDisplay();
  renderWeekSelector();
  renderDaySelector();
  renderDailyMealDisplay();
  addTrackerBadge();
});

/* ────────────────────────────────────────────────────────────────
   SECTION 103 · Workout‑Tracker Onboarding
──────────────────────────────────────────────────────────────── */

(function() {
  // helper to read localStorage
  function ls(key) {
    const v = localStorage.getItem(key);
    return v === null ? undefined : v;
  }

  // user data
  const name           = ls('name') || 'User';
  const goalRaw        = ls('goal') || '';
  const goalDriver     = ls('goalDriver');
  const userGoalWeight = parseFloat(ls('userGoalWeight'));
  const weight         = parseFloat(ls('weight'));
  const goal           = goalRaw.toLowerCase().trim();

  // build goal line with nutrition framing
  let goalLines = '';
  if (goal.includes('lose weight')) {
    if (!isNaN(weight) && !isNaN(userGoalWeight) && weight > userGoalWeight) {
      goalLines = `<span class="nt-emoji-goal">🔥</span>
        Your goal is to lose ${(weight - userGoalWeight).toFixed(1)}kg — and nutrition will drive that change.`;
    } else {
      goalLines = `<span class="nt-emoji-goal">🔥</span>
        You’re here to lose weight — and nutrition will drive that change.`;
    }
  } else if (goal.includes('gain muscle')) {
    if (!isNaN(weight) && !isNaN(userGoalWeight) && userGoalWeight > weight) {
      goalLines = `<span class="nt-emoji-goal">💪</span>
        You’re aiming to gain ${(userGoalWeight - weight).toFixed(1)}kg of muscle — fueled by nutrition.`;
    } else {
      goalLines = `<span class="nt-emoji-goal">💪</span>
        You’re here to build strength and gain muscle — nutrition will make it possible.`;
    }
  } else if (goal.includes('improve body composition')) {
    if (!isNaN(weight) && !isNaN(userGoalWeight) && Math.abs(userGoalWeight - weight) < 3) {
      goalLines = `<span class="nt-emoji-goal">🔥</span>
        You’re focused on getting leaner and stronger — nutrition will guide you there.`;
    } else if (!isNaN(userGoalWeight)) {
      goalLines = `<span class="nt-emoji-goal">🔥</span>
        Your goal weight is ${userGoalWeight}kg — nutrition will move you toward it.`;
    } else {
      goalLines = `<span class="nt-emoji-goal">🔥</span>
        You’re focused on getting leaner and stronger — nutrition will guide you there.`;
    }
  }

  // driver messages
  const driverLines = {
    "A wedding or special event":
      `<span class="nt-emoji-goal">💍</span> Let’s help you feel incredible on the big day.`,
    "An upcoming holiday":
      `<span class="nt-emoji-goal">✈️</span> We’ll help you feel confident stepping off that plane — and even better in your photos.`,
    "A recent breakup or life change":
      `<span class="nt-emoji-goal">🚀</span> This is a powerful reset — and we’re with you every step of the way.`,
    "I want to feel confident in my body again":
      `<span class="nt-emoji-goal">🚀</span> Let’s rebuild that confidence, one meal at a time.`,
    "I'm tired of feeling tired or unmotivated":
      `<span class="nt-emoji-goal">🚀</span> We’ll help you take back your energy and momentum.`,
    "I’m doing this for my mental and emotional health":
      `<span class="nt-emoji-goal">🚀</span> Strong body, strong mind — this is for all of you.`,
    "I’ve let things slip and want to get back on track":
      `<span class="nt-emoji-goal">🚀</span> No judgment. Just forward progress from here on out.`,
    "I want to build discipline and stop starting over":
      `<span class="nt-emoji-goal">🚀</span> Consistency starts now — and this time, it’s different.`,
    "I just feel ready for a change":
      `<span class="nt-emoji-goal">🌱</span> New chapter unlocked. Let’s make it your strongest yet.`
  };

  // tutorial steps (screen 2)
  const tutorialSteps   = [
    `<strong>Meals are matched to your macros</strong> — swap if needed.`,
    `<strong>Log, skip, or view full details</strong> — including ingredients and recipes.`,
    `<strong>Earn XP with every meal</strong> — and build your progress streak.`
  ]
  const tutorialEmoji   = [`✅`,`🔄`,`⭐`];
  const encouragement   = `You’ll get the hang of it in no time — just stay consistent and keep showing up.`;

  // motivation (screen 3)
  const motivationTitle    = `🔥 Consistency beats perfection — every meal is a chance to build momentum.`;
  const motivationSubtitle = `Your results are built one meal at a time. Start strong, stay steady.`;

  // bail if already seen
  const overlay = document.getElementById('ntOnboardingOverlay');
  if (!overlay || localStorage.getItem('nt_onboarding_complete')) return;

  const slider   = overlay.querySelector('.nt-onboarding-slider');
  const dotsWrap = document.getElementById('ntOnboardingDots');
  const cards    = [...slider.children];
  let   index    = 0;
  slider.style.width = `${cards.length * 100}%`;

  // fill Screen 1
  cards[0].querySelector('.nt-title').innerHTML  = `🎯 Let’s get started, ${name}!`;
  cards[0].querySelector('.nt-goal').innerHTML   = goalLines;
  cards[0].querySelector('.nt-driver').innerHTML = driverLines[goalDriver] || '';

  // fill Screen 2
  const list = cards[1].querySelector('.nt-tutorial');
  list.innerHTML = '';
  tutorialSteps.forEach((text,i) => {
    const li = document.createElement('li');
    li.className = 'nt-line';
    li.innerHTML = `<span class="nt-emoji-tutorial">${tutorialEmoji[i]}</span> ${text}`;
    list.appendChild(li);
  });
  cards[1].querySelector('.nt-sub').textContent = encouragement;

  // fill Screen 3
  cards[2].querySelector('.nt-title').innerHTML    = motivationTitle;
  cards[2].querySelector('.nt-subtitle').innerHTML = motivationSubtitle;

  // build pagination dots
  cards.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'nt-dot' + (i===0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });

  // slide/swipe logic
  function goToSlide(n) {
    index = Math.max(0, Math.min(cards.length - 1, n));
    slider.style.transform = `translateX(${-index*(100/cards.length)}%)`;
    dotsWrap.querySelectorAll('.nt-dot')
           .forEach((d,i) => d.classList.toggle('active', i===index));
    revealLines(cards[index]);
  }
  function nextSlide() { goToSlide(index+1); }

  let startX = null;
  overlay.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  overlay.addEventListener('touchend',   e => {
    if (startX===null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx)>60) dx<0 ? nextSlide() : goToSlide(index-1);
    startX = null;
  });

  function revealLines(card) {
    if (card.dataset.revealed) {
      card.querySelectorAll('.nt-line').forEach(l => l.classList.add('show'));
      return;
    }
    card.dataset.revealed = 'true';
    card.querySelectorAll('.nt-line')
        .forEach((el,i) => setTimeout(() => el.classList.add('show'), 300*i));
  }

  // button handlers
  overlay.addEventListener('click', e => {
    if (e.target.matches('.nt-next-btn')) nextSlide();
    if (e.target.matches('.nt-close-btn')) {
      localStorage.setItem('nt_onboarding_complete','1');
      overlay.classList.add('closing');
      overlay.addEventListener('transitionend', ()=>overlay.remove(), { once:true });
    }
  });

  // show onboarding
  overlay.classList.add('open');
  goToSlide(0);
})();

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