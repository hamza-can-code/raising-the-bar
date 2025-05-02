/********************************************************************
 *  Log-in-and-Pay flow
 *  ---------------------------------------------------------------
 *  1) Validate credentials → /api/auth/login
 *  2) Save JWT in localStorage
 *  3) (Optional) run post-login onboarding
 *  4) Create Stripe Checkout session for the plan saved earlier
 *  5) Redirect to Stripe
 *******************************************************************/
import { savePreferencesAfterLogin } from "../scripts/savePreferencesAfterLogin.js";

document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------------------------------------------
   * Grab the pending purchase the visitor chose on the pricing page
   * ----------------------------------------------------------- */
  const pending     = localStorage.getItem("pendingPurchaseType"); // set by your pricing buttons
  const planName    = localStorage.getItem("planName")  || "Unknown plan";
  const planPrice   = localStorage.getItem("planPrice") || "";
  const discountEnd = Number(localStorage.getItem("discountEndTime") || 0);
  const discounted  = discountEnd > Date.now();

  /* Map pretty names → backend plan keys (same map as sign-up-checkout.js) */
  const planMap = {
    "1-Week Program"          : "1-week",
    "4-Week Program"          : "4-week",
    "12-Week Program"         : "12-week",
    "Pro Tracker Subscription": "subscription"
  };
  const plan = planMap[planName];

  /* -------------------------------------------------------------
   * UI Updates
   * ----------------------------------------------------------- */
  const planSummary = document.getElementById("planSummary");
  const payBtn      = document.getElementById("paySubmitBtn");

  if (!pending || !plan) {
    planSummary.textContent = "⚠️ No plan selected.";
    payBtn.disabled = true;
    return;
  }
  planSummary.textContent = `${planName} – ${planPrice}`;

  /* -------------------------------------------------------------
   * Form submission
   * ----------------------------------------------------------- */
  const form = document.getElementById("loginCheckoutForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const { email, password } = form;

    /* 1) Front-end validation */
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

    try {
      /* 2)  Log in */
      const res  = await fetch("/api/auth/login", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ email: email.value, password: password.value })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Login failed");

      /* 3)  Store token & run optional onboarding */
      localStorage.setItem("token", body.token);
      await savePreferencesAfterLogin();

      /* 4)  Kick off Stripe session */
      const sessionRes = await fetch("/api/create-checkout-session", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          email : email.value,
          plan,
          discounted
        })
      });
      const sessBody = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessBody.error || "Unable to start checkout");

      /* 5)  Redirect to Stripe */
      window.location.href = sessBody.url;

    } catch (err) {
      console.error(err);
      showError("password-error", err.message || "Something went wrong");
    }
  });

  /* -------------------------------------------------------------
   * Helpers
   * ----------------------------------------------------------- */
  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }
  function clearErrors() {
    document.querySelectorAll(".error-message").forEach(el => (el.textContent = ""));
  }

  console.log("[login-checkout] ready — plan:", plan, "discounted?", discounted);
});
