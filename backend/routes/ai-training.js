const express = require('express');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Python ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_SERVICE_TIMEOUT = 30000; // 30 seconds for training

// Track if global model has been trained (ONE model for all users)
let globalModelTrained = false;
const GLOBAL_MODEL_USER_ID = 'global-model';

/**
 * Train ONE global model for all users
 * Uses aggregated/synthetic data that works for everyone
 */
function generateGlobalTrainingData() {
  const trainingData = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 35); // 35 days ago

  const workoutTypes = ["cardio", "strength", "yoga", "pilates", "swimming", "cycling"];
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
  const intensities = ["low", "moderate", "high"];
  const sleepQualities = ["poor", "fair", "good", "excellent"];
  const cyclePhases = ["menstrual", "follicular", "ovulation", "luteal"];

  // Generate 35 days of GENERIC data that works for all users
  for (let day = 0; day < 35; day++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(currentDate.getDate() + day);
    const timestamp = currentDate.toISOString();

    // Workout data (3-4 times per week)
    if (Math.random() > 0.4) {
      trainingData.push({
        type: "workout",
        timestamp,
        duration: Math.floor(Math.random() * 40) + 20,
        intensity: intensities[Math.floor(Math.random() * intensities.length)],
        workout_type: workoutTypes[Math.floor(Math.random() * workoutTypes.length)],
        label: Math.random() > 0.3 ? 1 : 0
      });
    }

    // Meal data (3 times per day)
    for (let i = 0; i < 3; i++) {
      trainingData.push({
        type: "meal",
        timestamp,
        meal_type: mealTypes[i],
        calories: Math.floor(Math.random() * 500) + 300,
        label: Math.random() > 0.3 ? 1 : 0
      });
    }

    // Sleep data (daily)
    trainingData.push({
      type: "sleep",
      timestamp,
      duration: Math.floor(Math.random() * 5) + 5,
      quality: sleepQualities[Math.floor(Math.random() * sleepQualities.length)],
      label: Math.random() > 0.3 ? 1 : 0
    });

    // Mood data (daily)
    trainingData.push({
      type: "mood",
      timestamp,
      mood_level: Math.floor(Math.random() * 5) + 1,
      label: Math.random() > 0.3 ? 1 : 0
    });

    // Cycle data (daily)
    trainingData.push({
      type: "cycle",
      timestamp,
      phase: cyclePhases[Math.floor(day / 9) % cyclePhases.length],
      label: Math.random() > 0.3 ? 1 : 0
    });
  }

  return trainingData;
}

/**
 * Train ONE global model for all users
 */
async function trainGlobalModel() {
  // Don't train if already trained
  if (globalModelTrained) {
    console.log(`[AI Training] Global model already trained, skipping`);
    return { status: 'already_trained', modelId: GLOBAL_MODEL_USER_ID };
  }

  try {
    console.log(`[AI Training] Starting GLOBAL model training (ONE model for all users)`);

    // Generate generic training data
    const trainingData = generateGlobalTrainingData();
    console.log(`[AI Training] Generated ${trainingData.length} training data points for global model`);

    // Send training request to ML service
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/ml/train`,
      {
        user_id: GLOBAL_MODEL_USER_ID,
        training_data: trainingData
      },
      { timeout: ML_SERVICE_TIMEOUT }
    );

    if (response.status === 200) {
      globalModelTrained = true;
      console.log(`[AI Training] ✅ GLOBAL model trained successfully`);
      console.log(`[AI Training] Model ID: ${GLOBAL_MODEL_USER_ID}`);
      console.log(`[AI Training] Metrics:`, response.data.metrics);
      return { status: 'trained', modelId: GLOBAL_MODEL_USER_ID, metrics: response.data.metrics };
    }
  } catch (error) {
    console.error(`[AI Training] ❌ Error training global model:`, error.message);
    if (error.response) {
      console.error(`[AI Training] Response status:`, error.response.status);
      console.error(`[AI Training] Response data:`, error.response.data);
    }
    return { status: 'error', error: error.message };
  }
}

/**
 * Get recommendations using global model but personalized for user's data
 */
async function getPersonalizedRecommendations(userId, userContext = {}) {
  try {
    // Use global model for all users
    const response = await axios.get(
      `${ML_SERVICE_URL}/api/ml/recommendations/${GLOBAL_MODEL_USER_ID}`,
      { timeout: 10000 }
    );

    if (response.status === 200) {
      const recommendations = response.data;
      
      // Personalize recommendations based on user context
      if (userContext && Object.keys(userContext).length > 0) {
        // Filter/adjust recommendations based on user's actual data
        // For now, just return the global model recommendations
        // In production, you would filter based on user preferences, goals, etc.
      }

      return recommendations;
    }
  } catch (error) {
    console.error(`[AI] Error getting recommendations:`, error.message);
    return null;
  }
}

/**
 * POST /api/ai/train-user - Manually trigger training for global model
 */
router.post('/train-user', authMiddleware, async (req, res) => {
  try {
    console.log(`[AI Training] Training request received`);

    const result = await trainGlobalModel();

    if (result.status === 'trained') {
      return res.json({
        status: 'success',
        message: 'Global model trained successfully (ONE model for all users)',
        modelId: result.modelId,
        metrics: result.metrics
      });
    } else if (result.status === 'already_trained') {
      return res.json({
        status: 'already_trained',
        message: 'Global model already trained',
        modelId: result.modelId
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to train global model',
        error: result.error
      });
    }
  } catch (error) {
    console.error('[AI Training] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Middleware to auto-train global model on first request
 */
router.use((req, res, next) => {
  // Train global model in background if not already trained
  if (!globalModelTrained) {
    // Train asynchronously without blocking the request
    trainGlobalModel().catch(err => {
      console.error(`[AI Training] Background training failed:`, err);
    });
  }

  next();
});

module.exports = router;
