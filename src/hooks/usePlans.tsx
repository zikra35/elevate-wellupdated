import { useState, useCallback } from 'react';

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: number;
  intensity: string;
  description: string;
}

interface Meal {
  id: string;
  day: string;
  mealType: string;
  name: string;
  calories: number;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface Schedule {
  id: string;
  day: string;
  time: string;
  activity: string;
  duration: number;
  notes?: string;
}

interface Suggestions {
  workouts: Workout[];
  meals: Meal[];
  schedule: Schedule[];
}

interface GenerateSuggestionsResponse {
  suggestions: Suggestions;
  isMockGenerated: boolean;
  error: string | null;
}

export function usePlans() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [isMockGenerated, setIsMockGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${API_BASE_URL}/plans/generate-suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data: GenerateSuggestionsResponse = await res.json();
      setSuggestions(data.suggestions);
      setIsMockGenerated(data.isMockGenerated);
      setError(data.error);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const createPlan = useCallback(
    async (status: 'active' | 'disabled', name?: string, description?: string) => {
      try {
        if (!suggestions) {
          throw new Error('No suggestions available');
        }

        const token = localStorage.getItem('authToken');
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

        const res = await fetch(`${API_BASE_URL}/plans`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name || 'My Personalized Plan',
            description: description || '',
            status,
            suggestions,
            isMockGenerated
          })
        });

        if (!res.ok) {
          throw new Error('Failed to create plan');
        }

        const plan = await res.json();
        setSuggestions(null);
        setIsMockGenerated(false);

        return plan;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      }
    },
    [suggestions, isMockGenerated]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions(null);
    setIsMockGenerated(false);
    setError(null);
  }, []);

  return {
    isGenerating,
    suggestions,
    isMockGenerated,
    error,
    generateSuggestions,
    createPlan,
    clearSuggestions
  };
}
