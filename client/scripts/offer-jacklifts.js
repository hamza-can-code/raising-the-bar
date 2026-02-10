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

const DISCOUNT_STATE_EVENT = 'rtb:discount-state';
let lastDiscountActive = null;

function isDiscountActive() {
  return document.body.classList.contains('discount-active');
}

function setDiscountActive(active, { force = false } = {}) {
  const prev = isDiscountActive();
  const next = !!active;
  document.body.classList.toggle('discount-active', next);
  lastDiscountActive = next;
  if (force || prev !== next) {
    document.dispatchEvent(new CustomEvent(DISCOUNT_STATE_EVENT, {
      detail: { active: next }
    }));
  }
}

// legacy scratch-card helper (now used to sync the wheel discount state)
function updateScratchDiscountContent(active) {
  setDiscountActive(!!active, { force: true });
}

const discountClassObserver = new MutationObserver(() => {
  const current = isDiscountActive();
  if (current === lastDiscountActive) return;
  lastDiscountActive = current;
  document.dispatchEvent(new CustomEvent(DISCOUNT_STATE_EVENT, {
    detail: { active: current }
  }));
});

document.addEventListener('DOMContentLoaded', () => {
  lastDiscountActive = isDiscountActive();
  document.dispatchEvent(new CustomEvent(DISCOUNT_STATE_EVENT, {
    detail: { active: lastDiscountActive }
  }));
  discountClassObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
});
window.RTB_PRICE_TABLE = {
  GBP: { full: 59.99, weekly: 14.99, intro: 29.99 },
  USD: { full: 71.99, weekly: 17.99, intro: 35.99 },
  EUR: { full: 68.99, weekly: 17.49, intro: 34.49 },
  SEK: { full: 747, weekly: 187, intro: 373 },
  NOK: { full: 777, weekly: 194, intro: 388 },
  DKK: { full: 537, weekly: 134, intro: 269 },
  CAD: { full: 89.99, weekly: 22.49, intro: 44.99 },
  CHF: { full: 74.99, weekly: 18.74, intro: 37.49 },
  AUD: { full: 104.99, weekly: 26.24, intro: 52.49 },
  NZD: { full: 98.99, weekly: 24.74, intro: 49.49 },
  SGD: { full: 89.99, weekly: 22.49, intro: 44.99 },
  HKD: { full: 507, weekly: 127, intro: 254 },
  JPY: { full: 10770, weekly: 2693, intro: 5385 },
  INR: { full: 4497, weekly: 1124, intro: 2248 },
  BRL: { full: 329.99, weekly: 82.49, intro: 164.99 },
  MXN: { full: 1377, weekly: 344, intro: 688 },
};

// GBP anchor values for each plan. Converted using RTB_CURRENCY fxFromGBP.
const PLAN_PRICING_GBP = {
  trial: {
    name: '1-Week Plan',
    full: 4.99,
    renewal: 19.99,
    discount: null,
  },
  '4-week': {
    name: '4-Week Plan',
    full: 19.99,
    renewal: 19.99,
    discount: 9.99,
  },
  '12-week': {
    name: '12-Week Plan',
    full: 39.99,
    renewal: 39.99,
    discount: 19.99,
  },
};
window.RTB_PLAN_PRICING = PLAN_PRICING_GBP;

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
// function getWeeklyAmount(row) {
//   if (!row) return 0;
//   if (typeof row.weekly === 'number') return row.weekly;
//   if (typeof row.full === 'number') return row.full / 4;
//   return 0;
// }
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

function getPlanPricing(planId, discounted = isDiscountActive()) {
  const plan = PLAN_PRICING_GBP[planId] || PLAN_PRICING_GBP.trial;
  const currency = getCurrency();
  const todayGbp = discounted && plan.discount ? plan.discount : plan.full;
  const renewalGbp = plan.renewal ?? plan.full;
  const todayLocal = toLocal(todayGbp);
  const renewalLocal = toLocal(renewalGbp);

  return {
    id: planId,
    name: plan.name,
    todayGbp,
    renewalGbp,
    todayLocal,
    renewalLocal,
    todayFormatted: formatLocal(todayGbp),
    renewalFormatted: formatLocal(renewalGbp),
    currencyCode: currency.code,
    minor: currency.minor ?? 2,
    discountedApplied: Boolean(discounted && plan.discount),
  };
}
window.RTB_getPlanPricing = getPlanPricing;
function localizeProTrackerCard() {
  const dealOn = document.body.classList.contains('discount-active');
  const card = document.querySelector('.offer-card[data-program="new"]');
  if (!card) return;

  const fullEl = document.getElementById('priceSpecialFull');
  const discEl = document.getElementById('priceSpecialDiscount');
  const ccyTag = card.querySelector('.currency-tag');
  const perDayEl = document.getElementById('costPerDaySpecial');
  // const perDayLabel = card.querySelector('.per-day');

  const { code, full, intro } = getLocalPrices();

  if (fullEl) fullEl.textContent = fmt(code, full);
  if (discEl) discEl.textContent = dealOn ? fmt(code, intro) : '';
  if (ccyTag) ccyTag.textContent = code;

  const shown = dealOn ? intro : full;
  if (perDayEl) perDayEl.textContent = fmt(code, shown / 30);
  // if (perDayLabel) perDayLabel.textContent = 'per day';
}

function updateOfferCardsPricing() {
  const offerCards = document.querySelectorAll('.offer-card');
  const perDayDivisors = { trial: 7, '4-week': 31, '12-week': 92 };
  offerCards.forEach(card => {
    const planId = card.dataset.program;
    const pricing = getPlanPricing(planId, isDiscountActive());
    const fullPriceEl = card.querySelector('.price-value');
    const strikeEl = card.querySelector('.price-strikethrough');
    const discountEl = card.querySelector('.discount-price');
    const perDayEl = card.querySelector('.cost-per-day strong');

    if (strikeEl) {
      strikeEl.classList.remove('no-strike');
      strikeEl.style.textDecoration = '';
    }

    if (pricing.discountedApplied && strikeEl && discountEl) {
      strikeEl.textContent = formatLocal(pricing.renewalGbp);
      strikeEl.style.display = 'inline';
      strikeEl.classList.remove('no-strike');
      discountEl.textContent = pricing.todayFormatted;
      discountEl.style.display = 'inline';
      if (fullPriceEl) fullPriceEl.style.display = 'none';
    } else {
      if (strikeEl) {
        strikeEl.textContent = pricing.todayFormatted;
        strikeEl.style.display = 'inline';
        strikeEl.classList.add('no-strike');
        strikeEl.style.textDecoration = 'none';
      }
      if (discountEl) discountEl.style.display = 'none';
      if (fullPriceEl) {
        fullPriceEl.style.display = 'inline';
        fullPriceEl.textContent = pricing.todayFormatted;
      }
    }

    const divisor = perDayDivisors[planId] || 30;
    if (perDayEl) {
      const perDayGbp = pricing.todayGbp / divisor;
      perDayEl.textContent = formatLocal(perDayGbp);
    }
  });
}

function updatePricingJustification() {
  const el = document.querySelector('.pricing-justification');
  if (!el) return;

  const planId = localStorage.getItem('selectedProgram') || 'trial';
  const plan = PLAN_PRICING_GBP[planId] || PLAN_PRICING_GBP.trial;
  const dealOn = document.body.classList.contains('discount-active');
  const discountToday = dealOn && plan.discount;
  const originalGbp = plan.renewal ?? plan.full;
  const todayGbp = discountToday ? plan.discount : plan.full;

  if (discountToday) {
    const original = formatLocal(originalGbp);
    const today = formatLocal(todayGbp);
    el.innerHTML = `Normally ${original}, now just <strong>${today}</strong>.`;
  } else {
    el.textContent = 'Like having a personal trainer in your pocket — for less than the cost of one session.';
  }
}

function updateOfferDisclaimer(pricing = null) {
  const disclaimer = document.getElementById('offerDisclaimer');
  if (!disclaimer) return;
  const selectedPricing = pricing || getPlanPricing(localStorage.getItem('selectedProgram') || 'trial');
  const renewalAmount = selectedPricing?.renewalFormatted || '';
  const renewalLine = selectedPricing?.id === 'trial'
    ? `Your plan renews at <span class="renew-amt">${renewalAmount}</span> in 1 week, then <span class="renew-amt">${renewalAmount}</span>/month unless cancelled.`
    : `Your plan renews every 30 days at <span class="renew-amt">${renewalAmount}</span>/month unless cancelled.`;
  disclaimer.innerHTML = `
By continuing, you agree to our
<a href="tos.html" target="_blank" class="legal-link">terms</a> and
<a href="refund-policy.html" target="_blank" class="legal-link">refund policy</a>.
${renewalLine}
Covered by
<a href="#moneyBackGuarantee" id="moneyBackGuaranteeLink" class="mbg-scroll-link">
  Money-Back Guarantee
</a>.
Need reassurance?
<button type="button" class="rating-summary__link reassurance__reviews-link" id="reassuranceReviewsLink">
  Read reviews
</button>
`;
}

document.addEventListener('DOMContentLoaded', () => {
  const selected = localStorage.getItem('selectedProgram') || 'trial';
  const pricing = persistSelectedPlanState(selected);
  if (pricing) {
    document.querySelectorAll('.renew-amt').forEach(el => {
      el.textContent = pricing.renewalFormatted;
    });
  }
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
  let goalTimelineLabel = '';

  const normalizedGender = (gender || '').toLowerCase();
  const genderSuffix = normalizedGender === 'female' ? '-f' : '';
  const bodyTypeImgMap = {
    slim: `slim${genderSuffix}.webp`,
    average: `average${genderSuffix}.webp`,
    heavy: `heavy${genderSuffix}.webp`,
    athlete: `athlete${genderSuffix}.webp`,
    hero: `hero${genderSuffix}.webp`,
    bodybuilder: `muscular-silhouette${genderSuffix}.webp`
  };
  // Return an absolute/relative path to your assets folder:
  const imgSrc = (file) => `../assets/${file}`;

  // const updateSocialProofCoach = () => {
  //   const coachImg = document.querySelector('.social-proof__coach');
  //   if (!coachImg) return;

  //   const desiredBodyType = (localStorage.getItem('desiredBodyType') || '').toLowerCase();
  //   const dreamMap = {
  //     athlete: `athlete${genderSuffix}.webp`,
  //     hero: `hero${genderSuffix}.webp`,
  //     bodybuilder: `muscular-silhouette${genderSuffix}.webp`
  //   };
  //   const fallbackFile = `muscular-silhouette${genderSuffix}.webp`;
  //   const selectedFile = dreamMap[desiredBodyType] || fallbackFile;

  //   const formatLabel = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
  //   const genderLabel = normalizedGender === 'female' ? 'Female' : 'Male';
  //   const dreamLabel = formatLabel(desiredBodyType) || 'Coach';

  //   coachImg.src = imgSrc(selectedFile);
  //   coachImg.alt = `${genderLabel} ${dreamLabel} physique illustration`;
  // };

  const updateSocialProofCoach = () => {
  const coachImg = document.querySelector('.social-proof__coach');
  if (!coachImg) return;

  coachImg.src = imgSrc('jacklifts-coach.jpg');
  coachImg.alt = 'Coach jacklifts';
};

  updateSocialProofCoach();

  // Retrieve all offers
  const oneWeekProgram = JSON.parse(localStorage.getItem("oneWeekProgram"));
  const fourWeekProgram = JSON.parse(localStorage.getItem("fourWeekProgram"));
  const twelveWeekProgram = JSON.parse(localStorage.getItem("twelveWeekProgram"));

  const namePrompt = document.getElementById("offerNamePrompt");
  const updateOfferNamePrompt = (active = isDiscountActive()) => {
    if (!namePrompt) return;
    namePrompt.textContent = `${name || "Athlete"}, claim your personalized plan now`;
  };

  updateOfferNamePrompt();
  document.addEventListener(DISCOUNT_STATE_EVENT, (e) => {
    updateOfferNamePrompt(!!(e.detail && e.detail.active));
  });

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
    goalTimelineLabel = `${days} day${days === 1 ? '' : 's'}`;
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
      we've built you a personalized plan to help you lose
      <strong>${diffDisplay.toFixed(1)} ${weightUnit}</strong>.
    `;
  }
  else if (userGoal === "gain muscle") {
    const diffKg = goalKg - currentKg;
    const diffDisplay = weightUnit === "lbs"
      ? kgToLbs(diffKg)
      : diffKg;
    heroLine1 = `
      ${name}, we've built you a personalized plan to help you gain
      <strong>${diffDisplay.toFixed(1)} ${weightUnit}</strong>
      of muscle.
    `;
  }
  else /* improve body composition */ {
    const targetDisplay = weightUnit === "lbs"
      ? kgToLbs(goalKg)
      : goalKg;
    heroLine1 = `
      ${name}, we've built you a personalized plan to help you reach
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
      met: "Make this your best transformation yet - ready for the sun, the camera, and the mirror by {eventMonth}.",
      notMet: "Make this your best transformation yet - ready for the sun, the camera, and the mirror by {eventMonth}."
    },
    {
      goalDriver: "A recent breakup or life change",
      met: "You’ve been through a lot - now rebuild, stronger than before.",
      notMet: "You’ve been through a lot - now rebuild, stronger than before."
    },
    {
      goalDriver: "I want to feel confident in my body again",
      met: "Start showing up for the version of you that’s been waiting to reappear.",
      notMet: "Start showing up for the version of you that’s been waiting to reappear."
    },
    {
      goalDriver: "I'm tired of feeling tired or unmotivated",
      met: "You don’t have to run on empty anymore - let’s rebuild your energy from the inside out.",
      notMet: "You don’t have to run on empty anymore - let’s rebuild your energy from the inside out."
    },
    {
      goalDriver: "I’m doing this for my mental and emotional health",
      met: "Feel more grounded, in control, and emotionally lighter - this is about you, not just your body.",
      notMet: "Feel more grounded, in control, and emotionally lighter - this is about you, not just your body."
    },
    {
      goalDriver: "I’ve let things slip and want to get back on track",
      met: "Get back in control - with momentum, structure, and progress you can feel by {eventMonth}.",
      notMet: "Get back in control - with momentum, structure, and progress you can feel by {eventMonth}."
    },
    {
      goalDriver: "I want to build discipline and stop starting over",
      met: "Consistency beats motivation - and this time, you’ve got a system built to last.",
      notMet: "Consistency beats motivation - and this time, you’ve got a system built to last."
    },
    {
      goalDriver: "I just feel ready for a change",
      met: "Sometimes a fresh start is the strongest decision you can make - let’s make it count.",
      notMet: "Sometimes a fresh start is the strongest decision you can make - let’s make it count."
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

  const updateOfferCardHighlights = () => {
    const workoutsLineEl = document.getElementById('offerWorkoutsLine');
    const mealsLineEl = document.getElementById('offerMealsLine');
    const emotionLineEl = document.getElementById('offerEmotionLine');

    if (!workoutsLineEl && !mealsLineEl && !emotionLineEl) return;

    const formatWeightAmount = (kgValue) => {
      if (!Number.isFinite(kgValue)) return '';
      const absoluteKg = Math.abs(kgValue);
      if (absoluteKg <= 0) return '';
      const converted = weightUnit === 'lbs' ? kgToLbs(absoluteKg) : absoluteKg;
      const digits = converted >= 10 ? 0 : 1;
      const formatted = parseFloat(converted.toFixed(digits));
      return `${formatted} ${weightUnit}`;
    };

    const timelineText = (() => {
      if (goalTimelineLabel) return goalTimelineLabel;
      if (userGoalDateStr) {
        const today = new Date();
        const target = new Date(userGoalDateStr);
        const diff = Math.max(1, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));
        return `${diff} day${diff === 1 ? '' : 's'}`;
      }
      return '';
    })();
    const timelineSegment = timelineText ? `in ${timelineText}` : 'on your timeline';

    let workoutsCopy = '';
    if (userGoal === 'lose weight') {
      const diffLabel = formatWeightAmount(currentKg - goalKg);
      workoutsCopy = diffLabel
        ? `Workouts that'll burn ${diffLabel} ${timelineSegment}`
        : `Workouts that keep you burning fat ${timelineSegment}`;
    } else if (userGoal === 'gain muscle') {
      const diffLabel = formatWeightAmount(goalKg - currentKg);
      workoutsCopy = diffLabel
        ? `Workouts that'll build ${diffLabel} of muscle ${timelineSegment}`
        : `Workouts that keep you building muscle ${timelineSegment}`;
    } else {
      const targetLabel = formatWeightAmount(goalKg || currentKg);
      workoutsCopy = targetLabel
        ? `Workouts that'll get you to your goal weight of ${targetLabel} ${timelineSegment}`
        : `Workouts that keep you sculpting lean muscle ${timelineSegment}`;
    }

    const mealsCopyMap = {
      'lose weight': 'Meals that lose fat without feeling deprived.',
      'gain muscle': 'Meals that put on muscle without gaining fat or feeling bloated.',
      'improve body composition': 'Meals that gain muscle and lose fat without complicating the process.',
    };
    const mealsCopy = mealsCopyMap[userGoal] || 'Meals that keep you energized without complicating the process.';

    const heroTriggerRaw = (heroLine2 || '').replace(/<[^>]*>/g, '').trim();
    const heroTrigger = heroTriggerRaw.replace(/[.?!]+$/, '');
    const emotionalCopy = heroTrigger
      ? `${heroTrigger}`
      : 'Every workout, meal, and scan here acts as your complete fitness solution.';

    if (workoutsLineEl && workoutsCopy) {
      workoutsLineEl.innerHTML = `🏋️ ${workoutsCopy}`;
    }
    if (mealsLineEl) {
      mealsLineEl.innerHTML = `🍽️ ${mealsCopy}`;
    }
    if (emotionLineEl) {
      emotionLineEl.innerHTML = `💛 ${emotionalCopy}`;
    }
  };

  updateOfferCardHighlights();

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
        return `Your BMI indicates a <b>higher weight category</b>, but your personalized plan adjusts to you — helping you build real, lasting progress without overwhelm.`;
      case "overweight":
        return `Your BMI suggests you're <b>slightly overweight</b>. Don’t worry — your personalized plan is built to deliver long-term success.`;
      case "healthy":
        return `Your BMI suggests you’re in a great place! Let’s build on that strong foundation and keep the momentum going.`;
      case "underweight":
        return `Your BMI suggests you're <b>below the recommended range</b>. Your personalized plan is built to help you get stronger, healthier, and more confident.`;
      default:
        return `Your BMI is just one factor. Your personalized plan will adapt to support your full transformation.`;
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
         <p><strong>Tap the cards</strong> to learn more about your plan.<br>
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
      "I used to wing it with random exercises and YouTube routines. Having a personalized plan built for me but using jacklifts's structure to follow has genuinely changed my life. I've built 6 kg of lean muscle all from home.";
    beforeImgSrc = "../assets/harry_chest_before.webp";
    afterImgSrc = "../assets/harry_chest_after.webp";

  } else if (userGoal === "lose weight" || userGoal === "improve body composition") {
    if (gender === "male") {
      // Male weight-loss review.
      selectedReviewName = "Lee";
      selectedReviewText =
        "I wasn’t sure I could stick with it. But everything’s laid out, and I found it helpful following the same structure jacklifts uses. I’ve lost 10kg and finally feel like myself again.";
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
      title: "Personalized workout plan",
      image: "../assets/your-ui-mockup-jacklifts.webp",
      desc: ""
    },
    {
      title: "Clear and easy to follow",
      image: "../assets/clear-and-easy.webp",
      desc: ""
    },
    {
      title: "Progress tracking & analysis",
      image: "../assets/progress-tracking.webp",
      desc: ""
    },
    {
      title: "Mindset & recovery tools",
      image: "../assets/my-mind-jacklifts.webp",
      desc: ""
    },
    {
      title: "The same structure creator follows",
      image: "../assets/jacklifts-structure.webp",
      desc: ""
    },
    {
      title: "Visible results in 4 weeks",
      image: "../assets/visible-results-decoded.webp",
      desc: ""
    }
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
  const SCRATCH_COMPLETE_KEY = 'scratch_modal_completed';

  const hasCompletedScratch = () => {
    try {
      return localStorage.getItem(SCRATCH_COMPLETE_KEY) === '1';
    } catch {
      return false;
    }
  };

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
  let hasModalAutoOpened = false;
  let pendingModalRequest = false;

  const hasModalBeenSeen = () => !!window.offerModalState?.hasOpened?.();

  const tryOpenScratchModal = () => {
    if (hasModalAutoOpened || hasModalBeenSeen() || hasCompletedScratch()) return;
    if (window.offerModalState?.maybeOpenModal) {
      window.offerModalState.maybeOpenModal();
      hasModalAutoOpened = true;
      pendingModalRequest = false;
    } else {
      pendingModalRequest = true;
    }
  };

  document.addEventListener('offer:modal-ready', () => {
    if (pendingModalRequest && !hasModalAutoOpened && !hasModalBeenSeen()) {
      tryOpenScratchModal();
    }
  });


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
        tryOpenScratchModal()
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

  const selectedPlan = localStorage.getItem('selectedProgram') || 'trial';
  const pricing = getPlanPricing(selectedPlan, isDiscountActive());
  priceEl.textContent = pricing.todayFormatted;
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

  // Activate or deactivate the discount style immediately
  setDiscountActive(discountEndTime > now, { force: true });
  const timerContainer = document.getElementById("timerContainer");
  const countdownTimerEl = document.getElementById("countdownTimer");

  function updateTimer() {
    const now = Date.now();
    const diff = discountEndTime - now;

    // If the discount has expired…
    if (diff <= 0) {
      setDiscountActive(false);
      removeDiscountPricing();
      updatePostPayNote();
      localStorage.removeItem("sevenDayDiscountEnd");
      if (timerContainer) timerContainer.style.display = "none";
      return;
    }

    // Keep the discount styling active
    setDiscountActive(true);

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

  }

  document.addEventListener(DISCOUNT_STATE_EVENT, (e) => {
    const active = !!(e.detail && e.detail.active);
    if (!active) {
      removeDiscountPricing();
    }
    const selectedPlan = localStorage.getItem('selectedProgram') || 'trial';
    persistSelectedPlanState(selectedPlan);
    updatePostPayNote();
    updatePricingJustification();
    updatePlanSummary();
    localizeProTrackerCard();
  });

  setInterval(updateTimer, 1000);
  updatePostPayNote();
  updateTimer();
  updatePricingJustification();
  updatePlanSummary();
  localizeProTrackerCard();
  return;
});

function removeDiscountPricing() {
  updateOfferCardsPricing();
  updatePricingJustification();
  if (typeof localizeProTrackerCard === 'function') localizeProTrackerCard();
}

function persistSelectedPlanState(planId = 'trial') {
  const pricing = getPlanPricing(planId, isDiscountActive());
  localStorage.setItem('selectedProgram', planId);
  localStorage.setItem('planName', pricing.name);
  localStorage.setItem('planPrice', pricing.todayFormatted);
  localStorage.setItem('planFullPrice', pricing.renewalFormatted);
  localStorage.setItem('planDiscounted', String(pricing.discountedApplied));
  localStorage.setItem('planRenewal', pricing.renewalFormatted);
  document.querySelectorAll('.renew-amt').forEach(el => {
    el.textContent = pricing.renewalFormatted;
  });
  updatePricingJustification();
  updateOfferDisclaimer(pricing);
  return pricing;
}

/**********************************************/
/* D) SELECTING AN OFFER CARD (10 & 11 & 12)  */
/**********************************************/
document.addEventListener("DOMContentLoaded", function () {
  const offerCards = document.querySelectorAll(".offer-card");
  let currentlySelected = null;

  const clearSelections = () => {
    offerCards.forEach(card => card.classList.remove('selected'));
  };

  const persistPlanSelection = (card) => {
    const planId = card?.dataset?.program || 'trial';
    persistSelectedPlanState(planId);
    updatePlanSummary();
    updatePostPayNote();
  };

  // Check localStorage for previously selected program
  const savedProgram = localStorage.getItem("selectedProgram");
  if (savedProgram) {
    clearSelections();
    const savedCard = document.querySelector(`.offer-card[data-program="${savedProgram}"]`);
    if (savedCard) {
      savedCard.classList.add("selected");
      currentlySelected = savedCard;
      toggleDetails(savedCard, true);
      persistPlanSelection(savedCard);
      updateCTA(savedCard.dataset.program);
    }
  }

  if (!currentlySelected && offerCards.length) {
    clearSelections();
    const firstCard = offerCards[0];
    firstCard.classList.add('selected');
    currentlySelected = firstCard;
    toggleDetails(firstCard, true);
    persistPlanSelection(firstCard);
    updateCTA(firstCard.dataset.program);
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
        if (card.dataset.expanded !== 'true') {
          toggleDetails(card, true);
        }
        return;
      }

      if (currentlySelected && currentlySelected !== card) {
        toggleDetails(currentlySelected, false);
      }

      clearSelections();
      card.classList.add("selected");
      currentlySelected = card;
      persistPlanSelection(card);
      toggleDetails(card, true);
      updateCTA(card.dataset.program);
    });
  });

  updateOfferCardsPricing();

  document.addEventListener(DISCOUNT_STATE_EVENT, () => {
    updateOfferCardsPricing();
    persistPlanSelection(currentlySelected || document.querySelector('.offer-card.selected'));
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

  function toggleDetails(card, forceExpand = null, skipSync = false) {
    const info = card.querySelector('.additional-info');
    const toggleBtn = card.querySelector('.toggle-details');
    if (!info || !toggleBtn) return;

    const isOpen = info.style.display === 'block';
    const expandIt = forceExpand === null ? !isOpen : forceExpand;

    if (expandIt) {
      card.dataset.expanded = 'true';
      card.classList.add('expanded');

      info.style.display = 'block';
      info.style.height = '0px';
      info.style.overflow = 'hidden';
      info.offsetHeight;                       // re-flow
      info.style.transition = 'height .4s ease';
      info.style.height = info.scrollHeight + 'px';

      toggleBtn.textContent = 'See less';
    } else {
      card.dataset.expanded = 'false';
      card.classList.remove('expanded');

      info.style.height = '0px';
      info.addEventListener('transitionend', function h(e) {
        if (e.propertyName === 'height') {
          info.style.display = 'none';
          info.removeEventListener('transitionend', h);
        }
      });
      toggleBtn.textContent = 'What’s Included?';
    }

    /* ► keep 4- & 12-week in sync */
    // if (!skipSync && (card.dataset.program === '4-week' || card.dataset.program === '12-week')) {
    //   const partner = document.querySelector(`.offer-card[data-program="${card.dataset.program === '4-week' ? '12-week' : '4-week'}"]`);
    //   if (partner) toggleDetails(partner, expandIt, true);
    // }
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
    // if the click wasn’t inside an offer-card…
    if (!e.target.closest('.offer-card')) {
      offerCards.forEach(card => {
        // only collapse if currently expanded
        if (card.dataset.expanded === 'true') {
          toggleDetails(card, false);
          card.classList.remove('selected');
        }
      });
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
        "I’d tried bootcamps, meal plans, but nothing stuck. This finally made everything click. I’ve lost 10kg, but more than that, I finally feel like myself again.",
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
        "I used to wing it with random exercises and YouTube routines. Having workouts that actually adapt to my progress changed everything. I've built 6 kg of lean muscle all from home.",
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
        "Strict plans never worked for me. This didn’t just tell me what to do - it fit into my life. I’ve lost weight, feel healthier, and for the first time, I’m in control of the process.",
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

document.addEventListener('DOMContentLoaded', () => {
  const reviewsSection = document.getElementById('reviewsSection');
  const reviewsList = document.getElementById('reviewsList');
  const reviewsPagination = document.getElementById('reviewsPagination');
  const reviewComposer = document.getElementById('reviewComposer');

  if (!reviewsSection || !reviewsList || !reviewsPagination) return;


  const REVIEWS_PER_PAGE = 3;
  const USER_REVIEWS_KEY = 'rtb_user_reviews';
  let currentPage = 1;

  const loadUserReviews = () => {
    try {
      const raw = localStorage.getItem(USER_REVIEWS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(review =>
        typeof review?.name === 'string'
        && typeof review?.text === 'string'
        && typeof review?.time === 'string'
        && typeof review?.rating === 'number'
      );
    } catch {
      return [];
    }
  };

  const persistUserReviews = (reviews) => {
    try {
      localStorage.setItem(USER_REVIEWS_KEY, JSON.stringify(reviews));
    } catch {
      // non-fatal
    }
  };

  const defaultReviews = [
    // 🔹 TODAY
    {
      name: 'Chris',
      rating: 4,
      time: 'Today',
      text: 'really good app, best one ive tried bc it covers both workouts and nutrition at top quality and the results speak for themself (lost 3kg in a week and feel healthier than ever). the lil sleep + stress notes keep me from overdoing it. only wish every warmup had vids but its still the best ive used tbh',
    },
    {
      name: 'THE ALPHA',
      rating: 4,
      time: 'Today',
      text: 'Been watching jackliftss tiktok for a bit, I found his vids helpful so thought id gv his app a go. been using this for a couple of weeks and its genuinely amazing (avging 2kg muscle per week). Was going to rate 5 stars but the rest timer bugged once on me so im leaving a 4 til they patch it 💔 still worth it tho',
    },
    {
      name: 'alex',
      rating: 5,
      time: 'Today',
      text: 'so yesterday i did the quiz and everythuing and bro this is sick ',
    },
    {
      name: 'Sephy xx',
      rating: 5,
      time: 'Today',
      text: 'Great app! :)',
    },
    {
      name: '.',
      rating: 5,
      time: 'Today',
      text: 'Maybe women will finally find me attractive',
    },
    {
      name: 'joris bonson',
      rating: 5,
      time: 'Today',
      text: 'would rate 67 if i cud',
    },

    {
      name: 'J',
      rating: 5,
      time: 'Today',
      text: '3 weeks in + my lifts are finally consistent. The “micro wins” reminders hit just when I’m about to bail. 🔥',
    },
    {
      name: 'sully',
      rating: 5,
      time: 'Today',
      text: 'got 51% off what a steal',
    },
    {
      name: 'Cal',
      rating: 5,
      time: 'Today',
      text: 'nice to have an app where i can track workouts and meals rather than juggling multiple apps. plus i got 51% off lfg',
    },
    {
      name: 'Diego',
      rating: 5,
      time: 'Today',
      text: 'Cardio was boring before ngl. Now the intervals feel like a game and the macros don’t make me feel deprived',
    },
    {
      name: 'mia',
      rating: 5,
      time: 'Today',
      text: 'Revision + gym usually = meltdown. This app kinda thinks for me so I just show up and press start 😂',
    },
    {
      name: 'baki hanma',
      rating: 4,
      time: 'Today',
      text: 'Lowkey thought it was just another tiktok ad. 2 weeks in and my pushups doubled. Would rate 4.7 if that was a thing.',
    },
    {
      name: 'Bennyyy',
      rating: 5,
      time: 'Today',
      text: 'The way it adjusts after a bad sleep night is actually crazy. I felt weirdly seen when it downgraded my session lol',
    },

    // 🔹 YESTERDAY
    {
      name: 'Sofia',
      rating: 5,
      time: 'Yesterday',
      text: 'Lost 8kg and gained a routine that actually feels doable. The check-ins felt like the app was high-fiving me 🙌',
    },
    {
      name: 'Kyra L',
      rating: 5,
      time: 'Yesterday',
      text: 'Didn’t expect the meals to be this college-budget-friendly. Big W for the grocery lists.',
    },
    {
      name: 'layla',
      rating: 5,
      time: 'Yesterday',
      text: 'As someone w anxiety the gentle “you did enough” messages hit different. love the vibes :)',
    },
    {
      name: 'Mateo',
      rating: 5,
      time: 'Yesterday',
      text: 'I travel for work a lot. Switched to hotel-room/bodyweight weeks and didn’t lose momentum once.',
    },

    // 🔹 2 DAYS AGO
    {
      name: 'M',
      rating: 5,
      time: '2 days ago',
      text: 'Short workouts + meals that my kids will actually eat? Yes pls. I even missed one session and it adapted so I didn’t feel guilty.',
    },
    {
      name: 'riley',
      rating: 4,
      time: '2 days ago',
      text: 'uni wrecked my routine ngl, but the app didn’t “shame” me. It just recalced my plan and we moved.',
    },
    {
      name: 'kia malifa',
      rating: 5,
      time: '2 days ago',
      text: 'the lil streak bar scratches my brain in the best way.. and yh the apps good too',
    },
    {
      name: 'Maddie',
      rating: 5,
      time: '2 days ago',
      text: 'The lil “how are you feeling?” check-ins made me realise I was overdoing it. Adjusted volume and my knees stopped screaming.',
    },

    // 🔹 3 DAYS AGO
    {
      name: 'priya',
      rating: 4,
      time: '3 days ago',
      text: 'UI is smooth and the daily notes keep me honest. Would love more meal swaps, but still a 9.5/10 for me.',
    },
    {
      name: 'Aaron P.',
      rating: 5,
      time: '3 days ago',
      text: 'First time sticking to anything longer than 10 days. I open it out of habit now same as checking socials, thx for helping improving my life :D',
    },
    {
      name: 'nia',
      rating: 3,
      time: '3 days ago',
      text: 'Good app, just wish there was a dark mode. Still using it tho bc the workouts bang.',
    },

    // 🔹 4 DAYS AGO
    {
      name: 'Leon',
      rating: 5,
      time: '4 days ago',
      text: 'Works even with my cursed 10pm–6am schedule. It stopped telling me to train at 7am like a normal person 😂',
    },
    {
      name: 'Isla',
      rating: 4,
      time: '4 days ago',
      text: 'Love the streaks. Hate when I break them (my fault lol). Dark mode soon plsss.',
    },

    // 🔹 5 DAYS AGO
    {
      name: 'the goat',
      rating: 5,
      time: '5 days ago',
      text: 'Went from “I’ll start Monday” to 21 days straight. The streak badges are addictive (in a good way).',
    },
    {
      name: 'Tommy :D and Zac D:',
      rating: 5,
      time: '5 days ago',
      text: 'We started as a joke competition and now we’re both actually locked in lmao. The weekly recap basically fuels the trash talk',
    },
    {
      name: 'Serena',
      rating: 5,
      time: '5 days ago',
      text: 'The calm tone is everything. No “summer shred in 7 days” nonsense, its nice to have guidance that works.',
    },

    // 🔹 6 DAYS AGO
    {
      name: 'Ethan R',
      rating: 4,
      time: '6 days ago',
      text: 'Tried a bunch of apps—this one actually listens. workouts slap 💪',
    },
    {
      name: 'Yusuf',
      rating: 4,
      time: '6 days ago',
      text: 'Some of the meals are UK-shop friendly which I appreciate. One recipe had weird portions but I just winged it and it wasnt too bad',
    },
    {
      name: 'Chloe',
      rating: 5,
      time: '6 days ago',
      text: '12 hour shifts and I still manage 3 short sessions a week now. The app does the mental load for me.',
    },

    // 🔹 1 WEEK AGO
    {
      name: 'Lara K.',
      rating: 5,
      time: '1 week ago',
      text: 'Down 2 belt holes already and the nutrition tracker is low-key fun.',
    },
    {
      name: 'Ayyy',
      rating: 5,
      time: '1 week ago',
      text: 'Balancing lab + lifting used to fry me. The app’s chill nudges + quick meals = no more all-nighter crashes.',
    },
    {
      name: 'Andre & Mel',
      rating: 5,
      time: '1 week ago',
      text: 'We use the same plan but diff levels. Low key turned into a date night thing cooking the meals together.',
    },
    {
      name: 'connor',
      rating: 5,
      time: '1 week ago',
      text: 'I was stuck at the same pullup count for months. The progression path here finally broke the plateau.',
    },
    {
      name: 'Kira',
      rating: 4,
      time: '1 week ago',
      text: 'Helps with my body image tbh. Focus is on “what did you do today” not “what do you weigh right now”.',
    },
    {
      name: 'Ollie',
      rating: 5,
      time: '1 week ago',
      text: 'First time an app told me to DELoad instead of grind harder. Felt illegal but my bench went up so yeah.',
    },

    // 🔹 2 WEEKS AGO
    {
      name: 'Noah & Lea',
      rating: 5,
      time: '2 weeks ago',
      text: 'Couples workouts without cringe. We compete on streaks and the app keeps it friendly (most days 😅).',
    },
    {
      name: 'samira',
      rating: 5,
      time: '2 weeks ago',
      text: 'Had 0 clue about macros. It basically baby-stepped me into eating enough protein without turning into a chicken breast robot.',
    },
    {
      name: 'Reece',
      rating: 4,
      time: '2 weeks ago',
      text: 'The posture and mobility stuff is sneaky good. Should be more hyped in the marketing fr.',
    },
    {
      name: 'Ella',
      rating: 5,
      time: '2 weeks ago',
      text: 'The day it congratulated me for going to bed earlier instead of just working out harder, I was SOLD.',
    },
    {
      name: 'jared',
      rating: 3,
      time: '2 weeks ago',
      text: 'Good overall but I got confused with one superset explanation. Support replied quick tho and fixed it for next week.',
    },

    // 🔹 3 WEEKS AGO
    {
      name: 'Gabe',
      rating: 5,
      time: '3 weeks ago',
      text: 'Late-night sessions used to ruin my sleep. The plan nudged me to swap timing + macros and boom, energy back.',
    },
    {
      name: 'Helena',
      rating: 5,
      time: '3 weeks ago',
      text: 'Down 5kg but more importantly: I actually like training now. That was not on my 2025 bingo card.',
    },
    {
      name: 'batman',
      rating: 5,
      time: '3 weeks ago',
      text: 'Ramadan mode was clutch. Adjusted training + meal timing so I didn’t feel like I was dying every session.',
    },
    {
      name: 'Abby',
      rating: 5,
      time: '3 weeks ago',
      text: 'Started literally not knowing what a superset was. Now I walk into the gym with an actual plan instead of vibes.',
    },

    // 🔹 1 MONTH AGO
    {
      name: 'Mei',
      rating: 5,
      time: '1 month ago',
      text: 'Exercises scale up gently so my joints aren’t screaming. (ty for the form cues!)',
    },
    {
      name: 'Jay',
      rating: 4,
      time: '1 month ago',
      text: 'Wish I could colour-theme my dashboard (design brain talking). But functionally it is on point.',
    },
    {
      name: 'Steph',
      rating: 5,
      time: '1 month ago',
      text: 'Used to punish myself with 90 min sessions. This made me realise 30 focused mins is better and I feel human again.',
    },
    {
      name: 'Max',
      rating: 5,
      time: '1 month ago',
      text: 'Best part is it doesn’t panic if I miss a day. Just reshuffles and keeps it moving. Less all-or-nothing vibes.',
    },
    {
      name: 'Lina',
      rating: 4,
      time: '1 month ago',
      text: 'Meals are surprisingly normal. Like actual food and not weird “protein pancakes” every day.',
    },

    // 🔹 5 WEEKS AGO
    {
      name: 'Talia P',
      rating: 4,
      time: '5 weeks ago',
      text: 'App aesthetic is 🔥 and the coach notes read like a friend. Wish there was dark mode but still obsessed.',
    },

    // �� 2 MONTHS AGO
    {
      name: 'dad',
      rating: 5,
      time: '2 months ago',
      text: 'Snuck in 20-min workouts during nap time and still progressed. The recovery tips stopped my back twinges.',
    },
    {
      name: 'Rob',
      rating: 5,
      time: '2 months ago',
      text: '45, 2 kids, zero free time. Still getting stronger slowly. The progress charts are weirdly satisfying.',
    },
    {
      name: 'Bea',
      rating: 5,
      time: '2 months ago',
      text: 'I log in mostly for the lil “you showed up” messages if we’re being honest. But my legs are also looking insane now sooo.',
    },
    {
      name: 'Isaac',
      rating: 4,
      time: '2 months ago',
      text: 'Took a bit to figure out the meal swap flow (user error lol) but once I got it, it was smooth.',
    },
    {
      name: 'Gina',
      rating: 5,
      time: '2 months ago',
      text: 'I coach clients and still use this for my own structure. The deload logic is actually respectable.',
    },

    // 🔹 3 MONTHS AGO
    {
      name: 'Zayne',
      rating: 5,
      time: '3 months ago',
      text: 'Cut from 15% → 11% bf without feeling hangry. The weekly nudges feel like a real coach in my ear.',
    },
    {
      name: 'big man harvey',
      rating: 3,
      time: '3 months ago',
      text: 'Solid app but I had one sync issue on my old Android. Reinstalled and it was chill after that.',
    },
    {
      name: 'Zoë',
      rating: 5,
      time: '3 months ago',
      text: 'Neurodivergent brain approves. Clear steps, no 5 different decisions every time I want to train.',
    },
    {
      name: 'Leo + Finn',
      rating: 5,
      time: '3 months ago',
      text: 'Roommates lifting together. The shared “on a streak” screenshot is now in our kitchen group chat permanently.',
    },

    // 🔹 4 MONTHS AGO
    {
      name: 'Liv',
      rating: 4,
      time: '4 months ago',
      text: 'Interface is clean, workouts are spicy. Added my own emoji notes lol. Small bug once but support replied fast.',
    },
    {
      name: 'Marisol',
      rating: 5,
      time: '4 months ago',
      text: 'English is not my first lang but the app is easy to follow. Diagrams + simple words = no problem.',
    },
    {
      name: 'Craig',
      rating: 5,
      time: '4 months ago',
      text: 'Came in scared of hurting my back again. The warm ups and gradual progressions have been spot on.',
    },
    {
      name: 'Huda',
      rating: 4,
      time: '4 months ago',
      text: 'The reflection questions at the end of the week are actually deep. Lowkey turned this into therapy lite.',
    },

    // 🔹 5 MONTHS AGO
    {
      name: 'andre M.',
      rating: 5,
      time: '5 months ago',
      text: 'Came for the 12-week plan, stayed for the “habit wins.” Feels like I’m finally stacking momentum.',
    },
    {
      name: 'Jon',
      rating: 5,
      time: '5 months ago',
      text: 'Started for fat loss, stayed because I just feel better in my head. Less brain fog, more “I got this”.',
    },
    {
      name: 'Tegan',
      rating: 5,
      time: '5 months ago',
      text: 'Program doesn’t freak out when I log a bad sleep or period cramps. It just adjusts. Bless whoever coded that.',
    },

    // 🔹 6 MONTHS AGO
    {
      name: 'Cam',
      rating: 5,
      time: '6 months ago',
      text: 'Night float rotations wrecked me before this. Short recovery flows + quick prep meals = I’m not crashing in lectures.',
    },
    {
      name: 'Milo',
      rating: 4,
      time: '6 months ago',
      text: 'Would love a “gym anxiety” mode with more visual demos, but the text cues are already super helpful.',
    },
    {
      name: 'Ana',
      rating: 5,
      time: '6 months ago',
      text: 'Postpartum training felt scary and this made it feel manageable. Small wins, zero pressure.',
    },

    // 🔹 7 MONTHS AGO
    {
      name: 'Luca G.',
      rating: 4,
      time: '7 months ago',
      text: 'Started for summer, stayed for the streak counter. Would love a playlists tab but workouts keep me dialed.',
    },
    {
      name: 'Dominic',
      rating: 5,
      time: '7 months ago',
      text: 'It told me to slow down more than speed up which is honestly what I needed.',
    },
    {
      name: 'Frida',
      rating: 4,
      time: '7 months ago',
      text: 'Sometimes the push notifications hit at weird times but the content of them is on point lol.',
    },

    // 🔹 8 MONTHS AGO
    {
      name: 'Shay',
      rating: 5,
      time: '8 months ago',
      text: 'Finished my first 10k thanks to the pace cues. The gentle “drink water” nudges are elite 😂.',
    },
    {
      name: 'Sienna',
      rating: 5,
      time: '8 months ago',
      text: 'Tiny apartment, zero equipment, still got definition. The plan felt tailored not generic.',
    },
    {
      name: 'Zara',
      rating: 5,
      time: '8 months ago',
      text: 'Literally the first time I have a “before and during” not “before and after” pic folder. Still going.',
    },
    {
      name: 'Owen',
      rating: 5,
      time: '8 months ago',
      text: 'Used it alongside football training and it slotted in nice. Recovery blocks stopped me from overcooking it.',
    },

    // 🔹 9 MONTHS AGO
    {
      name: 'Dylan T.',
      rating: 5,
      time: '9 months ago',
      text: 'Bulked without the bloat. Macro coach felt like a friend checking in, not a drill sergeant.',
    },
    {
      name: 'Nate',
      rating: 5,
      time: '9 months ago',
      text: 'As a chef I was ready to hate the recipes but they’re decent. Seasonings are not criminal anyway 😂.',
    },
    {
      name: 'Leila',
      rating: 4,
      time: '9 months ago',
      text: 'UI sometimes lags on my old phone but the structure is so good I refuse to switch apps.',
    },

    // 🔹 10 MONTHS AGO
    {
      name: 'Imani',
      rating: 5,
      time: '10 months ago',
      text: 'Crushed my first pull-up and the app actually celebrated it. The lil confetti animation? I kept replaying it lol.',
    },
    {
      name: 'Gareth',
      rating: 5,
      time: '10 months ago',
      text: '2 stone down and somehow I don’t feel like I “dieted”. Just followed the dots.',
    },
    {
      name: 'Millie',
      rating: 5,
      time: '10 months ago',
      text: 'My favourite feature is literally the “how did you feel?” slider. Makes me pause and check in instead of autopilot.',
    },

    // 🔹 11 MONTHS AGO
    {
      name: 'Cal',
      rating: 4,
      time: '11 months ago',
      text: 'Minimalist UI, maximal gains. Some circuits repeat but the progressions make sense.',
    },
    {
      name: 'Pat',
      rating: 4,
      time: '11 months ago',
      text: 'I am not the target TikTok age but it still worked for me. Might need bigger text option though.',
    },
    {
      name: 'Romy',
      rating: 5,
      time: '11 months ago',
      text: 'Started because my friends bullied me into a group challenge. Still using it solo months later, so that says enough.',
    },

    // 🔹 12 MONTHS / 1 YEAR AGO
    {
      name: 'Rae',
      rating: 5,
      time: '12 months ago',
      text: 'Ran this during finals szn. The “study break sweats” track saved my sanity + posture.',
    },
    {
      name: 'Harper',
      rating: 5,
      time: '13 months ago',
      text: 'Post-ACL rehab felt sketchy before this. The stability drills eased me back into squats safely.',
    },
    {
      name: 'Nico da DJ',
      rating: 5,
      time: '14 months ago',
      text: 'Late gigs = messy sleep. The app shifted my workouts to afternoon + added mobility. Knees finally stopped whining.',
    },
    {
      name: 'Jess',
      rating: 5,
      time: '15 months ago',
      text: '5AM lifting crew checking in 🌅. This kept me accountable when my friends bailed.',
    },
    {
      name: 'Tomas',
      rating: 4,
      time: '16 months ago',
      text: 'Programming is solid. Wish the warmups had video loops but the cues are clear.',
    },
    {
      name: 'Elise',
      rating: 5,
      time: '17 months ago',
      text: 'Used it while backpacking EU. Bodyweight-only weeks were clutch + the hydration reminders were cute.',
    },
    {
      name: 'Mo',
      rating: 5,
      time: '18 months ago',
      text: 'Dropped 6kg before a music video shoot. The checklist vibe kept me calm.',
    },
    {
      name: 'Sienna',
      rating: 5,
      time: '19 months ago',
      text: 'Tiny apartment, zero equipment, still got definition. The plan felt tailored not generic.',
    },
    {
      name: 'Arjun',
      rating: 5,
      time: '20 months ago',
      text: 'Coach notes convinced me to finally deload. PRs went up after—respect the science.',
    },
    {
      name: 'Vi',
      rating: 4,
      time: '2 years ago',
      text: 'Used this alongside dance rehearsals. Would be cool to log rehearsals as workouts, but recovery tips still on point.',
    },
    {
      name: 'Silas',
      rating: 5,
      time: '1 year ago',
      text: 'Year check-in: still here, still training, still not bored. That has never happened before for me.',
    },
  ];

  let userReviews = loadUserReviews();
  let reviewsData = [...userReviews, ...defaultReviews];

  const renderStars = (rating) => {
    const full = '★'.repeat(Math.round(rating));
    const empty = '☆'.repeat(5 - Math.round(rating));
    return `${full}${empty}`;
  };

  const renderReviews = () => {
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    const pageItems = reviewsData.slice(start, start + REVIEWS_PER_PAGE);

    reviewsList.innerHTML = pageItems.map(review => `
      <article class="review-card">
        <div class="review-card__header">
          <div class="review-card__meta">
            <span class="review-card__name">${review.name}</span>
            <span class="review-card__tags">
              <span class="review-card__tag${review.pending ? ' review-card__tag--pending' : ''}">${review.pending ? 'Verification Pending' : '✓ Verified purchase'}</span>
            </span>
          </div>
          <div class="review-card__rating">
            <span class="review-card__stars" aria-label="${review.rating} out of 5 stars">${renderStars(review.rating)}</span>
            <span class="review-card__time">${review.time}</span>
          </div>
        </div>
        <p class="review-card__text">${review.text}</p>
      </article>
    `).join('');
  };

  const renderPagination = () => {
    const pageCount = Math.ceil(reviewsData.length / REVIEWS_PER_PAGE);
    reviewsPagination.innerHTML = '';

    const createNavBtn = (label, targetPage, disabled) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.disabled = disabled;
      if (disabled) btn.classList.add('disabled');
      btn.addEventListener('click', () => {
        if (disabled) return;
        currentPage = targetPage;
        renderReviews();
        renderPagination();
      });
      return btn;
    };

    reviewsPagination.appendChild(createNavBtn('‹', Math.max(1, currentPage - 1), currentPage === 1));

    const windowStart = Math.max(1, Math.min(currentPage - 1, pageCount - 2));
    const windowEnd = Math.min(pageCount, windowStart + 2);

    for (let i = windowStart; i <= windowEnd; i += 1) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentPage = i;
        renderReviews();
        renderPagination();
      });
      reviewsPagination.appendChild(btn);
    }

    reviewsPagination.appendChild(createNavBtn('›', Math.min(pageCount, currentPage + 1), currentPage === pageCount));
  };

  const goToFirstPage = () => {
    currentPage = 1;
    renderReviews();
    renderPagination();
  };

  const scrollToReviews = ({ collapseOfferCard = false } = {}) => {
    const runScroll = () => {
      const rect = reviewsSection.getBoundingClientRect();
      const targetTop = rect.top + window.scrollY + 400;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    };

    if (collapseOfferCard) {
      runAfterOfferCollapse(runScroll);
    } else {
      runScroll();
    }
  };

  const scrollToNewestReview = () => {
    const firstReview = reviewsList.querySelector('.review-card');

    if (!firstReview) {
      scrollToReviews();
      return;
    }

    const rect = firstReview.getBoundingClientRect();
    const targetTop = rect.top + window.scrollY - 120;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
  };

  const handleReviewsTrigger = (e) => {
    e.preventDefault();
    scrollToReviews({ collapseOfferCard: true });
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-scroll-target="reviews"]');
    if (!trigger) return;
    handleReviewsTrigger(event);
  });

  reviewComposer?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('reviewName').value || 'You').trim();
    const text = (document.getElementById('reviewText').value || '').trim();
    const rating = Number(document.getElementById('reviewRating').value || 5);

    if (!text) return;

    const newReview = {
      name: name.length > 2 ? name : 'You',
      rating: Math.min(5, Math.max(1, rating)),
      time: 'Just now',
      text,
      pending: true,
    };

    userReviews = [newReview, ...userReviews].slice(0, 25);
    persistUserReviews(userReviews);

    reviewsData = [...userReviews, ...defaultReviews];

    goToFirstPage();
    scrollToNewestReview();
    e.target.reset();
  });

  goToFirstPage();
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

function nextFrame(callback) {
  if (typeof callback !== 'function') return;
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 16);
  }
}

function collapseOfferCardsInstantly() {
  const cards = Array.from(document.querySelectorAll('.offer-card'));
  let collapsed = false;

  cards.forEach((card) => {
    const info = card.querySelector('.additional-info');
    if (!info) return;
    const isExpanded = card.dataset.expanded === 'true' || info.style.display === 'block';
    if (!isExpanded) return;

    collapsed = true;
    const toggleButton = card.querySelector('.toggle-details');
    const previousTransition = info.style.transition;

    info.style.transition = 'none';
    info.style.height = '0px';
    info.style.overflow = 'hidden';
    info.style.display = 'none';

    card.dataset.expanded = 'false';
    card.classList.remove('expanded');

    if (toggleButton) toggleButton.textContent = 'What’s Included?';

    nextFrame(() => {
      if (previousTransition) {
        info.style.transition = previousTransition;
      } else {
        info.style.removeProperty('transition');
      }
      info.style.removeProperty('overflow');
    });
  });

  return collapsed;
}

function runAfterOfferCollapse(task) {
  if (typeof task !== 'function') return;
  if (collapseOfferCardsInstantly()) {
    nextFrame(task);
  } else {
    task();
  }
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
  const planAnchor = document.getElementById('offerScrollAnchor') || document.getElementById('discountSection');

  const openBtns = [
    document.getElementById('claimProgramBtn'),
    ...document.querySelectorAll('[data-open-value-modal]')
  ].filter(Boolean);

  function getScrollOffsetAdjustment() {
    if (typeof window === 'undefined') return 0;

    const width = window.innerWidth || 0;
    if (width <= 375) return 225;
    if (width <= 390) return 50;
    return 0;
  }

  function scrollToPlans() {
    runAfterOfferCollapse(() => {
      const mbg = document.getElementById('moneyBackGuarantee');
      const offsetAdjustment = getScrollOffsetAdjustment();

      if (mbg) {
        const rect = mbg.getBoundingClientRect();
        const targetTop = rect.top + window.scrollY - (910 - offsetAdjustment);
        window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
        return;
      }

      if (planAnchor) {
        const rect = planAnchor.getBoundingClientRect();
        const targetTop = rect.top + window.scrollY - (32 - offsetAdjustment);
        window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
      }
    });
  }

  // Keep scratch helpers as harmless no-ops while the modal is disabled.
  window.updateScratchCompletionUi = () => { };
  window.offerModalState = {
    openModal: scrollToPlans,
    maybeOpenModal: scrollToPlans,
    hasOpened: () => true,
    isOpen: () => false,
  };

  openBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      scrollToPlans();
    });
  });

  document.dispatchEvent(new Event('offer:modal-ready'));
})();
// (function () {
//   const modal = document.getElementById('valueModal');
//   if (!modal) return;

//   const planAnchor = document.getElementById('path-to-progress');
//   const wheel = document.getElementById('discountWheel');
//   const actionBtn = document.getElementById('wheelActionBtn');
//   const header = document.getElementById('valueModalHeader');
//   const promoLine = document.getElementById('promoCodeLine');
//   const WHEEL_SPUN_KEY = 'rtbWheelSpunOnce';
//   const openBtns = [
//     document.getElementById('claimProgramBtn'),
//     ...document.querySelectorAll('[data-open-value-modal]')
//   ].filter(Boolean);

//   const INITIAL_HEADER_HTML = 'Spin and win <span class="wheel-highlight">random discount</span> up to 100%';
//   const WIN_HEADER_HTML = 'Wow, you won the <span class="wheel-highlight">biggest discount</span> of <span class="wheel-highlight">100%</span>!';
//   const SEGMENTS = [100, 30, 25, 20, 15, 10, 7, 5, 3, 2, 1, 12];
//   const SVG_NS = 'http://www.w3.org/2000/svg';

//   let built = false;
//   let isSpinning = false;
//   let hasStopped = false;
//   const SPIN_SPEED = 0.75; // deg per ms during free spin
//   let spinRaf = 0;
//   let currentAngle = 0;
//   let lastFrame = 0;
//   let targetAngle = null;
//   let decelRate = 0;
//   let spinVelocity = SPIN_SPEED;
//   let hasSpunWheel = localStorage.getItem(WHEEL_SPUN_KEY) === '1';

//   function describeSlice(cx, cy, r, startAngle, endAngle) {
//     const startX = cx + r * Math.cos(startAngle);
//     const startY = cy + r * Math.sin(startAngle);
//     const endX = cx + r * Math.cos(endAngle);
//     const endY = cy + r * Math.sin(endAngle);
//     const largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;
//     return [
//       `M ${cx} ${cy}`,
//       `L ${startX} ${startY}`,
//       `A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`,
//       'Z'
//     ].join(' ');
//   }

//   function buildWheel(sizeHint) {
//     if (!wheel) return;
//     const parentWidth = wheel.parentElement?.clientWidth || wheel.parentElement?.offsetWidth || wheel.offsetWidth || 0;
//     const baseSize = sizeHint || parentWidth || 360;
//     const size = Math.max(280, Math.min(520, Math.round(baseSize)));
//     const radius = size / 2;
//     const innerRadius = radius - 18;
//     const segmentRadius = innerRadius - 6;
//     const step = (Math.PI * 2) / SEGMENTS.length;
//     const startOffset = -Math.PI / 2; // 12 o'clock
//     const labelRadius = segmentRadius * 0.74;

//     wheel.innerHTML = '';
//     wheel.style.width = `${size}px`;
//     wheel.style.height = `${size}px`;
//     currentAngle = 0;

//     const svg = document.createElementNS(SVG_NS, 'svg');
//     svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
//     svg.setAttribute('class', 'spin-wheel__svg');
//     svg.setAttribute('aria-hidden', 'true');

//     const rim = document.createElementNS(SVG_NS, 'circle');
//     rim.setAttribute('cx', radius);
//     rim.setAttribute('cy', radius);
//     rim.setAttribute('r', innerRadius);
//     rim.setAttribute('class', 'spin-wheel__rim');
//     svg.appendChild(rim);

//     const segmentsGroup = document.createElementNS(SVG_NS, 'g');
//     segmentsGroup.setAttribute('transform', `translate(${radius} ${radius})`);

//     SEGMENTS.forEach((value, index) => {
//       const startAngle = startOffset + index * step;
//       const endAngle = startAngle + step;

//       const segment = document.createElementNS(SVG_NS, 'path');
//       segment.setAttribute('d', describeSlice(0, 0, segmentRadius, startAngle, endAngle));
//       segment.setAttribute('class', `spin-wheel__segment ${index % 2 === 0 ? 'spin-wheel__segment--light' : 'spin-wheel__segment--blue'}`);
//       segmentsGroup.appendChild(segment);

//       const label = document.createElementNS(SVG_NS, 'text');
//       label.setAttribute('class', `spin-wheel__label${index % 2 === 0 ? '' : ' spin-wheel__label--inverse'}`);
//       label.setAttribute('text-anchor', 'middle');
//       label.setAttribute('dominant-baseline', 'middle');
//       const midAngle = startAngle + step / 2;
//       const lx = Math.cos(midAngle) * labelRadius;
//       const ly = Math.sin(midAngle) * labelRadius;
//       label.setAttribute('transform', `translate(${lx.toFixed(3)} ${ly.toFixed(3)}) rotate(${(-midAngle * 180 / Math.PI).toFixed(3)})`);
//       label.textContent = `${value}%`;
//       segmentsGroup.appendChild(label);
//     });

//     svg.appendChild(segmentsGroup);

//     const hub = document.createElementNS(SVG_NS, 'circle');
//     hub.setAttribute('cx', radius);
//     hub.setAttribute('cy', radius);
//     hub.setAttribute('r', innerRadius * 0.32);
//     hub.setAttribute('class', 'spin-wheel__hub');
//     svg.appendChild(hub);

//     wheel.appendChild(svg);
//     wheel.style.transition = 'none';
//     wheel.style.transform = 'rotate(0deg)';
//     wheel.dataset.size = String(size);
//     built = true;
//   }

//   function ensureWheel(force = false) {
//     if (!wheel) return;
//     if (isSpinning && !force) return;
//     const size = Number(wheel.dataset.size || 0);
//     const containerWidth = wheel.parentElement?.clientWidth || wheel.parentElement?.offsetWidth || wheel.offsetWidth || 0;
//     const desired = Math.max(280, Math.min(520, Math.round(containerWidth || size || 360)));
//     if (force || !built || !size || Math.abs(desired - size) > 3) {
//       buildWheel(desired);
//     }
//   }

//   function getWheelAngle(element) {
//     if (!element) return 0;
//     try {
//       const computed = getComputedStyle(element);
//       const transform = computed.transform || computed.webkitTransform;
//       if (!transform || transform === 'none') return 0;

//       let matrixObj = null;
//       if (typeof DOMMatrixReadOnly === 'function') {
//         matrixObj = new DOMMatrixReadOnly(transform);
//       } else if (typeof DOMMatrix === 'function') {
//         matrixObj = new DOMMatrix(transform);
//       }

//       if (matrixObj) {
//         const angle = Math.atan2(matrixObj.b, matrixObj.a) * (180 / Math.PI);
//         return Number.isFinite(angle) ? angle : 0;
//       }

//       const match = transform.match(/matrix\(([^)]+)\)/);
//       if (match) {
//         const parts = match[1].split(',').map(v => parseFloat(v.trim()));
//         if (parts.length >= 2) {
//           const angle = Math.atan2(parts[1], parts[0]) * (180 / Math.PI);
//           return Number.isFinite(angle) ? angle : 0;
//         }
//       }
//       return 0;
//     } catch (err) {
//       console.warn('[wheel] Unable to read transform', err);
//       return 0;
//     }
//   }

//   function resetWheel() {
//     hasStopped = false;
//     isSpinning = false;
//     lastFrame = 0;
//     currentAngle = 0;
//     if (spinRaf) cancelAnimationFrame(spinRaf);
//     spinRaf = 0;
//     ensureWheel();
//     if (wheel) {
//       wheel.style.transition = 'none';
//       wheel.style.transform = 'rotate(0deg)';
//       wheel.style.removeProperty('--wheel-speed');
//     }
//     if (actionBtn) {
//       actionBtn.classList.remove('wheel-action-btn--finished');
//       actionBtn.disabled = false;
//       actionBtn.textContent = 'Spin';
//     }
//     if (header) header.innerHTML = INITIAL_HEADER_HTML;
//     if (promoLine) {
//       promoLine.hidden = true;
//       promoLine.innerHTML = '';
//     }
//   }

//   function openWheelModal() {
//     ensureWheel();
//     resetWheel();
//     modal.classList.add('show');
//     modal.setAttribute('aria-hidden', 'false');
//     document.body.classList.add('modal-open');
//     requestAnimationFrame(() => ensureWheel());
//   }

//   function closeWheelModal() {
//     modal.classList.remove('show');
//     modal.setAttribute('aria-hidden', 'true');
//     document.body.classList.remove('modal-open');
//   }

//   function startSpin() {
//     if (isSpinning || hasStopped) return;
//     if (!built) ensureWheel(true);
//     isSpinning = true;
//     hasStopped = false;
//     lastFrame = 0;
//     targetAngle = null;
//     decelRate = 0;
//     spinVelocity = SPIN_SPEED;
//     if (wheel) {
//       wheel.style.transition = 'none';
//       currentAngle = getWheelAngle(wheel);
//       wheel.style.transform = `rotate(${currentAngle}deg)`;
//     }

//     const tick = (timestamp) => {
//       if (!isSpinning) return;
//       if (!lastFrame) {
//         lastFrame = timestamp;
//         spinRaf = requestAnimationFrame(tick);
//         return;
//       }

//       let delta = timestamp - lastFrame;
//       lastFrame = timestamp;

//       // clamp to avoid massive jumps on dropped frames
//       if (delta > 32) delta = 32;

//       const deltaAngle = spinVelocity * delta;
//       currentAngle += deltaAngle;

//       if (wheel) {
//         wheel.style.transform = `rotate(${currentAngle}deg)`;
//       }

//       spinRaf = requestAnimationFrame(tick);
//     };

//     spinRaf = requestAnimationFrame(tick);
//     if (actionBtn) actionBtn.textContent = 'Stop';
//   }

// function stopSpin() {
//   if (!isSpinning || hasStopped) return;
//   hasStopped = true;
//   if (!wheel) return;

//   // Stop the rAF loop – we’re switching to CSS for the final spin
//   isSpinning = false;
//   if (spinRaf) {
//     cancelAnimationFrame(spinRaf);
//     spinRaf = 0;
//   }

//   // Read the actual current angle from the DOM
//   const angleNow = getWheelAngle(wheel);
//   currentAngle = angleNow;

//   // Align so 100% is at the top (angle 0) after a few extra spins
//   const normalized = ((currentAngle % 360) + 360) % 360;
//   const extraToZero = (360 - normalized) % 360;

//   const SPINS_AFTER_STOP = 3; // was 4 — fewer extra spins = less “jump”
//   targetAngle = currentAngle + extraToZero + 360 * SPINS_AFTER_STOP;

//   // Smooth ease-out, no initial speed spike
//   wheel.style.transition = 'transform 1.8s ease-out';
//   wheel.style.transform = `rotate(${targetAngle}deg)`;

//   if (actionBtn) actionBtn.disabled = true;
// }

//   function scrollToPlan() {
//     const continueBtn = document.getElementById('offerFinishBtn');
//     if (continueBtn) {
//       const rect = continueBtn.getBoundingClientRect();
//       const offset = rect.top + window.scrollY;
//       const baseTarget = Math.max(offset - (window.innerHeight - rect.height - 24), 0);
//     const desiredOffset = 90 - 25; // position CTA slightly higher after auto-scroll
//     window.scrollTo({ top: baseTarget + desiredOffset, behavior: 'smooth' });
//     } else if (planAnchor) {
//       planAnchor.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
//     }
//   }

//   function applyDiscountWin() {
//     const promoCode = localStorage.getItem('appliedPromoCode');

//     hasSpunWheel = true; // mark wheel as used
//     localStorage.setItem(WHEEL_SPUN_KEY, '1');

//     setDiscountActive(true, { force: true });

//     if (header) header.innerHTML = WIN_HEADER_HTML;

//     if (promoLine) {
//       if (promoCode) {
//         promoLine.hidden = false;
//         promoLine.innerHTML = `
//         <span class="promo-code-card">
//           <span class="promo-code-card__label">Promo code</span>
//           <span class="promo-code-card__value">${promoCode}</span>
//         </span>
//         <span class="promo-code-line__text">applied automatically.</span>
//       `.trim();
//       } else {
//         promoLine.hidden = true;
//         promoLine.innerHTML = '';
//       }
//     }

//     if (actionBtn) {
//       actionBtn.disabled = false;
//       actionBtn.classList.add('wheel-action-btn--finished');
//     }

//     window.sendAnalytics?.('wheel_win', { prize: '100' });

//     setTimeout(() => {
//       closeWheelModal();
//       scrollToPlan();
//     }, 2200);
//   }

//   if (wheel) {
//     wheel.addEventListener('transitionend', (event) => {
//       if (event.propertyName !== 'transform' || !hasStopped) return;
//       wheel.style.transition = 'none';
//       wheel.style.transform = 'rotate(0deg)';
//       isSpinning = false;
//       applyDiscountWin();
//     });
//   }

//   actionBtn?.addEventListener('click', () => {
//     if (!isSpinning && !hasStopped) {
//       startSpin();
//     } else if (isSpinning && !hasStopped) {
//       stopSpin();
//     }
//   });

//   function shouldOpenWheel(btn) {
//     if (!btn) return false;
//     if (btn.id === 'claimProgramBtn') return true;
//     if (btn.hasAttribute('data-open-value-modal')) return true;
//     return !isDiscountActive();
//   }

//   openBtns.forEach(btn => {
//     btn.addEventListener('click', e => {
//       // If they’ve already spun once, just scroll to the plan
//       if (hasSpunWheel) {
//         e.preventDefault();
//         e.stopImmediatePropagation();
//         scrollToPlan();
//         return;
//       }

//       if (!shouldOpenWheel(btn)) return;

//       e.preventDefault();
//       e.stopImmediatePropagation();
//       openWheelModal();
//     });
//   });


//   window.addEventListener('resize', () => {
//     if (!modal.classList.contains('show')) built = false;
//     ensureWheel();
//   });
// })();


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
    if (window.__PAYMENT_VISITED__) {
      document.body.classList.add('offer-disclaimer-visible');
    }
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
  const planPrice = localStorage.getItem('planPrice');
  const planFull = localStorage.getItem('planFullPrice');
  const discounted = localStorage.getItem('planDiscounted') === 'true';
  if (!el) return;
  if (planPrice) {
    if (discounted && planFull && planFull !== planPrice) {
      el.innerHTML = `${planName} – <span class="plan-summary__strike">${planFull}</span> <span class="plan-summary__price">${planPrice}</span>`;
    } else {
      el.textContent = `${planName} – ${planPrice}`;
    }
  } else {
    el.textContent = planName;
  }
}

// call it once on load
document.addEventListener("DOMContentLoaded", updatePlanSummary);

document.addEventListener("DOMContentLoaded", () => {
  const fullName = localStorage.getItem("name") || "";
  const firstName = fullName.split(" ")[0] || "";
  const header = document.getElementById("valueModalHeader");
  if (header) {
    const baseText = firstName
      ? `🎁 Scratch and win <span class="rtb-blue-underline">random discount</span> up to 51% off`
      : `🎁 Scratch and win <span class="rtb-blue-underline">random discount</span> up to 51% off`;
    header.dataset.baseText = baseText;
    header.dataset.winText = '<span class="promo-strip__rarity-count">Wow!</span> You won the <span class="promo-strip__rarity-count">biggest</span> discount!';
    header.innerHTML = baseText;

    const promoLine = document.getElementById("promoCodeLine");
    if (promoLine) {
      const code = `${firstName.toLowerCase()}-51-OFF`;
      promoLine.innerHTML = `
        <span class="promo-code-label">Your code:</span>
        <code class="promo-code-value">${code}</code>
      `;
      promoLine.dataset.activeHtml = promoLine.innerHTML;
    }
  }
  updateScratchCompletionUi();
  updateScratchDiscountContent(isDiscountActive());
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

  // Keep reassurance note visible regardless of discount timer state
  const reassurance = document.getElementById('offerDisclaimer');
  const keepReassuranceVisible = () => {
    if (!reassurance) return;
    reassurance.style.display = '';
  };
  keepReassuranceVisible();
  document.addEventListener(DISCOUNT_STATE_EVENT, keepReassuranceVisible);

  const mbgLink = document.getElementById('moneyBackGuaranteeLink');
  const mbgSection = document.getElementById('moneyBackGuarantee');
  if (mbgLink && mbgSection) {
    mbgLink.addEventListener('click', (event) => {
      event.preventDefault();
      runAfterOfferCollapse(() => {
        const targetTop = mbgSection.getBoundingClientRect().top + window.scrollY - 65;
        window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
      });
    });
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
  const timerMinutes = document.getElementById('promoStripTimerMinutes');
  const timerSeconds = document.getElementById('promoStripTimerSeconds');
  const src = document.getElementById('countdownTimer');

  if (strip) {
    const timerActive = () => {
      const timer = document.getElementById('timerContainer');
      if (!timer) return false;
      let el = timer;
      while (el) {
        if (el.hasAttribute('hidden')) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return false;
        }
        el = el.parentElement;
      }
      // If any ancestor collapses layout (e.g. display:none) rects will be empty
      return !!timer.getClientRects().length;
    };
    // visibility follows discount-active class and the timer state
    const updateStripVisibility = (show) => {
      strip.toggleAttribute('hidden', !show);
      strip.style.display = show ? 'block' : 'none';
      strip.setAttribute('aria-hidden', String(!show));
      strip.classList.toggle('promo-strip-active', show);
    };
    const refresh = () => {
      updateStripVisibility(isDiscountActive() && timerActive());
    };
    refresh();
    const visIv = setInterval(refresh, 800); // lightweight sync with your timer
    document.addEventListener(DISCOUNT_STATE_EVENT, refresh);
    // clean up on unload (optional)
    window.addEventListener('beforeunload', () => {
      clearInterval(visIv);
      document.removeEventListener(DISCOUNT_STATE_EVENT, refresh);
    });
  }

  // Mirror timer into strip
  if (src && timerMinutes && timerSeconds) {
    const sync = () => {
      const [mins = '0', secs = '00'] = (src.textContent || '0:00').split(':');
      timerMinutes.textContent = mins.padStart(1, '0');
      timerSeconds.textContent = secs.padStart(2, '0');
    };
    const obs = new MutationObserver(sync);
    obs.observe(src, { childList: true, characterData: true, subtree: true });
    sync();
  }
});
