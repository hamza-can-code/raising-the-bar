// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: true
  },

  // UI preferences
  preferences: {
    lastSelectedTab:                { type: String, default: "myWorkouts" },
    strengthTrendsSelectedExercise: { type: String, default: "" },
    activeWorkoutWeek:              { type: Number, default: 1 }
  },

  // Body composition & goals
  profile: {
    startWeight:     { type: Number, default: 0 }, // kg
    maintenanceCals: { type: Number, default: 0 },
    goalType: {
      type: String,
      enum: ["Weight Loss", "Muscle Gain", "Improve Body Composition"],
      default: "Weight Loss"
    },
    goalWeight: { type: Number, default: 0 }, // kg
    goalDate:   { type: Date }
  },

  // Purchases / access flags
  purchases: {
    oneWeek:      { type: Boolean, default: false },
    fourWeek:     { type: Boolean, default: false },
    twelveWeek:   { type: Boolean, default: false },
    subscription: { type: Boolean, default: false }
  },

  isPaid: { type: Boolean, default: false },
  trackerType: { type: String, enum: ['CT','PT'], default: 'CT' },

  // ---------- Billing (PayPal Reference Transactions) ----------
  paypal_vault_id: { type: String, default: null, index: true },
  nextRenewAt:     { type: Date,   default: null, index: true }, // scheduler finds due users

  // Per-user renewal config (can be overridden per market/test)
  renewAmount:     { type: Number, default: 49.99 },             // monthly charge
  renewCurrency:   { type: String, default: 'GBP' },             // ISO 4217

  // Billing state / ops
  billingStatus:          { type: String, default: 'active', enum: ['active','past_due','cancelled'] },
  failedRenewalAttempts:  { type: Number, default: 0 },
  lastChargeError:        { type: String, default: '' },
  cancelAt:               { type: Date, default: null }          // if set, stop renewals at/after this date
}, { timestamps: true });

// Indexes helpful for the renewal job
UserSchema.index({ nextRenewAt: 1, paypal_vault_id: 1, billingStatus: 1 });

// Hide sensitive fields in JSON
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

// Email normalisation safety
UserSchema.pre('save', function(next) {
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Hash password if modified
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = function(entered) {
  return bcrypt.compare(entered, this.password);
};

// Helper: ensure renewal defaults (optional, use if you ever need to coerce values)
UserSchema.methods.ensureRenewalDefaults = function() {
  if (typeof this.renewAmount !== 'number') this.renewAmount = 49.99;
  if (!this.renewCurrency) this.renewCurrency = 'GBP';
};

module.exports = mongoose.model('User', UserSchema);
