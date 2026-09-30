const { createOriginChecker, buildAllowedOrigins } = require('../../utils/cors');

describe('CORS policy', () => {
  const allowed = createOriginChecker(buildAllowedOrigins('https://elevatewell.com, https://www.elevatewell.com/'));

  test.each([
    [undefined, true],
    ['https://elevate-wellupdated.vercel.app', true],
    ['https://elevate-wellupdated-git-main-zikra35s-projects.vercel.app', true],
    ['https://elevate-well-pi.vercel.app', true],
    ['http://localhost:5173', true],
    ['https://elevatewell.com', true],
    ['https://www.elevatewell.com', true],
    ['http://evil.vercel.app', false],
    ['https://vercel.app.evil.com', false],
    ['https://evil.com', false],
    ['not a url', false],
  ])('%s -> %s', (origin, expected) => {
    expect(allowed(origin)).toBe(expected);
  });
});
