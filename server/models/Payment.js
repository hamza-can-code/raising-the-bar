// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  provider:      { type: String, enum: ['paypal'], required: true },
  amount:        { type: Number, required: true },
  currency:      { type: String, required: true }, // ISO 4217
  orderId:       { type: String, default: '' },    // PayPal order id
  captureId:     { type: String, default: '' },    // PayPal capture id
  periodKey:     { type: String, index: true, default: '' }, // e.g. "2025-08"
  status:        { type: String, enum: ['succeeded','failed'], required: true },
  failureReason: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
