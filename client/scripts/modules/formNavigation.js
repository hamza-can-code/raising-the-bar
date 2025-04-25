import {
    formData,
    heightUnit,  
    weightUnit,
} from "./formState.js";

import { addInputListeners, toggleNextButtonState } from "./formUiBuilders.js";

// import { formData } from "./formState.js";
import { questions } from "./formData.js";
import {
    calculateBMI,
    calculateMaintenanceCalories,
    calculateBaseProjections
} from "./formMetrics.js";
import {
    buildHeightInput,
    buildWeightInput,
    // addInputListeners,
    // toggleNextButtonState
} from "./formUiBuilders.js";
import { cmFromFtIn, kgFromLbs } from "./formUnits.js";

import { validateAndAdvance } from "./formValidators.js";
nextButton.addEventListener("click", validateAndAdvance);


let currentQuestionIndex = 0;

const questionText = document.querySelector(".form-question h2");
const optionsContainer = document.querySelector(".form-options ol");
const nextButton = document.getElementById("next-button");
const progressBarFill = document.querySelector(".progress-bar-fill");

function handleInputUpdate(currentQuestion) {
    return (e) => {
        formData[currentQuestion.key] =
            currentQuestion.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
        console.log(`Updated ${currentQuestion.key}:`, formData[currentQuestion.key]);

        // Only call BMI calc if weight and height are set (and non-zero)
        if (["weight", "height"].includes(currentQuestion.key)) {
            if (formData.weight && formData.height) {
                calculateBMI();
            } else {
                console.warn("Weight or height missing for BMI calc.");
            }
        }

        // Only call maintenance calories and base projections if all inputs are present.
        if (["weight", "height", "age", "gender", "activityLevel"].includes(currentQuestion.key)) {
            if (formData.weight && formData.height && formData.age && formData.gender && formData.activityLevel) {
                // At this point we know all the necessary fields are available.
                calculateMaintenanceCalories();
                calculateBaseProjections();
            } else {
                console.log("Waiting for all fields (weight, height, age, gender, activityLevel) before calculating maintenance.");
            }
        }
    };
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
            console.log(`Gender saved: ${selectedGender}`);
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

            console.log(`User Goal saved: ${selectedGoal}`);

            // calculateGoalCalories();
            // calculateBaseProjections();
        }
        else if (questionKey === "activityLevel") {
            const selectedActivityLevel = clickedText.toLowerCase();
            formData.activityLevel = selectedActivityLevel;
            localStorage.setItem("activityLevel", selectedActivityLevel);
            console.log(`Activity Level saved: ${selectedActivityLevel}`);

            // calculateMaintenanceCalories();
        }
        else if (questionKey === "fitnessLevel") {
            const selectedFitnessLevel = clickedText.toLowerCase();
            formData.fitnessLevel = selectedFitnessLevel;
            localStorage.setItem("fitnessLevel", selectedFitnessLevel);
            console.log(`Fitness Level saved: ${selectedFitnessLevel}`);

            // calculateBaseProjections();
        }
        else if (questionKey === "workoutDays") {
            const selectedWorkoutDays = parseInt(clickedText, 10);
            formData.workoutDays = selectedWorkoutDays;
            localStorage.setItem("workoutDays", selectedWorkoutDays);
            console.log(`Workout Days saved: ${selectedWorkoutDays}`);

            // calculateBaseProjections();
        }
        else if (questionKey === "sessionDuration") {
            const selectedsessionDuration = clickedText.toLowerCase();
            formData.sessionDuration = selectedsessionDuration;
            localStorage.setItem("sessionDuration", selectedsessionDuration);
            console.log(`Workout Duration saved: ${selectedsessionDuration}`);
        }
        else if (questionKey === "workoutLocation") {
            const selectedWorkoutLocation = clickedText.toLowerCase();
            formData.workoutLocation = selectedWorkoutLocation;
            localStorage.setItem("workoutLocation", selectedWorkoutLocation);
            console.log(`Workout Location saved: ${selectedWorkoutLocation}`);
        }
        else if (questionKey === "effortLevel") {
            const normalized = clickedText.toLowerCase().split(" ")[0];
            formData.effortLevel = normalized;
            localStorage.setItem("effortLevel", normalized);
            console.log(`Effort Level saved: ${normalized}`);
        }
        else if (questionKey === "goalDriver") {
            formData.goalDriver = clickedText;
            localStorage.setItem("goalDriver", clickedText);
            console.log(`Goal Driver saved: ${clickedText}`);
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
        console.log("Current selected checkboxes =>", formData[questionKey]);
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
                    console.warn(`Invalid age: ${age}`);
                    return;
                }
                formData.age = age;
                console.log(`DOB: ${dob}, Age: ${age}`);
                // calculateMaintenanceCalories();
            });
        } else {
            // This is for the goal date => no age check
            input.addEventListener("input", (e) => {
                // Just store the selected date
                formData[currentQ.key] = e.target.value;
                console.log(`${currentQ.key} =`, e.target.value);
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

loadQuestion(currentQuestionIndex);
updateProgressBar();

// Make the fixed footer pop in once the DOM is ready
window.addEventListener("DOMContentLoaded", () => {
    const fixedFooter = document.querySelector(".fixed-footer");
    if (fixedFooter) {
        // Delay slightly if you want it to appear after other elements:
        setTimeout(() => {
            fixedFooter.classList.add("visible");
        }, 1500);
    }
});