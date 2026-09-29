import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { SLEEP_SOUNDS } from "@/lib/library";

import { useAuth } from "@/hooks/useAuth";
import { Moon, Bed, Volume2, VolumeX, Play, Check, Clock, Zap, Brain, Smile, Music } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/sleep")({
  component: SleepPage,
});

function SleepPage() {
  const { user } = useAuth();
  const [wake, setWake] = useState("07:00");
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState(4);
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(60);
  const [saveConfirm, setSaveConfirm] = useState(false);

  useEffect(() => { if (user) refresh(); }, [user]);
  async function refresh() {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${API_BASE_URL}/sleep?days=7`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch sleep logs", e);
    }
  }

  // Bedtime calculator: 90-min cycles, plus 15 min to fall asleep
  const bedtimes = useMemo(() => {
    const [h, m] = wake.split(":").map(Number);
    const wakeMs = new Date().setHours(h, m, 0, 0);
    return [6, 5, 4].map(cycles => {
      const t = new Date(wakeMs - (cycles * 90 + 15) * 60 * 1000);
      // ensure date logic wraps correctly
      const hh = ((t.getHours() + 24) % 24).toString().padStart(2, "0");
      const mm = t.getMinutes().toString().padStart(2, "0");
      return { cycles, time: `${hh}:${mm}`, hours: (cycles * 1.5).toFixed(1) };
    });
  }, [wake]);

  async function logSleep() {
    if (!user) return;
    const token = localStorage.getItem("authToken");
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    
    try {
      const res = await fetch(`${API_BASE_URL}/sleep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          duration_hours: hours,
          quality,
          notes
        })
      });
      if (!res.ok) throw new Error("Failed to save sleep log");
      toast.success("Sleep logged"); 
      setSaveConfirm(true);
      setTimeout(() => setSaveConfirm(false), 2000);
      setNotes(""); 
      // Dispatch event to update dashboard
      window.dispatchEvent(new Event('sleepLogged'));
      refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Sleep</h1>
          <p className="text-sm text-muted-foreground">Wind down with calming sounds and track your rest.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 dark:bg-teal-900/30 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Sleep sounds section */}
      <section className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-neumorphic)]">
        <div className="flex items-center gap-2 mb-4">
          <Music className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Sleep sounds</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SLEEP_SOUNDS.map(s => (
            <button key={s.key} onClick={() => setActiveSound(activeSound === s.key ? null : s.key)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition ${activeSound === s.key ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30" : "border-muted hover:border-teal-200 dark:hover:border-teal-800"}`}>
              <span className="text-3xl">{s.emoji}</span>
              <span className="text-xs font-medium text-center">{s.name}</span>
            </button>
          ))}
        </div>
        {activeSound && (
          <>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 px-3 py-2 text-sm font-medium text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Play className="h-4 w-4" />
              <span>Now playing: <span className="font-semibold">{SLEEP_SOUNDS.find(s => s.key === activeSound)?.name}</span></span>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} className="flex-1" />
              <span className="w-10 text-right text-sm tabular-nums">{volume}%</span>
              <Button variant="ghost" size="sm" onClick={() => setActiveSound(null)}>
                <VolumeX className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Bedtime calculator */}
      <section className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-neumorphic)]">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2"><Bed className="h-5 w-5 text-primary" /> When to sleep</h2>
            <p className="text-sm text-muted-foreground">Based on 90-min sleep cycles + 15 min to drift off.</p>
          </div>
          <div>
            <Label className="text-xs font-semibold">Wake at</Label>
            <Input type="time" value={wake} onChange={e => setWake(e.target.value)} className="w-32 mt-1" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {bedtimes.map(b => (
            <div key={b.cycles} className={`rounded-2xl border-2 p-4 text-center transition ${b.cycles === 5 ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30" : "border-muted hover:border-muted-foreground/20"}`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-xs uppercase font-semibold text-muted-foreground">{b.cycles} cycles · {b.hours}h</div>
                {b.cycles === 5 && <span className="inline-block rounded-full bg-teal-500 px-2 py-0.5 text-xs font-semibold text-white">Recommended</span>}
              </div>
              <div className="font-display text-2xl font-bold text-teal-600 dark:text-teal-400">{b.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Logger */}
      <section className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-neumorphic)]">
        <h2 className="font-display text-lg font-bold flex items-center gap-2"><Moon className="h-5 w-5 text-primary" /> Log last night</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Hours slept */}
          <div>
            <Label className="font-semibold">Hours slept</Label>
            <div className="mt-3 flex items-center gap-3">
              <Slider value={[hours]} onValueChange={v => setHours(v[0])} min={0} max={12} step={0.5} className="flex-1" />
              <span className="w-12 text-right font-display text-lg font-bold text-teal-600 dark:text-teal-400">{hours}h</span>
            </div>
          </div>

          {/* Quality rating */}
          <div>
            <Label className="font-semibold">Quality (1–5)</Label>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setQuality(n)}
                    className={`h-10 flex-1 rounded-lg border font-semibold text-sm transition ${quality >= n ? "border-teal-500 bg-teal-500 text-white" : "border-muted hover:border-teal-300 dark:hover:border-teal-700"}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="font-semibold">Notes (optional)</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dreamt about..." className="mt-2" />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2">
          <Button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white" onClick={logSleep}>Save log</Button>
          {saveConfirm && (
            <div className="flex items-center gap-2 rounded-lg bg-green-100 dark:bg-green-900/30 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-300 animate-in fade-out duration-2000">
              <Check className="h-4 w-4" />
              <span>Saved successfully</span>
            </div>
          )}
        </div>
      </section>

      {/* History */}
      {logs.length > 0 && (
        <section className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-neumorphic)]">
          <h2 className="font-display text-lg font-bold">Last 7 nights</h2>
          <div className="mt-4 flex items-end justify-between gap-2">
            {logs.slice().reverse().map((l) => (
              <div key={l._id || l.id} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-md bg-teal-500/80" style={{ height: `${((l.duration_hours || l.hours) / 12) * 100}px`, minHeight: 4 }} />
                <div className="text-[10px] text-muted-foreground">{new Date(l.date || l.log_date).toLocaleDateString(undefined, { weekday: "short" })}</div>
                <div className="text-xs font-semibold">{l.duration_hours || l.hours}h</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
