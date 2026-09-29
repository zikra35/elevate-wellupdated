const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Routine = require('../models/Routine');
const { calculateScheduleAdherence, getActivePlan, getPlanSuggestions } = require('../services/planProgressTracker');

// GET /api/routines - List user's routines (with plan suggestions if active plan exists)
router.get('/', protect, async (req, res) => {
  try {
    const routines = await Routine.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    // Get active plan and suggestions
    const activePlan = await getActivePlan(req.user._id);
    let planSuggestions = [];
    
    if (activePlan) {
      planSuggestions = await getPlanSuggestions(activePlan._id, 'schedule');
    }

    res.json({
      routines,
      planSuggestions: planSuggestions.map(s => ({
        ...s,
        isFromPlan: true,
        planId: activePlan._id
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/routines - Create routine
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, frequencyPerWeek, exercises, planId, isFromPlan } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Routine name is required' });
    }

    const routine = new Routine({
      userId: req.user._id,
      name,
      description,
      frequencyPerWeek: frequencyPerWeek || 3,
      exercises: exercises || [],
      lastPerformedAt: null,
      planId: planId || null,
      isFromPlan: isFromPlan || false,
    });

    await routine.save();

    // Update schedule adherence if from plan
    if (isFromPlan && planId) {
      await calculateScheduleAdherence(req.user._id, planId);
    }

    res.status(201).json(routine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/routines/:id - Update routine (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }

    if (routine.userId.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to update this routine' });
    }

    const { name, description, frequencyPerWeek, exercises, lastPerformedAt } = req.body;

    if (name) routine.name = name;
    if (description) routine.description = description;
    if (frequencyPerWeek) routine.frequencyPerWeek = frequencyPerWeek;
    if (exercises) routine.exercises = exercises;
    if (lastPerformedAt) {
      routine.lastPerformedAt = lastPerformedAt;
      
      // Update schedule adherence if from plan
      if (routine.isFromPlan && routine.planId) {
        await calculateScheduleAdherence(req.user._id, routine.planId);
      }
    }

    await routine.save();
    res.json(routine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/routines/:id - Delete routine (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }

    if (routine.userId.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to delete this routine' });
    }

    await Routine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Routine deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/routines/:id/duplicate - Clone routine
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }

    if (routine.userId.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to duplicate this routine' });
    }

    const newRoutine = new Routine({
      userId: req.user._id,
      name: `Copy of ${routine.name}`,
      description: routine.description,
      frequencyPerWeek: routine.frequencyPerWeek,
      exercises: routine.exercises,
      lastPerformedAt: null,
    });

    await newRoutine.save();
    res.status(201).json(newRoutine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
