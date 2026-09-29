const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Mock user for offline mode
const MOCK_USER = {
  id: '507f1f77bcf86cd799439011',
  email: 'demo@example.com',
  name: 'Demo User',
  avatar_seed: 'demo-user',
  avatar_config: { style: 'adventurer' },
  gender: 'female',
  onboarding_completed: true,
  tdee: 2000,
  date_of_birth: '1990-01-15',
  height_cm: 170,
  weight_kg: 65,
  bmi: 22.5,
  goal: 'general_wellness',
  desired_weight_kg: 65,
  activity_level: 'moderate',
  dietary_preferences: ['vegetarian'],
  cycle_tracking_enabled: true,
  cycle_length_days: 28,
  period_length_days: 5,
  last_period_start: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  step_goal: 10000,
};

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if User model is available (MongoDB connected)
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const user = new User({ 
        email, 
        password, 
        name,
        onboarding_completed: false  // Mark as not completed
      });
      await user.save();

      // Generate JWT token for auto-login after signup
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
      );

      // Return user and token for auto-login
      res.status(201).json({
        message: 'Account created successfully.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar_seed: user.avatar_seed,
          avatar_config: user.avatar_config,
          onboarding_completed: user.onboarding_completed || false,
        },
        token,
        requiresOnboarding: true,
      });
    } catch (dbError) {
      // Offline mode - use mock user
      console.log('[OFFLINE MODE] Using mock signup');
      const token = jwt.sign(
        { userId: MOCK_USER.id, email: email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
      );
      res.status(201).json({
        message: 'Account created successfully (offline mode).',
        user: {
          id: MOCK_USER.id,
          email: email,
          name: name || MOCK_USER.name,
          avatar_seed: MOCK_USER.avatar_seed,
          avatar_config: MOCK_USER.avatar_config,
          onboarding_completed: false,
        },
        token,
        requiresOnboarding: true,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if User model is available (MongoDB connected)
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
      );

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar_seed: user.avatar_seed,
          avatar_config: user.avatar_config,
          onboarding_completed: user.onboarding_completed || false,
        },
        token,
        requiresOnboarding: !user.onboarding_completed,
      });
    } catch (dbError) {
      // Offline mode - use mock user
      console.log('[OFFLINE MODE] Using mock login');
      const token = jwt.sign(
        { userId: MOCK_USER.id, email: email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
      );

      res.json({
        user: {
          id: MOCK_USER.id,
          email: email,
          name: MOCK_USER.name,
          avatar_seed: MOCK_USER.avatar_seed,
          avatar_config: MOCK_USER.avatar_config,
          onboarding_completed: MOCK_USER.onboarding_completed,
        },
        token,
        requiresOnboarding: false,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Current User
router.get('/me', authMiddleware, async (req, res) => {
  try {
    try {
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar_seed: user.avatar_seed,
          avatar_config: user.avatar_config,
          gender: user.gender,
          onboarding_completed: user.onboarding_completed,
          tdee: user.tdee,
          date_of_birth: user.date_of_birth,
          height_cm: user.height_cm,
          weight_kg: user.weight_kg,
          bmi: user.bmi,
          goal: user.goal,
          desired_weight_kg: user.desired_weight_kg,
          activity_level: user.activity_level,
          dietary_preferences: user.dietary_preferences,
          cycle_tracking_enabled: user.cycle_tracking_enabled,
          cycle_length_days: user.cycle_length_days,
          period_length_days: user.period_length_days,
          last_period_start: user.last_period_start,
        },
      });
    } catch (dbError) {
      // Offline mode - return mock user
      console.log('[OFFLINE MODE] Returning mock user profile');
      res.json({ user: MOCK_USER });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, gender, tdee, dietary_preferences, avatar_seed, avatar_config, date_of_birth, height_cm, weight_kg, bmi, goal, desired_weight_kg, activity_level, onboarding_completed, cycle_tracking_enabled, cycle_length_days, period_length_days, last_period_start } = req.body;
    
    try {
      const user = await User.findByIdAndUpdate(
        req.userId,
        { name, gender, tdee, dietary_preferences, avatar_seed, avatar_config, date_of_birth, height_cm, weight_kg, bmi, goal, desired_weight_kg, activity_level, onboarding_completed, cycle_tracking_enabled, cycle_length_days, period_length_days, last_period_start },
        { new: true }
      ).select('-password');

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar_seed: user.avatar_seed,
          avatar_config: user.avatar_config,
          gender: user.gender,
          onboarding_completed: user.onboarding_completed,
          tdee: user.tdee,
          date_of_birth: user.date_of_birth,
          height_cm: user.height_cm,
          weight_kg: user.weight_kg,
          bmi: user.bmi,
          goal: user.goal,
          desired_weight_kg: user.desired_weight_kg,
          activity_level: user.activity_level,
          dietary_preferences: user.dietary_preferences,
          cycle_tracking_enabled: user.cycle_tracking_enabled,
          cycle_length_days: user.cycle_length_days,
          period_length_days: user.period_length_days,
          last_period_start: user.last_period_start,
        },
      });
    } catch (dbError) {
      // Offline mode - return updated mock user
      console.log('[OFFLINE MODE] Updating mock user profile');
      const updatedMockUser = {
        ...MOCK_USER,
        name: name || MOCK_USER.name,
        gender: gender || MOCK_USER.gender,
        tdee: tdee || MOCK_USER.tdee,
        dietary_preferences: dietary_preferences || MOCK_USER.dietary_preferences,
        avatar_seed: avatar_seed || MOCK_USER.avatar_seed,
        avatar_config: avatar_config || MOCK_USER.avatar_config,
        date_of_birth: date_of_birth || MOCK_USER.date_of_birth,
        height_cm: height_cm || MOCK_USER.height_cm,
        weight_kg: weight_kg || MOCK_USER.weight_kg,
        bmi: bmi || MOCK_USER.bmi,
        goal: goal || MOCK_USER.goal,
        desired_weight_kg: desired_weight_kg || MOCK_USER.desired_weight_kg,
        activity_level: activity_level || MOCK_USER.activity_level,
        onboarding_completed: onboarding_completed !== undefined ? onboarding_completed : MOCK_USER.onboarding_completed,
        cycle_tracking_enabled: cycle_tracking_enabled !== undefined ? cycle_tracking_enabled : MOCK_USER.cycle_tracking_enabled,
        cycle_length_days: cycle_length_days || MOCK_USER.cycle_length_days,
        period_length_days: period_length_days || MOCK_USER.period_length_days,
        last_period_start: last_period_start || MOCK_USER.last_period_start,
      };
      res.json({ user: updatedMockUser });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    try {
      await User.findByIdAndDelete(req.userId);
      res.json({ message: 'Account deleted' });
    } catch (dbError) {
      // Offline mode
      console.log('[OFFLINE MODE] Account deletion (mock)');
      res.json({ message: 'Account deleted (offline mode)' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
