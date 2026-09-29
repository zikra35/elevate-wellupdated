/**
 * Generate mock suggestions based on user profile
 * Used as fallback when OpenAI API is unavailable
 * @param {Object} userProfile - User profile data
 * @returns {Object} Mock suggestions
 */
function generateMockSuggestions(userProfile) {
  const { goal, activity_level, dietary_preferences } = userProfile;

  // Determine intensity based on activity level
  const intensityMap = {
    'sedentary': 'low',
    'lightly_active': 'low',
    'moderately_active': 'moderate',
    'very_active': 'high',
    'extremely_active': 'high'
  };

  const intensity = intensityMap[activity_level] || 'moderate';

  // Generate workouts based on goal
  const workouts = generateMockWorkouts(goal, intensity);

  // Generate meals based on dietary preferences
  const meals = generateMockMeals(dietary_preferences);

  // Generate schedule
  const schedule = generateMockSchedule();

  return {
    workouts,
    meals,
    schedule
  };
}

/**
 * Generate mock workouts
 * @param {string} goal - User's primary goal
 * @param {string} intensity - Workout intensity
 * @returns {Array} Mock workout suggestions
 */
function generateMockWorkouts(goal, intensity) {
  const workoutsByGoal = {
    'weight_loss': [
      {
        id: 'w1',
        name: 'Morning Cardio',
        type: 'cardio',
        duration: 30,
        intensity: intensity,
        description: 'Steady-state cardio to burn calories',
        exercises: [
          { name: 'Running', sets: 1, reps: 0, duration: 30 }
        ]
      },
      {
        id: 'w2',
        name: 'HIIT Training',
        type: 'cardio',
        duration: 20,
        intensity: 'high',
        description: 'High-intensity interval training',
        exercises: [
          { name: 'Burpees', sets: 3, reps: 10, duration: 0 },
          { name: 'Jump Squats', sets: 3, reps: 15, duration: 0 }
        ]
      },
      {
        id: 'w3',
        name: 'Strength Training',
        type: 'strength',
        duration: 45,
        intensity: intensity,
        description: 'Full body strength workout',
        exercises: [
          { name: 'Squats', sets: 3, reps: 12, duration: 0 },
          { name: 'Bench Press', sets: 3, reps: 10, duration: 0 },
          { name: 'Deadlifts', sets: 3, reps: 8, duration: 0 }
        ]
      }
    ],
    'muscle_gain': [
      {
        id: 'w1',
        name: 'Upper Body Strength',
        type: 'strength',
        duration: 60,
        intensity: 'high',
        description: 'Focus on chest, back, and arms',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: 8, duration: 0 },
          { name: 'Barbell Rows', sets: 4, reps: 8, duration: 0 },
          { name: 'Pull-ups', sets: 3, reps: 10, duration: 0 }
        ]
      },
      {
        id: 'w2',
        name: 'Lower Body Strength',
        type: 'strength',
        duration: 60,
        intensity: 'high',
        description: 'Focus on legs and glutes',
        exercises: [
          { name: 'Squats', sets: 4, reps: 8, duration: 0 },
          { name: 'Leg Press', sets: 3, reps: 10, duration: 0 },
          { name: 'Leg Curls', sets: 3, reps: 12, duration: 0 }
        ]
      },
      {
        id: 'w3',
        name: 'Core and Stability',
        type: 'strength',
        duration: 30,
        intensity: 'moderate',
        description: 'Build core strength',
        exercises: [
          { name: 'Planks', sets: 3, reps: 0, duration: 60 },
          { name: 'Ab Wheel', sets: 3, reps: 15, duration: 0 }
        ]
      }
    ],
    'fitness': [
      {
        id: 'w1',
        name: 'Mixed Cardio',
        type: 'cardio',
        duration: 30,
        intensity: 'moderate',
        description: 'Variety of cardio exercises',
        exercises: [
          { name: 'Cycling', sets: 1, reps: 0, duration: 15 },
          { name: 'Running', sets: 1, reps: 0, duration: 15 }
        ]
      },
      {
        id: 'w2',
        name: 'Functional Training',
        type: 'strength',
        duration: 45,
        intensity: 'moderate',
        description: 'Functional movement patterns',
        exercises: [
          { name: 'Kettlebell Swings', sets: 3, reps: 15, duration: 0 },
          { name: 'Box Jumps', sets: 3, reps: 10, duration: 0 }
        ]
      },
      {
        id: 'w3',
        name: 'Yoga and Flexibility',
        type: 'flexibility',
        duration: 30,
        intensity: 'low',
        description: 'Improve flexibility and balance',
        exercises: [
          { name: 'Yoga Flow', sets: 1, reps: 0, duration: 30 }
        ]
      }
    ]
  };

  return workoutsByGoal[goal] || workoutsByGoal['fitness'];
}

/**
 * Generate mock meals
 * @param {string} dietaryPreferences - User's dietary preferences
 * @returns {Array} Mock meal suggestions (7-day plan)
 */
function generateMockMeals(dietaryPreferences) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals = [];
  let mealId = 1;

  const mealOptions = {
    breakfast: [
      { name: 'Oatmeal with Berries', calories: 350, protein: 10, carbs: 60, fat: 5 },
      { name: 'Eggs and Toast', calories: 400, protein: 20, carbs: 40, fat: 15 },
      { name: 'Greek Yogurt Parfait', calories: 300, protein: 15, carbs: 45, fat: 5 }
    ],
    lunch: [
      { name: 'Grilled Chicken Salad', calories: 450, protein: 35, carbs: 30, fat: 15 },
      { name: 'Turkey Sandwich', calories: 500, protein: 30, carbs: 50, fat: 15 },
      { name: 'Tuna Bowl', calories: 480, protein: 40, carbs: 45, fat: 10 }
    ],
    dinner: [
      { name: 'Salmon with Vegetables', calories: 550, protein: 40, carbs: 35, fat: 20 },
      { name: 'Lean Beef Stir-fry', calories: 600, protein: 45, carbs: 50, fat: 15 },
      { name: 'Chicken Breast with Rice', calories: 520, protein: 40, carbs: 60, fat: 10 }
    ]
  };

  days.forEach(day => {
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      const options = mealOptions[mealType];
      const meal = options[Math.floor(Math.random() * options.length)];

      meals.push({
        id: `m${mealId++}`,
        day,
        mealType,
        name: meal.name,
        calories: meal.calories,
        macros: {
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat
        },
        ingredients: ['ingredient1', 'ingredient2', 'ingredient3'],
        recipe: 'Prepare ingredients and cook according to preference'
      });
    });
  });

  return meals;
}

/**
 * Generate mock daily schedule
 * @returns {Array} Mock schedule suggestions
 */
function generateMockSchedule() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const schedule = [];
  let scheduleId = 1;

  const activities = [
    { time: '06:00', activity: 'Wake up', duration: 0 },
    { time: '06:30', activity: 'Workout', duration: 45 },
    { time: '07:30', activity: 'Breakfast', duration: 30 },
    { time: '08:00', activity: 'Work/Study', duration: 240 },
    { time: '12:00', activity: 'Lunch', duration: 60 },
    { time: '13:00', activity: 'Work/Study', duration: 240 },
    { time: '17:00', activity: 'Snack', duration: 15 },
    { time: '18:00', activity: 'Dinner', duration: 60 },
    { time: '19:00', activity: 'Relaxation', duration: 120 },
    { time: '21:00', activity: 'Sleep Preparation', duration: 30 },
    { time: '21:30', activity: 'Sleep', duration: 480 }
  ];

  days.forEach(day => {
    activities.forEach(activity => {
      schedule.push({
        id: `s${scheduleId++}`,
        day,
        time: activity.time,
        activity: activity.activity,
        duration: activity.duration,
        notes: `${activity.activity} scheduled for ${day}`
      });
    });
  });

  return schedule;
}

module.exports = {
  generateMockSuggestions
};
