// server/models/CreatorPartner.js
const mongoose = require('mongoose');

const CreatorPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  email: { type: String, default: '' },
  stripeAccountId: { type: String, required: true, index: true },
  platformIntroFeePercent: { type: Number, default: 50, min: 0, max: 100 },
  platformOngoingFeePercent: { type: Number, default: 50, min: 0, max: 100 },
  defaultCurrency: { type: String, default: 'GBP' },
  country: { type: String, default: 'US' },
  active: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('CreatorPartner', CreatorPartnerSchema);
