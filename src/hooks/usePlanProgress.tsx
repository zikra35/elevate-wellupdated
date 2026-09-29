import { useState, useEffect, useCallback } from 'react';

interface PlanProgress {
  workoutsCompleted: number;
  mealsLogged: number;
  scheduleAdherence: number;
  lastUpdated: string;
  totalWorkoutSuggestions: number;
  totalMealSuggestions: number;
  totalScheduleItems: number;
}

interface ActivePlan {
  _id: string;
  name: string;
  status: 'active' | 'disabled';
  progress: PlanProgress;
  suggestions: {
    workouts: any[];
    meals: any[];
    schedule: any[];
  };
}

export function usePlanProgress() {
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivePlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${API_BASE_URL}/plans?status=active`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch active plan');
      }

      const data = await res.json();
      const plans = data.plans || [];
      
      if (plans.length > 0) {
        setActivePlan(plans[0]);
      } else {
        setActivePlan(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setActivePlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivePlan();
  }, [fetchActivePlan]);

  const refreshProgress = useCallback(async () => {
    await fetchActivePlan();
  }, [fetchActivePlan]);

  return {
    activePlan,
    loading,
    error,
    refreshProgress
  };
}
