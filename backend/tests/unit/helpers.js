// Shared helpers for tests that run without a database.
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const USER_ID = '64b000000000000000000001';
const OTHER_USER_ID = '64b000000000000000000002';

function tokenFor(userId = USER_ID) {
  return jwt.sign({ userId }, process.env.JWT_SECRET);
}

// A chainable stand-in for a Mongoose query: supports .sort()/.limit() and await.
function mockQuery(result) {
  const q = {
    sort: jest.fn(() => q),
    limit: jest.fn(() => q),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

function appWith(path, router) {
  const app = express();
  app.use(express.json());
  app.use(path, router);
  return app;
}

module.exports = { USER_ID, OTHER_USER_ID, tokenFor, mockQuery, appWith };
