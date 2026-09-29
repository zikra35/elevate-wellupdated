const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    default: 'My Personalized Plan'
  },
  description: String,
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'disabled',
    index: true
  },
  suggestions: {
    workouts: [mongoose.Schema.Types.Mixed],
    meals: [mongoose.Schema.Types.Mixed],
    schedule: [mongoose.Schema.Types.Mixed]
  },
  previousSuggestions: [{
    workouts: Array,
    meals: Array,
    schedule: Array,
    regeneratedAt: Date
  }],
  progress: {
    workoutsCompleted: {
      type: Number,
      default: 0
    },
    mealsLogged: {
      type: Number,
      default: 0
    },
    scheduleAdherence: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  isMockGenerated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
planSchema.index({ userId: 1, status: 1 });

// Update the updatedAt timestamp before saving
planSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Plan', planSchema);
