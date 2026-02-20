const express = require('express');
const Stripe = require('stripe');

const router = express.Router();

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: '2024-04-10' })
  : null;

function dayKeyFromUnix(unixSeconds) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

function formatCurrency(minorUnits, currency) {
  return Number(((minorUnits || 0) / 100).toFixed(2));
}

router.get('/creator-analytics/:slug', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY to enable analytics.',
    });
  }

  const slug = String(req.params.slug || '').trim().toLowerCase();
  const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);

  if (!slug) {
    return res.status(400).json({ error: 'Creator slug is required.' });
  }

  try {
    const sinceUnix = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
    const dayBuckets = new Map();

    const sessions = [];
    await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: sinceUnix },
      expand: ['data.total_details'],
    }).autoPagingEach((item) => {
      sessions.push(item);
    });

    const creatorSessions = sessions.filter((s) => {
      const creatorSlug = String(s.metadata?.creator_slug || '').toLowerCase();
      return creatorSlug === slug;
    });

    const visitCount = creatorSessions.length;
    const customerSignups = new Set();
    let paidConversions = 0;
    let grossRevenueMinor = 0;
    let currency = 'GBP';

    creatorSessions.forEach((session) => {
      const day = dayKeyFromUnix(session.created);
      if (!dayBuckets.has(day)) {
        dayBuckets.set(day, {
          date: day,
          checkoutVisits: 0,
          paidConversions: 0,
          grossRevenue: 0,
          emailSignups: 0,
        });
      }

      const bucket = dayBuckets.get(day);
      bucket.checkoutVisits += 1;

      const customerId = String(session.customer || '').trim();
      const email = String(session.customer_details?.email || session.customer_email || '').trim().toLowerCase();
      const signupKey = customerId || email;

      if (signupKey && !customerSignups.has(signupKey)) {
        customerSignups.add(signupKey);
        bucket.emailSignups += 1;
      }

      const isPaid = session.payment_status === 'paid';
      if (isPaid) {
        paidConversions += 1;
        const amountTotal = Number(session.amount_total || 0);
        grossRevenueMinor += amountTotal;
        bucket.paidConversions += 1;
        bucket.grossRevenue += formatCurrency(amountTotal, session.currency);
      }

      if (session.currency) currency = String(session.currency).toUpperCase();
    });

    const subscriptions = [];
    await stripe.subscriptions.list({
      limit: 100,
      status: 'all',
      created: { gte: sinceUnix },
    }).autoPagingEach((item) => {
      subscriptions.push(item);
    });

    const creatorSubscriptions = subscriptions.filter((sub) =>
      String(sub.metadata?.creator_slug || '').toLowerCase() === slug
    );

    const activeSubscriptions = creatorSubscriptions.filter((sub) =>
      ['active', 'trialing', 'past_due'].includes(sub.status)
    );

    const monthlyRecurringMinor = activeSubscriptions.reduce((sum, sub) => {
      const item = sub.items?.data?.[0];
      const interval = item?.price?.recurring?.interval;
      const intervalCount = Number(item?.price?.recurring?.interval_count || 1);
      const unit = Number(item?.price?.unit_amount || 0);

      if (interval === 'month') return sum + (unit / intervalCount);
      if (interval === 'year') return sum + (unit / (12 * intervalCount));
      return sum;
    }, 0);

    const timeseries = Array.from(dayBuckets.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const emailSignups = customerSignups.size;
    const conversionRate = visitCount ? (paidConversions / visitCount) * 100 : 0;

    return res.json({
      creator: slug,
      rangeDays: days,
      currency,
      summary: {
        checkoutVisits: visitCount,
        emailSignups,
        paidConversions,
        conversionRate: Number(conversionRate.toFixed(1)),
        grossRevenue: formatCurrency(grossRevenueMinor, currency),
        estimatedMrr: formatCurrency(monthlyRecurringMinor, currency),
        activeSubscriptions: activeSubscriptions.length,
      },
      timeseries,
      notes: [
        'Email signups are counted from unique Stripe customers (fallback: unique customer email on checkout sessions).',
        'Page visits currently represent checkout-session visits. For top-of-funnel landing-page visits, use GA4 Data API and merge with this endpoint.',
      ],
    });
  } catch (error) {
    console.error('Creator analytics error:', error);
    return res.status(500).json({ error: 'Failed to load creator analytics.' });
  }
});

module.exports = router;
