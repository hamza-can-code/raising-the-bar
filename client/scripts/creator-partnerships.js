const CLARITY_PROJECT_ID = 'rmf0p7sik4';
let clarityLoaded = false;

function loadClarity() {
    if (clarityLoaded) return;
    clarityLoaded = true;

    window.clarity = window.clarity || function () {
        (window.clarity.q = window.clarity.q || []).push(arguments);
    };

    const script = document.createElement('script');
    script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
    script.async = true;
    document.head.appendChild(script);
}

function getConsent() {
    return document.cookie.match(/(^|;)\s*userConsent=([^;]+)/)?.[2];
}

function setConsent(value) {
    const maxAge = 60 * 60 * 24 * 180; // 180 days
    document.cookie = `userConsent=${value}; max-age=${maxAge}; path=/`;
}

document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll for any "Book a demo call" / call-form links
    const callLinks = document.querySelectorAll('a[href="#call-form"]');
    const callSection = document.getElementById('call-form');
    const siteHeader = document.querySelector('.site-header');

    if (callSection && callLinks.length) {
        callLinks.forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                callSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    }

    if (siteHeader && callSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    siteHeader.classList.add('is-hidden');
                } else {
                    siteHeader.classList.remove('is-hidden');
                }
            });
        }, {
            threshold: 0.35
        });

        observer.observe(callSection);
    }

    // Form -> Formspree -> show Calendly scheduler
    const callForm = document.getElementById('creatorCallForm');
    const scheduler = document.getElementById('call-scheduler');
    const statusText = document.getElementById('callFormStatus');
    const loader = document.getElementById('calendly-loader');

    if (callForm && scheduler && statusText) {
        callForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const submitButton = callForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            statusText.innerHTML = `
  Submitting your details...<br><br>
  <span class="status-subtext">
    Please don’t close this page. The booking calendar should appear within a few seconds.<br><br>
    If it still hasn’t appeared after 2 minutes, please email <strong>info@raisingthebarapp.com</strong> and we’ll book a time for you manually.
  </span>
`;


            const formData = new FormData(callForm);
            const action = callForm.getAttribute('action');

            fetch(action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
                .then(function (response) {
                    if (response.ok) {
                        // Success: reset form + show scheduler
                        callForm.reset();
                        statusText.textContent = 'Got it. Now pick a time for your call below.';
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;

                        scheduler.style.display = 'block';
                        if (loader) loader.style.display = 'block';

                        scheduler.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    } else {
                        statusText.textContent = 'Something went wrong sending your details. Please try again in a moment.';
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    }
                })
                .catch(function (error) {
                    console.error(error);
                    statusText.textContent = 'Network error. Please check your connection and try again.';
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                });
        });
    }

    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function () {
            question.classList.toggle('rotated');

            const faqItem = question.parentElement;
            const answer = faqItem.querySelector('.faq-answer');
            const isExpanded = faqItem.classList.contains('active');

            if (isExpanded) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                answer.offsetHeight;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        answer.style.maxHeight = '0';
                        answer.style.paddingTop = '0';
                        answer.style.paddingBottom = '0';
                    });
                });

                answer.addEventListener('transitionend', function handler(e) {
                    if (e.propertyName === 'max-height') {
                        faqItem.classList.remove('active');
                        question.classList.remove('rotated');
                        answer.style.paddingTop = '';
                        answer.style.paddingBottom = '';
                        answer.removeEventListener('transitionend', handler);
                    }
                });
            } else {
                faqItem.classList.add('active');
                answer.style.paddingTop = '';
                answer.style.paddingBottom = '';
                answer.style.maxHeight = '0';
                answer.offsetHeight;
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    const cookieBanner = document.getElementById('cookie-banner');
    const acceptButton = document.getElementById('accept-all');
    const denyButton = document.getElementById('deny-all');

    if (cookieBanner && acceptButton && denyButton) {
        const consent = getConsent();

        const hideBanner = () => {
            cookieBanner.classList.remove('is-visible');
            setTimeout(() => {
                cookieBanner.hidden = true;
            }, 350);
        };

        if (consent === 'allow') {
            loadClarity();
            cookieBanner.hidden = true;
        } else if (consent === 'deny') {
            cookieBanner.hidden = true;
        } else {
            cookieBanner.hidden = false;
            requestAnimationFrame(() => cookieBanner.classList.add('is-visible'));
        }

        acceptButton.addEventListener('click', () => {
            setConsent('allow');
            loadClarity();
            hideBanner();
        });

        denyButton.addEventListener('click', () => {
            setConsent('deny');
            hideBanner();
        });
    }

     // Creator carousel dots
    const track = document.getElementById('creatorTrack');
    const dots = document.querySelectorAll('.carousel-dots .dot');

    if (track && dots.length) {
        const setActiveDot = (index) => {
            dots.forEach((d) => d.classList.remove('is-active'));
            if (dots[index]) dots[index].classList.add('is-active');
        };

        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                const idx = Number(dot.getAttribute('data-index') || '0');
                const slide = track.children[idx];
                if (!slide) return;

                slide.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                setActiveDot(idx);
            });
        });

        const onScroll = () => {
            const slides = Array.from(track.children);
            const trackRect = track.getBoundingClientRect();
            const trackCenter = trackRect.left + trackRect.width / 2;

            let closestIndex = 0;
            let closestDistance = Infinity;

            slides.forEach((slide, i) => {
                const rect = slide.getBoundingClientRect();
                const center = rect.left + rect.width / 2;
                const dist = Math.abs(center - trackCenter);
                if (dist < closestDistance) {
                    closestDistance = dist;
                    closestIndex = i;
                }
            });

            setActiveDot(closestIndex);
        };

        track.addEventListener('scroll', () => {
            window.requestAnimationFrame(onScroll);
        });

        setActiveDot(0);
    }
});

// Hide the "Loading calendar..." text once Calendly sends any event
window.addEventListener('message', function (e) {
    const data = e.data;
    if (data && typeof data === 'object' && data.event && data.event.indexOf('calendly.') === 0) {
        const loader = document.getElementById('calendly-loader');
        if (loader) loader.style.display = 'none';
    }
});
