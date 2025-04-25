document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add("visible");
      }, index * 500);
    });
  });