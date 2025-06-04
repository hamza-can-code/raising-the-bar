export function showGlobalLoader(message) {
  let overlay = document.getElementById("loadingOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loadingOverlay";
    overlay.innerHTML = `
      <div class="spinner"></div>
      <p id="loadingText"></p>
    `;
    document.body.appendChild(overlay);
  }
  document.getElementById("loadingText").textContent = message;
  overlay.classList.add("active");
}

export function hideGlobalLoader() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.remove("active");
}
