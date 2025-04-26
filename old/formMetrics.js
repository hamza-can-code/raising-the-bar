// client/scripts/modules/formMetrics.js

import { questions } from "./formData.js";

import {
    formData,
    heightUnit,
    weightUnit,
    setHeightUnit,
    setWeightUnit,
    rotatingMsgInterval,
    rotatingMessageIndex,
  } from "./formState.js";
  
  // ——— Anthro updater ———
  export function updateAnthroMetrics() {
    if (formData.weight && formData.height) {
      calculateBMI();
    }
    if (
      formData.weight &&
      formData.height &&
      formData.age &&
      formData.gender &&
      formData.activityLevel
    ) {
      calculateMaintenanceCalories();
      calculateBaseProjections();
    }
  }
  
  // If you need to skip equipment question dynamically
  export const equipmentQuestionIndex = questions.findIndex(
    (q) => q.key === "equipment"
  );
  
  // ——— BMI ———
  export function calculateBMI() {
    const weight = formData.weight;
    const height = formData.height;
    if (!weight || !height) {
      console.warn("Weight or height missing for BMI calc.");
      return null;
    }
    const hm = height / 100;
    const bmi = (weight / (hm * hm)).toFixed(2);
    let category;
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 24.9) category = "Healthy";
    else if (bmi < 29.9) category = "Overweight";
    else category = "Obese";
  
    localStorage.setItem("userBMI", bmi);
    localStorage.setItem("bmiCategory", category);
    localStorage.setItem("weight", weight);
    localStorage.setItem("height", height);
    return { bmi, category };
  }
  
  // ——— Maintenance calories ———
  const activityMultipliers = {
    "sedentary (little to no exercise)": 1.2,
    "lightly active (light exercise/sports 1–3 days per week)": 1.375,
    "moderately active (moderate exercise/sports 3–5 days per week)": 1.55,
    "very active (hard exercise/sports 6–7 days per week)": 1.725,
    "extra active (very hard exercise, physical job, or training twice a day)": 1.9,
  };
  
  export function calculateMaintenanceCalories() {
    const { weight: w, height: h, age: a, gender: g, activityLevel: act } =
      formData;
    if (!w || !h || !a || !g || !act) {
      console.log("Missing data for maintenance cals calc. Will try again later.");
      return null;
    }
  
    let bmr;
    if (g.toLowerCase() === "male") {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else if (g.toLowerCase() === "female") {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    } else {
      console.error("Gender not recognized.");
      return null;
    }
  
    const multi = activityMultipliers[act.toLowerCase()];
    if (!multi) {
      console.error(`Invalid activity level: "${act}"`);
      return null;
    }
  
    const maintenance = Math.round(bmr * multi);
    console.log(`BMR: ${bmr.toFixed(1)}, Multi: ${multi} => Maintenance: ${maintenance}`);
    localStorage.setItem("maintenanceCalories", maintenance);
    return maintenance;
  }
  
  // ——— Goal calories ———
  export function calculateGoalCalories() {
    const maintenance = parseInt(localStorage.getItem("maintenanceCalories"), 10);
    let fitnessGoal = formData.goal;
    const gender = formData.gender;
    if (!maintenance || !fitnessGoal) {
      console.error("Missing maintenance or goal for cals.");
      return;
    }
    fitnessGoal = fitnessGoal.toLowerCase();
  
    const out = {};
    const effMult = { slight: 0.1, moderate: 0.2, high: 0.3 };
    const calFloor = gender === "male" ? 1500 : 1200;
  
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
        console.error(`Unknown goal: ${fitnessGoal}`);
        return;
    }
  
    localStorage.setItem("goalCalories", JSON.stringify(out));
  
    const eLevel = formData.effortLevel || "moderate";
    let selected;
    if (fitnessGoal.includes("improve")) {
      selected = out.maintenance;
    } else {
      selected =
        (eLevel === "slight" ? out.slightDeficit || out.slightSurplus :
         eLevel === "high"   ? out.intenseDeficit || out.intenseSurplus :
                               out.moderateDeficit || out.moderateSurplus);
    }
  
    localStorage.setItem("selectedCalories", selected);
    console.log(`Selected Calories for effort "${eLevel}": ${selected}`);
    return out;
  }
  
  // ——— Base projections ———
  const defaultBaseProjections    = { fatLoss: 6.0, muscleGain: 3.0 };
  const fitnessLevelMultipliers   = { beginner: 1.25, intermediate: 1.0, advanced: 0.65 };
  const workoutAvailabilityMultipliers = {
    1: 0.6, 2: 0.75, 3: 0.9, 4: 1.0, 5: 1.1, 6: 1.05, 7: 1.0,
  };
  
  export function roundToOneDecimal(v) {
    return Math.round(v * 10) / 10;
  }
  
  export function calculateBaseProjections() {
    const mCals  = parseInt(localStorage.getItem("maintenanceCalories"), 10);
    const bmiCat = localStorage.getItem("bmiCategory");
    const g      = (formData.goal || "").toLowerCase();
  
    if (!mCals || !bmiCat) {
      console.error("Missing maintenance cals or BMI cat for base projections.");
      return null;
    }
  
    const eLevel = formData.effortLevel || "moderate";
    const wDays  = formData.workoutDays    || 3;
    const fLevel = formData.fitnessLevel   || "intermediate";
  
    let baseFat    = defaultBaseProjections.fatLoss;
    let baseMuscle = defaultBaseProjections.muscleGain;
  
    // Underweight -> force muscle gain
    if (bmiCat === "Underweight" && g === "lose weight") {
      console.warn("Underweight user => switching to muscle gain");
      baseFat    = 0;
      baseMuscle = 2.0;
      formData.goal = "gain muscle";
      alert("Underweight detected—focusing on muscle gain instead.");
    }
  
    const goalMultipliers = {
      "lose weight": { fatLoss: 0.9, muscleGain: 0.1 },
      "gain muscle": { fatLoss: 0.2, muscleGain: 0.8 },
      "improve body composition (build muscle & lose fat)": { fatLoss: 0.5, muscleGain: 0.5 },
    };
    const gf        = goalMultipliers[g] || goalMultipliers["improve body composition (build muscle & lose fat)"];
    const effMults  = { slight: 0.8, moderate: 1.0, high: 1.15 };
    const wMult     = workoutAvailabilityMultipliers[wDays] || 1.0;
    const fMult     = fitnessLevelMultipliers[fLevel] || 1.0;
  
    let adjFat    = roundToOneDecimal(baseFat    * gf.fatLoss      * effMults[eLevel] * wMult * fMult);
    let adjMuscle = roundToOneDecimal(baseMuscle * gf.muscleGain   * effMults[eLevel] * wMult * fMult);
  
    // Enforce safe BMI floor
    const projectedWeight = formData.weight - adjFat;
    const minWeight       = 18.5 * Math.pow(formData.height / 100, 2);
    if (projectedWeight < minWeight) {
      console.warn("Projected < safe BMI, adjusting fat loss down.");
      adjFat = roundToOneDecimal(Math.max(formData.weight - minWeight, 0));
    }
  
    localStorage.setItem(
      "goalBasedProjections",
      JSON.stringify({ fatLoss: adjFat, muscleGain: adjMuscle })
    );
    return { adjustedFatLoss: adjFat, adjustedMuscleGain: adjMuscle };
  }  