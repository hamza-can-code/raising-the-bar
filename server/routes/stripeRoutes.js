// server/routes/stripeRoutes.js
const express = require('express');
const Stripe = require('stripe');
const util = require('util');

const { protect } = require('../middleware/auth');
const UserAccess = require('../models/UserAccess');

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

const FRONTEND_URL = process.env.FRONTEND_URL;

function parseMinorUnit(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

const BONUS_PRICE_MINOR = {
  GBP: parseMinorUnit(process.env.BONUS_PRICE_MINOR_GBP ?? process.env.BONUS_PRICE_GBP, 1999),
  USD: parseMinorUnit(process.env.BONUS_PRICE_MINOR_USD ?? process.env.BONUS_PRICE_USD, 2499),
  EUR: parseMinorUnit(process.env.BONUS_PRICE_MINOR_EUR ?? process.env.BONUS_PRICE_EUR, 2299),
};

const BONUS_PRODUCT_DESCRIPTION =
  process.env.BONUS_PRODUCT_DESCRIPTION || 'Raising The Bar bonus upgrade';

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

function pickBonusCurrency(input) {
  const code = (input || 'GBP').toUpperCase();
  if (BONUS_PRICE_MINOR[code]) return code;
  return BONUS_PRICE_MINOR.GBP ? 'GBP' : Object.keys(BONUS_PRICE_MINOR).find(c => BONUS_PRICE_MINOR[c]) || 'GBP';
}

function getBonusAmount(currencyCode) {
  const currency = pickBonusCurrency(currencyCode);
  const amount = BONUS_PRICE_MINOR[currency];
  if (!amount) {
    throw new Error(`Missing BONUS price configuration for currency ${currency}`);
  }
  return { currency, amount };
}

async function ensureStripeCustomer(email) {
  const existing = await stripe.customers.list({
    email,
    limit: 1,
    expand: ['data.invoice_settings.default_payment_method'],
  });
  if (existing.data.length) return existing.data[0];
  return stripe.customers.create({ email });
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
    const couponId = discounted ? null : getCouponId(ccy);

    const sessionCfg = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: client_reference_id || undefined,
      success_url: `${successBase}/pages/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}/pages/offer.html`,

      // ✅ Always force card entry, even if trial
      payment_method_collection: 'always',
      customer_creation: 'always',

      subscription_data: {
        trial_period_days: discounted ? 1 : undefined, // only if you want a trial
        payment_settings: { save_default_payment_method: 'on_subscription' },
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      },

      metadata: {
        product: '12-Week Plan',
        currency_used: ccy,
        discounted: String(!!discounted),
      },
    };


    if (discounted) {
      sessionCfg.subscription_data = { trial_period_days: 1 };
      sessionCfg.payment_method_collection = 'always';
    }

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
    const couponId = discounted ? null : getCouponId(ccy);

    // 3) create subscription in incomplete state (for Elements confirmation)
    const subCfg = {
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
      metadata: {
        product: '12-Week Plan',
        currency_used: ccy,
        discounted: String(!!discounted),
      },
    };

    if (discounted) {
      subCfg.trial_period_days = 1;
    }


    log('Subscription create config', subCfg);
    const sub = await stripe.subscriptions.create(subCfg);
    log('Subscription', { id: sub.id, status: sub.status });

    if (discounted) {
      const setup =
        typeof sub.pending_setup_intent === 'string'
          ? await stripe.setupIntents.retrieve(sub.pending_setup_intent)
          : sub.pending_setup_intent;
      if (!setup) {
        return res.status(500).json({ error: 'SetupIntent not available' });
      }
      try {
        if (setup.metadata?.subscription_id !== sub.id) {
          await stripe.setupIntents.update(setup.id, {
            metadata: {
              subscription_id: sub.id,
              customer_id: customer.id,
            },
          });
        }
      } catch (err) {
        console.error('⚠️  Failed to tag SetupIntent with subscription metadata', err);
      }
      return res.json({
        clientSecret: setup.client_secret,
        subscriptionId: sub.id,
        intentType: 'setup',
      });
    }

    // 4) extract PaymentIntent for client_secret
    let pi = sub.latest_invoice?.payment_intent || null;
    if (!pi) {
      const invoiceId =
        typeof sub.latest_invoice === 'string'
          ? sub.latest_invoice
          : sub.latest_invoice?.id;
      if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId, {
          expand: ['payment_intent'],
        });
        pi = invoice.payment_intent;
        log('Re-fetched invoice for PI', { invoice: invoice.id, pi: pi?.id });
      }
    }
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

router.post('/upsell/bonus', protect, async (req, res) => {
  try {
    if (!req.user?.email) {
      return res.status(400).json({ error: 'User email required to charge bonus.' });
    }

    const { sessionId, currency: currencyHint, source, setupIntentId } = req.body || {};
    console.log('\n───────── /upsell/bonus ─────────');
    log('Bonus request body', req.body);
    log('Bonus user', { id: req.user._id || req.user.id, email: req.user.email });
    const { currency, amount } = getBonusAmount(currencyHint);

    let customer = await ensureStripeCustomer(req.user.email);
    customer = await stripe.customers.retrieve(customer.id, {
      expand: ['invoice_settings.default_payment_method'],
    });
    log('Bonus customer', {
      id: customer.id,
      email: customer.email,
      default_payment_method:
        typeof customer.invoice_settings?.default_payment_method === 'string'
          ? customer.invoice_settings.default_payment_method
          : customer.invoice_settings?.default_payment_method?.id,
    });

    let customerId = customer.id;

    let paymentMethodId = customer.invoice_settings?.default_payment_method || null;
    if (paymentMethodId && typeof paymentMethodId !== 'string') {
      paymentMethodId = paymentMethodId.id;
    }

       if (!paymentMethodId && setupIntentId) {
      try {
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
          expand: ['payment_method'],
        });

        const setupPaymentMethodId =
          typeof setupIntent.payment_method === 'string'
            ? setupIntent.payment_method
            : setupIntent.payment_method?.id;

        const setupCustomerId =
          typeof setupIntent.customer === 'string'
            ? setupIntent.customer
            : setupIntent.customer?.id;

        log('Reused setup intent', {
          id: setupIntent.id,
          status: setupIntent.status,
          setupCustomerId,
          setupPaymentMethodId,
        });

        if (setupCustomerId && setupCustomerId !== customerId) {
          console.warn(
            '⚠️  Setup intent customer differs from looked-up customer. Switching to setup intent customer for bonus.',
            { setupCustomerId, lookedUpCustomerId: customerId }
          );
          customerId = setupCustomerId;
          customer = await stripe.customers.retrieve(customerId, {
            expand: ['invoice_settings.default_payment_method'],
          });
          paymentMethodId = customer.invoice_settings?.default_payment_method || null;
          if (paymentMethodId && typeof paymentMethodId !== 'string') {
            paymentMethodId = paymentMethodId.id;
          }
        }

        if (setupIntent.status === 'succeeded' && setupPaymentMethodId && setupCustomerId === customerId) {
          try {
            await stripe.paymentMethods.attach(setupPaymentMethodId, {
              customer: customerId,
            });
          } catch (attachErr) {
            if (attachErr.code !== 'resource_already_exists') {
              throw attachErr;
            }
          }

          await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: setupPaymentMethodId },
          });

          paymentMethodId = setupPaymentMethodId;
        }
      } catch (setupErr) {
        console.error(
          '⚠️  Failed to reuse setup intent for bonus payment',
          setupIntentId,
          setupErr.message
        );
      }
    }

    if (!paymentMethodId) {
      const pmList = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 5,
      });
      log('Available payment methods', pmList.data.map(pm => ({ id: pm.id, customer: pm.customer })));
      paymentMethodId = pmList.data[0]?.id || null;
    }

    if (!paymentMethodId) {
            console.warn('⚠️  No payment method on file for bonus charge', {
        customerId,
        email: req.user.email,
        setupIntentId,
      });
      return res.status(409).json({
        error: 'no_payment_method',
        message: 'No saved card found. Please update your payment method before adding the bonus.',
      });
    }

    const idempotencyKey = sessionId ? `bonus-${sessionId}` : undefined;
    const intentConfig = {
      amount,
      currency: currency.toLowerCase(),
      customer: customerId,
      confirm: true,
      off_session: true,
      payment_method: paymentMethodId,
      description: BONUS_PRODUCT_DESCRIPTION,
      metadata: {
        upsell: 'bonus',
        userId: req.user._id?.toString?.() || req.user.id,
        email: req.user.email,
        sessionId: sessionId || '',
        source: source || 'payment-success',
      },
    };

        log('Bonus payment intent config', {
      ...intentConfig,
      metadata: undefined,
      amountDecimal: Number((amount / 100).toFixed(2)),
    });

    const intent = await stripe.paymentIntents.create(
      intentConfig,
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    if (intent.status !== 'succeeded') {
            console.warn('⚠️  Bonus payment intent requires action', {
        intentId: intent.id,
        status: intent.status,
        customerId,
      });
      return res.status(202).json({
        success: false,
        status: intent.status,
        message: 'The saved card needs an additional check. Please update your payment method in the dashboard.',
      });
    }

    if (!req.user.purchases) req.user.purchases = {};
    if (!req.user.purchases.bonus) {
      req.user.purchases.bonus = true;
      req.user.markModified?.('purchases');
      await req.user.save();
    }

    const amountDecimal = Number((amount / 100).toFixed(2));
    await UserAccess.findOneAndUpdate(
      { userId: req.user._id || req.user.id },
      {
        $set: {
          hasBonusAccess: true,
          bonusGrantedAt: new Date(),
          bonusPaymentIntentId: intent.id,
          bonusAmount: amountDecimal,
          bonusCurrency: currency,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

        console.log('✅ Bonus payment captured', {
      intentId: intent.id,
      customerId,
      amount,
      currency,
      userId: req.user._id || req.user.id,
    });

    return res.json({
      success: true,
      intentId: intent.id,
      redirectUrl: '/pages/dashboard.html?bonus=1',
    });
  } catch (err) {
    console.error('❌ /upsell/bonus error', err);

    if (err?.type === 'StripeCardError' || err?.code === 'authentication_required') {
      return res.status(402).json({
        error: err.code || 'card_error',
        message: 'Your bank needs extra approval. Please open your dashboard to approve the payment.',
      });
    }

    res.status(500).json({ error: err.message || 'Failed to process bonus payment.' });
  }
});

module.exports = router;
