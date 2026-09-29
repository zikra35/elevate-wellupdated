const express = require('express');
const router = express.Router();
const WellnessSearchEngine = require('../services/wellnessSearchEngine');
const WellnessPath = require('../models/WellnessPath');
const MealLog = require('../models/MealLog');
const WorkoutLog = require('../models/WorkoutLog');
const SleepLog = require('../models/SleepLog');
const JournalEntry = require('../models/JournalEntry');

const searchEngine = new WellnessSearchEngine();

/**
 * GET /api/search/current-state
 * Get user's current wellness state
 */
router.get('/current-state', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's logs
    const meals = await MealLog.find({
      userId,
      createdAt: { $gte: today },
    });

    const workouts = await WorkoutLog.find({
      userId,
      createdAt: { $gte: today },
    });

    const sleepLogs = await SleepLog.find({
      userId,
      createdAt: { $gte: today },
    });

    const journals = await JournalEntry.find({
      userId,
      createdAt: { $gte: today },
    });

    // Calculate current state
    const nutrition = Math.min(100, meals.length * 25); // 4 meals = 100
    const physical = Math.min(100, workouts.length * 50); // 2 workouts = 100
    const sleep = sleepLogs.length > 0 ? Math.min(100, (sleepLogs[sleepLogs.length - 1].duration_hours / 8) * 100) : 0;
    const mental = Math.min(100, journals.length * 50); // 2 journals = 100

    const currentState = {
      nutrition,
      physical,
      sleep,
      mental,
      readinessScore: searchEngine.calculateReadinessScore({
        nutrition,
        physical,
        sleep,
        mental,
      }),
    };

    res.json({
      currentState,
      logsToday: {
        meals: meals.length,
        workouts: workouts.length,
        sleepHours: sleepLogs.length > 0 ? sleepLogs[sleepLogs.length - 1].duration_hours : 0,
        journals: journals.length,
      },
    });
  } catch (error) {
    console.error('[Search] Error getting current state:', error);
    res.status(500).json({ error: 'Failed to get current state' });
  }
});

/**
 * POST /api/search/find-path
 * Find optimal wellness path using BFS or A*
 * 
 * Request body:
 * {
 *   algorithm: 'BFS' | 'A*',
 *   goalState: { nutrition, physical, sleep, mental },
 *   maxSteps: number (optional, default: 20)
 * }
 */
router.post('/find-path', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { algorithm = 'A*', goalState, maxSteps = 20 } = req.body;

    // Validate input
    if (!goalState || typeof goalState !== 'object') {
      return res.status(400).json({ error: 'goalState is required' });
    }

    if (!['BFS', 'A*'].includes(algorithm)) {
      return res.status(400).json({ error: 'algorithm must be BFS or A*' });
    }

    // Get current state
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const meals = await MealLog.find({
      userId,
      createdAt: { $gte: today },
    });

    const workouts = await WorkoutLog.find({
      userId,
      createdAt: { $gte: today },
    });

    const sleepLogs = await SleepLog.find({
      userId,
      createdAt: { $gte: today },
    });

    const journals = await JournalEntry.find({
      userId,
      createdAt: { $gte: today },
    });

    const initialState = {
      nutrition: Math.min(100, meals.length * 25),
      physical: Math.min(100, workouts.length * 50),
      sleep: sleepLogs.length > 0 ? Math.min(100, (sleepLogs[sleepLogs.length - 1].duration_hours / 8) * 100) : 0,
      mental: Math.min(100, journals.length * 50),
    };

    // Normalize goal state
    const normalizedGoal = {
      nutrition: Math.min(100, Math.max(0, goalState.nutrition || 80)),
      physical: Math.min(100, Math.max(0, goalState.physical || 80)),
      sleep: Math.min(100, Math.max(0, goalState.sleep || 80)),
      mental: Math.min(100, Math.max(0, goalState.mental || 80)),
    };

    // Find path
    const startTime = Date.now();
    const result = searchEngine.findPath(initialState, normalizedGoal, algorithm, maxSteps);
    const executionTime = Date.now() - startTime;

    // Convert path to detailed format
    const detailedPath = result.path.map((step, index) => {
      const action = searchEngine.actions[step.action];
      return {
        step: index + 1,
        action: step.action,
        actionName: step.actionName,
        description: action.description,
        estimatedTime: action.cost,
        expectedImpact: step.impact,
        resultingState: step.newState,
      };
    });

    // Save path to database
    const pathId = `${userId}-${Date.now()}`;
    const wellnessPath = new WellnessPath({
      userId,
      pathId,
      initialState,
      goalState: normalizedGoal,
      path: detailedPath,
      algorithm,
      pathLength: detailedPath.length,
      totalCost: result.cost,
      nodesExplored: result.nodesExplored,
      executionTime,
      heuristic: algorithm === 'A*' ? 'Manhattan Distance' : 'N/A',
    });

    await wellnessPath.save();

    res.json({
      success: result.found,
      algorithm,
      initialState,
      goalState: normalizedGoal,
      path: detailedPath,
      pathLength: detailedPath.length,
      totalCost: result.cost,
      totalTime: `${Math.round(result.cost / 60)} hours`,
      nodesExplored: result.nodesExplored,
      executionTime: `${executionTime}ms`,
      pathId,
      message: result.found
        ? `Found path with ${detailedPath.length} steps`
        : 'No path found within max steps',
    });
  } catch (error) {
    console.error('[Search] Error finding path:', error);
    res.status(500).json({ error: 'Failed to find wellness path' });
  }
});

/**
 * GET /api/search/paths
 * Get all wellness paths for user
 */
router.get('/paths', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const paths = await WellnessPath.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      paths: paths.map((p) => ({
        pathId: p.pathId,
        algorithm: p.algorithm,
        initialState: p.initialState,
        goalState: p.goalState,
        pathLength: p.pathLength,
        totalCost: p.totalCost,
        status: p.status,
        progress: p.progress,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Search] Error getting paths:', error);
    res.status(500).json({ error: 'Failed to get wellness paths' });
  }
});

/**
 * GET /api/search/paths/:pathId
 * Get detailed wellness path
 */
router.get('/paths/:pathId', async (req, res) => {
  try {
    const userId = req.userId;
    const { pathId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const path = await WellnessPath.findOne({ userId, pathId });

    if (!path) {
      return res.status(404).json({ error: 'Path not found' });
    }

    res.json({
      pathId: path.pathId,
      algorithm: path.algorithm,
      initialState: path.initialState,
      goalState: path.goalState,
      path: path.path,
      pathLength: path.pathLength,
      totalCost: path.totalCost,
      nodesExplored: path.nodesExplored,
      executionTime: path.executionTime,
      status: path.status,
      progress: path.progress,
      createdAt: path.createdAt,
    });
  } catch (error) {
    console.error('[Search] Error getting path:', error);
    res.status(500).json({ error: 'Failed to get wellness path' });
  }
});

/**
 * PUT /api/search/paths/:pathId/progress
 * Update progress on a wellness path
 * 
 * Request body:
 * {
 *   stepsCompleted: number,
 *   status: 'active' | 'completed' | 'abandoned'
 * }
 */
router.put('/paths/:pathId/progress', async (req, res) => {
  try {
    const userId = req.userId;
    const { pathId } = req.params;
    const { stepsCompleted, status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const path = await WellnessPath.findOne({ userId, pathId });

    if (!path) {
      return res.status(404).json({ error: 'Path not found' });
    }

    if (stepsCompleted !== undefined) {
      path.progress.stepsCompleted = Math.min(stepsCompleted, path.pathLength);
      path.progress.lastUpdated = new Date();
    }

    if (status && ['active', 'completed', 'abandoned'].includes(status)) {
      path.status = status;
    }

    await path.save();

    res.json({
      pathId: path.pathId,
      status: path.status,
      progress: path.progress,
      message: 'Progress updated',
    });
  } catch (error) {
    console.error('[Search] Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

/**
 * POST /api/search/compare-algorithms
 * Compare BFS vs A* for same goal
 * 
 * Request body:
 * {
 *   goalState: { nutrition, physical, sleep, mental }
 * }
 */
router.post('/compare-algorithms', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { goalState } = req.body;

    if (!goalState || typeof goalState !== 'object') {
      return res.status(400).json({ error: 'goalState is required' });
    }

    // Get current state
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const meals = await MealLog.find({
      userId,
      createdAt: { $gte: today },
    });

    const workouts = await WorkoutLog.find({
      userId,
      createdAt: { $gte: today },
    });

    const sleepLogs = await SleepLog.find({
      userId,
      createdAt: { $gte: today },
    });

    const journals = await JournalEntry.find({
      userId,
      createdAt: { $gte: today },
    });

    const initialState = {
      nutrition: Math.min(100, meals.length * 25),
      physical: Math.min(100, workouts.length * 50),
      sleep: sleepLogs.length > 0 ? Math.min(100, (sleepLogs[sleepLogs.length - 1].duration_hours / 8) * 100) : 0,
      mental: Math.min(100, journals.length * 50),
    };

    const normalizedGoal = {
      nutrition: Math.min(100, Math.max(0, goalState.nutrition || 80)),
      physical: Math.min(100, Math.max(0, goalState.physical || 80)),
      sleep: Math.min(100, Math.max(0, goalState.sleep || 80)),
      mental: Math.min(100, Math.max(0, goalState.mental || 80)),
    };

    // Run both algorithms
    const bfsResult = searchEngine.bfs(initialState, normalizedGoal, 20);
    const aStarResult = searchEngine.aStar(initialState, normalizedGoal, 20);

    res.json({
      initialState,
      goalState: normalizedGoal,
      bfs: {
        found: bfsResult.found,
        pathLength: bfsResult.path.length,
        totalCost: bfsResult.cost,
        nodesExplored: bfsResult.nodesExplored,
        executionTime: `${bfsResult.executionTime}ms`,
      },
      aStar: {
        found: aStarResult.found,
        pathLength: aStarResult.path.length,
        totalCost: aStarResult.cost,
        nodesExplored: aStarResult.nodesExplored,
        executionTime: `${aStarResult.executionTime}ms`,
      },
      comparison: {
        bfsIsShorter: bfsResult.path.length < aStarResult.path.length,
        aStarIsCheaper: aStarResult.cost < bfsResult.cost,
        bfsExploredMore: bfsResult.nodesExplored > aStarResult.nodesExplored,
        recommendation:
          aStarResult.cost < bfsResult.cost
            ? 'A* is more efficient (lower cost)'
            : 'BFS is more efficient (fewer steps)',
      },
    });
  } catch (error) {
    console.error('[Search] Error comparing algorithms:', error);
    res.status(500).json({ error: 'Failed to compare algorithms' });
  }
});

module.exports = router;
