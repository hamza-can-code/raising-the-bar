const themeBtn = document.getElementById("darkModeToggle");
const logo = document.getElementById("logo");
const darkTheme = document.querySelectorAll(".dark-theme");
themeBtn.onclick = () => {
    themeBtn.classList.toggle("src/images/dark-mode-off-button.png");
    if (themeBtn.classList.contains("src/images/dark-mode-off-button.png")) {
        document.body.classList.add("changeTheme");
        themeBtn.src = "src/images/dark-mode-on-button.png"
        logo.src = "src/images/rtb-logo-black.png";
    } else {
        document.body.classList.remove("changeTheme");
        themeBtn.src = "src/images/dark-mode-off-button.png";
        logo.src = "src/images/rtb-logo-white.png";

    }
}

document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add("visible");
      }, index * 500);
    });
  });