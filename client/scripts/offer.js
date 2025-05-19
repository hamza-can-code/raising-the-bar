const userId = localStorage.getItem('userId');

async function simulatePurchase(purchaseType) {
  const res = await fetch('/api/update-purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, purchaseType })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||'Purchase failed');
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const name = localStorage.getItem("name");
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

  // Retrieve all offers
  const oneWeekProgram = JSON.parse(localStorage.getItem("oneWeekProgram"));
  const fourWeekProgram = JSON.parse(localStorage.getItem("fourWeekProgram"));
  const twelveWeekProgram = JSON.parse(localStorage.getItem("twelveWeekProgram"));

  // Normalize the user goal by trimming and checking for expected values
  userGoal = userGoal ? userGoal.trim().toLowerCase() : ""; // Trim and normalize

  // Debugging logs
  console.log("Name:", name);
  console.log("Date of Birth:", dob);
  console.log("Age:", age);
  console.log("Gender:", gender);
  console.log("Height:", height);
  console.log("Weight:", weight);
  console.log("Activity Level:", activityLevel);
  console.log("BMI Value:", userBMI);
  console.log("BMI Category:", bmiCategory);
  console.log("Maintenance Calories", maintenanceCalories);
  console.log("Goal-Based Projections Data:", goalBasedProjections);
  console.log("Goal Calories:", goalCalories);
  console.log("Selected Calories:", selectedCalories);
  console.log("Effort Level:", effortLevel);
  console.log("session Duration:", sessionDuration);
  console.log("Fitness Level:", fitnessLevel);
  console.log("Workout Location:", workoutLocation);
  console.log("Workout Frequency:", workoutFrequency);
  console.log("1-week program:", oneWeekProgram);
  console.log("4-week program:", fourWeekProgram);
  console.log("12-week program:", twelveWeekProgram);

  // Set default goal if missing or invalid
  if (!userGoal || !["lose weight", "gain muscle", "improve body composition"].includes(userGoal)) {
    console.warn("User Goal is missing or invalid. Defaulting to 'improve body composition'.");
    userGoal = "improve body composition";
    localStorage.setItem("goal", userGoal); // Save the default goal
  }

  console.log("User Goal retrieved:", userGoal);

  function kgToLbs(kg) {
    return kg * 2.20462;
  }

  // Log maintenance calories for body composition goal
  if (userGoal === "improve body composition") {
    const maintenanceCalories = localStorage.getItem("maintenanceCalories");
    if (maintenanceCalories) {
      console.log("Maintenance Calories for Body Composition:", maintenanceCalories);
    } else {
      console.warn("Maintenance calories not found in localStorage.");
    }
  }

  // Handle missing critical data
  if (!name || !bmiCategory || !goalBasedProjections) {
    console.warn("Missing data for the dynamic message. Ensure all necessary information is saved.");
    const dynamicMessageContainer = document.getElementById("dynamicMessageContainer");
    if (dynamicMessageContainer) {
      dynamicMessageContainer.innerHTML = `
        <p><b>${name || "User"}</b>, we’ve created a personalized program for you. Let’s get started!</p>`;
    }
    return;
  }

  // 1) If critical data is missing, fallback message (keep this check from above if you like)
  if (!name || !localStorage.getItem("userGoalDate") || !localStorage.getItem("projectedGoalDate")) {
    console.warn("Missing data for the dynamic hero message. Showing basic fallback.");
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
      met: "Make sure you feel amazing, lean, and confident when your big day arrives in {eventMonth}. All with a smart tracker that asks how you feel and adapts your plan around it.",
      notMet: "This plan will help you feel stronger and more in control — this is still your moment with a smart tracker that asks how you feel and adapts your plan around it.."
    },
    {
      goalDriver: "An upcoming holiday",
      met: "Make this your best transformation yet — ready for the sun, the camera, and the mirror by {eventMonth}. All with a smart tracker that asks how you feel and adapts your plan around it..",
      notMet: "Feel lighter, stronger, and proud of how far you’ve come by the time you go. All with a smart tracker that asks how you feel and adapts your plan around it.."
    },
    {
      goalDriver: "A recent breakup or life change",
      met: "Rebuild strength, confidence, and control with a smart tracker that asks how you feel and adapts your plan around it..",
      notMet: "Rebuild strength, confidence, and control with a smart tracker that asks how you feel and adapts your plan around it.."
    },
    {
      goalDriver: "I want to feel confident in my body again",
      met: "Feel proud of what you see in the mirror — and how far you've come. All with a smart tracker that asks how you feel and adapts your plan around it..",
      notMet: "Feel proud of what you see in the mirror — and how far you've come. All with a smart tracker that asks how you feel and adapts your plan around it.."
    },
    {
      goalDriver: "I'm tired of feeling tired or unmotivated",
      met: "Finally feel energized, clear-headed, and back in control again with a smart tracker that asks how you feel and adapts your plan around it..",
      notMet: "Finally feel energized, clear-headed, and back in control again with a smart tracker that asks how you feel and adapts your plan around it.."
    },
    {
      goalDriver: "I’m doing this for my mental and emotional health",
      met: "Feel calmer, stronger, and more grounded — this is about more than just your body. All with a smart tracker that asks how you feel and adapts your plan around it..",
      notMet: "Feel calmer, stronger, and more grounded — this is about more than just your body. All with a smart tracker that asks how you feel and adapts your plan around it.."
    },
    {
      goalDriver: "I’ve let things slip and want to get back on track",
      met: "Get back in control — with momentum, structure, and progress you can feel by {eventMonth}. All with a smart tracker that asks how you feel and adapts your plan around it..",
      notMet: "Take back control — with small, daily wins that add up to real momentum. All with a smart tracker that asks how you feel and adapts your plan around it.."
    },
    {
      goalDriver: "I want to build discipline and stop starting over",
      met: "No more starting over. Just steady progress, one day at a time, with a smart tracker that asks how you feel and adapts your plan around it..",
      notMet: "No more starting over. Just steady progress, one day at a time, with a smart tracker that asks how you feel and adapts your plan around it.."
    },
    {
      goalDriver: "I just feel ready for a change",
      met: "Step into something better — and start feeling more like yourself again. All with a smart tracker that asks how you feel and adapts your plan around it..",
      notMet: "Step into something better — and start feeling more like yourself again. All with a smart tracker that asks how you feel and adapts your plan around it.."
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
    console.error("Dynamic message container (#dynamicMessageContainer) not found in the DOM.");
  }

  // 3) Create the summary container (BMI / Daily Cal / Water / Plan)
  const summaryContainer = document.createElement("div");
  summaryContainer.classList.add("fade-in", "summary-container");
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
    console.log(`Adjusted Water Intake for Program: ${programWaterIntake.toFixed(2)} L`);

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
        <h3 class="plan-heading">${name}'s All-In-One Tracker is Ready!</h3>
        <div class="plan-desc">
        <p>Your personalized tracker is ready — flip a card to see what makes it yours.<p>
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
  const userCals = maintenanceCalories > 0 ? maintenanceCalories : goalCalories;
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
  let selectedReviewName = "";
  let selectedReviewText = "";
  let beforeImgSrc = "#";
  let afterImgSrc = "#";

  // Determine which review to display.
  if (userGoal === "gain muscle") {
    // Muscle gain review.
    selectedReviewName = "Max";
    selectedReviewText = "I always struggled to build muscle — I didn’t know what I was doing wrong. This gave me structure, tracked everything, and just made it click. I actually look forward to training now.";
    beforeImgSrc = "../assets/harry_chest_before.jpg";
    afterImgSrc  = "../assets/harry_chest_after.jpg";
  } else if (userGoal === "lose weight" || userGoal === "improve body composition") {
    if (gender === "male") {
      // Male weight loss review.
      selectedReviewName = "Bob";
      selectedReviewText = "At first, I wasn’t sure I could stick with it. But everything’s laid out for you — no guessing. I’ve lost weight, my clothes fit better, and I feel like myself again.";
      beforeImgSrc = "../assets/lynn_before.JPEG";
      afterImgSrc  = "../assets/lynn_after.png";
    } else if (gender === "female") {
      // Female weight loss review.
      selectedReviewName = "Alice";
      selectedReviewText = "I didn’t expect much, but this actually changed how I see food and fitness. I’ve lost weight, I feel healthier, and I finally enjoy the process.";
      beforeImgSrc = "../assets/halima_back_before.jpg";
      afterImgSrc  = "../assets/halima_back_after.jpg";
    }
  } else {
    // Fallback default review.
    selectedReviewName = "Sam";
    selectedReviewText = "Default placeholder review: This program truly makes a difference.";
    beforeImgSrc = "#"; // Replace with the actual path.
    afterImgSrc = "#";   // Replace with the actual path.
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

  console.log("Testimonial updated:");
  console.log("Name:", selectedReviewName);
  console.log("Review Text:", selectedReviewText);
  console.log("Before Image Source:", beforeImgSrc);
  console.log("After Image Source:", afterImgSrc);
});

// Data array
document.addEventListener("DOMContentLoaded", () => {
  console.log("[JS] Setting up subheading-based scrolling...");

  const items = document.querySelectorAll(".wi2-left .wi2-item");
  const pinnedImage = document.getElementById("wi2-image");
  const pinnedDesc = document.getElementById("wi2-desc");

  // If not found, we bail
  if (!items.length || !pinnedImage || !pinnedDesc) {
    console.warn("[JS] Required elements not found. Check your HTML IDs/classes.");
    return;
  }

  /***************************************************
   * A) WHAT’S INCLUDED DATA
   ***************************************************/

  const whatsIncludedData = [
    {
      title: "Tailored From Day One (CT)",
      image: "../assets/1_tailored.png",
      desc: "Your tracker is tailored from the start — built around your goal, training frequency, and available equipment."
    },
    {
      title: "Track Workouts, Earn XP (CT)",
      image: "../assets/2_track_workouts.png",
      desc: "Log your workouts, earn XP, and get instant feedback — just like having a trainer guide you, every session."
    },
    {
      title: "Adaptive Progression Engine (PT)",
      image: "../assets/3_adaptive.png",
      desc: "Your tracker evolves with you — adjusting your workouts as you improve, stall, or regress to keep you moving forward."
    },
    {
      title: "Macro-Matched Meals (PT)",
      image: "../assets/4_macro_matched.png",
      desc: "No more guessing or tracking — meals are portioned to match your exact macros automatically and updated weekly."
    },
    {
      title: "Flexible Logging, Your Way (PT)",
      image: "../assets/5_flexible_logging.png",
      desc: "Log in one tap, customize meals, or skip when needed — your tracker adjusts for you."
    },
    {
      title: "Daily Streaks That Stick (CT)",
      image: "../assets/6_daily_streaks.png",
      desc: "Build streaks that unlock milestones — with encouragement that celebrates your wins and helps you stay on track when it counts."
    },
    {
      title: "Your Fitness Story, Visualized (PT)",
      image: "../assets/7_your_fitness_story.png",
      desc: "Your tracker doesn't just log data — it highlights trends, flags issues, and offers insights like a coach who's always paying attention."
    },
    {
      title: "Your Progress, Scored (PT)",
      image: "../assets/8_your_progress.png",
      desc: "One score that reflects your training, nutrition, and consistency — so you can see how far you’ve come."
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
    console.error("[JS] No subheadings found under .wi2-left .wi2-item! Check your HTML.");
    return;
  }
  if (!wi2Image || !wi2Desc) {
    console.error("[JS] #wi2-image or #wi2-desc is missing in the DOM! Check your HTML IDs.");
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
      console.warn("[JS] Invalid newIndex:", newIndex);
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
        descContent += "<p class='pt-extra-container'><span class='crown-emoji'>👑</span> <span class='pt-extra'>Included in the Pro Tracker</span></p>";
      }
      // if the title contains "(CT)", append a grey badge instead
      if (whatsIncludedData[newIndex].title.includes("(CT)")) {
        descContent +=
          "<p class='ct-extra-container'>" +
          "<span class='ct-extra'>Available in every plan</span>" +
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
      ? "<p class='ct-extra-container'><span class='ct-extra'>Available in every plan</span></p>"
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
    console.warn("Missing CTA elements. Check #floating-cta, #floatingCtaContainer, #ctaStopContainer");
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
      console.log("CTA clicked!");
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
    console.error("Floating CTA not found in the DOM.");
    return;
  }

  console.log("Floating CTA script loaded successfully.");

  // Wait 1500ms and then add the unique class to make it visible
  setTimeout(() => {
    floatingCTA.classList.add("cta-visible");
    console.log("Floating CTA faded in.");
  }, 1000);
});

/**********************************************/
/* A) DISCOUNT TIMER LOGIC (with indefinite)  */
/**********************************************/
document.addEventListener("DOMContentLoaded", function () {
  const now      = Date.now();
  const signupTs = Number(localStorage.getItem("signupTimestamp")   || 0);
  let   comebackEnd = Number(localStorage.getItem("sevenDayDiscountEnd") || 0);

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
  if (discountEndTime > now) {
    document.body.classList.add("discount-active");
  } else {
    document.body.classList.remove("discount-active");
  }

  const timerContainer     = document.getElementById("timerContainer");
  const countdownTimerEl   = document.getElementById("countdownTimer");

  function updateTimer() {
    const now  = Date.now();
    const diff = discountEndTime - now;
  
    // If the discount has expired…
    if (diff <= 0) {
      document.body.classList.remove("discount-active");
      localStorage.removeItem("sevenDayDiscountEnd");
      if (timerContainer) timerContainer.style.display = "none";
      removeDiscountPricing();
      const cardSubtext = document.querySelector(".card-subtext");
      if (cardSubtext) cardSubtext.remove();
      return;
    }
  
    // Keep the discount styling active
    document.body.classList.add("discount-active");
  
    // Break diff into h/m/s
    const totalSeconds = Math.floor(diff / 1000);
    const hours        = Math.floor(totalSeconds / 3600);
    const minutes      = Math.floor((totalSeconds % 3600) / 60);
    const seconds      = totalSeconds % 60;
  
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
      costPerDaySpecial.textContent = "£" + (9.99 / 30).toFixed(2);
      currencyTagSpecial.style.display = "block";
    }
  }

  setInterval(updateTimer, 1000);
  updateTimer();
});

function removeDiscountPricing() {
  // For 1-Week Program: revert to full price (e.g., £14.99 with cost per day £2.14)
  const price1WeekFull = document.getElementById("price1WeekFull");
  const price1WeekDiscount = document.getElementById("price1WeekDiscount");
  const costPerDay1Week = document.getElementById("costPerDay1Week");
  const currencyTag1Week = document.querySelector('[data-program="1-week"] .currency-tag');
  const perDay1Week = document.querySelector('[data-program="1-week"] .per-day');
  if (price1WeekFull && price1WeekDiscount && costPerDay1Week) {
    // Remove strikethrough to show full price
    price1WeekFull.style.textDecoration = "none";
    // Hide discount price element for 1-week
    price1WeekDiscount.style.display = "none";
    // Set cost per day for 1-week full price (example value, adjust if needed)
    costPerDay1Week.textContent = "£2.14";
    if (currencyTag1Week) currencyTag1Week.style.display = "block";
    if (perDay1Week) {
      perDay1Week.style.display = "block";
      perDay1Week.textContent = "per day";
    }
  }

  // For Pro Tracker Subscription (special card):
  const priceSpecialFull = document.getElementById("priceSpecialFull");
  const priceSpecialDiscount = document.getElementById("priceSpecialDiscount");
  const costPerDaySpecial = document.getElementById("costPerDaySpecial");
  const currencyTagSpecial = document.querySelector('[data-program="new"] .currency-tag');
  const perDaySpecial = document.querySelector('[data-program="new"] .per-day');
  if (priceSpecialFull && priceSpecialDiscount && costPerDaySpecial) {
    // Remove the strikethrough (so full price is visible)
    priceSpecialFull.style.textDecoration = "none";
    // Hide the discounted price element
    priceSpecialDiscount.style.display = "none";
    // Set the cost to the full price value (£29.99) for the subscription
    costPerDaySpecial.textContent = "£0.99";
    // Calculate cost per day based on full price: 29.99/30
    if (currencyTagSpecial) currencyTagSpecial.style.display = "block";
  }
}

/**********************************************/
/* D) SELECTING AN OFFER CARD (10 & 11 & 12)  */
/**********************************************/
document.addEventListener("DOMContentLoaded", function () {
  const offerCards = document.querySelectorAll(".offer-card");
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

  // If nothing is saved, automatically select the 4-week card on first load
  // If nothing is saved, automatically select the 1-week card on first load
  if (!currentlySelected) {
    const oneWeekCard = document.querySelector('.offer-card[data-program="1-week"]');
    if (oneWeekCard) {
      oneWeekCard.classList.add("selected");
      currentlySelected = oneWeekCard;
      toggleDetails(oneWeekCard, true);
      localStorage.setItem("selectedProgram", "1-week");
      updateCTA(oneWeekCard.dataset.program);
    }
  }

  // Add click listeners to each offer card (ignoring clicks on the toggle button)
  offerCards.forEach(card => {
    card.addEventListener("click", function (e) {
      // If the click came from the toggle button, ignore it
      if (e.target.classList.contains("toggle-details")) return;

      // If this card is already selected, do nothing
      if (currentlySelected === card) return;

      // If a different card is selected...
      if (currentlySelected && currentlySelected !== card) {
        // For both special and non-special cards, call toggleDetails to collapse.
        toggleDetails(currentlySelected, false);
        currentlySelected.classList.remove("selected");
      }


      // Select the new card
      card.classList.add("selected");
      currentlySelected = card;
      localStorage.setItem("selectedProgram", card.dataset.program);

      const planName = card.querySelector('.duration strong').textContent;
      localStorage.setItem("planName", planName);

      // For the special card, always auto-expand; for others, call toggleDetails as before.
      if (card.dataset.program === "new") {
        toggleDetails(card, true);
      } else {
        toggleDetails(card, true);
      }
      updateCTA(card.dataset.program);
    });
  });

  // Attach a separate click listener for the special card’s toggle button (if someone taps directly on it)
  const specialCard = document.querySelector('.offer-card[data-program="new"]');
  if (specialCard) {
    const toggleBtn = specialCard.querySelector(".toggle-details");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation(); // Prevent the card-level click handler from firing
        if (specialCard.classList.contains("expanded")) {
          toggleDetails(specialCard, false);
        } else {
          toggleDetails(specialCard, true);
        }
      });
    }
  }

  /**
   * toggleDetails – (special card branch remains as you already have it)
   */
  function toggleDetails(card, expand) {
    const dataProgram = card.dataset.program;
    if (dataProgram === "new") {
      const additionalInfo = card.querySelector(".additional-info");
      const toggleButton = card.querySelector(".toggle-details");
      if (!additionalInfo || !toggleButton) return;

      // Use dataset.expanded to keep track of the current state.
      const isExpanded = card.dataset.expanded === "true";
      // If the card is already in the desired state, do nothing.
      if (expand === isExpanded) {
        return;
      }

      if (expand) {
        // Mark the card as expanded.
        card.dataset.expanded = "true";
        card.classList.add("expanded");

        additionalInfo.style.transition = "height 0.5s ease";
        additionalInfo.style.overflow = "hidden";
        toggleButton.style.transition = "opacity 0.3s ease";

        // Start the expansion: set display to block and height from 0
        additionalInfo.style.display = "block";
        additionalInfo.style.height = "0px";
        additionalInfo.offsetHeight; // force reflow
        const fullHeight = additionalInfo.scrollHeight;
        additionalInfo.style.height = fullHeight + "px";

        toggleButton.style.display = "block";
        toggleButton.style.opacity = "1";
        toggleButton.textContent = "See less";

        // Once the expansion transition finishes, scroll to the disclaimer element.
        additionalInfo.addEventListener("transitionend", function handler(e) {
          if (e.propertyName === "height") {
            additionalInfo.removeEventListener("transitionend", handler);
            const disclaimerEl = document.getElementById("offerDisclaimer");
            if (disclaimerEl && !isElementFullyInViewport(disclaimerEl)) {
              disclaimerEl.scrollIntoView({ behavior: "smooth", block: "end" });
            }
          }
        });
      } else {
        // Mark the card as collapsed.
        card.dataset.expanded = "false";
        card.classList.remove("expanded");

        additionalInfo.style.transition = "height 0.5s ease";
        additionalInfo.style.height = "0px";
        toggleButton.style.transition = "opacity 0.3s ease";
        toggleButton.style.opacity = "0";

        additionalInfo.addEventListener("transitionend", function handler(e) {
          if (e.propertyName === "height") {
            additionalInfo.removeEventListener("transitionend", handler);
            additionalInfo.style.display = "none";
            toggleButton.textContent = "See more";
            toggleButton.style.opacity = "1";
          }
        });
      }
    } else {
      // Existing logic for non-special cards...
      const detailsEl = document.getElementById(`details-${dataProgram}`);
      const seeMoreLink = card.querySelector(`[data-target="details-${dataProgram}"]`);
      if (!detailsEl || !seeMoreLink) return;
      if (expand) {
        detailsEl.style.display = "block";
        seeMoreLink.textContent = "See less";
      } else {
        detailsEl.style.display = "none";
        seeMoreLink.textContent = "See more";
      }
    }
  }

  function updateCTA(selectedProgram) {
    const finishBtn = document.getElementById("offerFinishBtn");
    if (!finishBtn) return;
    if (selectedProgram === "new") {
      finishBtn.style.backgroundColor = "#9333EA";
    } else {
      finishBtn.style.backgroundColor = "#007BFF";
    }
  }
});

/**********************************************/
/* E) FINISH BUTTON                           */
/**********************************************/
document.addEventListener("DOMContentLoaded", function () {
  const finishBtn = document.getElementById("offerFinishBtn");
  if (!finishBtn) return;

  finishBtn.addEventListener("click", () => {
    const selected = localStorage.getItem("selectedProgram");
    const map = {
      "1-week":  "oneWeek",
      "4-week":  "fourWeek",
      "12-week": "twelveWeek",
      "new":     "subscription"
    };
    const purchaseType = map[selected];
    if (!purchaseType) return alert("Please select a program first.");
  
    // Check if the 10-minute discount is still active
    const discountEnd = Number(localStorage.getItem("discountEndTime") || 0);
    const isDiscountActive = discountEnd > Date.now();
  
    // SPECIAL CASE: 1-Week
    if (purchaseType === "oneWeek") {
      localStorage.setItem("pendingPurchaseType", purchaseType);
  
      if (isDiscountActive) {
        // free
        localStorage.setItem("planPrice", "FREE!");
        return window.location.href = "sign-up.html";
      } else {
        // no longer free → paid at £24.99
        localStorage.setItem("planPrice", "£24.99");
        return window.location.href = `sign-up-checkout.html?plan=${selected}`;
      }
    }
  
    // All other plans always go through checkout
    localStorage.setItem("pendingPurchaseType", purchaseType);
  
    // save whatever price was showing on the card
    (function savePlanPrice() {
      const card = document.querySelector(`.offer-card[data-program="${selected}"]`);
      let priceText = "";
      if (card) {
        const disc = card.querySelector(".discount-price");
        if (disc && getComputedStyle(disc).display !== "none") {
          priceText = disc.textContent.trim();
        } else {
          priceText = (card.querySelector(".full-price span") || card.querySelector(".full-price"))
                        .textContent.trim();
        }
      }
      localStorage.setItem("planPrice", priceText);
    })();
  
    window.location.href = `sign-up-checkout.html?plan=${selected}`;
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const claimProgramBtn = document.getElementById("claimProgramBtn");
  const discountSection = document.getElementById("discountSection");

  if (claimProgramBtn && discountSection) {
    claimProgramBtn.addEventListener("click", function () {
      discountSection.scrollIntoView({ behavior: "smooth" });
    });
  }
});

//Testimonials
document.addEventListener("DOMContentLoaded", () => {

  // Fade-in elements
  const fadeInElements = document.querySelectorAll(".fade-in");
  fadeInElements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add("visible");
    }, index * 500);
  });

  // Example reviews
  const reviews = [
    {
      name: "Lee",
      text: "I’d tried bootcamps, meal plans — nothing stuck. This finally made everything click. My workouts, meals, and progress were all in one place. I’ve lost 8kg, but more than that, I don’t feel lost anymore.",
      beforeImage: "../assets/lynn_before.JPEG",
      afterImage: "../assets/lynn_after.png",
      testImage:  "../assets/5-stars.png",
    },
    {
      name: "David",
      text: "I used to wing it at the gym. I never knew if I was doing enough. Seeing my workouts and progress adapt over time changed everything. I’ve gained 6kg of muscle — and confidence too.",
      beforeImage: "../assets/harry_chest_before.jpg",
      afterImage:  "../assets/harry_chest_after.jpg",
      testImage:  "../assets/5-stars.png",
    },
    {

      name: "Maria",
      text: "Strict plans never worked for me. This didn’t just tell me what to do — it fit into my life. Logging workouts and meals became second nature. For the first time, I feel in control.",
      beforeImage: "../assets/halima_back_before.jpg",
      afterImage:  "../assets/halima_back_after.jpg",
      testImage:  "../assets/5-stars.png",
    },
  ];

  const testimonialWrapper = document.querySelector(".testimonial-container");
  const sliderContainer    = document.querySelector(".testimonial-slider");
  const prevBtn            = document.querySelector(".arrow-button.prev");
  const nextBtn            = document.querySelector(".arrow-button.next");
  const dotsContainer      = document.querySelector(".dots-container");

  // 2) state
  let currentIndex = 0;
  let startX       = 0;
  let endX         = 0;

  // 3) build the slides
  function createTestimonialCards() {
    sliderContainer.innerHTML = "";
    reviews.forEach((review) => {
      const card = document.createElement("div");
      card.classList.add("testimonial-card");
      card.innerHTML = `
        <div class="images">
          <div class="before">
            <img src="${review.beforeImage}" alt="Before"><p>Before</p>
          </div>
          <div class="after">
            <img src="${review.afterImage}" alt="After"><p>After</p>
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
      if      (startX - endX > 50) goNext();
      else if (endX - startX > 50) goPrev();
    });
  }

  // 7) on resize, recalc
  window.addEventListener("resize", updateSlider);

  // 8) init
  createTestimonialCards();
  createDots();
  enableSwipe();
  nextBtn.addEventListener("click", goNext);
  prevBtn.addEventListener("click", goPrev);
  updateSlider();
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
    toggleButton.textContent = "See more";
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
