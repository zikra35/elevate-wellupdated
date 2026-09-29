import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: number;
  intensity: string;
  description: string;
  exercises?: Array<{
    name: string;
    sets: number;
    reps: number;
    duration: number;
  }>;
}

interface Meal {
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
  ingredients?: string[];
  recipe?: string;
}

interface SuggestionPopupProps {
  isOpen: boolean;
  suggestions: {
    workouts: Workout[];
    meals: Meal[];
  } | null;
  isLoading: boolean;
  isMockGenerated?: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function SuggestionPopup({
  isOpen,
  suggestions,
  isLoading,
  isMockGenerated = false,
  onAccept,
  onReject,
  onClose
}: SuggestionPopupProps) {
  const [activeTab, setActiveTab] = useState<'workouts' | 'meals'>('workouts');
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      onKeyDown={handleEscapeKey}
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggestion-popup-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card shadow-[var(--shadow-neumorphic-lg)] p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 id="suggestion-popup-title" className="font-display text-2xl font-bold mb-2">
            Your Personalized Wellness Plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Based on your profile, we've created personalized recommendations for you.
          </p>
          {isMockGenerated && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>These are generic suggestions. AI service is temporarily unavailable.</p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Generating your personalized plan...</p>
          </div>
        ) : suggestions ? (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
              {(['workouts', 'meals'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mb-6 space-y-3 max-h-96 overflow-y-auto">
              {activeTab === 'workouts' && (
                <div className="space-y-3">
                  {suggestions.workouts.length > 0 ? (
                    suggestions.workouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="rounded-2xl bg-muted/40 p-4 cursor-pointer hover:bg-muted/60 transition"
                        onClick={() =>
                          setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{workout.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {workout.duration} min • {workout.intensity} intensity
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{workout.description}</p>
                          </div>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full ml-2">
                            {workout.type}
                          </span>
                        </div>

                        {expandedWorkout === workout.id && workout.exercises && (
                          <div className="mt-3 pt-3 border-t border-border space-y-2">
                            {workout.exercises.map((exercise, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground">
                                <span className="font-medium">{exercise.name}</span>
                                {exercise.sets > 0 && ` • ${exercise.sets} sets`}
                                {exercise.reps > 0 && ` • ${exercise.reps} reps`}
                                {exercise.duration > 0 && ` • ${exercise.duration} min`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No workouts suggested
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'meals' && (
                <div className="space-y-3">
                  {suggestions.meals.length > 0 ? (
                    suggestions.meals.slice(0, 7).map((meal) => (
                      <div key={meal.id} className="rounded-2xl bg-muted/40 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{meal.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {meal.day} • {meal.mealType}
                            </p>
                            
                            {/* Show food items with quantities if available */}
                            {meal.foodItems && meal.foodItems.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {meal.foodItems.map((item, idx) => (
                                  <div key={idx} className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                                    <div className="font-medium text-foreground">{item.food}</div>
                                    <div className="text-xs mt-1">
                                      <span className="text-primary font-semibold">{item.quantity}</span>
                                      <span className="mx-1">•</span>
                                      <span>{item.plates}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : meal.calories ? (
                              <p className="text-xs text-muted-foreground mt-1">
                                {meal.calories} cal
                                {meal.macros && (
                                  <span>
                                    {' '}
                                    • P: {meal.macros.protein}g C: {meal.macros.carbs}g F:{' '}
                                    {meal.macros.fat}g
                                  </span>
                                )}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No meals suggested
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                onClick={onAccept}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Accept Plan
              </Button>
              <Button
                onClick={onReject}
                variant="outline"
                className="flex-1"
              >
                Create Disabled Plan
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Failed to load suggestions. Please try again.
            </p>
            <Button onClick={onClose} variant="outline" className="mt-4">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
