// server/models/NutritionProgress.js
const mongoose = require('mongoose');

const NutritionProgressSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  progress:  { type: Object, required: true },
  updatedAt: { type: Date,   default: Date.now }
});

module.exports = mongoose.model('NutritionProgress', NutritionProgressSchema);
