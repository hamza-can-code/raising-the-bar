// server/routes/stripeRoutes.js
const express = require('express');
const Stripe  = require('stripe');
const router  = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL;

/* ─── Stripe Price IDs (from your .env) ───────────────────── */
const PRICE = {
  '1-week'      : process.env.PRICE_1_WEEK,
  '4-week'      : process.env.PRICE_4_WEEK,
  '12-week'     : process.env.PRICE_12_WEEK,
  'subscription': process.env.FULL_PRICE_ID          // Pro-Tracker sub
};

const COUPON_ID = process.env.COUPON_ID;             // £9.99-first-month

/* ─── Helper → build the Checkout session config ─────────── */
function buildCheckoutConfig({ plan, discounted, email }) {
  if (!PRICE[plan]) throw new Error(`Unknown plan: ${plan}`);

  const isSub  = plan === 'subscription';

  const config = {
    payment_method_types: ['card'],
    mode        : isSub ? 'subscription' : 'payment',
    customer_email: email,
    line_items  : [{ price: PRICE[plan], quantity: 1 }],
    success_url : `${FRONTEND_URL}/pages/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url  : `${FRONTEND_URL}/pages/offer.html`
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

    const sessionConfig = buildCheckoutConfig({ plan, discounted, email });

    console.log('⏱️  Creating checkout session with:', sessionConfig);
    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
