// client/scripts/sign-up.js

import { savePreferencesAfterLogin } from "./savePreferencesAfterLogin.js";
import { showGlobalLoader, hideGlobalLoader } from "./loadingOverlay.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    clearErrors();

    const email = form.email;
    const pw = form.password;
    const confirm = form["confirm-password"];
    let valid = true;

    if (!email.checkValidity()) {
      showError("email-error", "Please enter a valid email address.");
      valid = false;
    }
    if (pw.value.length < 8) {
      showError("password-error", "Password must be at least 8 characters.");
      valid = false;
    }
    if (pw.value !== confirm.value) {
      showError("confirm-error", "Passwords do not match.");
      valid = false;
    }
    if (!valid) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    showGlobalLoader("Finalizing your setup, this won't take long...");

    try {
      // Step 1: Register user
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.value,
          password: pw.value,
          isFree1Week: true
        })
      });

      const registerBody = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerBody.message || "Signup failed");
      }

      // Step 2: Immediately login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.value,
          password: pw.value,
          isFree1Week: true
        })
      });

      const loginBody = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginBody.message || "Login after signup failed");
      }

      // Step 3: Save token
      localStorage.setItem("token", loginBody.token);
      localStorage.setItem("customerEmail", email.value);

      // Step 4: Now save preferences
      await savePreferencesAfterLogin();

      localStorage.setItem("signupTimestamp", Date.now());

      // Step 5: Redirect to dashboard
      window.location.href = 'offer-decoded.html';

    } catch (err) {
      // console.error(err);
      showError("email-error", err.message);
      submitBtn.disabled = false;
      hideGlobalLoader();
    }
  });

  function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  function clearErrors() {
    document.querySelectorAll(".error-message")
      .forEach(el => (el.textContent = ""));
  }
});
