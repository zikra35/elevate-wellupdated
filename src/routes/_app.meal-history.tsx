import { createFileRoute } from "@tanstack/react-router";
import { Utensils, Clock } from "lucide-react";
import { HistoryList } from "@/components/HistoryList";

export const Route = createFileRoute("/_app/meal-history")({
  component: MealHistoryPage,
});

type Meal = {
  id: string;
  name: string;
  time: string;
  type: "morning" | "afternoon" | "evening" | "night" | "snack";
  date: string;
};

const TYPE_LABEL: Record<Meal["type"], string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
  snack: "Snack",
};

const TYPE_STYLE: Record<Meal["type"], string> = {
  morning: "bg-warning/15 text-warning",
  afternoon: "bg-primary/15 text-primary",
  evening: "bg-secondary/15 text-secondary",
  night: "bg-foreground/10 text-foreground",
  snack: "bg-success/20 text-success",
};

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  return new Date(2000, 0, 1, h, m || 0).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function MealHistoryPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Meal history</h1>
        <p className="text-sm text-muted-foreground">Everything you've logged, grouped by day.</p>
      </div>

      <HistoryList<Meal>
        endpoint="/diet/meal-history"
        itemsKey="meals"
        refreshEvent="mealLogged"
        noun="meal"
        deletePath={(m) => `/diet/meal-history/${m.id}`}
        renderItem={(m) => (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{m.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(m.time)}</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${TYPE_STYLE[m.type] ?? "bg-muted"}`}>
                  {TYPE_LABEL[m.type] ?? m.type}
                </span>
              </div>
            </div>
          </div>
        )}
        empty={{
          icon: <Utensils className="h-6 w-6" />,
          title: "No meals in this range",
          body: "Use Log Meals in the top bar to add what you eat. Your meals will show up here by day.",
        }}
      />
    </div>
  );
}
