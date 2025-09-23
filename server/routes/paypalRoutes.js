// server/routes/paypalRoutes.js

const express = require('express');
const router = express.Router();
const Users = require('../models/User');
const { PP_BASE, getAccessToken, generateClientToken } = require('../paypal-auth');

router.get('/debug', async (req, res) => {
  try {
    const { PP_BASE, getAccessToken, generateClientToken } = require('../paypal-auth');
    const env = process.env.PAYPAL_ENV;
    const idTail = (process.env.PAYPAL_CLIENT_ID || '').trim().slice(-6);
    const base = PP_BASE;

    // try oauth
    let oauthOk = false, clientTokenOk = false, oauthErr, tokenErr;
    try { await getAccessToken(); oauthOk = true; } catch (e) { oauthErr = String(e.message || e); }
    if (oauthOk) {
      try { await generateClientToken(); clientTokenOk = true; } catch (e) { tokenErr = String(e.message || e); }
    }

    res.json({
      PAYPAL_ENV: env,
      PP_BASE: base,
      CLIENT_ID_tail: idTail,
      oauthOk,
      clientTokenOk,
      oauthErr,
      tokenErr
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});


// Node 18+ has fetch. Fallback for older Node:
const fetchCompat = global.fetch || ((...args) =>
  import('node-fetch').then(({ default: f }) => f(...args))
);

/** A) Client token (needed by JS SDK for vaulting) */
router.get('/client-token', async (_req, res) => {
  try {
    const token = await generateClientToken(); // { client_token }
    res.json(token);
  } catch (err) {
    console.error('PayPal client-token error:', err);
    res.status(500).json({ error: err.message || 'client-token failed' });
  }
});

/** B) Create a £0 order (free 7‑day trial) and request vaulting */
router.post('/create-order-otp', async (req, res) => {
  try {
    const { access_token } = await getAccessToken();

const currency = (req.body.currency || 'GBP').toUpperCase();

    // Build return/cancel URLs from PUBLIC_BASE_URL (or current host)
    const origin = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
     const returnUrl = `${origin}/pages/kit-offer.html`;
    const cancelUrl = `${origin}/pages/offer.html?paypal=cancelled`;

    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: 'trial-0',
          custom_id: req.userId || req.body.userId || 'unknown',
          amount: { currency_code: currency, value: '0.00' },
          description: 'Free trial access'
        }
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        brand_name: 'Raising The Bar'
      },
      payment_source: {
        paypal: {
          attributes: {
            vault: {
              store_in_vault: 'ON_SUCCESS',
              usage_type: 'MERCHANT'
              // usage_pattern removed – not accepted here
            }
          }
        }
      }
};

    const r = await fetchCompat(`${PP_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const json = await r.json();
    if (!r.ok) {
      console.error('Create order failed:', json);
      return res.status(r.status).json(json);
    }
    res.json(json); // { id, status, links... }
  } catch (err) {
    console.error('create-order-otp error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** C) Capture after approval; extract vault_id (if present) */
// server/routes/paypalRoutes.js
router.post('/capture/:orderID', async (req, res) => {
  try {
    const { orderID } = req.params;
    const { access_token } = await getAccessToken();

    const r = await fetchCompat(`${PP_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'PayPal-Request-Id': `cap-${orderID}`,
      },
      body: '{}' // keep this
    });

    const json = await r.json();
    if (!r.ok) {
      console.error('Capture failed:', json);
      return res.status(r.status).json(json);
    }

    // ✅ correct paths
    const vaultAttrs = json?.payment_source?.paypal?.attributes?.vault;
    const vaultId = vaultAttrs?.id || null;
    const vaultStatus = vaultAttrs?.status || null;

    console.log('🔍 CAPTURE SNAPSHOT', {
      capture_id: json?.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      order_status: json?.status,
      vault_status: vaultStatus,
      vault_id: vaultId
    });

    // Return both so the client can decide what to do
    res.json({
      capture: json,
      vault_id: vaultId,
      vault_status: vaultStatus
    });
  } catch (err) {
    console.error('capture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// TEMPORARY: check what vault_id got saved for a user
router.get('/my-vault', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const u = await Users.findById(userId).lean();
    if (!u) return res.status(404).json({ error: 'user not found' });

    res.json({
      userId,
      paypal_vault_id: u.paypal_vault_id || null,
      nextRenewAt: u.nextRenewAt || null,
      renewAmount: u.renewAmount,
      renewCurrency: u.renewCurrency,
      billingStatus: u.billingStatus || 'active'
    });
  } catch (e) {
    console.error('my-vault error', e);
    res.status(500).json({ error: e.message });
  }
});


// save the vault id to the user after capture
// server/routes/paypalRoutes.js (save-vault)
router.post('/save-vault', async (req, res) => {
  try {
    console.log('🔹 save-vault payload:', req.body);
    const { userId, vault_id, currency, renewAmount } = req.body;
    if (!userId || !vault_id) {
      return res.status(400).json({ error: 'userId and vault_id required' });
    }

    const now = Date.now();
    const next = new Date(now + 7 * 24 * 60 * 60 * 1000);

    const u = await Users.findById(userId).lean();
    if (!u) return res.status(404).json({ error: 'user not found' });

    const renewAmt = typeof renewAmount === 'number'
      ? renewAmount
      : (typeof u.renewAmount === 'number' ? u.renewAmount : 29.99);
    const renewCurr = currency || u.renewCurrency || 'GBP';

    await Users.updateOne(
      { _id: userId },
      {
        $set: {
          paypal_vault_id: vault_id,
          nextRenewAt: u.nextRenewAt || next,
     renewAmount: renewAmt,
          renewCurrency: renewCurr,
          billingStatus: 'active'
        }
      }
    );

    res.json({ ok: true });
  } catch (e) {
    console.error('save-vault error', e);
    res.status(500).json({ error: e.message });
  }
});

/** D) Merchant-Initiated Payment (Reference Transaction) using vault_id (GBP only) */
router.post('/charge-vault', async (req, res) => {
  try {
    const { vault_id, amount, reference = 'renewal', userId } = req.body;
    if (!vault_id && !userId) {
      return res.status(400).json({ error: 'Provide userId or vault_id' });
    }

    let vaultId = vault_id;
    let amt, curr;

    if (userId) {
      const u = await Users.findById(userId).lean();
      if (!u) return res.status(404).json({ error: 'user not found' });
      vaultId = vaultId || u.paypal_vault_id;
      amt = (typeof amount === 'number' ? amount : u.renewAmount || 29.99).toFixed(2);
      curr = u.renewCurrency || 'GBP';
    } else {
      // fallback if only vault_id passed
      amt = (typeof amount === 'number' ? amount : 29.99).toFixed(2);
      curr = 'GBP';
    }

    if (!vaultId) return res.status(400).json({ error: 'No vault_id on file' });

    const { access_token } = await getAccessToken();

    const create = await fetchCompat(`${PP_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `mip-${userId || vaultId}-${new Date().toISOString().slice(0,10)}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          { reference_id: reference, amount: { currency_code: curr, value: String(amt) } }
        ],
        payment_source: { paypal: { vault_id: vaultId } }
      })
    });

    const order = await create.json();
    if (!create.ok) {
      console.error('MIP create order failed:', order);
      return res.status(create.status).json(order);
    }

    const cap = await fetchCompat(`${PP_BASE}/v2/checkout/orders/${order.id}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const captured = await cap.json();
    if (!cap.ok) {
      console.error('MIP capture failed:', captured);
      return res.status(cap.status).json(captured);
    }

    // on success, advance nextRenewAt
    if (userId) {
      await Users.updateOne(
        { _id: userId },
        {
          $set: { nextRenewAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), billingStatus: 'active', lastChargeError: '' },
          $setOnInsert: { failedRenewalAttempts: 0 }
        }
      );
    }

    res.json({ order_id: order.id, capture: captured });
  } catch (err) {
    console.error('charge-vault error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Inspect an ORDER after the fact
router.get('/show-order/:orderID', async (req, res) => {
  try {
    const { access_token } = await getAccessToken();
    const r = await fetchCompat(`${PP_BASE}/v2/checkout/orders/${req.params.orderID}`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const json = await r.json();
    res.status(r.status).json(json);
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

router.get('/show-capture/:captureID', async (req, res) => {
  try {
    const { access_token } = await getAccessToken();
    const r = await fetchCompat(`${PP_BASE}/v2/payments/captures/${req.params.captureID}`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const json = await r.json();
    res.status(r.status).json(json);
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

router.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  try {
    const evt = req.body;
    console.log('🔔 PayPal webhook:', evt.event_type, evt.resource?.id);

    if (evt.event_type === 'VAULT.PAYMENT-TOKEN.CREATED') {
      const vaultId = evt?.resource?.id;             // token to use
      const customId = evt?.resource?.metadata?.custom_id
                    || evt?.resource?.customer?.merchant_customer_id
                    || null;

      // If you set purchase_units[0].custom_id, PayPal may echo it back as metadata.
      if (customId) {
        await Users.updateOne(
          { _id: customId },
          { $set: { paypal_vault_id: vaultId } }
        );
        console.log('✅ Saved vault token for user:', customId, vaultId);
      } else {
        console.warn('No custom_id on webhook; could not map user');
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook error', e);
    res.sendStatus(200);
  }
});

module.exports = router;
