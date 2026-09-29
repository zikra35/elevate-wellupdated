const express = require('express');
const MentalHealthLog = require('../models/MentalHealthLog');
const JournalEntry = require('../models/JournalEntry');
const MusicEntry = require('../models/MusicEntry');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Save Mental Health Log
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, mood, stress_level, anxiety_level, notes } = req.body;

    const log = new MentalHealthLog({
      userId: req.userId,
      date: date || new Date(),
      mood,
      stress_level,
      anxiety_level,
      notes,
    });

    await log.save();
    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Mental Health Logs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await MentalHealthLog.find({
      userId: req.userId,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Mental Health Log
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await MentalHealthLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Log deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== JOURNAL ENDPOINTS =====

// Get Journal Entries for authenticated user (sorted descending by createdAt)
router.get('/journal', authMiddleware, async (req, res) => {
  try {
    const entries = await JournalEntry.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Journal Entry
router.post('/journal', authMiddleware, async (req, res) => {
  try {
    const { content, prompt } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const entry = new JournalEntry({
      userId: req.userId,
      content,
      prompt: prompt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Journal Entry (owner only)
router.put('/journal/:id', authMiddleware, async (req, res) => {
  try {
    const { content, prompt } = req.body;

    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    // Check if user is the owner
    if (entry.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this entry' });
    }

    if (content !== undefined) {
      entry.content = content;
    }
    if (prompt !== undefined) {
      entry.prompt = prompt;
    }
    entry.updatedAt = new Date();

    await entry.save();
    res.json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Journal Entry (owner only)
router.delete('/journal/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    // Check if user is the owner
    if (entry.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this entry' });
    }

    await JournalEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Journal entry deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== MUSIC ENDPOINTS =====

// Get Music Entries with optional moodTag filter (public, no auth required)
router.get('/music', async (req, res) => {
  try {
    const { moodTag } = req.query;
    
    let query = {};
    if (moodTag) {
      query.moodTag = moodTag;
    }
    
    const musicEntries = await MusicEntry.find(query).sort({ createdAt: -1 });
    res.json(musicEntries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
