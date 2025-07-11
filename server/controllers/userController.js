// const User = require('../models/User');

// // existing: return current user (without password)
// exports.getMe = async (req, res) => {
//   const user = await User.findById(req.user.id).select('-password');
//   res.json(user);
// };

// // new: update a user's purchase flags
// exports.updateUserPurchases = async (req, res) => {
//   try {
//     const { userId, purchaseType } = req.body;

//     // validate purchaseType
//     const validTypes = ['oneWeek','fourWeek','twelveWeek','subscription'];
//     if (!validTypes.includes(purchaseType)) {
//       return res.status(400).json({ error: 'Invalid purchaseType' });
//     }

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ error: 'User not found' });

//     // flip the flag on
//     user.purchases[purchaseType] = true;

//     // if they subscribe, switch them to Pro Tracker
//     if (purchaseType === 'subscription') {
//       user.trackerType = 'PT';
//     }

//     await user.save();

//     res.json({
//       message: 'Purchase updated successfully',
//       purchases: user.purchases,
//       trackerType: user.trackerType
//     });
//   } catch (error) {
//     console.error('updateUserPurchases:', error);
//     res.status(500).json({ error: 'Failed to update purchase' });
//   }
// };

// server/controllers/userController.js
const User        = require('../models/User');
const UserAccess  = require('../models/UserAccess');
const sendOrderConfirmationEmail = require('../utils/sendOrderConfirmationEmail');

/* -----------------------------------------------------------
 * 1)  GET /api/auth/me          (already used in your app)
 * ---------------------------------------------------------*/
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

/* -----------------------------------------------------------
 * 2)  POST /api/update-purchase        (FREE plans & manual grants)
 *     Body: { purchaseType }           oneWeek | fourWeek | twelveWeek | subscription
 *     Auth:  protected route – req.user.id is always the owner
 * ---------------------------------------------------------*/
exports.updateUserPurchases = async (req, res) => {
  try {
    const { purchaseType = '' } = req.body;
    const userId = req.user.id;                     // ← never trust a body-supplied id

    /* ---------- validate purchaseType ---------- */
    const map = {
      oneWeek     : { weeks: 1,  isSub: false },
      fourWeek    : { weeks: 4,  isSub: false },
      twelveWeek  : { weeks: 12, isSub: false },
      subscription: { weeks: 4,  isSub: true }      // first subscription charge
    };
    if (!map[purchaseType]) {
      return res.status(400).json({ error: 'Invalid purchaseType' });
    }
    const { weeks, isSub } = map[purchaseType];

    /* ---------- update the User doc (optional) ---------- */
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // flip the flag on (preserve existing structure)
    user.purchases[purchaseType] = true;
    if (isSub) user.trackerType = 'PT';
    await user.save();

    /* ---------- up-sert UserAccess ---------- */
    const access = await UserAccess.findOneAndUpdate(
      { userId },
      {
        $inc : { unlockedWeeks: weeks },
        $set : isSub ? { subscriptionStatus: 'active' } : {}
      },
      { upsert: true, new: true }
    );

    console.log(
      access.isNew ? '🔐 UserAccess created' : '🔐 UserAccess updated',
      '→ total weeks:', access.unlockedWeeks
    );

    /* ---------- confirmation email (Brevo) ---------- */
    await sendOrderConfirmationEmail({
      email        : user.email,
      programName  : isSub
        ? 'Pro Tracker'
        : `${weeks}-Week Program`,
      unlockedWeeks: weeks,
      renewalDate  : null            // free / one-off purchase → no renewal
    });

    /* ---------- response ---------- */
    res.json({
      message           : 'Purchase updated successfully',
      unlockedWeeks     : access.unlockedWeeks,
      subscriptionActive: access.subscriptionStatus === 'active',
      trackerType       : user.trackerType
    });
  } catch (err) {
    console.error('updateUserPurchases error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
