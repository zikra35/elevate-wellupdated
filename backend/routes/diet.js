const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const DietPlan = require('../models/DietPlan');
const Supplement = require('../models/Supplement');
const Content = require('../models/Content');
const { isDayString, dayToUtcDate, localToday, parseTzOffset, rangeFromQuery } = require('../utils/dates');

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
// @desc    Log a meal. `date` is the user's local day (YYYY-MM-DD).
router.post('/log-meal', protect, async (req, res) => {
  try {
    const { name, time, type, date, tzOffset } = req.body;

    if (!name || !time || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const MealLog = require('../models/MealLog');
    const Plan = require('../models/Plan');
    const userId = req.userId;

    const day = isDayString(date) ? date : localToday(parseTzOffset(tzOffset));

    // Get active plan for this user
    const activePlan = await Plan.findOne({ userId, status: 'active' });

    const mealLog = new MealLog({
      userId,
      planId: activePlan ? activePlan._id : null,
      name,
      time,
      type,
      date: dayToUtcDate(day),
      loggedAt: new Date()
    });

    await mealLog.save();

    // Update plan progress with the number of meals logged on that day
    if (activePlan) {
      activePlan.progress.mealsLogged = await MealLog.countDocuments({
        userId,
        planId: activePlan._id,
        date: mealLog.date
      });
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

// @route   GET /api/diet/meal-history?from=YYYY-MM-DD&to=YYYY-MM-DD&tzOffset=-300
// @desc    Logged meals in a local date range (no `from` = all time), newest first
router.get('/meal-history', protect, async (req, res) => {
  try {
    const MealLog = require('../models/MealLog');
    const { dayFilter } = rangeFromQuery(req.query);

    const meals = await MealLog.find({ userId: req.userId, date: dayFilter })
      .sort({ date: -1, time: -1, loggedAt: -1 })
      .limit(1000);

    res.json({
      meals: meals.map(m => ({
        id: m._id,
        name: m.name,
        time: m.time,
        type: m.type,
        date: m.date.toISOString().split('T')[0],
        loggedAt: m.loggedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching meal history:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/diet/meal-history/:id
// @desc    Delete one of the user's logged meals
router.delete('/meal-history/:id', protect, async (req, res) => {
  try {
    const MealLog = require('../models/MealLog');
    const deleted = await MealLog.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    res.json({ message: 'Meal deleted' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
