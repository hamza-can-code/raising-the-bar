/******************************************************
 * (A) PDF GENERATION HELPER
 ******************************************************/

function downloadPDF(containerId, fileName, callback) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`No container found with ID: ${containerId}`);
    if (callback) callback();
    return;
  }
  container.style.display = "block";

  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 1 },
    jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
  };

  html2pdf()
    .set(opt)
    .from(container)
    .save()
    .then(() => {
      // container.style.display = "none"; 
      if (callback) callback();
    });
}

/******************************************************
 * (B) FOOTER LOGIC
 ******************************************************/

function createIntroFooter(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-intro"; // we also attach .footer-intro
  footerDiv.innerHTML = `
    <div class="footer-left">
      <a href="contact-us.html" class="contact-link">Need Help?</a>
    </div>
    <div class="footer-center">
      <a href="https://instagram.com" target="_blank">
        <img src="src/images/instagram-icon.png" alt="Instagram" class="social-icon-lg"/>
      </a>
      <a href="https://youtube.com" target="_blank">
        <img src="src/images/youtube-icon.png" alt="YouTube" class="social-icon-lg"/>
      </a>
      <a href="https://facebook.com" target="_blank">
        <img src="src/images/facebook-icon.png" alt="Facebook" class="social-icon-lg"/>
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

function addPageNumbers(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pages = container.querySelectorAll(".pdf-page");
  const total = pages.length;
  const idLower = containerId.toLowerCase();

  // Determine PDF type based on containerId exactly:
  const isMealPlanPDF = idLower === "pdf4weeknutritionpart2"; // Meal Plan only
  const isWorkoutPDF = idLower === "pdf4weekworkout"; // Workout PDF

  pages.forEach((pg, idx) => {
    // 1) Remove any existing footer
    const oldFooter = pg.querySelector(".footer");
    if (oldFooter) oldFooter.remove();

    // 2) Skip if .no-footer class
    if (pg.classList.contains("no-footer")) {
      return;
    }

    // 3) Skip cover (first page) & last page
    if (idx === 0 || idx === total - 1) {
      return;
    }

    // 4) Skip nav pages by ID
    if (pg.id === "pdf4WorkoutNavPage" || pg.id === "pdf4NutritionNavPage") {
      return;
    }

    // 5) Create either an intro or main footer
    const headingEl = pg.querySelector(".page-heading");
    const headingText = headingEl ? headingEl.textContent.trim().toLowerCase() : "";
    const introKeys = [
      "introduction",
      "your workout guide",
      "your nutrition plan",
      "your nutrition guide"
    ];
    let isIntroPage = false;
    introKeys.forEach(k => {
      if (headingText.includes(k)) isIntroPage = true;
    });

    let newFooter = isIntroPage
      ? createIntroFooter(idx + 1, total)
      : createMainFooter(idx + 1, total);

    // 6) Insert “Log Your Nutrition” if it’s the Meal Plan PDF, etc.
    if (isMealPlanPDF) {
      const centerDiv = newFooter.querySelector(".footer-center");
      if (centerDiv) {
        const logLink = document.createElement("a");
        logLink.href = "landing-page.html";
        logLink.className = "footer-log-link";
        logLink.textContent = "Log Your Nutrition";
        centerDiv.appendChild(logLink);
      }
    } else if (isWorkoutPDF) {
      // For Workout PDF, add "Log Your Workout" only on pages that mention certain text
      const pageContent = pg.textContent.toLowerCase();
      if (pageContent.includes("resistance training") && pageContent.includes("post-workout cardio")) {
        const centerDiv = newFooter.querySelector(".footer-center");
        if (centerDiv) {
          const logLink = document.createElement("a");
          logLink.href = "landing-page.html";
          logLink.className = "footer-log-link";
          logLink.textContent = "Log Your Workout";
          centerDiv.appendChild(logLink);
        }
      }
    }

    // 7) Append the newly created footer to the page
    pg.appendChild(newFooter);
  });
}

/******************************************************
 * (C) UTILITY: Capitalize user goal
 ******************************************************/

function capitalizeGoal(goal) {
  if (!goal) return "";
  return goal
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getAdjustedUserName() {
  const name = localStorage.getItem("name") || "User";
  if (name.length < 24) {
    return name;
  }
  const firstWord = name.split(" ")[0];
  if (firstWord.length < 25) {
    return firstWord;
  }
  return "8 Weeks to Your Best Self—Don't Stop Now!";
}

function getUpsellHeading() {
  const name = localStorage.getItem("name") || "User";
  if (name.length < 24) {
    return `${name}, 8 Weeks to Your Best Self—Don't Stop Now!`;
  } else {
    const firstWord = name.split(" ")[0];
    if (firstWord.length < 25) {
      return `${firstWord}, 8 Weeks to Your Best Self—Don't Stop Now!`;
    } else {
      return "8 Weeks to Your Best Self—Don't Stop Now!";
    }
  }
}

/******************************************************
 * (D) PLACEHOLDER TEXT/CONTENT UTILS
 ******************************************************/

// Basic placeholders for text
function placeholderIntroText() {
  return `
      <div class="video-placeholder"><p>Video Placeholder</p></div>
      <p class="introduction-text">
        <strong>Welcome to your 4-Week Tailored Workout Program!</strong> This plan is designed to guide you through four structured weeks of training and nutrition to drive real progress.<br><br>

        Your key health metrics—such as height, weight, and fitness goals—serve as the foundation for this customized journey. Your daily caloric and macronutrient targets have been calculated to align with your training volume, recovery needs, and objectives. <br><br>

        This structured 4-week plan supports steady progress through tailored workouts, meal planning, and recovery strategies. By committing to this program, you’ll follow a progressive system that enhances strength, endurance, and overall well-being.<br><br>

        Expect expert insights on training, nutrition, and recovery to help you maximize results. The goal is to provide a sustainable, results-driven approach that keeps you engaged and motivated.<br><br>

        Let’s get started on this journey to lasting progress!
      </p>
    `;
}

/******************************************************
 * (E) GET DAILY NUTRITION VARS
 ******************************************************/

function fillDailyNutritionVars() {
  const userGoalRaw = (localStorage.getItem("goal") || "").toLowerCase();
  const effortLevel = (localStorage.getItem("effortLevel") || "moderate").toLowerCase();
  const baseCals = parseInt(localStorage.getItem("selectedCalories") || "2200", 10);
  const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);

  let defCals = baseCals,
    surCals = baseCals,
    deloadCals = maintenanceCals;

  // For "Improve Body Composition," apply multipliers.
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
  } else if (userGoalRaw.includes("lose"));
  //    {
  //   defCals = Math.round(baseCals * 0.85);
  // }
  // For "gain muscle" (or any goal that includes "gain"), do nothing—
  // i.e. leave surCals equal to baseCals.

  // Macro split based on baseCals:
  const p = Math.round((0.3 * baseCals) / 4);
  const c = Math.round((0.4 * baseCals) / 4);
  const f = Math.round((0.3 * baseCals) / 9);

  // Store the computed values so that the Weekly Calorie table reads the correct numbers.
  localStorage.setItem("defCalsComputed", defCals.toString());
  localStorage.setItem("surCalsComputed", surCals.toString());

  return {
    dailyDeficit: defCals,
    dailySurplus: surCals,
    dailyDeload: deloadCals,
    waterIntake: localStorage.getItem("programWaterIntake") || "2.5",
    protein: p,
    carbs: c,
    fats: f
  };
}

/******************************************************
 * (F) BUILD PDF #1 (WORKOUT)
 ******************************************************/

function buildPdf4WeekWorkout() {
  fillWorkoutCoverPage();
  finalizeWorkoutNavPage(); // build nav with placeholders first
  fillWorkoutIntroPage();
  fillWorkoutClientProfilePage();
  fillWorkoutAdditionalAdvicePage();
  fillYourWorkoutProgramPage();

  // Build MYW dynamically
  const mywPagesCount = buildMYWDynamicPages();

  fill4WeekProgramPages(mywPagesCount);

  fillWorkoutUpsellPage();

  addPageNumbers("pdf4WeekWorkout");

  // Now recalc nav page #s properly
  finalizeWorkoutNavPage(mywPagesCount);
}


function fillWorkoutCoverPage() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("fourWeekCoverTitle");
  if (coverTitleEl) {
    // If the fallback generic string is returned, omit the possessive form.
    if (adjustedName === "8 Weeks to Your Best Self—Don't Stop Now!") {
      coverTitleEl.textContent = "Your 4-Week Program";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s 4-Week Program`;
    }
  }
}

function finalizeWorkoutNavPage(mywPagesCount = 0) {
  const navDiv = document.getElementById("pdf4WorkoutNavPage");
  if (!navDiv) return;

  const workoutDays = parseInt(localStorage.getItem("workoutDays") || "3", 10);
  const pagesPerWeek = workoutDays * 2;
  const week1Start = 7 + mywPagesCount;
  const week2Start = week1Start + pagesPerWeek;
  const week3Start = week2Start + pagesPerWeek;
  const week4Start = week3Start + pagesPerWeek;

  navDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Navigation</h2>
  `;

  const items = [
    { label: "Introduction", page: 3 },
    { label: "Your Profile", page: 4 },
    { label: "Additional Advice", page: 5 },
    { label: "Your Workout Guide", page: 6 },
    { label: "Modify Your Workout", page: 7 },
    { label: "Week 1", page: week1Start },
    { label: "Week 2", page: week2Start },
    { label: "Week 3", page: week3Start },
    { label: "Week 4", page: week4Start },
  ];

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

function fillWorkoutIntroPage() {
  const pageDiv = document.getElementById("pdf4WorkoutIntroPage");
  if (!pageDiv) return;
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Introduction</h2>
      ${placeholderIntroText()}
    `;
}

function fillWorkoutClientProfilePage() {
  const pageDiv = document.getElementById("pdf4WorkoutClientProfilePage");
  if (!pageDiv) return;

  // Basic user info
  const adjustedName = getAdjustedUserName(); // or localStorage.getItem("name"), etc.
  const dobVal = localStorage.getItem("dob") || "1990-01-01";
  const rawGoal = localStorage.getItem("goal") || "Lose Weight";
  const capGoal = capitalizeGoal(rawGoal);
  const heightVal = localStorage.getItem("height") || "170";
  const weightVal = localStorage.getItem("weight") || "70";

  // TDEE from localStorage
  const tdee = parseInt(localStorage.getItem("maintenanceCalories"), 10) || 2000;
  const formattedTDEE = tdee.toLocaleString();

  // Water intake from localStorage (or default)
  const waterVal = localStorage.getItem("programWaterIntake") || "2.5";

  // Calculate BMR (similar to 12-Week logic)
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

  // Overwrite the page content with the new style
  pageDiv.innerHTML = `
    <h2 class="page-heading with-badge-logo">${adjustedName}'s Profile</h2>
    <div class="profile-container">

      <h3 class="subheading centered">Personal Details</h3>
      <div class="profile-grid">
        <div class="profile-grid-item label">Date of Birth:</div>
        <div class="profile-grid-item">${dobVal}</div>

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

        <div class="profile-grid-item label">Steps Per Day:</div>
        <div class="profile-grid-item">${formattedSteps} steps</div>

        <div class="profile-grid-item label">Sleeping Hours:</div>
        <div class="profile-grid-item">${sleepingHours} hours</div>
      </div>

      <h3 class="subheading centered">Ultimate Goal</h3>
      <div style="
        background-color: #F9F6F2; 
        border-color: #E0DAD3; 
        color: #666; 
        text-align: center; 
        padding: 1rem; 
        border-radius: 6px;">
        ${ultimateGoal}
      </div>
    </div>
  `;
}

function fillWorkoutAdditionalAdvicePage() {
  const pageDiv = document.getElementById("pdf4WorkoutAdditionalAdvicePage");
  if (!pageDiv) return;
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h3 class="page-heading with-badge-logo">Additional Advice</h3>
  
      <p class="advice-text">
        <strong>Exercise</strong><br/>
        Ensure that you are warmed up and stretched before your main resistance movements. Prior to your working sets, perform the movement with a light load for a few repetitions to prepare your body and mind, increase performance, and reduce the risk of injury. During the main sets, choose a challenging weight whilst maintaining correct form. Move the weights in a slow and controlled manner to maximise muscle stimulation and lessen the potential for injuries. Once you have finished your set, rest for the recommended duration advised in your program before starting your next set. You should feel soreness and discomfort during your workout; however, if you feel pain during your workout, please try suggested alternative exercises or contact us: support@raisingthebarcoaching.co.uk for additional help.
      </p>

      <p class="advice-text">
        <strong>Nutrition</strong><br/>
        In order to sustain a healthy lifestyle, you must provide your body with the correct amount of calories, nutrients, vitamins, minerals, and water. Focus on consistency with nutrition rather than perfection, as small, sustainable changes lead to long-term success. Keeping a journal or using an app such as MyFitnessPal is an excellent method to track food intake. Although everything you feed your body is important, the two main components to track are your caloric and protein intake. Supplements can be very useful; they are not replacements for whole foods but can be used to complement a balanced diet.
      </p>

      <p class="advice-text">
        <strong>Recovery</strong><br/>
        Recovery is just as crucial as training. To enhance recovery, promote muscle growth, reduce stress, and boost overall health, ensure you eat and sleep adequately every day, especially on rest days. Establishing a consistent sleep schedule, avoiding food and screens an hour before bed, and maintaining a cool, dark sleep environment can significantly improve sleep quality. Taking this a step further, incorporating a relaxing bedtime routine, such as reading a book for 30-40 minutes followed by a 10-minute meditation session, can also be highly beneficial. You should be aiming to get 7-9 hours of sleep every night.
      </p>
    `;

  // Apply styling for text size consistency with introduction page
  const style = document.createElement('style');
  style.innerHTML = `
    .advice-text {
      font-size: 1rem;
      line-height: 1.5;
    }
  `;
  document.head.appendChild(style);
}

function fillYourWorkoutProgramPage() {
  const pageDiv = document.getElementById("pdf4YourWorkoutProgramPage");
  if (!pageDiv) return;
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Your Workout Guide</h2>
  
      <img
        src="#"
        alt="Program Overview Placeholder"
        style="display:block;margin:1rem auto;object-fit:cover;width:80%;height:20vh;"
      />
      
      <p class="program-intro-text">
        <strong>Welcome to your 4-Week Training Program!</strong> This structured plan has been uniquely tailored to your fitness profile using advanced algorithmic programming. Based on the information you shared, your program is designed to maximize efficiency and ensure steady progress.
      </p>
      
      <p class="program-intro-text">
        Over the next four weeks, you’ll follow a carefully structured routine balancing strength training, cardiovascular conditioning, and recovery techniques. Each workout is optimized to match your current level while progressively challenging you to improve. Here is how your workouts are structured:
      </p>
      
      <p class="program-intro-text">
        <strong>Warm-Up:</strong> Activates key muscle groups and enhances mobility to prepare your body for training.
        <br>
        <strong>Resistance Training:</strong> Focuses on building muscle and strength with structured, progressive overload.
        <br>
        <strong>Cardio:</strong> Enhances endurance, fat loss, and metabolic efficiency without hindering muscle development.
        <br>
        <strong>Cool-Down:</strong> Supports recovery by reducing muscle soreness and improving flexibility.
      </p>
      
      <p class="program-intro-text">
        By following this plan consistently, you’ll see measurable improvements in strength, endurance, and overall fitness.
      </p>
      
      <p class="program-intro-text last-paragraph">
        Let’s get started and make the next four weeks count!
      </p>
    `;

  // Apply styling for consistent text formatting
  const style = document.createElement('style');
  style.innerHTML = `
    .program-intro-text {
      font-size: 1rem;
      line-height: 1.5;
    }

    .program-intro-text.last-paragraph {
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
}

/****************************************************
 * (G) BUILD "MODIFY YOUR WORKOUT" Dynamic Pages
 ****************************************************/

function buildMYWDynamicPages() {
  const wrapper = document.getElementById("pdf4ModifyWorkoutPagesWrapper");
  if (!wrapper) return 0;

  wrapper.innerHTML = "";
  const stored = localStorage.getItem("fourWeekProgram");
  if (!stored) return 0;

  let fourWeekData = [];
  try {
    fourWeekData = JSON.parse(stored);
  } catch (err) {
    console.error("Error parsing fourWeekProgram:", err);
    return 0;
  }

  // 1) Collect all "Resistance Training" exercises, grouping by muscle
  const allExercises = [];
  fourWeekData.forEach(weekObj => {
    (weekObj.days || []).forEach(dayObj => {
      (dayObj.mainWork || []).forEach(block => {
        if (block.blockType === "Resistance Training") {
          block.exercises.forEach(ex => allExercises.push(ex));
        }
      });
    });
  });

  // remove duplicates by name
  const seen = new Set();
  const unique = [];
  allExercises.forEach(e => {
    if (!seen.has(e.name)) {
      seen.add(e.name);
      unique.push(e);
    }
  });

  // group them
  const groupMap = {
    chest: [], back: [], shoulders: [], arms: [],
    quads: [], hamstrings: [], calves: [], abs: []
  };
  unique.forEach(ex => {
    let mg = (ex.muscleGroup || "").toLowerCase();
    if (["biceps", "triceps", "forearms"].includes(mg)) mg = "arms";
    if (["abdominals", "abs"].includes(mg)) mg = "abs";
    if (groupMap[mg]) {
      groupMap[mg].push(ex);
    }
  });

  // muscle priority
  const muscleOrder = ["chest", "back", "shoulders", "arms", "quads", "hamstrings", "calves", "abs"];

  // 2) Build an array of "tables" => each table has { muscle: "chest", exCount: 3, exList: [...] }
  const tables = [];
  muscleOrder.forEach(mg => {
    const arr = groupMap[mg];
    if (arr && arr.length > 0) {
      tables.push({
        muscle: mg,
        exCount: arr.length,
        exList: arr
      });
    }
  });

  // 3) We'll now iterate over tables, applying your pairing logic
  // We'll produce an array of "pages", each page can hold 1 or 2 tables.
  const finalPages = [];
  let i = 0;

  function canPair(tableA, tableB) {
    // tableA exCount => check next
    const a = tableA.exCount;
    const b = tableB.exCount;

    if (a >= 4) return false; // 4+ => own page
    if (a === 3) {
      // can pair if next is 1
      return b === 1;
    }
    if (a === 2) {
      // can pair if next is 1 or 2
      return (b === 1 || b === 2);
    }
    if (a === 1) {
      // can pair if next is 1,2,3
      return (b === 1 || b === 2 || b === 3);
    }
    return false;
  }

  while (i < tables.length) {
    const currentTable = tables[i];
    const currentCount = currentTable.exCount;

    // If current table has 4+ => it's own page, no attempt to pair
    if (currentCount >= 4) {
      finalPages.push([currentTable]);
      i++;
    } else {
      // Try to pair with next if possible
      if (i + 1 < tables.length) {
        const nextTable = tables[i + 1];
        if (canPair(currentTable, nextTable)) {
          // Pair them
          finalPages.push([currentTable, nextTable]);
          i += 2; // skip the next as well
        } else {
          // no pair
          finalPages.push([currentTable]);
          i++;
        }
      } else {
        // no next table, so alone
        finalPages.push([currentTable]);
        i++;
      }
    }
  }

  // 4) Now we actually build the pages DOM from finalPages
  let pageCount = 0;
  finalPages.forEach((pageTables, pageIndex) => {
    // create a new PDF page .myw-page for each index
    const pdfPage = document.createElement("div");
    pdfPage.className = "pdf-page myw-page";
    pdfPage.style.backgroundColor = "#E6EBF1";

    // top-left badge
    const badgeDiv = document.createElement("div");
    badgeDiv.className = "page-header-left-logo";
    badgeDiv.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
    pdfPage.appendChild(badgeDiv);

    // If it's the first page overall (pageIndex==0), add big heading
    if (pageIndex === 0) {
      const h2 = document.createElement("h2");
      h2.className = "page-heading with-badge-logo";
      h2.textContent = "Modify Your Workout";
      pdfPage.appendChild(h2);

      const subP = document.createElement("p");
      subP.style.textAlign = "center";
      subP.style.margin = "0 0 1rem 0";
      subP.style.fontSize = "1rem";
      subP.textContent = "Need a change? Swap exercises if needed for comfort, preference, or variety.";
      pdfPage.appendChild(subP);
    }

    // For each table on this page- baring in mind that there is still the nutritional PDF?
    pageTables.forEach(tbl => {
      // Build the muscle group table
      const containerDiv = document.createElement("div");
      containerDiv.className = "session-table-container modern-table-wrapper alt-ex-table";

      // subheading
      const mgHeading = document.createElement("h3");
      mgHeading.className = "subheading";
      mgHeading.textContent = tbl.muscle.charAt(0).toUpperCase() + tbl.muscle.slice(1);
      containerDiv.appendChild(mgHeading);

      // create table
      const table = document.createElement("table");
      table.className = "session-table modern-table alt-ex-table";

      const thead = document.createElement("thead");
      const thr = document.createElement("tr");
      const thMain = document.createElement("th");
      thMain.textContent = "Main Exercise";
      const thAlt = document.createElement("th");
      thAlt.textContent = "Alternative Exercises";
      thr.appendChild(thMain);
      thr.appendChild(thAlt);
      thead.appendChild(thr);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      tbl.exList.forEach(ex => {
        const tr = document.createElement("tr");
        const tdM = document.createElement("td");
        tdM.textContent = ex.name || "Exercise";

        const tdA = document.createElement("td");
        tdA.style.textAlign = "left";
        if (ex.alternativeExercises && ex.alternativeExercises.length) {
          ex.alternativeExercises.forEach(a => {
            const d = document.createElement("div");
            d.textContent = "• " + a;
            tdA.appendChild(d);
          });
        } else {
          tdA.textContent = "No alternative exercises specified.";
        }

        tr.appendChild(tdM);
        tr.appendChild(tdA);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      containerDiv.appendChild(table);

      pdfPage.appendChild(containerDiv);
    });

    wrapper.appendChild(pdfPage);
    pageCount++;
  });

  return pageCount; // total MYW pages
}

/****************************************************
 * (H) BUILD THE 4-WEEK ACTUAL WORKOUT PAGES
 ****************************************************/

function fill4WeekProgramPages(mywPagesCount) {
  const container = document.getElementById("pdf4AllWeeksContainer");
  if (!container) {
    console.warn("pdf4AllWeeksContainer missing!");
    return;
  }
  console.log("Filling the 4-week pages now...");
  container.innerHTML = "";

  const stored = localStorage.getItem("fourWeekProgram");
  if (!stored) {
    const msg = document.createElement("p");
    msg.textContent = "No 4-week program data found in localStorage.";
    container.appendChild(msg);
    return;
  }

  let fourWeekData = [];
  try {
    fourWeekData = JSON.parse(stored);
  } catch (e) {
    console.error("Error parsing 4-week data:", e);
    return;
  }

  fourWeekData.forEach(weekObj => {
    const wNum = weekObj.week || 1;
    const phase = weekObj.phase || "Foundational Phase";
    const days = weekObj.days || [];

    days.forEach(dayObj => {
      // ============ PAGE 1 of this Day (Warm-up & Cool-down) ============
      const pgWarm = document.createElement("div");
      pgWarm.className = "pdf-page";

      const badgeDiv = document.createElement("div");
      badgeDiv.className = "page-header-left-logo";
      badgeDiv.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
      pgWarm.appendChild(badgeDiv);

      let shortDay = (dayObj.dayLabel || "").replace(/ - [A-Za-z]+$/, "");
      const h3 = document.createElement("h3");
      h3.className = "page-heading with-badge-logo";
      h3.textContent = `${phase} - Week ${wNum} - ${shortDay}`;
      pgWarm.appendChild(h3);

      // Build Warm-up table
      if (dayObj.warmUp && dayObj.warmUp.length) {
        const warmTitle = document.createElement("h4");
        warmTitle.className = "section-heading";   // use our new CSS class
        warmTitle.textContent = "Pre-Workout Warm-Up";
        pgWarm.appendChild(warmTitle);

        // Build a modern-table with a <thead>
        const warmTableWrap = document.createElement("div");
        warmTableWrap.className = "session-table-container modern-table-wrapper";
        const warmTable = document.createElement("table");
        warmTable.className = "session-table modern-table";

        const warmThead = document.createElement("thead");
        const warmHeadRow = document.createElement("tr");
        ["Exercise", "Duration", "RPE", "Notes"].forEach(txt => {
          const th = document.createElement("th");
          th.textContent = txt;
          warmHeadRow.appendChild(th);
        });
        warmThead.appendChild(warmHeadRow);
        warmTable.appendChild(warmThead);

        const warmTBody = document.createElement("tbody");
        dayObj.warmUp.forEach(wu => {
          const row = buildExerciseRow(wu.name, wu.duration, wu.rpe ? `RPE ${wu.rpe}` : "", wu.notes);
          warmTBody.appendChild(row);
        });
        warmTable.appendChild(warmTBody);
        warmTableWrap.appendChild(warmTable);
        pgWarm.appendChild(warmTableWrap);
      }

      // Build Cool-down table
      if (dayObj.coolDown && dayObj.coolDown.length) {
        const coolTitle = document.createElement("h4");
        coolTitle.className = "section-heading";
        coolTitle.textContent = "Post-Workout Cool-Down";
        pgWarm.appendChild(coolTitle);

        const coolTableWrap = document.createElement("div");
        coolTableWrap.className = "session-table-container modern-table-wrapper";
        const coolTable = document.createElement("table");
        coolTable.className = "session-table modern-table";

        // Add a thead
        const coolThead = document.createElement("thead");
        const coolHeadRow = document.createElement("tr");
        ["Exercise", "Duration", "RPE", "Notes"].forEach(txt => {
          const th = document.createElement("th");
          th.textContent = txt;
          coolHeadRow.appendChild(th);
        });
        coolThead.appendChild(coolHeadRow);
        coolTable.appendChild(coolThead);

        const coolTBody = document.createElement("tbody");
        dayObj.coolDown.forEach(cd => {
          const row = buildExerciseRow(cd.name, cd.duration, cd.rpe ? `RPE ${cd.rpe}` : "", cd.notes);
          coolTBody.appendChild(row);
        });
        coolTable.appendChild(coolTBody);
        coolTableWrap.appendChild(coolTable);
        pgWarm.appendChild(coolTableWrap);
      }

      const noteNext = document.createElement("p");
      noteNext.className = "note-text-nav";
      noteNext.textContent = "Please see the next page for the main workout.";
      pgWarm.appendChild(noteNext);

      container.appendChild(pgWarm);

      // ============ PAGE 2 of this Day (Resistance & Cardio) ============
      const pgMain = document.createElement("div");
      pgMain.className = "pdf-page";

      const badgeMain = document.createElement("div");
      badgeMain.className = "page-header-left-logo";
      badgeMain.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
      pgMain.appendChild(badgeMain);

      const h3b = document.createElement("h3");
      h3b.className = "page-heading with-badge-logo";
      h3b.textContent = `${phase} - Week ${wNum} - ${shortDay}`;
      pgMain.appendChild(h3b);

      const rtBlocks = dayObj.mainWork
        ? dayObj.mainWork.filter(b => b.blockType === "Resistance Training")
        : [];
      if (rtBlocks.length > 0) {
        const rtTitle = document.createElement("h4");
        rtTitle.className = "section-heading";
        rtTitle.textContent = "Resistance Training";
        pgMain.appendChild(rtTitle);

        const rtWrap = document.createElement("div");
        rtWrap.className = "session-table-container modern-table-wrapper";
        const rtTable = document.createElement("table");
        rtTable.className = "session-table modern-table";

        // thead for RT table
        const rtThead = document.createElement("thead");
        const rtHeadRow = document.createElement("tr");
        ["Exercise", "Sets/Reps", "RPE", "Notes"].forEach(txt => {
          const th = document.createElement("th");
          th.textContent = txt;
          rtHeadRow.appendChild(th);
        });
        rtThead.appendChild(rtHeadRow);
        rtTable.appendChild(rtThead);

        const rtTBody = document.createElement("tbody");
        rtBlocks.forEach(block => {
          (block.exercises || []).forEach(ex => {
            const row = buildExerciseRow(
              ex.name,
              (ex.sets && ex.reps) ? `${ex.sets} x ${ex.reps}` : ex.duration || "",
              ex.rpe ? `RPE ${ex.rpe}` : "",
              ex.notes
            );
            rtTBody.appendChild(row);
          });
        });
        rtTable.appendChild(rtTBody);
        rtWrap.appendChild(rtTable);
        pgMain.appendChild(rtWrap);
      }

      const cardioBlocks = dayObj.mainWork
        ? dayObj.mainWork.filter(b => b.blockType === "Cardio")
        : [];
      if (cardioBlocks.length > 0) {
        const cardioTitle = document.createElement("h4");
        cardioTitle.className = "section-heading";
        cardioTitle.textContent = "Post-Workout Cardio";
        pgMain.appendChild(cardioTitle);

        const cardioWrap = document.createElement("div");
        cardioWrap.className = "session-table-container modern-table-wrapper";
        const cardioTable = document.createElement("table");
        cardioTable.className = "session-table modern-table";

        // thead for Cardio table
        const cardioThead = document.createElement("thead");
        const cardioHeadRow = document.createElement("tr");
        ["Exercise", "Duration", "RPE", "Notes"].forEach(txt => {
          const th = document.createElement("th");
          th.textContent = txt;
          cardioHeadRow.appendChild(th);
        });
        cardioThead.appendChild(cardioHeadRow);
        cardioTable.appendChild(cardioThead);

        const cardioTBody = document.createElement("tbody");
        cardioBlocks.forEach(block => {
          if (Array.isArray(block.exercises)) {
            block.exercises.forEach(cx => {
              const r = buildExerciseRow(
                cx.name,
                cx.duration || (block.allocatedMinutes ? `${block.allocatedMinutes} mins` : ""),
                cx.rpe ? `RPE ${cx.rpe}` : "",
                cx.notes
              );
              cardioTBody.appendChild(r);
            });
          } else {
            const r = buildExerciseRow(
              block.name,
              block.allocatedMinutes ? `${block.allocatedMinutes} mins` : "",
              block.rpe ? `RPE ${block.rpe}` : "",
              block.notes
            );
            cardioTBody.appendChild(r);
          }
        });
        cardioTable.appendChild(cardioTBody);
        cardioWrap.appendChild(cardioTable);
        pgMain.appendChild(cardioWrap);
      }

      const notePrev = document.createElement("p");
      notePrev.className = "note-text-nav";
      notePrev.textContent = "Please see the previous page for the warm-up and cool-down.";
      pgMain.appendChild(notePrev);
      container.appendChild(pgMain);
    });
  });
}

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

/****************************************************
 * (I) UPSell Page (4-Week Program)
 ****************************************************/

function fillWorkoutUpsellPage() {
  // Get the upsell heading text as before
  const upsellHeading = getUpsellHeading();
  const pg = document.getElementById("pdf4WorkoutUpsellPage");
  if (!pg) return;

  pg.innerHTML = "";
  pg.classList.add("no-footer");

  // ------------------------------
  // 1) Next Step Heading (using upsellHeading)
  // ------------------------------
  const nextStepHeading = document.createElement("div");
  nextStepHeading.className = "next-step-heading";
  nextStepHeading.innerHTML = `
    <p class="upsell-next-step">
      ${upsellHeading}
    </p>
  `;
  pg.appendChild(nextStepHeading);

  // ------------------------------
  // 2) Benefits: 6 bullet points (3 rows x 2 columns)
  // ------------------------------
  const benefitsContainer = document.createElement("div");
  benefitsContainer.className = "upsell-benefits-grid";
  benefitsContainer.innerHTML = `
    <div class="upsell-benefit-row">
      <div class="upsell-benefit-item">✔ 12-Week Training Plan</div>
      <div class="upsell-benefit-item">✔ Step-by-Step Exercise Demos</div>
    </div>
    <div class="upsell-benefit-row">
      <div class="upsell-benefit-item">✔ Progressive Overload Programming</div>
      <div class="upsell-benefit-item">✔ 12-Week Coaching Series</div>
    </div>
    <div class="upsell-benefit-row">
      <div class="upsell-benefit-item">✔ Exclusive Goal Guarantee</div>
      <div class="upsell-benefit-item">✔ Access to Expert-Led Workshops</div>
    </div>
  `;
  pg.appendChild(benefitsContainer);

  // ------------------------------
  // 3) Testimonial (Image on left, Name/Stars/Review on right)
  // ------------------------------
  const workoutTestimonialRow = document.createElement("div");
  workoutTestimonialRow.className = "upsell-testimonial-row";

  // Testimonial image
  const workoutTestimonialImg = document.createElement("img");
  workoutTestimonialImg.className = "upsell-testimonial-placeholder";
  workoutTestimonialImg.style.objectFit = "cover";
  workoutTestimonialImg.style.width = "250px";
  workoutTestimonialImg.style.height = "250px";
  workoutTestimonialImg.src = getTestimonialImageBasedOnGoal();
  workoutTestimonialRow.appendChild(workoutTestimonialImg);

  // Container for testimonial text (header + review)
  const workoutTestimonialTextContainer = document.createElement("div");
  workoutTestimonialTextContainer.className = "upsell-testimonial-text-container";
  workoutTestimonialTextContainer.style.marginLeft = "1rem";
  workoutTestimonialRow.appendChild(workoutTestimonialTextContainer);

  // Testimonial header (Name + Stars)
  const workoutTestimonialHeader = document.createElement("div");
  workoutTestimonialHeader.className = "upsell-testimonial-header";

  // Get dynamic name and review for the workout page
  const { name, review } = getWorkoutTestimonialNameAndReview();

  // Name element (left side)
  const workoutTestimonialName = document.createElement("strong");
  workoutTestimonialName.textContent = name;
  workoutTestimonialHeader.appendChild(workoutTestimonialName);

  // Stars element (right side)
  const workoutTestimonialStars = document.createElement("img");
  workoutTestimonialStars.src = "src/images/5-stars.png";
  workoutTestimonialStars.alt = "5-star rating";
  workoutTestimonialStars.style.width = "150px";
  workoutTestimonialHeader.appendChild(workoutTestimonialStars);

  workoutTestimonialTextContainer.appendChild(workoutTestimonialHeader);

  // Testimonial review text
  const workoutTestimonialText = document.createElement("div");
  workoutTestimonialText.className = "upsell-testimonial-text";
  workoutTestimonialText.innerHTML = `"${review}"`;
  workoutTestimonialTextContainer.appendChild(workoutTestimonialText);

  pg.appendChild(workoutTestimonialRow);

  // ------------------------------
  // 4) Guarantee Paragraph
  // ------------------------------
  const guaranteeEl = document.createElement("p");
  guaranteeEl.style.fontSize = "1rem";
  guaranteeEl.style.textAlign = "center";
  guaranteeEl.style.lineHeight = "1.4";
  guaranteeEl.style.margin = "2rem auto 1.5rem auto";
  guaranteeEl.style.maxWidth = "90%";
  guaranteeEl.innerHTML = `
    <strong>We stand behind our training strategies because they work.</strong>
    If you don’t reach your goal, we’ll guide you with free 1-on-1 support until you do.
  `;
  pg.appendChild(guaranteeEl);

  // ------------------------------
  // 5) CTA Button
  // ------------------------------
  const ctaBtn = document.createElement("a");
  ctaBtn.href = "#";
  ctaBtn.className = "upsell-cta-btn";
  ctaBtn.textContent = "🔥 Limited Time – Get Your 12-Week Program Now!";
  pg.appendChild(ctaBtn);

  // ------------------------------
  // 6) Price Wrapper
  // ------------------------------
  const priceWrapper = document.createElement("div");
  priceWrapper.style.textAlign = "center";
  priceWrapper.style.fontFamily = "Poppins";
  priceWrapper.style.marginTop = "1.5rem";
  priceWrapper.style.marginBottom = "1.5rem";
  priceWrapper.style.paddingBottom = "0";
  priceWrapper.innerHTML = `
    <span style="color:#333; text-decoration: line-through; font-size:18px; margin-right:4px;">
      £99.99
    </span>
    <span style="color: #ffffff; background-color: #d9534f; font-size:24px; margin-left:4px; font-weight:800; letter-spacing:0.5px; padding: 0.5rem; border-radius: 6px;">
      £79.99
    </span>
  `;
  pg.appendChild(priceWrapper);

  // ------------------------------
  // 7) Money-Back Guarantee
  // ------------------------------
  const riskFreeP = document.createElement("p");
  riskFreeP.className = "money-back-text";
  riskFreeP.textContent = "100% Risk-Free - Love it or get a FULL refund within 30 days!";
  pg.appendChild(riskFreeP);
}


/****************************************************
 * (J) BUILD PDF #2 (NUTRITION)
 ****************************************************/

function buildPdf4WeekNutritionPart1() {
  fillNutritionCoverPage();
  fillNutritionNavPage();
  fillNutritionIntroPage();
  fillDailyNutritionVars();
  buildWeeklyCalorieTable();
  createFoodGuidePage();
  fill12MealPrepTimePage();
  fill12LongTermSuccessPage();
  fill12EatingOutSocialPage();
  createGrocerySubstitutionsPages();
  buildMergedPortionStructuringPage();
  buildNutritionQuickStartGuidePages();
  fillNutritionUpsellPage();
  addPageNumbers("pdf4WeekNutritionPart1");
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
  const lunchTarget     = Math.round(dailyCals * splits.Lunch);
  const dinnerTarget    = Math.round(dailyCals * splits.Dinner);
  const snackTarget     = Math.round(dailyCals * splits.Snack);

  console.log(`\n--- build12WeekMealPlanDay(W${weekNumber}D${dayNumber}) dailyCals=${dailyCals} ---`);
  console.log(` breakfast=${breakfastTarget}, lunch=${lunchTarget}, dinner=${dinnerTarget}, snack=${snackTarget}`);

  // pick & scale
  const breakfastMeal = pickMealForCategory("Breakfast", breakfastTarget, mealDatabase);
  const lunchMeal     = pickMealForCategory("Lunch",     lunchTarget,     mealDatabase);
  const dinnerMeal    = pickMealForCategory("Dinner",    dinnerTarget,    mealDatabase);
  const snackMeal     = pickMealForCategory("Snack",     snackTarget,     mealDatabase);

  let finalTotalCals = 0;
  [breakfastMeal, lunchMeal, dinnerMeal, snackMeal].forEach(m => {
    if (m) finalTotalCals += m.calories;
  });

  return {
    week: weekNumber,
    day:  dayNumber,
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
      console.log(`\n=== Week ${w} - Day ${d}, mealFreq=${mealFrequency}, phase=${phase} ===`);
      console.log(` dailyCals=${baseDailyCals} => ratioObj=`, ratioObj);

      // Build the dayMeals object
      const dayMeals = {};
      Object.entries(ratioObj).forEach(([cat, r]) => {
        const mealTarget = Math.round(baseDailyCals * r);
        console.log(`   ${cat} => ${Math.round(r*100)}% => target=${mealTarget}`);
        const meal = pickMealForCategory(cat, mealTarget, mealDatabase);
        dayMeals[cat] = meal;
      });

      // Now we have only the categories that appear in ratioObj
      const allCats = Object.keys(ratioObj); // e.g. ["Breakfast","Lunch","Dinner"]
      // We'll do page1 for the first 2 categories, page2 for the rest
      const page1Cats = allCats.slice(0,2);
      const page2Cats = allCats.slice(2);

      // ============ PAGE 1 ============ 
      const page1 = document.createElement("div");
      page1.className = "pdf-page meal-plan-page";
      // top-left logo
      const logo1 = document.createElement("div");
      logo1.className = "page-header-left-logo";
      logo1.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="Badge" class="logo-badge"/>`;
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
        logo2.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="Badge" class="logo-badge"/>`;
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

/****************************************************
 * (K) BUILD PDF #3 (NUTRITION PART 2) – STILL HAS MEAL PLAN
 ****************************************************/
// function buildPdf4WeekNutritionPart2() {
//   const container = document.getElementById("pdf4WeekNutritionPart2");
//   if (!container) return;

//   fillMealPlanCoverPage();
//   fillPdf4NutritionPart2NavPage();
//   build28DayMealPlanRework();
//   addPageNumbers("pdf4WeekNutritionPart2");
// }

/****************************************************
 * [SECTION 70] MERGED FPG + MBF PAGE
 ****************************************************/
/**
 * REPLACES the old "buildFoodPortionGuidePage()" and
 * "buildMealBuildingFrameworkPage()" with a single
 * combined page: "Portioning & Structuring Your Meals"
 */
function buildMergedPortionStructuringPage() {
  // 1) We'll still use the same page ID: #pdf4FoodPortionGuidePage
  const pageDiv = document.getElementById("pdf4FoodPortionGuidePage");
  if (!pageDiv) return;

  // (a) Change the title to "Portioning & Structuring Your Meals"
  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Portioning & Structuring Your Meals</h2>

    <!-- (b) Keep the subtext about portion sizes as is: -->
    <p style="text-align:center; font-size:1rem; margin-top:0; margin-bottom:1.5rem;">
      Portion sizes can be estimated using your hands as a guide, making it easy
      to eat balanced meals without a scale.
    </p>
  `;

  // (c) FPG table content, but with adjusted column widths.
  //    We'll add a custom class to adjust widths for the 4 columns.
  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper";

  const table = document.createElement("table");
  table.className = "session-table modern-table portion-table-adjusted";

  // Thead
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  // For example: "Nutrient", "Hand-Size Method", "Measured Serving", "Examples"
  const headers = ["Nutrient", "Hand-Size Method", "Measured Serving", "Examples"];
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");
  const rowData = [
    ["Protein", "Palm-sized", "~100-150g (3.5-5oz)", "Chicken, Fish, Tofu, Eggs"],
    ["Carbs", "Cupped hand", "~40-60g (½-⅔ cup)", "Rice, Oats, Potatoes, Pasta"],
    ["Veggies", "Unlimited", "~1-2 cups", "Leafy Greens, Broccoli, Peppers"]
  ];
  rowData.forEach((rowArr) => {
    const tr = document.createElement("tr");
    rowArr.forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);

  // (d) Underneath this table, add the subtext from the old MBF page:
  //     "Follow this simple formula..."
  const mbfSubtext = document.createElement("p");
  mbfSubtext.style.textAlign = "center";
  mbfSubtext.style.fontSize = "1rem";
  mbfSubtext.style.margin = "2rem 0 1rem 0";
  mbfSubtext.innerHTML = `
    Use this simple formula to build balanced meals—pick one option from each category to meet your macro needs.
  `;
  pageDiv.appendChild(mbfSubtext);

  // (e) The old MBF table goes here
  const mbfTableWrap = document.createElement("div");
  mbfTableWrap.className = "session-table-container modern-table-wrapper twocol-20-80";

  const mbfTable = document.createElement("table");
  mbfTable.className = "session-table modern-table twocol-20-80";

  // Thead
  const mbfThead = document.createElement("thead");
  const mbfTrHead = document.createElement("tr");
  const thLeft = document.createElement("th");
  thLeft.textContent = "Step";
  const thRight = document.createElement("th");
  thRight.textContent = "Pick One (Examples)";
  mbfTrHead.appendChild(thLeft);
  mbfTrHead.appendChild(thRight);
  mbfThead.appendChild(mbfTrHead);
  mbfTable.appendChild(mbfThead);

  // Tbody
  const mbfTbody = document.createElement("tbody");
  const mbfRows = [
    ["Protein", "Chicken, Salmon, Tofu, Greek Yogurt, Eggs"],
    ["Carbs", "Rice, Quinoa, Potatoes, Pasta, Oats"],
    ["Fats", "Avocado, Olive Oil, Nuts, Cheese"],
    ["Veggies", "Leafy Greens, Broccoli, Peppers, Carrots"],
    ["Seasonings", "Herbs, Spices, Lemon, Vinegar"]
  ];
  mbfRows.forEach(([step, examples]) => {
    const tr = document.createElement("tr");
    const tdStep = document.createElement("td");
    tdStep.textContent = step;
    const tdExamples = document.createElement("td");
    tdExamples.textContent = examples;
    tr.appendChild(tdStep);
    tr.appendChild(tdExamples);
    mbfTbody.appendChild(tr);
  });
  mbfTable.appendChild(mbfTbody);
  mbfTableWrap.appendChild(mbfTable);
  pageDiv.appendChild(mbfTableWrap);
}

function buildFoodPortionGuidePage() {
  const pageDiv = document.getElementById("pdf4FoodPortionGuidePage");
  if (!pageDiv) return;

  // Badge logo at top-left + subheading
  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Food Portioning Guide</h2>
    <p style="text-align:center; font-size:1rem; margin-top:0; margin-bottom:1.5rem;">
      Portion sizes can be estimated using your hands as a guide, making it easy
      to eat balanced meals without a scale.
    </p>
  `;

  // Build table (styled same as PDF 2 Part 1 tables)
  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper";

  const table = document.createElement("table");
  table.className = "session-table modern-table";

  // Thead
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  ["Nutrient", "Hand-Size Method", "Measured Serving", "Examples"].forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");

  const rowData = [
    ["Protein", "Palm-sized", "~100-150g (3.5-5oz)", "Chicken, Fish, Tofu, Eggs"],
    ["Carbs", "Cupped hand", "~40-60g (½-⅔ cup)", "Rice, Oats, Potatoes, Pasta"],
    ["Veggies", "Unlimited", "~1-2 cups", "Leafy Greens, Broccoli, Peppers"]
  ];

  rowData.forEach(r => {
    const tr = document.createElement("tr");
    r.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);
}

/** 
 * 2) Meal-Building Framework Page
 */
function buildMealBuildingFrameworkPage() {
  const pageDiv = document.getElementById("pdf4MealBuildingFrameworkPage");
  if (!pageDiv) return;

  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Meal-Building Framework</h2>
    <p style="text-align:center; font-size:1rem; margin-top:0; margin-bottom:1.5rem;">
      Follow this simple formula to create well-balanced meals using the Grocery Planning & Substitutions (GPS) swaps.
      Pick one option from each category for a meal that meets your macro needs.
    </p>
  `;

  // Table with two columns (20% : 80%)
  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper twocol-20-80";

  const table = document.createElement("table");
  table.className = "session-table modern-table twocol-20-80";

  // Thead
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  // Left col heading
  const thLeft = document.createElement("th");
  thLeft.textContent = "Step";
  thr.appendChild(thLeft);
  // Right col heading
  const thRight = document.createElement("th");
  thRight.textContent = "Choose One (Examples)";
  thr.appendChild(thRight);
  thead.appendChild(thr);
  table.appendChild(thead);

  // Tbody rows
  const tbody = document.createElement("tbody");

  const rows = [
    ["Protein", "Chicken, Salmon, Tofu, Greek Yogurt, Eggs"],
    ["Carbs", "Rice, Quinoa, Potatoes, Pasta, Oats"],
    ["Fats", "Avocado, Olive Oil, Nuts, Cheese"],
    ["Veggies", "Leafy Greens, Broccoli, Peppers, Carrots"],
    ["Seasonings", "Herbs, Spices, Lemon, Vinegar"]
  ];

  rows.forEach((pair) => {
    const tr = document.createElement("tr");
    const tdLeft = document.createElement("td");
    tdLeft.textContent = pair[0];
    tr.appendChild(tdLeft);

    const tdRight = document.createElement("td");
    tdRight.textContent = pair[1];
    tr.appendChild(tdRight);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);
}

/** 
 * 3) Nutrition Quick-Start Guide Page
 */
function buildNutritionQuickStartGuidePages() {
  buildNQSG_Page1();
  buildNQSG_Page2();
}

/** 
 * Page 1 of the Nutrition Quick-Start Guide 
 * - Up to "Follow this simple structure..."
 */
function buildNQSG_Page1() {
  const pageDiv = document.getElementById("pdf4NutritionQuickStartPage");
  if (!pageDiv) return;

  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Nutrition Summary</h2>
    <p style="text-align:center; font-size:1rem; margin-top:0; margin-bottom:1.5rem;">
      A streamlined summary to help you structure meals, adjust your nutrition, and stay on track with your goals.
    </p>
    <p style="font-weight:bold; font-size: 1.1rem; text-align:center; margin-bottom:1rem;">
      Balance your plate with the right mix of macronutrients.
    </p>
  `;

  // 1) Table: "Macronutrient | Function | Food Sources"
  const tableWrap1 = document.createElement("div");
  tableWrap1.className = "session-table-container modern-table-wrapper";
  const table1 = document.createElement("table");
  table1.className = "session-table modern-table";

  // Thead
  const thead1 = document.createElement("thead");
  const thr1 = document.createElement("tr");
  ["Macronutrient", "Function", "Food Sources"].forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    thr1.appendChild(th);
  });
  thead1.appendChild(thr1);
  table1.appendChild(thead1);

  // Tbody
  const tbody1 = document.createElement("tbody");
  const macroRows = [
    ["Protein", "Builds & repairs muscle", "Chicken, Salmon, Tofu, Eggs"],
    ["Carbs", "Provides energy", "Rice, Oats, Potatoes, Pasta"],
    ["Fats", "Supports hormones & brain function", "Avocado, Nuts, Olive Oil"]
  ];
  macroRows.forEach(r => {
    const tr = document.createElement("tr");
    r.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody1.appendChild(tr);
  });
  table1.appendChild(tbody1);
  tableWrap1.appendChild(table1);
  pageDiv.appendChild(tableWrap1);

  // 2) Bold subtext: "Follow this simple structure..."
  const pBold1 = document.createElement("p");
  pBold1.style.fontWeight = "bold";
  pBold1.style.textAlign = "center";
  pBold1.style.margin = "1rem 0 0.5rem 0";
  pBold1.style.fontSize = "1.1rem";
  pBold1.textContent = "Follow this simple structure to create balanced meals.";
  pageDiv.appendChild(pBold1);

  // 3) Subtext about "Protein (Palm-Sized)..."
  const pDesc = document.createElement("p");
  pDesc.style.textAlign = "center";
  pDesc.style.marginBottom = "1.5rem";
  pDesc.style.fontSize = "1rem";
  pDesc.textContent = "Protein (Palm-Sized) + Carbs (Cupped-Hand) + Fats (Thumb-Sized) + Veggies (Unlimited)";
  pageDiv.appendChild(pDesc);

  // 4) Second table: 20:80 with "Step" / "Pick One (Examples)"
  const tableWrap2 = document.createElement("div");
  tableWrap2.className = "session-table-container modern-table-wrapper twocol-20-80";

  const table2 = document.createElement("table");
  table2.className = "session-table modern-table twocol-20-80";

  const thead2 = document.createElement("thead");
  const thr2 = document.createElement("tr");
  ["Step", "Choose One (Examples)"].forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    thr2.appendChild(th);
  });
  thead2.appendChild(thr2);
  table2.appendChild(thead2);

  const tbody2 = document.createElement("tbody");
  const data2 = [
    ["Protein", "Chicken, Salmon, Tofu, Greek Yogurt"],
    ["Carbs", "Rice, Quinoa, Sweet Potatoes, Oats"],
    ["Healthy Fats", "Avocado, Nuts, Olive Oil"],
    ["Veggies", "Leafy Greens, Broccoli, Peppers"]
  ];
  data2.forEach(row => {
    const tr = document.createElement("tr");
    const tdLeft = document.createElement("td");
    tdLeft.textContent = row[0];
    const tdRight = document.createElement("td");
    tdRight.textContent = row[1];
    tr.appendChild(tdLeft);
    tr.appendChild(tdRight);
    tbody2.appendChild(tr);
  });
  table2.appendChild(tbody2);
  tableWrap2.appendChild(table2);
  pageDiv.appendChild(tableWrap2);
}

/**
 * Page 2 of the Nutrition Quick-Start Guide
 * - "Out of an ingredient?" table, then final bold subtext
 */
function buildNQSG_Page2() {
  const pageDiv = document.getElementById("pdf4NutritionQuickStartPage2");
  if (!pageDiv) return;

  // Same top styling, badge logo, heading
  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Nutrition Summary</h2>
        <p style="text-align:center; font-size:1rem; margin-top:0; margin-bottom:1.5rem;">
      A streamlined summary to help you structure meals, adjust your nutrition, and stay on track with your goals.
    </p>
  `;

  // Bold subtext: "Out of an ingredient? ..."
  const pBold = document.createElement("p");
  pBold.style.fontWeight = "bold";
  pBold.style.textAlign = "center";
  pBold.style.margin = "1rem 0 0.5rem 0";
  pBold.style.fontSize = "1.1rem";
  pBold.textContent = "Out of an ingredient? Swap it with these easy alternatives.";
  pageDiv.appendChild(pBold);

  // Table (2 columns, 20:80)
  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper twocol-20-80";

  const table = document.createElement("table");
  table.className = "session-table modern-table twocol-20-80";

  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  ["Swap This", "Use These Instead"].forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const data = [
    ["Chicken", "Turkey, Lean Beef, Tofu"],
    ["White Rice", "Quinoa, Cauliflower Rice, Whole Wheat Couscous"],
    ["Butter", "Olive Oil, Avocado, Coconut Oil"]
  ];
  data.forEach(row => {
    const tr = document.createElement("tr");
    const tdLeft = document.createElement("td");
    tdLeft.textContent = row[0];
    const tdRight = document.createElement("td");
    tdRight.textContent = row[1];
    tr.appendChild(tdLeft);
    tr.appendChild(tdRight);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);

  const subHeading = document.createElement("h3");
  subHeading.style.textAlign = "center";
  subHeading.style.margin = "2rem 0 0.5rem 0";
  subHeading.style.fontSize = "1.2rem";
  subHeading.textContent = "What's Next?"; // You can change this text as needed
  pageDiv.appendChild(subHeading);

  // Final bold subtext
  const pBold2 = document.createElement("p");
  // pBold2.style.fontWeight = "bold";
  pBold2.style.textAlign = "center";
  pBold2.style.margin = "1.5rem 0 0 0";
  pBold2.style.fontSize = "1rem";
  pBold2.textContent = "You now have the knowledge to structure balanced meals. Ready to put it into action? Head over to your 4-Week Meal Plan for everything mapped out for you. The next few pages offer simple ingredient swaps if you ever want variety while staying on track.";
  pageDiv.appendChild(pBold2);
}

function fillPdf4NutritionPart2NavPage() {
  const navDiv = document.getElementById("pdf4NutritionPart2NavPage");
  if (!navDiv) return;

  // If navDiv is the entire page, you can do:
  // navDiv.classList.add("pdf-page", "no-footer");

  // Otherwise, if navDiv is a child of the .pdf-page, do:
  const pageEl = navDiv.closest(".pdf-page");
  if (pageEl) {
    pageEl.classList.add("no-footer");
  }

  // Read mealFrequency from localStorage
  const mealFrequency = parseInt(localStorage.getItem("mealFrequency") || "3", 10);

  navDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Navigation</h2>
  `;

  let items;
  if (mealFrequency === 2) {
    items = [
      { label: "Week 1", page: 3 },
      { label: "Week 2", page: 10 },
      { label: "Week 3", page: 17 },
      { label: "Week 4", page: 24 }
    ];
  } else {
    items = [
      { label: "Week 1", page: 3 },
      { label: "Week 2", page: 17 },
      { label: "Week 3", page: 31 },
      { label: "Week 4", page: 45 }
    ];
  }

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach(obj => {
    const leftDiv = document.createElement("div");
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    leftDiv.textContent = obj.label;

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    rightDiv.textContent = obj.page;

    navGrid.appendChild(leftDiv);
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function fillPdf4NutritionPart2IntroPage() {
  const pg = document.getElementById("pdf4NutritionPart2IntroPage");
  if (!pg) return;

  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Introduction</h2>
    <div class="video-placeholder">
      <p>Video Placeholder</p>
    </div>
    <p class="introduction-text">
      <strong>Welcome to the second half of your 4-Week Nutrition Plan!</strong><br><br>
      In Weeks 3 and 4, we’ll continue to refine your meals and ensure consistent progress...
      Remember, staying flexible and making small adjustments will lead to sustainable results.
    </p>
  `;
}

/****************************************************
 * [ADDED] SPLIT NUTRITION LOGIC
 ****************************************************/

/**
 * buildPdfNutritionWeeks1to2()
 * Builds the "Weeks 1–2" portion of your Nutrition PDF.
 */
function buildPdfNutritionWeeks1to2() {
  const container = document.getElementById("pdf4WeekNutritionPart1");
  if (!container) return;
  container.innerHTML = ""; // Clear if needed

  // You can reuse the same "cover" logic (or a smaller cover).
  // 1) Some cover page for part 1
  const coverPage = document.createElement("div");
  coverPage.className = "pdf-page cover-page no-footer";
  coverPage.innerHTML = `
    <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="cover-logo" style="max-width:300px;" />
    <hr class="divider"/>
    <h2 class="cover-title">Nutrition Plan – Weeks 1–2</h2>
    <hr class="divider"/>
    <p class="cover-subtitle">Fuel Your Body (Weeks 1–2)</p>
  `;
  container.appendChild(coverPage);

  // 2) Nav page, introduction, daily vars, etc. for weeks 1–2
  //    You can replicate your existing fillNutritionNavPage(), fillNutritionIntroPage(), etc.
  //    but just be sure you’re appending them to the container for part1.

  // For demonstration, we will do:
  const navPage = document.createElement("div");
  navPage.className = "pdf-page";
  navPage.innerHTML = `<h2 class="page-heading">Navigation (Weeks 1–2)</h2>`;
  container.appendChild(navPage);

  // introduction
  const introPage = document.createElement("div");
  introPage.className = "pdf-page";
  introPage.innerHTML = `<h2 class="page-heading">Introduction</h2><p>Intro text for Weeks 1–2...</p>`;
  container.appendChild(introPage);

  // etc. fillDailyNutritionVars, buildWeeklyCalorieTable, createFoodGuidePage
  // (Alternatively, replicate the calls exactly like in buildPdf4WeekNutrition, but target container #pdf4WeekNutritionPart1)

  // 3) Build the meal plan only for weeks 1–2
  build28DayMealPlanRework({ fromWeek: 1, toWeek: 2, targetContainerId: "pdf4WeekNutritionPart1" });

  // 4) Optionally add an upsell or partial upsell for Weeks 1–2
  // ...
  addPageNumbers("pdf4WeekNutritionPart1");
}

/**
 * buildPdfNutritionWeeks3to4()
 * Builds the "Weeks 3–4" portion of your Nutrition PDF.
 */
function buildPdfNutritionWeeks3to4() {
  const container = document.getElementById("pdf4WeekNutritionPart2");
  if (!container) return;
  container.innerHTML = "";

  // Minimal cover or heading
  const coverPage = document.createElement("div");
  coverPage.className = "pdf-page cover-page no-footer";
  coverPage.innerHTML = `
    <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="cover-logo" style="max-width:300px;" />
    <hr class="divider"/>
    <h2 class="cover-title">Nutrition Plan – Weeks 3–4</h2>
    <hr class="divider"/>
    <p class="cover-subtitle">Continuing Your Journey (Weeks 3–4)</p>
  `;
  container.appendChild(coverPage);

  // Minimal instructions or a new Nav page, etc.

  // Then the actual meal plan for weeks 3–4
  build28DayMealPlanRework({ fromWeek: 3, toWeek: 4, targetContainerId: "pdf4WeekNutritionPart2" });

  // Possibly a separate upsell or final summary
  addPageNumbers("pdf4WeekNutritionPart2");
}

function fillNutritionCoverPage() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("fourWeekNutritionCoverTitle");
  if (coverTitleEl) {
    if (adjustedName === "8 Weeks to Your Best Self—Don't Stop Now!") {
      coverTitleEl.textContent = "Your Nutrition Guide";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s Nutrition Guide`;
    }
  }
}

function fillNutritionNavPage() {
  const navDiv = document.getElementById("pdf4NutritionNavPage");
  if (!navDiv) return;

  navDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Navigation</h2>
  `;

  const items = [
    { label: "Introduction", page: 3 },
    { label: "Weekly Calorie & Macro Overview", page: 4 },
    { label: "Essential Food Guide", page: 5 },
    { label: "Portioning & Structuring Your Meals", page: 6 },
    { label: "Nutrition Summary", page: 7 },
    { label: "Strategic Meal Prep & Time-Saving Guide", page: 9 },
    { label: "How to Eat for Long-Term Success", page: 10 },
    { label: "Eating Out & Social Events Guide", page: 11 },
    { label: "Grocery Planning & Substitutions", page: 12 },
  ];

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach(obj => {
    const leftDiv = document.createElement("div");
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    leftDiv.textContent = obj.label;

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    rightDiv.textContent = obj.page;

    navGrid.appendChild(leftDiv);
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function fillNutritionIntroPage() {
  const pageDiv = document.getElementById("pdf4NutritionIntroPage");
  if (!pageDiv) return;

  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Introduction</h2>
    <div class="video-placeholder"><p>Nutrition Video Placeholder</p></div>
<p class="introduction-text">
  <strong>Welcome to Your 4-Week Nutrition Plan!</strong><br><br>
  Nutrition is the foundation of your fitness journey. While training builds strength, the right foods fuel recovery, enhance performance, and support long-term progress. This guide provides the essential tools to help you make informed choices and stay on track.<br><br>

  <b>Weekly Calorie & Macro Overview:</b> Understand your personalized calorie and macronutrient breakdowns, tailored to your fitness goals.<br>
  <b>Essential Food Guide:</b> Discover the best nutrient-dense foods to include in your diet for optimal performance and well-being.<br>
  <b>Portioning & Structuring Your Meals:</b> Easily balance your meals using simple portion guides, ensuring the right mix of nutrients for your goals.<br><br>

  In your <b>4-Week Meal Plan</b>, you'll find your full structured diet to balance macros, promote recovery, and simplify meal preparation.<br><br>

  Small, consistent improvements in your eating habits lead to long-term success. Let’s fuel your progress for the next four weeks and beyond!
</p>
  `;
}

function buildWeeklyCalorieTable() {
  const pageDiv = document.getElementById("pdf4NutritionCaloriePage");
  if (!pageDiv) return;

  pageDiv.innerHTML = "";

  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `
    <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
  `;
  pageDiv.appendChild(badgeLogo);

  const heading = document.createElement("h2");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "Weekly Calorie & Macro Overview";
  pageDiv.appendChild(heading);

  const subtext = document.createElement("p");
  subtext.style.textAlign = "center";
  subtext.style.margin = "0 0 1rem 0";
  subtext.style.fontSize = "1rem";
  subtext.textContent = "Stay on track with a structured breakdown of your daily nutritional needs.";
  pageDiv.appendChild(subtext);

  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper";

  const table = document.createElement("table");
  table.className = "session-table modern-table";
  table.id = "wcmoTable";

  // Build table header
  const thead = document.createElement("thead");
  const headTr = document.createElement("tr");
  ["Week","Daily Calories","Protein<br>(g)","Carbs<br>(g)","Fats<br>(g)"].forEach(h => {
    const th = document.createElement("th");
    th.innerHTML = h;
    headTr.appendChild(th);
  });
  thead.appendChild(headTr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  // -------------------------------------------------------------
  // 1) Grab userGoal, userEffort, maintenance from localStorage
  // -------------------------------------------------------------
  const userGoal = (localStorage.getItem("goal") || "").toLowerCase();
  const userEffort = (localStorage.getItem("effortLevel") || "moderate").toLowerCase();
  const baseMaint = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);

  // Minimum cals clamp if you like:
  const userGender = (localStorage.getItem("gender") || "male").toLowerCase();
  let minCals = (userGender === "male") ? 1500 : 1200;

  // Some basic multipliers for the 4-week partial fraction approach
  // You can tweak these to your preference
  const WEIGHT_LOSS_MAP = {
    // e.g. a single base percentage for 4-week plan
    //   userEffort=low => -10%, medium => -15%, high => -20%
    low: -0.10,
    medium: -0.15,
    high: -0.20
  };

  const MUSCLE_GAIN_MAP = {
    // e.g. userEffort=low => +12%, medium => +14%, high => +17%
    low: 0.12,
    medium: 0.14,
    high: 0.17
  };

  const IMPROVE_MAP = {
    // For "improve," you have 2 deficits & 1 surplus each cycle
    // We just store one "deficit" pct & one "surplus" pct
    //   userEffort=low => deficit ~ -0.09, surplus ~ +0.11, etc.
    low:    { deficit: -0.09, surplus: 0.11 },
    medium: { deficit: -0.10, surplus: 0.13 },
    high:   { deficit: -0.11, surplus: 0.15 }
  };

  // -------------------------------------------------------------
  // 2) Helper: getCalsForWeek4(weekIndex:1..4)
  // -------------------------------------------------------------
  function getCalsForWeek4(w) {
    // If w=4 => maintenance => baseMaint
    if (w === 4) return baseMaint;

    // Weight Loss => weeks 1..3 => deficit partial fraction
    if (userGoal.includes("lose")) {
      // pick the base deficit
      const basePct = WEIGHT_LOSS_MAP[userEffort] || WEIGHT_LOSS_MAP.medium;
      // partial fraction approach
      let fraction = 1.0;  // default for week3
      if (w === 1) fraction = 0.50; 
      if (w === 2) fraction = 0.75;
      // final
      let cals = baseMaint * (1 + basePct * fraction);
      return Math.max(Math.round(cals), minCals);
    }

    // Muscle Gain => weeks 1..3 => surplus partial fraction
    if (userGoal.includes("gain")) {
      const basePct = MUSCLE_GAIN_MAP[userEffort] || MUSCLE_GAIN_MAP.medium;
      let fraction = 1.0;
      if (w === 1) fraction = 0.50;
      if (w === 2) fraction = 0.75;
      let cals = baseMaint * (1 + basePct * fraction);
      return Math.max(Math.round(cals), minCals);
    }

    // Improve => W1=deficit(75%), W2=deficit(100%), W3=surplus(100%), W4=maint
    if (userGoal.includes("improve")) {
      const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
      if (w === 1) {
        // deficit @ 75%
        let cals = baseMaint * (1 + obj.deficit * 0.75);
        return Math.max(Math.round(cals), minCals);
      }
      if (w === 2) {
        // deficit @ 100%
        let cals = baseMaint * (1 + obj.deficit);
        return Math.max(Math.round(cals), minCals);
      }
      if (w === 3) {
        // surplus @ 100%
        let cals = baseMaint * (1 + obj.surplus);
        return Math.max(Math.round(cals), minCals);
      }
      // w=4 => maintenance
      return baseMaint;
    }

    // Fallback => maintenance
    return baseMaint;
  }

  // -------------------------------------------------------------
  // 3) Build 12 rows, but weeks 1..4 => partial fraction logic
  //    weeks 5..12 => locked
  // -------------------------------------------------------------
  for (let w = 1; w <= 12; w++) {
    let dailyCals;
    if (w <= 4) {
      // partial fraction logic for the 4-week approach
      dailyCals = getCalsForWeek4(w);
    } else {
      // anything beyond 4 => just pick some default or placeholder
      // (We’ll lock them anyway.)
      dailyCals = 1800; 
    }

    // Basic 30/40/30 macro split
    const p = Math.round((0.3 * dailyCals) / 4);
    const c = Math.round((0.4 * dailyCals) / 4);
    const f = Math.round((0.3 * dailyCals) / 9);

    localStorage.setItem(`week${w}_dailyCalsWMCO`, String(dailyCals));
    localStorage.setItem(`week${w}_proteinWMCO`,  String(p));
    localStorage.setItem(`week${w}_carbsWMCO`,    String(c));
    localStorage.setItem(`week${w}_fatsWMCO`,     String(f));

    // Build the row
    const row = document.createElement("tr");

    const tdW = document.createElement("td");
    tdW.textContent = w;
    row.appendChild(tdW);

    const tdCals = document.createElement("td");
    tdCals.textContent = dailyCals + " kcals";
    row.appendChild(tdCals);

    const tdP = document.createElement("td");
    tdP.textContent = p + " g";
    row.appendChild(tdP);

    const tdCarbs = document.createElement("td");
    tdCarbs.textContent = c + " g";
    row.appendChild(tdCarbs);

    const tdF = document.createElement("td");
    tdF.textContent = f + " g";
    row.appendChild(tdF);

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);

  // Lock rows 5..12 as before
  lockRowsFor4Week(table);

  // Footer
  const foot = createMainFooter(0, 0);
  pageDiv.appendChild(foot);
}


/**
 * Same lock function as you had, to lock Weeks 5–12:
 */
function lockRowsFor4Week(table) {
  const rows = table.querySelectorAll("tbody tr");
  if (rows.length < 12) return;

  rows.forEach((tr, idx) => {
    // idx = 0..11 => so row #5..12 => idx=4..11 => locked
    if (idx < 4) return; // weeks 1-4 => unlocked

    if (idx === 8) {
      // banner row at week9
      tr.classList.add("locked-banner-row");
      const tds = [...tr.children];
      if (tds.length >= 5) {
        tds[0].setAttribute("colspan", "5");
        tds[0].innerHTML = `
          <i class="fa fa-lock"></i>
          Unlock your full calorie & macro breakdown for the next 12 weeks!
        `;
        for (let i = tds.length - 1; i >= 1; i--) {
          tr.removeChild(tds[i]);
        }
      }
    } else {
      // locked row => show locks from col2-col5
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

function lockRowsFor4Week(table) {
  const rows = table.querySelectorAll("tbody tr");
  if (rows.length < 12) return;

  rows.forEach((tr, idx) => {
    if (idx < 4) return; // weeks 1-4 => unlocked

    if (idx === 8) {
      // banner row
      tr.classList.add("locked-banner-row");
      const tds = [...tr.children];
      if (tds.length >= 5) {
        tds[0].setAttribute("colspan", "5");
        tds[0].innerHTML = `
          <i class="fa fa-lock"></i>
          Unlock your full calorie & macro breakdown for the next 12 weeks!
        `;
        for (let i = tds.length - 1; i >= 1; i--) {
          tr.removeChild(tds[i]);
        }
      }
    } else {
      // locked row => show locks from col2-col5
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

function createFoodGuidePage() {
  const pageDiv = document.getElementById("pdf4EssentialFoodGuidePage");
  if (!pageDiv) return;
  pageDiv.innerHTML = "";

  // Header logo
  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `
    <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
  `;
  pageDiv.appendChild(badgeLogo);

  // Heading
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

  // Table wrapper
  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper efg-table";

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
  foods.forEach((f) => {
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

    // col4 => fats
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

  // Fully unlocked for 4-week => no locked rows needed
  const foot = createMainFooter(0, 0);
  pageDiv.appendChild(foot);
}

function lockContent() {
  // For each .content-container on the page (one per page)...
  const containers = document.querySelectorAll('.content-container');
  containers.forEach(container => {
    // 1) Lock bullet points except the first one in this container
    const bulletPoints = container.querySelectorAll('li');
    bulletPoints.forEach((li, index) => {
      if (index > 0) {
        li.innerHTML = `
          <span class="locked-content">
            <i class="fa fa-lock"></i> Locked
          </span>
        `;
      }
    });
  });

  // 2) If any .pro-tip elements exist, remove them entirely
  const proTips = document.querySelectorAll('.pro-tip');
  proTips.forEach(pt => pt.remove());

  // 3) Lock the Final Tip box: replace with locked message & styling
  const finalTips = document.querySelectorAll('.final-tip');
  finalTips.forEach(ft => {
    ft.innerHTML = `
      <p>
        <i class="fa fa-lock"></i>
        Unlock the Full Guide in the 12-Week Program!
      </p>
    `;
    ft.classList.add('locked');
  });
}


function fill12MealPrepTimePage() {
  const pg = document.getElementById("pdf12MealPrepTimePage");
  if (!pg) return;
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
    </div>

    <!-- Title Section -->
    <h2 class="page-heading">🍽️ Meal Prep & Time-Saving Guide</h2>
    <p class="page-subheading">
      Save time, stay on track, and make healthy eating effortless.
    </p>

    <!-- Content Wrapper with Background Color -->
    <div class="content-container">
      
      <!-- Meal Prep Strategy (keep emoji) -->
      <div class="info-box">
        <h3>📌 The 3-Step Meal Prep Strategy</h3>
        <p>Effortless meal prep in three simple steps.</p>
        <ul>
          <li><strong>Plan:</strong> Choose 2-3 staple meals per category.</li>
          <li><strong>Prep:</strong> Batch-cook proteins, carbs, veggies at the start of the week.</li>
          <li><strong>Portion:</strong> Store meals in ready-to-eat containers.</li>
        </ul>
      </div>

      <!-- Second subheading: lock icon -->
      <div class="info-box alt-background">
        <h3><i class="fa fa-lock"></i> Time-Saving Hacks for Meal Prep</h3>
        <ul>
          <li>🍲 Cook Once, Eat Twice</li>
          <li>🔥 Use a Slow Cooker or Instant Pot</li>
          <li>🔪 Pre-Chop Veggies & Proteins</li>
          <li>🥩 Choose Quick & Easy Proteins</li>
          <li>📦 Invest in Meal Prep Containers</li>
        </ul>
      </div>

      <!-- Third subheading: lock icon -->
      <div class="info-box">
        <h3><i class="fa fa-lock"></i> Smart Grocery Shopping Strategy</h3>
        <ul>
          <li>📋 Create a Master Grocery List</li>
          <li>🛍️ Shop Once Per Week</li>
          <li>📌 Organize Your List by Aisle</li>
          <li>❄️ Buy Frozen & Canned Options</li>
          <li>🚚 Use Delivery or Pickup Services</li>
        </ul>
      </div>

      <!-- Final Tip -->
      <div class="final-tip">
        <h3>🚀 Final Tip: Start Small & Stay Consistent!</h3>
      </div>
      
    </div>
  `;
  // Apply locks
  lockContent();
}

function fill12LongTermSuccessPage() {
  const pg = document.getElementById("pdf12LongTermSuccessPage");
  if (!pg) return;
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
    </div>

    <!-- Title Section -->
    <h2 class="page-heading">🏆 How to Eat for Long-Term Success</h2>
    <p class="page-subheading">Build habits, not restrictions.</p>

    <!-- Content Wrapper with Background Color -->
    <div class="content-container">

      <!-- First subheading: keep emoji -->
      <div class="info-box">
        <h3>🌱 The Key to Success: Sustainability</h3>
        <ul>
          <li>🚫 Avoid extreme restrictions—enjoy the foods you love.</li>
          <li>⚖️ Follow the 80/20 rule—80% whole foods, 20% flexibility.</li>
        </ul>
      </div>

      <!-- Second subheading: lock icon -->
      <div class="info-box alt-background">
        <h3><i class="fa fa-lock"></i> Stop "Dieting"—Think Long-Term</h3>
        <ul>
          <li>🔄 Ditch yo-yo dieting—drastic changes don’t last.</li>
          <li>🍽️ Eat mindfully—listen to hunger & fullness.</li>
          <li>📝 Plan ahead for success.</li>
        </ul>
      </div>

      <!-- Third subheading: lock icon -->
      <div class="info-box">
        <h3><i class="fa fa-lock"></i> Simple Eating Framework</h3>
        <ul>
          <li>🥩 Build balanced meals—protein, carbs, fats, fiber.</li>
          <li>💧 Stay hydrated—water fuels energy & digestion.</li>
        </ul>
      </div>

      <!-- Fourth subheading: lock icon -->
      <div class="info-box alt-background">
        <h3><i class="fa fa-lock"></i> Action Plan: Maintain Progress</h3>
        <ul>
          <li>📊 Adjust portions as goals change.</li>
          <li>🥘 Keep meal prep simple & enjoyable.</li>
        </ul>
      </div>

      <!-- Final Tip -->
      <div class="final-tip">
        <h3>🏆 Final Tip: Think Long-Term!</h3>
      </div>

    </div>
  `;
  lockContent();
}


function fill12EatingOutSocialPage() {
  const pg = document.getElementById("pdf12EatingOutSocialPage");
  if (!pg) return;
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
    </div>

    <!-- Title Section -->
    <h2 class="page-heading">🍽️ Eating Out & Social Events Guide</h2>
    <p class="page-subheading">Enjoy social life without derailing progress.</p>

    <!-- Content Wrapper with Background Color -->
    <div class="content-container">

      <!-- First subheading: keep emoji -->
      <div class="info-box">
        <h3>🛑 Plan, Don’t Panic</h3>
        <ul>
          <li>😌 One meal won’t ruin progress—relax & enjoy.</li>
          <li>📋 Check the menu & plan ahead.</li>
          <li>🍏 Have a light snack before heading out.</li>
        </ul>
      </div>

      <!-- Second subheading: lock icon -->
      <div class="info-box alt-background">
        <h3><i class="fa fa-lock"></i> Smart Ordering</h3>
        <ul>
          <li>🍗 Choose lean protein—chicken, fish, tofu.</li>
          <li>🥦 Add veggies for fiber & balance.</li>
          <li>🚰 Stick to water or low-calorie drinks.</li>
        </ul>
      </div>

      <!-- Third subheading: lock icon -->
      <div class="info-box">
        <h3><i class="fa fa-lock"></i> Social Events & Buffets</h3>
        <ul>
          <li>🍽️ Use a smaller plate & start with protein.</li>
        </ul>
      </div>

      <!-- Fourth subheading: lock icon -->
      <div class="info-box alt-background">
        <h3><i class="fa fa-lock"></i> After a Big Meal</h3>
        <ul>
          <li>🔄 Get back on track next meal.</li>
          <li>💧 Stay hydrated—water aids digestion.</li>
        </ul>
      </div>

      <!-- Final Tip -->
      <div class="final-tip">
        <h3>⚖️ Final Tip: Balance, Not Perfection!</h3>
      </div>

    </div>
  `;
  lockContent();
}

function createGrocerySubstitutionsPages() {
  // Page 1 data – Protein Sources
  const proteinData = [
    { main: "Chicken Breast", alt: "Turkey, Lean Beef, Tofu, Seitan" },
    { main: "Ground Beef", alt: "Ground Turkey, Chicken, Lentils" },
    { main: "Salmon", alt: "Tuna, White Fish, Tempeh" },
    { main: "Eggs", alt: "Egg Whites, Chia Seeds, Silken Tofu" },
    { main: "Greek Yogurt", alt: "Cottage Cheese, Skyr, Plant-Based Yogurt" },
    { main: "Milk (Dairy)", alt: "Almond Milk, Oat Milk, Soy Milk" },
    { main: "Cheese", alt: "Nutritional Yeast, Vegan Cheese, Cottage Cheese" },
    { main: "Whey Protein", alt: "Plant-Based Protein, Collagen Powder" },
    { main: "Tofu", alt: "Tempeh, Seitan, Chickpeas" },
    { main: "Lentils", alt: "Black Beans, Kidney Beans, Chickpeas" },
    // New ingredients:
    { main: "Duck", alt: "Chicken, Turkey, Lean Beef" },
    { main: "Pork (Lean)", alt: "Chicken, Turkey, Tempeh" },
  ];

  // Page 2 data – Carb & Grain Substitutes
  const carbData = [
    { main: "Rice", alt: "Quinoa, Cauliflower Rice, Whole Wheat Couscous" },
    { main: "Pasta", alt: "Whole Wheat Pasta, Zucchini Noodles, Chickpea Pasta" },
    { main: "Bread", alt: "Whole Wheat Bread, Sourdough, Rye Bread" },
    { main: "Oats", alt: "Quinoa Flakes, Chia Pudding, Buckwheat" },
    { main: "Potatoes", alt: "Sweet Potatoes, Butternut Squash, Parsnips" },
    { main: "Cereal", alt: "Granola, Overnight Oats, Chia Pudding" },
    { main: "Crackers", alt: "Whole Wheat Crackers, Rice Cakes, Corn Cakes" },
    { main: "Flour (Wheat)", alt: "Almond Flour, Coconut Flour, Oat Flour" },
    { main: "Tortilla Wraps", alt: "Whole Wheat Wraps, Lettuce Wraps, Corn Tortillas" },
    { main: "White Sugar", alt: "Honey, Maple Syrup, Coconut Sugar" },
    // New ingredients:
    { main: "Couscous", alt: "Quinoa, Brown Rice, Bulgur" },
    { main: "Corn Tortilla", alt: "Whole Wheat Tortilla, Lettuce Wraps, Almond Flour Wraps" },
  ];

  // Page 3 data – Fats & Cooking Substitutes
  const fatsData = [
    { main: "Butter", alt: "Coconut Oil, Olive Oil, Avocado" },
    { main: "Cooking Oil", alt: "Olive Oil, Avocado Oil, Ghee" },
    { main: "Mayonnaise", alt: "Greek Yogurt, Mashed Avocado, Hummus" },
    { main: "Peanut Butter", alt: "Almond Butter, Sunflower Seed Butter, Cashew Butter" },
    { main: "Cream (Dairy)", alt: "Coconut Cream, Greek Yogurt, Cashew Cream" },
    { main: "Avocado", alt: "Hummus, Guacamole, Cottage Cheese" },
    { main: "Nuts", alt: "Seeds (Sunflower, Pumpkin), Nut-Free Granola" },
    { main: "Coconut Milk", alt: "Almond Milk, Oat Milk, Cashew Milk" },
    { main: "Chocolate", alt: "Cacao Nibs, Dark Chocolate, Carob Powder" },
    { main: "Ice Cream", alt: "Frozen Yogurt, Banana Ice Cream, Coconut Ice Cream" },
    // New ingredients:
    { main: "Sour Cream", alt: "Greek Yogurt, Cottage Cheese, Cashew Cream" },
    { main: "Shortening", alt: "Butter, Coconut Oil, Applesauce (for baking)" },
  ];

  buildSubTablePage("pdf4GroceryPage1", "Protein Sources", proteinData);
  buildSubTablePage("pdf4GroceryPage2", "Carb & Grain Substitutes", carbData);
  buildSubTablePage("pdf4GroceryPage3", "Fats & Cooking Substitutes", fatsData);
}

function buildSubTablePage(pageId, subheading, dataRows) {
  const pg = document.getElementById(pageId);
  if (!pg) return;

  // Set up the header with logo and main heading.
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">${subheading}</h2>
  `;

  // Add subtext based on the subheading.
  let subtext = "";
  if (subheading === "Protein Sources") {
    subtext = "Your 4-Week meal plan is structured, but this guide is always here if you want variety. Swap these protein sources while maintaining balanced nutrition.";
  } else if (subheading === "Carb & Grain Substitutes") {
    subtext = "Your 4-Week meal plan is structured, but this guide is always here if you want variety. Swap these carb sources while maintaining balanced nutrition.";
  } else if (subheading === "Fats & Cooking Substitutes") {
    subtext = "Your 4-Week meal plan is structured, but this guide is always here if you want variety. Swap these fat sources while maintaining balanced nutrition.";
  }
  if (subtext) {
    pg.innerHTML += `<p class="subtext">${subtext}</p>`;
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper grocery-sub-table";

  const table = document.createElement("table");
  table.className = "session-table modern-table grocery-sub-table";

  // Create the table header.
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  const th1 = document.createElement("th");
  th1.textContent = "Main Ingredient";
  const th2 = document.createElement("th");
  th2.textContent = "Alternative Ingredients";
  thr.appendChild(th1);
  thr.appendChild(th2);
  thead.appendChild(thr);
  table.appendChild(thead);

  // Build the table body from the provided data.
  const tbody = document.createElement("tbody");
  dataRows.forEach(item => {
    const tr = document.createElement("tr");
    const tdMain = document.createElement("td");
    tdMain.textContent = item.main;
    const tdAlt = document.createElement("td");
    tdAlt.textContent = item.alt;
    tr.appendChild(tdMain);
    tr.appendChild(tdAlt);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pg.appendChild(tableWrap);
}

const mealDatabase = [
  {
    "mealName": "Protein Pancakes & Strawberries",
    "calories": 420,
    "macroRatio": {
      "protein": 0.30, 
      "carbs": 0.48,  
      "fats": 0.22     
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      {
        "name": "whey protein",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "oats",
        "quantity": 40,
        "unit": "g"
      },
      {
        "name": "egg",
        "quantity": 1,
        "singular": "egg",
        "plural": "eggs",
        "wholeItem": true
      },
      {
        "name": "strawberries",
        "quantity": 80,
        "unit": "g"
      }
    ],
    "recipe": [
      "Blend oats, egg, and protein powder.",
      "Cook small pancakes, top with berries."
    ],
    "mealNotes": [
      "For fluffier pancakes, let the batter rest for 5 minutes before cooking!"
    ]
  },
  {
    "mealName": "Avocado Toast with Eggs & Bacon",
    "calories": 600,
    "macroRatio": {
      "protein": 0.211,
      "carbs": 0.282,
      "fats": 0.507
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Eggs", "Gluten"],
    "ingredients": [
      {
        "name": "whole grain bread",
        "quantity": 2,
        "singular": "slice",
        "plural": "slices",
        "wholeItem": true
      },
      {
        "name": "avocado",
        "quantity": 75,
        "unit": "g"
      },
      {
        "name": "egg",
        "quantity": 2,
        "singular": "egg",
        "plural": "eggs",
        "wholeItem": true
      },
      {
        "name": "bacon",
        "quantity": 30,
        "unit": "g"
      }
    ],
    "recipe": [
      "Toast bread and fry bacon, eggs.",
      "Mash avocado and spread on toast."
    ],
    "mealNotes": [
      "Add red pepper flakes for extra spice!"
    ]
  },
  {
    "mealName": "Banana Nut Oatmeal",
    "calories": 550,
    "macroRatio": {
      "protein": 0.14,
      "carbs": 0.545,
      "fats": 0.315
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Nuts"],
    "ingredients": [
      {
        "name": "rolled oats",
        "quantity": 80,
        "unit": "g"
      },
      {
        "name": "banana",
        "quantity": 1,
        "singular": "banana",
        "plural": "bananas",
        "wholeItem": true
      },
      {
        "name": "peanut butter",
        "quantity": 16,
        "unit": "g"
      },
      {
        "name": "walnuts",
        "quantity": 30,
        "unit": "g"
      }
    ],
    "recipe": [
      "Cook oats with water, stir in banana and peanut butter.",
      "Top with walnuts."
    ],
    "mealNotes": [
      "For creamier oats, use milk instead of water."
    ]
  },
  {
    "mealName": "Blueberry Protein Smoothie",
    "calories": 310,
    "macroRatio": {
      "protein": 0.301,
      "carbs": 0.482,
      "fats": 0.217
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "whey protein",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "blueberries",
        "quantity": 75,
        "unit": "g"
      },
      {
        "name": "almond milk",
        "quantity": 240,
        "unit": "ml"
      },
      {
        "name": "honey",
        "quantity": 7,
        "unit": "g"
      }
    ],
    "recipe": [
      "Blend all until smooth."
    ],
    "mealNotes": []
  },
{
"mealName": "Whole Wheat Waffles & Yogurt",
"calories": 450,
"macroRatio": {
  "protein": 0.248,
  "carbs": 0.513,
  "fats": 0.239
},
"category": "Breakfast",
"dietaryPhase": ["surplusPhase", "deloadPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["No Restrictions"],
"allergens": ["Dairy"],
"ingredients": [
  {
    "name": "whole wheat waffle",
    "quantity": 1,
    "singular": "waffle",
    "plural": "waffles",
    "wholeItem": true
  },
  {
    "name": "Greek yogurt",
    "quantity": 100,
    "unit": "g"
  },
  {
    "name": "honey",
    "quantity": 7,
    "unit": "g"
  },
  {
    "name": "mixed berries",
    "quantity": 60,
    "unit": "g"
  }
],
"recipe": [
  "Toast waffle.",
  "Top with yogurt, honey, and berries."
],
"mealNotes": []
},
{
"mealName": "Veggie Omelet & Cheese",
"calories": 390,
"macroRatio": {
  "protein": 0.317,
  "carbs": 0.159,
  "fats": 0.524
},
"category": "Breakfast",
"dietaryPhase": ["deficitPhase", "deloadPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["No Restrictions"],
"allergens": ["Dairy"],
"ingredients": [
  {
    "name": "egg",
    "quantity": 2,
    "singular": "egg",
    "plural": "eggs",
    "wholeItem": true
  },
  {
    "name": "mixed veggies",
    "quantity": 70,
    "unit": "g"
  },
  {
    "name": "cheese",
    "quantity": 30,
    "unit": "g"
  },
  {
    "name": "salt, pepper",
    "quantity": 1,
    "unit": "dash"
  }
],
"recipe": [
  "Whisk eggs, add veggies.",
  "Cook in pan, top with cheese."
],
"mealNotes": []
},
{
  "mealName": "Banana Oatmeal & Peanut Butter",
  "calories": 440,
  "macroRatio": {
    "protein": 0.176,
    "carbs": 0.527,
    "fats": 0.297
  },
  "category": "Breakfast",
  "dietaryPhase": ["surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Nuts"],
  "ingredients": [
    {
      "name": "oats",
      "quantity": 40,
      "unit": "g"
    },
    {
      "name": "banana",
      "quantity": 1,
      "singular": "banana",
      "plural": "bananas",
      "wholeItem": true
    },
    {
      "name": "peanut butter",
      "quantity": 16,
      "unit": "g"
    },
    {
      "name": "milk",
      "quantity": 240,
      "unit": "ml"
    }
  ],
  "recipe": [
    "Cook oats with milk.",
    "Stir in peanut butter, top with banana."
  ],
  "mealNotes": []
},
{
  "mealName": "Turkey Bacon & Egg Wrap",
  "calories": 400,
  "macroRatio": {
    "protein": 0.304,
    "carbs": 0.354,
    "fats": 0.342
  },
  "category": "Breakfast",
  "dietaryPhase": ["deficitPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    {
      "name": "tortilla",
      "quantity": 1,
      "singular": "tortilla",
      "plural": "tortillas",
      "wholeItem": true
    },
    {
      "name": "turkey bacon",
      "quantity": 30,
      "unit": "g"
    },
    {
      "name": "egg",
      "quantity": 1,
      "singular": "egg",
      "plural": "eggs",
      "wholeItem": true
    },
    {
      "name": "salt, pepper",
      "quantity": 1,
      "unit": "g"
    }
  ],
  "recipe": [
    "Cook bacon and egg.",
    "Wrap in tortilla and serve."
  ],
  "mealNotes": []
},
{
  "mealName": "Greek Yogurt Parfait with Granola",
  "calories": 370,
  "macroRatio": {
    "protein": 0.27,
    "carbs": 0.486,
    "fats": 0.244
  },
  "category": "Breakfast",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Dairy"],
  "ingredients": [
    {
      "name": "Greek yogurt",
      "quantity": 150,
      "unit": "g"
    },
    {
      "name": "granola",
      "quantity": 30,
      "unit": "g"
    },
    {
      "name": "mixed berries",
      "quantity": 50,
      "unit": "g"
    },
    {
      "name": "honey",
      "quantity": 7,
      "unit": "g"
    }
  ],
  "recipe": [
    "Layer yogurt, berries, and granola.",
    "Drizzle with honey."
  ],
  "mealNotes": []
},
{
  "mealName": "Egg White Spinach Wrap",
  "calories": 340,
  "macroRatio": {
    "protein": 0.303,
    "carbs": 0.424,
    "fats": 0.273
  },
  "category": "Breakfast",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    {
      "name": "egg white",
      "quantity": 3,
      "singular": "egg white",
      "plural": "egg whites",
      "wholeItem": true
    },
    {
      "name": "spinach",
      "quantity": 20,
      "unit": "g"
    },
    {
      "name": "tortilla",
      "quantity": 1,
      "singular": "tortilla",
      "plural": "tortillas",
      "wholeItem": true
    },
    {
      "name": "salt, pepper",
      "quantity": 1,
      "unit": "g"
    }
  ],
  "recipe": [
    "Cook egg whites with spinach.",
    "Wrap in tortilla."
  ],
  "mealNotes": []
},
  {
    "mealName": "Turkey Omelet",
    "calories": 380,
    "macroRatio": {
      "protein": 0.353,
      "carbs": 0.118,
      "fats": 0.529
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      {
        "name": "egg",
        "quantity": 2,
        "singular": "egg",
        "plural": "eggs",
        "wholeItem": true
      },
      {
        "name": "turkey slices",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "cheese",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "salt, pepper",
        "quantity": 1,
        "unit": "g"
      }
    ],
    "recipe": [
      "Whisk eggs, add turkey/cheese.",
      "Cook in pan."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Protein French Toast",
    "calories": 450,
    "macroRatio": {
      "protein": 0.255,
      "carbs": 0.50,
      "fats": 0.245
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      {
        "name": "wheat bread",
        "quantity": 2,
        "singular": "slice",
        "plural": "slices",
        "wholeItem": true
      },
      {
        "name": "protein powder",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "egg",
        "quantity": 1,
        "singular": "egg",
        "plural": "eggs",
        "wholeItem": true
      },
      {
        "name": "milk",
        "quantity": 120,
        "unit": "ml"
      }
    ],
    "recipe": [
      "Mix egg, milk, protein powder.",
      "Dip bread & pan-fry."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Breakfast Tacos",
    "calories": 430,
    "macroRatio": {
      "protein": 0.269,
      "carbs": 0.385,
      "fats": 0.346
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "tortilla",
        "quantity": 2,
        "singular": "tortilla",
        "plural": "tortillas",
        "wholeItem": true
      },
      {
        "name": "egg",
        "quantity": 2,
        "singular": "egg",
        "plural": "eggs",
        "wholeItem": true
      },
      {
        "name": "salsa",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "peppers",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "cheese (optional)",
        "quantity": 15,
        "unit": "g"
      }
    ],
    "recipe": [
      "Scramble eggs, fill tortillas w/ eggs, peppers, salsa."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Spinach & Turkey Bacon Omelet",
    "calories": 380,
    "macroRatio": {
      "protein": 0.337,
      "carbs": 0.12,
      "fats": 0.543
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "egg",
        "quantity": 2,
        "singular": "egg",
        "plural": "eggs",
        "wholeItem": true
      },
      {
        "name": "turkey bacon",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "spinach",
        "quantity": 20,
        "unit": "g"
      },
      {
        "name": "salt, pepper",
        "quantity": 1,
        "unit": "g"
      }
    ],
    "recipe": [
      "Cook bacon, set aside.",
      "Whisk eggs w/ spinach, fold in bacon."
    ],
    "mealNotes": []
  },
    {
      "mealName": "Ham & Egg Cup",
      "calories": 260,
      "macroRatio": {
        "protein": 0.336,
        "carbs": 0.046,
        "fats": 0.618
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "ham",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "egg",
          "quantity": 1,
          "singular": "egg",
          "plural": "eggs",
          "wholeItem": true
        },
        {
          "name": "seasoning",
          "quantity": 1,
          "unit": "g"
        }
      ],
      "recipe": [
        "Line muffin tin w/ ham.",
        "Crack egg, bake 15 min."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Pumpkin Spice Oatmeal",
      "calories": 390,
      "macroRatio": {
        "protein": 0.145,
        "carbs": 0.622,
        "fats": 0.233
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "oats",
          "quantity": 40,
          "unit": "g"
        },
        {
          "name": "pumpkin puree",
          "quantity": 60,
          "unit": "g"
        },
        {
          "name": "pumpkin spice",
          "quantity": 1,
          "unit": "g"
        },
        {
          "name": "water",
          "quantity": 240,
          "unit": "ml"
        }
      ],
      "recipe": [
        "Cook oats w/ puree & spice.",
        "Serve warm."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Egg & Cheese Muffin Sandwich",
      "calories": 410,
      "macroRatio": {
        "protein": 0.253,
        "carbs": 0.405,
        "fats": 0.342
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "English muffin",
          "quantity": 1,
          "singular": "muffin",
          "plural": "muffins",
          "wholeItem": true
        },
        {
          "name": "egg",
          "quantity": 1,
          "singular": "egg",
          "plural": "eggs",
          "wholeItem": true
        },
        {
          "name": "cheese",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "salt, pepper",
          "quantity": 1,
          "unit": "g"
        }
      ],
      "recipe": [
        "Cook egg, place on muffin w/ cheese."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Whole Wheat Bagel w/ Lox",
      "calories": 450,
      "macroRatio": {
        "protein": 0.23,
        "carbs": 0.46,
        "fats": 0.31
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Fish"],
      "ingredients": [
        {
          "name": "wheat bagel",
          "quantity": 1,
          "singular": "bagel",
          "plural": "bagels",
          "wholeItem": true
        },
        {
          "name": "smoked salmon",
          "quantity": 50,
          "unit": "g"
        },
        {
          "name": "cream cheese (optional)",
          "quantity": 15,
          "unit": "g"
        },
        {
          "name": "capers",
          "quantity": 5,
          "unit": "g"
        }
      ],
      "recipe": [
        "Toast bagel, layer salmon & cream cheese."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Peanut Butter Banana Wrap",
      "calories": 400,
      "macroRatio": {
        "protein": 0.14,
        "carbs": 0.50,
        "fats": 0.36
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Nuts"],
      "ingredients": [
        {
          "name": "tortilla",
          "quantity": 1,
          "singular": "tortilla",
          "plural": "tortillas",
          "wholeItem": true
        },
        {
          "name": "peanut butter",
          "quantity": 16,
          "unit": "g"
        },
        {
          "name": "banana",
          "quantity": 1,
          "singular": "banana",
          "plural": "bananas",
          "wholeItem": true
        },
        {
          "name": "honey",
          "quantity": 5,
          "unit": "g"
        }
      ],
      "recipe": [
        "Spread PB, add banana, drizzle honey.",
        "Roll up."
      ],
      "mealNotes": []
    },  

// --------------------
// (B) 10 LUNCHES
// --------------------
  {
    "mealName": "Chicken Caesar Wrap",
    "calories": 520,
    "macroRatio": {
      "protein": 0.28,
      "carbs": 0.36,
      "fats": 0.36
    },
    "category": "Lunch",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      {
        "name": "chicken",
        "quantity": 150,
        "unit": "g"
      },
      {
        "name": "tortilla",
        "quantity": 1,
        "singular": "tortilla",
        "plural": "tortillas",
        "wholeItem": true
      },
      {
        "name": "lettuce",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "Caesar dressing",
        "quantity": 20,
        "unit": "g"
      },
      {
        "name": "Parmesan cheese",
        "quantity": 15,
        "unit": "g"
      }
    ],
    "recipe": [
      "Cook chicken, slice.",
      "Wrap w/ lettuce, dressing, cheese."
    ],
    "mealNotes": ["A classic wrap, full of flavor!"]
  },
  {
    "mealName": "Mediterranean Chicken Bowl",
    "calories": 675,
    "macroRatio": {
      "protein": 0.22,
      "carbs": 0.43,
      "fats": 0.35
    },
    "category": "Lunch",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["None"],
    "ingredients": [
      {
        "name": "chicken",
        "quantity": 113,
        "unit": "g"
      },
      {
        "name": "cooked quinoa",
        "quantity": 185,
        "unit": "g"
      },
      {
        "name": "avocado",
        "quantity": 75,
        "unit": "g"
      },
      {
        "name": "mixed greens",
        "quantity": 40,
        "unit": "g"
      },
      {
        "name": "cherry tomatoes",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "cucumber",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "olive oil & lemon dressing",
        "quantity": 20,
        "unit": "g"
      }
    ],
    "recipe": [
      "Combine chicken, quinoa, and veggies.",
      "Drizzle with dressing and toss."
    ],
    "mealNotes": ["For extra flavor, add fresh herbs."]
  },
  {
    "mealName": "Steak & Sweet Potato Bowl",
    "calories": 950,
    "macroRatio": {
      "protein": 0.20,
      "carbs": 0.40,
      "fats": 0.40
    },
    "category": "Lunch",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["None"],
    "ingredients": [
      {
        "name": "steak",
        "quantity": 170,
        "unit": "g"
      },
      {
        "name": "cooked brown rice",
        "quantity": 185,
        "unit": "g"
      },
      {
        "name": "sweet potato",
        "quantity": 130,
        "unit": "g"
      },
      {
        "name": "steamed broccoli",
        "quantity": 75,
        "unit": "g"
      },
      {
        "name": "avocado",
        "quantity": 60,
        "unit": "g"
      },
      {
        "name": "olive oil",
        "quantity": 15,
        "unit": "g"
      }
    ],
    "recipe": [
      "Layer rice, sweet potato, and broccoli.",
      "Top with steak, avocado, and olive oil."
    ],
    "mealNotes": ["Season steak well for robust flavor."]
  },
  {
    "mealName": "Spicy Chicken Wrap",
    "calories": 700,
    "macroRatio": {
      "protein": 0.24,
      "carbs": 0.33,
      "fats": 0.43
    },
    "category": "Lunch",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Gluten"],
    "ingredients": [
      {
        "name": "chicken",
        "quantity": 113,
        "unit": "g"
      },
      {
        "name": "tortilla",
        "quantity": 1,
        "singular": "tortilla",
        "plural": "tortillas",
        "wholeItem": true
      },
      {
        "name": "spicy mayo",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "lettuce",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "tomato",
        "quantity": 40,
        "unit": "g"
      }
    ],
    "recipe": [
      "Layer chicken and veggies on tortilla, drizzle mayo.",
      "Wrap tightly and serve."
    ],
    "mealNotes": ["Toast tortilla for extra crunch."]
  },
  {
    "mealName": "Steak & Quinoa Bowl",
    "calories": 750,
    "macroRatio": {
      "protein": 0.24,
      "carbs": 0.33,
      "fats": 0.43
    },
    "category": "Lunch",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "steak",
        "quantity": 113,
        "unit": "g"
      },
      {
        "name": "cooked quinoa",
        "quantity": 185,
        "unit": "g"
      },
      {
        "name": "mixed greens",
        "quantity": 40,
        "unit": "g"
      },
      {
        "name": "bell peppers",
        "quantity": 50,
        "unit": "g"
      }
    ],
    "recipe": [
      "Combine steak, quinoa, and veggies.",
      "Drizzle olive oil and toss lightly."
    ],
    "mealNotes": ["Season steak well before grilling for bold flavor."]
  },
    {
      "mealName": "Pesto Shrimp Pasta",
      "calories": 800,
      "macroRatio": {
        "protein": 0.23,
        "carbs": 0.39,
        "fats": 0.38
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Shellfish"],
      "ingredients": [
        {
          "name": "shrimp",
          "quantity": 113,
          "unit": "g"
        },
        {
          "name": "cooked pasta",
          "quantity": 200,
          "unit": "g"
        },
        {
          "name": "pesto",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "cherry tomatoes",
          "quantity": 50,
          "unit": "g"
        }
      ],
      "recipe": [
        "Sauté shrimp and mix with pasta and pesto.",
        "Add tomatoes and toss briefly."
      ],
      "mealNotes": ["Finish with Parmesan if desired."]
    },
    {
      "mealName": "Roast Beef & Swiss Sandwich",
      "calories": 550,
      "macroRatio": {
        "protein": 0.30,
        "carbs": 0.35,
        "fats": 0.35
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "wheat bread",
          "quantity": 2,
          "singular": "slice",
          "plural": "slices",
          "wholeItem": true
        },
        {
          "name": "roast beef",
          "quantity": 80,
          "unit": "g"
        },
        {
          "name": "Swiss cheese",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "mustard",
          "quantity": 10,
          "unit": "g"
        }
      ],
      "recipe": [
        "Assemble beef, cheese on bread.",
        "Spread mustard."
      ],
      "mealNotes": ["Classic and satisfying!"]
    },
    {
      "mealName": "BBQ Pulled Chicken Sandwich",
      "calories": 560,
      "macroRatio": {
        "protein": 0.29,
        "carbs": 0.44,
        "fats": 0.26
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "shredded chicken",
          "quantity": 150,
          "unit": "g"
        },
        {
          "name": "BBQ sauce",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "whole wheat bun",
          "quantity": 1,
          "singular": "bun",
          "plural": "buns",
          "wholeItem": true
        },
        {
          "name": "coleslaw (optional)",
          "quantity": 50,
          "unit": "g"
        }
      ],
      "recipe": [
        "Mix chicken w/ sauce.",
        "Serve on bun."
      ],
      "mealNotes": ["Try it toasted for extra crunch."]
    },
    {
      "mealName": "Turkey Chili Wrap",
      "calories": 580,
      "macroRatio": {
        "protein": 0.29,
        "carbs": 0.42,
        "fats": 0.28
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "turkey chili",
          "quantity": 120,
          "unit": "g"
        },
        {
          "name": "tortilla",
          "quantity": 1,
          "singular": "tortilla",
          "plural": "tortillas",
          "wholeItem": true
        },
        {
          "name": "lettuce",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "cheese (optional)",
          "quantity": 15,
          "unit": "g"
        }
      ],
      "recipe": [
        "Heat chili, spoon into tortilla.",
        "Wrap & serve."
      ],
      "mealNotes": ["Great for meal prep!"]
    },
    {
      "mealName": "Chicken & Brown Rice Bowl",
      "calories": 550,
      "macroRatio": {
        "protein": 0.30,
        "carbs": 0.45,
        "fats": 0.25
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "chicken breast",
          "quantity": 150,
          "unit": "g"
        },
        {
          "name": "brown rice",
          "quantity": 100,
          "unit": "g"
        },
        {
          "name": "mixed veggies",
          "quantity": 50,
          "unit": "g"
        },
        {
          "name": "salt, pepper",
          "quantity": 1,
          "unit": "g"
        }
      ],
      "recipe": [
        "Cook chicken, season.",
        "Serve over brown rice with veggies."
      ],
      "mealNotes": ["Balanced and nutritious."]
    },
    {
      "mealName": "Tuna Wrap & Lettuce",
      "calories": 420,
      "macroRatio": {
        "protein": 0.36,
        "carbs": 0.41,
        "fats": 0.23
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "tuna",
          "quantity": 1,
          "singular": "can",
          "plural": "cans",
          "wholeItem": true
        },
        {
          "name": "tortilla",
          "quantity": 1,
          "singular": "tortilla",
          "plural": "tortillas",
          "wholeItem": true
        },
        {
          "name": "lettuce",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "tomato",
          "quantity": 40,
          "unit": "g"
        },
        {
          "name": "mayo",
          "quantity": 10,
          "unit": "g"
        }
      ],
      "recipe": [
        "Mix tuna, mayo, veggies.",
        "Wrap in tortilla."
      ],
      "mealNotes": ["Light but filling!"]
    },
  {
    "mealName": "Turkey Burger & Sweet Potato",
    "calories": 600,
    "macroRatio": {
      "protein": 0.30,
      "carbs": 0.40,
      "fats": 0.30
    },
    "category": "Lunch",
    "dietaryPhase": ["surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "turkey burger patty",
        "quantity": 1,
        "singular": "patty",
        "plural": "patties",
        "wholeItem": true
      },
      {
        "name": "whole wheat bun",
        "quantity": 1,
        "singular": "bun",
        "plural": "buns",
        "wholeItem": true
      },
      {
        "name": "sweet potato",
        "quantity": 1,
        "singular": "sweet potato",
        "plural": "sweet potatoes",
        "wholeItem": true
      },
      {
        "name": "lettuce, ketchup",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Grill turkey burger.",
      "Serve on bun, sweet potato fries."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Salmon & Brown Rice Salad",
    "calories": 540,
    "macroRatio": {
      "protein": 0.30,
      "carbs": 0.39,
      "fats": 0.31
    },
    "category": "Lunch",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "salmon",
        "quantity": 120,
        "unit": "g"
      },
      {
        "name": "brown rice",
        "quantity": 0.5,
        "singular": "cup",
        "plural": "cups",
        "wholeItem": true
      },
      {
        "name": "mixed greens",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      },
      {
        "name": "olive oil",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Bake salmon, cook rice.",
      "Toss greens with oil, top with salmon."
    ],
    "mealNotes": []
  },
  {
    "mealName": "BBQ Chicken Quesadilla",
    "calories": 590,
    "macroRatio": {
      "protein": 0.29,
      "carbs": 0.41,
      "fats": 0.31
    },
    "category": "Lunch",
    "dietaryPhase": ["surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      {
        "name": "chicken",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "BBQ sauce",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      },
      {
        "name": "cheese",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      },
      {
        "name": "tortillas",
        "quantity": 2,
        "singular": "tortilla",
        "plural": "tortillas",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Cook chicken in BBQ sauce.",
      "Assemble cheese/chicken in tortillas."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Turkey & Avocado Sandwich",
    "calories": 450,
    "macroRatio": {
      "protein": 0.28,
      "carbs": 0.40,
      "fats": 0.32
    },
    "category": "Lunch",
    "dietaryPhase": ["deficitPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "whole wheat bread",
        "quantity": 2,
        "singular": "slice",
        "plural": "slices",
        "wholeItem": true
      },
      {
        "name": "turkey breast",
        "quantity": 3,
        "singular": "slice",
        "plural": "slices",
        "wholeItem": true
      },
      {
        "name": "avocado",
        "quantity": 0.25,
        "singular": "avocado",
        "plural": "avocados",
        "wholeItem": true
      },
      {
        "name": "lettuce, tomato",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Spread avocado on bread.",
      "Add turkey, lettuce, tomato."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Shrimp & Quinoa Bowl",
    "calories": 520,
    "macroRatio": {
      "protein": 0.27,
      "carbs": 0.47,
      "fats": 0.26
    },
    "category": "Lunch",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Shellfish"],
    "ingredients": [
      {
        "name": "shrimp",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "quinoa",
        "quantity": 0.5,
        "singular": "cup",
        "plural": "cups",
        "wholeItem": true
      },
      {
        "name": "bell peppers",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      },
      {
        "name": "garlic, oil",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Cook quinoa, sauté shrimp/peppers.",
      "Combine and season."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Chicken Pita & Hummus",
    "calories": 530,
    "macroRatio": {
      "protein": 0.31,
      "carbs": 0.45,
      "fats": 0.24
    },
    "category": "Lunch",
    "dietaryPhase": ["surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "chicken breast",
        "quantity": 150,
        "unit": "g"
      },
      {
        "name": "whole wheat pita",
        "quantity": 1,
        "singular": "pita",
        "plural": "pitas",
        "wholeItem": true
      },
      {
        "name": "hummus",
        "quantity": 2,
        "singular": "tbsp",
        "plural": "tbsps",
        "wholeItem": true
      },
      {
        "name": "lettuce",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Cook chicken, slice.",
      "Spread hummus in pita, add chicken/lettuce."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Steak & Spinach Wrap",
    "calories": 600,
    "macroRatio": {
      "protein": 0.32,
      "carbs": 0.37,
      "fats": 0.32
    },
    "category": "Lunch",
    "dietaryPhase": ["surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "steak",
        "quantity": 120,
        "unit": "g"
      },
      {
        "name": "tortilla",
        "quantity": 1,
        "singular": "tortilla",
        "plural": "tortillas",
        "wholeItem": true
      },
      {
        "name": "spinach",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      },
      {
        "name": "sauce",
        "quantity": 1,
        "singular": "tbsp",
        "plural": "tbsps",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Cook steak, slice thin.",
      "Wrap with spinach and sauce."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Ham & Cheese Whole Wheat Sandwich",
    "calories": 480,
    "macroRatio": {
      "protein": 0.31,
      "carbs": 0.39,
      "fats": 0.31
    },
    "category": "Lunch",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      {
        "name": "whole wheat bread",
        "quantity": 2,
        "singular": "slice",
        "plural": "slices",
        "wholeItem": true
      },
      {
        "name": "ham",
        "quantity": 2,
        "singular": "slice",
        "plural": "slices",
        "wholeItem": true
      },
      {
        "name": "cheese",
        "quantity": 1,
        "singular": "slice",
        "plural": "slices",
        "wholeItem": true
      },
      {
        "name": "lettuce, mustard",
        "quantity": 1,
        "singular": "portion",
        "plural": "portions",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Assemble sandwich with ham, cheese.",
      "Add lettuce, mustard to taste."
    ],
    "mealNotes": []
  },  

// --------------------
// (C) 10 DINNERS
// --------------------

{
  "mealName": "Fish Tacos",
  "calories": 610,
  "macroRatio": {
    "protein": 0.28,
    "carbs": 0.41,
    "fats": 0.31
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Fish"],
  "ingredients": [
    { "name": "white fish", "quantity": 150, "unit": "g" },
    { "name": "tortilla", "quantity": 2, "singular": "tortilla", "plural": "tortillas", "wholeItem": true },
    { "name": "cabbage slaw", "quantity": 80, "unit": "g" },
    { "name": "lime", "quantity": 1, "singular": "lime", "plural": "limes", "wholeItem": true }
  ],
  "recipe": [
    "Season & grill fish.",
    "Serve in tortillas w/ slaw."
  ]
},
{
  "mealName": "Chicken Stir-Fry & Brown Rice",
  "calories": 620,
  "macroRatio": {
    "protein": 0.29,
    "carbs": 0.44,
    "fats": 0.27
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "chicken breast", "quantity": 150, "unit": "g" },
    { "name": "brown rice", "quantity": 100, "unit": "g" },
    { "name": "mixed stir-fry veggies", "quantity": 150, "unit": "g" },
    { "name": "soy sauce", "quantity": 15, "unit": "ml" }
  ],
  "recipe": [
    "Stir-fry chicken, veggies.",
    "Serve with cooked brown rice."
  ]
},
{
  "mealName": "Beef & Broccoli Bowl",
  "calories": 650,
  "macroRatio": {
    "protein": 0.33,
    "carbs": 0.33,
    "fats": 0.34
  },
  "category": "Dinner",
  "dietaryPhase": ["surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Soy"],
  "ingredients": [
    { "name": "lean beef", "quantity": 150, "unit": "g" },
    { "name": "broccoli florets", "quantity": 150, "unit": "g" },
    { "name": "rice", "quantity": 100, "unit": "g" },
    { "name": "soy sauce", "quantity": 15, "unit": "ml" },
    { "name": "ginger", "quantity": 2, "unit": "g" }
  ],
  "recipe": [
    "Sauté beef with ginger/soy.",
    "Steam broccoli, serve over rice."
  ]
},
{
  "mealName": "Grilled Chicken & Sweet Potato",
  "calories": 580,
  "macroRatio": {
    "protein": 0.33,
    "carbs": 0.37,
    "fats": 0.30
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "chicken breast", "quantity": 150, "unit": "g" },
    { "name": "sweet potato", "quantity": 1, "singular": "sweet potato", "plural": "sweet potatoes", "wholeItem": true },
    { "name": "broccoli", "quantity": 90, "unit": "g" },
    { "name": "olive oil", "quantity": 15, "unit": "ml" }
  ],
  "recipe": [
    "Grill chicken, season.",
    "Roast sweet potato, steam broccoli."
  ]
},
{
  "mealName": "Whole Wheat Pasta & Turkey Meatballs",
  "calories": 680,
  "macroRatio": {
    "protein": 0.29,
    "carbs": 0.47,
    "fats": 0.24
  },
  "category": "Dinner",
  "dietaryPhase": ["surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Dairy"],
  "ingredients": [
    { "name": "turkey meatballs", "quantity": 100, "unit": "g" },
    { "name": "whole wheat pasta", "quantity": 150, "unit": "g" },
    { "name": "tomato sauce", "quantity": 125, "unit": "ml" },
    { "name": "grated cheese", "quantity": 15, "unit": "g" }
  ],
  "recipe": [
    "Cook pasta, simmer meatballs in sauce.",
    "Serve with cheese on top."
  ]
},
{
  "mealName": "Baked Cod & Veggies",
  "calories": 520,
  "macroRatio": {
    "protein": 0.33,
    "carbs": 0.25,
    "fats": 0.42
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "cod fillet", "quantity": 150, "unit": "g" },
    { "name": "zucchini", "quantity": 80, "unit": "g" },
    { "name": "peppers", "quantity": 80, "unit": "g" },
    { "name": "olive oil", "quantity": 15, "unit": "ml" },
    { "name": "lemon juice", "quantity": 15, "unit": "ml" }
  ],
  "recipe": [
    "Bake cod with veggies.",
    "Season with oil, lemon, salt."
  ]
},
{
  "mealName": "Ground Beef & Sweet Potato Skillet",
  "calories": 640,
  "macroRatio": {
    "protein": 0.25,
    "carbs": 0.35,
    "fats": 0.40
  },
  "category": "Dinner",
  "dietaryPhase": ["surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "lean ground beef", "quantity": 150, "unit": "g" },
    { "name": "sweet potato", "quantity": 1, "singular": "sweet potato", "plural": "sweet potatoes", "wholeItem": true },
    { "name": "onion", "quantity": 50, "unit": "g" },
    { "name": "peppers", "quantity": 50, "unit": "g" },
    { "name": "seasonings", "quantity": 2, "unit": "g" }
  ],
  "recipe": [
    "Brown beef, add sweet potato and veggies.",
    "Cook until tender."
  ]
},
{
  "mealName": "Turkey Chili & Brown Rice",
  "calories": 600,
  "macroRatio": {
    "protein": 0.32,
    "carbs": 0.44,
    "fats": 0.24
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "ground turkey", "quantity": 150, "unit": "g" },
    { "name": "kidney beans", "quantity": 125, "unit": "g" },
    { "name": "tomato sauce", "quantity": 125, "unit": "ml" },
    { "name": "brown rice", "quantity": 100, "unit": "g" }
  ],
  "recipe": [
    "Cook turkey, add beans & sauce.",
    "Simmer, serve over rice."
  ]
},
{
  "mealName": "Chicken Fajita Bowl",
  "calories": 590,
  "macroRatio": {
    "protein": 0.31,
    "carbs": 0.41,
    "fats": 0.28
  },
  "category": "Dinner",
  "dietaryPhase": ["surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "chicken", "quantity": 150, "unit": "g" },
    { "name": "bell peppers", "quantity": 75, "unit": "g" },
    { "name": "onions", "quantity": 50, "unit": "g" },
    { "name": "fajita seasoning", "quantity": 3, "unit": "g" },
    { "name": "rice", "quantity": 100, "unit": "g" }
  ],
  "recipe": [
    "Sauté chicken & peppers with seasoning.",
    "Serve over rice."
  ]
},
{
  "mealName": "Pesto Salmon & Whole Wheat Pasta",
  "calories": 660,
  "macroRatio": {
    "protein": 0.29,
    "carbs": 0.43,
    "fats": 0.28
  },
  "category": "Dinner",
  "dietaryPhase": ["surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Dairy"],
  "ingredients": [
    { "name": "salmon", "quantity": 150, "unit": "g" },
    { "name": "whole wheat pasta", "quantity": 150, "unit": "g" },
    { "name": "pesto", "quantity": 30, "unit": "ml" },
    { "name": "cherry tomatoes", "quantity": 80, "unit": "g" }
  ],
  "recipe": [
    "Bake salmon, boil pasta.",
    "Toss pasta with pesto, top with salmon."
  ]
},
{
  "mealName": "Chicken & Veggie Curry",
  "calories": 600,
  "macroRatio": {
    "protein": 0.27,
    "carbs": 0.47,
    "fats": 0.26
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "chicken", "quantity": 150, "unit": "g" },
    { "name": "curry sauce", "quantity": 125, "unit": "ml" },
    { "name": "mixed veggies", "quantity": 150, "unit": "g" },
    { "name": "rice", "quantity": 100, "unit": "g" }
  ],
  "recipe": [
    "Cook chicken in curry sauce with veggies.",
    "Serve with rice."
  ]
},
{
  "mealName": "Shrimp Scampi with Zucchini Noodles",
  "calories": 550,
  "macroRatio": {
    "protein": 0.35,
    "carbs": 0.30,
    "fats": 0.35
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Pescatarian"],
  "allergens": ["Shellfish"],
  "ingredients": [
    { "name": "shrimp", "quantity": 150, "unit": "g" },
    { "name": "zucchini noodles", "quantity": 200, "unit": "g" },
    { "name": "garlic", "quantity": 2, "unit": "g" },
    { "name": "olive oil", "quantity": 15, "unit": "ml" },
    { "name": "lemon juice", "quantity": 15, "unit": "ml" },
    { "name": "parsley", "quantity": 5, "unit": "g" }
  ],
  "recipe": [
    "Sauté garlic in olive oil and add shrimp until pink.",
    "Toss with zucchini noodles and lemon juice.",
    "Garnish with parsley."
  ],
  "mealNotes": []
},
{
  "mealName": "Vegetable Stir-Fry with Tofu and Rice",
  "calories": 600,
  "macroRatio": {
    "protein": 0.25,
    "carbs": 0.50,
    "fats": 0.25
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Vegan", "Vegetarian"],
  "allergens": ["Soy"],
  "ingredients": [
    { "name": "tofu", "quantity": 150, "unit": "g" },
    { "name": "mixed vegetables", "quantity": 200, "unit": "g" },
    { "name": "brown rice", "quantity": 100, "unit": "g" },
    { "name": "soy sauce", "quantity": 15, "unit": "ml" },
    { "name": "sesame oil", "quantity": 10, "unit": "ml" },
    { "name": "garlic", "quantity": 2, "unit": "g" }
  ],
  "recipe": [
    "Stir-fry tofu and vegetables in sesame oil with garlic.",
    "Serve over brown rice with a drizzle of soy sauce."
  ],
  "mealNotes": []
},
{
  "mealName": "Pesto Chicken with Quinoa",
  "calories": 650,
  "macroRatio": {
    "protein": 0.35,
    "carbs": 0.40,
    "fats": 0.25
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Dairy"],
  "ingredients": [
    { "name": "chicken breast", "quantity": 150, "unit": "g" },
    { "name": "quinoa", "quantity": 100, "unit": "g" },
    { "name": "pesto", "quantity": 30, "unit": "ml" },
    { "name": "cherry tomatoes", "quantity": 80, "unit": "g" }
  ],
  "recipe": [
    "Grill chicken and slice it.",
    "Toss with cooked quinoa, pesto, and cherry tomatoes."
  ],
  "mealNotes": []
},
{
  "mealName": "Lentil Soup with Whole Wheat Bread",
  "calories": 500,
  "macroRatio": {
    "protein": 0.20,
    "carbs": 0.60,
    "fats": 0.20
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Vegan", "Vegetarian"],
  "allergens": [],
  "ingredients": [
    { "name": "lentils", "quantity": 150, "unit": "g" },
    { "name": "diced tomatoes", "quantity": 125, "unit": "g" },
    { "name": "carrots", "quantity": 80, "unit": "g" },
    { "name": "celery", "quantity": 50, "unit": "g" },
    { "name": "onion", "quantity": 50, "unit": "g" },
    { "name": "vegetable broth", "quantity": 500, "unit": "ml" },
    { "name": "whole wheat bread", "quantity": 1, "singular": "slice", "plural": "slices", "wholeItem": true }
  ],
  "recipe": [
    "Simmer lentils with vegetables in broth until tender.",
    "Serve with a slice of whole wheat bread."
  ],
  "mealNotes": []
},
{
  "mealName": "Stuffed Bell Peppers with Ground Turkey",
  "calories": 680,
  "macroRatio": {
    "protein": 0.35,
    "carbs": 0.45,
    "fats": 0.20
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "bell pepper", "quantity": 2, "singular": "pepper", "plural": "peppers", "wholeItem": true },
    { "name": "ground turkey", "quantity": 150, "unit": "g" },
    { "name": "quinoa", "quantity": 80, "unit": "g" },
    { "name": "diced tomatoes", "quantity": 125, "unit": "g" },
    { "name": "onion", "quantity": 50, "unit": "g" }
  ],
  "recipe": [
    "Halve bell peppers and stuff with a mix of ground turkey, quinoa, tomatoes, and onion.",
    "Bake until peppers are tender."
  ],
  "mealNotes": []
},
{
  "mealName": "Baked Tilapia with Steamed Asparagus",
  "calories": 550,
  "macroRatio": {
    "protein": 0.35,
    "carbs": 0.30,
    "fats": 0.35
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Pescatarian"],
  "allergens": ["Fish"],
  "ingredients": [
    { "name": "tilapia fillet", "quantity": 150, "unit": "g" },
    { "name": "asparagus", "quantity": 100, "unit": "g" },
    { "name": "olive oil", "quantity": 15, "unit": "ml" },
    { "name": "lemon", "quantity": 1, "singular": "lemon", "plural": "lemons", "wholeItem": true }
  ],
  "recipe": [
    "Bake tilapia with olive oil and lemon.",
    "Steam asparagus and serve together."
  ],
  "mealNotes": []
},
{
  "mealName": "Vegetable Pasta Primavera",
  "calories": 630,
  "macroRatio": {
    "protein": 0.20,
    "carbs": 0.60,
    "fats": 0.20
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Vegetarian"],
  "allergens": ["Gluten", "Dairy"],
  "ingredients": [
    { "name": "whole wheat pasta", "quantity": 150, "unit": "g" },
    { "name": "mixed vegetables", "quantity": 150, "unit": "g" },
    { "name": "olive oil", "quantity": 15, "unit": "ml" },
    { "name": "Parmesan cheese", "quantity": 15, "unit": "g" }
  ],
  "recipe": [
    "Boil pasta and sauté vegetables in olive oil.",
    "Toss together with Parmesan cheese."
  ],
  "mealNotes": []
},
{
  "mealName": "Slow Cooker Beef Stew",
  "calories": 700,
  "macroRatio": {
    "protein": 0.30,
    "carbs": 0.40,
    "fats": 0.30
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "beef stew meat", "quantity": 200, "unit": "g" },
    { "name": "potatoes", "quantity": 150, "unit": "g" },
    { "name": "carrots", "quantity": 80, "unit": "g" },
    { "name": "celery", "quantity": 50, "unit": "g" },
    { "name": "beef broth", "quantity": 500, "unit": "ml" },
    { "name": "tomato paste", "quantity": 30, "unit": "g" }
  ],
  "recipe": [
    "Combine beef, vegetables, broth, and tomato paste in a slow cooker.",
    "Cook on low until tender."
  ],
  "mealNotes": []
},
{
  "mealName": "Shrimp Fried Rice",
  "calories": 640,
  "macroRatio": {
    "protein": 0.30,
    "carbs": 0.45,
    "fats": 0.25
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Pescatarian"],
  "allergens": ["Shellfish"],
  "ingredients": [
    { "name": "shrimp", "quantity": 150, "unit": "g" },
    { "name": "rice", "quantity": 150, "unit": "g" },
    { "name": "mixed vegetables", "quantity": 100, "unit": "g" },
    { "name": "soy sauce", "quantity": 15, "unit": "ml" },
    { "name": "egg", "quantity": 1, "singular": "egg", "plural": "eggs", "wholeItem": true },
    { "name": "sesame oil", "quantity": 10, "unit": "ml" }
  ],
  "recipe": [
    "Stir-fry shrimp, vegetables, and egg.",
    "Add rice and soy sauce, then finish with sesame oil."
  ],
  "mealNotes": []
},
{
  "mealName": "Eggplant Parmesan",
  "calories": 680,
  "macroRatio": {
    "protein": 0.25,
    "carbs": 0.45,
    "fats": 0.30
  },
  "category": "Dinner",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Vegetarian"],
  "allergens": ["Dairy", "Gluten"],
  "ingredients": [
    { "name": "eggplant", "quantity": 1, "singular": "eggplant", "plural": "eggplants", "wholeItem": true },
    { "name": "marinara sauce", "quantity": 200, "unit": "ml" },
    { "name": "mozzarella cheese", "quantity": 60, "unit": "g" },
    { "name": "Parmesan cheese", "quantity": 15, "unit": "g" },
    { "name": "whole wheat breadcrumbs", "quantity": 40, "unit": "g" }
  ],
  "recipe": [
    "Slice eggplant and layer with marinara and cheeses.",
    "Bake until bubbly."
  ],
  "mealNotes": []
},  

// --------------------
// (D) 10 SNACKS
// --------------------
  {
    "mealName": "Apple Slices & Almond Butter",
    "calories": 220,
    "macroRatio": {
      "protein": 0.11,
      "carbs": 0.50,
      "fats": 0.39
    },
    "category": "Snack",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Nuts"],
    "ingredients": [
      {
        "name": "apple",
        "quantity": 1,
        "singular": "apple",
        "plural": "apples",
        "wholeItem": true
      },
      {
        "name": "almond butter",
        "quantity": 16,
        "unit": "g"
      }
    ],
    "recipe": [
      "Slice apple, spread almond butter."
    ],
    "mealNotes": ["A crunchy and nutritious snack."]
  },
  {
    "mealName": "Greek Yogurt Parfait",
    "calories": 400,
    "macroRatio": {
      "protein": 0.23,
      "carbs": 0.51,
      "fats": 0.26
    },
    "category": "Snack",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      {
        "name": "Greek yogurt",
        "quantity": 150,
        "unit": "g"
      },
      {
        "name": "granola",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "mixed berries",
        "quantity": 50,
        "unit": "g"
      }
    ],
    "recipe": [
      "Layer yogurt, granola, and berries.",
      "Serve immediately."
    ],
    "mealNotes": ["Drizzle honey for added sweetness."]
  },
  {
    "mealName": "Peanut Butter Banana Toast",
    "calories": 400,
    "macroRatio": {
      "protein": 0.15,
      "carbs": 0.51,
      "fats": 0.34
    },
    "category": "Snack",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Gluten", "Peanuts"],
    "ingredients": [
      {
        "name": "whole grain bread",
        "quantity": 1,
        "singular": "slice",
        "plural": "slices",
        "wholeItem": true
      },
      {
        "name": "peanut butter",
        "quantity": 16,
        "unit": "g"
      },
      {
        "name": "banana",
        "quantity": 0.5,
        "singular": "banana",
        "plural": "bananas",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Toast bread, spread peanut butter.",
      "Top with banana slices."
    ],
    "mealNotes": ["Sprinkle chia seeds for extra crunch."]
  },
  {
    "mealName": "Hummus & Carrot Sticks",
    "calories": 180,
    "macroRatio": {
      "protein": 0.11,
      "carbs": 0.44,
      "fats": 0.45
    },
    "category": "Snack",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "hummus",
        "quantity": 40,
        "unit": "g"
      },
      {
        "name": "carrot sticks",
        "quantity": 60,
        "unit": "g"
      }
    ],
    "recipe": [
      "Dip carrot sticks in hummus."
    ],
    "mealNotes": ["A great fiber-rich snack."]
  },
  {
    "mealName": "Rice Cakes & Peanut Butter",
    "calories": 230,
    "macroRatio": {
      "protein": 0.13,
      "carbs": 0.42,
      "fats": 0.45
    },
    "category": "Snack",
    "dietaryPhase": ["surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Nuts"],
    "ingredients": [
      {
        "name": "rice cakes",
        "quantity": 2,
        "singular": "rice cake",
        "plural": "rice cakes",
        "wholeItem": true
      },
      {
        "name": "peanut butter",
        "quantity": 16,
        "unit": "g"
      }
    ],
    "recipe": [
      "Spread peanut butter on rice cakes."
    ],
    "mealNotes": ["A crunchy and satisfying snack."]
  },
  {
    "mealName": "Protein Bar (Homemade or Store-Bought)",
    "calories": 250,
    "macroRatio": {
      "protein": 0.32,
      "carbs": 0.32,
      "fats": 0.36
    },
    "category": "Snack",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "protein bar",
        "quantity": 1,
        "singular": "bar",
        "plural": "bars",
        "wholeItem": true
      }
    ],
    "recipe": [
      "Enjoy as a quick snack."
    ],
    "mealNotes": ["Great for on-the-go."]
  },
    {
      "mealName": "Mixed Berries & Low-Fat Cottage Cheese",
      "calories": 220,
      "macroRatio": {
        "protein": 0.32,
        "carbs": 0.43,
        "fats": 0.25
      },
      "category": "Snack",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "cottage cheese",
          "quantity": 100,
          "unit": "g"
        },
        {
          "name": "mixed berries",
          "quantity": 75,
          "unit": "g"
        }
      ],
      "recipe": [
        "Combine in a bowl, serve."
      ],
      "mealNotes": ["Refreshing and protein-packed!"]
    },
    {
      "mealName": "Whole Grain Crackers & Cheese",
      "calories": 260,
      "macroRatio": {
        "protein": 0.19,
        "carbs": 0.46,
        "fats": 0.35
      },
      "category": "Snack",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "whole grain crackers",
          "quantity": 4,
          "singular": "cracker",
          "plural": "crackers",
          "wholeItem": true
        },
        {
          "name": "cheese",
          "quantity": 30,
          "unit": "g"
        }
      ],
      "recipe": [
        "Top crackers with sliced cheese."
      ],
      "mealNotes": ["A simple and satisfying snack."]
    },
    {
      "mealName": "Almonds & Dark Chocolate Chips",
      "calories": 300,
      "macroRatio": {
        "protein": 0.10,
        "carbs": 0.31,
        "fats": 0.59
      },
      "category": "Snack",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Nuts"],
      "ingredients": [
        {
          "name": "almonds",
          "quantity": 20,
          "unit": "g"
        },
        {
          "name": "dark chocolate chips",
          "quantity": 10,
          "unit": "g"
        }
      ],
      "recipe": [
        "Combine in a small bowl."
      ],
      "mealNotes": ["A great sweet and crunchy combo!"]
    },
    {
      "mealName": "Overnight Oats with Chia & Almond Butter",
      "calories": 530,
      "macroRatio": {
        "protein": 0.31,
        "carbs": 0.45,
        "fats": 0.24
      },
      "category": "Breakfast",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["Vegetarian"],
      "allergens": ["Nuts"],
      "ingredients": [
        {
          "name": "rolled oats",
          "quantity": 40,
          "unit": "g"
        },
        {
          "name": "chia seeds",
          "quantity": 10,
          "unit": "g"
        },
        {
          "name": "almond milk",
          "quantity": 250,
          "unit": "ml"
        },
        {
          "name": "almond butter",
          "quantity": 16,
          "unit": "g"
        },
        {
          "name": "honey",
          "quantity": 7,
          "unit": "g"
        }
      ],
      "recipe": [
        "Mix oats, chia seeds, and almond milk in a container.",
        "Refrigerate overnight.",
        "Top with almond butter and honey before serving."
      ],
      "mealNotes": ["Perfect for busy mornings!"]
    },
    {
      "mealName": "Greek Yogurt & Mixed Berries",
      "calories": 320,
      "macroRatio": {
        "protein": 0.33,
        "carbs": 0.52,
        "fats": 0.15
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "Greek yogurt",
          "quantity": 200,
          "unit": "g"
        },
        {
          "name": "mixed berries",
          "quantity": 75,
          "unit": "g"
        },
        {
          "name": "honey",
          "quantity": 7,
          "unit": "g"
        },
        {
          "name": "chia seeds",
          "quantity": 10,
          "unit": "g"
        }
      ],
      "recipe": [
        "Mix Greek yogurt with honey.",
        "Top with mixed berries and chia seeds."
      ],
      "mealNotes": ["A nutritious and filling snack!"]
    },
    {
      "mealName": "Grilled Chicken Salad",
      "calories": 500,
      "macroRatio": {
        "protein": 0.38,
        "carbs": 0.34,
        "fats": 0.28
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "grilled chicken breast",
          "quantity": 150,
          "unit": "g"
        },
        {
          "name": "mixed greens",
          "quantity": 80,
          "unit": "g"
        },
        {
          "name": "avocado",
          "quantity": 50,
          "unit": "g"
        },
        {
          "name": "balsamic dressing",
          "quantity": 10,
          "unit": "g"
        },
        {
          "name": "cherry tomatoes",
          "quantity": 50,
          "unit": "g"
        }
      ],
      "recipe": [
        "Grill chicken breast until golden brown.",
        "Toss mixed greens, avocado, and tomatoes with dressing.",
        "Slice chicken and serve on top."
      ],
      "mealNotes": ["A clean and protein-rich meal!"]
    },    
    {
      "mealName": "Quinoa & Black Bean Bowl",
      "calories": 550,
      "macroRatio": {
        "protein": 0.27,
        "carbs": 0.55,
        "fats": 0.18
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["Vegan", "Vegetarian"],
      "allergens": [],
      "ingredients": [
        { "name": "quinoa", "quantity": 90, "unit": "g" },
        { "name": "black beans", "quantity": 85, "unit": "g" },
        { "name": "diced bell peppers", "quantity": 75, "unit": "g" },
        { "name": "olive oil", "quantity": 15, "unit": "ml" },
        { "name": "salt and pepper", "quantity": 1, "unit": "g" }
      ],
      "recipe": [
        "Cook quinoa per instructions.",
        "Sauté bell peppers in olive oil.",
        "Mix with black beans and season."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Baked Salmon with Quinoa & Veggies",
      "calories": 600,
      "macroRatio": {
        "protein": 0.34,
        "carbs": 0.38,
        "fats": 0.28
      },
      "category": "Dinner",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["Pescatarian"],
      "allergens": [],
      "ingredients": [
        { "name": "salmon fillet", "quantity": 150, "unit": "g" },
        { "name": "quinoa", "quantity": 90, "unit": "g" },
        { "name": "steamed broccoli", "quantity": 150, "unit": "g" },
        { "name": "olive oil", "quantity": 15, "unit": "ml" },
        { "name": "lemon juice", "quantity": 15, "unit": "ml" }
      ],
      "recipe": [
        "Season salmon and bake at 180°C for 15-20 min.",
        "Cook quinoa, steam broccoli.",
        "Serve together."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Lean Turkey & Brown Rice Bowl",
      "calories": 620,
      "macroRatio": {
        "protein": 0.39,
        "carbs": 0.42,
        "fats": 0.19
      },
      "category": "Dinner",
      "dietaryPhase": ["surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        { "name": "lean ground turkey", "quantity": 150, "unit": "g" },
        { "name": "brown rice", "quantity": 100, "unit": "g" },
        { "name": "spinach", "quantity": 15, "unit": "g" },
        { "name": "garlic powder", "quantity": 3, "unit": "g" },
        { "name": "olive oil", "quantity": 15, "unit": "ml" }
      ],
      "recipe": [
        "Cook brown rice.",
        "Sauté turkey with garlic powder.",
        "Steam spinach and serve."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Banana & Peanut Butter Protein Shake",
      "calories": 350,
      "macroRatio": {
        "protein": 0.32,
        "carbs": 0.43,
        "fats": 0.25
      },
      "category": "Snack",
      "dietaryPhase": ["surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Nuts", "Soy"],
      "ingredients": [
        { "name": "whey protein", "quantity": 30, "unit": "g" },
        { "name": "banana", "quantity": 1, "singular": "banana", "plural": "bananas", "wholeItem": true },
        { "name": "almond milk", "quantity": 250, "unit": "ml" },
        { "name": "peanut butter", "quantity": 16, "unit": "g" }
      ],
      "recipe": [
        "Blend all until smooth."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Cottage Cheese with Almonds & Honey",
      "calories": 280,
      "macroRatio": {
        "protein": 0.37,
        "carbs": 0.37,
        "fats": 0.26
      },
      "category": "Snack",
      "dietaryPhase": ["deficitPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy", "Nuts"],
      "ingredients": [
        { "name": "cottage cheese", "quantity": 150, "unit": "g" },
        { "name": "honey", "quantity": 21, "unit": "g" },
        { "name": "almonds", "quantity": 12, "unit": "g" }
      ],
      "recipe": [
        "Mix honey into cottage cheese.",
        "Top with almonds."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Dark Chocolate & Mixed Nuts",
      "calories": 300,
      "macroRatio": {
        "protein": 0.13,
        "carbs": 0.25,
        "fats": 0.62
      },
      "category": "Snack",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Nuts"],
      "ingredients": [
        { "name": "dark chocolate", "quantity": 30, "unit": "g" },
        { "name": "mixed nuts", "quantity": 28, "unit": "g" }
      ],
      "recipe": [
        "Serve as a snack."
      ],
      "mealNotes": []
    },      
  {
"mealName": "Beef Jerky & Grapes",
"calories": 220,
"macroRatio": {
  "protein": 0.41,
  "carbs": 0.31,
  "fats": 0.28
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["No Restrictions"],
"allergens": [],
"ingredients": [
  { "name": "beef jerky", "quantity": 30, "unit": "g" },
  { "name": "grapes", "quantity": 75, "unit": "g" }
],
"recipe": [
  "Enjoy together."
],
"mealNotes": []
},
{
"mealName": "Greek Yogurt & Honey",
"calories": 200,
"macroRatio": {
  "protein": 0.31,
  "carbs": 0.51,
  "fats": 0.18
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["No Restrictions"],
"allergens": ["Dairy"],
"ingredients": [
  { "name": "Greek yogurt", "quantity": 245, "unit": "g" },
  { "name": "honey", "quantity": 7, "unit": "g" }
],
"recipe": [
  "Mix Greek yogurt and honey in a bowl."
],
"mealNotes": []
},
{
"mealName": "Cottage Cheese & Pineapple",
"calories": 220,
"macroRatio": {
  "protein": 0.35,
  "carbs": 0.53,
  "fats": 0.12
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["No Restrictions"],
"allergens": ["Dairy"],
"ingredients": [
  { "name": "cottage cheese", "quantity": 150, "unit": "g" },
  { "name": "pineapple chunks", "quantity": 80, "unit": "g" }
],
"recipe": [
  "Combine cottage cheese and pineapple in a bowl."
],
"mealNotes": []
},
{
"mealName": "Peanut Butter Banana Toast",
"calories": 250,
"macroRatio": {
  "protein": 0.16,
  "carbs": 0.55,
  "fats": 0.29
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["No Restrictions"],
"allergens": ["Peanuts", "Gluten"],
"ingredients": [
  { "name": "whole wheat bread", "quantity": 1, "singular": "slice", "plural": "slices", "wholeItem": true },
  { "name": "peanut butter", "quantity": 16, "unit": "g" },
  { "name": "banana", "quantity": 0.5, "singular": "banana", "plural": "bananas", "wholeItem": true }
],
"recipe": [
  "Toast the bread.",
  "Spread peanut butter and top with banana slices."
],
"mealNotes": []
},
{
"mealName": "Hummus & Veggie Sticks",
"calories": 180,
"macroRatio": {
  "protein": 0.15,
  "carbs": 0.47,
  "fats": 0.38
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["Vegan", "Vegetarian"],
"allergens": ["None"],
"ingredients": [
  { "name": "hummus", "quantity": 60, "unit": "g" },
  { "name": "carrot sticks", "quantity": 50, "unit": "g" },
  { "name": "cucumber sticks", "quantity": 50, "unit": "g" }
],
"recipe": [
  "Serve hummus with fresh veggie sticks."
],
"mealNotes": []
},
{
"mealName": "Boiled Eggs & Almonds",
"calories": 230,
"macroRatio": {
  "protein": 0.32,
  "carbs": 0.04,
  "fats": 0.64
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["No Restrictions"],
"allergens": ["Eggs", "Nuts"],
"ingredients": [
  { "name": "egg", "quantity": 2, "singular": "egg", "plural": "eggs", "wholeItem": true },
  { "name": "almonds", "quantity": 12, "unit": "g" }
],
"recipe": [
  "Boil eggs and serve with almonds."
],
"mealNotes": []
},
{
"mealName": "Rice Cakes & Almond Butter",
"calories": 210,
"macroRatio": {
  "protein": 0.11,
  "carbs": 0.53,
  "fats": 0.36
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["Vegan", "Vegetarian"],
"allergens": ["Nuts"],
"ingredients": [
  { "name": "rice cakes", "quantity": 2, "singular": "rice cake", "plural": "rice cakes", "wholeItem": true },
  { "name": "almond butter", "quantity": 16, "unit": "g" }
],
"recipe": [
  "Spread almond butter over rice cakes."
],
"mealNotes": []
},
{
"mealName": "Cucumber & Tuna Salad",
"calories": 180,
"macroRatio": {
  "protein": 0.47,
  "carbs": 0.11,
  "fats": 0.42
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["Pescatarian"],
"allergens": ["Fish"],
"ingredients": [
  { "name": "tuna", "quantity": 80, "unit": "g" },
  { "name": "chopped cucumber", "quantity": 50, "unit": "g" },
  { "name": "olive oil", "quantity": 15, "unit": "ml" }
],
"recipe": [
  "Mix tuna and cucumber, drizzle with olive oil."
],
"mealNotes": []
},
{
"mealName": "Protein Shake & Berries",
"calories": 240,
"macroRatio": {
  "protein": 0.51,
  "carbs": 0.34,
  "fats": 0.15
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["No Restrictions"],
"allergens": ["Dairy"],
"ingredients": [
  { "name": "protein powder", "quantity": 30, "unit": "g" },
  { "name": "almond milk", "quantity": 250, "unit": "ml" },
  { "name": "mixed berries", "quantity": 75, "unit": "g" }
],
"recipe": [
  "Blend protein powder, almond milk, and berries until smooth."
],
"mealNotes": []
},
{
"mealName": "Dark Chocolate & Walnuts",
"calories": 230,
"macroRatio": {
  "protein": 0.08,
  "carbs": 0.25,
  "fats": 0.67
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["Vegan", "Vegetarian"],
"allergens": ["Nuts"],
"ingredients": [
  { "name": "dark chocolate", "quantity": 20, "unit": "g" },
  { "name": "walnuts", "quantity": 14, "unit": "g" }
],
"recipe": [
  "Enjoy dark chocolate with walnuts."
],
"mealNotes": []
},
{
"mealName": "Cinnamon Oat Energy Bites",
"calories": 190,
"macroRatio": {
  "protein": 0.12,
  "carbs": 0.56,
  "fats": 0.32
},
"category": "Snack",
"dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
"portionSize": 1.0,
"dietaryRestrictions": ["Vegan", "Vegetarian"],
"allergens": ["None"],
"ingredients": [
  { "name": "oats", "quantity": 40, "unit": "g" },
  { "name": "peanut butter", "quantity": 16, "unit": "g" },
  { "name": "honey", "quantity": 21, "unit": "g" },
  { "name": "cinnamon", "quantity": 1, "unit": "g" }
],
"recipe": [
  "Mix all ingredients, roll into small balls, refrigerate."
],
"mealNotes": []
}
];

/*******************************************************
 * (L) DYNAMIC MEAL PLAN GENERATOR
 *******************************************************/

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
  console.log("DEBUG: localStorage mealFrequency=", raw, " => parsed=", getMealFrequency());
}

function calculateMacros(totalCals, macroRatio) {
  // standard: 4 kcal/g for protein, 4 kcal/g carbs, 9 kcal/g fats
  const p = Math.round((totalCals * (macroRatio.protein || 0)) / 4);
  const c = Math.round((totalCals * (macroRatio.carbs   || 0)) / 4);
  const f = Math.round((totalCals * (macroRatio.fats    || 0)) / 9);
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

  console.log(`\n[pickMealForCategory] Cat=${category} target=${mealTarget}, range=[${Math.round(lowerBound)}..${Math.round(upperBound)}]`);

  // filter
  const possibleMeals = database.filter(m => {
    if (!m.category || m.category.toLowerCase() !== category.toLowerCase()) return false;
    // If the meal's base cals are in [0.9..1.1] × mealTarget
    return (m.calories >= lowerBound && m.calories <= upperBound);
  });

  console.log(`  -> Found ${possibleMeals.length} possible meal(s) for "${category}"`, possibleMeals.map(m=>m.mealName));

  if (!possibleMeals.length) {
    console.warn(`No ${category} meal found in ±10% range for target ${mealTarget}`);
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
  console.log("\n--- portionScaleMeal START ---");
  console.log("Original Meal:", meal.mealName);

  // 1) If the meal’s current .calories is X, 
  //    the scale factor = newCalorieTarget / X
  const baseCals = meal.calories;
  const rawScale = newCalorieTarget / baseCals;

  // Constrain to 0.9..1.1 or your chosen range
  const portionMultiplier = Math.max(0.9, Math.min(1.1, rawScale));
  console.log(`Target cals=${newCalorieTarget}, base cals=${baseCals}, rawScale=${rawScale.toFixed(3)}, final multiplier=${portionMultiplier.toFixed(2)}`);

  // 2) Recompute the "actual" final total cals 
  //    after we clamp the portionMultiplier:
  const finalCals = Math.round(baseCals * portionMultiplier);

  // 3) Recompute macros from macroRatio * finalCals
  const macrosObj = calculateMacros(finalCals, meal.macroRatio);

  console.log("New totalCals:", finalCals, " => macros:", macrosObj);

  // 4) Scale the portionSize
  const newPortionSize = parseFloat((meal.portionSize * portionMultiplier).toFixed(2));
  console.log("Old portionSize=", meal.portionSize, " => new portionSize=", newPortionSize);

  // 5) Scale each ingredient
  const updatedIngredients = meal.ingredients.map(origIng => {
    const scaled = scaleIngredient(origIng, portionMultiplier);
    console.log(`  Ingredient "${origIng.name}" => old qty=${origIng.quantity} new qty=${scaled.quantity}`);
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

  console.log("--- portionScaleMeal END ---\n");
  return updatedMeal;
}

function buildPdf4WeekNutritionPart2() {
  fillMealPlanCoverPage();
  fillPdf4NutritionPart2NavPage();
  buildAndRender12WeekMealPlan("pdf4MealPlansContainerPart2", 1, 4);
  addPageNumbers("pdf4WeekNutritionPart2");
}

function buildMealPlanFoundationPages() {
  const container = document.getElementById("pdf4MealPlansContainerPart2");
  if (!container) return;

  // Clear out any existing placeholder
  container.innerHTML = "";

  // Now call your 4-week function, restricting it to weeks 1..4
  build28DayMealPlanRework({
    fromWeek: 1,
    toWeek: 4,
    targetContainerId: "pdf4MealPlansContainerPart2"
  });
}

/**
 * 1) BUILD & FILTER DATABASE
 *    - We handle the user’s dietaryPhase for each week,
 *      dietaryRestrictions, and allergies in a single function.
 */
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

/********************************************
 * 1) Update testimonial image based on goal
 ********************************************/
function getTestimonialImageBasedOnGoal() {
  const userGoal = (localStorage.getItem("goal") || "").toLowerCase();

  // Return a different placeholder for each goal:
  if (userGoal.includes("weight loss")) {
    return "#"; // Placeholder for Weight Loss image
  } else if (userGoal.includes("muscle gain")) {
    return "#"; // Placeholder for Muscle Gain image
  } else if (userGoal.includes("improve body composition")) {
    return "#"; // Placeholder for Improve Body Composition image
  } else {
    return "#"; // Fallback or default image
  }
}

/********************************************
 * 2) Get testimonial name & text based on goal
 ********************************************/
function getTestimonialNameAndReview() {
  const userGoal = (localStorage.getItem("goal") || "").toLowerCase();

  // Default placeholders:
  let name = "Default Name";
  let review = "Default placeholder review text.";

  if (userGoal.includes("weight loss")) {
    name = "X";
    review = "X's review: I lost weight and feel fantastic!";
  } else if (userGoal.includes("muscle gain")) {
    name = "Y";
    review = "Y's review: My strength and muscle size skyrocketed!";
  } else if (userGoal.includes("improve body composition")) {
    name = "Z";
    review = "Z's review: I'm leaner, stronger, and feel healthier!";
  }

  return { name, review };
}

function getWorkoutTestimonialNameAndReview() {
  const userGoal = (localStorage.getItem("goal") || "").toLowerCase();

  let name = "Default Name";
  let review = "Default workout review text.";

  if (userGoal.includes("weight loss")) {
    name = "X";
    review = "X's workout review: By Week 4, I felt stronger. By Week 12, I had completely changed my body and mindset. Sticking with the program made all the difference!";
  } else if (userGoal.includes("muscle gain")) {
    name = "Y";
    review = "Y's workout review: My strength and muscle size skyrocketed thanks to these workouts!";
  } else if (userGoal.includes("improve body composition")) {
    name = "Z";
    review = "Z's workout review: I'm leaner, stronger, and my overall fitness is on another level!";
  }

  return { name, review };
}

function fillNutritionUpsellPage() {
  const pg = document.getElementById("pdf4NutritionUpsellPage");
  if (!pg) return;

  pg.innerHTML = "";
  pg.classList.add("no-footer");

  // ==========================
  // 1) Headline
  // ==========================
  // NEW CODE START
  const heading = document.createElement("h2");
  heading.style.textAlign = "center";
  heading.style.fontFamily = "Poppins, sans-serif";
  heading.style.fontWeight = "700";
  heading.style.fontSize = "2rem";
  heading.style.margin = "0.5rem 0 1rem 0";
  heading.style.color = "#000000";
  heading.textContent = "Take Your Nutrition to the Next Level—More Results, More Progress!";
  pg.appendChild(heading);

  // 2) Subtext
  const subtextEl = document.createElement("p");
  subtextEl.style.textAlign = "center";
  subtextEl.style.fontSize = "1rem";
  subtextEl.style.margin = "0 0 2rem 0";
  subtextEl.textContent = "You've made real progress—now let's make it unstoppable. Refine, optimize, and accelerate your results.";
  pg.appendChild(subtextEl);

  // 3) Benefits: 6 bullet points (3 left, 3 right).
  const benefitsContainer = document.createElement("div");
  benefitsContainer.className = "upsell-benefits-grid";

  // Generate rows, each with two bullet points
  benefitsContainer.innerHTML = `
    <div class="upsell-benefit-row">
      <div class="upsell-benefit-item">✔ 12-Week Nutrition Guide</div>
      <div class="upsell-benefit-item">✔ Step-by-Step Meal Prep Guide</div>
    </div>
    <div class="upsell-benefit-row">
      <div class="upsell-benefit-item">✔ Expanded Meal Library</div>
      <div class="upsell-benefit-item">✔ 12-Week Coaching Series</div>
    </div>
    <div class="upsell-benefit-row">
      <div class="upsell-benefit-item">✔ Complete Weekly Calorie & Macro Overview</div>
      <div class="upsell-benefit-item">✔ Exclusive Goal Guarantee</div>
    </div>
  `;

  pg.appendChild(benefitsContainer);

  // 4) Testimonial row: Placeholder image on left, text on right
  const testimonialRow = document.createElement("div");
  testimonialRow.className = "upsell-testimonial-row";

  // Create the testimonial image
  const testimonialImg = document.createElement("img");
  testimonialImg.className = "upsell-testimonial-placeholder";
  testimonialImg.style.objectFit = "cover";
  testimonialImg.style.width = "250px";
  testimonialImg.style.height = "250px";
  testimonialImg.src = getTestimonialImageBasedOnGoal();
  testimonialRow.appendChild(testimonialImg);

  // Create a container for the text portion
  const testimonialTextContainer = document.createElement("div");
  testimonialTextContainer.className = "upsell-testimonial-text-container";
  // Optional spacing so text doesn't butt right up against the image
  testimonialTextContainer.style.marginLeft = "1rem";

  // Create the top "header" row with name on the left and stars on the right
  const testimonialHeader = document.createElement("div");
  testimonialHeader.className = "upsell-testimonial-header";

  // Get the dynamic name/review
  const { name, review } = getTestimonialNameAndReview();

  // Name in bold on the left
  const testimonialName = document.createElement("strong");
  testimonialName.textContent = name;

  // 5-star image on the right
  const testimonialStars = document.createElement("img");
  testimonialStars.src = "src/images/5-stars.png";
  testimonialStars.alt = "5-star rating";
  testimonialStars.style.maxWidth = "150px";

  // Append name and stars to the header
  testimonialHeader.appendChild(testimonialName);
  testimonialHeader.appendChild(testimonialStars);

  // Create the actual testimonial text (below the header)
  const testimonialText = document.createElement("div");
  testimonialText.className = "upsell-testimonial-text";
  testimonialText.innerHTML = `"${review}"`;

  // Append header and text into the container
  testimonialTextContainer.appendChild(testimonialHeader);
  testimonialTextContainer.appendChild(testimonialText);

  // Finally, append the container into the main row
  testimonialRow.appendChild(testimonialTextContainer);

  // Add to your page
  pg.appendChild(testimonialRow);

  // 5) 12-Week Program guarantee
  const guaranteeEl = document.createElement("p");
  guaranteeEl.style.fontSize = "1rem";
  guaranteeEl.style.textAlign = "center";
  guaranteeEl.style.lineHeight = "1.4";
  guaranteeEl.style.margin = "2rem auto 1.5rem auto";
  guaranteeEl.style.maxWidth = "90%";
  guaranteeEl.innerHTML = `
    <strong>We stand behind our nutrition strategies because they work.</strong>
    If you don’t reach your goal, we’ll guide you with free 1-on-1 support until you do.
  `;
  pg.appendChild(guaranteeEl);

  // 6) CTA button, styled as is with the same text
  const ctaBtn = document.createElement("a");
  ctaBtn.href = "#";
  ctaBtn.className = "upsell-cta-btn";
  ctaBtn.textContent = "🔥 Limited Time – Get Your 12-Week Plan Now!";
  pg.appendChild(ctaBtn);

  // 7) Price underneath CTA
  const priceWrapper = document.createElement("div");
  priceWrapper.style.textAlign = "center";
  priceWrapper.style.fontFamily = "Poppins";
  priceWrapper.style.marginTop = "1.5rem";
  priceWrapper.style.marginBottom = "1.5rem";
  priceWrapper.style.paddingBottom = "0";
  priceWrapper.innerHTML = `
    <span style="color:#333; text-decoration: line-through; font-size:18px; margin-right:4px;">
      £99.99
    </span>
    <span style="color: #ffffff; background-color: #d9534f; font-size:24px; margin-left:4px; font-weight:800; letter-spacing:0.5px; padding: 0.5rem; border-radius: 6px;">
      £79.99
    </span>
  `;
  pg.appendChild(priceWrapper);

  // 8) We already used a dynamic testimonial image based on user’s goal above.
  //    That covers your requirement to alternate images for Weight Loss / Muscle Gain / Improve Body Composition.

  const riskFreeP = document.createElement("p");
  riskFreeP.className = "money-back-text";
  riskFreeP.textContent =
    "100% Risk-Free - Love it or get a FULL refund within 30 days!";
  pg.appendChild(riskFreeP);
}

/****************************************************
 * Download function for the split
 ****************************************************/
function generateNutritionPDFsSplit() {
  // 1) Build & download Weeks 1–2
  buildPdfNutritionWeeks1to2();
  setTimeout(() => {
    downloadPDF("pdf4WeekNutritionPart1", "4-Week-Nutrition-Wk1-2.pdf", () => {
      // 2) Build & download Weeks 3–4
      buildPdfNutritionWeeks3to4();
      setTimeout(() => {
        downloadPDF("pdf4WeekNutritionPart2", "4-Week-Nutrition-Wk3-4.pdf", () => {
          console.log("Downloaded Nutrition Weeks 1–2 and Weeks 3–4!");
        });
      }, 400);
    });
  }, 400);
}

/****************************************************
 * (M) ORCHESTRATE BOTH PDFS
 ****************************************************/

function generateFourWeekPDFs() {
  buildPdf4WeekWorkout();
  setTimeout(() => {
    downloadPDF("pdf4WeekWorkout", "4-Week-Workout-Program.pdf", () => {
      buildPdf4WeekNutritionPart1();
      setTimeout(() => {
        downloadPDF("pdf4WeekNutritionPart1", "4-Week-Nutrition-Guide.pdf", () => {
          buildPdf4WeekNutritionPart2();
          setTimeout(() => {
            downloadPDF("pdf4WeekNutritionPart2", "4-Week-Meal-Plan.pdf", () => {
              console.log("All PDFs downloaded!");
            });
          }, 400);

        });
      }, 400);

    });
  }, 400);
}

/****************************************************
 * DOMContentLoaded
 ****************************************************/

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("download4WeekBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      localStorage.setItem("purchasedWeeks", "4");
      generateFourWeekPDFs();
    });
  }
});