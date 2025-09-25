// // server/routes/stripeRoutes.js
// const express = require('express');
// const Stripe = require('stripe');
// const util = require('util');

// const router = express.Router();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2024-04-10',
// });

// const FRONTEND_URL = process.env.FRONTEND_URL;

// /* ──────────────────────────────────────────────────────────
//    Currency-aware Price & Coupon selection
//    - Keep only the currencies you actually configured
//    - Add/remove keys freely; fallback is GBP
//    ────────────────────────────────────────────────────────── */
// const PRICE_SUB = {
//   GBP: process.env.PRICE_SUB_GBP,
//   USD: process.env.PRICE_SUB_USD,
//   EUR: process.env.PRICE_SUB_EUR,
//   SEK: process.env.PRICE_SUB_SEK,
//   NOK: process.env.PRICE_SUB_NOK,
//   DKK: process.env.PRICE_SUB_DKK,
//   CHF: process.env.PRICE_SUB_CHF,
//   AUD: process.env.PRICE_SUB_AUD,
//   NZD: process.env.PRICE_SUB_NZD,
//   CAD: process.env.PRICE_SUB_CAD,
//   SGD: process.env.PRICE_SUB_SGD,
//   HKD: process.env.PRICE_SUB_HKD,
//   JPY: process.env.PRICE_SUB_JPY,
//   INR: process.env.PRICE_SUB_INR,
//   BRL: process.env.PRICE_SUB_BRL,
//   MXN: process.env.PRICE_SUB_MXN,
// };

// // If you created ONE multi-currency coupon, set COUPON_MULTI=promo_...
// // If you created per-currency coupons, set COUPON_<CODE>=coupon_...
// const COUPON_MULTI = process.env.COUPON_MULTI || null;
// const COUPON_BY_CCY = {
//   GBP: process.env.COUPON_GBP,
//   USD: process.env.COUPON_USD,
//   EUR: process.env.COUPON_EUR,
//   SEK: process.env.COUPON_SEK,
//   NOK: process.env.COUPON_NOK,
//   DKK: process.env.COUPON_DKK,
//   CHF: process.env.COUPON_CHF,
//   AUD: process.env.COUPON_AUD,
//   NZD: process.env.COUPON_NZD,
//   CAD: process.env.COUPON_CAD,
//   SGD: process.env.COUPON_SGD,
//   HKD: process.env.COUPON_HKD,
//   JPY: process.env.COUPON_JPY,
//   INR: process.env.COUPON_INR,
//   BRL: process.env.COUPON_BRL,
//   MXN: process.env.COUPON_MXN,
// };

// function log(label, obj) {
//   console.log(`🟡 ${label}`, util.inspect(obj, { depth: 4, colors: true }));
// }

// function pickCurrency(input) {
//   const code = (input || 'GBP').toUpperCase();
//   return PRICE_SUB[code] ? code : 'GBP';
// }

// function getSubPriceId(currencyCode) {
//   const c = pickCurrency(currencyCode);
//   const id = PRICE_SUB[c];
//   if (!id) throw new Error(`Missing PRICE_SUB_${c} in environment.`);
//   return { currency: c, priceId: id };
// }

// function getCouponId(currencyCode) {
//   // Prefer single multi-currency coupon if provided
//   if (COUPON_MULTI) return COUPON_MULTI;
//   const c = pickCurrency(currencyCode);
//   return COUPON_BY_CCY[c] || null; // ok to be null (no discount)
// }

// /* ──────────────────────────────────────────────────────────
//    POST /api/create-checkout-session  (Stripe Checkout)
//    Body: { plan: 'subscription', discounted: bool, email: string, currency?: 'USD' }
//    NOTE: You said you currently only sell the subscription.
//    This route still supports Checkout if you want that flow.
//    ────────────────────────────────────────────────────────── */
// router.post('/create-checkout-session', express.json(), async (req, res) => {
//   try {
//     const {
//       plan = 'subscription',
//       discounted = false,
//       email,
//       currency,          // e.g. "USD" sent by client
//       client_reference_id,
//     } = req.body;

//     if (!email) return res.status(400).json({ error: 'Email is required' });

//     const origin = req.get('origin');
//     const successBase = FRONTEND_URL || origin;
//     if (!successBase) {
//       return res.status(500).json({ error: 'Missing FRONTEND_URL and request origin' });
//     }

//     if (plan !== 'subscription') {
//       return res.status(400).json({ error: 'Only subscription Checkout supported in this endpoint.' });
//     }

//     const { currency: ccy, priceId } = getSubPriceId(currency);
//     const couponId = discounted ? null : getCouponId(ccy);

//     const sessionCfg = {
//       mode: 'subscription',
//       line_items: [{ price: priceId, quantity: 1 }],
//       customer_email: email,
//       client_reference_id: client_reference_id || undefined,
//       success_url: `${successBase}/pages/kit-offer.html?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${successBase}/pages/offer.html`,

//       // ✅ Always force card entry, even if trial
//       payment_method_collection: 'always',
//       customer_creation: 'always',

//       subscription_data: {
//         // trial_period_days: discounted ? 1 : undefined,
//         payment_settings: { save_default_payment_method: 'on_subscription' },
//         // trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
//       },

//       metadata: {
//         product: '12-Week Plan',
//         currency_used: ccy,
//         discounted: String(!!discounted),
//       },
//     };


//     // if (discounted) {
//     //   sessionCfg.subscription_data = { trial_period_days: 1 };
//     //   sessionCfg.payment_method_collection = 'always';
//     // }

//     log('Checkout session config', sessionCfg);
//     const session = await stripe.checkout.sessions.create(sessionCfg);
//     return res.json({ url: session.url });
//   } catch (err) {
//     console.error('❌ /create-checkout-session error:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ──────────────────────────────────────────────────────────
//    POST /api/create-subscription-intent  (Stripe Elements)
//    Body: { email: string, discounted: bool, currency?: 'USD' }
//    Returns: { clientSecret, subscriptionId }
//    ────────────────────────────────────────────────────────── */
// router.post('/create-subscription-intent', express.json(), async (req, res) => {
//   console.log('\n───────── /create-subscription-intent ─────────');
//   try {
//     const { email, discounted = false, currency } = req.body;
//     log('Incoming payload', req.body);
//     if (!email) return res.status(400).json({ error: 'Email required' });

//     // 1) find or create customer
//     const existing = await stripe.customers.list({ email, limit: 1 });
//     const customer = existing.data[0] || (await stripe.customers.create({ email }));
//     log('Customer', { id: customer.id, email: customer.email });

//     // 2) choose price & coupon by currency
//     const { currency: ccy, priceId } = getSubPriceId(currency);
//     const couponId = discounted ? null : getCouponId(ccy);

//     // 3) create subscription in incomplete state (for Elements confirmation)
//     const subCfg = {
//       customer: customer.id,
//       items: [{ price: priceId }],
//       payment_behavior: 'default_incomplete',
//       payment_settings: {
//         save_default_payment_method: 'on_subscription',
//         payment_method_types: ['card'],
//       },
//     expand: ['latest_invoice.payment_intent'],
//       metadata: {
//         product: '12-Week Plan',
//         currency_used: ccy,
//         discounted: String(!!discounted),
//       },
//     };

//     // if (discounted) {
//     //   subCfg.trial_period_days = 1;
//     // }


//     log('Subscription create config', subCfg);
//     const sub = await stripe.subscriptions.create(subCfg);
//     log('Subscription', { id: sub.id, status: sub.status });

//     // if (discounted) {
//     //   const setup =
//     //     typeof sub.pending_setup_intent === 'string'
//     //       ? await stripe.setupIntents.retrieve(sub.pending_setup_intent)
//     //       : sub.pending_setup_intent;
//     //   if (!setup) {
//     //     return res.status(500).json({ error: 'SetupIntent not available' });
//     //   }
//     //   try {
//     //     if (setup.metadata?.subscription_id !== sub.id) {
//     //       await stripe.setupIntents.update(setup.id, {
//     //         metadata: {
//     //           subscription_id: sub.id,
//     //           customer_id: customer.id,
//     //         },
//     //       });
//     //     }
//     //   } catch (err) {
//     //     console.error('⚠️  Failed to tag SetupIntent with subscription metadata', err);
//     //   }
//     //   return res.json({
//     //     clientSecret: setup.client_secret,
//     //     subscriptionId: sub.id,
//     //     intentType: 'setup',
//     //   });
//     // }

//     // 4) extract PaymentIntent for client_secret
//     let pi = sub.latest_invoice?.payment_intent || null;
//     if (!pi) {
//       const invoiceId =
//         typeof sub.latest_invoice === 'string'
//           ? sub.latest_invoice
//           : sub.latest_invoice?.id;
//       if (invoiceId) {
//         const invoice = await stripe.invoices.retrieve(invoiceId, {
//           expand: ['payment_intent'],
//         });
//         pi = invoice.payment_intent;
//         log('Re-fetched invoice for PI', { invoice: invoice.id, pi: pi?.id });
//       }
//     }
//     if (!pi) return res.status(500).json({ error: 'PaymentIntent not available' });

//     return res.json({
//       clientSecret: pi.client_secret,
//       subscriptionId: sub.id,
//       intentType: 'payment',
//     });
//   } catch (err) {
//     console.error('❌ /create-subscription-intent error:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
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
      success_url: `${successBase}/pages/kit-offer.html?session_id={CHECKOUT_SESSION_ID}`,
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
  const baseSubCfg = {
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

log('Subscription create config', { ...baseSubCfg, customer: customer.id });
    const { subscription: sub, customer: activeCustomer } =
      await createSubscriptionWithRetry(customer, baseSubCfg, email, ccy);
    if (activeCustomer.id !== customer.id) {
      log('Reassigned customer for currency isolation', {
        previous: customer.id,
        replacement: activeCustomer.id,
        currency: ccy,
         });
           }
    log('Subscription', { id: sub.id, status: sub.status });

// 4) extract PaymentIntent for client_secret with resilient fallbacks
    const pi = await resolvePaymentIntent(sub);
    if (!pi) return res.status(500).json({ error: 'PaymentIntent not available' });
    
 return res.json({
      clientSecret: pi.client_secret,
      subscriptionId: sub.id,
      intentType: 'payment',
    });
  } catch (err) {
    console.error('❌ /create-subscription-intent error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function resolvePaymentIntent(sub) {
  const latestInvoice = sub.latest_invoice;

  let pi = await inflatePaymentIntent(latestInvoice?.payment_intent);
  if (pi) return pi;

  const invoiceId =
    typeof latestInvoice === 'string' ? latestInvoice : latestInvoice?.id;

  if (invoiceId) {
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ['payment_intent'],
    });
    pi = await inflatePaymentIntent(invoice.payment_intent);
    if (pi) {
      log('Re-fetched invoice for PI', { invoice: invoice.id, pi: pi?.id });
      return pi;
    }
  }

  const refreshed = await stripe.subscriptions.retrieve(sub.id, {
    expand: ['latest_invoice.payment_intent'],
  });

  const refreshedInvoice = refreshed.latest_invoice;
  pi = await inflatePaymentIntent(refreshedInvoice?.payment_intent);
  if (pi) {
    log('Re-retrieved subscription for PI', {
      subscription: refreshed.id,
      invoice:
        typeof refreshedInvoice === 'string'
          ? refreshedInvoice
          : refreshedInvoice?.id,
      pi: pi?.id,
    });
    return pi;
  }

  return null;
}

async function inflatePaymentIntent(piLike) {
  if (!piLike) return null;

  if (typeof piLike === 'string') {
    const pi = await stripe.paymentIntents.retrieve(piLike);
    log('Expanded PI from string ref', { pi: pi?.id });
    return pi;
  }

  if (piLike.id && !piLike.client_secret) {
    const pi = await stripe.paymentIntents.retrieve(piLike.id);
    log('Expanded PI missing client_secret', { pi: pi?.id });
    return pi;
  }

  return piLike;
}

async function createSubscriptionWithRetry(customer, baseConfig, email, currency) {
  try {
    const subscription = await stripe.subscriptions.create({
      ...baseConfig,
      customer: customer.id,
    });

    return { subscription, customer };
  } catch (err) {
    if (isCurrencyMixingError(err)) {
      console.warn('⚠️ Currency mismatch detected, creating a fresh customer');
      const newCustomer = await stripe.customers.create({
        email,
        metadata: {
          currency_isolation_for: currency,
          replaced_customer: customer.id,
        },
      });
      log('Created isolated customer for currency', {
        requestedCurrency: currency,
        originalCustomer: customer.id,
        replacementCustomer: newCustomer.id,
      });

      const subscription = await stripe.subscriptions.create({
        ...baseConfig,
        customer: newCustomer.id,
      });

      return { subscription, customer: newCustomer };
    }

    throw err;
  }
}

function isCurrencyMixingError(err) {
  return (
    err?.type === 'StripeInvalidRequestError' &&
    typeof err.message === 'string' &&
    err.message.toLowerCase().includes('combine currencies')
  );
}

module.exports = router;
