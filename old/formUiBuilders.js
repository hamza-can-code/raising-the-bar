import { questions } from "./formData.js";
import { cmFromFtIn, kgFromLbs } from "./formUnits.js";
import { updateAnthroMetrics }    from "./formMetrics.js";
import {
  formData,
  heightUnit,
  weightUnit,
  setHeightUnit,
  setWeightUnit,
} from "./formState.js";

export function fadeInAll() {
  const els = document.querySelectorAll(".fade-in");
  els.forEach((el, i) => setTimeout(() => el.classList.add("visible"), i * 500));
}

export const questionText     = document.querySelector(".form-question h2");
export const optionsContainer = document.querySelector(".form-options ol");
export const nextButton       = document.getElementById("next-button");
export const progressBarFill  = document.querySelector(".progress-bar-fill");

export function toggleNextButtonState(currentQuestionIndex) {
  const currentQ = questions[currentQuestionIndex];
  let isInputValid = false;

  if (currentQ.key === "height") {
    if (heightUnit === "cm") {
      const v = optionsContainer.querySelector(".h-cm")?.value;
      isInputValid = !!v && v.trim() !== "";
    } else {
      const ft = optionsContainer.querySelector(".h-ft")?.value;
      isInputValid = !!ft && ft.trim() !== "";
    }
  }
  else if (currentQ.key === "weight") {
    if (weightUnit === "kg") {
      const v = optionsContainer.querySelector(".w-kg")?.value;
      isInputValid = !!v && v.trim() !== "";
    } else {
      const v = optionsContainer.querySelector(".w-lbs")?.value;
      isInputValid = !!v && v.trim() !== "";
    }
  }
  else if (currentQ.key === "userGoalWeight") {
    const v = optionsContainer.querySelector(".goal-weight-input")?.value;
    isInputValid = !!v && v.trim() !== "";
  }
  else if (["text", "number"].includes(currentQ.type)) {
    const input = optionsContainer.querySelector("input");
    isInputValid = !!input && input.value.trim() !== "";
  }
  else if (currentQ.type === "date") {
    const input = optionsContainer.querySelector("input[type='date']");
    isInputValid = !!input && input.value.trim() !== "";
  }
  else if (currentQ.type === "radio") {
    isInputValid = !!optionsContainer.querySelector("li.selected");
  }
  else if (currentQ.type === "checkbox") {
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

export function addInputListeners(currentQuestionIndex) {
    const currentQ = questions[currentQuestionIndex];
  
    if (["text","number","date"].includes(currentQ.type)) {
      const input = optionsContainer.querySelector("input");
     // wrap in an arrow so we pass the index, not the event
     input.addEventListener("input", () => {
        toggleNextButtonState(currentQuestionIndex);
      });
    } else {
      optionsContainer.querySelectorAll("li").forEach(li =>
       li.addEventListener("click", () => {
          toggleNextButtonState(currentQuestionIndex);
        })
      );
   }
  }

export function buildHeightInput(currentQuestionIndex) {
  optionsContainer.innerHTML = `
    <div class="unit-toggle pill-toggle">
      <input type="radio" name="hUnit" id="hUnit-cm"  value="cm" checked autocomplete="off">
      <label for="hUnit-cm">cm</label>

      <input type="radio" name="hUnit" id="hUnit-ftin" value="ft" autocomplete="off">
      <label for="hUnit-ftin">ft / in</label>
    </div>

    <input type="number" class="number-input h-cm" placeholder="Enter height in cm">
    <div class="ftin-row hidden">
      <input type="number" class="number-input h-ft" placeholder="ft">
      <input type="number" class="number-input h-in" placeholder="in">
    </div>
  `;

  const unitRadios = optionsContainer.querySelectorAll("input[name='hUnit']");
  const cmBox       = optionsContainer.querySelector(".h-cm");
  const ftInRow     = optionsContainer.querySelector(".ftin-row");
  const ftBox       = ftInRow.querySelector(".h-ft");
  const inBox       = ftInRow.querySelector(".h-in");

  unitRadios.forEach(radio =>
    radio.addEventListener("change", e => {
      setHeightUnit(e.target.value);
      formData.heightUnit = heightUnit;
      localStorage.setItem("heightUnit", heightUnit);

      if (heightUnit === "cm") {
        cmBox.classList.remove("hidden");
        ftInRow.classList.add("hidden");
      } else {
        cmBox.classList.add("hidden");
        ftInRow.classList.remove("hidden");
      }
      toggleNextButtonState(currentQuestionIndex);
    })
  );

  [cmBox, ftBox, inBox].forEach(el =>
    el.addEventListener("input", () => {
      if (heightUnit === "cm") {
        formData.height = parseFloat(cmBox.value) || null;
        formData.heightRaw = { unit: "cm", value: cmBox.value };
      } else {
        const ft    = parseFloat(ftBox.value) || 0;
        const inch  = parseFloat(inBox.value)  || 0;
        formData.height    = cmFromFtIn(ft, inch);
        formData.heightRaw = { unit: "ft/in", ft: ftBox.value, in: inBox.value };
      }
      localStorage.setItem("heightRaw", JSON.stringify(formData.heightRaw));
      updateAnthroMetrics();
      toggleNextButtonState(currentQuestionIndex);
    })
  );

  toggleNextButtonState(currentQuestionIndex);
}

export function buildWeightInput(currentQuestionIndex) {
  optionsContainer.innerHTML = `
    <div class="unit-toggle pill-toggle">
      <input type="radio" name="wUnit" id="wUnit-kg"  value="kg" checked autocomplete="off">
      <label for="wUnit-kg">kg</label>

      <input type="radio" name="wUnit" id="wUnit-lbs" value="lbs" autocomplete="off">
      <label for="wUnit-lbs">lbs</label>
    </div>

    <input type="number" class="number-input w-kg" placeholder="Enter weight in kg">
    <input type="number" class="number-input w-lbs hidden" placeholder="Enter weight in lbs">
  `;

  const unitRadios = optionsContainer.querySelectorAll("input[name='wUnit']");
  const kgBox      = optionsContainer.querySelector(".w-kg");
  const lbsBox     = optionsContainer.querySelector(".w-lbs");

  unitRadios.forEach(radio =>
    radio.addEventListener("change", e => {
      setWeightUnit(e.target.value);
      formData.weightUnit = weightUnit;
      localStorage.setItem("weightUnit", weightUnit);

      if (weightUnit === "kg") {
        kgBox.classList.remove("hidden");
        lbsBox.classList.add("hidden");
      } else {
        kgBox.classList.add("hidden");
        lbsBox.classList.remove("hidden");
      }
      toggleNextButtonState(currentQuestionIndex);
    })
  );

  [kgBox, lbsBox].forEach(el =>
    el.addEventListener("input", () => {
      if (weightUnit === "kg") {
        formData.weight = parseFloat(kgBox.value) || null;
        formData.weightRaw = { unit: "kg", value: kgBox.value };
      } else {
        const lbs          = parseFloat(lbsBox.value) || 0;
        formData.weight    = kgFromLbs(lbs);
        formData.weightRaw = { unit: "lbs", value: lbsBox.value };
      }
      localStorage.setItem("weightRaw", JSON.stringify(formData.weightRaw));
      updateAnthroMetrics();
      toggleNextButtonState(currentQuestionIndex);
    })
  );

  toggleNextButtonState(currentQuestionIndex);
}