const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: String,
  avatar_seed: String,
  avatar_config: mongoose.Schema.Types.Mixed,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  onboarding_completed: {
    type: Boolean,
    default: false,
  },
  tdee: Number,
  date_of_birth: String,
  height_cm: Number,
  weight_kg: Number,
  bmi: Number,
  goal: String,
  desired_weight_kg: Number,
  activity_level: String,
  dietary_preferences: [String],
  cycle_tracking_enabled: { type: Boolean, default: false },
  cycle_length_days: { type: Number, default: 28 },
  period_length_days: { type: Number, default: 5 },
  last_period_start: String,
  favouriteRecipes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
    },
  ],
  enrolledPrograms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
  ],
  activePlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  plans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  }],
  planPreferences: {
    autoAcceptSuggestions: Boolean,
    notifyOnPlanActivation: Boolean,
    regenerateSuggestionsFrequency: String // 'weekly', 'monthly', 'never'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
