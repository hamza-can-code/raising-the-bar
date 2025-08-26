// server/payments/paypal.js
const { PP_BASE, getAccessToken } = require('../paypal-auth');

// Node 18+ has fetch; fall back for older
const fetchCompat = global.fetch || ((...args) =>
  import('node-fetch').then(({ default: f }) => f(...args))
);

function toMoney(n) {
  return String(Number(n).toFixed(2));
}

/**
 * Always return an "order-like" object for `capture`, so callers can read:
 * capture.purchase_units[0].payments.captures[0].id
 */
async function chargeVaultInternal({ vault_id, amount, currency, requestId, reference = 'renewal' }) {
  if (!vault_id) throw new Error('vault_id is required');
  if (amount == null) throw new Error('amount is required');
  if (!currency) throw new Error('currency is required');

  const { access_token } = await getAccessToken();

  // 1) Create order (idempotent via PayPal-Request-Id)
  const createRes = await fetchCompat(`${PP_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: reference,
          amount: { currency_code: currency, value: toMoney(amount) }
        }
      ],
      payment_source: { paypal: { vault_id } }
    })
  });

  const order = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`PayPal create order failed: ${createRes.status} ${JSON.stringify(order)}`);
  }

  // If the create call returned an already-completed order (rare but can happen with idempotency),
  // treat as success and return the order as the "capture" payload.
  const existingCap = order?.purchase_units?.[0]?.payments?.captures?.[0] || null;
  if (order?.status === 'COMPLETED' && existingCap) {
    return { order, capture: order };
  }

  // 2) Capture — some accounts require JSON body + content-type.
  // Make this idempotent-friendly and handle ORDER_ALREADY_CAPTURED.
  const capRes = await fetchCompat(`${PP_BASE}/v2/checkout/orders/${order.id}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'PayPal-Request-Id': `${requestId}-cap`
    },
    body: '{}' // required by some accounts
  });

  if (!capRes.ok) {
    let errBody = {};
    try { errBody = await capRes.json(); } catch (_) {}

    const alreadyCaptured =
      capRes.status === 422 &&
      Array.isArray(errBody?.details) &&
      errBody.details.some(d => d.issue === 'ORDER_ALREADY_CAPTURED');

    if (alreadyCaptured) {
      // Fetch the order and return it as the "capture" payload
      const getRes = await fetchCompat(`${PP_BASE}/v2/checkout/orders/${order.id}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      const ord2 = await getRes.json();
      if (!getRes.ok) {
        throw new Error(`PayPal get order after ORDER_ALREADY_CAPTURED failed: ${getRes.status} ${JSON.stringify(ord2)}`);
      }
      return { order: ord2, capture: ord2 };
    }

    throw new Error(`PayPal capture failed: ${capRes.status} ${JSON.stringify(errBody)}`);
  }

  // Successful capture returns an order representation
  const capturedOrder = await capRes.json();
  return { order, capture: capturedOrder };
}

module.exports = { chargeVaultInternal };
