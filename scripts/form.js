// const themeBtn = document.getElementById("darkModeToggle");
// const logo = document.getElementById("logo");
// const darkTheme = document.querySelectorAll(".dark-theme");
// themeBtn.onclick = () => {
//     themeBtn.classList.toggle("src/images/dark-mode-off-button.png");
//     if (themeBtn.classList.contains("src/images/dark-mode-off-button.png")) {
//         document.body.classList.add("changeTheme");
//         themeBtn.src = "src/images/dark-mode-on-button.png"
//         logo.src = "src/images/rtb-logo-black.png";
//     } else {
//         document.body.classList.remove("changeTheme");
//         themeBtn.src = "src/images/dark-mode-off-button.png";
//         logo.src = "src/images/rtb-logo-white.png";

//     }
// }

// document.addEventListener("DOMContentLoaded", () => {
//     const elements = document.querySelectorAll(".fade-in");
//     elements.forEach((element, index) => {
//       setTimeout(() => {
//         element.classList.add("visible");
//       }, index * 500);
//     });
//   });

// document.addEventListener("DOMContentLoaded", () => {
//     const progressBarFill = document.querySelector(".progress-bar-fill");
//     const formContent = document.getElementById("form-content");
  
//     // Example questions
//     const questions = [
//       {
//         question: "What is your fitness goal?",
//         options: ["Weight Loss", "Muscle Gain", "Endurance", "General Fitness"]
//       },
//       {
//         question: "How often do you exercise?",
//         options: ["Never", "1-2 times a week", "3-4 times a week", "5+ times a week"]
//       },
//       // Add more questions as needed
//     ];
  
//     let currentQuestionIndex = 0;
  
//     // Function to load a question
//     function loadQuestion(index) {
//       const questionData = questions[index];
//       const questionHTML = `
//         <div class="question">
//           <h2>${questionData.question}</h2>
//           <ol>
//             ${questionData.options.map(option => `<li>${option}</li>`).join("")}
//           </ol>
//         </div>
//       `;
//       formContent.innerHTML = questionHTML;
  
//       // Update progress bar
//       const progress = ((index + 1) / questions.length) * 100;
//       progressBarFill.style.width = `${progress}%`;
//     }
  
//     // Load the first question
//     loadQuestion(currentQuestionIndex);
  
//     // Add click listener to options (simulate progression for demo)
//     formContent.addEventListener("click", (e) => {
//       if (e.target.tagName === "LI") {
//         currentQuestionIndex++;
//         if (currentQuestionIndex < questions.length) {
//           loadQuestion(currentQuestionIndex);
//         } else {
//           formContent.innerHTML = "<h2>Thank you for completing the questionnaire!</h2>";
//           progressBarFill.style.width = "100%";
//         }
//       }
//     });
//   });

// document.querySelectorAll('.button-like').forEach(item => {
//     item.addEventListener('click', () => {
//         item.textContent = 'Clicked!';
//         item.style.backgroundColor = '#28a745'; // Change to green
//         item.style.color = 'white'; // Change text color for visibility
//     });
// });

  