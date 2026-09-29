# Elevate Well Backend API Documentation

## Overview
The Elevate Well backend is built on **Supabase** (PostgreSQL + Auth) with **AI-powered Deno functions** for personalized recommendations.

## Database Schema

### 1. **Profiles** (`public.profiles`)
User profile and wellness preferences.

**Fields:**
- `id` (UUID) - User ID from Auth
- `email` (TEXT)
- `name` (TEXT)
- `date_of_birth` (DATE)
- `gender` (TEXT) - 'female', 'male', 'other'
- `height_cm`, `weight_kg`, `bmi` (NUMERIC)
- `goal` (TEXT) - 'weight-loss', 'muscle-gain', 'wellness', etc.
- `activity_level` (TEXT) - 'sedentary', 'light', 'moderate', 'active', 'very-active'
- `tdee` (NUMERIC) - Total Daily Energy Expenditure
- `dietary_preferences` (TEXT[]) - Array of dietary restrictions
- `cycle_tracking_enabled` (BOOLEAN)
- `last_period_start` (DATE)
- `cycle_length_days` (INTEGER) - Default 28
- `period_length_days` (INTEGER) - Default 5

**RLS Policies:** Users can only view/edit their own profile.

---

### 2. **Workouts** (`public.workouts`)
Exercise and workout logs.

**Fields:**
- `id` (UUID)
- `user_id` (UUID)
- `type` (TEXT) - 'yoga', 'hiit', 'pilates', 'strength', 'cardio', etc.
- `name` (TEXT) - Exercise name
- `duration_minutes` (INTEGER)
- `intensity` (TEXT) - 'low', 'moderate', 'high'
- `calories_burned` (INTEGER)
- `notes` (TEXT)
- `date` (DATE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Indexes:** `(user_id, date DESC)` for fast retrieval

---

### 3. **Sleep Logs** (`public.sleep_logs`)
Daily sleep tracking.

**Fields:**
- `id` (UUID)
- `user_id` (UUID)
- `date` (DATE) - Unique per user per date
- `bedtime`, `wake_time` (TIME)
- `duration_minutes` (INTEGER)
- `quality` (TEXT) - 'poor', 'fair', 'good', 'excellent'
- `notes` (TEXT)

---

### 4. **Meals** (`public.meals`)
Food intake logging with nutritional data.

**Fields:**
- `id` (UUID)
- `user_id` (UUID)
- `date` (DATE)
- `meal_type` (TEXT) - 'breakfast', 'lunch', 'dinner', 'snack'
- `name` (TEXT)
- `calories`, `protein_g`, `carbs_g`, `fat_g` (NUMERIC)
- `ingredients` (TEXT[])
- `notes` (TEXT)

---

### 5. **Mental Health Logs** (`public.mental_health_logs`)
Daily mood and mental wellness tracking.

**Fields:**
- `id` (UUID)
- `user_id` (UUID)
- `date` (DATE)
- `mood` (INTEGER) - 1-10 scale
- `stress_level`, `anxiety_level`, `energy_level` (INTEGER) - 1-10 scale
- `notes` (TEXT)
- `tags` (TEXT[]) - e.g., ['therapy', 'meditation', 'exercise']

---

### 6. **Cycle Logs** (`public.cycle_logs`)
Menstrual cycle tracking with symptoms.

**Fields:**
- `id` (UUID)
- `user_id` (UUID)
- `start_date` (DATE) - Unique per user
- `end_date` (DATE)
- `flow` (TEXT) - 'light', 'medium', 'heavy'
- `symptoms` (TEXT[]) - e.g., ['cramps', 'headache', 'bloating']
- `mood` (TEXT)
- `notes` (TEXT)

---

### 7. **Wellness Goals** (`public.wellness_goals`)
User-defined health and wellness goals.

**Fields:**
- `id` (UUID)
- `user_id` (UUID)
- `category` (TEXT) - 'fitness', 'nutrition', 'sleep', 'mental-health'
- `title` (TEXT)
- `description` (TEXT)
- `target_value` (NUMERIC)
- `unit` (TEXT) - 'kg', 'minutes', 'days', etc.
- `start_date`, `end_date` (DATE)
- `status` (TEXT) - 'active', 'completed', 'abandoned'
- `progress` (NUMERIC) - 0-100

---

### 8. **Reminders** (`public.reminders`)
Custom reminders and notifications.

**Fields:**
- `id` (UUID)
- `user_id` (UUID)
- `title`, `description` (TEXT)
- `type` (TEXT) - 'medication', 'workout', 'sleep', 'meal', 'cycle', 'mental'
- `time` (TIME)
- `day_of_week` (INTEGER) - 0=Sunday, 6=Saturday
- `enabled` (BOOLEAN)

---

## API Functions

### Backend API Module (`src/lib/backend-api.ts`)

#### Workout Functions
```typescript
saveWorkout(userId, {
  type: string,
  name: string,
  duration_minutes?: number,
  intensity?: string,
  calories_burned?: number,
  notes?: string,
  date: string
}): Promise<Workout>

getWorkouts(userId, days?: number): Promise<Workout[]>

deleteWorkout(workoutId): Promise<void>
```

#### Sleep Functions
```typescript
saveSleepLog(userId, {
  date: string,
  bedtime?: string,
  wake_time?: string,
  duration_minutes?: number,
  quality?: string,
  notes?: string
}): Promise<SleepLog>

getSleepLogs(userId, days?: number): Promise<SleepLog[]>
```

#### Mental Health Functions
```typescript
saveMentalHealthLog(userId, {
  date: string,
  mood?: number,
  stress_level?: number,
  anxiety_level?: number,
  energy_level?: number,
  notes?: string,
  tags?: string[]
}): Promise<MentalHealthLog>

getMentalHealthLogs(userId, days?: number): Promise<MentalHealthLog[]>
```

#### Meal Functions
```typescript
saveMeal(userId, {
  date: string,
  meal_type: string,
  name: string,
  calories?: number,
  protein_g?: number,
  carbs_g?: number,
  fat_g?: number,
  ingredients?: string[],
  notes?: string
}): Promise<Meal>

getMeals(userId, date?: string): Promise<Meal[]>

deleteMeal(mealId): Promise<void>
```

#### Cycle Functions
```typescript
saveCycleLog(userId, {
  start_date: string,
  end_date?: string,
  flow?: string,
  symptoms?: string[],
  mood?: string,
  notes?: string
}): Promise<CycleLog>

getCycleLogs(userId): Promise<CycleLog[]>
```

#### Goal Functions
```typescript
saveGoal(userId, {
  category: string,
  title: string,
  description?: string,
  target_value?: number,
  unit?: string,
  end_date?: string
}): Promise<Goal>

getGoals(userId, status?: string): Promise<Goal[]>

updateGoalProgress(goalId, progress: number): Promise<Goal>
```

#### Reminder Functions
```typescript
saveReminder(userId, {
  title: string,
  description?: string,
  type: string,
  time?: string,
  day_of_week?: number
}): Promise<Reminder>

getReminders(userId): Promise<Reminder[]>

updateReminder(reminderId, updates: object): Promise<Reminder>
```

---

## Supabase Edge Functions

### 1. **Meal Plan Generator** (`/meal-plan`)
**Endpoint:** `POST /functions/v1/meal-plan`

**Request:**
```json
{
  "profile": {
    "tdee": 2000,
    "goal": "wellness",
    "dietary_preferences": ["vegetarian"]
  },
  "swap": null
}
```

**Response:**
```json
{
  "meals": [
    {
      "type": "breakfast",
      "name": "Oatmeal with berries",
      "calories": 350,
      "ingredients": ["oats", "berries", "milk"],
      "steps": ["Cook oats...", "Add berries..."]
    }
  ],
  "totalCalories": 2000
}
```

---

### 2. **Therapist Chat** (`/therapist-chat`)
**Endpoint:** `POST /functions/v1/therapist-chat`

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "I'm feeling anxious today"
    }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream with AI responses.

---

### 3. **Workout Plan Generator** (`/workout-plan`)
**Endpoint:** `POST /functions/v1/workout-plan`

**Request:**
```json
{
  "profile": {
    "age": 28,
    "goal": "wellness",
    "activity_level": "moderate",
    "last_period_start": "2026-05-01"
  },
  "preference": "mixed",
  "mentalState": "calm"
}
```

**Response:**
```json
{
  "title": "Balanced Mixed Workout",
  "duration_minutes": 45,
  "intensity": "moderate",
  "exercises": [
    {
      "name": "Warm-up walk",
      "duration_or_reps": "5 minutes",
      "sets": 1,
      "modifications": ["Can be done sitting"]
    }
  ]
}
```

---

### 4. **Sleep Guidance** (`/sleep-guidance`)
**Endpoint:** `POST /functions/v1/sleep-guidance`

**Request:**
```json
{
  "sleepLogs": [
    { "duration_minutes": 450, "quality": "good" }
  ],
  "profile": { "date_of_birth": "1998-03-15" },
  "currentHour": 21
}
```

**Response:**
```json
{
  "suggested_bedtime": "10:30 PM",
  "suggested_wake_time": "6:30 AM",
  "target_duration_hours": 8,
  "bedtime_routine": ["Dim lights at 9:30 PM", "Put away phone by 10 PM"],
  "night_tips": "Keep room cool and dark",
  "morning_routine": ["Get sunlight exposure", "Exercise"]
}
```

---

## Row-Level Security (RLS) Policies

All tables have the following RLS policies:
- **SELECT:** Users can only view their own data
- **INSERT:** Users can only insert data for themselves
- **UPDATE:** Users can only update their own data
- **DELETE:** Users can only delete their own data

---

## Usage Examples

### Save a Workout
```typescript
import { useAuth } from '@/hooks/useAuth';
import { saveWorkout } from '@/lib/backend-api';

function WorkoutLog() {
  const { user } = useAuth();

  const handleSaveWorkout = async () => {
    const workout = await saveWorkout(user?.id || '', {
      type: 'yoga',
      name: 'Morning Yoga Session',
      duration_minutes: 30,
      intensity: 'moderate',
      calories_burned: 120,
      notes: 'Felt great!',
      date: new Date().toISOString().split('T')[0],
    });
    console.log('Saved:', workout);
  };

  return <button onClick={handleSaveWorkout}>Log Workout</button>;
}
```

### Get Sleep Logs
```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSleepLogs } from '@/lib/backend-api';

function SleepHistory() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (user?.id) {
      getSleepLogs(user.id, 30).then(setLogs);
    }
  }, [user?.id]);

  return <div>{logs.length} nights tracked</div>;
}
```

---

## Environment Variables

Required in Supabase:
- `LOVABLE_API_KEY` - For AI functions

Required in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Error Handling

All functions throw descriptive errors:
```typescript
try {
  await saveWorkout(userId, workout);
} catch (error) {
  console.error(error.message); // Database error details
  toast.error('Failed to save workout');
}
```

---

## Best Practices

1. **Always pass user ID** from authenticated context
2. **Use useAuth hook** to access current user
3. **Handle errors gracefully** with user-friendly messages
4. **Debounce frequent saves** to avoid excessive database writes
5. **Cache data client-side** when possible to reduce queries
6. **Use date strings** in YYYY-MM-DD format for consistency

---

## Future Enhancements

- [ ] Real-time data synchronization with WebSockets
- [ ] Advanced analytics dashboard
- [ ] Social features (friend connections, challenges)
- [ ] Integration with wearables (Fitbit, Apple Watch)
- [ ] PDF report generation
- [ ] Advanced AI insights and predictions
