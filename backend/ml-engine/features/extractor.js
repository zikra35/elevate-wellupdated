/**
 * Feature Extraction Service
 * Converts raw health data into normalized feature vectors for ML training
 */

const { TrainingData, FeatureVector } = require('../models/AIModels');

class FeatureExtractor {
  /**
   * Extract features from all user data and create feature vector
   */
  static async extractUserFeatures(userId) {
    try {
      // Collect all user data from the last 30-90 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const trainingDataPoints = await TrainingData.find({
        userId,
        createdAt: { $gte: ninetyDaysAgo },
      }).lean();

      if (trainingDataPoints.length === 0) {
        return null; // Insufficient data
      }

      // Extract features by dimension
      const features = {
        workoutFrequency: this.extractWorkoutFrequency(trainingDataPoints),
        workoutIntensity: this.extractWorkoutIntensity(trainingDataPoints),
        workoutTypePreference: this.extractWorkoutTypePreference(trainingDataPoints),
        mealTiming: this.extractMealTiming(trainingDataPoints),
        mealTypes: this.extractMealTypes(trainingDataPoints),
        dietaryRestrictions: this.extractDietaryRestrictions(trainingDataPoints),
        sleepDuration: this.extractSleepDuration(trainingDataPoints),
        sleepQuality: this.extractSleepQuality(trainingDataPoints),
        moodPattern: this.extractMoodPattern(trainingDataPoints),
        stressLevel: this.extractStressLevel(trainingDataPoints),
        cyclePhaseAwareness: this.extractCyclePhaseAwareness(trainingDataPoints),
        goalProgressRate: this.extractGoalProgressRate(trainingDataPoints),
        feedbackPatterns: this.extractFeedbackPatterns(trainingDataPoints),
        timePreference: this.extractTimePreference(trainingDataPoints),
        recoveryPreference: this.extractRecoveryPreference(trainingDataPoints),
        socialPreference: this.extractSocialPreference(trainingDataPoints),
      };

      // Calculate statistics
      const aggregateStats = this.calculateAggregateStats(features);
      const correlations = this.calculateCorrelations(features);
      const confidenceFlags = this.calculateConfidenceFlags(features, trainingDataPoints);

      // Normalize features to 0-1 range
      const normalizedFeatures = this.normalizeFeatures(features);

      // Create feature vector
      const featureVector = new FeatureVector({
        userId,
        features: normalizedFeatures,
        aggregateStats,
        correlations,
        confidenceFlags,
      });

      await featureVector.save();
      return featureVector;
    } catch (error) {
      console.error('Error extracting user features:', error);
      throw error;
    }
  }

  /**
   * Extract workout frequency (workouts per week)
   */
  static extractWorkoutFrequency(trainingDataPoints) {
    const workouts = trainingDataPoints.filter((p) => p.dataType === 'workout');
    if (workouts.length === 0) return 0;

    const weeks = 12; // Analyze last 12 weeks
    return Math.min(workouts.length / weeks, 1); // Normalize: max 7/week
  }

  /**
   * Extract workout intensity preference (high/moderate/low)
   */
  static extractWorkoutIntensity(trainingDataPoints) {
    const workouts = trainingDataPoints.filter(
      (p) => p.dataType === 'workout' && p.features && p.features.intensity
    );
    if (workouts.length === 0) return 0.5;

    const intensityMap = { low: 0.33, moderate: 0.66, high: 1 };
    const avgIntensity =
      workouts.reduce((sum, w) => sum + (intensityMap[w.features.intensity] || 0.5), 0) /
      workouts.length;
    return avgIntensity;
  }

  /**
   * Extract workout type preferences
   */
  static extractWorkoutTypePreference(trainingDataPoints) {
    const workouts = trainingDataPoints.filter(
      (p) => p.dataType === 'workout' && p.features && p.features.type
    );
    if (workouts.length === 0) return [];

    const typeCounts = {};
    workouts.forEach((w) => {
      typeCounts[w.features.type] = (typeCounts[w.features.type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        value: Math.min(count / workouts.length, 1),
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Extract meal timing preference
   */
  static extractMealTiming(trainingDataPoints) {
    const meals = trainingDataPoints.filter((p) => p.dataType === 'meal');
    if (meals.length === 0) return 0.5;

    // Analyze time of day distribution (0 = night, 1 = day)
    const avgHour =
      meals.reduce((sum, m) => {
        const date = new Date(m.createdAt);
        return sum + date.getHours();
      }, 0) / meals.length;

    return Math.min(avgHour / 24, 1);
  }

  /**
   * Extract meal type preferences
   */
  static extractMealTypes(trainingDataPoints) {
    const meals = trainingDataPoints.filter((p) => p.dataType === 'meal');
    if (meals.length === 0) return [];

    const typeCounts = {};
    meals.forEach((m) => {
      if (m.data && m.data.type) {
        typeCounts[m.data.type] = (typeCounts[m.data.type] || 0) + 1;
      }
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        value: Math.min(count / meals.length, 1),
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Extract dietary restrictions
   */
  static extractDietaryRestrictions(trainingDataPoints) {
    const meals = trainingDataPoints.filter((p) => p.dataType === 'meal');
    const restrictions = new Set();
    meals.forEach((m) => {
      if (m.data && m.data.restrictions && Array.isArray(m.data.restrictions)) {
        m.data.restrictions.forEach((r) => restrictions.add(r));
      }
    });
    return Array.from(restrictions);
  }

  /**
   * Extract sleep duration preference
   */
  static extractSleepDuration(trainingDataPoints) {
    const sleepLogs = trainingDataPoints.filter((p) => p.dataType === 'sleep');
    if (sleepLogs.length === 0) return 0.5;

    const avgDuration =
      sleepLogs.reduce((sum, s) => sum + (s.features?.duration || 0), 0) / sleepLogs.length;
    // Normalize to 0-1 (target: 8 hours)
    return Math.min(avgDuration / 8, 1);
  }

  /**
   * Extract sleep quality preference
   */
  static extractSleepQuality(trainingDataPoints) {
    const sleepLogs = trainingDataPoints.filter(
      (p) => p.dataType === 'sleep' && p.features && p.features.qualityScore
    );
    if (sleepLogs.length === 0) return 0.5;

    const avgQuality =
      sleepLogs.reduce((sum, s) => sum + s.features.qualityScore, 0) / sleepLogs.length;
    return Math.min(avgQuality / 10, 1); // Normalize: 0-10 scale
  }

  /**
   * Extract mood pattern
   */
  static extractMoodPattern(trainingDataPoints) {
    const moodLogs = trainingDataPoints.filter(
      (p) => p.dataType === 'mood' && p.features && p.features.moodLevel
    );
    if (moodLogs.length === 0) return 0;

    // -1 = very negative, 0 = neutral, 1 = very positive
    const avgMood = moodLogs.reduce((sum, m) => sum + (m.features.moodLevel - 5) / 5, 0) / moodLogs.length;
    return Math.max(-1, Math.min(1, avgMood));
  }

  /**
   * Extract stress level
   */
  static extractStressLevel(trainingDataPoints) {
    const stressLogs = trainingDataPoints.filter(
      (p) => p.dataType === 'mentalHealth' && p.features && p.features.stressLevel
    );
    if (stressLogs.length === 0) return 0.5;

    const avgStress =
      stressLogs.reduce((sum, s) => sum + s.features.stressLevel, 0) / stressLogs.length;
    return Math.min(avgStress / 10, 1); // Normalize: 0-10 scale
  }

  /**
   * Extract cycle phase awareness
   */
  static extractCyclePhaseAwareness(trainingDataPoints) {
    const cycleLogs = trainingDataPoints.filter((p) => p.dataType === 'cycle');
    if (cycleLogs.length === 0) return 0;

    // 1 if user tracks cycle, 0 if not
    return cycleLogs.length > 0 ? 1 : 0;
  }

  /**
   * Extract goal progress rate
   */
  static extractGoalProgressRate(trainingDataPoints) {
    // This would require access to Goal model
    // For now, calculate based on activity consistency
    const allActivities = trainingDataPoints.length;
    const expectedActivities = 30 * 7; // Expected per 90 days
    return Math.min(allActivities / expectedActivities, 1);
  }

  /**
   * Extract feedback patterns
   */
  static extractFeedbackPatterns(trainingDataPoints) {
    // Estimate feedback engagement (0-1)
    // Higher if data is detailed and verified
    const verifiedData = trainingDataPoints.filter((p) => p.verified).length;
    const reliability = trainingDataPoints.reduce((sum, p) => sum + (p.reliability || 0.5), 0) / trainingDataPoints.length;
    return (verifiedData / trainingDataPoints.length + reliability) / 2;
  }

  /**
   * Extract time preference (morning/afternoon/evening)
   */
  static extractTimePreference(trainingDataPoints) {
    const activityByHour = {};
    trainingDataPoints.forEach((p) => {
      const hour = new Date(p.createdAt).getHours();
      activityByHour[hour] = (activityByHour[hour] || 0) + 1;
    });

    let maxHour = 0;
    let maxCount = 0;
    Object.entries(activityByHour).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = parseInt(hour);
      }
    });

    if (maxHour < 12) return 'morning';
    if (maxHour < 17) return 'afternoon';
    return 'evening';
  }

  /**
   * Extract recovery preference
   */
  static extractRecoveryPreference(trainingDataPoints) {
    // Based on rest days and recovery activities
    const restDays = trainingDataPoints.filter((p) => {
      const intensity = p.features?.intensity;
      return !intensity || intensity === 'low';
    }).length;

    return Math.min(restDays / trainingDataPoints.length, 1);
  }

  /**
   * Extract social preference
   */
  static extractSocialPreference(trainingDataPoints) {
    // Based on group activities vs solo
    const groupActivities = trainingDataPoints.filter((p) => p.data?.isGroup).length;
    return Math.min(groupActivities / trainingDataPoints.length, 1);
  }

  /**
   * Normalize features to 0-1 range
   */
  static normalizeFeatures(features) {
    const normalized = { ...features };

    Object.keys(normalized).forEach((key) => {
      if (typeof normalized[key] === 'number') {
        normalized[key] = Math.max(0, Math.min(1, normalized[key]));
      }
    });

    return normalized;
  }

  /**
   * Calculate aggregate statistics
   */
  static calculateAggregateStats(features) {
    return {
      mean: features,
      median: features, // Simplified for demo
      standardDeviation: {}, // Would calculate actual std dev in production
    };
  }

  /**
   * Calculate correlations between features
   */
  static calculateCorrelations(features) {
    // Example correlations
    return {
      stressAndMood: -0.7, // High stress correlates with low mood
      workoutFrequencyAndMood: 0.6, // More workouts correlate with better mood
      sleepQualityAndStress: -0.8, // Better sleep correlates with lower stress
    };
  }

  /**
   * Calculate confidence flags for features
   */
  static calculateConfidenceFlags(features, trainingDataPoints) {
    const flags = [];

    // Flag dimensions with insufficient data
    const dimensionCounts = {
      workout: trainingDataPoints.filter((p) => p.dataType === 'workout').length,
      meal: trainingDataPoints.filter((p) => p.dataType === 'meal').length,
      sleep: trainingDataPoints.filter((p) => p.dataType === 'sleep').length,
      mood: trainingDataPoints.filter((p) => p.dataType === 'mood').length,
      cycle: trainingDataPoints.filter((p) => p.dataType === 'cycle').length,
    };

    Object.entries(dimensionCounts).forEach(([dimension, count]) => {
      const confidence = Math.min(count / 30, 1); // Normalize: 30 samples = high confidence
      if (confidence < 0.5) {
        flags.push({
          dimension,
          confidence,
          notes: `Only ${count} data points for ${dimension}`,
        });
      }
    });

    return flags;
  }
}

module.exports = FeatureExtractor;
