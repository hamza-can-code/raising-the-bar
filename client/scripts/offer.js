// client/scripts/offer.js

function setLoaderScale(rawPct = 0) {
  /* ease + small overshoot */
  const eased = rawPct < 1
    ? 0.8 + 0.6 * rawPct                // grows 0.8 → 1.4
    : 1.4 - 0.4 * Math.min((rawPct - 1) * 6, 1);
  document.documentElement.style.setProperty('--scale', eased.toFixed(3));
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
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}
window.RTB_PRICE_TABLE = {
  GBP: { full: 21.99, intro: 9.99 },
  USD: { full: 23.99, intro: 9.99 },
  EUR: { full: 22.99, intro: 9.99 },
  SEK: { full: 259, intro: 129 },
  NOK: { full: 399, intro: 0 },
  DKK: { full: 449, intro: 0 },
  CHF: { full: 34.99, intro: 0 },
  AUD: { full: 94.99, intro: 0 },
  NZD: { full: 59.99, intro: 0 },
  CAD: { full: 31.99, intro: 15.99 },
  SGD: { full: 84.99, intro: 0 },
  HKD: { full: 499, intro: 0 },
  JPY: { full: 7900, intro: 0 },
  INR: { full: 3999, intro: 0 },
  BRL: { full: 259.99, intro: 0 },
  MXN: { full: 1199, intro: 0 },
};

const FLAGSHIP_PLAN_DAYS = 12 * 7;

function getCurrency() {
  return window.RTB_CURRENCY || { code: 'GBP', symbol: '£', minor: 2, country: 'GB' };
}
function pickLocaleForCurrency(code, country) {
  const map = {
    GBP: 'en-GB',
    USD: 'en-US',
    EUR: 'de-DE',   // choose one; change to 'fr-FR', 'en-IE', etc if you prefer
    SEK: 'sv-SE',
    NOK: 'nb-NO',
    DKK: 'da-DK',
    CHF: 'de-CH',
    AUD: 'en-AU',
    NZD: 'en-NZ',
    CAD: 'en-CA',
    SGD: 'en-SG',
    HKD: 'zh-HK',
    JPY: 'ja-JP',
    INR: 'en-IN',
    BRL: 'pt-BR',
    MXN: 'es-MX',
  };
  // fallbacks: use currency map, else country, else browser
  return map[code] || (country ? `en-${country}` : (navigator.language || 'en-GB'));
}

function fmt(code, amount) {
  const { country } = getCurrency();
  const locale = pickLocaleForCurrency(code, country);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    currencyDisplay: 'narrowSymbol' // => $, kr, €, etc (no “USD/SEK”)
  }).format(amount);
}
function getLocalPrices() {
  const code = getCurrency().code;
  return { code, ...((window.RTB_PRICE_TABLE && window.RTB_PRICE_TABLE[code]) || window.RTB_PRICE_TABLE.GBP) };
}
function toLocal(amountGbp) {
  const c = getCurrency();
  return amountGbp * (c.fxFromGBP || 1);
}
function formatLocal(amountGbp) {
  const c = getCurrency();                 // { code, minor, country, … }
  const v = toLocal(amountGbp);
  const locale = pickLocaleForCurrency(c.code, c.country);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: c.code,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: c.minor,
    maximumFractionDigits: c.minor
  }).format(v);
}
function localizeProTrackerCard() {
  const dealOn = document.body.classList.contains('discount-active');
  const card = document.querySelector('.offer-card[data-program="new"]');
  if (!card) return;

  const fullEl = document.getElementById('priceSpecialFull');
  const discEl = document.getElementById('priceSpecialDiscount');
  const ccyTag = card.querySelector('.currency-tag');
  const perDayEl = document.getElementById('costPerDaySpecial');

  const { code, full, intro } = getLocalPrices();

  if (fullEl) fullEl.textContent = fmt(code, full);
  if (discEl) discEl.textContent = dealOn ? fmt(code, intro) : '';
  if (ccyTag) ccyTag.textContent = code;

  const shown = dealOn ? intro : full;
  if (perDayEl) perDayEl.textContent = fmt(code, shown / FLAGSHIP_PLAN_DAYS);

  // keep a human-readable cache for summaries
  localStorage.setItem('planPrice', dealOn ? fmt(code, intro) : fmt(code, full));
  localStorage.setItem('planPriceFull', fmt(code, full));
}

document.addEventListener('DOMContentLoaded', () => {
  const { code, full } = getLocalPrices();
  document.querySelectorAll('.renew-amt').forEach(el => {
    el.textContent = fmt(code, full);
  });
});

const userId = localStorage.getItem('userId');

// Clear the "startedForm" flag on successful form completion
localStorage.removeItem('startedForm');

async function simulatePurchase(purchaseType) {
  const res = await fetch('/api/update-purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, purchaseType })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Purchase failed');
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const fullName = localStorage.getItem("name") || "";
  // …then split on spaces and take the first chunk
  const name = fullName.split(" ")[0] || "";
  const dob = localStorage.getItem("dob");
  const age = localStorage.getItem("age");
  const gender = localStorage.getItem("gender");
  const height = localStorage.getItem("height");
  const weight = localStorage.getItem("weight");
  const activityLevel = localStorage.getItem("activityLevel");
  const userBMI = localStorage.getItem("userBMI");
  const bmiCategory = localStorage.getItem("bmiCategory");
  const maintenanceCalories = localStorage.getItem("maintenanceCalories");
  const goalBasedProjections = JSON.parse(localStorage.getItem("goalBasedProjections"));
  const goalCalories = JSON.parse(localStorage.getItem("goalCalories"));
  const selectedCalories = localStorage.getItem("selectedCalories");
  const effortLevel = localStorage.getItem("effortLevel");
  const sessionDuration = localStorage.getItem("sessionDuration");
  const fitnessLevel = localStorage.getItem("fitnessLevel");
  const workoutLocation = localStorage.getItem("workoutLocation");
  const workoutFrequency = localStorage.getItem("workoutDays");
  let userGoal = localStorage.getItem("goal");

  const bodyTypeImgMap = {
    slim: 'slim.webp',
    average: 'average.webp',
    heavy: 'heavy.webp',
    athlete: 'athlete.webp',
    hero: 'hero.webp',
    bodybuilder: 'muscular-silhouette.webp'
  };
  // Return an absolute/relative path to your assets folder:
  const imgSrc = (file) => `../assets/${file}`;

  // Retrieve all offers
  const oneWeekProgram = JSON.parse(localStorage.getItem("oneWeekProgram"));
  const fourWeekProgram = JSON.parse(localStorage.getItem("fourWeekProgram"));
  const twelveWeekProgram = JSON.parse(localStorage.getItem("twelveWeekProgram"));

  // Normalize the user goal by trimming and checking for expected values
  userGoal = userGoal ? userGoal.trim().toLowerCase() : ""; // Trim and normalize

  // Debugging logs
  // console.log("Name:", name);
  // console.log("Date of Birth:", dob);
  // console.log("Age:", age);
  // console.log("Gender:", gender);
  // console.log("Height:", height);
  // console.log("Weight:", weight);
  // console.log("Activity Level:", activityLevel);
  // console.log("BMI Value:", userBMI);
  // console.log("BMI Category:", bmiCategory);
  // console.log("Maintenance Calories", maintenanceCalories);
  // console.log("Goal-Based Projections Data:", goalBasedProjections);
  // console.log("Goal Calories:", goalCalories);
  // console.log("Selected Calories:", selectedCalories);
  // console.log("Effort Level:", effortLevel);
  // console.log("session Duration:", sessionDuration);
  // console.log("Fitness Level:", fitnessLevel);
  // console.log("Workout Location:", workoutLocation);
  // console.log("Workout Frequency:", workoutFrequency);
  // console.log("1-week program:", oneWeekProgram);
  // console.log("4-week program:", fourWeekProgram);
  // console.log("12-week program:", twelveWeekProgram);

  (function renderBodyTypeProgress() {
    const wrap = document.getElementById('bodyTypeProgress');
    if (!wrap) return;                                    // safety

    const currentKey = (localStorage.getItem('BodyType') || '').toLowerCase();
    const targetKey = (localStorage.getItem('desiredBodyType') || '').toLowerCase();
    const targetDateSt = localStorage.getItem('userGoalDate');   // yyyy‑mm‑dd

    // Fallbacks if data missing
    if (!bodyTypeImgMap[currentKey] || !bodyTypeImgMap[targetKey]) {
      wrap.style.display = 'none';
      return;
    }

    // Set images
    document.getElementById('btpCurrentImg').src = imgSrc(bodyTypeImgMap[currentKey]);
    document.getElementById('btpTargetImg').src = imgSrc(bodyTypeImgMap[targetKey]);

    // Days remaining
    const daysEl = document.getElementById('btpDays');

    let days = 30;                                   // default backup
    if (targetDateSt) {
      const today = new Date();
      const target = new Date(targetDateSt);
      const msInDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.ceil((target - today) / msInDay);
      if (diffDays > 0) days = diffDays;
    }
    daysEl.textContent = `${days} Days`;
    document.getElementById('goalPeriod').textContent = daysEl.textContent;
  })();

  // Set default goal if missing or invalid
  if (!userGoal || !["lose weight", "gain muscle", "improve body composition"].includes(userGoal)) {
    // console.warn("User Goal is missing or invalid. Defaulting to 'improve body composition'.");
    userGoal = "improve body composition";
    localStorage.setItem("goal", userGoal); // Save the default goal
  }

  // console.log("User Goal retrieved:", userGoal);

  function kgToLbs(kg) {
    return kg * 2.20462;
  }

  // Log maintenance calories for body composition goal
  if (userGoal === "improve body composition") {
    const maintenanceCalories = localStorage.getItem("maintenanceCalories");
    if (maintenanceCalories) {
      // console.log("Maintenance Calories for Body Composition:", maintenanceCalories);
    } else {
      // console.warn("Maintenance calories not found in localStorage.");
    }
  }

  // Handle missing critical data
  if (!name || !bmiCategory) {
    // console.warn("Missing data for the dynamic message. Ensure all necessary information is saved.");
    const dynamicMessageContainer = document.getElementById("dynamicMessageContainer");
    if (dynamicMessageContainer) {
      dynamicMessageContainer.innerHTML = `
        <p><b>${name || "User"}</b>, we’ve created a personalized program for you. Let’s get started!</p>`;
    }
    return;
  }

  // 1) If critical data is missing, fallback message (keep this check from above if you like)
  if (!name || !localStorage.getItem("userGoalDate") || !localStorage.getItem("projectedGoalDate")) {
    // console.warn("Missing data for the dynamic hero message. Showing basic fallback.");
    if (dynamicMessageContainer) {
      dynamicMessageContainer.innerHTML = `
      <p><strong>${name || "User"}</strong>, we’ve created a personalized program for you. Let’s get started!</p>
    `;
    }
    return;
  }

  // 2) Prepare necessary localStorage values
  const userGoalWeight = parseFloat(localStorage.getItem("userGoalWeight") || "0");
  const currentWeight = parseFloat(weight) || 0;
  const userGoalDateStr = localStorage.getItem("userGoalDate");      // e.g. "2025-11-11"
  const projectedGoalDateStr = localStorage.getItem("projectedGoalDate"); // e.g. "May 17, 2025"
  const goalDriver = localStorage.getItem("goalDriver"); // e.g. "A wedding or special event"
  const weightUnit = localStorage.getItem("weightUnit") || "kg";
  const currentKg = parseFloat(localStorage.getItem("weight")) || 0;
  const goalKg = parseFloat(localStorage.getItem("userGoalWeight")) || 0;

  // 3) Convert userGoal to a consistent format (already done above, but just in case)
  userGoal = userGoal ? userGoal.trim().toLowerCase() : "improve body composition";

  // 4) Build line #1 of hero message
  let heroLine1 = "";
  if (userGoal === "lose weight") {
    // how much to lose, in kg
    const diffKg = currentKg - goalKg;
    // display in whichever unit they used
    const diffDisplay = weightUnit === "lbs"
      ? kgToLbs(diffKg)
      : diffKg;
    heroLine1 = `
      <strong>${name}</strong>,
      your program is built to help you lose
      <strong>${diffDisplay.toFixed(1)} ${weightUnit}</strong>.
    `;
  }
  else if (userGoal === "gain muscle") {
    const diffKg = goalKg - currentKg;
    const diffDisplay = weightUnit === "lbs"
      ? kgToLbs(diffKg)
      : diffKg;
    heroLine1 = `
      ${name}, your program is built to help you gain
      <strong>${diffDisplay.toFixed(1)} ${weightUnit}</strong>
      of muscle.
    `;
  }
  else /* improve body composition */ {
    const targetDisplay = weightUnit === "lbs"
      ? kgToLbs(goalKg)
      : goalKg;
    heroLine1 = `
      ${name}, your program is built to help you reach
      your goal weight of
      <strong>${targetDisplay.toFixed(1)} ${weightUnit}</strong>.
    `;
  }

  // 5) Define the Goal Driver Messages Array
  const goalDriverMessages = [
    {
      goalDriver: "A wedding or special event",
      met: "Make sure you feel amazing, lean, and confident when your big day arrives in {eventMonth}.",
      notMet: "Make sure you feel amazing, lean, and confident when your big day arrives in {eventMonth}."
    },
    {
      goalDriver: "An upcoming holiday",
      met: "Make this your best transformation yet — ready for the sun, the camera, and the mirror by {eventMonth}.",
      notMet: "Make this your best transformation yet — ready for the sun, the camera, and the mirror by {eventMonth}."
    },
    {
      goalDriver: "A recent breakup or life change",
      met: "You’ve been through a lot — now rebuild, stronger than before.",
      notMet: "You’ve been through a lot — now rebuild, stronger than before."
    },
    {
      goalDriver: "I want to feel confident in my body again",
      met: "Start showing up for the version of you that’s been waiting to reappear.",
      notMet: "Start showing up for the version of you that’s been waiting to reappear."
    },
    {
      goalDriver: "I'm tired of feeling tired or unmotivated",
      met: "You don’t have to run on empty anymore — let’s rebuild your energy from the inside out.",
      notMet: "You don’t have to run on empty anymore — let’s rebuild your energy from the inside out."
    },
    {
      goalDriver: "I’m doing this for my mental and emotional health",
      met: "Feel more grounded, in control, and emotionally lighter — this is about you, not just your body.",
      notMet: "Feel more grounded, in control, and emotionally lighter — this is about you, not just your body."
    },
    {
      goalDriver: "I’ve let things slip and want to get back on track",
      met: "Get back in control — with momentum, structure, and progress you can feel by {eventMonth}.",
      notMet: "Get back in control — with momentum, structure, and progress you can feel by {eventMonth}."
    },
    {
      goalDriver: "I want to build discipline and stop starting over",
      met: "Consistency beats motivation — and this time, you’ve got a system built to last.",
      notMet: "Consistency beats motivation — and this time, you’ve got a system built to last."
    },
    {
      goalDriver: "I just feel ready for a change",
      met: "Sometimes a fresh start is the strongest decision you can make — let’s make it count.",
      notMet: "Sometimes a fresh start is the strongest decision you can make — let’s make it count."
    }
  ];

  // 6) Parse dates to determine "met" vs "notMet"
  const userGoalDateObj = new Date(userGoalDateStr);        // e.g. new Date("2025-11-11")
  const projectedGoalDateObj = new Date(projectedGoalDateStr); // e.g. new Date("May 17, 2025")

  let isGoalMet = false;

  // If projectedGoalDate is strictly before userGoalDate, definitely "met"
  if (projectedGoalDateObj < userGoalDateObj) {
    isGoalMet = true;
  } else {
    // If same year + same month => treat as "met"
    const sameYear = projectedGoalDateObj.getFullYear() === userGoalDateObj.getFullYear();
    const sameMonth = projectedGoalDateObj.getMonth() === userGoalDateObj.getMonth();
    if (sameYear && sameMonth) {
      isGoalMet = true;
    }
  }

  // 7) Construct line #2 from the driver
  let heroLine2 = "";
  if (goalDriver) {
    const matchingDriver = goalDriverMessages.find(d => d.goalDriver === goalDriver);
    if (matchingDriver) {
      heroLine2 = isGoalMet ? matchingDriver.met : matchingDriver.notMet;
    } else {
      // fallback if driver text not found
      heroLine2 = "This plan will guide you every step of the way.";
    }
  } else {
    // fallback if no 'goalDriver' in localStorage
    heroLine2 = "This plan will guide you every step of the way.";
  }

  // 8) Replace {eventMonth} with userGoalDate's month name
  const eventMonthName = userGoalDateObj.toLocaleString("default", { month: "long" });
  // e.g. "Nov" — you can use { month: "long" } for "November" if preferred

  heroLine2 = heroLine2.replace("{eventMonth}", eventMonthName);

  // 9) Line #3 is static
  const heroLine3 = "- with a smart tracker that asks how you feel and adapts your plan around it.>.";

  // 10) Combine everything into the container
  if (dynamicMessageContainer) {
    dynamicMessageContainer.innerHTML = `
    <p class="hero-header">${heroLine1}<p>
    <p class="hero-subheadline">${heroLine2}</p>
  `;
  } else {
    // console.error("Dynamic message container (#dynamicMessageContainer) not found in the DOM.");
  }

  // 3) Create the summary container (BMI / Daily Cal / Water / Plan)
  const summaryContainer = document.createElement("div");
  summaryContainer.classList.add("summary-container");
  dynamicMessageContainer.insertAdjacentElement("afterend", summaryContainer);

  // 3a) BMI Section
  function getBMIDescription(category) {
    switch (category.toLowerCase()) {
      case "obese":
        return `Your BMI indicates a <b>higher weight category</b>, but your tracker adjusts to you — helping you build real, lasting progress without overwhelm.`;
      case "overweight":
        return `Your BMI suggests you're <b>slightly overweight</b>. Don’t worry — your smart tracker is built to deliver long-term success.`;
      case "healthy":
        return `Your BMI suggests you’re in a great place! Let’s build on that strong foundation and keep the momentum going.`;
      case "underweight":
        return `Your BMI suggests you're <b>below the recommended range</b>. Your tracker is built to help you get stronger, healthier, and more confident.`;
      default:
        return `Your BMI is just one factor. Your tracker will adapt to support your full transformation.`;
    }
  }

  function calculateBMIPosition(bmiVal) {
    // Map BMI range 0–40 to 0–100%
    const maxBMI = 40;
    const capped = Math.min(bmiVal, maxBMI);
    return (capped / maxBMI) * 100;
  }

  function renderBMISection() {
    const bmiValue = parseFloat(localStorage.getItem("userBMI") || "24.69");
    const description = getBMIDescription(bmiCategory);

    return `
      <div class="bmi-section">
        <div class="bmi-value">${bmiValue.toFixed(2)} BMI</div>
        <div class="bmi-gradient-bar">
          <div class="bmi-marker" style="left: ${calculateBMIPosition(bmiValue)}%;"></div>
        </div>
        <div class="bmi-description">${description}</div>
      </div>
    `;
  }

  // 3b) Daily Calorie Intake
  function animateNumber({
    element,
    start = 0,
    end = 100,
    duration = 3000,
    formatFn = (val) => val.toString()
  }) {
    if (!element) return;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Current numeric value
      const currentValue = start + (end - start) * progress;

      // Format the text (kcal, liters, etc.)
      element.textContent = formatFn(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }

  // === Calorie Section ===
  function renderCalorieSection() {
    return `
      <div class="calorie-section">
        <p class="calorie-subheading">Recommended Daily Calorie Intake</p>
        <div class="calorie-value" id="calNumber">0 kcal</div>
      </div>
    `;
  }

  // Function to calculate water intake
  function calculateWaterIntake() {
    const gender = localStorage.getItem("gender");
    const activityLevel = localStorage.getItem("activityLevel");
    const weight = parseFloat(localStorage.getItem("weight")) || 60; // Default to 60kg if not provided

    // Base water intake (30-35 ml per kg of body weight)
    let waterIntake = weight * 0.035;  // Using 35ml per kg as a standard recommendation

    // Adjust based on gender (reduced emphasis)
    if (gender === "male") {
      waterIntake += 0.2;  // Slight increase for males
    }

    // Adjust water intake based on activity level (reduced multipliers)
    switch (activityLevel) {
      case "lightly active":
        waterIntake += 0.2;  // +200ml for lightly active
        break;
      case "moderately active":
        waterIntake += 0.3;  // +300ml for moderately active
        break;
      case "very active":
        waterIntake += 0.5;  // +500ml for very active
        break;
      case "extra active":
        waterIntake += 0.7;  // +700ml for extra active
        break;
      default:
        break;
    }

    // Get additional workout-related info
    const workoutFrequency = parseInt(localStorage.getItem("workoutDays"), 10) || 0; // Default to 0 if missing
    const sessionDuration = parseInt(localStorage.getItem("sessionDuration"), 10) || 0; // Default to 0 if missing

    // Increase water intake based on workout frequency and session duration (reduced multiplier)
    if (workoutFrequency > 0) {
      // Assuming each workout session increases water intake by 0.1L per 30 minutes
      const additionalWater = (sessionDuration / 30) * 0.1 * workoutFrequency;
      waterIntake += additionalWater;
    }

    // Save to localStorage
    localStorage.setItem("currentWaterIntake", waterIntake.toFixed(2));  // Save the calculated value
    return waterIntake;
  }

  // Function to render water section on the page
  function renderWaterSection() {
    const currentWaterIntake = calculateWaterIntake();  // Calls the updated function

    // Log and store the adjusted water intake for the program
    const programWaterIntake = currentWaterIntake * 1.1; // Increase by 10% for the workout program
    localStorage.setItem("programWaterIntake", programWaterIntake.toFixed(2));  // Save program water intake
    // console.log(`Adjusted Water Intake for Program: ${programWaterIntake.toFixed(2)} L`);

    return `
      <div class="water-section">
        <p class="water-subheading">Recommended Daily Water Intake</p>
        <div class="water-value" id="waterNumber">${currentWaterIntake.toFixed(2)} L</div>
      </div>
    `;
  }

  // === Personalized Plan (Flip Cards) ===
  function renderPlanSection() {
    return `
      <div class="plan-section">
        <h3 class="plan-heading">${name}'s Plan is Ready!</h3>
        <div class="plan-desc">
         <p>Other apps just track. <strong>We use what you track to adapt workouts & meals</strong> so you
      <strong>get fit faster</strong>.<br>
        <div class="plan-grid">
          <!-- 1) Duration -->
        <div class="flip-card" data-description="Your ${sessionDuration} routine is built for results — you’ve earned your crown.">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <div class="plan-emoji">👑</div>
            <div class="plan-title">${(gender && gender.toLowerCase() === "male") ? "Routine King" : "Routine Queen"}</div>
          </div>
          <div class="flip-card-back"></div>
        </div>
      </div>

          <!-- 2) Fitness Level -->
          <div class="flip-card" data-description="You’ve earned your badge — get ready for challenges matched to your ${fitnessLevel} level.">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <div class="plan-emoji">💪</div>
                <div class="plan-title">${fitnessLevel} Rising</div>
              </div>
              <div class="flip-card-back"></div>
            </div>
          </div>

          <!-- 3) Location -->
          <div class="flip-card" data-description="Optimized for your ${workoutLocation} — your tracker makes every session count.">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <div class="plan-emoji">
                  ${workoutLocation.toLowerCase() === "home" ? "🏠" : "🏋️"}
                </div>
                <div class="plan-title">
                  ${workoutLocation.toLowerCase() === "home" ? "Home Workout Warrior" : "Gym Explorer"}
                </div>
              </div>
              <div class="flip-card-back"></div>
            </div>
          </div>

          <!-- 4) Frequency -->
          <div class="flip-card" data-description="Consistency creates champions — and you’re training ${workoutFrequency} times a week to prove it.">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <div class="plan-emoji">🏆</div>
                <div class="plan-title">Consistency Champ</div>
              </div>
              <div class="flip-card-back"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // === Render sections in order ===
  summaryContainer.innerHTML = `
  <h2 class="summary-heading">Your Summary</h2>
  ${renderBMISection()}
  ${renderCalorieSection()}
  ${renderWaterSection()}
  ${renderPlanSection()}
`;


  // === Animate Calorie (5s) ===
  const calNumberEl = document.getElementById("calNumber");
  // Use selectedCalories if present, else fallback
  let userCals = parseInt(maintenanceCalories, 10);
  if (isNaN(userCals)) {
    const sel = localStorage.getItem("selectedCalories");
    userCals = sel ? parseInt(sel, 10) : 0;
  }
  animateNumber({
    element: calNumberEl,
    start: 0,
    end: userCals,
    duration: 3000,
    formatFn: (val) => Math.floor(val) + " kcal"
  });

  // === Animate Water (5s) ===
  const waterNumberEl = document.getElementById("waterNumber");
  let w = parseFloat(localStorage.getItem("currentWaterIntake")) || 0;  // Fetch updated value

  if (isNaN(w) || w <= 0) {
    w = 2.5; // Fallback value if the calculation fails (should not happen if everything is working)
  }

  // Animate from 0.00 L to w with 2 decimals
  animateNumber({
    element: waterNumberEl,
    start: 0,
    end: w,
    duration: 3000,
    formatFn: (val) => `${val.toFixed(2)} L`
  });

  // === Flip-card event ===
  document.querySelectorAll(".flip-card").forEach((card) => {
    const back = card.querySelector(".flip-card-back");
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
      if (card.classList.contains("flipped")) {
        // Put the text inside a p for better wrapping
        back.innerHTML = `<p class="flip-content">${card.dataset.description}</p>`;
      } else {
        back.innerHTML = "";
      }
    });
  });
  // Variables to hold the dynamic testimonial values.
  // pick which testimonial to show
  let selectedReviewName = "";
  let selectedReviewText = "";
  let beforeImgSrc = "";
  let afterImgSrc = "";

  if (userGoal === "gain muscle") {
    // Muscle gain review.
    selectedReviewName = "David";
    selectedReviewText =
      "I used to wing it at the gym and second-guess everything. Seeing my workouts and progress adapt over time changed everything. I’ve gained 6kg of muscle — and confidence too.";
    beforeImgSrc = "../assets/harry_chest_before.webp";
    afterImgSrc = "../assets/harry_chest_after.webp";

  } else if (userGoal === "lose weight" || userGoal === "improve body composition") {
    if (gender === "male") {
      // Male weight-loss review.
      selectedReviewName = "Lee";
      selectedReviewText =
        "I wasn’t sure I could stick with it. But everything’s laid out — no guessing. I’ve lost 10kg and finally feel like myself again.";
      beforeImgSrc = "../assets/lynn_before.webp";
      afterImgSrc = "../assets/lynn_after.webp";

    } else if (gender === "female") {
      // Female weight-loss review.
      selectedReviewName = "Alice";
      selectedReviewText =
        "Strict plans never worked for me. This didn’t just tell me what to do — it fit into my life. I’ve lost weight, feel healthier, and for the first time, I’m in control of the process.";
      beforeImgSrc = "../assets/halima_back_before.webp";
      afterImgSrc = "../assets/halima_back_after.webp";

    } else {
      // fallback if gender isn't set
      selectedReviewName = "Sam";
      selectedReviewText = "Default placeholder review: This program truly makes a difference.";
      beforeImgSrc = "#";
      afterImgSrc = "#";
    }

  } else {
    // fallback if no specific goal match
    selectedReviewName = "Sam";
    selectedReviewText = "Default placeholder review: This program truly makes a difference.";
    beforeImgSrc = "#";
    afterImgSrc = "#";
  }

  // Update the testimonial name and review text.
  const testimonialNameEl = document.querySelector(".testimonial-left strong");
  const reviewTextEl = document.querySelector(".review-placeholder p");

  if (testimonialNameEl && reviewTextEl) {
    testimonialNameEl.textContent = selectedReviewName;
    reviewTextEl.textContent = selectedReviewText;
  }

  // Update the testimonial images.
  const beforeImageEl = document.querySelector(".before-image img");
  const afterImageEl = document.querySelector(".after-image img");

  if (beforeImageEl && afterImageEl) {
    beforeImageEl.src = beforeImgSrc;
    afterImageEl.src = afterImgSrc;
  }

  // console.log("Testimonial updated:");
  // console.log("Name:", selectedReviewName);
  // console.log("Review Text:", selectedReviewText);
  // console.log("Before Image Source:", beforeImgSrc);
  // console.log("After Image Source:", afterImgSrc);
});

// Data array
document.addEventListener("DOMContentLoaded", () => {
  // console.log("[JS] Setting up subheading-based scrolling...");

  const items = document.querySelectorAll(".wi2-left .wi2-item");
  const pinnedImage = document.getElementById("wi2-image");
  const pinnedDesc = document.getElementById("wi2-desc");

  // If not found, we bail
  if (!items.length || !pinnedImage || !pinnedDesc) {
    // console.warn("[JS] Required elements not found. Check your HTML IDs/classes.");
    return;
  }

  /***************************************************
   * A) WHAT’S INCLUDED DATA
   ***************************************************/

  const whatsIncludedData = [
    {
      title: "Tailored From Day One (CT)",
      image: "../assets/your-ui-mockup.webp",
      desc: ""
    },
    {
      title: "Track Workouts, Earn XP (CT)",
      image: "../assets/clear-and-easy.PNG",
      desc: ""
    },
    {
      title: "Adaptive Progression Engine (PT)",
      image: "../assets/workout-summary.PNG",
      desc: ""
    },
    {
      title: "Macro-Matched Meals (PT)",
      image: "../assets/progress-tracking-2.PNG",
      desc: ""
    },
    // {
    //   title: "Flexible Logging, Your Way (PT)",
    //   image: "../assets/5_flexible_logging.png",
    //   desc: "Log in one tap, customize meals, or skip when needed — your tracker adjusts for you."
    // },
    // {
    //   title: "Daily Streaks That Stick (CT)",
    //   image: "../assets/6_daily_streaks.png",
    //   desc: "Build streaks that unlock milestones — with encouragement that celebrates your wins and helps you stay on track when it counts."
    // },
    // {
    //   title: "Your Fitness Story, Visualized (PT)",
    //   image: "../assets/7_your_fitness_story.png",
    //   desc: "Your tracker doesn't just log data — it highlights trends, flags issues, and offers insights like a coach who's always paying attention."
    // },
    // {
    //   title: "Your Progress, Scored (PT)",
    //   image: "../assets/8_your_progress.png",
    //   desc: "One score that reflects your training, nutrition, and consistency — so you can see how far you’ve come."
    // }
  ];

  /***************************************************
   * B) GET DOM REFERENCES
   ***************************************************/
  const wi2Items = document.querySelectorAll(".wi2-left .wi2-item");
  const wi2Image = document.getElementById("wi2-image");
  const wi2Desc = document.getElementById("wi2-desc");

  // If any element is missing, we log an error and stop (#1)
  if (!wi2Items.length) {
    // console.error("[JS] No subheadings found under .wi2-left .wi2-item! Check your HTML.");
    return;
  }
  if (!wi2Image || !wi2Desc) {
    // console.error("[JS] #wi2-image or #wi2-desc is missing in the DOM! Check your HTML IDs.");
    return;
  }

  const pinnedPanel = document.getElementById("wi2-panel")
    || document.querySelector(".wi2-panel");
  // fallback if you used a different ID/class

  let currentIndex = 0; // Which item is displayed on the right

  /***************************************************
   * C) SET CONTENT IMMEDIATELY (no fade).
   *    If user scrolls or if we highlight an item, 
   *    we call this function to update the pinned panel.
   ***************************************************/
  function setActiveContent(newIndex) {
    if (newIndex === currentIndex) return; // no change
    if (newIndex < 0 || newIndex >= whatsIncludedData.length) {
      // console.warn("[JS] Invalid newIndex:", newIndex);
      return;
    }
    // if pinnedPanel doesn’t exist, just do an immediate swap
    if (!pinnedPanel) {
      directSwap(newIndex);
      return;
    }

    // 1) fade out old content
    pinnedPanel.classList.remove("fade-in-panel");
    pinnedPanel.classList.add("fade-out");

    // after 250ms, we swap the content
    setTimeout(() => {
      // swap the image & description
      wi2Image.src = whatsIncludedData[newIndex].image;

      // Build the description content
      let descContent = whatsIncludedData[newIndex].desc;
      // If the title contains "(PT)", append an extra line
      if (whatsIncludedData[newIndex].title.includes("(PT)")) {
        descContent += "<p class='pt-extra-container'></p>";
        // "<p class='pt-extra-container'><span class='crown-emoji'>👑</span> <span class='pt-extra'>Included in the Pro Tracker</span></p>";
      }
      // if the title contains "(CT)", append a grey badge instead
      if (whatsIncludedData[newIndex].title.includes("(CT)")) {
        descContent +=
          "<p class='ct-extra-container'>" +
          // "<span class='ct-extra'>Available in every plan</span>" +
          "</p>";
      }

      // Use innerHTML to render the extra line as HTML
      wi2Desc.innerHTML = descContent;
      ""
      // 2) fade in new content
      pinnedPanel.classList.remove("fade-out");
      pinnedPanel.classList.add("fade-in-panel");

      currentIndex = newIndex;
    }, 250);
  }

  // fallback if pinnedPanel is null
  function directSwap(newIndex) {
    wi2Image.src = whatsIncludedData[newIndex].image;
    wi2Desc.textContent = whatsIncludedData[newIndex].desc;
    currentIndex = newIndex;
  }

  /***************************************************
   * D) SCROLL HANDLER
   *    Finds whichever .wi2-item is closest to center
   *    of the screen, highlights it, then updates content.
   ***************************************************/
  let scrollTimeout = null;
  function onScroll() {
    // Throttle: only do the logic if no scroll event
    // happened in the last 100 ms (adjust if needed).
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      let closestIndex = 0;
      let closestDistance = Infinity;
      const viewportCenter = window.innerHeight / 2;

      wi2Items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const itemCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(itemCenterY - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = parseInt(item.dataset.index, 10);
        }
      });

      // highlight that item
      wi2Items.forEach((i) => i.classList.remove("active"));
      wi2Items[closestIndex].classList.add("active");

      // update pinned content
      setActiveContent(closestIndex);

      scrollTimeout = null;
    }, 100);
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /***************************************************
   * E) INIT: highlight subheading #0 & set content
   ***************************************************/
  wi2Items.forEach((i) => i.classList.remove("active"));
  // …inside your DOMContentLoaded handler, in place of `setActiveContent(0)`…

  // 1) mark the first item active
  wi2Items[0].classList.add("active");

  // 2) immediately inject the first image + description
  const first = whatsIncludedData[0];
  wi2Image.src = first.image;
  wi2Desc.innerHTML = first.desc
    + (first.title.includes("(PT)")
      ? "<p class='pt-extra-container'><span class='crown-emoji'>👑</span> <span class='pt-extra'>Included in the Pro Tracker</span></p>"
      : "")
    + (first.title.includes("(CT)")
      ? "<p class='ct-extra-container'></p>"
      : "");

  // 3) then fire your fade‑in on the panel
  pinnedPanel.classList.add("fade-in-panel");


  /* 
     >>> ADDED FEATURE: On click, user can override 
     subheading to show that content immediately
  */
  wi2Items.forEach((item) => {
    item.addEventListener("click", () => {
      wi2Items.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      const index = parseInt(item.dataset.index, 10);
      setActiveContent(index);
    });
  });
});

// ------------------------------------
// FLOATING CTA LOGIC
// ------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const floatingCTA = document.getElementById('floating-cta');
  const ctaContainer = document.getElementById('floatingCtaContainer');
  const ctaStop = document.getElementById('ctaStopContainer');
  const claimProgramBtn = document.getElementById('claimProgramBtn');

  if (!floatingCTA || !ctaContainer || !ctaStop) {
    // console.warn("Missing CTA elements. Check #floating-cta, #floatingCtaContainer, #ctaStopContainer");
    return;
  }

  // Ensure CTA is always visible from the start:
  // (If you had "fade-in" logic, you can add it here:
  //   floatingCTA.classList.add('visible');
  // )

  // We'll track if pinned to avoid reapplying classes repeatedly
  let isPinned = false;

  function onScroll() {
    // CTA is "fixed" by default at bottom:20px. 
    // Let's find out if it *would* go below the #ctaStopContainer
    // i.e. if (CTA bottom) >= (stop container's top)

    // 1) CTA's approximate bottom on screen
    //    We can guess it's at (window.scrollY + window.innerHeight - 20)
    //    if bottom: 20px from viewport bottom.
    const ctaBottomInView = window.scrollY + window.innerHeight - 20;

    // 2) The #ctaStopContainer's top in absolute page coords
    const stopRect = ctaStop.getBoundingClientRect();
    const stopTop = stopRect.top + window.scrollY;

    // 3) If CTA's bottom is beyond stopTop, we should pin it.
    if (ctaBottomInView >= stopTop) {
      // pin it if not pinned
      if (!isPinned) {
        floatingCTA.classList.add('pinned');
        // Also remove shadow overlay if pinned (if you prefer)
        floatingCTA.classList.remove('shadow-active');
        isPinned = true;
      }
    } else {
      // unpin if pinned
      if (isPinned) {
        floatingCTA.classList.remove('pinned');
        // If desktop, re-add shadow
        if (window.innerWidth >= 768) {
          floatingCTA.classList.add('shadow-active');
        }
        isPinned = false;
      }
    }
  }

  // We also want the desktop shadow while not pinned
  function onResize() {
    if (!isPinned) {
      if (window.innerWidth >= 768) {
        floatingCTA.classList.add('shadow-active');
      } else {
        floatingCTA.classList.remove('shadow-active');
      }
    }
  }

  // Start by adding a desktop shadow if appropriate
  onResize();

  // Listen for scroll & resize
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // CTA button click
  if (claimProgramBtn) {
    claimProgramBtn.addEventListener('click', () => {
      // console.log("CTA clicked!");
      // e.g. scroll to checkout, open modal, etc.
    });
  }
  fadeInSectionsInOrder();
});

function fadeInSectionsInOrder() {
  const fadeOrder = [
    "#logo",                         // 1) Logo
    ".offer-container",              // 2) Personalized msg
    ".summary-container",            // 3) Summary
    // ".floating-cta",                 // 4) CTA
    ".whats-included-container",     // 5) What's Included
    "#results-section",
    ".discount-section",
    ".money-back-guarantee",             // 6) Achieve The Results
    "footer.footer"                  // 7) Footer
  ];

  fadeOrder.forEach((selector, i) => {
    const el = document.querySelector(selector);
    if (el) {
      setTimeout(() => {
        el.classList.add("visible");
      }, i * 500);
    }
  });
}

// FLOATING CTA: Add fade-in after 1500ms
document.addEventListener("DOMContentLoaded", () => {
  const floatingCTA = document.getElementById("floating-cta");

  if (!floatingCTA) {
    // console.error("Floating CTA not found in the DOM.");
    return;
  }

  // console.log("Floating CTA script loaded successfully.");

  // Wait 1500ms and then add the unique class to make it visible
  setTimeout(() => {
    floatingCTA.classList.add("cta-visible");
    // console.log("Floating CTA faded in.");
  }, 1000);
});

function updatePostPayNote() {
  const host = document.getElementById('postPayNote');
  const priceEl = document.getElementById('checkoutPrice');
  if (!host || !priceEl) return;

  const { code, full, intro } = getLocalPrices();
  const dealOn = document.body.classList.contains('discount-active');
  const checkout = dealOn ? intro : full;               // price user sees at checkout
  priceEl.textContent = fmt(code, checkout);
}


/**********************************************/
/* A) DISCOUNT TIMER LOGIC (with indefinite)  */
/**********************************************/
document.addEventListener("DOMContentLoaded", function () {
  const now = Date.now();
  const signupTs = Number(localStorage.getItem("signupTimestamp") || 0);
  let comebackEnd = Number(localStorage.getItem("sevenDayDiscountEnd") || 0);

  // If 7 days have passed since sign-up and no comeback window is running, start a 24h window
  if (signupTs && !comebackEnd && now >= signupTs + 7 * 24 * 60 * 60 * 1000) {
    comebackEnd = now + 24 * 60 * 60 * 1000;
    localStorage.setItem("sevenDayDiscountEnd", comebackEnd);
  }

  let discountEndTime;
  if (comebackEnd && comebackEnd > now) {
    // Use the 7-day comeback window
    discountEndTime = comebackEnd;
    localStorage.setItem("discountEndTime", comebackEnd);
  } else {
    // Fallback to your existing “offerResumeEnd” / 10-minute logic
    const storedResume = localStorage.getItem("offerResumeEnd");
    if (storedResume) {
      discountEndTime = Number(storedResume);
      localStorage.removeItem("offerResumeEnd");
    } else {
      const stored = localStorage.getItem("discountEndTime");
      if (!stored) {
        discountEndTime = now + 10 * 60 * 1000;
        localStorage.setItem("discountEndTime", discountEndTime);
      } else {
        discountEndTime = Number(stored);
      }
    }
  }

 const promoStrip = document.getElementById('promoAppliedStrip');
  const kitTitle = document.querySelector('.kit-title');
  if (kitTitle) {
    if (!kitTitle.dataset.activeHtml) kitTitle.dataset.activeHtml = kitTitle.innerHTML;
    if (!kitTitle.dataset.brandOnly) {
      const brand = kitTitle.querySelector('.kit-brand');
      kitTitle.dataset.brandOnly = brand
        ? `<span class="kit-brand">${brand.textContent}</span>`
        : kitTitle.textContent.trim();
    }
  }
  const bmPills = Array.from(document.querySelectorAll('.bm-pill'));
  const modalBadges = Array.from(document.querySelectorAll('#valueModal .discount-badge'));
  const fullPriceRow = document.querySelector('#totalPriceSummary .tp-row.full');
  const promoLine = document.getElementById('promoCodeLine');
  if (promoLine) {
    const captureActiveMarkup = () => {
      if (!promoLine.dataset.activeHtml && promoLine.querySelector('.promo-code-value')) {
        promoLine.dataset.activeHtml = promoLine.innerHTML;
      }
    };
    captureActiveMarkup();
    const promoObserver = new MutationObserver(captureActiveMarkup);
    promoObserver.observe(promoLine, { childList: true, subtree: true });
  }
  const scratchCard = document.querySelector('.scratch-card');
  const scratchMirror = document.getElementById('scratchMirrorTimer');
  const scratchMirrorNote = document.getElementById('scratchMirrorTimerNote');
  const continueBtn = document.getElementById('valueContinue');

  function applyDiscountDecor(active) {
    document.body.classList.toggle('discount-active', active);
    document.body.classList.toggle('discount-expired', !active);

    if (promoStrip) promoStrip.hidden = !active;

    if (kitTitle) {
      if (active) {
        if (!kitTitle.dataset.activeHtml && kitTitle.querySelector('.kit-brand')) {
          kitTitle.dataset.activeHtml = kitTitle.innerHTML;
        }
        if (kitTitle.dataset.activeHtml) {
          kitTitle.innerHTML = kitTitle.dataset.activeHtml;
        }
      } else if (kitTitle.dataset.brandOnly) {
        kitTitle.innerHTML = kitTitle.dataset.brandOnly;
      }
    }

    bmPills.forEach(pill => {
      pill.hidden = !active;
    });

    modalBadges.forEach(badge => {
      badge.hidden = !active;
    });

    if (fullPriceRow) fullPriceRow.hidden = !active;

    if (promoLine) {
      if (active) {
        if (!promoLine.dataset.activeHtml && promoLine.querySelector('.promo-code-value')) {
          promoLine.dataset.activeHtml = promoLine.innerHTML;
        }
        if (promoLine.dataset.activeHtml) {
          promoLine.innerHTML = promoLine.dataset.activeHtml;
        }
      } else {
        promoLine.textContent = 'Your promo code has expired.';
      }
    }

    if (scratchCard) scratchCard.classList.toggle('promo-expired', !active);
    if (!active) {
      if (scratchMirror) scratchMirror.textContent = 'Expired';
      if (scratchMirrorNote) scratchMirrorNote.textContent = 'Expired';
      if (continueBtn) {
        continueBtn.disabled = false;
        continueBtn.classList.remove('locked');
        continueBtn.style.removeProperty('background');
        continueBtn.style.removeProperty('background-image');
      }
    }
  }

  function updatePricingJustification() {
    const el = document.querySelector('.pricing-justification');
    if (!el) return;

    const dealOn = document.body.classList.contains('discount-active');
    const { code, full, intro } = getLocalPrices();

    if (dealOn) {
      const introPerDay = fmt(code, intro / FLAGSHIP_PLAN_DAYS);
      el.innerHTML =
        `Normally ${fmt(code, full)} — now just <strong>${fmt(code, intro)}</strong>. ` +
        `🎉 Just ${introPerDay} a day.`;
    } else {
      el.textContent = 'Like having a personal trainer in your pocket — for less than the cost of one session.';
    }
    // inside updatePricingJustification(), after you compute {code, full, intro} and dealOn
    const $ = (id) => document.getElementById(id);

    if ($('tpFull')) {
      $('tpFull').textContent = fmt(code, full);
      // add/remove strike class based on discount
      $('tpFull').classList.toggle('price-strikethrough', !!dealOn);
    }
    if ($('tpNow')) $('tpNow').textContent = fmt(code, dealOn ? intro : full);
    if ($('tpPerDay')) {
      const perDayAmount = (dealOn ? intro : full) / FLAGSHIP_PLAN_DAYS;
      $('tpPerDay').textContent = fmt(code, perDayAmount);
    }
    if ($('tpCcy')) $('tpCcy').textContent = code;

  }

  const timerContainer = document.getElementById("timerContainer");
  const countdownTimerEl = document.getElementById("countdownTimer");

  function updateTimer() {
    const now = Date.now();
    const diff = discountEndTime - now;

    // If the discount has expired…
    if (diff <= 0) {
      applyDiscountDecor(false);
      removeDiscountPricing();
      updatePostPayNote();
       updatePricingJustification();
      updatePlanSummary();
      localStorage.removeItem("sevenDayDiscountEnd");
      if (timerContainer) timerContainer.style.display = "none";
      const cardSubtext = document.querySelector(".card-subtext");
      if (cardSubtext) cardSubtext.remove();
      return;
    }

    // Keep the discount styling active
     applyDiscountDecor(true);

    // Break diff into h/m/s
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Zero-pad helper
    const pad = n => n.toString().padStart(2, "0");

    // Build the display string
    let display;
    if (hours > 0) {
      display = `${hours}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      display = `${pad(minutes)}:${pad(seconds)}`;
    }

    // Update the DOM
    if (countdownTimerEl) {
      countdownTimerEl.textContent = display;
    }

    // For 1-Week Program: while the timer is active, force discount pricing
    const costPerDay1Week = document.getElementById("costPerDay1Week");
    const currencyTag1Week = document.querySelector('[data-program="1-week"] .currency-tag');
    const perDay1Week = document.querySelector('[data-program="1-week"] .per-day');
    if (costPerDay1Week && currencyTag1Week && perDay1Week) {
      costPerDay1Week.textContent = "FREE!";
      currencyTag1Week.style.display = "none";
      perDay1Week.style.display = "none";
    }

    // For Pro Tracker Subscription (special card, data-program="new") while discount active
    const costPerDaySpecial = document.getElementById("costPerDaySpecial");
    const currencyTagSpecial = document.querySelector('[data-program="new"] .currency-tag');
    const perDaySpecial = document.querySelector('[data-program="new"] .per-day');
    if (costPerDaySpecial && currencyTagSpecial && perDaySpecial) {
      const { code, intro } = getLocalPrices();
      costPerDaySpecial.textContent = fmt(code, intro / FLAGSHIP_PLAN_DAYS);
      currencyTagSpecial.style.display = "block";
    }
  }

  setInterval(updateTimer, 1000);
  updatePostPayNote();
  updateTimer();
  updatePricingJustification();
  updatePlanSummary();
  localizeProTrackerCard();
  return;
});

function removeDiscountPricing() {
  // 1-Week Program (if present) → revert to full price view
  const price1WeekFull = document.getElementById('price1WeekFull');
  const price1WeekDiscount = document.getElementById('price1WeekDiscount');
  const costPerDay1Week = document.getElementById('costPerDay1Week');
  const currencyTag1Week = document.querySelector('[data-program="1-week"] .currency-tag');
  const perDay1Week = document.querySelector('[data-program="1-week"] .per-day');

  if (price1WeekFull && costPerDay1Week) {
    // Remove strikethrough and hide discounted label if it exists
    price1WeekFull.style.textDecoration = 'none';
    if (price1WeekDiscount) price1WeekDiscount.style.display = 'none';

    // Try to parse a base GBP amount from data attribute or text
    let baseGbp = null;
    const holder = price1WeekFull.closest('.full-price');
    const dataAttr = holder?.getAttribute('data-full-price') || '';
    const txt = price1WeekFull.textContent || dataAttr || '';
    const m = txt.replace(',', '').match(/([0-9]+(\.[0-9]+)?)/);
    if (m) baseGbp = parseFloat(m[1]);

    // If we found a GBP amount, format locally and compute per-day over 7 days
    if (typeof formatLocal === 'function' && typeof toLocal === 'function' && baseGbp) {
      price1WeekFull.textContent = formatLocal(baseGbp);
      const perDayLocal = toLocal(baseGbp) / 7;
      costPerDay1Week.textContent = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(perDayLocal);
    }

    if (currencyTag1Week) currencyTag1Week.style.display = 'block';
    if (perDay1Week) {
      perDay1Week.style.display = 'block';
      perDay1Week.textContent = 'per day';
    }
  }

  // Pro Tracker Subscription → revert to full price in local currency
  if (typeof localizeProTrackerCard === 'function') {
    localizeProTrackerCard();
  }
}

/**********************************************/
/* D) SELECTING AN OFFER CARD (10 & 11 & 12)  */
/**********************************************/
document.addEventListener("DOMContentLoaded", function () {
  const offerCards = document.querySelectorAll(".offer-card");
  const accordionSelectors = ['.offer-card.offer-special', '.bm-discount-card'];
  const kitCard = document.querySelector('.bm-discount-card');
  const toggleButtons = document.querySelectorAll('.offer-card .toggle-details, .bm-discount-card .toggle-details');
  const collapseHandlerKey = '__rtbCollapseHandler';

  toggleButtons.forEach(btn => {
    if (!btn.dataset.labelCollapsed) {
      btn.dataset.labelCollapsed = btn.textContent.trim();
    }
    if (!btn.dataset.labelExpanded) {
      btn.dataset.labelExpanded = 'See less';
    }
  });
  let currentlySelected = null;

  // Check localStorage for previously selected program
  const savedProgram = localStorage.getItem("selectedProgram");
  if (savedProgram) {
    const savedCard = document.querySelector(`.offer-card[data-program="${savedProgram}"]`);
    if (savedCard) {
      savedCard.classList.add("selected");
      currentlySelected = savedCard;
      if (savedCard.dataset.program === "new") {
        // For the special card, always auto-expand
        toggleDetails(savedCard, true);
      } else {
        toggleDetails(savedCard, true);
      }
      updateCTA(savedCard.dataset.program);
    }
  }

  // If nothing is saved, auto-select the Pro Tracker (but don't expand it)
  // If nothing is saved, auto-select the Pro Tracker (but don't expand it)
  if (!currentlySelected) {
    const proTrackerCard = document.querySelector('.offer-card[data-program="new"]');
    if (proTrackerCard) {
      // 1) mark it selected
      proTrackerCard.classList.add('selected');
      currentlySelected = proTrackerCard;

      // 2) keep it collapsed
      proTrackerCard.dataset.expanded = 'false';

      // 3) persist selection
      localStorage.setItem('selectedProgram', 'new');

      // 4) seed the purchase info
      localStorage.setItem('pendingPurchaseType', 'subscription');

      // 5) seed the plan name
      localStorage.setItem('planName', 'Pro Tracker');

      // 6) seed the displayed price
      let priceText = '';
      const discEl = proTrackerCard.querySelector('.discount-price');
      if (discEl && getComputedStyle(discEl).display !== 'none') {
        priceText = discEl.textContent.trim();
      } else {
        const fullEl = proTrackerCard.querySelector('.full-price span')
          || proTrackerCard.querySelector('.full-price');
        // priceText = fullEl.textContent.trim();
      }
      localStorage.setItem('planPrice', priceText);

      // 7) update the CTA styling
      updateCTA('new');
    }
  }

  // If nothing is saved, automatically select the 4-week card on first load
  // if (!currentlySelected) {
  //   const proTrackerCard = document.querySelector('.offer-card[data-program="new"]');
  //   if (proTrackerCard) {
  //     proTrackerCard.classList.add("selected");
  //     currentlySelected = proTrackerCard;
  //     // leave it collapsed, so no call to toggleDetails here
  //     // ensure its data-expanded flag is explicitly false:
  //     proTrackerCard.dataset.expanded = "false";
  //     localStorage.setItem("selectedProgram", "new");
  //     updateCTA(proTrackerCard.dataset.program);
  //   }
  // }

  /* Tell us whether two cards are the linked 4- & 12-week pair  */
  // function isSyncedPair(a, b) {
  //   if (!a || !b) return false;
  //   const p1 = a.dataset.program;
  //   const p2 = b.dataset.program;
  //   return (
  //     (p1 === '4-week' && p2 === '12-week') ||
  //     (p1 === '12-week' && p2 === '4-week')
  //   );
  // }


  // Add click listeners to each offer card (ignoring clicks on the toggle button)
  offerCards.forEach(card => {
    card.addEventListener("click", function (e) {
      // If the click came from the toggle button, ignore it
      if (e.target.classList.contains("toggle-details")) return;

      // If this card is already selected, do nothing
      if (currentlySelected === card) {
        // If it’s collapsed, open it
        if (card.dataset.expanded !== 'true') {
          toggleDetails(card, true);        // re-open
        }
        return;                             // stop, so we don’t collapse it again
      }

      // If a different card is selected...
      if (currentlySelected && currentlySelected !== card) {

        /* NEW: don't collapse if we're just switching
           between the synced 4- and 12-week cards        */
        if (!isSyncedPair(currentlySelected, card)) {
          toggleDetails(currentlySelected, false);   // ← only runs for *other* cards
        }

        currentlySelected.classList.remove("selected");
      }

      offerCards.forEach(card => {
        card.addEventListener('click', function (e) {
          const proTrackerCard = document.querySelector('.offer-card[data-program="new"]');
          // 1) always remove the purple outline
          if (proTrackerCard) proTrackerCard.classList.remove('highlighted');

          // … your existing click-logic here (deselecting/ selecting cards) …

          // 2) if they clicked the Pro Tracker, re-apply the outline
          if (card.dataset.program === 'new' && proTrackerCard) {
            proTrackerCard.classList.add('highlighted');
          }
        });
      });



      // Select the new card
      card.classList.add("selected");
      currentlySelected = card;
      localStorage.setItem("selectedProgram", card.dataset.program);

      const planName = card.querySelector('.duration strong').textContent;
      localStorage.setItem("planName", planName);

      // Always route checkout through the primary 1-week experience
      // localStorage.setItem("selectedProgram", "new");
      // localStorage.setItem("pendingPurchaseType", "subscription");
      // localStorage.setItem("planName", "12-Week Plan");
      // if (typeof updatePlanSummary === 'function') {
      //   try { updatePlanSummary(); } catch (_) { }
      // }

      // For the special card, always auto-expand; for others, call toggleDetails as before.
      if (card.dataset.program === "new") {
        toggleDetails(card, true);
      } else {
        toggleDetails(card, true);
      }
      updateCTA(card.dataset.program);
      // updateCTA('new');
    });
  });

  // Attach a separate click listener for the special card’s toggle button (if someone taps directly on it)
  // const specialCard = document.querySelector('.offer-card[data-program="new"]');
  // if (specialCard) {
  //   const toggleBtn = specialCard.querySelector(".toggle-details");
  //   if (toggleBtn) {
  //     toggleBtn.addEventListener("click", function (e) {
  //       e.stopPropagation(); // Prevent the card-level click handler from firing
  //       if (specialCard.classList.contains("expanded")) {
  //         toggleDetails(specialCard, false);
  //       } else {
  //         toggleDetails(specialCard, true);
  //       }
  //     });
  //   }
  // }

  /**
   * toggleDetails – (special card branch remains as you already have it)
   */
  // function toggleDetails(card, expand) {
  //   const dataProgram = card.dataset.program;
  //   if (dataProgram === "new") {
  //     const additionalInfo = card.querySelector(".additional-info");
  //     const toggleButton = card.querySelector(".toggle-details");
  //     if (!additionalInfo || !toggleButton) return;

  //     // Use dataset.expanded to keep track of the current state.
  //     const isExpanded = card.dataset.expanded === "true";
  //     // If the card is already in the desired state, do nothing.
  //     if (expand === isExpanded) {
  //       return;
  //     }

  //     if (expand) {
  //       // Mark the card as expanded.
  //       card.dataset.expanded = "true";
  //       card.classList.add("expanded");

  //       additionalInfo.style.transition = "height 0.5s ease";
  //       additionalInfo.style.overflow = "hidden";
  //       toggleButton.style.transition = "opacity 0.3s ease";

  //       // Start the expansion: set display to block and height from 0
  //       additionalInfo.style.display = "block";
  //       additionalInfo.style.height = "0px";
  //       additionalInfo.offsetHeight; // force reflow
  //       const fullHeight = additionalInfo.scrollHeight;
  //       additionalInfo.style.height = fullHeight + "px";

  //       toggleButton.style.display = "block";
  //       toggleButton.style.opacity = "1";
  //       toggleButton.textContent = "See less";

  //       // Once the expansion transition finishes, scroll to the disclaimer element.
  //       additionalInfo.addEventListener("transitionend", function handler(e) {
  //         if (e.propertyName === "height") {
  //           additionalInfo.removeEventListener("transitionend", handler);
  //           const disclaimerEl = document.getElementById("offerDisclaimer");
  //           if (disclaimerEl && !isElementFullyInViewport(disclaimerEl)) {
  //             disclaimerEl.scrollIntoView({ behavior: "smooth", block: "end" });
  //           }
  //         }
  //       });
  //     } else {
  //       // Mark the card as collapsed.
  //       card.dataset.expanded = "false";
  //       card.classList.remove("expanded");

  //       additionalInfo.style.transition = "height 0.5s ease";
  //       additionalInfo.style.height = "0px";
  //       toggleButton.style.transition = "opacity 0.3s ease";
  //       toggleButton.style.opacity = "0";

  //       additionalInfo.addEventListener("transitionend", function handler(e) {
  //         if (e.propertyName === "height") {
  //           additionalInfo.removeEventListener("transitionend", handler);
  //           additionalInfo.style.display = "none";
  //           toggleButton.textContent = "See more";
  //           toggleButton.style.opacity = "1";
  //         }
  //       });
  //     }
  //   } else {
  //     // Existing logic for non-special cards...
  //     const detailsEl = document.getElementById(`details-${dataProgram}`);
  //     const seeMoreLink = card.querySelector(`[data-target="details-${dataProgram}"]`);
  //     if (!detailsEl || !seeMoreLink) return;
  //     if (expand) {
  //       detailsEl.style.display = "block";
  //       seeMoreLink.textContent = "See less";
  //     } else {
  //       detailsEl.style.display = "none";
  //       seeMoreLink.textContent = "See more";
  //     }
  //   }
  // }

    function isAccordionCard(card) {
    return accordionSelectors.some(sel => card && card.matches(sel));
  }

  function toggleDetails(card, forceExpand = null, skipSync = false) {
    const info = card.querySelector('.additional-info');
    const toggleBtn = card.querySelector('.toggle-details');
    if (!info || !toggleBtn) return;

    const isOpen = card.dataset.expanded === 'true';
    const expandIt = forceExpand === null ? !isOpen : forceExpand;

    if (expandIt) {
      card.dataset.expanded = 'true';
      card.classList.add('expanded');

       if (!skipSync && isAccordionCard(card)) {
        collapseLinkedCards(card);
      }

      info.style.display = 'block';
      info.style.height = '0px';
      info.style.overflow = 'hidden';
      info.offsetHeight;                       // re-flow
      info.style.transition = 'height .4s ease';
      info.style.height = info.scrollHeight + 'px';

      const expandedLabel = toggleBtn.dataset.labelExpanded || 'See less';
      toggleBtn.textContent = expandedLabel;
    } else {
      card.dataset.expanded = 'false';
      card.classList.remove('expanded');

       info.style.overflow = 'hidden';
      info.style.height = '0px';
 const collapseDone = function h(e) {
        if (e.propertyName !== 'height') return;
        info.style.display = 'none';
        info.removeEventListener('transitionend', h);
        info[collapseHandlerKey] = null;
      };
      info[collapseHandlerKey] = collapseDone;
      info.addEventListener('transitionend', collapseDone);
      const collapsedLabel = toggleBtn.dataset.labelCollapsed || 'What’s Included?';
      toggleBtn.textContent = collapsedLabel;
      toggleBtn.textContent = collapsedLabel;
    }

    /* ► keep 4- & 12-week in sync */
    // if (!skipSync && (card.dataset.program === '4-week' || card.dataset.program === '12-week')) {
    //   const partner = document.querySelector(`.offer-card[data-program="${card.dataset.program === '4-week' ? '12-week' : '4-week'}"]`);
    //   if (partner) toggleDetails(partner, expandIt, true);
    // }
  }

    function collapseLinkedCards(activeCard) {
    accordionSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(other => {
        if (!other || other === activeCard) return;
        if (other.dataset.expanded === 'true') {
          toggleDetails(other, false, true);
        }
      });
    });
  }

  document.querySelectorAll('.offer-card .toggle-details').forEach(btn => {
    btn.addEventListener('click', e => {
      const card = btn.closest('.offer-card');
      if (!card) return;

      const label = btn.textContent.trim().toLowerCase();

      if (label === 'see less') {
        /* collapse – behave exactly as before */
        e.stopPropagation();          // don’t trigger card-select
        toggleDetails(card, false);   // close it
      } else {
        /* “see more” – just select the card (which auto-expands) */
        e.stopPropagation();          // block the old handler
        card.click();                 // delegate to the card’s own click-handler
      }
    });
  });

if (kitCard) {
    kitCard.dataset.expanded = kitCard.dataset.expanded === 'true' ? 'true' : 'false';

    const kitToggle = kitCard.querySelector('.toggle-details');
    if (kitToggle) {
      kitToggle.addEventListener('click', e => {
        e.stopPropagation();
        const shouldExpand = kitCard.dataset.expanded !== 'true';
        toggleDetails(kitCard, shouldExpand);
      });
    }

    kitCard.addEventListener('click', e => {
      if (e.target.closest('.toggle-details')) return;
      if (kitCard.dataset.expanded === 'true') return;
      toggleDetails(kitCard, true);
    });
  }

  window.toggleOfferCardDetails = toggleDetails;


  function updateCTA(selectedProgram) {
    const finishBtn = document.getElementById("offerFinishBtn");
    if (!finishBtn) return;
    // if (selectedProgram === "new") {
    //   finishBtn.style.backgroundColor = "#9333EA";
    // } else {
    //   finishBtn.style.backgroundColor = "#007BFF";
    // }
  }
  document.addEventListener('click', e => {
    // if the click wasn’t inside an offer-card or the kit bundle card…
    if (!e.target.closest('.offer-card') && !e.target.closest('.bm-discount-card')) {
      offerCards.forEach(card => {
        // only collapse if currently expanded
        if (card.dataset.expanded === 'true') {
          toggleDetails(card, false);
          card.classList.remove('selected');
        }
      });
            if (kitCard && kitCard.dataset.expanded === 'true') {
        toggleDetails(kitCard, false);
      }
      currentlySelected = null;  // reset selection
    }
  });
});

/**********************************************/
/* E) FINISH BUTTON                           */
/**********************************************/
// document.addEventListener("DOMContentLoaded", function () {
//   const finishBtn = document.getElementById("offerFinishBtn");
//   if (!finishBtn) return;

//   finishBtn.addEventListener("click", () => {
//     const selected = localStorage.getItem("selectedProgram");
//     const map = {
//       "1-week": "oneWeek",
//       "4-week": "fourWeek",
//       "12-week": "twelveWeek",
//       "new": "subscription"
//     };
//     const purchaseType = map[selected];
//     if (!purchaseType) return alert("Please select a program first.");

//     // Check if the 10-minute discount is still active
//     const discountEnd = Number(localStorage.getItem("discountEndTime") || 0);
//     const isDiscountActive = discountEnd > Date.now();

//     // All other plans always go through checkout
//     localStorage.setItem("pendingPurchaseType", purchaseType);

//     // save whatever price was showing on the card
//     (function savePlanPrice() {
//       const card = document.querySelector(`.offer-card[data-program="${selected}"]`);
//       let priceText = "";
//       if (card) {
//         const disc = card.querySelector(".discount-price");
//         if (disc && getComputedStyle(disc).display !== "none") {
//           priceText = disc.textContent.trim();
//         } else {
//           priceText = (card.querySelector(".full-price span") || card.querySelector(".full-price"))
//             .textContent.trim();
//         }
//       }
//       localStorage.setItem("planPrice", priceText);
//     })();

//     // window.location.href = `log-in-checkout.html?plan=${selected}`;
//   });
// });

document.addEventListener("DOMContentLoaded", function () {
  const claimProgramBtn = document.getElementById("claimProgramBtn");
  const continueBtn = document.getElementById("offerFinishBtn");
  if (!claimProgramBtn || !continueBtn) return;

  claimProgramBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // on narrow (≤375px) we want the element 20px *below* the top of the viewport → +20
    // on wider we want it 20px *above* the top → -20
    const isSmall = window.matchMedia("(max-width: 375px)").matches;
    const offset = isSmall ? -15 : 50;

    // absolute Y position of the element
    const elementTop = socialProof.getBoundingClientRect().top + window.pageYOffset;

    window.scrollTo({
      top: elementTop + offset + 150,
      behavior: "smooth"
    });
  });
});


//Testimonials
document.addEventListener("DOMContentLoaded", () => {

  // Fade-in elements
  // const fadeInElements = document.querySelectorAll(".fade-in");
  // fadeInElements.forEach((element, index) => {
  //   setTimeout(() => {
  //     element.classList.add("visible");
  //   }, index * 500);
  // });

  // Example reviews
  const reviews = [
    {
      name: "Lee",
      text:
        "I’d tried bootcamps, meal plans — nothing stuck. This finally made everything click. I’ve lost 10kg, but more than that, I finally feel like myself again.",
      beforeImage: {
        src: "../assets/lynn_before.webp",
        width: 120,
        height: 120,
        alt: "Before"
      },
      afterImage: {
        src: "../assets/lynn_after.webp",
        width: 120,
        height: 120,
        alt: "After"
      },
      testImage: {
        src: "../assets/5-stars.webp",
        width: 100,
        height: 20,
        alt: "5 Stars"
      }
    },
    {
      name: "David",
      text:
        "I used to wing it at the gym and second-guess everything. Seeing my workouts and progress adapt over time changed everything. I’ve gained 6kg of muscle — and confidence too.",
      beforeImage: {
        src: "../assets/harry_chest_before.webp",
        width: 120,
        height: 120,
        alt: "Before"
      },
      afterImage: {
        src: "../assets/harry_chest_after.webp",
        width: 120,
        height: 120,
        alt: "After"
      },
      testImage: {
        src: "../assets/5-stars.webp",
        width: 100,
        height: 20,
        alt: "5 Stars"
      }
    },
    {
      name: "Alice",
      text:
        "Strict plans never worked for me. This didn’t just tell me what to do — it fit into my life. I’ve lost weight, feel healthier, and for the first time, I’m in control of the process.",
      beforeImage: {
        src: "../assets/halima_back_before.webp",
        width: 120,
        height: 120,
        alt: "Before"
      },
      afterImage: {
        src: "../assets/halima_back_after.webp",
        width: 120,
        height: 120,
        alt: "After"
      },
      testImage: {
        src: "../assets/5-stars.webp",
        width: 100,
        height: 20,
        alt: "5 Stars"
      }
    },
  ];

  const testimonialWrapper = document.querySelector(".testimonial-container");
  const sliderContainer = document.querySelector(".testimonial-slider");
  const prevBtn = document.querySelector(".arrow-button.prev");
  const nextBtn = document.querySelector(".arrow-button.next");
  const dotsContainer = document.querySelector(".dots-container");

  // 2) state
  let currentIndex = 0;
  let startX = 0;
  let endX = 0;

  // 3) build the slides
  function createTestimonialCards() {
    sliderContainer.innerHTML = "";
    reviews.forEach((review) => {
      const card = document.createElement("div");
      card.classList.add("testimonial-card");
      card.innerHTML = `
      <div class="images">
        <div class="before">
          <img
            src="${review.beforeImage.src}"
            width="${review.beforeImage.width}"
            height="${review.beforeImage.height}"
            alt="${review.beforeImage.alt}"
            loading="lazy"
            decoding="async"
          >
          <p>Before</p>
        </div>
        <div class="after">
          <img
            src="${review.afterImage.src}"
            width="${review.afterImage.width}"
            height="${review.afterImage.height}"
            alt="${review.afterImage.alt}"
            loading="lazy"
            decoding="async"
          >
          <p>After</p>
        </div>
      </div>
      <p class="review-name">${review.name}</p>
      <div class="five-stars">
        <img
          src="${review.testImage.src}"
          width="${review.testImage.width}"
          height="${review.testImage.height}"
          alt="${review.testImage.alt}"
          loading="lazy"
          decoding="async"
        >
      </div>
      <p class="review-text">${review.text}</p>
    `;
      sliderContainer.appendChild(card);
    });
  }

  // 4) build the dots
  function createDots() {
    dotsContainer.innerHTML = "";
    reviews.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      if (i === currentIndex) dot.classList.add("active");
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateSlider();
      });
      dotsContainer.appendChild(dot);
    });
  }

  // 5) slide logic
  function updateSlider() {
    const width = sliderContainer.clientWidth;
    sliderContainer.style.transform = `translateX(-${currentIndex * width}px)`;
    dotsContainer.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentIndex);
    });
  }
  function goNext() {
    currentIndex = (currentIndex + 1) % reviews.length;
    updateSlider();
  }
  function goPrev() {
    currentIndex = (currentIndex - 1 + reviews.length) % reviews.length;
    updateSlider();
  }

  // 6) swipe on the **wrapper** instead of the inner slider
  function enableSwipe() {
    testimonialWrapper.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });
    testimonialWrapper.addEventListener("touchend", e => {
      endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) goNext();
      else if (endX - startX > 50) goPrev();
    });
  }

  // 7) on resize, recalc
  window.addEventListener("resize", updateSlider);
  // 8) init
  setLoaderScale(1.05);
  startIdlePulse();
  createTestimonialCards();
  createDots();
  enableSwipe();
  nextBtn.addEventListener("click", goNext);
  prevBtn.addEventListener("click", goPrev);
  updateSlider();

  stopIdlePulse();
  fadeOutLoader();
});

function isElementFullyInViewport(el) {
  if (!el) return true;
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.top >= 0 && rect.bottom <= windowHeight;
}

function resetSpecialCard(card) {
  const additionalInfo = card.querySelector(".additional-info");
  const toggleButton = card.querySelector(".toggle-details");
  if (additionalInfo) {
    // Remove transition so the reset happens immediately.
    additionalInfo.style.transition = "none";
    additionalInfo.style.height = "0px";
    additionalInfo.style.display = "none";
  }
  if (toggleButton) {
    toggleButton.textContent = "What’s Included?";
    toggleButton.style.opacity = "1";
  }
  card.classList.remove("expanded");
}

document.addEventListener("DOMContentLoaded", () => {
  const timerContainer = document.getElementById("timerContainer");
  if (!timerContainer) return;

  // We'll store the timer's original distance from the top of the page
  const originalOffset = timerContainer.offsetTop;

  // Create a placeholder div to preserve layout space when the timer goes fixed
  const placeholder = document.createElement("div");
  placeholder.style.height = timerContainer.offsetHeight + "px";

  function onScroll() {
    /*
      If the user has scrolled beyond the timer's original offset,
      we fix it to the top and insert our placeholder (so the rest
      of the content doesn't jump). Otherwise, we remove the fix.
    */
    if (window.pageYOffset > originalOffset) {
      if (!timerContainer.classList.contains("timer-fixed")) {
        // Insert placeholder right before the timer container
        timerContainer.parentNode.insertBefore(placeholder, timerContainer);

        // Make it "fixed" and then slide it down
        timerContainer.classList.add("timer-fixed");
        // Slight delay to ensure the transform transition triggers
        setTimeout(() => {
          timerContainer.classList.add("visible");
        }, 10);
      }
    } else {
      // If we've scrolled back up above original position, un-fix it
      if (timerContainer.classList.contains("timer-fixed")) {
        timerContainer.classList.remove("visible");
        timerContainer.classList.remove("timer-fixed");
        if (placeholder.parentNode) {
          placeholder.parentNode.removeChild(placeholder);
        }
      }
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  // Run once in case the user is already scrolled down on page load
  onScroll();
});

document.addEventListener('DOMContentLoaded', function () {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', function () {
      // Immediately toggle rotation for the plus sign.
      question.classList.toggle('rotated');

      const faqItem = question.parentElement;
      const answer = faqItem.querySelector('.faq-answer');
      const isExpanded = faqItem.classList.contains('active');

      if (isExpanded) {
        // Begin collapse:
        // First, set the max-height to the element’s current full height.
        answer.style.maxHeight = answer.scrollHeight + 'px';
        // Force reflow.
        answer.offsetHeight;
        // Now, use two nested requestAnimationFrame calls so the browser
        // registers the starting height before animating to 0.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            answer.style.maxHeight = '0';
            answer.style.paddingTop = '0';
            answer.style.paddingBottom = '0';
          });
        });

        answer.addEventListener('transitionend', function handler(e) {
          if (e.propertyName === 'max-height') {
            faqItem.classList.remove('active');
            // Reset inline padding (so that expansion picks up the defined CSS padding)
            answer.style.paddingTop = '';
            answer.style.paddingBottom = '';
            answer.removeEventListener('transitionend', handler);
          }
        });
      } else {
        // Begin expansion:
        faqItem.classList.add('active');
        // Remove any inline styles that might interfere
        answer.style.paddingTop = '';
        answer.style.paddingBottom = '';
        // Ensure the answer is visible so we can animate its height
        answer.style.display = 'block';
        // Start with collapsed state.
        answer.style.maxHeight = '0';
        // Force reflow
        answer.offsetHeight;
        // Animate to expanded state (to its full scrollHeight)
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
});

const comparePrompt = document.querySelector(".compare-plans");
if (comparePrompt) {
  comparePrompt.style.display = "block";
  motivationSec.parentNode.insertBefore(comparePrompt, motivationSec);
}

setUpCompareModal();

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

setUpCompareModal0();

function setUpCompareModal0() {
  const link = document.getElementById("comparePlansLink0");
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

(function () {
  const modal = document.getElementById('valueModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.close');
  const contBtn = document.getElementById('valueContinue');
  const skipLink = document.getElementById('valueSkip');
  const planAnchor = document.getElementById('path-to-progress');
  const openBtns = [
    document.getElementById('claimProgramBtn'),
    ...document.querySelectorAll('[data-open-value-modal]')
  ].filter(Boolean);

  function openModal() {
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    initScratchCard();
  }

  // Disable backdrop (outside click) + ESC for the promo modal only
  (function () {
    const promoModal = document.getElementById('valueModal');
    if (!promoModal) return;

    const content = promoModal.querySelector('.modal-content');

    // Block clicks/taps that land on the backdrop
    const blockBackdrop = (e) => {
      if (e.target === promoModal || !content.contains(e.target)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    ['click', 'mousedown', 'touchstart'].forEach(evt =>
      promoModal.addEventListener(evt, blockBackdrop, true) // capture phase
    );

    // Optional: also ignore ESC while this modal is visible
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && promoModal.classList.contains('show')) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true);
  })();

  // --- Scratch Card -------------------------------------------------
  let SCRATCH_INIT = false;

  function initScratchCard() {
    if (SCRATCH_INIT) return;

    const canvas = document.getElementById('scratchCanvas');
    const wrap = canvas ? canvas.closest('.scratch-card') : null;
    const reveal = wrap ? wrap.querySelector('.scratch-reveal') : null;
    const content = reveal ? reveal.querySelector('.reveal-content') : null;
    document.querySelector('#scratchHint .orbit')?.remove();
    const continueBtn = document.getElementById('valueContinue');

    if (!canvas || !wrap || !reveal || !continueBtn) return;

        if (!document.body.classList.contains('discount-active')) {
      wrap.classList.add('promo-expired');
      continueBtn.disabled = false;
      continueBtn.classList.remove('locked');
      continueBtn.style.removeProperty('background');
      continueBtn.style.removeProperty('background-image');
      return;
    }

    SCRATCH_INIT = true;

    {
      const fullName = localStorage.getItem('name') || '';
      const firstName = (fullName.split(' ')[0] || 'user')
        .replace(/[^a-z0-9]/gi, '-')   // normalize to letters/numbers/hyphen
        .replace(/-+/g, '-')           // collapse multiple hyphens
        .replace(/^-|-$/g, '');        // trim hyphens
      const promoCode = `${firstName}-51-OFF`.toUpperCase();
      localStorage.setItem('appliedPromoCode', promoCode);

      // write to both the modal and the pricing strip if present
      const targets = [
        document.getElementById('promoCodeValue'),     // modal code (id)
        document.getElementById('promoStripCode'),     // strip code (id)
        document.querySelector('.promo-code-value')    // modal code (class fallback)
      ].filter(Boolean);
      targets.forEach(el => el.textContent = promoCode);
    }

    // Lock the Continue button initially
    continueBtn.disabled = true;
    continueBtn.classList.add('locked');
    continueBtn.style.setProperty('background', '#004a99', 'important');
    continueBtn.style.setProperty('background-image', 'none', 'important');

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // ---- state (declare BEFORE any calls that read them)
    let finished = false;
    let scratching = false;
    let idleTimer = null;

    const hintText = document.querySelector('#scratchHint .hint-copy');

    // ---- Ghost finger zigzag animation (no extra HTML needed)
    reveal.style.position = reveal.style.position || 'relative';
    reveal.style.overflow = 'hidden';

    const ghost = document.createElement('div');
    const DOT = 28;                 // ghost diameter (px)
    const PAD = 10;                 // inner padding from edges
    ghost.id = 'scratchGhost';
    ghost.style.cssText = `
  position: absolute;
  left: 0; top: 0;              /* we’ll move it via translate() */
  width: ${DOT}px; height: ${DOT}px;
  border: 3px solid rgba(0,0,0,0.35);
  border-radius: 50%;
  pointer-events: none;
  z-index: 5;
  opacity: 0;
  transition: opacity .25s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,.15);
  transform: translate(0,0);
`;
    reveal.appendChild(ghost);

    let gx = PAD, gy = PAD;
    let vx = 2.2, vy = 1.6;
    let ghostActive = false;

    function bounds() {
      const w = reveal.clientWidth;
      const h = reveal.clientHeight;
      return {
        minX: PAD, minY: PAD,
        maxX: w - PAD - DOT, maxY: h - PAD - DOT
      };
    }

    function placeGhost() {
      ghost.style.transform = `translate(${gx}px, ${gy}px)`;
    }

    function animateGhost() {
      if (!ghostActive) return;
      const b = bounds();
      gx += vx; gy += vy;
      if (gx <= b.minX || gx >= b.maxX) vx *= -1;
      if (gy <= b.minY || gy >= b.maxY) vy *= -1;
      gx = Math.min(Math.max(gx, b.minX), b.maxX);
      gy = Math.min(Math.max(gy, b.minY), b.maxY);
      placeGhost();
      requestAnimationFrame(animateGhost);
    }

    function startGhost() {
      if (ghostActive || finished) return;
      const b = bounds();
      gx = Math.min(Math.max(reveal.clientWidth * 0.35, b.minX), b.maxX);
      gy = Math.min(Math.max(reveal.clientHeight * 0.35, b.minY), b.maxY);
      placeGhost();
      ghostActive = true;
      ghost.style.opacity = '1';
      animateGhost();
    }
    function stopGhost() {
      ghostActive = false;
      ghost.style.opacity = '0';
    }

    /* Hint helpers now drive the ghost (old orbit hint is removed above) */
    function showHint() {
      if (!finished) {
        startGhost();
        if (hintText) hintText.style.opacity = '1';
      }
    }
    function hideHint() {
      stopGhost();
      if (hintText) hintText.style.opacity = '0';
    }
    function scheduleHint() {
      clearTimeout(idleTimer);
      if (!finished) idleTimer = setTimeout(showHint, 3000);
    }

    /* keep ghost in-bounds if size changes */
    const clampGhostToBounds = () => {
      const b = bounds();
      gx = Math.min(Math.max(gx, b.minX), b.maxX);
      gy = Math.min(Math.max(gy, b.minY), b.maxY);
      placeGhost();
    };

    // ---- sizing + paint
    function sizeCanvas() {
      const cssW = reveal.clientWidth;
      const contentH = Math.ceil((content?.scrollHeight || 148));
      const cssH = Math.max(148, contentH + 10);

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      // reset transform before resizing
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.scale(dpr, dpr);

      paintCover(cssW, cssH);
    }

    function paintCover(w, h) {
      // branded blue gradient + texture
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#007BFF');
      grad.addColorStop(1, '#339CFF');

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const step = 10;
      ctx.globalAlpha = 0.25;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          ctx.fillStyle = ((x + y) % (step * 2)) ? '#ffffff' : '#003F80';
          ctx.fillRect(x, y, 2, 2);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out'; // ready to scratch
    }

    // ---- scratch interaction
    const brush = 30;

    function scratch(x, y) {
      ctx.beginPath();
      ctx.arc(x, y, brush, 0, Math.PI * 2);
      ctx.fill();
    }

    function pointerPos(e) {
      const r = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }

    function scratchPoint(e) {
      const { x, y } = pointerPos(e);
      scratch(x, y);
    }

    function start(e) {
      scratching = true;
      reveal.classList.add('scratching');
      hideHint();
      clearTimeout(idleTimer);
      scratchPoint(e);
      e.preventDefault();
    }

    function move(e) {
      if (!scratching) return;
      scratchPoint(e);
      e.preventDefault();
    }

    function end() {
      scratching = false;
      reveal.classList.remove('scratching');
      if (!finished) scheduleHint();
      maybeFinish();
    }

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);

    // ---- completion calc
    function clearedRatio() {
      const { width, height } = canvas;
      const sample = ctx.getImageData(0, 0, width, height).data;
      let clear = 0;
      for (let i = 3; i < sample.length; i += 4) if (sample[i] === 0) clear++;
      return clear / (sample.length / 4);
    }

    function maybeFinish() {
      if (finished) return;
      if (clearedRatio() > 0.6) {
        finished = true;
        wrap.classList.add('scratch-done');
        hideHint();
        clearTimeout(idleTimer);

        continueBtn.disabled = false;
        continueBtn.classList.remove('locked');
        continueBtn.style.removeProperty('background');
        continueBtn.style.removeProperty('background-image');
        continueBtn.focus();

        try { window.sendAnalytics?.('scratch_revealed', { pct: 100 }); } catch { }
      }
    }

    // ---- reset button (optional)
    document.getElementById('scratchReset')?.addEventListener('click', () => {
      wrap.classList.remove('scratch-done');
      finished = false;
      sizeCanvas();
      showHint();
      continueBtn.disabled = true;
      continueBtn.classList.add('locked');
      continueBtn.style.setProperty('background', '#004a99', 'important');
      continueBtn.style.setProperty('background-image', 'none', 'important');
    });

    // ---- mirror timer(s)
    const src = document.getElementById('countdownTimer');
    const mirror = document.getElementById('scratchMirrorTimer');
    const note = document.getElementById('scratchMirrorTimerNote');
    if (src) {
      const sync = () => {
        if (mirror) mirror.textContent = src.textContent;
        if (note) note.textContent = src.textContent;
      };
      const obs = new MutationObserver(sync);
      obs.observe(src, { childList: true, characterData: true, subtree: true });
      sync();
    }

    // ---- kick off
    sizeCanvas();
    showHint();
    clampGhostToBounds();
    window.addEventListener('resize', () => {
      if (!wrap.classList.contains('scratch-done')) sizeCanvas();
    }, { passive: true });
  }

  function closeModal() {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }

  // only open if you haven’t scrolled past pricing
  openBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      const pricingTop = planAnchor.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY + 150 < pricingTop) {
        e.preventDefault();
        openModal();
      }
    });
  });

  // hook up the buttons
  closeBtn?.addEventListener('click', closeModal);
  contBtn?.addEventListener('click', closeModal);
  skipLink?.addEventListener('click', e => { e.preventDefault(); closeModal(); });

  // clicking on the backdrop
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  // ← remove any immediate calls to remove .show or .modal-open here!
})();

//   const loadingSection = document.getElementById('loadingSection');

// document.addEventListener('DOMContentLoaded', () => {
//   const continueBtn = document.getElementById('offerFinishBtn');
//   const cardsSection = document.getElementById('offerCardsContainer');
//   const paymentSection = document.getElementById('paymentSection');
//   const socialProof = document.getElementById('socialProof');
//   const loadingSection = document.getElementById('loadingSection');
//   const loadingText = document.getElementById('loadingText');
//   const postPayNote = document.getElementById('postPayNote');
//   const paymentCloseBtn = document.getElementById('paymentCloseBtn');
//   const offerCards = document.querySelectorAll('.offer-card');

//   let dotsIntervalId;
//   let loadingTimeoutId;
//   let cancelled = false;

//   function collapseAllCards() {
//     offerCards.forEach(card => {
//       if (card.dataset.expanded === 'true') {
//         // use your existing helper so the animation & clean‑up run
//         if (typeof toggleDetails === 'function') {
//           toggleDetails(card, false);          // force‑collapse
//         } else {
//           // fall‑back: hard reset
//           card.classList.remove('expanded');
//           card.dataset.expanded = 'false';
//           const info = card.querySelector('.additional-info');
//           if (info) { info.style.display = 'none'; info.style.height = '0'; }
//           const btn = card.querySelector('.toggle-details');
//           if (btn) { btn.textContent = "What’s Included?"; }
//         }
//       }
//     });
//   }

//   if (!continueBtn || !cardsSection || !paymentSection) return;

//   continueBtn.addEventListener('click', () => {
//     collapseAllCards();
//     // reset cancel flag
//     cancelled = false;

//     // 1) hide offers
//     cardsSection.style.display = 'none';
//     // 2) show social proof
//     socialProof.style.display = 'block';
//     // 3) show loading, hide payment UI
//     loadingSection.style.display = 'block';
//     paymentSection.style.display = 'none';
//     postPayNote.style.display = 'none';

//     // 4) start dot animation
//     let dots = 1;
//     clearInterval(dotsIntervalId);
//     dotsIntervalId = setInterval(() => {
//       loadingText.textContent = 'Loading' + '.'.repeat(dots);
//       dots = dots % 3 + 1;
//     }, 500);

//     // 5) after 2s, if not cancelled, swap in payment UI
//     clearTimeout(loadingTimeoutId);
//     loadingTimeoutId = setTimeout(() => {
//       if (cancelled) return;

//       clearInterval(dotsIntervalId);
//       loadingSection.style.display = 'none';
//       paymentSection.style.display = 'block';
//       postPayNote.style.display = 'block';

//       // focus first stripe field
//       const firstInput = paymentSection.querySelector(
//         'iframe, input, button, select, textarea'
//       );
//       firstInput?.focus();
//     }, 2000);
//   });

//   // clicking the ✕
//   paymentCloseBtn?.addEventListener('click', () => {
//     // mark as cancelled
//     cancelled = true;
//     continueBtn.disabled = false;
//     // kill any pending timers
//     clearInterval(dotsIntervalId);
//     clearTimeout(loadingTimeoutId);
//     // hide everything
//     paymentSection.style.display = 'none';
//     loadingSection.style.display = 'none';
//     postPayNote.style.display = 'none';
//     // show offers again
//     cardsSection.style.display = 'flex';
//   });
// });

window.addEventListener('popstate', () => {
  const paymentSection = document.getElementById('paymentSection');
  const cardsSection = document.getElementById('offerCardsContainer');
  if (!paymentSection) return;

  const open = !paymentSection.classList.contains('preload-hide') &&
    paymentSection.style.display !== 'none';

  if (open) {
    paymentSection.classList.add('preload-hide');
    paymentSection.style.display = 'none';
    document.getElementById('postPayNote')?.style.setProperty('display', 'none');
    cardsSection.style.display = 'flex';
    // neutralize the pushed state
    if (history.state && history.state.paymentOpen) {
      history.replaceState(null, '', location.href);
    }
  }
});

/* --- helpers ---------------------------------------------------- */
// the card the user last chose
function getSelectedCard() {
  const id = localStorage.getItem('selectedProgram');
  return document.querySelector(`.offer-card[data-program="${id}"]`);
}

// read whatever price is currently visible on that card
function extractDisplayedPrice(card) {
  if (!card) return '';
  const disc = card.querySelector('.discount-price');
  if (disc && getComputedStyle(disc).display !== 'none') {
    return disc.textContent.trim();        // £0.00 (discount still live)
  }
  const full = card.querySelector('.full-price span')
    || card.querySelector('.full-price');
  return full.textContent.trim();          // £29.99 (normal price)
}

function updatePlanSummary() {
  const el = document.getElementById('planSummary');
  const planName = localStorage.getItem('planName') || 'Your plan';
  const dealOn = document.body.classList.contains('discount-active');
  const { code, full, intro } = getLocalPrices();

  if (planName === 'Pro Tracker' && dealOn) {
    el.innerHTML = `
      <span class="plan-name">${planName}</span>
      <span class="plan-divider">–</span>
      <span class="old-price">${fmt(code, full)}</span>
      <span class="new-price">${fmt(code, intro)}</span>`;
    localStorage.setItem('planPrice', fmt(code, intro));
  } else {
    el.textContent = `${planName} – ${fmt(code, dealOn ? intro : full)}`;
    localStorage.setItem('planPrice', fmt(code, dealOn ? intro : full));
  }
}

// call it once on load
document.addEventListener("DOMContentLoaded", updatePlanSummary);

document.addEventListener("DOMContentLoaded", () => {
  const fullName = localStorage.getItem("name") || "";
  const firstName = fullName.split(" ")[0] || "";
  const header = document.getElementById("valueModalHeader");
  if (header) {
    header.textContent = firstName
      ? `🎁 ${firstName}, scratch to unlock your promo`
      : "🎁 Scratch to unlock your promo";
    const promoLine = document.getElementById("promoCodeLine");
    if (promoLine) {
      const code = `${firstName.toLowerCase()}-100-OFF`;
      promoLine.innerHTML = `
    <span class="promo-code-label">Your code:</span>
    <code class="promo-code-value">${code}</code>
  `;
    }
  }
});

/* ---------- PayPal ⇆ Card tab switcher – standalone ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  // const bar = document.getElementById('pay-toggle');        // container with the two buttons
  // if (!bar) return;

  // const slider     = bar.querySelector('.toggle-slider');   // the moving underline
  // const marks      = document.getElementById('paypalMarkContainer'); // may be null (you've commented it out)
  // const ppBtnWrap  = document.getElementById('paypal-btn');          // where PayPal SDK renders
  // const stripeForm = document.getElementById('paymentForm');         // Stripe form

  // function show(tab) {
  //   // highlight active tab
  //   bar.querySelectorAll('button').forEach(b =>
  //     b.classList.toggle('active', b.dataset.pay === tab)
  //   );

  //   // move slider if it exists
  //   if (slider) {
  //     slider.style.left = tab === 'paypal' ? 'var(--pad)' : 'calc(50% + var(--pad))';
  //   }

  //   // flip visibility (guard nulls)
  //   const isPaypal = tab === 'paypal';
  //   if (marks)      marks.style.display     = isPaypal ? 'block' : 'none';
  //   if (ppBtnWrap)  ppBtnWrap.style.display = isPaypal ? 'block' : 'none';
  //   if (stripeForm) stripeForm.style.display = isPaypal ? 'none'  : 'block';
  // }

  // bar.addEventListener('click', (e) => {
  //   const btn = e.target.closest('button[data-pay]');
  //   if (btn) show(btn.dataset.pay);
  // });

  const stripeForm = document.getElementById('paymentForm');
  if (stripeForm) stripeForm.style.display = 'block';

  // replace hard-coded £49.99/month text with localized value
  const p = document.getElementById('offerDisclaimer');
  if (p) {
    const { code, full } = getLocalPrices();
    p.innerHTML = p.innerHTML.replace(/£49\.99\/month/g, `${fmt(code, full)}/month`);
  }

  // show('paypal'); // default to PayPal on load
});

document.addEventListener('DOMContentLoaded', () => {
  updatePostPayNote();
});

const bodyFatRanges = {
  slim: '14-18%',
  average: '20-24%',
  heavy: '28-32%'
};

// ② Set this however you already know the user’s type
const currentBodyType = window.userBodyType || 'average';   // slim | average | heavy

// ③ Populate the “Now” body‑fat %
document.getElementById('bodyFatNow').textContent =
  bodyFatRanges[currentBodyType] || '—';

// ④ Utility to render the muscle bars
function renderMuscleBars(el, filledCount) {
  el.innerHTML = '';                          // wipe existing
  for (let i = 0; i < 5; i++) {
    const bar = document.createElement('span');
    bar.className = 'btp-bar' + (i < filledCount ? ' filled' : '');
    el.appendChild(bar);
  }
}

// Now  ► 1 bar | Goal ► 5 bars
renderMuscleBars(document.getElementById('muscleBarsNow'), 1);
renderMuscleBars(document.getElementById('muscleBarsGoal'), 5);

document.addEventListener('DOMContentLoaded', () => {
  // Build promo code (ALL CAPS)
  const fullName = localStorage.getItem('name') || '';
  const firstName = (fullName.split(' ')[0] || 'user')
    .replace(/[^a-z0-9]/gi, '-')       // normalize
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const promoCode = `${firstName}-51-OFF`.toUpperCase();

  // Persist & render in both places (modal + strip)
  localStorage.setItem('appliedPromoCode', promoCode);
  ['promoStripCode', 'promoCodeValue'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = promoCode;
  });

  // Promo strip behavior
  const strip = document.getElementById('promoAppliedStrip');
  const timerEl = document.getElementById('promoStripTimer');
  const src = document.getElementById('countdownTimer');

  if (strip) {
    // visibility follows discount-active class
    const refresh = () => { strip.hidden = !document.body.classList.contains('discount-active'); };
    refresh();
    const visIv = setInterval(refresh, 800); // lightweight sync with your timer
    // clean up on unload (optional)
    window.addEventListener('beforeunload', () => clearInterval(visIv));
  }

  // Mirror timer into strip
  if (src && timerEl) {
    const sync = () => { timerEl.textContent = src.textContent; };
    const obs = new MutationObserver(sync);
    obs.observe(src, { childList: true, characterData: true, subtree: true });
    sync();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const link   = document.getElementById('offerLearnMore');
  const info   = document.querySelector('.offer-card.offer-special .additional-info'); // id="info-new"
  const toggle = document.querySelector('.offer-card.offer-special .toggle-details');

  if (!link || !info) return;

  link.addEventListener('click', (e) => {
    e.preventDefault();

    // Open the panel if it’s closed
    if (info.style.display === 'none' || getComputedStyle(info).display === 'none') {
      info.style.display = 'block';
      if (toggle) toggle.textContent = 'See less';
    }

    // Scroll to the revealed content
    info.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Optional: brief highlight so users notice it
    info.classList.add('peek');
    setTimeout(() => info.classList.remove('peek'), 900);
  });
});