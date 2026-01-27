// server/routes/stripeRoutes.js
const express = require('express');
const Stripe = require('stripe');
const util = require('util');

const { protect } = require('../middleware/auth');
const UserAccess = require('../models/UserAccess');
const CreatorPartner = require('../models/CreatorPartner');
const { normalizeCurrencyCode, SUPPORTED_CURRENCIES } = require('../utils/currency');

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

// console.log('[Stripe init] key =', process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL;

function parseMinorUnit(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

const BONUS_PRICE_MINOR = {
  GBP: parseMinorUnit(process.env.BONUS_PRICE_MINOR_GBP ?? process.env.BONUS_PRICE_GBP, 999),
  USD: parseMinorUnit(process.env.BONUS_PRICE_MINOR_USD ?? process.env.BONUS_PRICE_USD, 1499),
  EUR: parseMinorUnit(process.env.BONUS_PRICE_MINOR_EUR ?? process.env.BONUS_PRICE_EUR, 1299),
};

const BONUS_PRODUCT_DESCRIPTION =
  process.env.BONUS_PRODUCT_DESCRIPTION || 'Raising The Bar bonus upgrade';

async function resolveCreator(creatorSlug) {
  if (!creatorSlug) return null;

  const slug = creatorSlug.trim().toLowerCase();
  const PLATFORM_ONLY_CREATORS = new Set(['ironverse']);

  const platformOnlyCreator = () => ({
    creator: {
      name: slug,
      slug,
      defaultCurrency: 'GBP',
      active: true,
      metadata: {},
    },
    destination: null,
    introFeePercent: 0,
    ongoingFeePercent: 0,
    source: 'platform-only',
  });
  const normalizePercent = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, 0), 100);
  };

  const staticEnvKey = (suffix) => {
    const safeSlug = slug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return process.env[`CREATOR_${safeSlug}_${suffix}`];
  };

  const envCreator = (() => {
    const stripeAccountId = staticEnvKey('STRIPE_ACCOUNT_ID');
    if (!stripeAccountId) return null;

    const introFeePercent = normalizePercent(staticEnvKey('PLATFORM_INTRO_FEE_PERCENT'), 50);
    const ongoingFeePercent = normalizePercent(
      staticEnvKey('PLATFORM_ONGOING_FEE_PERCENT'),
      introFeePercent,
    );

    return {
      name: staticEnvKey('NAME') || slug,
      slug,
      stripeAccountId,
      platformIntroFeePercent: introFeePercent,
      platformOngoingFeePercent: ongoingFeePercent,
      defaultCurrency: normalizeCurrencyCode(staticEnvKey('DEFAULT_CURRENCY'), 'GBP'),
      active: true,
      metadata: {},
      source: 'env',
    };
  })();

  const creator = await CreatorPartner.findOne({ slug, active: true }).lean();
  const resolved = creator || envCreator;

  if (!resolved) {
    if (PLATFORM_ONLY_CREATORS.has(slug)) return platformOnlyCreator();
    throw new Error(`Creator ${slug} is not registered or inactive`);
  }

  if (!resolved.stripeAccountId) {
    if (PLATFORM_ONLY_CREATORS.has(slug)) return platformOnlyCreator();
    throw new Error(`Creator ${slug} is missing a Stripe account`);
  }

  const introFeePercent = Number.isFinite(resolved.platformIntroFeePercent)
    ? resolved.platformIntroFeePercent
    : 50;

  const ongoingFeePercent = Number.isFinite(resolved.platformOngoingFeePercent)
    ? resolved.platformOngoingFeePercent
    : introFeePercent;

  const defaultCurrency = normalizeCurrencyCode(resolved.defaultCurrency, 'GBP');

  return {
    creator: { ...resolved, defaultCurrency },
    destination: resolved.stripeAccountId,
    introFeePercent,
    ongoingFeePercent,
    source: resolved.source || (creator ? 'database' : 'env'),
  };
}

/* ──────────────────────────────────────────────────────────
   Currency-aware Price & Coupon selection
   - Keep only the currencies you actually configured
   - Add/remove keys freely; fallback is GBP
   ────────────────────────────────────────────────────────── */
function buildPriceMap(prefix, currencies = SUPPORTED_CURRENCIES, { suffix = '' } = {}) {
  const map = {};

  currencies.forEach(code => {
    const envKey = `${prefix}_${code}${suffix}`;
    if (process.env[envKey]) map[code] = process.env[envKey];
  });

  const gbpKey = `${prefix}_GBP${suffix}`;
  if (!map.GBP && process.env[gbpKey]) map.GBP = process.env[gbpKey];

  const baseKey = `${prefix}${suffix}`;
  if (!map.GBP && process.env[baseKey]) map.GBP = process.env[baseKey];

  return map;
}

const PLAN_PRICE_IDS = {
  trial: buildPriceMap('PRICE_TRIAL_UPFRONT'),
  '4-week': buildPriceMap('PRICE_FOUR_WEEK'),
  '12-week': buildPriceMap('PRICE_TWELVE_WEEK'),
};

const PLAN_BUNDLE_PRICE_IDS = {
  'creator-platform': {
    activation: buildPriceMap('PRICE_CREATOR_PLATFORM_ACTIVATION'),
    recurring: buildPriceMap('PRICE_CREATOR_PLATFORM_SUBSCRIPTION'),
  },
};

const PLAN_COUPONS = {
  '4-week': { GBP: process.env.COUPON_FOUR_WEEK_GBP },
  '12-week': { GBP: process.env.COUPON_TWELVE_WEEK_GBP },
  'creator-platform': { GBP: process.env.COUPON_CREATOR_PLATFORM_GBP },
};

const CREATOR_PLAN_PRICE_IDS = {
  decoded: {
    trial: buildPriceMap('PRICE_TRIAL_UPFRONT', SUPPORTED_CURRENCIES, { suffix: '_DECODED' }),
    '4-week': buildPriceMap('PRICE_FOUR_WEEK', SUPPORTED_CURRENCIES, { suffix: '_DECODED' }),
    '12-week': buildPriceMap('PRICE_TWELVE_WEEK', SUPPORTED_CURRENCIES, { suffix: '_DECODED' }),
  },
  vital: {
    trial: buildPriceMap('PRICE_TRIAL_UPFRONT', SUPPORTED_CURRENCIES, { suffix: '_VITAL' }),
    '4-week': buildPriceMap('PRICE_FOUR_WEEK', SUPPORTED_CURRENCIES, { suffix: '_VITAL' }),
    '12-week': buildPriceMap('PRICE_TWELVE_WEEK', SUPPORTED_CURRENCIES, { suffix: '_VITAL' }),
  },
  ironverse: {
    trial: buildPriceMap('PRICE_TRIAL_UPFRONT', SUPPORTED_CURRENCIES, { suffix: '_IRONVERSE' }),
    '4-week': buildPriceMap('PRICE_FOUR_WEEK', SUPPORTED_CURRENCIES, { suffix: '_IRONVERSE' }),
    '12-week': buildPriceMap('PRICE_TWELVE_WEEK', SUPPORTED_CURRENCIES, { suffix: '_IRONVERSE' }),
  },
};

const CREATOR_PLAN_COUPONS = {
  decoded: {
    '4-week': { GBP: process.env.COUPON_FOUR_WEEK_GBP_DECODED },
    '12-week': { GBP: process.env.COUPON_TWELVE_WEEK_GBP_DECODED },
  },
  vital: {
    '4-week': { GBP: process.env.COUPON_FOUR_WEEK_GBP_VITAL },
    '12-week': { GBP: process.env.COUPON_TWELVE_WEEK_GBP_VITAL },
  },
  ironverse: {
    '4-week': { GBP: process.env.COUPON_FOUR_WEEK_GBP_IRONVERSE },
    '12-week': { GBP: process.env.COUPON_TWELVE_WEEK_GBP_IRONVERSE },
  },
};

const PLAN_LABELS = {
  trial: '1-Week Plan',
  '4-week': '4-Week Plan',
  '12-week': '12-Week Plan',
  'creator-platform': 'Creator Platform Access',
};

const CREATOR_SUCCESS_PATHS = {
  decoded: '/pages/thank-you-decoded.html',
  kayp: '/pages/thank-you-kayp.html',
  vital: '/pages/thank-you-vital.html',
  dav: '/pages/thank-you-dav.html',
  ironverse: '/pages/thank-you-ironverse.html',
  ryan: '/pages/thank-you-ryan.html',
  ty: '/pages/thank-you-ty.html',
  nhial: '/pages/thank-you-nhial.html',
};

const CREATOR_OFFER_PATHS = {
  decoded: '/pages/offer-decoded.html',
  kayp: '/pages/offer-kayp.html',
  vital: '/pages/offer-vital.html',
  dav: '/pages/offer-dav.html',
  ironverse: '/pages/offer-ironverse.html',
  ryan: '/pages/offer-ryan.html',
  ty: '/pages/offer-ty.html',
  nhial: '/pages/offer-nhial.html',
};

function getRecurringConfigForPlan(plan) {
  if (plan === '12-week') return { interval: 'month', interval_count: 3 };
  return { interval: 'month', interval_count: 1 };
}

function log(label, obj) {
  console.log(`🟡 ${label}`, util.inspect(obj, { depth: 4, colors: true }));
}

function evaluateDestinationEligibility(account) {
  if (!account) return { eligible: false, reason: 'missing_account' };

  const caps = account.capabilities || {};
  const settlementCapable = ['transfers', 'crypto_transfers', 'legacy_payments']
    .some(cap => caps[cap] === 'active');

  if (!settlementCapable) {
    return { eligible: false, reason: 'capability_missing' };
  }

  return { eligible: true, reason: null };
}

async function fetchDestinationAccount(destination) {
  if (!destination) return { valid: false, account: null, reason: 'missing_destination' };
  try {
    const account = await stripe.accounts.retrieve(destination);
    const eligibility = evaluateDestinationEligibility(account);
    return { valid: eligibility.eligible, account, reason: eligibility.reason };
  } catch (err) {
    if (err?.code === 'resource_missing' || err?.statusCode === 404) {
      console.warn('⚠️  Invalid connect destination; falling back to platform charges.', destination);
      return { valid: false, account: null, reason: 'not_found' };
    }
    throw err;
  }
}

function normalizeCreatorSlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  const trimmed = slug.trim().toLowerCase();
  return trimmed || null;
}

function getPlanPricing(plan = 'trial', currencyCode, creatorSlug) {
  const normalizedPlan = (PLAN_PRICE_IDS[plan] || PLAN_BUNDLE_PRICE_IDS[plan]) ? plan : 'trial';
  const code = (currencyCode || 'GBP').toUpperCase();
  const creator = normalizeCreatorSlug(creatorSlug);
  const bundle = PLAN_BUNDLE_PRICE_IDS[normalizedPlan];

  if (bundle) {
    const activationPriceId = bundle.activation?.[code] || bundle.activation?.GBP || null;
    const recurringPriceId = bundle.recurring?.[code] || bundle.recurring?.GBP || null;
    if (!activationPriceId || !recurringPriceId) return null;
    return {
      currency: code,
      activationPriceId,
      recurringPriceId,
      plan: normalizedPlan,
      bundle: true,
    };
  }

  const priceMap = (creator && CREATOR_PLAN_PRICE_IDS[creator]?.[normalizedPlan])
    || PLAN_PRICE_IDS[normalizedPlan];
  const priceId = priceMap?.[code] || priceMap?.GBP || null;
  if (!priceId) return null;
  return { currency: code, priceId, plan: normalizedPlan, bundle: false };
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

function shouldFallbackToPlatform(err) {
  const msg = err?.message?.toLowerCase?.() || '';
  return (
    msg.includes('destination charge')
    || msg.includes('destination account needs to have at least one of the following capabilities enabled')
  );
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

function getCouponIdForPlan(plan, currencyCode, creatorSlug) {
  const creator = normalizeCreatorSlug(creatorSlug);
  const couponMap = (creator && CREATOR_PLAN_COUPONS[creator]?.[plan]) || PLAN_COUPONS[plan];
  if (!couponMap) return null;
  const code = (currencyCode || 'GBP').toUpperCase();
  return couponMap[code] || couponMap.GBP || null;
}

/* ──────────────────────────────────────────────────────────
   POST /api/create-checkout-session  (Stripe Checkout)
   Body: { plan: 'subscription', discounted: bool, email: string, currency?: 'USD' }
   Automatically chooses subscription or one-off payment based on price type.
   ────────────────────────────────────────────────────────── */
router.post('/create-checkout-session', express.json(), async (req, res) => {
  try {
    const {
      plan = 'trial',
      discounted = false,
      email,
      currency,          // e.g. "USD" sent by client
      client_reference_id,
      creatorSlug,
    } = req.body;

    const normalizedCreator = normalizeCreatorSlug(creatorSlug);

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const origin = req.get('origin');
    const successBase = FRONTEND_URL || origin;
    if (!successBase) {
      return res.status(500).json({ error: 'Missing FRONTEND_URL and request origin' });
    }

    const planInfo = getPlanPricing(plan, currency, normalizedCreator);
    if (!planInfo) {
      return res.status(500).json({ error: `Missing price configuration for plan ${plan} (${currency || 'GBP'})` });
    }
    const { currency: ccy, priceId, activationPriceId, recurringPriceId, plan: normalizedPlan, bundle } = planInfo;
    const price = priceId ? await stripe.prices.retrieve(priceId) : null;
    const isTrialPlan = normalizedPlan === 'trial';
    const recurringConfig = price?.recurring || getRecurringConfigForPlan(normalizedPlan);
    const sessionMode = bundle
      ? 'subscription'
      : (isTrialPlan ? 'payment' : (price?.type === 'recurring' ? 'subscription' : 'payment'));
    const couponId = discounted ? getCouponIdForPlan(normalizedPlan, ccy, creatorSlug) : null;

    let creatorConfig = null;
    let destinationValid = false;
    let destinationReason = null;
    let destinationAccount = null;
    if (normalizedCreator) {
      creatorConfig = await resolveCreator(normalizedCreator);
    }

    const successPath = normalizedCreator
      ? (CREATOR_SUCCESS_PATHS[normalizedCreator] || '/pages/plan-building.html')
      : (normalizedPlan === 'creator-platform' ? '/pages/creator-platform-thank-you.html' : '/pages/plan-building.html');

    const cancelPath = normalizedCreator
      ? (CREATOR_OFFER_PATHS[normalizedCreator] || '/pages/offer.html')
      : (normalizedPlan === 'creator-platform' ? '/pages/creator-platform-access.html' : '/pages/offer.html');

    let upgradePlanInfo = null;
    if (isTrialPlan) {
      upgradePlanInfo = getPlanPricing('4-week', currency, normalizedCreator);
      if (!upgradePlanInfo) {
        return res.status(500).json({ error: `Missing price configuration for trial renewal (4-week) (${currency || 'GBP'})` });
      }
    }
    const lineItems = bundle
      ? [
        { price: recurringPriceId, quantity: 1 },
        { price: activationPriceId, quantity: 1 },
      ]
      : [{ price: priceId, quantity: 1 }];

    const sessionCfg = {
      mode: sessionMode,
      line_items: lineItems,
      customer_email: email,
      client_reference_id: client_reference_id || undefined,
      success_url: `${successBase}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}${cancelPath}`,

      // ✅ Always force card entry for subscriptions
      ...(sessionMode === 'subscription' ? { payment_method_collection: 'always' } : {}),
      // customer_creation: 'always',

      metadata: {
        product: PLAN_LABELS[normalizedPlan] || 'Selected Plan',
        currency_used: ccy,
        discounted: String(!!discounted),
      },
    };

    if (isTrialPlan) {
      sessionCfg.metadata = {
        ...(sessionCfg.metadata || {}),
        trial_subscription: 'true',
        trial_upfront_price_id: priceId,
        trial_subscription_price_id: upgradePlanInfo.priceId,
        trial_period_days: '7',
      };
    }

    if (sessionMode === 'subscription') {
      sessionCfg.subscription_data = {
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
        ...(bundle ? { trial_period_days: 30 } : {}),
        ...(isTrialPlan ? { trial_period_days: 7 } : {}),
        trial_origin: 'checkout',
      };
    }

    if (isTrialPlan && sessionMode === 'payment') {
      sessionCfg.customer_creation = 'always';
      sessionCfg.payment_intent_data = {
        setup_future_usage: 'off_session',
        metadata: {
          ...(sessionCfg.metadata || {}),
        },
      };
    }

    if (couponId) {
      sessionCfg.discounts = [{ coupon: couponId }];
    }

    if (creatorConfig) {
      const destinationState = await fetchDestinationAccount(creatorConfig.destination);
      destinationValid = destinationState.valid;
      destinationAccount = destinationState.account;
      destinationReason = destinationState.reason;

      if (sessionMode === 'subscription') {
        const subscriptionData = {
          ...(sessionCfg.subscription_data || {}),
          metadata: {
            ...(sessionCfg.subscription_data?.metadata || {}),
            creator_slug: creatorConfig.creator.slug,
            creator_name: creatorConfig.creator.name,
            creator_source: creatorConfig.source,
            creator_default_currency: creatorConfig.creator.defaultCurrency,
            platform_intro_fee_percent: String(creatorConfig.introFeePercent),
            platform_ongoing_fee_percent: String(creatorConfig.ongoingFeePercent),
            connect_destination_valid: String(destinationValid),
            connect_destination: creatorConfig.destination || '',
            connect_destination_country: destinationAccount?.country,
            connect_destination_reason: destinationReason,
          },
        };

        if (destinationValid) {
          subscriptionData.transfer_data = { destination: creatorConfig.destination };
          subscriptionData.application_fee_percent = creatorConfig.introFeePercent;
          subscriptionData.on_behalf_of = creatorConfig.destination;
        }

        sessionCfg.subscription_data = subscriptionData;
      } else if (destinationValid) {
        sessionCfg.payment_intent_data = {
          ...(sessionCfg.payment_intent_data || {}),
          transfer_data: { destination: creatorConfig.destination },
          application_fee_amount: Math.round(
            (price.unit_amount || 0) * (creatorConfig.introFeePercent / 100)
          ),
          on_behalf_of: creatorConfig.destination,
        };
      }
      sessionCfg.metadata = {
        ...(sessionCfg.metadata || {}),
        creator_slug: creatorConfig.creator.slug,
        creator_name: creatorConfig.creator.name,
        creator_source: creatorConfig.source,
        creator_default_currency: creatorConfig.creator.defaultCurrency,
        platform_intro_fee_percent: String(creatorConfig.introFeePercent),
        platform_ongoing_fee_percent: String(creatorConfig.ongoingFeePercent),
        connect_destination: creatorConfig.destination || '',
        connect_destination_valid: String(destinationValid),
        connect_destination_country: destinationAccount?.country,
        connect_destination_reason: destinationReason,
      };
    }

    if (sessionCfg.payment_intent_data) {
      sessionCfg.payment_intent_data.metadata = {
        ...(sessionCfg.metadata || {}),
        ...(sessionCfg.payment_intent_data.metadata || {}),
      };
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
    const { email, discounted = false, currency, plan = 'trial', creatorSlug } = req.body;
    const normalizedCreator = normalizeCreatorSlug(creatorSlug);
    log('Incoming payload', req.body);
    if (!email) return res.status(400).json({ error: 'Email required' });

    // 1) find or create customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] || (await stripe.customers.create({ email }));
    log('Customer', { id: customer.id, email: customer.email });

    // 2) choose price & coupon by currency
    const planInfo = getPlanPricing(plan, currency, normalizedCreator);
    if (!planInfo) {
      return res.status(500).json({ error: `Missing price configuration for plan ${plan} (${currency || 'GBP'})` });
    }
    if (planInfo.bundle) {
      return res.status(400).json({ error: 'Selected plan is only available via Stripe Checkout.' });
    }
    const { currency: ccy, priceId, plan: normalizedPlan } = planInfo;
    const couponId = discounted ? getCouponIdForPlan(normalizedPlan, ccy, creatorSlug) : null;
    const price = await stripe.prices.retrieve(priceId);
    const productId = typeof price.product === 'string' ? price.product : price.product?.id;
    const recurringConfig = price.recurring || getRecurringConfigForPlan(normalizedPlan);

    if (!productId) {
      return res.status(500).json({ error: 'Price is missing an associated product.' });
    }
    if (!recurringConfig && normalizedPlan !== 'trial') {
      return res.status(500).json({ error: 'Recurring configuration missing for selected plan.' });
    }

    let creatorConfig = null;
    let destinationValid = false;
    let destinationReason = null;
    let destinationAccount = null;
    if (normalizedCreator) {
      creatorConfig = await resolveCreator(normalizedCreator);
    }

    if (normalizedPlan === 'trial') {
      const upgradePlanInfo = getPlanPricing('4-week', currency, normalizedCreator);
      if (!upgradePlanInfo) {
        return res.status(500).json({ error: `Missing price configuration for trial renewal (4-week) (${currency || 'GBP'})` });
      }

      const intentMetadata = {
        product: PLAN_LABELS[normalizedPlan] || 'Selected Plan',
        currency_used: ccy,
        discounted: String(!!discounted),
        trial_subscription: 'true',
        trial_upfront_price_id: priceId,
        trial_subscription_price_id: upgradePlanInfo.priceId,
        trial_period_days: '7',
        trial_origin: 'elements',
      };

      if (creatorConfig) {
        const destinationInfo = await fetchDestinationAccount(creatorConfig.destination);
        destinationValid = destinationInfo.valid;
        destinationAccount = destinationInfo.account;
        destinationReason = destinationInfo.reason;
        intentMetadata.creator_slug = creatorConfig.creator.slug;
        intentMetadata.creator_name = creatorConfig.creator.name;
        intentMetadata.creator_source = creatorConfig.source;
        intentMetadata.creator_default_currency = creatorConfig.creator.defaultCurrency;
        intentMetadata.platform_intro_fee_percent = String(creatorConfig.introFeePercent);
        intentMetadata.platform_ongoing_fee_percent = String(creatorConfig.ongoingFeePercent);
        intentMetadata.connect_intro_applied = String(destinationValid);
        intentMetadata.connect_destination_valid = String(destinationValid);
        intentMetadata.connect_destination = creatorConfig.destination || '';
        intentMetadata.connect_destination_country = destinationAccount?.country || '';
        intentMetadata.connect_destination_reason = destinationReason || '';
      }

      const intentConfig = {
        amount: price.unit_amount,
        currency: price.currency,
        customer: customer.id,
        setup_future_usage: 'off_session',
        payment_method_types: ['card'],
        metadata: intentMetadata,
      };

      if (creatorConfig && destinationValid) {
        intentConfig.transfer_data = { destination: creatorConfig.destination };
        intentConfig.application_fee_amount = Math.round(
          (price.unit_amount || 0) * (creatorConfig.introFeePercent / 100)
        );
        intentConfig.on_behalf_of = creatorConfig.destination;
      }

      log('Trial upfront payment intent config', {
        ...intentConfig,
        metadata: undefined,
      });

      const intent = await stripe.paymentIntents.create(intentConfig);
      return res.json({
        clientSecret: intent.client_secret,
        intentType: 'payment',
        connectDestination: {
          valid: destinationValid,
          reason: destinationReason,
          accountId: creatorConfig?.destination || null,
          accountCountry: destinationAccount?.country || null,
          source: creatorConfig?.source || null,
          defaultCurrency: creatorConfig?.creator?.defaultCurrency || null,
        },
      });
    }

    const subscriptionItems = price.type === 'one_time'
      ? [{
        price_data: {
          currency: price.currency,
          unit_amount: price.unit_amount,
          product: productId,
          recurring: recurringConfig,
        },
      }]
      : [{ price: priceId }];

    // 3) create subscription in incomplete state (for Elements confirmation)
    const subCfg = {
      customer: customer.id,
      items: subscriptionItems,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
      metadata: {
        product: PLAN_LABELS[normalizedPlan] || 'Selected Plan',
        currency_used: ccy,
        discounted: String(!!discounted),
      },
      coupon: couponId || undefined,
    };

    if (creatorConfig) {
      const destinationInfo = await fetchDestinationAccount(creatorConfig.destination);
      destinationValid = destinationInfo.valid;
      destinationAccount = destinationInfo.account;
      destinationReason = destinationInfo.reason;
      if (destinationValid) {
        subCfg.transfer_data = { destination: creatorConfig.destination };
        subCfg.application_fee_percent = creatorConfig.introFeePercent;
        subCfg.on_behalf_of = creatorConfig.destination;
      }
      subCfg.metadata = {
        ...(subCfg.metadata || {}),
        creator_slug: creatorConfig.creator.slug,
        creator_name: creatorConfig.creator.name,
        creator_source: creatorConfig.source,
        creator_default_currency: creatorConfig.creator.defaultCurrency,
        platform_intro_fee_percent: String(creatorConfig.introFeePercent),
        platform_ongoing_fee_percent: String(creatorConfig.ongoingFeePercent),
        connect_intro_applied: String(destinationValid),
        connect_destination_valid: String(destinationValid),
        connect_destination_country: destinationAccount?.country,
        connect_destination_reason: destinationReason,
      };
    }
    log('Subscription create config', subCfg);
    let sub;
    try {
      sub = await stripe.subscriptions.create(subCfg);
    } catch (err) {
      const needsConnectFallback = creatorConfig && subCfg.transfer_data && shouldFallbackToPlatform(err);

      if (needsConnectFallback) {
        console.warn('⚠️  Connect destination settlement failed; retrying on platform.', err.message);
        const fallbackCfg = {
          ...subCfg,
          metadata: {
            ...(subCfg.metadata || {}),
            connect_destination_fallback: 'platform_charge',
          },
        };

        delete fallbackCfg.transfer_data;
        delete fallbackCfg.application_fee_percent;
        delete fallbackCfg.on_behalf_of;

        log('Subscription fallback config', fallbackCfg);
        sub = await stripe.subscriptions.create(fallbackCfg);
      } else {
        throw err;
      }
    }
    log('Subscription', { id: sub.id, status: sub.status });

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
      connectDestination: {
        valid: destinationValid,
        reason: destinationReason,
        accountId: creatorConfig?.destination || null,
        accountCountry: destinationAccount?.country || null,
        source: creatorConfig?.source || null,
        defaultCurrency: creatorConfig?.creator?.defaultCurrency || null,
      },
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
        message: 'Please update your payment method before adding the bonus.',
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
        message: 'Your card needs an additional check. Please update your payment method.',
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
      redirectUrl: '/pages/plan-upgrade.html',
    });
  } catch (err) {
    console.error('❌ /upsell/bonus error', err);

    if (err?.type === 'StripeCardError' || err?.code === 'authentication_required') {
      return res.status(402).json({
        error: err.code || 'card_error',
        message: 'Your bank needs extra approval. Please approve the payment.',
      });
    }

    res.status(500).json({ error: err.message || 'Failed to process bonus payment.' });
  }
});

module.exports = router;
