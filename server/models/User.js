// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  // new: UI preferences
  preferences: {
    lastSelectedTab:                { type: String, default: "myWorkouts" },
    strengthTrendsSelectedExercise: { type: String, default: "" },
    activeWorkoutWeek:              { type: Number, default: 1 }
  },

  // new: body‐composition & goal data
  profile: {
    startWeight:     { type: Number, default: 0 }, // kg
    maintenanceCals: { type: Number, default: 0 },
    goalType: {
      type: String,
      enum: [
        "Weight Loss",
        "Muscle Gain",
        "Improve Body Composition"
      ],
      default: "Weight Loss"
    },
    goalWeight: { type: Number, default: 0 }, // kg
    goalDate:   { type: Date }
  },

  // new: purchase flags
  purchases: {
    oneWeek:      { type: Boolean, default: false },
    fourWeek:     { type: Boolean, default: false },
    twelveWeek:   { type: Boolean, default: false },
    subscription: { type: Boolean, default: false }
  },

  isPaid: {
    type: Boolean,
    default: false
  },
  trackerType: {
    type: String,
    enum: ['CT','PT'],
    default: 'CT'
  }

}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function(entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
