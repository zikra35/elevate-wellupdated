// CORS policy: fixed origins + any https://*.vercel.app deployment + extra origins
// from CORS_ORIGINS (comma-separated, e.g. "https://elevatewell.com,https://www.elevatewell.com")
const DEFAULT_ORIGINS = [
  'https://tanstack-start-app.zeynabiqbal225.workers.dev',
  'https://elevate-well-pi.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];

function buildAllowedOrigins(extra = process.env.CORS_ORIGINS || '') {
  return new Set([
    ...DEFAULT_ORIGINS,
    ...extra
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean),
  ]);
}

function createOriginChecker(allowedOrigins = buildAllowedOrigins()) {
  return function isAllowedOrigin(origin) {
    if (!origin) return true; // same-origin, curl, health checks
    if (allowedOrigins.has(origin)) return true;
    try {
      const { protocol, hostname } = new URL(origin);
      return protocol === 'https:' && hostname.endsWith('.vercel.app');
    } catch {
      return false;
    }
  };
}

module.exports = { DEFAULT_ORIGINS, buildAllowedOrigins, createOriginChecker };
