const express = require('express');
const Supplement = require('../models/Supplement');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/supplements - List user's supplements
router.get('/', auth, async (req, res) => {
  try {
    const supplements = await Supplement.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(supplements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplements', error: error.message });
  }
});

// POST /api/supplements - Add supplement
router.post('/', auth, async (req, res) => {
  try {
    const { name, dosage, frequency, timeOfDay, notes } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Supplement name is required' });
    }

    const supplement = new Supplement({
      userId: req.user.id,
      name,
      dosage,
      frequency,
      timeOfDay: timeOfDay || [],
      notes,
      takenToday: false,
      lastTakenDate: null,
    });

    await supplement.save();
    res.status(201).json(supplement);
  } catch (error) {
    res.status(500).json({ message: 'Error creating supplement', error: error.message });
  }
});

// PATCH /api/supplements/:id/taken - Mark as taken for today
router.patch('/:id/taken', auth, async (req, res) => {
  try {
    const supplement = await Supplement.findById(req.params.id);

    if (!supplement) {
      return res.status(404).json({ message: 'Supplement not found' });
    }

    if (supplement.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this supplement' });
    }

    supplement.takenToday = true;
    supplement.lastTakenDate = new Date();
    await supplement.save();

    res.json(supplement);
  } catch (error) {
    res.status(500).json({ message: 'Error updating supplement', error: error.message });
  }
});

// DELETE /api/supplements/:id - Remove supplement
router.delete('/:id', auth, async (req, res) => {
  try {
    const supplement = await Supplement.findById(req.params.id);

    if (!supplement) {
      return res.status(404).json({ message: 'Supplement not found' });
    }

    if (supplement.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this supplement' });
    }

    await Supplement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting supplement', error: error.message });
  }
});

module.exports = router;
