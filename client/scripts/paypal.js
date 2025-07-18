//client/scripts/paypal.js


/* --------------------------------------------------
 * CONFIG – FILL THESE IN ⚠️
 * ------------------------------------------------*/
const PAYPAL_PLAN_DISCOUNT = 'P-38P197067S4343902NB4O32Y'; // ← first month 0.99, then 29.99
const PAYPAL_PLAN_FULL = 'P-4FN65942RD4768921NB4PLMA';  // ← straight 29.99 / month

/* You rarely change anything below this line 😉 ------------------------*/

(function () {

  let paypalLoaded = false;

// function openPaymentModal() {
//   paymentSection.classList.remove('hidden');
//   if (!window._ppRendered) {  paypal.Buttons(paypalConfig).render('#paypalMount')
//       .then(() => buyNowBtn.classList.remove('disabled'));
//     paypalLoaded = true;
//   }
// }
// offerFinishBtn.addEventListener('click', openPaymentModal);
  const token = localStorage.getItem('token');          // Bearer for /api/update-purchase
  function getPlanId() {
    return document.body.classList.contains('discount-active')
      ? PAYPAL_PLAN_DISCOUNT
      : PAYPAL_PLAN_FULL;
  }

  /** DOM refs ----------------------------------------------------------*/
  const paySection = document.getElementById('paymentSection');
  const stripeWrap = document.getElementById('paymentForm');    // ⬅︎ the whole form
  const paypalWrapId = 'paypalMount';
  document.getElementById('paypal-button-container').style.display = 'none';
  const toggleBar = document.getElementById('pay-toggle');

  if (!paySection || !stripeWrap || !toggleBar) {
    console.error('[paypal.js] Missing #paymentSection / wrappers – please check the HTML edits described at the top of this file.');
    return;
  }

  /* -------------------------------------------------------------------
   * 1.  Toggle logic (PayPal first)                                    */

  const buyNowBtn = document.getElementById('paypalBuyNowBtn');   // add at the top

  function activate(tab) {
    const btns = toggleBar.querySelectorAll('button');
    const slider = toggleBar.querySelector('.toggle-slider');   // NEW

    btns.forEach(b => b.classList.toggle('active', b.dataset.pay === tab));

    /* move the slider */
    slider.style.left = tab === 'paypal'
      ? 'var(--pad)'
      : `calc(50% + var(--pad))`;

    /* show PayPal UI / hide Stripe UI */
    document.getElementById('paypalMarkContainer').style.display = tab === 'paypal' ? 'block' : 'none';
    // document.getElementById('paypal-button-container').style.display = tab === 'paypal' ? 'block' : 'none';
    buyNowBtn.style.display = tab === 'paypal' ? 'block' : 'none';
    stripeWrap.style.display = tab === 'paypal' ? 'none' : 'block';
  }
  toggleBar.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') activate(e.target.dataset.pay);
  });
  activate('paypal'); // default tab

  /* -------------------------------------------------------------------
   * 2.  Render PayPal Marks & Subscription buttons                     */
  if (!window.paypal) {
    console.error('[paypal.js] PayPal JS SDK not loaded – check the <script src=…> tag in your <head>.');
    return;
  }

  // Inline marks (little PayPal / Card / Google icons under header)
  // window.paypal.Marks().render('#paypalMarkContainer');

  // Smart Subscription button
  window.paypal.Buttons({
    style: {
      layout: 'vertical',
      shape: 'pill',
      color: 'gold',
      height: 45,
      label: 'subscribe'

    },

    createSubscription(_data, actions) {
      return actions.subscription.create({ plan_id: getPlanId() });
    },

    onApprove: async function (data, _actions) {
      /* data.subscriptionID, data.orderID, data.payerID available */
      try {
        await fetch('/api/update-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ purchaseType: 'subscription' })
        });
      } catch (err) {
        console.warn('[paypal.js] /api/update-purchase failed – not fatal:', err);
      }

      /* optional: fire your Brevo confirmation e‑mail route
         await fetch('/api/send-confirmation', { … })  */

      // 🏁  Redirect the buyer → dashboard.html
      window.location.href = '/pages/dashboard.html';
    },

    onError(err) {
      console.error('[paypal.js] PayPal Buttons error:', err);
      const errBox = document.getElementById('cardError');
      if (errBox) errBox.textContent = err?.message || 'PayPal error – please try again.';
      // Fallback: let them switch to card
      activate('card');
    }
  }).render('#paypalMount')
    .then(() => {
      // enable hover state once the SDK has mounted
      document.getElementById('paypalBuyNowBtn')
        .classList.remove('disabled');
    });
})();
