/**
 * Wellness Search Engine
 * Implements BFS and A* algorithms for finding optimal wellness paths
 * 
 * Problem Formulation:
 * - State: Current wellness metrics (nutrition, physical, sleep, mental)
 * - Initial State: User's current wellness scores
 * - Goal State: Target wellness scores (e.g., all metrics at 80+)
 * - Actions: Specific wellness activities (log meal, workout, sleep, journal)
 * - Transitions: How actions change the state
 * - Cost: Time/effort required for each action
 */

class WellnessSearchEngine {
  constructor() {
    // Define available wellness actions
    this.actions = {
      meal: {
        name: 'Log Meal',
        impact: { nutrition: 15, physical: 0, sleep: 0, mental: 5 },
        cost: 15, // minutes
        description: 'Log a balanced meal to improve nutrition',
      },
      workout: {
        name: 'Complete Workout',
        impact: { nutrition: 0, physical: 20, sleep: 5, mental: 10 },
        cost: 45,
        description: 'Complete a 45-minute workout session',
      },
      sleep: {
        name: 'Sleep 8 Hours',
        impact: { nutrition: 5, physical: 10, sleep: 30, mental: 15 },
        cost: 480, // 8 hours
        description: 'Get a full 8-hour sleep',
      },
      journal: {
        name: 'Journal Entry',
        impact: { nutrition: 0, physical: 0, sleep: 5, mental: 20 },
        cost: 20,
        description: 'Write a journal entry for mental clarity',
      },
      meditation: {
        name: 'Meditation',
        impact: { nutrition: 0, physical: 0, sleep: 10, mental: 25 },
        cost: 15,
        description: 'Practice 15-minute meditation',
      },
    };
  }

  /**
   * State representation: object with wellness metrics
   * @param {Object} state - { nutrition, physical, sleep, mental }
   * @returns {string} Unique state identifier
   */
  stateToString(state) {
    return `${Math.round(state.nutrition)},${Math.round(state.physical)},${Math.round(state.sleep)},${Math.round(state.mental)}`;
  }

  /**
   * Check if goal state is reached
   * @param {Object} currentState - Current wellness metrics
   * @param {Object} goalState - Target wellness metrics
   * @returns {boolean}
   */
  isGoalState(currentState, goalState) {
    return (
      currentState.nutrition >= goalState.nutrition &&
      currentState.physical >= goalState.physical &&
      currentState.sleep >= goalState.sleep &&
      currentState.mental >= goalState.mental
    );
  }

  /**
   * Apply an action to a state
   * @param {Object} state - Current state
   * @param {string} actionKey - Action identifier
   * @returns {Object} New state after action
   */
  applyAction(state, actionKey) {
    const action = this.actions[actionKey];
    if (!action) return null;

    return {
      nutrition: Math.min(100, state.nutrition + action.impact.nutrition),
      physical: Math.min(100, state.physical + action.impact.physical),
      sleep: Math.min(100, state.sleep + action.impact.sleep),
      mental: Math.min(100, state.mental + action.impact.mental),
    };
  }

  /**
   * Get all possible next states from current state
   * @param {Object} state - Current state
   * @returns {Array} Array of { action, newState, cost }
   */
  getSuccessors(state) {
    const successors = [];
    for (const [key, action] of Object.entries(this.actions)) {
      const newState = this.applyAction(state, key);
      successors.push({
        action: key,
        actionName: action.name,
        newState,
        cost: action.cost,
        impact: action.impact,
      });
    }
    return successors;
  }

  /**
   * Heuristic function for A*: Manhattan distance in wellness space
   * Estimates minimum steps needed to reach goal
   * @param {Object} currentState - Current wellness metrics
   * @param {Object} goalState - Target wellness metrics
   * @returns {number} Heuristic cost estimate
   */
  heuristic(currentState, goalState) {
    // Manhattan distance: sum of absolute differences
    const nutritionGap = Math.max(0, goalState.nutrition - currentState.nutrition);
    const physicalGap = Math.max(0, goalState.physical - currentState.physical);
    const sleepGap = Math.max(0, goalState.sleep - currentState.sleep);
    const mentalGap = Math.max(0, goalState.mental - currentState.mental);

    // Estimate: each action improves ~15 points on average
    // So total gap / 15 = estimated actions needed
    const totalGap = nutritionGap + physicalGap + sleepGap + mentalGap;
    return (totalGap / 15) * 30; // 30 minutes average per action
  }

  /**
   * BFS Algorithm: Find shortest path (fewest steps)
   * @param {Object} initialState - Starting wellness metrics
   * @param {Object} goalState - Target wellness metrics
   * @param {number} maxSteps - Maximum steps to explore (default: 20)
   * @returns {Object} { path, nodesExplored, found, cost }
   */
  bfs(initialState, goalState, maxSteps = 20) {
    const startTime = Date.now();
    const queue = [
      {
        state: initialState,
        path: [],
        cost: 0,
      },
    ];

    const visited = new Set();
    visited.add(this.stateToString(initialState));

    let nodesExplored = 0;

    while (queue.length > 0) {
      nodesExplored++;

      const { state, path, cost } = queue.shift();

      // Check if goal reached
      if (this.isGoalState(state, goalState)) {
        return {
          path,
          nodesExplored,
          found: true,
          cost,
          executionTime: Date.now() - startTime,
        };
      }

      // Don't explore beyond max steps
      if (path.length >= maxSteps) {
        continue;
      }

      // Explore successors
      const successors = this.getSuccessors(state);
      for (const successor of successors) {
        const stateStr = this.stateToString(successor.newState);

        if (!visited.has(stateStr)) {
          visited.add(stateStr);

          queue.push({
            state: successor.newState,
            path: [
              ...path,
              {
                action: successor.action,
                actionName: successor.actionName,
                newState: successor.newState,
                cost: successor.cost,
                impact: successor.impact,
              },
            ],
            cost: cost + successor.cost,
          });
        }
      }
    }

    return {
      path: [],
      nodesExplored,
      found: false,
      cost: Infinity,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * A* Algorithm: Find optimal path (minimum cost)
   * Uses heuristic to guide search toward goal
   * @param {Object} initialState - Starting wellness metrics
   * @param {Object} goalState - Target wellness metrics
   * @param {number} maxSteps - Maximum steps to explore (default: 20)
   * @returns {Object} { path, nodesExplored, found, cost }
   */
  aStar(initialState, goalState, maxSteps = 20) {
    const startTime = Date.now();

    // Priority queue: nodes sorted by f(n) = g(n) + h(n)
    // g(n) = actual cost from start
    // h(n) = heuristic estimate to goal
    const openSet = [
      {
        state: initialState,
        path: [],
        gCost: 0, // actual cost from start
        hCost: this.heuristic(initialState, goalState),
        fCost: this.heuristic(initialState, goalState),
      },
    ];

    const visited = new Set();
    let nodesExplored = 0;

    while (openSet.length > 0) {
      nodesExplored++;

      // Get node with lowest f cost
      let bestIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fCost < openSet[bestIndex].fCost) {
          bestIndex = i;
        }
      }

      const current = openSet.splice(bestIndex, 1)[0];
      const stateStr = this.stateToString(current.state);

      if (visited.has(stateStr)) {
        continue;
      }
      visited.add(stateStr);

      // Check if goal reached
      if (this.isGoalState(current.state, goalState)) {
        return {
          path: current.path,
          nodesExplored,
          found: true,
          cost: current.gCost,
          executionTime: Date.now() - startTime,
        };
      }

      // Don't explore beyond max steps
      if (current.path.length >= maxSteps) {
        continue;
      }

      // Explore successors
      const successors = this.getSuccessors(current.state);
      for (const successor of successors) {
        const stateStr = this.stateToString(successor.newState);

        if (!visited.has(stateStr)) {
          const gCost = current.gCost + successor.cost;
          const hCost = this.heuristic(successor.newState, goalState);
          const fCost = gCost + hCost;

          openSet.push({
            state: successor.newState,
            path: [
              ...current.path,
              {
                action: successor.action,
                actionName: successor.actionName,
                newState: successor.newState,
                cost: successor.cost,
                impact: successor.impact,
              },
            ],
            gCost,
            hCost,
            fCost,
          });
        }
      }
    }

    return {
      path: [],
      nodesExplored,
      found: false,
      cost: Infinity,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Find wellness path using specified algorithm
   * @param {Object} initialState - Current wellness metrics
   * @param {Object} goalState - Target wellness metrics
   * @param {string} algorithm - 'BFS' or 'A*'
   * @param {number} maxSteps - Maximum steps to explore
   * @returns {Object} Search result with path and metadata
   */
  findPath(initialState, goalState, algorithm = 'A*', maxSteps = 20) {
    if (algorithm === 'BFS') {
      return this.bfs(initialState, goalState, maxSteps);
    } else if (algorithm === 'A*') {
      return this.aStar(initialState, goalState, maxSteps);
    } else {
      throw new Error(`Unknown algorithm: ${algorithm}`);
    }
  }

  /**
   * Calculate readiness score from wellness metrics
   * @param {Object} state - Wellness metrics
   * @returns {number} Readiness score 0-100
   */
  calculateReadinessScore(state) {
    return Math.round(
      (state.nutrition * 0.25 +
        state.physical * 0.25 +
        state.sleep * 0.25 +
        state.mental * 0.25) /
        100
    );
  }
}

module.exports = WellnessSearchEngine;
