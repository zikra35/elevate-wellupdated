import { createFileRoute } from "@tanstack/react-router";
import { RecommendationDashboard } from "@/components/RecommendationDashboard";
import { useRecommendations } from "@/hooks/useRecommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, History, BarChart3, RefreshCw } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/recommendations")({
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { recommendations, history, stats, loading, refresh } = useRecommendations();
  const [activeTab, setActiveTab] = useState("today");

  const confidencePercentage = recommendations
    ? Math.round(recommendations.confidence * 100)
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            AI Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalized wellness suggestions powered by machine learning
          </p>
        </div>
        <Button
          onClick={refresh}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Today's Recommendations */}
        <TabsContent value="today" className="space-y-4">
          <RecommendationDashboard />
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-4">
          <RecommendationHistory />
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="stats" className="space-y-4">
          <RecommendationStatistics stats={stats} />
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            🤖 <strong>AI-Powered:</strong> Our self-trained machine learning model
            analyzes your health data to generate personalized recommendations.
          </p>
          <p>
            📊 <strong>Data-Driven:</strong> Recommendations are based on your
            workout history, meal preferences, sleep patterns, and mood trends.
          </p>
          <p>
            👍 <strong>Feedback Loop:</strong> Your feedback helps the model improve
            future recommendations. Mark recommendations as helpful or not helpful.
          </p>
          <p>
            🔒 <strong>Privacy First:</strong> All your data stays local. We don't
            share your information with external services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function RecommendationHistory() {
  const { history, historyLoading, historyError } = useRecommendations();

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  if (historyError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-sm text-red-800">Error loading history: {historyError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No recommendation history yet. Check back after getting some recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((rec, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Recommendation #{history.length - idx}</CardTitle>
                <CardDescription>
                  Confidence: {Math.round(rec.confidence * 100)}% • Source: {rec.source}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-sm text-muted-foreground">Workout</p>
              <p className="text-foreground">{rec.workout}</p>
            </div>
            <div>
              <p className="font-medium text-sm text-muted-foreground">Meals</p>
              {Array.isArray(rec.meals) && rec.meals.length > 0 ? (
                <div className="space-y-2">
                  {rec.meals.map((meal: any, mealIdx: number) => (
                    <div key={mealIdx} className="text-sm text-foreground bg-muted/50 rounded p-2">
                      <p className="font-medium">{meal.name || meal}</p>
                      {meal.foodItems && meal.foodItems.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {meal.foodItems.map((item: any, itemIdx: number) => (
                            <li key={itemIdx} className="text-xs text-muted-foreground">
                              • {item.food} ({item.quantity}, {item.plates})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-foreground">{typeof rec.meals === 'string' ? rec.meals : rec.meals?.join(" • ")}</p>
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-muted-foreground">Wellness Tip</p>
              <p className="text-foreground">{rec.wellnessTip}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface RecommendationStatisticsProps {
  stats: {
    totalRecommendations: number;
    acceptanceRate: number;
    averageConfidence: number;
    topRecommendations: string[];
  } | null;
}

function RecommendationStatistics({ stats }: RecommendationStatisticsProps) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Statistics will appear after you receive more recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Total Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">
            {stats.totalRecommendations}
          </p>
        </CardContent>
      </Card>

      {/* Acceptance Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Acceptance Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">
            {Math.round(stats.acceptanceRate * 100)}%
          </p>
        </CardContent>
      </Card>

      {/* Average Confidence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Confidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">
            {Math.round(stats.averageConfidence * 100)}%
          </p>
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {stats.topRecommendations.slice(0, 3).map((rec, idx) => (
              <li key={idx} className="text-sm text-foreground">
                {idx + 1}. {rec}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
