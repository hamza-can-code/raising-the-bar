// client/scripts/payment.js
/*  payment.js – v2025-07-11 18:40
    Commercial-ready drop-in for /scripts/payment.js
    Released under the MIT Licence – feel free to ship.                                       */

(() => {
  'use strict';

  /* ——————————————————————————————————————————————————————————— */
  /* 1.  Get a *stable* Stripe constructor (frozen in <head>)      */
  /* ——————————————————————————————————————————————————————————— */

  const stripe =
    window.StripeReal            // if you followed the freeze snippet
    ?? window.Stripe;            // …else fall back to the global

  if (typeof stripe !== 'function') {
    console.error('[payment.js] Stripe SDK missing – aborting');
    return;
  }

  /* ——————————————————————————————————————————————————————————— */
  /* 2.  Configuration                                             */
  /* ——————————————————————————————————————————————————————————— */

  const STRIPE_PK = 'pk_live_51RJa8007mQ8fzyxpyrHP8Tk9GMzRnhG06vVUTe5mAnpcAacIj8fRmwuRYBpEIr1tRvFqe5nQqpofCURgCHaPASbS00wwfmtIvU';
  const RETURN_URL = `${window.location.origin}/pages/dashboard.html`;

  /* ——————————————————————————————————————————————————————————— */
  /* 3.  DOM handles                                               */
  /* ——————————————————————————————————————————————————————————— */

  const continueBtn = document.getElementById('offerFinishBtn');
  const cardsPanel = document.getElementById('offerCardsContainer');
  const payPanel = document.getElementById('paymentSection');   // MUST have .payment-section.hidden classes
  const payForm = document.getElementById('paymentForm');
  const cardError = document.getElementById('cardError');

  /* ——————————————————————————————————————————————————————————— */
  /* 4.  State                                                     */
  /* ——————————————————————————————————————————————————————————— */

  let stripeJs;
  let elements;        // ← Stripe Elements instance (lazy-created)
  let clientSecret;    // ← from /api/create-subscription-intent
  function isDiscountActive() {
    const end = Number(localStorage.getItem('discountEndTime') || 0);
    return end > Date.now();
  }

  /* ——————————————————————————————————————————————————————————— */
  /* 5.  Helpers                                                   */
  /* ——————————————————————————————————————————————————————————— */

  async function getCustomerEmail() {
    // a)  from localStorage (your onboarding flow)
    let email = localStorage.getItem('email');
    if (email) return email;

    // b)  from the auth API (user already logged in)
    const jwt = localStorage.getItem('token');
    if (!jwt) return null;

    try {
      const { email: fetched } = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${jwt}` }
      }).then(r => r.json());

      if (fetched) localStorage.setItem('email', fetched);
      return fetched ?? null;
    } catch { return null; }
  }

  function showError(msg) {
    cardError.textContent = msg ?? 'Unexpected error – please try again.';
  }

  function animatePanels() {
    cardsPanel.style.display = 'none';     // 👈 replaced the slide-left
    payPanel.classList.remove('hidden');
    requestAnimationFrame(() => payPanel.classList.add('slide-in'));
  }

  /* ——————————————————————————————————————————————————————————— */
  /* 6.  “Continue” click                                          */
  /* ——————————————————————————————————————————————————————————— */

  continueBtn.addEventListener('click', async () => {
    const email = await getCustomerEmail();
    if (!email) { showError('Email missing – please log in again.'); return; }

    continueBtn.disabled = true;

    const { clientSecret: secret, error } = await fetch(
      '/api/create-subscription-intent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // body: JSON.stringify({ email, discounted: true })
        body: JSON.stringify({ email, discounted: isDiscountActive() })
      }
    ).then(r => r.json());

    if (error) { showError(error); continueBtn.disabled = false; return; }
    clientSecret = secret;

    if (!stripeJs) stripeJs = stripe(STRIPE_PK);   // hoisted ✔
    if (!elements) {
      elements = stripeJs.elements({ clientSecret });
      elements.create('payment').mount('#paymentElement');
      if (!window.stripeJs) {
        window.stripeJs = stripeJs;
      }

      // 2) Log when we call canMakePayment()
      const paymentRequest = stripeJs.paymentRequest({
        country: 'GB',          // or your selling country
        currency: 'gbp',
        total: {
          label: '12-Week Plan',
          amount: isDiscountActive() ? 99 : 2999
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      paymentRequest.canMakePayment().then(result => {
        if (result) {
          const prButton = elements.create('paymentRequestButton', {
            paymentRequest,
            style: {
              paymentRequestButton: {
                type: 'buy',      // other options: default, donate
                theme: 'light',    // or dark / light‑outline
                height: '44px'
              }
            }
          });
          prButton.mount('#payment-request-button');

          // document.getElementById('paySubmitBtn').style.display = 'none';
        } else {
          /* Unsupported browser/device → hide empty div */
          document.getElementById('payment-request-button').style.display = 'none';
        }
      });

      /* Handle the wallet authorisation event */
      paymentRequest.on('paymentmethod', async ev => {
        try {
          /* We already have clientSecret from your Continue‑button flow.
             If user reached this screen some other way, fetch it now. */
          if (!clientSecret) {
            const email = await getCustomerEmail();            // your helper
            const resp = await fetch('/api/create-subscription-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // body: JSON.stringify({ email, discounted: true })
              body: JSON.stringify({ email, discounted: isDiscountActive() })
            }).then(r => r.json());
            if (resp.error) throw new Error(resp.error);
            clientSecret = resp.clientSecret;
          }

          /* Tell Stripe to confirm using the wallet’s PaymentMethod */
          const { error } = await stripeJs.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: true }      // Pops 3‑DS if required
          );

          if (error) {
            ev.complete('fail');
            showError(error.message);    // your existing helper
            return;
          }

          ev.complete('success');
          window.location.href = RETURN_URL;
        } catch (err) {
          ev.complete('fail');
          showError(err.message);
        }
      });

    }

    // animatePanels();
  });

  /* ——————————————————————————————————————————————————————————— */
  /* 7.  Form submit (confirm the payment)                         */
  /* ——————————————————————————————————————————————————————————— */

  payForm.addEventListener('submit', async e => {
    e.preventDefault();
    cardError.textContent = '';

    const loadingEl = document.getElementById('loadingIndicator');
    loadingEl.style.display = 'block';
    let dots = 1;
    const dotInterval = setInterval(() => {
      loadingEl.textContent = 'Loading' + '.'.repeat(dots);
      dots = dots % 3 + 1;
    }, 500);

    const { error } = await stripeJs.confirmPayment({
      elements,
      redirect: 'always',              // 👈 optional but recommended
      confirmParams: {
        return_url: `${window.location.origin}/pages/dashboard.html`
      }
    });

    clearInterval(dotInterval);
    loadingEl.style.display = 'none';

    if (error) showError(error.message);
  });
  function swapName() {
    const summaryEl = document.getElementById("planSummary");
    if (!summaryEl) return;
    // replace any literal occurrences
    summaryEl.innerHTML = summaryEl.innerHTML.replace(
      /Pro Tracker/g,
      "12‑Week Plan"
    );
  }

  // patch the original so any future calls get the swap too
  if (window.updatePlanSummary) {
    const orig = window.updatePlanSummary.bind(window);
    window.updatePlanSummary = function (...args) {
      orig(...args);
      swapName();
    };
  }

  // run it now (immediately, in case you already fired)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", swapName);
  } else {
    swapName();
  }
})();
