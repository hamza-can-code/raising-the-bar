// server/routes/paypal.js
const express = require('express');
const { generateClientToken } = require('../paypal-auth');

const router = express.Router();

// GET /api/paypal/client-token -> { client_token: "..." }
router.get('/client-token', async (_req, res) => {
  try {
    const token = await generateClientToken();
    res.json(token); // { client_token: "..." }
  } catch (e) {
    console.error('PayPal client-token error:', e);
    res.status(500).json({ error: e.message || 'client-token failed' });
  }
});

module.exports = router;
