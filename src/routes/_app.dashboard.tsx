import { createFileRoute } from "@tanstack/react-router";
import { useProfile } from "@/hooks/useProfile";
import { Activity, Footprints, Moon, Flame, AlertCircle, Zap, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { PlanStatusCard } from "@/components/PlanStatusCard";
import * as SliderPrimitive from "@radix-ui/react-slider";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

// ── Active Plan Card Component ──────────────────────────────────────────────
function ActivePlanCard() {
  const [activePlan, setActivePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivePlan();
  }, []);

  async function loadActivePlan() {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE_URL}/plans?status=active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.plans && data.plans.length > 0) {
          setActivePlan(data.plans[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load active plan:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!activePlan) {
    return null;
  }

  return (
    <PlanStatusCard
      planName={activePlan.name}
      progress={{
        workoutsCompleted: activePlan.progress?.workoutsCompleted || 0,
        mealsLogged: activePlan.progress?.mealsLogged || 0,
        scheduleAdherence: activePlan.progress?.scheduleAdherence || 0,
        lastUpdated: activePlan.progress?.lastUpdated || new Date().toISOString(),
        totalWorkoutSuggestions: activePlan.suggestions?.workouts?.length || 0,
        totalMealSuggestions: activePlan.suggestions?.meals?.length || 0,
        totalScheduleItems: activePlan.suggestions?.schedule?.length || 0
      }}
    />
  );
}

// ── Steps Card Component ─────────────────────────────────────────────────────
// REMOVED - No longer needed

// ── Mini Map Preview Component ───────────────────────────────────────────────
// REMOVED - No longer needed

// ── Cycle Phase Card Component ───────────────────────────────────────────────
// REMOVED - No longer needed

// ── Cycle-Aware Suggestions Component ────────────────────────────────────────
// REMOVED - No longer needed

function Dashboard() {
  const { profile } = useProfile();
  const [readinessScore, setReadinessScore] = useState(0);
  const [wellnessBreakdown, setWellnessBreakdown] = useState({
    nutrition: 0,
    physical: 0,
    sleep: 0,
    mental: 0
  });
  const [wellnessBalance, setWellnessBalance] = useState({
    physical: 0,
    sleep: 0,
    mental: 0,
    nutrition: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<"bfs" | "astar">("bfs");
  const [goalNutrition, setGoalNutrition] = useState(80);
  const [goalPhysical, setGoalPhysical] = useState(75);
  const [goalSleep, setGoalSleep] = useState(85);
  const [goalMental, setGoalMental] = useState(70);
  const [recommendedPath, setRecommendedPath] = useState<any[]>([]);
  const first = profile?.name?.split(" ")[0] ?? "there";

  useEffect(() => {
    loadWellnessData();
  }, []);

  async function loadWellnessData() {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      // Fetch readiness score and breakdown
      const scoreRes = await fetch(`${API_BASE_URL}/wellness/readiness-score`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setReadinessScore(scoreData.readinessScore);
        setWellnessBreakdown(scoreData.breakdown);
      }

      // Fetch wellness balance
      const balanceRes = await fetch(`${API_BASE_URL}/wellness/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setWellnessBalance(balanceData);
      }

      // Generate recommended wellness path
      generateWellnessPath();
    } catch (err) {
      console.error("Failed to load wellness data:", err);
    } finally {
      setLoading(false);
    }
  }

  function generateWellnessPath() {
    // Generate a recommended wellness path based on current state and goals
    const paths = {
      bfs: [
        { step: 1, title: "Morning Hydration", description: "Start with 500ml water", effort: "Easy", points: 10 },
        { step: 2, title: "Light Stretching", description: "5-minute mobility routine", effort: "Easy", points: 15 },
        { step: 3, title: "Healthy Breakfast", description: "Protein + whole grains", effort: "Medium", points: 20 },
        { step: 4, title: "30-min Workout", description: "Cardio or strength training", effort: "Medium", points: 30 },
        { step: 5, title: "Mindful Break", description: "2-minute breathing exercise", effort: "Easy", points: 15 },
        { step: 6, title: "Balanced Lunch", description: "Vegetables + lean protein", effort: "Medium", points: 20 },
      ],
      astar: [
        { step: 1, title: "Priority: Sleep Schedule", description: "Set consistent bedtime", effort: "Easy", points: 25 },
        { step: 2, title: "Nutrition Foundation", description: "Plan 3 balanced meals", effort: "Medium", points: 30 },
        { step: 3, title: "Mental Wellness", description: "10-minute meditation", effort: "Medium", points: 25 },
        { step: 4, title: "Physical Activity", description: "45-min focused workout", effort: "Hard", points: 40 },
        { step: 5, title: "Recovery & Reflection", description: "Journal + stretching", effort: "Medium", points: 20 },
      ]
    };
    setRecommendedPath(paths[selectedAlgorithm]);
  }

  useEffect(() => {
    generateWellnessPath();
  }, [selectedAlgorithm]);

  // Listen for meal and workout logging events to refresh scores
  useEffect(() => {
    const handleRefresh = () => loadWellnessData();
    window.addEventListener('mealLogged', handleRefresh);
    window.addEventListener('workoutLogged', handleRefresh);
    window.addEventListener('sleepLogged', handleRefresh);

    return () => {
      window.removeEventListener('mealLogged', handleRefresh);
      window.removeEventListener('workoutLogged', handleRefresh);
      window.removeEventListener('sleepLogged', handleRefresh);
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Hi, {first} 👋</h1>
        <p className="text-sm text-muted-foreground">Here's your wellness snapshot for today.</p>
      </div>

      {/* ISSUE 1: Replace error banner with warm amber info message */}
      <div className="rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900 dark:text-amber-100">Your wellness data is loading</p>
          <p className="text-sm text-amber-800 dark:text-amber-200">Set your goals below to get started on your personalized wellness journey.</p>
        </div>
      </div>

      {/* Active Plan */}
      <ActivePlanCard />

      {/* ISSUE 3: Replace spinner with progress bars showing current wellness metrics */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-amber-50 dark:from-teal-950/30 dark:to-amber-950/30 p-6 shadow-[var(--shadow-neumorphic)]">
        <div className="mb-6">
          <div className="text-sm font-semibold text-foreground">Current Wellness State</div>
          <p className="text-xs text-muted-foreground">Your wellness metrics across key areas</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WellnessMetricBar icon={Footprints} label="Nutrition" current={wellnessBreakdown.nutrition} color="bg-green-500" />
          <WellnessMetricBar icon={Activity} label="Physical" current={wellnessBreakdown.physical} color="bg-blue-500" />
          <WellnessMetricBar icon={Moon} label="Sleep" current={wellnessBreakdown.sleep} color="bg-purple-500" />
          <WellnessMetricBar icon={Flame} label="Mental" current={wellnessBreakdown.mental} color="bg-orange-500" />
        </div>
      </div>

      {/* ISSUE 4: Replace plain inputs with sliders showing current vs goal */}
      <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
        <div className="mb-6">
          <div className="text-sm font-semibold">Goal State</div>
          <p className="text-xs text-muted-foreground">Set your wellness targets</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <GoalSlider label="Nutrition" current={wellnessBreakdown.nutrition} goal={goalNutrition} onChange={setGoalNutrition} icon={Footprints} />
          <GoalSlider label="Physical" current={wellnessBreakdown.physical} goal={goalPhysical} onChange={setGoalPhysical} icon={Activity} />
          <GoalSlider label="Sleep" current={wellnessBreakdown.sleep} goal={goalSleep} onChange={setGoalSleep} icon={Moon} />
          <GoalSlider label="Mental" current={wellnessBreakdown.mental} goal={goalMental} onChange={setGoalMental} icon={Flame} />
        </div>
      </div>

      {/* ISSUE 5: Replace radio buttons with selectable algorithm cards */}
      <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
        <div className="mb-6">
          <div className="text-sm font-semibold">Wellness Path Finder</div>
          <p className="text-xs text-muted-foreground">Choose your optimization strategy</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <AlgorithmCard
            selected={selectedAlgorithm === "bfs"}
            onClick={() => setSelectedAlgorithm("bfs")}
            title="Fastest Route"
            subtitle="BFS Algorithm"
            description="Quick wins first. Build momentum with easy wins to stay motivated."
            icon={Zap}
          />
          <AlgorithmCard
            selected={selectedAlgorithm === "astar"}
            onClick={() => setSelectedAlgorithm("astar")}
            title="Most Efficient"
            subtitle="A* Algorithm"
            description="Optimized path. Focus on high-impact activities for maximum results."
            icon={CheckCircle2}
          />
        </div>
      </div>

      {/* Recommended Wellness Path */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-950/30 dark:to-blue-950/30 p-6 shadow-[var(--shadow-neumorphic)]">
        <div className="mb-6">
          <div className="text-sm font-semibold">Recommended Wellness Path</div>
          <p className="text-xs text-muted-foreground">Step-by-step guidance to reach your goals</p>
        </div>
        <div className="space-y-3">
          {recommendedPath.map((item, idx) => (
            <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-teal-200 dark:border-teal-800">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-semibold text-sm">
                {item.step}
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">{item.title}</div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    item.effort === "Easy" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                    item.effort === "Medium" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
                    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  }`}>
                    {item.effort}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium">
                    +{item.points} pts
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness + balance */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)] lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Readiness Score</div>
              <div className="mt-1 font-display text-5xl font-bold text-primary">{readinessScore}</div>
              <div className="mt-1 text-sm text-muted-foreground">Based on your daily logs and activities.</div>
            </div>
            <div className="hidden md:block">
              <RingScore value={readinessScore} />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric icon={Footprints} label="Nutrition" value={(wellnessBreakdown.nutrition ?? 0).toString()} trend={(wellnessBreakdown.nutrition ?? 0) > 0 ? "✓" : "—"} />
            <Metric icon={Activity} label="Physical" value={(wellnessBreakdown.physical ?? 0).toString()} trend={(wellnessBreakdown.physical ?? 0) > 0 ? "✓" : "—"} />
            <Metric icon={Moon} label="Sleep" value={(wellnessBreakdown.sleep ?? 0).toString()} trend={(wellnessBreakdown.sleep ?? 0) > 0 ? "✓" : "—"} />
            <Metric icon={Flame} label="Mental" value={(wellnessBreakdown.mental ?? 0).toString()} trend={(wellnessBreakdown.mental ?? 0) > 0 ? "✓" : "—"} />
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
          <div className="text-sm font-semibold">Wellness Balance</div>
          <DonutBalance segments={[
            { label: "Physical", value: wellnessBalance.physical, color: "var(--chart-1)" },
            { label: "Sleep", value: wellnessBalance.sleep, color: "var(--chart-2)" },
            { label: "Mental", value: wellnessBalance.mental, color: "var(--chart-3)" },
            { label: "Nutrition", value: wellnessBalance.nutrition, color: "var(--chart-4)" },
          ]} />
        </div>
      </div>

      {/* Goal progress */}
      <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Weight goal</div>
            <div className="text-xs text-muted-foreground">
              {profile?.weight_kg ?? "—"} kg → {profile?.desired_weight_kg ?? "—"} kg
            </div>
          </div>
          <span className="font-display text-xl font-bold text-primary">{profile?.weight_kg && profile?.desired_weight_kg ? Math.round(((profile.weight_kg - profile.desired_weight_kg) / (profile.weight_kg)) * 100) : 0}%</span>
        </div>
        <Progress value={profile?.weight_kg && profile?.desired_weight_kg ? Math.round(((profile.weight_kg - profile.desired_weight_kg) / (profile.weight_kg)) * 100) : 0} className="mt-3 h-2" />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, trend, negative }: { icon: any; label: string; value: string; trend: string; negative?: boolean }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3 shadow-[var(--shadow-neumorphic-inset-sm)]">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className={negative ? "text-destructive" : "text-success"}>{trend}</span>
      </div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function RingScore({ value }: { value: number }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <svg width="120" height="120" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} stroke="var(--muted)" strokeWidth="10" fill="none" />
      <circle cx="50" cy="50" r={r} stroke="var(--primary)" strokeWidth="10" fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * value) / 100}
        transform="rotate(-90 50 50)" />
    </svg>
  );
}

function DonutBalance({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
  let offset = 0;
  const r = 35, c = 2 * Math.PI * r;
  return (
    <div className="mt-3 flex items-center gap-4">
      <svg width="110" height="110" viewBox="0 0 100 100">
        {segments.map((s, i) => {
          const dash = (c * s.value) / 100;
          const el = (
            <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="space-y-1.5 text-xs">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label} <span className="text-muted-foreground">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Wellness Metric Bar Component ──────────────────────────────────────────
function WellnessMetricBar({ icon: Icon, label, current, color }: { icon: any; label: string; current: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold text-foreground">{current}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${current}%` }} />
      </div>
    </div>
  );
}

// ── Goal Slider Component ──────────────────────────────────────────────────
function GoalSlider({ label, current, goal, onChange, icon: Icon }: { label: string; current: number; goal: number; onChange: (v: number) => void; icon: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="text-sm font-bold">
          <span className="text-muted-foreground">{current}</span>
          <span className="text-muted-foreground mx-1">→</span>
          <span className="text-teal-600 dark:text-teal-400">{goal}</span>
        </div>
      </div>
      <SliderPrimitive.Root
        value={[goal]}
        onValueChange={(v) => onChange(v[0])}
        min={0}
        max={100}
        step={1}
        className="relative flex w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-teal-500" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-teal-500 bg-white dark:bg-slate-900 shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </div>
  );
}

// ── Algorithm Card Component ───────────────────────────────────────────────
function AlgorithmCard({ selected, onClick, title, subtitle, description, icon: Icon }: { selected: boolean; onClick: () => void; title: string; subtitle: string; description: string; icon: any }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 transition-all text-left ${
        selected
          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30"
          : "border-muted bg-muted/30 hover:border-teal-300 dark:hover:border-teal-700"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <Icon className={`h-5 w-5 flex-shrink-0 ${selected ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"}`} />
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}
