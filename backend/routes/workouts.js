const express = require('express');
const Workout = require('../models/Workout');
const authMiddleware = require('../middleware/auth');
const { updateWorkoutProgress, getActivePlan, getPlanSuggestions } = require('../services/planProgressTracker');

const router = express.Router();

// Save Workout
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, name, duration_minutes, intensity, calories_burned, notes, date, planId, planWorkoutId, isFromPlan } = req.body;

    const workout = new Workout({
      userId: req.userId,
      type,
      name,
      duration_minutes,
      intensity,
      calories_burned,
      notes,
      planId: planId || null,
      planWorkoutId: planWorkoutId || null,
      isFromPlan: isFromPlan || false,
      date: date || new Date(),
    });

    await workout.save();

    // Update plan progress if from plan
    if (isFromPlan && planId) {
      await updateWorkoutProgress(req.userId, planId, planWorkoutId);
    }

    res.status(201).json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save GPS-tracked workout (Route Tracker)
router.post('/gps', authMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      duration_minutes, 
      distanceKm, 
      steps, 
      pace, 
      calories_burned, 
      route, 
      startLocation, 
      endLocation,
      notes 
    } = req.body;

    if (!name || !duration_minutes || !distanceKm) {
      return res.status(400).json({ message: 'Name, duration, and distance are required' });
    }

    const workout = new Workout({
      userId: req.userId,
      type: 'gps-tracked',
      name,
      duration_minutes,
      intensity: 'Moderate', // Can be calculated from pace
      calories_burned: calories_burned || Math.round(distanceKm * 60), // Default: 60 cal/km
      notes: notes || 'GPS tracked workout',
      isGpsTracked: true,
      distanceKm,
      steps,
      pace,
      route: route || [],
      startLocation: startLocation ? {
        type: 'Point',
        coordinates: [startLocation.lng, startLocation.lat] // GeoJSON format: [lng, lat]
      } : undefined,
      endLocation: endLocation ? {
        type: 'Point',
        coordinates: [endLocation.lng, endLocation.lat]
      } : undefined,
      date: new Date(),
    });

    await workout.save();

    res.status(201).json({
      success: true,
      message: 'GPS workout saved successfully',
      workout
    });
  } catch (error) {
    console.error('Error saving GPS workout:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Log a completed workout session (used by SessionPlayer)
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { workout_key, workout_name, duration_sec, calories, completed, planId, planWorkoutId } = req.body;

    const workout = new Workout({
      userId: req.userId,
      type: workout_key || 'session',
      name: workout_name || 'Workout',
      duration_minutes: Math.round((duration_sec || 0) / 60),
      calories_burned: calories || 0,
      notes: completed ? 'Completed' : 'In progress',
      planId: planId || null,
      planWorkoutId: planWorkoutId || null,
      isFromPlan: !!planId,
      date: new Date(),
    });

    await workout.save();

    // Update plan progress if from plan
    if (planId) {
      await updateWorkoutProgress(req.userId, planId, planWorkoutId);
    }

    res.status(201).json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Workouts (with plan suggestions if active plan exists)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const workouts = await Workout.find({
      userId: req.userId,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    // Get active plan and suggestions
    const activePlan = await getActivePlan(req.userId);
    let planSuggestions = [];
    
    if (activePlan) {
      planSuggestions = await getPlanSuggestions(activePlan._id, 'workouts');
    }

    res.json({
      workouts,
      planSuggestions: planSuggestions.map(w => ({
        ...w,
        isFromPlan: true,
        planId: activePlan._id
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Workout
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Workout.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workout deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Custom Workouts CRUD
const CustomWorkout = require('../models/CustomWorkout');

// GET /api/workouts/custom - List user's custom workouts
router.get('/custom', authMiddleware, async (req, res) => {
  try {
    const customWorkouts = await CustomWorkout.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(customWorkouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/workouts/custom - Create custom workout
router.post('/custom', authMiddleware, async (req, res) => {
  try {
    const { name, category, difficulty, exercises } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workout name is required' });
    }

    const customWorkout = new CustomWorkout({
      userId: req.userId,
      name,
      category,
      difficulty: difficulty || 'Beginner',
      exercises: exercises || [],
    });

    await customWorkout.save();
    res.status(201).json(customWorkout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/workouts/custom/:id - Update custom workout (owner only)
router.put('/custom/:id', authMiddleware, async (req, res) => {
  try {
    const customWorkout = await CustomWorkout.findById(req.params.id);

    if (!customWorkout) {
      return res.status(404).json({ message: 'Custom workout not found' });
    }

    if (customWorkout.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this workout' });
    }

    const { name, category, difficulty, exercises } = req.body;

    if (name) customWorkout.name = name;
    if (category) customWorkout.category = category;
    if (difficulty) customWorkout.difficulty = difficulty;
    if (exercises) customWorkout.exercises = exercises;
    customWorkout.updatedAt = new Date();

    await customWorkout.save();
    res.json(customWorkout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/workouts/custom/:id - Delete custom workout (owner only)
router.delete('/custom/:id', authMiddleware, async (req, res) => {
  try {
    const customWorkout = await CustomWorkout.findById(req.params.id);

    if (!customWorkout) {
      return res.status(404).json({ message: 'Custom workout not found' });
    }

    if (customWorkout.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this workout' });
    }

    await CustomWorkout.findByIdAndDelete(req.params.id);
    res.json({ message: 'Custom workout deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @route   POST /api/workouts/log-workout
// @desc    Log a workout for the current day
router.post('/log-workout', authMiddleware, async (req, res) => {
  try {
    const { name, duration, date } = req.body;
    
    if (!name || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const WorkoutLog = require('../models/WorkoutLog');
    const Plan = require('../models/Plan');

    // Get active plan for this user
    const activePlan = await Plan.findOne({ userId: req.userId, status: 'active' });

    // Create a workout log entry
    const workoutLog = new WorkoutLog({
      userId: req.userId,
      planId: activePlan ? activePlan._id : null,
      name,
      duration: parseInt(duration),
      date: new Date(date || new Date().toISOString().split('T')[0]),
      loggedAt: new Date()
    });

    await workoutLog.save();

    // Update plan progress if active plan exists
    if (activePlan) {
      // Count workouts logged today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const workoutsLoggedToday = await WorkoutLog.countDocuments({
        userId: req.userId,
        planId: activePlan._id,
        date: { $gte: today, $lt: tomorrow }
      });

      activePlan.progress.workoutsCompleted = workoutsLoggedToday;
      await activePlan.save();
    }

    res.status(201).json({
      message: 'Workout logged successfully',
      workout: workoutLog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/workouts/workout-history
// @desc    Get all logged workouts for the user
router.get('/workout-history', authMiddleware, async (req, res) => {
  try {
    const WorkoutLog = require('../models/WorkoutLog');

    // Get workouts from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const workouts = await WorkoutLog.find({
      userId: req.userId,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ loggedAt: -1 });

    res.json({
      workouts: workouts.map(w => ({
        name: w.name,
        duration: w.duration,
        date: w.date.toISOString().split('T')[0]
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/workouts/active-workouts
// @desc    Get workouts from active plan
router.get('/active-workouts', authMiddleware, async (req, res) => {
  try {
    // Get active plan workouts
    const Plan = require('../models/Plan');
    const activePlan = await Plan.findOne({ 
      userId: req.userId, 
      status: 'active' 
    });

    let workouts = [];

    if (activePlan && activePlan.suggestions && Array.isArray(activePlan.suggestions.workouts)) {
      // Map workouts from plan
      workouts = activePlan.suggestions.workouts.map(w => {
        if (typeof w === 'string') {
          return { name: w, duration: 30 };
        }
        return {
          name: w.name || w.type || 'Workout',
          duration: w.duration || w.duration_minutes || 30,
          type: w.type || 'strength'
        };
      });
    }

    // If no workouts found, return default options
    if (workouts.length === 0) {
      workouts = [
        { name: 'Strength Training', duration: 45 },
        { name: 'Cardio', duration: 30 },
        { name: 'Yoga', duration: 60 },
        { name: 'Stretching', duration: 20 }
      ];
    }

    res.json({
      workouts: workouts
    });
  } catch (error) {
    console.error('Error fetching active workouts:', error);
    res.status(500).json({ 
      message: error.message,
      workouts: [
        { name: 'Strength Training', duration: 45 },
        { name: 'Cardio', duration: 30 },
        { name: 'Yoga', duration: 60 },
        { name: 'Stretching', duration: 20 }
      ]
    });
  }
});

module.exports = router;
