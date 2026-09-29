'use client';

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { WORKOUTS, type Workout, EXERCISE_LIBRARY } from "@/lib/library";
import { Dumbbell, Clock, Flame, Play, Pause, SkipForward, X, Check, Youtube, Footprints, MapPin, Timer, Square, Plus, Trash2, Edit2, Bookmark, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

// Lazy import Leaflet components to avoid SSR errors
let MapContainer: any = null;
let TileLayer: any = null;
let Polyline: any = null;
let Marker: any = null;
let L: any = null;

const initLeaflet = async () => {
  if (typeof window === "undefined") return;
  if (MapContainer) return; // Already initialized
  
  try {
    const reactLeaflet = await import("react-leaflet");
    MapContainer = reactLeaflet.MapContainer;
    TileLayer = reactLeaflet.TileLayer;
    Polyline = reactLeaflet.Polyline;
    Marker = reactLeaflet.Marker;
    
    L = (await import("leaflet")).default;
    
    // Fix Leaflet's broken default icon paths
    const markerIcon = (await import("leaflet/dist/images/marker-icon.png")).default;
    const markerIcon2x = (await import("leaflet/dist/images/marker-icon-2x.png")).default;
    const markerShadow = (await import("leaflet/dist/images/marker-shadow.png")).default;
    
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });
  } catch (error) {
    console.error("Failed to initialize Leaflet:", error);
  }
};

export const Route = createFileRoute("/_app/workouts")({
  component: WorkoutsPage,
  validateSearch: (search: Record<string, any>) => ({
    scrollTo: search.scrollTo as string | undefined,
  }),
});

const CATEGORIES = ["All", "Pilates", "HIIT", "Yoga", "Strength", "Calisthenics"] as const;

// ── Route Tracker Types & Helpers ────────────────────────────────────────────
type Coord = [number, number];
type TrackingState = "idle" | "running" | "paused";

const STEPS_PER_KM = 1300;
const CALORIES_PER_KM = 60;

function haversineMetres(a: Coord, b: Coord): number {
  const R = 6_371_000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinDLat * sinDLat +
          Math.cos((a[0] * Math.PI) / 180) *
            Math.cos((b[0] * Math.PI) / 180) *
            sinDLng * sinDLng
      )
    );
  return R * c;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── Map follower — keeps map centred on user ─────────────────────────────────
function MapFollower({ center }: { center: Coord }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

// ── Small stat card used inside RouteTracker ─────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-card px-4 py-3 text-center shadow-[var(--shadow-neumorphic-sm)]">
      <div className="text-orange-500">{icon}</div>
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Personal Stats Card ──────────────────────────────────────────────────────
function PersonalStatsCard() {
  const [stats, setStats] = useState({ workoutsThisWeek: 0, kcalBurned: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      
      // Fetch workouts from this week
      const res = await fetch(`${API_BASE_URL}/workouts?days=7`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const workouts = await res.json();
        const totalKcal = workouts.reduce((sum: number, w: any) => sum + (w.calories_burned || 0), 0);
        
        setStats({
          workoutsThisWeek: workouts.length,
          kcalBurned: totalKcal,
          streak: 3 // Placeholder - would need backend support for actual streak
        });
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 shadow-[var(--shadow-neumorphic-sm)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-300">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">This Week</span>
        </div>
        <div className="font-display text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.workoutsThisWeek}</div>
        <div className="text-xs text-blue-700 dark:text-blue-300">workouts completed</div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 shadow-[var(--shadow-neumorphic-sm)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-200 dark:bg-orange-800 text-orange-600 dark:text-orange-300">
            <Flame className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">Energy</span>
        </div>
        <div className="font-display text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.kcalBurned}</div>
        <div className="text-xs text-orange-700 dark:text-orange-300">kcal burned</div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 shadow-[var(--shadow-neumorphic-sm)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-200 dark:bg-red-800 text-red-600 dark:text-red-300">
            <TrendingUp className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-red-700 dark:text-red-300">Streak</span>
        </div>
        <div className="font-display text-2xl font-bold text-red-900 dark:text-red-100">{stats.streak}</div>
        <div className="text-xs text-red-700 dark:text-red-300">day streak</div>
      </div>
    </div>
  );
}

// ── Route Tracker Widget ─────────────────────────────────────────────────────
function RouteTracker() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    initLeaflet();
  }, []);
  
  // Only render on client-side
  if (!isClient) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  }
  
  if (!MapContainer || !TileLayer || !Polyline || !Marker) {
    return <div className="h-96 rounded-lg bg-muted" />;
  }
  
  return <RouteTrackerContent />;
}

function RouteTrackerContent() {
  const [state, setState] = useState<TrackingState>("idle");
  const [route, setRoute] = useState<Coord[]>([]);
  const [currentPos, setCurrentPos] = useState<Coord | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activityType, setActivityType] = useState<"Run" | "Walk" | "Cycle">("Run");
  const [distanceGoal, setDistanceGoal] = useState<number>(3);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCoordRef = useRef<Coord | null>(null);
  const accDistRef = useRef(0);
  const startPosRef = useRef<Coord | null>(null);

  const steps = Math.round(distanceKm * STEPS_PER_KM);
  const calories = Math.round(distanceKm * CALORIES_PER_KM);
  const paceStr =
    distanceKm > 0.05 && elapsed > 0
      ? (() => {
          const secPerKm = elapsed / distanceKm;
          return `${Math.floor(secPerKm / 60)}'${String(Math.round(secPerKm % 60)).padStart(2, "0")}"`;
        })()
      : "--'--\"";

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: Coord = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPos(coord);
        
        // Store start position
        if (!startPosRef.current) {
          startPosRef.current = coord;
        }
        
        if (lastCoordRef.current) {
          const d = haversineMetres(lastCoordRef.current, coord);
          if (d > 3) {
            accDistRef.current += d / 1000;
            setDistanceKm(parseFloat(accDistRef.current.toFixed(3)));
            setRoute((prev) => [...prev, coord]);
            lastCoordRef.current = coord;
          }
        } else {
          lastCoordRef.current = coord;
          setRoute([coord]);
        }
      },
      (err) => setError(`GPS error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10_000 }
    );
  }, []);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const saveWorkout = useCallback(async () => {
    if (distanceKm < 0.1) {
      setError("Workout distance must be at least 0.1 km");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const paceStr = distanceKm > 0.05 && elapsed > 0
        ? (() => {
            const secPerKm = elapsed / distanceKm;
            return `${Math.floor(secPerKm / 60)}'${String(Math.round(secPerKm % 60)).padStart(2, "0")}"`;
          })()
        : "--'--\"";

      const response = await fetch("/api/workouts/gps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `GPS ${activityType}`,
          duration_minutes: Math.round(elapsed / 60),
          distanceKm: parseFloat(distanceKm.toFixed(3)),
          steps: Math.round(distanceKm * STEPS_PER_KM),
          pace: paceStr,
          calories_burned: Math.round(distanceKm * CALORIES_PER_KM),
          route,
          startLocation: startPosRef.current ? { lat: startPosRef.current[0], lng: startPosRef.current[1] } : null,
          endLocation: currentPos ? { lat: currentPos[0], lng: currentPos[1] } : null,
          notes: `GPS tracked ${activityType.toLowerCase()} - ${new Date().toLocaleString()}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save workout");
      }

      const data = await response.json();
      console.log("Workout saved:", data);
      
      // Reset after successful save
      handleStop();
      setError(null);
      alert("✅ Workout saved successfully!");
    } catch (err) {
      setError(`Error saving workout: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  }, [distanceKm, elapsed, route, currentPos, activityType]);

  function handleStart() {
    setError(null);
    setState("running");
    startWatch();
    startTimer();
  }

  function handlePause() {
    setState("paused");
    stopWatch();
    stopTimer();
  }

  function handleResume() {
    setState("running");
    startWatch();
    startTimer();
  }

  function handleStop() {
    stopWatch();
    stopTimer();
    setState("idle");
    setRoute([]);
    setCurrentPos(null);
    setDistanceKm(0);
    setElapsed(0);
    accDistRef.current = 0;
    lastCoordRef.current = null;
    startPosRef.current = null;
  }

  useEffect(() => () => { stopWatch(); stopTimer(); }, [stopWatch, stopTimer]);

  const mapCenter: Coord = currentPos ?? [33.6844, 73.0479];
  const routeOptions = { color: "#f97316", weight: 5, opacity: 0.85 };
  const goalReached = distanceKm >= distanceGoal;

  return (
    <div className="rounded-3xl bg-card shadow-[var(--shadow-neumorphic)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-orange-500">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Route Tracker</h3>
            <p className="text-xs text-muted-foreground">Live GPS · Steps · Calories</p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            state === "running"
              ? "bg-green-100 text-green-700"
              : state === "paused"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {state === "running" ? "● Tracking" : state === "paused" ? "⏸ Paused" : "Idle"}
        </span>
      </div>

      {/* Activity Type & Distance Goal */}
      {state === "idle" && (
        <div className="px-5 py-4 border-b space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Activity Type</label>
            <div className="flex gap-2">
              {(["Run", "Walk", "Cycle"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActivityType(type)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    activityType === type
                      ? "bg-[#2cc9a8] text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Distance Goal</label>
            <div className="flex gap-2">
              {[1, 3, 5].map((km) => (
                <button
                  key={km}
                  onClick={() => setDistanceGoal(km)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    distanceGoal === km
                      ? "bg-[#2cc9a8] text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {km}km
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-56 w-full">
        <MapContainer
          center={mapCenter}
          zoom={16}
          scrollWheelZoom={false}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {route.length > 1 && <Polyline positions={route} pathOptions={routeOptions} />}
          {currentPos && <Marker position={currentPos} />}
          {currentPos && <MapFollower center={currentPos} />}
        </MapContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 py-4">
        <StatCard icon={<Footprints className="h-4 w-4" />} label="Steps" value={steps.toLocaleString()} />
        <StatCard icon={<MapPin className="h-4 w-4" />} label="km" value={distanceKm.toFixed(2)} />
        <StatCard icon={<Flame className="h-4 w-4" />} label="kcal" value={String(calories)} />
        <StatCard icon={<Timer className="h-4 w-4" />} label="Time" value={formatTime(elapsed)} />
      </div>

      {/* Goal Progress */}
      {state !== "idle" && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-950 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Goal: {distanceGoal}km</span>
          <span className={`font-bold ${goalReached ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
            {distanceKm.toFixed(2)}/{distanceGoal}km {goalReached && "✓"}
          </span>
        </div>
      )}

      {/* Pace */}
      {state !== "idle" && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl bg-orange-50 dark:bg-orange-950 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Current pace</span>
          <span className="font-bold text-orange-500 dark:text-orange-400">{paceStr} /km</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mx-4 mb-3 rounded-xl bg-red-50 dark:bg-red-950 px-4 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Controls */}
      <div className="flex gap-2 px-4 pb-4">
        {state === "idle" && distanceKm > 0 && (
          <>
            <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={saveWorkout} disabled={isSaving}>
              <Check className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Workout"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleStop}>
              Clear
            </Button>
          </>
        )}
        {state === "idle" && distanceKm === 0 && (
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleStart}>
            <Play className="mr-2 h-4 w-4" /> Start {activityType}
          </Button>
        )}
        {state === "running" && (
          <>
            <Button variant="outline" className="flex-1" onClick={handlePause}>
              <Pause className="mr-2 h-4 w-4" /> Pause
            </Button>
            <Button variant="destructive" onClick={handleStop}>
              <Square className="h-4 w-4" />
            </Button>
          </>
        )}
        {state === "paused" && (
          <>
            <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleResume}>
              <Play className="mr-2 h-4 w-4" /> Resume
            </Button>
            <Button variant="destructive" onClick={handleStop}>
              <Square className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Workouts Page ────────────────────────────────────────────────────────────
function PhaseRecommendedWorkouts({ onStartWorkout }: { onStartWorkout?: (workout: Workout) => void }) {
  const { profile } = useProfile();
  const [phase, setPhase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhase();
  }, []);

  async function loadPhase() {
    try {
      if (!profile?.gender || profile.gender !== "female") {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const cycleRes = await fetch(`${API_BASE_URL}/cycle?days=720`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!cycleRes.ok) {
        setLoading(false);
        return;
      }

      const logs = await cycleRes.json();
      if (logs.length === 0) {
        setLoading(false);
        return;
      }

      const cycleLen = profile?.cycle_length_days ?? 28;
      const periodLen = profile?.period_length_days ?? 5;
      const lastLog = logs[0];
      const lastPeriodDate = new Date(lastLog.date ? new Date(lastLog.date).toISOString().slice(0, 10) : lastLog.start_date);
      const today = new Date(new Date().toISOString().slice(0, 10));

      const diff = Math.floor((today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24));
      const day = ((diff % cycleLen) + cycleLen) % cycleLen + 1;

      let currentPhase = "Follicular";
      if (day <= periodLen) currentPhase = "Menstrual";
      else if (day >= cycleLen - 16 && day <= cycleLen - 12) currentPhase = "Ovulation";
      else if (day > cycleLen - 12) currentPhase = "Luteal";

      setPhase(currentPhase);
    } catch (err) {
      console.error("Failed to load phase:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!profile?.gender || profile.gender !== "female" || loading || !phase) {
    return null;
  }

  // Filter workouts by phase-appropriate intensity
  let recommendedWorkouts: Workout[] = [];
  
  if (phase === "Menstrual") {
    // Low intensity: Yoga, Pilates
    recommendedWorkouts = WORKOUTS.filter(w => 
      (w.category === "Yoga" || w.category === "Pilates") && w.level === "Beginner"
    ).slice(0, 3);
  } else if (phase === "Follicular" || phase === "Luteal") {
    // Moderate intensity: Strength, Pilates
    recommendedWorkouts = WORKOUTS.filter(w => 
      (w.category === "Strength" || w.category === "Pilates") && 
      (w.level === "Beginner" || w.level === "Intermediate")
    ).slice(0, 3);
  } else if (phase === "Ovulation") {
    // High intensity: HIIT, Calisthenics
    recommendedWorkouts = WORKOUTS.filter(w => 
      (w.category === "HIIT" || w.category === "Calisthenics") && 
      (w.level === "Intermediate" || w.level === "Advanced")
    ).slice(0, 3);
  }

  if (recommendedWorkouts.length === 0) {
    return null;
  }

  const phaseColors: Record<string, string> = {
    Menstrual: "bg-red-100 text-red-700",
    Follicular: "bg-green-100 text-green-700",
    Ovulation: "bg-yellow-100 text-yellow-700",
    Luteal: "bg-purple-100 text-purple-700"
  };

  const phaseIntensity: Record<string, string> = {
    Menstrual: "Low intensity",
    Follicular: "Moderate intensity",
    Ovulation: "High intensity",
    Luteal: "Moderate intensity"
  };

  return (
    <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
      <div className="flex items-center gap-2 mb-4">
        <div className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${phaseColors[phase] || "bg-gray-100"}`}>
          {phase}
        </div>
        <h2 className="font-display text-lg font-bold">Recommended for your phase</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{phaseIntensity[phase]} workouts are ideal during your {phase} phase.</p>
      
      <div className="grid gap-4 md:grid-cols-3">
        {recommendedWorkouts.map(w => (
          <article key={w.key} className="flex flex-col overflow-hidden rounded-2xl bg-background shadow-[var(--shadow-neumorphic-inset-sm)]">
            <div className="relative h-32 w-full overflow-hidden bg-muted">
              <img src={w.image} alt={w.name} loading="lazy" className="h-full w-full object-cover" />
              <Badge className={`absolute right-2 top-2 ${
                w.level === "Beginner" ? "bg-green-500 hover:bg-green-600 text-white" :
                w.level === "Intermediate" ? "bg-amber-500 hover:bg-amber-600 text-white" :
                "bg-red-500 hover:bg-red-600 text-white"
              }`}>{w.level}</Badge>
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h3 className="font-semibold text-sm">{w.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{w.category}</p>
              <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                <span>{w.durationMin} min</span>
                <span>·</span>
                <span>{w.caloriesEstimate} kcal</span>
              </div>
              <Button size="sm" className="mt-3 w-full" onClick={() => onStartWorkout?.(w)}>Start</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function WorkoutsPage() {
  const { scrollTo } = Route.useSearch();
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  const [active, setActive] = useState<Workout | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [recentlyWatched, setRecentlyWatched] = useState<string[]>([]);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const routeTrackerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsClient(true);
    initLeaflet();
    // Load recently watched from localStorage
    const stored = localStorage.getItem("recentlyWatched");
    if (stored) {
      try {
        setRecentlyWatched(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recently watched:", e);
      }
    }
  }, []);

  // Handle scrollTo query param
  useEffect(() => {
    if (scrollTo === "route-tracker" && routeTrackerRef.current) {
      setTimeout(() => {
        routeTrackerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [scrollTo]);
  
  const list = useMemo(() => filter === "All" ? WORKOUTS : WORKOUTS.filter(w => w.category === filter), [filter]);
  
  const recentWorkouts = useMemo(() => {
    return recentlyWatched
      .map(key => WORKOUTS.find(w => w.key === key))
      .filter((w): w is Workout => w !== undefined)
      .slice(0, 3);
  }, [recentlyWatched]);

  const handleWatchVideo = (workoutKey: string) => {
    // Update recently watched
    const updated = [workoutKey, ...recentlyWatched.filter(k => k !== workoutKey)].slice(0, 3);
    setRecentlyWatched(updated);
    localStorage.setItem("recentlyWatched", JSON.stringify(updated));
  };

  if (active) return <SessionPlayer workout={active} onExit={() => setActive(null)} />;
  if (showCustomBuilder) return <CustomWorkoutBuilder onExit={() => setShowCustomBuilder(false)} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Workouts</h1>
        <p className="text-sm text-muted-foreground">Start doing personalized suggested workout</p>
      </div>

      {/* Personal Stats */}
      <PersonalStatsCard />

      {/* ── Route Tracker widget ── */}
      <div ref={routeTrackerRef}>
        <RouteTracker />
      </div>

      {/* Recently Watched Section */}
      {recentWorkouts.length > 0 && (
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
          <h2 className="font-display text-lg font-bold mb-4">Recently Watched</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {recentWorkouts.map(w => (
              <article key={w.key} className="rounded-2xl bg-background p-3 shadow-[var(--shadow-neumorphic-inset-sm)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{w.name}</h3>
                    <p className="text-xs text-muted-foreground">{w.category} · {w.level}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button className="flex-1" size="sm" onClick={() => setActive(w)}>Start</Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={w.youtubeUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleWatchVideo(w.key)}>Watch</a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${filter === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Recommended for your phase section */}
      <PhaseRecommendedWorkouts onStartWorkout={setActive} />

      <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Featured workout videos</h2>
            <p className="text-sm text-muted-foreground mt-1">Follow guided video routines for strength, mobility, and recovery.</p>
          </div>
          <Button className="max-w-max bg-[#2cc9a8] text-white hover:bg-[#2cc9a8]/90">Browse all routines</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {WORKOUTS.slice(0, 3).map(w => (
            <article key={w.key} className="rounded-3xl bg-background p-4 shadow-[var(--shadow-neumorphic-inset-sm)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{w.name}</h3>
                  <p className="text-xs text-muted-foreground">{w.category} · {w.level}</p>
                </div>
                <Badge variant="secondary" className={`${
                  w.level === "Beginner" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                  w.level === "Intermediate" ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" :
                  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}>{w.level}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{w.description}</p>
              <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{w.durationMin} min</span>
                <span>{w.caloriesEstimate} kcal</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" size="sm" onClick={() => setActive(w)}>Start</Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={w.youtubeUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleWatchVideo(w.key)}>Watch</a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map(w => (
          <article key={w.key} className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-neumorphic)]">
            <div className="relative h-40 w-full overflow-hidden bg-muted">
              <img src={w.image} alt={w.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
              <Badge className={`absolute right-3 top-3 ${
                w.level === "Beginner" ? "bg-green-500 hover:bg-green-600 text-white" :
                w.level === "Intermediate" ? "bg-amber-500 hover:bg-amber-600 text-white" :
                "bg-red-500 hover:bg-red-600 text-white"
              }`}>{w.level}</Badge>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{w.category}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold">{w.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{w.description}</p>
              <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{w.durationMin} min</span>
                <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" />{w.caloriesEstimate} kcal</span>
                <span>{w.exercises.length} moves</span>
              </div>
              <div className="mt-5 flex gap-2">
                <Button className="flex-1" onClick={() => setActive(w)}>Start</Button>
                <Button variant="outline" size="icon" title="Save workout">
                  <Bookmark className="h-4 w-4" />
                </Button>
                <Button variant="outline" asChild>
                  <a href={w.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="Watch tutorial on YouTube" onClick={() => handleWatchVideo(w.key)}>
                    <Youtube className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-dashed bg-card/50 p-6 text-center">
        <h3 className="font-display text-lg font-bold">Build your own</h3>
        <p className="mt-1 text-sm text-muted-foreground">Create custom workouts tailored to your fitness goals.</p>
        <Button className="mt-4" onClick={() => setShowCustomBuilder(true)}>Start Building</Button>
      </div>
    </div>
  );
}

// ── Custom Workout Builder ──────────────────────────────────────────────────
type CustomExercise = { name: string; sets: number; reps: number; durationSec: number; restSec: number };

function CustomWorkoutBuilder({ onExit }: { onExit: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState("");
  const [category, setCategory] = useState<"Pilates" | "HIIT" | "Yoga" | "Strength" | "Calisthenics">("Strength");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [exercises, setExercises] = useState<CustomExercise[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [myWorkouts, setMyWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCustomWorkout, setActiveCustomWorkout] = useState<Workout | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadMyWorkouts();
  }, []);

  async function loadMyWorkouts() {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE_URL}/workouts/custom`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyWorkouts(data);
      }
    } catch (err) {
      console.error("Failed to load workouts:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter(ex =>
      ex.category === category &&
      (ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       ex.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, category]);

  function addExercise(exerciseName: string) {
    const newExercise: CustomExercise = {
      name: exerciseName,
      sets: 3,
      reps: 10,
      durationSec: 60,
      restSec: 30
    };
    setExercises([...exercises, newExercise]);
    setSearchTerm("");
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function updateExercise(index: number, field: keyof CustomExercise, value: any) {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  }

  async function saveWorkout() {
    if (!workoutName.trim()) {
      toast.error("Please enter a workout name");
      return;
    }
    if (exercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId ? `/workouts/custom/${editingId}` : "/workouts/custom";

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: workoutName,
          category,
          difficulty,
          exercises: exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            durationSec: ex.durationSec,
            restSec: ex.restSec
          }))
        })
      });

      if (!res.ok) throw new Error("Failed to save workout");
      toast.success(editingId ? "Workout updated!" : "Workout saved!");
      setWorkoutName("");
      setExercises([]);
      setEditingId(null);
      loadMyWorkouts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save workout");
    }
  }

  async function deleteWorkout(id: string) {
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE_URL}/workouts/custom/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Workout deleted");
      setDeleteConfirmId(null);
      loadMyWorkouts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  }

  function startCustomWorkout(customWorkout: any) {
    // Convert custom workout to Workout format for SessionPlayer
    const workoutForPlayer: Workout = {
      key: customWorkout._id,
      name: customWorkout.name,
      category: customWorkout.category,
      level: customWorkout.difficulty,
      durationMin: Math.ceil(
        customWorkout.exercises.reduce((total: number, ex: any) => {
          return total + ex.durationSec + (ex.restSec || 0);
        }, 0) / 60
      ),
      caloriesEstimate: Math.round(customWorkout.exercises.length * 10), // Rough estimate
      description: `Custom workout with ${customWorkout.exercises.length} exercises`,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=70",
      youtubeUrl: "",
      exercises: customWorkout.exercises.map((ex: any) => ({
        name: ex.name,
        durationSec: ex.durationSec,
        rest: ex.restSec,
        cue: undefined
      }))
    };
    setActiveCustomWorkout(workoutForPlayer);
  }

  if (activeCustomWorkout) {
    return <SessionPlayer workout={activeCustomWorkout} onExit={() => setActiveCustomWorkout(null)} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Build Your Workout</h1>
        <Button variant="outline" onClick={onExit}><X className="h-4 w-4" /></Button>
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)] space-y-4">
        <div>
          <label className="text-sm font-medium">Workout Name</label>
          <Input
            placeholder="e.g., Monday Upper Body"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option>Pilates</option>
              <option>HIIT</option>
              <option>Yoga</option>
              <option>Strength</option>
              <option>Calisthenics</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Search & Add Exercises</label>
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
          {searchTerm && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border bg-background p-2 space-y-1">
              {filteredExercises.map(ex => (
                <button
                  key={ex.name}
                  onClick={() => addExercise(ex.name)}
                  className="w-full text-left rounded px-3 py-2 text-sm hover:bg-muted"
                >
                  <div className="font-medium">{ex.name}</div>
                  <div className="text-xs text-muted-foreground">{ex.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {exercises.length > 0 && (
          <div>
            <label className="text-sm font-medium">Exercises</label>
            <div className="mt-2 space-y-3">
              {exercises.map((ex, idx) => (
                <div key={idx} className="rounded-lg bg-background p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ex.name}</span>
                    <button onClick={() => removeExercise(idx)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <label className="text-xs text-muted-foreground">Sets</label>
                      <Input
                        type="number"
                        min="1"
                        value={ex.sets}
                        onChange={(e) => updateExercise(idx, "sets", parseInt(e.target.value) || 1)}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Reps</label>
                      <Input
                        type="number"
                        min="1"
                        value={ex.reps}
                        onChange={(e) => updateExercise(idx, "reps", parseInt(e.target.value) || 1)}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Duration (s)</label>
                      <Input
                        type="number"
                        min="10"
                        value={ex.durationSec}
                        onChange={(e) => updateExercise(idx, "durationSec", parseInt(e.target.value) || 60)}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Rest (s)</label>
                      <Input
                        type="number"
                        min="0"
                        value={ex.restSec}
                        onChange={(e) => updateExercise(idx, "restSec", parseInt(e.target.value) || 30)}
                        className="mt-1 h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button className="w-full" onClick={saveWorkout}>
          {editingId ? "Update Workout" : "Save Workout"}
        </Button>
      </div>

      {/* My Workouts Section */}
      {myWorkouts.length > 0 && (
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
          <h2 className="font-display text-xl font-bold mb-4">My Workouts</h2>
          <div className="space-y-3">
            {myWorkouts.map(w => (
              <div key={w._id} className="rounded-lg bg-background p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{w.name}</h3>
                  <p className="text-xs text-muted-foreground">{w.category} · {w.difficulty} · {w.exercises?.length || 0} exercises</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => startCustomWorkout(w)}>
                    <Play className="h-4 w-4 mr-1" /> Start
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setWorkoutName(w.name);
                    setCategory(w.category);
                    setDifficulty(w.difficulty);
                    setExercises(w.exercises || []);
                    setEditingId(w._id);
                  }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog open={deleteConfirmId === w._id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmId(w._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{w.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex gap-3 justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteWorkout(w._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Session Player (unchanged) ────────────────────────────────────────────────
function SessionPlayer({ workout, onExit }: { workout: Workout; onExit: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(workout.exercises[0].durationSec);
  const [paused, setPaused] = useState(false);
  const [resting, setResting] = useState(false);
  const [done, setDone] = useState(false);
  const elapsedRef = useRef(0);

  const ex = workout.exercises[idx];

  useEffect(() => {
    if (paused || done) return;
    const t = setInterval(() => {
      elapsedRef.current += 1;
      setRemaining(r => {
        if (r > 1) return r - 1;
        if (resting || !ex.rest) {
          if (idx + 1 >= workout.exercises.length) { setDone(true); return 0; }
          setIdx(i => i + 1);
          setResting(false);
          return workout.exercises[idx + 1].durationSec;
        } else {
          setResting(true);
          return ex.rest!;
        }
      });
    }, 1000);
    return () => clearInterval(t);
  }, [paused, done, idx, resting, ex.rest, workout.exercises]);

  async function complete() {
    if (!user) { onExit(); return; }
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      
      const res = await fetch(`${API_BASE_URL}/workouts/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workout_key: workout.key,
          workout_name: workout.name,
          duration_sec: elapsedRef.current,
          calories: Math.round(workout.caloriesEstimate * (elapsedRef.current / (workout.durationMin * 60))),
          completed: true,
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to log workout");
      }
      
      toast.success("Workout logged! Great work 💪");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.error("Failed to log workout:", err);
      toast.error(err.message || "Failed to log workout");
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success-soft text-success">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">Session complete!</h2>
        <p className="mt-1 text-sm text-muted-foreground">{Math.round(elapsedRef.current / 60)} min · ~{workout.caloriesEstimate} kcal</p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onExit}>Discard</Button>
          <Button className="flex-1" onClick={complete}>Save & finish</Button>
        </div>
      </div>
    );
  }

  const total = ex.durationSec + (resting ? ex.rest ?? 0 : 0);
  const pct = ((resting ? (ex.rest! - remaining) : (ex.durationSec - remaining)) / total) * 100;

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="grid h-11 w-11 place-items-center rounded-lg hover:bg-muted" aria-label="Exit session">
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">{idx + 1} / {workout.exercises.length}</span>
      </div>

      <div className="mt-8 rounded-3xl p-8 text-center shadow-[var(--shadow-glow)]"
        style={{ background: resting ? "var(--accent)" : "var(--gradient-hero)", color: resting ? "var(--accent-foreground)" : "var(--primary-foreground)" }}>
        <div className="text-xs uppercase tracking-wider opacity-80">{resting ? "Rest" : "Now"}</div>
        <h2 className="mt-2 font-display text-3xl font-bold">{resting ? "Catch your breath" : ex.name}</h2>
        {ex.cue && !resting && <p className="mt-2 text-sm opacity-85">{ex.cue}</p>}
        <div className="mt-8 font-display text-7xl font-bold tabular-nums">{remaining}</div>
        <div className="mt-2 text-xs opacity-80">seconds</div>
      </div>

      <Progress value={pct} className="mt-4 h-2" />

      <div className="mt-6 flex justify-center gap-3">
        <Button size="lg" variant="outline" onClick={() => setPaused(p => !p)}>
          {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </Button>
        <Button size="lg" onClick={() => {
          if (idx + 1 >= workout.exercises.length) { setDone(true); return; }
          setIdx(i => i + 1); setResting(false); setRemaining(workout.exercises[idx + 1].durationSec);
        }}>
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {!resting && idx + 1 < workout.exercises.length && (
        <div className="mt-6 rounded-2xl bg-card p-4 text-sm shadow-[var(--shadow-neumorphic-inset-sm)]">
          <span className="text-muted-foreground">Up next:</span>{" "}
          <span className="font-medium">{workout.exercises[idx + 1].name}</span>
        </div>
      )}
    </div>
  );
}
