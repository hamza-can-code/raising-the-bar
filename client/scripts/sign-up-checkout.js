import { savePreferencesAfterLogin } from "../scripts/savePreferencesAfterLogin.js";

document.addEventListener("DOMContentLoaded", () => {
  const pending = localStorage.getItem("pendingPurchaseType");   // ← already saved by your pricing buttons
  const planName = localStorage.getItem("planName") || "Unknown plan";
  const planPrice = localStorage.getItem("planPrice") || "";
  const discountEnd = Number(localStorage.getItem("discountEndTime") || 0);
  const discounted = discountEnd > Date.now();        // ← rename (matches back-end key)

  /* ——— 1. map the pretty plan name → back-end key ——— */
  const planMap = {
    "1-Week Program": "1-week",
    "4-Week Program": "4-week",
    "12-Week Program": "12-week",
    "Pro Tracker Subscription": "subscription"
  };
  const plan = planMap[planName];   // may be undefined if dev added new plans later

  /* ——— UI bits (unchanged) ——— */
  const planSummary = document.getElementById("planSummary");
  if (!pending || !plan) {
    planSummary.textContent = "⚠️  No plan selected.";
    document.getElementById("paySubmitBtn").disabled = true;
    return;
  }
  planSummary.textContent = `${planName} – ${planPrice}`;

  const form = document.getElementById("signupCheckoutForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    /* 1)  simple email / pw validation (unchanged) */
    const emailEl = form.email;
    const passwordEl = form.password;
    const confirmEl = form.confirmPassword;
    let valid = true;

    if (!emailEl.checkValidity()) { showError("email-error", "Please enter a valid email."); valid = false; }
    if (passwordEl.value.length < 8) { showError("password-error", "Password must be at least 8 characters."); valid = false; }
    if (passwordEl.value !== confirmEl.value) { showError("confirm-error", "Passwords do not match."); valid = false; }
    if (!valid) return;

    try {
      /* 2)  register */
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailEl.value, password: passwordEl.value })
      });
      const regBody = await regRes.json();
      if (!regRes.ok) throw new Error(regBody.message || "Signup failed");

      /* 3)  login */
      const logRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailEl.value, password: passwordEl.value })
      });
      const logBody = await logRes.json();
      if (!logRes.ok) throw new Error(logBody.message || "Login failed");

      localStorage.setItem("token", logBody.token);

      /* 4)  (optional) onboarding prefs */
      await savePreferencesAfterLogin();

      /* 5)  CREATE CHECKOUT SESSION ——► SEND plan & discounted  */
      const sessionRes = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailEl.value,
          plan,               // '1-week' | '4-week' | '12-week' | 'subscription'
          discounted          // true/false — only matters for subscription
        })
      });
      const sessBody = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessBody.error || "Unable to start checkout");

      localStorage.removeItem('pendingPurchaseType');
      localStorage.removeItem('planPrice');      // wipe the FREE! 

      /* 6)  off to Stripe */
      window.location.href = sessBody.url;

    } catch (err) {
      console.error(err);
      showError("card-error", err.message || "Something went wrong");
    }
  });

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }
  function clearErrors() {
    document.querySelectorAll(".error-message").forEach(e => (e.textContent = ""));
  }

  console.log("[checkout] ready — plan:", plan, "discounted?", discounted);
});
