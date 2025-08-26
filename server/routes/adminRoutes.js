// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { runRenewals } = require('../jobs/renewals');

router.post('/admin/run-renewals', async (_req, res) => {
  try { await runRenewals(); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
