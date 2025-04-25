import {
    formData,
    heightUnit, weightUnit,
    setHeightUnit, setWeightUnit,
    rotatingMsgInterval, rotatingMessageIndex,
} from "./formState.js";

import { calculateWeeklyCaloriesAndMacros12Week } from "./formGeneratorMeals.js";
import { calculateProjectedGoalDate } from "./formGeneratorFinal.js";

import { addInputListeners, toggleNextButtonState } from "./formUiBuilders.js";
// import { weightUnit } from "./formState.js";



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

// Add event listeners to monitor changes and update the button state
// function addInputListeners() {
//     const currentQ = questions[currentQuestionIndex];

//     if (currentQ.type === "text" || currentQ.type === "number" || currentQ.type === "date") {
//         const input = optionsContainer.querySelector("input");
//         input.addEventListener("input", toggleNextButtonState);
//     } else if (currentQ.type === "radio" || currentQ.type === "checkbox") {
//         optionsContainer.querySelectorAll("li").forEach((option) => {
//             option.addEventListener("click", toggleNextButtonState);
//         });
//     }
// }

export function displayWarning(message) {
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

export function validateAndAdvance() {
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
            if ((formData.workoutLocation || "").toLowerCase() === "gym") {
                // [ADDED logic => auto fill & remove Q13 only NOW if still present]
                if (equipmentQuestionIndex !== -1) {
                    // remove it from the array
                    questions.splice(equipmentQuestionIndex, 1);
                }
                formData.equipment = [
                    "dumbbells", "barbells", "bench", "rack", "kettlebells", "cables",
                    "machines", "smith machine", "pull-up bar", "dip station"
                ];
                console.log("Auto-filled eq for gym => removed Q13 from array.");
            }
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
        if (currentQuestionIndex === 0) {
            if (!input || !input.value.trim()) {
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
            console.log("dietaryRestrictions saved at Next =>", val);
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
            console.log("foodAllergies saved at Next =>", allergies);
        }
        if (currentQ.key === "mealFrequency") {
            const selectedOption = optionsContainer.querySelector("li.selected");
            if (selectedOption) {
                const mealFrequency = selectedOption.textContent.trim();
                localStorage.setItem("mealFrequency", mealFrequency);
                console.log("Meal Frequency saved =>", mealFrequency);
            }
        }
        if (currentQ.key === "ultimateGoal") {
            const goalInput = optionsContainer.querySelector("input");
            if (goalInput && goalInput.value.trim()) {
                const ultimateGoal = goalInput.value.trim();
                localStorage.setItem("ultimateGoal", ultimateGoal);
                console.log("Ultimate Goal saved =>", ultimateGoal);
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