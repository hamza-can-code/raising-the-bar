const mongoose = require('mongoose');

const KitInterestSchema = new mongoose.Schema({
  choice:   { type: String, enum: ['yes','no'], required: true },
  email:    { type: String, default: null },
  createdAt:{ type: Date, default: Date.now }
}, { collection: 'kitInterest' });

module.exports = mongoose.model('KitInterest', KitInterestSchema);
