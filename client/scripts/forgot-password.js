import { showGlobalLoader, hideGlobalLoader } from "../scripts/loadingOverlay.js";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const pageHeading = document.getElementById("page-heading");
  const requestCard = document.getElementById("request-reset");
  const resetCard = document.getElementById("complete-reset");
  const requestForm = document.getElementById("request-reset-form");
  const resetForm = document.getElementById("complete-reset-form");
  const requestStatus = document.getElementById("request-status");
  const resetStatus = document.getElementById("reset-status");

  if (token) {
    pageHeading.textContent = "Create a new password";
    requestCard?.setAttribute("hidden", "");
    resetCard?.removeAttribute("hidden");
  } else {
    pageHeading.textContent = "Reset your password";
    requestCard?.removeAttribute("hidden");
    resetCard?.setAttribute("hidden", "");
  }

  requestForm?.addEventListener("submit", async event => {
    event.preventDefault();
    clearStatus(requestStatus);
    setStatus(resetStatus, "");

    const emailInput = requestForm.querySelector("#reset-email");
    const emailError = requestForm.querySelector("#email-error");
    if (emailError) emailError.textContent = "";

    const email = emailInput?.value.trim() || "";
    if (!email) {
      if (emailError) emailError.textContent = "Please enter your email address.";
      emailInput?.focus();
      return;
    }

    if (emailInput && !emailInput.checkValidity()) {
      if (emailError) emailError.textContent = "Please enter a valid email address.";
      emailInput.focus();
      return;
    }

    const submitBtn = requestForm.querySelector('button[type="submit"]');
    setButtonState(submitBtn, true);
    showGlobalLoader("Sending reset link...");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const payload = await parseJson(res);
      if (!res.ok) {
        throw new Error(payload.message || "We couldn't send the reset link. Please try again.");
      }

      setStatus(requestStatus, payload.message || "Check your inbox for a link to reset your password.", "success");
      requestForm.reset();
    } catch (error) {
      setStatus(requestStatus, error.message || "Something went wrong. Please try again.", "error");
    } finally {
      hideGlobalLoader();
      setButtonState(submitBtn, false);
    }
  });

  resetForm?.addEventListener("submit", async event => {
    event.preventDefault();
    clearStatus(resetStatus);
    setStatus(requestStatus, "");

    const passwordInput = resetForm.querySelector("#new-password");
    const confirmInput = resetForm.querySelector("#confirm-password");
    const passwordError = resetForm.querySelector("#password-error");
    const confirmError = resetForm.querySelector("#confirm-error");
    if (passwordError) passwordError.textContent = "";
    if (confirmError) confirmError.textContent = "";

    const password = passwordInput?.value || "";
    const confirm = confirmInput?.value || "";

    const validation = validatePassword(password, confirm);
    if (!validation.isValid) {
      if (validation.password) passwordError.textContent = validation.password;
      if (validation.confirm) confirmError.textContent = validation.confirm;
      (validation.focus === "password" ? passwordInput : confirmInput)?.focus();
      return;
    }

    if (!token) {
      setStatus(resetStatus, "This link is missing a security token. Please request a new reset email.", "error");
      return;
    }

    const submitBtn = resetForm.querySelector('button[type="submit"]');
    setButtonState(submitBtn, true);
    showGlobalLoader("Saving your new password...");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      const payload = await parseJson(res);
      if (!res.ok) {
        throw new Error(payload.message || "We couldn't update your password. Please try again.");
      }

      setStatus(resetStatus, payload.message || "Your password has been updated. You can now log back in.", "success");
      resetForm.reset();
    } catch (error) {
      setStatus(resetStatus, error.message || "Something went wrong. Please try again.", "error");
    } finally {
      hideGlobalLoader();
      setButtonState(submitBtn, false);
    }
  });
});

function validatePassword(password, confirm) {
  const trimmedPassword = password.trim();
  const result = { isValid: true, password: "", confirm: "", focus: "password" };

  if (trimmedPassword.length < 8) {
    result.isValid = false;
    result.password = "Passwords need at least 8 characters.";
    return result;
  }

  if (!/[A-Za-z]/.test(trimmedPassword) || !/\d/.test(trimmedPassword)) {
    result.isValid = false;
    result.password = "Use a mix of letters and numbers for extra security.";
    return result;
  }

  if (password !== confirm) {
    result.isValid = false;
    result.confirm = "The passwords don't match. Double-check and try again.";
    result.focus = "confirm";
    return result;
  }

  return result;
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

function setStatus(el, message, variant = "info") {
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("is-success", "is-error", "is-visible");
  if (message) {
    el.classList.add("is-visible");
    if (variant === "success") el.classList.add("is-success");
    if (variant === "error") el.classList.add("is-error");
  }
}

function clearStatus(el) {
  if (!el) return;
  el.textContent = "";
  el.classList.remove("is-success", "is-error", "is-visible");
}

function setButtonState(button, isLoading) {
  if (!button) return;
  const defaultLabel = button.getAttribute("data-default") || button.textContent;
  const loadingLabel = button.getAttribute("data-loading") || "Please wait…";

  if (isLoading) {
    button.textContent = loadingLabel;
    button.disabled = true;
  } else {
    button.textContent = defaultLabel;
    button.disabled = false;
  }
}