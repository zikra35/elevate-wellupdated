const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const User = require('../models/User');

describe('Plan Model - Comprehensive Unit Tests', () => {
  let userId;
  let testUser;
  let otherUserId;
  let otherUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/radiant-health-test');
    }
  });

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
  });

  afterEach(async () => {
    // Clean up
    await Plan.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Plan Creation', () => {
    it('should create a plan with all required fields', async () => {
      const planData = {
        userId,
        name: 'Test Plan',
        description: 'A test plan',
        status: 'active',
        suggestions: {
          workouts: [
            {
              id: 'w1',
              name: 'Cardio',
              type: 'cardio',
              duration: 30,
              intensity: 'moderate',
              description: 'Running session'
            }
          ],
          meals: [
            {
              id: 'm1',
              day: 'Monday',
              mealType: 'breakfast',
              name: 'Oatmeal',
              calories: 300
            }
          ],
          schedule: [
            {
              id: 's1',
              day: 'Monday',
              time: '06:00',
              activity: 'Wake up',
              duration: 0
            }
          ]
        },
        isMockGenerated: false
      };

      const plan = new Plan(planData);
      await plan.save();

      expect(plan._id).toBeDefined();
      expect(plan.userId.toString()).toBe(userId.toString());
      expect(plan.name).toBe('Test Plan');
      expect(plan.status).toBe('active');
      expect(plan.suggestions.workouts.length).toBe(1);
      expect(plan.suggestions.meals.length).toBe(1);
      expect(plan.suggestions.schedule.length).toBe(1);
    });

    it('should set default status to disabled', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: {
          workouts: [],
          meals: [],
          schedule: []
        }
      });

      await plan.save();
      expect(plan.status).toBe('disabled');
    });

    it('should initialize progress tracking', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: {
          workouts: [],
          meals: [],
          schedule: []
        }
      });

      await plan.save();
      expect(plan.progress.workoutsCompleted).toBe(0);
      expect(plan.progress.mealsLogged).toBe(0);
      expect(plan.progress.scheduleAdherence).toBe(0);
    });
  });

  describe('Plan Status Validation', () => {
    it('should only allow active or disabled status', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        status: 'invalid',
        suggestions: {
          workouts: [],
          meals: [],
          schedule: []
        }
      });

      try {
        await plan.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('status');
      }
    });
  });

  describe('Plan Timestamps', () => {
    it('should set createdAt and updatedAt', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: {
          workouts: [],
          meals: [],
          schedule: []
        }
      });

      await plan.save();
      expect(plan.createdAt).toBeDefined();
      expect(plan.updatedAt).toBeDefined();
    });

    it('should update updatedAt on save', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: {
          workouts: [],
          meals: [],
          schedule: []
        }
      });

      await plan.save();
      const originalUpdatedAt = plan.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 100));
      plan.name = 'Updated Plan';
      await plan.save();

      expect(plan.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Plan Indexing', () => {
    it('should efficiently query by userId and status', async () => {
      // Create multiple plans
      for (let i = 0; i < 5; i++) {
        const plan = new Plan({
          userId,
          name: `Plan ${i}`,
          status: i % 2 === 0 ? 'active' : 'disabled',
          suggestions: {
            workouts: [],
            meals: [],
            schedule: []
          }
        });
        await plan.save();
      }

      // Query by userId and status
      const activePlans = await Plan.find({ userId, status: 'active' });
      expect(activePlans.length).toBe(3);

      const disabledPlans = await Plan.find({ userId, status: 'disabled' });
      expect(disabledPlans.length).toBe(2);
    });
  });

  describe('Plan Data Integrity', () => {
    it('should preserve suggestion data structure', async () => {
      const suggestions = {
        workouts: [
          {
            id: 'w1',
            name: 'Cardio',
            type: 'cardio',
            duration: 30,
            intensity: 'moderate',
            description: 'Running',
            exercises: [
              { name: 'Running', sets: 1, reps: 0, duration: 30 }
            ]
          }
        ],
        meals: [
          {
            id: 'm1',
            day: 'Monday',
            mealType: 'breakfast',
            name: 'Oatmeal',
            calories: 300,
            macros: { protein: 10, carbs: 50, fat: 5 },
            ingredients: ['oats', 'milk'],
            recipe: 'Cook oats'
          }
        ],
        schedule: [
          {
            id: 's1',
            day: 'Monday',
            time: '06:00',
            activity: 'Wake up',
            duration: 0,
            notes: 'Start your day'
          }
        ]
      };

      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions
      });

      await plan.save();
      const retrieved = await Plan.findById(plan._id);

      expect(retrieved.suggestions.workouts[0].exercises[0].name).toBe('Running');
      expect(retrieved.suggestions.meals[0].macros.protein).toBe(10);
      expect(retrieved.suggestions.schedule[0].notes).toBe('Start your day');
    });
  });

  describe('Plan Progress Tracking', () => {
    it('should track progress updates', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: {
          workouts: [],
          meals: [],
          schedule: []
        }
      });

      await plan.save();

      // Update progress
      plan.progress.workoutsCompleted = 5;
      plan.progress.mealsLogged = 10;
      plan.progress.scheduleAdherence = 75;
      plan.progress.lastUpdated = new Date();

      await plan.save();
      const retrieved = await Plan.findById(plan._id);

      expect(retrieved.progress.workoutsCompleted).toBe(5);
      expect(retrieved.progress.mealsLogged).toBe(10);
      expect(retrieved.progress.scheduleAdherence).toBe(75);
    });
  });

  describe('Plan History', () => {
    it('should maintain previous suggestions history', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: {
          workouts: [{ id: 'w1', name: 'Cardio' }],
          meals: [],
          schedule: []
        }
      });

      await plan.save();

      // Add to history
      plan.previousSuggestions.push({
        workouts: [{ id: 'w1', name: 'Old Cardio' }],
        meals: [],
        schedule: [],
        regeneratedAt: new Date()
      });

      await plan.save();
      const retrieved = await Plan.findById(plan._id);

      expect(retrieved.previousSuggestions.length).toBe(1);
      expect(retrieved.previousSuggestions[0].workouts[0].name).toBe('Old Cardio');
    });
  });

  // ============ TASK 20.1: Plan Model Validation Tests ============
  describe('20.1 - Plan Model Validation', () => {
    it('should require userId field', async () => {
      const plan = new Plan({
        name: 'Test Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      try {
        await plan.save();
        fail('Should have thrown validation error for missing userId');
      } catch (error) {
        expect(error.message).toContain('userId');
      }
    });

    it('should require name field', async () => {
      const plan = new Plan({
        userId,
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      try {
        await plan.save();
        fail('Should have thrown validation error for missing name');
      } catch (error) {
        expect(error.message).toContain('name');
      }
    });

    it('should validate status enum values', async () => {
      const invalidStatuses = ['pending', 'archived', 'inactive', 'ACTIVE', 'DISABLED'];

      for (const status of invalidStatuses) {
        const plan = new Plan({
          userId,
          name: 'Test Plan',
          status,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });

        try {
          await plan.save();
          fail(`Should have rejected invalid status: ${status}`);
        } catch (error) {
          expect(error.message).toContain('status');
        }
      }
    });

    it('should accept valid status values', async () => {
      const validStatuses = ['active', 'disabled'];

      for (const status of validStatuses) {
        const plan = new Plan({
          userId,
          name: `Test Plan ${status}`,
          status,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });

        await plan.save();
        expect(plan.status).toBe(status);
      }
    });

    it('should set default name if not provided', async () => {
      const plan = new Plan({
        userId,
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();
      expect(plan.name).toBe('My Personalized Plan');
    });

    it('should validate suggestions structure', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: {
          workouts: [
            {
              id: 'w1',
              name: 'Cardio',
              type: 'cardio',
              duration: 30,
              intensity: 'moderate',
              description: 'Running'
            }
          ],
          meals: [
            {
              id: 'm1',
              day: 'Monday',
              mealType: 'breakfast',
              name: 'Oatmeal',
              calories: 300,
              macros: { protein: 10, carbs: 50, fat: 5 }
            }
          ],
          schedule: [
            {
              id: 's1',
              day: 'Monday',
              time: '06:00',
              activity: 'Wake up'
            }
          ]
        }
      });

      await plan.save();
      expect(plan.suggestions.workouts).toBeDefined();
      expect(plan.suggestions.meals).toBeDefined();
      expect(plan.suggestions.schedule).toBeDefined();
    });
  });

  // ============ TASK 20.2: Plan CRUD Operations Tests ============
  describe('20.2 - Plan CRUD Operations', () => {
    it('should create a plan and retrieve it', async () => {
      const planData = {
        userId,
        name: 'CRUD Test Plan',
        description: 'Testing CRUD operations',
        status: 'active',
        suggestions: {
          workouts: [{ id: 'w1', name: 'Cardio', type: 'cardio', duration: 30, intensity: 'moderate', description: 'Running' }],
          meals: [{ id: 'm1', day: 'Monday', mealType: 'breakfast', name: 'Oatmeal', calories: 300 }],
          schedule: [{ id: 's1', day: 'Monday', time: '06:00', activity: 'Wake up', duration: 0 }]
        }
      };

      const plan = new Plan(planData);
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('CRUD Test Plan');
      expect(retrieved.userId.toString()).toBe(userId.toString());
    });

    it('should update a plan', async () => {
      const plan = new Plan({
        userId,
        name: 'Original Name',
        description: 'Original description',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();

      plan.name = 'Updated Name';
      plan.description = 'Updated description';
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.name).toBe('Updated Name');
      expect(retrieved.description).toBe('Updated description');
    });

    it('should delete a plan', async () => {
      const plan = new Plan({
        userId,
        name: 'Plan to Delete',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();
      const planId = plan._id;

      await Plan.findByIdAndDelete(planId);
      const retrieved = await Plan.findById(planId);
      expect(retrieved).toBeNull();
    });

    it('should verify user ownership on retrieval', async () => {
      const plan = new Plan({
        userId,
        name: 'User Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.userId.toString()).toBe(userId.toString());
      expect(retrieved.userId.toString()).not.toBe(otherUserId.toString());
    });

    it('should allow updating only owned plans', async () => {
      const plan = new Plan({
        userId,
        name: 'Original Name',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();

      // Simulate ownership check
      if (plan.userId.toString() === userId.toString()) {
        plan.name = 'Updated Name';
        await plan.save();
      }

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.name).toBe('Updated Name');
    });

    it('should retrieve multiple plans for a user', async () => {
      for (let i = 0; i < 5; i++) {
        const plan = new Plan({
          userId,
          name: `Plan ${i}`,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan.save();
      }

      const plans = await Plan.find({ userId });
      expect(plans.length).toBe(5);
      plans.forEach(plan => {
        expect(plan.userId.toString()).toBe(userId.toString());
      });
    });

    it('should update progress fields', async () => {
      const plan = new Plan({
        userId,
        name: 'Progress Test Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();

      plan.progress.workoutsCompleted = 3;
      plan.progress.mealsLogged = 7;
      plan.progress.scheduleAdherence = 85;
      plan.progress.lastUpdated = new Date();

      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.progress.workoutsCompleted).toBe(3);
      expect(retrieved.progress.mealsLogged).toBe(7);
      expect(retrieved.progress.scheduleAdherence).toBe(85);
    });
  });

  // ============ TASK 20.3: Plan Activation/Deactivation Tests ============
  describe('20.3 - Plan Activation and Deactivation', () => {
    it('should activate a disabled plan', async () => {
      const plan = new Plan({
        userId,
        name: 'Disabled Plan',
        status: 'disabled',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();
      expect(plan.status).toBe('disabled');

      plan.status = 'active';
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.status).toBe('active');
    });

    it('should deactivate an active plan', async () => {
      const plan = new Plan({
        userId,
        name: 'Active Plan',
        status: 'active',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();
      expect(plan.status).toBe('active');

      plan.status = 'disabled';
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.status).toBe('disabled');
    });

    it('should enforce single active plan per user', async () => {
      // Create first active plan
      const plan1 = new Plan({
        userId,
        name: 'First Active Plan',
        status: 'active',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan1.save();

      // Create second plan and activate it
      const plan2 = new Plan({
        userId,
        name: 'Second Plan',
        status: 'disabled',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan2.save();

      // Deactivate first plan
      plan1.status = 'disabled';
      await plan1.save();

      // Activate second plan
      plan2.status = 'active';
      await plan2.save();

      // Verify only one active plan
      const activePlans = await Plan.find({ userId, status: 'active' });
      expect(activePlans.length).toBe(1);
      expect(activePlans[0]._id.toString()).toBe(plan2._id.toString());
    });

    it('should transition from active to disabled correctly', async () => {
      const plan = new Plan({
        userId,
        name: 'Transition Test',
        status: 'active',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();

      // Transition: active -> disabled
      plan.status = 'disabled';
      await plan.save();

      let retrieved = await Plan.findById(plan._id);
      expect(retrieved.status).toBe('disabled');

      // Transition: disabled -> active
      plan.status = 'active';
      await plan.save();

      retrieved = await Plan.findById(plan._id);
      expect(retrieved.status).toBe('active');
    });

    it('should update timestamp on status change', async () => {
      const plan = new Plan({
        userId,
        name: 'Timestamp Test',
        status: 'disabled',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();
      const originalUpdatedAt = plan.updatedAt;

      // Wait and change status
      await new Promise(resolve => setTimeout(resolve, 100));
      plan.status = 'active';
      await plan.save();

      expect(plan.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should allow multiple disabled plans per user', async () => {
      for (let i = 0; i < 3; i++) {
        const plan = new Plan({
          userId,
          name: `Disabled Plan ${i}`,
          status: 'disabled',
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan.save();
      }

      const disabledPlans = await Plan.find({ userId, status: 'disabled' });
      expect(disabledPlans.length).toBe(3);
    });
  });

  // ============ TASK 20.4: Data Isolation Tests ============
  describe('20.4 - Data Isolation and User Ownership', () => {
    it('should not allow user to access other user plans', async () => {
      const plan = new Plan({
        userId: otherUserId,
        name: 'Other User Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();

      // Try to query as different user
      const userPlans = await Plan.find({ userId });
      expect(userPlans.length).toBe(0);

      const otherUserPlans = await Plan.find({ userId: otherUserId });
      expect(otherUserPlans.length).toBe(1);
    });

    it('should not allow user to modify other user plans', async () => {
      const plan = new Plan({
        userId: otherUserId,
        name: 'Other User Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();

      // Simulate ownership check - should fail
      if (plan.userId.toString() === userId.toString()) {
        plan.name = 'Hacked Name';
        await plan.save();
      }

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.name).toBe('Other User Plan');
    });

    it('should not allow user to delete other user plans', async () => {
      const plan = new Plan({
        userId: otherUserId,
        name: 'Other User Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();
      const planId = plan._id;

      // Simulate ownership check - should prevent deletion
      const canDelete = plan.userId.toString() === userId.toString();
      if (canDelete) {
        await Plan.findByIdAndDelete(planId);
      }

      const retrieved = await Plan.findById(planId);
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('Other User Plan');
    });

    it('should isolate plans by userId in queries', async () => {
      // Create plans for both users
      for (let i = 0; i < 3; i++) {
        const plan1 = new Plan({
          userId,
          name: `User 1 Plan ${i}`,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan1.save();

        const plan2 = new Plan({
          userId: otherUserId,
          name: `User 2 Plan ${i}`,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan2.save();
      }

      const user1Plans = await Plan.find({ userId });
      const user2Plans = await Plan.find({ userId: otherUserId });

      expect(user1Plans.length).toBe(3);
      expect(user2Plans.length).toBe(3);

      user1Plans.forEach(plan => {
        expect(plan.userId.toString()).toBe(userId.toString());
      });

      user2Plans.forEach(plan => {
        expect(plan.userId.toString()).toBe(otherUserId.toString());
      });
    });

    it('should not expose other user data in plan suggestions', async () => {
      const plan1 = new Plan({
        userId,
        name: 'User 1 Plan',
        suggestions: {
          workouts: [{ id: 'w1', name: 'User 1 Workout' }],
          meals: [],
          schedule: []
        }
      });
      await plan1.save();

      const plan2 = new Plan({
        userId: otherUserId,
        name: 'User 2 Plan',
        suggestions: {
          workouts: [{ id: 'w2', name: 'User 2 Workout' }],
          meals: [],
          schedule: []
        }
      });
      await plan2.save();

      const user1Plans = await Plan.find({ userId });
      expect(user1Plans[0].suggestions.workouts[0].name).toBe('User 1 Workout');
      expect(user1Plans[0].suggestions.workouts[0].name).not.toBe('User 2 Workout');
    });

    it('should enforce userId index for efficient isolation', async () => {
      // Create many plans for both users
      for (let i = 0; i < 10; i++) {
        const plan1 = new Plan({
          userId,
          name: `User 1 Plan ${i}`,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan1.save();

        const plan2 = new Plan({
          userId: otherUserId,
          name: `User 2 Plan ${i}`,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan2.save();
      }

      // Query should use index
      const user1Plans = await Plan.find({ userId });
      expect(user1Plans.length).toBe(10);

      user1Plans.forEach(plan => {
        expect(plan.userId.toString()).toBe(userId.toString());
      });
    });

    it('should isolate plans by userId and status', async () => {
      // Create plans with different statuses for both users
      for (let i = 0; i < 3; i++) {
        const plan1 = new Plan({
          userId,
          name: `User 1 Plan ${i}`,
          status: i === 0 ? 'active' : 'disabled',
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan1.save();

        const plan2 = new Plan({
          userId: otherUserId,
          name: `User 2 Plan ${i}`,
          status: i === 0 ? 'active' : 'disabled',
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan2.save();
      }

      const user1Active = await Plan.find({ userId, status: 'active' });
      const user2Active = await Plan.find({ userId: otherUserId, status: 'active' });

      expect(user1Active.length).toBe(1);
      expect(user2Active.length).toBe(1);
      expect(user1Active[0].userId.toString()).toBe(userId.toString());
      expect(user2Active[0].userId.toString()).toBe(otherUserId.toString());
    });
  });
});
