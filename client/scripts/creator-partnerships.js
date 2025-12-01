document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll for any "Book a demo call" / call-form links
    const callLinks = document.querySelectorAll('a[href="#call-form"]');
    const callSection = document.getElementById('call-form');

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
});

// Hide the "Loading calendar..." text once Calendly sends any event
window.addEventListener('message', function (e) {
    const data = e.data;
    if (data && typeof data === 'object' && data.event && data.event.indexOf('calendly.') === 0) {
        const loader = document.getElementById('calendly-loader');
        if (loader) loader.style.display = 'none';
    }
});
