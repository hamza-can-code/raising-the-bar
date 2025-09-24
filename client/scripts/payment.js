// client/scripts/payment.js
/*  payment.js – v2025-07-11 18:40
    Commercial-ready drop-in for /scripts/payment.js
    Released under the MIT Licence – feel free to ship.                                       */

(() => {
  'use strict';

  const COLLAPSE_HANDLER_KEY = '__rtbCollapseHandler';

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
  const RETURN_URL = `${window.location.origin}/pages/kit-offer.html`;

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
  function showPaymentPanel() {
    stopStripeLoading();
    payPanel.classList.remove('preload-hide');
    payPanel.style.display = 'block';
    document.getElementById('postPayNote')?.style.setProperty('display', 'block');
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
  const el = document.getElementById('paymentElement');
  if (!el || el.dataset.mounted === 'true') return;

  // Payment Element (leave defaults)
  const paymentElement = elements.create('payment', { fields: { billingDetails: 'auto' } });
  paymentElement.mount('#paymentElement');
  el.dataset.mounted = 'true';

  // ---- Cosmetic address block ABOVE the Pay button ----
  let addrHost = document.getElementById('cosmeticBillingAddress');
  if (!addrHost) {
    addrHost = document.createElement('div');
    addrHost.id = 'cosmeticBillingAddress';
    addrHost.innerHTML = `
      <label class="addr-label" style="display:block;margin:14px 0 6px;">Billing address (for delivery)</label>
      <div id="addrMount"></div>
    `;

    // insert BEFORE the submit button
    const payBtn = document.getElementById('paySubmitBtn') 
                || payForm.querySelector('button[type="submit"]');
    if (payBtn && payBtn.parentElement) {
      payBtn.parentElement.insertBefore(addrHost, payBtn);
    } else {
      // fallback: right after the Payment Element container
      el.parentElement.insertBefore(addrHost, el.nextSibling);
    }
  }

  const addrEl = elements.create('address', {
    mode: 'billing',
    allowedCountries: ['GB','US','CA','SE','IE','AU','NZ','DE','FR','IT','ES'],
    fields: { phone: 'never' }
  });
  addrEl.mount('#addrMount');
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
          GBP: { full: 21.99, intro: 9.99 }, USD: { full: 23.99, intro: 9.99 }, EUR: { full: 22.99, intro: 9.99 },
          SEK: { full: 259, intro: 129 }, NOK: { full: 399, intro: 0 }, DKK: { full: 449, intro: 0 },
          CHF: { full: 34.99, intro: 0 }, AUD: { full: 94.99, intro: 0 }, NZD: { full: 59.99, intro: 0 },
          CAD: { full: 31.99, intro: 15.99 }, SGD: { full: 84.99, intro: 0 }, HKD: { full: 499, intro: 0 },
          JPY: { full: 7900, intro: 0 }, INR: { full: 3999, intro: 0 }, BRL: { full: 259.99, intro: 0 },
          MXN: { full: 1199, intro: 0 }
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
      const { error } = await stripeJs.confirmCardPayment(
        clientSecret,
        { payment_method: ev.paymentMethod.id },
        { handleActions: true }
      );
      if (error) {
        ev.complete('fail');
        showError(error.message);
        return;
      }

      ev.complete('success');
      window.location.href = RETURN_URL;
    } catch (err) {
      ev.complete('fail');
      showError(err.message);
    }
  }

   function forceCollapseCard(card) {
    if (!card) return;

    card.dataset.expanded = 'false';
    card.classList.remove('expanded');

    card.querySelectorAll('.additional-info').forEach(info => {
      const existingHandler = info[COLLAPSE_HANDLER_KEY];
      if (existingHandler) {
        info.removeEventListener('transitionend', existingHandler);
        info[COLLAPSE_HANDLER_KEY] = null;
      }
      info.style.transition = 'none';
      info.style.overflow = 'hidden';
      info.style.height = '0px';
      info.style.display = 'none';
      info.offsetHeight;
      info.style.removeProperty('transition');
    });

    card.querySelectorAll('.toggle-details').forEach(btn => {
      const fallbackLabel = btn.dataset.labelCollapsed
        || btn.getAttribute('data-label-collapsed')
        || 'What’s Included?';
      btn.textContent = fallbackLabel;
    });
  }

  function collapseCard(card, toggler) {
    if (!card) {
      return;
    }

    let handled = false;

    if (typeof toggler === 'function') {
      try {
        toggler(card, false, true);
        handled = true;
      } catch (_) {
        handled = false;
      }
    }

    if (!handled) {
      const toggleBtn = card.querySelector('.toggle-details');
      if (toggleBtn) {
        try {
          toggleBtn.click();
          handled = true;
        } catch (_) {
          handled = false;
        }
      } else {
        // also remove 'selected' visual if you want it cleared
        card.classList.remove('selected');
      }
    }

    forceCollapseCard(card);
  }

  function collapseAllOfferCards() {
    const toggler = window.toggleOfferCardDetails || window.toggleDetails;
    document.querySelectorAll('.offer-card').forEach(card => {
      collapseCard(card, toggler);
    });
    const kitCard = document.querySelector('.bm-discount-card');
    collapseCard(kitCard, toggler);
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

 const { error } = await stripeJs.confirmPayment({
      elements,
      redirect: 'always',              // 👈 optional but recommended
      confirmParams: {
          return_url: `${window.location.origin}/pages/kit-offer.html`,
        },
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

document.getElementById('paymentCloseBtn')?.addEventListener('click', e => {
  e.preventDefault();
  const paymentSection = document.getElementById('paymentSection');
  const cardsSection = document.getElementById('offerCardsContainer');

  paymentSection.classList.add('preload-hide');
  paymentSection.style.display = 'none';
  document.getElementById('postPayNote')?.style.setProperty('display', 'none');
  cardsSection.style.display = 'flex';

  if (history.state && history.state.paymentOpen) {
    history.replaceState(null, '', location.href);
  }
});