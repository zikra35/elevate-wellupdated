# Backend Setup Guide

## Prerequisites

- Supabase project set up (https://supabase.com)
- Node.js and npm installed
- Lovable API key for AI features

## Step 1: Initialize Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref
```

## Step 2: Run Migrations

```bash
# Navigate to project root
cd supabase

# Apply all migrations in order
supabase migration up

# Or push to production
supabase db push
```

**Migrations created:**
1. `20260507090438_...` - Profiles table with cycle tracking
2. `20260507090502_...` - Permissions and triggers
3. `20260507100000_create_workouts_table.sql` - Workout logs
4. `20260507101000_create_logs_tables.sql` - Sleep, meals, mental health
5. `20260507102000_create_additional_tables.sql` - Cycle, goals, reminders

## Step 3: Deploy Edge Functions

```bash
# Deploy meal plan function
supabase functions deploy meal-plan

# Deploy therapist chat function
supabase functions deploy therapist-chat

# Deploy workout plan function
supabase functions deploy workout-plan

# Deploy sleep guidance function
supabase functions deploy sleep-guidance
```

## Step 4: Set Environment Variables

### In Supabase Dashboard → Settings → Environment Variables

Add:
```
LOVABLE_API_KEY=sk_live_your_key_here
```

### In `.env` file

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## Step 5: Test the Backend

### Test Database Connection

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and sign up for an account. Check Supabase dashboard → SQL Editor → profiles table for new user.

### Test API Functions

```bash
# Test meal plan generation
curl -X POST http://localhost:54321/functions/v1/meal-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_anon_key" \
  -d '{
    "profile": {"tdee": 2000, "goal": "wellness", "dietary_preferences": []},
    "swap": null
  }'
```

### Test in Application

1. Log workouts on `/dashboard`
2. Log sleep on `/dashboard`
3. Log cycle on `/dashboard/cycle`
4. Chat with AI therapist on `/dashboard/mental`

## Step 6: Enable RLS (Row Level Security)

Verify RLS is enabled:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Should show `rowsecurity = true` for all custom tables.

## Database Schema Overview

```
Users (from Supabase Auth)
├── Profiles (1:1)
├── Workouts (1:many)
├── SleepLogs (1:many)
├── Meals (1:many)
├── MentalHealthLogs (1:many)
├── CycleLogs (1:many)
├── WellnessGoals (1:many)
└── Reminders (1:many)
```

## Using the Backend API

### In Components

```typescript
import { useAuth } from '@/hooks/useAuth';
import { saveWorkout, getWorkouts } from '@/lib/backend-api';

export function MyComponent() {
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user?.id) return;
    
    const workout = await saveWorkout(user.id, {
      type: 'yoga',
      name: 'Morning Yoga',
      duration_minutes: 30,
      intensity: 'moderate',
      date: new Date().toISOString().split('T')[0],
    });
    console.log(workout);
  };

  return <button onClick={handleSave}>Save</button>;
}
```

## Monitoring & Debugging

### View Logs

```bash
# Real-time function logs
supabase functions list
supabase functions logs meal-plan --limit 50

# Or in Supabase Dashboard → Edge Functions
```

### Check Database

```bash
# Open SQL Editor in Supabase Dashboard
# Query example:
SELECT * FROM workouts WHERE user_id = 'user-id';
```

## Performance Tips

1. **Use Indexes:** All main tables have (user_id, date DESC) indexes
2. **Cache Client-Side:** Store recent data in React state
3. **Batch Operations:** Save multiple logs together when possible
4. **Pagination:** For large datasets, implement pagination
5. **Archive Old Data:** Archive logs older than 1 year monthly

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ CORS headers configured in Edge Functions
- ✅ API keys stored in environment variables
- ✅ No sensitive data in client bundle
- ✅ Rate limiting on AI functions
- ✅ User isolation via user_id checks

## Troubleshooting

### "Connection refused" error
- Check Supabase URL and key in `.env`
- Ensure Supabase project is running

### "Permission denied" errors
- Verify RLS policies are created
- Check user is authenticated before queries

### AI functions return 402
- Add credits to Lovable account
- Check LOVABLE_API_KEY is set

### Migrations fail to apply
- Run `supabase migration list` to check status
- Check for duplicate migration names
- Ensure migrations are in correct order

## Next Steps

1. Add real-time data with WebSockets (optional)
2. Create admin analytics dashboard
3. Implement data export features
4. Add integrations with wearable APIs
5. Build mobile app with React Native

## Support

- Supabase Docs: https://supabase.com/docs
- Lovable AI: https://lovable.dev/docs
- Deno Docs: https://docs.deno.com
