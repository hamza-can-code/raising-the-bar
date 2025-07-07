/**************************************************
 * (A) Increase text size & unify page dimensions
 **************************************************/
function setGlobalFontSize() {
  document.documentElement.style.fontSize = "1.2rem";
}

function setUniformPageHeights() {
  const allPages = document.querySelectorAll(".pdf-page");
  if (!allPages) return;

  allPages.forEach(pg => {
    pg.style.width = "793px";
    pg.style.height = "1122px";
    pg.style.margin = "0 auto";
    pg.style.overflow = "hidden";
  });
}

/**************************************************
 * (B) Basic Utility Functions
 **************************************************/
function capitalizeGoal(goal) {
  if (!goal) return "";
  return goal
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function downloadPDF (containerId, fileName) {
  const el = document.getElementById(containerId);
  if (!el) return;

  /* 1️⃣  make it visible so html2pdf can read it */
  el.style.display = "block";

  const opts = {
    margin: 0,
    filename: fileName,
    image:      { type: "jpeg", quality: 0.98 },
    html2canvas:{ scale: 2 },
    jsPDF:      { unit: "pt", format: "a4", orientation: "portrait" }
  };

  /* 2️⃣  fire the export */
  html2pdf().set(opts).from(el).save();

  /* 3️⃣  hide it again after 5 seconds */
  setTimeout(() => { el.style.display = "none"; }, 5000);
}

import { mealDatabase } from './modules/meals.js';

/**************************************************
 * (C) Creating Headers/Footers & Page Numbers
 **************************************************/

function createIntroFooter(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-intro";
  footerDiv.innerHTML = `
    <div class="footer-left">
      <a href="contact-us.html" class="contact-link">Need Help?</a>
    </div>
    <div class="footer-center">
      <a href="https://instagram.com" target="_blank">
        <img src="../assets/instagram-icon.png" alt="Instagram" class="social-icon-lg"/>
      </a>
      <a href="https://youtube.com" target="_blank">
        <img src="../assets/youtube-icon.png" alt="YouTube" class="social-icon-lg"/>
      </a>
      <a href="https://facebook.com" target="_blank">
        <img src="../assets/facebook-icon.png" alt="Facebook" class="social-icon-lg"/>
      </a>
    </div>
    <div class="footer-right">
      <span class="page-number">${pageNum} / ${totalPages}</span>
    </div>
  `;
  return footerDiv;
}

function createMainFooter(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-main";
  footerDiv.innerHTML = `
    <div class="footer-left"></div>
    <div class="footer-center"></div>
    <div class="footer-right">
      <span class="page-number">${pageNum} / ${totalPages}</span>
    </div>
  `;
  return footerDiv;
}

function createWorkoutFooter(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-workout";
  footerDiv.innerHTML = `
    <div class="footer-center">
      <a href="workout-tracker.html" class="footer-log-link">Log Your Workout</a>
    </div>
    <div class="footer-right">
      <span class="page-number">${pageNum} / ${totalPages}</span>
    </div>
  `;
  return footerDiv;
}

function createMealPlanFooter(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-meal-plan";
  footerDiv.innerHTML = `
    <div class="footer-center">
      <a href="" class="footer-log-link">Log Your Nutrition</a>
    </div>
    <div class="footer-right">
      <span class="page-number">${pageNum} / ${totalPages}</span>
    </div>
  `;
  return footerDiv;
}

function createMealPlanFooterNoNutrition(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-meal-plan locked-meal-plan-footer";
  footerDiv.innerHTML = `
    <div class="footer-right" style="margin-left: auto; text-align: right;">
      <span class="page-number">${pageNum} / ${totalPages}</span>
    </div>
  `;
  return footerDiv;
}

function addPageNumbers(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pages = container.querySelectorAll(".pdf-page");
  const total = pages.length;

  // Example check if this PDF is for meal plans, if you have that logic:
  const idLower = containerId.toLowerCase();
  const isMealPlanPDF = (
    idLower === "pdf4weeknutritionpart2" ||
    idLower === "pdf1weekcontainer"
  );

  pages.forEach((pg, idx) => {
    // 1) Skip pages that should have NO footer at all.
    if (
      pg.querySelector("#oneWeekCoverTitle") ||
      (pg.querySelector(".page-heading") &&
        pg.querySelector(".page-heading").textContent.includes("Navigation")) ||
      pg.querySelector(".upgrade-now-btn")
    ) {
      return; // no footer on these pages
    }

    // 2) Remove any old footer
    const oldFooter = pg.querySelector(".footer");
    if (oldFooter) oldFooter.remove();

    // 3) Decide which footer function to call
    let newFooter;

    if (pg.classList.contains("meal-plan-page")) {
      newFooter = createMainFooter(idx + 1, total);

      // d) Otherwise, check if we should use intro vs main footers
    } else {
      // Example: detect headings for “Introduction,” “Nutrition Guide,” etc.
      const headingElem = pg.querySelector(".page-heading");
      if (headingElem) {
        const text = headingElem.textContent.toLowerCase();
        if (
          text.includes("introduction") ||
          text.includes("nutrition guide") ||
          text.includes("workout program")
        ) {
          newFooter = createIntroFooter(idx + 1, total);
        } else {
          newFooter = createMainFooter(idx + 1, total);
        }
      } else {
        // fallback if no heading found
        newFooter = createMainFooter(idx + 1, total);
      }
    }

    // 4) Append the new footer
    pg.appendChild(newFooter);
  });
}

/**************************************************
* (D) Fill the "Daily Nutritional Needs"
 **************************************************/
function adjustDailyNutritionRows() {
  const userGoalRaw = (localStorage.getItem("goal") || "").toLowerCase();

  // Grab elements
  const dailyDeficitEl = document.getElementById("dailyDeficit");
  const dailySurplusEl = document.getElementById("dailySurplus");
  const dailyDeloadEl = document.getElementById("dailyDeload");

  // Use selectedCalories for both deficit & surplus by default
  const fallbackCals = parseInt(localStorage.getItem("selectedCalories") || "2100", 10);
  const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);

  if (dailyDeficitEl) dailyDeficitEl.textContent = fallbackCals + " kcals";
  if (dailySurplusEl) dailySurplusEl.textContent = fallbackCals + " kcals";
  if (dailyDeloadEl) dailyDeloadEl.textContent = maintenanceCals + " kcals";

  if (userGoalRaw.includes("weight")) {
    // hide surplus
    if (dailySurplusEl) {
      dailySurplusEl.style.display = "none";
      const lbl = dailySurplusEl.previousElementSibling;
      if (lbl) lbl.style.display = "none";
    }
  } else if (userGoalRaw.includes("muscle")) {
    // hide deficit
    if (dailyDeficitEl) {
      dailyDeficitEl.style.display = "none";
      const lbl = dailyDeficitEl.previousElementSibling;
      if (lbl) lbl.style.display = "none";
    }
  }
}

function fillDailyNutritionRows() {
  const userGoalRaw = (localStorage.getItem("goal") || "").toLowerCase();
  const effortLevel = (localStorage.getItem("effortLevel") || "moderate").toLowerCase();
  const baseCals = parseInt(localStorage.getItem("selectedCalories") || "2200", 10);

  let defCals = baseCals;
  let surCals = baseCals;
  let deloadCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);

  // If "Improve Body Composition," apply multipliers
  if (userGoalRaw.includes("improve body composition")) {
    if (effortLevel === "slight") {
      defCals = Math.round(baseCals * 0.9);
      surCals = Math.round(baseCals * 1.1);
    } else if (effortLevel === "moderate") {
      defCals = Math.round(baseCals * 0.8);
      surCals = Math.round(baseCals * 1.2);
    } else if (effortLevel === "high") {
      defCals = Math.round(baseCals * 0.7);
      surCals = Math.round(baseCals * 1.3);
    }
  }

  // Update the DOM
  const dailyDeficitEl = document.getElementById("dailyDeficit");
  const dailySurplusEl = document.getElementById("dailySurplus");
  const dailyDeloadEl = document.getElementById("dailyDeload");

  if (dailyDeficitEl) dailyDeficitEl.textContent = defCals + " kcals";
  if (dailySurplusEl) dailySurplusEl.textContent = surCals + " kcals";
  if (dailyDeloadEl) dailyDeloadEl.textContent = deloadCals + " kcals";

  // Store them for the Weekly Calorie page
  localStorage.setItem("defCalsComputed", defCals.toString());
  localStorage.setItem("surCalsComputed", surCals.toString());

  // Hide if necessary
  if (userGoalRaw.includes("weight")) {
    if (dailySurplusEl) {
      dailySurplusEl.style.display = "none";
      const lbl = dailySurplusEl.previousElementSibling;
      if (lbl) lbl.style.display = "none";
    }
  } else if (userGoalRaw.includes("muscle")) {
    if (dailyDeficitEl) {
      dailyDeficitEl.style.display = "none";
      const lbl = dailyDeficitEl.previousElementSibling;
      if (lbl) lbl.style.display = "none";
    }
  }
}

function finalizeWorkoutNavPage() {
  const navDiv = document.getElementById("pdfWorkoutNavPage");
  if (!navDiv) return;

  // Read from localStorage
  const mealFrequency = parseInt(localStorage.getItem("mealFrequency") || "4", 10);
  const workoutDays = parseInt(localStorage.getItem("workoutDays") || "3", 10);

  let additionalAdvicePage, workoutGuidePage, oneWeekProgramPage, modifyWorkoutPage;

  if (mealFrequency === 2) {
    additionalAdvicePage = 12;
    workoutGuidePage = 13;
    oneWeekProgramPage = 14;
    modifyWorkoutPage = (2 * workoutDays) + 14; // e.g. 3 workouts => 3*2 + 14 = 20
  } else if (mealFrequency === 3 || mealFrequency === 4) {
    additionalAdvicePage = 15;
    workoutGuidePage = 16;
    oneWeekProgramPage = 17;
    modifyWorkoutPage = (2 * workoutDays) + 17; // e.g. 3 workouts => 3*2 + 17 = 23
  } else {
    // Fallback if mealFrequency is unexpected
    additionalAdvicePage = 12;
    workoutGuidePage = 13;
    oneWeekProgramPage = 14;
    modifyWorkoutPage = (2 * workoutDays) + 14;
  }

  // Now build the navigation items with the updated page numbers
  const items = [
    { label: "Introduction", page: 3 },
    { label: "Your Profile", page: 4 },
    { label: "Your Nutrition Guide", page: 5 },
    // { label: "Weekly Calorie & Macro Overview", page: 6 },
    { label: "Essential Food Guide", page: 6 },
    // { label: "Your Meal Plan", page: 8 },
    { label: "Your Meal Plan", page: 7 },
    { label: "Additional Advice", page: 12 },
    // { label: "Your Workout Guide", page: workoutGuidePage },
    // { label: "1-Week Program", page: oneWeekProgramPage },
    // { label: "Modify Your Workout", page: modifyWorkoutPage },
  ];

  // Render the updated Navigation table as before
  navDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="../assets/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Navigation</h2>
  `;
  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach((obj) => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function fillOneWeekClientProfilePage() {
  // Grab the page container for the 1-Week Profile
  const pageDiv = document.getElementById("oneWeekProfilePage");
  if (!pageDiv) return;

  // Basic user info
  const userName = localStorage.getItem("name") || "User";
  const dobVal = localStorage.getItem("dob") || "1990-01-01";
  const rawGoal = localStorage.getItem("goal") || "lose weight";
  const capGoal = capitalizeGoal(rawGoal);
  const heightVal = localStorage.getItem("height") || "170";
  const weightVal = localStorage.getItem("weight") || "70";

  // TDEE from localStorage
  const tdee = parseInt(localStorage.getItem("maintenanceCalories"), 10) || 2000;
  // Nicely formatted TDEE
  const formattedTDEE = tdee.toLocaleString();

  // Water intake from localStorage (or default)
  // If you have a function fillDailyNutritionVars(), you can re-use that.
  const waterVal = localStorage.getItem("programWaterIntake") || "2.5";

  // Calculate BMR
  const weightNum = parseFloat(weightVal);
  const heightNum = parseFloat(heightVal);
  const age = parseInt(localStorage.getItem("age"), 10) || 30;
  const gender = (localStorage.getItem("gender") || "male").toLowerCase();

  let BMR;
  if (gender === "male") {
    BMR = (10 * weightNum) + (6.25 * heightNum) - (5 * age) + 5;
  } else {
    BMR = (10 * weightNum) + (6.25 * heightNum) - (5 * age) - 161;
  }

  // Steps Per Day (example formula: (TDEE - BMR)/0.05)
  const stepsPerDay = Math.round((tdee - BMR) / 0.05);
  const formattedSteps = stepsPerDay.toLocaleString();

  // Determine Sleeping Hours from activityLevel + effortLevel
  const activityLevel = (localStorage.getItem("activityLevel") || "sedentary").toLowerCase();
  const effortLevel = (localStorage.getItem("effortLevel") || "moderate effort").toLowerCase();

  let activitySleep;
  switch (activityLevel) {
    case "sedentary (little to no exercise)":
    case "lightly active (light exercise/sports 1–3 days per week)":
      activitySleep = 8;
      break;
    case "moderately active (moderate exercise/sports 3–5 days per week)":
      activitySleep = 9;
      break;
    case "very active (hard exercise/sports 6–7 days per week)":
    case "extra active (very hard exercise, physical job, or training twice a day)":
      activitySleep = 10;
      break;
    default:
      activitySleep = 8;
  }

  let effortSleep;
  switch (effortLevel) {
    case "slight effort":
      effortSleep = 8;
      break;
    case "moderate effort":
      effortSleep = 9;
      break;
    case "high effort":
      effortSleep = 10;
      break;
    default:
      effortSleep = 8;
  }
  const sleepingHours = Math.max(activitySleep, effortSleep);

  // Ultimate Goal from localStorage
  const ultimateGoal = localStorage.getItem("ultimateGoal") || "";

  // Overwrite the entire pageDiv with new content
  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="../assets/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">${userName}'s Profile</h2>
<p class="profile-intro-text">
  Here’s a quick snapshot of where you're starting. These core details shape the way you train, eat, and recover — and they’re the foundation of your future progress.
</p>

    <div class="profile-container">
      <h3 class="subheading centered">Personal Details</h3>
      <div class="profile-grid">

        <div class="profile-grid-item label">Goal:</div>
        <div class="profile-grid-item">${capGoal}</div>

        <div class="profile-grid-item label">Height:</div>
        <div class="profile-grid-item">${heightVal} cm</div>

        <div class="profile-grid-item label">Weight:</div>
        <div class="profile-grid-item">${weightVal} kg</div>
      </div>

      <div class="profile-grid">
        <div class="profile-grid-item label">Maintenance Calories:</div>
        <div class="profile-grid-item">${formattedTDEE} kcals</div>

        <div class="profile-grid-item label">Water Intake:</div>
        <div class="profile-grid-item">${waterVal} L</div>

        <div class="profile-grid-item label">Sleeping Hours:</div>
        <div class="profile-grid-item">${sleepingHours} hours</div>
      </div>
      <p class="profile-intro-text">
  In the <strong>Pro Tracker</strong>, your workouts and meals adapt automatically based on stats like these — so you always know what to do next.
</p>
    </div>
  `;
}

/**************************************************
 * (E) Weekly Calorie Table & Blurring
 **************************************************/

// For the 1‑Week Program, just return the maintenance calories unadjusted.
function getAdjustedMaintenance(week, maintenanceCals, userGoal) {
  return maintenanceCals;
}

// function buildWeeklyCalorieTableDynamically() {
//   const pageDiv = document.getElementById("weeklyCaloriePage");
//   if (!pageDiv) return;

//   pageDiv.innerHTML = "";

//   const badgeLogo = document.createElement("div");
//   badgeLogo.className = "page-header-left-logo";
//   badgeLogo.innerHTML = `
//     <img src="../assets/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
//   `;
//   pageDiv.appendChild(badgeLogo);

//   const heading = document.createElement("h2");
//   heading.className = "page-heading with-badge-logo";
//   heading.textContent = "Weekly Calorie & Macro Overview";
//   pageDiv.appendChild(heading);

//   const subtext = document.createElement("p");
//   subtext.style.textAlign = "center";
//   subtext.style.margin = "0 0 1rem 0";
//   subtext.style.fontSize = "1rem";
//   subtext.textContent = "Stay on track with a structured breakdown of your daily nutritional needs.";
//   pageDiv.appendChild(subtext);

//   const tableWrap = document.createElement("div");
//   tableWrap.className = "session-table-container modern-table-wrapper";
//   const table = document.createElement("table");
//   table.className = "session-table modern-table";
//   table.id = "wcmoTable";

//   // Table Header
//   const thead = document.createElement("thead");
//   const headTr = document.createElement("tr");
//   const headings = [
//     "Week",
//     "Daily Calories",
//     "Protein<br>(g)",
//     "Carbs<br>(g)",
//     "Fats<br>(g)"
//   ];
//   headings.forEach(h => {
//     const th = document.createElement("th");
//     th.innerHTML = h;
//     headTr.appendChild(th);
//   });
//   thead.appendChild(headTr);
//   table.appendChild(thead);

//   // User inputs from localStorage
//   const userGoal = (localStorage.getItem("goal") || "").toLowerCase();
//   const userEffort = (localStorage.getItem("effortLevel") || "moderate").toLowerCase();
//   const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);
//   const fallbackCals = parseInt(localStorage.getItem("selectedCalories") || "2200", 10);
//   const userGender = (localStorage.getItem("gender") || "male").toLowerCase();
//   let minCals = (userGender === "male") ? 1500 : 1200;

//   // --- For the 1‑Week program, we want Week 1 to use our partial‐fraction logic.
//   // Define maps for full multipliers:
//   const WEIGHT_LOSS_MAP = {
//     low: -0.10,
//     medium: -0.15,
//     high: -0.20
//   };

//   const MUSCLE_GAIN_MAP = {
//     low: 0.12,
//     medium: 0.14,
//     high: 0.17
//   };

//   const IMPROVE_MAP = {
//     low: { deficit: -0.09, surplus: 0.11 },
//     medium: { deficit: -0.10, surplus: 0.13 },
//     high: { deficit: -0.11, surplus: 0.15 }
//   };

//   // Helper function for Week 1 calculations:
//   function getCalsForWeek1() {
//     // Get base maintenance using your adjusted formula:
//     const baseMaint = getAdjustedMaintenance(1, maintenanceCals, userGoal);
//     if (userGoal.includes("lose")) {
//       // 50% of full deficit multiplier for weight loss
//       const basePct = WEIGHT_LOSS_MAP[userEffort] || WEIGHT_LOSS_MAP.medium;
//       const fraction = 0.50;
//       let cals = baseMaint * (1 + basePct * fraction);
//       return Math.max(Math.round(cals), minCals);
//     }
//     if (userGoal.includes("gain")) {
//       // 50% of full surplus multiplier for muscle gain
//       const basePct = MUSCLE_GAIN_MAP[userEffort] || MUSCLE_GAIN_MAP.medium;
//       const fraction = 0.50;
//       let cals = baseMaint * (1 + basePct * fraction);
//       return Math.max(Math.round(cals), minCals);
//     }
//     if (userGoal.includes("improve")) {
//       // For Improve, week 1 uses a deficit at 75%
//       const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
//       const fraction = 0.75;
//       let cals = baseMaint * (1 + obj.deficit * fraction);
//       return Math.max(Math.round(cals), minCals);
//     }
//     // Fallback: maintenance
//     return baseMaint;
//   }

//   const tbody = document.createElement("tbody");

//   // For the 1‑Week Program, we only show week 1 with the correct calculations.
//   // Weeks 2–12 will be filled with placeholder values (and locked).
//   for (let w = 1; w <= 12; w++) {
//     let dailyCals;
//     if (w === 1) {
//       dailyCals = getCalsForWeek1();
//     } else {
//       // For weeks 2–12, use a default placeholder (e.g. 1800 kcals)
//       dailyCals = 1800;
//     }

//     // Macro breakdown (using a simple 30/40/30 split)
//     const p = Math.round((0.3 * dailyCals) / 4);
//     const c = Math.round((0.4 * dailyCals) / 4);
//     const f = Math.round((0.3 * dailyCals) / 9);

//     // Build the row for week w
//     const row = document.createElement("tr");
//     const tdWeek = document.createElement("td");
//     tdWeek.textContent = w;
//     row.appendChild(tdWeek);

//     const tdCals = document.createElement("td");
//     tdCals.textContent = dailyCals + " kcals";
//     row.appendChild(tdCals);

//     const tdP = document.createElement("td");
//     tdP.textContent = p + " g";
//     row.appendChild(tdP);

//     const tdCarbs = document.createElement("td");
//     tdCarbs.textContent = c + " g";
//     row.appendChild(tdCarbs);

//     const tdF = document.createElement("td");
//     tdF.textContent = f + " g";
//     row.appendChild(tdF);

//     tbody.appendChild(row);
//   }

//   table.appendChild(tbody);
//   tableWrap.appendChild(table);
//   pageDiv.appendChild(tableWrap);

//   // Lock weeks 2–12 as before (using your existing lock function)
//   let purchasedProgram = parseInt(localStorage.getItem("purchasedWeeks") || "1", 10);
//   if (purchasedProgram < 12) {
//     lockRowsByReplacingTextWithBanner(table, purchasedProgram);
//   }

//   const foot = createMainFooter(0, 0);
//   pageDiv.appendChild(foot);
// }

function lockRowsByReplacingTextWithBanner(table, purchasedWeeks) {
  const rows = table.querySelectorAll("tbody tr");
  if (rows.length < 12) return;

  // The banner row index logic:
  let bannerRowIndex = 0;
  if (purchasedWeeks === 1) {
    // e.g. show banner at row #6 => week6
    bannerRowIndex = 6;
  } else if (purchasedWeeks === 4) {
    // if the user purchased 4 weeks, maybe show banner at row #7 => week7
    bannerRowIndex = 7;
  } else return;

  rows.forEach((tr, idx) => {
    const wNum = idx + 1; // row #1 => week1, row #2 => week2, etc.
    if (wNum <= purchasedWeeks) {
      // unlocked
      return;
    }

    if (wNum === bannerRowIndex) {
      // banner row
      tr.classList.add("locked-banner-row");
      const tds = [...tr.children];
      if (tds.length >= 5) {
        tds[0].setAttribute("colspan", "5");
        tds[0].innerHTML = `
          <i class="fa fa-lock"></i>
          Unlock your full calorie & macro breakdown for the next 4 weeks!
        `;
        // remove the other columns
        for (let i = tds.length - 1; i >= 1; i--) {
          tr.removeChild(tds[i]);
        }
      }
    } else {
      // normal locked row => replace col2..col5 with “Locked”
      const tds = tr.querySelectorAll("td");
      for (let i = 1; i < tds.length; i++) {
        tds[i].innerHTML = `<i class="fa fa-lock"></i> Locked`;
        tds[i].style.fontWeight = "bold";
        tds[i].style.color = "#666";
        tds[i].style.textAlign = "center";
      }
    }
  });
}

/**************************************************
* (F) Food Table Page
 **************************************************/
function createFoodGuidePage() {
  const pageDiv = document.getElementById("foodGuidePage");
  if (!pageDiv) return;
  pageDiv.innerHTML = "";

  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `
    <img src="../assets/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
  `;
  pageDiv.appendChild(badgeLogo);

  const heading = document.createElement("h2");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "Essential Food Guide";
  pageDiv.appendChild(heading);

  const subtext = document.createElement("p");
  subtext.style.textAlign = "center";
  subtext.style.margin = "0 0 1rem 0";
  subtext.style.fontSize = "1rem";
  subtext.textContent = "Discover the best food choices to fuel your progress and optimize results.";
  pageDiv.appendChild(subtext);

  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper";

  const table = document.createElement("table");
  table.className = "session-table modern-table efg-table";

  // Thead
  const thead = document.createElement("thead");
  const headTr = document.createElement("tr");
  const thFood = document.createElement("th");
  thFood.innerHTML = `Food<br>(100g)`;
  headTr.appendChild(thFood);

  const thProtein = document.createElement("th");
  thProtein.innerHTML = `Protein<br>(g)`;
  headTr.appendChild(thProtein);

  const thCarbs = document.createElement("th");
  thCarbs.innerHTML = `Carbs<br>(g)`;
  headTr.appendChild(thCarbs);

  const thFats = document.createElement("th");
  thFats.innerHTML = `Fats<br>(g)`;
  headTr.appendChild(thFats);

  thead.appendChild(headTr);
  table.appendChild(thead);

  // Tbody
  const foods = [
    { name: "Chicken Breast", protein: 31, carbs: 0, fat: 3 },
    { name: "Eggs (whole)", protein: 13, carbs: 1, fat: 11 },
    { name: "Greek Yogurt (low-fat)", protein: 10, carbs: 3, fat: 0.4 },
    { name: "Canned Tuna", protein: 24, carbs: 0, fat: 1 },
    { name: "Brown Rice", protein: 2.5, carbs: 23, fat: 0.9 },
    { name: "Sweet Potato", protein: 2, carbs: 20, fat: 0.1 },
    { name: "Oats (dry)", protein: 13, carbs: 66, fat: 6 },
    { name: "Banana", protein: 1.3, carbs: 23, fat: 0.3 },
    { name: "Avocado", protein: 2, carbs: 9, fat: 15 },
    { name: "Almonds (raw)", protein: 21, carbs: 22, fat: 50 },
    { name: "Olive Oil", protein: 0, carbs: 0, fat: 100 },
    { name: "Peanut Butter", protein: 25, carbs: 20, fat: 50 },
  ];

  const tbody = document.createElement("tbody");
  foods.forEach((f, idx) => {
    const tr = document.createElement("tr");
    const maxMacro = Math.max(f.protein, f.carbs, f.fat);

    // col1 => name
    const tdName = document.createElement("td");
    tdName.textContent = f.name;
    tdName.style.textAlign = "left";
    tr.appendChild(tdName);

    // col2 => protein
    const tdP = document.createElement("td");
    tdP.textContent = String(f.protein);
    if (f.protein === maxMacro && maxMacro > 0) {
      tdP.classList.add("macro-highlight-green");
    } else {
      tdP.classList.add("macro-highlight-red");
    }
    tr.appendChild(tdP);

    // col3 => carbs
    const tdC = document.createElement("td");
    tdC.textContent = String(f.carbs);
    if (f.carbs === maxMacro && maxMacro > 0) {
      tdC.classList.add("macro-highlight-green");
    } else {
      tdC.classList.add("macro-highlight-red");
    }
    tr.appendChild(tdC);

    // col4 => fat
    const tdF = document.createElement("td");
    tdF.textContent = String(f.fat);
    if (f.fat === maxMacro && maxMacro > 0) {
      tdF.classList.add("macro-highlight-green");
    } else {
      tdF.classList.add("macro-highlight-red");
    }
    tr.appendChild(tdF);

    // overrides => yellow
    if ((f.name === "Oats (dry)" && f.protein === 13) ||
      (f.name === "Almonds (raw)" && f.protein === 21) ||
      (f.name === "Peanut Butter" && f.protein === 25)) {
      tdP.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdP.classList.add("macro-highlight-yellow");
    }
    if ((f.name === "Almonds (raw)" && f.carbs === 22) ||
      (f.name === "Peanut Butter" && f.carbs === 20)) {
      tdC.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdC.classList.add("macro-highlight-yellow");
    }
    if (f.name === "Eggs (whole)" && f.fat === 11) {
      tdF.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdF.classList.add("macro-highlight-yellow");
    }

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);

  // Now lock for 1-Week
  // const purchasedProgram = parseInt(localStorage.getItem("purchasedWeeks") || "1", 10);
  // if (purchasedProgram === 1) {
  //   lockEFGRowsSingleBanner(table);
  // }

  const foot = createMainFooter(0, 0);
  pageDiv.appendChild(foot);
}

function lockEFGRowsSingleBanner(table) {
  const rows = table.querySelectorAll("tbody tr");
  if (rows.length < 12) return;

  rows.forEach((tr, idx) => {
    // row index 0 => locked
    // row index 5 => banner
    // everything else => locked
    if (idx === 5) {
      tr.classList.add("locked-banner-row");
      const tds = [...tr.children];
      if (tds.length >= 4) {
        tds[0].setAttribute("colspan", "4");
        tds[0].innerHTML = `
          <i class="fa fa-lock"></i>
          Unlock your Essential Food Guide—all you need in one place!
        `;
        // remove the other cells
        for (let i = tds.length - 1; i >= 1; i--) {
          tr.removeChild(tds[i]);
        }
      }
    }
    else {
      lockWholeRow(tr);
    }
  });
}

/* Helper function to lock an entire EFG row but preserve row striping. */
function lockWholeRow(tr) {
  const tds = tr.querySelectorAll("td");
  tds.forEach(td => {
    // remove highlight classes if present:
    td.classList.remove("macro-highlight-green", "macro-highlight-red", "macro-highlight-yellow");
    td.innerHTML = `<i class="fa fa-lock"></i> Locked`;
    td.classList.add("locked-meal-cell");
  });
}

/**************************************************
 * Nutrition Intro Page
 **************************************************/
function createNutritionIntroPage(container) {
  const pageDiv = document.getElementById("nutritionIntroPage");
  if (!pageDiv) return;

  pageDiv.innerHTML = "";

  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `
    <img src="../assets/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
  `;
  pageDiv.appendChild(badgeLogo);

  const heading = document.createElement("h2");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "Your Nutrition Guide";
  pageDiv.appendChild(heading);

  const p = document.createElement("p");
  p.style.fontSize = "1.1rem";
  p.style.lineHeight = "1.4";
  p.style.marginBottom = "2rem";
  p.innerHTML = `
  Proper nutrition is the foundation of lasting results — and it doesn't have to be complicated. In this section, I’ll share simple, goal-aligned strategies to help you fuel your body the right way.<br/><br/>
  Whether your goal is fat loss, muscle gain, or body recomposition, the same core principles apply: eat enough protein, stay consistent, and don’t overthink the details. You don’t need a restrictive diet — just structure that works for you.<br/><br/>
  In the <strong>Pro Tracker</strong>, meals are automatically matched to your target calories and macros, giving you one less thing to worry about. But for now, use these tips to build momentum and take control of your nutrition starting today.
`;

  //image
  const placeholderImg = document.createElement("img");
  placeholderImg.src = "../assets/4_macro_matched.png";
  placeholderImg.alt = "Nutrition Overview Placeholder";
  placeholderImg.style.display = "block";
  placeholderImg.style.margin = "1rem auto";
  placeholderImg.style.objectFit = "cover";
  placeholderImg.style.maxWidth = "100%";
  placeholderImg.style.height = "40%";
  placeholderImg.style.borderRadius = "8px";

  pageDiv.appendChild(p);

  pageDiv.appendChild(placeholderImg);

  const foot = createIntroFooter(0, 0);
  pageDiv.appendChild(foot);
}

const ratioData = {
  deficitPhase: {
    2: { Lunch: 0.55, Dinner: 0.45 },
    3: { Breakfast: 0.30, Lunch: 0.40, Dinner: 0.30 },
    4: { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.25, Snack: 0.15 }
  },
  surplusPhase: {
    2: { Lunch: 0.50, Dinner: 0.50 },
    3: { Breakfast: 0.33, Lunch: 0.33, Dinner: 0.34 },
    4: { Breakfast: 0.30, Lunch: 0.30, Dinner: 0.30, Snack: 0.10 }
  },
  deloadPhase: {
    2: { Lunch: 0.52, Dinner: 0.48 },
    3: { Breakfast: 0.30, Lunch: 0.35, Dinner: 0.35 },
    4: { Breakfast: 0.28, Lunch: 0.30, Dinner: 0.28, Snack: 0.14 }
  }
};

function createMealPlanLockedPageFullSize() {
  // Create the outer page container
  const pageDiv = document.createElement("div");
  pageDiv.className = "pdf-page meal-plan-page locked-meal-plan-page";
  // Unique ID so you can detect this page in addPageNumbers() and remove "Log Your Nutrition"
  pageDiv.id = "lockedMealPlanPage";

  // Make the page a flex container
  // so we can place the heading at the top and center the rest vertically.
  pageDiv.style.display = "flex";
  pageDiv.style.flexDirection = "column";
  // Ensure the container spans the full A4 height if you rely on that in CSS:
  pageDiv.style.height = "100%";

  // 1) Top container for heading at the top
  const topContainer = document.createElement("div");
  topContainer.style.display = "flex";
  topContainer.style.flexDirection = "column";
  topContainer.style.alignItems = "center"; // horizontally center heading
  // No justifyContent here, so it stays at the top
  pageDiv.appendChild(topContainer);

  // Add the logo
  const badgeDiv = document.createElement("div");
  badgeDiv.className = "page-header-left-logo";
  badgeDiv.innerHTML = `
    <img src="../assets/rtb-logo-white.png" alt="Badge Logo" class="logo-badge" />
  `;
  topContainer.appendChild(badgeDiv);

  // Add the heading
  const heading = document.createElement("h3");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "This was only a sample of Day 1.";
  topContainer.appendChild(heading);

  const subheading = document.createElement("p");
  subheading.className = "page-subheading";
  subheading.innerHTML = "The <strong>Pro Tracker</strong> is not a PDF — it's a real, interactive tracker.";
  topContainer.appendChild(subheading);



  // 2) Main content wrapper (to center the table, line, text vertically)
  //    We let this wrapper flex:1, so it occupies the remaining space.
  const contentWrapper = document.createElement("div");
  contentWrapper.style.display = "flex";
  contentWrapper.style.flexDirection = "column";
  contentWrapper.style.justifyContent = "center"; // vertically center
  contentWrapper.style.alignItems = "center";     // horizontally center
  contentWrapper.style.flex = "1";
  pageDiv.appendChild(contentWrapper);

  // Hardcode a meal from the database
  const hardcodedMeal = {
    mealName: "Quinoa & Black Bean Bowl",
    calories: 550,
    macroRatio: { protein: 0.27, carbs: 0.55, fats: 0.18 },
    category: "Lunch",
    dietaryPhase: ["deficitPhase", "deloadPhase", "surplusPhase"],
    portionSize: 1.0,
    dietaryRestrictions: ["Vegan", "Vegetarian"],
    allergens: [],
    ingredients: [
      { name: "quinoa", quantity: 90, unit: "g" },
      { name: "black beans", quantity: 85, unit: "g" },
      { name: "diced bell peppers", quantity: 75, unit: "g" },
      { name: "olive oil", quantity: 15, unit: "ml" },
      { name: "salt and pepper", quantity: 1, unit: "g" }
    ],
    recipe: [
      "Cook quinoa per instructions.",
      "Sauté bell peppers in olive oil.",
      "Mix with black beans and season."
    ],
    mealNotes: []
  };

  // Build the locked meal table
  const lockedTable = buildLockedMealTableFullSize(hardcodedMeal);
  contentWrapper.appendChild(lockedTable);

  // Thin grey line underneath the table
  const hrLine = document.createElement("hr");
  hrLine.style.width = "100%";
  hrLine.style.border = "none";
  hrLine.style.borderBottom = "1px solid #ccc";
  hrLine.style.marginTop = "1.25rem";
  hrLine.style.marginBottom = "0.4rem";
  contentWrapper.appendChild(hrLine);

  // "Learn More About Your Meal Plan" heading
  const learnMoreHeader = document.createElement("h3");
  learnMoreHeader.className = "learn-more-header";
  learnMoreHeader.textContent = "Learn More About Your Meal Plan";
  contentWrapper.appendChild(learnMoreHeader);

  // Subtext
  const subtext = document.createElement("p");
  subtext.className = "locked-meal-subtext"; // or any class name you like
  subtext.textContent = `
You’ve seen how the system works. With the <strong>Pro Tracker</strong>, your meals don’t just get planned — they evolve with you.
Skip the PDFs. Unlock the full tracker and stay on course.
  `;
  contentWrapper.appendChild(subtext);

  return pageDiv;
}

function buildLockedMealTableFullSize(mealObj) {
  // Create the table (same classes as your normal meal tables)
  const table = document.createElement("table");
  table.className = "session-table modern-table meal-plan-table locked-fullsize-table";

  // The same column widths as your normal meal‐plan tables
  const colgroup = document.createElement("colgroup");
  const col1 = document.createElement("col");
  col1.style.width = "30%";
  const col2 = document.createElement("col");
  col2.style.width = "35%";
  const col3 = document.createElement("col");
  col3.style.width = "35%";
  colgroup.appendChild(col1);
  colgroup.appendChild(col2);
  colgroup.appendChild(col3);
  table.appendChild(colgroup);

  // Thead (3 columns)
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach(txt => {
    const th = document.createElement("th");
    th.textContent = txt;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  // Tbody (2 rows):
  // Row #1 => normally Meal details / ingredients / recipe
  const tbody = document.createElement("tbody");

  // Row 1
  const row1 = document.createElement("tr");
  // col1
  const td1 = document.createElement("td");
  td1.innerHTML = `
    <strong>${mealObj.mealName}</strong>
    <div>Calories: ${mealObj.calories}</div>
    <div>Protein: ${mealObj.protein}g</div>
    <div>Carbs: ${mealObj.carbs}g</div>
    <div>Fats: ${mealObj.fats}g</div>
  `;
  row1.appendChild(td1);

  // col2
  const td2 = document.createElement("td");
  td2.textContent = "Ingredients here";
  row1.appendChild(td2);

  // col3
  const td3 = document.createElement("td");
  td3.textContent = "Recipe steps here";
  row1.appendChild(td3);
  tbody.appendChild(row1);

  // Row 2 => mealNotes
  const row2 = document.createElement("tr");
  // We'll use just 1 cell that spans all 3 columns, or 3 separate—your choice.
  const tdNotes = document.createElement("td");
  tdNotes.colSpan = 3;
  tdNotes.textContent = mealObj.mealNotes.join(" ");
  row2.appendChild(tdNotes);
  tbody.appendChild(row2);

  table.appendChild(tbody);

  // 4) Now we lock them
  // a) Row #1 => .locked-banner-row
  row1.classList.add("locked-banner-row");
  // remove the existing cells, replace with a single cell that spans all 3 columns
  const r1Tds = [...row1.querySelectorAll("td")];
  r1Tds[0].colSpan = 3;
  r1Tds[0].innerHTML = `<i class="fa fa-lock"></i> The <strong>Pro Tracker</strong> updates daily with macro-matched meals, logging, weekly shopping lists, streaks, and real-time feedback — all built to move with you.`;

  // remove extra cells
  for (let i = 1; i < r1Tds.length; i++) {
    row1.removeChild(r1Tds[i]);
  }

  // b) Row #2 => locked cell
  const r2Tds = [...row2.querySelectorAll("td")];
  // If you only want one big cell for "Locked", you already have colSpan=3
  // so just replace the content:
  r2Tds[0].innerHTML = `<i class="fa fa-lock"></i> Locked`;

  // Done
  return table;
}

function buildLockedMealTable(mealObj) {
  // Create the table structure
  const table = document.createElement("table");
  table.className = "session-table modern-table meal-plan-table";

  // Colgroup (3 columns, same widths as your normal meal table)
  const colgroup = document.createElement("colgroup");
  const col1 = document.createElement("col");
  col1.style.width = "30%";
  const col2 = document.createElement("col");
  col2.style.width = "35%";
  const col3 = document.createElement("col");
  col3.style.width = "35%";
  colgroup.appendChild(col1);
  colgroup.appendChild(col2);
  colgroup.appendChild(col3);
  table.appendChild(colgroup);

  // Thead
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach(txt => {
    const th = document.createElement("th");
    th.textContent = txt;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");

  // Row 1 => the main meal row (mealName/macros in col1, ingredients col2, recipe col3)
  const mealRow = document.createElement("tr");

  // Column 1: Meal name + macros
  const tdDetails = document.createElement("td");
  tdDetails.innerHTML = `
    <div class="meal-name-divider">${mealObj.mealName}</div>
    <div style="text-align:center; font-size:0.9rem;">
      Calories: ${mealObj.calories || "?"}<br/>
      Protein: ${mealObj.protein || "?"}g<br/>
      Carbs: ${mealObj.carbs || "?"}g<br/>
      Fat: ${mealObj.fats || "?"}g
    </div>
  `;
  mealRow.appendChild(tdDetails);

  // Column 2: (Placeholder – normally you'd list ingredients)
  const tdIngr = document.createElement("td");
  tdIngr.textContent = "Ingredients go here...";
  mealRow.appendChild(tdIngr);

  // Column 3: (Placeholder – normally you'd list recipe steps)
  const tdRecipe = document.createElement("td");
  tdRecipe.textContent = "Recipe steps go here...";
  mealRow.appendChild(tdRecipe);

  tbody.appendChild(mealRow);

  // Row 2 => mealNotes row
  const mealNotesRow = document.createElement("tr");
  // We'll give it a single cell spanning all 3 columns (if you prefer).
  // Or you can keep 3 separate cells. For simplicity, let's do a single cell:
  const tdNotes = document.createElement("td");
  tdNotes.colSpan = 3;
  tdNotes.textContent = (mealObj.mealNotes && mealObj.mealNotes.length > 0)
    ? mealObj.mealNotes.join(" ") // or however you want to display them
    : "No meal notes.";
  mealNotesRow.appendChild(tdNotes);

  tbody.appendChild(mealNotesRow);
  table.appendChild(tbody);

  // Now LOCK them:
  lockMealTableRows(tbody);

  return table;
}


/**
 * Transforms:
 *  - The first row in tbody => a single "locked banner" cell
 *  - The second row => locked text (each cell, or a single cell if colSpan used)
 */
function lockMealTableRows(tbody) {
  const rows = [...tbody.querySelectorAll("tr")];
  if (rows.length < 2) return;  // guard

  // 1) Banner row => row[0]
  const firstRow = rows[0];
  const firstRowCells = [...firstRow.querySelectorAll("td")];

  // Combine into a single cell spanning all columns
  const totalCols = firstRowCells.length;
  firstRowCells[0].colSpan = totalCols;
  firstRowCells[0].innerHTML = `
    <i class="fa fa-lock"></i> 
    Unlock more meals
  `;

  // Remove the other cells in that row
  for (let i = 1; i < firstRowCells.length; i++) {
    firstRow.removeChild(firstRowCells[i]);
  }

  // 2) Lock the second row => row[1]
  const secondRow = rows[1];
  const secondRowCells = [...secondRow.querySelectorAll("td")];
  secondRowCells.forEach(cell => {
    cell.innerHTML = `<i class="fa fa-lock"></i> Locked`;
    cell.classList.add("locked-meal-cell"); // optional styling class
  });
}

function buildThreeDayMealPlan() {
  // 1. Grab the 1-Week PDF container
  const container = document.getElementById("pdf1WeekContainer");
  if (!container) return;

  const foodGuidePage = document.getElementById("foodGuidePage");
  const referenceNode = foodGuidePage ? foodGuidePage.nextSibling : null;

  // 2. Find the “Essential Food Guide” page so we can insert after it
  // const foodGuidePage = document.getElementById("foodGuidePage");
  // if (!foodGuidePage) {
  //   console.warn("No #foodGuidePage found — cannot insert meal plan afterwards.");
  //   return;
  // }
  // const referenceNode = foodGuidePage.nextSibling;

  // 3. Retrieve user data
  const userGoal = (localStorage.getItem("goal") || "").toLowerCase();
  const userEffort = (localStorage.getItem("effortLevel") || "moderate").toLowerCase();
  const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);
  const userGender = (localStorage.getItem("gender") || "male").toLowerCase();
  const mealFrequency = parseInt(localStorage.getItem("mealFrequency") || "4", 10);
  const minCals = (userGender === "male") ? 1500 : 1200;

  // 4. Choose the proper phase splits from ratioData
  let phase;
  if (userGoal.includes("lose")) phase = "deficitPhase";
  else if (userGoal.includes("gain")) phase = "surplusPhase";
  else if (userGoal.includes("improve")) phase = "deloadPhase";
  else phase = "deficitPhase"; // fallback

  const splits = ratioData[phase][mealFrequency] || ratioData[phase][4];
  const mealKeys = Object.keys(splits);                      // e.g., ["Breakfast", "Lunch", …]

  // 5. Calculate week1DailyCals (your existing logic, unchanged)
  const WEIGHT_LOSS_MAP = { low: -0.10, medium: -0.15, high: -0.20 };
  const MUSCLE_GAIN_MAP = { low: 0.12, medium: 0.14, high: 0.17 };
  const IMPROVE_MAP = {
    low: { deficit: -0.09, surplus: 0.11 },
    medium: { deficit: -0.10, surplus: 0.13 },
    high: { deficit: -0.11, surplus: 0.15 }
  };

  let week1DailyCals;
  if (userGoal.includes("lose")) {
    const pct = WEIGHT_LOSS_MAP[userEffort] || WEIGHT_LOSS_MAP.medium;
    week1DailyCals = Math.max(Math.round(maintenanceCals * (1 + pct * 0.50)), minCals);
  } else if (userGoal.includes("gain")) {
    const pct = MUSCLE_GAIN_MAP[userEffort] || MUSCLE_GAIN_MAP.medium;
    week1DailyCals = Math.max(Math.round(maintenanceCals * (1 + pct * 0.50)), minCals);
  } else if (userGoal.includes("improve")) {
    const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
    week1DailyCals = Math.max(Math.round(maintenanceCals * (1 + obj.deficit * 0.75)), minCals);
  } else {
    week1DailyCals = maintenanceCals;
  }

  // 6. Define the 3-day plan (only Day 1 for now)
  const threeDayPlan = [{ dayLabel: "Week 1 - Day 1", meals: {} }];
  threeDayPlan.forEach(day => {
    mealKeys.forEach(key => {
      const target = Math.round(week1DailyCals * splits[key]);
      day.meals[key] = pickMealForCategory(key, target, mealDatabase);
    });
  });

  // 7. Build just the Breakfast page for Day 1
  const newPages = [];
  threeDayPlan.forEach(({ dayLabel, meals }) => {
    // Prefer an explicit "Breakfast" key; otherwise use the first meal key
    const breakfastKey =
      mealKeys.find(k => k.toLowerCase().includes("breakfast")) || mealKeys[0];
    const mealObj = meals[breakfastKey];
    if (!mealObj) return;

    // Create page container
    const pg = document.createElement("div");
    pg.className = "pdf-page meal-plan-page";

    // Logo badge
    const badgeDiv = document.createElement("div");
    badgeDiv.className = "page-header-left-logo";
    badgeDiv.innerHTML =
      `<img src="../assets/rtb-logo-white.png" alt="Badge Logo" class="logo-badge" />`;
    pg.appendChild(badgeDiv);

    // Single heading
    const heading = document.createElement("h3");
    heading.className = "page-heading with-badge-logo";
    heading.textContent = "Kickstart Meal: Day 1 Breakfast Preview";
    pg.appendChild(heading);

    // Meal table (unchanged dimensions/styles from buildMealTable)
    const table = buildMealTable(mealObj, breakfastKey);
    pg.appendChild(table);

    // Mini Challenge box
    const challenge = document.createElement("div");
    challenge.className = "mini-challenge";
    challenge.innerHTML = `
  <p>✅ <strong>Prep this meal today</strong> — get it ready the night before or first thing in the morning.</p>
  <p>✅ After you eat, ask yourself:<br>
  Did it keep me full? Was it easy to make? Did I feel energized?</p>
  <p>The <strong>Pro Tracker</strong> lets you rate meals and adapts based on your feedback — so every week gets easier and more effective.</p>
  <p>🎯 <strong>Small wins stack up fast</strong>. This is how you start a streak.</p><br><br>
`;

    // CTA line under the streak copy
    const ctaLine = document.createElement("p");
    ctaLine.innerHTML = "Like these meals? The <strong>Pro Tracker</strong> uses a more advanced generator that evolves them based on your progress.";
    challenge.appendChild(ctaLine);

    // 2) Create your styled button
    const upsellBtn = document.createElement("a");
    upsellBtn.href = "../pages/offer.html";
    upsellBtn.textContent = "Unlock the Pro Tracker";

    // copy your button styles
    upsellBtn.style.display = "inline-block";
    upsellBtn.style.background = "#9333EA";
    upsellBtn.style.color = "#FFF";
    upsellBtn.style.fontWeight = "600";
    upsellBtn.style.padding = "0.65rem 1.5rem";
    upsellBtn.style.borderRadius = "40px";
    upsellBtn.style.textDecoration = "none";
    upsellBtn.style.fontSize = "1rem";
    upsellBtn.style.textAlign = "center";
    upsellBtn.style.margin = "0.5rem auto 1rem";
    upsellBtn.style.boxShadow = "0 4px 10px rgba(108,77,255,0.25)";
    upsellBtn.style.width = "max-content";

    // 3) Center it by wrapping in a block-level container (optional)
    const btnWrapper = document.createElement("div");
    btnWrapper.style.textAlign = "center";
    btnWrapper.appendChild(upsellBtn);

    // 4) Append to your mini-challenge box
    challenge.appendChild(btnWrapper);
    pg.appendChild(challenge);

    newPages.push(pg);
  });

  if (referenceNode) {
    // Food-Guide page exists → keep the old ordering
    newPages.forEach(pg => container.insertBefore(pg, referenceNode));

    // If you still want the locked teaser page, insert it here too.
    // const lockedPage = createMealPlanLockedPageFullSize();
    // container.insertBefore(lockedPage, referenceNode);
  } else {
    // No Food-Guide page → just tack pages on to the end
    newPages.forEach(pg => container.appendChild(pg));

    // Optional locked teaser page
    // const lockedPage = createMealPlanLockedPageFullSize();
    // container.appendChild(lockedPage);
  }

  // 8. Insert the new page immediately after the Food Guide page
  // newPages.forEach(pg => container.insertBefore(pg, referenceNode));

  // 9. Append the “locked” extension page (unchanged helper)
  // const lockedPage = createMealPlanLockedPageFullSize();
  // container.insertBefore(lockedPage, referenceNode);

  // 10. Add page numbers / footers
  addPageNumbers("pdf1WeekContainer");
}

function buildMealTable(mealObj, mealType) {
  if (!mealObj) {
    const p = document.createElement("p");
    p.textContent = `No ${mealType} meal available.`;
    return p;
  }

  const table = document.createElement("table");
  table.className = "session-table modern-table meal-plan-table";

  // Set up colgroup with columns: 30%, 35%, 35%
  const colgroup = document.createElement("colgroup");
  const col1 = document.createElement("col");
  col1.style.width = "30%";
  const col2 = document.createElement("col");
  col2.style.width = "35%";
  const col3 = document.createElement("col");
  col3.style.width = "35%";
  colgroup.appendChild(col1);
  colgroup.appendChild(col2);
  colgroup.appendChild(col3);
  table.appendChild(colgroup);

  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach((txt) => {
    const th = document.createElement("th");
    th.textContent = txt;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const row = document.createElement("tr");

  // Column 1: Meal name + macros
  const tdDetails = document.createElement("td");
  tdDetails.innerHTML = `
    <div class="meal-name-divider">${mealObj.mealName}</div>
    <div style="text-align:center; font-size:0.9rem;">
      Calories: ${mealObj.calories || "?"}<br/>
      Protein: ${mealObj.protein || "?"}g<br/>
      Carbs: ${mealObj.carbs || "?"}g<br/>
      Fat: ${mealObj.fats || "?"}g
    </div>
  `;
  row.appendChild(tdDetails);

  // Column 2: Ingredients
  const tdIngr = document.createElement("td");
  tdIngr.style.textAlign = "left";
  if (Array.isArray(mealObj.ingredients)) {
    mealObj.ingredients.forEach((ing) => {
      const div = document.createElement("div");
      let text;
      if (ing.wholeItem) {
        // e.g. "• 2 eggs" or "• 1 egg"
        const plural = ing.plural || ing.name + "s";
        text = `• ${ing.quantity} ${ing.quantity === 1 ? ing.singular : plural}`;
      } else {
        // e.g. "• 30g whey protein"
        text = `• ${ing.quantity}${ing.unit || ""} ${ing.name}`;
      }
      div.textContent = text;
      tdIngr.appendChild(div);
    });
  } else {
    tdIngr.textContent = "No ingredients listed.";
  }
  row.appendChild(tdIngr);

  // Column 3: Recipe steps
  const tdRecipe = document.createElement("td");
  tdRecipe.style.textAlign = "left";
  if (Array.isArray(mealObj.recipe)) {
    mealObj.recipe.forEach((step) => {
      const div = document.createElement("div");
      div.textContent = "• " + step;
      tdRecipe.appendChild(div);
    });
  } else {
    tdRecipe.textContent = "No recipe steps provided.";
  }
  row.appendChild(tdRecipe);

  tbody.appendChild(row);
  table.appendChild(tbody);
  return table;
}

function getMealFrequency() {
  // e.g. localStorage might contain "2", "3", or "4", or "2 meals"
  const freqRaw = localStorage.getItem("mealFrequency") || "4";
  // Try parseInt. e.g. parseInt("3 meals", 10) => 3
  const freq = parseInt(freqRaw, 10);
  if (freq === 2 || freq === 3 || freq === 4) {
    return freq;
  }
  return 4; // fallback
}

// For debugging if “mealFrequency” never got stored properly
function debugCheckMealFreq() {
  const raw = localStorage.getItem("mealFrequency");
  //console.log("DEBUG: localStorage mealFrequency=", raw, " => parsed=", getMealFrequency());
}

function calculateMacros(totalCals, macroRatio) {
  // standard: 4 kcal/g for protein, 4 kcal/g carbs, 9 kcal/g fats
  const p = Math.round((totalCals * (macroRatio.protein || 0)) / 4);
  const c = Math.round((totalCals * (macroRatio.carbs || 0)) / 4);
  const f = Math.round((totalCals * (macroRatio.fats || 0)) / 9);
  return { protein: p, carbs: c, fats: f };
}

function scaleIngredient(ingredient, multiplier) {
  let newQuantity = ingredient.quantity * multiplier;

  // 1) Decide if this is a whole-item ingredient (e.g., “eggs”).
  //    If wholeItem = true, the final integer must be at least 1.
  if (ingredient.wholeItem) {
    newQuantity = Math.round(newQuantity);
    if (newQuantity < 1) {
      newQuantity = 1; // Minimum 1 whole item
    }
  } else {
    // 2) For weight- or volume-based ingredients:
    //    - If ingredient.unit === "g" or "ml", enforce min of 1g/ml
    //    - Otherwise, fallback to your existing logic
    newQuantity = newQuantity >= 0 ? newQuantity : 0;

    // If specified in the meal database:
    //   "unit": "g" or "unit": "ml"
    const u = (ingredient.unit || "").toLowerCase();
    if (u === "g" || u === "ml") {
      // Force a 1g or 1ml minimum
      if (newQuantity < 1) {
        newQuantity = 1;
      } else {
        // Then do your "tiered" rounding if you want to keep that.
        if (newQuantity >= 50) {
          // nearest 5g
          newQuantity = Math.round(newQuantity / 5) * 5;
        } else if (newQuantity >= 5) {
          // nearest 1g
          newQuantity = Math.round(newQuantity);
        } else {
          // nearest 0.25g
          newQuantity = Math.round(newQuantity * 4) / 4;
        }
      }
    } else {
      // If no .unit or a unit that isn't g/ml,
      // use the tiered rounding or anything else you prefer:
      if (newQuantity >= 50) {
        newQuantity = Math.round(newQuantity / 5) * 5;
      } else if (newQuantity >= 5) {
        newQuantity = Math.round(newQuantity);
      } else {
        newQuantity = Math.round(newQuantity * 4) / 4;
      }
      // If you want a generic min 1 for *all* non-whole items, you could do:
      // if (newQuantity < 1) {
      //   newQuantity = 1;
      // }
    }
  }

  // Return the updated object
  return {
    ...ingredient,
    quantity: newQuantity
  };
}

function pickMealForCategory(category, mealTarget, database) {
  const lowerBound = 0.9 * mealTarget;
  const upperBound = 1.1 * mealTarget;

  //console.log(`\n[pickMealForCategory] Cat=${category} target=${mealTarget}, range=[${Math.round(lowerBound)}..${Math.round(upperBound)}]`);

  const possibleMeals = database.filter(m => {
    // A) category match
    if (!m.category || m.category.toLowerCase() !== category.toLowerCase()) return false;

    // B) calories within ±10 %
    if (m.calories < lowerBound || m.calories > upperBound) return false;

    // C) NEW RULE – recipe length ≤ 250 characters
    const recipeStr = Array.isArray(m.recipe) ? m.recipe.join(" ") : String(m.recipe ?? "");
    if (recipeStr.length > 200) return false;

    return true;
  });

  //console.log(`  -> Found ${possibleMeals.length} possible meal(s) for "${category}"`, possibleMeals.map(m => m.mealName));

  if (!possibleMeals.length) {
    // console.warn(`No ${category} meal found (≤250‑char recipe) in ±10% range for target ${mealTarget}`);
    return null;
  }

  // pick random
  const rndIndex = Math.floor(Math.random() * possibleMeals.length);
  const chosen = possibleMeals[rndIndex];

  // scale to exactly the mealTarget (within 0.9..1.1 clamp)
  const scaledMeal = portionScaleMeal(chosen, mealTarget);
  return scaledMeal;
}

function portionScaleMeal(meal, newCalorieTarget) {
  //console.log("\n--- portionScaleMeal START ---");
  //console.log("Original Meal:", meal.mealName);

  // 1) If the meal’s current .calories is X, 
  //    the scale factor = newCalorieTarget / X
  const baseCals = meal.calories;
  const rawScale = newCalorieTarget / baseCals;

  // Constrain to 0.9..1.1 or your chosen range
  const portionMultiplier = Math.max(0.9, Math.min(1.1, rawScale));
  //console.log(`Target cals=${newCalorieTarget}, base cals=${baseCals}, rawScale=${rawScale.toFixed(3)}, final multiplier=${portionMultiplier.toFixed(2)}`);

  // 2) Recompute the "actual" final total cals 
  //    after we clamp the portionMultiplier:
  const finalCals = Math.round(baseCals * portionMultiplier);

  // 3) Recompute macros from macroRatio * finalCals
  const macrosObj = calculateMacros(finalCals, meal.macroRatio);

  //console.log("New totalCals:", finalCals, " => macros:", macrosObj);

  // 4) Scale the portionSize
  const newPortionSize = parseFloat((meal.portionSize * portionMultiplier).toFixed(2));
  //console.log("Old portionSize=", meal.portionSize, " => new portionSize=", newPortionSize);

  // 5) Scale each ingredient
  const updatedIngredients = meal.ingredients.map(origIng => {
    const scaled = scaleIngredient(origIng, portionMultiplier);
    //console.log(`  Ingredient "${origIng.name}" => old qty=${origIng.quantity} new qty=${scaled.quantity}`);
    return scaled;
  });

  // 6) Return a brand-new meal object with updated cals, macros, ingredients, portionSize
  const updatedMeal = {
    ...meal,
    calories: finalCals,
    protein: macrosObj.protein,
    carbs: macrosObj.carbs,
    fats: macrosObj.fats,
    portionSize: newPortionSize,
    ingredients: updatedIngredients
  };

  //console.log("--- portionScaleMeal END ---\n");
  return updatedMeal;
}

/**************************************************
 *  UTILITY to replace {Workout Program Duration}
 *  with "1-Week", "4-Weeks", or "12-Weeks"
 **************************************************/
function replaceProgramDurationText(containerId, label) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // We'll search all paragraphs & replace the placeholder text
  const paragraphs = container.querySelectorAll("p");
  paragraphs.forEach(p => {
    if (p.innerHTML.includes("{Workout Program Duration}")) {
      p.innerHTML = p.innerHTML.replace(/\{Workout Program Duration\}/g, label);
    }
  });
}

/**************************************************
 * (G) 1-WEEK PDF Flow
 **************************************************/
function fillOneWeekPDF() {
  setGlobalFontSize();
  const userName = localStorage.getItem("name") || "User";
  const coverTitle = document.getElementById("oneWeekCoverTitle");
  if (coverTitle) {
    coverTitle.textContent = `${userName}'s Kickstart Guide`;
  }
  const userGoalRaw = localStorage.getItem("goal") || "Lose Weight";
  const userGoal = capitalizeGoal(userGoalRaw);
  const dob = localStorage.getItem("dob") || "1990-01-01";
  const heightVal = localStorage.getItem("height") || "170";
  const weightVal = localStorage.getItem("weight") || "70";
  const waterVal = localStorage.getItem("programWaterIntake") || "2.5";
  const selectedCals = parseInt(localStorage.getItem("selectedCalories") || "2200", 10);
  const p = Math.round((0.3 * selectedCals) / 4);
  const c = Math.round((0.4 * selectedCals) / 4);
  const f = Math.round((0.3 * selectedCals) / 9);
  const profileHeadingEl = document.getElementById("oneWeekProfileHeading");
  if (profileHeadingEl) profileHeadingEl.textContent = `${userName}'s Profile`;
  const dobEl = document.getElementById("dob");
  if (dobEl) dobEl.textContent = dob;
  const goalEl = document.getElementById("goal");
  if (goalEl) goalEl.textContent = userGoal;
  const heightEl = document.getElementById("height");
  if (heightEl) heightEl.textContent = `${heightVal} cm`;
  const weightEl = document.getElementById("weight");
  if (weightEl) weightEl.textContent = `${weightVal} kg`;
  const waterEl = document.getElementById("waterIntake");
  if (waterEl) waterEl.textContent = `${waterVal} L`;
  const proteinEl = document.getElementById("protein");
  if (proteinEl) proteinEl.textContent = `${p} g`;
  const carbsEl = document.getElementById("carbs");
  if (carbsEl) carbsEl.textContent = `${c} g`;
  const fatsEl = document.getElementById("fats");
  if (fatsEl) fatsEl.textContent = `${f} g`;
  // adjustDailyNutritionRows();
  // fillDailyNutritionRows();
  // finalizeWorkoutNavPage();
  // fillOneWeekClientProfilePage();
  // createNutritionIntroPage(document.getElementById("pdf1WeekContainer"));
  // buildWeeklyCalorieTableDynamically();
  buildThreeDayMealPlan();
  // createFoodGuidePage();
  fillOneWeekSessions();
  createProTrackerWorksPage();
  createFinalPage("1week", "pdf1WeekContainer");
  // const altPage = createAlternativeExercisesPage1Week();
  const theRealFinalPage = document.getElementById("final-page");
  const container = document.getElementById("pdf1WeekContainer");

  // if (altPage && theRealFinalPage && container) {
  //   container.insertBefore(altPage, theRealFinalPage);
  // }
  replaceProgramDurationText("pdf1WeekContainer", "1-Week");
  setUniformPageHeights();
  addPageNumbers("pdf1WeekContainer");
}

function saveWeeklyCaloriesFor12Weeks() {
  // For demonstration, let's assume each block of 4 weeks modifies the base
  // by ~75 kcals, just as an example. You can adapt your real logic here.
  const defBase = parseInt(localStorage.getItem("defCalsComputed") || "1800", 10);
  const surBase = parseInt(localStorage.getItem("surCalsComputed") || "2500", 10);
  const maintenance = parseInt(localStorage.getItem("maintenanceCalories") || "2200", 10);

  // Suppose the user goal:
  const userGoal = (localStorage.getItem("goal") || "lose").toLowerCase();

  // We'll do a very simplified approach:
  // Each week from 1..12:
  //   - If userGoal includes "lose": Weeks 1-3 => def, 4 => deload, 5-7 => def, 8 => deload, etc.
  //   - If userGoal includes "gain": Weeks 1-3 => sur, 4 => deload, ...
  //   - If userGoal includes "improve": your custom pattern
  // Each block of 4 weeks we can decrement or increment the base by 50 or 75 to mimic adaptation.
  const blockSize = 4;
  const decrementFactor = 75; // for demonstration
  // We'll store as localStorage.setItem("weekN_dailyCals", someNumber);

  let currentDef = defBase;
  let currentSur = surBase;
  let currentMaint = maintenance;

  for (let w = 1; w <= 12; w++) {
    // Check if we are at the start of a block (4-week block)
    const blockIndex = Math.floor((w - 1) / blockSize); // 0-based
    // We'll adapt the cals once we move to a new block
    if (w > 1 && (w - 1) % blockSize === 0) {
      // e.g. after 4, 8...
      currentDef -= decrementFactor;  // reduce deficit a bit each block
      currentSur -= decrementFactor;  // or reduce surplus to reflect new BMR, etc.
      currentMaint -= 25;            // maybe a small shift
    }

    let dailyTarget = currentMaint; // default to maintenance

    if (userGoal.includes("lose")) {
      // weeks 1-3 => def, 4 => deload, 5-7 => def, 8 => deload, ...
      const mod = (w - 1) % 4; // 0,1,2,3
      if (mod < 3) {
        // deficit
        dailyTarget = currentDef;
      } else {
        // deload
        dailyTarget = currentMaint;
      }
    } else if (userGoal.includes("gain")) {
      // weeks 1-3 => surplus, 4 => deload
      const mod = (w - 1) % 4;
      if (mod < 3) {
        dailyTarget = currentSur;
      } else {
        dailyTarget = currentMaint;
      }
    } else if (userGoal.includes("improve")) {
      const mod = week % 4; // 1,2,3,... => 1,2,3,0 pattern
      if (mod === 1 || mod === 2) {
        return defCals;  // Weeks 1 & 2 in each cycle → deficit
      } else if (mod === 3) {
        return surCals;  // Week 3 in each cycle → surplus
      } else {
        // mod === 0
        return deloadCals; // Week 4 in each cycle → deload
      }
    }

    localStorage.setItem(`week${w}_dailyCals`, dailyTarget.toString());
  }
}

/**
 * [2] Implementation of Weekly Adjustment Mode:
 *  - We track the daily difference from the target.
 *  - If within ±5%, we do nothing.
 *  - If outside ±5%, we store that surplus/deficit in a "runningBalance".
 *  - We distribute that difference gradually across the remaining days
 *    of the same week so we don’t cause big fluctuations.
 *
 * This requires we plan all 7 days at once, see if day1 was ±X, then
 * adjust day2..7 in increments not exceeding the 0.8–1.2 portion-scaling
 * constraint. For brevity, we do a simplified approach here.
 */
function applyWeeklyAdjustmentMode(daysArray, dailyTarget) {
  // daysArray is something like [ { dayIndex, totalCals, meals: [...] }, ... ]
  // We'll assume each item has .finalTotalCals after meal selection & scaling.
  // dailyTarget is the nominal daily target for that entire week.
  // We'll do a quick pass and accumulate difference in "weekBalance".

  let weekBalance = 0; // net surplus or deficit for the entire week so far

  daysArray.forEach((dayObj, idx) => {
    const dayDiff = dayObj.finalTotalCals - dailyTarget;
    const dayDiffPct = (dayDiff / dailyTarget) * 100;

    if (Math.abs(dayDiffPct) <= 5) {
      // within 5% => do nothing
      // but accumulate small difference in the weekBalance
      weekBalance += dayDiff;
    } else {
      // outside 5%, we add it to weekBalance
      weekBalance += dayDiff;
      // see if we can partially correct the next day
      // for example, let's shift 25% of the current surplus/deficit into the next day
      // while bounding the portion-scaling factor. For brevity, we won't do full details.
    }

    // We won't show the full multi-day distribution code here for brevity,
    // but in principle, you'd do:
    //  - If weekBalance is large, you reduce or increase the following day or days by small increments,
    //    ensuring you don't exceed the 0.8–1.2 portion multiplier.
    //  - You keep carrying leftover in weekBalance until the end of the week.
  });

  // Return the updated array if you actually changed dayObj.meals
  return daysArray;
}

function selectMealClosestToTarget(candidates, targetCals, rotationIndex = 0) {
  // [START OF UPDATE]
  // We handle tie-breakers with the following priorities:
  // 1) closest to target
  // 2) rotate selections to prevent repetition (using rotationIndex)
  // 3) highest protein
  // We'll do a two-step approach:
  // (a) sort by absolute difference from target
  // (b) then group ties, rotate or compare protein

  // If no candidates:
  if (!candidates || candidates.length === 0) return null;

  // Sort by absolute difference from target first
  const sorted = [...candidates].sort((a, b) => {
    const diffA = Math.abs(a.calories - targetCals);
    const diffB = Math.abs(b.calories - targetCals);
    if (diffA === diffB) {
      // We'll just sort by protein descending as a fallback for now
      return b.protein - a.protein;
    }
    return diffA - diffB;
  });

  // Now the best is at sorted[0], but we need to handle potential ties
  // Let's find all meals that have the same diff as sorted[0].
  const bestDiff = Math.abs(sorted[0].calories - targetCals);
  const sameDiffGroup = sorted.filter(
    (m) => Math.abs(m.calories - targetCals) === bestDiff
  );

  if (sameDiffGroup.length === 1) {
    // only one
    return sameDiffGroup[0];
  }

  // If multiple: rotate by the rotationIndex
  const idx = rotationIndex % sameDiffGroup.length;
  return sameDiffGroup[idx];
  // [END OF UPDATE]
}

function adjustPortionSize(originalMeal, targetCals) {
  if (!originalMeal) return null;
  const meal = JSON.parse(JSON.stringify(originalMeal)); // clone

  // If meal is already within 0.8..1.2 * target, no changes:
  const lowerBound = targetCals * 0.8;
  const upperBound = targetCals * 1.2;
  if (meal.calories >= lowerBound && meal.calories <= upperBound) {
    return meal;
  }

  // Otherwise, scale:
  const scaleFactor = targetCals / meal.calories;
  let finalScale = Math.max(0.8, Math.min(1.2, scaleFactor));

  meal.calories = Math.round(meal.calories * finalScale);
  meal.protein = Math.round(meal.protein * finalScale);
  meal.carbs = Math.round(meal.carbs * finalScale);
  meal.fats = Math.round(meal.fats * finalScale);
  meal.portionSize = parseFloat((meal.portionSize * finalScale).toFixed(2));

  // Round ingredients if they contain numbers (simple approach)
  meal.ingredients = meal.ingredients.map((ing) => {
    const match = ing.match(/(\d+)(g|ml)/i);
    if (match) {
      let val = parseFloat(match[1]);
      let newVal = Math.round(val * finalScale);
      if (newVal >= 20) {
        // round to nearest 5
        newVal = Math.round(newVal / 5) * 5;
      }
      return ing.replace(/\d+(g|ml)/, `${newVal}${match[2]}`);
    }
    return ing;
  });

  return meal;
}

function build12WeekMealPlanDay(weekNumber, dayNumber) {
  const dailyCals = parseInt(localStorage.getItem(`week${weekNumber}_dailyCalsWMCO`) || "2000", 10);

  // weight-loss splits for example, etc.
  const splits = { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.25, Snack: 0.15 };

  const breakfastTarget = Math.round(dailyCals * splits.Breakfast);
  const lunchTarget = Math.round(dailyCals * splits.Lunch);
  const dinnerTarget = Math.round(dailyCals * splits.Dinner);
  const snackTarget = Math.round(dailyCals * splits.Snack);

  //console.log(`\n--- build12WeekMealPlanDay(W${weekNumber}D${dayNumber}) dailyCals=${dailyCals} ---`);
  //console.log(` breakfast=${breakfastTarget}, lunch=${lunchTarget}, dinner=${dinnerTarget}, snack=${snackTarget}`);

  // pick & scale
  const breakfastMeal = pickMealForCategory("Breakfast", breakfastTarget, mealDatabase);
  const lunchMeal = pickMealForCategory("Lunch", lunchTarget, mealDatabase);
  const dinnerMeal = pickMealForCategory("Dinner", dinnerTarget, mealDatabase);
  const snackMeal = pickMealForCategory("Snack", snackTarget, mealDatabase);

  let finalTotalCals = 0;
  [breakfastMeal, lunchMeal, dinnerMeal, snackMeal].forEach(m => {
    if (m) finalTotalCals += m.calories;
  });

  return {
    week: weekNumber,
    day: dayNumber,
    meals: {
      Breakfast: breakfastMeal,
      Lunch: lunchMeal,
      Dinner: dinnerMeal,
      Snack: snackMeal
    },
    finalTotalCals
  };
}

function buildAndRender12WeekMealPlan(containerId, fromWeek, toWeek) {
  debugCheckMealFreq(); // console log what we see in localStorage

  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  // This is what the user sets in forms.js
  const mealFrequency = getMealFrequency();
  const userGoal = (localStorage.getItem("goal") || "Lose").toLowerCase();

  // We'll define a helper to build the meal table (with notes row)
  function buildMealTable(mealObj, mealType) {
    if (!mealObj) {
      const p = document.createElement("p");
      p.textContent = `No ${mealType} meal found.`;
      return p;
    }
    const tbl = document.createElement("table");
    tbl.className = "session-table modern-table meal-plan-table";

    // Set up colgroup => middle column bigger
    const cg = document.createElement("colgroup");
    const c1 = document.createElement("col");
    c1.style.width = "30%";
    const c2 = document.createElement("col");
    c2.style.width = "35%";
    const c3 = document.createElement("col");
    c3.style.width = "35%";
    cg.appendChild(c1);
    cg.appendChild(c2);
    cg.appendChild(c3);
    tbl.appendChild(cg);

    const thead = document.createElement("thead");
    const thr = document.createElement("tr");
    ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      thr.appendChild(th);
    });
    thead.appendChild(thr);
    tbl.appendChild(thead);

    const tbody = document.createElement("tbody");
    const row = document.createElement("tr");

    // Column 1: Name + Macros
    const td1 = document.createElement("td");
    td1.innerHTML = `
      <div class="meal-name-divider">${mealObj.mealName}</div>
      <div style="text-align:center;font-size:0.9rem;">
        Calories: ${mealObj.calories}<br/>
        Protein: ${mealObj.protein}g<br/>
        Carbs: ${mealObj.carbs}g<br/>
        Fat: ${mealObj.fats}g
      </div>
    `;
    row.appendChild(td1);

    // Column 2: Ingredients
    const td2 = document.createElement("td");
    td2.style.textAlign = "left";
    mealObj.ingredients.forEach(ing => {
      let line = "";
      if (ing.wholeItem) {
        const singular = ing.singular || ing.name;
        const plural = ing.plural || ing.name + "s";
        line = `${ing.quantity} ${ing.quantity === 1 ? singular : plural}`;
      } else {
        if (ing.unit) {
          line = `${ing.quantity}${ing.unit} ${ing.name}`;
        } else {
          line = `${ing.quantity} ${ing.name}`;
        }
      }
      const div = document.createElement("div");
      div.textContent = "• " + line;
      td2.appendChild(div);
    });
    row.appendChild(td2);

    // Column 3: Recipe
    const td3 = document.createElement("td");
    td3.style.textAlign = "left";
    if (Array.isArray(mealObj.recipe)) {
      mealObj.recipe.forEach(step => {
        const div = document.createElement("div");
        div.textContent = "• " + step;
        td3.appendChild(div);
      });
    } else {
      td3.textContent = "No recipe steps provided.";
    }
    row.appendChild(td3);

    tbody.appendChild(row);

    // Always add the "Notes" row—even if mealObj.mealNotes is empty.
    const notesArr = mealObj.mealNotes || [];
    const notesRow = document.createElement("tr");
    notesRow.className = "meal-notes-row";
    const notesCell = document.createElement("td");
    notesCell.colSpan = 3;
    // Force the text color to black to ensure visibility on all pages.
    notesCell.style.color = "#000";
    notesCell.textContent = notesArr.length ? notesArr.join(" | ") : "Enjoy your meal!";
    notesRow.appendChild(notesCell);
    tbody.appendChild(notesRow);

    tbl.appendChild(tbody);
    return tbl;
  }

  // For each week in [fromWeek..toWeek], we do 7 days => 2 PDF pages each day
  for (let w = fromWeek; w <= toWeek; w++) {
    const baseDailyCals = parseInt(localStorage.getItem(`week${w}_dailyCalsWMCO`) || "2000", 10);
    const phase = getPhaseForWeek(w, userGoal);

    // Figure out the ratio object for this phase & mealFrequency
    const ratioObj = getSplitsObj(phase, mealFrequency);
    // Example ratioObj => {Breakfast:0.3, Lunch:0.4, Dinner:0.3} for 3-meals deficit

    for (let d = 1; d <= 7; d++) {
      //console.log(`\n=== Week ${w} - Day ${d}, mealFreq=${mealFrequency}, phase=${phase} ===`);
      //console.log(` dailyCals=${baseDailyCals} => ratioObj=`, ratioObj);

      // Build the dayMeals object
      const dayMeals = {};
      Object.entries(ratioObj).forEach(([cat, r]) => {
        const mealTarget = Math.round(baseDailyCals * r);
        //console.log(`   ${cat} => ${Math.round(r * 100)}% => target=${mealTarget}`);
        const meal = pickMealForCategory(cat, mealTarget, mealDatabase);
        dayMeals[cat] = meal;
      });

      // Now we have only the categories that appear in ratioObj
      const allCats = Object.keys(ratioObj); // e.g. ["Breakfast","Lunch","Dinner"]
      // We'll do page1 for the first 2 categories, page2 for the rest
      const page1Cats = allCats.slice(0, 2);
      const page2Cats = allCats.slice(2);

      // ============ PAGE 1 ============ 
      const page1 = document.createElement("div");
      page1.className = "pdf-page meal-plan-page";
      // top-left logo
      const logo1 = document.createElement("div");
      logo1.className = "page-header-left-logo";
      logo1.innerHTML = `<img src="../assets/rtb-logo-white.png" alt="Badge" class="logo-badge"/>`;
      page1.appendChild(logo1);

      const heading1 = document.createElement("h3");
      heading1.className = "page-heading with-badge-logo";
      heading1.textContent = `Week ${w} - Day ${d}`;
      page1.appendChild(heading1);

      // For each cat in page1Cats
      page1Cats.forEach(cat => {
        const sh = document.createElement("h4");
        sh.className = "subheading";
        sh.textContent = cat;
        page1.appendChild(sh);

        const mealTbl = buildMealTable(dayMeals[cat], cat);
        page1.appendChild(mealTbl);
      });

      container.appendChild(page1);

      // ============ PAGE 2 ============ 
      // If page2Cats is empty, we skip
      if (page2Cats.length) {
        const page2 = document.createElement("div");
        page2.className = "pdf-page meal-plan-page";

        const logo2 = document.createElement("div");
        logo2.className = "page-header-left-logo";
        logo2.innerHTML = `<img src="../assets/rtb-logo-white.png" alt="Badge" class="logo-badge"/>`;
        page2.appendChild(logo2);

        const heading2 = document.createElement("h3");
        heading2.className = "page-heading with-badge-logo";
        heading2.textContent = `Week ${w} - Day ${d}`;
        page2.appendChild(heading2);

        page2Cats.forEach(cat => {
          const sh = document.createElement("h4");
          sh.className = "subheading";
          sh.textContent = cat;
          page2.appendChild(sh);

          const mealTbl = buildMealTable(dayMeals[cat], cat);
          page2.appendChild(mealTbl);
        });

        container.appendChild(page2);
      }
    }
  }
}

function getFilteredMealsForPhase(phase, userDiet, userAllergies) {
  // Convert userAllergies to array if needed
  let allergiesArr = [];
  if (Array.isArray(userAllergies)) {
    allergiesArr = userAllergies;
  } else if (typeof userAllergies === "string" && userAllergies !== "None of the above") {
    allergiesArr = [userAllergies];
  }

  // Filter logic
  return mealDatabase.filter((meal) => {
    // Step 2a: Filter by dietaryPhase
    if (!meal.dietaryPhase.includes(phase)) {
      return false;
    }

    // Step 2b: Filter by dietary restrictions
    // If user is "No Restrictions", pass all. Otherwise meal must match userDiet exactly.
    if (userDiet && userDiet !== "No Restrictions") {
      // For instance, "Vegetarian" => the meal must have "Vegetarian" in meal.dietaryRestrictions
      if (!meal.dietaryRestrictions.includes(userDiet)) {
        return false;
      }
    }

    // Step 2c: Filter by allergies
    // If userAllergies is "None of the above", pass all. Otherwise exclude meals that contain any of those allergens
    if (allergiesArr.length) {
      // If the meal's allergens intersect with userAllergies => exclude
      for (let i = 0; i < allergiesArr.length; i++) {
        if (meal.allergens.includes(allergiesArr[i])) {
          return false;
        }
      }
    }

    return true;
  });
}

// const ratioData = {
//   deficitPhase: {
//     2: { Lunch: 0.55, Dinner: 0.45 },
//     3: { Breakfast: 0.30, Lunch: 0.40, Dinner: 0.30 },
//     4: { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.25, Snack: 0.15 }
//   },
//   surplusPhase: {
//     2: { Lunch: 0.50, Dinner: 0.50 },
//     3: { Breakfast: 0.33, Lunch: 0.33, Dinner: 0.34 },
//     4: { Breakfast: 0.30, Lunch: 0.30, Dinner: 0.30, Snack: 0.10 }
//   },
//   deloadPhase: {
//     2: { Lunch: 0.52, Dinner: 0.48 },
//     3: { Breakfast: 0.30, Lunch: 0.35, Dinner: 0.35 },
//     4: { Breakfast: 0.28, Lunch: 0.30, Dinner: 0.28, Snack: 0.14 }
//   }
// };

/**
 * 2) HELPER - CALCULATE THE USER’S WEEKLY PHASE
 *    Based on user’s goal & which week number (1-4).
 */
function getPhaseForWeek(weekNum, userGoal) {
  // Example logic:
  const g = userGoal.toLowerCase();
  // w4 => deload, else deficit/surplus
  if (g.includes("lose")) {
    return (weekNum === 4) ? "deloadPhase" : "deficitPhase";
  } else if (g.includes("gain")) {
    return (weekNum === 4) ? "deloadPhase" : "surplusPhase";
  } else {
    // improve body comp => e.g. w1-2 => deficit, w3 => surplus, w4 => deload
    if (weekNum === 1 || weekNum === 2) return "deficitPhase";
    if (weekNum === 3) return "surplusPhase";
    return "deloadPhase";
  }
}

function getSplitsObj(phase, mealFreq) {
  if (!ratioData[phase]) return ratioData.deloadPhase[mealFreq] || ratioData.deloadPhase[4];
  return ratioData[phase][mealFreq] || ratioData[phase][4];
}

/**
 * 3) DETERMINE CALORIC TARGETS FOR THE 4 WEEKS,
 *    THEN BREAK DOWN BY MEAL TYPE (Breakfast, Lunch, Dinner, Snacks).
 *    Return an object that tells us how many cals each meal should have
 *    for each day of each week.
 */
function getWeeklyMealTargets(userGoal) {
  // We'll pull the dailyDeficit, dailySurplus, dailyDeload from local storage
  // which your "fillDailyNutritionVars" sets. Or you can get them from your final calculations.
  const dailyDeficit = parseInt(localStorage.getItem("defCalsComputed") || "1800", 10);
  const dailySurplus = parseInt(localStorage.getItem("surCalsComputed") || "2500", 10);
  const dailyDeload = parseInt(localStorage.getItem("maintenanceCalories") || "2000", 10);

  // We define the meal percentage splits for each phase:
  const splits = {
    deficitPhase: { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.25, Snack: 0.15 },
    surplusPhase: { Breakfast: 0.30, Lunch: 0.30, Dinner: 0.30, Snack: 0.10 },
    deloadPhase: { Breakfast: 0.28, Lunch: 0.30, Dinner: 0.28, Snack: 0.14 },
  };

  // We'll build a structure: 
  // weeklyMealTargets = {
  //   week1: {
  //     day1: { Breakfast: <number>, Lunch: <number>, ... },
  //     day2: { ... },
  //     ...
  //     day7: { ... }
  //   },
  //   week2: {...}
  // }
  const result = {};

  for (let w = 1; w <= 4; w++) {
    const phase = getPhaseForWeek(userGoal, w);
    const dailyCals =
      phase === "deficitPhase" ? dailyDeficit :
        phase === "surplusPhase" ? dailySurplus :
          dailyDeload;

    const mealSplit = splits[phase];
    result["week" + w] = {};

    for (let d = 1; d <= 7; d++) {
      result["week" + w]["day" + d] = {
        Breakfast: Math.round(dailyCals * mealSplit.Breakfast),
        Lunch: Math.round(dailyCals * mealSplit.Lunch),
        Dinner: Math.round(dailyCals * mealSplit.Dinner),
        Snack: Math.round(dailyCals * mealSplit.Snack),
        phaseUsed: phase
      };
    }
  }
  return result;
}

/**
 * 4) CORE MEAL-SELECTION + ADJUSTMENT (Steps 3 & 4 from your spec)
 *    - Given a set of candidate meals (already filtered) and a target calorie,
 *      pick the best meal based on closeness to the target,
 *      tie-break on highest protein, then random.
 *    - Check if within ±10%. If not, scale the meal portion.
 */
function selectAndAdjustMeal(candidates, targetCals) {
  if (!candidates.length) return null; // no meal available

  // 4A) Pick best meal by closeness
  let bestMeal = null;
  let smallestDiff = Infinity;
  const withinRange = (val, target) => Math.abs(val - target);

  // First pass: find the smallest difference
  for (const meal of candidates) {
    const diff = withinRange(meal.calories, targetCals);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestMeal = meal;
    } else if (diff === smallestDiff && meal.protein && bestMeal?.protein) {
      // tie-break on highest protein
      if (meal.protein > bestMeal.protein) {
        bestMeal = meal;
      } else if (meal.protein === bestMeal.protein) {
        // final tie-break => random
        if (Math.random() > 0.5) {
          bestMeal = meal;
        }
      }
    }
  }

  if (!bestMeal) return null;

  // 4B) Check threshold
  const tenPercent = 0.1 * targetCals;
  const diff = Math.abs(bestMeal.calories - targetCals);

  // If within ±10%, no adjustment needed
  if (diff <= tenPercent) {
    return { ...bestMeal }; // no scaling
  }

  // Otherwise we scale
  const scalingFactor = targetCals / bestMeal.calories;

  // We clamp the scalingFactor between 0.8x and 1.2x
  let finalScale = Math.max(0.8, Math.min(1.2, scalingFactor));

  // 4C) scale macros & portion size
  const adjustedMeal = JSON.parse(JSON.stringify(bestMeal)); // deep copy
  adjustedMeal.calories = Math.round(adjustedMeal.calories * finalScale);
  adjustedMeal.protein = Math.round(adjustedMeal.protein * finalScale);
  adjustedMeal.carbs = Math.round(adjustedMeal.carbs * finalScale);
  adjustedMeal.fats = Math.round(adjustedMeal.fats * finalScale);
  adjustedMeal.portionSize = Number((adjustedMeal.portionSize * finalScale).toFixed(2));

  // 4D) (Optional) round ingredient amounts 
  // For demonstration, we'll do a basic round to nearest 5g for proteins, nearest 1g for small items, etc.
  // (You can refine these rules as needed.)
  // We'll just add a note in the ingredient for now, to indicate scaling. 
  adjustedMeal.ingredients = adjustedMeal.ingredients.map((ing) => {
    // Example: if the ingredient ends in a number + "g" or "ml", we scale it
    // This is very simplistic:
    const m = ing.match(/(\d+)(g|ml)/i);
    if (m) {
      let originalVal = parseFloat(m[1]);
      let unit = m[2];
      let scaledVal = Math.round(originalVal * finalScale);
      // if protein-like item, round to nearest 5:
      if (scaledVal >= 20) {
        scaledVal = Math.round(scaledVal / 5) * 5;
      }
      return ing.replace(/\d+(g|ml)/, scaledVal + unit);
    }
    return ing; // not scaled
  });

  return adjustedMeal;
}

function build28DayMealPlanRework(options = {}) {
  let fromW = options.fromWeek || 1;
  let toW = options.toWeek || 4;
  let targetId = options.targetContainerId || "pdf4MealPlansContainer";

  const container = document.getElementById(targetId);
  if (!container) return;
  container.innerHTML = "";
  const userGoal = localStorage.getItem("goal") || "Weight Loss";
  const userDiet = localStorage.getItem("dietaryRestrictions") || "No Restrictions";
  let userAllergies = localStorage.getItem("foodAllergies") || "None of the above";
  try {
    userAllergies = JSON.parse(userAllergies);
  } catch (e) {
  }
  const weeklyTargets = getWeeklyMealTargets(userGoal);

  function getAllPhasesForCategory(category) {
    return ["deficitPhase", "surplusPhase", "deloadPhase"];
  }

  // Quick function to approximate average needed cals for a category across all 4 weeks
  function approximateCategoryCals(category) {
    let total = 0;
    let daysCount = 0;
    for (let w = 1; w <= 4; w++) {
      for (let d = 1; d <= 7; d++) {
        total += weeklyTargets["week" + w]["day" + d][category];
        daysCount++;
      }
    }
    return Math.round(total / daysCount);
  }

  const categoryQuota = {
    Breakfast: 10,
    Lunch: 14,
    Dinner: 14,
    Snack: 10
  };

  const finalMealsPool = {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: []
  };

  ["Breakfast", "Lunch", "Dinner", "Snack"].forEach(cat => {
    const avgCalsNeeded = approximateCategoryCals(cat);

    // Potentially valid meals for cat come from ANY of the 3 phases
    const phases = getAllPhasesForCategory(cat);
    let candidates = mealDatabase.filter(m => {
      if (m.category.toLowerCase() !== cat.toLowerCase()) return false;
      if (userDiet !== "No Restrictions" && !m.dietaryRestrictions.includes(userDiet)) return false;
      if (Array.isArray(userAllergies) && userAllergies.length) {
        for (let a of userAllergies) {
          if (m.allergens.includes(a)) return false;
        }
      } else if (typeof userAllergies === "string" && userAllergies !== "None of the above") {
        if (m.allergens.includes(userAllergies)) return false;
      }
      // If it passes, keep it
      return true;
    });

    // Sort them by closeness to avgCalsNeeded
    candidates.sort((a, b) => {
      const diffA = Math.abs(a.calories - avgCalsNeeded);
      const diffB = Math.abs(b.calories - avgCalsNeeded);
      if (diffA === diffB) {
        // tie-break => highest protein
        if (b.protein === a.protein) {
          // random
          return Math.random() - 0.5 > 0 ? 1 : -1;
        }
        return b.protein - a.protein;
      }
      return diffA - diffB;
    });

    // We only want up to categoryQuota[cat] distinct meals
    const topCandidates = candidates.slice(0, categoryQuota[cat]);
    finalMealsPool[cat] = topCandidates; // no scaling at this stage
  });

  // If we have fewer than 48 total, that’s okay. We use what we have.

  // (D) Now we produce the 28-day plan, day by day, using the finalMealsPool in a cycle:
  // The spec gave an example of cycling the 7 meals for each week. 
  // We'll build an array of meal references for each category, then cycle them.

  const dayByDayPlan = []; // array of { week: n, day: n, meals: {Breakfast, Lunch, Dinner, Snacks} }
  // We'll create cyc indexes:
  let cycIdx = { Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 };

  for (let w = 1; w <= 4; w++) {
    for (let d = 1; d <= 7; d++) {
      const dayObj = { week: w, day: d, meals: {} };
      const dayTargets = weeklyTargets["week" + w]["day" + d]; // { Breakfast: X cals, Lunch: X cals, ... }

      // For each category, pick the meal from finalMealsPool in cyc fashion
      ["Breakfast", "Lunch", "Dinner", "Snack"].forEach(cat => {
        const pool = finalMealsPool[cat];
        if (!pool.length) {
          dayObj.meals[cat] = null;
          return;
        }

        const meal = pool[cycIdx[cat] % pool.length];
        cycIdx[cat]++;

        // Now re-check if this meal is valid for the day’s phase
        // (If not, we might attempt to find an alternative. If none found, we set null.)
        const dayPhase = dayTargets.phaseUsed;
        if (!meal.dietaryPhase.includes(dayPhase)) {
          // Try to find any other meal in the pool that does match
          let altFound = null;
          for (let alt of pool) {
            if (alt.dietaryPhase.includes(dayPhase)) {
              altFound = alt;
              break;
            }
          }
          if (!altFound) {
            dayObj.meals[cat] = null; // no suitable meal
          } else {
            // portion scaling to day’s cals
            dayObj.meals[cat] = selectAndAdjustMeal([altFound], dayTargets[cat]);
          }
        } else {
          // We do the portion scaling to match day’s cals
          dayObj.meals[cat] = selectAndAdjustMeal([meal], dayTargets[cat]);
        }
      });

      dayByDayPlan.push(dayObj);
    }
  }

  // (E) Finally, display these 28 days -> 2 meals per page, 2 pages per day (4 meals per day).
  render28DayMealPlanRework(dayByDayPlan, targetId);
}

function fillMealPlanCoverPage() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("fourWeekMealPlanCoverTitle");
  if (coverTitleEl) {
    // If the fallback generic string is returned, omit the possessive form.
    if (adjustedName === "8 Weeks to Your Best Self—Don't Stop Now!") {
      coverTitleEl.textContent = "Your Meal Plan";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s 4-Week Meal Plan`;
    }
  }
}

function render28DayMealPlanRework(planArray, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  // Helper to build a single meal table
  function buildMealTable(meal, mealType) {
    // If meal is null => no meal found
    if (!meal) {
      const p = document.createElement("p");
      p.textContent = `No ${mealType} meal available.`;
      return p;
    }
    const table = document.createElement("table");
    table.className = "session-table modern-table meal-plan-table";

    // thead
    const thead = document.createElement("thead");
    const thr = document.createElement("tr");
    ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach(txt => {
      const th = document.createElement("th");
      th.textContent = txt;
      thr.appendChild(th);
    });
    thead.appendChild(thr);
    table.appendChild(thead);

    // tbody
    const tbody = document.createElement("tbody");
    const tr = document.createElement("tr");

    // col 1 - name & macros
    const td1 = document.createElement("td");
    td1.className = "col-2";
    td1.innerHTML = `
      <div class="meal-name-divider">${meal.mealName}</div>
      <div style="text-align:center; font-size:0.9rem;">
        Calories: ${meal.calories}<br/>
        Protein: ${meal.protein}g<br/>
        Carbs: ${meal.carbs}g<br/>
        Fat: ${meal.fats}g
      </div>
    `;
    tr.appendChild(td1);

    // col 2 - ingredients
    const td2 = document.createElement("td");
    td2.className = "col-4";
    td2.style.textAlign = "left";
    meal.ingredients.forEach(ing => {
      const div = document.createElement("div");
      div.textContent = "• " + ing;
      td2.appendChild(div);
    });
    tr.appendChild(td2);

    // col 3 - recipe
    const td3 = document.createElement("td");
    td3.className = "col-4";
    td3.style.textAlign = "left";
    meal.recipe.forEach(step => {
      const div = document.createElement("div");
      div.textContent = "• " + step;
      td3.appendChild(div);
    });
    tr.appendChild(td3);

    tbody.appendChild(tr);
    table.appendChild(tbody);

    return table;
  }

  // We have 28 days. For each day, we create 2 PDF pages. The user wants:
  //  Page 1: Breakfast + Lunch
  //  Page 2: Dinner + Snacks
  planArray.forEach((obj) => {
    const { week, day, meals } = obj;
    // Page heading = "Week X - Day Y"
    const headingText = `Week ${week} - Day ${day}`;

    // Build page1
    const page1 = document.createElement("div");
    page1.className = "pdf-page meal-plan-page";

    // Subheading
    const hSub1 = document.createElement("h3");
    hSub1.className = "page-heading with-badge-logo";
    hSub1.textContent = headingText;
    page1.appendChild(hSub1);

    // Smaller subheading "Breakfast"
    const s1 = document.createElement("h4");
    s1.textContent = "Breakfast";
    s1.className = "subheading";
    page1.appendChild(s1);

    // Breakfast table
    const breakfastTable = buildMealTable(meals.Breakfast, "Breakfast");
    page1.appendChild(breakfastTable);

    // Next subheading "Lunch"
    const s2 = document.createElement("h4");
    s2.textContent = "Lunch";
    s2.className = "subheading";
    page1.appendChild(s2);

    const lunchTable = buildMealTable(meals.Lunch, "Lunch");
    page1.appendChild(lunchTable);

    container.appendChild(page1);

    // Build page2
    const page2 = document.createElement("div");
    page2.className = "pdf-page meal-plan-page";

    // Same day heading again
    const hSub2 = document.createElement("h3");
    hSub2.className = "page-heading with-badge-logo";
    hSub2.textContent = headingText;
    page2.appendChild(hSub2);

    // "Dinner"
    const s3 = document.createElement("h4");
    s3.textContent = "Dinner";
    s3.className = "subheading";
    page2.appendChild(s3);

    const dinnerTable = buildMealTable(meals.Dinner, "Dinner");
    page2.appendChild(dinnerTable);

    // "Snacks"
    const s4 = document.createElement("h4");
    s4.textContent = "Snack";
    s4.className = "subheading";
    page2.appendChild(s4);

    const snackTable = buildMealTable(meals.Snack, "Snack");
    page2.appendChild(snackTable);

    container.appendChild(page2);
  });
}

/**************************************************
 * (H) 4-WEEK & 12-WEEK PDF placeholders
 **************************************************/
function fillfoureWeekPDF() {
  const container = document.getElementById("pdf4WeekContainer");
  if (!container) return;
  const coverTitle = document.getElementById("fourWeekCoverTitle");
  if (coverTitle) {
    coverTitle.textContent = "Your 4-Week Program (Placeholder)";
  }
}

function fillTwelveWeekPDF() {
  const container = document.getElementById("pdf12WeekContainer");
  if (!container) return;
  const coverTitle = document.getElementById("twelveWeekCoverTitle");
  if (coverTitle) {
    coverTitle.textContent = "Your 12-Week Program (Placeholder)";
  }
}

/**************************************************
 * (I) fillOneWeekSessions
 **************************************************/
// function fillOneWeekSessions() {
//   const sessionsContainer = document.getElementById("oneWeekSessions");
//   if (!sessionsContainer) return;
//   sessionsContainer.innerHTML = "";

//   const stored = localStorage.getItem("oneWeekProgram");
//   if (!stored) {
//     const msg = document.createElement("p");
//     msg.textContent = "No 1-week program data found in localStorage.";
//     sessionsContainer.appendChild(msg);
//     return;
//   }

//   let oneWeekData;
//   try {
//     oneWeekData = JSON.parse(stored);
//   } catch (e) {
//     console.error("Parsing oneWeekProgram error:", e);
//     return;
//   }

//   const days = oneWeekData.days || [];

//   days.forEach((dayObj, dayIndex) => {
//     // -----------------------------
//     // PAGE 1: Warm-Up & Cool-Down
//     // -----------------------------
//     const pgWarm = document.createElement("div");
//     pgWarm.className = "pdf-page";

//     // Page header + logo
//     const badgeDiv = document.createElement("div");
//     badgeDiv.className = "page-header-left-logo";
//     badgeDiv.innerHTML = `<img src="../assets/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
//     pgWarm.appendChild(badgeDiv);

//     const h3 = document.createElement("h3");
//     h3.className = "page-heading with-badge-logo";
//     h3.textContent = `${oneWeekData.phase} - Week ${oneWeekData.week} - Day ${dayIndex + 1}`;
//     pgWarm.appendChild(h3);

//     // 1) Warm-Up Section
//     if (dayObj.warmUp && dayObj.warmUp.length > 0) {
//       const warmTitle = document.createElement("h4");
//       warmTitle.className = "section-heading";
//       warmTitle.textContent = "Pre-Workout Warm-Up";
//       pgWarm.appendChild(warmTitle);

//       const warmWrap = document.createElement("div");
//       warmWrap.className = "session-table-container modern-table-wrapper";

//       const warmTable = document.createElement("table");
//       warmTable.className = "session-table modern-table";

//       // Table header
//       const wThead = document.createElement("thead");
//       const wTr = document.createElement("tr");
//       ["Exercise", "Duration", "RPE", "Notes"].forEach(col => {
//         const th = document.createElement("th");
//         th.textContent = col;
//         wTr.appendChild(th);
//       });
//       wThead.appendChild(wTr);
//       warmTable.appendChild(wThead);

//       // Table body
//       const wTbody = document.createElement("tbody");
//       dayObj.warmUp.forEach(wu => {
//         const row = buildExerciseRow(
//           wu.name || "Warm-Up",
//           wu.duration || "",
//           wu.rpe ? `RPE ${wu.rpe}` : "",
//           wu.notes || ""
//         );
//         wTbody.appendChild(row);
//       });
//       warmTable.appendChild(wTbody);

//       warmWrap.appendChild(warmTable);
//       pgWarm.appendChild(warmWrap);
//     }

//     // 2) Cool-Down Section
//     if (dayObj.coolDown && dayObj.coolDown.length > 0) {
//       const coolTitle = document.createElement("h4");
//       coolTitle.className = "section-heading";
//       coolTitle.textContent = "Post-Workout Cool-Down";
//       pgWarm.appendChild(coolTitle);

//       const coolWrap = document.createElement("div");
//       coolWrap.className = "session-table-container modern-table-wrapper";

//       const coolTable = document.createElement("table");
//       coolTable.className = "session-table modern-table";

//       // Table header
//       const cThead = document.createElement("thead");
//       const cTr = document.createElement("tr");
//       ["Exercise", "Duration", "RPE", "Notes"].forEach(col => {
//         const th = document.createElement("th");
//         th.textContent = col;
//         cTr.appendChild(th);
//       });
//       cThead.appendChild(cTr);
//       coolTable.appendChild(cThead);

//       // Table body
//       const cTbody = document.createElement("tbody");
//       dayObj.coolDown.forEach(cd => {
//         const row = buildExerciseRow(
//           cd.name || "Cool-Down",
//           cd.duration || "",
//           cd.rpe ? `RPE ${cd.rpe}` : "",
//           cd.notes || ""
//         );
//         cTbody.appendChild(row);
//       });
//       coolTable.appendChild(cTbody);

//       coolWrap.appendChild(coolTable);
//       pgWarm.appendChild(coolWrap);
//     }

//     // Note: "Please see the next page..."
//     const noteNext = document.createElement("p");
//     noteNext.className = "note-text-nav";
//     noteNext.style.textAlign = "center";
//     noteNext.style.fontStyle = "italic";
//     noteNext.style.fontSize = "0.9rem";
//     noteNext.textContent = "Please see the next page for the main workout.";
//     pgWarm.appendChild(noteNext);

//     sessionsContainer.appendChild(pgWarm);


//     // -----------------------------
//     // PAGE 2: Main Workout
//     // (Resistance Training + Cardio)
//     // -----------------------------
//     const pgMain = document.createElement("div");
//     pgMain.className = "pdf-page lyw-page";

//     const badgeMain = document.createElement("div");
//     badgeMain.className = "page-header-left-logo";
//     badgeMain.innerHTML = `<img src="../assets/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
//     pgMain.appendChild(badgeMain);

//     const h3b = document.createElement("h3");
//     h3b.className = "page-heading with-badge-logo";
//     h3b.textContent = `${oneWeekData.phase} - Week ${oneWeekData.week} - Day ${dayIndex + 1}`;
//     pgMain.appendChild(h3b);

//     // 1) Resistance Training
//     const rtBlocks = (dayObj.mainWork || []).filter(b => b.blockType === "Resistance Training");
//     if (rtBlocks.length > 0) {
//       const rtTitle = document.createElement("h4");
//       rtTitle.className = "section-heading";
//       rtTitle.textContent = "Resistance Training";
//       pgMain.appendChild(rtTitle);

//       const rtWrap = document.createElement("div");
//       rtWrap.className = "session-table-container modern-table-wrapper";

//       const rtTable = document.createElement("table");
//       rtTable.className = "session-table modern-table";

//       // Table header
//       const rtThd = document.createElement("thead");
//       const rtTr = document.createElement("tr");
//       ["Exercise", "Sets/Reps", "RPE", "Notes"].forEach(col => {
//         const th = document.createElement("th");
//         th.textContent = col;
//         rtTr.appendChild(th);
//       });
//       rtThd.appendChild(rtTr);
//       rtTable.appendChild(rtThd);

//       // Table body
//       const rtTbody = document.createElement("tbody");
//       rtBlocks.forEach(block => {
//         (block.exercises || []).forEach(ex => {
//           // Main exercise row
//           const mainRow = buildExerciseRow(
//             ex.name || "Exercise",
//             (ex.sets && ex.reps) ? `${ex.sets} x ${ex.reps}` : ex.duration || "",
//             ex.rpe ? `RPE ${ex.rpe}` : "",
//             ex.notes || ""
//           );
//           rtTbody.appendChild(mainRow);

//           // If there's a superset
//           if (ex.superset) {
//             const ssRow = buildExerciseRow(
//               ex.superset.name || "Superset",
//               (ex.superset.sets && ex.superset.reps)
//                 ? `${ex.superset.sets} x ${ex.superset.reps}`
//                 : "",
//               ex.superset.rpe ? `RPE ${ex.superset.rpe}` : "",
//               ex.superset.notes || ""
//             );
//             rtTbody.appendChild(ssRow);
//           }
//         });
//       });
//       rtTable.appendChild(rtTbody);

//       rtWrap.appendChild(rtTable);
//       pgMain.appendChild(rtWrap);
//     }

//     // 2) Post-Workout Cardio
//     const cardioBlocks = (dayObj.mainWork || []).filter(b => b.blockType === "Cardio");
//     if (cardioBlocks.length > 0) {
//       const cTitle = document.createElement("h4");
//       cTitle.className = "section-heading";
//       cTitle.textContent = "Post-Workout Cardio";
//       pgMain.appendChild(cTitle);

//       const cWrap = document.createElement("div");
//       cWrap.className = "session-table-container modern-table-wrapper";

//       const cTable = document.createElement("table");
//       cTable.className = "session-table modern-table";

//       // Table header
//       const cThead = document.createElement("thead");
//       const cTr2 = document.createElement("tr");
//       ["Exercise", "Duration", "RPE", "Notes"].forEach(col => {
//         const th = document.createElement("th");
//         th.textContent = col;
//         cTr2.appendChild(th);
//       });
//       cThead.appendChild(cTr2);
//       cTable.appendChild(cThead);

//       // Table body
//       const cTbody = document.createElement("tbody");
//       cardioBlocks.forEach(block => {
//         if (Array.isArray(block.exercises)) {
//           block.exercises.forEach(cx => {
//             const row = buildExerciseRow(
//               cx.name || "Cardio",
//               cx.duration || (block.allocatedMinutes ? `${block.allocatedMinutes} minutes` : ""),
//               cx.rpe ? `RPE ${cx.rpe}` : "",
//               cx.notes || ""
//             );
//             cTbody.appendChild(row);
//           });
//         } else {
//           // Single cardio block object
//           const row = buildExerciseRow(
//             block.name || "Cardio",
//             block.allocatedMinutes ? `${block.allocatedMinutes} minutes` : "",
//             block.rpe ? `RPE ${block.rpe}` : "",
//             block.notes || ""
//           );
//           cTbody.appendChild(row);
//         }
//       });
//       cTable.appendChild(cTbody);

//       cWrap.appendChild(cTable);
//       pgMain.appendChild(cWrap);
//     }

//     // Note: "Please see the previous page..."
//     const notePrev = document.createElement("p");
//     notePrev.className = "note-text-nav";
//     notePrev.style.textAlign = "center";
//     notePrev.style.fontStyle = "italic";
//     notePrev.style.fontSize = "0.9rem";
//     notePrev.textContent = "Please see the previous page for the warm-up and cool-down.";
//     pgMain.appendChild(notePrev);

//     sessionsContainer.appendChild(pgMain);
//   });
// }

function createProTrackerWorksPage() {
  /* -----------------------------------------------------------
     (A) Ensure the container exists (creates it if missing)
  ----------------------------------------------------------- */
  let pageDiv = document.getElementById("proTrackerWorksPage");
  if (!pageDiv) {
    const container = document.getElementById("pdf1WeekContainer");
    if (!container) return;                                // hard-fail if root missing

    // Create the page
    pageDiv = document.createElement("div");
    pageDiv.id = "proTrackerWorksPage";
    pageDiv.className = "pdf-page";

    // ➡️ Insert just after the last direct .pdf-page child, or append if none
    const directPages = container.querySelectorAll(":scope > .pdf-page");
    if (directPages.length) {
      const lastDirect = directPages[directPages.length - 1];
      lastDirect.after(pageDiv);
    } else {
      container.appendChild(pageDiv);
    }
  }
  // Reset contents each run
  pageDiv.innerHTML = "";

  /* -----------------------------------------------------------
     (B) Top-left logo badge
  ----------------------------------------------------------- */
  const badge = document.createElement("div");
  badge.className = "page-header-left-logo";
  badge.innerHTML = `
    <img src="../assets/rtb-logo-white.png"
         alt="RTB logo" class="logo-badge" />
  `;
  pageDiv.appendChild(badge);

  /* -----------------------------------------------------------
     (C) HERO SECTION – Heading • Sub-heading • Image
  ----------------------------------------------------------- */
  const hero = document.createElement("div");
  hero.style.textAlign = "center";
  hero.style.margin = "0 0 1.5rem 0";

  const h1 = document.createElement("h2");
  h1.className = "page-heading with-badge-logo";
  h1.textContent = "You’re Not Lazy — The Plan Failed You.";
  hero.appendChild(h1);

  const heroSub = document.createElement("p");
  heroSub.style.fontSize = "1.05rem";
  heroSub.style.fontWeight = "500";
  heroSub.style.lineHeight = "1.35";
  heroSub.style.maxWidth = "550px";
  heroSub.style.margin = "0.4rem auto 1.2rem";
  heroSub.innerHTML =
    "<strong>Most people don’t quit because they’re lazy</strong> — they quit because their plan wasn't built for them.";
  hero.appendChild(heroSub);

  // (C) HERO + PAIN/SOLUTION SIDE‐BY‐SIDE
  const heroSection = document.createElement("div");
  heroSection.style.display = "flex";
  heroSection.style.alignItems = "center";
  heroSection.style.justifyContent = "space-between";
  heroSection.style.gap = "1rem";
  heroSection.style.marginBottom = "1.5rem";

  // — Left: Hero image
  const heroImg = document.createElement("img");
  heroImg.src = "../assets/3_adaptive.png";   // your mock-up
  heroImg.alt = "Pro Tracker phone mock-up";
  heroImg.style.width = "50%";
  heroImg.style.maxWidth = "480px";
  heroImg.style.borderRadius = "8px";
  heroImg.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
  heroSection.appendChild(heroImg);

  // — Right: Pain→Solution panel
  const painPanel = document.createElement("div");
  painPanel.style.flex = "1";          // take remaining width
  painPanel.style.background = "#F6F6F6";
  painPanel.style.borderRadius = "6px";
  painPanel.style.padding = "1rem 1.25rem";
  painPanel.style.fontSize = "0.95rem";
  painPanel.style.lineHeight = "1.45";

  // your existing innerHTML
  painPanel.innerHTML = `
  <ul style="padding-left:1.1rem;margin:0 0 0.6rem 0;">
    <li>Rigid plans that ignore real life</li>
    <li>No feedback-loop — you never know if you’re winning</li>
    <li>Copy-and-paste workouts & meals</li>
  </ul>
  <p style="margin:0;">
    <strong>The Pro Tracker fixes this.</strong> It adapts your workouts
    and meals in real time, so progress never stalls.
  </p>
`;
  heroSection.appendChild(painPanel);

  // append the combined section
  pageDiv.appendChild(hero);
  pageDiv.appendChild(heroSection);

  /* -----------------------------------------------------------
     (E) COMPARISON STRIP  – Traditional vs Pro
  ----------------------------------------------------------- */
  const compareStrip = document.createElement("div");
  compareStrip.style.display = "flex";
  compareStrip.style.gap = "1rem";
  compareStrip.style.marginBottom = "1.4rem";
  compareStrip.style.flexWrap = "wrap";

  // helper
  const buildCol = (title, items, isHighlight = false) => {
    const col = document.createElement("div");
    col.style.flex = "1 1 250px";
    col.style.padding = "0.8rem 1rem";
    col.style.borderRadius = "6px";
    col.style.background = isHighlight ? "#ECE7FF" : "#FFFFFF";
    col.style.boxShadow = "0 0 0 1px #E2E2E2 inset";

    const h = document.createElement("h4");
    h.textContent = title;
    h.style.margin = "0 0 0.4rem 0";
    h.style.fontSize = "1rem";
    h.style.fontWeight = isHighlight ? "700" : "600";
    col.appendChild(h);

    const ul = document.createElement("ul");
    ul.style.paddingLeft = "1.1rem";
    ul.style.margin = "0";
    items.forEach(t => {
      const li = document.createElement("li");
      li.textContent = t;
      li.style.fontSize = "0.9rem";
      ul.appendChild(li);
    });
    col.appendChild(ul);
    return col;
  };

  compareStrip.appendChild(
    buildCol("Traditional Plans",
      ["Fixed workouts & meals", "No progress tracking", "Miss a day? Start over"])
  );
  compareStrip.appendChild(
    buildCol("The Pro Tracker",
      ["Adapts workouts & meals daily",
        "Earn XP • Streaks • Progress Score",
        "Miss a day? It auto-rebuilds"], true)
  );

  pageDiv.appendChild(compareStrip);

  /* -----------------------------------------------------------
     (F) THREE KEY BENEFITS  – icon + line each
  ----------------------------------------------------------- */
  // const benefitRow = document.createElement("div");
  // benefitRow.style.display = "flex";
  // benefitRow.style.justifyContent = "space-between";
  // benefitRow.style.flexWrap = "wrap";
  // benefitRow.style.marginBottom = "1.6rem";

  // const benefits = [
  //   { src: "../assets/icon-xp.png", txt: "Earn XP for every action" },
  //   { src: "../assets/icon-streak.png", txt: "Streaks that build momentum" },
  //   { src: "../assets/icon-progress.png", txt: "Weekly Progress Score" }
  // ];

  // benefits.forEach(b => {
  //   const box = document.createElement("div");
  //   box.style.flex = "1 1 120px";
  //   box.style.textAlign = "center";
  //   box.style.margin = "0.6rem 0";

  //   const img = document.createElement("img");
  //   img.src = b.src;
  //   img.alt = "";
  //   img.style.width = "32px";
  //   img.style.marginBottom = "0.4rem";
  //   box.appendChild(img);

  //   const p = document.createElement("p");
  //   p.textContent = b.txt;
  //   p.style.fontSize = "0.85rem";
  //   p.style.margin = "0";
  //   box.appendChild(p);

  //   benefitRow.appendChild(box);
  // });
  // pageDiv.appendChild(benefitRow);

  /* -----------------------------------------------------------
     (G) CTA TAG-LINE + BUTTON
  ----------------------------------------------------------- */
  // const tag = document.createElement("p");
  // tag.style.textAlign = "center";
  // tag.style.fontWeight = "700";
  // tag.style.fontSize = "1.05rem";
  // tag.style.margin = "0 0 0.8rem 0";
  // tag.textContent = "Built to move with you. Ready when you are.";
  // pageDiv.appendChild(tag);

  const btn = document.createElement("a");
  btn.href = "../pages/offer.html";
  btn.textContent = "Unlock the Pro Tracker";
  btn.style.background = "#9333EA";         // primary accent
  btn.style.color = "#FFF";
  btn.style.fontWeight = "600";
  btn.style.padding = "0.65rem 1.5rem";
  btn.style.borderRadius = "40px";
  btn.style.textDecoration = "none";
  btn.style.fontSize = "0.95rem";
  btn.style.textAlign = "center";
  btn.style.margin = "0 auto 1rem";
  btn.style.boxShadow = "0 4px 10px rgba(108,77,255,0.25)";
  btn.style.display = "block";
  btn.style.width = "max-content";
  pageDiv.appendChild(btn);

  /* -----------------------------------------------------------
     (H) Footer placeholder (page number filled later)
  ----------------------------------------------------------- */
  pageDiv.appendChild(createMainFooter(0, 0));
}

function fillOneWeekSessions() {
  const sessionsContainer = document.getElementById("oneWeekSessions");
  if (!sessionsContainer) return;
  sessionsContainer.innerHTML = "";

  /* ------------------ fetch & parse program ------------------ */
  const stored = localStorage.getItem("oneWeekProgram");
  if (!stored) {
    const msg = document.createElement("p");
    msg.textContent = "No 1-week program data found in localStorage.";
    sessionsContainer.appendChild(msg);
    return;
  }

  let oneWeekData;
  try {
    oneWeekData = JSON.parse(stored);
  } catch (e) {
    console.error("Parsing oneWeekProgram error:", e);
    return;
  }

  /* ------------------ helper for quick <td> ------------------ */
  const makeTd = text => {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
  };

  /* -----------------------------------------------------------
     Render **only the first day** as one single page preview
  ----------------------------------------------------------- */
  const dayObj = (oneWeekData.days || [])[0];
  if (!dayObj) return;            // safety

  const pg = document.createElement("div");
  pg.className = "pdf-page";

  /* ---------- header & logo ---------- */
  const badgeDiv = document.createElement("div");
  badgeDiv.className = "page-header-left-logo";
  badgeDiv.innerHTML =
    `<img src="../assets/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
  pg.appendChild(badgeDiv);

  const h3 = document.createElement("h3");
  h3.className = "page-heading with-badge-logo";
  h3.textContent = "Your Kickstart Workout: Day 1 Preview";
  pg.appendChild(h3);

  /* ---------- Warm-Up (Preview) ---------- */
  if (Array.isArray(dayObj.warmUp) && dayObj.warmUp.length) {
    const warmTitle = document.createElement("h4");
    warmTitle.className = "section-heading";
    warmTitle.textContent = "Warm-Up (Preview)";
    pg.appendChild(warmTitle);

    const warmWrap = document.createElement("div");
    warmWrap.className = "session-table-container modern-table-wrapper";

    const warmTable = document.createElement("table");
    warmTable.className = "session-table modern-table";
    warmTable.innerHTML = `
      <thead>
        <tr>
          <th>Exercise</th><th>Duration</th><th>RPE</th><th>✓</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const wTbody = warmTable.querySelector("tbody");

    /* show only the first two warm-up drills */
    dayObj.warmUp.slice(0, 2).forEach(wu => {
      const tr = document.createElement("tr");
      const duration = wu.duration && wu.duration.trim() !== "" ? wu.duration : "1 minute";

      tr.appendChild(makeTd(wu.name || "Warm-Up"));
      tr.appendChild(makeTd(duration));
      tr.appendChild(makeTd(wu.rpe ? `RPE ${wu.rpe}` : ""));
      // create a <td> with a <span> around the checkbox glyph
      const td = document.createElement("td");
      const glyph = document.createElement("span");
      glyph.className = "checkbox-char";
      glyph.textContent = "☐";
      td.appendChild(glyph);
      tr.appendChild(td);

      wTbody.appendChild(tr);
    });

    warmWrap.appendChild(warmTable);
    pg.appendChild(warmWrap);
  }

  /* ---------- Main Block (preview: first 2 exercises) ---------- */
  const rtBlocks = (dayObj.mainWork || []).filter(b => b.blockType === "Resistance Training");
  if (rtBlocks.length) {
    const rtTitle = document.createElement("h4");
    rtTitle.className = "section-heading";
    rtTitle.textContent = "Main Block (Preview)";
    pg.appendChild(rtTitle);

    const rtWrap = document.createElement("div");
    rtWrap.className = "session-table-container modern-table-wrapper";

    const rtTable = document.createElement("table");
    rtTable.className = "session-table modern-table";
    rtTable.innerHTML = `
      <thead>
        <tr>
          <th>Exercise</th><th>Sets&nbsp;x&nbsp;Reps</th><th>RPE</th><th>✓</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const rtTbody = rtTable.querySelector("tbody");

    let shown = 0;
    outer: for (const block of rtBlocks) {
      for (const ex of block.exercises || []) {
        if (shown >= 2) break outer;       // only first 2 main lifts

        const tr = document.createElement("tr");
        tr.appendChild(makeTd(ex.name || "Exercise"));
        const setRep =
          ex.sets && ex.reps ? `${ex.sets} x ${ex.reps}` : (ex.duration || "");
        tr.appendChild(makeTd(setRep));
        tr.appendChild(makeTd(ex.rpe ? `RPE ${ex.rpe}` : ""));
        // create a <td> with a <span> around the checkbox glyph
        const td = document.createElement("td");
        const glyph = document.createElement("span");
        glyph.className = "checkbox-char";
        glyph.textContent = "☐";
        td.appendChild(glyph);
        tr.appendChild(td);

        rtTbody.appendChild(tr);

        shown++;
      }
    }

    rtWrap.appendChild(rtTable);
    pg.appendChild(rtWrap);
  }

  /* ---------- persuasion copy + CTA ---------- */
  const persuWrap = document.createElement("div");
  persuWrap.className = "persuasion-copy";
  persuWrap.style.marginTop = "2rem";
  persuWrap.innerHTML = `
  <p>
    Every session in the <strong>Pro Tracker</strong> adapts based on your performance — 
    no guesswork. You improve week by week, even if life gets in the way.
  </p>
  <p>Ready to unlock the full workout and meal plan?</p>
`;
  pg.appendChild(persuWrap);

  // 2) Create the button exactly like your other one
  const upsellBtn = document.createElement("a");
  upsellBtn.href = "../pages/offer.html";
  upsellBtn.textContent = "Unlock the Pro Tracker";
  upsellBtn.style.display = "inline-block";
  upsellBtn.style.background = "#9333EA";
  upsellBtn.style.color = "#FFF";
  upsellBtn.style.fontWeight = "600";
  upsellBtn.style.padding = "0.65rem 1.5rem";
  upsellBtn.style.borderRadius = "40px";
  upsellBtn.style.textDecoration = "none";
  upsellBtn.style.fontSize = "0.95rem";
  upsellBtn.style.textAlign = "center";
  // center it by making its parent text-centered or via margin:
  upsellBtn.style.margin = "1rem auto 0";
  upsellBtn.style.boxShadow = "0 4px 10px rgba(108,77,255,0.25)";
  upsellBtn.style.display = "block";
  upsellBtn.style.width = "max-content";  // so it shrinks to its contents

  // 3) Append it into your persuasion wrapper
  persuWrap.appendChild(upsellBtn);

  /* ---------- inject page ---------- */
  sessionsContainer.appendChild(pg);
}

/**************************************************
 * (2) The same buildExerciseRow() helper is fine
 **************************************************/
function buildExerciseRow(name, setsReps, rpe, notes) {
  const tr = document.createElement("tr");

  const td1 = document.createElement("td");
  td1.textContent = name || "";
  const td2 = document.createElement("td");
  td2.textContent = setsReps || "";
  const td3 = document.createElement("td");
  td3.textContent = rpe || "";
  const td4 = document.createElement("td");
  td4.textContent = notes || "";

  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);
  tr.appendChild(td4);

  return tr;
}

/**************************************************
Final Page for 1-Week, 4-Week, 12-Week 
 **************************************************/
function createFinalPage(programType, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pageDiv = document.createElement("div");
  pageDiv.className = "pdf-page";

  // --- CHANGED #9: Decrease motivational section size by 20%
  const motivationalSection = document.createElement("div");
  motivationalSection.style.backgroundColor = "#F3F0EA";
  motivationalSection.style.borderRadius = "6px";
  motivationalSection.style.padding = "0.25rem";
  motivationalSection.style.marginBottom = "0.5rem"; // reduced margin
  motivationalSection.style.textAlign = "center"; // center text
  motivationalSection.style.lineHeight = "1.5";

  if (programType === "1week") {
    const subheading = document.createElement("h3");
    subheading.className = "subheading";
    subheading.style.textAlign = "center"; // CHANGED #1: center text
    subheading.textContent = "You’ve started. Now let’s keep going.";
    motivationalSection.appendChild(subheading);

    const subtext1 = document.createElement("p");
    subtext1.className = "subtext";
    subtext1.style.textAlign = "center"; // CHANGED #1: center text
    subtext1.textContent = "The Pro Tracker adapts your workouts and meals as you go — with built-in feedback, progress tracking, and real-time adjustments. So you don’t stall. You don’t guess. You just keep progressing.";
    motivationalSection.appendChild(subtext1);
  }
  // pageDiv.appendChild(motivationalSection);

  if (programType === "1week") {
    // --- CHANGED: Center upsell heading
    const upsellHeading = document.createElement("p");
    upsellHeading.className = "heading";
    upsellHeading.style.textAlign = "center"; // center heading
    upsellHeading.textContent = "You’ve started. Now let’s keep going.";
    pageDiv.appendChild(upsellHeading);

    // Placeholder image remains the same.
    // Create the hero image wrapper
    // Create container for image and text side-by-side
    const upsellRow = document.createElement("div");
    upsellRow.className = "upsell-row";

    // Hero image wrapper
    const heroWrapper = document.createElement("div");
    heroWrapper.className = "hero-image-wrapper";

    // Create the UI mockup image
    const heroImg = document.createElement("img");
    heroImg.src = "/assets/your-ui-mockup.webp";
    heroImg.alt = "Workout Tracker UI on mobile";
    heroImg.className = "hero-ui-image";
    heroWrapper.appendChild(heroImg);

    // Subtext paragraph
    const upsellSubtext = document.createElement("p");
    upsellSubtext.className = "subtext";
    upsellSubtext.innerHTML = `
  The <strong>Pro Tracker</strong> adapts your workouts and meals as you go — with built-in feedback, progress tracking, and real-time adjustments. So you don’t stall. You don’t guess. You just keep progressing.
  <ul class="benefits-list">
    <li>💪 <strong>Workouts that adjust</strong> based on your performance</li>
    <li>🥗 <strong>Daily meals</strong> tailored to your macro targets</li>
    <li>🔥 <strong>XP, streaks & Progress Score</strong> to stay motivated</li>
    <li>📊 <strong>Weekly insights</strong> to show what's working</li>
    <li>🚀 <strong>A system that evolves</strong> — not a program that ends</li>
  </ul>
`;

    // Assemble and append to pageDiv
    upsellRow.appendChild(heroWrapper);
    upsellRow.appendChild(upsellSubtext);
    pageDiv.appendChild(upsellRow);

    // --- CHANGED #7: Update CTA button text
    const upgradeBtn = document.createElement("a");
    upgradeBtn.className = "upgrade-now-btn";
    upgradeBtn.textContent = "Unlock the Pro Tracker";
    upgradeBtn.href = "../pages/offer.html";
    pageDiv.appendChild(upgradeBtn);

    // add centered, grey clickable URL below the button
    const infoLine = document.createElement("p");
    infoLine.style.fontSize = "0.8rem";
    infoLine.style.color = "#666";
    infoLine.style.textAlign = "center";
    infoLine.style.marginTop = "0.5rem";

    // prefix text
    infoLine.textContent = "Or visit this link: ";

    // clickable link showing the URL
    const infoLink = document.createElement("a");
    infoLink.href = "https://raisingthebarapp.com/pages/offer.html";
    infoLink.textContent = "https://raisingthebarapp.com/pages/offer.html";
    infoLink.style.color = "#666";
    infoLink.style.textDecoration = "none";
    infoLink.style.cursor = "pointer";
    infoLink.target = "_blank";  // opens in new tab

    infoLine.appendChild(infoLink);
    pageDiv.appendChild(infoLine);

    // --- CHANGED #10: Add price anchor underneath CTA
    const priceAnchor = document.createElement("div");
    priceAnchor.style.textAlign = "center";
    // priceAnchor.style.marginTop = "0.25rem";
    priceAnchor.style.fontFamily = "Poppins";
    // Original price: £49.99 (line-through, 14px, #333)
    const originalPrice = document.createElement("span");
    originalPrice.textContent = "£29.99";
    originalPrice.style.color = "#333";
    originalPrice.style.textDecoration = "line-through";
    originalPrice.style.fontSize = "16px";
    originalPrice.style.marginRight = "2px";
    // New price: £39.99 (red, 18px)
    const newPrice = document.createElement("span");
    newPrice.textContent = "£9.99 for the next 10 minutes!";
    newPrice.style.color = "#D32F2F";
    newPrice.style.fontSize = "24px";
    newPrice.style.marginLeft = "2px";
    newPrice.style.fontWeight = "800";
    newPrice.style.letterSpacing = "0.5px";
    priceAnchor.appendChild(originalPrice);
    priceAnchor.appendChild(newPrice);
    pageDiv.appendChild(priceAnchor);

    // --- CHANGED #8 & #1: Update 30-day guarantee text and center it
    const moneyBack = document.createElement("p");
    moneyBack.className = "money-back-text";
    moneyBack.style.textAlign = "center"; // center text
    moneyBack.textContent = "100% Risk-Free - Love it or get a FULL refund within 30 days!";
    pageDiv.appendChild(moneyBack);

    // --- CHANGED #5 & #6: Adjust "What's Included?" section spacing and centering
    const whatsIncludedContainer = document.createElement("div");
    whatsIncludedContainer.className = "whats-included-container";
    // (Spacing is further tweaked via CSS and inline style if needed)
    whatsIncludedContainer.style.marginTop = "1rem";
    const listTitle = document.createElement("h4");
    listTitle.className = "subheading";
    listTitle.style.textAlign = "center"; // center subheading
    listTitle.textContent = "What's Included?";
    whatsIncludedContainer.appendChild(listTitle);

    // Create the two-column benefits container
    const benefitsContainer = document.createElement("div");
    benefitsContainer.className = "benefits-container";

    // Left column
    const leftCol = document.createElement("div");
    leftCol.className = "benefit-column";
    const benefit1 = document.createElement("div");
    benefit1.className = "benefit-item";
    benefit1.innerHTML = `<div class="benefit-title"> Adaptive tailored workouts</div>`;
    leftCol.appendChild(benefit1);
    const benefit2 = document.createElement("div");
    benefit2.className = "benefit-item";
    benefit2.innerHTML = `<div class="benefit-title"> Macro-matched meals</div>`;
    leftCol.appendChild(benefit2);
    const benefit3 = document.createElement("div");
    benefit3.className = "benefit-item";
    benefit3.innerHTML = `<div class="benefit-title"> XP & streaks to track your momentum</div>`;
    leftCol.appendChild(benefit3);
    benefitsContainer.appendChild(leftCol);

    // Right column
    const rightCol = document.createElement("div");
    rightCol.className = "benefit-column";
    const benefit4 = document.createElement("div");
    benefit4.className = "benefit-item";
    benefit4.innerHTML = `<div class="benefit-title"> Video Tutorials</div>`;
    rightCol.appendChild(benefit4);
    const benefit5 = document.createElement("div");
    benefit5.className = "benefit-item";
    benefit5.innerHTML = `<div class="benefit-title">  Real-time feedback and weekly insights</div>`;
    rightCol.appendChild(benefit5);
    const benefit6 = document.createElement("div");
    benefit6.className = "benefit-item";
    benefit6.innerHTML = `<div class="benefit-title"> Fully interactive nutrition & workout system</div>`;
    rightCol.appendChild(benefit6);
    benefitsContainer.appendChild(rightCol);
    whatsIncludedContainer.appendChild(benefitsContainer);
    // pageDiv.appendChild(whatsIncludedContainer);
  }

  else if (programType === "4week") {
    const sh = document.createElement("h3");
    sh.className = "subheading";
    sh.style.textAlign = "center";
    sh.textContent = "Congratulations on Completing Your Program!";
    motivationalSection.appendChild(sh); // [CHANGED]

    const st1 = document.createElement("p");
    st1.className = "subtext";
    st1.style.textAlign = "center";
    st1.textContent = "You’ve made an incredible start—celebrate your progress and stay consistent on your journey!";
    motivationalSection.appendChild(st1); // [CHANGED]

    const upsellH = document.createElement("p");
    upsellH.className = "heading";
    upsellH.style.textAlign = "center";
    upsellH.textContent = "Unlock More Results and Features With Your 12-Week Program!";
    pageDiv.appendChild(upsellH);

    const testImg = document.createElement("div");
    testImg.className = "upgrade-image-placeholder";
    pageDiv.appendChild(testImg);

    const upsellSub = document.createElement("p");
    upsellSub.className = "subtext";
    upsellSub.style.textAlign = "center";
    upsellSub.textContent = "Keep the momentum going! Upgrade now to unlock your full 12-week journey.";
    pageDiv.appendChild(upsellSub);

    const btn = document.createElement("a");
    btn.className = "upgrade-now-btn";
    btn.textContent = "Limited Offer – Unlock Your 12-Week Plan Now!";
    btn.href = "landing-page.html";
    pageDiv.appendChild(btn);

    const priceDiv = document.createElement("div");
    priceDiv.style.textAlign = "center";
    priceDiv.style.fontFamily = "Poppins";

    const origP = document.createElement("span");
    origP.textContent = "£99.99";
    origP.style.color = "#333";
    origP.style.textDecoration = "line-through";
    origP.style.fontSize = "14px";
    origP.style.marginRight = "2px";

    const newP = document.createElement("span");
    newP.textContent = " £79.99";
    newP.style.color = "#D32F2F";
    newP.style.fontSize = "24px";
    newP.style.marginLeft = "2px";
    newP.style.fontWeight = "800";
    newP.style.letterSpacing = "0.5px";

    priceDiv.appendChild(origP);
    priceDiv.appendChild(newP);
    pageDiv.appendChild(priceDiv);

    const moneyBack = document.createElement("p");
    moneyBack.className = "money-back-text";
    moneyBack.style.textAlign = "center";
    moneyBack.textContent = "100% Risk-Free - Love it or get a FULL refund within 30 days!";
    pageDiv.appendChild(moneyBack);

    const wic = document.createElement("div");
    wic.className = "whats-included-container";
    pageDiv.appendChild(wic);

    const wicTitle = document.createElement("h4");
    wicTitle.className = "subheading";
    wicTitle.style.textAlign = "center";
    wicTitle.textContent = "What's Included?";
    wic.appendChild(wicTitle);

    const bennCont = document.createElement("div");
    bennCont.className = "benefits-container";
    wic.appendChild(bennCont);

    // Left col
    const lCol = document.createElement("div");
    lCol.className = "benefit-column";
    const b1 = document.createElement("div");
    b1.className = "benefit-item";
    b1.innerHTML = `<div class="benefit-title">Tailored 12-Week Program</div>`;
    lCol.appendChild(b1);
    const b2 = document.createElement("div");
    b2.className = "benefit-item";
    b2.innerHTML = `<div class="benefit-title">Essential Food Guide</div>`;
    lCol.appendChild(b2);
    const b3 = document.createElement("div");
    b3.className = "benefit-item";
    b3.innerHTML = `<div class="benefit-title">Weekly Calorie & Macro Overview</div>`;
    lCol.appendChild(b3);
    bennCont.appendChild(lCol);

    // Right col
    const rCol = document.createElement("div");
    rCol.className = "benefit-column";
    const b4 = document.createElement("div");
    b4.className = "benefit-item";
    b4.innerHTML = `<div class="benefit-title">Exclusive Video Tutorials</div>`;
    rCol.appendChild(b4);
    const b5 = document.createElement("div");
    b5.className = "benefit-item";
    b5.innerHTML = `<div class="benefit-title">Smart Workout Tracker</div>`;
    rCol.appendChild(b5);
    const b6 = document.createElement("div");
    b6.className = "benefit-item";
    b6.innerHTML = `<div class="benefit-title">Exclusive Access to Webinars</div>`;
    rCol.appendChild(b6);
    bennCont.appendChild(rCol);
  }
  else if (programType === "12week") {
    const subtext1 = document.createElement("p");
    subtext1.className = "subtext";
    subtext1.textContent = "You’ve achieved something incredible—twelve weeks of progress, dedication, and growth. Keep striving for more!";
    wrapper.appendChild(subtext1);

    const subtext2 = document.createElement("p");
    subtext2.className = "subtext";
    subtext2.textContent = "We’re incredibly grateful to have been a part of your fitness transformation. Your dedication and hard work inspire us to keep creating programs that empower people like you to achieve their goals. Remember, this is just the beginning—your journey doesn’t end here. Keep striving, keep growing, and know that we’re cheering you on every step of the way!";
    wrapper.appendChild(subtext2);

    const shareSubtext = document.createElement("p");
    shareSubtext.className = "subtext";
    shareSubtext.textContent = "Enjoyed your program? Share your experience and help others start their journey!";
    wrapper.appendChild(shareSubtext);

    const trustpilotLogo = document.createElement("img");
    trustpilotLogo.src = "../assets/trustpilot-logo.png";
    trustpilotLogo.alt = "Trustpilot";
    trustpilotLogo.className = "trustpilot-logo";
    trustpilotLogo.addEventListener("click", () => {
      window.open("https://www.trustpilot.com/", "_blank");
    });
    wrapper.appendChild(trustpilotLogo);
  }

  // Insert into container
  container.appendChild(pageDiv);
}

/**************************************************
 * CREATE ALTERNATIVE EXERCISES PAGE (1-Week Only)
 **************************************************/
function createAlternativeExercisesPage1Week() {
  // If user has 4 or 12-week, do not create (per instructions).
  const purchasedWeeks = parseInt(localStorage.getItem("purchasedWeeks") || "1", 10);
  if (purchasedWeeks !== 1) {
    return; // For 4-week or 12-week, we skip this page
  }

  // Retrieve the 1-week program from localStorage
  const stored = localStorage.getItem("oneWeekProgram");
  if (!stored) return;

  let oneWeekData;
  try {
    oneWeekData = JSON.parse(stored);
  } catch (e) {
    console.error("Parsing oneWeekProgram error:", e);
    return;
  }
  const days = oneWeekData.days || [];

  // 1) Gather all "mainWork" => blockType==="Resistance Training" => exercises
  let allExercises = [];
  days.forEach(day => {
    if (day.mainWork && Array.isArray(day.mainWork)) {
      day.mainWork.forEach(block => {
        if (block.blockType === "Resistance Training") {
          block.exercises.forEach(ex => {
            allExercises.push(ex);
            // Also include superset if it exists
            if (ex.superset) {
              allExercises.push(ex.superset);
            }
          });
        }
      });
    }
  });

  // 2) Reorder them based on the specified priority
  const priorityOrder = [
    { muscleGroup: "chest", typeOfMovement: "compound" },
    { muscleGroup: "back", typeOfMovement: "compound" },
    { muscleGroup: "quad", typeOfMovement: "compound" },
    { muscleGroup: "hamstring", typeOfMovement: "compound" },
    { muscleGroup: "shoulder", typeOfMovement: "compound" },
    { muscleGroup: "back", typeOfMovement: "isolation" },
    { muscleGroup: "triceps", typeOfMovement: "isolation" },
    { muscleGroup: "biceps", typeOfMovement: "isolation" },
    { muscleGroup: "chest", typeOfMovement: "isolation" },
    { muscleGroup: "quad", typeOfMovement: "isolation" },
    { muscleGroup: "hamstring", typeOfMovement: "isolation" },
    { muscleGroup: "shoulder", typeOfMovement: "isolation" },
  ];

  // Convert muscleGroup to lower case for match
  const sortedExercises = allExercises.sort((a, b) => {
    const indexA = findPriorityIndex(a, priorityOrder);
    const indexB = findPriorityIndex(b, priorityOrder);
    return indexA - indexB;
  });

  // 3) Take up to 10
  const finalExercises = sortedExercises.slice(0, 9);
  if (!finalExercises.length) {
    // No exercises to display => skip creating page
    return;
  }

  // 4) Create a new PDF page
  const container = document.getElementById("pdf1WeekContainer");
  if (!container) return;

  const altPage = document.createElement("div");
  altPage.className = "pdf-page";

  // Page header with left logo
  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `<img src="../assets/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
  altPage.appendChild(badgeLogo);

  // Page heading
  const heading = document.createElement("h2");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "Modify Your Workout";
  altPage.appendChild(heading);

  const subtext = document.createElement("p");
  subtext.style.textAlign = "center";
  subtext.style.margin = "0 0 1rem 0";
  subtext.style.fontSize = "1rem";
  subtext.textContent = "Need a change? Swap exercises if needed for comfort, preference, or variety.";
  altPage.appendChild(subtext);

  // 5) Build the table
  const tableWrapper = document.createElement("div");
  tableWrapper.className = "session-table-container modern-table-wrapper";

  const table = document.createElement("table");
  table.className = "session-table modern-table alt-ex-table";

  // Thead
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  const thMain = document.createElement("th");
  thMain.textContent = "Main Exercise";
  const thAlt = document.createElement("th");
  thAlt.textContent = "Alternative Exercises";
  trHead.appendChild(thMain);
  trHead.appendChild(thAlt);
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");

  // We will display each exercise in the left column; right column is locked.
  // On the 5th data row, we will insert a locked banner row.
  let rowCount = 0;

  finalExercises.forEach((ex, idx) => {
    // Check if we've displayed 4 rows so far, then row #5 is a locked banner row
    if (rowCount === 4) {
      // Insert the locked banner row
      const bannerTr = document.createElement("tr");
      bannerTr.classList.add("locked-banner-row");
      const bannerTd = document.createElement("td");
      bannerTd.setAttribute("colspan", "2");
      bannerTd.innerHTML = `
        <i class="fa fa-lock"></i>
        Unlock exercise swaps to keep your workouts fresh and flexible!
      `;
      bannerTr.appendChild(bannerTd);
      tbody.appendChild(bannerTr);

      // After the banner, proceed
      rowCount++;
    }

    const tr = document.createElement("tr");

    // Left column: main exercise name
    const tdLeft = document.createElement("td");
    tdLeft.textContent = ex.name || "Exercise";
    tr.appendChild(tdLeft);

    // Right column: locked cell
    const tdRight = document.createElement("td");
    tdRight.classList.add("locked-cell");
    // We can follow the same style as other locked cells:
    tdRight.innerHTML = `<i class="fa fa-lock"></i> Locked`;
    tr.appendChild(tdRight);

    tbody.appendChild(tr);
    rowCount++;
  });

  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  altPage.appendChild(tableWrapper);

  // Footer (main content style => page number on the right only)
  const foot = createMainFooter(0, 0);
  altPage.appendChild(foot);

  // Insert before the final page. We can assume the final page is the *last* .pdf-page.
  const allPages = container.querySelectorAll(".pdf-page");
  if (allPages.length > 0) {
    // Insert this new page before the final page
    container.insertBefore(altPage, allPages[allPages.length - 1]);
  } else {
    // Fallback: just append if no pages exist
    container.appendChild(altPage);
  }
}

/** Helper to find the index in priority array; returns large number if not found */
function findPriorityIndex(ex, priorityList) {
  if (!ex.muscleGroup || !ex.typeOfMovement) return 9999;
  const mg = ex.muscleGroup.toLowerCase();
  const tm = ex.typeOfMovement.toLowerCase();
  for (let i = 0; i < priorityList.length; i++) {
    const p = priorityList[i];
    if (p.muscleGroup === mg && p.typeOfMovement === tm) {
      return i;
    }
  }
  return 9999;
}

/**************************************************
 * (J) DOM READY
 **************************************************/
document.addEventListener("DOMContentLoaded", function () {
  fillOneWeekPDF();

  const downloadBtn = document.getElementById("download1WeekBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", function () {
      // localStorage.setItem("purchasedWeeks", "1");
      downloadPDF("pdf1WeekContainer", "Kickstart-guide.pdf");

      if (!localStorage.getItem("discountCleared")) {
        setTimeout(function () {
          localStorage.removeItem("discountEndTime");
          localStorage.setItem("discountCleared", "true");
          location.reload();
        }, 5000);
      }
    });
  }
});

