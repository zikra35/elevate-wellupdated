const axios = require('axios');
const mockSuggestions = require('./mockSuggestions');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_TIMEOUT = 5000; // 5 seconds

/**
 * Generate personalized suggestions using trained ML models
 * @param {Object} userProfile - User profile data
 * @returns {Promise<Object>} Suggestions object with workouts, meals, schedule
 */
async function generateSuggestions(userProfile) {
  try {
    console.log('[Suggestions] Calling ML service at', ML_SERVICE_URL);
    console.log('[Suggestions] User profile:', {
      goal: userProfile.goal,
      bmi: userProfile.bmi,
      age: userProfile.age,
      activity_level: userProfile.activity_level
    });
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Call ML service with user profile data
    const mlResponse = await callMLServiceWithTimeout(userProfile, today);
    
    if (mlResponse && mlResponse.recommendations) {
      console.log('[Suggestions] ✅ Using ML model recommendations');
      console.log('[Suggestions] Workout goal:', mlResponse.recommendations.workout?.goal);
      console.log('[Suggestions] Meal goal:', mlResponse.recommendations.meal?.goal);
      
      // Convert ML recommendations to suggestion format
      const suggestions = convertMLRecommendationsToSuggestions(mlResponse);
      
      return {
        suggestions,
        isMockGenerated: false,
        error: null,
        source: 'ml-model'
      };
    }
  } catch (error) {
    console.error('[Suggestions] ML service error:', error.message);
  }

  // Fallback to mock suggestions
  console.warn('[Suggestions] Falling back to mock suggestions');
  const mockSuggestionData = mockSuggestions.generateMockSuggestions(userProfile);
  return {
    suggestions: mockSuggestionData,
    isMockGenerated: true,
    error: 'ML service unavailable',
    source: 'mock'
  };
}

/**
 * Call ML service with timeout
 * @param {Object} userProfile - User profile data
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} ML recommendations
 */
async function callMLServiceWithTimeout(userProfile, date) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('ML service request timeout (5 seconds)'));
    }, ML_TIMEOUT);

    // Use POST to send user profile data
    axios.post(`${ML_SERVICE_URL}/api/ml/recommend`, {
      user_profile: userProfile,
      date: date
    }, {
      timeout: ML_TIMEOUT
    })
      .then(response => {
        clearTimeout(timeout);
        resolve(response.data);
      })
      .catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function convertMLRecommendationsToSuggestions(mlResponse) {
  const { recommendations } = mlResponse;
  
  // Get personalized workout data from ML
  const workoutData = recommendations.workout || {};
  const mealData = recommendations.meal || {};
  const bmi = mealData.bmi || 25;
  
  console.log('[Suggestions] Full ML Response:', JSON.stringify(mlResponse, null, 2));
  console.log('[Suggestions] Meal data from ML:', {
    calories: mealData.calories,
    meal_type: mealData.meal_type,
    macros: mealData.macros,
    bmi: bmi,
    has_meals_object: !!mealData.meals,
    meals_keys: mealData.meals ? Object.keys(mealData.meals) : 'N/A'
  });
  
  // Convert workout data
  const workouts = [
    {
      id: 'w1',
      name: workoutData.type_intensity || 'Recommended Workout',
      type: workoutData.intensity?.toLowerCase() || 'cardio',
      duration: workoutData.duration_minutes || 40,
      intensity: workoutData.intensity || 'moderate',
      description: workoutData.description || 'Personalized workout recommendation',
      exercises: (workoutData.exercises || []).map((ex) => ({
        name: ex,
        sets: 3,
        reps: 10,
        duration: 600
      })),
      calories: workoutData.estimated_calories || 250,
      confidence: workoutData.confidence || 75,
      goal: workoutData.goal,
      reason: workoutData.recommendation_reason || 'Personalized based on your BMI'
    }
  ];
  
  // Convert meal data - handle new detailed meal structure from ML API
  let meals = [];
  
  if (mealData.meals && typeof mealData.meals === 'object') {
    // New structure: meals object with breakfast, lunch, dinner
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    let mealId = 1;
    
    mealTypes.forEach(mealType => {
      const mealInfo = mealData.meals[mealType];
      if (mealInfo) {
        // Build food items list with quantities
        const foodItems = (mealInfo.items || [])
          .map(item => `${item.food} (${item.quantity}, ${item.plates})`)
          .join(' • ');
        
        meals.push({
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
          description: foodItems,
          confidence: mealData.confidence || 95,
          reason: mealData.recommendation_reason || 'Personalized based on your BMI',
          mealType: mealData.meal_type || 'Balanced Nutrition'
        });
        mealId++;
      }
    });
  }
  
  // Fallback if no detailed meals structure
  if (meals.length === 0) {
    const totalDailyCalories = mealData.calories || 650;
    meals = [
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
    ];
  }
  
  return {
    workouts,
    meals
  };
}

module.exports = {
  generateSuggestions
};
