# Backend Quick Reference

## Import the API

```typescript
import { 
  saveWorkout, getWorkouts,
  saveSleepLog, getSleepLogs,
  saveMealHealthLog, getMentalHealthLogs,
  saveMeal, getMeals,
  saveCycleLog, getCycleLogs,
  saveGoal, getGoals, updateGoalProgress,
  saveReminder, getReminders, updateReminder
} from '@/lib/backend-api';
```

## Common Patterns

### Save Data
```typescript
const { user } = useAuth();

const workout = await saveWorkout(user.id, {
  type: 'yoga',
  name: 'Morning Yoga',
  duration_minutes: 30,
  intensity: 'moderate',
  date: '2026-05-07',
  calories_burned: 120
});
```

### Get Data
```typescript
const workouts = await getWorkouts(user.id, 30); // Last 30 days
const meals = await getMeals(user.id, '2026-05-07'); // Specific date
const goals = await getGoals(user.id, 'active'); // Filter by status
```

### Update Data
```typescript
await updateGoalProgress('goal-id-123', 75); // 75% complete
await updateReminder('reminder-id-456', { enabled: false });
```

### Delete Data
```typescript
await deleteWorkout('workout-id-789');
await deleteMeal('meal-id-101');
```

## Database Tables Reference

| Table | Description | Key Fields |
|-------|-------------|-----------|
| `profiles` | User info & preferences | id, email, gender, tdee, cycle_length_days |
| `workouts` | Exercise logs | type, name, intensity, duration, calories_burned, date |
| `sleep_logs` | Sleep tracking | bedtime, wake_time, duration, quality, date |
| `meals` | Food logs | meal_type, name, calories, protein, carbs, fat, date |
| `mental_health_logs` | Mood & wellness | mood, stress_level, anxiety_level, energy_level, date |
| `cycle_logs` | Menstrual cycle | start_date, end_date, flow, symptoms, mood |
| `wellness_goals` | Health targets | category, title, target_value, progress, status |
| `reminders` | Notifications | type, time, day_of_week, enabled |

## API Function Signatures

### Workouts
```typescript
saveWorkout(userId: string, data: WorkoutInput): Promise<Workout>
getWorkouts(userId: string, days?: number): Promise<Workout[]>
deleteWorkout(workoutId: string): Promise<void>
```

### Sleep
```typescript
saveSleepLog(userId: string, data: SleepInput): Promise<SleepLog>
getSleepLogs(userId: string, days?: number): Promise<SleepLog[]>
```

### Mental Health
```typescript
saveMentalHealthLog(userId: string, data: MHInput): Promise<MentalHealthLog>
getMentalHealthLogs(userId: string, days?: number): Promise<MentalHealthLog[]>
```

### Meals
```typescript
saveMeal(userId: string, data: MealInput): Promise<Meal>
getMeals(userId: string, date?: string): Promise<Meal[]>
deleteMeal(mealId: string): Promise<void>
```

### Cycle
```typescript
saveCycleLog(userId: string, data: CycleInput): Promise<CycleLog>
getCycleLogs(userId: string): Promise<CycleLog[]>
```

### Goals
```typescript
saveGoal(userId: string, data: GoalInput): Promise<Goal>
getGoals(userId: string, status?: string): Promise<Goal[]>
updateGoalProgress(goalId: string, progress: number): Promise<Goal>
```

### Reminders
```typescript
saveReminder(userId: string, data: ReminderInput): Promise<Reminder>
getReminders(userId: string): Promise<Reminder[]>
updateReminder(reminderId: string, updates: object): Promise<Reminder>
```

## AI Functions (Edge Functions)

### Meal Plan
```bash
POST /functions/v1/meal-plan
Content-Type: application/json
Authorization: Bearer {token}

{
  "profile": {
    "tdee": 2000,
    "goal": "weight-loss",
    "dietary_preferences": ["vegetarian"]
  },
  "swap": {
    "mealType": "breakfast",
    "currentName": "Pancakes",
    "calories": 500
  }
}
```

### Therapist Chat
```bash
POST /functions/v1/therapist-chat
Content-Type: application/json
Authorization: Bearer {token}

{
  "messages": [
    {
      "role": "user",
      "content": "I'm feeling anxious"
    }
  ]
}

# Response: Server-Sent Events (SSE)
data: {"choices":[{"delta":{"content":"I hear..."}}]}
```

### Workout Plan
```bash
POST /functions/v1/workout-plan
Content-Type: application/json
Authorization: Bearer {token}

{
  "profile": {
    "age": 28,
    "goal": "wellness",
    "activity_level": "moderate"
  },
  "preference": "cardio",
  "mentalState": "calm"
}
```

### Sleep Guidance
```bash
POST /functions/v1/sleep-guidance
Content-Type: application/json
Authorization: Bearer {token}

{
  "sleepLogs": [
    { "duration_minutes": 420, "quality": "good" }
  ],
  "profile": { "date_of_birth": "1998-03-15" },
  "currentHour": 21
}
```

## Error Handling

```typescript
try {
  await saveWorkout(user.id, data);
  toast.success('Workout saved!');
} catch (error) {
  console.error(error.message);
  toast.error('Failed to save workout');
}
```

## Type Definitions

### WorkoutInput
```typescript
type WorkoutInput = {
  type: string;                 // 'yoga', 'hiit', 'pilates', etc.
  name: string;                 // Exercise name
  duration_minutes?: number;
  intensity?: 'low' | 'moderate' | 'high';
  calories_burned?: number;
  notes?: string;
  date: string;                 // YYYY-MM-DD
};
```

### SleepInput
```typescript
type SleepInput = {
  date: string;                 // YYYY-MM-DD
  bedtime?: string;             // HH:mm
  wake_time?: string;           // HH:mm
  duration_minutes?: number;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
};
```

### MealInput
```typescript
type MealInput = {
  date: string;                 // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients?: string[];
  notes?: string;
};
```

### MentalHealthInput
```typescript
type MentalHealthInput = {
  date: string;                 // YYYY-MM-DD
  mood?: number;                // 1-10
  stress_level?: number;        // 1-10
  anxiety_level?: number;       // 1-10
  energy_level?: number;        // 1-10
  notes?: string;
  tags?: string[];              // ['therapy', 'meditation', etc.]
};
```

### CycleInput
```typescript
type CycleInput = {
  start_date: string;           // YYYY-MM-DD
  end_date?: string;            // YYYY-MM-DD
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];          // ['cramps', 'headache', etc.]
  mood?: string;
  notes?: string;
};
```

### GoalInput
```typescript
type GoalInput = {
  category: 'fitness' | 'nutrition' | 'sleep' | 'mental-health';
  title: string;
  description?: string;
  target_value?: number;
  unit?: string;                // 'kg', 'minutes', 'days', etc.
  end_date?: string;            // YYYY-MM-DD
};
```

### ReminderInput
```typescript
type ReminderInput = {
  title: string;
  description?: string;
  type: 'medication' | 'workout' | 'sleep' | 'meal' | 'cycle' | 'mental';
  time?: string;                // HH:mm
  day_of_week?: number;         // 0=Sunday, 6=Saturday
};
```

## Common Use Cases

### Log Morning Workout
```typescript
await saveWorkout(user.id, {
  type: 'strength',
  name: 'Morning Strength Training',
  duration_minutes: 45,
  intensity: 'moderate',
  calories_burned: 350,
  date: new Date().toISOString().split('T')[0]
});
```

### Log Today's Sleep
```typescript
await saveSleepLog(user.id, {
  date: new Date().toISOString().split('T')[0],
  bedtime: '22:30',
  wake_time: '06:30',
  quality: 'good'
});
```

### Track Mood
```typescript
await saveMentalHealthLog(user.id, {
  date: new Date().toISOString().split('T')[0],
  mood: 7,
  stress_level: 4,
  anxiety_level: 3,
  energy_level: 8
});
```

### Get 7-Day Summary
```typescript
const [workouts, sleepLogs, mentalLogs] = await Promise.all([
  getWorkouts(user.id, 7),
  getSleepLogs(user.id, 7),
  getMentalHealthLogs(user.id, 7)
]);
```

## Best Practices

1. **Always check user authentication first**
   ```typescript
   if (!user?.id) return;
   ```

2. **Use proper error messages**
   ```typescript
   catch (error) {
     toast.error(error.message || 'An error occurred');
   }
   ```

3. **Debounce rapid saves**
   ```typescript
   const debouncedSave = useMemo(
     () => debounce(saveWorkout, 500),
     []
   );
   ```

4. **Provide user feedback**
   ```typescript
   toast.loading('Saving...');
   await saveWorkout(...);
   toast.success('Saved!');
   ```

5. **Use loading states**
   ```typescript
   const [loading, setLoading] = useState(false);
   setLoading(true);
   await saveWorkout(...);
   setLoading(false);
   ```

## Deployment

```bash
# Run migrations
supabase migration up

# Deploy functions
supabase functions deploy meal-plan
supabase functions deploy therapist-chat
supabase functions deploy workout-plan
supabase functions deploy sleep-guidance

# Check logs
supabase functions list
supabase functions logs meal-plan --limit 50
```

## Support & Documentation

- **Full API Docs:** [BACKEND_API.md](./BACKEND_API.md)
- **Setup Guide:** [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **Architecture:** [README_BACKEND.md](./README_BACKEND.md)
- **Supabase Docs:** https://supabase.com/docs
- **Deno Docs:** https://docs.deno.com
