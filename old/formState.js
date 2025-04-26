// client/scripts/modules/formState.js
export let heightUnit           = "cm";
export let weightUnit           = "kg";
export let rotatingMsgInterval  = null;
export let rotatingMessageIndex = 0;
export let obeseGainWarnShown   = false;

export const formData = {
  name: "",
  weight: null,
  height: null,
  age: null,
  gender: "",
  workoutAvailability: [0],
  heightUnit,
  weightUnit,
  heightRaw: null,
  weightRaw: null,
  goalWeightInputTemp: "",
  trainingPreference: "Strength Training",
};

export function setHeightUnit(u)           { heightUnit           = formData.heightUnit  = u; }
export function setWeightUnit(u)           { weightUnit           = formData.weightUnit  = u; }
export function setRotatingMsgInterval(id) { rotatingMsgInterval  = id; }

// ────────────────────────────────
// DB imports – note *no* “./modules/”
// ────────────────────────────────
import { EXERCISE_DATABASE } from "../client/scripts/modules/exercise.js";
import { mealDatabase }       from "../client/scripts/modules/meals.js";

window.allExercises = EXERCISE_DATABASE;      // handy for console

// Body-weight fallback list
const BODYWEIGHT_EXERCISES = EXERCISE_DATABASE.filter(
  e => e.equipmentNeeded.length === 1 && e.equipmentNeeded[0] === "Bodyweight"
);

export const workoutAvailabilityMultipliers = {
  1: 0.6, 2: 0.75, 3: 0.9, 4: 1.0, 5: 1.1, 6: 1.05, 7: 1.0,
};

// Vectors you *might* use later – if not, feel free to delete
let cumulativeAnswers   = [];
let selectedOptions     = [];
let focusedMuscleGroups = [];
