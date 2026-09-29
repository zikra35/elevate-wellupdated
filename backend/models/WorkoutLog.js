const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    index: true
  },
  name: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  loggedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
workoutLogSchema.index({ userId: 1, date: 1 });
workoutLogSchema.index({ userId: 1, planId: 1, date: 1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
