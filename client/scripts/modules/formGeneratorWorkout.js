import {
  formData,
  heightUnit,  weightUnit,
  setHeightUnit, setWeightUnit,
  rotatingMsgInterval, rotatingMessageIndex,
} from "./formState.js";

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
  console.log("Generating 1-,4-,12-week programs...");

  let wd = parseInt(formData.workoutDays || 3, 10);
  if (isGroupB() && wd > 5) {
    console.warn("GroupB => clamping days to 5");
    formData.workoutDays = 5;
  }

  const filtered = filterExercisesForUser(EXERCISE_DATABASE);
  if (!filtered.length) {
    console.warn("No valid eq => fallback to bodyweight.");
    filtered.push(...BODYWEIGHT_EXERCISES);
  }

  const oneW = buildWeekProgram(filtered, 1);
  const fourW = buildMultiWeekProgram(filtered, 4);
  const twelveW = buildMultiWeekProgram(filtered, 12);

  console.log("12-week program:", twelveW);   // <--- ADDED for visibility

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
  console.log("Fallback pull day exercise list:", arr);

  // Arch movement
  let arch = arr.filter(e =>
    e.muscleGroup === "back" &&
    (
      e.name.toLowerCase().includes("pullover") ||
      e.name.toLowerCase().includes("extension") ||
      (e.movementPlane && e.movementPlane.toLowerCase() === "arch")
    )
  );
  console.log("Arch candidates:", arch);

  let slot1 = pickRandom(arch);
  console.log("Selected arch movement (slot1):", slot1);

  if (!slot1) {
    const backH = arr.filter(e => e.muscleGroup === "back" && e.movementPlane === "horizontal");
    slot1 = pickRandom(backH);
    console.log("Fallback to horizontal movement (slot1):", slot1);
  }

  if (slot1) {
    arr.splice(arr.indexOf(slot1), 1);
  }

  // Horizontal movement
  const backH2 = arr.filter(e => e.muscleGroup === "back" && e.movementPlane === "horizontal");
  const slot2 = pickRandom(backH2);
  console.log("Selected horizontal movement (slot2):", slot2);
  if (slot2) arr.splice(arr.indexOf(slot2), 1);

  // Biceps
  const biceps = arr.filter(e => e.muscleGroup === "biceps");
  const slot3 = pickRandom(biceps);
  console.log("Selected biceps movement:", slot3);
  if (slot3) arr.splice(arr.indexOf(slot3), 1);

  // Traps
  const traps = arr.filter(e => e.muscleGroup === "traps");
  const slot4 = pickRandom(traps);
  console.log("Selected traps movement:", slot4);
  if (slot4) arr.splice(arr.indexOf(slot4), 1);

  // Forearms
  const forearms = arr.filter(e => e.muscleGroup === "forearms");
  const slot5 = pickRandom(forearms);
  console.log("Selected forearms movement:", slot5);

  const result = [slot1, slot2, slot3, slot4, slot5].filter(Boolean);
  console.log("Final fallback pull day selection:", result);
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
  if (eq.includes("none of the above")) {
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
    console.warn("No valid equipment found => fallback to bodyweight only.");
    arr = BODYWEIGHT_EXERCISES.slice();
  }

  console.log("Filtered exercise list for user:", arr);
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

function sequenceAndFinalize(exArray, splitCode, wNum) {
  // 1) Use exArray instead of 'filtered'
  const blocks = getTimeBlocksForGoal(
    formData.sessionDuration || "30-45 Minutes",
    formData.goal || "improve"
  );
  let allocated = Math.min(blocks.rt, 60);

  // 2) How many total exercises we can fit (1 per 8 minutes, max 6)
  const totalSlots = Math.min(Math.floor(allocated / 8), 6);

  // 3) Actually do your original sequence logic on exArray
  let seq = sequenceExercises(splitCode, exArray, allocated);

  // 4) finalize them, slice to totalSlots, remove duplicates
  let out = seq.map((ex, i) => finalizeExercise(ex, i, wNum));
  out = out.slice(0, totalSlots);
  out = removeDuplicatesByName(out);

  return out;
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
  if (eq.includes("none of the above")) {
    let daily = Array(days).fill("fullbody-bw");
    return {
      week: wNum,
      phase: getPhaseForWeek(wNum).name,
      days: daily.map((spl, i) => buildDayWorkout(exList, spl, wNum, i + 1))
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
  let totalSlots = Math.min(Math.floor(blocks.rt / 8), 6);
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
