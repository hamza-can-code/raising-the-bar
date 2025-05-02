// models/UserAccess.js
const mongoose = require('mongoose');

const userAccessSchema = new mongoose.Schema(
  {
    userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    subscriptionId:    { type: String },       // Stripe subscription id (optional)
    unlockedWeeks:     { type: Number, default: 0 },
    subscriptionStatus:{ type: String, enum: ['active','canceled','past_due'], default: 'active' },
    renewalDate:       { type: Date }          // date the current billing cycle started
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserAccess', userAccessSchema);
