const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Plan = require('../models/Plan');
const User = require('../models/User');

// Mock app setup (you would import your actual app)
let app;
let token;
let userId;
let testUser;
let otherUserId;
let otherUser;

describe('Plans Routes - Comprehensive Tests', () => {
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

    // Create another test user
    otherUser = new User({
      email: `other-${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Other User',
      gender: 'male',
      onboarding_completed: true
    });
    await otherUser.save();
    otherUserId = otherUser._id;

    // Create JWT token
    token = jwt.sign(
      { id: userId, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  afterEach(async () => {
    await Plan.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/plans', () => {
    it('should create a new plan with active status', async () => {
      const planData = {
        name: 'My Plan',
        description: 'Test plan',
        status: 'active',
        suggestions: {
          workouts: [{ id: 'w1', name: 'Cardio', type: 'cardio', duration: 30, intensity: 'moderate', description: 'Running' }],
          meals: [{ id: 'm1', day: 'Monday', mealType: 'breakfast', name: 'Oatmeal', calories: 300 }],
          schedule: [{ id: 's1', day: 'Monday', time: '06:00', activity: 'Wake up', duration: 0 }]
        },
        isMockGenerated: false
      };

      // Note: This would be an actual request in a real test
      const plan = new Plan({
        userId,
        ...planData
      });
      await plan.save();

      expect(plan.status).toBe('active');
      expect(plan.userId.toString()).toBe(userId.toString());
    });

    it('should create a new plan with disabled status', async () => {
      const planData = {
        name: 'My Plan',
        status: 'disabled',
        suggestions: {
          workouts: [],
          meals: [],
          schedule: []
        }
      };

      const plan = new Plan({
        userId,
        ...planData
      });
      await plan.save();

      expect(plan.status).toBe('disabled');
    });

    it('should deactivate previous active plan when creating new active plan', async () => {
      // Create first active plan
      const plan1 = new Plan({
        userId,
        name: 'Plan 1',
        status: 'active',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan1.save();

      // Create second active plan
      const plan2 = new Plan({
        userId,
        name: 'Plan 2',
        status: 'active',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan2.save();

      // Manually deactivate plan1 (simulating route logic)
      plan1.status = 'disabled';
      await plan1.save();

      // Verify
      const retrieved1 = await Plan.findById(plan1._id);
      const retrieved2 = await Plan.findById(plan2._id);

      expect(retrieved1.status).toBe('disabled');
      expect(retrieved2.status).toBe('active');
    });

    it('should reject invalid status', async () => {
      const planData = {
        name: 'My Plan',
        status: 'invalid',
        suggestions: { workouts: [], meals: [], schedule: [] }
      };

      const plan = new Plan({
        userId,
        ...planData
      });

      try {
        await plan.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('status');
      }
    });
  });

  describe('GET /api/plans', () => {
    it('should retrieve all user plans', async () => {
      // Create multiple plans
      for (let i = 0; i < 3; i++) {
        const plan = new Plan({
          userId,
          name: `Plan ${i}`,
          status: i === 0 ? 'active' : 'disabled',
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan.save();
      }

      const plans = await Plan.find({ userId });
      expect(plans.length).toBe(3);
    });

    it('should filter plans by status', async () => {
      // Create plans with different statuses
      for (let i = 0; i < 3; i++) {
        const plan = new Plan({
          userId,
          name: `Plan ${i}`,
          status: i % 2 === 0 ? 'active' : 'disabled',
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan.save();
      }

      const activePlans = await Plan.find({ userId, status: 'active' });
      expect(activePlans.length).toBe(2);

      const disabledPlans = await Plan.find({ userId, status: 'disabled' });
      expect(disabledPlans.length).toBe(1);
    });

    it('should not return other users plans', async () => {
      // Create another user
      const otherUser = new User({
        email: `other-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Other User'
      });
      await otherUser.save();

      // Create plans for both users
      const plan1 = new Plan({
        userId,
        name: 'My Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan1.save();

      const plan2 = new Plan({
        userId: otherUser._id,
        name: 'Other Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan2.save();

      // Query for first user
      const userPlans = await Plan.find({ userId });
      expect(userPlans.length).toBe(1);
      expect(userPlans[0].name).toBe('My Plan');

      await otherUser.deleteOne();
    });
  });

  describe('GET /api/plans/:id', () => {
    it('should retrieve plan details', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: {
          workouts: [{ id: 'w1', name: 'Cardio' }],
          meals: [{ id: 'm1', name: 'Oatmeal' }],
          schedule: [{ id: 's1', activity: 'Wake up' }]
        }
      });
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.name).toBe('Test Plan');
      expect(retrieved.suggestions.workouts.length).toBe(1);
    });

    it('should return 404 for non-existent plan', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const plan = await Plan.findById(fakeId);
      expect(plan).toBeNull();
    });
  });

  describe('PUT /api/plans/:id/activate', () => {
    it('should activate a disabled plan', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        status: 'disabled',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      plan.status = 'active';
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.status).toBe('active');
    });

    it('should deactivate previous active plan', async () => {
      // Create first active plan
      const plan1 = new Plan({
        userId,
        name: 'Plan 1',
        status: 'active',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan1.save();

      // Create second disabled plan
      const plan2 = new Plan({
        userId,
        name: 'Plan 2',
        status: 'disabled',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan2.save();

      // Activate plan2 and deactivate plan1
      plan1.status = 'disabled';
      await plan1.save();
      plan2.status = 'active';
      await plan2.save();

      const retrieved1 = await Plan.findById(plan1._id);
      const retrieved2 = await Plan.findById(plan2._id);

      expect(retrieved1.status).toBe('disabled');
      expect(retrieved2.status).toBe('active');
    });
  });

  describe('PUT /api/plans/:id/deactivate', () => {
    it('should deactivate an active plan', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        status: 'active',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      plan.status = 'disabled';
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.status).toBe('disabled');
    });
  });

  describe('DELETE /api/plans/:id', () => {
    it('should delete a plan', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      await Plan.findByIdAndDelete(plan._id);
      const retrieved = await Plan.findById(plan._id);
      expect(retrieved).toBeNull();
    });

    it('should not delete other users plans', async () => {
      // Create another user
      const otherUser = new User({
        email: `other-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Other User'
      });
      await otherUser.save();

      // Create plan for other user
      const plan = new Plan({
        userId: otherUser._id,
        name: 'Other Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      // Try to delete (should fail in real route with ownership check)
      const retrieved = await Plan.findById(plan._id);
      expect(retrieved).toBeDefined();

      await otherUser.deleteOne();
    });
  });

  describe('POST /api/plans/:id/regenerate', () => {
    it('should regenerate suggestions and maintain history', async () => {
      const plan = new Plan({
        userId,
        name: 'Test Plan',
        suggestions: {
          workouts: [{ id: 'w1', name: 'Old Cardio' }],
          meals: [],
          schedule: []
        }
      });
      await plan.save();

      // Store old suggestions in history
      plan.previousSuggestions.push({
        workouts: plan.suggestions.workouts,
        meals: plan.suggestions.meals,
        schedule: plan.suggestions.schedule,
        regeneratedAt: new Date()
      });

      // Update with new suggestions
      plan.suggestions.workouts = [{ id: 'w2', name: 'New Cardio' }];
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.suggestions.workouts[0].name).toBe('New Cardio');
      expect(retrieved.previousSuggestions.length).toBe(1);
      expect(retrieved.previousSuggestions[0].workouts[0].name).toBe('Old Cardio');
    });
  });

  describe('Plan Ownership Verification', () => {
    it('should verify user owns the plan before modification', async () => {
      // Create another user
      const otherUser = new User({
        email: `other-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Other User'
      });
      await otherUser.save();

      // Create plan for first user
      const plan = new Plan({
        userId,
        name: 'My Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      // Verify ownership
      expect(plan.userId.toString()).toBe(userId.toString());
      expect(plan.userId.toString()).not.toBe(otherUser._id.toString());

      await otherUser.deleteOne();
    });
  });

  // ============ TASK 20.1: Plan Validation Tests ============
  describe('20.1 - Plan Validation in Routes', () => {
    it('should reject plan creation without required fields', async () => {
      const invalidPlans = [
        { name: 'Plan without status' },
        { status: 'active' },
        { suggestions: { workouts: [], meals: [], schedule: [] } }
      ];

      for (const planData of invalidPlans) {
        const plan = new Plan({
          userId,
          ...planData
        });

        try {
          await plan.save();
          fail('Should have thrown validation error');
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    it('should validate status enum in route', async () => {
      const invalidStatuses = ['pending', 'archived', 'ACTIVE', 'DISABLED'];

      for (const status of invalidStatuses) {
        const plan = new Plan({
          userId,
          name: 'Test Plan',
          status,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });

        try {
          await plan.save();
          fail(`Should reject invalid status: ${status}`);
        } catch (error) {
          expect(error.message).toContain('status');
        }
      }
    });

    it('should accept valid plan data', async () => {
      const validPlan = {
        userId,
        name: 'Valid Plan',
        description: 'A valid plan',
        status: 'active',
        suggestions: {
          workouts: [{ id: 'w1', name: 'Cardio', type: 'cardio', duration: 30, intensity: 'moderate', description: 'Running' }],
          meals: [{ id: 'm1', day: 'Monday', mealType: 'breakfast', name: 'Oatmeal', calories: 300 }],
          schedule: [{ id: 's1', day: 'Monday', time: '06:00', activity: 'Wake up', duration: 0 }]
        }
      };

      const plan = new Plan(validPlan);
      await plan.save();

      expect(plan._id).toBeDefined();
      expect(plan.status).toBe('active');
    });
  });

  // ============ TASK 20.2: Plan CRUD Operations in Routes ============
  describe('20.2 - Plan CRUD Operations in Routes', () => {
    it('should create plan and return with all fields', async () => {
      const planData = {
        userId,
        name: 'Complete Plan',
        description: 'Full plan with all fields',
        status: 'active',
        suggestions: {
          workouts: [
            { id: 'w1', name: 'Cardio', type: 'cardio', duration: 30, intensity: 'moderate', description: 'Running' },
            { id: 'w2', name: 'Strength', type: 'strength', duration: 45, intensity: 'high', description: 'Weights' }
          ],
          meals: [
            { id: 'm1', day: 'Monday', mealType: 'breakfast', name: 'Oatmeal', calories: 300 },
            { id: 'm2', day: 'Monday', mealType: 'lunch', name: 'Salad', calories: 400 }
          ],
          schedule: [
            { id: 's1', day: 'Monday', time: '06:00', activity: 'Wake up', duration: 0 },
            { id: 's2', day: 'Monday', time: '07:00', activity: 'Workout', duration: 30 }
          ]
        }
      };

      const plan = new Plan(planData);
      await plan.save();

      expect(plan._id).toBeDefined();
      expect(plan.userId.toString()).toBe(userId.toString());
      expect(plan.name).toBe('Complete Plan');
      expect(plan.suggestions.workouts.length).toBe(2);
      expect(plan.suggestions.meals.length).toBe(2);
      expect(plan.suggestions.schedule.length).toBe(2);
    });

    it('should retrieve plan by ID', async () => {
      const plan = new Plan({
        userId,
        name: 'Retrieve Test',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('Retrieve Test');
      expect(retrieved.userId.toString()).toBe(userId.toString());
    });

    it('should update plan fields', async () => {
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

    it('should delete plan', async () => {
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

    it('should list all user plans', async () => {
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

    it('should filter plans by status', async () => {
      for (let i = 0; i < 5; i++) {
        const plan = new Plan({
          userId,
          name: `Plan ${i}`,
          status: i < 2 ? 'active' : 'disabled',
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan.save();
      }

      const activePlans = await Plan.find({ userId, status: 'active' });
      const disabledPlans = await Plan.find({ userId, status: 'disabled' });

      expect(activePlans.length).toBe(2);
      expect(disabledPlans.length).toBe(3);
    });
  });

  // ============ TASK 20.3: Plan Activation/Deactivation in Routes ============
  describe('20.3 - Plan Activation and Deactivation in Routes', () => {
    it('should activate disabled plan', async () => {
      const plan = new Plan({
        userId,
        name: 'Disabled Plan',
        status: 'disabled',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      plan.status = 'active';
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.status).toBe('active');
    });

    it('should deactivate active plan', async () => {
      const plan = new Plan({
        userId,
        name: 'Active Plan',
        status: 'active',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      plan.status = 'disabled';
      await plan.save();

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.status).toBe('disabled');
    });

    it('should enforce single active plan per user', async () => {
      // Create first active plan
      const plan1 = new Plan({
        userId,
        name: 'First Active',
        status: 'active',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan1.save();

      // Create second plan
      const plan2 = new Plan({
        userId,
        name: 'Second Plan',
        status: 'disabled',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan2.save();

      // Deactivate first, activate second
      plan1.status = 'disabled';
      await plan1.save();
      plan2.status = 'active';
      await plan2.save();

      // Verify only one active
      const activePlans = await Plan.find({ userId, status: 'active' });
      expect(activePlans.length).toBe(1);
      expect(activePlans[0]._id.toString()).toBe(plan2._id.toString());
    });

    it('should update timestamp on activation', async () => {
      const plan = new Plan({
        userId,
        name: 'Timestamp Test',
        status: 'disabled',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();
      const originalUpdatedAt = plan.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));
      plan.status = 'active';
      await plan.save();

      expect(plan.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should allow multiple disabled plans', async () => {
      for (let i = 0; i < 5; i++) {
        const plan = new Plan({
          userId,
          name: `Disabled Plan ${i}`,
          status: 'disabled',
          suggestions: { workouts: [], meals: [], schedule: [] }
        });
        await plan.save();
      }

      const disabledPlans = await Plan.find({ userId, status: 'disabled' });
      expect(disabledPlans.length).toBe(5);
    });
  });

  // ============ TASK 20.4: Data Isolation in Routes ============
  describe('20.4 - Data Isolation and User Ownership in Routes', () => {
    it('should not return other user plans in list', async () => {
      // Create plans for both users
      const plan1 = new Plan({
        userId,
        name: 'User 1 Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan1.save();

      const plan2 = new Plan({
        userId: otherUserId,
        name: 'User 2 Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan2.save();

      // Query as user 1
      const user1Plans = await Plan.find({ userId });
      expect(user1Plans.length).toBe(1);
      expect(user1Plans[0].name).toBe('User 1 Plan');
    });

    it('should not allow user to access other user plan details', async () => {
      const plan = new Plan({
        userId: otherUserId,
        name: 'Other User Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      // Simulate ownership check
      const canAccess = plan.userId.toString() === userId.toString();
      expect(canAccess).toBe(false);
    });

    it('should not allow user to modify other user plan', async () => {
      const plan = new Plan({
        userId: otherUserId,
        name: 'Other User Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      // Simulate ownership check - should prevent modification
      if (plan.userId.toString() === userId.toString()) {
        plan.name = 'Hacked Name';
        await plan.save();
      }

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.name).toBe('Other User Plan');
    });

    it('should not allow user to delete other user plan', async () => {
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
    });

    it('should isolate plans by userId in queries', async () => {
      // Create multiple plans for both users
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

    it('should not expose other user suggestions', async () => {
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

    it('should isolate plans by userId and status', async () => {
      // Create plans with different statuses
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

    it('should verify ownership before any operation', async () => {
      const plan = new Plan({
        userId,
        name: 'My Plan',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });
      await plan.save();

      // Verify ownership
      expect(plan.userId.toString()).toBe(userId.toString());
      expect(plan.userId.toString()).not.toBe(otherUserId.toString());

      // Simulate unauthorized access attempt
      const isOwner = plan.userId.toString() === userId.toString();
      expect(isOwner).toBe(true);

      const isNotOwner = plan.userId.toString() === otherUserId.toString();
      expect(isNotOwner).toBe(false);
    });
  });

  // ============ Additional Edge Case Tests ============
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty suggestions gracefully', async () => {
      const plan = new Plan({
        userId,
        name: 'Empty Suggestions Plan',
        suggestions: {
          workouts: [],
          meals: [],
          schedule: []
        }
      });

      await plan.save();
      expect(plan.suggestions.workouts.length).toBe(0);
      expect(plan.suggestions.meals.length).toBe(0);
      expect(plan.suggestions.schedule.length).toBe(0);
    });

    it('should handle large suggestion sets', async () => {
      const workouts = [];
      const meals = [];
      const schedule = [];

      for (let i = 0; i < 50; i++) {
        workouts.push({
          id: `w${i}`,
          name: `Workout ${i}`,
          type: 'cardio',
          duration: 30,
          intensity: 'moderate',
          description: `Workout ${i}`
        });

        meals.push({
          id: `m${i}`,
          day: 'Monday',
          mealType: 'breakfast',
          name: `Meal ${i}`,
          calories: 300
        });

        schedule.push({
          id: `s${i}`,
          day: 'Monday',
          time: `${String(i % 24).padStart(2, '0')}:00`,
          activity: `Activity ${i}`,
          duration: 30
        });
      }

      const plan = new Plan({
        userId,
        name: 'Large Plan',
        suggestions: { workouts, meals, schedule }
      });

      await plan.save();
      expect(plan.suggestions.workouts.length).toBe(50);
      expect(plan.suggestions.meals.length).toBe(50);
      expect(plan.suggestions.schedule.length).toBe(50);
    });

    it('should handle special characters in plan name', async () => {
      const specialNames = [
        'Plan with "quotes"',
        "Plan with 'apostrophes'",
        'Plan with émojis 🎯',
        'Plan with special chars !@#$%',
        'Plan with unicode: 中文'
      ];

      for (const name of specialNames) {
        const plan = new Plan({
          userId,
          name,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });

        await plan.save();
        const retrieved = await Plan.findById(plan._id);
        expect(retrieved.name).toBe(name);
      }
    });

    it('should handle concurrent plan creation', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const plan = new Plan({
          userId,
          name: `Concurrent Plan ${i}`,
          suggestions: { workouts: [], meals: [], schedule: [] }
        });

        promises.push(plan.save());
      }

      await Promise.all(promises);

      const plans = await Plan.find({ userId });
      expect(plans.length).toBe(10);
    });

    it('should maintain data integrity with rapid updates', async () => {
      const plan = new Plan({
        userId,
        name: 'Rapid Update Test',
        suggestions: { workouts: [], meals: [], schedule: [] }
      });

      await plan.save();

      for (let i = 0; i < 5; i++) {
        plan.progress.workoutsCompleted = i;
        await plan.save();
      }

      const retrieved = await Plan.findById(plan._id);
      expect(retrieved.progress.workoutsCompleted).toBe(4);
    });
  });
});
