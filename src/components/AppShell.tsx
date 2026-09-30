import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Home, Dumbbell, Moon, Brain, User, LogOut, Sparkles, Droplets, Leaf, Calendar, Sun, Utensils, History, Activity, Zap, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
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
import { apiFetch, localDateString, tzOffset } from "@/lib/api";

type NavItem = {
  to: "/dashboard" | "/workouts" | "/healthy-living" | "/mental" | "/sleep" | "/cycle" | "/search" | "/profile" | "/meal-history" | "/workout-history";
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const NAV_WELLNESS: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/healthy-living", label: "Healthy Living", icon: Leaf },
  { to: "/mental", label: "Mental Health", icon: Brain },
  { to: "/sleep", label: "Sleep", icon: Moon, badge: "Live" },
];

const NAV_HISTORY: NavItem[] = [
  { to: "/meal-history", label: "Meal History", icon: History },
  { to: "/workout-history", label: "Workout History", icon: Activity },
];

const NAV_TOOLS: NavItem[] = [
  { to: "/search", label: "Path Finder", icon: Zap },
  { to: "/profile", label: "Profile", icon: User },
];

const DEFAULT_WORKOUTS = [
  { name: "Strength Training", duration: 45 },
  { name: "Cardio", duration: 30 },
  { name: "Yoga", duration: 60 },
  { name: "Stretching", duration: 20 },
];

export function AppShell() {
  const { user, loading, logout } = useAuth();
  const { profile, loading: ploading } = useProfile();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealTime, setMealTime] = useState("");
  const [mealType, setMealType] = useState("morning");
  const [savingMeal, setSavingMeal] = useState(false);
  const [planWorkouts, setPlanWorkouts] = useState<any[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [savingWorkout, setSavingWorkout] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!ploading && profile && !profile.onboarding_completed) navigate({ to: "/onboarding" });
  }, [ploading, profile, navigate]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const nav: NavItem[] = (profile?.gender === "female")
    ? [
        ...NAV_WELLNESS.slice(0, 3),
        { to: "/cycle", label: "Cycle", icon: Droplets },
        ...NAV_WELLNESS.slice(3),
      ]
    : NAV_WELLNESS;

  async function handleLogMeal() {
    if (!mealName.trim() || !mealTime) {
      toast.error("Please enter a meal name and time");
      return;
    }

    try {
      setSavingMeal(true);
      const response = await apiFetch("/diet/log-meal", {
        method: "POST",
        body: JSON.stringify({
          name: mealName.trim(),
          time: mealTime,
          type: mealType,
          date: localDateString(),
          tzOffset: tzOffset(),
        }),
      });

      if (response.ok) {
        setMealName("");
        setMealTime("");
        setMealType("morning");
        setMealDialogOpen(false);
        toast.success("Meal logged", {
          action: { label: "View history", onClick: () => navigate({ to: "/meal-history" }) },
        });
        // Let other pages (Plans, Meal History) refresh
        window.dispatchEvent(new Event("mealLogged"));
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.message || "Couldn't log that meal. Please try again.");
      }
    } catch (error) {
      console.error("Error logging meal:", error);
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSavingMeal(false);
    }
  }

  async function loadPlanWorkouts() {
    try {
      const response = await apiFetch("/workouts/active-workouts");
      const workouts = response.ok ? ((await response.json()).workouts || []) : [];
      const list = workouts.length > 0 ? workouts : DEFAULT_WORKOUTS;
      setPlanWorkouts(list);
      setSelectedWorkout(list[0].name);
    } catch (error) {
      console.error("Error loading plan workouts:", error);
      setPlanWorkouts(DEFAULT_WORKOUTS);
      setSelectedWorkout(DEFAULT_WORKOUTS[0].name);
    }
  }

  const handleOpenWorkoutDialog = () => {
    setWorkoutDialogOpen(true);
    loadPlanWorkouts();
  }

  async function handleLogWorkout() {
    const minutes = parseInt(workoutDuration, 10);
    if (!selectedWorkout || !minutes || minutes <= 0) {
      toast.error("Please choose a workout and enter the minutes");
      return;
    }

    try {
      setSavingWorkout(true);
      const response = await apiFetch("/workouts/log-workout", {
        method: "POST",
        body: JSON.stringify({
          name: selectedWorkout,
          duration: minutes,
          date: localDateString(),
          tzOffset: tzOffset(),
        }),
      });

      if (response.ok) {
        setSelectedWorkout("");
        setWorkoutDuration("");
        setWorkoutDialogOpen(false);
        toast.success("Workout logged", {
          action: { label: "View history", onClick: () => navigate({ to: "/workout-history" }) },
        });
        // Let other pages (Plans, Workout History) refresh
        window.dispatchEvent(new Event("workoutLogged"));
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.message || "Couldn't log that workout. Please try again.");
      }
    } catch (error) {
      console.error("Error logging workout:", error);
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSavingWorkout(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar overlay */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
      />

      <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r bg-sidebar text-sidebar-foreground shadow-[var(--shadow-soft)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
        <nav className="flex-1 overflow-y-auto px-3 py-2">
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

          {/* HISTORY Section */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-2">
              History
            </div>
            {NAV_HISTORY.map((n) => {
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
        <div className="border-t p-3">
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
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/meal-history"
            aria-label="Meal history"
            title="Meal history"
            className="hidden h-10 w-10 place-items-center rounded-lg hover:bg-muted sm:grid"
            activeProps={{ className: "bg-muted text-primary" }}
          >
            <History className="h-5 w-5" />
          </Link>
          <Link
            to="/workout-history"
            aria-label="Workout history"
            title="Workout history"
            className="hidden h-10 w-10 place-items-center rounded-lg hover:bg-muted sm:grid"
            activeProps={{ className: "bg-muted text-primary" }}
          >
            <Activity className="h-5 w-5" />
          </Link>

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
                    min={1}
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
        {/* Keyed by path so every page change gets the same enter transition */}
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
