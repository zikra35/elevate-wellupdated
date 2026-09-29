const express = require('express');
const Goal = require('../models/Goal');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Save Goal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, target_value, current_value, unit, deadline } = req.body;

    const goal = new Goal({
      userId: req.userId,
      title,
      description,
      category,
      target_value,
      current_value,
      unit,
      deadline,
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Goals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Goal Progress
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { current_value } = req.body;
    
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { current_value },
      { new: true }
    );

    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Goal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
