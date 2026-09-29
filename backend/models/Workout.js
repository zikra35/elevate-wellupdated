const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: String,
  name: String,
  duration_minutes: Number,
  intensity: String,
  calories_burned: Number,
  notes: String,
  videoUrl: String,
  thumbnailUrl: String,
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  planWorkoutId: String,
  isFromPlan: {
    type: Boolean,
    default: false
  },
  // GPS Tracking Data
  isGpsTracked: {
    type: Boolean,
    default: false
  },
  distanceKm: {
    type: Number,
    default: 0
  },
  steps: {
    type: Number,
    default: 0
  },
  pace: String, // Format: "MM'SS\""
  route: {
    type: [[Number]], // Array of [latitude, longitude] coordinates
    default: []
  },
  startLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] for GeoJSON
      default: [0, 0]
    }
  },
  endLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] for GeoJSON
      default: [0, 0]
    }
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Create geospatial index for location queries
workoutSchema.index({ 'startLocation': '2dsphere' });
workoutSchema.index({ 'endLocation': '2dsphere' });

module.exports = mongoose.model('Workout', workoutSchema);
