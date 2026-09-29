// Custom hook for fetching and managing workout data
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import * as BackendAPI from '@/lib/backend-api';

export type Workout = {
  id: string;
  user_id: string;
  type: string;
  name: string;
  duration_minutes?: number;
  intensity?: string;
  calories_burned?: number;
  notes?: string;
  date: string;
  created_at: string;
  updated_at: string;
};

export function useWorkoutData() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async (days: number = 30) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await BackendAPI.getWorkouts(user.id, days);
      setWorkouts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workouts');
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const addWorkout = useCallback(async (workoutData: Omit<Workout, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('Not authenticated');
    try {
      const workout = await BackendAPI.saveWorkout(user.id, workoutData);
      setWorkouts(prev => [workout, ...prev]);
      return workout;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout');
      throw err;
    }
  }, [user?.id]);

  const removeWorkout = useCallback(async (workoutId: string) => {
    try {
      await BackendAPI.deleteWorkout(workoutId);
      setWorkouts(prev => prev.filter(w => w.id !== workoutId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout');
      throw err;
    }
  }, []);

  return {
    workouts,
    loading,
    error,
    addWorkout,
    removeWorkout,
    refreshWorkouts: fetchWorkouts
  };
}

// Similar hooks for other data types
export type SleepLog = {
  id: string;
  user_id: string;
  date: string;
  bedtime?: string;
  wake_time?: string;
  duration_minutes?: number;
  quality?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export function useSleepData() {
  const { user } = useAuth();
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSleepLogs = useCallback(async (days: number = 30) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await BackendAPI.getSleepLogs(user.id, days);
      setSleepLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sleep logs');
      setSleepLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSleepLogs();
  }, [fetchSleepLogs]);

  const addSleepLog = useCallback(async (sleepData: Omit<SleepLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('Not authenticated');
    try {
      const log = await BackendAPI.saveSleepLog(user.id, sleepData);
      setSleepLogs(prev => {
        const existing = prev.findIndex(l => l.date === sleepData.date);
        if (existing >= 0) {
          return prev.map((l, i) => i === existing ? log : l);
        }
        return [log, ...prev];
      });
      return log;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sleep log');
      throw err;
    }
  }, [user?.id]);

  return {
    sleepLogs,
    loading,
    error,
    addSleepLog,
    refreshSleepLogs: fetchSleepLogs
  };
}

export type Meal = {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  name: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
};

export function useMealData() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async (date?: string) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await BackendAPI.getMeals(user.id, date);
      setMeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meals');
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const addMeal = useCallback(async (mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('Not authenticated');
    try {
      const meal = await BackendAPI.saveMeal(user.id, mealData);
      setMeals(prev => [meal, ...prev]);
      return meal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal');
      throw err;
    }
  }, [user?.id]);

  const removeMeal = useCallback(async (mealId: string) => {
    try {
      await BackendAPI.deleteMeal(mealId);
      setMeals(prev => prev.filter(m => m.id !== mealId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal');
      throw err;
    }
  }, []);

  return {
    meals,
    loading,
    error,
    addMeal,
    removeMeal,
    refreshMeals: fetchMeals
  };
}

export type MentalHealthLog = {
  id: string;
  user_id: string;
  date: string;
  mood?: number;
  stress_level?: number;
  anxiety_level?: number;
  energy_level?: number;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
};

export function useMentalHealthData() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MentalHealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (days: number = 30) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await BackendAPI.getMentalHealthLogs(user.id, days);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mental health logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = useCallback(async (logData: Omit<MentalHealthLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('Not authenticated');
    try {
      const log = await BackendAPI.saveMentalHealthLog(user.id, logData);
      setLogs(prev => [log, ...prev]);
      return log;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save log');
      throw err;
    }
  }, [user?.id]);

  return {
    logs,
    loading,
    error,
    addLog,
    refreshLogs: fetchLogs
  };
}
