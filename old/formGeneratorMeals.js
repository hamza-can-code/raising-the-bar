import {
    formData,
    heightUnit,  weightUnit,
    setHeightUnit, setWeightUnit,
    rotatingMsgInterval, rotatingMessageIndex,
  } from "./formState.js";

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
  
  export function getAdjustedMaintenance(week, maintenanceCals, userGoal) {
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
  export function getPhaseIndex(week) {
    if (week >= 9) return 2; // 3rd block
    if (week >= 5) return 1; // 2nd block
    return 0;                // 1st block
  }
  
  // Each 4-week cycle: 
  //   - weight-loss: weeks with remainder 1,2,3 => deficit; week%4===0 => maintenance
  //   - muscle-gain: remainder 1,2,3 => surplus; remainder 0 => maintenance
  //   - improve-body-composition => remainder 1 or 2 => deficit, remainder 3 => surplus, remainder 0 => maintenance
  export function getWeeklyPhase(userGoal, week) {
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
  export  function getCalsForWeek(week) {
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
  
  export function calculateWeeklyCaloriesAndMacros12Week() {
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
  
      console.log(`Week ${w}: ${dailyCals} kcals | Protein=${p}g, Carbs=${c}g, Fats=${f}g`);
    }
  
    console.log("✅ Finished calculating and storing 12-week calorie & macro figures!");
  }
  
  /*********************************************************
   * [B] HELPER FUNCTIONS FOR PORTION SCALING, ETC.
   *    (Copy from 12-week-program.js but remove DOM references)
   *********************************************************/
  export  function getMealFrequency() {
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
  export  function debugCheckMealFreq() {
    const raw = localStorage.getItem("mealFrequency");
    console.log("DEBUG: localStorage mealFrequency=", raw, " => parsed=", getMealFrequency());
  }
  
  export function calculateMacros(totalCals, macroRatio) {
    // standard: 4 kcal/g for protein, 4 kcal/g carbs, 9 kcal/g fats
    const p = Math.round((totalCals * (macroRatio.protein || 0)) / 4);
    const c = Math.round((totalCals * (macroRatio.carbs || 0)) / 4);
    const f = Math.round((totalCals * (macroRatio.fats || 0)) / 9);
    return { protein: p, carbs: c, fats: f };
  }
  
  export function scaleIngredient(ingredient, multiplier) {
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
  
  export  function portionScaleMeal(meal, newCalorieTarget) {
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
  
  /*********************************************************
   * pickMealForCategory, ratioData, etc.
   *********************************************************/
  export function pickMealForCategory(category, mealTarget, database) {
    const lowerBound = 0.9 * mealTarget;
    const upperBound = 1.1 * mealTarget;
  
    console.log(`\n[pickMealForCategory] Cat=${category} target=${mealTarget}, range=[${Math.round(lowerBound)}..${Math.round(upperBound)}]`);
  
    // filter
    const possibleMeals = database.filter(m => {
      if (!m.category || m.category.toLowerCase() !== category.toLowerCase()) return false;
      // If the meal's base cals are in [0.9..1.1] × mealTarget
      return (m.calories >= lowerBound && m.calories <= upperBound);
    });
  
    console.log(`  -> Found ${possibleMeals.length} possible meal(s) for "${category}"`, possibleMeals.map(m => m.mealName));
  
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
  
  export function getMealSplitsForPhase(phase, mealFreq) {
    // If ratioData[phase] is undefined, default to ratioData.deloadPhase
    const phaseObj = ratioData[phase] || ratioData.deloadPhase;
    return phaseObj[mealFreq] || ratioData.deloadPhase[4];
  }
  
  export  function getMealPhaseForWeek(weekNum, userGoal) {
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
  
  export function generateTwelveWeekMealPlan() {
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
    console.log("✅ 12-week meal plan generated & saved!");
  }