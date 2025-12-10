// server/routes/connectRoutes.js
const express = require('express');
const Stripe = require('stripe');

const CreatorPartner = require('../models/CreatorPartner');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
const router = express.Router();

function requireConnectAdmin(req, res, next) {
  const adminSecret = process.env.CONNECT_ADMIN_SECRET;
  if (!adminSecret) {
    return res.status(500).json({ error: 'CONNECT_ADMIN_SECRET not configured' });
  }

  if (req.headers['x-connect-admin-secret'] !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized for Connect administration' });
  }

  return next();
}

function appendSlugParam(url, slug) {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('slug', slug);
    return parsed.toString();
  } catch (err) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}slug=${encodeURIComponent(slug)}`;
  }
}

function normalizePercent(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 0), 100);
}

router.post('/creators', express.json(), requireConnectAdmin, async (req, res) => {
  try {
    const {
      slug,
      name,
      email,
      country = 'US',
      introFeePercent = 50,
      ongoingFeePercent = 50,
      metadata = {},
      refreshUrl,
      returnUrl,
    } = req.body || {};

    if (!slug || !name || !email) {
      return res.status(400).json({ error: 'slug, name, and email are required' });
    }

    const normalizedSlug = slug.trim().toLowerCase();

    let creator = await CreatorPartner.findOne({ slug: normalizedSlug });
    let stripeAccountId = creator?.stripeAccountId || null;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: country.toUpperCase(),
        email,
        business_profile: {
          product_description: 'Fitness subscriptions and coaching revenue share',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;
    }

    const platformIntroFeePercent = normalizePercent(introFeePercent, creator?.platformIntroFeePercent || 50);
    const platformOngoingFeePercent = normalizePercent(
      ongoingFeePercent,
      creator?.platformOngoingFeePercent || platformIntroFeePercent,
    );

    creator = await CreatorPartner.findOneAndUpdate(
      { slug: normalizedSlug },
      {
        name,
        slug: normalizedSlug,
        email,
        stripeAccountId,
        platformIntroFeePercent,
        platformOngoingFeePercent,
        defaultCurrency: (country || 'US').toUpperCase(),
        active: true,
        metadata,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

const onboardingLink = await stripe.accountLinks.create({
  account: stripeAccountId,
  type: 'account_onboarding',
  refresh_url:
    refreshUrl
    || process.env.CONNECT_ONBOARDING_REFRESH_URL
    || `${process.env.FRONTEND_URL || ''}/creator/onboarding/refresh`,
  return_url:
    returnUrl
    || process.env.CONNECT_ONBOARDING_RETURN_URL
    || `${process.env.FRONTEND_URL || ''}/creator/onboarding/complete`,
});

    return res.json({ creator, onboardingLink: onboardingLink.url });
  } catch (err) {
    console.error('❌ Connect creator upsert failed', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/creators/:slug/onboarding-link', express.json(), async (req, res) => {
  try {
    const normalizedSlug = req.params.slug?.trim().toLowerCase();

    if (!normalizedSlug) {
      return res.status(400).json({ error: 'A creator slug is required' });
    }

    const creator = await CreatorPartner.findOne({ slug: normalizedSlug, active: true });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    if (!creator.stripeAccountId) {
      return res.status(400).json({ error: 'Creator is missing a Stripe account' });
    }

    const refreshBase =
      req.body?.refreshUrl ||
      process.env.CONNECT_ONBOARDING_REFRESH_URL ||
      `${process.env.FRONTEND_URL || ''}/pages/creator-onboarding.html`;

    const returnBase =
      req.body?.returnUrl ||
      process.env.CONNECT_ONBOARDING_RETURN_URL ||
      `${process.env.FRONTEND_URL || ''}/pages/creator-onboarding-success.html`;

    const refreshUrl = appendSlugParam(refreshBase, normalizedSlug);
    const returnUrl = appendSlugParam(returnBase, normalizedSlug);

    const onboardingLink = await stripe.accountLinks.create({
      account: creator.stripeAccountId,
      type: 'account_onboarding',
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });

    return res.json({ creator, onboardingLink: onboardingLink.url });
  } catch (err) {
    console.error('❌ Public onboarding link creation failed', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/creators/:slug/login-link', express.json(), requireConnectAdmin, async (req, res) => {
  try {
    const normalizedSlug = req.params.slug.trim().toLowerCase();
    const creator = await CreatorPartner.findOne({ slug: normalizedSlug, active: true });

    if (!creator?.stripeAccountId) {
      return res.status(404).json({ error: 'Creator not found or missing Stripe account' });
    }

    const loginLink = await stripe.accounts.createLoginLink(creator.stripeAccountId, {
      redirect_url: req.body?.redirectUrl,
    });

    return res.json({ creator, loginLink: loginLink.url });
  } catch (err) {
    console.error('❌ Connect login link failed', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
