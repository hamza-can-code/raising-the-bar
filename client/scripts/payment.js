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

  function getCreatorSlug() {
    const slug = window.RTB_CREATOR_SLUG;
    if (!slug || typeof slug !== 'string') return null;
    const trimmed = slug.trim();
    return trimmed ? trimmed.toLowerCase() : null;
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
  const CREATOR_SUCCESS_PATHS = {
    decoded: '/pages/thank-you-decoded.html',
    kayp: '/pages/thank-you-kayp.html',
    vital: '/pages/thank-you-vital.html',
    dav: '/pages/thank-you-dav.html',
    ryan: '/pages/thank-you-ryan.html',
  };
  const SUCCESS_PATH = CREATOR_SUCCESS_PATHS[getCreatorSlug()] || '/pages/plan-building.html';
  const RETURN_URL = `${window.location.origin}${SUCCESS_PATH}`;
  const NIGHT_PAYMENT_APPEARANCE = {
    theme: 'night',
    variables: {
      colorText: '#e8edf6',
      colorTextSecondary: '#c8d4e6',
      colorTextPlaceholder: '#b7c5db',
      colorBackground: '#0f1d33',
      colorPrimary: '#ff8f1f',
      colorIcon: '#e8edf6',
      borderRadius: '10px',
      fontFamily: "'Poppins', 'Roboto', system-ui, -apple-system, sans-serif",
    },
    rules: {
      '.Input': {
        color: '#e8edf6',
        backgroundColor: '#0f1d33',
        borderColor: '#324a66',
      },
      '.Label': { color: '#d9e3f2' },
      '.Tab': { color: '#c8d4e6' },
      '.Tab:focus': { color: '#ffffff' },
      '.Tab--selected': { color: '#0f1d33', backgroundColor: '#e8edf6' },
    },
  };

  const KAYP_PAYMENT_APPEARANCE = {
    theme: 'flat',
    variables: {
      colorText: '#1f2937',
      colorTextSecondary: '#4b5563',
      colorTextPlaceholder: '#9ca3af',
      colorBackground: '#ffffff',
      colorPrimary: '#007BFF',
      colorIcon: '#111827',
      borderRadius: '10px',
      fontFamily: "'Poppins', 'Roboto', system-ui, -apple-system, sans-serif",
    },
    rules: {
      '.Input': {
        color: '#111827',
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
      },
      '.Input:focus': {
        borderColor: '#007BFF',
        boxShadow: '0 0 0 1px #007BFF',
      },
      '.Label': { color: '#1f2937' },
      '.Tab': { color: '#4b5563', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
      '.Tab:focus': { color: '#111827' },
      '.Tab--selected': { color: '#ffffff', backgroundColor: '#007BFF' },
    },
  };

  const KAYP_STYLE_SLUGS = ['kayp', 'dav', 'ryan', 'ironverse'];

  const PAYMENT_APPEARANCE = KAYP_STYLE_SLUGS.includes(getCreatorSlug())
    ? KAYP_PAYMENT_APPEARANCE
    : NIGHT_PAYMENT_APPEARANCE;

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
    const hasClass = document.body.classList?.contains('discount-active');
    const end = Number(localStorage.getItem('discountEndTime') || 0);
    return hasClass || end > Date.now();
  }

  function getSelectedPlanId() {
    return localStorage.getItem('selectedProgram') || 'trial';
  }

  function getSelectedPlanPricing() {
    if (typeof window.RTB_getPlanPricing !== 'function') return null;
    return window.RTB_getPlanPricing(getSelectedPlanId(), isDiscountActive());
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
    const selectedPlan = getSelectedPlanId();
    const planPricing = getSelectedPlanPricing();
    const curr = (typeof getCurrency === 'function')
      ? getCurrency()
      : { code: 'GBP', country: 'GB', fxFromGBP: 1 };

    const creatorSlug = getCreatorSlug();
    const payload = {
      email,
      discounted,
      currency: curr.code,
      plan: selectedPlan
    };

    if (creatorSlug) payload.creatorSlug = creatorSlug;

    try {
      const resp = await fetch('/api/create-subscription-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const respPayload = await resp.json();

      if (!resp.ok || respPayload.error) {
        const msg = respPayload.error || 'Could not prepare payment. Please try again.';
        showError(msg);
        throw new Error(msg);
      }

      clientSecret = respPayload.clientSecret;
      intentType = respPayload.intentType || 'payment';

      stripeJs = stripeJs || stripe(STRIPE_PK);
      if (!elements) {
        elements = stripeJs.elements({ clientSecret, appearance: PAYMENT_APPEARANCE });
        mountPaymentUI(); // mount once
        document.dispatchEvent(new Event('stripe-elements-ready'));
      } else if (force) {
        elements.update({ clientSecret, appearance: PAYMENT_APPEARANCE }); // update secret if we force refresh
      }

      // Wallet button (Apple Pay / GPay)
      if (!window.__STRIPE_WARM__?.pr) {
        const minorDigits = curr.minor ?? 2;                // your getCurrency() tells you 0 for JPY, 2 for USD/EUR/etc
        const planDisplayAmount = planPricing
          ? planPricing.todayLocal
          : ((window.RTB_PRICE_TABLE?.[curr.code]?.full) || 19.99);
        const amountMinor = Math.round(planDisplayAmount * Math.pow(10, minorDigits));

        const pr = stripeJs.paymentRequest({
          country: curr.country || 'GB',
          currency: (curr.code || 'GBP').toLowerCase(),
          total: { label: planPricing?.name || 'Selected Plan', amount: amountMinor },
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
    const selectedPlan = getSelectedPlanId();
    if (!selectedPlan) {
      showError('Please select a plan to continue.');
      return;
    }
    localStorage.setItem('pendingPurchaseType', 'subscription');
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
