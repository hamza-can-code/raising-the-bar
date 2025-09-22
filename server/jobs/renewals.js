// server/jobs/renewals.js
const dayjs = require('dayjs');
const Users = require('../models/User');          // ✅ one level up
const Payment = require('../models/Payment');     // ✅ one level up
const { chargeVaultInternal } = require('../payments/paypal');
const { add30Days, periodKeyFromDate } = require('../utils/billingDates');
const { sendReceiptEmail, sendDunningEmail } = require('../utils/mailer');

const MAX_RETRIES = 3; // after that, stop retrying and keep user in past_due until manual action

function buildRequestId(user, when) {
  // idempotent per user+period (avoid duplicates on retries)
  const periodKey = periodKeyFromDate(when);
  return `mip-${user._id}-${periodKey}`;
}

async function processUserRenewal(u) {
  const amount   = typeof u.renewAmount === 'number' ? u.renewAmount : 14.99;
  const currency = u.renewCurrency || 'GBP';
  const when     = u.nextRenewAt ? new Date(u.nextRenewAt) : new Date();
  const periodKey = periodKeyFromDate(when);

  const requestId = buildRequestId(u, when);

  try {
    const { order, capture } = await chargeVaultInternal({
      vault_id: u.paypal_vault_id,
      amount,
      currency,
      requestId,
      reference: `renewal-${u._id}-${periodKey}`
    });

    const captureId = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
    // Save payment record
    await Payment.create({
      userId: u._id,
      provider: 'paypal',
      amount,
      currency,
      orderId: order.id || '',
      captureId,
      periodKey,
      status: 'succeeded'
    });

    // Advance to next cycle, clear errors
await Users.updateOne(
  { _id: u._id },
  {
    $set: {
      nextRenewAt: add30Days(when),
      billingStatus: 'active',
      lastChargeError: '',
      failedRenewalAttempts: 0,
      nextRetryAt: null
    }
  }
);

    // Email receipt (non-blocking)
    sendReceiptEmail({ to: u.email, amount, currency, periodKey }).catch(() => {});
    console.log(`✓ Renewed ${u.email} for ${currency} ${amount} (${periodKey})`);
  } catch (err) {
    const errorMsg = String(err.message || err);

    const attempts = (u.failedRenewalAttempts || 0) + 1;
    // backoff schedule: 1d, 3d, 5d
    const backoffDays = attempts === 1 ? 1 : attempts === 2 ? 3 : 5;
    const nextRetryAt = dayjs().add(backoffDays, 'day').toDate();

await Users.updateOne(
  { _id: u._id },
  {
    $set: {
      billingStatus: 'past_due',
      lastChargeError: errorMsg,
      nextRetryAt
    },
    $inc: { failedRenewalAttempts: 1 }
  }
);


    await Payment.create({
      userId: u._id,
      provider: 'paypal',
      amount,
      currency,
      orderId: '',
      captureId: '',
      periodKey,
      status: 'failed',
      failureReason: errorMsg
    });

    // Dunning (non-blocking)
    sendDunningEmail({ to: u.email, amount, currency }).catch(() => {});
    console.warn(`× Renewal failed for ${u.email}: ${errorMsg}`);

    if (attempts >= MAX_RETRIES) {
      console.warn(`! Max retries reached for ${u.email}. Manual review recommended.`);
    }
  }
}

async function runRenewals() {
  const now = new Date();

  const dueUsers = await Users.find({
    billingStatus: { $ne: 'cancelled' },
    paypal_vault_id: { $exists: true, $ne: null },
    $and: [
      { $or: [ { nextRenewAt: { $lte: now } }, { nextRetryAt: { $lte: now } } ] },
      { $or: [ { cancelAt: null }, { cancelAt: { $gt: now } } ] }
    ]
  }).select('_id email paypal_vault_id nextRenewAt nextRetryAt renewAmount renewCurrency billingStatus failedRenewalAttempts cancelAt').lean();

  console.log('🧾 renewals: due users =', dueUsers.length);  // <— add this

  for (const u of dueUsers) {
    try {
      if (u.cancelAt && new Date(u.cancelAt).getTime() <= now.getTime()) {
        await Users.updateOne({ _id: u._id }, { $set: { billingStatus: 'cancelled' } });
        continue;
      }
      await processUserRenewal(u);
    } catch (e) {
      console.error('renewal loop error for', u.email, e);   // <— add this
    }
  }
}

module.exports = { runRenewals };
