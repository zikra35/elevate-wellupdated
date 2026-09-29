import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useWorkoutData } from "@/hooks/useWellnessData";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Plus, Loader2, Trash2, Flame } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workouts-log")({
  component: WorkoutsLogPage,
});

const WORKOUT_TYPES = ["Yoga", "HIIT", "Pilates", "Strength", "Cardio", "Walking", "Running", "Cycling", "Sports"] as const;
const INTENSITY_LEVELS = ["Low", "Moderate", "High"] as const;

function WorkoutsLogPage() {
  const { user } = useAuth();
  const { workouts, loading, addWorkout, removeWorkout } = useWorkoutData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "Yoga" as typeof WORKOUT_TYPES[number],
    name: "",
    duration_minutes: 30,
    intensity: "Moderate" as typeof INTENSITY_LEVELS[number],
    calories_burned: 0,
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter workout name");
      return;
    }
    if (!user?.id) return;

    setSaving(true);
    try {
      await addWorkout({
        ...form,
        duration_minutes: form.duration_minutes,
        intensity: form.intensity.toLowerCase(),
        date: form.date,
      });
      toast.success("Workout logged! 💪");
      setForm({
        type: "Yoga",
        name: "",
        duration_minutes: 30,
        intensity: "Moderate",
        calories_burned: 0,
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save workout");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (workoutId: string) => {
    try {
      await removeWorkout(workoutId);
      toast.success("Workout deleted");
    } catch {
      toast.error("Failed to delete workout");
    }
  };

  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" /> Workout Logs
          </h1>
          <p className="text-sm text-muted-foreground">Track your exercise and fitness progress</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Log workout</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log a workout</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Workout type</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value as typeof WORKOUT_TYPES[number] }))}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Intensity</Label>
                  <select
                    value={form.intensity}
                    onChange={(e) => setForm(f => ({ ...f, intensity: e.target.value as typeof INTENSITY_LEVELS[number] }))}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    {INTENSITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Workout name</Label>
                <Input
                  placeholder="e.g., Morning Yoga Session"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Calories burned</Label>
                  <Input
                    type="number"
                    value={form.calories_burned}
                    onChange={(e) => setForm(f => ({ ...f, calories_burned: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="How did you feel? Any notes?"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Workouts</div>
          <div className="mt-2 text-2xl font-bold">{workouts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Minutes</div>
          <div className="mt-2 text-2xl font-bold">{totalMinutes}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Calories Burned</div>
          <div className="mt-2 text-2xl font-bold">{totalCalories}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Avg Duration</div>
          <div className="mt-2 text-2xl font-bold">{workouts.length > 0 ? Math.round(totalMinutes / workouts.length) : 0}m</div>
        </Card>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-card/50 p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No workouts logged yet. Start tracking!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <Card key={workout.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{workout.name}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded capitalize">{workout.type}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(workout.date).toLocaleDateString()} • {workout.duration_minutes} min • {workout.intensity}
                  </p>
                  {workout.notes && <p className="mt-2 text-xs text-muted-foreground">{workout.notes}</p>}
                  {workout.calories_burned && (
                    <p className="mt-2 text-xs font-medium flex items-center gap-1"><Flame className="h-3 w-3" /> {workout.calories_burned} kcal</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(workout.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
