// server/routes/api.js
const express         = require('express');
const router          = express.Router();
const apiController   = require('../controllers/apiController');
const { registerUser, loginUser }    = require('../controllers/authController');
const { getMe, updateUserPurchases } = require('../controllers/userController');
const { protect }      = require('../middleware/auth');
const progressRoutes   = require('./progressRoutes');
const UserAccess       = require('../models/UserAccess');
const {
  setOnboardingComplete
} = require('../controllers/progressController');

console.log('✅ api.js loaded');

// Health check
router.get('/ping', apiController.ping);

// Auth
router.post('/auth/register', registerUser);
router.post('/auth/login',    loginUser);
router.get('/auth/me',        protect, getMe);

// Purchase update (to be called by your payment flow or Stripe webhook)
router.post('/update-purchase', protect, updateUserPurchases);

// Workout log
router.post('/logWorkout',    protect, apiController.logWorkout);
router.get('/getWorkoutLogs', protect, apiController.getWorkouts);

// Preferences
router.post('/saveUserPreferences', protect, apiController.saveUserPreferences);
router.get('/getUserPreferences',   protect, apiController.getUserPreferences);

// Progress (nested)
router.use('/progress', progressRoutes);

router.post(
  '/dashboard/setOnboardingComplete',
  protect,
  setOnboardingComplete
);

// ── NEW endpoint: “How many weeks does this user have unlocked?” ─────────
router.get('/access', protect, async (req, res) => {
  try {
    const access = await UserAccess.findOne({ userId: req.user.id });
    if (!access) {
      return res.json({
        unlockedWeeks:      0,
        subscriptionActive: false
      });
    }
    return res.json({
      unlockedWeeks:      access.unlockedWeeks,
      subscriptionActive: access.subscriptionStatus === 'active',
      renewalDate:        access.renewalDate
    });
  } catch (err) {
    console.error('❌ GET /api/access error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const User = require('../models/User');
router.post('/send-confirmation', async (req, res) => {
  console.log('✅ /send-confirmation HIT!', req.headers);
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const access = await UserAccess.findOne({ userId: user._id });
    if (!access) return res.status(404).json({ error: 'No UserAccess found for this user' });

    res.json({
      email: user.email,
      subscriptionStatus: access.subscriptionStatus,
      unlockedWeeks: access.unlockedWeeks,
      renewalDate: access.renewalDate,
    });
  } catch (err) {
    console.error('❌ Error in /send-confirmation:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

console.log(
  '🗺️ Registered API routes:',
  router.stack
    .filter(r => r.route)
    .map(r => {
      const methods = Object.keys(r.route.methods).join(',').toUpperCase();
      return `${methods} ${r.route.path}`;
    })
);

module.exports = router;
