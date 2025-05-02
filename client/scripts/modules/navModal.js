// client/scripts/modules/navModal.js

export function initNavModal() {
    const loginModal   = document.getElementById("login-modal");
    const faqModal     = document.getElementById("faq-modal");
    const btnWorkouts  = document.getElementById("nav-workouts");
    const btnNutrition = document.getElementById("nav-nutrition");
    const btnHelp      = document.getElementById("nav-help");
    const closeBtns    = document.querySelectorAll(".close-btn");
    const mainNav      = document.querySelector(".main-nav");
    const hamburger    = document.getElementById("hamburger-btn");
    const navClose     = document.getElementById("nav-close");
  
    // open login
    [btnWorkouts, btnNutrition].forEach(b =>
      b.addEventListener("click", e => {
        e.preventDefault();
        loginModal.style.display = "flex";
      })
    );
    // open FAQ
    btnHelp.addEventListener("click", e => {
      e.preventDefault();
      faqModal.style.display = "flex";
    });
    // close buttons
    closeBtns.forEach(btn =>
      btn.addEventListener("click", () => {
        document.getElementById(btn.dataset.target).style.display = "none";
      })
    );
    // hamburger / close nav
    hamburger.addEventListener("click", ()=> mainNav.classList.toggle("open"));
    navClose .addEventListener("click", ()=> mainNav.classList.remove("open"));
  
    // click outside modal
    [loginModal, faqModal].forEach(m =>
      m.addEventListener("click", e => {
        if (e.target === m) m.style.display = "none";
      })
    );
  
    // magic-link form
    // document.getElementById("login-form")
    //   .addEventListener("submit", e => {
    //     e.preventDefault();
    //     alert(`Magic link sent to ${e.target.email.value}`);
    //     loginModal.style.display = "none";
    //   });
  }
  