// client/scripts/modules/slider.js

window.addEventListener('beforeunload', () => {
  const startedForm = localStorage.getItem('startedForm');

  if (startedForm && window.ttq) {
    ttq.track('FormAbandon', {
      content_name: 'Mid-Funnel Exit',
    });
    localStorage.removeItem('startedForm'); // Prevent double events
  }
});

export function initTestimonialsSlider() {
    // ← Your reviews data must live here
    const reviews = [
      {
        name: "David",
        text: "I used to wing it at the gym and second-guess everything. Seeing my workouts and progress adapt over time changed everything. I’ve gained 6kg of muscle — and confidence too.",
        beforeImage: "../assets/harry_chest_before.jpg",
        afterImage:  "../assets/harry_chest_after.jpg",
        testImage:   "../assets/5-stars.png",
      },
      {
        name: "Alice",
        text: "Strict plans never worked for me. This didn’t just tell me what to do — it fit into my life. I’ve lost weight, feel healthier, and for the first time, I’m in control of the process.",
        beforeImage: "../assets/halima_back_before.jpg",
        afterImage:  "../assets/halima_back_after.jpg",
        testImage:   "../assets/5-stars.png",
      },
      {
        name: "Lee",
        text: "I’d tried bootcamps, meal plans — nothing stuck. This finally made everything click. I’ve lost 10kg, but more than that, I finally feel like myself again.",
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
  