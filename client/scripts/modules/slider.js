// client/scripts/modules/slider.js

export function initTestimonialsSlider() {
    // ← Your reviews data must live here
    const reviews = [
      {
        name: "David",
        text: "I used to just guess what to do. This finally gave me structure — I’ve gained 6kg of muscle, and I actually feel confident now.",
        beforeImage: "../assets/harry_chest_before.jpg",
        afterImage:  "../assets/harry_chest_after.jpg",
        testImage:   "../assets/5-stars.png",
      },
      {
        name: "Alice",
        text: "Strict plans always broke down when life got busy. This one adapts — and for the first time, I feel in control.",
        beforeImage: "../assets/halima_back_before.jpg",
        afterImage:  "../assets/halima_back_after.jpg",
        testImage:   "../assets/5-stars.png",
      },
      {
        name: "Lee",
        text: "Nothing stuck—until this. I lost 10kg and, more importantly, I stopped feeling lost.",
        beforeImage: "../assets/lynn_before.JPEG",
        afterImage:  "../assets/lynn_after.png",
        testImage:   "../assets/5-stars.png",
      },
    ];
  
    const slider    = document.querySelector(".testimonial-slider");
    const dots      = document.querySelector(".dots-container");
    const prevBtn   = document.querySelector(".arrow-button.prev");
    const nextBtn   = document.querySelector(".arrow-button.next");
    let   idx       = 0, startX = 0;
  
    function render() {
      // build cards
      slider.innerHTML = reviews.map(r => `
        <div class="testimonial-card">
          <div class="images">
            <div class="before">
              <img src="${r.beforeImage}" alt="Before"><p>Before</p>
            </div>
            <div class="after">
              <img src="${r.afterImage}" alt="After"><p>After</p>
            </div>
          </div>
          <p class="review-name">${r.name}</p>
          <div class="five-stars"><img src="${r.testImage}" alt="5 Stars"></div>
          <p class="review-text">${r.text}</p>
        </div>
      `).join("");
  
      // build dots
      dots.innerHTML = reviews.map((_, i) =>
        `<div class="dot${i===idx ? " active" : ""}" data-i="${i}"></div>`
      ).join("");
  
      // slide to current
      slider.style.transform = `translateX(-${idx * slider.clientWidth}px)`;
    }
  
    nextBtn.addEventListener("click", () => { idx = (idx+1)%reviews.length; render(); });
    prevBtn.addEventListener("click", () => { idx = (idx-1+reviews.length)%reviews.length; render(); });
  
    dots.addEventListener("click", e => {
      if (e.target.dataset.i != null) {
        idx = +e.target.dataset.i;
        render();
      }
    });
  
    const sliderContainer = document.querySelector(".testimonial-container");

    sliderContainer.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });
    
    sliderContainer.addEventListener("touchend", e => {
      const delta = startX - e.changedTouches[0].clientX;
      if      (delta > 50)  idx = (idx + 1) % reviews.length;
      else if (delta < -50) idx = (idx - 1 + reviews.length) % reviews.length;
      render();
    });
    
    window.addEventListener("resize", render);
    
    render();
  }
  