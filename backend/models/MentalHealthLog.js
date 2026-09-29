const mongoose = require('mongoose');

const mentalHealthLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  mood: String,
  stress_level: Number,
  anxiety_level: {
    type: Number,
    min: 1,
    max: 10,
  },
  notes: String,
});

module.exports = mongoose.model('MentalHealthLog', mentalHealthLogSchema);
