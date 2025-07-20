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

  // continueBtn.addEventListener('click', async () => {
  //   const email = await getCustomerEmail();
  //   if (!email) { showError('Email missing – please log in again.'); return; }

  //   continueBtn.disabled = true;

  //   const { clientSecret: secret, error } = await fetch(
  //     '/api/create-subscription-intent',
  //     {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       // body: JSON.stringify({ email, discounted: true })
  //       body: JSON.stringify({ email, discounted: isDiscountActive() })
  //     }
  //   ).then(r => r.json());

  //   if (error) { showError(error); continueBtn.disabled = false; return; }
  //   clientSecret = secret;

  //   if (!stripeJs) stripeJs = stripe(STRIPE_PK);   // hoisted ✔
  //   if (!elements) {
  //     elements = stripeJs.elements({ clientSecret });
  //     elements.create('payment').mount('#paymentElement');
  //     if (!window.stripeJs) {
  //       window.stripeJs = stripeJs;
  //     }

  //     // 2) Log when we call canMakePayment()
  //     const paymentRequest = stripeJs.paymentRequest({
  //       country: 'GB',          // or your selling country
  //       currency: 'gbp',
  //       total: {
  //         label: '12-Week Plan',
  //         amount: isDiscountActive() ? 99 : 2999
  //       },
  //       requestPayerName: true,
  //       requestPayerEmail: true,
  //     });

  //     paymentRequest.canMakePayment().then(result => {
  //       if (result) {
  //         const prButton = elements.create('paymentRequestButton', {
  //           paymentRequest,
  //           style: {
  //             paymentRequestButton: {
  //               type: 'buy',      // other options: default, donate
  //               theme: 'light',    // or dark / light‑outline
  //               height: '44px'
  //             }
  //           }
  //         });
  //         prButton.mount('#payment-request-button');

  //         // document.getElementById('paySubmitBtn').style.display = 'none';
  //       } else {
  //         /* Unsupported browser/device → hide empty div */
  //         document.getElementById('payment-request-button').style.display = 'none';
  //       }
  //     });

  //     /* Handle the wallet authorisation event */
  //     paymentRequest.on('paymentmethod', async ev => {
  //       try {
  //         /* We already have clientSecret from your Continue‑button flow.
  //            If user reached this screen some other way, fetch it now. */
  //         if (!clientSecret) {
  //           const email = await getCustomerEmail();            // your helper
  //           const resp = await fetch('/api/create-subscription-intent', {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             // body: JSON.stringify({ email, discounted: true })
  //             body: JSON.stringify({ email, discounted: isDiscountActive() })
  //           }).then(r => r.json());
  //           if (resp.error) throw new Error(resp.error);
  //           clientSecret = resp.clientSecret;
  //         }

  //         /* Tell Stripe to confirm using the wallet’s PaymentMethod */
  //         const { error } = await stripeJs.confirmCardPayment(
  //           clientSecret,
  //           { payment_method: ev.paymentMethod.id },
  //           { handleActions: true }      // Pops 3‑DS if required
  //         );

  //         if (error) {
  //           ev.complete('fail');
  //           showError(error.message);    // your existing helper
  //           return;
  //         }

  //         ev.complete('success');
  //         window.location.href = RETURN_URL;
  //       } catch (err) {
  //         ev.complete('fail');
  //         showError(err.message);
  //       }
  //     });

  //   }

  //   // animatePanels();
  // });

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

  try {
    const resp = await fetch('/api/create-subscription-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, discounted })
    }).then(r => r.json());

    if (resp.error) {
      showError(resp.error);
      return;
    }

    clientSecret = resp.clientSecret;
stripeJs = stripeJs || stripe(STRIPE_PK);
    if (!elements) {
      elements = stripeJs.elements({ clientSecret });
      mountPaymentUI();            // mount once
    } else if (force) {
      elements.update({ clientSecret }); // update secret if we force refresh
    }


    // Wallet button (optional)
       if (!window.__STRIPE_WARM__?.pr) {
      const pr = stripeJs.paymentRequest({
      country: 'GB',
      currency: 'gbp',
      total: { label: '12-Week Plan', amount: discounted ? 99 : 2999 },
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
        document.getElementById('payment-request-button').style.display = 'none';
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

function collapseAllOfferCards() {
  const cards = document.querySelectorAll('.offer-card');
  cards.forEach(card => {
    if (card.dataset.expanded === 'true') {
      // Preferred: use existing toggleDetails if it exists globally
      if (typeof window.toggleDetails === 'function') {
        try { window.toggleDetails(card, false); return; } catch(_) {}
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
  collapseAllOfferCards();

  // Prevent double clicks
  if (continueBtn.disabled) return;
  continueBtn.disabled = true;

  // Collapse offer cards (they’re still in the page)
  const cardsSection = document.getElementById('offerCardsContainer');
  const paymentSection = document.getElementById('paymentSection');
  const postPayNote = document.getElementById('postPayNote');
  const loadingSection = document.getElementById('loadingSection');
  // Hide any stale loading UI (should be hidden anyway)
  if (loadingSection) loadingSection.style.display = 'none';
  cardsSection.style.display = 'none';
  if (typeof updatePlanSummary === 'function') updatePlanSummary();
  // Show payment instantly (warmup already ran)
  paymentSection.classList.remove('preload-hide');
  paymentSection.style.display = 'block';
  postPayNote.style.display = 'block';

  // Push history state once (for back button)
  if (!history.state || !history.state.paymentOpen) {
    history.pushState({ paymentOpen: true }, '', location.href);
  }

  // Re-enable (so user can click again if they close)
  continueBtn.disabled = false;

  // Focus first focusable (Stripe iframe is async, so delay a tick)
  setTimeout(() => {
    paymentSection.querySelector('iframe,button,input,select,textarea')?.focus();
  }, 150);
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

document.getElementById('paymentCloseBtn')?.addEventListener('click', e => {
  e.preventDefault();
  const paymentSection = document.getElementById('paymentSection');
  const cardsSection = document.getElementById('offerCardsContainer');

  paymentSection.classList.add('preload-hide');
  paymentSection.style.display = 'none';
  document.getElementById('postPayNote')?.style.setProperty('display','none');
  cardsSection.style.display = 'flex';

  if (history.state && history.state.paymentOpen) {
    history.replaceState(null, '', location.href);
  }
});