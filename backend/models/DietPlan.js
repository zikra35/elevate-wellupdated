const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weekStartDate: {
    type: Date,
    default: Date.now,
  },
  meals: [{
    day: String, // e.g. "Monday"
    meal_type: String, // e.g. "Breakfast"
    name: String,
    recipe: String,
    calories: Number,
  }],
  generatedPlan: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  generatedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);
