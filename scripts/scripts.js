// document.addEventListener('DOMContentLoaded', () => {
//     const toggleButton = document.getElementById('darkModeToggle'); // The dark mode button
//     const logo = document.getElementById('logo'); // The logo

//     toggleButton.addEventListener('click', () => {
//         // Toggle dark mode on the body
//         document.body.classList.toggle('dark-mode');

//         // Change button image and logo image based on mode
//         if (document.body.classList.contains('dark-mode')) {
//             toggleButton.src = 'src/images/dark-mode-on-button.png'; // Path to "dark mode ON" image
//             logo.src = 'src/images/rtb-logo-black.jpg'; // Path to your dark mode logo
//         } else {
//             toggleButton.src = 'src/images/dark-mode-off-button.png'; // Path to "dark mode OFF" image
//             logo.src = 'src/images/rtb-logo-white.png'; // Path to your light mode logo
//         }
//     });
// });

const themeBtn = document.getElementById("darkModeToggle");
const logo = document.getElementById("logo");
const darkTheme = document.querySelectorAll(".dark-theme");
themeBtn.onclick = () => {
    themeBtn.classList.toggle("src/images/dark-mode-off-button.png");
    if (themeBtn.classList.contains("src/images/dark-mode-off-button.png")) {
        document.body.classList.add("changeTheme");
        themeBtn.src = "src/images/dark-mode-on-button.png"
        logo.src = "src/images/rtb-logo-black-removebg";
        // for (const theme of darkTheme) {
        //     theme.style.backgroundColor = "#1D1E22";
        //     theme.style.color = "#eee";
        // }
    } else {
        document.body.classList.remove("changeTheme");
        themeBtn.src = "src/images/dark-mode-off-button.png";
        logo.src = "src/images/rtb-logo-white.png";
        // for (const theme of darkTheme) {
        //     theme.style.backgroundColor = "#eee";
        //     theme.style.color = "#1D1E22";
        // }
    }
}

// const themeBtn = document.getElementById("darkModeToggle");
// const logo = document.getElementById("logo");
// const darkTheme = document.querySelectorAll(".dark-theme");

// themeBtn.onclick = () => {
//     // Toggle the dark mode button image
//     if (themeBtn.src.includes("dark-mode-off-button.png")) {
//         themeBtn.src = "src/images/dark-mode-on-button.png"; // Switch to "dark mode ON" image
//         logo.src = "src/images/rtb-logo-black.jpg"; // Switch to dark mode logo
//         document.body.classList.add("changeTheme");

//         // Apply dark theme styles to elements with 'dark-theme' class
//         darkTheme.forEach((theme) => {
//             theme.style.backgroundColor = "#1D1E22";
//             theme.style.color = "#eee";
//         });
//     } else {
//         themeBtn.src = "src/images/dark-mode-off-button.png"; // Switch to "dark mode OFF" image
//         logo.src = "src/images/light-logo.png"; // Switch back to light mode logo
//         document.body.classList.remove("changeTheme");

//         // Revert dark theme styles
//         darkTheme.forEach((theme) => {
//             theme.style.backgroundColor = "#eee";
//             theme.style.color = "#1D1E22";
//         });
//     }
// };