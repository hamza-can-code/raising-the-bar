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

document.addEventListener("DOMContentLoaded", () => {
  const pending = localStorage.getItem("pendingPurchaseType");
  const planName = localStorage.getItem("planName") || "Unknown plan";
  const planPrice = localStorage.getItem("planPrice") || "";
  const discountEnd = Number(localStorage.getItem("discountEndTime") || 0);
  const discounted = discountEnd > Date.now();

  const planMap = {
    "1-Week Program": "1-week",
    "4-Week Program": "4-week",
    "12-Week Program": "12-week",
    "Pro Tracker Subscription": "subscription"
  };
  const plan = planMap[planName];

  const planSummary = document.getElementById("planSummary");
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

  // console.log("[login-checkout] ready — plan:", plan, "discounted?", discounted);
});
