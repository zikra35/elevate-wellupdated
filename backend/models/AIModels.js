const mongoose = require('mongoose');

// Schema for storing raw training data
const trainingDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dataType: {
      type: String,
      enum: ['workout', 'meal', 'sleep', 'mood', 'cycle', 'mentalHealth', 'supplement', 'other'],
      required: true,
    },
    // Generic data container - different types store different fields
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Extracted features for easier access
    features: {
      duration: Number,
      intensity: String,
      type: String,
      calories: Number,
      moodLevel: Number,
      stressLevel: Number,
      energyLevel: Number,
      qualityScore: Number,
      timestamp: Date,
    },
    source: {
      type: String,
      enum: ['auto-logged', 'user-confirmed', 'api', 'device'],
      default: 'user-confirmed',
    },
    reliability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },
    metadata: {
      device: String,
      location: String,
      notes: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    quality: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Schema for storing extracted feature vectors
const featureVectorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    features: {
      // Normalized to 0-1 range
      workoutFrequency: { type: Number, min: 0, max: 1 },
      workoutIntensity: { type: Number, min: 0, max: 1 },
      workoutTypePreference: [{ type: String, value: Number }], // encoded categories
      mealTiming: { type: Number, min: 0, max: 1 },
      mealTypes: [{ type: String, value: Number }],
      dietaryRestrictions: [String],
      sleepDuration: { type: Number, min: 0, max: 1 },
      sleepQuality: { type: Number, min: 0, max: 1 },
      moodPattern: { type: Number, min: -1, max: 1 },
      stressLevel: { type: Number, min: 0, max: 1 },
      cyclePhaseAwareness: { type: Number, min: 0, max: 1 },
      goalProgressRate: { type: Number, min: 0, max: 1 },
      feedbackPatterns: { type: Number, min: 0, max: 1 },
      timePreference: String, // 'morning', 'afternoon', 'evening'
      recoveryPreference: { type: Number, min: 0, max: 1 },
      socialPreference: { type: Number, min: 0, max: 1 },
    },
    aggregateStats: {
      mean: mongoose.Schema.Types.Mixed,
      median: mongoose.Schema.Types.Mixed,
      standardDeviation: mongoose.Schema.Types.Mixed,
    },
    correlations: {
      // Correlations between features (e.g., stress and mood)
      type: mongoose.Schema.Types.Mixed,
    },
    confidenceFlags: [
      {
        dimension: String,
        confidence: Number,
        notes: String,
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Schema for trained personalized models
const userProfileModelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    modelVersion: {
      type: Number,
      default: 1,
    },
    modelType: {
      type: String,
      enum: ['random-forest', 'neural-network', 'gradient-boost', 'ensemble'],
      default: 'random-forest',
    },
    // Serialized model (stored as JSON or binary)
    modelData: mongoose.Schema.Types.Mixed,
    modelPath: String, // Path to model file if stored separately
    trainingStats: {
      trainingDataPoints: Number,
      trainingAccuracy: Number,
      validationAccuracy: Number,
      testAccuracy: Number,
      precision: Number,
      recall: Number,
      f1Score: Number,
      aucRoc: Number,
      crossValidationScores: [Number],
    },
    personalizationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    dimensions: [
      {
        name: String,
        accuracy: Number,
        confidence: Number,
      },
    ],
    trainingDataRange: {
      startDate: Date,
      endDate: Date,
      dataPoints: Number,
    },
    lastTrainingDate: Date,
    lastUpdatedDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'training', 'updating'],
      default: 'inactive',
    },
    previousVersions: [
      {
        version: Number,
        modelData: mongoose.Schema.Types.Mixed,
        accuracy: Number,
        timestamp: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Schema for user feedback on recommendations
const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recommendationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recommendation',
    },
    feedbackType: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'rating'],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    accepted: Boolean, // Did user follow the recommendation?
    completed: Boolean, // Did user complete the recommended activity?
    dimension: String, // Which recommendation dimension (workout, meal, etc.)
    recommendation: mongoose.Schema.Types.Mixed, // The recommendation that was rated
    confidence: Number, // Original confidence score of recommendation
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Schema for generated recommendations
const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dimension: {
      type: String,
      enum: ['workout', 'meal', 'sleep', 'mental-health', 'schedule', 'recovery'],
      required: true,
    },
    recommendation: String,
    alternatives: [String],
    confidenceScore: Number,
    personalizationScore: Number,
    explanation: String, // Why this recommendation was selected
    context: {
      timeOfDay: String,
      dayOfWeek: String,
      currentMood: String,
      cyclePhase: String,
      recentActivities: [String],
    },
    source: {
      type: String,
      enum: ['self-trained', 'openai', 'hybrid', 'fallback'],
      default: 'self-trained',
    },
    feedback: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
    },
    accepted: Boolean,
    completed: Boolean,
    rating: Number,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Schema for conversation history
const conversationHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      index: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
        },
        content: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          mood: String,
          stressLevel: Number,
          topicTags: [String],
          sentiment: String,
        },
      },
    ],
    healthIndicators: {
      extractedMood: String,
      stressLevel: Number,
      energyLevel: Number,
      painLevel: Number,
      overallHealthScore: Number,
    },
    healthConcerns: [String],
    mentalHealthConcerns: [String],
      physicalHealthConcerns: [String],
    crisisIndicators: Boolean,
    suggestionsProvided: [String],
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endedAt: Date,
    conversationMode: {
      type: String,
      enum: [
        'free-form',
        'guided-assessment',
        'quick-tip',
        'crisis-support',
        'goal-setting',
        'reflection',
        'check-in',
      ],
      default: 'free-form',
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

// Schema for model performance metrics
const modelMetricsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    modelVersion: Number,
    dimension: String,
    metric: {
      name: String,
      value: Number,
      timestamp: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    acceptanceRate: Number, // Percentage of recommendations accepted
    completionRate: Number, // Percentage of recommendations completed
    averageRating: Number, // Average rating 1-5
    recommendationCount: Number,
    feedbackCount: Number,
    accuracyTrend: [Number], // Time series of accuracy
    confidenceTrend: [Number], // Time series of confidence
  },
  {
    timestamps: true,
  }
);

module.exports = {
  TrainingData: mongoose.model('TrainingData', trainingDataSchema),
  FeatureVector: mongoose.model('FeatureVector', featureVectorSchema),
  UserProfileModel: mongoose.model('UserProfileModel', userProfileModelSchema),
  Feedback: mongoose.model('Feedback', feedbackSchema),
  Recommendation: mongoose.model('Recommendation', recommendationSchema),
  ConversationHistory: mongoose.model('ConversationHistory', conversationHistorySchema),
  ModelMetrics: mongoose.model('ModelMetrics', modelMetricsSchema),
};
