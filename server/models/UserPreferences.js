const mongoose = require('mongoose');

const UserPreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  preferences: { type: mongoose.Schema.Types.Mixed }, // 🧠 Dynamic preferences
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserPreferences', UserPreferencesSchema);
