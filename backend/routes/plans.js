const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const User = require('../models/User');
const { generateSuggestions } = require('../services/aiSuggestionEngine');
const auditLogger = require('../services/auditLogger');
const auth = require('../middleware/auth');

// Middleware to verify user is authenticated
router.use(auth);

/**
 * POST /api/plans/generate-suggestions
 * Generate AI suggestions for a user
 */
router.post('/generate-suggestions', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;

    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate suggestions
    const { suggestions, isMockGenerated, error } = await generateSuggestions({
      name: user.name,
      age: user.age,
      gender: user.gender,
      height_cm: user.height_cm,
      weight_kg: user.weight_kg,
      bmi: user.bmi,  // Include calculated BMI
      desired_weight_kg: user.desired_weight_kg,
      goal: user.goal,
      activity_level: user.activity_level,
      dietary_preferences: user.dietary_preferences
    });

    // Log if using mock suggestions
    if (isMockGenerated) {
      console.log('[Suggestions] Using mock suggestions (OpenAI API not configured)');
    }

    res.json({
      success: true,
      suggestions,
      isMockGenerated,
      error: error || null
    });
  } catch (err) {
    console.error('Error generating suggestions:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate suggestions',
      details: err.message 
    });
  }
});

/**
 * POST /api/plans
 * Create a new plan
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { name, description, status, suggestions, isMockGenerated } = req.body;

    // Validate required fields
    if (!status || !['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "active" or "disabled"' });
    }

    if (!suggestions) {
      return res.status(400).json({ error: 'Suggestions are required' });
    }

    // Validate suggestions structure - allow empty arrays
    const hasSuggestions = suggestions.workouts || suggestions.meals || suggestions.schedule;
    if (!hasSuggestions) {
      return res.status(400).json({ error: 'At least one suggestion type is required' });
    }

    // If creating an active plan, deactivate previous active plan
    if (status === 'active') {
      const previousActivePlan = await Plan.findOne({ userId, status: 'active' });
      if (previousActivePlan) {
        previousActivePlan.status = 'disabled';
        await previousActivePlan.save();
        auditLogger.logPlanDeactivation(userId, previousActivePlan._id.toString());
      }
    }

    // Parse suggestions if it's a string
    let parsedSuggestions = suggestions;
    if (typeof suggestions === 'string') {
      try {
        parsedSuggestions = JSON.parse(suggestions);
      } catch (e) {
        console.error('Failed to parse suggestions:', e);
        parsedSuggestions = mockSuggestions.generateMockSuggestions({ goal: 'wellness' });
      }
    }

    // Deep parse nested strings
    if (parsedSuggestions && typeof parsedSuggestions === 'object') {
      // Parse nested strings if they exist
      if (typeof parsedSuggestions.workouts === 'string') {
        try {
          parsedSuggestions.workouts = JSON.parse(parsedSuggestions.workouts);
        } catch (e) {
          console.error('Failed to parse workouts:', e);
          parsedSuggestions.workouts = [];
        }
      }
      if (typeof parsedSuggestions.meals === 'string') {
        try {
          parsedSuggestions.meals = JSON.parse(parsedSuggestions.meals);
        } catch (e) {
          console.error('Failed to parse meals:', e);
          parsedSuggestions.meals = [];
        }
      }
      if (typeof parsedSuggestions.schedule === 'string') {
        try {
          parsedSuggestions.schedule = JSON.parse(parsedSuggestions.schedule);
        } catch (e) {
          console.error('Failed to parse schedule:', e);
          parsedSuggestions.schedule = [];
        }
      }
    }

    // Ensure arrays are arrays, not strings
    if (!Array.isArray(parsedSuggestions.workouts)) {
      console.warn('workouts is not an array, converting:', typeof parsedSuggestions.workouts);
      parsedSuggestions.workouts = [];
    }
    if (!Array.isArray(parsedSuggestions.meals)) {
      console.warn('meals is not an array, converting:', typeof parsedSuggestions.meals);
      parsedSuggestions.meals = [];
    }
    if (!Array.isArray(parsedSuggestions.schedule)) {
      console.warn('schedule is not an array, converting:', typeof parsedSuggestions.schedule);
      parsedSuggestions.schedule = [];
    }

    console.log('[Plans] Creating plan with suggestions:', {
      workoutsType: typeof parsedSuggestions.workouts,
      workoutsLength: Array.isArray(parsedSuggestions.workouts) ? parsedSuggestions.workouts.length : 'N/A',
      mealsType: typeof parsedSuggestions.meals,
      mealsLength: Array.isArray(parsedSuggestions.meals) ? parsedSuggestions.meals.length : 'N/A',
      scheduleType: typeof parsedSuggestions.schedule,
      scheduleLength: Array.isArray(parsedSuggestions.schedule) ? parsedSuggestions.schedule.length : 'N/A'
    });

    // Create new plan
    const plan = new Plan({
      userId,
      name: name || 'My Personalized Plan',
      description: description || '',
      status,
      suggestions: parsedSuggestions,
      isMockGenerated: isMockGenerated || false
    });

    await plan.save();

    // Log plan creation
    auditLogger.logPlanCreation(userId, plan._id.toString(), status, isMockGenerated);

    // Update user's activePlanId if this is an active plan
    if (status === 'active') {
      await User.findByIdAndUpdate(userId, { activePlanId: plan._id });
      auditLogger.logPlanActivation(userId, plan._id.toString());
    }

    res.status(201).json(plan);
  } catch (err) {
    console.error('Error creating plan:', err);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

/**
 * GET /api/plans
 * Get all plans for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { status } = req.query;

    // Build query
    const query = { userId };
    if (status && ['active', 'disabled'].includes(status)) {
      query.status = status;
    }

    // Get plans
    const plans = await Plan.find(query)
      .sort({ createdAt: -1 });

    res.json({ plans });
  } catch (err) {
    console.error('Error fetching plans:', err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

/**
 * GET /api/plans/:id
 * Get a specific plan by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;

    // Get plan
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verify ownership
    if (plan.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(plan);
  } catch (err) {
    console.error('Error fetching plan:', err);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

/**
 * PUT /api/plans/:id
 * Update a plan (name and description only)
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;
    const { name, description } = req.body;

    // Get plan
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verify ownership
    if (plan.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update fields
    if (name) plan.name = name;
    if (description !== undefined) plan.description = description;

    await plan.save();

    res.json(plan);
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

/**
 * PUT /api/plans/:id/activate
 * Activate a plan
 */
router.put('/:id/activate', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;

    // Get plan
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verify ownership
    if (plan.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Deactivate previous active plan
    const previousActivePlan = await Plan.findOne({ userId, status: 'active', _id: { $ne: id } });
    if (previousActivePlan) {
      previousActivePlan.status = 'disabled';
      await previousActivePlan.save();
      auditLogger.logPlanDeactivation(userId, previousActivePlan._id.toString());
    }

    // Activate this plan
    plan.status = 'active';
    await plan.save();

    // Update user's activePlanId
    await User.findByIdAndUpdate(userId, { activePlanId: plan._id });

    // Log activation
    auditLogger.logPlanActivation(userId, plan._id.toString(), previousActivePlan?._id.toString());

    res.json(plan);
  } catch (err) {
    console.error('Error activating plan:', err);
    res.status(500).json({ error: 'Failed to activate plan' });
  }
});

/**
 * PUT /api/plans/:id/deactivate
 * Deactivate a plan
 */
router.put('/:id/deactivate', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;

    // Get plan
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verify ownership
    if (plan.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Deactivate plan
    plan.status = 'disabled';
    await plan.save();

    // Clear user's activePlanId if this was the active plan
    const user = await User.findById(userId);
    if (user.activePlanId && user.activePlanId.toString() === id) {
      user.activePlanId = null;
      await user.save();
    }

    // Log deactivation
    auditLogger.logPlanDeactivation(userId, plan._id.toString());

    res.json(plan);
  } catch (err) {
    console.error('Error deactivating plan:', err);
    res.status(500).json({ error: 'Failed to deactivate plan' });
  }
});

/**
 * DELETE /api/plans/:id
 * Delete a plan
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;

    // Get plan
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verify ownership
    if (plan.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete plan
    await Plan.findByIdAndDelete(id);

    // Clear user's activePlanId if this was the active plan
    const user = await User.findById(userId);
    if (user.activePlanId && user.activePlanId.toString() === id) {
      user.activePlanId = null;
      await user.save();
    }

    // Log deletion
    auditLogger.logPlanDeletion(userId, plan._id.toString());

    res.json({ message: 'Plan deleted successfully' });
  } catch (err) {
    console.error('Error deleting plan:', err);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;
