
import {
    formData,
    heightUnit,
    weightUnit,
    setHeightUnit,
    setWeightUnit,
    rotatingMsgInterval,
    rotatingMessageIndex,
  } from "./formState.js";
  
  import { calculateWeeklyCaloriesAndMacros12Week } from "./formGeneratorMeals.js";
  import { calculateProjectedGoalDate }             from "./formGeneratorFinal.js";
  
  import {
    addInputListeners,
    toggleNextButtonState,
    nextButton,
    optionsContainer 
  } from "./formUiBuilders.js";
  
  import { questions } from "./formData.js";
  
  import {
    currentQuestionIndex,
    loadQuestion,
    updateProgressBar
  } from "./formNavigation.js";
  
  import { replaceWithFinalPage } from "./formGeneratorFinal.js";
  import { advanceQuestion } from "./formNavigation.js";
  import { cmFromFtIn, kgFromLbs } from "./formUnits.js";
import { updateAnthroMetrics }   from "./formMetrics.js";

  
  export function calculateAge(dob, validate = true) {
    if (!dob) {
      console.error("DOB missing/invalid.");
      return { valid: false, age: null };
    }
    const birth = new Date(dob);
    if (isNaN(birth)) {
      console.error("Invalid DOB format.");
      return { valid: false, age: null };
    }
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    if (validate) {
      if (age < 18 || age > 110) {
        return { valid: false, age };
      }
      localStorage.setItem("age", age);
      return { valid: true, age };
    }
    return { valid: true, age };
  }  

export function displayWarning(message) {
    let warningElem = document.getElementById("warning-text");
    if (!warningElem) {
      warningElem = document.createElement("p");
      warningElem.id = "warning-text";
      warningElem.classList.add("visible");
      const optionsContainer = document.querySelector(".form-options");
      if (optionsContainer) {
        optionsContainer.appendChild(warningElem);
      } else {
        document.body.appendChild(warningElem);
      }
    }
    warningElem.textContent = message;
    warningElem.classList.remove("hidden");
    warningElem.style.display = "block";
  }

export function handleDynamicDateChange(question, dateValue) {
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

export function validateAndAdvance() {
    nextButton.addEventListener("click", () => {
      const currentQ    = questions[currentQuestionIndex];
      const bmiCategory = localStorage.getItem("bmiCategory");
      const chosenGoal  = formData.goal;
  
      if (
        currentQ.key === "goal" &&
        bmiCategory === "Underweight" &&
        chosenGoal === "lose weight"
      ) {
        displayWarning(
          "You’re currently classified as underweight. Losing more weight could be unsafe—how about we focus on building strength or maintaining a healthy routine instead?"
        );
        return;
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
        const warningText       = document.getElementById("warning-text");
        if (!agreementCheckbox.checked) {
          warningText.classList.remove("hidden");
          warningText.classList.add("visible");
          return;
        }
        warningText.classList.add("hidden");
        warningText.classList.remove("visible");
      }
  
      if (
        currentQ.key === "workoutLocation" &&
        (formData.workoutLocation || "").toLowerCase() === "gym" &&
        equipmentQuestionIndex !== -1
      ) {
        questions.splice(equipmentQuestionIndex, 1);
        formData.equipment = [
          "dumbbells","barbells","bench","rack",
          "kettlebells","cables","machines","smith machine",
          "pull-up bar","dip station"
        ];
      }
  
      if (currentQ.key === "dob") {
        const dobInput = document.querySelector(".date-input")?.value;
        if (!dobInput) {
          displayWarning("Please enter your date of birth.");
          return;
        }
        const { valid, age } = calculateAge(dobInput);
        if (!valid) {
          displayWarning(age < 18 ? "You must be 18+ to proceed." : "Please enter a valid age before proceeding.");
          return;
        }
        localStorage.setItem("dob", dobInput);
      }
  
      if (currentQuestionIndex === 0) {
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
          const ft    = parseFloat(optionsContainer.querySelector(".h-ft")?.value) || 0;
          const inch  = parseFloat(optionsContainer.querySelector(".h-in")?.value) || 0;
          cmVal = cmFromFtIn(ft, inch);
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
          const lbs = parseFloat(optionsContainer.querySelector(".w-lbs")?.value) || 0;
          kgVal = kgFromLbs(lbs);
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
        const selLi = optionsContainer.querySelector("li.selected");
        const val   = selLi ? selLi.textContent.trim() : "None";
        localStorage.setItem("dietaryRestrictions", val);
      }
  
      if (currentQ.key === "userGoalWeight") {
        const inp    = optionsContainer.querySelector(".goal-weight-input");
        const rawVal = parseFloat(inp.value);
        if (isNaN(rawVal) || rawVal <= 0) {
          displayWarning("Please enter a valid number for your goal weight.");
          return;
        }
        const savedRaw   = JSON.parse(localStorage.getItem("weightRaw") || "null");
        const currDisplay = savedRaw
          ? `${Math.round(parseFloat(savedRaw.value))} ${savedRaw.unit}`
          : `${Math.round(formData.weight)} kg`;
        if (savedRaw && parseFloat(savedRaw.value) === rawVal) {
          displayWarning(`Your goal weight can’t be the same as your current weight (${currDisplay}).`);
          return;
        }
        const goalKg = weightUnit === "lbs" ? kgFromLbs(rawVal) : rawVal;
        const currKg = formData.weight || 0;
        if (formData.goal === "lose weight" && goalKg >= currKg) {
          displayWarning(`Goal must be below current weight (${currDisplay}).`);
          return;
        }
        if (formData.goal === "gain muscle" && goalKg <= currKg) {
          displayWarning(`Goal must be above current weight (${currDisplay}).`);
          return;
        }
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
        const selectedDate  = new Date(dateVal);
        const oneWeekLater  = new Date();
        oneWeekLater.setDate(oneWeekLater.getDate() + 7);
        if (selectedDate < oneWeekLater) {
          displayWarning("Please select a date at least one week from today.");
          return;
        }
        formData.userGoalDate = dateVal;
        localStorage.setItem("userGoalDate", dateVal);
      }
  
      if (currentQ.key === "foodAllergies") {
        let allergies = Array.from(optionsContainer.querySelectorAll("li.selected"))
          .map(li => li.textContent.trim());
        if (allergies.some(a => a.toLowerCase() === "none")) {
          allergies = ["None"];
        }
        localStorage.setItem("foodAllergies", JSON.stringify(allergies));
      }
  
      if (currentQ.key === "mealFrequency") {
        const sel = optionsContainer.querySelector("li.selected");
        if (sel) {
          localStorage.setItem("mealFrequency", sel.textContent.trim());
        }
      }
  
      if (currentQ.key === "ultimateGoal") {
        const goalInput = optionsContainer.querySelector("input");
        if (!goalInput?.value.trim()) {
          displayWarning("Please enter your ultimate goal before proceeding.");
          return;
        }
        localStorage.setItem("ultimateGoal", goalInput.value.trim());
      }
  
      advanceQuestion();
    });
  }
  

const backButton = document.getElementById("back-button");
backButton.addEventListener("click", () => {
    // If we’re not already on the first question, go back one.
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion(currentQuestionIndex);
        updateProgressBar();
    }
});

export function initValidators() {
    // attach your Next-click listener
    validateAndAdvance();
  
    // if you have any other per-page-onload validators, do them here
    // e.g. pre-populate warning elements, etc.
  }