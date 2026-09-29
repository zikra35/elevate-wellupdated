const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const FocusGame = require('../models/FocusGame');

// @route   GET /api/games
// @desc    Get all active games
router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { isActive: true };
    const games = await FocusGame.find(query);
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/games
// @desc    Create a new game (Admin only)
router.post('/', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as admin' });
  }
  try {
    const game = await FocusGame.create(req.body);
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/games/:id
// @desc    Update a game (Admin only)
router.put('/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as admin' });
  }
  try {
    const game = await FocusGame.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(game);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
