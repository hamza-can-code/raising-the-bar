document.addEventListener("DOMContentLoaded", () => {
  // Toggle show/hide password
  const toggles = document.querySelectorAll(".toggle-password");
  toggles.forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      const type = input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);
      btn.setAttribute("aria-label", type === "password" ? "Show password" : "Hide password");
      btn.textContent = type === "password" ? "👁️" : "🙈";
    });
  });

  // Simple inline validation + redirect
  const form = document.getElementById("signup-form");
  form.addEventListener("submit", e => {
    e.preventDefault();
    clearErrors();

    const email = form.email;
    const pw = form.password;
    const confirm = form["confirm-password"];
    let valid = true;

    // Email validity
    if (!email.checkValidity()) {
      showError("email-error", "Please enter a valid email address.");
      valid = false;
    }

    // Password length
    if (pw.value.length < 8) {
      showError("password-error", "Password must be at least 8 characters.");
      valid = false;
    }

    // Passwords match
    if (pw.value && confirm.value !== pw.value) {
      showError("confirm-error", "Passwords do not match.");
      valid = false;
    }

    if (!valid) return;
    
    // all good → go to dashboard
    window.location.href = "dashboard.html";
  });

  function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  function clearErrors() {
    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
  }
});