const form = document.getElementById('creator-access-form');
const emailInput = document.getElementById('creator-email');
const submitButton = document.getElementById('creator-access-submit');
const statusMessage = document.getElementById('status-message');

function guessCurrency() {
  const language = navigator.language || '';
  const locale = typeof Intl !== 'undefined' && Intl.Locale ? new Intl.Locale(language) : null;
  const region = locale?.region || language.split('-')[1] || '';
  return region.toUpperCase() || 'GBP';
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-error', Boolean(message) && isError);
  statusMessage.classList.toggle('is-visible', Boolean(message));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('');

  if (!emailInput.checkValidity()) {
    setStatus('Please enter a valid billing email to continue.', true);
    emailInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Opening secure checkout…';
  setStatus('Redirecting you to Stripe to start your 30-day free access.');

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        plan: 'creator-platform-monthly',
        currency: guessCurrency(),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'Unable to start checkout.');
    }

    if (!payload?.url) {
      throw new Error('No checkout session URL was returned.');
    }

    window.location.href = payload.url;
  } catch (error) {
    console.error(error);
    submitButton.disabled = false;
    submitButton.textContent = 'Continue to secure checkout';
    setStatus(error.message || 'Something went wrong. Please try again.', true);
  }
});
