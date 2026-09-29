const mongoose = require('mongoose');

const cycleLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  cycle_day: Number,
  symptoms: [String],
  flow_intensity: String,
  notes: String,
});

module.exports = mongoose.model('CycleLog', cycleLogSchema);
