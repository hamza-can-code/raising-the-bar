// // server/routes/stripeRoutes.js
// const express = require('express');
// const Stripe = require('stripe');
// const router = express.Router();

// const stripe = Stripe(
//   process.env.STRIPE_SECRET_KEY,
//   { apiVersion: '2024-04-10' }    // or any version ≥ 2022-08-01
// );

// console.log('🔐 Stripe key in use:', process.env.STRIPE_SECRET_KEY);

// // const FRONTEND_URL = process.env.FRONTEND_URL;

// /* ─── Stripe Price IDs (from your .env) ───────────────────── */
// const PRICE = {
//   '1-week': process.env.PRICE_1_WEEK,
//   '4-week': process.env.PRICE_4_WEEK,
//   '12-week': process.env.PRICE_12_WEEK,
//   'subscription': process.env.FULL_PRICE_ID          // Pro-Tracker sub
// };

// const COUPON_ID = process.env.COUPON_ID;             // £9.99-first-month

// /* ─── Helper → build the Checkout session config ─────────── */
// function buildCheckoutConfig({ plan, discounted, email, origin }) {
//   const FRONTEND_URL = process.env.FRONTEND_URL || origin;
//   console.log('✅ BUILDING CHECKOUT: FRONTEND_URL is:', FRONTEND_URL);
//   if (!PRICE[plan]) throw new Error(`Unknown plan: ${plan}`);

//   const isSub = plan === 'subscription';

//   console.log('🧾 Stripe Checkout → plan:', plan);
//   console.log('💸 Using price ID:', PRICE[plan]);

//   const config = {
//     payment_method_types: ['card', 'klarna'],
//     mode: isSub ? 'subscription' : 'payment',
//     customer_email: email,
//     line_items: [{ price: PRICE[plan], quantity: 1 }],

//     success_url: `${FRONTEND_URL}/pages/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${FRONTEND_URL}/pages/offer.html`

//   };

//   // Intro discount applies only to the subscription
//   if (isSub && discounted) {
//     config.discounts = [{ coupon: COUPON_ID }];
//   }
//   return config;
// }

// /* ─── POST  /api/create-checkout-session ─────────────────── */
// router.post('/create-checkout-session', express.json(), async (req, res) => {
//   try {
//     const { plan, discounted = false, email } = req.body;

//     const origin = req.get('origin');
//     const sessionConfig = buildCheckoutConfig({ plan, discounted, email, origin });

//     console.log('🚨 FINAL CHECKOUT CONFIG:', sessionConfig);
//     console.log('⏱️  Creating checkout session with:', sessionConfig);
//     const session = await stripe.checkout.sessions.create(sessionConfig);

//     /* ─── POST /api/send-confirmation ─────────────────── */
//     const User = require('../models/User');
//     const UserAccess = require('../models/UserAccess');

//     router.post('/send-confirmation', express.json(), async (req, res) => {
//       const { email } = req.body;
//       if (!email) return res.status(400).json({ error: 'Email is required' });

//       try {
//         const user = await User.findOne({ email });
//         if (!user) return res.status(404).json({ error: 'User not found' });

//         const access = await UserAccess.findOne({ userId: user._id });
//         if (!access) return res.status(404).json({ error: 'Purchase not found' });

//         // Prepare dynamic email data
//         const confirmationData = {
//           firstName: user.firstName || '',
//           productName: access.productName || 'Your Product',
//           productPrice: access.productPrice ? `£${access.productPrice.toFixed(2)}` : '',
//           purchaseDate: access.purchaseDate
//             ? access.purchaseDate.toLocaleDateString()
//             : '',
//         };

//         // Simulate sending (you’ll connect this to Brevo API later)
//         console.log('💌 Order confirmation data:', confirmationData);

//         res.json({ success: true, data: confirmationData });
//       } catch (err) {
//         console.error('❌ Error sending confirmation:', err);
//         res.status(500).json({ error: 'Server error' });
//       }
//     });

//     res.json({ url: session.url });
//   } catch (err) {
//     console.error('Stripe error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

// // success_url: `${FRONTEND_URL}/pages/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
// // cancel_url: `${FRONTEND_URL}/pages/offer.html`

// /* POST  /api/create-subscription-intent  – Stripe Elements subscription */
// // server/routes/stripeRoutes.js  – ONLY the create-subscription-intent route
// const util = require('util');
// function log(label, obj) {
//   console.log(`🟡 ${label}`, util.inspect(obj, { depth: 3, colors: true }));
// }

// router.post('/create-subscription-intent', express.json(), async (req, res) => {
//   console.log('\n───────── /create-subscription-intent ─────────');
//   try {
//     const { email, discounted = false } = req.body;
//     log('1️⃣ incoming payload', req.body);
//     if (!email) return res.status(400).json({ error: 'Email required' });

//     /* 2 — customer */
//     const [existing] = await stripe.customers.list({ email, limit: 1 }).then(r => r.data);
//     const customer = existing || await stripe.customers.create({ email });
//     log('2️⃣ customer', customer.id);

//     /* 3 — subscription */
//     const sub = await stripe.subscriptions.create({
//       customer: customer.id,
//       items: [{ price: process.env.FULL_PRICE_ID }],
//       payment_behavior: 'default_incomplete',
//       payment_settings: {
//         save_default_payment_method: 'on_subscription',   // ✅ keep nested stuff simple
//         payment_method_types: ['card'],
//       },

//       ...(discounted && { discounts: [{ coupon: process.env.COUPON_ID }] }),
//       expand: ['latest_invoice.payment_intent']           // ask for PI right away
//     });
//     log('3️⃣ subscription', sub.id);

//     /* 4 — grab the PI (may still be missing on very first response) */
//     let pi = sub.latest_invoice.payment_intent;
//     if (!pi) {
//       const invoice = await stripe.invoices.retrieve(
//         sub.latest_invoice.id,
//         { expand: ['payment_intent'] }
//       );
//       pi = invoice.payment_intent;
//       log('4️⃣ re-fetched invoice', invoice.id);
//     }

//     if (!pi) {
//       return res.status(500).json({ error: 'Stripe failed to attach PaymentIntent' });
//     }

//     console.log('✅ 5️⃣ returning clientSecret');
//     res.json({ clientSecret: pi.client_secret, subscriptionId: sub.id });

//   } catch (err) {
//     console.error('❌ Stripe threw', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// server/routes/stripeRoutes.js
const express = require('express');
const Stripe = require('stripe');
const util = require('util');

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

const FRONTEND_URL = process.env.FRONTEND_URL;

/* ──────────────────────────────────────────────────────────
   Currency-aware Price & Coupon selection
   - Keep only the currencies you actually configured
   - Add/remove keys freely; fallback is GBP
   ────────────────────────────────────────────────────────── */
const PRICE_SUB = {
  GBP: process.env.PRICE_SUB_GBP,
  USD: process.env.PRICE_SUB_USD,
  EUR: process.env.PRICE_SUB_EUR,
  SEK: process.env.PRICE_SUB_SEK,
  NOK: process.env.PRICE_SUB_NOK,
  DKK: process.env.PRICE_SUB_DKK,
  CHF: process.env.PRICE_SUB_CHF,
  AUD: process.env.PRICE_SUB_AUD,
  NZD: process.env.PRICE_SUB_NZD,
  CAD: process.env.PRICE_SUB_CAD,
  SGD: process.env.PRICE_SUB_SGD,
  HKD: process.env.PRICE_SUB_HKD,
  JPY: process.env.PRICE_SUB_JPY,
  INR: process.env.PRICE_SUB_INR,
  BRL: process.env.PRICE_SUB_BRL,
  MXN: process.env.PRICE_SUB_MXN,
};

// If you created ONE multi-currency coupon, set COUPON_MULTI=promo_...
// If you created per-currency coupons, set COUPON_<CODE>=coupon_...
const COUPON_MULTI = process.env.COUPON_MULTI || null;
const COUPON_BY_CCY = {
  GBP: process.env.COUPON_GBP,
  USD: process.env.COUPON_USD,
  EUR: process.env.COUPON_EUR,
  SEK: process.env.COUPON_SEK,
  NOK: process.env.COUPON_NOK,
  DKK: process.env.COUPON_DKK,
  CHF: process.env.COUPON_CHF,
  AUD: process.env.COUPON_AUD,
  NZD: process.env.COUPON_NZD,
  CAD: process.env.COUPON_CAD,
  SGD: process.env.COUPON_SGD,
  HKD: process.env.COUPON_HKD,
  JPY: process.env.COUPON_JPY,
  INR: process.env.COUPON_INR,
  BRL: process.env.COUPON_BRL,
  MXN: process.env.COUPON_MXN,
};

function log(label, obj) {
  console.log(`🟡 ${label}`, util.inspect(obj, { depth: 4, colors: true }));
}

function pickCurrency(input) {
  const code = (input || 'GBP').toUpperCase();
  return PRICE_SUB[code] ? code : 'GBP';
}

function getSubPriceId(currencyCode) {
  const c = pickCurrency(currencyCode);
  const id = PRICE_SUB[c];
  if (!id) throw new Error(`Missing PRICE_SUB_${c} in environment.`);
  return { currency: c, priceId: id };
}

function getCouponId(currencyCode) {
  // Prefer single multi-currency coupon if provided
  if (COUPON_MULTI) return COUPON_MULTI;
  const c = pickCurrency(currencyCode);
  return COUPON_BY_CCY[c] || null; // ok to be null (no discount)
}

/* ──────────────────────────────────────────────────────────
   POST /api/create-checkout-session  (Stripe Checkout)
   Body: { plan: 'subscription', discounted: bool, email: string, currency?: 'USD' }
   NOTE: You said you currently only sell the subscription.
   This route still supports Checkout if you want that flow.
   ────────────────────────────────────────────────────────── */
router.post('/create-checkout-session', express.json(), async (req, res) => {
  try {
    const {
      plan = 'subscription',
      discounted = false,
      email,
      currency,          // e.g. "USD" sent by client
      client_reference_id,
    } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const origin = req.get('origin');
    const successBase = FRONTEND_URL || origin;
    if (!successBase) {
      return res.status(500).json({ error: 'Missing FRONTEND_URL and request origin' });
    }

    if (plan !== 'subscription') {
      return res.status(400).json({ error: 'Only subscription Checkout supported in this endpoint.' });
    }

    const { currency: ccy, priceId } = getSubPriceId(currency);
    const couponId = discounted ? getCouponId(ccy) : null;

    const sessionCfg = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      client_reference_id: client_reference_id || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successBase}/pages/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}/pages/offer.html`,
      // If coupon is present, apply it
      ...(couponId && { discounts: [{ coupon: couponId }] }),
      // Optional: metadata to help support
      metadata: {
        product: 'Pro Tracker',
        currency_used: ccy,
        discounted: String(!!discounted),
      },
    };

    log('Checkout session config', sessionCfg);
    const session = await stripe.checkout.sessions.create(sessionCfg);
    return res.json({ url: session.url });
  } catch (err) {
    console.error('❌ /create-checkout-session error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ──────────────────────────────────────────────────────────
   POST /api/create-subscription-intent  (Stripe Elements)
   Body: { email: string, discounted: bool, currency?: 'USD' }
   Returns: { clientSecret, subscriptionId }
   ────────────────────────────────────────────────────────── */
router.post('/create-subscription-intent', express.json(), async (req, res) => {
  console.log('\n───────── /create-subscription-intent ─────────');
  try {
    const { email, discounted = false, currency } = req.body;
    log('Incoming payload', req.body);
    if (!email) return res.status(400).json({ error: 'Email required' });

    // 1) find or create customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] || (await stripe.customers.create({ email }));
    log('Customer', { id: customer.id, email: customer.email });

    // 2) choose price & coupon by currency
    const { currency: ccy, priceId } = getSubPriceId(currency);
    const couponId = discounted ? getCouponId(ccy) : null;

    // 3) create subscription in incomplete state (for Elements confirmation)
    const subCfg = {
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      ...(couponId && { discounts: [{ coupon: couponId }] }),
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        product: 'Pro Tracker',
        currency_used: ccy,
        discounted: String(!!discounted),
      },
    };

    log('Subscription create config', subCfg);
    const sub = await stripe.subscriptions.create(subCfg);
    log('Subscription', { id: sub.id, status: sub.status });

    // 4) extract PaymentIntent for client_secret
    let pi = sub.latest_invoice?.payment_intent || null;
    if (!pi) {
      const invoice = await stripe.invoices.retrieve(sub.latest_invoice, {
        expand: ['payment_intent'],
      });
      pi = invoice.payment_intent;
      log('Re-fetched invoice for PI', { invoice: invoice.id, pi: pi?.id });
    }
    if (!pi) return res.status(500).json({ error: 'PaymentIntent not available' });

    return res.json({ clientSecret: pi.client_secret, subscriptionId: sub.id });
  } catch (err) {
    console.error('❌ /create-subscription-intent error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
