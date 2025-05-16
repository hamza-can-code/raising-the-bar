const mongoose = require('mongoose');

const BodyWeightLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:   { type: Date, required: true },   // full ISO timestamp → lets us sort exactly
    weight: { type: Number, required: true }  // stored in kilograms
  },
  { timestamps: true }
);

/*  🟢  keep an index for speed, but NOT unique anymore  */
BodyWeightLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('BodyWeightLog', BodyWeightLogSchema);
