document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
  
    form.addEventListener("submit", e => {
      e.preventDefault();
      clearErrors();
  
      let valid = true;
      const email = form.email;
      const pw    = form.password;
  
      // 1) Email must be valid
      if (!email.checkValidity()) {
        showError("email-error", "Please enter a valid email address.");
        valid = false;
      }
  
      // 2) Password must be non-empty (or add your own rule)
      if (!pw.value) {
        showError("password-error", "Please enter your password.");
        valid = false;
      }
  
      if (!valid) return;
  
      // all good → go to the dashboard
      window.location.href = "dashboard.html";
    });
  
    function showError(id, message) {
      const el = document.getElementById(id);
      if (el) el.textContent = message;
    }
  
    function clearErrors() {
      document.querySelectorAll(".error-message")
              .forEach(el => el.textContent = "");
    }
  });
  