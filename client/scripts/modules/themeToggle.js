export function initThemeToggle() {
    const btn  = document.getElementById("darkModeToggle");
    const logo = document.getElementById("logo");
  
    btn.addEventListener("click", () => {
      const isOff = btn.src.includes("dark-mode-off-button");
      document.body.classList.toggle("changeTheme", isOff);
      btn.src  = isOff
        ? "src/images/dark-mode-on-button.png"
        : "src/images/dark-mode-off-button.png";
      logo.src = isOff
        ? "src/images/rtb-logo-black.png"
        : "src/images/rtb-logo-white.png";
    });
  }