const express = require('express');
const Reminder = require('../models/Reminder');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Save Reminder
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, time, type } = req.body;

    const reminder = new Reminder({
      userId: req.userId,
      title,
      description,
      time,
      type,
    });

    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Reminders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.userId }).sort({ time: 1 });
    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Reminder
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { completed } = req.body;
    
    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      { completed },
      { new: true }
    );

    res.json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Reminder
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
