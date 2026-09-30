jest.mock('axios');
const axios = require('axios');
axios.get.mockRejectedValue(new Error('no ML service in tests'));
const request = require('supertest');
const { USER_ID, tokenFor, mockQuery, appWith } = require('./helpers');
const MealLog = require('../../models/MealLog');
const WorkoutLog = require('../../models/WorkoutLog');
const SleepLog = require('../../models/SleepLog');
const JournalEntry = require('../../models/JournalEntry');

const searchApp = appWith('/api/search', require('../../routes/search'));
const aiApp = appWith('/api/ai', require('../../routes/ai'));
const auth = () => ({ Authorization: `Bearer ${tokenFor()}` });

afterEach(() => jest.restoreAllMocks());

describe('Search (Path Finder) routes', () => {
  test.each([
    ['get', '/api/search/current-state'],
    ['post', '/api/search/find-path'],
    ['post', '/api/search/compare-algorithms'],
    ['get', '/api/search/paths'],
  ])('%s %s requires a token', async (method, path) => {
    const res = await request(searchApp)[method](path).send({});
    expect(res.status).toBe(401);
  });

  test('current-state reads today\'s logs using the right date fields', async () => {
    const meals = jest.spyOn(MealLog, 'find').mockReturnValue(mockQuery([{}, {}]));
    const workouts = jest.spyOn(WorkoutLog, 'find').mockReturnValue(mockQuery([{}]));
    const sleep = jest.spyOn(SleepLog, 'find').mockReturnValue(mockQuery([{ duration_hours: 8 }]));
    const journals = jest.spyOn(JournalEntry, 'find').mockReturnValue(mockQuery([]));

    const res = await request(searchApp).get('/api/search/current-state?tzOffset=-300').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.logsToday).toEqual({ meals: 2, workouts: 1, sleepHours: 8, journals: 0 });
    expect(res.body.currentState).toMatchObject({ nutrition: 50, physical: 50, sleep: 100, mental: 0 });
    expect(Object.keys(meals.mock.calls[0][0])).toEqual(['userId', 'loggedAt']);
    expect(Object.keys(workouts.mock.calls[0][0])).toEqual(['userId', 'loggedAt']);
    expect(Object.keys(sleep.mock.calls[0][0])).toEqual(['userId', 'date']);
    expect(Object.keys(journals.mock.calls[0][0])).toEqual(['userId', 'createdAt']);
    expect(meals.mock.calls[0][0].userId).toBe(USER_ID);
  });

  test('find-path validates the algorithm', async () => {
    const res = await request(searchApp)
      .post('/api/search/find-path')
      .set(auth())
      .send({ algorithm: 'DFS', goalState: { nutrition: 80 } });
    expect(res.status).toBe(400);
  });
});

describe('Sage chat endpoint', () => {
  test('requires a token', async () => {
    const res = await request(aiApp).post('/api/ai/chat').send({ messages: [{ role: 'user', content: 'hi' }] });
    expect(res.status).toBe(401);
  });

  test('rejects an empty message (the old quick-reply bug)', async () => {
    const res = await request(aiApp).post('/api/ai/chat').set(auth()).send({ messages: [{ role: 'user', content: '  ' }] });
    expect(res.status).toBe(400);
  });

  test('replies and keeps the conversationId', async () => {
    const first = await request(aiApp).post('/api/ai/chat').set(auth())
      .send({ messages: [{ role: 'user', content: 'I feel stressed' }] });
    expect(first.status).toBe(200);
    expect(first.body.reply).toBeTruthy();
    expect(first.body.conversationId).toBeTruthy();

    const second = await request(aiApp).post('/api/ai/chat').set(auth()).send({
      conversationId: first.body.conversationId,
      messages: [
        { role: 'user', content: 'I feel stressed' },
        { role: 'assistant', content: first.body.reply },
        { role: 'user', content: 'Overwhelmed' },
      ],
    });
    expect(second.status).toBe(200);
    expect(second.body.conversationId).toBe(first.body.conversationId);
  });

  test('crisis messages return helplines', async () => {
    const res = await request(aiApp).post('/api/ai/chat').set(auth())
      .send({ messages: [{ role: 'user', content: 'I want to end my life' }] });
    expect(res.body.reply).toContain('1122');
    expect(res.body.reply).toContain('0311-7786264');
  });
});
