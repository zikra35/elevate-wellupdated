const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const DietPlan = require('../models/DietPlan');
const Supplement = require('../models/Supplement');
const Content = require('../models/Content');

// @route   GET /api/diet/supplements
// @desc    Get all supplements for a user
router.get('/supplements', protect, async (req, res) => {
  try {
    const supplements = await Supplement.find({ userId: req.user._id });
    res.json(supplements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/diet/supplements
// @desc    Add a supplement
router.post('/supplements', protect, async (req, res) => {
  try {
    const supplement = await Supplement.create({ ...req.body, userId: req.user._id });
    res.status(201).json(supplement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/diet/generate-plan
// @desc    Generate an AI meal plan (Mocked)
router.post('/generate-plan', protect, async (req, res) => {
  try {
    const { dietaryChoices } = req.body;
    // Mocking an AI generation delay
    setTimeout(async () => {
      const mockMeals = [
        { day: 'Monday', meal_type: 'Breakfast', name: 'Oatmeal with Berries', recipe: 'Mix oats with almond milk and top with berries.', calories: 350 },
        { day: 'Monday', meal_type: 'Lunch', name: 'Grilled Chicken Salad', recipe: 'Toss mixed greens, cherry tomatoes, and grilled chicken with vinaigrette.', calories: 450 },
        { day: 'Monday', meal_type: 'Dinner', name: 'Baked Salmon with Quinoa', recipe: 'Bake salmon and serve with a side of cooked quinoa and steamed broccoli.', calories: 550 },
      ];
      
      const newPlan = await DietPlan.create({
        userId: req.user._id,
        meals: mockMeals
      });
      // In a real app, we would await the delay and return the response.
      // Here, we just send it immediately for the sake of the mock response.
    }, 1000);

    // Synchronous mock return
    const mockMeals = [
        { day: 'Monday', meal_type: 'Breakfast', name: 'Oatmeal with Berries', recipe: 'Mix oats with almond milk and top with berries.', calories: 350 },
        { day: 'Monday', meal_type: 'Lunch', name: 'Grilled Chicken Salad', recipe: 'Toss mixed greens, cherry tomatoes, and grilled chicken with vinaigrette.', calories: 450 },
        { day: 'Monday', meal_type: 'Dinner', name: 'Baked Salmon with Quinoa', recipe: 'Bake salmon and serve with a side of cooked quinoa and steamed broccoli.', calories: 550 },
    ];
    const newPlan = await DietPlan.create({
        userId: req.user._id,
        meals: mockMeals
    });
    res.status(201).json(newPlan);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/diet/plan
// @desc    Get current diet plan
router.get('/plan', protect, async (req, res) => {
  try {
    const plan = await DietPlan.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/diet/articles
// @desc    Get articles and recipes
router.get('/articles', protect, async (req, res) => {
  try {
    const articles = await Content.find({ type: { $in: ['article', 'recipe'] } });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/diet/log-meal
// @desc    Log a meal for the current day
router.post('/log-meal', protect, async (req, res) => {
  try {
    const { name, time, type, date } = req.body;
    
    if (!name || !time || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const MealLog = require('../models/MealLog');
    const Plan = require('../models/Plan');

    // Get user ID - handle both req.user._id and req.userId
    const userId = req.user._id || req.userId;

    // Get active plan for this user
    const activePlan = await Plan.findOne({ userId: userId, status: 'active' });

    // Create a meal log entry
    const mealLog = new MealLog({
      userId: userId,
      planId: activePlan ? activePlan._id : null,
      name,
      time,
      type,
      date: new Date(date || new Date().toISOString().split('T')[0]),
      loggedAt: new Date()
    });

    await mealLog.save();

    // Update plan progress if active plan exists
    if (activePlan) {
      // Count meals logged today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mealsLoggedToday = await MealLog.countDocuments({
        userId: userId,
        planId: activePlan._id,
        date: { $gte: today, $lt: tomorrow }
      });

      activePlan.progress.mealsLogged = mealsLoggedToday;
      await activePlan.save();
    }

    res.status(201).json({
      message: 'Meal logged successfully',
      meal: mealLog
    });
  } catch (error) {
    console.error('Error logging meal:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/diet/meal-history
// @desc    Get all logged meals for the user
router.get('/meal-history', protect, async (req, res) => {
  try {
    const MealLog = require('../models/MealLog');

    // Get user ID - handle both req.user._id and req.userId
    const userId = req.user._id || req.userId;

    // Get meals from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await MealLog.find({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ time: 1 });

    res.json({
      meals: meals.map(m => ({
        name: m.name,
        time: m.time,
        type: m.type,
        date: m.date.toISOString().split('T')[0]
      }))
    });
  } catch (error) {
    console.error('Error fetching meal history:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
