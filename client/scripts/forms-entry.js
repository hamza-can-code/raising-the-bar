// client/scripts/forms-entry.js
import { initForm }       from "./modules/formNavigation.js";
import { initValidators } from "./modules/formValidators.js";
import { fadeInAll } from "./modules/formUiBuilders.js";

document.addEventListener("DOMContentLoaded", () => {
  initForm();         // first question + progress bar
  initValidators();   // validation + next/back wiring
  fadeInAll();  
});
