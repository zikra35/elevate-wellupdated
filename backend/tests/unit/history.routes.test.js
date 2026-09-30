jest.mock('axios');
const request = require('supertest');
const { USER_ID, OTHER_USER_ID, tokenFor, mockQuery, appWith } = require('./helpers');
const Workout = require('../../models/Workout');
const WorkoutLog = require('../../models/WorkoutLog');
const MealLog = require('../../models/MealLog');
const Plan = require('../../models/Plan');

const workoutsApp = appWith('/api/workouts', require('../../routes/workouts'));
const dietApp = appWith('/api/diet', require('../../routes/diet'));
const auth = () => ({ Authorization: `Bearer ${tokenFor()}` });

afterEach(() => jest.restoreAllMocks());

describe('Workouts: delete is owner-only', () => {
  test('DELETE /api/workouts/:id deletes only the caller\'s workout', async () => {
    const spy = jest.spyOn(Workout, 'findOneAndDelete').mockResolvedValue({ _id: 'w1' });
    const res = await request(workoutsApp).delete('/api/workouts/w1').set(auth());
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith({ _id: 'w1', userId: USER_ID });
  });

  test('returns 404 when the workout belongs to someone else', async () => {
    jest.spyOn(Workout, 'findOneAndDelete').mockResolvedValue(null);
    const res = await request(workoutsApp).delete('/api/workouts/w1').set(auth());
    expect(res.status).toBe(404);
  });

  test('requires a token', async () => {
    const res = await request(workoutsApp).delete('/api/workouts/w1');
    expect(res.status).toBe(401);
  });
});

describe('Workout history', () => {
  test('merges quick logs and sessions, newest first, grouped by local day', async () => {
    const logFind = jest.spyOn(WorkoutLog, 'find').mockReturnValue(mockQuery([
      { _id: 'l1', name: 'Yoga', duration: 30, date: new Date('2026-09-30T00:00:00Z'), loggedAt: new Date('2026-09-30T04:00:00Z') },
    ]));
    const sessionFind = jest.spyOn(Workout, 'find').mockReturnValue(mockQuery([
      { _id: 's1', name: 'GPS Run', duration_minutes: 25, calories_burned: 210, isGpsTracked: true, distanceKm: 3.5, date: new Date('2026-09-30T20:30:00Z') },
    ]));

    const res = await request(workoutsApp)
      .get('/api/workouts/workout-history?from=2026-09-24&to=2026-10-01&tzOffset=-300')
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.workouts.map((w) => [w.source, w.name, w.date])).toEqual([
      ['session', 'GPS Run', '2026-10-01'], // 20:30 UTC is next day in Pakistan
      ['log', 'Yoga', '2026-09-30'],
    ]);
    expect(logFind.mock.calls[0][0].userId).toBe(USER_ID);
    expect(logFind.mock.calls[0][0].date.$gte.toISOString()).toBe('2026-09-24T00:00:00.000Z');
    expect(sessionFind.mock.calls[0][0].date.$gte.toISOString()).toBe('2026-09-23T19:00:00.000Z');
  });

  test('no "from" means all time', async () => {
    const logFind = jest.spyOn(WorkoutLog, 'find').mockReturnValue(mockQuery([]));
    jest.spyOn(Workout, 'find').mockReturnValue(mockQuery([]));
    const res = await request(workoutsApp).get('/api/workouts/workout-history').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.workouts).toEqual([]);
    expect(logFind.mock.calls[0][0].date.$gte).toBeUndefined();
  });

  test.each([
    ['log', WorkoutLog],
    ['session', Workout],
  ])('DELETE /workout-history/%s/:id deletes from the right collection, owner-only', async (source, Model) => {
    const spy = jest.spyOn(Model, 'findOneAndDelete').mockResolvedValue({ _id: 'x' });
    const res = await request(workoutsApp).delete(`/api/workouts/workout-history/${source}/x`).set(auth());
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith({ _id: 'x', userId: USER_ID });
  });

  test('rejects an unknown source', async () => {
    const res = await request(workoutsApp).delete('/api/workouts/workout-history/other/x').set(auth());
    expect(res.status).toBe(400);
  });

  test('log-workout stores the user\'s local day', async () => {
    jest.spyOn(Plan, 'findOne').mockResolvedValue(null);
    const save = jest.spyOn(WorkoutLog.prototype, 'save').mockResolvedValue();
    const res = await request(workoutsApp)
      .post('/api/workouts/log-workout')
      .set(auth())
      .send({ name: 'Yoga', duration: 30, date: '2026-10-01' });
    expect(res.status).toBe(201);
    expect(save).toHaveBeenCalled();
    expect(res.body.workout.date).toBe('2026-10-01T00:00:00.000Z');
  });
});

describe('Meal history', () => {
  test('returns meals in the requested range for this user only', async () => {
    const find = jest.spyOn(MealLog, 'find').mockReturnValue(mockQuery([
      { _id: 'm1', name: 'Oats', time: '08:00', type: 'morning', date: new Date('2026-09-30T00:00:00Z'), loggedAt: new Date() },
    ]));
    const res = await request(dietApp).get('/api/diet/meal-history?from=2026-09-30&to=2026-09-30').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.meals).toEqual([expect.objectContaining({ id: 'm1', name: 'Oats', date: '2026-09-30' })]);
    expect(find.mock.calls[0][0].userId).toBe(USER_ID);
    expect(find.mock.calls[0][0].date.$gte.toISOString()).toBe('2026-09-30T00:00:00.000Z');
    expect(find.mock.calls[0][0].date.$lt.toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });

  test('DELETE /meal-history/:id is owner-only', async () => {
    const spy = jest.spyOn(MealLog, 'findOneAndDelete').mockResolvedValue(null);
    const res = await request(dietApp).delete('/api/diet/meal-history/m1').set({ Authorization: `Bearer ${tokenFor(OTHER_USER_ID)}` });
    expect(res.status).toBe(404);
    expect(spy).toHaveBeenCalledWith({ _id: 'm1', userId: OTHER_USER_ID });
  });

  test('log-meal validates required fields', async () => {
    const res = await request(dietApp).post('/api/diet/log-meal').set(auth()).send({ name: 'Oats' });
    expect(res.status).toBe(400);
  });
});
