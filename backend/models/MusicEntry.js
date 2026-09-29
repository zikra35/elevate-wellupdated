const mongoose = require('mongoose');

const musicEntrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    required: true,
  },
  genreTag: {
    type: String,
    enum: ['Lo-Fi', 'Nature Sounds', 'Classical', 'Binaural Beats'],
    required: true,
  },
  moodTag: {
    type: String,
    enum: ['Calm', 'Focus', 'Sleep', 'Energise'],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MusicEntry', musicEntrySchema);
