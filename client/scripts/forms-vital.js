// const fadeInElements = document.querySelectorAll(".fade-in");
// fadeInElements.forEach((element, index) => {
//   setTimeout(() => {
//     element.classList.add("visible");
//   }, index * 500);
// });

// Only set this if it hasn't already been set
if (!localStorage.getItem('startedForm')) {
  localStorage.setItem('startedForm', 'true');

  if (window.ttq) {
    ttq.track('ViewContent', {
      content_name: 'Form Started',
    });
  }
}

window.addEventListener('beforeunload', () => {
  const startedForm = localStorage.getItem('startedForm');

  if (startedForm && window.ttq) {
    ttq.track('FormAbandon', {
      content_name: 'Mid-Funnel Exit',
    });
    localStorage.removeItem('startedForm'); // Prevent double events
  }
});

let rotatingMsgInterval;
let rotatingMessageIndex = 0;
let obeseGainWarnShown = false;

/* ==== unit‑helpers ==== */
function cmFromFtIn(ft, inch = 0) {
  return ft * 30.48 + inch * 2.54;
}
function kgFromLbs(lbs) { return lbs * 0.45359237; }
function lbsFromKg(kg) { return kg / 0.45359237; }

/* current selection while the question is on screen */
let heightUnit = "cm";   // "cm" | "ft"
let weightUnit = "kg";   // "kg" | "lbs"

const MIN_RT_EXERCISES = 3;

/*******************************************************
 * 1) QUESTION ARRAY + GLOBAL VARIABLES
 *******************************************************/

const questions = [
  {
    // this becomes the big heading:
    question: "Let's build your dream body",

    // this gets rendered as the small sub-text under the heading:
    extraText: "Select your body type",

    // your existing options stay the same:
    options: ["Slim", "Average", "Heavy"],
    type: "radio",
    key: "BodyType"
  },
  {
    question: "Choose the body you want",
    options: [
      "Athlete",
      "Hero",
      "Bodybuilder"
    ],
    type: "radio",
    key: "desiredBodyType"
  },
  {
    question: "What is your date of birth?",
    options: ["(DOB Box)"],
    type: "date",
    key: "dob",
    validateAge: true,
  },
  {
    question: "What is your gender?",
    options: ["Male", "Female", "Other"],
    type: "radio",
    key: "gender",
  },
  {
    question: "Are you currently pregnant or recently post-natal?",
    options: ["Pregnant", "Post-Natal", "None of the above"],
    type: "radio",
    key: "pregnancyStatus",
    condition: {
      key: "gender",
      value: "female"
    }
  },
  {
    question: "What is your height?",
    options: ["(Text Box, numbers only)"],
    type: "number",
    placeholder: "Enter your height",
    key: "height",
  },
  {
    question: "What is your weight?",
    options: ["(Text Box, numbers only)"],
    type: "number",
    placeholder: "Enter your weight",
    key: "weight",
  },

  // Phase 2: Goals & Motivation
  {
    question: "What is your goal?",
    options: [
      { display: "🔥 Lose Weight", value: "Lose Weight" },
      { display: "💪 Gain Muscle", value: "Gain Muscle" },
      { display: "⚖️ Improve Body Composition (Build Muscle & Lose Fat)", value: "Improve Body Composition (Build Muscle & Lose Fat)" }
    ],
    type: "radio",
    key: "goal",
  },
  {
    question: "What’s driving your goal right now?",
    options: [
      { display: "💍 A wedding or special event", value: "A wedding or special event" },
      { display: "✈️ An upcoming holiday", value: "An upcoming holiday" },
      { display: "💔 A recent breakup or life change", value: "A recent breakup or life change" },
      { display: "🪞 I want to feel confident in my body again", value: "I want to feel confident in my body again" },
      { display: "😩 I'm tired of feeling tired or unmotivated", value: "I'm tired of feeling tired or unmotivated" },
      { display: "🧠 I’m doing this for my mental and emotional health", value: "I’m doing this for my mental and emotional health" },
      { display: "🧭 I’ve let things slip and want to get back on track", value: "I’ve let things slip and want to get back on track" },
      { display: "📈 I want to build discipline and stop starting over", value: "I want to build discipline and stop starting over" },
      { display: "🌱 I just feel ready for a change", value: "I just feel ready for a change" },
    ],
    type: "radio",
    key: "goalDriver"
  },
  {
    question: "What is your goal weight?",
    type: "number",
    placeholder: "Enter your goal weight",
    key: "userGoalWeight"
  },
  {
    question: "By when do you want to achieve this goal?",
    type: "date",
    placeholder: "Select target date",
    key: "userGoalDate",
    validateAge: false,
  },
  {
    question: "How hard are you ready to go?",
    options: [
      { display: "🔥 Slight effort: A steady and manageable pace.", value: "Slight effort: A steady and manageable pace." },
      { display: "🔥🔥 Moderate effort: A balanced and sustainable challenge.", value: "Moderate effort: A balanced and sustainable challenge." },
      { display: "🔥🔥🔥 High effort: Requires full commitment and consistency.", value: "High effort: Requires full commitment and consistency." },
    ],
    type: "radio",
    key: "effortLevel",
  },

  // Phase 3: Fitness Background & Preferences
  {
    question: "Have you followed a structured workout program before?",
    options: ["Yes", "No", "Partially"],
    type: "radio",
    key: "structuredProgram",
  },
  {
    question: "What would you rate your fitness level?",
    options: [
      { display: "💪 Beginner", value: "Beginner" },
      { display: "💪💪 Intermediate", value: "Intermediate" },
      { display: "💪💪💪 Advanced", value: "Advanced" }
    ],
    type: "radio",
    key: "fitnessLevel",
  },
  {
    question: "How active are you?",
    options: [
      "Sedentary (little to no exercise)",
      "Lightly active (light exercise/sports 1–3 days per week)",
      "Moderately active (moderate exercise/sports 3–5 days per week)",
      "Very active (hard exercise/sports 6–7 days per week)",
      "Extra active (very hard exercise, physical job, or training twice a day)",
    ],
    type: "radio",
    key: "activityLevel",
  },
  {
    question: "Where do you plan to work out?",
    options: ["Gym", "Home"],
    type: "radio",
    key: "workoutLocation",
  },
  {
    question: "What equipment is available to you?",
    options: [
      "Dumbbells",
      "Barbells",
      "Bench",
      "Rack",
      "Kettlebells",
      "Cables",
      "Machines",
      "Smith Machine",
      // "Pull-Up Bar",
      // "Dip Station",
      "None of the above",
    ],
    type: "checkbox",
    key: "equipment",
  },
  {
    question: "Do you have any equipment preferences?",
    options: [
      "Dumbbells",
      "Barbells",
      "Kettlebells",
      "Cables",
      "Machines",
      "Smith Machine",
      // "Bodyweight",
      "None of the above",
    ],
    type: "checkbox",
    key: "equipmentPreference",
  },
  // {
  //   question: "What kind of training do you enjoy most?",
  //   options: [
  //     { display: "🏋️ Strength Training", value: "Strength Training" },
  //     { display: "🏃 Cardio", value: "Cardio" },
  //     { display: "⏱️ HIIT", value: "HIIT" },
  //     { display: "🔀 Mix", value: "Mix" },
  //   ],
  //   type: "radio",
  //   key: "trainingPreference",
  // },
  {
    question: "Are there any muscle groups you want to focus on?",
    options: ["Chest", "Back", "Shoulders", "Arms", "Legs", "None of the above"],
    type: "checkbox",
    key: "muscleFocus",
  },
  {
    question: "How many days can you work out per week?",
    options: ["1", "2", "3", "4", "5", "6", "7"],
    type: "radio",
    key: "workoutDays",
  },
  {
    question: "How long can your sessions be?",
    options: ["0-30 Minutes", "30-45 Minutes", "45-60 Minutes", "60+ Minutes"],
    type: "radio",
    key: "sessionDuration",
  },

  // Phase 4: Health Considerations
  {
    question: "Any injuries or issues we should know about?",
    options: [
      "Back",
      "Knee",
      "Shoulder",
      "Elbow",
      "Wrist",
      "Ankle",
      "Hip",
      "None of the above",
    ],
    type: "checkbox",
    key: "injuries",
  },

  // Phase 5: Nutrition
  {
    question: "Do you have any dietary restrictions?",
    options: ["Vegetarian", "Vegan", "No Restrictions"],
    type: "radio",
    key: "dietaryRestrictions"
  },
  {
    question: "Do you have any food allergies?",
    options: ["Dairy", "Nuts", "Gluten", "Shellfish", "Soy", "None of the above"],
    type: "checkbox",
    key: "foodAllergies"
  },
  // {
  //   question: "How many meals per day do you prefer?",
  //   options: [
  //     // { display: "🍽️ 2 meals", value: "2 meals" },
  //     { display: "🍽️ 3 meals", value: "3 meals" },
  //     { display: "🍽️🍽️ 4 meals", value: "4 meals" },
  //   ],
  //   type: "radio",
  //   key: "mealFrequency",
  // },
  {
    question: "What is your name?",
    options: ["(Text Box)"],
    type: "text",
    placeholder: "Enter your name here",
    key: "name",
  },
];

const loadingMessagesAll = {
  muscleGain: [
    "Locating surplus-worthy snacks…",
    "Increasing your training volume… and your sleeves.",
    "Configuring progressive overload… gains protocol initiated.",
    "Dialing in your protein power-ups…",
    "Expanding your upper chest and your confidence…",
    "Scouting heavy compound lifts for maximum growth...",
    "Warming up your nervous system for heavy sets...",
    "Stocking the pantry for lean bulk season...",
    "Aligning hypertrophy with structured progression...",
    "Reinforcing your anabolic environment..."
  ],
  bodyRecomposition: [
    "Balancing strength and symmetry…",
    "Fine-tuning your macros for maximum impact.",
    "Aligning workouts with recovery… recomposition incoming.",
    "Sculpting the new you, one smart decision at a time.",
    "Switching to hybrid mode: train hard, recover smarter.",
    "Syncing strength gains with body fat precision…",
    "Targeting stubborn zones without burning out…",
    "Merging smart volume with strategic deficit…",
    "Loading split routines that do both…",
    "Your recomp blueprint is coming together..."
  ],
  weightLoss: [
    "Initiating fat loss mode — steady, sustainable, smart.",
    "Strategizing calorie precision strikes…",
    "Prioritizing lean muscle retention…",
    "Mapping your metabolic runway… takeoff soon.",
    "Setting realistic goals, not shortcuts.",
    "Calibrating smart cardio recommendations…",
    "Scanning meals for low-calorie density heroes...",
    "Balancing energy intake for sustainable drops...",
    "Activating fat-loss without the burnout...",
    "Reinforcing a results-first, crash-free approach..."
  ],
  featureBased: [
    "Analyzing your effort level…",
    "Loading adaptive workout logic…",
    "Mapping your weekly training split…",
    "Building your nutrition timeline…",
    "Rendering your lo-fi tutorial vault…",
    "Designing your recap dashboard…",
    "Configuring your Progress Score engine…",
    "Prepping your meal swap system…",
    "Wiring up your consistency streak tracker...",
    "Preloading your Daily Summary feedback module...",
    "Initiating intelligent workout suggestions…",
    "Sharpening your recovery tracking tools...",
    "Crafting your program as we speak…",
    "Finalizing your week-by-week strategy..."
  ],
  personality: [
    "If this loads too fast, you’ll miss our humor.",
    "Lo-fi beats loading… please vibe responsibly.",
    "Checking hydration levels… just kidding (or are we?).",
    "Running system check: confidence > 9000.",
    "Generating a program Tony Stark would probably envy.",
    "Spawning gains in your fitness universe…",
    "Polishing dumbbells for extra shine…",
    "Removing burpees from existence (you're welcome).",
    "Re-routing the motivation signal to your brain…",
    "Translating effort into XP...",
    "Applying glow-up filter to your progress graphs...",
    "Warming up the encouragement engine…",
  ]
};

// We track multi‐select
let cumulativeAnswers = [];
let selectedOptions = [];
let focusedMuscleGroups = [];

// UNCHANGED
const workoutAvailabilityMultipliers = {
  1: 0.6,
  2: 0.75,
  3: 0.9,
  4: 1.0,
  5: 1.1,
  6: 1.05,
  7: 1.0,
};

import { EXERCISE_DATABASE } from './modules/exercise.js';
window.allExercises = EXERCISE_DATABASE;

// Bodyweight fallback
const BODYWEIGHT_EXERCISES = EXERCISE_DATABASE.filter(e =>
  e.equipmentNeeded.length === 1 && e.equipmentNeeded[0] === "Bodyweight"
);

const warmUpRoutines = {
  push: [
    { name: "Arm Circles", reps: "10 reps", rpe: 5 },
    { name: "Scapular Push-Ups", reps: "10 reps", rpe: 5 },
    { name: "Wall Slides", reps: "10 reps", rpe: 5 }
  ],
  pull: [
    { name: "Shoulder Rolls", reps: "10 reps", rpe: 5 },
    { name: "Cat-Cow Stretch", reps: "10 reps", rpe: 5 },
    { name: "Standing Ys & Ts", reps: "10 reps", rpe: 5 }
  ],
  legs: [
    { name: "Bodyweight Squats", reps: "10 reps", rpe: 5 },
    { name: "Leg Swings (Front & Side)", reps: "10 reps", rpe: 5 },
    { name: "Glute Bridges", reps: "10 reps", rpe: 5 }
  ],
  generic: [
    { name: "Jumping Jacks", reps: "10 reps", rpe: 5 },
    { name: "High Knees", reps: "10 reps", rpe: 5 },
    { name: "Hip Circles", reps: "10 reps", rpe: 5 }
  ],
};

const coolDownMap = {
  push: [
    { name: "Chest Stretch", duration: "30 seconds", rpe: 5 },
    { name: "Overhead Triceps Stretch", duration: "30 seconds", rpe: 5 }
  ],
  pull: [
    { name: "Seated Forward Fold", duration: "30 seconds", rpe: 5 },
    { name: "Cross-Body Shoulder Stretch", duration: "30 seconds", rpe: 5 }
  ],
  legs: [
    { name: "Standing Quad Stretch", duration: "30 seconds", rpe: 5 },
    { name: "Seated Hamstring Stretch", duration: "30 seconds", rpe: 5 }
  ],
  generic: [
    { name: "Child’s Pose", duration: "30 seconds", rpe: 5 },
    { name: "Standing Side Stretch", duration: "30 seconds", rpe: 5 }
  ]
};

const staticCoolDownStretches = [
  { name: "Standing Quadriceps Stretch", duration: "30 seconds", rpe: 3 },
  { name: "Seated Hamstring Stretch", duration: "30 seconds", rpe: 3 },
  { name: "Chest Opener Stretch", duration: "30 seconds", rpe: 3 },
  { name: "Upper Back Stretch", duration: "30 seconds", rpe: 3 },
];

import { mealDatabase } from './modules/meals.js';

/***********************************************************************
 * 3) BMI / MAINTENANCE / GOAL CALCS
 ***********************************************************************/

function updateAnthroMetrics() {
  if (formData.weight && formData.height) {
    calculateBMI();
  }
  if (formData.weight && formData.height &&
    formData.age && formData.gender && formData.activityLevel) {
    calculateMaintenanceCalories();
    calculateBaseProjections();
  }
}

const equipmentQuestionIndex = questions.findIndex(q => q.key === "equipment");

if (!localStorage.getItem("mealFrequency")) {
  localStorage.setItem("mealFrequency", "4");
}

const formData = {
  name: "",
  weight: null,
  height: null,
  age: null,
  gender: "",
  workoutAvailability: [0],
  heightUnit: "cm",
  weightUnit: "kg",
  heightRaw: null,    // { unit: "cm", value: "172" } or { unit:"ft/in", ft:"5", in:"7" }
  weightRaw: null,    // { unit: "kg", value: "63" } or { unit: "lbs", value: "140" }
  goalWeightInputTemp: "",
  trainingPreference: "Strength Training",
  mealFrequency: localStorage.getItem("mealFrequency"),
};


function calculateBMI() {
  const weight = formData.weight;
  const height = formData.height;
  if (weight && height) {
    const hm = height / 100;
    const bmi = (weight / (hm * hm)).toFixed(2);
    let category;
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 24.9) category = "Healthy";
    else if (bmi < 29.9) category = "Overweight";
    else category = "Obese";
    // console.log(`BMI: ${bmi}, Category: ${category}`);
    localStorage.setItem("userBMI", bmi);
    localStorage.setItem("bmiCategory", category);
    localStorage.setItem("weight", weight);
    localStorage.setItem("height", height);
    return { bmi, category };
  } else {
    // console.warn("Weight or height missing for BMI calc.");
    return null;
  }
}

const activityMultipliers = {
  "sedentary (little to no exercise)": 1.2,
  "lightly active (light exercise/sports 1–3 days per week)": 1.375,
  "moderately active (moderate exercise/sports 3–5 days per week)": 1.55,
  "very active (hard exercise/sports 6–7 days per week)": 1.725,
  "extra active (very hard exercise, physical job, or training twice a day)": 1.9,
};

function calculateMaintenanceCalories() {
  const w = formData.weight;
  const h = formData.height;
  const a = formData.age;
  const g = formData.gender;
  const act = formData.activityLevel;

  // If ANY are missing, exit without calculating.
  if (!w || !h || !a || !g || !act) {
    // console.log("Missing data for maintenance cals calc. Will try again later.");
    return null;
  }

  let bmr;
  if (g.toLowerCase() === "male") {
    bmr = 10 * w + 6.25 * h - 5 * a + 5;
  } else if (g.toLowerCase() === "female") {
    bmr = 10 * w + 6.25 * h - 5 * a - 161;
  } else {
    // console.error("Gender not recognized.");
    return null;
  }

  const multi = activityMultipliers[act.toLowerCase()];
  if (!multi) {
    // console.error(`Invalid activity level: "${act}"`);
    return null;
  }

  const maintenance = Math.round(bmr * multi);
  // console.log(`BMR: ${bmr.toFixed(1)}, Multi: ${multi} => Maintenance: ${maintenance}`);

  localStorage.setItem("maintenanceCalories", maintenance);
  return maintenance;
}

function calculateGoalCalories() {
  const maintenance = parseInt(localStorage.getItem("maintenanceCalories"), 10);
  let fitnessGoal = formData.goal;
  const gender = formData.gender;
  if (!localStorage.getItem("gender") && gender) {
    localStorage.setItem("gender", gender);
  }
  if (!maintenance || !fitnessGoal) {
    // console.error("Missing maintenance or goal for cals.");
    return;
  }
  fitnessGoal = fitnessGoal.toLowerCase();
  const out = {};
  const effMult = { slight: 0.1, moderate: 0.2, high: 0.3 };
  const calFloor = (gender === "male") ? 1500 : 1200;
  switch (fitnessGoal) {
    case "lose weight":
      out.slightDeficit = Math.max(Math.round(maintenance * (1 - effMult.slight)), calFloor);
      out.moderateDeficit = Math.max(Math.round(maintenance * (1 - effMult.moderate)), calFloor);
      out.intenseDeficit = Math.max(Math.round(maintenance * (1 - effMult.high)), calFloor);
      break;
    case "gain muscle":
      out.slightSurplus = Math.round(maintenance * (1 + effMult.slight));
      out.moderateSurplus = Math.round(maintenance * (1 + effMult.moderate));
      out.intenseSurplus = Math.round(maintenance * (1 + effMult.high));
      break;
    case "improve body composition (build muscle & lose fat)":
      out.maintenance = maintenance;
      out.flexibleRange = {
        slightDeficit: Math.max(Math.round(maintenance * 0.95), calFloor),
        slightSurplus: Math.round(maintenance * 1.05),
      };
      break;
    default:
      // console.error(`Unknown goal: ${fitnessGoal}`);
      return;
  }
  localStorage.setItem("goalCalories", JSON.stringify(out));

  const eLevel = formData.effortLevel || "moderate";
  let selected;
  if (fitnessGoal === "improve body composition (build muscle & lose fat)") {
    selected = out.maintenance;
  } else {
    switch (eLevel) {
      case "slight": selected = out.slightDeficit || out.slightSurplus; break;
      case "moderate": selected = out.moderateDeficit || out.moderateSurplus; break;
      case "high": selected = out.intenseDeficit || out.intenseSurplus; break;
      default: selected = out.maintenance || out.flexibleRange?.slightSurplus;
    }
  }
  localStorage.setItem("selectedCalories", selected);
  // console.log(`Selected Calories for effort "${eLevel}": ${selected}`);
  return out;
}

const defaultBaseProjections = { fatLoss: 6.0, muscleGain: 3.0 };
const fitnessLevelMultipliers = { beginner: 1.25, intermediate: 1.0, advanced: 0.65 };

function roundToOneDecimal(v) { return Math.round(v * 10) / 10; }

function calculateBaseProjections() {
  const mCals = parseInt(localStorage.getItem("maintenanceCalories"), 10);
  const bmiCat = localStorage.getItem("bmiCategory");

  // Check for required data: maintenance calories, BMI category, and goal.
  // (You might also consider checking that formData.goal exists.)
  const g = formData.goal ? formData.goal.toLowerCase() : "improve body composition (build muscle & lose fat)";

  if (!mCals || !bmiCat || !g) {
    // console.error("Missing maintenance cals, BMI cat, or goal for base projections.");
    return null;
  }

  const eLevel = formData.effortLevel || "moderate";
  const wDays = formData.workoutDays || 3;
  const fLevel = formData.fitnessLevel || "intermediate";

  let baseFat = defaultBaseProjections.fatLoss;
  let baseMuscle = defaultBaseProjections.muscleGain;

  // Adjust for underweight users aiming to lose weight.
  if (bmiCat === "Underweight" && g === "lose weight") {
    // console.warn("User underweight => restricting weight loss => forcing muscle gain instead.");
    baseFat = 0;
    baseMuscle = 2.0;
    formData.goal = "gain muscle";
    alert("You are underweight. Focusing on muscle gain or maintenance is recommended.");
  }

  const goalMultipliers = {
    "lose weight": { fatLoss: 0.9, muscleGain: 0.1 },
    "gain muscle": { fatLoss: 0.2, muscleGain: 0.8 },
    "improve body composition (build muscle & lose fat)": { fatLoss: 0.5, muscleGain: 0.5 },
  };
  const effMultipliers = { slight: 0.8, moderate: 1.0, high: 1.15 };
  const wMult = workoutAvailabilityMultipliers[wDays] || 1.0;
  const fMult = fitnessLevelMultipliers[fLevel] || 1.0;

  let gf = goalMultipliers[g] || goalMultipliers["improve body composition (build muscle & lose fat)"];

  let adjFat = roundToOneDecimal(baseFat * gf.fatLoss * effMultipliers[eLevel] * wMult * fMult);
  let adjMuscle = roundToOneDecimal(baseMuscle * gf.muscleGain * effMultipliers[eLevel] * wMult * fMult);

  const projectedWeight = formData.weight - adjFat;
  const minWeight = 18.5 * Math.pow(formData.height / 100, 2);

  if (projectedWeight < minWeight) {
    // console.warn("Projected weight < safe BMI => adjusting fat loss down.");
    adjFat = roundToOneDecimal(Math.max(formData.weight - minWeight, 0));
  }

  // console.log("Projections => FatLoss:", adjFat, " MuscleGain:", adjMuscle);
  localStorage.setItem("goalBasedProjections", JSON.stringify({ fatLoss: adjFat, muscleGain: adjMuscle }));

  return { adjustedFatLoss: adjFat, adjustedMuscleGain: adjMuscle };
}

/***********************************************************************
 * 4) FORM HANDLING
 ***********************************************************************/

const questionText = document.querySelector(".form-question h2");
const optionsContainer = document.querySelector(".form-options ol");
const nextButton = document.getElementById("next-button");
const progressBarFill = document.querySelector(".progress-bar-fill");


let currentQuestionIndex = 0;

function handleInputUpdate(currentQuestion) {
  return (e) => {
    formData[currentQuestion.key] =
      currentQuestion.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    // console.log(`Updated ${currentQuestion.key}:`, formData[currentQuestion.key]);

    // Only call BMI calc if weight and height are set (and non-zero)
    if (["weight", "height"].includes(currentQuestion.key)) {
      if (formData.weight && formData.height) {
        calculateBMI();
      } else {
        // console.warn("Weight or height missing for BMI calc.");
      }
    }

    // Only call maintenance calories and base projections if all inputs are present.
    if (["weight", "height", "age", "gender", "activityLevel"].includes(currentQuestion.key)) {
      if (formData.weight && formData.height && formData.age && formData.gender && formData.activityLevel) {
        // At this point we know all the necessary fields are available.
        calculateMaintenanceCalories();
        calculateBaseProjections();
      } else {
        // console.log("Waiting for all fields (weight, height, age, gender, activityLevel) before calculating maintenance.");
      }
    }
  };
}

function calculateAge(dob, validate = true) {
  if (!dob) {
    // console.error("DOB missing/invalid.");
    return { valid: false, age: null };
  }
  const birth = new Date(dob);
  if (isNaN(birth)) {
    // console.error("Invalid DOB format.");
    return { valid: false, age: null };
  }
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  if (validate) {
    if (age > 110) {
      return { valid: false, age };
    }
    localStorage.setItem("age", age);
    return { valid: true, age };
  }
  return { valid: true, age };
}

function toggleNextButtonState() {
  const currentQ = questions[currentQuestionIndex];
  const nextButton = document.getElementById("next-button");
  let isInputValid = false;

  // HEIGHT question (cm ↔ ft/in)
  if (currentQ.key === "height") {
    if (heightUnit === "cm") {
      const v = optionsContainer.querySelector(".h-cm")?.value;
      isInputValid = !!v && v.trim() !== "";
    } else {
      const ft = optionsContainer.querySelector(".h-ft")?.value;
      // inches optional, so only ft is required
      isInputValid = !!ft && ft.trim() !== "";
    }

    // WEIGHT question (kg ↔ lbs)
  } else if (currentQ.key === "weight") {
    if (weightUnit === "kg") {
      const v = optionsContainer.querySelector(".w-kg")?.value;
      isInputValid = !!v && v.trim() !== "";
    } else {
      const v = optionsContainer.querySelector(".w-lbs")?.value;
      isInputValid = !!v && v.trim() !== "";
    }

    // GOAL WEIGHT question (always number input, with unit toggle handled elsewhere)
  } else if (currentQ.key === "userGoalWeight") {
    const v = optionsContainer.querySelector(".goal-weight-input")?.value;
    isInputValid = !!v && v.trim() !== "";

    // All other text/number inputs
  } else if (currentQ.type === "text" || currentQ.type === "number") {
    const input = optionsContainer.querySelector("input");
    isInputValid = !!input && input.value.trim() !== "";

    // Date inputs
  } else if (currentQ.type === "date") {
    const input = optionsContainer.querySelector("input[type='date']");
    isInputValid = !!input && input.value.trim() !== "";

    // Radio buttons
  } else if (currentQ.type === "radio") {
    isInputValid = !!optionsContainer.querySelector("li.selected");

    // Checkboxes
  } else if (currentQ.type === "checkbox") {
    isInputValid = optionsContainer.querySelectorAll("li.selected").length > 0;
  }

  if (isInputValid) {
    nextButton.disabled = false;
    nextButton.classList.remove("disabled");
  } else {
    nextButton.disabled = true;
    nextButton.classList.add("disabled");
  }
}

// Add event listeners to monitor changes and update the button state
function addInputListeners() {
  const currentQ = questions[currentQuestionIndex];

  if (currentQ.type === "text" || currentQ.type === "number" || currentQ.type === "date") {
    const input = optionsContainer.querySelector("input");
    input.addEventListener("input", toggleNextButtonState);
  } else if (currentQ.type === "radio" || currentQ.type === "checkbox") {
    optionsContainer.querySelectorAll("li").forEach((option) => {
      option.addEventListener("click", toggleNextButtonState);
    });
  }
}

function loadQuestion(i) {
  const currentQ = questions[i];
  if (currentQ.condition) {
    const condKey = currentQ.condition.key;
    const condValue = currentQ.condition.value.toLowerCase();
    const actualValue = (formData[condKey] || "").toLowerCase();
    if (actualValue !== condValue) {
      // Skip this question by advancing the index and calling loadQuestion again.
      currentQuestionIndex++;
      // Make sure we don't exceed the array boundaries.
      if (currentQuestionIndex < questions.length) {
        loadQuestion(currentQuestionIndex);
      }
      return;
    }
  }
  if (currentQ.key === "equipment" && formData._equipmentAutoFilled) {
    currentQuestionIndex++;          // jump to the next real question
    if (currentQuestionIndex < questions.length) {
      loadQuestion(currentQuestionIndex);
    }
    return;                          // don’t render this page
  }
  questionText.textContent = currentQ.question;
  document.querySelectorAll(".scroll-text").forEach(el => el.remove());
  if (currentQ.extraText) {
    const extra = document.createElement("p");
    extra.classList.add("scroll-text");
    extra.textContent = currentQ.extraText;
    document.querySelector(".form-question").appendChild(extra);
  }
  optionsContainer.innerHTML = "";

  if (currentQ.type === "text" || currentQ.type === "number") {
    if (currentQ.key === "height") {
      buildHeightInput();     // <‑‑ new helper (see below)
      addInputListeners();
      return;
    }
    if (currentQ.key === "weight") {
      buildWeightInput();     // <‑‑ new helper (see below)
      addInputListeners();
      return;
    }
    const input = document.createElement("input");
    input.type = currentQ.type;
    input.placeholder = currentQ.placeholder || "Enter your answer";
    input.classList.add(`${currentQ.type}-input`);
    input.addEventListener("input", (e) => handleInputUpdate(currentQ)(e));
    optionsContainer.appendChild(input);
  }
  else if (currentQ.type === "date") {
    const input = document.createElement("input");
    input.type = "date";
    input.classList.add("date-input");

    if (currentQ.validateAge) {
      // This is for the DOB question => do the age check
      input.addEventListener("input", (e) => {
        const dob = e.target.value;
        const { valid, age } = calculateAge(dob);
        if (!valid) {
          // console.warn(`Invalid age: ${age}`);
          return;
        }
        formData.age = age;
        // console.log(`DOB: ${dob}, Age: ${age}`);
        // calculateMaintenanceCalories();
      });
    } else {
      // This is for the goal date => no age check
      input.addEventListener("input", (e) => {
        // Just store the selected date
        formData[currentQ.key] = e.target.value;
        // console.log(`${currentQ.key} =`, e.target.value);
      });
    }

    optionsContainer.appendChild(input);
  }
  else if (currentQ.type === "radio" || currentQ.type === "checkbox") {
    // Assuming currentQ.options is your options array and optionsContainer is your list container.
    currentQ.options.forEach(opt => {
      const li = document.createElement("li");
      li.classList.add("button-like");

      if (typeof opt === "object") {
        // Set the visible text to the actual value (or any property you want to use for logic)
        li.textContent = opt.value;
        // Save the emoji (the first “word” from opt.display, adjust as needed) in a data attribute.
        li.dataset.emoji = opt.display.split(" ")[0];
      } else {
        // If the option is a simple string, just set the text.
        li.textContent = opt;
      }

      li.addEventListener("click", () => handleOptionClick(li, currentQ.type));
      optionsContainer.appendChild(li);
    });

  }
  const backButton = document.getElementById("back-button");
  if (i > 0) {
    // If we are on question #1 or beyond, fade in the back button
    backButton.classList.add("visible");
  } else {
    // If it's the very first question (i=0), hide it
    backButton.classList.remove("visible");
  }
  if (i === questions.length - 1) {
    nextButton.textContent = "Finish";
  } else {
    nextButton.textContent = "Next Question";
  }
  if (currentQ.key === "userGoalWeight") {
    // wipe anything that might already be there
    optionsContainer.innerHTML = "";

    const gw = document.createElement("input");
    gw.type = "number";
    gw.placeholder = weightUnit === "lbs"
      ? "Enter your goal weight (lbs)"
      : "Enter your goal weight (kg)";
    gw.classList.add("number-input", "goal-weight-input");
    // if the user typed something then came back, keep it
    gw.value = formData.goalWeightInputTemp || "";

    gw.addEventListener("input", e => {
      formData.goalWeightInputTemp = e.target.value;   // temp store
      toggleNextButtonState();
    });

    optionsContainer.appendChild(gw);
    toggleNextButtonState();
    return;            // *** important: skip the generic builder ***
  }
  if (currentQuestionIndex > 0) {
    const agreementCheckbox = document.getElementById("agreement-checkbox");
    const warningText = document.getElementById("warning-text");
    if (agreementCheckbox) agreementCheckbox.parentElement.style.display = "none";
    if (warningText) warningText.style.display = "none";
  }
  toggleNextButtonState();
  addInputListeners();
}


function updateProgressBar() {
  const total = questions.length;
  const percent = ((currentQuestionIndex + 1) / total) * 100;
  progressBarFill.style.width = percent + "%";

  // Update the dynamic question counter text:
  const questionCounterElem = document.getElementById("question-counter");
  if (questionCounterElem) {
    questionCounterElem.textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
  }
}

function handleOptionClick(selectedOption, type) {
  const clickedText = selectedOption.textContent.trim();
  const questionKey = questions[currentQuestionIndex].key;

  if (type === "radio") {
    optionsContainer.querySelectorAll("li").forEach(li => li.classList.remove("selected"));
    selectedOption.classList.add("selected");
    formData[questionKey] = clickedText.toLowerCase();

    if (questionKey === "gender") {
      let selectedGender = clickedText.toLowerCase();
      if (selectedGender === "other") {
        selectedGender = "male";
      }
      formData.gender = selectedGender;
      localStorage.setItem("gender", selectedGender);
      // console.log(`Gender saved: ${selectedGender}`);
      // no need to fall through to the generic case below
      optionsContainer.querySelectorAll("li").forEach(li => li.classList.remove("selected"));
      selectedOption.classList.add("selected");
      toggleNextButtonState();
      return;
    }

    // Handle specific question keys and save to Local Storage
    if (questionKey === "goal") {
      let selectedGoal = clickedText.toLowerCase();

      // If the user chose "Improve Body Composition (Build Muscle & Lose Fat)",
      // store only "Improve Body Composition" in localStorage:
      if (selectedGoal === "improve body composition (build muscle & lose fat)") {
        selectedGoal = "improve body composition";
      }

      formData.goal = selectedGoal;
      localStorage.setItem("goal", selectedGoal);

      // console.log(`User Goal saved: ${selectedGoal}`);

      // calculateGoalCalories();
      // calculateBaseProjections();
    }
    else if (questionKey === "BodyType") {
      const val = clickedText.toLowerCase();
      formData.BodyType = val;
      localStorage.setItem("BodyType", val);
    }
    else if (questionKey === "desiredBodyType") {
      const val = clickedText.toLowerCase();
      formData.desiredBodyType = val;
      localStorage.setItem("desiredBodyType", val);
    }
    else if (questionKey === "structuredProgram") {
      const val = clickedText.toLowerCase();
      formData.structuredProgram = val;
      localStorage.setItem("structuredProgram", val);
    }
    else if (questionKey === "activityLevel") {
      const selectedActivityLevel = clickedText.toLowerCase();
      formData.activityLevel = selectedActivityLevel;
      localStorage.setItem("activityLevel", selectedActivityLevel);
      // console.log(`Activity Level saved: ${selectedActivityLevel}`);

      // calculateMaintenanceCalories();
    }
    else if (questionKey === "fitnessLevel") {
      const selectedFitnessLevel = clickedText.toLowerCase();
      formData.fitnessLevel = selectedFitnessLevel;
      localStorage.setItem("fitnessLevel", selectedFitnessLevel);
      // console.log(`Fitness Level saved: ${selectedFitnessLevel}`);

      // calculateBaseProjections();
    }
    else if (questionKey === "workoutDays") {
      const selectedWorkoutDays = parseInt(clickedText, 10);
      formData.workoutDays = selectedWorkoutDays;
      localStorage.setItem("workoutDays", selectedWorkoutDays);
      // console.log(`Workout Days saved: ${selectedWorkoutDays}`);

      // calculateBaseProjections();
    }
    else if (questionKey === "sessionDuration") {
      const selectedsessionDuration = clickedText.toLowerCase();
      formData.sessionDuration = selectedsessionDuration;
      localStorage.setItem("sessionDuration", selectedsessionDuration);
      // console.log(`Workout Duration saved: ${selectedsessionDuration}`);
    }
    else if (questionKey === "workoutLocation") {
      const selectedWorkoutLocation = clickedText.toLowerCase();
      formData.workoutLocation = selectedWorkoutLocation;
      localStorage.setItem("workoutLocation", selectedWorkoutLocation);
      // ──► Auto-answer the equipment question when “gym” is chosen
      if (selectedWorkoutLocation === "gym") {
        // every option from the equipment question, lower-cased
        const allEquipment = [
          "dumbbells", "barbells", "bench", "rack",
          "kettlebells", "cables", "machines", "smith machine"
        ];

        formData.equipment = allEquipment;
        localStorage.setItem("equipment", JSON.stringify(allEquipment));

        // flag so we can skip that screen later
        formData._equipmentAutoFilled = true;
      } else {
        // user picked Home ⇒ clear any previous auto-fill
        delete formData._equipmentAutoFilled;
      }
      // console.log(`Workout Location saved: ${selectedWorkoutLocation}`);
    }
    else if (questionKey === "effortLevel") {
      const normalized = clickedText.toLowerCase().split(" ")[0];
      formData.effortLevel = normalized;
      localStorage.setItem("effortLevel", normalized);
      // console.log(`Effort Level saved: ${normalized}`);
    }
    else if (questionKey === "goalDriver") {
      formData.goalDriver = clickedText;
      localStorage.setItem("goalDriver", clickedText);
      // console.log(`Goal Driver saved: ${clickedText}`);
    }
  }
  else if (type === "checkbox") {
    const noneOption = Array.from(optionsContainer.querySelectorAll("li")).find(
      li => li.textContent.trim() === "None of the above"
    );
    if (clickedText === "None of the above") {
      optionsContainer.querySelectorAll("li").forEach(li => {
        if (li !== selectedOption) li.classList.remove("selected");
      });
      selectedOption.classList.add("selected");
      formData[questionKey] = [];
    } else {
      if (noneOption) noneOption.classList.remove("selected");
      selectedOption.classList.toggle("selected");
    }
    const selectedTexts = Array.from(optionsContainer.querySelectorAll("li.selected")).map(li => li.textContent.trim());
    formData[questionKey] = selectedTexts.map(txt => txt.toLowerCase());
    if (questionKey === "equipment") {
      localStorage.setItem("equipment", JSON.stringify(formData.equipment));
    }
    if (questionKey === "injuries") {
      localStorage.setItem("injuries", JSON.stringify(formData.injuries));
    }
    // console.log("Current selected checkboxes =>", formData[questionKey]);
  }
}

function buildHeightInput() {
  optionsContainer.innerHTML = `
    <div class="unit-toggle pill-toggle">
      <input type="radio" name="hUnit" id="hUnit-cm" value="cm" checked autocomplete="off">
      <label for="hUnit-cm">cm</label>

      <input type="radio" name="hUnit" id="hUnit-ftin" value="ft" autocomplete="off">
      <label for="hUnit-ftin">ft / in</label>
    </div>

    <input type="number" class="number-input h-cm" placeholder="Enter height in cm">
    <div class="ftin-row hidden">
      <input type="number" class="number-input h-ft" placeholder="ft">
      <input type="number" class="number-input h-in" placeholder="in">
    </div>
  `;

  const unitRadios = optionsContainer.querySelectorAll("input[name='hUnit']");
  const cmBox = optionsContainer.querySelector(".h-cm");
  const ftInRow = optionsContainer.querySelector(".ftin-row");
  const ftBox = ftInRow.querySelector(".h-ft");
  const inBox = ftInRow.querySelector(".h-in");

  unitRadios.forEach(radio =>
    radio.addEventListener("change", e => {
      heightUnit = e.target.value;
      formData.heightUnit = heightUnit;
      localStorage.setItem("heightUnit", heightUnit);

      if (heightUnit === "cm") {
        cmBox.classList.remove("hidden");
        ftInRow.classList.add("hidden");
      } else {
        cmBox.classList.add("hidden");
        ftInRow.classList.remove("hidden");
      }
      toggleNextButtonState();
    })
  );

  [cmBox, ftBox, inBox].forEach(el =>
    el.addEventListener("input", () => {
      if (heightUnit === "cm") {
        formData.height = parseFloat(cmBox.value) || null;
        formData.heightRaw = { unit: "cm", value: cmBox.value };
      } else {
        const ft = parseFloat(ftBox.value) || 0;
        const inch = parseFloat(inBox.value) || 0;
        formData.height = cmFromFtIn(ft, inch);
        formData.heightRaw = { unit: "ft/in", ft: ftBox.value, in: inBox.value };
      }
      localStorage.setItem("heightRaw", JSON.stringify(formData.heightRaw));
      updateAnthroMetrics();
      toggleNextButtonState();
    })
  );

  toggleNextButtonState();
}


function buildWeightInput() {
  optionsContainer.innerHTML = `
    <div class="unit-toggle pill-toggle">
      <input type="radio" name="wUnit" id="wUnit-kg" value="kg" checked autocomplete="off">
      <label for="wUnit-kg">kg</label>

      <input type="radio" name="wUnit" id="wUnit-lbs" value="lbs" autocomplete="off">
      <label for="wUnit-lbs">lbs</label>
    </div>

    <input type="number" class="number-input w-kg"  placeholder="Enter weight in kg">
    <input type="number" class="number-input w-lbs hidden" placeholder="Enter weight in lbs">
  `;

  const unitRadios = optionsContainer.querySelectorAll("input[name='wUnit']");
  const kgBox = optionsContainer.querySelector(".w-kg");
  const lbsBox = optionsContainer.querySelector(".w-lbs");

  unitRadios.forEach(radio =>
    radio.addEventListener("change", e => {
      weightUnit = e.target.value;
      formData.weightUnit = weightUnit;
      localStorage.setItem("weightUnit", weightUnit);

      if (weightUnit === "kg") {
        kgBox.classList.remove("hidden");
        lbsBox.classList.add("hidden");
      } else {
        kgBox.classList.add("hidden");
        lbsBox.classList.remove("hidden");
      }
      toggleNextButtonState();
    })
  );

  [kgBox, lbsBox].forEach(el =>
    el.addEventListener("input", () => {
      if (weightUnit === "kg") {
        formData.weight = parseFloat(kgBox.value) || null;
        formData.weightRaw = { unit: "kg", value: kgBox.value };
      } else {
        const lbs = parseFloat(lbsBox.value) || 0;
        formData.weight = kgFromLbs(lbs);
        formData.weightRaw = { unit: "lbs", value: lbsBox.value };
      }
      localStorage.setItem("weightRaw", JSON.stringify(formData.weightRaw));
      updateAnthroMetrics();
      toggleNextButtonState();
    })
  );

  toggleNextButtonState();
}

/***********************************************************************
* 5) MULTI-PHASE WORKOUT GENERATION
***********************************************************************/

let pushDayCount = 0;
let legDayCount = 0;

function isGroupB() {
  const age = formData.age || 30;
  const inj = (formData.injuries || []).map(x => x.toLowerCase());
  if (formData.pregnancyStatus) {
    const ps = formData.pregnancyStatus.toLowerCase();
    if (ps === "pregnant" || ps === "post-natal") {
      return true;
    }
  }
  if (age >= 60) return true;
  if (inj.includes("pregnancy") || inj.includes("post-natal")) return true;
  return false;
}


const PHASES = {
  FOUNDATIONAL: {
    name: "Foundational Phase",
    weeks: [1, 2, 3, 4],
    repRange: [12, 15],
    rpeRange: [5, 6],
    restRange: [15, 60],
    restTime: 45,
    tempo: "1:1:1",
    sets: (typeOfMovement) => 3
  },
  HYPERTROPHY: {
    name: "Hypertrophy Phase",
    weeks: [5, 6, 7, 8],
    repRange: [8, 12],
    rpeRange: [6, 8],
    restRange: [30, 90],
    restTime: 90,
    tempo: "2:1:2",
    sets: (typeOfMovement) => typeOfMovement === "compound" ? 4 : 3
  },
  STRENGTH: {
    name: "Strength Phase",
    weeks: [9, 10, 11, 12],
    repRange: [6, 8],
    rpeRange: [7, 9],
    restRange: [120, 300],
    restTime: 180,
    tempo: "1:1:1 or 2:1:1",
    sets: (typeOfMovement) => typeOfMovement === "compound" ? 5 : 4
  },
};

function getPhaseForWeek(wNum) {
  if (wNum <= 4) return PHASES.FOUNDATIONAL;
  if (wNum <= 8) return PHASES.HYPERTROPHY;
  return PHASES.STRENGTH;
}
function isPhase1(wNum) { return (wNum >= 1 && wNum <= 4); }
function isNovice() {
  const lvl = (formData.fitnessLevel || "").toLowerCase();
  const sp = (formData.structuredProgram || "").toLowerCase();
  if (lvl === "beginner") return true;
  if (sp === "no" || sp === "partially") return true;
  return false;
}

/** getTimeBlocksForGoal => skip RT if user wants only HIIT, else normal logic. */
function getTimeBlocksForGoal(sessionLen, userGoal) {
  // [UNCHANGED but your intervals for RT/Cardio remain]
  let numericLength = 30;
  if (sessionLen.startsWith("0-30")) numericLength = 30;
  else if (sessionLen.startsWith("30-45")) numericLength = 45;
  else if (sessionLen.startsWith("45-60")) numericLength = 60;
  else numericLength = 90;

  const blocks = { warmUp: 3, rt: 0, cardio: 0, coolDown: 2 };

  // If user is purely HIIT
  if ((formData.trainingPreference || "").toLowerCase() === "hiit") {
    blocks.cardio = numericLength - 5;
    return blocks;
  }

  if (isGroupB() && numericLength > 45) numericLength = 45;

  const g = userGoal.toLowerCase();
  if (g === "lose weight") {
    if (numericLength === 30) { blocks.rt = 10; blocks.cardio = 15; }
    else if (numericLength === 45) { blocks.rt = 20; blocks.cardio = 20; }
    else if (numericLength === 60) { blocks.rt = 30; blocks.cardio = 25; }
    else { blocks.rt = 40; blocks.cardio = 35; }
  }
  else if (g === "gain muscle") {
    if (numericLength === 30) { blocks.rt = 20; blocks.cardio = 5; }
    else if (numericLength === 45) { blocks.rt = 35; blocks.cardio = 5; }
    else if (numericLength === 60) { blocks.rt = 50; blocks.cardio = 5; }
    else { blocks.rt = 60; blocks.cardio = 5; }
  }
  else {
    // body comp
    if (numericLength === 30) { blocks.rt = 15; blocks.cardio = 10; }
    else if (numericLength === 45) { blocks.rt = 25; blocks.cardio = 15; }
    else if (numericLength === 60) { blocks.rt = 35; blocks.cardio = 20; }
    else { blocks.rt = 45; blocks.cardio = 30; }
  }
  return blocks;
}

function getMaxRPEByAge(age) {
  // [UNCHANGED]
  if (age >= 45) return 7;
  if (age >= 30) return 8;
  return 9;
}

function generateAllPrograms() {
  // console.log("Generating 1-,4-,12-week programs...");

  let wd = parseInt(formData.workoutDays || 3, 10);
  if (isGroupB() && wd > 5) {
    // console.warn("GroupB => clamping days to 5");
    formData.workoutDays = 5;
  }

  const filtered = filterExercisesForUser(EXERCISE_DATABASE);
  if (!filtered.length) {
    // console.warn("No valid eq => fallback to bodyweight.");
    filtered.push(...BODYWEIGHT_EXERCISES);
  }

  const oneW = buildWeekProgram(filtered, 1);
  const fourW = buildMultiWeekProgram(filtered, 4);
  const twelveW = buildMultiWeekProgram(filtered, 12);

  // console.log("12-week program:", twelveW);

  localStorage.setItem("oneWeekProgram", JSON.stringify(oneW));
  localStorage.setItem("fourWeekProgram", JSON.stringify(fourW));
  localStorage.setItem("twelveWeekProgram", JSON.stringify(twelveW));
}

/** [CHANGED => We only store 1 quad compound + 1 ham compound per phase, not 2. But ChatGPT, this is the same code I had earlier. */
const phaseCacheData = {
  "Foundational Phase": null,
  "Hypertrophy Phase": null,
  "Strength Phase": null,
};

function buildPhaseIfNeeded(phaseName, exList) {
  if (phaseCacheData[phaseName]) {
    // Already built => do nothing
    return;
  }
  // Otherwise => pick new compounds/accessories for that phase
  const cPushComp = pick2ChestCompounds(exList);
  const cPushAcc = pickPushAccessories(exList);
  const cQuadComp = pick2QuadCompounds(exList);
  const cQuadAcc = pickQuadAccessories(exList);
  const cHamComp = pick2HamCompounds(exList);
  const cHamAcc = pickHamAccessories(exList);

  const quadPrimary = cQuadComp[0] || null;
  const hamPrimary = cHamComp[0] || null;

  phaseCacheData[phaseName] = {
    pushCompounds: cPushComp,
    pushAccessories: cPushAcc,
    quadCompounds: cQuadComp,   // for reference, but we won't alternate them
    quadAccessories: cQuadAcc,
    hamCompounds: cHamComp,
    hamAccessories: cHamAcc,

    // [ADDED => store single picks]
    _quadPrimary: quadPrimary,
    _hamPrimary: hamPrimary,
  };
}

function pick2ChestCompounds(exList) {
  const chestComp = exList.filter(
    x => x.splitTag === "push" && x.muscleGroup === "chest" && x.typeOfMovement === "compound"
  );
  if (chestComp.length < 2) {
    return [chestComp[0] || null, chestComp[0] || null];
  }
  // We want to ensure one is “flat” & one is “incline” if possible:
  const inc = chestComp.filter(x => x.name.toLowerCase().includes("incline"));
  const flat = chestComp.filter(x => x.name.toLowerCase().includes("flat"));
  if (inc.length && flat.length) {
    // pick a random inc, random flat
    return [
      pickRandom(flat),
      pickRandom(inc)
    ];
  }
  // fallback if we can’t find both variants
  let c1 = pickRandom(chestComp);
  let c2 = pickRandom(chestComp, [c1]);
  return [c1, c2];
}

/** For push accessories => pick 1 chest iso, 1 shoulder comp, 1 shoulder iso, 2 triceps => remain same entire phase */
function pickPushAccessories(exList) {
  const isoChest = exList.filter(x =>
    x.splitTag === "push" &&
    x.muscleGroup === "chest" &&
    x.typeOfMovement === "isolation"
  );
  const chestIso = pickRandom(isoChest);

  const shoulderComp = exList.filter(x =>
    x.splitTag === "push" &&
    x.muscleGroup === "shoulders" &&
    x.typeOfMovement === "compound"
  );
  const sComp = pickRandom(shoulderComp);

  const shoulderIso = exList.filter(x =>
    x.splitTag === "push" &&
    x.muscleGroup === "shoulders" &&
    x.typeOfMovement === "isolation"
  );
  const sIso = pickRandom(shoulderIso);

  const tricepsAll = exList.filter(x => x.splitTag === "push" && x.muscleGroup === "triceps");
  const t1 = pickRandom(tricepsAll);
  const t2 = pickRandom(tricepsAll, [t1]);

  return [chestIso, sComp, sIso, t1, t2].filter(Boolean);
}

/** pick2QuadCompounds => e.g. barbell squat, smith squat, or leg press. */
function pick2QuadCompounds(exList) {
  const quadComps = exList.filter(x =>
    x.splitTag === "legs" &&
    x.muscleGroup === "quads" &&
    x.typeOfMovement === "compound"
  );
  if (quadComps.length < 2) {
    return [quadComps[0] || null, quadComps[0] || null];
  }
  const c1 = pickRandom(quadComps);
  const c2 = pickRandom(quadComps, [c1]);
  return [c1, c2];
}
function pickQuadAccessories(exList) {
  const qIso = exList.filter(x =>
    x.muscleGroup === "quads" &&
    x.typeOfMovement === "isolation"
  );
  const q1 = pickRandom(qIso);

  const hamIso = exList.filter(x =>
    x.muscleGroup === "hamstrings" &&
    x.typeOfMovement === "isolation"
  );
  const h1 = pickRandom(hamIso);

  const calves = exList.filter(x => x.muscleGroup === "calves");
  const c = pickRandom(calves);

  return [q1, h1, c].filter(Boolean);
}

/** pick2HamCompounds => e.g. RDL, Deadlift. */
function pick2HamCompounds(exList) {
  const hamComps = exList.filter(x =>
    x.splitTag === "legs" &&
    x.muscleGroup === "hamstrings" &&
    x.typeOfMovement === "compound"
  );
  if (hamComps.length < 2) {
    return [hamComps[0] || null, hamComps[0] || null];
  }
  const c1 = pickRandom(hamComps);
  const c2 = pickRandom(hamComps, [c1]);
  return [c1, c2];
}
function pickHamAccessories(exList) {
  const hamIso = exList.filter(x =>
    x.muscleGroup === "hamstrings" &&
    x.typeOfMovement === "isolation"
  );
  const h1 = pickRandom(hamIso);

  const quadIso = exList.filter(x =>
    x.muscleGroup === "quads" &&
    x.typeOfMovement === "isolation"
  );
  const q1 = pickRandom(quadIso);

  const calves = exList.filter(x => x.muscleGroup === "calves");
  const c = pickRandom(calves);

  return [h1, q1, c].filter(Boolean);
}

/***********************************************************************
* pickLegDay => toggles between quad/ham every day
***********************************************************************/

// function pickLegDay(exList, wNum, dayIndex) {
//   legSessionCount++;
//   const isEvenSession = (legSessionCount % 2 === 0);

//   if (!isEvenSession) {
//     const whichIndex = (Math.floor((legSessionCount - 1) / 2) % 2);
//     const chosenQuadComp = cachedQuadCompounds[whichIndex] || null;
//     const [qIso, hIso, cCalves] = cachedQuadAccessories;

//     // Return them in the order => comp => quad iso => ham iso => calves
//     return [chosenQuadComp, qIso, hIso, cCalves].filter(Boolean);

//   } else {
//     // Ham Focus
//     const whichIndex = (Math.floor((legSessionCount - 2) / 2) % 2);
//     const chosenHamComp = cachedHamCompounds[whichIndex] || null;
//     const [hIso, qIso, cCalves] = cachedHamAccessories;
//     return [chosenHamComp, hIso, qIso, cCalves].filter(Boolean);
//   }
// }

function pickLegDay(exList, wNum, dayCount) {
  // Use the dayCount (or dayIndex) to determine which leg workout to build
  if (dayCount % 2 === 1) {
    // For odd days, build a quad-focused day.
    return buildQuadDayOrdered(exList, wNum);
  } else {
    // For even days, build a hamstring-focused day.
    return buildHamDayOrdered(exList, wNum);
  }
}

/***********************************************************************
* Pull day fallback => if vertical eq not possible => use second horizontal
***********************************************************************/

// function pickPullDay(exList, wNum) {
//   // Make a copy of the exercise list
//   let arr = [...exList];

//   // Filter based on user equipment preferences
//   const eqPrefs = formData.equipment.map(e => e.toLowerCase());
//   arr = arr.filter(e =>
//     e.equipmentNeeded.every(eq => eqPrefs.includes(eq.toLowerCase()))
//   );

//   console.log("Filtered exercise list:", arr);

//   // Slot 1: Vertical back movement
//   let slot1 = null;
//   const verticalCandidates = arr.filter(x =>
//     x.muscleGroup === "back" && x.movementPlane === "vertical"
//   );

//   if (verticalCandidates.length > 0) {
//     slot1 = pickRandom(verticalCandidates);
//     arr.splice(arr.indexOf(slot1), 1); // Remove selected exercise
//   } else {
//     // Fallback: Arch movements
//     const archCandidates = arr.filter(x =>
//       x.muscleGroup === "back" &&
//       (x.name.toLowerCase().includes("pullover") || x.movementPlane === "arch")
//     );

//     if (archCandidates.length > 0) {
//       slot1 = pickRandom(archCandidates);
//       arr.splice(arr.indexOf(slot1), 1); // Remove selected exercise
//       console.log("Fallback arch movement selected:", slot1);
//     } else {
//       console.warn("No vertical or arch movements available for Slot 1.");
//     }
//   }

//   // Slot 2: Horizontal back movement
//   const horizontalCandidates = arr.filter(x =>
//     x.muscleGroup === "back" && x.movementPlane === "horizontal"
//   );
//   const slot2 = pickRandom(horizontalCandidates);
//   if (slot2) arr.splice(arr.indexOf(slot2), 1);

//   // Slot 3: Biceps movement
//   const bicepsCandidates = arr.filter(x => x.muscleGroup === "biceps");
//   const slot3 = pickRandom(bicepsCandidates);
//   if (slot3) arr.splice(arr.indexOf(slot3), 1);

//   // Slot 4: Traps movement
//   const trapsCandidates = arr.filter(x => x.muscleGroup === "traps");
//   const slot4 = pickRandom(trapsCandidates);
//   if (slot4) arr.splice(arr.indexOf(slot4), 1);

//   // Slot 5: Forearms movement
//   const forearmsCandidates = arr.filter(x => x.muscleGroup === "forearms");
//   const slot5 = pickRandom(forearmsCandidates);

//   // Compile the final pull day selection
//   const result = [slot1, slot2, slot3, slot4, slot5].filter(Boolean);

//   console.log("Final pull day selection:", result);
//   return result;
// }

function pickPullDay(exList, wNum) {
  // First, filter the candidate exercises.
  let arr = [...exList];

  // (Optional) Apply any phase or user preference filtering here.
  // For example, if you want to exclude technical exercises for novices:
  const isP1Novice = isPhase1(wNum) && isNovice();
  if (isP1Novice) {
    arr = arr.filter(e => !e.isTechnical);
  }

  // Example of selecting slots:
  // Slot 1: Preferred vertical back movement
  let slot1 = pickRandom(
    arr.filter(x => x.muscleGroup === "back" && x.movementPlane === "vertical")
  );
  if (!slot1) {
    // Fallback: Arch movements
    slot1 = pickRandom(
      arr.filter(x =>
        x.muscleGroup === "back" &&
        (x.name.toLowerCase().includes("pullover") || x.movementPlane === "arch")
      )
    );
  }
  if (slot1) arr.splice(arr.indexOf(slot1), 1);

  // Slot 2: Horizontal back movement
  const slot2 = pickRandom(arr.filter(x => x.muscleGroup === "back" && x.movementPlane === "horizontal"));
  if (slot2) arr.splice(arr.indexOf(slot2), 1);

  // Slot 3: Biceps movement
  const slot3 = pickRandom(arr.filter(x => x.muscleGroup === "biceps"));
  if (slot3) arr.splice(arr.indexOf(slot3), 1);

  // Slot 4: Traps movement
  const slot4 = pickRandom(arr.filter(x => x.muscleGroup === "traps"));
  if (slot4) arr.splice(arr.indexOf(slot4), 1);

  // Slot 5: Forearms movement
  const slot5 = pickRandom(arr.filter(x => x.muscleGroup === "forearms"));

  // Return the selection filtered to exclude any null values.
  return [slot1, slot2, slot3, slot4, slot5].filter(Boolean);
}

function pickPullDayNoVertical(exList) {
  const arr = [...exList];
  // console.log("Fallback pull day exercise list:", arr);

  // Arch movement
  let arch = arr.filter(e =>
    e.muscleGroup === "back" &&
    (
      e.name.toLowerCase().includes("pullover") ||
      e.name.toLowerCase().includes("extension") ||
      (e.movementPlane && e.movementPlane.toLowerCase() === "arch")
    )
  );
  // console.log("Arch candidates:", arch);

  let slot1 = pickRandom(arch);
  // console.log("Selected arch movement (slot1):", slot1);

  if (!slot1) {
    const backH = arr.filter(e => e.muscleGroup === "back" && e.movementPlane === "horizontal");
    slot1 = pickRandom(backH);
    // console.log("Fallback to horizontal movement (slot1):", slot1);
  }

  if (slot1) {
    arr.splice(arr.indexOf(slot1), 1);
  }

  // Horizontal movement
  const backH2 = arr.filter(e => e.muscleGroup === "back" && e.movementPlane === "horizontal");
  const slot2 = pickRandom(backH2);
  // console.log("Selected horizontal movement (slot2):", slot2);
  if (slot2) arr.splice(arr.indexOf(slot2), 1);

  // Biceps
  const biceps = arr.filter(e => e.muscleGroup === "biceps");
  const slot3 = pickRandom(biceps);
  // console.log("Selected biceps movement:", slot3);
  if (slot3) arr.splice(arr.indexOf(slot3), 1);

  // Traps
  const traps = arr.filter(e => e.muscleGroup === "traps");
  const slot4 = pickRandom(traps);
  // console.log("Selected traps movement:", slot4);
  if (slot4) arr.splice(arr.indexOf(slot4), 1);

  // Forearms
  const forearms = arr.filter(e => e.muscleGroup === "forearms");
  const slot5 = pickRandom(forearms);
  // console.log("Selected forearms movement:", slot5);

  const result = [slot1, slot2, slot3, slot4, slot5].filter(Boolean);
  // console.log("Final fallback pull day selection:", result);
  return result;
}

/*********************************************************
*  Prefer isTechnical: true ONLY in Foundational Phase
*********************************************************/

function shouldExcludeTechnicalForThisUser(weekNumber) {
  return (isPhase1(weekNumber) && isNovice());
}

/***********************************************************************
* HIIT & FBB WORKOUT LIBRARIES (ADDED)
**********************************************************************/

// ADDED: Pre-made HIIT workouts by duration
const HIIT_WORKOUTS = {
  "0-10": [
    {
      name: "HIIT 0-10 #1",
      details: `8 min: 20s on / 10s rest x4 rounds (Burpees, Squat Jumps, Push-Ups, High Knees)`,
    },
    {
      name: "HIIT 0-10 #2",
      details: `8 min: 20s on / 10s rest x8 rounds, alternating (Mountain Climbers, Plank Jacks)`,
    },
    {
      name: "HIIT 0-10 #3",
      details: `10 min: 40s on / 20s rest x2 rounds (Jumping Jacks, Push-Ups, Lunges, Plank, Skater Jumps)`,
    },
    {
      name: "HIIT 0-10 #4",
      details: `4 min Tabata: 20s on / 10s rest x8 (Burpees only)`,
    },
    {
      name: "HIIT 0-10 #5",
      details: `6 min: 30s on / 15s rest x3 rounds (Jump Squats, Push-Up to Shoulder Tap, Lateral Bounds)`,
    },
    {
      name: "HIIT 0-10 #6",
      details: `8 min: 30s on / 15s rest x2 rounds (Mountain Climbers, Plank Jacks, High Knees, Russian Twists)`,
    },
    {
      name: "HIIT 0-10 #7",
      details: `4 min Tabata: 20s on / 10s rest x8 (Jump Squats only)`,
    },
  ],
  "10-20": [
    {
      name: "HIIT 10-20 #1",
      details: `15 min: 45s on / 15s rest x3 rounds (Jumping Jacks, Push-Ups, Squat Jumps, Mtn Climbers, Plank Taps)`,
    },
    {
      name: "HIIT 10-20 #2",
      details: `16 min: 20s on / 10s rest in Tabatas: (Burpees&JumpSquats, HighKnees&PlankJacks, PushUps&BicycleCrunches, SkaterJumps&RussianTwists)`,
    },
    {
      name: "HIIT 10-20 #3",
      details: `18 min Ladder: 1-2-3 etc. reps for 9 min (Burpees, Air Squats, Push-Ups), rest 1 min, repeat.`,
    },
    {
      name: "HIIT 10-20 #4",
      details: `12 min: 40s on / 20s rest x3 rounds (Lunge->Knee Drive R, Lunge->Knee Drive L, PushUp->PlankJack, Lateral Bounds, Squat Pulse->Jump)`,
    },
    {
      name: "HIIT 10-20 #5",
      details: `20 min: 30s on / 15s rest x4 rounds (Burpees, Jump Squats, Mtn Climbers, High Knees, Plank Taps)`,
    },
    {
      name: "HIIT 10-20 #6",
      details: `10 min: 30s on / 10s rest x4 rounds (Plank Jacks, Russian Twists, Mtn Climbers, Bicycle Crunches)`,
    },
    {
      name: "HIIT 10-20 #7",
      details: `12 min: 40s on / 20s rest x3 (Jump Squats, Step-Back Lunges, Glute Bridges, Wall Sit)`,
    },
  ],
  "20-30": [
    {
      name: "HIIT 20-30 #1",
      details: `20 min: 40s on / 20s rest x4 rounds (Jumping Jacks, Push-Ups, Air Squats, Mtn Climbers, Plank Taps)`,
    },
    {
      name: "HIIT 20-30 #2",
      details: `25 min: 50s on / 10s rest x3 rounds (Burpees, Lunges, PushUp->PlankJack, SkaterJumps, RussianTwists, JumpSquats)`,
    },
    {
      name: "HIIT 20-30 #3",
      details: `24 min Tabatas: 20s on / 10s rest x8 each for (HighKnees&PlankJacks, JumpSquats&PushUps, Burpees&BicycleCrunches)`,
    },
    {
      name: "HIIT 20-30 #4",
      details: `30 min: 30s on / 15s rest x5 rounds (High Knees, Burpees, Mtn Climbers, Lunges, PushUp->SidePlank)`,
    },
    {
      name: "HIIT 20-30 #5",
      details: `22 min: 45s on / 15s rest x4 rounds (JumpSquats, StepUp->KneeDrive R, StepUp->KneeDrive L, Burpees, Lateral Bounds)`,
    },
    {
      name: "HIIT 20-30 #6",
      details: `20 min: 40s on / 20s rest x4 rounds (Mtn Climbers, BicycleCrunches, PlankJacks, HighKnees, RussianTwists)`,
    },
    {
      name: "HIIT 20-30 #7",
      details: `30 min: 1m on / 30s rest x3 rounds (Burpees+PushUp, JumpingLunges, PushUp->Row, SkaterJumps, WallSit, PlankWalkOut)`,
    },
    {
      name: "HIIT 20-30 #8",
      details: `20 min: 30s on / 10s rest x5 rounds (HighKnees, Burpees, JumpSquats, SkaterJumps, Mtn Climbers)`,
    },
  ],
};

// ADDED: Pre-made FBB (Full Body Bodyweight) workouts by duration
const FBB_WORKOUTS = {
  "0-10": [
    {
      name: "FBB 0-10 #1",
      details: `8 min: 30s each x2 (Bodyweight Squats, Incline Push-Ups, Glute Bridges, Plank Hold)`,
    },
    {
      name: "FBB 0-10 #2",
      details: `10 min: 45s on / 15s rest x2 (Plank Shoulder Taps, Leg Raises, Bird Dogs, Bicycle Crunches)`,
    },
    {
      name: "FBB 0-10 #3",
      details: `10 min: 40s on / 20s rest x2 (Push-Ups, Reverse Lunges, Side Plank R, Side Plank L)`,
    },
    {
      name: "FBB 0-10 #4",
      details: `8 min: 30s each x2 (Cat-Cow, World's Greatest Stretch, Child's Pose->Cobra, Deep BW Squat Hold)`,
    },
    {
      name: "FBB 0-10 #5",
      details: `8 min: 45s on / 15s rest x2 (Push-Ups, Single-Leg Glute Bridge R, Single-Leg Glute Bridge L, Plank->Forearm)`,
    },
    {
      name: "FBB 0-10 #6",
      details: `10 min: 30s on / 15s rest x3 (High Knees, Bodyweight Squats, Mountain Climbers, Burpees)`,
    },
    {
      name: "FBB 0-10 #7",
      details: `9 min: 45s each x2 (World's Greatest Stretch R/L, Cat-Cow, Seated Forward Fold, Child's Pose->ThreadNeedle)`,
      isSeventh: true, // special note if day7
    },
  ],
  "10-20": [
    {
      name: "FBB 10-20 #1",
      details: `15 min: 40s on / 20s off x3 (PushUps, BodyweightSquats, PlankTaps, ReverseLunges, GluteBridges)`,
    },
    {
      name: "FBB 10-20 #2",
      details: `18 min: 30s on / 10s off x4 (HighKnees, MtnClimbers, JumpSquats, Burpees, PlankJacks)`,
    },
    {
      name: "FBB 10-20 #3",
      details: `20 min: 45s on / 15s off x2 (PlankHold, SidePlank R, SidePlank L, LegRaises, BirdDogs)`,
    },
    {
      name: "FBB 10-20 #4",
      details: `12 min: 1m each x2 (Cat-Cow, World's Greatest Stretch R/L, SeatedForwardFold, ChildPose->CobraFlow)`,
    },
    {
      name: "FBB 10-20 #5",
      details: `20 min: 40s on / 20s off x3 (JumpingJacks, MtnClimbers, Burpees, StepBackLunges, PlankTaps)`,
    },
    {
      name: "FBB 10-20 #6",
      details: `15 min: 45s on / 15s off x3 (BodyweightSquats, Lunges R, Lunges L, GluteBridges, WallSit)`,
    },
    {
      name: "FBB 10-20 #7",
      details: `20 min: 1m on / 15s off x3 (Push-Ups, StepThroughLunge R/L, Plank->DownDog, BirdDogs, AirSquats)`,
    },
  ],
  "20-30": [
    {
      name: "FBB 20-30 #1",
      details: `30 min: 40s on / 20s off x4 (PushUps, BW Squats, ReverseLunges, PlankTaps, GluteBridges)`,
    },
    {
      name: "FBB 20-30 #2",
      details: `25 min: 30s on / 10s off x5 (HighKnees, MtnClimbers, Burpees, JumpSquats, PlankJacks)`,
    },
    {
      name: "FBB 20-30 #3",
      details: `30 min: 45s on / 15s off x3 (PlankHold, LegRaises, SidePlank R, SidePlank L, BirdDogs)`,
    },
    {
      name: "FBB 20-30 #4",
      details: `20 min: 1m each x2 (Cat-Cow, World's Greatest Stretch R/L, SeatedForwardFold, ChildPose->Cobra, ThreadNeedle)`,
    },
    {
      name: "FBB 20-30 #5",
      details: `25 min: 40s on / 20s off x4 (JumpingJacks, StepBackLunges, SquatPulses, GluteBridges, WallSit)`,
    },
    {
      name: "FBB 20-30 #6",
      details: `30 min: 1m on / 15s off x3 (PushUps, StepThroughLunge R/L, Plank->DownDog, BirdDogs, BW Squats)`,
    },
    {
      name: "FBB 20-30 #7",
      details: `28 min: 45s on / 15s off x4 (Burpees, BW Squats, PushUps, MtnClimbers, PlankTaps)`,
    },
  ],
};

const HOME_NO_EQUIPMENT_WORKOUTS = [
  // ---------- Day 1 ----------
  {
    dayLabel: "Day 1 – FULL BODY",
    /* -------- Warm-Up (≈5 min total) -------- */
    warmUp: [
      {
        name: "Jumping Jacks",
        duration: "60 seconds",
        rpe: 5
      },
      {
        name: "Arm Circles",
        duration: "30 seconds",
        rpe: 4
      },
      {
        name: "Hip Circles",
        duration: "30 seconds",
        rpe: 4
      },
      {
        name: "Cat-Cow Stretch",
        duration: "60 seconds",
        rpe: 3
      }
    ],

    /* -------- Main Work (≈30 min RT + 5 min cardio) -------- */
    mainWork: [
      {
        blockType: "Resistance Training",
        allocatedMinutes: 30,
        exercises: [
          {
            name: "Push-Ups",
            muscleGroup: "chest",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "push",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Plank Shoulder Taps",
            isBodyweight: true,
            videoUrl: "https://youtu.be/_l3ySVKYVJ8",
            alternativeExercises: [
              "Knee Push-Ups",
              "Incline Push-Ups",
              "Decline Push-Ups",
              "Diamond Push-Ups",
              "Wide-Grip Push-Ups"
            ],
            sets: 3,
            reps: "10-15",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Bodyweight Squats",
            muscleGroup: "quads",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Glute Bridges",
            isBodyweight: true,
            videoUrl: "https://youtu.be/aclHkVaku9U",
            alternativeExercises: [
              "Sumo Squats",
              "Pulse Squats",
              "Jump Squats",
              "Wall Sit",
              "Chair Squats"
            ],
            sets: 3,
            reps: "15-20",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Pike Push-Ups",
            muscleGroup: "shoulders",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "push",
            isTechnical: true,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Reverse Lunges",
            isBodyweight: true,
            videoUrl: "https://youtu.be/KC1M9nT6mXc",
            alternativeExercises: [
              "Hand-Release Push-Ups",
              "Decline Pike Push-Ups",
              "Elevated Pike Push-Ups",
              "Shoulder Tap Push-Ups",
              "Wall Handstand Hold"
            ],
            sets: 3,
            reps: "8-12",
            rpe: "7-8",
            rest: "60s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Reverse Lunges",
            muscleGroup: "glutes",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            pairedWith: "Push-Ups",
            isBodyweight: true,
            videoUrl: "https://youtu.be/1b98CIogp7Q",
            alternativeExercises: [
              "Forward Lunges",
              "Walking Lunges",
              "Split Squats",
              "Curtsy Lunges",
              "Lateral Lunges"
            ],
            sets: 3,
            reps: "12-15 / leg",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Plank Shoulder Taps",
            muscleGroup: "core",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "core",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            pairedWith: "Bodyweight Squats",
            isBodyweight: true,
            videoUrl: "https://youtu.be/9Ar2iRwKfnY",
            alternativeExercises: [
              "High-Plank Hold",
              "Plank Toe Taps",
              "Plank Jacks",
              "Mountain Climbers",
              "Dead Bug"
            ],
            sets: 3,
            reps: "20 total",
            rpe: "6-7",
            rest: "30s",
            tempo: "1:1:1",
            notes: ""
          },
          {
            name: "Glute Bridges",
            muscleGroup: "glutes",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Plank Shoulder Taps",
            isBodyweight: true,
            videoUrl: "https://youtu.be/Iw3LRapHcM0",
            alternativeExercises: [
              "Single-Leg Glute Bridge",
              "Hip Thrust (Feet Elevated)",
              "Frog Pumps",
              "Isometric Glute Bridge Hold",
              "Banded Glute Bridge"
            ],
            sets: 3,
            reps: "15-20",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          }
        ]
      },
      {
        blockType: "Cardio",
        allocatedMinutes: 5,
        name: "Burpees",
        rpe: 8
      }
    ],

    /* -------- Cool-Down (≈5 min) -------- */
    coolDown: [
      {
        name: "Child’s Pose",
        duration: "45 seconds",
        rpe: 3,
        notes: ""
      },
      {
        name: "Standing Quad Stretch",
        duration: "30 seconds / leg",
        rpe: 3,
        notes: ""
      },
      {
        name: "Chest Stretch",
        duration: "30 seconds",
        rpe: 3,
        notes: ""
      }
    ]
  },

  /* ================= DAY 2 – LOWER & CORE ================= */
  {
    dayLabel: "Day 2 – LOWER & CORE",

    /* -------- Warm-Up (≈5 min) -------- */
    warmUp: [
      { name: "High Knees", duration: "60 seconds", rpe: 5 },
      { name: "Leg Swings (Front/Side)", duration: "30 seconds / leg", rpe: 4 },
      { name: "Glute Bridges", duration: "45 seconds", rpe: 4 },
      { name: "Air Squats", duration: "20 reps", rpe: 4 }
    ],

    /* -------- Main Work (≈30 min RT + 5 min cardio) -------- */
    mainWork: [
      {
        blockType: "Resistance Training",
        allocatedMinutes: 30,
        exercises: [
          {
            name: "Bodyweight Split Squats",
            muscleGroup: "quads",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Side Plank",
            isBodyweight: true,
            videoUrl: "https://youtu.be/2C-uNgKwPLE",
            alternativeExercises: [
              "Reverse Lunges",
              "Step-Ups",
              "Bulgarian Split Squat",
              "Static Lunge",
              "Curtsy Lunge"
            ],
            sets: 3,
            reps: "10-12 / leg",
            rpe: "6-7",
            rest: "60s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Single-Leg Glute Bridge",
            muscleGroup: "glutes",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            isBodyweight: true,
            pairedWith: "Calf Raises",
            videoUrl: "https://youtu.be/6HYpQ1U0Cj8",
            alternativeExercises: [
              "Glute Bridge",
              "Hip Thrust (Feet Elevated)",
              "Frog Pumps",
              "Banded Glute Bridge",
              "Marching Glute Bridge"
            ],
            sets: 3,
            reps: "12-15 / leg",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Squat Jumps",
            muscleGroup: "quads",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: true,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Single-Leg Glute Bridge",
            isBodyweight: true,
            videoUrl: "https://youtu.be/Ut0bI5Pv6Os",
            alternativeExercises: [
              "Jumping Lunges",
              "Pulse Squats",
              "Tuck Jumps",
              "Broad Jumps",
              "Jumping Jacks"
            ],
            sets: 3,
            reps: "8-10",
            rpe: "7-8",
            rest: "60s",
            tempo: "1:0:1",
            notes: ""
          },
          {
            name: "Side Plank",
            muscleGroup: "core",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "core",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            pairedWith: "Bodyweight Split Squats",
            isBodyweight: true,
            videoUrl: "https://youtu.be/wqzrb67Dwf8",
            alternativeExercises: [
              "Plank Hold",
              "Plank Shoulder Taps",
              "Dead Bug",
              "Bird Dog",
              "Hollow Hold"
            ],
            sets: 3,
            reps: "30-45 s / side",
            rpe: "6-7",
            rest: "30s",
            tempo: "static",
            notes: ""
          },
          {
            name: "Calf Raises",
            muscleGroup: "calves",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            pairedWith: "Single-Leg Glute Bridge",
            isBodyweight: true,
            videoUrl: "https://youtu.be/-cdph8hv0O0",
            alternativeExercises: [
              "Single-Leg Calf Raise",
              "Seated Calf Raise (Bodyweight)",
              "Tiptoe Walk",
              "Jump Rope Skips",
              "Isometric Calf Hold"
            ],
            sets: 3,
            reps: "15-20",
            rpe: "6-7",
            rest: "30s",
            tempo: "1:1:2",
            notes: ""
          }
        ]
      },
      {
        blockType: "Cardio",
        allocatedMinutes: 5,
        name: "Mountain Climbers",
        rpe: 8
      }
    ],

    /* -------- Cool-Down (≈5 min) -------- */
    coolDown: [
      { name: "Standing Hamstring Stretch", duration: "45 seconds", rpe: 3, notes: "" },
      { name: "Figure-4 Stretch", duration: "30 seconds / leg", rpe: 3, notes: "" },
      { name: "Child’s Pose", duration: "45 seconds", rpe: 3, notes: "" }
    ]
  },
  /* ================= DAY 3 – PULL ================= */
  {
    dayLabel: "Day 3 – PULL",

    /* -------- Warm-Up (≈5 min) -------- */
    warmUp: [
      { name: "Jumping Jacks", duration: "60 seconds", rpe: 5 },
      { name: "Shoulder Rolls", duration: "30 seconds × 2", rpe: 4 },
      { name: "Cat-Cow Stretch", duration: "45 seconds", rpe: 4 },
      { name: "Arm Circles (Forward/Back)", duration: "30 seconds each", rpe: 4 }
    ],

    /* -------- Main Work (≈30 min RT + 5 min cardio) -------- */
    mainWork: [
      {
        blockType: "Resistance Training",
        allocatedMinutes: 30,
        exercises: [
          {
            name: "Doorway Rows",
            muscleGroup: "back",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "pull",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Reverse Snow Angels",
            isBodyweight: true,
            videoUrl: "https://youtu.be/8A6z31m6p8s",
            alternativeExercises: [
              "Inverted Table Rows",
              "Towel Rows (Under Foot)",
              "Single-Arm Backpack Rows",
              "Superman Pull-Downs",
              "Bent-Over Towel Rows"
            ],
            sets: 3,
            reps: "10-12",
            rpe: "6-7",
            rest: "60s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Superman",
            muscleGroup: "back",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "pull",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            isBodyweight: true,
            pairedWith: "Towel Bicep Curls",
            videoUrl: "https://youtu.be/z6PJMT2y8GQ",
            alternativeExercises: [
              "Reverse Hyperextension (Floor)",
              "Prone Y-Raise",
              "Bird Dog",
              "Swimmer Kicks",
              "Prone T-Raise"
            ],
            sets: 3,
            reps: "12-15",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Towel Bicep Curls",
            muscleGroup: "biceps",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "pull",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            isBodyweight: true,
            pairedWith: "Superman",
            videoUrl: "https://youtu.be/XTHs0DgoUAw",
            alternativeExercises: [
              "Isometric Bicep Hold (Towel)",
              "Backpack Curl",
              "Reverse Grip Inverted Row",
              "Door Handle Curl",
              "Resistance-Band Curl"
            ],
            sets: 3,
            reps: "12-15",
            rpe: "6-7",
            rest: "45s",
            tempo: "1:1:2",
            notes: ""
          },
          {
            name: "Reverse Snow Angels",
            muscleGroup: "traps",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "pull",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            isBodyweight: true,
            pairedWith: "Doorway Rows",
            videoUrl: "https://youtu.be/zlR9lxqF5j8",
            alternativeExercises: [
              "Prone Y-T-W Raises",
              "Scapular Wall Slides",
              "Face-Down I-Raise",
              "Standing Band Pull-Apart",
              "Seated Resistance-Band Face Pull"
            ],
            sets: 3,
            reps: "12-15",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Plank Shoulder Taps",
            muscleGroup: "core",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "core",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            isBodyweight: true,
            pairedWith: "Doorway Rows",
            videoUrl: "https://youtu.be/LM8XHLYJoYs",
            alternativeExercises: [
              "Bird Dog",
              "Dead Bug",
              "High-Plank Hold",
              "Mountain Climbers (Slow)",
              "Side-Plank Reach-Through"
            ],
            sets: 3,
            reps: "20 taps",
            rpe: "6-7",
            rest: "30s",
            tempo: "controlled",
            notes: ""
          }
        ]
      },
      {
        blockType: "Cardio",
        allocatedMinutes: 5,
        name: "Burpees",
        rpe: 8
      }
    ],

    /* -------- Cool-Down (≈5 min) -------- */
    coolDown: [
      { name: "Child’s Pose", duration: "45 seconds", rpe: 3, notes: "" },
      { name: "Cross-Body Shoulder Stretch", duration: "30 seconds / arm", rpe: 3, notes: "" },
      { name: "Thread-the-Needle Stretch", duration: "45 seconds", rpe: 3, notes: "" }
    ]
  },
  /* ================= DAY 4 – FULL BODY ================= */
  {
    dayLabel: "Day 4 – FULL BODY",

    /* -------- Warm-Up (≈5 min) -------- */
    warmUp: [
      { name: "High Knees", duration: "45 seconds", rpe: 5 },
      { name: "Inchworm Walk-outs", duration: "6 reps", rpe: 4 },
      { name: "World’s Greatest Stretch", duration: "30 seconds / side", rpe: 4 },
      { name: "Hip Circles", duration: "30 seconds each direction", rpe: 4 }
    ],

    /* -------- Main Work (≈30 min RT + 5 min cardio) -------- */
    mainWork: [
      {
        blockType: "Resistance Training",
        allocatedMinutes: 30,
        exercises: [
          {
            name: "Push-Up to Shoulder Tap",
            muscleGroup: "chest",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "push",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Reverse Lunges",
            isBodyweight: true,
            videoUrl: "https://youtu.be/5zYOKF0RpfM",
            alternativeExercises: [
              "Knee Push-Ups",
              "Incline Push-Ups",
              "Decline Push-Ups",
              "Hand-Release Push-Ups",
              "Diamond Push-Ups"
            ],
            sets: 3,
            reps: "10-12",
            rpe: "6-7",
            rest: "60s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Reverse Lunges",
            muscleGroup: "quads",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Push-Up to Shoulder Tap",
            isBodyweight: true,
            videoUrl: "https://youtu.be/1_t5vOPm9y0",
            alternativeExercises: [
              "Forward Lunges",
              "Walking Lunges",
              "Static Lunges",
              "Split Squat",
              "Curtsy Lunge"
            ],
            sets: 3,
            reps: "10-12 / leg",
            rpe: "6-7",
            rest: "60s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Pike Push-Ups",
            muscleGroup: "shoulders",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "push",
            isTechnical: true,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Glute Bridge March",
            isBodyweight: true,
            videoUrl: "https://youtu.be/j-M_HszYGmA",
            alternativeExercises: [
              "Decline Push-Ups",
              "Handstand Hold (Wall)",
              "Dolphin Push-Ups",
              "Elevated Pike Press",
              "Pseudo-Planche Push-Ups"
            ],
            sets: 3,
            reps: "8-10",
            rpe: "7-8",
            rest: "60s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Glute Bridge March",
            muscleGroup: "glutes",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Pike Push-Ups",
            isBodyweight: true,
            videoUrl: "https://youtu.be/ulR1-e3lz0A",
            alternativeExercises: [
              "Glute Bridge",
              "Single-Leg Glute Bridge",
              "Hip Thrust (Feet Elevated)",
              "Banded Glute Bridge",
              "Frog Pumps"
            ],
            sets: 3,
            reps: "12-15",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Bicycle Crunches",
            muscleGroup: "core",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "core",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            isBodyweight: true,
            pairedWith: "Squat Pulses",
            videoUrl: "https://youtu.be/Iwyvozckjak",
            alternativeExercises: [
              "Dead Bug",
              "Alternating V-Ups",
              "Russian Twists",
              "Toe Touch Crunches",
              "Reverse Crunches"
            ],
            sets: 3,
            reps: "20 reps",
            rpe: "6-7",
            rest: "30s",
            tempo: "controlled",
            notes: ""
          },
          {
            name: "Squat Pulses",
            muscleGroup: "quads",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            isBodyweight: true,
            pairedWith: "Bicycle Crunches",
            videoUrl: "https://youtu.be/8z-LZLGGk7o",
            alternativeExercises: [
              "Air Squats",
              "Jump Squats",
              "Wall Sit",
              "Isometric Squat Hold",
              "Sumo Squat Pulses"
            ],
            sets: 3,
            reps: "15-20",
            rpe: "7-8",
            rest: "45s",
            tempo: "1:0:1",
            notes: ""
          }
        ]
      },
      {
        blockType: "Cardio",
        allocatedMinutes: 5,
        name: "Jump Rope Skips",
        rpe: 8
      }
    ],

    /* -------- Cool-Down (≈5 min) -------- */
    coolDown: [
      { name: "Downward Dog", duration: "45 seconds", rpe: 3, notes: "" },
      { name: "Standing Quad Stretch", duration: "30 seconds / leg", rpe: 3, notes: "" },
      { name: "Seated Forward Fold", duration: "45 seconds", rpe: 3, notes: "" }
    ]
  },
  /* ================= DAY 5 – LEGS (Hamstring Focus) ================= */
  {
    dayLabel: "Day 5 – LEGS (HAM)",

    /* -------- Warm-Up (≈5 min) -------- */
    warmUp: [
      { name: "Bodyweight Good Mornings", duration: "45 seconds", rpe: 5 },
      { name: "Leg Swings (Front & Side)", duration: "30 seconds / leg", rpe: 4 },
      { name: "Glute Bridges", duration: "12 reps", rpe: 4 },
      { name: "Hip Circles", duration: "30 seconds / side", rpe: 4 }
    ],

    /* -------- Main Work (≈30 min RT + 5 min cardio) -------- */
    mainWork: [
      {
        blockType: "Resistance Training",
        allocatedMinutes: 30,
        exercises: [
          {
            name: "Single-Leg Romanian Deadlift",
            muscleGroup: "hamstrings",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            isBodyweight: true,
            pairedWith: "Glute Bridge Walkout",
            isBodyweight: true,
            videoUrl: "https://youtu.be/2zcE1Yd8z9M",
            alternativeExercises: [
              "Good Morning (Bodyweight)",
              "Sliding Hamstring Curl",
              "Reverse Hip Hinge",
              "Backpack RDL",
              "Tabletop Hip Thrust"
            ],
            sets: 3,
            reps: "8-10 / leg",
            rpe: "7-8",
            rest: "60s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Glute Bridge Walkout",
            muscleGroup: "glutes",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Single-Leg Romanian Deadlift",
            isBodyweight: true,
            videoUrl: "https://youtu.be/OPyHpt_kEJE",
            alternativeExercises: [
              "Glute Bridge March",
              "Single-Leg Glute Bridge",
              "Hip Thrust (Feet Elevated)",
              "Frog Pumps",
              "Isometric Glute Bridge Hold"
            ],
            sets: 3,
            reps: "10-12",
            rpe: "6-7",
            rest: "60s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Hamstring Curl (Towel / Slider)",
            muscleGroup: "hamstrings",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            pairedWith: "Step-Up to Knee Drive",
            isBodyweight: true,
            videoUrl: "https://youtu.be/F6BK3gheSxE",
            alternativeExercises: [
              "Nordic Curl (Assisted)",
              "Swiss-Ball Hamstring Curl",
              "Prone Hamstring Curl (Band)",
              "Gliding Ham Curl",
              "Stability-Ball Leg Curl"
            ],
            sets: 3,
            reps: "12-15",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Step-Up to Knee Drive",
            muscleGroup: "quads",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            pairedWith: "Hamstring Curl (Towel / Slider)",
            isBodyweight: true,
            videoUrl: "https://youtu.be/9Z3-wWc7o4w",
            alternativeExercises: [
              "Reverse Lunge",
              "Bulgarian Split Squat",
              "Curtsy Lunge",
              "Box Step-Up",
              "Static Split Squat"
            ],
            sets: 3,
            reps: "10-12 / leg",
            rpe: "6-7",
            rest: "45s",
            tempo: "2:1:2",
            notes: ""
          },
          {
            name: "Single-Leg Calf Raise",
            muscleGroup: "calves",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            pairedWith: "Hamstring Curl (Towel / Slider)",
            isBodyweight: true,
            videoUrl: "https://youtu.be/OLHH- c_bDs0",
            alternativeExercises: [
              "Double-Leg Calf Raise",
              "Seated Calf Raise (Bodyweight)",
              "Wall-Lean Calf Raise",
              "Banded Calf Raise",
              "Calf Raise Pulse"
            ],
            sets: 3,
            reps: "15-20 / leg",
            rpe: "6-7",
            rest: "30s",
            tempo: "1:1:1",
            notes: ""
          }
        ]
      },
      {
        blockType: "Cardio",
        allocatedMinutes: 5,
        name: "Skater Jumps",
        rpe: 8
      }
    ],

    /* -------- Cool-Down (≈5 min) -------- */
    coolDown: [
      { name: "Standing Hamstring Stretch", duration: "45 seconds", rpe: 3, notes: "" },
      { name: "Seated Figure-4 Stretch", duration: "30 seconds / leg", rpe: 3, notes: "" },
      { name: "Calf Stretch (Wall)", duration: "30 seconds / leg", rpe: 3, notes: "" }
    ]
  },
  /* ================= DAY 6 – HIIT & CORE ================= */
  {
    dayLabel: "Day 6 – HIIT & CORE",

    /* -------- Warm-Up  (≈5 min) -------- */
    warmUp: [
      { name: "Jumping Jacks", duration: "45 seconds", rpe: 5 },
      { name: "World’s Greatest Stretch", duration: "30 seconds / side", rpe: 4 },
      { name: "Cat-Cow", duration: "8 reps", rpe: 4 },
      { name: "Bodyweight Squats", duration: "12 reps", rpe: 4 }
    ],

    /* -------- Main Work (≈25 min HIIT + 10 min Core) -------- */
    mainWork: [
      /* HIIT Circuit – 20 min */
      {
        blockType: "HIIT",
        allocatedMinutes: 20,
        name: "Tabata-Style 4-Round Circuit",
        rpe: 8,
        notes: "20s work / 10s rest • Complete all eight intervals per round; rest 60 s between rounds.",
        exercises: [
          {
            name: "Burpees",
            muscleGroup: "full body",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "fullbody",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            isBodyweight: true,
            videoUrl: "https://youtu.be/TJ2ifmkGGus",
            alternativeExercises: [
              "Half-Burpee",
              "Squat Thrust",
              "Sprawl",
              "Step-Back Burpee",
              "Jump Squat"
            ]
          },
          {
            name: "High Knees",
            muscleGroup: "cardio",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "cardio",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "cardio",
            isBodyweight: true,
            videoUrl: "https://youtu.be/OAJ_J3EZkdY",
            alternativeExercises: [
              "Butt Kicks",
              "Marching High Knees",
              "Jog in Place",
              "Fast Feet Shuffle",
              "Jumping Jacks"
            ]
          },
          {
            name: "Mountain Climbers",
            muscleGroup: "core",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "core",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "cardio",
            isBodyweight: true,
            videoUrl: "https://youtu.be/IT94xC35u6k",
            alternativeExercises: [
              "Cross-Body Mountain Climbers",
              "Slow Mountain Climbers",
              "Plank Knee Drives",
              "Standing Climbers",
              "Plank Jacks"
            ]
          },
          {
            name: "Skater Jumps",
            muscleGroup: "legs",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "compound",
            isBodyweight: true,
            videoUrl: "https://youtu.be/nRAkcp3s2p8",
            alternativeExercises: [
              "Lateral Bounds",
              "Side-Step Squat",
              "Jump Squat",
              "Curtsy Lunge Hop",
              "Speed Skaters (Low Impact)"
            ]
          }
        ]
      },

      /* Core Finisher – 10 min */
      {
        blockType: "Resistance Training",
        allocatedMinutes: 10,
        exercises: [
          {
            name: "Plank Shoulder Taps",
            muscleGroup: "core",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "core",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            isBodyweight: true,
            videoUrl: "https://youtu.be/it6PzT-DHCw",
            alternativeExercises: [
              "Standard Plank",
              "Knee-Plank Shoulder Taps",
              "Plank with Reach",
              "High-Plank Hold",
              "Bird-Dog"
            ],
            sets: 3,
            reps: "16-20 (alt)",
            rpe: "6-7",
            rest: "30s",
            tempo: "controlled",
            notes: ""
          },
          {
            name: "Alternating V-Ups",
            muscleGroup: "core",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "core",
            isTechnical: true,
            advancedVariant: false,
            typeOfMovement: "isolation",
            isBodyweight: true,
            videoUrl: "https://youtu.be/bk-MNSx5RPU",
            alternativeExercises: [
              "Toe-Touch Crunch",
              "Dead Bug",
              "Straight-Leg Crunch",
              "Reverse Crunch",
              "Seated Knee Tuck"
            ],
            sets: 3,
            reps: "12-15 / side",
            rpe: "7-8",
            rest: "45s",
            tempo: "up fast • down slow",
            notes: ""
          },
          {
            name: "Glute Bridge Hold",
            muscleGroup: "glutes",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "isolation",
            isBodyweight: true,
            videoUrl: "https://youtu.be/r5kY-D-3p_kw",
            alternativeExercises: [
              "Glute Bridge March",
              "Single-Leg Glute Bridge",
              "Hip Thrust (Feet Elevated)",
              "Banded Glute Bridge",
              "Frog Pump Hold"
            ],
            sets: 3,
            reps: "30-40 s hold",
            rpe: "6-7",
            rest: "30s",
            tempo: "static",
            notes: ""
          }
        ]
      }
    ],

    /* -------- Cool-Down (≈5 min) -------- */
    coolDown: [
      { name: "Child’s Pose", duration: "45 seconds", rpe: 3, notes: "" },
      { name: "Seated Forward Fold", duration: "45 seconds", rpe: 3, notes: "" },
      { name: "Figure-4 Glute Stretch", duration: "30 seconds / side", rpe: 3, notes: "" }
    ]
  },
  /* ================= DAY 7 – ACTIVE RECOVERY / MOBILITY ================= */
  {
    dayLabel: "Day 7 – ACTIVE RECOVERY",

    /* -------- Warm-Up (≈5 min) -------- */
    warmUp: [
      { name: "Marching in Place", duration: "60 seconds", rpe: 4 },
      { name: "Arm Circles (Fwd/Rev)", duration: "30 seconds / dir", rpe: 4 },
      { name: "Hip Circles", duration: "30 seconds / dir", rpe: 3 },
      { name: "Inchworm Walk-Out", duration: "6 reps", rpe: 4 }
    ],

    /* -------- Main Work (≈25 min Mobility Flow) -------- */
    mainWork: [
      {
        blockType: "Recovery",
        allocatedMinutes: 25,
        exercises: [
          {
            name: "World’s Greatest Stretch Flow",
            muscleGroup: "full body",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "fullbody",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "mobility",
            isBodyweight: true,
            videoUrl: "https://youtu.be/2If7T-H4Lf0",
            alternativeExercises: [
              "Lunge-With-Reach",
              "Spiderman Stretch",
              "Knee-Elbow Opener",
              "Deep Lunge Hold",
              "Runner’s Lunge Twist"
            ],
            sets: 2,
            reps: "45 s / side",
            rpe: "4-5",
            rest: "30 s",
            tempo: "slow & controlled",
            notes: ""
          },
          {
            name: "Cat-Cow ➜ Cobra Flow",
            muscleGroup: "core",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "core",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "mobility",
            isBodyweight: true,
            videoUrl: "https://youtu.be/5rLYaFtAa0A",
            alternativeExercises: [
              "Cat-Cow Only",
              "Prone Press-Up",
              "Sphinx Stretch",
              "Child’s Pose to Cobra",
              "Seated Cat-Cow"
            ],
            sets: 2,
            reps: "8 slow flows",
            rpe: "4-5",
            rest: "30 s",
            tempo: "smooth",
            notes: ""
          },
          {
            name: "90/90 Hip Switch",
            muscleGroup: "hips",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "legs",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "mobility",
            isBodyweight: true,
            videoUrl: "https://youtu.be/Sf_yMJ2-eHc",
            alternativeExercises: [
              "Seated Hip Internal-External Rotation",
              "Shin-Box Get-Up",
              "Prone Hip IR/ER",
              "Standing Hip CARs",
              "Half-Kneeling Hip Lift"
            ],
            sets: 2,
            reps: "10 switches",
            rpe: "4-5",
            rest: "30 s",
            tempo: "controlled",
            notes: ""
          },
          {
            name: "Thread-the-Needle (Thoracic Opener)",
            muscleGroup: "upper back",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "pull",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "mobility",
            isBodyweight: true,
            videoUrl: "https://youtu.be/v-x-dBw7Kp8",
            alternativeExercises: [
              "Open-Book Stretch",
              "T-Spine Rotation (Side-Lying)",
              "Child’s Pose Reach",
              "Quadruped Reach-Through",
              "Wall Thoracic Rotation"
            ],
            sets: 2,
            reps: "10 / side",
            rpe: "3-4",
            rest: "30 s",
            tempo: "pause at end-range",
            notes: ""
          },
          {
            name: "Down-Dog ➜ Up-Dog Flow",
            muscleGroup: "full body",
            equipmentNeeded: ["Bodyweight"],
            splitTag: "fullbody",
            isTechnical: false,
            advancedVariant: false,
            typeOfMovement: "mobility",
            isBodyweight: true,
            videoUrl: "https://youtu.be/BnS_c-EEKeI",
            alternativeExercises: [
              "Down-Dog Hold",
              "Up-Dog Hold",
              "Pike to Cobra",
              "Dolphin Push-Up",
              "Child’s Pose to Up-Dog"
            ],
            sets: 2,
            reps: "8 slow flows",
            rpe: "4-5",
            rest: "30 s",
            tempo: "steady breath",
            notes: ""
          }
        ]
      }
    ],

    /* -------- Cool-Down (≈5 min) -------- */
    coolDown: [
      { name: "Child’s Pose with Reach", duration: "60 seconds", rpe: 2, notes: "" },
      { name: "Seated Forward Fold", duration: "45 seconds", rpe: 2, notes: "" },
      { name: "Supine Figure-4 Stretch", duration: "30 seconds / side", rpe: 2, notes: "" }
    ]
  },
];

/***********************************************************************
* Improved Exercise Filtering
***********************************************************************/

function filterExercisesForUser(exList) {
  let arr = [...exList];
  const loc = (formData.workoutLocation || "home").toLowerCase();
  const eq = (formData.equipment || []).map(s => s.toLowerCase());

  // 1) Exclude Group B if not groupB
  if (!isGroupB()) {
    arr = arr.filter(x => !x.isGroupBOnly);
  }

  // 2) If "none of the above", only pure bodyweight
  if (eq.includes("none of the above") || userHasBenchOnly()) {
    arr = arr.filter(e =>
      e.equipmentNeeded.length === 1 &&
      e.equipmentNeeded[0].toLowerCase() === "bodyweight"
    );
  } else {
    // Must have all equipment for each exercise
    arr = arr.filter(e =>
      e.equipmentNeeded.every(req => eq.includes(req.toLowerCase()))
    );
  }

  // 3) If GYM => remove isHomeOnly exercises
  if (loc === "gym") {
    arr = arr.filter(e => e.isHomeOnly !== true);
  }

  // 4) If HOME => remove machine-based cardio (or other gym-specific exercises)
  if (loc === "home") {
    arr = arr.filter(e => {
      if (e.typeOfMovement === "cardio" && e.equipmentNeeded.includes("Machines")) {
        return false;
      }
      return true;
    });
  }

  // 5) Check if the user truly has equipment for vertical pulls
  // Include dumbbells, barbells, and other equipment that can perform vertical movements
  const canDoVertical = eq.includes("pull-up bar") ||
    eq.includes("cables") ||
    eq.includes("machines") ||
    eq.includes("dumbbells") ||
    eq.includes("barbells");

  // If user *cannot* do vertical, remove *all* vertical-back movements
  if (!canDoVertical) {
    arr = arr.filter(x =>
      !(x.muscleGroup === "back" && x.movementPlane === "vertical")
    );
  }

  // 6) Ensure no duplicates and fallback to bodyweight if empty
  if (!arr.length) {
    // console.warn("No valid equipment found => fallback to bodyweight only.");
    arr = BODYWEIGHT_EXERCISES.slice();
  }

  // console.log("Filtered exercise list for user:", arr);
  return arr;
}

/***********************************************************************
* Pull‐Up Bar / Dip Station Calisthenics Approach
***********************************************************************/

function userHasOnlyPullupBar() {
  const eq = (formData.equipment || []).map(s => s.toLowerCase());
  // “only pull-up bar” => eq has “pull-up bar” and eq.length===1
  return (eq.length === 1 && eq.includes("pull-up bar"));
}
function userHasOnlyDipStation() {
  const eq = (formData.equipment || []).map(s => s.toLowerCase());
  return (eq.length === 1 && eq.includes("dip station"));
}
function userHasPullupBarAndDipStationOnly() {
  const eq = (formData.equipment || []).map(s => s.toLowerCase());
  // Must contain exactly 2 items: “pull-up bar” + “dip station”
  if (eq.length === 2 && eq.includes("pull-up bar") && eq.includes("dip station")) {
    return true;
  }
  return false;
}
function userHasBenchOnly() {
  const eq = (formData.equipment || []).map(e => e.toLowerCase());
  return eq.length === 1 && eq.includes("bench");
}
function isExclusiveCalisthenics() {
  // Check if the user’s entire equipment set is only “pull-up bar,” or only “dip station,” or both
  if (userHasOnlyPullupBar()) return true;
  if (userHasOnlyDipStation()) return true;
  if (userHasPullupBarAndDipStationOnly()) return true;
  return false;
}

function buildCalisthenicsWeek(weekNum, totalDays) {
  let dayLabels = ["push", "pull", "legs", "upper", "fullbody"];
  if (totalDays > 5) totalDays = 5;

  let outDays = [];
  for (let d = 0; d < totalDays; d++) {
    let spl = dayLabels[d];
    outDays.push(buildCalisthenicsDay(weekNum, spl));
  }
  return {
    week: weekNum,
    phase: getPhaseForWeek(weekNum).name,
    days: outDays
  };
}

function getCalisthenicsExercisesFor(splitName, phaseName) {
  const eq = (formData.equipment || []).map(s => s.toLowerCase());
  let havePull = eq.includes("pull-up bar");
  let haveDip = eq.includes("dip station");
  let comboType = (havePull && !haveDip) ? "pullupOnly"
    : (!havePull && haveDip) ? "dipOnly"
      : (havePull && haveDip) ? "both"
        : "pullupOnly"; // fallback

  const CALIS_DICT = {
    pullupOnly: {
      "Foundational Phase": {
        push: [
          { name: "Incline Push-Ups", sets: 3, reps: "10-12", notes: "3s up/down" },
          { name: "Pike Push-Ups", sets: 3, reps: "8-10", notes: "Emphasis on shoulders" },
          { name: "Hollow Body Hold", sets: 3, reps: "15-20s" },
        ],
        pull: [
          { name: "Pull-Ups", sets: 3, reps: "6-8", notes: "Controlled tempo: 3s up/down" },
          { name: "Chin-Ups", sets: 3, reps: "8-10" },
          { name: "Hanging Leg Raises", sets: 3, reps: "12-15" },
        ],
        legs: [
          { name: "Single-Leg Box Squats", sets: 3, reps: "6-8/leg", notes: "Use support for balance" },
          { name: "Hanging Knee Tucks", sets: 3, reps: "12-15" },
          { name: "Calf Raises on a Step", sets: 3, reps: "15-20" },
        ],
        upper: [
          { name: "Pull-Ups", sets: 3, reps: "6-8" },
          { name: "Chin-Ups", sets: 3, reps: "8-10" },
          { name: "Incline Push-Ups", sets: 3, reps: "10-12" },
          { name: "Hollow Body Hold", sets: 3, reps: "15-20s" },
        ],
        fullbody: [
          { name: "Pull-Ups", sets: 3, reps: "6-8" },
          { name: "Hanging Knee Raises", sets: 3, reps: "12-15" },
          { name: "Single-Leg Box Squats", sets: 3, reps: "6-8/leg" },
          { name: "Calf Raises", sets: 3, reps: "15-20" },
        ],
      },
      "Hypertrophy Phase": {
        push: [
          { name: "Incline Push-Ups", sets: 4, reps: "12-15" },
          { name: "Pike Push-Ups", sets: 4, reps: "10-12" },
          { name: "Hollow Body Hold", sets: 4, reps: "20-30s" },
        ],
        pull: [
          { name: "Pull-Ups", sets: 4, reps: "8-10", notes: "Slight pause at the top" },
          { name: "Chin-Ups", sets: 4, reps: "10-12" },
          { name: "Hanging Leg Raises", sets: 4, reps: "12-15" },
        ],
        legs: [
          { name: "Single-Leg Box Squats", sets: 4, reps: "8-10/leg" },
          { name: "Hanging Knee Tucks", sets: 4, reps: "12-15" },
          { name: "Calf Raises on a Step", sets: 4, reps: "20-25" },
        ],
        upper: [
          { name: "Pull-Ups", sets: 4, reps: "8-10" },
          { name: "Chin-Ups", sets: 4, reps: "10-12" },
          { name: "Incline Push-Ups", sets: 4, reps: "12-15" },
          { name: "Hollow Body Hold", sets: 4, reps: "20-30s" },
        ],
        fullbody: [
          { name: "Pull-Ups", sets: 4, reps: "8-10" },
          { name: "Hanging Knee Raises", sets: 4, reps: "12-15" },
          { name: "Single-Leg Box Squats", sets: 4, reps: "8-10/leg" },
          { name: "Calf Raises", sets: 4, reps: "20-25" },
        ],
      },
      "Strength Phase": {
        push: [
          { name: "Incline Push-Ups (Feet Elevated)", sets: 4, reps: "12-15" },
          { name: "Pike Push-Ups (Advanced)", sets: 4, reps: "10-12" },
          { name: "Hollow Body Rock", sets: 4, reps: "20-30s" },
        ],
        pull: [
          { name: "Archer Pull-Ups", sets: 4, reps: "6-8", notes: "Advanced progression" },
          { name: "Chin-Ups (Weighted or Tempo)", sets: 4, reps: "8-10" },
          { name: "Hanging Windshield Wipers", sets: 4, reps: "8-12" },
        ],
        legs: [
          { name: "Single-Leg Box Squats (Depth Increased)", sets: 4, reps: "8-10/leg" },
          { name: "Hanging Knee Tucks (Add Tempo)", sets: 4, reps: "15-20" },
          { name: "Calf Raises on a Step (Paused)", sets: 4, reps: "20-25" },
        ],
        upper: [
          { name: "Archer Pull-Ups", sets: 4, reps: "6-8" },
          { name: "Chin-Ups", sets: 4, reps: "8-10" },
          { name: "Incline Push-Ups (Feet Elevated)", sets: 4, reps: "12-15" },
          { name: "Hollow Body Rock", sets: 4, reps: "20-30s" },
        ],
        fullbody: [
          { name: "Pull-Ups (Tempo)", sets: 4, reps: "8-10" },
          { name: "Hanging Windshield Wipers", sets: 4, reps: "8-12" },
          { name: "Single-Leg Box Squats", sets: 4, reps: "8-10/leg" },
          { name: "Calf Raises", sets: 4, reps: "20-25" },
        ],
      },
    },
    dipOnly: {
      "Foundational Phase": {
        push: [
          { name: "Dips", sets: 3, reps: "8-10" },
          { name: "Incline Dips", sets: 3, reps: "10-12" },
          { name: "Knee Raises (on Dip Station)", sets: 3, reps: "12-15" },
          { name: "L-Sit", sets: 3, reps: "10-15s" },
        ],
        pull: [
          { name: "Modified Rows (on Dip Bars)", sets: 3, reps: "10-12" },
          { name: "Bodyweight Bicep Curls", sets: 3, reps: "12-15" },
          { name: "Dip Bar Shrugs", sets: 3, reps: "12-15" },
        ],
        legs: [
          { name: "Step-Ups (on Dip Bars)", sets: 3, reps: "8-10/leg" },
          { name: "Sissy Squats", sets: 3, reps: "10-12" },
          { name: "Hip Thrusts", sets: 3, reps: "12-15" },
        ],
        upper: [
          { name: "Dips", sets: 3, reps: "8-10" },
          { name: "Incline Dips", sets: 3, reps: "10-12" },
          { name: "Modified Rows", sets: 3, reps: "10-12" },
          { name: "Dip Bar Shrugs", sets: 3, reps: "12-15" },
          { name: "L-Sit", sets: 3, reps: "10-15s" },
        ],
        fullbody: [
          { name: "Dips", sets: 3, reps: "8-10" },
          { name: "Step-Ups", sets: 3, reps: "8-10/leg" },
          { name: "Modified Rows", sets: 3, reps: "10-12" },
          { name: "Sissy Squats", sets: 3, reps: "10-12" },
          { name: "L-Sit", sets: 3, reps: "10-15s" },
        ],
      },
      "Hypertrophy Phase": {
        push: [
          { name: "Dips", sets: 4, reps: "10-12" },
          { name: "Incline Dips", sets: 4, reps: "12-15" },
          { name: "Knee Raises (on Dip Station)", sets: 4, reps: "15-20" },
          { name: "L-Sit", sets: 4, reps: "15-20s" },
        ],
        pull: [
          { name: "Modified Rows (on Dip Bars)", sets: 4, reps: "10-12" },
          { name: "Bodyweight Bicep Curls", sets: 4, reps: "15-18" },
          { name: "Dip Bar Shrugs", sets: 4, reps: "15-20" },
        ],
        legs: [
          { name: "Step-Ups (on Dip Bars)", sets: 4, reps: "10-12/leg" },
          { name: "Sissy Squats", sets: 4, reps: "12-15" },
          { name: "Hip Thrusts", sets: 4, reps: "15-18" },
        ],
        upper: [
          { name: "Dips", sets: 4, reps: "10-12" },
          { name: "Incline Dips", sets: 4, reps: "12-15" },
          { name: "Modified Rows", sets: 4, reps: "10-12" },
          { name: "Dip Bar Shrugs", sets: 4, reps: "15-20" },
          { name: "L-Sit on Dip Bars", sets: 4, reps: "15-20s" },
        ],
        fullbody: [
          { name: "Dips", sets: 4, reps: "10-12" },
          { name: "Step-Ups", sets: 4, reps: "10-12/leg" },
          { name: "Modified Rows", sets: 4, reps: "10-12" },
          { name: "Sissy Squats", sets: 4, reps: "12-15" },
          { name: "L-Sit", sets: 4, reps: "15-20s" },
        ],
      },
      "Strength Phase": {
        push: [
          { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
          { name: "Incline Dips (Pause at Bottom)", sets: 4, reps: "10-12" },
          { name: "Knee Raises (on Dip Station)", sets: 4, reps: "15-20" },
          { name: "L-Sit (Extended Hold)", sets: 4, reps: "15-25s" },
        ],
        pull: [
          { name: "Modified Rows (Feet Elevated)", sets: 4, reps: "8-10" },
          { name: "Bodyweight Bicep Curls (Slow Tempo)", sets: 4, reps: "12-15" },
          { name: "Dip Bar Shrugs (Add Tempo)", sets: 4, reps: "15-20" },
        ],
        legs: [
          { name: "Step-Ups (Weighted or Higher Platform)", sets: 4, reps: "10-12/leg" },
          { name: "Sissy Squats (Advanced Range)", sets: 4, reps: "12-15" },
          { name: "Hip Thrusts (Hold at Top)", sets: 4, reps: "12-15" },
        ],
        upper: [
          { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
          { name: "Incline Dips (Pause at Bottom)", sets: 4, reps: "10-12" },
          { name: "Modified Rows (Feet Elevated)", sets: 4, reps: "8-10" },
          { name: "Dip Bar Shrugs", sets: 4, reps: "15-20" },
          { name: "L-Sit (Extended Hold)", sets: 4, reps: "15-25s" },
        ],
        fullbody: [
          { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
          { name: "Step-Ups (Weighted)", sets: 4, reps: "10-12/leg" },
          { name: "Modified Rows", sets: 4, reps: "8-10" },
          { name: "Sissy Squats", sets: 4, reps: "12-15" },
          { name: "L-Sit (Extended Hold)", sets: 4, reps: "15-25s" },
        ],
      },
    },
    both: {
      "Foundational Phase": {
        push: [
          { name: "Dips", sets: 3, reps: "8-10" },
          { name: "Pike Push-Ups", sets: 3, reps: "8-10" },
          { name: "Incline Push-Ups (on Dip Bars)", sets: 3, reps: "10-12" },
          { name: "L-Sit", sets: 3, reps: "10-15s" },
        ],
        pull: [
          { name: "Pull-Ups (Wide Grip)", sets: 3, reps: "6-8" },
          { name: "Chin-Ups", sets: 3, reps: "8-10" },
          { name: "Archer Rows (on Dip Bars)", sets: 3, reps: "10-12" },
          { name: "Hanging Leg Raises", sets: 3, reps: "12-15" },
        ],
        legs: [
          { name: "Assisted Pistol Squats (using bars for balance)", sets: 3, reps: "6-8/leg" },
          { name: "Hanging Knee Tucks", sets: 3, reps: "12-15" },
          { name: "Step-Ups (on Dip Bars)", sets: 3, reps: "8-10/leg" },
        ],
        upper: [
          { name: "Pull-Ups", sets: 3, reps: "6-8" },
          { name: "Dips", sets: 3, reps: "8-10" },
          { name: "Chin-Ups", sets: 3, reps: "8-10" },
          { name: "Incline Push-Ups (on Dip Bars)", sets: 3, reps: "10-12" },
          { name: "Hanging Leg Raises", sets: 3, reps: "12-15" },
        ],
        fullbody: [
          { name: "Pull-Ups", sets: 3, reps: "6-8" },
          { name: "Dips", sets: 3, reps: "8-10" },
          { name: "Hanging Knee Tucks", sets: 3, reps: "12-15" },
          { name: "Step-Ups (on Dip Bars)", sets: 3, reps: "8-10/leg" },
        ],
      },
      "Hypertrophy Phase": {
        push: [
          { name: "Dips", sets: 4, reps: "10-12" },
          { name: "Pike Push-Ups", sets: 4, reps: "10-12" },
          { name: "Incline Push-Ups (on Dip Bars)", sets: 4, reps: "12-15" },
          { name: "L-Sit", sets: 4, reps: "15-20s" },
        ],
        pull: [
          { name: "Pull-Ups (Wide Grip)", sets: 4, reps: "8-10" },
          { name: "Chin-Ups", sets: 4, reps: "10-12" },
          { name: "Archer Rows (on Dip Bars)", sets: 4, reps: "10-12" },
          { name: "Hanging Leg Raises", sets: 4, reps: "15-20" },
        ],
        legs: [
          { name: "Assisted Pistol Squats (using bars for balance)", sets: 4, reps: "8-10/leg" },
          { name: "Hanging Knee Tucks", sets: 4, reps: "12-15" },
          { name: "Step-Ups (on Dip Bars)", sets: 4, reps: "10-12/leg" },
        ],
        upper: [
          { name: "Pull-Ups", sets: 4, reps: "8-10" },
          { name: "Dips", sets: 4, reps: "10-12" },
          { name: "Chin-Ups", sets: 4, reps: "10-12" },
          { name: "Incline Push-Ups (on Dip Bars)", sets: 4, reps: "12-15" },
          { name: "Hanging Leg Raises", sets: 4, reps: "15-20" },
        ],
        fullbody: [
          { name: "Pull-Ups", sets: 4, reps: "8-10" },
          { name: "Dips", sets: 4, reps: "10-12" },
          { name: "Hanging Knee Tucks", sets: 4, reps: "12-15" },
          { name: "Step-Ups (on Dip Bars)", sets: 4, reps: "10-12/leg" },
        ],
      },
      "Strength Phase": {
        push: [
          { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
          { name: "Pike Push-Ups (Feet Elevated)", sets: 4, reps: "10-12" },
          { name: "Incline Push-Ups (Pause at Bottom)", sets: 4, reps: "12-15" },
          { name: "L-Sit (Extended Hold)", sets: 4, reps: "15-25s" },
        ],
        pull: [
          { name: "Pull-Ups (Wide Grip, Weighted or Tempo)", sets: 4, reps: "8-10" },
          { name: "Chin-Ups (Weighted)", sets: 4, reps: "10-12" },
          { name: "Archer Rows (on Dip Bars)", sets: 4, reps: "10-12" },
          { name: "Hanging Windshield Wipers", sets: 4, reps: "8-12" },
        ],
        legs: [
          { name: "Assisted Pistol Squats (Add Load)", sets: 4, reps: "8-10/leg" },
          { name: "Hanging Knee Tucks (Slow Tempo)", sets: 4, reps: "12-15" },
          { name: "Step-Ups (Weighted)", sets: 4, reps: "10-12/leg" },
        ],
        upper: [
          { name: "Pull-Ups (Weighted)", sets: 4, reps: "8-10" },
          { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
          { name: "Chin-Ups (Tempo)", sets: 4, reps: "10-12" },
          { name: "Incline Push-Ups (Feet Elevated)", sets: 4, reps: "12-15" },
          { name: "Hanging Windshield Wipers", sets: 4, reps: "8-12" },
        ],
        fullbody: [
          { name: "Pull-Ups (Weighted)", sets: 4, reps: "8-10" },
          { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
          { name: "Hanging Knee Tucks (Tempo)", sets: 4, reps: "12-15" },
          { name: "Step-Ups (Weighted)", sets: 4, reps: "10-12/leg" },
        ],
      },
    },
  };

  let phData = CALIS_DICT[comboType][phaseName];
  if (!phData) return [];
  let arr = phData[splitName];
  if (!arr) return [];
  return arr;
}

/***********************************************************************
* buildMultiWeekProgram => creates an array of weeks
***********************************************************************/

function buildMultiWeekProgram(exList, endWeek) {
  let out = [];
  for (let w = 1; w <= endWeek; w++) {
    out.push(buildWeekProgram(exList, w));
  }
  return out;
}

/***********************************************************************
* GLOBAL storage for same-phase, same-split "caching" 
***********************************************************************/

const storedPhaseWorkouts = {
  "Foundational Phase": {},
  "Hypertrophy Phase": {},
  "Strength Phase": {},
};

function getCachedPullWorkoutForPhase(phaseName, exList) {
  if (!storedPhaseWorkouts[phaseName]) {
    storedPhaseWorkouts[phaseName] = {};
  }
  if (storedPhaseWorkouts[phaseName].pull) {
    return storedPhaseWorkouts[phaseName].pull;
  }

  let pullArray = doPullLogicForPhase(phaseName, exList);
  storedPhaseWorkouts[phaseName].pull = pullArray;
  return pullArray;
}

function doPullLogicForPhase(phaseName, exList) {
  let isPhase1 = (phaseName === "Foundational Phase");
  let arr = [...exList];
  if (isPhase1) {
    let nonTech = arr.filter(e => !e.isTechnical);
    if (canFillPullSlots(nonTech)) {
      arr = nonTech;
    }
  }
  let out = pickPullDayOnce(arr);
  return out;
}

function canFillPullSlots(possible) {
  let temp = pickPullDay(possible, 1);
  return (temp.length >= 6);
}

function pickPullDayOnce(arr) {
  // #1 => back vertical
  let backV = arr.filter(e => e.muscleGroup === "back" && e.movementPlane === "vertical");
  let slot1 = pickRandom(backV);

  if (!slot1) {
    return pickPullDayNoVertical(arr);
  }

  // else continue
  arr = arr.filter(e => e !== slot1);

  // #2 => horizontal
  let backH = arr.filter(e => e.muscleGroup === "back" && e.movementPlane === "horizontal");
  let slot2 = pickRandom(backH);
  arr = arr.filter(e => e !== slot2);

  // #3 => biceps
  let biceps = arr.filter(e => e.muscleGroup === "biceps");
  let slot3 = pickRandom(biceps);
  arr = arr.filter(e => e !== slot3);

  // #4 => arch
  let arch = arr.filter(e =>
    e.muscleGroup === "back" &&
    (e.name.toLowerCase().includes("pullover") || e.name.toLowerCase().includes("extension"))
  );
  let slot4 = pickRandom(arch);
  arr = arr.filter(e => e !== slot4);

  // #5 => traps
  let traps = arr.filter(e => e.muscleGroup === "traps");
  let slot5 = pickRandom(traps);
  arr = arr.filter(e => e !== slot5);

  // #6 => forearms
  let fore = arr.filter(e => e.muscleGroup === "forearms");
  let slot6 = pickRandom(fore);

  return [slot1, slot2, slot3, slot4, slot5, slot6].filter(Boolean);
}

function buildUpperForThisWeek(phaseDat, wNum) {
  const phaseName = getPhaseForWeek(wNum).name;
  if (!storedPhaseWorkouts[phaseName]) {
    storedPhaseWorkouts[phaseName] = {};
  }
  const pushData = storedPhaseWorkouts[phaseName].pushFlat ? [storedPhaseWorkouts[phaseName].pushFlat] : [];
  const pullData = storedPhaseWorkouts[phaseName].pull || [];

  // For each muscle group, define the criteria and where to source it.
  const targets = [
    {
      muscle: "chest",
      source: pushData, // from the fixed flat push data
      criteria: ex => ex.muscleGroup.toLowerCase() === "chest" && ex.typeOfMovement === "compound"
    },
    {
      muscle: "back",
      source: pullData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "back" && ex.typeOfMovement === "compound"
    },
    {
      muscle: "shoulders",
      source: pushData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "shoulders" && ex.typeOfMovement === "compound"
    },
    {
      muscle: "triceps",
      source: pushData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "triceps" && ex.typeOfMovement === "compound"
    },
    {
      muscle: "biceps",
      source: pullData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "biceps" && ex.typeOfMovement === "isolation"
    },
    {
      muscle: "traps",
      source: pullData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "traps"
    }
  ];

  let selections = [];
  // For each target, try to pick from the stored data; if not, fall back to the database.
  for (let tgt of targets) {
    let candidate = tgt.source.find(tgt.criteria);
    if (!candidate) {
      const dbPool = EXERCISE_DATABASE.filter(e => {
        let match = (e.muscleGroup.toLowerCase() === tgt.muscle);
        if (tgt.muscle === "biceps") {
          match = match && (e.typeOfMovement === "isolation");
        } else if (["chest", "back", "shoulders", "triceps"].includes(tgt.muscle)) {
          match = match && (e.typeOfMovement === "compound");
        }
        return match;
      });
      candidate = pickRandom(dbPool);
    }
    if (candidate) selections.push(candidate);
  }

  const final = sequenceAndFinalize(selections, "upper", wNum);
  storedPhaseWorkouts[phaseName].upper = final;
  return final;
}

function buildFullbodyForThisWeek(phaseDat, wNum) {
  const phaseName = getPhaseForWeek(wNum).name;
  if (!storedPhaseWorkouts[phaseName]) {
    storedPhaseWorkouts[phaseName] = {};
  }
  if (storedPhaseWorkouts[phaseName].fullbody) {
    return storedPhaseWorkouts[phaseName].fullbody;
  }

  // Lower body: get quad, ham, and calves.
  let quadEx = null, hamEx = null, calvesEx = null;
  if (storedPhaseWorkouts[phaseName].quadDay) {
    quadEx = storedPhaseWorkouts[phaseName].quadDay[0]; // assume first element is the compound
  } else if (phaseDat._quadPrimary) {
    quadEx = phaseDat._quadPrimary;
  } else {
    const qPool = EXERCISE_DATABASE.filter(e => e.muscleGroup.toLowerCase() === "quads" && e.typeOfMovement === "compound");
    quadEx = pickRandom(qPool);
  }

  if (storedPhaseWorkouts[phaseName].hamDay) {
    hamEx = storedPhaseWorkouts[phaseName].hamDay[0];
  } else if (phaseDat._hamPrimary) {
    hamEx = phaseDat._hamPrimary;
  } else {
    const hPool = EXERCISE_DATABASE.filter(e => e.muscleGroup.toLowerCase() === "hamstrings" && e.typeOfMovement === "compound");
    hamEx = pickRandom(hPool);
  }

  // For calves, choose from the database.
  const calvesPool = EXERCISE_DATABASE.filter(e => e.muscleGroup.toLowerCase() === "calves");
  calvesEx = pickRandom(calvesPool);

  // For upper body: reuse the same logic as in buildUpperForThisWeek.
  // We want to use the same flat push day (cached as pushFlat) and pull data.
  const pushData = storedPhaseWorkouts[phaseName].pushFlat ? [storedPhaseWorkouts[phaseName].pushFlat] : [];
  const pullData = storedPhaseWorkouts[phaseName].pull || [];
  const upperTargets = [
    {
      muscle: "chest",
      source: pushData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "chest" && ex.typeOfMovement === "compound"
    },
    {
      muscle: "back",
      source: pullData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "back" && ex.typeOfMovement === "compound"
    },
    {
      muscle: "shoulders",
      source: pushData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "shoulders" && ex.typeOfMovement === "compound"
    },
    {
      muscle: "triceps",
      source: pushData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "triceps" && ex.typeOfMovement === "compound"
    },
    {
      muscle: "biceps",
      source: pullData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "biceps" && ex.typeOfMovement === "isolation"
    },
    {
      muscle: "traps",
      source: pullData,
      criteria: ex => ex.muscleGroup.toLowerCase() === "traps"
    }
  ];

  let upperSelections = [];
  for (let tgt of upperTargets) {
    let candidate = tgt.source.find(tgt.criteria);
    if (!candidate) {
      const dbPool = EXERCISE_DATABASE.filter(e => {
        let match = (e.muscleGroup.toLowerCase() === tgt.muscle);
        if (tgt.muscle === "biceps") {
          match = match && (e.typeOfMovement === "isolation");
        } else if (["chest", "back", "shoulders", "triceps"].includes(tgt.muscle)) {
          match = match && (e.typeOfMovement === "compound");
        }
        return match;
      });
      candidate = pickRandom(dbPool);
    }
    if (candidate) upperSelections.push(candidate);
  }

  // Combine lower and upper parts.
  const rawFullbody = [quadEx, hamEx, calvesEx, ...upperSelections].filter(Boolean);
  const final = sequenceAndFinalize(rawFullbody, "full-body", wNum);
  storedPhaseWorkouts[phaseName].fullbody = final;
  return final;
}

/***********************************************************************
* getCachedOrBuildDay => unifies how we pick push/pull/legs/upper
***********************************************************************/

function getCachedOrBuildDay(splitType, exList, wNum, dayIndex) {
  const phObj = getPhaseForWeek(wNum);
  const phaseName = phObj.name;
  buildPhaseIfNeeded(phaseName, exList);
  const phaseDat = phaseCacheData[phaseName];
  if (!phaseDat) return [];

  switch (splitType) {
    case "push":
      pushDayCount++;
      return buildPushForThisWeek(phaseDat, wNum);

    case "pull": {
      const pullArr = getCachedPullWorkoutForPhase(phaseName, exList);
      return sequenceAndFinalize(pullArr, "pull", wNum);
    }

    case "legs":
    case "lower":
      legDayCount++;
      return buildLegsForThisWeek(phaseDat, wNum);

    case "upper": {
      if (!storedPhaseWorkouts[phaseName]) storedPhaseWorkouts[phaseName] = {};
      if (storedPhaseWorkouts[phaseName].upper) {
        // if we've built upper before => just pass it
        return sequenceAndFinalize(storedPhaseWorkouts[phaseName].upper, "upper", wNum);
      } else {
        // build it
        const raw = buildUpperForThisWeek(phaseDat, wNum);
        // store it
        storedPhaseWorkouts[phaseName].upper = raw;
        return sequenceAndFinalize(raw, "upper", wNum);
      }
    }

    case "fullbody":
    case "extra": {
      // Build or retrieve from cache:
      const builtFullbody = buildFullbodyForThisWeek(phaseDat, wNum);
      return sequenceAndFinalize(builtFullbody, "full-body", wNum);
    }

    default:
      return [];
  }
}

/***********************************************************************
* buildPushForThisWeek => toggles inc/flat
***********************************************************************/

function buildPushForThisWeek(phaseDat, wNum) {
  const phaseName = getPhaseForWeek(wNum).name;
  // Ensure we have an object for this phase
  if (!storedPhaseWorkouts[phaseName]) {
    storedPhaseWorkouts[phaseName] = {};
  }
  const phaseCache = storedPhaseWorkouts[phaseName];

  // --- LOCK IN the two chest compounds (flat & incline) if not already done.
  // We expect phaseDat.pushCompounds to be an array of at least two chest compound exercises.
  if (!phaseCache.pushFlat) {
    const pComp = phaseDat.pushCompounds || [];
    // We assume that index 0 is the "flat" and index 1 is the "incline" variant.
    phaseCache.pushFlat = pComp[0] || null;
    phaseCache.pushIncline = pComp[1] || null;
  }

  // --- Lock in the push accessories if not already done.
  if (!phaseCache.pushAccessories) {
    phaseCache.pushAccessories = phaseDat.pushAccessories || [];
  }

  // --- Set up a cache for push days if not already done.
  if (!phaseCache.pushDays) {
    phaseCache.pushDays = {}; // We'll store two keys: "flat" and "incline"
  }

  // --- Use a counter for push days in this phase.
  if (phaseCache.pushDayCount === undefined) {
    phaseCache.pushDayCount = 0;
  }
  phaseCache.pushDayCount++;

  // Determine which variant to use:
  // For odd pushDayCount use the "flat" variant; for even, use the "incline" variant.
  const variant = (phaseCache.pushDayCount % 2 === 1) ? "flat" : "incline";

  // If we've already built a push day for this variant, return it.
  if (phaseCache.pushDays[variant]) {
    return phaseCache.pushDays[variant];
  }

  // Otherwise, build the push day.
  const chosenChest = (variant === "flat") ? phaseCache.pushFlat : phaseCache.pushIncline;
  const pAcc = phaseCache.pushAccessories; // Expected format: [chestIso, shouldersComp, shouldersIso, tri1, tri2]
  let [chestIso, shouldersComp, shouldersIso, tri1, tri2] = pAcc;

  const rawPushArray = [
    chosenChest,    // main chest compound (fixed for flat or incline)
    shouldersComp,
    tri1,
    chestIso,
    shouldersIso,
    tri2
  ].filter(Boolean);

  const final = sequenceAndFinalize(rawPushArray, "push", wNum);

  // Cache this push day variant so it remains consistent throughout the phase.
  phaseCache.pushDays[variant] = final;
  return final;
}

/***********************************************************************
* buildLegsForThisWeek => toggles quad/ham day without re-randomizing iso
***********************************************************************/

function buildLegsForThisWeek(phaseDat, wNum) {
  const phaseName = getPhaseForWeek(wNum).name;
  if (!storedPhaseWorkouts[phaseName]) {
    storedPhaseWorkouts[phaseName] = {};
  }

  // We'll check if today is Ham or Quad. You've already done: legDayCount++
  const isHamFocus = (legDayCount % 2 === 0);

  // If it's a quad day, see if we've cached a "quadDay" array:
  if (!isHamFocus) {
    if (!storedPhaseWorkouts[phaseName].quadDay) {
      // Build it once and store it:
      const chosenQuadComp = phaseDat._quadPrimary;  // The single pick for the entire phase
      let [qIso, hIso, calves] = phaseDat.quadAccessories || [];

      const rawQuadArray = [chosenQuadComp, qIso, hIso, calves].filter(Boolean);
      storedPhaseWorkouts[phaseName].quadDay = sequenceAndFinalize(rawQuadArray, "legs-quad", wNum);
    }
    // Return the cached quadDay array:
    return storedPhaseWorkouts[phaseName].quadDay;

  } else {
    // Ham day => check for cached "hamDay"
    if (!storedPhaseWorkouts[phaseName].hamDay) {
      const chosenHamComp = phaseDat._hamPrimary;    // The single pick for the entire phase
      let [hIso, qIso, calves] = phaseDat.hamAccessories || [];

      const rawHamArray = [chosenHamComp, hIso, qIso, calves].filter(Boolean);
      storedPhaseWorkouts[phaseName].hamDay = sequenceAndFinalize(rawHamArray, "legs-hamstring", wNum);
    }
    // Return the cached hamDay array:
    return storedPhaseWorkouts[phaseName].hamDay;
  }
}


function removeDuplicatesByName(exerciseArray) {
  const used = new Set();
  return exerciseArray.filter(ex => {
    if (used.has(ex.name)) return false;
    used.add(ex.name);
    return true;
  });
}

/***********************************************************************
* sequenceAndFinalize => ensures time-based gating for *all* splits
***********************************************************************/

// function sequenceAndFinalize(exArray, splitCode, wNum) {
//   // 1) Use exArray instead of 'filtered'
//   const blocks = getTimeBlocksForGoal(
//     formData.sessionDuration || "30-45 Minutes",
//     formData.goal || "improve"
//   );
//   let allocated = Math.min(blocks.rt, 60);

//   // 2) How many total exercises we can fit (1 per 8 minutes, max 6)
//   const totalSlots = Math.max(3, Math.min(Math.floor(allocated / 7), 6));

//   // 3) Actually do your original sequence logic on exArray
//   let seq = sequenceExercises(splitCode, exArray, allocated);

//   // 4) finalize them, slice to totalSlots, remove duplicates
//   let out = seq.map((ex, i) => finalizeExercise(ex, i, wNum));
//   out = out.slice(0, totalSlots);
//   out = removeDuplicatesByName(out);

//   return out;
// }

function sequenceAndFinalize(exArray, splitCode, wNum) {
  // -- How much RT time do we have for this day?
  const blocks = getTimeBlocksForGoal(
    formData.sessionDuration || "30-45 Minutes",
    formData.goal || "improve"
  );
  const allocated = Math.min(blocks.rt, 60);

  /* ---------- 1. Build the raw, ordered list ---------- */
  const totalSlots = Math.max(
    MIN_RT_EXERCISES,
    Math.min(Math.floor(allocated / 7), 6)
  );

  const rawSeq = sequenceExercises(splitCode, exArray, allocated);

  /* ---------- 2. Finalise + de-duplicate ---------- */
  let final = rawSeq
    .map((ex, i) => finalizeExercise(ex, i, wNum))
    .slice(0, totalSlots);         // initial trim
  final = removeDuplicatesByName(final);        // drop accidental dupes

  /* ---------- 3. **NEW** • top-up if <  MIN_RT_EXERCISES ---------- */
  if (final.length < MIN_RT_EXERCISES) {
    // Grab a pool of “spares” that aren’t already in the list
    const alreadyUsed = new Set(final.map(e => e.name));
    const spares = exArray.filter(e => !alreadyUsed.has(e.name));

    while (final.length < MIN_RT_EXERCISES && spares.length) {
      // Pick a random spare, finalise it, push it in
      const spare = pickRandom(spares);
      const finalised = finalizeExercise(spare, final.length, wNum);
      final.push(finalised);

      // remove from spare pool
      const idx = spares.indexOf(spare);
      if (idx > -1) spares.splice(idx, 1);
    }
  }

  return final;
}

const musclePriority = ["chest", "back", "quads", "hamstrings", "shoulders", "arms"];
function maybeReorderForFocus(exArray, splitType) {
  let focuses = (formData.muscleFocus || []).map(m => m.toLowerCase());
  if (!focuses.length || focuses.includes("none of the above")) {
    return exArray; // no reordering needed
  }
  // convert "Arms" => includes biceps/triceps/forearms
  // convert "Legs" => includes quads/hamstrings
  // We'll create a new array, sort by whether the muscleGroup is in the focus, by priority
  let mappedPriority = ex => {
    const mg = ex.muscleGroup.toLowerCase();
    // if arms => biceps/triceps/forearms 
    if (["biceps", "triceps", "forearms"].includes(mg)) {
      // only if userFocus includes "arms"
      if (focuses.includes("arms")) return musclePriority.indexOf("arms");
    }
    // if legs => quads/hamstrings
    if (["quads", "hamstrings"].includes(mg)) {
      if (focuses.includes("legs")) {
        return musclePriority.indexOf(mg);
      }
    }
    // if it's chest/back/shoulders
    if (focuses.includes(mg)) {
      return musclePriority.indexOf(mg);
    }
    // else big number => no priority
    return 999;
  };
  let sorted = [...exArray].sort((a, b) => mappedPriority(a) - mappedPriority(b));
  return sorted;
}

/***********************************************************************
* buildWeekProgram => builds a single week's set of daily workouts
***********************************************************************/

function buildWeekProgram(exList, wNum) {

  if (isExclusiveCalisthenics()) {
    let dayCount = parseInt(formData.workoutDays || 3, 10);
    return buildCalisthenicsWeek(wNum, dayCount);
  }

  const phName = getPhaseForWeek(wNum).name;
  buildPhaseIfNeeded(phName, exList); // ensures the phase’s picks exist

  let days = parseInt(formData.workoutDays || 3, 10);

  const userPref = (formData.trainingPreference || "").toLowerCase();

  if (userPref === "hiit") {
    /* if user wants pure HIIT for all days */
    let hiitDays = Array(days).fill("hiit");
    return {
      week: wNum,
      phase: getPhaseForWeek(wNum).name,
      days: hiitDays.map((spl, idx) => buildDayWorkout(exList, spl, wNum, idx + 1))
    };
  }

  // GroupB constraints
  if (isGroupB() && days > 5) days = 5;
  if (isGroupB()) {
    const splitted = getGroupBSplits(days);
    return {
      week: wNum,
      phase: getPhaseForWeek(wNum).name,
      days: splitted.map((spl, i) => buildDayWorkout(exList, spl, wNum, i + 1))
    };
  }

  // If user has no equipment => fullbody-bw
  const eq = (formData.equipment || []).map(x => x.toLowerCase());
  if (eq.includes("none of the above") || userHasBenchOnly()) {
    const dayTotal = parseInt(formData.workoutDays || 3, 10);
    const presetsLen = HOME_NO_EQUIPMENT_WORKOUTS.length;

    // Always start from the first workout each new 12-week cycle,
    // then just take as many days as the user trains.
    const chosenDays = [];
    for (let i = 0; i < dayTotal; i++) {
      // Loop back around if the user trains >7 days
      const preset = HOME_NO_EQUIPMENT_WORKOUTS[i % presetsLen];

      // Clone so later mutations don’t touch the master copy
      chosenDays.push(JSON.parse(JSON.stringify(preset)));
    }

    return {
      week: wNum,
      phase: "Home-Bodyweight Phase",
      days: chosenDays
    };
  }

  // Otherwise use a normal push/pull/legs, etc. approach
  const baseSplits = getSplitsForDays(days, userPref);

  return {
    week: wNum,
    phase: phName,
    days: baseSplits.map((spl, i) => buildDayWorkout(exList, spl, wNum, i + 1))
  };
}

function getGroupBSplits(days) {
  // [UNCHANGED]
  switch (days) {
    case 1: return ["fullbody"];
    case 2: return ["fullbody", "core-balance"];
    case 3: return ["upper", "lower", "core-balance"];
    case 4: return ["upper", "lower", "fullbody", "core-balance"];
    default: return ["core-balance", "upper", "lower", "fullbody", "core-balance"];
  }
}

function getSplitsForDays(dayCount, userPref) {
  // [UNCHANGED]
  const base = {
    1: ["fullbody"],
    2: ["upper", "lower"],
    3: ["push", "pull", "legs"],
    4: ["push", "legs", "pull", "extra"],
    5: ["push", "pull", "legs", "upper", "legs"],
    6: ["push", "pull", "legs", "push", "pull", "legs"],
    7: ["push", "pull", "legs", "push", "pull", "legs", "recovery"],
  };
  let arr = base[dayCount] || ["fullbody"];
  if (userPref === "mix") {
    if (dayCount >= 4) arr[3] = "hiit";
    if (dayCount >= 5) arr[4] = "fullbody";
    if (dayCount >= 6) arr[5] = "hiit";
  }
  return arr;
}

/***********************************************************************
* buildDayWorkout => does the time allocation properly
***********************************************************************/

function buildDayWorkout(exList, splitType, wNum, dayIndex) {
  const dayObj = {
    dayLabel: `Day ${dayIndex} - ${splitType.toUpperCase()}`,
    warmUp: [],
    mainWork: [],
    coolDown: []
  };

  // If "recovery"
  if (splitType === "recovery") {
    dayObj.mainWork.push({
      blockType: "Recovery",
      exercises: [{ name: "Light walk or yoga", sets: "20 minutes", rpe: 5 }]
    });
    return dayObj;
  }

  // If "hiit"
  if (splitType === "hiit") {
    const blocks = getTimeBlocksForGoal(formData.sessionDuration || "30-45 Minutes", formData.goal || "improve");
    let actualRT = Math.min(blocks.rt, 60); // Cap at 60 minutes if needed
    let hiitCategory = (actualRT <= 10) ? "0-10"
      : (actualRT <= 20) ? "10-20"
        : "20-30";

    const chosen = pickNonRepeatingHIIT(hiitCategory, wNum, dayIndex);
    dayObj.mainWork.push({
      blockType: "HIIT",
      allocatedMinutes: actualRT,
      name: chosen.name,
      notes: chosen.details
    });
    dayObj.coolDown.push({
      name: "Cool-Down",
      duration: `${blocks.coolDown} minutes`,
      rpe: 3,
      notes: "Lower heart rate"
    });
    dayObj.coolDown.push(...staticCoolDownStretches);
    return dayObj;
  }

  // If "fullbody-bw"
  if (splitType === "fullbody-bw") {
    const blocks = getTimeBlocksForGoal(formData.sessionDuration || "30-45 Minutes", formData.goal || "improve");
    let actualRT = Math.min(blocks.rt, 60);
    let fbbCategory = (actualRT <= 10) ? "0-10" : (actualRT <= 20 ? "10-20" : "20-30");
    const chosen = pickNonRepeatingFBB(fbbCategory, wNum, dayIndex);
    dayObj.mainWork.push({
      blockType: "FBB",
      allocatedMinutes: actualRT,
      name: chosen.name,
      notes: chosen.details
    });
    dayObj.coolDown.push({
      name: "Cool-Down",
      duration: `${blocks.coolDown} minutes`,
      rpe: 3
    });
    dayObj.coolDown.push(...staticCoolDownStretches);
    return dayObj;
  }

  // Else => standard RT
  const blocks = getTimeBlocksForGoal(
    formData.sessionDuration || "30-45 Minutes",
    formData.goal || "improve"
  );
  const allocated = Math.min(blocks.rt, 60);

  function pickCardioExercise() {
    const loc = (formData.workoutLocation || "home").toLowerCase();
    if (loc === "gym") {
      const gymList = [
        { name: "Treadmill" }, { name: "Rowing Machine" },
        { name: "Stationary Bike" }, { name: "Stairmaster" },
        { name: "Elliptical Trainer" }, { name: "Spin Bike" },
        { name: "Ski Erg" }, { name: "Assault Air Bike" },
      ];
      return gymList[Math.floor(Math.random() * gymList.length)];
    } else {
      const homeList = [
        { name: "Jogging in Place" },
        { name: "High Knees" },
        { name: "Butt Kicks" },
      ];
      return homeList[Math.floor(Math.random() * homeList.length)];
    }
  }


  // --- CHANGED: Dynamically select warm-up cardio exercise based on workout location
  let loc = (formData.workoutLocation || "home").toLowerCase();
  let cardioWarmUp;
  if (loc === "gym") {
    const gymCardioExercises = [
      { name: "Treadmill", typeOfMovement: "cardio" },
      { name: "Rowing Machine", typeOfMovement: "cardio" },
      { name: "Stationary Bike", typeOfMovement: "cardio" },
      { name: "Stairmaster", typeOfMovement: "cardio" },
      { name: "Elliptical Trainer", typeOfMovement: "cardio" },
      { name: "Spin Bike", typeOfMovement: "cardio" },
      { name: "Ski Erg", typeOfMovement: "cardio" },
      { name: "Assault Air Bike", typeOfMovement: "cardio" },
    ];
    cardioWarmUp = gymCardioExercises[Math.floor(Math.random() * gymCardioExercises.length)];
  } else if (loc === "home") {
    const homeCardioExercises = [
      { name: "Jogging in Place", typeOfMovement: "cardio" },
      { name: "High Knees", typeOfMovement: "cardio" },
      { name: "Butt Kicks", typeOfMovement: "cardio" },
    ];
    cardioWarmUp = homeCardioExercises[Math.floor(Math.random() * homeCardioExercises.length)];
  } else {
    // Fallback in case of an unexpected location value:
    cardioWarmUp = { name: "Cardio Warm-Up", typeOfMovement: "cardio" };
  }

  dayObj.warmUp.push({
    name: cardioWarmUp.name,
    duration: `${blocks.warmUp} minutes`,
    rpe: 5
  });

  let wKey = splitType;
  if (!warmUpRoutines[wKey]) wKey = "generic";
  dayObj.warmUp.push(...warmUpRoutines[wKey]);

  // Fetch or build the raw exercises from “cached or build day”
  let chosen = getCachedOrBuildDay(splitType, exList, wNum, dayIndex);

  // 1 exercise / 8 min logic
  let totalSlots = Math.max(
    MIN_RT_EXERCISES,
    Math.min(Math.floor(allocated / 7), 6)
  );
  let filtered = chosen.slice();

  // 1) If location is gym => try removing isHomeOnly
  // const loc = (formData.workoutLocation || "home").toLowerCase();
  if (loc === "gym") {
    const attemptGym = filtered.filter(e => !e.isHomeOnly);
    // only adopt if we can still fill totalSlots
    if (attemptGym.length >= totalSlots) {
      filtered = attemptGym;
    }
  }

  // 2) If Phase 1 novice => try removing technical
  if (isPhase1(wNum) && isNovice()) {
    const attemptNoTech = filtered.filter(e => !e.isTechnical);
    if (attemptNoTech.length >= totalSlots) {
      filtered = attemptNoTech;
    }
  }
  if (totalSlots < 1) totalSlots = 1;
  let finalEx = filtered.slice(0, totalSlots);


  // Apply “superset” logic for Phase 2 & Phase 3
  finalEx = applySupersetLogic(finalEx, wNum);

  dayObj.mainWork.push({
    blockType: "Resistance Training",
    allocatedMinutes: blocks.rt,
    exercises: finalEx
  });

  // Add cardio if applicable
  if (blocks.cardio > 0) {
    let loc = (formData.workoutLocation || "home").toLowerCase();
    let cName = "Light Jog / Bodyweight Cardio";
    if (loc === "gym") {
      let gymCardio = exList.filter(x => x.typeOfMovement === "cardio");
      if (gymCardio.length) {
        cName = gymCardio[Math.floor(Math.random() * gymCardio.length)].name;
      }
    }
    dayObj.mainWork.push({
      blockType: "Cardio",
      allocatedMinutes: blocks.cardio,
      name: cName,
      rpe: 6,
    });
  }

  // Add coolDown
  const cool = pickCardioExercise();
  dayObj.coolDown.push({
    name: cool.name,
    duration: `${blocks.coolDown} minutes`,
    rpe: 3,
    notes: "Lower heart rate"
  });
  let cKey = getFinalSplitType(splitType, wNum);
  if (!coolDownMap[cKey]) cKey = "generic";
  dayObj.coolDown.push(...(coolDownMap[cKey] || coolDownMap.generic));
  // dayObj.coolDown.push(...staticCoolDownStretches);

  return dayObj;
}

function getFinalSplitType(splitType, wNum) {
  if (splitType === "legs" || splitType === "lower") {
    let isHam = (legDayCount % 2 === 0);
    return isHam ? "legs-hamstring" : "legs-quad";
  }
  if (splitType === "fullbody") return "full-body";
  if (splitType === "fullbody-bw") return "bw-fullbody";
  if (splitType === "extra") return "full-body";
  return splitType.toLowerCase();
}

/***********************************************************************
* applySupersetLogic => looks at each day’s finalEx array, modifies it
* by adding a superset property, e.g. { supersetExercise: {...}, sets:??, reps:??, rpe:?? }
***********************************************************************/
function applySupersetLogic(exArray, wNum) {
  const phaseObj = getPhaseForWeek(wNum);
  let pName = phaseObj.name;
  let isP1 = (pName === "Foundational Phase");
  let isP2 = (pName === "Hypertrophy Phase");
  let isP3 = (pName === "Strength Phase");

  if (isP1) {
    return exArray;
  }

  let compounds = exArray.filter(e => e.typeOfMovement === "compound");
  if (!compounds.length) return exArray; // no compound => no supersets

  let maxCompounds = (compounds.length > 3 ? 1 : compounds.length);

  let isAllSets = isP2;
  let isFirstLast = isP3;

  let relevantCompounds = compounds.slice(0, maxCompounds);

  for (let cObj of relevantCompounds) {
    if (!cObj.pairedWith) continue; // no pairing
    cObj.superset = {
      name: cObj.pairedWith,
      sets: cObj.sets, // same # sets?
      reps: "12-15",
      rpe: "6-7",
      notes: (isAllSets
        ? "Superset all sets with the main compound"
        : "Superset only 1st and last set"
      )
    };
    cObj.notes += " [Superset: " + cObj.pairedWith + "]";
  }
  return exArray;
}

/** pickCoreBalanceExercises => for groupB "core-balance" day [UNCHANGED] */
function pickCoreBalanceExercises() {
  // [UNCHANGED]
  return [
    { name: "Chair Squats", sets: 2, reps: 10, notes: "Balance" },
    { name: "Bird Dog", sets: 2, reps: 8, notes: "Core stability" },
    { name: "Wall Push-Ups", sets: 2, reps: 10, notes: "Upper, easy" },
    { name: "Modified Plank (on knees)", sets: 2, reps: 12, notes: "Core" },
  ];
}

function pickHIITVariety() {
  // [UNCHANGED]
  const pool = [
    { name: "Sprints in Place", sets: 4, reps: "15s on/45s off", notes: "RPE7-8" },
    { name: "Jump Squats", sets: 3, reps: 12, notes: "Explosive" },
    { name: "Burpees", sets: 3, reps: 10, notes: "Full-body" },
    { name: "Skater Jumps", sets: 3, reps: 16, notes: "Side to side" },
    { name: "Mountain Climbers", sets: 3, reps: "20s on/40s off", notes: "Core + cardio" },
  ];
  let out = [];
  let pickCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < pickCount; i++) {
    if (!pool.length) break;
    let idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

/***********************************************************************
* 7) HIIT & FBB PICKING WITHIN A WEEK
**********************************************************************/

// ADDED to track which HIIT/FBB workouts were used in a given week
let usedHIITThisWeek = {};
let usedFBBThisWeek = {};

/**
* pickNonRepeatingHIIT
* For each (weekNumber, dayIndex) we ensure the user doesn't get the same HIIT workout
* twice in the *same week*. Next week resets.
*/
function pickNonRepeatingHIIT(category, wNum, dayIdx) {
  // If we start a new week, reset usedHIITThisWeek
  if (!usedHIITThisWeek[wNum]) usedHIITThisWeek[wNum] = [];

  const workouts = HIIT_WORKOUTS[category] || [];
  // Filter out any that was used already in THIS week
  let available = workouts.filter(w => !usedHIITThisWeek[wNum].includes(w.name));

  if (!available.length) {
    // if we've used them all, allow reuse
    available = workouts.slice();
  }
  const chosen = available[Math.floor(Math.random() * available.length)];
  usedHIITThisWeek[wNum].push(chosen.name);
  return chosen;
}

/**
* pickNonRepeatingFBB
* Similarly ensures no repeated FBB workout in the same week
*/
function pickNonRepeatingFBB(category, wNum, dayIdx) {
  if (!usedFBBThisWeek[wNum]) usedFBBThisWeek[wNum] = [];

  const workouts = FBB_WORKOUTS[category] || [];
  let available = workouts.filter(w => !usedFBBThisWeek[wNum].includes(w.name));

  if (!available.length) {
    available = workouts.slice();
  }
  const chosen = available[Math.floor(Math.random() * available.length)];
  usedFBBThisWeek[wNum].push(chosen.name);
  return chosen;
}

/***********************************************************************
* pickExercisesForSplit => push/pull/legs/upper => references
***********************************************************************/

function pickExercisesForSplit(exList, splitType, sessionLen, wNum, dayIndex) {
  switch (splitType) {
    case "push": return pickPushDay(exList, wNum);
    case "pull": return pickPullDay(exList, wNum);
    case "legs":
    case "lower": return pickLegDay(exList, wNum, dayIndex);
    case "fullbody": return pickFullbodyDayWithPreference(exList, wNum);
    case "fullbody-bw": return [];
    case "extra": return pickFullbodyDayWithPreference(exList, wNum);
    default:
      return exList.slice(0, 4);
  }
}


/***********************************************************************
* pickPushDayWithPreference / pickPullDayWithPreference / ...
***********************************************************************/

function pickPushDayWithPreference(exList, wNum) {
  const isP1Novice = (isPhase1(wNum) && isNovice());
  if (!isP1Novice) {
    return pickPushDay(exList, wNum); // original
  }
  // else => we do a "prefer non-tech" approach
  let nonTech = exList.filter(x => x.splitTag === "push" && !x.isTechnical);
  let chestCompAll = nonTech.filter(x => x.muscleGroup === "chest" && x.typeOfMovement === "compound");
  // If none => fallback to all push
  if (!chestCompAll.length) {
    return pickPushDay(exList, wNum);
  }
  // We basically do the push day logic but using nonTech first, fallback if we can't fill a slot.

  let arr = exList.slice();
  // We'll do the same toggling for chest inc/flat, but ONLY within nonTech if possible => else fallback
  let out = {};
  // chest comp (nonTech if possible)
  const incOnly = chestCompAll.filter(x => x.name.toLowerCase().includes("incline"));
  const flatOnly = chestCompAll.filter(x => x.name.toLowerCase().includes("flat"));
  let chosenChestComp = null;
  if (pushDayCount % 2 === 1 && incOnly.length > 0) {
    chosenChestComp = pickRandom(incOnly);
  } else if (pushDayCount % 2 === 0 && flatOnly.length > 0) {
    chosenChestComp = pickRandom(flatOnly);
  }
  if (!chosenChestComp) {
    // fallback to any chestCompAll => if still no match => fallback to original
    if (!chestCompAll.length) return pickPushDay(exList, wNum);
    chosenChestComp = pickRandom(chestCompAll);
  }
  out[1] = chosenChestComp;

  // chest iso
  const chestIso = nonTech.filter(x => x.splitTag === "push" && x.muscleGroup === "chest" && x.typeOfMovement === "isolation");
  out[4] = pickRandom(chestIso, [out[1]]);
  if (!out[4]) {
    // fallback to the full array
    const fallbackIso = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "chest" && x.typeOfMovement === "isolation");
    out[4] = pickRandom(fallbackIso, [out[1]]);
  }

  // shoulders comp
  const shouldC = nonTech.filter(x => x.splitTag === "push" && x.muscleGroup === "shoulders" && x.typeOfMovement === "compound");
  out[2] = pickRandom(shouldC, [out[1], out[4]]);
  if (!out[2]) {
    const fallbackShouldC = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "shoulders" && x.typeOfMovement === "compound");
    out[2] = pickRandom(fallbackShouldC, [out[1], out[4]]);
  }

  // shoulders iso
  const shouldIso = nonTech.filter(x => x.splitTag === "push" && x.muscleGroup === "shoulders" && x.typeOfMovement === "isolation");
  out[5] = pickRandom(shouldIso, [out[1], out[2], out[4]]);
  if (!out[5]) {
    const fallbackShouldIso = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "shoulders" && x.typeOfMovement === "isolation");
    out[5] = pickRandom(fallbackShouldIso, [out[1], out[2], out[4]]);
  }

  // triceps
  const triNonTech = nonTech.filter(x => x.splitTag === "push" && x.muscleGroup === "triceps");
  out[3] = pickRandom(triNonTech, [out[1], out[2], out[4], out[5]]);
  if (!out[3]) {
    const triAll = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "triceps");
    out[3] = pickRandom(triAll, [out[1], out[2], out[4], out[5]]);
  }
  out[6] = pickRandom(triNonTech, [out[1], out[2], out[3], out[4], out[5]]);
  if (!out[6]) {
    const triAll2 = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "triceps");
    out[6] = pickRandom(triAll2, [out[1], out[2], out[3], out[4], out[5]]);
  }
  return [1, 4, 2, 5, 3, 6].map(i => out[i]).filter(x => x);
}

function pickPullDayWithPreference(exList, wNum) {
  const isP1Novice = (isPhase1(wNum) && isNovice());
  if (!isP1Novice) {
    return pickPullDay(exList, wNum);
  }
  // else => prefer nonTech. fallback approach
  let arr = exList.slice();
  let nonTech = arr.filter(x => x.splitTag === "pull" && !x.isTechnical);

  // #1 => back vertical
  const backVnontech = nonTech.filter(x => x.muscleGroup === "back" && x.movementPlane === "vertical");
  const backVall = arr.filter(x => x.muscleGroup === "back" && x.movementPlane === "vertical");
  let slot1 = pickRandom(backVnontech) || pickRandom(backVall);

  // #2 => back horizontal
  const backHnon = nonTech.filter(x => x.muscleGroup === "back" && x.movementPlane === "horizontal");
  const backHall = arr.filter(x => x.muscleGroup === "back" && x.movementPlane === "horizontal");
  let slot2 = pickRandom(backHnon, [slot1]) || pickRandom(backHall, [slot1]);

  // #3 => biceps
  const bicNon = nonTech.filter(x => x.muscleGroup === "biceps");
  const bicAll = arr.filter(x => x.muscleGroup === "biceps");
  let slot3 = pickRandom(bicNon, [slot1, slot2]) || pickRandom(bicAll, [slot1, slot2]);

  // #4 => arch
  const archNon = nonTech.filter(x => x.muscleGroup === "back" && (x.name.toLowerCase().includes("pullover") || x.name.toLowerCase().includes("extension")));
  const archAll = arr.filter(x => x.muscleGroup === "back" && (x.name.toLowerCase().includes("pullover") || x.name.toLowerCase().includes("extension")));
  let slot4 = pickRandom(archNon, [slot1, slot2, slot3]) || pickRandom(archAll, [slot1, slot2, slot3]);

  // #5 => traps
  const trapsNon = nonTech.filter(x => x.muscleGroup === "traps");
  const trapsAll = arr.filter(x => x.muscleGroup === "traps");
  let slot5 = pickRandom(trapsNon, [slot1, slot2, slot3, slot4]) || pickRandom(trapsAll, [slot1, slot2, slot3, slot4]);

  // #6 => forearms
  const foreNon = nonTech.filter(x => x.muscleGroup === "forearms");
  const foreAll = arr.filter(x => x.muscleGroup === "forearms");
  let slot6 = pickRandom(foreNon, [slot1, slot2, slot3, slot4, slot5]) || pickRandom(foreAll, [slot1, slot2, slot3, slot4, slot5]);

  return [slot1, slot2, slot3, slot4, slot5, slot6].filter(Boolean);
}

function pickFullbodyDayWithPreference(exList, wNum) {
  const isP1Novice = (isPhase1(wNum) && isNovice());
  if (!isP1Novice) {
    return pickFullbodyDay(exList, wNum);
  }
  // else => prefer non-tech, fallback if none
  let arr = exList.slice();
  let nonTech = arr.filter(x => x.splitTag.match(/legs|push|pull|fullbody/i) && !x.isTechnical);

  // We'll replicate pickFullbodyDay logic but prefer nonTech
  // step1 => pick quads compound
  let quadNon = nonTech.filter(x => x.muscleGroup === "quads" && x.typeOfMovement === "compound" && (x.name.toLowerCase().includes("squat") || x.name.toLowerCase().includes("leg press")));
  let quadAll = arr.filter(x => x.muscleGroup === "quads" && x.typeOfMovement === "compound" && (x.name.toLowerCase().includes("squat") || x.name.toLowerCase().includes("leg press")));
  let quad = pickRandom(quadNon) || pickRandom(quadAll);

  // step2 => ham compound
  let hamNon = nonTech.filter(x => x.muscleGroup === "hamstrings" && x.typeOfMovement === "compound" && (x.name.toLowerCase().includes("deadlift") || x.name.toLowerCase().includes("rdl")));
  let hamAll = arr.filter(x => x.muscleGroup === "hamstrings" && x.typeOfMovement === "compound" && (x.name.toLowerCase().includes("deadlift") || x.name.toLowerCase().includes("rdl")));
  let ham = pickRandom(hamNon, [quad]) || pickRandom(hamAll, [quad]);

  // step3 => chest compound
  let chestNon = nonTech.filter(x => x.muscleGroup === "chest" && x.typeOfMovement === "compound" && x.splitTag === "push");
  let chestAll = arr.filter(x => x.muscleGroup === "chest" && x.typeOfMovement === "compound" && x.splitTag === "push");
  let chest = pickRandom(chestNon, [quad, ham]) || pickRandom(chestAll, [quad, ham]);

  // step4 => back compound
  let backNon = nonTech.filter(x => x.muscleGroup === "back" && x.typeOfMovement === "compound");
  let backAll = arr.filter(x => x.muscleGroup === "back" && x.typeOfMovement === "compound");
  let back = pickRandom(backNon, [quad, ham, chest]) || pickRandom(backAll, [quad, ham, chest]);

  // step5 => shoulders comp
  let shNon = nonTech.filter(x => x.muscleGroup === "shoulders" && x.typeOfMovement === "compound");
  let shAll = arr.filter(x => x.muscleGroup === "shoulders" && x.typeOfMovement === "compound");
  let shoulders = pickRandom(shNon, [quad, ham, chest, back]) || pickRandom(shAll, [quad, ham, chest, back]);

  return [quad, ham, chest, back, shoulders].filter(Boolean);
}

/** pickLegDay => calls buildQuadDayOrdered or buildHamDayOrdered */
// function pickLegDay(exList, wNum, dayCount) {
//   if (dayCount % 2 === 1) return buildQuadDayOrdered(exList, wNum);
//   else return buildHamDayOrdered(exList, wNum);
// }

function pickFullbodyDay(exList, wNum) {
  let arr = exList.slice();
  if (shouldExcludeTechnicalForThisUser(wNum)) {
    arr = arr.filter(x => !x.isTechnical);
  }

  let outMap = {};

  // We do a targeted approach to find each needed movement:
  // 2 => quad compound
  let quadComp = arr.filter(x =>
    x.muscleGroup === "quads"
    && x.typeOfMovement === "compound"
    && (x.name.toLowerCase().includes("squat") || x.name.toLowerCase().includes("leg press"))
  );
  outMap["quad"] = pickRandom(quadComp);

  // 5 => ham compound
  let hamComp = arr.filter(x =>
    x.muscleGroup === "hamstrings"
    && x.typeOfMovement === "compound"
    && (x.name.toLowerCase().includes("deadlift") || x.name.toLowerCase().includes("rdl"))
  );
  outMap["ham"] = pickRandom(hamComp, [outMap["quad"]]);

  // 1 => chest compound
  let chestComp = arr.filter(x =>
    x.muscleGroup === "chest"
    && x.typeOfMovement === "compound"
    && x.splitTag === "push"
  );
  outMap["chest"] = pickRandom(chestComp, [outMap["quad"], outMap["ham"]]);

  // 3 => back compound
  let backComp = arr.filter(x =>
    x.muscleGroup === "back"
    && x.typeOfMovement === "compound"
  );
  outMap["back"] = pickRandom(backComp, [outMap["quad"], outMap["ham"], outMap["chest"]]);

  // 4 => shoulders compound
  let shoulderComp = arr.filter(x =>
    x.muscleGroup === "shoulders"
    && x.typeOfMovement === "compound"
  );
  outMap["shoulders"] = pickRandom(shoulderComp, [outMap["quad"], outMap["ham"], outMap["chest"], outMap["back"]]);

  // Return the 5 picked
  return Object.values(outMap).filter(x => x);
}

/***********************************************************************
* CHANGED => pickPushDay => now toggles between Flat vs. Incline 
***********************************************************************/
function pickPushDay(exList, wNum) {
  let arr = exList.slice();
  if (shouldExcludeTechnicalForThisUser(wNum)) {
    arr = arr.filter(x => !x.isTechnical);
  }

  let out = {};

  // === [ADDED] pick “main chest” by toggling odd/even pushDayCount ===
  const chestCompAll = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "chest" && x.typeOfMovement === "compound");

  // separate out “incline” vs. “flat”
  const incOnly = chestCompAll.filter(x => x.name.toLowerCase().includes("incline"));
  const flatOnly = chestCompAll.filter(x => x.name.toLowerCase().includes("flat"));

  // If pushDayCount is odd => we pick from incOnly if possible
  // else => pick from flatOnly if possible
  let chosenChestComp = null;
  if (pushDayCount % 2 === 1 && incOnly.length > 0) {
    chosenChestComp = pickRandom(incOnly, []);
  } else if (pushDayCount % 2 === 0 && flatOnly.length > 0) {
    chosenChestComp = pickRandom(flatOnly, []);
  }
  // fallback if either is empty
  if (!chosenChestComp) {
    chosenChestComp = pickRandom(chestCompAll, []);
  }
  out[1] = chosenChestComp;

  // chest iso
  const chestIso = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "chest" && x.typeOfMovement === "isolation");
  out[4] = pickRandom(chestIso, [out[1]]);

  // shoulders comp
  const shouldC = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "shoulders" && x.typeOfMovement === "compound");
  out[2] = pickRandom(shouldC, [out[1], out[4]]);

  // shoulders iso
  const shouldIso = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "shoulders" && x.typeOfMovement === "isolation");
  out[5] = pickRandom(shouldIso, [out[1], out[2], out[4]]);

  // triceps
  const tri = arr.filter(x => x.splitTag === "push" && x.muscleGroup === "triceps");
  out[3] = pickRandom(tri, [out[1], out[2], out[4], out[5]]);
  out[6] = pickRandom(tri, [out[1], out[2], out[3], out[4], out[5]]);

  return [1, 4, 2, 5, 3, 6].map(i => out[i]).filter(x => x);
}

function buildPullDayPoolPhaseAware(exList, wNum) {
  const phaseObj = getPhaseForWeek(wNum);
  const isP1 = (phaseObj.name === "Foundational Phase");
  const eqAll = (formData.equipment || []).map(e => e.toLowerCase());
  const eqPref = (formData.equipmentPreference || []).map(e => e.toLowerCase());
  let arr = [...exList];
  if (isP1 && isNovice()) {
    let nonTechPool = arr.filter(e => !e.isTechnical);
    if (nonTechPool.length >= 5) {
      arr = nonTechPool;
    }
  }
  return arr;
}
/***********************************************************************
* CHANGED => pickPullDay => [UNCHANGED except we clarified the arch usage]
***********************************************************************/

// function pickPullDay(exList, wNum) {
//   // Build the phase-aware pool
//   const isP1Novice = isPhase1(wNum) && isNovice();
//   const finalPool = exList.filter(e => {
//       if (isP1Novice && e.isTechnical) return false; 
//       return true;
//   });

//   let arr = [...finalPool];
//   console.log("Final pull-day candidate pool:", arr);

//   // Slot 1: Back Vertical Movement
//   let slot1 = pickRandom(
//     arr.filter(x => x.muscleGroup === "back" && x.movementPlane === "vertical")
//   );
//   if (!slot1) {
//     // Fallback: Arch Movements
//     slot1 = pickRandom(
//       arr.filter(x => x.muscleGroup === "back" &&
//         (x.name.toLowerCase().includes("pullover") || x.movementPlane === "arch")
//       )
//     );
//   }
//   if (slot1) arr.splice(arr.indexOf(slot1), 1);

//   // Slot 2: Back Horizontal Movement
//   const slot2 = pickRandom(
//     arr.filter(x => x.muscleGroup === "back" && x.movementPlane === "horizontal")
//   );
//   if (slot2) arr.splice(arr.indexOf(slot2), 1);

//   // Slot 3: Biceps Movement
//   const slot3 = pickRandom(arr.filter(x => x.muscleGroup === "biceps"));
//   if (slot3) arr.splice(arr.indexOf(slot3), 1);

//   // Slot 4: Traps Movement
//   const slot4 = pickRandom(arr.filter(x => x.muscleGroup === "traps"));
//   if (slot4) arr.splice(arr.indexOf(slot4), 1);

//   // Slot 5: Forearms Movement
//   const slot5 = pickRandom(arr.filter(x => x.muscleGroup === "forearms"));

//   // Compile the final pull day selection
//   const result = [slot1, slot2, slot3, slot4, slot5].filter(Boolean);
//   console.log("Final pull day selection:", result);
//   return result;
// }

/***********************************************************************
* buildQuadDayOrdered / buildHamDayOrdered => [UNCHANGED except logs]
***********************************************************************/

function buildQuadDayOrdered(exList, wNum) {
  let out = {};
  const ph = getPhaseForWeek(wNum).name;
  const isBeg = isNovice();
  let legs = exList.filter(x => x.splitTag === "legs");

  if (isBeg && wNum <= 4) {
    legs = legs.filter(x => !x.isTechnical);
  }
  // #1 => quad compound
  const qComp = legs.filter(x =>
    x.muscleGroup === "quads"
    && x.typeOfMovement === "compound"
    && (x.name.toLowerCase().includes("squat") || x.name.toLowerCase().includes("leg press"))
  );
  out[1] = pickRandom(qComp);

  // #2 => quad iso (extension, lunge) but NOT compound
  const qIso = legs.filter(x =>
    x.muscleGroup === "quads"
    && x.typeOfMovement === "isolation"
    && (x.name.toLowerCase().includes("extension") || x.name.toLowerCase().includes("lunge"))
  );
  out[2] = pickRandom(qIso, [out[1]]);

  // #4 => ham iso (curl, rdl if isolation)
  const hamIso = legs.filter(x =>
    x.muscleGroup === "hamstrings"
    && x.typeOfMovement === "isolation"
    && (x.name.toLowerCase().includes("curl") || x.name.toLowerCase().includes("rdl"))
  );
  out[4] = pickRandom(hamIso, [out[1], out[2]]);

  // #3 => calves
  const calves = legs.filter(x => x.muscleGroup === "calves");
  out[3] = pickRandom(calves, [out[1], out[2], out[4]]);

  return [1, 2, 4, 3].map(i => out[i]).filter(x => x);
}

/** buildHamDayOrdered => 1 ham comp, 2 ham iso, 4 quad iso, 3 calves */
function buildHamDayOrdered(exList, wNum) {
  let out = {};
  const ph = getPhaseForWeek(wNum).name;
  const isBeg = isNovice();
  let legs = exList.filter(x => x.splitTag === "legs");

  if (isBeg && wNum <= 4) {
    legs = legs.filter(x => !x.isTechnical);
  }
  // #1 => ham compound (rdl, deadlift, etc.)
  const hamComp = legs.filter(x =>
    x.muscleGroup === "hamstrings"
    && x.typeOfMovement === "compound"
    && (x.name.toLowerCase().includes("deadlift") || x.name.toLowerCase().includes("rdl"))
  );
  out[1] = pickRandom(hamComp);

  // #2 => ham iso (curl)
  const hamIso = legs.filter(x =>
    x.muscleGroup === "hamstrings"
    && x.typeOfMovement === "isolation"
    && x.name.toLowerCase().includes("curl")
  );
  out[2] = pickRandom(hamIso, [out[1]]);

  // #4 => quad iso (squat/lunge/extension but isolation)
  const quadIso = legs.filter(x =>
    x.muscleGroup === "quads"
    && x.typeOfMovement === "isolation"
    && (
      x.name.toLowerCase().includes("squat")
      || x.name.toLowerCase().includes("lunge")
      || x.name.toLowerCase().includes("extension")
    )
  );
  out[4] = pickRandom(quadIso, [out[1], out[2]]);

  // #3 => calves
  const calves = legs.filter(x => x.muscleGroup === "calves");
  out[3] = pickRandom(calves, [out[1], out[2], out[4]]);

  return [1, 2, 4, 3].map(i => out[i]).filter(x => x);
}

/** pickUpperDay => [UNCHANGED except logs] */
function pickUpperDay(exList, sessionLen, wNum) {
  const ph = getPhaseForWeek(wNum).name;
  const isBeg = (formData.fitnessLevel || "beginner").toLowerCase() === "beginner";
  let arr = exList.filter(e =>
    (e.splitTag === "push" || e.splitTag === "pull") &&
    (e.muscleGroup === "chest" || e.muscleGroup === "back" || e.muscleGroup === "shoulders" ||
      e.muscleGroup === "biceps" || e.muscleGroup === "triceps")
  );
  if (shouldExcludeTechnicalForThisUser(wNum)) {
    arr = arr.filter(x => !x.isTechnical);
  }
  return arr;
}

// [UNCHANGED helper fns for push/pull/upper counts]
function getUpperCount(sessionLen) {
  if (sessionLen.startsWith("0-30")) return 2;
  if (sessionLen.startsWith("30-45")) return 4;
  if (sessionLen.startsWith("45-60")) return 5;
  return 6;
}
function getPushCount(sessionLen) {
  if (sessionLen.startsWith("0-30")) return 2;
  if (sessionLen.startsWith("30-45")) return 4;
  if (sessionLen.startsWith("45-60")) return 5;
  return 6;
}
function getPullCount(sessionLen) {
  if (sessionLen.startsWith("0-30")) return 2;
  if (sessionLen.startsWith("30-45")) return 4;
  if (sessionLen.startsWith("45-60")) return 5;
  return 6;
}

/** pickMainChest => [UNCHANGED except logs] */
function pickMainChest(chestList, pushCount) {
  if (!chestList.length) return null;
  const inclines = chestList.filter(x => x.name.toLowerCase().includes("incline"));
  const flats = chestList.filter(x => x.name.toLowerCase().includes("flat") && !x.name.toLowerCase().includes("smith machine bench press (flat)"));
  const smithFlat = chestList.filter(x => x.name.toLowerCase().includes("smith machine bench press (flat)"));
  const smithIncl = chestList.filter(x => x.name.toLowerCase().includes("smith machine bench press (incline)"));

  const isOdd = (pushCount % 2 === 1);
  if (isOdd) {
    let combo = [...inclines, ...smithIncl];
    if (combo.length) return pickRandom(combo, []);
  } else {
    let combo = [...flats, ...smithFlat];
    if (combo.length) return pickRandom(combo, []);
  }
  return pickRandom(chestList, []);
}

/** pickChestAccessory => [UNCHANGED except logs] */
function pickChestAccessory(chestList, mainChest) {
  if (!mainChest) return pickRandom(chestList, []);
  let lower = mainChest.name.toLowerCase();
  let exclude = "";
  if (lower.includes("incline")) exclude = "incline";
  else if (lower.includes("flat")) exclude = "flat";
  let filtered = chestList.filter(e => e !== mainChest);
  if (exclude) {
    filtered = filtered.filter(e => !e.name.toLowerCase().includes(exclude));
  }
  if (!filtered.length) return null;
  return pickRandom(filtered, [mainChest]);
}

/***********************************************************************
* pickRandom => used in the DB picks
***********************************************************************/

/** pickRandom => [UNCHANGED] */
function pickRandom(list, alreadyPicked = []) {
  const arr = list.filter(x => !alreadyPicked.includes(x));
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/***********************************************************************
* sequenceExercises => Ensures proper sequencing of exercises per split
***********************************************************************/

const SPLIT_CODE_ORDER = {
  push: [1, 4, 2, 5, 3, 6],
  pull: [1, 2, 4, 5, 3, 6],
  "legs-quad": [1, 2, 4, 3],
  "legs-hamstring": [1, 2, 4, 3],
  "full-body": [2, 5, 1, 3, 4],
  "bw-fullbody": [1, 3, 2, 4, 5],
  "upper": [1, 2, 4, 3, 5, 6],
};
// const INTRO_THRESHOLDS = { 0:0,1:10,2:20,3:30,4:40,5:50, 6:60 };

const CUSTOM_THRESHOLD = {
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48
};

const CODE_CRITERIA = {
  push: {
    1: { muscleGroup: "chest", typeOfMovement: "compound" },
    4: { muscleGroup: "chest", typeOfMovement: "isolation" },
    2: { muscleGroup: "shoulders", typeOfMovement: "compound" },
    5: { muscleGroup: "shoulders", typeOfMovement: "isolation" },
    3: { muscleGroup: "triceps" },
    6: { muscleGroup: "triceps" },
  },
  pull: {
    1: { muscleGroup: "back", movementPlane: "vertical" },
    2: { muscleGroup: "back", movementPlane: "horizontal" },
    4: { muscleGroup: "back", movementPlane: "arch" },
    5: { muscleGroup: "traps" },
    3: { muscleGroup: "biceps" },
    6: { muscleGroup: "forearms" },
  },
  "legs-quad": {
    1: { muscleGroup: "quads", typeOfMovement: "compound" },
    2: { muscleGroup: "quads", typeOfMovement: "isolation" },
    4: { muscleGroup: "hamstrings", typeOfMovement: "isolation" },
    3: { muscleGroup: "calves", typeOfMovement: "isolation" },
  },
  "legs-hamstring": {
    1: { muscleGroup: "hamstrings", typeOfMovement: "compound" },
    2: { muscleGroup: "hamstrings", typeOfMovement: "isolation" },
    4: { muscleGroup: "quads", typeOfMovement: "isolation" },
    3: { muscleGroup: "calves", typeOfMovement: "isolation" },
  },
  "full-body": {
    2: { muscleGroup: "quads", typeOfMovement: "compound" },
    5: { muscleGroup: "hamstrings", typeOfMovement: "compound" },
    1: { muscleGroup: "chest", typeOfMovement: "compound" },
    3: { muscleGroup: "back", typeOfMovement: "compound" },
    4: { muscleGroup: "shoulders", typeOfMovement: "compound" },
  },
  "bw-fullbody": {
    1: { muscleGroup: "chest", typeOfMovement: "compound" },
    3: { muscleGroup: "core", typeOfMovement: "isolation" },
    2: { muscleGroup: "quads", typeOfMovement: "compound" },
    4: { muscleGroup: "shoulders", typeOfMovement: "compound" },
    5: { muscleGroup: "hamstrings", typeOfMovement: "compound" },
  },
  upper: {
    1: { muscleGroup: "chest", typeOfMovement: "compound" },
    2: { muscleGroup: "back", movementPlane: "horizontal" },
    4: { muscleGroup: "back", movementPlane: "vertical" },
    3: { muscleGroup: "shoulders", typeOfMovement: "compound" },
    5: { muscleGroup: "triceps", typeOfMovement: "compound" },
    6: { muscleGroup: "biceps", typeOfMovement: "isolation" },
  },
};

function sequenceExercises(split, exercisePool, allocated = 30) {
  let order = SPLIT_CODE_ORDER[split];
  if (!order) return [];
  let final = [];
  for (let code of order) {
    let needed = CUSTOM_THRESHOLD[code] || 999;
    // only pick that slot if allocated >= needed
    if (allocated >= needed) {
      let crit = CODE_CRITERIA[split]?.[code];
      if (!crit) continue;
      let found = findExercise(exercisePool, crit);
      if (found) final.push(found);
    }
  }
  return final;
}

function findExercise(pool, crit) {
  // [UNCHANGED: checks muscleGroup, movementPlane, typeOfMovement, etc.]
  return pool.find(e => {
    if (crit.muscleGroup && e.muscleGroup.toLowerCase() !== crit.muscleGroup.toLowerCase()) return false;
    if (crit.typeOfMovement && e.typeOfMovement !== crit.typeOfMovement) return false;
    if (crit.movementPlane && e.movementPlane !== crit.movementPlane) return false;
    return true;
  }) || null;
}

/***********************************************************************
* Enhanced Finalization of Exercises
***********************************************************************/

function finalizeExercise(ex, idx, wNum) {
  const ph = getPhaseForWeek(wNum);
  let isPhase2Or3 = (wNum >= 5);

  if (isPhase2Or3) {
    if (ex.name === "Assisted Pull-Ups") {
      // Check if user has a Pull-Up Bar; if yes, replace with “Pull-Ups”
      if (formData.equipment.map(e => e.toLowerCase()).includes("pull-up bar")) {
        let realPullups = EXERCISE_DATABASE.find(e => e.name === "Pull-Ups");
        if (realPullups) ex = realPullups;
      }
    } else if (ex.name === "Smith Machine Barbell Rows") {
      // Check if user has a barbell; if yes, replace with “Barbell Rows”
      if (formData.equipment.map(e => e.toLowerCase()).includes("barbells")) {
        let realRows = EXERCISE_DATABASE.find(e => e.name === "Barbell Rows");
        if (realRows) ex = realRows;
      }
    }
  }

  const [repL, repH] = ph.repRange;
  const [rpeL, rpeH] = ph.rpeRange;
  let age = formData.age || 30;
  let maxRPE = getMaxRPEByAge(age);
  if (isGroupB()) maxRPE = Math.min(maxRPE, 6);

  let finalRL = Math.min(rpeL, maxRPE);
  let finalRH = Math.min(rpeH, maxRPE);

  ex = maybePhaseTechAdjust(ex, wNum);

  // --- CHANGED: Use superset information (if present) for the notes text.
  let notesText = "";
  if (ex.superset && ex.superset.name) {
    notesText = `Superset: ${ex.superset.name}`;
  }

  return {
    ...ex,
    sets: typeof ph.sets === "function" ? ph.sets(ex.typeOfMovement) : ph.sets,
    reps: `${repL}-${repH}`,
    rpe: `${finalRL}-${finalRH}`,
    rest: `${ph.restTime}s`,
    tempo: ph.tempo,
    notes: notesText,
  };
}

/***********************************************************************
* maybePhaseTechAdjust => The new function to "switch" to non-technical or technical if possible
***********************************************************************/
function maybePhaseTechAdjust(origEx, wNum) {
  if (exMatchesUserPreference(origEx)) return origEx;
  if (origEx.muscleGroup.toLowerCase() === "back") {
    return origEx;
  }

  let phaseObj = getPhaseForWeek(wNum);
  let isFoundational = (phaseObj.name === "Foundational Phase"); // phase1
  if (isFoundational) {
    // prefer non-technical
    if (!origEx.isTechnical) {
      // already non-tech => keep
      return origEx;
    } else {
      // see if there's a non-tech alternative for same muscle group & movement
      let alt = pickAltExercise(origEx, false /*non-tech*/);
      return alt || origEx;
    }
  } else {
    // prefer technical
    if (origEx.isTechnical) {
      // already technical => keep
      return origEx;
    } else {
      // see if there's a tech alt
      let alt = pickAltExercise(origEx, true /*technical*/);
      return alt || origEx;
    }
  }
}

/***********************************************************************
* exMatchesUserPreference => check if the user’s eq preferences
* includes the equipment used by origEx (like "smith machine," "barbells," etc.)
***********************************************************************/
function exMatchesUserPreference(ex) {
  let eqPrefs = (formData.equipmentPreference || []).map(s => s.toLowerCase());
  if (!eqPrefs.length) {
    // no explicit preference => return false => means we might do the normal phase logic
    return false;
  }
  // If ex has equipmentNeeded array => check if it intersects with eqPrefs
  // If yes => we treat it as "matches user preference"
  let needed = ex.equipmentNeeded.map(s => s.toLowerCase());
  for (let n of needed) {
    if (eqPrefs.includes(n)) {
      return true;
    }
  }
  return false;
}
/***********************************************************************
* pickAltExercise(origEx, wantTech)
* => tries to find an alternative in the DB that has same muscleGroup & typeOfMovement
* => isTechnical==wantTech
***********************************************************************/
function pickAltExercise(origEx, wantTech, wNum) {
  const mg = origEx.muscleGroup.toLowerCase();
  const mov = origEx.typeOfMovement;
  let all = EXERCISE_DATABASE.filter(e =>
    e.muscleGroup.toLowerCase() === mg &&
    e.typeOfMovement === mov &&
    e.isTechnical === wantTech
  );
  if (!all.length) return null;

  // must also pass the user’s eq filter => same logic as filterExercisesForUser, but let's do a simpler approach:
  let eqAll = (formData.equipment || []).map(s => s.toLowerCase());
  let loc = (formData.workoutLocation || "home").toLowerCase();
  let eqPref = (formData.equipmentPreference || []).map(s => s.toLowerCase());

  let pass = all.filter(e => {
    // 1) check e.equipmentNeeded is included in eqAll
    for (let need of e.equipmentNeeded) {
      if (!eqAll.includes(need.toLowerCase())) return false;
    }
    // 2) if location=home => no machine cardio
    if (loc === "home" && e.typeOfMovement === "cardio" && e.equipmentNeeded.includes("Machines")) return false;

    // 3) if location=gym => exclude exercises marked as home-only
    if (loc === "gym" && e.isHomeOnly) return false;

    // 4) exclude technical exercises for novices in foundational phase
    if (shouldExcludeTechnicalForThisUser(wNum) && e.isTechnical) return false;

    return true;
  });
  if (!pass.length) return null;

  // If eqPref is non-empty => prefer an exercise that matches eqPref
  let passPref = pass.filter(e => {
    for (let need of e.equipmentNeeded) {
      if (eqPref.includes(need.toLowerCase())) return true;
    }
    return false;
  });
  if (passPref.length) {
    // random among passPref
    return passPref[Math.floor(Math.random() * passPref.length)];
  } else {
    // fallback => random among pass
    return pass[Math.floor(Math.random() * pass.length)];
  }
}

/***********************************************************************
* [FIX #3] => pickBodyweightFullDayWithTime => 2ex / 10min
***********************************************************************/
function pickBodyweightFullDayWithTime(exList, allocatedRT = 30) {
  // define upperBW, lowerBW, coreBW
  const upperBW = exList.filter(e =>
    e.equipmentNeeded.length === 1
    && e.equipmentNeeded[0].toLowerCase() === "bodyweight"
    && e.muscleGroup.match(/chest|shoulders|triceps|back|biceps/i)
  );
  const lowerBW = exList.filter(e =>
    e.equipmentNeeded.length === 1
    && e.equipmentNeeded[0].toLowerCase() === "bodyweight"
    && e.muscleGroup.match(/quads|hamstrings|glutes|calves/i)
  );
  const coreBW = exList.filter(e =>
    e.equipmentNeeded.length === 1
    && e.equipmentNeeded[0].toLowerCase() === "bodyweight"
    && e.muscleGroup === "core"
  );

  // how many blocks?
  let blocks = Math.floor(allocatedRT / 10);
  if (blocks < 1) blocks = 1;
  let totalEx = blocks * 2; // 2 per block

  let pattern = ["upper", "lower", "core"];
  let out = [];
  let pIdx = 0;
  while (out.length < totalEx) {
    let p = pattern[pIdx % pattern.length];
    if (p === "upper" && upperBW.length) {
      out.push(pickRandom(upperBW));
    } else if (p === "lower" && lowerBW.length) {
      out.push(pickRandom(lowerBW));
    } else if (p === "core" && coreBW.length) {
      out.push(pickRandom(coreBW));
    }
    pIdx++;
  }
  return out.filter(x => x);
}

/***********************************************************************
* trySwapToTechnical => forcibly swap to barbell/dumbbell if compound
***********************************************************************/
function trySwapToTechnical(origEx, forceCheck = false) {
  if (origEx.isTechnical) return origEx;
  if (origEx.typeOfMovement !== "compound") return origEx;

  let eqPrefs = (formData.equipmentPreference || []).map(x => x.toLowerCase());
  const eqAll = (formData.equipment || []).map(x => x.toLowerCase());
  let canBarbell = eqPrefs.includes("barbells");
  let canDumb = eqPrefs.includes("dumbbells");
  if (eqPrefs.length === 0) {
    if (eqAll.includes("barbells")) canBarbell = true;
    if (eqAll.includes("dumbbells")) canDumb = true;
  }
  if (forceCheck) {
    if (eqAll.includes("barbells")) canBarbell = true;
    if (eqAll.includes("dumbbells")) canDumb = true;
  }
  if (!canBarbell && !canDumb) return origEx;

  const mg = origEx.muscleGroup;
  // [NEW => if eqPrefs is not empty, we pick from eqPrefs first]
  let candsAll = EXERCISE_DATABASE.filter(e =>
    e.muscleGroup.toLowerCase() === mg.toLowerCase() &&
    e.isTechnical &&
    e.typeOfMovement === "compound"
  );

  // cands that match eqPref (barbell/dumbbell)
  let candsPref = candsAll.filter(e =>
    (canBarbell && e.equipmentNeeded.includes("Barbells")) ||
    (canDumb && e.equipmentNeeded.includes("Dumbbells"))
  );

  if (!candsPref.length) {
    // fallback => pick any from candsAll (like old logic)
    if (!candsAll.length) return origEx;
    return candsAll[0];
  }
  // pick one from candsPref randomly
  return candsPref[Math.floor(Math.random() * candsPref.length)];
}

/*******************************************************
 * Meal Generator
 *******************************************************/

const WEIGHT_LOSS_MAP = {
  low: [-0.10, -0.11, -0.12],
  medium: [-0.15, -0.17, -0.19],
  high: [-0.20, -0.22, -0.24],
};
const MUSCLE_GAIN_MAP = {
  low: [0.18, 0.20, 0.22],
  medium: [0.20, 0.22, 0.24],
  high: [0.22, 0.24, 0.26],
};
const IMPROVE_MAP = {
  low: {
    deficit: [-0.08, -0.09, -0.10],
    surplus: [0.10, 0.11, 0.12],
  },
  medium: {
    deficit: [-0.09, -0.10, -0.11],
    surplus: [0.12, 0.13, 0.14],
  },
  high: {
    deficit: [-0.10, -0.11, -0.12],
    surplus: [0.14, 0.15, 0.16],
  },
};

function getAdjustedMaintenance(week, maintenanceCals, userGoal) {
  // Determine the phase (1: weeks 1-4, 2: weeks 5-8, 3: weeks 9-12)
  let phase;
  if (week <= 4) phase = 1;
  else if (week <= 8) phase = 2;
  else phase = 3;

  let base = maintenanceCals; // start with the raw maintenance calories

  // Adjust based on goal:
  if (userGoal.includes("lose")) {
    // For weight loss, decrease the base by ~2% for each phase beyond phase 1.
    if (phase === 2) base *= 0.98;
    else if (phase === 3) base *= 0.98 * 0.98;
  } else if (userGoal.includes("gain")) {
    // For muscle gain, increase by ~1% for each phase beyond phase 1.
    if (phase === 2) base *= 1.01;
    else if (phase === 3) base *= 1.01 * 1.01;
  } else if (userGoal.includes("improve")) {
    // For improve body composition, decrease by ~1% per phase beyond phase 1.
    if (phase === 2) base *= 0.99;
    else if (phase === 3) base *= 0.99 * 0.99;
  }
  return Math.round(base);
}

// Helper: Determine which "phase" index (0..2) for weeks:
//   Weeks 1–4 = phaseIndex 0
//   Weeks 5–8 = phaseIndex 1
//   Weeks 9–12 = phaseIndex 2
function getPhaseIndex(week) {
  if (week >= 9) return 2; // 3rd block
  if (week >= 5) return 1; // 2nd block
  return 0;                // 1st block
}

// Each 4-week cycle: 
//   - weight-loss: weeks with remainder 1,2,3 => deficit; week%4===0 => maintenance
//   - muscle-gain: remainder 1,2,3 => surplus; remainder 0 => maintenance
//   - improve-body-composition => remainder 1 or 2 => deficit, remainder 3 => surplus, remainder 0 => maintenance
function getWeeklyPhase(userGoal, week) {
  if (userGoal.includes("improve")) {
    // remainder 0 => maintenance, 1-2 => deficit, 3 => surplus
    const mod = week % 4;
    if (mod === 0) return "maintenance";
    else if (mod === 3) return "surplus";
    else return "deficit"; // w%4=1 or 2
  }
  else if (userGoal.includes("gain")) {
    // remainder 1-3 => surplus, remainder 0 => maintenance
    return (week % 4 === 0) ? "maintenance" : "surplus";
  }
  else if (userGoal.includes("lose")) {
    // remainder 1-3 => deficit, remainder 0 => maintenance
    return (week % 4 === 0) ? "maintenance" : "deficit";
  }
  return "maintenance";  // fallback
}

// Main function that replicates the partial-fraction approach:
function getCalsForWeek(week) {
  const userGoalRaw = (localStorage.getItem("goal") || "lose weight").toLowerCase();
  const weeklyPhase = getWeeklyPhase(userGoalRaw, week);
  const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);
  const userEffort = (localStorage.getItem("effortLevel") || "moderate").toLowerCase();
  const baseMaint = getAdjustedMaintenance(week, maintenanceCals, userGoalRaw);
  const phaseIdx = getPhaseIndex(week); // 0, 1, or 2
  const mod = week % 4;

  if (weeklyPhase === "maintenance") {
    return baseMaint;
  }

  if (weeklyPhase === "deficit") {
    if (userGoalRaw.includes("lose")) {
      const arr = WEIGHT_LOSS_MAP[userEffort] || WEIGHT_LOSS_MAP.medium;
      const basePct = arr[phaseIdx];
      let fraction = 1.0;
      if (mod === 1) fraction = 0.50;
      else if (mod === 2) fraction = 0.75;
      return Math.round(baseMaint * (1 + basePct * fraction));
    } else if (userGoalRaw.includes("improve")) {
      const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
      const defArr = obj.deficit;
      const basePct = defArr[phaseIdx];
      if (mod === 1) {
        return Math.round(baseMaint * (1 + basePct * 0.75));
      } else {
        return Math.round(baseMaint * (1 + basePct));
      }
    }
    return baseMaint;
  }

  if (weeklyPhase === "surplus") {
    if (userGoalRaw.includes("gain")) {
      const arr = MUSCLE_GAIN_MAP[userEffort] || MUSCLE_GAIN_MAP.medium;
      const basePct = arr[phaseIdx];
      let fraction = 1.0;
      if (mod === 1) fraction = 0.50;
      else if (mod === 2) fraction = 0.75;
      return Math.round(baseMaint * (1 + basePct * fraction));
    } else if (userGoalRaw.includes("improve")) {
      const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
      const surArr = obj.surplus;
      const basePct = surArr[phaseIdx];
      return Math.round(baseMaint * (1 + basePct));
    }
    return baseMaint;
  }
  return baseMaint;
}

function calculateWeeklyCaloriesAndMacros12Week() {
  // Pull needed values from localStorage

  // We apply a gender-based minimum calorie floor
  // (matching your original logic: 1200 for female, 1500 for male)
  const userGender = (localStorage.getItem("gender") || "male").toLowerCase();
  let minCals = (userGender === "male") ? 1500 : 1200;

  // Multipliers you used in your fill12NutritionCaloriePage logic:

  // Loop through weeks 1 to 12, calculate macros, store values, and log results.
  for (let w = 1; w <= 12; w++) {
    let dailyCals = getCalsForWeek(w);
    // Ensure we do not go below the minimum calories
    if (dailyCals < minCals) {
      dailyCals = minCals;
    }

    // Standard macro breakdown: 30% protein, 40% carbs, 30% fat
    const p = Math.round((0.30 * dailyCals) / 4);
    const c = Math.round((0.40 * dailyCals) / 4);
    const f = Math.round((0.30 * dailyCals) / 9);

    localStorage.setItem(`week${w}_dailyCalsWMCO`, String(dailyCals));
    localStorage.setItem(`week${w}_proteinWMCO`, String(p));
    localStorage.setItem(`week${w}_carbsWMCO`, String(c));
    localStorage.setItem(`week${w}_fatsWMCO`, String(f));

    // console.log(`Week ${w}: ${dailyCals} kcals | Protein=${p}g, Carbs=${c}g, Fats=${f}g`);
  }

  // console.log("✅ Finished calculating and storing 12-week calorie & macro figures!");
}

/*********************************************************
 * [B] HELPER FUNCTIONS FOR PORTION SCALING, ETC.
 *    (Copy from 12-week-program.js but remove DOM references)
 *********************************************************/
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
  // console.log("DEBUG: localStorage mealFrequency=", raw, " => parsed=", getMealFrequency());
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

function portionScaleMeal(meal, newCalorieTarget) {
  // console.log("\n--- portionScaleMeal START ---");
  // console.log("Original Meal:", meal.mealName);

  // 1) If the meal’s current .calories is X, 
  //    the scale factor = newCalorieTarget / X
  const baseCals = meal.calories;
  const rawScale = newCalorieTarget / baseCals;

  // Constrain to 0.9..1.1 or your chosen range
  const portionMultiplier = Math.max(0.9, Math.min(1.1, rawScale));
  // console.log(`Target cals=${newCalorieTarget}, base cals=${baseCals}, rawScale=${rawScale.toFixed(3)}, final multiplier=${portionMultiplier.toFixed(2)}`);

  // 2) Recompute the "actual" final total cals 
  //    after we clamp the portionMultiplier:
  const finalCals = Math.round(baseCals * portionMultiplier);

  // 3) Recompute macros from macroRatio * finalCals
  const macrosObj = calculateMacros(finalCals, meal.macroRatio);

  // console.log("New totalCals:", finalCals, " => macros:", macrosObj);

  // 4) Scale the portionSize
  const newPortionSize = parseFloat((meal.portionSize * portionMultiplier).toFixed(2));
  // console.log("Old portionSize=", meal.portionSize, " => new portionSize=", newPortionSize);

  // 5) Scale each ingredient
  const updatedIngredients = meal.ingredients.map(origIng => {
    const scaled = scaleIngredient(origIng, portionMultiplier);
    // console.log(`  Ingredient "${origIng.name}" => old qty=${origIng.quantity} new qty=${scaled.quantity}`);
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

  // console.log("--- portionScaleMeal END ---\n");
  return updatedMeal;
}

/*********************************************************
 * pickMealForCategory, ratioData, etc.
 *********************************************************/
function pickMealForCategory(category, mealTarget, database) {
  const lowerBound = 0.9 * mealTarget;
  const upperBound = 1.1 * mealTarget;

  // console.log(`\n[pickMealForCategory] Cat=${category} target=${mealTarget}, range=[${Math.round(lowerBound)}..${Math.round(upperBound)}]`);

  // filter
  const possibleMeals = database.filter(m => {
    if (!m.category || m.category.toLowerCase() !== category.toLowerCase()) return false;
    // If the meal's base cals are in [0.9..1.1] × mealTarget
    return (m.calories >= lowerBound && m.calories <= upperBound);
  });

  // console.log(`  -> Found ${possibleMeals.length} possible meal(s) for "${category}"`, possibleMeals.map(m => m.mealName));

  if (!possibleMeals.length) {
    // console.warn(`No ${category} meal found in ±10% range for target ${mealTarget}`);
    return null;
  }

  // pick random
  const rndIndex = Math.floor(Math.random() * possibleMeals.length);
  const chosen = possibleMeals[rndIndex];

  // scale to exactly the mealTarget (within 0.9..1.1 clamp)
  const scaledMeal = portionScaleMeal(chosen, mealTarget);
  return scaledMeal;
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

function getMealSplitsForPhase(phase, mealFreq) {
  // If ratioData[phase] is undefined, default to ratioData.deloadPhase
  const phaseObj = ratioData[phase] || ratioData.deloadPhase;
  return phaseObj[mealFreq] || ratioData.deloadPhase[4];
}

function getMealPhaseForWeek(weekNum, userGoal) {
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

function generateTwelveWeekMealPlan() {
  const userGoal = (localStorage.getItem("goal") || "lose weight").toLowerCase();
  const mealFreq = getMealFrequency();  // e.g. 2, 3, or 4
  const allWeeks = [];

  for (let w = 1; w <= 12; w++) {
    const weekObj = {
      week: w,
      days: []
    };
    // figure out which “phase” => e.g. “deficitPhase” or “surplusPhase” or “deloadPhase”
    const phase = getMealPhaseForWeek(w, userGoal);
    // get that entire ratio object for the user’s mealFreq
    const ratioObj = getMealSplitsForPhase(phase, mealFreq);

    // 7 days
    for (let d = 1; d <= 7; d++) {
      // 1) dailyCals
      const dailyCals = getCalsForWeek(w);
      let dayMeals = {};

      // e.g. ratioObj might look like {Breakfast: 0.3, Lunch: 0.4, Dinner: 0.3}
      // or with 4 meals if mealFreq=4
      Object.keys(ratioObj).forEach((cat) => {
        const mealTarget = Math.round(dailyCals * ratioObj[cat]);
        const chosenMeal = pickMealForCategory(cat, mealTarget, mealDatabase);
        dayMeals[cat] = chosenMeal;  // either null or a scaled meal
      });

      // compute total
      let finalTotal = 0;
      Object.values(dayMeals).forEach(m => {
        if (m) finalTotal += m.calories;
      });

      weekObj.days.push({
        day: d,
        label: `Week ${w} - Day ${d}`,
        meals: dayMeals,
        finalTotalCals: finalTotal
      });
    }
    allWeeks.push(weekObj);
  }

  // store in localStorage
  localStorage.setItem("twelveWeekMealPlan", JSON.stringify(allWeeks));
  // console.log("✅ 12-week meal plan generated & saved!");
}

/***********************************************************************
* Final Page Replacement
***********************************************************************/

function replaceWithFinalPage() {
  generateAllPrograms();
  generateTwelveWeekMealPlan();

  // Animate the footer out...
  const fixedFooter = document.querySelector(".fixed-footer");
  if (fixedFooter) {
    fixedFooter.classList.add("slide-out");
    fixedFooter.addEventListener("transitionend", function handleFooterTransition(e) {
      if (e.propertyName === "transform" || e.propertyName === "opacity") {
        fixedFooter.style.display = "none";
        fixedFooter.removeEventListener("transitionend", handleFooterTransition);
      }
    });
  }
  progressBarFill.style.width = "0%";

  const formContainer = document.querySelector(".form-container");
  formContainer.innerHTML = "";

  // Final message
  const finalMsg = document.createElement("div");
  finalMsg.classList.add("final-message");
  finalMsg.innerHTML = `
  <h2 class="final-headline">
    <span class="final-num">10,000+</span><br>
    <span class="final-sub"><strong>kick-started their journey with us</strong></span>
  </h2>

  <div class="final-rating" role="img" aria-label="Rated 4.8 out of 5 stars">
    <span class="final-stars" aria-hidden="true">★★★★★</span>
    <span class="final-score">4.8&nbsp;/&nbsp;5</span>
  </div>

  <!-- optional: real Apple/Google Pay button mounts here if supported -->
  <div id="prb-inline" class="prb-inline" style="display:none;"></div>

  <p class="final-reviews">2,500+ five-star reviews from happy users</p>
`;
  formContainer.appendChild(finalMsg);


  // Loading container
  const loadingContainer = document.createElement("div");
  loadingContainer.classList.add("loading-container");
  formContainer.appendChild(loadingContainer);

  const loadingText = document.createElement("p");
  loadingText.classList.add("loading-text");
  loadingText.textContent = "Loading";
  loadingContainer.appendChild(loadingText);

  // Move the progress bar into the loading container
  const pBar = document.querySelector(".progress-bar");
  if (pBar) {
    loadingContainer.appendChild(pBar);
  }

  let rotatingMessage = document.getElementById("rotating-message");
  if (!rotatingMessage) {
    rotatingMessage = document.createElement("p");
    rotatingMessage.id = "rotating-message";
    rotatingMessage.classList.add("rotating-message");
    rotatingMessage.textContent = getRotatingMessage();
    loadingContainer.appendChild(rotatingMessage);
  }

  if (rotatingMsgInterval) {
    clearInterval(rotatingMsgInterval);
  }
  rotatingMsgInterval = setInterval(() => {
    const rotatingMessageElem = document.getElementById("rotating-message");
    if (rotatingMessageElem) {
      rotatingMessageElem.textContent = getRotatingMessage();
    }
  }, 2000);

  // Progress bar fill logic over 5 seconds then redirect …
  const duration = 5000;
  let startTime = null;
  function fillBar(timestamp) {
    if (!startTime) startTime = timestamp;
    let progress = Math.min(((timestamp - startTime) / duration) * 100, 100);
    progressBarFill.style.width = progress + "%";
    if (progress < 100) {
      requestAnimationFrame(fillBar);
    } else {
      window.location.href = "sign-up-vital.html";
    }
  }
  requestAnimationFrame(fillBar);
}

function handleDynamicDateChange(question, dateValue) {
  // Only perform the age check if this question is for DOB
  if (question.validateAge) {
    const userDOB = new Date(dateValue);
    const today = new Date();

    // Calculate the age
    let age = today.getFullYear() - userDOB.getFullYear();
    const birthdayThisYear = new Date(today.getFullYear(), userDOB.getMonth(), userDOB.getDate());
    if (today < birthdayThisYear) {
      age--;
    }

    if (age < 18) {
      alert("You must be 18 to proceed.");
      // Optionally clear the input or handle the error as needed
      return false; // indicate validation failed
    }
  }
  // Otherwise, validation passes (or different validations may run)
  return true;
}

// Place this helper near your other functions at the top of your script.
function displayWarning(message) {
  // Check if an element with id="warning-text" already exists.
  let warningElem = document.getElementById('warning-text');
  if (!warningElem) {
    // Create the element if it doesn't exist.
    warningElem = document.createElement('p');
    warningElem.id = 'warning-text';
    // Add a class that you use for red warning styling.
    // (Ensure that your CSS for #warning-text and .visible matches your TOS warning text styling.)
    warningElem.classList.add('visible');
    // Append it beneath your form options (adjust the selector if necessary).
    const optionsContainer = document.querySelector('.form-options');
    if (optionsContainer) {
      optionsContainer.appendChild(warningElem);
    } else {
      document.body.appendChild(warningElem);
    }
  }
  // Set the warning message text.
  warningElem.textContent = message;
  // Remove any "hidden" class and force the element to be displayed.
  warningElem.classList.remove('hidden');
  warningElem.style.display = 'block';
}

// Helper to choose messages based on the stored user goal.
function getLoadingMessagesByGoal() {
  let goal = (localStorage.getItem("goal") || "").toLowerCase();
  let messages = [];

  if (goal.includes("gain")) {
    messages = messages.concat(loadingMessagesAll.muscleGain);
  } else if (goal.includes("lose")) {
    messages = messages.concat(loadingMessagesAll.weightLoss);
  } else if (goal.includes("improve")) {
    messages = messages.concat(loadingMessagesAll.bodyRecomposition);
  }
  // Append the Feature-Based and Personality messages for all users:
  messages = messages.concat(loadingMessagesAll.featureBased, loadingMessagesAll.personality);

  return messages;
}

function getRotatingMessage() {
  // Determine the goal-specific array based on localStorage.
  let goal = (localStorage.getItem("goal") || "").toLowerCase();
  let goalArray = [];
  if (goal.includes("gain")) {
    goalArray = loadingMessagesAll.muscleGain;
  } else if (goal.includes("lose")) {
    goalArray = loadingMessagesAll.weightLoss;
  } else if (goal.includes("improve")) {
    goalArray = loadingMessagesAll.bodyRecomposition;
  }
  // Safety default
  if (goalArray.length === 0) {
    goalArray = loadingMessagesAll.weightLoss;
  }

  // Define the three arrays in a fixed order.
  const messageGroups = [
    goalArray,
    loadingMessagesAll.featureBased,
    loadingMessagesAll.personality
  ];

  // Determine which array to use this rotation.
  const currentGroup = messageGroups[rotatingMessageIndex % messageGroups.length];
  // Increment for the next call.
  rotatingMessageIndex++;

  // Pick a random message from the selected group and return it.
  return currentGroup[Math.floor(Math.random() * currentGroup.length)];
}

function calculateProjectedGoalDate() {
  // Retrieve the current and goal weights.
  // Prefer "userCurrentWeight" over "weight".
  let currWeightStr = localStorage.getItem("userCurrentWeight") || localStorage.getItem("weight") || "0";
  let goalWeightStr = localStorage.getItem("userGoalWeight") || "0";
  let currWeight = parseFloat(currWeightStr);
  let goalWeight = parseFloat(goalWeightStr);

  // Validate that weights are valid numbers and nonzero.
  if (isNaN(currWeight) || isNaN(goalWeight) || currWeight === 0 || goalWeight === 0) {
    // console.log("Goal weight or current weight is not properly set.");
    return;
  }

  // Retrieve maintenance calories.
  const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2200", 10);

  // Determine if we are aiming for weight loss or weight gain.
  // (For body composition improvement, assume weight loss if current > goal.)
  const isWeightLoss = currWeight > goalWeight;
  const requiredChange = Math.abs(currWeight - goalWeight); // in kg

  // Calculate cumulative weekly weight change based on WMCO targets.
  // For weeks 1-12, use the corresponding stored value; beyond that, use week12 value.
  let cumulativeChange = 0;
  let weeksRequired = 0;
  const week12Target = parseInt(localStorage.getItem("week12_dailyCalsWMCO") || "0", 10);

  while (cumulativeChange < requiredChange) {
    weeksRequired++;
    let weekTarget = (weeksRequired <= 12)
      ? parseInt(localStorage.getItem(`week${weeksRequired}_dailyCalsWMCO`) || "0", 10)
      : week12Target;

    let dailyDifference = 0;
    if (isWeightLoss) {
      dailyDifference = Math.max(maintenanceCals - weekTarget, 0);
    } else {
      dailyDifference = Math.max(weekTarget - maintenanceCals, 0);
    }

    // Convert the daily caloric difference into kg (7700 kcal ≈ 1 kg).
    let weeklyChangeKg = (dailyDifference * 7) / 7700;

    // Determine the effort level and set a corresponding minimum weekly change value.
    // (These sample values can be adjusted as needed.)
    const effortLevel = formData.effortLevel ? formData.effortLevel.toLowerCase() : "moderate";
    let minWeeklyChange;
    if (isWeightLoss) {
      // For weight loss – forcing a minimum loss rate (if desired)
      if (effortLevel === "moderate") {
        minWeeklyChange = 0.5; // for moderate effort, at least 0.5 kg/week loss
      } else if (effortLevel === "slight") {
        minWeeklyChange = 0.3; // example value for slight effort
      } else if (effortLevel === "high") {
        minWeeklyChange = 0.7; // example value for high effort
      } else {
        minWeeklyChange = 0.5; // default fallback
      }
    } else {
      // For weight gain (or improve body composition targeting gain)
      if (effortLevel === "moderate") {
        minWeeklyChange = 0.25; // for moderate effort, at least 0.25 kg/week gain
      } else if (effortLevel === "slight") {
        minWeeklyChange = 0.15;
      } else if (effortLevel === "high") {
        minWeeklyChange = 0.35;
      } else {
        minWeeklyChange = 0.25;
      }
    }

    // Apply both maximum and minimum caps.
    // For weight loss, cap the maximum at 0.5 kg/week; for gain (or comp), cap at 1 kg/week.
    if (isWeightLoss) {
      weeklyChangeKg = Math.min(weeklyChangeKg, 0.5);        // maximum cap for weight loss
      weeklyChangeKg = Math.max(weeklyChangeKg, minWeeklyChange); // enforce minimum loss rate
    } else {
      weeklyChangeKg = Math.min(weeklyChangeKg, 1);            // maximum cap for gain/comp
      weeklyChangeKg = Math.max(weeklyChangeKg, minWeeklyChange); // enforce minimum gain rate
    }

    cumulativeChange += weeklyChangeKg;

    if (weeklyChangeKg === 0) {
      // console.log("No caloric difference detected; cannot compute projected goal date.");
      break;
    }
  }

  // Apply a buffer factor (20% extra time) to account for refeed weeks and metabolic adaptations.
  weeksRequired = Math.ceil(weeksRequired * 1.2);

  // Calculate the projected goal date.
  let projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + weeksRequired * 7);

  // Format the date for display.
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  let projectedDateStr = projectedDate.toLocaleDateString(undefined, options);

  // Compare with user-specified goal date (if provided).
  const userGoalDateStr = localStorage.getItem("userGoalDate");
  let statusMsg = "";
  if (userGoalDateStr) {
    let targetDate = new Date(userGoalDateStr);
    if (projectedDate <= targetDate) {
      statusMsg = `Projected to achieve goal on ${projectedDateStr}, which is before your target date of ${targetDate.toLocaleDateString(undefined, options)}.`;
    } else {
      statusMsg = `Projected to achieve goal on ${projectedDateStr}, which is after your target date of ${targetDate.toLocaleDateString(undefined, options)}.`;
    }
  } else {
    statusMsg = `Projected to achieve goal on ${projectedDateStr}.`;
  }

  // console.log("Projected Goal Date:", projectedDateStr);
  // console.log(statusMsg);

  // Save the projected date and status message.
  localStorage.setItem("projectedGoalDate", projectedDateStr);
  localStorage.setItem("projectedGoalStatus", statusMsg);
}

/***********************************************************************
 * Next Button Handler
 ***********************************************************************/

nextButton.addEventListener("click", () => {
  const currentQ = questions[currentQuestionIndex];
  const bmiCategory = localStorage.getItem("bmiCategory");
  const chosenGoal = formData.goal; // already set when they clicked “Lose Weight”
  if (
    currentQ.key === "goal" &&
    bmiCategory === "Underweight" &&
    chosenGoal === "lose weight"
  ) {
    displayWarning(
      "You’re currently classified as underweight. Losing more weight could be unsafe—how about we focus on building strength or maintaining a healthy routine instead?"
    );
    return; // stop here
  }
  if (
    currentQ.key === "goal" &&
    bmiCategory === "Obese" &&
    chosenGoal === "gain muscle" &&
    !obeseGainWarnShown
  ) {
    displayWarning(
      "You're classified as obese. Muscle gain is fine, but fat loss is often a healthier start. Your call."
    );
    obeseGainWarnShown = true;
    return;
  }
  const input = optionsContainer.querySelector("input");

  if (currentQuestionIndex === 0) {
    const agreementCheckbox = document.getElementById("agreement-checkbox");
    const warningText = document.getElementById("warning-text");

    // Validate the checkbox
    if (!agreementCheckbox.checked) {
      warningText.classList.remove("hidden");
      warningText.classList.add("visible");
      return; // Stop progression if checkbox isn't checked
    } else {
      warningText.classList.add("hidden");
      warningText.classList.remove("visible");
    }
  }

  // If currentQ is "Where do you plan to work out?" => we check if user has selected "gym",
  // and if so, THEN do the auto-fill + skip eq question
  if (currentQ.key === "workoutLocation") {
    // if ((formData.workoutLocation || "").toLowerCase() === "gym") {
    //   // [ADDED logic => auto fill & remove Q13 only NOW if still present]
    //   if (equipmentQuestionIndex !== -1) {
    //     // remove it from the array
    //     questions.splice(equipmentQuestionIndex, 1);
    //   }
    //   formData.equipment = [
    //     "dumbbells", "barbells", "bench", "rack", "kettlebells", "cables",
    //     "machines", "smith machine", "pull-up bar", "dip station"
    //   ];
    //   // console.log("Auto-filled eq for gym => removed Q13 from array.");
    // }
  }

  // Standard validations
  if (currentQ.key === "dob") {
    const dobInput = document.querySelector(".date-input")?.value;
    if (!dobInput) {
      displayWarning("Please enter your date of birth.");
      return;
    }
    const { valid, age } = calculateAge(dobInput);
    if (!valid) {
      if (age < 18) {
        displayWarning("You must be 18+ to proceed.");
      } else {
        displayWarning("Please enter a valid age before proceeding.");
      }
      return;
    }
    localStorage.setItem("dob", dobInput);
  }
  const q = questions[currentQuestionIndex];

  if (q.key === "name") {
    if (!input?.value.trim()) {
      displayWarning("Please enter your name.");
      return;
    }
    const cap = n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
    formData.name = cap(input.value.trim());
    localStorage.setItem("name", formData.name);
  }
  if (currentQ.key === "height") {
    let cmVal;
    if (heightUnit === "cm") {
      cmVal = parseFloat(optionsContainer.querySelector(".h-cm")?.value);
    } else {
      const ft = parseFloat(optionsContainer.querySelector(".h-ft")?.value);
      const inch = parseFloat(optionsContainer.querySelector(".h-in")?.value) || 0;
      cmVal = cmFromFtIn(ft || 0, inch);
    }
    if (isNaN(cmVal) || cmVal < 50 || cmVal > 272) {
      displayWarning("Please enter a valid height.");
      return;
    }
    formData.height = cmVal;
    localStorage.setItem("height", cmVal.toString());
    updateAnthroMetrics();
  }
  if (currentQ.key === "weight") {
    let kgVal;
    if (weightUnit === "kg") {
      kgVal = parseFloat(optionsContainer.querySelector(".w-kg")?.value);
    } else {
      const lbs = parseFloat(optionsContainer.querySelector(".w-lbs")?.value);
      kgVal = kgFromLbs(lbs || 0);
    }
    if (isNaN(kgVal) || kgVal < 30 || kgVal > 400) {
      displayWarning("Please enter a valid weight.");
      return;
    }
    formData.weight = kgVal;
    localStorage.setItem("weight", kgVal.toString());
    updateAnthroMetrics();
  }
  if (currentQ.key === "dietaryRestrictions") {
    // The user is expected to select one option.
    const selLi = optionsContainer.querySelector("li.selected");
    const val = selLi ? selLi.textContent.trim() : "None";
    localStorage.setItem("dietaryRestrictions", val);
    // console.log("dietaryRestrictions saved at Next =>", val);
  }
  if (currentQ.key === "userGoalWeight") {
    // grab the input element and parse their goal entry
    const inp = optionsContainer.querySelector(".goal-weight-input");
    const rawVal = parseFloat(inp.value);

    // basic validity
    if (isNaN(rawVal) || rawVal <= 0) {
      displayWarning("Please enter a valid number for your goal weight.");
      return;
    }

    // pull their *current* raw weight & unit from localStorage
    const savedRaw = JSON.parse(localStorage.getItem("weightRaw") || "null");
    // fallback display if somehow missing
    const currDisplay = savedRaw
      ? `${Math.round(parseFloat(savedRaw.value))} ${savedRaw.unit}`
      : `${Math.round(formData.weight)} kg`;

    // if they tried to set the goal == their current
    if (savedRaw && parseFloat(savedRaw.value) === rawVal) {
      displayWarning(
        `Your goal weight can’t be the same as your current weight (${currDisplay}). Please choose a different target.`
      );
      return;
    }

    // convert their goal to kg for your lose/gain checks
    const goalKg = (weightUnit === "lbs")
      ? kgFromLbs(rawVal)
      : rawVal;
    const currKg = formData.weight || 0;

    // loss‑mode must be strictly below current
    if (formData.goal === "lose weight" && goalKg >= currKg) {
      displayWarning(
        `Looks like your goal weight is higher than your current weight (${currDisplay}). For weight loss, let’s set a lower target.`
      );
      return;
    }

    // gain‑mode must be strictly above current
    if (formData.goal === "gain muscle" && goalKg <= currKg) {
      displayWarning(
        `To gain muscle, your goal should be above your current weight (${currDisplay}). Let’s aim a little higher.`
      );
      return;
    }

    // ✅ everything’s valid — store goal in kg and clear the temp
    formData.userGoalWeight = goalKg;
    delete formData.goalWeightInputTemp;
    localStorage.setItem("userGoalWeight", goalKg.toString());
  }
  if (currentQ.key === "userGoalDate") {
    const dateVal = input.value;
    if (!dateVal) {
      displayWarning("Please select a valid target date.");
      return;
    }
    // Create Date objects for the selected date and for one week from today.
    const selectedDate = new Date(dateVal);
    const today = new Date();
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);

    // Check if the selected date is at least one week in the future.
    if (selectedDate < oneWeekLater) {
      displayWarning("Please select a target date at least one week from today.");
      return;
    }
    formData.userGoalDate = dateVal;
    localStorage.setItem("userGoalDate", dateVal);
  }
  if (currentQ.key === "foodAllergies") {
    const selAll = optionsContainer.querySelectorAll("li.selected");
    let allergies = Array.from(selAll).map(li => li.textContent.trim());
    // If "None" is selected, override all others.
    if (allergies.some(a => a.toLowerCase() === "none")) {
      allergies = ["None"];
    }
    localStorage.setItem("foodAllergies", JSON.stringify(allergies));
    // console.log("foodAllergies saved at Next =>", allergies);
  }
  if (currentQ.key === "mealFrequency") {
    const selectedOption = optionsContainer.querySelector("li.selected");
    if (selectedOption) {
      const mealFrequency = selectedOption.textContent.trim();
      localStorage.setItem("mealFrequency", mealFrequency);
      // console.log("Meal Frequency saved =>", mealFrequency);
    }
  }
  if (currentQ.key === "ultimateGoal") {
    const goalInput = optionsContainer.querySelector("input");
    if (goalInput && goalInput.value.trim()) {
      const ultimateGoal = goalInput.value.trim();
      localStorage.setItem("ultimateGoal", ultimateGoal);
      // console.log("Ultimate Goal saved =>", ultimateGoal);
    } else {
      displayWarning("Please enter your ultimate goal before proceeding.");
      return;
    }
  }

  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
    updateProgressBar();
    // Scroll to the top of the `.scroll` container
    const scrollableElement = document.querySelector(".scroll");
    if (scrollableElement) {
      scrollableElement.scrollTop = 0; // Scroll the .scroll container to the top
    } else {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE, and Opera
    }
  } else {
    replaceWithFinalPage();
    calculateGoalCalories();
    if (formData.weight && formData.height && formData.age && formData.gender && formData.activityLevel) {
      calculateMaintenanceCalories();
      calculateBaseProjections();
    }
    calculateWeeklyCaloriesAndMacros12Week();
    calculateProjectedGoalDate();
  }
});

const backButton = document.getElementById("back-button");
backButton.addEventListener("click", () => {
  // If we’re not already on the first question, go back one.
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion(currentQuestionIndex);
    updateProgressBar();
  }
});

// [UNCHANGED => Start the form]
loadQuestion(currentQuestionIndex);
updateProgressBar();

// Make the fixed footer pop in once the DOM is ready
// window.addEventListener("DOMContentLoaded", () => {
//   const fixedFooter = document.querySelector(".fixed-footer");
//   if (fixedFooter) {
//     // Delay slightly if you want it to appear after other elements:
//     setTimeout(() => {
//       fixedFooter.classList.add("visible");
//     }, 500);
//   }
// });

const closeBtn = document.getElementById('incentive-close');
closeBtn.addEventListener('click', () => {
  document.getElementById('incentive-box').style.display = 'none';
});

if (localStorage.getItem("hideBanner")) {
  document.getElementById("incentive-box").style.display = "none";
}

document.getElementById("incentive-close").addEventListener("click", () => {
  document.getElementById("incentive-box").style.display = "none";
  localStorage.setItem("hideBanner", true);
});