import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, MapPin, Timer, Flame } from "lucide-react";
import { HistoryList } from "@/components/HistoryList";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/workout-history")({
  component: WorkoutHistoryPage,
});

type WorkoutItem = {
  id: string;
  source: "log" | "session";
  name: string;
  duration: number;
  date: string;
  loggedAt: string;
  calories?: number;
  isGpsTracked?: boolean;
  distanceKm?: number;
  pace?: string;
};

function WorkoutHistoryPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Workout history</h1>
        <p className="text-sm text-muted-foreground">Quick logs, guided sessions and GPS routes in one place.</p>
      </div>

      <HistoryList<WorkoutItem>
        endpoint="/workouts/workout-history"
        itemsKey="workouts"
        refreshEvent="workoutLogged"
        noun="workout"
        deletePath={(w) => `/workouts/workout-history/${w.source}/${w.id}`}
        renderDaySummary={(items) => {
          const minutes = items.reduce((sum, w) => sum + (w.duration || 0), 0);
          return `${items.length} workout${items.length === 1 ? "" : "s"} · ${minutes} min`;
        }}
        renderItem={(w) => (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
              {w.isGpsTracked ? <MapPin className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{w.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Timer className="h-3 w-3" /> {w.duration} min</span>
                {w.isGpsTracked && !!w.distanceKm && <span>{w.distanceKm.toFixed(2)} km{w.pace ? ` · ${w.pace}/km` : ""}</span>}
                {!!w.calories && <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> {w.calories} kcal</span>}
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                  {w.source === "log" ? "Quick log" : w.isGpsTracked ? "GPS route" : "Session"}
                </span>
                <span>{new Date(w.loggedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
        )}
        empty={{
          icon: <Dumbbell className="h-6 w-6" />,
          title: "No workouts in this range",
          body: "Log a workout from the top bar, finish a guided session, or track a route. It will show up here.",
          action: (
            <Button asChild size="sm">
              <Link to="/workouts" search={{ scrollTo: undefined }}>Go to Workouts</Link>
            </Button>
          ),
        }}
      />
    </div>
  );
}
