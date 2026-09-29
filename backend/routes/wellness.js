const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MealLog = require('../models/MealLog');
const WorkoutLog = require('../models/WorkoutLog');
const SleepLog = require('../models/SleepLog');
const JournalEntry = require('../models/JournalEntry');

// @route   GET /api/wellness/readiness-score
// @desc    Calculate daily readiness score based on logged activities
router.get('/readiness-score', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count meals logged today
    const mealsCount = await MealLog.countDocuments({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    const nutritionScore = Math.min(mealsCount * 25, 100); // Max 100 at 4 meals

    // Count workouts logged today
    const workoutsCount = await WorkoutLog.countDocuments({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    const physicalScore = Math.min(workoutsCount * 50, 100); // Max 100 at 2 workouts

    // Get sleep logged today
    let sleepScore = 0;
    try {
      // First, log all sleep logs for debugging
      const allLogs = await SleepLog.find({ userId: userId });
      console.log('All sleep logs for user:', allLogs);
      
      // Query for sleep logs where the date matches today (ignoring time)
      const sleepLog = await SleepLog.findOne({
        userId: userId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      });
      console.log('Sleep log query - userId:', userId, 'today:', today, 'tomorrow:', tomorrow, 'result:', sleepLog);
      if (sleepLog) {
        console.log('Sleep log found - duration_hours:', sleepLog.duration_hours);
        sleepScore = Math.min((sleepLog.duration_hours / 8) * 100, 100);
      }
    } catch (err) {
      console.log('SleepLog model error:', err.message);
    }

    // Count journal entries today
    let mentalScore = 0;
    try {
      const journalCount = await JournalEntry.countDocuments({
        userId: userId,
        createdAt: { $gte: today, $lt: tomorrow }
      });
      mentalScore = Math.min(journalCount * 50, 100); // Max 100 at 2 entries
    } catch (err) {
      console.log('Journal model error:', err.message);
    }

    // Calculate weighted readiness score
    const readinessScore = Math.round(
      (nutritionScore * 0.25) +
      (physicalScore * 0.25) +
      (sleepScore * 0.25) +
      (mentalScore * 0.25)
    );

    res.json({
      readinessScore,
      breakdown: {
        nutrition: Math.round(nutritionScore),
        physical: Math.round(physicalScore),
        sleep: Math.round(sleepScore),
        mental: Math.round(mentalScore)
      },
      logs: {
        mealsLogged: mealsCount,
        workoutsLogged: workoutsCount,
        sleepLogged: sleepScore > 0 ? 'logged' : 'not logged',
        journalEntries: mentalScore > 0 ? 'logged' : 'not logged'
      }
    });
  } catch (error) {
    console.error('Error calculating readiness score:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/wellness/balance
// @desc    Get wellness balance percentages
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate scores
    const mealsCount = await MealLog.countDocuments({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    const nutritionScore = Math.min(mealsCount * 25, 100);

    const workoutsCount = await WorkoutLog.countDocuments({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    const physicalScore = Math.min(workoutsCount * 50, 100);

    let sleepScore = 0;
    try {
      const sleepLog = await SleepLog.findOne({
        userId: userId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      });
      if (sleepLog) {
        sleepScore = Math.min((sleepLog.duration_hours / 8) * 100, 100);
      }
    } catch (err) {
      console.log('SleepLog model error:', err.message);
    }

    let mentalScore = 0;
    try {
      const journalCount = await JournalEntry.countDocuments({
        userId: userId,
        createdAt: { $gte: today, $lt: tomorrow }
      });
      mentalScore = Math.min(journalCount * 50, 100);
    } catch (err) {
      console.log('Journal model error:', err.message);
    }

    // Calculate percentages (weighted - fixed distribution)
    const physicalPercent = 35;
    const sleepPercent = 25;
    const mentalPercent = 20;
    const nutritionPercent = 20;

    res.json({
      physical: physicalPercent,
      sleep: sleepPercent,
      mental: mentalPercent,
      nutrition: nutritionPercent
    });
  } catch (error) {
    console.error('Error calculating wellness balance:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
