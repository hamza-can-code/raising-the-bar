// server/models/MealLog.js
const mongoose = require('mongoose');

const MealLogSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  week:    { type: Number, required: true },
  day:     { type: Number, required: true },
  mealIdx: { type: Number, required: true },          // 1-based, like “meal3”
  date:    { type: Date,   default: Date.now },

  // macros
  calories: Number,
  protein:  Number,
  carbs:    Number,
  fats:     Number,

  status:       { type: String, enum: ['logged','swapped','skipped'], default: 'logged' },
  swappedName:  String,
  originalName: String
});

module.exports = mongoose.model('MealLog', MealLogSchema);
