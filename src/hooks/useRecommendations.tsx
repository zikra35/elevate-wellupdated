import { useState, useCallback, useEffect } from "react";
import {
  getRecommendations,
  getWorkoutRecommendation,
  getMealRecommendation,
  getSleepRecommendation,
  getMoodPrediction,
  submitRecommendationFeedback,
  getRecommendationHistory,
  getRecommendationStats,
} from "@/services/recommendationService";

interface Recommendation {
  workout: string;
  meals: string[];
  wellnessTip: string;
  focusGames: string[];
  calmingSongs: string[];
  source: string;
  modelType: string;
  personalized: boolean;
  confidence: number;
  moodInsights?: {
    predictedLevel: number;
    stressLevel: number;
    anxietyLevel: number;
    energyLevel: number;
    suggestions: string[];
  };
  sleepInsights?: {
    predictedQuality: string;
    targetDuration: number;
    tips: string[];
  };
}

interface RecommendationStats {
  totalRecommendations: number;
  acceptanceRate: number;
  averageConfidence: number;
  topRecommendations: string[];
}

interface UseRecommendationsReturn {
  // Data
  recommendations: Recommendation | null;
  history: Recommendation[];
  stats: RecommendationStats | null;

  // Loading states
  loading: boolean;
  historyLoading: boolean;
  statsLoading: boolean;
  feedbackSubmitting: boolean;

  // Error states
  error: string | null;
  historyError: string | null;
  statsError: string | null;
  feedbackError: string | null;

  // Actions
  fetchRecommendations: () => Promise<void>;
  fetchHistory: (limit?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  submitFeedback: (
    recommendationId: string,
    type: "workout" | "meal" | "sleep" | "mood",
    feedback: "liked" | "disliked" | "neutral"
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing recommendations
 * Handles fetching, caching, and feedback submission
 */
export function useRecommendations(): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<Recommendation | null>(
    null
  );
  const [history, setHistory] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecommendations();
      setRecommendations(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch recommendations";
      setError(errorMessage);
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (limit: number = 10) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const data = await getRecommendationHistory(limit);
      setHistory(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch history";
      setHistoryError(errorMessage);
      console.error("Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const data = await getRecommendationStats();
      setStats(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch stats";
      setStatsError(errorMessage);
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const submitFeedback = useCallback(
    async (
      recommendationId: string,
      type: "workout" | "meal" | "sleep" | "mood",
      feedback: "liked" | "disliked" | "neutral"
    ) => {
      try {
        setFeedbackSubmitting(true);
        setFeedbackError(null);
        await submitRecommendationFeedback({
          recommendationId,
          type,
          feedback,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to submit feedback";
        setFeedbackError(errorMessage);
        console.error("Error submitting feedback:", err);
      } finally {
        setFeedbackSubmitting(false);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchRecommendations(),
      fetchHistory(),
      fetchStats(),
    ]);
  }, [fetchRecommendations, fetchHistory, fetchStats]);

  // Fetch recommendations on mount
  useEffect(() => {
    void fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    // Data
    recommendations,
    history,
    stats,

    // Loading states
    loading,
    historyLoading,
    statsLoading,
    feedbackSubmitting,

    // Error states
    error,
    historyError,
    statsError,
    feedbackError,

    // Actions
    fetchRecommendations,
    fetchHistory,
    fetchStats,
    submitFeedback,
    refresh,
  };
}
