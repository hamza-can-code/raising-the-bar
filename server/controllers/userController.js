const User = require('../models/User');

// existing: return current user (without password)
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

// new: update a user's purchase flags
exports.updateUserPurchases = async (req, res) => {
  try {
    const { userId, purchaseType } = req.body;

    // validate purchaseType
    const validTypes = ['oneWeek','fourWeek','twelveWeek','subscription'];
    if (!validTypes.includes(purchaseType)) {
      return res.status(400).json({ error: 'Invalid purchaseType' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // flip the flag on
    user.purchases[purchaseType] = true;

    // if they subscribe, switch them to Pro Tracker
    if (purchaseType === 'subscription') {
      user.trackerType = 'PT';
    }

    await user.save();

    res.json({
      message: 'Purchase updated successfully',
      purchases: user.purchases,
      trackerType: user.trackerType
    });
  } catch (error) {
    console.error('updateUserPurchases:', error);
    res.status(500).json({ error: 'Failed to update purchase' });
  }
};
