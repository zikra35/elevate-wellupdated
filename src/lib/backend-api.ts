const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthToken = () => localStorage.getItem("authToken");

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "API Error" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
};

// Workout handlers
export async function saveWorkout(userId: string, workout: {
  type: string;
  name: string;
  duration_minutes?: number;
  intensity?: string;
  calories_burned?: number;
  notes?: string;
  date: string;
}) {
  return apiCall("/workouts", {
    method: "POST",
    body: JSON.stringify({ userId, ...workout }),
  });
}

export async function getWorkouts(userId: string, days: number = 30) {
  return apiCall(`/workouts?userId=${userId}&days=${days}`);
}

export async function deleteWorkout(workoutId: string) {
  return apiCall(`/workouts/${workoutId}`, { method: "DELETE" });
}

// Sleep handlers
export async function saveSleepLog(userId: string, sleep: {
  date: string;
  bedtime?: string;
  wake_time?: string;
  duration_minutes?: number;
  quality?: string;
  notes?: string;
}) {
  return apiCall("/sleep", {
    method: "POST",
    body: JSON.stringify({ userId, ...sleep }),
  });
}

export async function getSleepLogs(userId: string, days: number = 30) {
  return apiCall(`/sleep?userId=${userId}&days=${days}`);
}

// Mental health handlers
export async function saveMentalHealthLog(userId: string, log: {
  date: string;
  mood?: number;
  stress_level?: number;
  anxiety_level?: number;
  energy_level?: number;
  notes?: string;
  tags?: string[];
}) {
  return apiCall("/mental-health", {
    method: "POST",
    body: JSON.stringify({ userId, ...log }),
  });
}

export async function getMentalHealthLogs(userId: string, days: number = 30) {
  return apiCall(`/mental-health?userId=${userId}&days=${days}`);
}

// Meals handlers
export async function saveMeal(userId: string, meal: {
  date: string;
  meal_type: string;
  name: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients?: string[];
  notes?: string;
}) {
  return apiCall("/meals", {
    method: "POST",
    body: JSON.stringify({ userId, ...meal }),
  });
}

export async function getMeals(userId: string, date?: string) {
  const url = date ? `/meals?userId=${userId}&date=${date}` : `/meals?userId=${userId}`;
  return apiCall(url);
}

export async function deleteMeal(mealId: string) {
  return apiCall(`/meals/${mealId}`, { method: "DELETE" });
}

// Cycle handlers
export async function saveCycleLog(userId: string, log: {
  start_date: string;
  end_date?: string;
  flow?: string;
  symptoms?: string[];
  mood?: string;
  notes?: string;
}) {
  return apiCall("/cycle", {
    method: "POST",
    body: JSON.stringify({ userId, ...log }),
  });
}

export async function getCycleLogs(userId: string) {
  return apiCall(`/cycle?userId=${userId}`);
}

// Goals handlers
export async function saveGoal(userId: string, goal: {
  category: string;
  title: string;
  description?: string;
  target_value?: number;
  unit?: string;
  end_date?: string;
}) {
  return apiCall("/goals", {
    method: "POST",
    body: JSON.stringify({ userId, ...goal }),
  });
}

export async function getGoals(userId: string, status: string = "active") {
  return apiCall(`/goals?userId=${userId}&status=${status}`);
}

export async function updateGoalProgress(goalId: string, progress: number) {
  return apiCall(`/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify({ progress }),
  });
}

// Reminders handlers
export async function saveReminder(userId: string, reminder: {
  title: string;
  description?: string;
  type: string;
  time?: string;
  day_of_week?: number;
}) {
  return apiCall("/reminders", {
    method: "POST",
    body: JSON.stringify({ userId, ...reminder }),
  });
}

export async function getReminders(userId: string) {
  return apiCall(`/reminders?userId=${userId}`);
}

export async function updateReminder(reminderId: string, updates: any) {
  return apiCall(`/reminders/${reminderId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// Healthy Living handlers
export async function getArticles(category?: string) {
  const url = category ? `/healthy-living/articles?category=${category}` : `/healthy-living/articles`;
  return apiCall(url);
}

export async function getRecipes(dietaryTag?: string, mealType?: string) {
  const params = new URLSearchParams();
  if (dietaryTag) params.append("dietaryTag", dietaryTag);
  if (mealType) params.append("mealType", mealType);
  const url = params.toString() ? `/healthy-living/recipes?${params.toString()}` : `/healthy-living/recipes`;
  return apiCall(url);
}

export async function getVideos(category?: string) {
  const url = category ? `/healthy-living/videos?category=${category}` : `/healthy-living/videos`;
  return apiCall(url);
}

export async function saveRecipeToFavourites(recipeId: string) {
  return apiCall("/healthy-living/favourites/recipes", {
    method: "POST",
    body: JSON.stringify({ recipeId }),
  });
}

export async function removeRecipeFromFavourites(recipeId: string) {
  return apiCall("/healthy-living/favourites/recipes", {
    method: "DELETE",
    body: JSON.stringify({ recipeId }),
  });
}

export async function getFavouriteRecipes() {
  return apiCall("/healthy-living/favourites/recipes");
}

// Journal handlers
export async function getJournalEntries() {
  return apiCall("/mental-health/journal");
}

export async function createJournalEntry(content: string, prompt?: string) {
  return apiCall("/mental-health/journal", {
    method: "POST",
    body: JSON.stringify({ content, prompt }),
  });
}

export async function updateJournalEntry(entryId: string, content: string, prompt?: string) {
  return apiCall(`/mental-health/journal/${entryId}`, {
    method: "PUT",
    body: JSON.stringify({ content, prompt }),
  });
}

export async function deleteJournalEntry(entryId: string) {
  return apiCall(`/mental-health/journal/${entryId}`, {
    method: "DELETE",
  });
}

// Music handlers
export async function getMusic(moodTag?: string) {
  const url = moodTag ? `/mental-health/music?moodTag=${moodTag}` : `/mental-health/music`;
  return apiCall(url);
}

// AI handlers
export async function chatWithSage(messages: Array<{ role: string; content: string }>) {
  return apiCall("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}

export async function getAISuggestions(profile: any, phase?: string, mood?: number, anxietyLevel?: number) {
  return apiCall("/ai/suggestions", {
    method: "POST",
    body: JSON.stringify({ profile, phase, mood, anxietyLevel }),
  });
}

export async function submitRecommendationFeedback(feedback: {
  recommendationId: string;
  type: "workout" | "meal" | "sleep" | "mood";
  feedback: "liked" | "disliked" | "neutral";
  timestamp: string;
}) {
  return apiCall("/ai/feedback", {
    method: "POST",
    body: JSON.stringify(feedback),
  });
}

export async function getRecommendationHistory(limit: number = 10) {
  return apiCall(`/ai/recommendations/history?limit=${limit}`);
}

export async function getRecommendationStats() {
  return apiCall("/ai/recommendations/stats");
}
