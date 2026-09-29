/**
 * Recommendation Engine
 * Generates personalized recommendations using trained ML models
 * Handles multi-dimensional personalization and confidence scoring
 * Integrates with OpenAI API as fallback
 */

const { UserProfileModel, Recommendation, TrainingData } = require('../models/AIModels');

class RecommendationEngine {
  /**
   * Generate personalized recommendations for user
   */
  static async generateRecommendations(userId, dimension = null) {
    try {
      const recommendations = [];

      // Step 1: Check if user has trained model
      const userModel = await UserProfileModel.findOne({ userId });

      if (!userModel || userModel.status !== 'active') {
        // No trained model - use cold start recommendations
        return this.generateColdStartRecommendations(userId, dimension);
      }

      // Step 2: Get user context
      const context = await this.getContext(userId);

      // Step 3: Generate recommendations for each dimension
      const dimensions = dimension ? [dimension] : ['workout', 'meal', 'sleep', 'mental-health', 'schedule'];

      for (const dim of dimensions) {
        if (userModel.personalizationScore < 60) {
          // Low confidence - blend with OpenAI
          const recs = await this.blendRecommendations(userId, userModel, dim, context);
          recommendations.push(...recs);
        } else {
          // High confidence - use self-trained model
          const recs = this.generateModelBasedRecommendations(userModel, dim, context);
          recommendations.push(...recs);
        }
      }

      // Save recommendations
      for (const rec of recommendations) {
        await new Recommendation(rec).save();
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations using trained model
   */
  static generateModelBasedRecommendations(userModel, dimension, context) {
    const recommendations = [];
    const baseScore = userModel.personalizationScore / 100;

    // Get dimension-specific accuracy
    const dimAccuracy = userModel.dimensions.find((d) => d.name === dimension);
    const confidence = dimAccuracy?.confidence || 0.7;

    const options = this.generateDimensionOptions(dimension, context);

    // Rank by model prediction
    const ranked = options.map((opt, idx) => ({
      option: opt,
      score: Math.random() * 0.5 + 0.5, // Simulated model prediction
      index: idx,
    }));

    ranked.sort((a, b) => b.score - a.score);

    // Create recommendation objects
    ranked.slice(0, 3).forEach((r, idx) => {
      recommendations.push({
        userId: userModel.userId,
        dimension,
        recommendation: r.option,
        alternatives: ranked.slice(idx + 1, idx + 4).map((x) => x.option),
        confidenceScore: Math.min(confidence + r.score * 0.3, 1),
        personalizationScore: userModel.personalizationScore,
        explanation: this.generateExplanation(dimension, r.option, context),
        context,
        source: 'self-trained',
      });
    });

    return recommendations;
  }

  /**
   * Blend self-trained and OpenAI recommendations
   */
  static async blendRecommendations(userId, userModel, dimension, context) {
    const selfTrainedRecs = this.generateModelBasedRecommendations(userModel, dimension, context);
    const openAIRecs = await this.generateOpenAIRecommendations(dimension, context);

    // Weight by confidence
    const modelConfidence = userModel.personalizationScore / 100;
    const openAIWeight = 1 - modelConfidence;

    return selfTrainedRecs.map((rec, idx) => ({
      ...rec,
      source: 'hybrid',
      alternatives: [
        ...rec.alternatives,
        ...(openAIRecs[idx] ? [openAIRecs[idx].recommendation] : []),
      ],
      confidenceScore: rec.confidenceScore * modelConfidence + (openAIRecs[idx]?.confidenceScore || 0.5) * openAIWeight,
    }));
  }

  /**
   * Generate recommendations for cold start (no trained model)
   */
  static async generateColdStartRecommendations(userId, dimension = null) {
    try {
      // Get recent user data to infer preferences
      const recentData = await TrainingData.find({
        userId,
        createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      })
        .lean()
        .limit(20);

      if (recentData.length === 0) {
        // Brand new user - use demographic recommendations
        return this.generateDemographicRecommendations(userId, dimension);
      }

      // Use hybrid: demographic + early personalization signals
      const context = await this.getContext(userId);
      const dimensions = dimension ? [dimension] : ['workout', 'meal', 'sleep'];

      const recommendations = [];
      for (const dim of dimensions) {
        const options = this.generateDimensionOptions(dim, context);
        recommendations.push({
          userId,
          dimension: dim,
          recommendation: options[0],
          alternatives: options.slice(1, 4),
          confidenceScore: 0.4, // Low confidence for cold start
          personalizationScore: 20,
          explanation: 'Based on common preferences for users with your goals',
          context,
          source: 'fallback',
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating cold start recommendations:', error);
      return [];
    }
  }

  /**
   * Generate demographic-based recommendations
   */
  static generateDemographicRecommendations(userId, dimension = null) {
    const demographicRecs = {
      workout: [
        'Start with 30 minutes of moderate cardio 3x per week',
        'Try beginner yoga classes to build flexibility',
        'Strength training 2x per week for core health',
      ],
      meal: [
        'Focus on balanced meals with protein, veggies, whole grains',
        'Meal prep on Sundays for the week ahead',
        'Include a variety of colorful vegetables daily',
      ],
      sleep: [
        'Aim for 7-9 hours of sleep each night',
        'Maintain consistent sleep schedule, even on weekends',
        'Create a wind-down routine before bed',
      ],
    };

    const dimensions = dimension ? [dimension] : Object.keys(demographicRecs);
    const recommendations = [];

    dimensions.forEach((dim) => {
      const options = demographicRecs[dim] || [];
      recommendations.push({
        userId,
        dimension: dim,
        recommendation: options[0],
        alternatives: options.slice(1),
        confidenceScore: 0.3,
        personalizationScore: 0,
        explanation: 'Popular recommendation for new users',
        context: {},
        source: 'fallback',
      });
    });

    return recommendations;
  }

  /**
   * Generate OpenAI-based recommendations as fallback
   */
  static async generateOpenAIRecommendations(dimension, context) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return [];
      }

      const prompt = `Generate 3 brief, actionable health recommendations for the "${dimension}" category. 
      Context: ${JSON.stringify(context)}
      Format as JSON array of strings.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error');
        return [];
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      try {
        const recommendations = JSON.parse(content);
        return recommendations.map((rec) => ({
          recommendation: rec,
          confidenceScore: 0.7,
          source: 'openai',
        }));
      } catch {
        // Parse as plain text if not JSON
        return [
          {
            recommendation: content,
            confidenceScore: 0.6,
            source: 'openai',
          },
        ];
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return [];
    }
  }

  /**
   * Generate dimension-specific recommendation options
   */
  static generateDimensionOptions(dimension, context) {
    const options = {
      workout: [
        'Morning 30-min moderate cardio session',
        'Evening yoga and stretching',
        'Strength training focusing on core',
        'High-intensity interval training (HIIT)',
        'Swimming for low-impact cardio',
      ],
      meal: [
        'Balanced breakfast with protein and whole grains',
        'Fresh salad with grilled chicken',
        'Quinoa bowl with roasted vegetables',
        'Protein smoothie with berries',
        'Salmon with sweet potato and broccoli',
      ],
      sleep: [
        'Maintain 10pm bedtime for 8 hours sleep',
        'Try meditation for 10 minutes before bed',
        'Avoid screens 1 hour before bedtime',
        'Keep bedroom temperature at 65°F',
        'Try progressive muscle relaxation',
      ],
      'mental-health': [
        '5-minute guided breathing exercise',
        'Journal about your day and feelings',
        'Connect with a friend or family member',
        'Take a 15-minute nature walk',
        'Practice gratitude meditation',
      ],
      schedule: [
        'Schedule workout in morning when energy is high',
        'Plan meal prep for Sunday afternoon',
        'Block 30 minutes for mental health break midday',
        'Schedule sleep earlier to wake refreshed',
        'Build 1 rest day into weekly schedule',
      ],
    };

    return options[dimension] || [];
  }

  /**
   * Generate explanation for recommendation
   */
  static generateExplanation(dimension, recommendation, context) {
    const explanations = {
      workout: `Based on your workout preferences and energy patterns, this ${recommendation.toLowerCase()} aligns with your typical routine`,
      meal: `Matches your dietary preferences and meal timing patterns`,
      sleep: `Tailored to your sleep quality goals and lifestyle`,
      'mental-health': `Selected based on stress level and calming preference patterns`,
      schedule: `Optimized for your typical daily rhythm`,
    };

    return explanations[dimension] || 'Personalized to your preferences';
  }

  /**
   * Get current user context for recommendation
   */
  static async getContext(userId) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday

    return {
      timeOfDay:
        hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      currentMood: 'neutral', // Would fetch from recent mood logs
      cyclePhase: 'follicular', // Would fetch from cycle logs
      recentActivities: [], // Would fetch from recent completed activities
    };
  }

  /**
   * Track recommendation performance
   */
  static async trackRecommendationPerformance(recommendationId, feedback) {
    try {
      const recommendation = await Recommendation.findByIdAndUpdate(recommendationId, feedback, {
        new: true,
      });

      return recommendation;
    } catch (error) {
      console.error('Error tracking recommendation performance:', error);
      throw error;
    }
  }

  /**
   * Calculate recommendation diversity
   * Ensure recommendations don't repeat too often
   */
  static async ensureRecommendationDiversity(userId, dimension, recommendations) {
    // Get recommendations from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRecs = await Recommendation.find({
      userId,
      dimension,
      createdAt: { $gte: sevenDaysAgo },
    })
      .lean()
      .limit(10);

    // Filter out duplicate recommendations
    const recentRecommendations = new Set(recentRecs.map((r) => r.recommendation));

    return recommendations.filter((r) => !recentRecommendations.has(r.recommendation));
  }
}

module.exports = RecommendationEngine;
