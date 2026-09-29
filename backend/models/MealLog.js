const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
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
  time: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['morning', 'afternoon', 'night', 'evening', 'snack'],
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
mealLogSchema.index({ userId: 1, date: 1 });
mealLogSchema.index({ userId: 1, planId: 1, date: 1 });

module.exports = mongoose.model('MealLog', mealLogSchema);
