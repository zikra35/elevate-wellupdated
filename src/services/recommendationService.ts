/**
 * Recommendation Service
 * Handles all API calls to the ML recommendation endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthToken = () => localStorage.getItem("authToken");

interface RecommendationResponse {
  workout: string;
  meals: Array<{
    id: string;
    day: string;
    mealType: string;
    name: string;
    calories?: number;
    macros?: {
      protein: number;
      carbs: number;
      fat: number;
    };
    foodItems?: Array<{
      food: string;
      quantity: string;
      plates: string;
    }>;
    description?: string;
    confidence?: number;
    reason?: string;
  }>;
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

interface FeedbackPayload {
  recommendationId: string;
  type: "workout" | "meal" | "sleep" | "mood";
  feedback: "liked" | "disliked" | "neutral";
  timestamp: string;
}

/**
 * Get all recommendations for a user
 */
export async function getRecommendations(): Promise<RecommendationResponse> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/ai/suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        profile: {
          goal: "general_wellness",
          dietary_preferences: [],
          gender: "not_specified",
        },
        mood: 3,
        anxietyLevel: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    throw error;
  }
}

/**
 * Get workout recommendation
 */
export async function getWorkoutRecommendation(): Promise<{
  recommendation: string;
  confidence: number;
  source: string;
}> {
  try {
    const recommendations = await getRecommendations();
    return {
      recommendation: recommendations.workout,
      confidence: recommendations.confidence,
      source: recommendations.source,
    };
  } catch (error) {
    console.error("Error fetching workout recommendation:", error);
    throw error;
  }
}

/**
 * Get meal recommendation
 */
export async function getMealRecommendation(): Promise<{
  recommendations: Array<{
    id: string;
    day: string;
    mealType: string;
    name: string;
    calories?: number;
    macros?: {
      protein: number;
      carbs: number;
      fat: number;
    };
    foodItems?: Array<{
      food: string;
      quantity: string;
      plates: string;
    }>;
    description?: string;
    confidence?: number;
    reason?: string;
  }>;
  confidence: number;
  source: string;
}> {
  try {
    const recommendations = await getRecommendations();
    return {
      recommendations: recommendations.meals,
      confidence: recommendations.confidence,
      source: recommendations.source,
    };
  } catch (error) {
    console.error("Error fetching meal recommendation:", error);
    throw error;
  }
}

/**
 * Get sleep recommendation
 */
export async function getSleepRecommendation(): Promise<{
  tip: string;
  quality: string;
  duration: number;
  tips: string[];
  confidence: number;
  source: string;
}> {
  try {
    const recommendations = await getRecommendations();
    return {
      tip: recommendations.wellnessTip,
      quality: recommendations.sleepInsights?.predictedQuality || "good",
      duration: recommendations.sleepInsights?.targetDuration || 8,
      tips: recommendations.sleepInsights?.tips || [],
      confidence: recommendations.confidence,
      source: recommendations.source,
    };
  } catch (error) {
    console.error("Error fetching sleep recommendation:", error);
    throw error;
  }
}

/**
 * Get mood prediction
 */
export async function getMoodPrediction(): Promise<{
  predictedLevel: number;
  stressLevel: number;
  anxietyLevel: number;
  energyLevel: number;
  suggestions: string[];
  confidence: number;
  source: string;
}> {
  try {
    const recommendations = await getRecommendations();
    return {
      predictedLevel: recommendations.moodInsights?.predictedLevel || 3,
      stressLevel: recommendations.moodInsights?.stressLevel || 5,
      anxietyLevel: recommendations.moodInsights?.anxietyLevel || 5,
      energyLevel: recommendations.moodInsights?.energyLevel || 5,
      suggestions: recommendations.moodInsights?.suggestions || [],
      confidence: recommendations.confidence,
      source: recommendations.source,
    };
  } catch (error) {
    console.error("Error fetching mood prediction:", error);
    throw error;
  }
}

/**
 * Submit feedback for a recommendation
 */
export async function submitRecommendationFeedback(
  feedback: FeedbackPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/ai/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
}

/**
 * Get recommendation history
 */
export async function getRecommendationHistory(
  limit: number = 10
): Promise<RecommendationResponse[]> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_BASE_URL}/ai/recommendations/history?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch recommendation history: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching recommendation history:", error);
    throw error;
  }
}

/**
 * Get recommendation statistics
 */
export async function getRecommendationStats(): Promise<{
  totalRecommendations: number;
  acceptanceRate: number;
  averageConfidence: number;
  topRecommendations: string[];
}> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/ai/recommendations/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch recommendation stats: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching recommendation stats:", error);
    throw error;
  }
}
