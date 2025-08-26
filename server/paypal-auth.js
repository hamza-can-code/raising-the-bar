// server/paypal-auth.js
require('dotenv').config();

const CLIENT_ID_RAW = process.env.PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET_RAW = process.env.PAYPAL_CLIENT_SECRET || '';
const ENV_RAW = (process.env.PAYPAL_ENV || 'sandbox');

const CLIENT_ID = CLIENT_ID_RAW.trim();         // trim any stray spaces/newlines
const CLIENT_SECRET = CLIENT_SECRET_RAW.trim();
const ENV = ENV_RAW.trim().toLowerCase();

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in .env');
}
if (!['live','sandbox'].includes(ENV)) {
  throw new Error(`PAYPAL_ENV must be "live" or "sandbox" (got "${ENV_RAW}")`);
}

const PP_BASE = ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Quick one-time boot logs
console.log('🔵 PAYPAL_ENV    =', ENV);
console.log('🔵 PP_BASE       =', PP_BASE);
console.log('🔵 CLIENT_ID …', CLIENT_ID.slice(-6));

const fetchCompat = global.fetch || ((...args) =>
  import('node-fetch').then(({ default: f }) => f(...args))
);

async function getAccessToken() {
  const r = await fetchCompat(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`PayPal oauth failed: ${r.status} ${text}`);
  return JSON.parse(text);
}

async function generateClientToken() {
  const { access_token } = await getAccessToken();
  const r = await fetchCompat(`${PP_BASE}/v1/identity/generate-token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`generate-token failed: ${r.status} ${text}`);
  return JSON.parse(text);
}

module.exports = { PP_BASE, getAccessToken, generateClientToken };

