const mongoose = require('mongoose');

const sleepLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  duration_hours: Number,
  quality: String,
  notes: String,
});

module.exports = mongoose.model('SleepLog', sleepLogSchema);
