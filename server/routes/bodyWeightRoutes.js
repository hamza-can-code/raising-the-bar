const express       = require('express');
const router        = express.Router();
const BodyWeightLog = require('../models/BodyWeightLog');
const { protect }   = require('../middleware/auth');

/* ──────────────────────────────────────────────
   CREATE a new log  →  POST /api/bodyWeightLogs
───────────────────────────────────────────────*/
router.post('/bodyWeightLogs', protect, async (req, res) => {
  try {
    const { date, weight } = req.body;
    if (!date || typeof weight !== 'number') {
      return res.status(400).json({ message: 'date & weight are required' });
    }

    /* ⬇️ always save a brand-new document */
    await new BodyWeightLog({
      userId: req.user.id,
      date,
      weight
    }).save();

    return res.status(201).json({ message: 'Weight log saved' });
  } catch (err) {
    console.error('❌ Error saving weight log:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/* ──────────────────────────────────────────────
   GET all logs (oldest → newest)
───────────────────────────────────────────────*/
router.get('/bodyWeightLogs', protect, async (req, res) => {
  try {
    const logs = await BodyWeightLog
      .find({ userId: req.user.id })
      .sort({ date: 1, createdAt: 1 });

    return res.json(logs);
  } catch (err) {
    console.error('❌ Error fetching weight logs:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
