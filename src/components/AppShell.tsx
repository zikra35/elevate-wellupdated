import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Home, Dumbbell, Moon, Brain, User, LogOut, Sparkles, Droplets, Leaf, Calendar, Sun, Utensils, History, Activity, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { UserAvatar, type AvatarConfig } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NAV_WELLNESS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/healthy-living", label: "Healthy Living", icon: Leaf },
  { to: "/mental", label: "Mental Health", icon: Brain },
  { to: "/sleep", label: "Sleep", icon: Moon, badge: "Live" },
] as const;

const NAV_TOOLS = [
  { to: "/search", label: "Path Finder", icon: Zap },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell() {
  const { user, loading, logout } = useAuth();
  const { profile, loading: ploading } = useProfile();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [workoutHistoryDialogOpen, setWorkoutHistoryDialogOpen] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealTime, setMealTime] = useState("");
  const [mealType, setMealType] = useState("morning");
  const [savingMeal, setSavingMeal] = useState(false);
  const [mealHistory, setMealHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [planWorkouts, setPlanWorkouts] = useState<any[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [loadingWorkoutHistory, setLoadingWorkoutHistory] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!ploading && profile && !profile.onboarding_completed) navigate({ to: "/onboarding" });
  }, [ploading, profile, navigate]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const nav = (profile?.gender === "female")
    ? [
        ...NAV_WELLNESS.slice(0, 3),
        { to: "/cycle", label: "Cycle", icon: Droplets } as const,
        ...NAV_WELLNESS.slice(3),
      ]
    : NAV_WELLNESS;

  async function handleLogMeal() {
    if (!mealName.trim() || !mealTime) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSavingMeal(true);
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_BASE_URL}/diet/log-meal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: mealName,
          time: mealTime,
          type: mealType,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        setMealName("");
        setMealTime("");
        setMealType("morning");
        setMealDialogOpen(false);
        alert("Meal logged successfully!");
        // Refresh history
        loadMealHistory();
        // Trigger a page refresh for Plans page
        window.dispatchEvent(new Event('mealLogged'));
      } else {
        alert("Failed to log meal");
      }
    } catch (error) {
      console.error("Error logging meal:", error);
      alert("Error logging meal");
    } finally {
      setSavingMeal(false);
    }
  }

  async function loadMealHistory() {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_BASE_URL}/diet/meal-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMealHistory(data.meals || []);
      }
    } catch (error) {
      console.error("Error loading meal history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleOpenHistory = () => {
    setHistoryDialogOpen(true);
    loadMealHistory();
  }

  async function loadPlanWorkouts() {
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_BASE_URL}/workouts/active-workouts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const workouts = data.workouts || [];
        setPlanWorkouts(workouts);
        if (workouts.length > 0) {
          setSelectedWorkout(workouts[0].name);
        }
      } else {
        // Fallback to default workouts
        const defaultWorkouts = [
          { name: 'Strength Training', duration: 45 },
          { name: 'Cardio', duration: 30 },
          { name: 'Yoga', duration: 60 },
          { name: 'Stretching', duration: 20 }
        ];
        setPlanWorkouts(defaultWorkouts);
        setSelectedWorkout(defaultWorkouts[0].name);
      }
    } catch (error) {
      console.error("Error loading plan workouts:", error);
      // Fallback to default workouts
      const defaultWorkouts = [
        { name: 'Strength Training', duration: 45 },
        { name: 'Cardio', duration: 30 },
        { name: 'Yoga', duration: 60 },
        { name: 'Stretching', duration: 20 }
      ];
      setPlanWorkouts(defaultWorkouts);
      setSelectedWorkout(defaultWorkouts[0].name);
    }
  }

  const handleOpenWorkoutDialog = () => {
    setWorkoutDialogOpen(true);
    loadPlanWorkouts();
  }

  async function handleLogWorkout() {
    if (!selectedWorkout || !workoutDuration) {
      alert("Please select a workout and enter duration");
      return;
    }

    try {
      setSavingWorkout(true);
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_BASE_URL}/workouts/log-workout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedWorkout,
          duration: parseInt(workoutDuration),
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        setSelectedWorkout("");
        setWorkoutDuration("");
        setWorkoutDialogOpen(false);
        alert("Workout logged successfully!");
        loadWorkoutHistory();
        // Trigger a page refresh for Plans page
        window.dispatchEvent(new Event('workoutLogged'));
      } else {
        alert("Failed to log workout");
      }
    } catch (error) {
      console.error("Error logging workout:", error);
      alert("Error logging workout");
    } finally {
      setSavingWorkout(false);
    }
  }

  async function loadWorkoutHistory() {
    try {
      setLoadingWorkoutHistory(true);
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_BASE_URL}/workouts/workout-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkoutHistory(data.workouts || []);
      }
    } catch (error) {
      console.error("Error loading workout history:", error);
    } finally {
      setLoadingWorkoutHistory(false);
    }
  }

  const handleOpenWorkoutHistory = () => {
    setWorkoutHistoryDialogOpen(true);
    loadWorkoutHistory();
  }

  async function handleLogout() {
    await logout();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar overlay */}
      {open && <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-72 border-r bg-sidebar text-sidebar-foreground transition-transform",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">ELEVATE WELL</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-md hover:bg-sidebar-accent">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 py-2">
          {/* WELLNESS Section */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-2">
              Wellness
            </div>
            {nav.map((n) => {
              const active = location.pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to}
                  className={cn(
                    "mb-1 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent",
                  )}>
                  <div className="flex items-center gap-3">
                    <n.icon className="h-4 w-4" /> {n.label}
                  </div>
                  {n.badge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                      {n.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* TOOLS Section */}
          <div>
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-2">
              Tools
            </div>
            {NAV_TOOLS.map((n) => {
              const active = location.pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to}
                  className={cn(
                    "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent",
                  )}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t p-3">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} aria-label="Open menu"
            className="grid h-11 w-11 place-items-center rounded-lg hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-bold tracking-wider">ELEVATE WELL</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
            <DialogTrigger asChild>
              <button
                onClick={handleOpenHistory}
                aria-label="View meal history"
                className="grid h-10 w-10 place-items-center rounded-lg hover:bg-muted transition"
                title="View meal history"
              >
                <History className="h-5 w-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Meal History</DialogTitle>
                <DialogDescription>View all your logged meals</DialogDescription>
              </DialogHeader>
              <div className="max-h-[400px] overflow-y-auto">
                {loadingHistory ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : mealHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No meals logged yet</div>
                ) : (
                  <div className="space-y-3">
                    {mealHistory.map((meal, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{meal.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {meal.time} • {meal.type}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(meal.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={workoutHistoryDialogOpen} onOpenChange={setWorkoutHistoryDialogOpen}>
            <DialogTrigger asChild>
              <button
                onClick={handleOpenWorkoutHistory}
                aria-label="View workout history"
                className="grid h-10 w-10 place-items-center rounded-lg hover:bg-muted transition"
                title="View workout history"
              >
                <Activity className="h-5 w-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Workout History</DialogTitle>
                <DialogDescription>View all your logged workouts</DialogDescription>
              </DialogHeader>
              <div className="max-h-[400px] overflow-y-auto">
                {loadingWorkoutHistory ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : workoutHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No workouts logged yet</div>
                ) : (
                  <div className="space-y-3">
                    {workoutHistory.map((workout, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{workout.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {workout.duration} minutes
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(workout.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={workoutDialogOpen} onOpenChange={setWorkoutDialogOpen}>
            <DialogTrigger asChild>
              <button
                onClick={handleOpenWorkoutDialog}
                aria-label="Log workout"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition"
                title="Log workout"
              >
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline">Log Workout</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Log Workout</DialogTitle>
                <DialogDescription>Select a workout and enter the duration</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="workout-select">Workout</Label>
                  <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
                    <SelectTrigger id="workout-select">
                      <SelectValue placeholder="Select a workout" />
                    </SelectTrigger>
                    <SelectContent>
                      {planWorkouts.map((workout) => (
                        <SelectItem key={workout.name} value={workout.name}>
                          {workout.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workout-duration">Duration (minutes)</Label>
                  <Input
                    id="workout-duration"
                    type="number"
                    placeholder="e.g., 30"
                    value={workoutDuration}
                    onChange={(e) => setWorkoutDuration(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setWorkoutDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLogWorkout}
                  disabled={savingWorkout}
                >
                  {savingWorkout ? "Saving..." : "Log Workout"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={mealDialogOpen} onOpenChange={setMealDialogOpen}>
            <DialogTrigger asChild>
              <button
                aria-label="Log meals"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition"
                title="Log meals"
              >
                <Utensils className="h-4 w-4" />
                <span className="hidden sm:inline">Log Meals</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Log Meal</DialogTitle>
                <DialogDescription>Enter your meal details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="meal-name">Meal Name</Label>
                  <Input
                    id="meal-name"
                    placeholder="e.g., Chicken Salad"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meal-time">Meal Time</Label>
                  <Input
                    id="meal-time"
                    type="time"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meal-type">Meal Type</Label>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger id="meal-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setMealDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLogMeal}
                  disabled={savingMeal}
                >
                  {savingMeal ? "Saving..." : "Save Meal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Link
            to="/plans"
            aria-label="View plans"
            className="relative grid h-10 w-10 place-items-center rounded-lg hover:bg-muted"
          >
            <Calendar className="h-5 w-5" />
            {profile?.activePlanId && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500" />
            )}
          </Link>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-10 w-10 place-items-center rounded-lg hover:bg-muted"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link to="/profile" className="flex items-center gap-2">
            <UserAvatar
              seed={profile?.avatar_seed ?? profile?.name ?? "elevate"}
              config={{ ...((profile?.avatar_config as AvatarConfig) ?? {}), gender: profile?.gender ?? undefined }}
              size={36}
            />
            <span className="hidden text-sm font-medium sm:inline">{profile?.name ?? "Friend"}</span>
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
