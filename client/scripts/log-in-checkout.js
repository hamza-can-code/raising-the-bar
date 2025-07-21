// client/scripts/log-in-checkout.js

import { savePreferencesAfterLogin } from "../scripts/savePreferencesAfterLogin.js";
import { showGlobalLoader, hideGlobalLoader } from "../scripts/loadingOverlay.js";

async function fetchAndStorePreferences() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;

    const res = await fetch("/api/getUserPreferences", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data.preferences) return false;

    Object.keys(data.preferences).forEach(k => {
      const v = data.preferences[k];
      localStorage.setItem(k, typeof v === "object" ? JSON.stringify(v) : v);
    });
    // console.log("✅ Preferences restored from server");
    return true;
  } catch (err) {
    // console.error("❌ Failed to fetch preferences:", err);
    return false;
  }
}

let gPlanName = "";
let gPlanPrice = "";
let gSummaryEl = null;

function renderPlanSummary(isDiscountActive) {
  if (!gSummaryEl || !gPlanName) return;

  /* full-price lookup (add other plans if needed) */
  const FULL = {
    "Pro Tracker": "£49.99",
    "1-Week Program": "£14.99",
    "4-Week Program": "£39.99",
    "12-Week Program": "£79.99"
  };

  if (gPlanName === "Pro Tracker" && isDiscountActive) {
    gSummaryEl.innerHTML =
      `${gPlanName} – <span class="old-price">£49.99</span>` +
      ` <span class="new-price">£0.99</span>`;
  } else {
    const price = FULL[gPlanName] || gPlanPrice || "£—";
    gSummaryEl.textContent = `${gPlanName} – ${price}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const pending = localStorage.getItem("pendingPurchaseType");
  const planName = localStorage.getItem("planName") || "Unknown plan";
  const planPrice = localStorage.getItem("planPrice") || "";
  const discountEnd = Number(localStorage.getItem("discountEndTime") || 0);
  const discounted = discountEnd > Date.now();
  gPlanName = localStorage.getItem("planName") || "Unknown plan";
  gPlanPrice = localStorage.getItem("planPrice") || "";
  gSummaryEl = document.getElementById("planSummary");
  renderPlanSummary(discounted);

  const planMap = {
    "1-Week Program": "1-week",
    "4-Week Program": "4-week",
    "12-Week Program": "12-week",
    "Pro Tracker": "subscription"
  };
  const plan = planMap[planName];

  const planSummary = document.getElementById("planSummary");

  /* initial paint */
  renderPlanSummary(discounted);
  const payBtn = document.getElementById("paySubmitBtn");

  if (!pending || !plan) {
    planSummary.textContent = "⚠️  No plan selected.";
    payBtn.disabled = true;
    return;
  }
  planSummary.textContent = `${planName} – ${planPrice}`;

  const form = document.getElementById("loginCheckoutForm");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    clearErrors();

    const { email, password } = form;
    let valid = true;
    if (!email.checkValidity()) {
      showError("email-error", "Please enter a valid email.");
      valid = false;
    }
    if (!password.value) {
      showError("password-error", "Password is required.");
      valid = false;
    }
    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    showGlobalLoader("Logging you in...");

    try {
      /* 1 -- login */
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: password.value })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Login failed");

      /* 2 -- store JWT */
      localStorage.setItem("token", body.token);

      /* 3 -- prefs */
      const restored = await fetchAndStorePreferences();
      if (!restored) await savePreferencesAfterLogin();

      /* 4 -- create Checkout session */
      const sessionRes = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, plan, discounted })
      });
      const sessBody = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessBody.error || "Unable to start checkout");

      /* 5 -- wipe “free / pending” crumbs so they never overwrite Pro */
      localStorage.removeItem("pendingPurchaseType");
      localStorage.removeItem("planPrice");

      /* 6 -- off to Stripe */
      window.location.href = sessBody.url;

    } catch (err) {
      submitBtn.disabled = false;
      hideGlobalLoader();
      // console.error(err);
      showError("password-error", err.message || "Something went wrong");
    }
  });

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }
  function clearErrors() {
    document.querySelectorAll(".error-message")
      .forEach(el => (el.textContent = ""));
  }
  renderPlanSummary(discounted);
  // console.log("[login-checkout] ready — plan:", plan, "discounted?", discounted);
});

const timerContainer = document.getElementById("timerContainer");
const countdownTimerEl = document.getElementById("countdownTimer");

document.addEventListener("DOMContentLoaded", function () {
  const now = Date.now();
  const signupTs = Number(localStorage.getItem("signupTimestamp") || 0);
  let comebackEnd = Number(localStorage.getItem("sevenDayDiscountEnd") || 0);

  // If 7 days have passed since sign-up and no comeback window is running, start a 24h window
  if (signupTs && !comebackEnd && now >= signupTs + 7 * 24 * 60 * 60 * 1000) {
    comebackEnd = now + 24 * 60 * 60 * 1000;
    localStorage.setItem("sevenDayDiscountEnd", comebackEnd);
  }

  let discountEndTime;
  if (comebackEnd && comebackEnd > now) {
    // Use the 7-day comeback window
    discountEndTime = comebackEnd;
    localStorage.setItem("discountEndTime", comebackEnd);
  } else {
    // Fallback to your existing “offerResumeEnd” / 10-minute logic
    const storedResume = localStorage.getItem("offerResumeEnd");
    if (storedResume) {
      discountEndTime = Number(storedResume);
      localStorage.removeItem("offerResumeEnd");
    } else {
      const stored = localStorage.getItem("discountEndTime");
      if (!stored) {
        discountEndTime = now + 10 * 60 * 1000;
        localStorage.setItem("discountEndTime", discountEndTime);
      } else {
        discountEndTime = Number(stored);
      }
    }
  }

  // Activate or deactivate the discount style immediately
  if (discountEndTime > now) {
    document.body.classList.add("discount-active");
  } else {
    document.body.classList.remove("discount-active");
  }

  const timerContainer = document.getElementById("timerContainer");
  const countdownTimerEl = document.getElementById("countdownTimer");

  function updateTimer() {
    const now = Date.now();
    const diff = discountEndTime - now;

    // If the discount has expired…
    if (diff <= 0) {
      document.body.classList.remove("discount-active");
      localStorage.removeItem("sevenDayDiscountEnd");
      if (timerContainer) timerContainer.style.display = "none";
      removeDiscountPricing();
      const cardSubtext = document.querySelector(".card-subtext");
      if (cardSubtext) cardSubtext.remove();
      renderPlanSummary(false);
      return;
    }

    // Keep the discount styling active
    document.body.classList.add("discount-active");

    // Break diff into h/m/s
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Zero-pad helper
    const pad = n => n.toString().padStart(2, "0");

    // Build the display string
    let display;
    if (hours > 0) {
      display = `${hours}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      display = `${pad(minutes)}:${pad(seconds)}`;
    }

    // Update the DOM
    if (countdownTimerEl) {
      countdownTimerEl.textContent = display;
    }
    renderPlanSummary(true); 
  }

  setInterval(updateTimer, 1000);
  updateTimer();
});

function removeDiscountPricing() {
  // For 1-Week Program: revert to full price (e.g., £14.99 with cost per day £2.14)
  const price1WeekFull = document.getElementById("price1WeekFull");
  const price1WeekDiscount = document.getElementById("price1WeekDiscount");
  const costPerDay1Week = document.getElementById("costPerDay1Week");
  const currencyTag1Week = document.querySelector('[data-program="1-week"] .currency-tag');
  const perDay1Week = document.querySelector('[data-program="1-week"] .per-day');
  if (price1WeekFull && price1WeekDiscount && costPerDay1Week) {
    // Remove strikethrough to show full price
    price1WeekFull.style.textDecoration = "none";
    // Hide discount price element for 1-week
    price1WeekDiscount.style.display = "none";
    // Set cost per day for 1-week full price (example value, adjust if needed)
    costPerDay1Week.textContent = "£2.14";
    if (currencyTag1Week) currencyTag1Week.style.display = "block";
    if (perDay1Week) {
      perDay1Week.style.display = "block";
      perDay1Week.textContent = "per day";
    }
  }

  // For Pro Tracker Subscription (special card):
  const priceSpecialFull = document.getElementById("priceSpecialFull");
  const priceSpecialDiscount = document.getElementById("priceSpecialDiscount");
  const costPerDaySpecial = document.getElementById("costPerDaySpecial");
  const currencyTagSpecial = document.querySelector('[data-program="new"] .currency-tag');
  const perDaySpecial = document.querySelector('[data-program="new"] .per-day');
  if (priceSpecialFull && priceSpecialDiscount && costPerDaySpecial) {
    // Remove the strikethrough (so full price is visible)
    priceSpecialFull.style.textDecoration = "none";
    // Hide the discounted price element
    priceSpecialDiscount.style.display = "none";
    // Set the cost to the full price value (£29.99) for the subscription
    costPerDaySpecial.textContent = "£1.67";
    // Calculate cost per day based on full price: 29.99/30
    if (currencyTagSpecial) currencyTagSpecial.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const timerContainer = document.getElementById("timerContainer");
  if (!timerContainer) return;

  // We'll store the timer's original distance from the top of the page
  const originalOffset = timerContainer.offsetTop;

  // Create a placeholder div to preserve layout space when the timer goes fixed
  const placeholder = document.createElement("div");
  placeholder.style.height = timerContainer.offsetHeight + "px";

  function onScroll() {
    /*
      If the user has scrolled beyond the timer's original offset,
      we fix it to the top and insert our placeholder (so the rest
      of the content doesn't jump). Otherwise, we remove the fix.
    */
    if (window.pageYOffset > originalOffset) {
      if (!timerContainer.classList.contains("timer-fixed")) {
        // Insert placeholder right before the timer container
        timerContainer.parentNode.insertBefore(placeholder, timerContainer);

        // Make it "fixed" and then slide it down
        timerContainer.classList.add("timer-fixed");
        // Slight delay to ensure the transform transition triggers
        setTimeout(() => {
          timerContainer.classList.add("visible");
        }, 10);
      }
    } else {
      // If we've scrolled back up above original position, un-fix it
      if (timerContainer.classList.contains("timer-fixed")) {
        timerContainer.classList.remove("visible");
        timerContainer.classList.remove("timer-fixed");
        if (placeholder.parentNode) {
          placeholder.parentNode.removeChild(placeholder);
        }
      }
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  // Run once in case the user is already scrolled down on page load
  onScroll();
});

document.addEventListener("DOMContentLoaded", () => {

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
      name: "Lee",
      text:
        "I’d tried bootcamps, meal plans — nothing stuck. This finally made everything click. I’ve lost 10kg, but more than that, I finally feel like myself again.",
      beforeImage: {
        src: "../assets/lynn_before.webp",
        width: 120,
        height: 120,
        alt: "Before"
      },
      afterImage: {
        src: "../assets/lynn_after.webp",
        width: 120,
        height: 120,
        alt: "After"
      },
      testImage: {
        src: "../assets/5-stars.webp",
        width: 100,
        height: 20,
        alt: "5 Stars"
      }
    },
    {
      name: "David",
      text:
        "I used to wing it at the gym and second-guess everything. Seeing my workouts and progress adapt over time changed everything. I’ve gained 6kg of muscle — and confidence too.",
      beforeImage: {
        src: "../assets/harry_chest_before.webp",
        width: 120,
        height: 120,
        alt: "Before"
      },
      afterImage: {
        src: "../assets/harry_chest_after.webp",
        width: 120,
        height: 120,
        alt: "After"
      },
      testImage: {
        src: "../assets/5-stars.webp",
        width: 100,
        height: 20,
        alt: "5 Stars"
      }
    },
    {
      name: "Alice",
      text:
        "Strict plans never worked for me. This didn’t just tell me what to do — it fit into my life. I’ve lost weight, feel healthier, and for the first time, I’m in control of the process.",
      beforeImage: {
        src: "../assets/halima_back_before.webp",
        width: 120,
        height: 120,
        alt: "Before"
      },
      afterImage: {
        src: "../assets/halima_back_after.webp",
        width: 120,
        height: 120,
        alt: "After"
      },
      testImage: {
        src: "../assets/5-stars.webp",
        width: 100,
        height: 20,
        alt: "5 Stars"
      }
    },
  ];

  const testimonialWrapper = document.querySelector(".testimonial-container");
  const sliderContainer = document.querySelector(".testimonial-slider");
  const prevBtn = document.querySelector(".arrow-button.prev");
  const nextBtn = document.querySelector(".arrow-button.next");
  const dotsContainer = document.querySelector(".dots-container");

  // 2) state
  let currentIndex = 0;
  let startX = 0;
  let endX = 0;

  // 3) build the slides
  function createTestimonialCards() {
    sliderContainer.innerHTML = "";
    reviews.forEach((review) => {
      const card = document.createElement("div");
      card.classList.add("testimonial-card");
      card.innerHTML = `
      <div class="images">
        <div class="before">
          <img
            src="${review.beforeImage.src}"
            width="${review.beforeImage.width}"
            height="${review.beforeImage.height}"
            alt="${review.beforeImage.alt}"
            loading="lazy"
            decoding="async"
          >
          <p>Before</p>
        </div>
        <div class="after">
          <img
            src="${review.afterImage.src}"
            width="${review.afterImage.width}"
            height="${review.afterImage.height}"
            alt="${review.afterImage.alt}"
            loading="lazy"
            decoding="async"
          >
          <p>After</p>
        </div>
      </div>
      <p class="review-name">${review.name}</p>
      <div class="five-stars">
        <img
          src="${review.testImage.src}"
          width="${review.testImage.width}"
          height="${review.testImage.height}"
          alt="${review.testImage.alt}"
          loading="lazy"
          decoding="async"
        >
      </div>
      <p class="review-text">${review.text}</p>
    `;
      sliderContainer.appendChild(card);
    });
  }

  // 4) build the dots
  function createDots() {
    dotsContainer.innerHTML = "";
    reviews.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      if (i === currentIndex) dot.classList.add("active");
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateSlider();
      });
      dotsContainer.appendChild(dot);
    });
  }

  // 5) slide logic
  function updateSlider() {
    const width = sliderContainer.clientWidth;
    sliderContainer.style.transform = `translateX(-${currentIndex * width}px)`;
    dotsContainer.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentIndex);
    });
  }
  function goNext() {
    currentIndex = (currentIndex + 1) % reviews.length;
    updateSlider();
  }
  function goPrev() {
    currentIndex = (currentIndex - 1 + reviews.length) % reviews.length;
    updateSlider();
  }

  // 6) swipe on the **wrapper** instead of the inner slider
  function enableSwipe() {
    testimonialWrapper.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });
    testimonialWrapper.addEventListener("touchend", e => {
      endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) goNext();
      else if (endX - startX > 50) goPrev();
    });
  }

  // 7) on resize, recalc
  window.addEventListener("resize", updateSlider);

  // 8) init
  createTestimonialCards();
  createDots();
  enableSwipe();
  nextBtn.addEventListener("click", goNext);
  prevBtn.addEventListener("click", goPrev);
  updateSlider();
});

const comparePrompt = document.querySelector(".compare-plans");
if (comparePrompt) {
  comparePrompt.style.display = "block";
  motivationSec.parentNode.insertBefore(comparePrompt, motivationSec);
}

setUpCompareModal();

function setUpCompareModal() {
  const link = document.getElementById("comparePlansLink");
  const bannerC = document.getElementById("firstWorkoutCompare");  // ← new
  const modal = document.getElementById("compareModal");
  if (!modal) return;

  const closeBtn = modal.querySelector(".close");

  // existing “Compare Plans” link
  if (link) {
    link.addEventListener("click", e => {
      e.preventDefault();
      modal.classList.add("show");
    });
  }

  // new: banner’s “See What’s Inside” CTA
  if (bannerC) {
    bannerC.addEventListener("click", e => {
      e.preventDefault();
      modal.classList.add("show");
    });
  }

  // close handlers
  closeBtn.addEventListener("click", () => modal.classList.remove("show"));
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("show");
  });
}
