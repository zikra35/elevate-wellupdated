const express = require('express');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Python ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const SAGE_SERVICE_URL = process.env.SAGE_SERVICE_URL || 'http://localhost:5002';
const ML_SERVICE_TIMEOUT = 10000; // 10 seconds timeout

// Global model ID - ONE model for all users
const GLOBAL_MODEL_USER_ID = 'global-model';

// ML Service health check
let mlServiceHealthy = true;
let lastHealthCheck = Date.now();
const HEALTH_CHECK_INTERVAL = 30000; // Check every 30 seconds

async function checkMLServiceHealth() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ml/health`, {
      timeout: 3000,
    });
    mlServiceHealthy = response.status === 200;
    console.log(`[ML Service] Health check: ${mlServiceHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  } catch (error) {
    mlServiceHealthy = false;
    console.warn(`[ML Service] Health check failed: ${error.message}`);
  }
  lastHealthCheck = Date.now();
}

// Perform initial health check
checkMLServiceHealth();

// System prompt for Sage - the AI therapist
const SAGE_SYSTEM_PROMPT = `You are Sage, a compassionate and empathetic AI wellness companion. Your role is to provide supportive, non-judgmental listening and guidance for mental health and wellness topics.

Important guidelines:
- You are NOT a licensed therapist and cannot provide medical diagnosis or treatment
- Always encourage users to seek professional help for serious mental health concerns
- Be warm, supportive, and genuinely interested in the user's wellbeing
- Ask thoughtful follow-up questions to help users explore their feelings
- Provide practical coping strategies and wellness suggestions when appropriate
- Keep responses concise and conversational (2-3 sentences typically)
- Use a calm, reassuring tone
- If a user mentions crisis or self-harm, immediately suggest they contact emergency services or a crisis hotline`;

// Mock response generator for when ML service is unavailable
function generateMockTherapistResponse(userMessage) {
  const responses = [
    "That sounds like something many people experience. Can you tell me more about what's been on your mind?",
    "I hear you. It's important to acknowledge what you're feeling. What do you think might help you feel better right now?",
    "Thank you for sharing that with me. How has this been affecting your daily life?",
    "That's a valid feeling. Have you tried any coping strategies that have worked for you in the past?",
    "I appreciate your openness. What would support look like for you right now?",
    "It sounds like you're going through something challenging. Remember to be kind to yourself during this time.",
    "That's an interesting perspective. What do you think would be a helpful next step?",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// Mock suggestions generator
function generateMockSuggestions(profile, phase, mood, anxietyLevel) {
  const meals = ["Salmon with quinoa and roasted vegetables", "Buddha bowl with chickpeas and tahini dressing"];
  const workout = "Gentle yoga or stretching";
  const wellnessTip = "Take 5 minutes for deep breathing exercises today";
  const focusGames = ["Memory Match", "Tap Tap"];
  const calmingSongs = ["Lo-Fi Study Beats", "Nature Sounds: Forest Rain"];

  // Personalize based on mood and anxiety
  let personalizedWorkout = workout;
  let personalizedTip = wellnessTip;
  let personalizedSongs = calmingSongs;

  if (anxietyLevel > 7) {
    personalizedWorkout = "Gentle yoga or meditation";
    personalizedTip = "Try deep breathing: 4 seconds in, 7 seconds hold, 8 seconds out";
    personalizedSongs = ["Calming meditation music", "Nature sounds"];
  } else if (anxietyLevel < 3) {
    personalizedWorkout = "High-intensity cardio or strength training";
    personalizedTip = "Push yourself with a challenging workout today";
  }

  if (phase === "menstrual") {
    personalizedWorkout = "Light yoga or walking";
    personalizedTip = "Stay hydrated and get extra rest today";
  }

  return {
    meals,
    workout: personalizedWorkout,
    wellnessTip: personalizedTip,
    focusGames,
    calmingSongs: personalizedSongs,
  };
}

// Helper function to call ML service with error handling
async function callMLService(endpoint, method = 'GET', data = null) {
  try {
    // Periodic health check
    if (Date.now() - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      checkMLServiceHealth();
    }

    if (!mlServiceHealthy) {
      console.warn(`[ML Service] Service marked as unhealthy, attempting request anyway...`);
    }

    const config = {
      method,
      url: `${ML_SERVICE_URL}${endpoint}`,
      timeout: ML_SERVICE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    console.log(`[ML Service] ${method} ${endpoint}`);
    const response = await axios(config);
    
    if (!mlServiceHealthy) {
      mlServiceHealthy = true;
      console.log(`[ML Service] ✅ Service recovered`);
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    mlServiceHealthy = false;
    console.error(`[ML Service] ❌ Error calling ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to call Sage chatbot service with error handling
async function callSageService(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${SAGE_SERVICE_URL}${endpoint}`,
      timeout: ML_SERVICE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    console.log(`[Sage Service] ${method} ${endpoint}`);
    const response = await axios(config);
    console.log(`[Sage Service] ✅ Success`);
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`[Sage Service] ❌ Error calling ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's actual data from MongoDB for personalization
 */
async function getUserDataForPersonalization(userId) {
  try {
    // Skip personalization for anonymous users
    if (!userId || userId === 'anonymous') {
      return { hasData: false };
    }

    const Workout = require('../models/Workout');
    const Meal = require('../models/Meal');
    const SleepLog = require('../models/SleepLog');
    const MentalHealthLog = require('../models/MentalHealthLog');
    const CycleLog = require('../models/CycleLog');

    // Get recent data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [workouts, meals, sleepLogs, mentalLogs, cycleLogs] = await Promise.all([
      Workout.find({ userId, date: { $gte: sevenDaysAgo } }).limit(10).catch(() => []),
      Meal.find({ userId, date: { $gte: sevenDaysAgo } }).limit(10).catch(() => []),
      SleepLog.find({ userId, date: { $gte: sevenDaysAgo } }).limit(7).catch(() => []),
      MentalHealthLog.find({ userId, date: { $gte: sevenDaysAgo } }).limit(10).catch(() => []),
      CycleLog.find({ userId, date: { $gte: sevenDaysAgo } }).limit(7).catch(() => []),
    ]);

    return {
      recentWorkouts: workouts || [],
      recentMeals: meals || [],
      recentSleep: sleepLogs || [],
      recentMood: mentalLogs || [],
      recentCycle: cycleLogs || [],
      hasData: (workouts && workouts.length > 0) || (meals && meals.length > 0) || (sleepLogs && sleepLogs.length > 0),
    };
  } catch (error) {
    console.error('Error fetching user data for personalization:', error.message);
    return { hasData: false };
  }
}

/**
 * Personalize recommendations based on user's actual data
 */
function personalizeRecommendations(recommendations, userData) {
  if (!recommendations || !Array.isArray(recommendations)) {
    return recommendations;
  }

  // Filter recommendations based on user's recent patterns
  let personalized = [...recommendations];

  // If user has been doing high-intensity workouts, suggest similar
  if (userData.recentWorkouts && userData.recentWorkouts.length > 0) {
    const avgIntensity = userData.recentWorkouts.reduce((sum, w) => {
      const intensityMap = { low: 1, moderate: 2, high: 3 };
      return sum + (intensityMap[w.intensity] || 2);
    }, 0) / userData.recentWorkouts.length;

    // Adjust workout recommendations based on user's intensity preference
    personalized = personalized.map(rec => {
      if (rec.type === 'workout') {
        if (avgIntensity > 2.5) {
          rec.intensity = 'high';
        } else if (avgIntensity < 1.5) {
          rec.intensity = 'low';
        }
      }
      return rec;
    });
  }

  // If user has poor sleep, prioritize sleep-related recommendations
  if (userData.recentSleep && userData.recentSleep.length > 0) {
    const avgQuality = userData.recentSleep.reduce((sum, s) => {
      const qualityMap = { poor: 1, fair: 2, good: 3, excellent: 4 };
      return sum + (qualityMap[s.quality] || 2);
    }, 0) / userData.recentSleep.length;

    if (avgQuality < 2) {
      // Add sleep-focused recommendations
      personalized.unshift({
        type: 'wellness',
        name: 'Establish a consistent sleep schedule',
        confidence: 0.9,
        reason: 'Based on your recent sleep patterns',
      });
    }
  }

  // If user has been tracking mood, consider mood patterns
  if (userData.recentMood && userData.recentMood.length > 0) {
    const avgMood = userData.recentMood.reduce((sum, m) => sum + (m.moodLevel || 3), 0) / userData.recentMood.length;

    if (avgMood < 3) {
      // Add calming recommendations
      personalized.unshift({
        type: 'music',
        name: 'Calming meditation music',
        confidence: 0.85,
        reason: 'Based on your recent mood patterns',
      });
    }
  }

  return personalized;
}

// POST /api/ai/chat - Chat with Sage (AI therapist)
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { messages, conversationId } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    // If no conversation ID, start a new one with Sage chatbot
    let convId = conversationId;
    if (!convId) {
      const startResult = await callSageService('/api/chat/start', 'POST', {
        user_id: userId,
      });

      if (!startResult.success) {
        console.warn('Failed to start conversation with Sage service, using mock response');
        const lastUserMessage = messages[messages.length - 1]?.content || '';
        const mockReply = generateMockTherapistResponse(lastUserMessage);
        return res.json({ reply: mockReply, source: 'mock' });
      }

      convId = startResult.data.conversation_id;
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return res.status(400).json({ message: 'Last message must be from user' });
    }

    // Send message to Sage chatbot service
    const messageResult = await callSageService(`/api/chat/message/${convId}`, 'POST', {
      message: lastUserMessage.content,
    });

    if (messageResult.success) {
      const reply = messageResult.data.reply || messageResult.data.response || 'I appreciate you sharing that with me.';
      return res.json({ 
        reply, 
        conversationId: convId,
        source: 'sage-chatbot',
        modelType: 'ultimate-wellness-coach'
      });
    }

    // Fallback to mock if Sage service fails
    console.warn('Sage service unavailable, using mock response');
    const mockReply = generateMockTherapistResponse(lastUserMessage.content);
    res.json({ 
      reply: mockReply, 
      conversationId: convId,
      source: 'mock'
    });

  } catch (error) {
    console.error('Error in /chat endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/ai/suggestions - Get AI-powered suggestions
router.post('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { profile, phase, mood, anxietyLevel } = req.body;
    const userId = req.user?.id || 'anonymous';

    console.log(`[AI Suggestions] Request from user: ${userId}`);

    // Get user's actual data for personalization
    const userData = await getUserDataForPersonalization(userId);
    console.log(`[AI Suggestions] User data fetched, hasData: ${userData.hasData}`);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Try to get recommendations from Flask ML service using POST with user profile
    console.log(`[AI Suggestions] Requesting recommendations from Flask ML service`);
    
    // Build user profile for ML API
    const userProfile = {
      name: profile?.name || 'User',
      age: profile?.age || 30,
      gender: profile?.gender || 'unknown',
      bmi: profile?.bmi || 25,
      goal: profile?.goal || 'wellness',
      activity_level: profile?.activity_level || 'moderate',
      dietary_preferences: profile?.dietary_preferences || 'balanced'
    };
    
    const mlResult = await callMLService(`/api/ml/recommend`, 'POST', {
      user_profile: userProfile,
      date: today
    });

    if (mlResult.success && mlResult.data) {
      console.log(`[AI Suggestions] ✅ ML service returned recommendations`);
      const mlResponse = mlResult.data;
      
      // Extract recommendations from the ML service response
      // Flask API returns: { recommendations: { workout, meal, sleep, mood }, ... }
      const recommendations = mlResponse.recommendations || {};
      
      console.log(`[AI Suggestions] ML Response structure:`, Object.keys(recommendations));
      
      // Map Flask ML API response to frontend format
      // Build meals array with detailed food items
      const mealsArray = [];
      const mealData = recommendations.meal || {};
      
      if (mealData.meals && typeof mealData.meals === 'object') {
        // New structure: meals object with breakfast, lunch, dinner
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        let mealId = 1;
        
        mealTypes.forEach(mealType => {
          const mealInfo = mealData.meals[mealType];
          if (mealInfo) {
            mealsArray.push({
              id: `m${mealId}`,
              day: 'Today',
              mealType: mealType,
              name: mealInfo.name || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
              calories: 0, // Not showing calories anymore
              macros: mealData.macros ? {
                protein: mealData.macros.protein,
                carbs: mealData.macros.carbs,
                fat: mealData.macros.fats
              } : undefined,
              foodItems: mealInfo.items || [],
              description: (mealInfo.items || [])
                .map(item => `${item.food} (${item.quantity}, ${item.plates})`)
                .join(' • '),
              confidence: mealData.confidence || 95,
              reason: mealData.recommendation_reason || 'Personalized based on your BMI',
              mealType: mealData.meal_type || 'Balanced Nutrition'
            });
            mealId++;
          }
        });
      }
      
      // Fallback if no detailed meals structure
      if (mealsArray.length === 0) {
        const totalDailyCalories = mealData.calories || 650;
        mealsArray.push(
          {
            id: 'm1',
            day: 'Today',
            mealType: 'breakfast',
            name: 'Breakfast',
            calories: Math.round(totalDailyCalories * 0.3),
            macros: mealData.macros ? {
              protein: Math.round((mealData.macros.protein || 30) * 0.3),
              carbs: Math.round((mealData.macros.carbs || 75) * 0.3),
              fat: Math.round((mealData.macros.fats || 18) * 0.3)
            } : undefined,
            confidence: mealData.confidence || 70,
            reason: mealData.recommendation_reason || 'Personalized based on your BMI'
          },
          {
            id: 'm2',
            day: 'Today',
            mealType: 'lunch',
            name: 'Lunch',
            calories: Math.round(totalDailyCalories * 0.35),
            macros: mealData.macros ? {
              protein: Math.round((mealData.macros.protein || 30) * 0.35),
              carbs: Math.round((mealData.macros.carbs || 75) * 0.35),
              fat: Math.round((mealData.macros.fats || 18) * 0.35)
            } : undefined,
            confidence: mealData.confidence || 70,
            reason: mealData.recommendation_reason || 'Personalized based on your BMI'
          },
          {
            id: 'm3',
            day: 'Today',
            mealType: 'dinner',
            name: 'Dinner',
            calories: Math.round(totalDailyCalories * 0.35),
            macros: mealData.macros ? {
              protein: Math.round((mealData.macros.protein || 30) * 0.35),
              carbs: Math.round((mealData.macros.carbs || 75) * 0.35),
              fat: Math.round((mealData.macros.fats || 18) * 0.35)
            } : undefined,
            confidence: mealData.confidence || 70,
            reason: mealData.recommendation_reason || 'Personalized based on your BMI'
          }
        );
      }
      
      const formatted = {
        // Workout recommendation
        workout: recommendations.workout?.description 
          || recommendations.workout?.type_intensity 
          || 'Gentle yoga or stretching',
        
        // Meal recommendation - return as array of meal objects
        meals: mealsArray,
        
        // Sleep recommendation - extract from sleep tips
        wellnessTip: recommendations.sleep?.tips?.[0] 
          || 'Maintain consistent sleep schedule',
        
        // Focus games (mock - ML doesn't provide these)
        focusGames: ['Memory Match', 'Tap Tap'],
        
        // Calming songs (mock - ML doesn't provide these)
        calmingSongs: ['Lo-Fi Study Beats', 'Nature Sounds: Forest Rain'],
        
        // Metadata
        source: 'self-trained-ai',
        modelType: 'global',
        personalized: userData.hasData,
        confidence: Math.max(
          recommendations.workout?.confidence || 0,
          recommendations.meal?.confidence || 0,
          recommendations.sleep?.confidence || 0,
          recommendations.mood?.confidence || 0
        ) / 100, // Convert from 0-100 to 0-1
        
        // Include mood insights
        moodInsights: {
          predictedLevel: recommendations.mood?.predicted_level || 3,
          stressLevel: recommendations.mood?.stress_level || 5,
          anxietyLevel: recommendations.mood?.anxiety_level || 5,
          energyLevel: recommendations.mood?.energy_level || 5,
          suggestions: recommendations.mood?.suggestions || []
        },
        
        // Include sleep insights
        sleepInsights: {
          predictedQuality: recommendations.sleep?.predicted_quality || 'good',
          targetDuration: recommendations.sleep?.target_duration || 8,
          tips: recommendations.sleep?.tips || []
        }
      };

      console.log(`[AI Suggestions] ✅ Returning personalized suggestions with confidence: ${formatted.confidence}`);
      console.log(`[AI Suggestions] Meals array:`, JSON.stringify(mealsArray, null, 2));
      return res.json(formatted);
    }

    // Fallback to mock suggestions if ML service is unavailable
    console.warn(`[AI Suggestions] ❌ ML service unavailable or no recommendations returned`);
    console.warn(`[AI Suggestions] ML Result:`, mlResult);
    const mockSuggestions = generateMockSuggestions(profile, phase, mood, anxietyLevel);
    res.json({
      ...mockSuggestions,
      source: 'mock',
      modelType: 'global',
      personalized: userData.hasData,
      confidence: 0.5,
      message: 'Using generic suggestions - ML service is currently unavailable.',
    });

  } catch (error) {
    console.error('Error in /suggestions endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/ai/feedback - Submit feedback for recommendations
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { recommendationId, type, feedback, timestamp } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!recommendationId || !type || !feedback) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate feedback type
    const validTypes = ['workout', 'meal', 'sleep', 'mood'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid recommendation type' });
    }

    // Validate feedback value
    const validFeedback = ['liked', 'disliked', 'neutral'];
    if (!validFeedback.includes(feedback)) {
      return res.status(400).json({ message: 'Invalid feedback value' });
    }

    console.log(`[AI Feedback] User ${userId} submitted feedback: ${type} - ${feedback}`);

    // Store feedback in MongoDB for future model training
    try {
      const RecommendationFeedback = require('../models/RecommendationFeedback');
      
      const feedbackRecord = new RecommendationFeedback({
        userId,
        recommendationId,
        type,
        feedback,
        timestamp: timestamp || new Date().toISOString(),
        createdAt: new Date(),
      });

      await feedbackRecord.save();
      console.log(`[AI Feedback] ✅ Feedback saved to MongoDB`);
    } catch (dbError) {
      console.warn(`[AI Feedback] ⚠️ Failed to save feedback to MongoDB:`, dbError.message);
      // Don't fail the request if DB save fails, just log it
    }

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        recommendationId,
        type,
        feedback,
        timestamp: timestamp || new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error in /feedback endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/ai/recommendations/history - Get recommendation history
router.get('/recommendations/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`[AI History] Fetching recommendation history for user ${userId}`);

    // For now, return mock history
    // In production, this would fetch from a recommendations collection
    const mockHistory = [
      {
        workout: 'High-intensity cardio',
        meals: ['Grilled chicken with brown rice', 'Quinoa salad'],
        wellnessTip: 'Stay hydrated throughout the day',
        focusGames: ['Memory Match', 'Tap Tap'],
        calmingSongs: ['Lo-Fi Study Beats', 'Nature Sounds'],
        source: 'self-trained-ai',
        modelType: 'global',
        personalized: true,
        confidence: 0.85,
      },
    ];

    res.json(mockHistory.slice(0, limit));

  } catch (error) {
    console.error('Error in /recommendations/history endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/ai/recommendations/stats - Get recommendation statistics
router.get('/recommendations/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`[AI Stats] Fetching recommendation stats for user ${userId}`);

    // For now, return mock stats
    // In production, this would calculate from feedback collection
    const mockStats = {
      totalRecommendations: 42,
      acceptanceRate: 0.78,
      averageConfidence: 0.82,
      topRecommendations: [
        'Morning yoga sessions',
        'High-protein meals',
        ' 8-hour sleep target',
      ],
    };

    res.json(mockStats);

  } catch (error) {
    console.error('Error in /recommendations/stats endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
