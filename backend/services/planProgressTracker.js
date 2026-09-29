const Plan = require('../models/Plan');
const Workout = require('../models/Workout');
const Routine = require('../models/Routine');

/**
 * Update plan progress when a workout is logged
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {string} workoutId - Workout ID (from plan)
 */
async function updateWorkoutProgress(userId, planId, workoutId) {
  try {
    const plan = await Plan.findById(planId);
    if (!plan) return;

    // Increment workouts completed
    plan.progress.workoutsCompleted = (plan.progress.workoutsCompleted || 0) + 1;
    plan.progress.lastUpdated = new Date();
    await plan.save();
  } catch (error) {
    console.error('Error updating workout progress:', error);
  }
}

/**
 * Calculate schedule adherence percentage
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 */
async function calculateScheduleAdherence(userId, planId) {
  try {
    const plan = await Plan.findById(planId);
    if (!plan || !plan.suggestions.schedule) return 0;

    const totalScheduleItems = plan.suggestions.schedule.length;
    if (totalScheduleItems === 0) return 0;

    // Count completed routines from plan
    const completedRoutines = await Routine.countDocuments({
      userId,
      planId,
      isFromPlan: true
    });

    const adherence = Math.round((completedRoutines / totalScheduleItems) * 100);
    
    // Update plan
    plan.progress.scheduleAdherence = adherence;
    plan.progress.lastUpdated = new Date();
    await plan.save();

    return adherence;
  } catch (error) {
    console.error('Error calculating schedule adherence:', error);
    return 0;
  }
}

/**
 * Get plan progress summary
 * @param {string} planId - Plan ID
 */
async function getPlanProgressSummary(planId) {
  try {
    const plan = await Plan.findById(planId);
    if (!plan) return null;

    return {
      workoutsCompleted: plan.progress.workoutsCompleted || 0,
      scheduleAdherence: plan.progress.scheduleAdherence || 0,
      lastUpdated: plan.progress.lastUpdated,
      totalWorkoutSuggestions: plan.suggestions.workouts.length,
      totalScheduleItems: plan.suggestions.schedule.length
    };
  } catch (error) {
    console.error('Error getting plan progress summary:', error);
    return null;
  }
}

/**
 * Get active plan for user
 * @param {string} userId - User ID
 */
async function getActivePlan(userId) {
  try {
    const plan = await Plan.findOne({ userId, status: 'active' });
    return plan;
  } catch (error) {
    console.error('Error getting active plan:', error);
    return null;
  }
}

/**
 * Get plan suggestions by type
 * @param {string} planId - Plan ID
 * @param {string} type - 'workouts', 'meals', or 'schedule'
 */
async function getPlanSuggestions(planId, type) {
  try {
    const plan = await Plan.findById(planId);
    if (!plan) return [];

    if (type === 'workouts') return plan.suggestions.workouts || [];
    if (type === 'meals') return plan.suggestions.meals || [];
    if (type === 'schedule') return plan.suggestions.schedule || [];

    return [];
  } catch (error) {
    console.error('Error getting plan suggestions:', error);
    return [];
  }
}

module.exports = {
  updateWorkoutProgress,
  calculateScheduleAdherence,
  getPlanProgressSummary,
  getActivePlan,
  getPlanSuggestions
};
