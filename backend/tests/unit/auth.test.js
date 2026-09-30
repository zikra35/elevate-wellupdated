const jwt = require('jsonwebtoken');
const { USER_ID, tokenFor } = require('./helpers');
const auth = require('../../middleware/auth');

function run(headers) {
  const req = { headers };
  const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
  const next = jest.fn();
  auth(req, res, next);
  return { req, res, next };
}

describe('auth middleware', () => {
  test('rejects requests without a token', () => {
    const { res, next } = run({});
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects an invalid token', () => {
    const { res, next } = run({ authorization: 'Bearer not-a-token' });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a token signed with another secret', () => {
    const bad = jwt.sign({ userId: USER_ID }, 'other-secret');
    const { res } = run({ authorization: `Bearer ${bad}` });
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('exposes userId as req.userId, req.user.id and req.user._id', () => {
    const { req, next } = run({ authorization: `Bearer ${tokenFor()}` });
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(USER_ID);
    expect(req.user.id).toBe(USER_ID);
    expect(req.user._id).toBe(USER_ID);
  });
});
