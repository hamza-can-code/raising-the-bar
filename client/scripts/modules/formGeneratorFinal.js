// client/scripts/modules/formGeneratorFinal.js

import {
    formData,
    rotatingMessageIndex,
} from "./formState.js";

import {
    rotatingMsgInterval,
} from "./formState.js";

// export the setter so other modules can clear/reset it
export function setRotatingMsgInterval(id) {
    rotatingMsgInterval = id;
}

// export this so your final step can call it
export function replaceWithFinalPage() {
    generateAllPrograms();
    generateTwelveWeekMealPlan();

    // Animate the footer out...
    const fixedFooter = document.querySelector(".fixed-footer");
    fixedFooter.classList.remove("visible");
    fixedFooter.classList.add("footer-slide-out");
    fixedFooter.addEventListener("transitionend", function handleFooterTransition(e) {
        if (e.propertyName === "transform" || e.propertyName === "opacity") {
            fixedFooter.style.display = "none";
            fixedFooter.removeEventListener("transitionend", handleFooterTransition);
        }
    });
    progressBarFill.style.width = "0%";

    const formContainer = document.querySelector(".form-container");
    formContainer.innerHTML = "";

    // Final message
    const finalMsg = document.createElement("div");
    finalMsg.classList.add("final-message");
    finalMsg.innerHTML = `
      <h2>You're all set – your journey starts now.</h2>
      <p>Building your adaptive all-in-one tracker — this won’t take long.</p>
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
    setRotatingMsgInterval(
        setInterval(() => {
            const rotatingMessageElem = document.getElementById("rotating-message");
            if (rotatingMessageElem) {
                rotatingMessageElem.textContent = getRotatingMessage();
            }
        }, 2000)
    );

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
            window.location.href = "offer.html";
        }
    }
    requestAnimationFrame(fillBar);
}

function getRotatingMessage() {
    let goal = (localStorage.getItem("goal") || "").toLowerCase();
    let goalArray = [];

    if (goal.includes("gain")) {
        goalArray = loadingMessagesAll.muscleGain;
    } else if (goal.includes("lose")) {
        goalArray = loadingMessagesAll.weightLoss;
    } else if (goal.includes("improve")) {
        goalArray = loadingMessagesAll.bodyRecomposition;
    }
    if (goalArray.length === 0) {
        goalArray = loadingMessagesAll.weightLoss;
    }

    const messageGroups = [
        goalArray,
        loadingMessagesAll.featureBased,
        loadingMessagesAll.personality,
    ];

    const currentGroup = messageGroups[rotatingMessageIndex % messageGroups.length];
    rotatingMessageIndex++;
    return currentGroup[Math.floor(Math.random() * currentGroup.length)];
}

// now export this so formValidators.js can import it
export function calculateProjectedGoalDate() {
    let currWeightStr =
        localStorage.getItem("userCurrentWeight") ||
        localStorage.getItem("weight") ||
        "0";
    let goalWeightStr = localStorage.getItem("userGoalWeight") || "0";
    let currWeight = parseFloat(currWeightStr);
    let goalWeight = parseFloat(goalWeightStr);

    if (isNaN(currWeight) || isNaN(goalWeight) || currWeight === 0 || goalWeight === 0) {
        console.log("Goal weight or current weight not set.");
        return;
    }

    const maintenanceCals = parseInt(
        localStorage.getItem("maintenanceCalories") || "2200",
        10
    );
    const isWeightLoss = currWeight > goalWeight;
    const requiredChange = Math.abs(currWeight - goalWeight);

    let cumulativeChange = 0;
    let weeksRequired = 0;
    const week12Target = parseInt(
        localStorage.getItem("week12_dailyCalsWMCO") || "0",
        10
    );

    while (cumulativeChange < requiredChange) {
        weeksRequired++;
        let weekTarget =
            weeksRequired <= 12
                ? parseInt(
                    localStorage.getItem(`week${weeksRequired}_dailyCalsWMCO`) || "0",
                    10
                )
                : week12Target;

        let dailyDifference = isWeightLoss
            ? Math.max(maintenanceCals - weekTarget, 0)
            : Math.max(weekTarget - maintenanceCals, 0);

        let weeklyChangeKg = (dailyDifference * 7) / 7700;
        const effortLevel = (formData.effortLevel || "moderate").toLowerCase();
        let minWeeklyChange = isWeightLoss
            ? effortLevel === "high"
                ? 0.7
                : effortLevel === "slight"
                    ? 0.3
                    : 0.5
            : effortLevel === "high"
                ? 0.35
                : effortLevel === "slight"
                    ? 0.15
                    : 0.25;

        if (isWeightLoss) {
            weeklyChangeKg = Math.min(Math.max(weeklyChangeKg, minWeeklyChange), 0.5);
        } else {
            weeklyChangeKg = Math.min(Math.max(weeklyChangeKg, minWeeklyChange), 1);
        }

        if (weeklyChangeKg === 0) {
            console.log("No caloric difference detected; stopping projection.");
            break;
        }

        cumulativeChange += weeklyChangeKg;
    }

    weeksRequired = Math.ceil(weeksRequired * 1.2);
    let projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + weeksRequired * 7);

    const options = { day: "numeric", month: "short", year: "numeric" };
    const projectedDateStr = projectedDate.toLocaleDateString(undefined, options);
    const userGoalDateStr = localStorage.getItem("userGoalDate");

    let statusMsg;
    if (userGoalDateStr) {
        const targetDate = new Date(userGoalDateStr);
        statusMsg =
            projectedDate <= targetDate
                ? `Projected on ${projectedDateStr}, before your target of ${targetDate.toLocaleDateString(undefined, options)}.`
                : `Projected on ${projectedDateStr}, after your target of ${targetDate.toLocaleDateString(undefined, options)}.`;
    } else {
        statusMsg = `Projected on ${projectedDateStr}.`;
    }

    console.log("Projected Goal Date:", projectedDateStr);
    console.log(statusMsg);

    localStorage.setItem("projectedGoalDate", projectedDateStr);
    localStorage.setItem("projectedGoalStatus", statusMsg);
}
