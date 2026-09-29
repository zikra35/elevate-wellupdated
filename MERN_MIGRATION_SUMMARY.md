# MERN Stack Migration - Changes Summary

## Overview
The Radiant Health Companion app has been migrated from Supabase (backend) to MERN (MongoDB, Express, React, Node.js) stack.

## Key Changes Made

### 1. Frontend Authentication Layer (`src/hooks/useAuth.tsx`)

**Changed From:** Supabase Auth
**Changed To:** JWT-based authentication with Node.js/Express

Features:
- JWT tokens stored in localStorage
- Login/signup methods integrated into auth hook
- Session validation via `/auth/me` endpoint
- Token automatically sent in `Authorization` header for all API calls

```typescript
// New methods available:
const { user, session, loading, login, signup, logout, refreshSession } = useAuth();
```

### 2. Backend API Layer (`src/lib/backend-api.ts`)

**Changed From:** Supabase SDK
**Changed To:** Fetch API calls to Node.js/Express endpoints

All functions now use:
```typescript
const apiCall = async (endpoint, options) => {
  // Automatically includes JWT token in headers
  // Handles errors and JSON parsing
}
```

Endpoints mapped:
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/workouts` - Save workout
- `GET /api/workouts` - Get workouts
- `POST /api/meals` - Save meal
- `GET /api/meals` - Get meals
- `POST /api/meals/generate` - Generate AI meal plan
- `POST /api/meals/swap` - Swap meal
- Similar endpoints for sleep, mental-health, cycle, goals, reminders

### 3. Meals Page (`src/routes/_app.meals.tsx`)

**Changes:**
- Removed Supabase imports
- Replaced Supabase function calls with API calls
- Updated meal plan generation to use `/api/meals/generate`
- Removed database persistence (handled server-side now)

### 4. Authentication Pages

**Login Page (`src/routes/auth.login.tsx`):**
- Removed `supabase.auth.signInWithPassword()`
- Now uses `login()` method from useAuth hook

**Signup Page (`src/routes/auth.signup.tsx`):**
- Removed `supabase.auth.signUp()`
- Now uses `signup()` method from useAuth hook

### 5. App Shell (`src/components/AppShell.tsx`)

**Changes:**
- Removed Supabase import
- Updated logout to use `logout()` from useAuth
- Fixed function naming conflict (handleLogout)

### 6. Color Palette Updates

Enhanced dark mode colors in `src/styles.css`:
- Darker, more vibrant primary colors: `oklch(0.65 0.30 185)` 
- Increased color saturation and contrast
- Updated accent colors for better visibility
- Richer sidebar appearance with teal tones

## Environment Variables

Add to `.env.local`:

```env
# MERN API URL (default: http://localhost:5000/api)
VITE_API_URL=http://localhost:5000/api
```

## Backend Setup

See `MERN_BACKEND_SETUP.md` for complete backend implementation guide including:
- Express server setup
- MongoDB models and schemas
- JWT authentication middleware
- API route examples
- Installation and running instructions

## Database Migration

MongoDB collections needed:
- `users` - User accounts with password hashing
- `workouts` - Workout logs
- `meals` - Meal logs  
- `meal_plans` - Generated meal plans
- `sleep_logs` - Sleep tracking
- `mental_health_logs` - Mental wellness tracking
- `cycle_logs` - Menstrual cycle tracking
- `wellness_goals` - User goals
- `reminders` - User reminders

## Running the Full Stack

### Terminal 1 - Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Terminal 2 - Frontend
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

## Authentication Flow

1. **Signup**: POST `/api/auth/signup` → Returns JWT token
2. **Login**: POST `/api/auth/login` → Returns JWT token
3. **Session Check**: GET `/api/auth/me` (with Bearer token)
4. **Token Storage**: localStorage under key `authToken`
5. **Auto-Refresh**: On app load, checks token validity

## API Call Pattern

All API calls automatically include:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Error handling returns:
```json
{ "message": "Error description" }
```

## Breaking Changes

- Supabase SDK no longer imported
- Supabase URL env variables no longer needed
- Email verification not automatic (handled in backend)
- Profile data now stored in MongoDB user document

## Notes for Development

1. Ensure backend is running before frontend
2. Update `VITE_API_URL` to match backend URL
3. JWT expires after 7 days (configurable in backend `.env`)
4. All protected routes require valid JWT in localStorage
5. Consider adding request interceptors for token refresh

## Future Enhancements

- [ ] Implement token refresh mechanism
- [ ] Add request/response caching
- [ ] Implement offline mode
- [ ] Add request retry logic
- [ ] Consider moving to rtk-query for API management
- [ ] Add request timeout handling
