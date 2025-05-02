// server/routes/accessRoutes.js
const Router      = require('router');
const UserAccess  = require('../models/UserAccess');

/* ── 1) Robustly resolve the auth middleware ─────────────────────────── */
const authModule = require('../middleware/auth');
let   auth;

if (typeof authModule === 'function') {
  auth = authModule;                         // module.exports = (req,res,next)=>…
} else if (authModule && typeof authModule.auth === 'function') {
  auth = authModule.auth;                    // { auth: fn }
} else if (authModule && typeof authModule.protect === 'function') {
  auth = authModule.protect;                 // { protect: fn }
} else if (authModule && typeof authModule.default === 'function') {
  auth = authModule.default;                 // ES-module default export
} else {
  throw new Error(
    'middleware/auth did not export a middleware function that Router can use'
  );
}

/* ── 2) Router setup ─────────────────────────────────────────────────── */
const router = Router();

/**
 * GET /access   (JWT-protected)
 * Returns { unlockedWeeks, subscriptionActive }
 */
router.get('/access', auth, async (req, res) => {
  try {
    const access = await UserAccess.findOne({ userId: req.user.id });

    if (!access) {
      return res.json({ unlockedWeeks: 0, subscriptionActive: false });
    }

    res.json({
      unlockedWeeks     : access.unlockedWeeks,
      subscriptionActive: access.subscriptionStatus === 'active'
    });
  } catch (err) {
    console.error('GET /access error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
