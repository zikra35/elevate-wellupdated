# Elevate Well: Test Report

Date: 30 September 2026. Code tested: `main` at `44426dc` plus the fixes in this PR.

## Summary

| Area | How | Result |
|---|---|---|
| Backend unit and API tests | Jest + Supertest, database calls mocked | **52 / 52 passed** |
| Frontend pages and user flows | Headless Chrome (Playwright) on the Vercel build, API mocked | **47 / 47 passed** |
| Builds | `npm run build`, `npm run build:vercel` | Both pass, `dist-spa/index.html` created |
| Backend start | `node backend/server.js` | Starts, binds `0.0.0.0`, `/health` responds |
| Live Vercel site | Opened https://elevate-wellupdated.vercel.app and a deep link | Page and deep links load |
| Live Railway API | `GET /health` | Still running the **old** backend (see Open issues) |

Bugs found by testing and fixed in this PR:
1. **Dashboard crashed** ("Cannot read properties of undefined (reading 'nutrition')") whenever the wellness API returned an unexpected response, e.g. an error or offline mode. The page now keeps default values instead of crashing.
2. **AI Recommendations on mobile:** the Refresh button was pushed off-screen, and "Confidence: NaN%" / "Source: undefined" showed when data was missing. The header now wraps, and missing values are hidden.

## How to run the tests

```bash
cd backend
npm install
npm run test:unit      # 52 tests, no MongoDB needed, ~4 seconds
```

The older tests in `backend/tests/*.test.js` need a real MongoDB (`MONGODB_TEST_URI`).

## 1. Backend tests (`backend/tests/unit`)

| # | Test case | Expected | Result |
|---|---|---|---|
| **Authentication** (`auth.test.js`) ||||
| 1 | Request without a token | 401 | Pass |
| 2 | Invalid token | 401 | Pass |
| 3 | Token signed with another secret | 401 | Pass |
| 4 | Valid token | `req.userId`, `req.user.id`, `req.user._id` all set | Pass |
| **CORS** (`cors.test.js`) ||||
| 5–11 | `*.vercel.app` (https), old Vercel URL, localhost, `CORS_ORIGINS` entries, no origin | Allowed | Pass |
| 12–15 | `http://` vercel, look-alike domain, other site, invalid URL | Blocked | Pass |
| **Local dates** (`dates.test.js`) ||||
| 16 | Timezone offset parsing | Accepts real offsets, rejects junk | Pass |
| 17 | Day format check | Only `YYYY-MM-DD` | Pass |
| 18 | 20:30 UTC in Pakistan (UTC+5) | Counted as the next day | Pass |
| 19 | Local midnight in Pakistan | 19:00 UTC previous day | Pass |
| 20–22 | Date ranges (7 days, all time) | Correct inclusive bounds | Pass |
| **Sage chatbot** (`sage.test.js`) ||||
| 23–26 | "kill myself", "don't want to live", "suicide", "self-harming" | Reply includes 1122 and 0311-7786264 | Pass |
| 27 | Normal message ("anxious about exams") | Normal reply, not flagged | Pass |
| 28 | "My name is Ayesha", then "thanks" | Same conversationId, remembers the name | Pass |
| 29 | Another user reuses someone's conversationId | Gets a new conversation, no data leak | Pass |
| 30 | Reply speed without OpenAI | Under 200 ms | Pass |
| **Workout and meal history** (`history.routes.test.js`) ||||
| 31 | Delete own workout | 200, query filters by user | Pass |
| 32 | Delete someone else's workout | 404 | Pass |
| 33 | Delete without token | 401 | Pass |
| 34 | Workout history merges quick logs + GPS/sessions | Newest first, correct local day | Pass |
| 35 | Workout history with no start date | All time | Pass |
| 36–37 | Delete from history (`log` / `session`) | Right collection, owner only | Pass |
| 38 | Delete with unknown source | 400 | Pass |
| 39 | Log workout with local date | Stored on that day | Pass |
| 40 | Meal history date range | Only this user, correct bounds | Pass |
| 41 | Delete someone else's meal | 404 | Pass |
| 42 | Log meal with missing fields | 400 | Pass |
| **Path Finder and Sage API** (`search-ai.routes.test.js`) ||||
| 43–46 | Path Finder routes without token | 401 | Pass |
| 47 | Current state reads today's logs | Uses `loggedAt` / `date` / `createdAt` correctly | Pass |
| 48 | Invalid algorithm | 400 | Pass |
| 49 | Sage without token | 401 | Pass |
| 50 | Sage with empty message (old quick-reply bug) | 400 | Pass |
| 51 | Sage keeps conversationId across messages | Same id | Pass |
| 52 | Sage crisis message via API | Helplines in reply | Pass |

These tests fail on the code before the fixes (e.g. the auth and Path Finder tests), so they would catch the original bugs coming back.

## 2. Frontend tests (browser, Vercel build)

The static Vercel build (`dist-spa`) was served locally and driven in headless Chrome. API responses were mocked.

| # | Test case | Expected | Result |
|---|---|---|---|
| 1–17 | All 17 pages at 1280px: landing, login, signup, dashboard, workouts, workout logs, healthy living, mental health, sleep, cycle, plans, profile, path finder, recommendations, focus, meal history, workout history | Loads, no JavaScript errors, not blank | Pass |
| 18–34 | Same 17 pages at 390px (phone) | Same | Pass |
| 35 | Login with wrong password | Error shown | Pass |
| 36 | Login with right password | Opens dashboard | Pass |
| 37 | Logged-out user opens /meal-history | Sent to login | Pass |
| 38 | Log a meal | "Meal logged" toast | Pass |
| 39 | Meal date | User's local date sent (not UTC) | Pass |
| 40 | Toast "View history" | Opens Meal history | Pass |
| 41 | Save an empty meal form | Toast message, no browser alert() | Pass |
| 42 | Log a workout | "Workout logged" toast | Pass |
| 43 | Dark mode toggle | Switches theme | Pass |
| 44 | Mood tab, high anxiety → "Go to Breathing Exercises" | Switches to Breathe tab | Pass |
| 45 | Breathing circle during 4 s inhale | Grows steadily (0.88 → 1.10 → 1.32) | Pass |
| 46 | Breathing Stop | Resets to "Ready" | Pass |
| 47 | Device set to reduce motion | Transitions turned off | Pass |

Earlier checks on the same build: meal history delete with confirm, Sage quick-reply chips send their text and keep the conversationId, Music tab shows YouTube and Spotify links with no fake "Now playing" bar.

## 3. Not covered / open issues

- **Railway is still serving the old backend** at `elevatewell-production.up.railway.app`: `/health` returns only `{"status":"Server is running"}` (the new code adds `"database"`). The new code appears to be running on a different Railway service. Until that URL serves the new code, login from `elevate-wellupdated.vercel.app` will be blocked by CORS.
- No test ran against a real MongoDB. The sandbox cannot download MongoDB, so database calls were mocked.
- The live site could not be driven in a browser from the test machine (network policy), only fetched.
- Not tested: GPS tracking on a real phone, OpenAI replies (needs `OPENAI_API_KEY`), the optional Python ML service.
