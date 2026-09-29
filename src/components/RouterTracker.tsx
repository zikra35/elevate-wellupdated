'use client';

/**
 * RouteTracker.tsx
 * Drop-in widget for the Workouts page — place it above or below the workout grid.
 *
 * Install deps first (run once in your project terminal):
 *   npm install leaflet react-leaflet
 *   npm install -D @types/leaflet
 *
 * Then add this ONE line to your src/styles.css (at the top, after the @import lines):
 *   @import "leaflet/dist/leaflet.css";
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import { Play, Pause, Square, Footprints, Flame, MapPin, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy import Leaflet only on client-side
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

// ── Types ────────────────────────────────────────────────────────────────────
type Coord = [number, number]; // [lat, lng]

type TrackingState = "idle" | "running" | "paused";

// ── Constants ────────────────────────────────────────────────────────────────
const STEPS_PER_KM = 1300;       // average adult stride
const CALORIES_PER_KM = 60;      // ~60 kcal/km for a 65 kg person (rough estimate)
const GPS_INTERVAL_MS = 3000;    // poll GPS every 3 seconds

// ── Haversine distance (metres) between two lat/lng pairs ───────────────────
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

// ── Auto-pan the map to follow the user ─────────────────────────────────────
function MapFollower({ center }: { center: Coord }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card px-4 py-3 text-center shadow-sm">
      <div className="text-primary">{icon}</div>
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Format seconds → mm:ss ───────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function RouteTracker() {
  // Only render on client-side to avoid Leaflet SSR errors
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    initLeaflet();
  }, []);
  
  if (!isClient) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  }
  
  if (!MapContainer || !TileLayer || !Polyline || !Marker) {
    return <div className="h-96 rounded-lg bg-muted" />;
  }
  const [state, setState] = useState<TrackingState>("idle");
  const [route, setRoute] = useState<Coord[]>([]);
  const [currentPos, setCurrentPos] = useState<Coord | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsed, setElapsed] = useState(0);       // seconds
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCoordRef = useRef<Coord | null>(null);
  const accDistRef = useRef(0);                     // accumulated km

  // ── Derived stats ──────────────────────────────────────────────────────────
  const steps = Math.round(distanceKm * STEPS_PER_KM);
  const calories = Math.round(distanceKm * CALORIES_PER_KM);
  const paceStr =
    distanceKm > 0.05 && elapsed > 0
      ? (() => {
          const secPerKm = elapsed / distanceKm;
          return `${Math.floor(secPerKm / 60)}'${String(Math.round(secPerKm % 60)).padStart(2, "0")}"`;
        })()
      : "--'--\"";

  // ── Start GPS watch ────────────────────────────────────────────────────────
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: Coord = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPos(coord);

        if (lastCoordRef.current) {
          const d = haversineMetres(lastCoordRef.current, coord);
          // Ignore jitter < 3 m
          if (d > 3) {
            accDistRef.current += d / 1000;
            setDistanceKm(parseFloat(accDistRef.current.toFixed(3)));
            setRoute((prev) => [...prev, coord]);
            lastCoordRef.current = coord;
          }
        } else {
          // First fix
          lastCoordRef.current = coord;
          setRoute([coord]);
        }
      },
      (err) => setError(`GPS error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: GPS_INTERVAL_MS, timeout: 10_000 }
    );
  }, []);

  // ── Stop GPS watch ─────────────────────────────────────────────────────────
  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Controls ───────────────────────────────────────────────────────────────
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
    // keep stats visible; reset everything
    setRoute([]);
    setCurrentPos(null);
    setDistanceKm(0);
    setElapsed(0);
    accDistRef.current = 0;
    lastCoordRef.current = null;
  }

  // Clean up on unmount
  useEffect(() => () => { stopWatch(); stopTimer(); }, [stopWatch, stopTimer]);

  // ── Default map centre (Islamabad) — replaced by GPS when available ────────
  const mapCenter: Coord = currentPos ?? [33.6844, 73.0479];

  // ── Orange polyline style ──────────────────────────────────────────────────
  const routeOptions = { color: "#f97316", weight: 5, opacity: 0.85 };

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
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

        {/* Status badge */}
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

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-4 py-4">
        <StatCard
          icon={<Footprints className="h-4 w-4" />}
          label="Steps"
          value={steps.toLocaleString()}
        />
        <StatCard
          icon={<MapPin className="h-4 w-4" />}
          label="km"
          value={distanceKm.toFixed(2)}
        />
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="kcal"
          value={String(calories)}
        />
        <StatCard
          icon={<Timer className="h-4 w-4" />}
          label="Time"
          value={formatTime(elapsed)}
        />
      </div>

      {/* Pace bar */}
      {state !== "idle" && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Current pace</span>
          <span className="font-bold text-orange-500">{paceStr} /km</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mx-4 mb-3 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Controls */}
      <div className="flex gap-2 px-4 pb-4">
        {state === "idle" && (
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleStart}
          >
            <Play className="mr-2 h-4 w-4" /> Start Run
          </Button>
        )}

        {state === "running" && (
          <>
            <Button variant="outline" className="flex-1" onClick={handlePause}>
              <Pause className="mr-2 h-4 w-4" /> Pause
            </Button>
            <Button
              variant="destructive"
              onClick={handleStop}
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        )}

        {state === "paused" && (
          <>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleResume}
            >
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
