const mongoose = require('mongoose');

/**
 * WellnessPath Schema
 * Stores the results of search algorithm pathfinding
 * Represents a sequence of wellness actions to reach a goal state
 */
const wellnessPathSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pathId: {
      type: String,
      unique: true,
      required: true,
    },
    // Initial state (current wellness metrics)
    initialState: {
      nutrition: { type: Number, min: 0, max: 100 },
      physical: { type: Number, min: 0, max: 100 },
      sleep: { type: Number, min: 0, max: 100 },
      mental: { type: Number, min: 0, max: 100 },
      readinessScore: { type: Number, min: 0, max: 100 },
    },
    // Goal state (target wellness metrics)
    goalState: {
      nutrition: { type: Number, min: 0, max: 100 },
      physical: { type: Number, min: 0, max: 100 },
      sleep: { type: Number, min: 0, max: 100 },
      mental: { type: Number, min: 0, max: 100 },
      readinessScore: { type: Number, min: 0, max: 100 },
    },
    // The path: sequence of actions to reach goal
    path: [
      {
        step: Number,
        action: String, // e.g., "Log meal", "Complete workout", "Sleep 8 hours"
        actionType: {
          type: String,
          enum: ['meal', 'workout', 'sleep', 'journal', 'meditation'],
        },
        expectedImpact: {
          nutrition: Number,
          physical: Number,
          sleep: Number,
          mental: Number,
        },
        estimatedTime: Number, // in minutes
        description: String,
      },
    ],
    // Algorithm metadata
    algorithm: {
      type: String,
      enum: ['BFS', 'A*'],
      required: true,
    },
    pathLength: Number, // number of steps
    totalCost: Number, // total time/effort required
    heuristic: String, // for A*: which heuristic was used
    // Metrics
    nodesExplored: Number, // how many states were explored
    executionTime: Number, // in milliseconds
    // Status
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    progress: {
      stepsCompleted: { type: Number, default: 0 },
      lastUpdated: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index for automatic cleanup
wellnessPathSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('WellnessPath', wellnessPathSchema);
