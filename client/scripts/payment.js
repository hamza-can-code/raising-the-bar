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

  function getCurrency() {
    return window.RTB_CURRENCY || { code: 'GBP', country: 'GB' };
  }

  if (typeof stripe !== 'function') {
    console.error('[payment.js] Stripe SDK missing – aborting');
    return;
  }

  /* ——————————————————————————————————————————————————————————— */
  /* 2.  Configuration                                             */
  /* ——————————————————————————————————————————————————————————— */

  const STRIPE_PK = 'pk_live_51RJa8007mQ8fzyxpyrHP8Tk9GMzRnhG06vVUTe5mAnpcAacIj8fRmwuRYBpEIr1tRvFqe5nQqpofCURgCHaPASbS00wwfmtIvU';
  // const RETURN_URL = `${window.location.origin}/pages/dashboard.html`;
  const SUCCESS_PATH = '/pages/plan-building.html';
  const RETURN_URL = `${window.location.origin}${SUCCESS_PATH}`;

  /* ——————————————————————————————————————————————————————————— */
  /* 3.  DOM handles                                               */
  /* ——————————————————————————————————————————————————————————— */

  // DOM handles (now ALSO used by helpers we will define below)
  const continueBtn = document.getElementById('offerFinishBtn');
  const cardsPanel = document.getElementById('offerCardsContainer');
  const payPanel = document.getElementById('paymentSection');
  const payForm = document.getElementById('paymentForm');
  const cardError = document.getElementById('cardError');
  const loadingSection = document.getElementById('loadingSection');
  const loadingTextEl = document.getElementById('loadingText');

  // Loader / panel helpers (moved *inside* so payPanel is in scope)
  let loadingDotsTimer = null;
  let loadingShownAt = 0;
  function startStripeLoading(messageBase = 'Loading') {
    if (!loadingSection || !loadingTextEl) return;
    if (loadingDotsTimer) stopStripeLoading();
    loadingShownAt = performance.now();
    loadingTextEl.textContent = messageBase + '.';
    loadingSection.style.display = 'block';
    let step = 1;
    loadingDotsTimer = setInterval(() => {
      step = (step % 3) + 1;
      loadingTextEl.textContent = messageBase + '.'.repeat(step);
    }, 400);
  }
  function stopStripeLoading() {
    if (loadingDotsTimer) {
      clearInterval(loadingDotsTimer);
      loadingDotsTimer = null;
    }
    if (loadingSection) loadingSection.style.display = 'none';
  }
  function markOfferDisclaimerVisible() {
    if (!window.__PAYMENT_VISITED__) return;
    document.body.classList.add('offer-disclaimer-visible');
  }
  function showPaymentPanel() {
    stopStripeLoading();
    payPanel.classList.remove('preload-hide');
    payPanel.style.display = 'block';
    document.getElementById('postPayNote')?.style.setProperty('display', 'block');
    window.__PAYMENT_VISITED__ = true;
    const focusable = payPanel.querySelector('iframe,button,[tabindex],input,select,textarea');
    focusable?.focus();
  }
  function showPaymentPanelWithMinDelay(minMs = 600) {
    const elapsed = performance.now() - loadingShownAt;
    if (elapsed >= minMs) showPaymentPanel();
    else setTimeout(showPaymentPanel, minMs - elapsed);
  }
  // Attach the listener here (after helpers + before ensureStripe dispatch)
  document.addEventListener('stripe-elements-ready', () => {
    if (loadingDotsTimer) showPaymentPanelWithMinDelay();
  });

  /* ——————————————————————————————————————————————————————————— */
  /* 4.  State                                                     */
  /* ——————————————————————————————————————————————————————————— */

  let stripeJs;
  let elements;        // ← Stripe Elements instance (lazy-created)
  let clientSecret;    // ← from /api/create-subscription-intent
  let intentType = 'payment';
  window.__PAYMENT_VISITED__ = window.__PAYMENT_VISITED__ || false;
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

  function mountPaymentUI() {
    // Mount the unified Payment Element once; keep container hidden until Continue
    if (!document.getElementById('paymentElement')) return;
    if (document.getElementById('paymentElement').dataset.mounted === 'true') return;
    elements.create('payment').mount('#paymentElement');
    document.getElementById('paymentElement').dataset.mounted = 'true';
  }

  async function ensureStripe(force = false) {
    // If already warmed AND not forcing, bail
    if (!force && window.__STRIPE_WARM__ && window.__STRIPE_WARM__.elements) return;

    const email = await getCustomerEmail?.();
    if (!email) {
      showError('Missing email – please log in again.');
      return;
    }

    const discounted = isDiscountActive();
    const curr = (typeof getCurrency === 'function')
      ? getCurrency()
      : { code: 'GBP', country: 'GB', fxFromGBP: 1 };

    try {
      const resp = await fetch('/api/create-subscription-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          discounted,
          currency: curr.code
        })
      }).then(r => r.json());

      if (resp.error) {
        showError(resp.error);
        return;
      }

      clientSecret = resp.clientSecret;
      intentType = resp.intentType || 'payment';

      stripeJs = stripeJs || stripe(STRIPE_PK);
      if (!elements) {
        elements = stripeJs.elements({ clientSecret });
        mountPaymentUI(); // mount once
        document.dispatchEvent(new Event('stripe-elements-ready'));
      } else if (force) {
        elements.update({ clientSecret }); // update secret if we force refresh
      }

      // Wallet button (Apple Pay / GPay)
      if (!window.__STRIPE_WARM__?.pr) {
        // Read per-currency prices (from offer.js) or use a safe fallback table
        const PRICE = (window.RTB_PRICE_TABLE) || {
          GBP: { full: 19.99, weekly: 4.99, intro: 0 },
          USD: { full: 23.99, weekly: 5.99, intro: 0 },
          EUR: { full: 22.99, weekly: 5.99, intro: 0 },
          SEK: { full: 249, weekly: 69, intro: 0 },
          NOK: { full: 259, weekly: 69, intro: 0 },
          DKK: { full: 179, weekly: 45, intro: 0 },
          CAD: { full: 29.99, weekly: 8.99, intro: 0 },
          CHF: { full: 24.99, weekly: 6.49, intro: 0 },
          AUD: { full: 34.99, weekly: 9.49, intro: 0 },
          NZD: { full: 32.99, weekly: 8.99, intro: 0 },
          SGD: { full: 29.99, weekly: 8.49, intro: 0 },
          HKD: { full: 169, weekly: 45, intro: 0 },
          JPY: { full: 3590, weekly: 950, intro: 0 },
          INR: { full: 1499, weekly: 399, intro: 0 },
          BRL: { full: 109.99, weekly: 29.99, intro: 0 },
          MXN: { full: 459, weekly: 119, intro: 0 }
        };

        const row = PRICE[curr.code] || PRICE.GBP;
        const displayAmount = discounted ? row.intro : row.full;             // exact local price you set in Stripe
        const minorDigits = curr.minor ?? 2;                // your getCurrency() tells you 0 for JPY, 2 for USD/EUR/etc
        const amountMinor = Math.round(displayAmount * Math.pow(10, minorDigits));

        const pr = stripeJs.paymentRequest({
          country: curr.country || 'GB',
          currency: (curr.code || 'GBP').toLowerCase(),
          total: { label: '12-Week Plan', amount: amountMinor },
          requestPayerName: true,
          requestPayerEmail: true
        });

        pr.canMakePayment().then(res => {
          if (res) {
            const btn = elements.create('paymentRequestButton', {
              paymentRequest: pr,
              style: { paymentRequestButton: { type: 'buy', theme: 'light', height: '44px' } }
            });
            btn.mount('#payment-request-button');
          } else {
            document.getElementById('payment-request-button')?.style.setProperty('display', 'none');
          }
        });

        pr.on('paymentmethod', walletHandler);
        window.__STRIPE_WARM__ = { stripeJs, elements, clientSecret, pr };
      } else {
        window.__STRIPE_WARM__.clientSecret = clientSecret;
      }
    } catch (e) {
      showError('Could not prepare payment.');
      console.warn('[ensureStripe]', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureStripe().catch(e => console.warn('[warmup]', e));
    });
  } else {
    ensureStripe().catch(e => console.warn('[warmup]', e));
  }

  async function walletHandler(ev) {
    try {
      let result;
      if (intentType === 'setup') {
        result = await stripeJs.confirmCardSetup(clientSecret, {
          payment_method: ev.paymentMethod.id,
        });
      } else {
        result = await stripeJs.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: true }
        );
      }

      if (result.error) {
        ev.complete('fail');
        showError(result.error.message);
        return;
      }

      ev.complete('success');
      window.location.href = RETURN_URL;
    } catch (err) {
      ev.complete('fail');
      showError(err.message);
    }
  }

  function collapseAllOfferCards() {
    const cards = document.querySelectorAll('.offer-card');
    cards.forEach(card => {
      if (card.dataset.expanded === 'true') {
        // Preferred: use existing toggleDetails if it exists globally
        if (typeof window.toggleDetails === 'function') {
          try { window.toggleDetails(card, false); return; } catch (_) { }
        }
        // Fallback: force close
        card.dataset.expanded = 'false';
        card.classList.remove('expanded', 'selected');
        const info = card.querySelector('.additional-info');
        if (info) {
          info.style.height = '0px';
          info.style.display = 'none';
        }
        const btn = card.querySelector('.toggle-details');
        if (btn) {
          // Restore original label
          btn.textContent = btn.getAttribute('data-label-collapsed') || 'What’s Included?';
        }
      } else {
        // also remove 'selected' visual if you want it cleared
        card.classList.remove('selected');
      }
    });
  }

  continueBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    // Force the checkout context to the primary 1-week plan
    localStorage.setItem('selectedProgram', 'new');
    localStorage.setItem('pendingPurchaseType', 'subscription');
    localStorage.setItem('planName', 'Pro Tracker');
    try { window.updatePlanSummary?.(); } catch (_) { }
    collapseAllOfferCards();
    if (continueBtn.disabled) return;
    continueBtn.disabled = true;
    const cardsSection = document.getElementById('offerCardsContainer');
    cardsSection.style.display = 'none';
    startStripeLoading('Loading');
    try {
      await ensureStripe();
      if (elements && loadingDotsTimer) showPaymentPanelWithMinDelay();
    } catch (err) {
      showError('Could not prepare payment. Please refresh and try again.');
      stopStripeLoading();
      cardsSection.style.display = 'flex';
      continueBtn.disabled = false;
      return;
    }
    if (!history.state || !history.state.paymentOpen) {
      history.pushState({ paymentOpen: true }, '', location.href);
    }
    continueBtn.disabled = false;
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

    let result;
    if (intentType === 'setup') {
      result = await stripeJs.confirmSetup({
        elements,
        redirect: 'always',
        confirmParams: {
          // return_url: `${window.location.origin}/pages/dashboard.html`,
                    return_url: RETURN_URL
        },
      });
    } else {
      result = await stripeJs.confirmPayment({
        elements,
        redirect: 'always',              // 👈 optional but recommended
        confirmParams: {
          // return_url: `${window.location.origin}/pages/dashboard.html`
                    return_url: RETURN_URL
        }
      });
    }

    clearInterval(dotInterval);
    loadingEl.style.display = 'none';

    if (result.error) showError(result.error.message);
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
  document.getElementById('paymentCloseBtn')?.addEventListener('click', e => {
    e.preventDefault();
    const paymentSection = document.getElementById('paymentSection');
    const cardsSection = document.getElementById('offerCardsContainer');

    paymentSection.classList.add('preload-hide');
    paymentSection.style.display = 'none';
    document.getElementById('postPayNote')?.style.setProperty('display', 'none');
    cardsSection.style.display = 'flex';

    markOfferDisclaimerVisible();

    if (history.state && history.state.paymentOpen) {
      history.replaceState(null, '', location.href);
    }
  });
})();
