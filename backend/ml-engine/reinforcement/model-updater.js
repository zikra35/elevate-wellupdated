/**
 * Reinforcement Learning Engine
 * Updates personalized models based on user feedback
 * Uses temporal decay to prioritize recent feedback
 * Implements model comparison and versioning
 */

const { UserProfileModel, Feedback } = require('../models/AIModels');
const SupervisedLearningEngine = require('./supervised/trainer');

class ReinforcementLearningEngine {
  /**
   * Process user feedback and update model
   * Triggered when significant new feedback is available
   */
  static async processUserFeedback(userId) {
    try {
      console.log(`Processing feedback for user: ${userId}`);

      // Step 1: Collect new feedback (not yet processed)
      const newFeedback = await this.collectUnprocessedFeedback(userId);
      if (!newFeedback || newFeedback.length === 0) {
        console.log('No new feedback to process');
        return null;
      }

      console.log(`Found ${newFeedback.length} new feedback points`);

      // Step 2: Check if we should trigger retraining (threshold: 50 feedback points)
      if (newFeedback.length < 50) {
        // Just update weights, don't retrain
        return this.updateModelWeights(userId, newFeedback);
      }

      // Step 3: Full retraining
      const oldModel = await UserProfileModel.findOne({ userId });
      const newModel = await SupervisedLearningEngine.trainModel(userId);

      // Step 4: Compare models
      const comparison = this.compareModels(oldModel, newModel);

      // Step 5: Decide whether to deploy new model
      if (comparison.shouldDeploy) {
        console.log('New model is better, deploying...');
        return newModel;
      } else {
        console.log('Old model is better, rolling back...');
        return this.rollbackModel(userId, oldModel);
      }
    } catch (error) {
      console.error('Error processing feedback:', error);
      throw error;
    }
  }

  /**
   * Collect unprocessed feedback
   */
  static async collectUnprocessedFeedback(userId) {
    const lastModelUpdate = await UserProfileModel.findOne({ userId })
      .select('lastUpdatedDate')
      .lean();

    const query = { userId };
    if (lastModelUpdate?.lastUpdatedDate) {
      query.timestamp = { $gt: lastModelUpdate.lastUpdatedDate };
    }

    const feedback = await Feedback.find(query).lean();
    return feedback;
  }

  /**
   * Update model weights based on feedback without full retraining
   * Uses temporal decay to prioritize recent feedback
   */
  static async updateModelWeights(userId, feedback) {
    try {
      const model = await UserProfileModel.findOne({ userId });
      if (!model) {
        console.log('No model found for user, cannot update weights');
        return null;
      }

      // Calculate reward signals
      const rewards = this.calculateRewards(feedback);

      // Apply temporal decay
      const decayedRewards = this.applyTemporalDecay(rewards);

      // Update model data
      const previousModelData = { ...model.modelData };
      model.modelData = this.updateModelData(model.modelData, decayedRewards);

      // Update last updated date
      model.lastUpdatedDate = new Date();

      // Store as previous version
      if (!model.previousVersions) model.previousVersions = [];
      model.previousVersions.push({
        version: model.modelVersion,
        modelData: previousModelData,
        accuracy: model.trainingStats?.testAccuracy,
        timestamp: model.lastTrainingDate,
      });

      // Increment version for incremental update
      model.modelData.incrementalUpdateCount = (model.modelData.incrementalUpdateCount || 0) + 1;

      await model.save();
      console.log(`Updated model weights for user: ${userId}`);
      return model;
    } catch (error) {
      console.error('Error updating model weights:', error);
      throw error;
    }
  }

  /**
   * Calculate reward signal from feedback
   */
  static calculateRewards(feedback) {
    const rewards = [];

    feedback.forEach((f) => {
      let reward = 0;

      if (f.feedbackType === 'positive') {
        reward = 1;
      } else if (f.feedbackType === 'negative') {
        reward = -1;
      } else if (f.feedbackType === 'neutral') {
        reward = 0;
      } else if (f.feedbackType === 'rating') {
        // Convert 1-5 rating to -1 to 1 reward
        reward = (f.rating - 3) / 2;
      }

      // Boost reward if recommendation was accepted/completed
      if (f.accepted) reward *= 1.5;
      if (f.completed) reward *= 1.5;

      rewards.push({
        dimension: f.dimension,
        recommendation: f.recommendation,
        reward,
        confidence: f.confidence || 0.5,
        timestamp: f.timestamp,
      });
    });

    return rewards;
  }

  /**
   * Apply temporal decay to feedback
   * Recent feedback has higher weight
   */
  static applyTemporalDecay(rewards) {
    const now = Date.now();
    const decayRate = 0.99; // Per day decay
    const daysPerUnit = 1 / (24 * 60 * 60 * 1000); // Convert ms to days

    return rewards.map((r) => {
      const age = (now - new Date(r.timestamp).getTime()) * daysPerUnit;
      const decayFactor = Math.pow(decayRate, age);

      return {
        ...r,
        reward: r.reward * decayFactor,
        weight: decayFactor,
      };
    });
  }

  /**
   * Update model data using reinforcement signals
   */
  static updateModelData(currentModel, decayedRewards) {
    const updated = { ...currentModel };

    // Update feature importances based on rewards
    if (!updated.featureImportance) {
      updated.featureImportance = [0.3, 0.25, 0.2, 0.15, 0.05, 0.03, 0.02];
    }

    // Adjust feature importance based on reward signals
    decayedRewards.forEach((r) => {
      // Find relevant feature index based on dimension
      let featureIndex = 0;
      const dimensionMap = {
        workout: 0,
        meal: 1,
        sleep: 2,
        'mental-health': 3,
        schedule: 4,
        recovery: 5,
      };

      featureIndex = dimensionMap[r.dimension] || 0;

      // Adjust importance: increase if reward is positive, decrease if negative
      const adjustment = r.reward * r.weight * 0.01; // Small adjustment factor
      updated.featureImportance[featureIndex] = Math.max(0, Math.min(1, updated.featureImportance[featureIndex] + adjustment));
    });

    // Normalize importances to sum to 1
    const sum = updated.featureImportance.reduce((a, b) => a + b, 0);
    updated.featureImportance = updated.featureImportance.map((f) => f / sum);

    return updated;
  }

  /**
   * Compare two models to determine which is better
   */
  static compareModels(oldModel, newModel) {
    if (!oldModel) {
      return { shouldDeploy: true, reason: 'No previous model' };
    }

    const oldAccuracy = oldModel.trainingStats?.testAccuracy || 0;
    const newAccuracy = newModel.trainingStats?.testAccuracy || 0;
    const accuracyImprovement = newAccuracy - oldAccuracy;

    // Decision threshold: new model must be at least 2% better
    const threshold = 0.02;

    return {
      shouldDeploy: accuracyImprovement > threshold,
      reason:
        accuracyImprovement > threshold
          ? `New model is ${(accuracyImprovement * 100).toFixed(2)}% better`
          : `New model is only ${(accuracyImprovement * 100).toFixed(2)}% better (threshold: ${(threshold * 100).toFixed(1)}%)`,
      oldAccuracy,
      newAccuracy,
      accuracyImprovement,
    };
  }

  /**
   * Rollback to previous model version
   */
  static async rollbackModel(userId, previousModel) {
    try {
      const model = await UserProfileModel.findOne({ userId });
      if (!model) return null;

      // Restore to previous version
      model.modelData = previousModel.modelData;
      model.modelVersion = previousModel.modelVersion;
      model.trainingStats = previousModel.trainingStats;
      model.status = 'active';

      // Log rollback
      console.log(`Rolled back model for user: ${userId} to version ${previousModel.modelVersion}`);

      await model.save();
      return model;
    } catch (error) {
      console.error('Error rolling back model:', error);
      throw error;
    }
  }

  /**
   * Monitor model performance over time
   */
  static async monitorModelPerformance(userId) {
    try {
      const model = await UserProfileModel.findOne({ userId });
      if (!model) return null;

      // Calculate acceptance rate from recent recommendations
      const acceptanceRate = await this.calculateAcceptanceRate(userId);

      // Calculate completion rate
      const completionRate = await this.calculateCompletionRate(userId);

      // Check if performance is degrading
      if (acceptanceRate < 0.6) {
        console.log(`Warning: Low acceptance rate for user ${userId}: ${acceptanceRate}`);
        // Trigger retraining
        return this.processUserFeedback(userId);
      }

      return {
        userId,
        modelVersion: model.modelVersion,
        acceptanceRate,
        completionRate,
        personalizationScore: model.personalizationScore,
        status: 'healthy',
      };
    } catch (error) {
      console.error('Error monitoring model performance:', error);
      throw error;
    }
  }

  /**
   * Calculate acceptance rate
   */
  static async calculateAcceptanceRate(userId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const feedback = await Feedback.find({
      userId,
      timestamp: { $gte: sevenDaysAgo },
    }).lean();

    if (feedback.length === 0) return 0.5; // Default to neutral

    const accepted = feedback.filter((f) => f.accepted || f.completed).length;
    return accepted / feedback.length;
  }

  /**
   * Calculate completion rate
   */
  static async calculateCompletionRate(userId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const feedback = await Feedback.find({
      userId,
      timestamp: { $gte: sevenDaysAgo },
    }).lean();

    if (feedback.length === 0) return 0.5; // Default to neutral

    const completed = feedback.filter((f) => f.completed).length;
    return completed / feedback.length;
  }

  /**
   * Calculate model improvement trend
   */
  static async calculateModelTrend(userId) {
    const model = await UserProfileModel.findOne({ userId }).lean();
    if (!model || !model.previousVersions) return null;

    const trend = [];
    model.previousVersions.forEach((v) => {
      trend.push({
        version: v.version,
        accuracy: v.accuracy,
        timestamp: v.timestamp,
      });
    });

    // Add current version
    trend.push({
      version: model.modelVersion,
      accuracy: model.trainingStats?.testAccuracy,
      timestamp: model.lastTrainingDate,
    });

    return trend;
  }
}

module.exports = ReinforcementLearningEngine;
