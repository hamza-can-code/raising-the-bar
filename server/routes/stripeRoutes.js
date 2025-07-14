// server/routes/stripeRoutes.js
const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY,
  { apiVersion: '2024-04-10' }    // or any version ≥ 2022-08-01
);

console.log('🔐 Stripe key in use:', process.env.STRIPE_SECRET_KEY);

// const FRONTEND_URL = process.env.FRONTEND_URL;

/* ─── Stripe Price IDs (from your .env) ───────────────────── */
const PRICE = {
  '1-week': process.env.PRICE_1_WEEK,
  '4-week': process.env.PRICE_4_WEEK,
  '12-week': process.env.PRICE_12_WEEK,
  'subscription': process.env.FULL_PRICE_ID          // Pro-Tracker sub
};

const COUPON_ID = process.env.COUPON_ID;             // £9.99-first-month

/* ─── Helper → build the Checkout session config ─────────── */
function buildCheckoutConfig({ plan, discounted, email, origin }) {
  const FRONTEND_URL = process.env.FRONTEND_URL || origin;
  console.log('✅ BUILDING CHECKOUT: FRONTEND_URL is:', FRONTEND_URL);
  if (!PRICE[plan]) throw new Error(`Unknown plan: ${plan}`);

  const isSub = plan === 'subscription';

  console.log('🧾 Stripe Checkout → plan:', plan);
  console.log('💸 Using price ID:', PRICE[plan]);

  const config = {
    payment_method_types: ['card', 'klarna'],
    mode: isSub ? 'subscription' : 'payment',
    customer_email: email,
    line_items: [{ price: PRICE[plan], quantity: 1 }],

    success_url: `${process.env.FRONTEND_URL}/pages/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/pages/offer.html`

  };

  // Intro discount applies only to the subscription
  if (isSub && discounted) {
    config.discounts = [{ coupon: COUPON_ID }];
  }
  return config;
}

/* ─── POST  /api/create-checkout-session ─────────────────── */
router.post('/create-checkout-session', express.json(), async (req, res) => {
  try {
    const { plan, discounted = false, email } = req.body;

    const origin = req.get('origin');
    const sessionConfig = buildCheckoutConfig({ plan, discounted, email, origin });

    console.log('🚨 FINAL CHECKOUT CONFIG:', sessionConfig);
    console.log('⏱️  Creating checkout session with:', sessionConfig);
    const session = await stripe.checkout.sessions.create(sessionConfig);

    /* ─── POST /api/send-confirmation ─────────────────── */
    const User = require('../models/User');
    const UserAccess = require('../models/UserAccess');

    router.post('/send-confirmation', express.json(), async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });

      try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const access = await UserAccess.findOne({ userId: user._id });
        if (!access) return res.status(404).json({ error: 'Purchase not found' });

        // Prepare dynamic email data
        const confirmationData = {
          firstName: user.firstName || '',
          productName: access.productName || 'Your Product',
          productPrice: access.productPrice ? `£${access.productPrice.toFixed(2)}` : '',
          purchaseDate: access.purchaseDate
            ? access.purchaseDate.toLocaleDateString()
            : '',
        };

        // Simulate sending (you’ll connect this to Brevo API later)
        console.log('💌 Order confirmation data:', confirmationData);

        res.json({ success: true, data: confirmationData });
      } catch (err) {
        console.error('❌ Error sending confirmation:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// success_url: `${FRONTEND_URL}/pages/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
// cancel_url: `${FRONTEND_URL}/pages/offer.html`

/* POST  /api/create-subscription-intent  – Stripe Elements subscription */
// server/routes/stripeRoutes.js  – ONLY the create-subscription-intent route
const util = require('util');
function log(label, obj) {
  console.log(`🟡 ${label}`, util.inspect(obj, { depth: 3, colors: true }));
}

router.post('/create-subscription-intent', express.json(), async (req, res) => {
  console.log('\n───────── /create-subscription-intent ─────────');
  try {
    const { email, discounted = false } = req.body;
    log('1️⃣ incoming payload', req.body);
    if (!email) return res.status(400).json({ error: 'Email required' });

    /* 2 — customer */
    const [existing] = await stripe.customers.list({ email, limit: 1 }).then(r => r.data);
    const customer = existing || await stripe.customers.create({ email });
    log('2️⃣ customer', customer.id);

    /* 3 — subscription */
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.FULL_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',   // ✅ keep nested stuff simple
        payment_method_types: ['card'],
      },

      ...(discounted && { discounts: [{ coupon: process.env.COUPON_ID }] }),
      expand: ['latest_invoice.payment_intent']           // ask for PI right away
    });
    log('3️⃣ subscription', sub.id);

    /* 4 — grab the PI (may still be missing on very first response) */
    let pi = sub.latest_invoice.payment_intent;
    if (!pi) {
      const invoice = await stripe.invoices.retrieve(
        sub.latest_invoice.id,
        { expand: ['payment_intent'] }
      );
      pi = invoice.payment_intent;
      log('4️⃣ re-fetched invoice', invoice.id);
    }

    if (!pi) {
      return res.status(500).json({ error: 'Stripe failed to attach PaymentIntent' });
    }

    console.log('✅ 5️⃣ returning clientSecret');
    res.json({ clientSecret: pi.client_secret, subscriptionId: sub.id });

  } catch (err) {
    console.error('❌ Stripe threw', err);
    res.status(500).json({ error: err.message });
  }
});
