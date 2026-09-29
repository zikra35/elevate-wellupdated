const mongoose = require('mongoose');

const supplementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  dosage: String,
  frequency: String,
  timeOfDay: [String], // e.g., ["Morning", "Evening"]
  notes: String,
  takenToday: {
    type: Boolean,
    default: false,
  },
  lastTakenDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Supplement', supplementSchema);
