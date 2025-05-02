// client/scripts/modules/modalLogin.js
export function initModalLogin() {
    const form   = document.getElementById("modal-login-form");
    const emailI = document.getElementById("modal-email");
    const pwI    = document.getElementById("modal-password");
    const rememberBox = document.getElementById("remember-me");   // ➊
  
    /* ----- Prefill if the user chose “remember me” in the past ----- */
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      emailI.value = savedEmail;
      rememberBox.checked = true;                                 // ➋
    }
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();
  
      // front-end validation
      let valid = true;
      if (!emailI.checkValidity()) {
        showError("modal-email-error", "Please enter a valid e-mail address.");
        valid = false;
      }
      if (!pwI.value) {
        showError("modal-password-error", "Please enter your password.");
        valid = false;
      }
      if (!valid) return;
  
      try {
        const res = await fetch("/api/auth/login", {
          method : "POST",
          headers: { "Content-Type": "application/json" },
          body   : JSON.stringify({ email: emailI.value, password: pwI.value })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
  
        /* ----- Remember-me logic ----- */
        if (rememberBox.checked) {
          localStorage.setItem("savedEmail", emailI.value);       // ➌ save email
          localStorage.setItem("token", data.token);              //    persist token
        } else {
          localStorage.removeItem("savedEmail");                  // ➍ clean up
          sessionStorage.setItem("token", data.token);            //    session-only
        }
        localStorage.setItem("dashboardVisited", "true");
  
        await fetchAndStorePreferences(data.token);
        window.location.href = "dashboard.html";
      } catch (err) {
        const msg = (err.message || "").toLowerCase();
        if (msg.includes("email")) showError("modal-email-error", err.message);
        else                       showError("modal-password-error", err.message);
      }
    });
  
    function showError(id, text) {
      const span = document.getElementById(id);
      if (span) span.textContent = text;
    }
    function clearErrors() {
      document.querySelectorAll("#login-modal .error-message")
              .forEach(el => (el.textContent = ""));
    }
  }
  
  // ───────── OPTIONAL helper (identical logic to main login page) ─────────
  async function fetchAndStorePreferences(token) {
    try {
      const res  = await fetch("/api/getUserPreferences", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.preferences) return;
  
      Object.entries(data.preferences).forEach(([k, v]) => {
        localStorage.setItem(k, typeof v === "object" ? JSON.stringify(v) : v);
      });
    } catch { /* silent fail – not critical for log-in flow */ }
  }
  