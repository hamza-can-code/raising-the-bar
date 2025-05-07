// // server/routes/accessRoutes.js
// const express     = require('express');
// const router      = express.Router();
// const UserAccess  = require('../models/UserAccess');

// /* ── 1 · resolve whatever your auth module exports ───────── */
// const authModule = require('../middleware/auth');
// let   protect;

// if (typeof authModule === 'function')              protect = authModule;
// else if (authModule?.protect instanceof Function)  protect = authModule.protect;
// else if (authModule?.auth    instanceof Function)  protect = authModule.auth;
// else if (authModule?.default instanceof Function)  protect = authModule.default;
// else throw new Error('middleware/auth did not export a middleware function');

// /* ── 2 · GET /api/access ─────────────────────────────────── */
// router.get('/access', protect, async (req, res) => {
//   try {
//     /* will be null the first time the user ever pays */
//     const ua = await UserAccess.findOne({ userId: req.user.id });

//     if (!ua) {
//       return res.json({ unlockedWeeks: 0, subscriptionActive: false });
//     }

//     res.json({
//       unlockedWeeks     : ua.unlockedWeeks ?? 0,
//       subscriptionActive: ua.subscriptionStatus === 'active'
//     });
//   } catch (err) {
//     console.error('GET /api/access →', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;

const express    = require('express');
const router     = express.Router();
const UserAccess = require('../models/UserAccess');

/* ——— robust auth-middleware resolution ——— */
const authModule = require('../middleware/auth');
let   auth;

if (typeof authModule === 'function')               auth = authModule;
else if (authModule?.auth)                          auth = authModule.auth;
else if (authModule?.protect)                       auth = authModule.protect;
else if (authModule?.default)                       auth = authModule.default;
else throw new Error('middleware/auth did not export a callable middleware');

/* ——— GET /access ——— */
router.get('/access', auth, async (req, res) => {
  try {
    const access = await UserAccess.findOne({ userId: req.user.id });

    if (!access) {
      return res.json({ unlockedWeeks: 0, subscriptionActive: false });
    }

    return res.json({
      unlockedWeeks     : access.unlockedWeeks,
      subscriptionActive: access.subscriptionStatus === 'active'
    });
  } catch (err) {
    console.error('GET /access error:', err);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
