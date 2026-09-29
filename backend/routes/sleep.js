const express = require('express');
const SleepLog = require('../models/SleepLog');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Save Sleep Log
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, duration_hours, quality, notes } = req.body;
    console.log('Sleep log received:', { date, duration_hours, quality, notes, userId: req.userId });

    const sleepLog = new SleepLog({
      userId: req.userId,
      date: date ? new Date(date) : new Date(),
      duration_hours,
      quality,
      notes,
    });

    await sleepLog.save();
    console.log('Sleep log saved:', sleepLog);
    res.status(201).json(sleepLog);
  } catch (error) {
    console.error('Error saving sleep log:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Sleep Logs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await SleepLog.find({
      userId: req.userId,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Sleep Log
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await SleepLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sleep log deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
