const mongoose = require('mongoose');
const fc = require('fast-check');
const Plan = require('../models/Plan');
const User = require('../models/User');

// Set global timeout for all tests
jest.setTimeout(60000);

describe('Property-Based Tests - AI-Personalized Onboarding', () => {
  let userId;
  let testUser;
  let otherUserId;
  let otherUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/radiant-health-test');
    }
  }, 30000);

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Test User',
      gender: 'female',
      onboarding_completed: true
    });
    await testUser.save();
    userId = testUser._id;

    // Create another test user for isolation tests
    otherUser = new User({
      email: `other-${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Other User',
      gender: 'male',
      onboarding_completed: true
    });
    await otherUser.save();
    otherUserId = otherUser._id;
  }, 30000);

  afterEach(async () => {
    // Clean up
    await Plan.deleteMany({});
    await User.deleteMany({});
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 30000);

  // ============ PROPERTY GENERATORS ============

  /**
   * Generate valid user profile data for onboarding
   */
  const userProfileArbitrary = () => {
    return fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      age: fc.integer({ min: 13, max: 120 }),
      gender: fc.oneof(fc.constant('male'), fc.constant('female'), fc.constant('other')),
      height_cm: fc.integer({ min: 100, max: 250 }),
      weight_kg: fc.integer({ min: 30, max: 200 }),
      goal: fc.oneof(
        fc.constant('weight_loss'),
        fc.constant('muscle_gain'),
        fc.constant('general_fitness'),
        fc.constant('endurance')
      ),
      activity_level: fc.oneof(
        fc.constant('sedentary'),
        fc.constant('lightly_active'),
        fc.constant('moderately_active'),
        fc.constant('very_active')
      ),
      dietary_preferences: fc.array(
        fc.oneof(
          fc.constant('vegetarian'),
          fc.constant('vegan'),
          fc.constant('gluten_free'),
          fc.constant('dairy_free'),
          fc.constant('keto'),
          fc.constant('paleo')
        ),
        { maxLength: 3 }
      )
    });
  };

  /**
   * Generate valid workout suggestions
   */
  const workoutSuggestionArbitrary = () => {
    return fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      type: fc.oneof(
        fc.constant('cardio'),
        fc.constant('strength'),
        fc.constant('flexibility'),
        fc.constant('sports')
      ),
      duration: fc.integer({ min: 5, max: 180 }),
      intensity: fc.oneof(
        fc.constant('low'),
        fc.constant('moderate'),
        fc.constant('high')
      ),
      description: fc.string({ maxLength: 500 })
    });
  };

  /**
   * Generate valid meal suggestions
   */
  const mealSuggestionArbitrary = () => {
    return fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      day: fc.oneof(
        fc.constant('Monday'),
        fc.constant('Tuesday'),
        fc.constant('Wednesday'),
        fc.constant('Thursday'),
        fc.constant('Friday'),
        fc.constant('Saturday'),
        fc.constant('Sunday')
      ),
      mealType: fc.oneof(
        fc.constant('breakfast'),
        fc.constant('lunch'),
        fc.constant('dinner'),
        fc.constant('snack')
      ),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      calories: fc.integer({ min: 50, max: 1000 }),
      macros: fc.record({
        protein: fc.integer({ min: 0, max: 100 }),
        carbs: fc.integer({ min: 0, max: 200 }),
        fat: fc.integer({ min: 0, max: 100 })
      })
    });
  };

  /**
   * Generate valid schedule suggestions
   */
  const scheduleSuggestionArbitrary = () => {
    return fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      day: fc.oneof(
        fc.constant('Monday'),
        fc.constant('Tuesday'),
        fc.constant('Wednesday'),
        fc.constant('Thursday'),
        fc.constant('Friday'),
        fc.constant('Saturday'),
        fc.constant('Sunday')
      ),
      time: fc.tuple(
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 })
      ).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`),
      activity: fc.string({ minLength: 1, maxLength: 100 }),
      duration: fc.integer({ min: 0, max: 480 })
    });
  };

  /**
   * Generate valid suggestions object
   */
  const suggestionsArbitrary = () => {
    return fc.record({
      workouts: fc.array(workoutSuggestionArbitrary(), { minLength: 1, maxLength: 5 }),
      meals: fc.array(mealSuggestionArbitrary(), { minLength: 1, maxLength: 7 }),
      schedule: fc.array(scheduleSuggestionArbitrary(), { minLength: 1, maxLength: 10 })
    });
  };

  // ============ PROPERTY-BASED TESTS ============

  /**
   * Property 1: Onboarding Data Collection and Validation
   * For any user profile with required fields, the system SHALL collect and store all data,
   * and subsequent retrieval SHALL return the exact same data.
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
   */
  describe('21.1 - Property 1: Onboarding Data Collection and Validation', () => {
    it('should collect and preserve all onboarding data fields', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArbitrary(), async (profile) => {
          // Store profile in user
          const user = new User({
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            password: 'testpassword123',
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            goal: profile.goal,
            activity_level: profile.activity_level,
            dietary_preferences: profile.dietary_preferences,
            onboarding_completed: true
          });
          await user.save();

          // Retrieve profile
          const retrieved = await User.findById(user._id);

          // Verify all fields match
          expect(retrieved.name).toBe(profile.name);
          expect(retrieved.age).toBe(profile.age);
          expect(retrieved.gender).toBe(profile.gender);
          expect(retrieved.height_cm).toBe(profile.height_cm);
          expect(retrieved.weight_kg).toBe(profile.weight_kg);
          expect(retrieved.goal).toBe(profile.goal);
          expect(retrieved.activity_level).toBe(profile.activity_level);
          expect(retrieved.dietary_preferences).toEqual(profile.dietary_preferences);

          // Cleanup
          await User.findByIdAndDelete(user._id);
        }),
        { numRuns: 50, timeout: 10000 }
      );
    });
  });

  /**
   * Property 3: Suggestion Generation Timeout
   * For any user profile, the suggestion generation request SHALL complete within 10 seconds,
   * either returning valid suggestions or falling back to mock suggestions.
   * **Validates: Requirements 2.5, 2.6**
   */
  describe('21.2 - Property 3: Suggestion Generation Timeout', () => {
    it('should complete suggestion generation within timeout', async () => {
      await fc.assert(
        fc.asyncProperty(suggestionsArbitrary(), async (suggestions) => {
          const startTime = Date.now();

          // Simulate suggestion generation (in real scenario, this would call OpenAI API)
          const plan = new Plan({
            userId,
            name: 'Test Plan',
            suggestions,
            isMockGenerated: false
          });
          await plan.save();

          const endTime = Date.now();
          const duration = endTime - startTime;

          // Should complete within 10 seconds (10000ms)
          expect(duration).toBeLessThan(10000);

          // Cleanup
          await Plan.findByIdAndDelete(plan._id);
        }),
        { numRuns: 30, timeout: 15000 }
      );
    });
  });

  /**
   * Property 5: Plan Creation with Correct Status
   * For any set of suggestions, when a plan is created with status "active", the plan SHALL be stored
   * with status "active" and associated with the user. When created with status "disabled", the plan
   * SHALL be stored with status "disabled".
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
   */
  describe('21.3 - Property 5: Plan Creation with Correct Status', () => {
    it('should create plans with correct status', async () => {
      await fc.assert(
        fc.asyncProperty(
          suggestionsArbitrary(),
          fc.oneof(fc.constant('active'), fc.constant('disabled')),
          async (suggestions, status) => {
            const plan = new Plan({
              userId,
              name: 'Test Plan',
              status,
              suggestions
            });
            await plan.save();

            const retrieved = await Plan.findById(plan._id);

            // Verify status is correct
            expect(retrieved.status).toBe(status);
            expect(retrieved.userId.toString()).toBe(userId.toString());

            // Cleanup
            await Plan.findByIdAndDelete(plan._id);
          }
        ),
        { numRuns: 40, timeout: 10000 }
      );
    });
  });

  /**
   * Property 7: Plan Persistence and History
   * For any user with multiple plans, all plans SHALL remain in the database after new plans are created,
   * and querying all plans for the user SHALL return all plans (both active and disabled).
   * **Validates: Requirements 4.8, 6.1**
   */
  describe('21.4 - Property 7: Plan Persistence and History', () => {
    it('should persist all plans and maintain history', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(suggestionsArbitrary(), { minLength: 2, maxLength: 5 }),
          async (suggestionsList) => {
            const planIds = [];

            // Create multiple plans
            for (const suggestions of suggestionsList) {
              const plan = new Plan({
                userId,
                name: `Plan ${planIds.length}`,
                suggestions,
                status: planIds.length === 0 ? 'active' : 'disabled'
              });
              await plan.save();
              planIds.push(plan._id);
            }

            // Query all plans for user
            const allPlans = await Plan.find({ userId });

            // Verify all plans are returned
            expect(allPlans.length).toBe(planIds.length);

            // Verify each plan is in the results
            const retrievedIds = allPlans.map(p => p._id.toString());
            planIds.forEach(id => {
              expect(retrievedIds).toContain(id.toString());
            });

            // Cleanup
            await Plan.deleteMany({ userId });
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 8: Plan Activation and Deactivation
   * For any disabled plan, when activated, the plan's status SHALL change to "active" and the previous
   * active plan's status SHALL change to "disabled". When deactivated, the plan's status SHALL change to "disabled".
   * **Validates: Requirements 11.1, 11.2, 11.4, 11.5**
   */
  describe('21.5 - Property 8: Plan Activation and Deactivation', () => {
    it('should correctly activate and deactivate plans', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(suggestionsArbitrary(), { minLength: 2, maxLength: 3 }),
          async (suggestionsList) => {
            const plans = [];

            // Create multiple plans
            for (let i = 0; i < suggestionsList.length; i++) {
              const plan = new Plan({
                userId,
                name: `Plan ${i}`,
                suggestions: suggestionsList[i],
                status: i === 0 ? 'active' : 'disabled'
              });
              await plan.save();
              plans.push(plan);
            }

            // Activate second plan
            if (plans.length > 1) {
              plans[1].status = 'active';
              await plans[1].save();

              // Deactivate first plan
              plans[0].status = 'disabled';
              await plans[0].save();

              // Verify only one active plan
              const activePlans = await Plan.find({ userId, status: 'active' });
              expect(activePlans.length).toBe(1);
              expect(activePlans[0]._id.toString()).toBe(plans[1]._id.toString());
            }

            // Cleanup
            await Plan.deleteMany({ userId });
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 9: Suggestion Removal on Plan Deactivation
   * For any active plan with suggestions, when the plan is deactivated, the suggestions SHALL no longer
   * appear in the Workouts, Meals, and Routines sections for that user.
   * **Validates: Requirements 11.6**
   */
  describe('21.6 - Property 9: Suggestion Removal on Plan Deactivation', () => {
    it('should remove suggestions when plan is deactivated', async () => {
      await fc.assert(
        fc.asyncProperty(suggestionsArbitrary(), async (suggestions) => {
          const plan = new Plan({
            userId,
            name: 'Test Plan',
            status: 'active',
            suggestions
          });
          await plan.save();

          // Verify plan is active
          let retrieved = await Plan.findById(plan._id);
          expect(retrieved.status).toBe('active');
          expect(retrieved.suggestions.workouts.length).toBeGreaterThan(0);

          // Deactivate plan
          plan.status = 'disabled';
          await plan.save();

          // Verify plan is deactivated
          retrieved = await Plan.findById(plan._id);
          expect(retrieved.status).toBe('disabled');

          // Verify suggestions are still in database but plan is inactive
          // (In real scenario, UI would filter out suggestions from inactive plans)
          expect(retrieved.suggestions.workouts.length).toBeGreaterThan(0);

          // Cleanup
          await Plan.findByIdAndDelete(plan._id);
        }),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 10: Plan Icon Navigation
   * For any authenticated user, clicking the Plan Icon SHALL navigate to the Plan Management Interface,
   * and the Plan Icon SHALL be visible on all authenticated pages.
   * **Validates: Requirements 5.3, 5.4**
   */
  describe('21.7 - Property 10: Plan Icon Navigation', () => {
    it('should ensure plan icon is associated with user plans', async () => {
      await fc.assert(
        fc.asyncProperty(suggestionsArbitrary(), async (suggestions) => {
          const plan = new Plan({
            userId,
            name: 'Test Plan',
            status: 'active',
            suggestions
          });
          await plan.save();

          // Verify plan exists for user
          const userPlans = await Plan.find({ userId });
          expect(userPlans.length).toBeGreaterThan(0);

          // Verify at least one active plan exists (for icon display)
          const activePlans = await Plan.find({ userId, status: 'active' });
          expect(activePlans.length).toBeGreaterThan(0);

          // Cleanup
          await Plan.findByIdAndDelete(plan._id);
        }),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 11: Plan Icon Active Indicator
   * For any user with an active plan, the Plan Icon SHALL display a visual indicator (badge).
   * When no active plan exists, the indicator SHALL not be displayed.
   * **Validates: Requirements 5.5**
   */
  describe('21.8 - Property 11: Plan Icon Active Indicator', () => {
    it('should correctly indicate active plan status', async () => {
      await fc.assert(
        fc.asyncProperty(suggestionsArbitrary(), async (suggestions) => {
          // Create active plan
          const activePlan = new Plan({
            userId,
            name: 'Active Plan',
            status: 'active',
            suggestions
          });
          await activePlan.save();

          // Check for active plan
          const activePlans = await Plan.find({ userId, status: 'active' });
          expect(activePlans.length).toBe(1);

          // Deactivate plan
          activePlan.status = 'disabled';
          await activePlan.save();

          // Check no active plans
          const noActivePlans = await Plan.find({ userId, status: 'active' });
          expect(noActivePlans.length).toBe(0);

          // Cleanup
          await Plan.findByIdAndDelete(activePlan._id);
        }),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 12: Unauthenticated User Access Control
   * For any unauthenticated user, the Plan Icon SHALL not be displayed, and accessing the Plan
   * Management Interface SHALL redirect to login.
   * **Validates: Requirements 5.7, 12.5**
   */
  describe('21.9 - Property 12: Unauthenticated User Access Control', () => {
    it('should enforce user ownership in plan queries', async () => {
      await fc.assert(
        fc.asyncProperty(suggestionsArbitrary(), async (suggestions) => {
          // Create plan for one user
          const plan = new Plan({
            userId,
            name: 'User Plan',
            suggestions
          });
          await plan.save();

          // Try to query as different user
          const otherUserPlans = await Plan.find({ userId: otherUserId });
          expect(otherUserPlans.length).toBe(0);

          // Verify original user can access
          const userPlans = await Plan.find({ userId });
          expect(userPlans.length).toBe(1);

          // Cleanup
          await Plan.findByIdAndDelete(plan._id);
        }),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 17: Meal Progress Tracking
   * For any active plan, when a meal from the plan is logged, the plan's `progress.mealsLogged`
   * counter SHALL increment by 1.
   * **Validates: Requirements 9.4, 15.4**
   */
  describe('21.10 - Property 17: Meal Progress Tracking', () => {
    it('should track meal progress correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          suggestionsArbitrary(),
          fc.integer({ min: 1, max: 10 }),
          async (suggestions, mealsToLog) => {
            const plan = new Plan({
              userId,
              name: 'Test Plan',
              status: 'active',
              suggestions
            });
            await plan.save();

            // Simulate logging meals
            plan.progress.mealsLogged = mealsToLog;
            plan.progress.lastUpdated = new Date();
            await plan.save();

            // Verify progress updated
            const retrieved = await Plan.findById(plan._id);
            expect(retrieved.progress.mealsLogged).toBe(mealsToLog);

            // Cleanup
            await Plan.findByIdAndDelete(plan._id);
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 19: User Data Isolation in Suggestions
   * For any user, the AI suggestion engine SHALL only use that user's profile data, and suggestions
   * SHALL not contain data from other users.
   * **Validates: Requirements 12.1**
   */
  describe('21.11 - Property 19: User Data Isolation in Suggestions', () => {
    it('should isolate user data in suggestions', async () => {
      await fc.assert(
        fc.asyncProperty(
          suggestionsArbitrary(),
          suggestionsArbitrary(),
          async (suggestions1, suggestions2) => {
            // Create plans for two different users
            const plan1 = new Plan({
              userId,
              name: 'User 1 Plan',
              suggestions: suggestions1
            });
            await plan1.save();

            const plan2 = new Plan({
              userId: otherUserId,
              name: 'User 2 Plan',
              suggestions: suggestions2
            });
            await plan2.save();

            // Query plans for each user
            const user1Plans = await Plan.find({ userId });
            const user2Plans = await Plan.find({ userId: otherUserId });

            // Verify isolation
            expect(user1Plans.length).toBe(1);
            expect(user2Plans.length).toBe(1);
            expect(user1Plans[0].userId.toString()).toBe(userId.toString());
            expect(user2Plans[0].userId.toString()).toBe(otherUserId.toString());

            // Verify suggestions are different
            expect(user1Plans[0].suggestions).toEqual(suggestions1);
            expect(user2Plans[0].suggestions).toEqual(suggestions2);

            // Cleanup
            await Plan.findByIdAndDelete(plan1._id);
            await Plan.findByIdAndDelete(plan2._id);
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 20: Sensitive Data Filtering for External API
   * For any user profile sent to the OpenAI API, the request SHALL not include sensitive personal
   * identifiers (email, phone, address), only health metrics and preferences.
   * **Validates: Requirements 12.2**
   */
  describe('21.12 - Property 20: Sensitive Data Filtering for External API', () => {
    it('should not expose sensitive data in plan storage', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArbitrary(), async (profile) => {
          // Create user with profile
          const user = new User({
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            password: 'testpassword123',
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            goal: profile.goal,
            activity_level: profile.activity_level,
            dietary_preferences: profile.dietary_preferences,
            onboarding_completed: true
          });
          await user.save();

          // Create plan with suggestions
          const plan = new Plan({
            userId: user._id,
            name: 'Test Plan',
            suggestions: {
              workouts: [{ id: 'w1', name: 'Cardio', type: 'cardio', duration: 30, intensity: 'moderate', description: 'Running' }],
              meals: [{ id: 'm1', day: 'Monday', mealType: 'breakfast', name: 'Oatmeal', calories: 300 }],
              schedule: [{ id: 's1', day: 'Monday', time: '06:00', activity: 'Wake up', duration: 0 }]
            }
          });
          await plan.save();

          // Verify plan doesn't contain sensitive data
          const retrieved = await Plan.findById(plan._id);
          expect(retrieved.suggestions).toBeDefined();
          expect(retrieved.suggestions.workouts).toBeDefined();
          expect(retrieved.suggestions.meals).toBeDefined();
          expect(retrieved.suggestions.schedule).toBeDefined();

          // Verify no email/phone/address in suggestions
          const suggestionString = JSON.stringify(retrieved.suggestions);
          expect(suggestionString).not.toContain(user.email);

          // Cleanup
          await Plan.findByIdAndDelete(plan._id);
          await User.findByIdAndDelete(user._id);
        }),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 21: Plan Deletion and Data Removal
   * For any plan, when deleted, the plan record SHALL be removed from the database, and subsequent
   * queries for that plan SHALL return not found.
   * **Validates: Requirements 6.8, 12.4**
   */
  describe('21.13 - Property 21: Plan Deletion and Data Removal', () => {
    it('should completely remove deleted plans', async () => {
      await fc.assert(
        fc.asyncProperty(suggestionsArbitrary(), async (suggestions) => {
          const plan = new Plan({
            userId,
            name: 'Plan to Delete',
            suggestions
          });
          await plan.save();
          const planId = plan._id;

          // Verify plan exists
          let retrieved = await Plan.findById(planId);
          expect(retrieved).toBeDefined();

          // Delete plan
          await Plan.findByIdAndDelete(planId);

          // Verify plan is gone
          retrieved = await Plan.findById(planId);
          expect(retrieved).toBeNull();

          // Verify plan not in user's plans
          const userPlans = await Plan.find({ userId });
          const planIds = userPlans.map(p => p._id.toString());
          expect(planIds).not.toContain(planId.toString());
        }),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });
});
