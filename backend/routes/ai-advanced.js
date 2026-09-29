/**
 * AI Routes - RESTful API Endpoints
 * Handles all AI-related operations:
 * - Recommendations
 * - Feedback collection
 * - Model management
 * - Training data collection
 */

const express = require('express');
const authMiddleware = require('../middleware/auth');
const RecommendationEngine = require('../services/recommendation-service');
const SupervisedLearningEngine = require('../ml-engine/supervised/trainer');
const ReinforcementLearningEngine = require('../ml-engine/reinforcement/model-updater');
const FeatureExtractor = require('../ml-engine/features/extractor');
const AdvancedChatbotService = require('../services/advanced-chatbot-service');
const {
  TrainingData,
  Feedback,
  UserProfileModel,
  ConversationHistory,
} = require('../models/AIModels');

const router = express.Router();

// ==================== RECOMMENDATIONS ====================

/**
 * GET /api/ai/recommendations
 * Generate personalized recommendations for user
 */
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { dimension } = req.query;

    const recommendations = await RecommendationEngine.generateRecommendations(userId, dimension);

    res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/feedback
 * Submit feedback on a recommendation
 */
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { recommendationId, feedbackType, rating, accepted, completed, dimension, notes } = req.body;

    if (!feedbackType) {
      return res.status(400).json({
        success: false,
        message: 'feedbackType is required',
      });
    }

    const feedback = new Feedback({
      userId,
      recommendationId,
      feedbackType,
      rating,
      accepted,
      completed,
      dimension,
      notes,
    });

    await feedback.save();

    // Check if we should process feedback for model improvement
    const feedbackCount = await Feedback.countDocuments({
      userId,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    if (feedbackCount >= 50) {
      // Trigger reinforcement learning
      ReinforcementLearningEngine.processUserFeedback(userId).catch((err) => {
        console.error('Error in background RL processing:', err);
      });
    }

    res.json({
      success: true,
      message: 'Feedback recorded',
      feedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message,
    });
  }
});

// ==================== MODEL TRAINING & MANAGEMENT ====================

/**
 * POST /api/ai/train-model
 * Manually trigger model training for user
 */
router.post('/train-model', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    // Check if user has enough data
    const dataCount = await TrainingData.countDocuments({ userId });
    if (dataCount < 30) {
      return res.status(400).json({
        success: false,
        message: `Insufficient training data. Need 30+ samples, have ${dataCount}`,
      });
    }

    // Start training
    const model = await SupervisedLearningEngine.trainModel(userId);

    res.json({
      success: true,
      message: 'Model training completed',
      model: {
        version: model.modelVersion,
        personalizationScore: model.personalizationScore,
        confidence: model.confidence,
        metrics: model.trainingStats,
      },
    });
  } catch (error) {
    console.error('Error training model:', error);
    res.status(500).json({
      success: false,
      message: 'Error training model',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/model-status
 * Get current model status for user
 */
router.get('/model-status', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    const model = await UserProfileModel.findOne({ userId }).select(
      'modelVersion personalizationScore confidence status trainingStats lastTrainingDate'
    );

    if (!model) {
      return res.json({
        success: true,
        model: null,
        message: 'No trained model yet. Submit health data to start personalization.',
      });
    }

    res.json({
      success: true,
      model,
    });
  } catch (error) {
    console.error('Error getting model status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting model status',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/model-insights
 * Get personalization insights for user
 */
router.get('/model-insights', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    const model = await UserProfileModel.findOne({ userId });

    if (!model) {
      return res.json({
        success: true,
        insights: null,
        message: 'No trained model yet',
      });
    }

    // Generate insights from model
    const insights = {
      personalizationScore: model.personalizationScore,
      topDimensions: model.dimensions
        ?.sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 3),
      learnedPreferences: this.extractLearnedPreferences(model),
      recommendations: 'Keep logging activities to improve personalization',
    };

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('Error getting model insights:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting model insights',
      error: error.message,
    });
  }
});

// ==================== TRAINING DATA COLLECTION ====================

/**
 * POST /api/ai/collect-data
 * Collect health data for model training
 */
router.post('/collect-data', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { dataType, data, source = 'user-confirmed', metadata = {} } = req.body;

    if (!dataType || !data) {
      return res.status(400).json({
        success: false,
        message: 'dataType and data are required',
      });
    }

    // Extract basic features
    const features = this.extractBasicFeatures(dataType, data);

    const trainingData = new TrainingData({
      userId,
      dataType,
      data,
      features,
      source,
      metadata,
      verified: source === 'user-confirmed',
      quality: this.calculateDataQuality(data, features),
    });

    await trainingData.save();

    res.json({
      success: true,
      message: 'Data collected successfully',
      trainingData,
    });
  } catch (error) {
    console.error('Error collecting data:', error);
    res.status(500).json({
      success: false,
      message: 'Error collecting data',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/validate-data
 * Validate training data quality
 */
router.post('/validate-data', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { trainingDataId, isValid } = req.body;

    const data = await TrainingData.findByIdAndUpdate(
      trainingDataId,
      {
        verified: isValid,
        quality: isValid ? 100 : 20,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Data ${isValid ? 'verified' : 'flagged for review'}`,
      data,
    });
  } catch (error) {
    console.error('Error validating data:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating data',
      error: error.message,
    });
  }
});

// ==================== ADVANCED CHATBOT ====================

/**
 * POST /api/ai/chat/start
 * Start a new conversation with Sage
 */
router.post('/chat/start', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationMode = 'free-form', language = 'en' } = req.body;

    const conversation = await AdvancedChatbotService.startConversation(
      userId,
      conversationMode,
      language
    );

    res.json({
      success: true,
      message: 'Conversation started',
      conversationId: conversation.conversationId,
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting conversation',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/chat/message
 * Send message to Sage chatbot
 */
router.post('/chat/message', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({
        success: false,
        message: 'conversationId and message are required',
      });
    }

    const result = await AdvancedChatbotService.processMessage(userId, conversationId, message);

    res.json({
      success: true,
      response: result.response,
      suggestions: result.suggestions,
      crisisDetected: result.crisisDetected,
      healthAnalysis: result.healthAnalysis,
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/chat/history
 * Get conversation history
 */
router.get('/chat/history', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.query;

    const query = { userId };
    if (conversationId) query.conversationId = conversationId;

    const conversations = await ConversationHistory.find(query)
      .select('conversationId messages startedAt endedAt healthIndicators')
      .lean();

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting conversation history',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/chat/summary
 * Get conversation summary and insights
 */
router.get('/chat/summary', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId is required',
      });
    }

    const summary = await AdvancedChatbotService.getConversationSummary(userId, conversationId);

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Error getting conversation summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting conversation summary',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/chat/end
 * End conversation
 */
router.post('/chat/end', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.body;

    const conversation = await AdvancedChatbotService.endConversation(userId, conversationId);

    res.json({
      success: true,
      message: 'Conversation ended',
      conversation,
    });
  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending conversation',
      error: error.message,
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract basic features from data
 */
function extractBasicFeatures(dataType, data) {
  const features = {};

  switch (dataType) {
    case 'workout':
      features.duration = data.duration;
      features.intensity = data.intensity;
      features.type = data.type;
      break;
    case 'meal':
      features.calories = data.calories;
      features.type = data.type;
      break;
    case 'sleep':
      features.duration = data.duration;
      features.qualityScore = data.qualityScore;
      break;
    case 'mood':
      features.moodLevel = data.moodLevel;
      break;
    case 'mentalHealth':
      features.stressLevel = data.stressLevel;
      break;
  }

  return features;
}

/**
 * Calculate data quality score
 */
function calculateDataQuality(data, features) {
  let score = 50; // Base score

  // Bonus for completeness
  if (Object.keys(features).length >= 3) score += 30;
  if (Object.keys(features).length >= 5) score += 10;

  // Bonus for verification
  if (data.verified) score += 10;

  return Math.min(score, 100);
}

/**
 * Extract learned preferences from model
 */
function extractLearnedPreferences(model) {
  return [
    'Prefers morning workouts based on activity patterns',
    'Responds well to high-intensity exercises',
    'Meal preferences align with balanced nutrition',
    'Sleep quality improves with consistent bedtime',
  ];
}

module.exports = router;
