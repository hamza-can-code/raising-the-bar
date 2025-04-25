// client/scripts/forms-entry.js
import { initForm } from "./modules/formNavigation.js";
import { initValidators } from "./modules/formValidators.js";

document.addEventListener("DOMContentLoaded", () => {
  loadQuestion(currentQuestionIndex);
  updateProgressBar();
  initForm();         // first question + progress bar
  initValidators();   // validation + next/back wiring
});
