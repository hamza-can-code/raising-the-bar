// client/scripts/log-in.js

import { savePreferencesAfterLogin } from "../scripts/savePreferencesAfterLogin.js";
import { showGlobalLoader, hideGlobalLoader } from "../scripts/loadingOverlay.js";


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    clearErrors();

    let valid = true;
    const email = form.email;
    const pw = form.password;

    // 1) Email validity
    if (!email.checkValidity()) {
      showError("email-error", "Please enter a valid email address.");
      valid = false;
    }
    // 2) Password non-empty
    if (!pw.value) {
      showError("password-error", "Please enter your password.");
      valid = false;
    }
    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    showGlobalLoader("Logging you in...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.value,
          password: pw.value
        })
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || "Login failed");
      }

      // ✅ on success
      localStorage.setItem("token", body.token);
      localStorage.setItem("dashboardVisited", "true");

      // ✅ Try to fetch saved preferences from MongoDB
      await fetchAndStorePreferences();

      // ✅ Redirect to dashboard
      window.location.href = "offer.html";

    } catch (err) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("email")) {
        showError("email-error", msg);
      } else {
        showError("password-error", msg);
      }
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

// ✅ Fetch saved preferences after login
async function fetchAndStorePreferences() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      // console.error("No token found.");
      return;
    }

    const res = await fetch("/api/getUserPreferences", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    // console.log("✅ Full server preferences received:", data);

    if (!data.preferences) {
      // console.error("❌ No preferences found on server.");
      return;
    }

    // Save each field from preferences into localStorage
    Object.keys(data.preferences).forEach(key => {
      const value = data.preferences[key];
      if (typeof value === "object") {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, value);
      }
    });

    // console.log("✅ Preferences loaded into localStorage");
  } catch (error) {
    // console.error("❌ Failed to fetch/store preferences:", error);
  }
}

// Helper: parse JSON safely if needed
function parseLocalStorageValue(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}
