/**
 * Script to manually train the global model
 * Run: node train-global-model.js
 */

const axios = require('axios');

const ML_SERVICE_URL = 'http://localhost:5001';
const GLOBAL_MODEL_USER_ID = 'global-model';

// Generate training data
function generateGlobalTrainingData() {
  const trainingData = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 35);

  const workoutTypes = ["cardio", "strength", "yoga", "pilates", "swimming", "cycling"];
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
  const intensities = ["low", "moderate", "high"];
  const sleepQualities = ["poor", "fair", "good", "excellent"];
  const cyclePhases = ["menstrual", "follicular", "ovulation", "luteal"];

  for (let day = 0; day < 35; day++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(currentDate.getDate() + day);
    const timestamp = currentDate.toISOString();

    // Workout data
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

    // Meal data
    for (let i = 0; i < 3; i++) {
      trainingData.push({
        type: "meal",
        timestamp,
        meal_type: mealTypes[i],
        calories: Math.floor(Math.random() * 500) + 300,
        label: Math.random() > 0.3 ? 1 : 0
      });
    }

    // Sleep data
    trainingData.push({
      type: "sleep",
      timestamp,
      duration: Math.floor(Math.random() * 5) + 5,
      quality: sleepQualities[Math.floor(Math.random() * sleepQualities.length)],
      label: Math.random() > 0.3 ? 1 : 0
    });

    // Mood data
    trainingData.push({
      type: "mood",
      timestamp,
      mood_level: Math.floor(Math.random() * 5) + 1,
      label: Math.random() > 0.3 ? 1 : 0
    });

    // Cycle data
    trainingData.push({
      type: "cycle",
      timestamp,
      phase: cyclePhases[Math.floor(day / 9) % cyclePhases.length],
      label: Math.random() > 0.3 ? 1 : 0
    });
  }

  return trainingData;
}

// Train the global model
async function trainGlobalModel() {
  try {
    console.log('🚀 Starting global model training...');
    console.log(`📊 Generating training data...`);

    const trainingData = generateGlobalTrainingData();
    console.log(`✅ Generated ${trainingData.length} training data points`);

    console.log(`📤 Sending to ML service...`);
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/ml/train`,
      {
        user_id: GLOBAL_MODEL_USER_ID,
        training_data: trainingData
      },
      { timeout: 60000 }
    );

    console.log(`✅ Training successful!`);
    console.log(`📊 Metrics:`, response.data.metrics);
    console.log(`\n🎉 Global model trained successfully!`);
    console.log(`Model ID: ${GLOBAL_MODEL_USER_ID}`);
    console.log(`\nYou can now get recommendations from: /api/ml/recommendations/${GLOBAL_MODEL_USER_ID}`);

  } catch (error) {
    console.error(`❌ Training failed:`, error.message);
    if (error.response) {
      console.error(`Response:`, error.response.data);
    }
    process.exit(1);
  }
}

// Run training
trainGlobalModel();
