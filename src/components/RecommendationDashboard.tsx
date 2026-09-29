import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getRecommendations,
  submitRecommendationFeedback,
} from "@/services/recommendationService";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Apple,
  Moon,
  Smile,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";

interface Recommendation {
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

interface CardFeedback {
  [key: string]: "liked" | "disliked" | null;
}

export function RecommendationDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<CardFeedback>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(
    null
  );

  // Load recommendations on component mount or when user changes
  useEffect(() => {
    if (!authLoading && user) {
      loadRecommendations();
    }
  }, [user, authLoading]);

  async function loadRecommendations() {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecommendations();
      setRecommendations(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load recommendations";
      setError(errorMessage);
      console.error("Error loading recommendations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(
    cardType: string,
    feedbackType: "liked" | "disliked"
  ) {
    try {
      setSubmittingFeedback(cardType);

      // Generate a unique recommendation ID based on timestamp and type
      const recommendationId = `${cardType}-${Date.now()}`;

      await submitRecommendationFeedback({
        recommendationId,
        type: cardType as "workout" | "meal" | "sleep" | "mood",
        feedback: feedbackType,
        timestamp: new Date().toISOString(),
      });

      // Update local feedback state
      setFeedback((prev) => ({
        ...prev,
        [cardType]: feedbackType,
      }));

      // Show success feedback (you could add a toast here)
      console.log(`Feedback submitted: ${cardType} - ${feedbackType}`);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      // Could show error toast here
    } finally {
      setSubmittingFeedback(null);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          Please log in to view recommendations
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error loading recommendations</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button
              onClick={loadRecommendations}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-card p-6 shadow-[var(--shadow-neumorphic)] animate-pulse"
          >
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          No recommendations available at this time
        </p>
      </div>
    );
  }

  const confidencePercentage = Math.round(recommendations.confidence * 100);
  const moodLevel = recommendations.moodInsights?.predictedLevel || 3;
  const moodEmojis = ["😢", "😟", "😐", "🙂", "😄"];

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Today's Recommendations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized for you • Confidence: {confidencePercentage}%
          </p>
        </div>
        <Button
          onClick={loadRecommendations}
          disabled={loading}
          variant="outline"
          size="icon"
          className="rounded-full"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Recommendations Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Workout Card */}
        <RecommendationCard
          icon={Dumbbell}
          title="Today's Workout"
          emoji="💪"
          content={recommendations.workout}
          details={[
            `Confidence: ${confidencePercentage}%`,
            `Source: ${recommendations.source}`,
          ]}
          cardType="workout"
          feedback={feedback.workout}
          onFeedback={handleFeedback}
          isSubmitting={submittingFeedback === "workout"}
        />

        {/* Meal Card */}
        <RecommendationCard
          icon={Apple}
          title="Meal Suggestion"
          emoji="🥗"
          content={
            recommendations.meals && recommendations.meals.length > 0
              ? recommendations.meals
                  .map((meal) => meal.name)
                  .join(" • ")
              : "No meals available"
          }
          details={[
            `${recommendations.meals?.length || 0} meals available`,
            `Source: ${recommendations.source}`,
          ]}
          cardType="meal"
          feedback={feedback.meal}
          onFeedback={handleFeedback}
          isSubmitting={submittingFeedback === "meal"}
        />

        {/* Sleep Card */}
        <RecommendationCard
          icon={Moon}
          title="Sleep Tip"
          emoji="😴"
          content={recommendations.wellnessTip}
          details={[
            `Quality: ${recommendations.sleepInsights?.predictedQuality || "Good"}`,
            `Target: ${recommendations.sleepInsights?.targetDuration || 8} hours`,
          ]}
          cardType="sleep"
          feedback={feedback.sleep}
          onFeedback={handleFeedback}
          isSubmitting={submittingFeedback === "sleep"}
          additionalTips={recommendations.sleepInsights?.tips}
        />

        {/* Mood Card */}
        <RecommendationCard
          icon={Smile}
          title="Mood Prediction"
          emoji="😊"
          content={`${moodEmojis[moodLevel - 1]} Level ${moodLevel}/5`}
          details={[
            `Stress: ${recommendations.moodInsights?.stressLevel || 5}/10`,
            `Anxiety: ${recommendations.moodInsights?.anxietyLevel || 5}/10`,
          ]}
          cardType="mood"
          feedback={feedback.mood}
          onFeedback={handleFeedback}
          isSubmitting={submittingFeedback === "mood"}
          additionalTips={recommendations.moodInsights?.suggestions}
        />
      </div>

      {/* Source Information */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span><span className="font-medium">AI-Powered Recommendations:</span> These recommendations are generated by our self-trained AI model based on your personal health data. Your feedback helps us improve future recommendations.</span>
        </p>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  emoji: string;
  content: string;
  details: string[];
  cardType: "workout" | "meal" | "sleep" | "mood";
  feedback: "liked" | "disliked" | null | undefined;
  onFeedback: (cardType: string, feedback: "liked" | "disliked") => void;
  isSubmitting: boolean;
  additionalTips?: string[];
}

function RecommendationCard({
  icon: Icon,
  title,
  emoji,
  content,
  details,
  cardType,
  feedback,
  onFeedback,
  isSubmitting,
  additionalTips,
}: RecommendationCardProps) {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-neumorphic)] border border-border/50 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{emoji}</div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{details[0]}</p>
          </div>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-sm text-foreground leading-relaxed">{content}</p>
        {details[1] && (
          <p className="text-xs text-muted-foreground mt-2">{details[1]}</p>
        )}
      </div>

      {/* Additional Tips */}
      {additionalTips && additionalTips.length > 0 && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium text-foreground mb-2">Tips:</p>
          <ul className="space-y-1">
            {additionalTips.slice(0, 2).map((tip, idx) => (
              <li key={idx} className="text-xs text-muted-foreground">
                • {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => onFeedback(cardType, "liked")}
          disabled={isSubmitting}
          variant={feedback === "liked" ? "default" : "outline"}
          size="sm"
          className="flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ThumbsUp className="h-4 w-4 mr-1" />
              Helpful
            </>
          )}
        </Button>
        <Button
          onClick={() => onFeedback(cardType, "disliked")}
          disabled={isSubmitting}
          variant={feedback === "disliked" ? "destructive" : "outline"}
          size="sm"
          className="flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ThumbsDown className="h-4 w-4 mr-1" />
              Not Helpful
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
