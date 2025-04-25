document.addEventListener("DOMContentLoaded", () => {
  // Dark mode toggle
  const themeBtn = document.getElementById("darkModeToggle");
  const logo = document.getElementById("logo");
  themeBtn.onclick = () => {
    themeBtn.classList.toggle("src/images/dark-mode-off-button.png");
    if (themeBtn.classList.contains("src/images/dark-mode-off-button.png")) {
      document.body.classList.add("changeTheme");
      themeBtn.src = "src/images/dark-mode-on-button.png";
      logo.src = "src/images/rtb-logo-black.png";
    } else {
      document.body.classList.remove("changeTheme");
      themeBtn.src = "src/images/dark-mode-off-button.png";
      logo.src = "src/images/rtb-logo-white.png";
    }
  };

  // Fade-in elements
  const fadeInElements = document.querySelectorAll(".fade-in");
  fadeInElements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add("visible");
    }, index * 500);
  });

  // Example reviews
  const reviews = [
{
      name: "David",
      text: "I used to wing it at the gym. I never knew if I was doing enough. Seeing my workouts and progress adapt over time changed everything. I’ve gained 6kg of muscle — and confidence too.",
      beforeImage: "src/images/harry_chest_before.jpg",
      afterImage: "src/images/harry_chest_after.jpg",
      testImage: "src/images/5-stars.png",
    },
    {
      name: "Maria",
      text: "Strict plans never worked for me. This didn’t just tell me what to do — it fit into my life. Logging workouts and meals became second nature. For the first time, I feel in control.",
      beforeImage: "src/images/halima_back_before.jpg",
      afterImage: "src/images/halima_back_after.jpg",
      testImage: "src/images/5-stars.png",
    },
    {
      name: "Lee",
      text: "I’d tried bootcamps, meal plans — nothing stuck. This finally made everything click. My workouts, meals, and progress were all in one place. I’ve lost 8kg, but more than that, I don’t feel lost anymore.",
      beforeImage: "src/images/lynn_before.JPEG",
      afterImage: "src/images/lynn_after.png",
      testImage: "src/images/5-stars.png",
    },
  ];

  const sliderContainer = document.querySelector(".testimonial-slider");
  const prevBtn = document.querySelector(".arrow-button.prev");
  const nextBtn = document.querySelector(".arrow-button.next");
  const dotsContainer = document.querySelector(".dots-container");
  
  let currentIndex = 0;
  let startX = 0;
  let endX = 0;

  // Create a testimonial slot
  function createTestimonialCards() {
    // Clear existing content
    sliderContainer.innerHTML = "";
  
    reviews.forEach((review, index) => {
      // Create a .testimonial-card
      const card = document.createElement("div");
      card.classList.add("testimonial-card");
  
      // HTML for each card (similar to your existing structure)
      card.innerHTML = `
        <div class="images">
          <div class="before">
            <img src="${review.beforeImage}" alt="Before">
            <p>Before</p>
          </div>
          <div class="after">
            <img src="${review.afterImage}" alt="After">
            <p>After</p>
          </div>
        </div>
        <p class="review-name">${review.name}</p>
        <div class="five-stars">
          <img src="${review.testImage}" alt="5 Stars">
        </div>
        <p class="review-text">${review.text}</p>
      `;
  
      sliderContainer.appendChild(card);
    });
  }
  
  // 2) Create & update the dots
  function createDots() {
    dotsContainer.innerHTML = "";
    reviews.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      if (index === currentIndex) dot.classList.add("active");
      // Clicking a dot => jump to that slide
      dot.addEventListener("click", () => {
        currentIndex = index;
        updateSlider();
      });
      dotsContainer.appendChild(dot);
    });
  }
  
  // 3) Move the slider to the currentIndex & update dots
  function updateSlider() {
    const slideWidth = sliderContainer.clientWidth; // each card is 100% of this container
    sliderContainer.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
  
    // Update dots
    const allDots = dotsContainer.querySelectorAll(".dot");
    allDots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentIndex);
    });
  }
  
  // 4) Arrow button handlers
  function goNext() {
    currentIndex = (currentIndex + 1) % reviews.length;
    updateSlider();
  }
  function goPrev() {
    currentIndex = (currentIndex - 1 + reviews.length) % reviews.length;
    updateSlider();
  }
  
  // 5) Mobile swipe detection
  function enableSwipe() {
    sliderContainer.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
  
    sliderContainer.addEventListener("touchend", (e) => {
      endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) {
        // Swipe left => next
        goNext();
      } else if (endX - startX > 50) {
        // Swipe right => prev
        goPrev();
      }
    });
  }
  
  // 6) Handle window resizing => recalc transforms
  window.addEventListener("resize", updateSlider);
  
  // 7) Init everything
  createTestimonialCards();
  createDots();
  enableSwipe();
  
  // Arrows (desktop)
  nextBtn.addEventListener("click", goNext);
  prevBtn.addEventListener("click", goPrev);
  
  // On load, set initial position
  updateSlider();
});

document.addEventListener("DOMContentLoaded", () => {
  const cookieBanner = document.getElementById("cookie-banner");
  const acceptButton = document.getElementById("accept-all");
  const denyButton = document.getElementById("deny-all");

  // Check if the user has already made a choice
  const userConsent = getCookie("userConsent");
  console.log("User Consent Cookie: ", userConsent);
  if (userConsent) {
    cookieBanner.style.display = "none";
  }
  

  // Handle Accept All button click
  acceptButton.addEventListener("click", () => {
    setCookie("userConsent", "allow", 180); // Store consent for 180 days
    cookieBanner.style.display = "none"; // Hide banner
    // Load non-essential cookies (e.g., Google Analytics, Facebook Pixel)
    loadNonEssentialCookies();
  });

  // Handle Deny All button click
  denyButton.addEventListener("click", () => {
    setCookie("userConsent", "deny", 180); // Store denial for 180 days
    cookieBanner.style.display = "none"; // Hide banner
    // Block non-essential cookies
  });

  // Function to set a cookie
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
  }

  // Function to get a cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  // Placeholder for loading non-essential cookies
  function loadNonEssentialCookies() {
    console.log("Loading non-essential cookies...");
    // Integrate Google Analytics, Facebook Pixel, etc., here
  }
});

// ——— Nav & Modal Logic ———
const loginModal   = document.getElementById("login-modal");
const faqModal     = document.getElementById("faq-modal");
const btnWorkouts  = document.getElementById("nav-workouts");
const btnNutrition = document.getElementById("nav-nutrition");
const btnHelp      = document.getElementById("nav-help");
const closeBtns    = document.querySelectorAll(".close-btn");
const mainNav   = document.querySelector(".main-nav");
const hamburger = document.getElementById("hamburger-btn");
const navClose  = document.getElementById("nav-close");

// open login modal on Workouts/Nutrition click
[ btnWorkouts, btnNutrition ].forEach(btn =>
  btn.addEventListener("click", e => {
    e.preventDefault();
    loginModal.style.display = "flex";
  })
);

// open FAQ modal on Help click
btnHelp.addEventListener("click", e => {
  e.preventDefault();
  faqModal.style.display = "flex";
});

// close any modal
closeBtns.forEach(x =>
  x.addEventListener("click", () => {
    document.getElementById(x.dataset.target).style.display = "none";
  })
);

// hamburger toggles mobile nav
hamburger.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});

navClose.addEventListener("click", () => {
  mainNav.classList.remove("open");
});

// close modals when clicking outside content
[ loginModal, faqModal ].forEach(modal => {
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });
});

// (optional) handle login form submission
document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const email = e.target.email.value;
  // TODO: trigger your magic link or Firebase auth here
  alert(`Magic link sent to ${email} 🙂`);
  loginModal.style.display = "none";
});