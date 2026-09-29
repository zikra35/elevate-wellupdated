import { useNavigate } from '@tanstack/react-router';
import { Calendar, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PlanProgress {
  workoutsCompleted: number;
  mealsLogged: number;
  scheduleAdherence: number;
  lastUpdated: string;
  totalWorkoutSuggestions: number;
  totalMealSuggestions: number;
  totalScheduleItems: number;
}

interface PlanStatusCardProps {
  planName: string;
  progress: PlanProgress;
}

export function PlanStatusCard({ planName, progress }: PlanStatusCardProps) {
  const navigate = useNavigate();

  const workoutCompletion = progress.totalWorkoutSuggestions > 0
    ? Math.round((progress.workoutsCompleted / progress.totalWorkoutSuggestions) * 100)
    : 0;

  const mealCompletion = progress.totalMealSuggestions > 0
    ? Math.round((progress.mealsLogged / progress.totalMealSuggestions) * 100)
    : 0;

  return (
    <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/20 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Active Plan</h3>
            <p className="text-xs text-muted-foreground">{planName}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate({ to: '/plans' })}
        >
          View Plans
        </Button>
      </div>

      <div className="space-y-4">
        {/* Workout Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Workouts</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {progress.workoutsCompleted} / {progress.totalWorkoutSuggestions}
            </span>
          </div>
          <Progress value={workoutCompletion} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{workoutCompletion}% complete</p>
        </div>

        {/* Meal Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium">Meals</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {progress.mealsLogged} / {progress.totalMealSuggestions}
            </span>
          </div>
          <Progress value={mealCompletion} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{mealCompletion}% complete</p>
        </div>

        {/* Schedule Adherence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Schedule Adherence</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {progress.scheduleAdherence}%
            </span>
          </div>
          <Progress value={progress.scheduleAdherence} className="h-2" />
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(progress.lastUpdated).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
