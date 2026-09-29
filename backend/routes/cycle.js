const express = require('express');
const CycleLog = require('../models/CycleLog');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Save Cycle Log
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, cycle_day, symptoms, flow_intensity, notes } = req.body;

    const log = new CycleLog({
      userId: req.userId,
      date: date || new Date(),
      cycle_day,
      symptoms,
      flow_intensity,
      notes,
    });

    await log.save();
    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Cycle Logs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await CycleLog.find({
      userId: req.userId,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Cycle Log
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await CycleLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cycle log deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
