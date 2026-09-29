const mongoose = require('mongoose');

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    recommendationId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['workout', 'meal', 'sleep', 'mood'],
      required: true,
    },
    feedback: {
      type: String,
      enum: ['liked', 'disliked', 'neutral'],
      required: true,
    },
    timestamp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { collection: 'recommendation_feedback' }
);

// Index for efficient queries
recommendationFeedbackSchema.index({ userId: 1, createdAt: -1 });
recommendationFeedbackSchema.index({ type: 1, feedback: 1 });

module.exports = mongoose.model('RecommendationFeedback', recommendationFeedbackSchema);
