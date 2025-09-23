const express = require('express');
const KitInterest = require('../models/KitInterest');

const router = express.Router();

router.post('/logInterest', async (req, res) => {
  try {
    const choice = String(req.body?.choice || '').toLowerCase().trim();
    const email  = String(req.body?.email || '').trim();

    if (!['yes','no'].includes(choice)) {
      return res.status(400).json({ ok: false, error: 'Invalid choice' });
    }

    await KitInterest.create({ choice, email: email || null });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[logInterest]', err);
    return res.status(500).json({ ok: false });
  }
});

module.exports = router;
