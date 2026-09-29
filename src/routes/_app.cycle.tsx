import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
function getToken() { return localStorage.getItem("authToken"); }
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Droplets, Plus, Sparkles, Loader2, Heart, ChevronLeft, ChevronRight, Apple, Activity, Moon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/cycle")({
  component: CyclePage,
});

const SYMPTOMS = ["cramps", "headache", "bloating", "fatigue", "acne", "tender breasts", "back pain", "cravings"];
const FLOWS = ["light", "medium", "heavy"] as const;

type CycleLog = {
  id: string;
  start_date: string;
  end_date: string | null;
  flow: string | null;
  symptoms: string[] | null;
  mood: string | null;
  notes: string | null;
};

function CyclePage() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [logs, setLogs] = useState<CycleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [form, setForm] = useState<{ start_date: string; end_date: string; flow: string; symptoms: string[]; mood: string; notes: string }>({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    flow: "medium",
    symptoms: [],
    mood: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cycle?days=720`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.map((l: any) => ({
            id: l._id,
            start_date: l.date ? new Date(l.date).toISOString().slice(0,10) : l.start_date,
            end_date: l.end_date,
            flow: l.flow_intensity || l.flow,
            symptoms: l.symptoms,
            mood: l.mood,
            notes: l.notes,
          })));
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [user]);

  // Predictions (hooks must run before any early return)
  const cycleLen = profile?.cycle_length_days ?? 28;
  const periodLen = profile?.period_length_days ?? 5;
  const lastStart = logs[0]?.start_date ?? profile?.last_period_start ?? null;

  const { dayOfCycle, phase, nextPeriod, fertileWindow, ovulation } = useMemo(() => {
    if (!lastStart) return { dayOfCycle: null, phase: null, nextPeriod: null, fertileWindow: null, ovulation: null } as any;
    const start = new Date(lastStart + "T00:00:00");
    const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const day = ((diff % cycleLen) + cycleLen) % cycleLen + 1;
    const next = new Date(start.getTime() + cycleLen * 86400000);
    while (next < today) next.setDate(next.getDate() + cycleLen);
    const ovu = new Date(start.getTime() + (cycleLen - 14) * 86400000);
    const fertileStart = new Date(ovu.getTime() - 4 * 86400000);
    const fertileEnd = new Date(ovu.getTime() + 1 * 86400000);
    let ph = "Follicular";
    if (day <= periodLen) ph = "Menstrual";
    else if (day >= cycleLen - 16 && day <= cycleLen - 12) ph = "Ovulation";
    else if (day > cycleLen - 12) ph = "Luteal";
    return { dayOfCycle: day, phase: ph, nextPeriod: next, fertileWindow: { start: fertileStart, end: fertileEnd }, ovulation: ovu };
  }, [lastStart, cycleLen, periodLen]);

  // Onboarding gate for non-female / disabled users
  if (profile && profile.gender !== "female") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
        <Heart className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-3 font-display text-xl font-bold">Cycle tracking</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This feature is available for users who set their gender to female. You can change this in your profile.
        </p>
      </div>
    );
  }

  if (profile && profile.gender === "female" && !profile.cycle_tracking_enabled) {
    async function enable() {
      if (!user) return;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ cycle_tracking_enabled: true })
        });
        if (!res.ok) throw new Error("Failed to enable cycle tracking");
        toast.success("Cycle tracking enabled");
        refresh();
      } catch (e: any) { toast.error(e.message); }
    }
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
        <Droplets className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-3 font-display text-xl font-bold">Track your cycle</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Get phase insights, period predictions, and tailored wellness tips.
        </p>
        <Button className="mt-4" onClick={enable}>Enable cycle tracking</Button>
      </div>
    );
  }

  const phaseTips: Record<string, Array<{ icon: any; title: string; color: string; tip: string }>> = {
    Menstrual: [
      { icon: Apple, title: "Nutrition", color: "bg-red-50 dark:bg-red-950", tip: "Iron-rich foods (spinach, lentils) help combat fatigue." },
      { icon: Activity, title: "Movement", color: "bg-green-50 dark:bg-green-950", tip: "Gentle yoga & walks are perfect. Listen to your body." },
      { icon: Moon, title: "Sleep", color: "bg-blue-50 dark:bg-blue-950", tip: "Prioritize rest. Your body needs extra sleep now." }
    ],
    Follicular: [
      { icon: Apple, title: "Nutrition", color: "bg-green-50 dark:bg-green-950", tip: "Lean proteins & fresh greens support rising energy." },
      { icon: Activity, title: "Movement", color: "bg-blue-50 dark:bg-blue-950", tip: "Great time for strength training & new workouts." },
      { icon: Moon, title: "Sleep", color: "bg-purple-50 dark:bg-purple-950", tip: "Energy is high—maintain consistent sleep schedule." }
    ],
    Ovulation: [
      { icon: Apple, title: "Nutrition", color: "bg-yellow-50 dark:bg-yellow-950", tip: "Antioxidant-rich foods (berries, nuts) boost energy." },
      { icon: Activity, title: "Movement", color: "bg-orange-50 dark:bg-orange-950", tip: "Peak energy—high-intensity workouts are ideal." },
      { icon: Moon, title: "Sleep", color: "bg-blue-50 dark:bg-blue-950", tip: "You may need less sleep. Stay socially engaged." }
    ],
    Luteal: [
      { icon: Apple, title: "Nutrition", color: "bg-purple-50 dark:bg-purple-950", tip: "Magnesium-rich foods (dark chocolate, seeds) help cravings." },
      { icon: Activity, title: "Movement", color: "bg-green-50 dark:bg-green-950", tip: "Moderate cardio & pilates suit this phase best." },
      { icon: Moon, title: "Sleep", color: "bg-blue-50 dark:bg-blue-950", tip: "Wind down 30 minutes earlier for better sleep." }
    ],
  };

  async function saveLog() {
    if (!user) return;
    try {
      const startErr = validateDateString(form.start_date);
      if (startErr) { toast.error(`Start date: ${startErr}`); return; }
      if (form.end_date) {
        const endErr = validateDateString(form.end_date);
        if (endErr) { toast.error(`End date: ${endErr}`); return; }
        if (form.end_date < form.start_date) { toast.error("End date can't be before start date."); return; }
      }
      const payload = {
        date: form.start_date,
        end_date: form.end_date || null,
        flow_intensity: form.flow,
        symptoms: form.symptoms,
        mood: form.mood || null,
        notes: form.notes || null,
      };
      const postRes = await fetch(`${API_BASE_URL}/cycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      if (!postRes.ok) { toast.error("Failed to save cycle log"); return; }
      // Update last_period_start in profile
      await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ last_period_start: form.start_date })
      });
      // Reload logs
      const logsRes = await fetch(`${API_BASE_URL}/cycle?days=720`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.map((l: any) => ({
          id: l._id,
          start_date: l.date ? new Date(l.date).toISOString().slice(0,10) : l.start_date,
          end_date: l.end_date,
          flow: l.flow_intensity || l.flow,
          symptoms: l.symptoms,
          mood: l.mood,
          notes: l.notes,
        })));
      }
      setOpen(false);
      toast.success("Cycle log saved");
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't save your log. Please try again.");
    }
  }

  // Reject impossible dates (month > 12, day > 31, future, etc.)
  function validateDateString(s: string): string | null {
    if (!s) return "Required.";
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return "Use format YYYY-MM-DD.";
    const year = +m[1], month = +m[2], day = +m[3];
    if (month < 1 || month > 12) return `Month must be 1–12 (got ${month}).`;
    if (day < 1 || day > 31) return `Day must be 1–31 (got ${day}).`;
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime()) || d.getMonth() + 1 !== month || d.getDate() !== day) return "That date doesn't exist.";
    if (year < 1900 || year > 2100) return "Year is out of range.";
    // Allow today and past dates only (no future dates)
    const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
    if (d.getTime() > today.getTime()) return "Date can't be in the future.";
    return null;
  }

  function toggleSymptom(s: string) {
    setForm((f) => ({ ...f, symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s] }));
  }

  const fmt = (d: Date | null) => d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";

  // Phase colors
  const phaseColors: Record<string, string> = {
    Menstrual: "bg-red-600",
    Follicular: "bg-pink-500",
    Ovulation: "bg-yellow-500",
    Luteal: "bg-purple-600",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Droplets className="h-7 w-7 text-primary" /> Cycle</h1>
          <p className="text-sm text-muted-foreground">Track periods, symptoms, and get phase-aware tips.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Log period</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log a period</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                <div><Label>End date (optional)</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Flow</Label>
                <div className="mt-1 flex gap-2">{FLOWS.map(f => (
                  <button key={f} onClick={() => setForm(s => ({ ...s, flow: f }))}
                    className={`flex-1 rounded-lg border p-2 text-sm capitalize ${form.flow === f ? "border-primary bg-primary/10" : ""}`}>{f}</button>
                ))}</div>
              </div>
              <div>
                <Label>Symptoms</Label>
                <div className="mt-1 flex flex-wrap gap-2">{SYMPTOMS.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)}
                    className={`rounded-full border px-3 py-1 text-xs capitalize ${form.symptoms.includes(s) ? "border-primary bg-primary/10" : ""}`}>{s}</button>
                ))}</div>
              </div>
              <div><Label>Mood</Label><Input placeholder="e.g. calm, irritable, energetic" value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))} /></div>
              <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={saveLog}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cycle Snapshot */}
      {dayOfCycle && phase && (
        <div className="rounded-3xl bg-card p-8 shadow-[var(--shadow-neumorphic)]">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Circular Progress */}
            <div className="flex-shrink-0">
              <CycleCircle dayOfCycle={dayOfCycle} cycleLen={cycleLen} periodLen={periodLen} phase={phase} />
            </div>
            
            {/* Info Grid */}
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold">Hey, {profile?.name?.split(" ")[0]}! 👋</h2>
              <p className="text-sm text-muted-foreground mt-1">Here's your cycle snapshot for today</p>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="rounded-lg bg-muted/40 p-4">
                  <div className="text-xs uppercase text-muted-foreground font-semibold">Next Period</div>
                  <div className="mt-1 font-display text-lg font-bold">{fmt(nextPeriod)}</div>
                  <div className="text-xs text-muted-foreground">in {Math.ceil((nextPeriod!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</div>
                </div>
                
                <div className="rounded-lg bg-muted/40 p-4">
                  <div className="text-xs uppercase text-muted-foreground font-semibold">Ovulation</div>
                  <div className="mt-1 font-display text-lg font-bold">{fmt(ovulation)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(ovulation!).getTime() < new Date().getTime() ? "passed" : "upcoming"}</div>
                </div>
                
                <div className="rounded-lg bg-muted/40 p-4">
                  <div className="text-xs uppercase text-muted-foreground font-semibold">Fertile Window</div>
                  <div className="mt-1 font-display text-lg font-bold">{fmt(fertileWindow?.start)} – {fmt(fertileWindow?.end)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(fertileWindow?.end!).getTime() < new Date().getTime() ? "passed" : "active"}</div>
                </div>
                
                <div className="rounded-lg bg-muted/40 p-4">
                  <div className="text-xs uppercase text-muted-foreground font-semibold">Cycle Length</div>
                  <div className="mt-1 font-display text-lg font-bold">{cycleLen} days</div>
                  <div className="text-xs text-muted-foreground">avg</div>
                </div>
              </div>

              {/* Phase Legend */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-xs font-medium">Period</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                  <span className="text-xs font-medium">Pre-ovulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs font-medium">Ovulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                  <span className="text-xs font-medium">Luteal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <CycleCalendar currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} logs={logs} cycleLen={cycleLen} periodLen={periodLen} lastStart={lastStart} />

      {/* Tips */}
      {phase && (
        <div className="rounded-3xl bg-card p-8 shadow-[var(--shadow-neumorphic)]">
          <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-6"><Sparkles className="h-5 w-5 text-primary" /> Tips for your {phase.toLowerCase()} phase</h3>
          <div className="space-y-4">
            {phaseTips[phase]?.map((tip, i) => {
              const Icon = tip.icon;
              return (
                <div key={i} className={`rounded-2xl ${tip.color} p-4 flex gap-4`}>
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary mt-1" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{tip.tip}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="rounded-3xl bg-card p-8 shadow-[var(--shadow-neumorphic)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold">History</h3>
          <Button variant="outline" size="sm">See all →</Button>
        </div>
        {loading ? (
          <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet. Tap "Log period" to start tracking.</p>
        ) : (
          <div className="space-y-4">
            {logs.slice(0, 3).map((l) => (
              <div key={l.id} className="rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <div className={`h-3 w-3 rounded-full mt-1.5 flex-shrink-0 ${
                    l.flow === "light" ? "bg-pink-300" :
                    l.flow === "medium" ? "bg-red-500" :
                    "bg-red-700"
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-semibold">{new Date(l.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {l.flow ? <span className="capitalize">{l.flow} flow</span> : null}
                      {l.end_date ? ` · ${Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / (1000 * 60 * 60 * 24))} days` : null}
                    </div>
                    {l.symptoms?.length ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {l.symptoms.map(s => <span key={s} className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{s}</span>)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CycleCircle({ dayOfCycle, cycleLen, periodLen, phase }: { dayOfCycle: number; cycleLen: number; periodLen: number; phase: string }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate which segment of the cycle we're in
  let segmentStart = 0;
  let segmentEnd = periodLen;
  let segmentColor = "#ef4444"; // red for period
  
  if (dayOfCycle > periodLen && dayOfCycle <= cycleLen - 16) {
    segmentStart = periodLen;
    segmentEnd = cycleLen - 16;
    segmentColor = "#ec4899"; // pink for follicular
  } else if (dayOfCycle > cycleLen - 16 && dayOfCycle <= cycleLen - 12) {
    segmentStart = cycleLen - 16;
    segmentEnd = cycleLen - 12;
    segmentColor = "#eab308"; // yellow for ovulation
  } else if (dayOfCycle > cycleLen - 12) {
    segmentStart = cycleLen - 12;
    segmentEnd = cycleLen;
    segmentColor = "#a855f7"; // purple for luteal
  }
  
  const offset = (segmentStart / cycleLen) * circumference;
  const length = ((segmentEnd - segmentStart) / cycleLen) * circumference;
  
  return (
    <div className="relative w-40 h-40">
      <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
        {/* Background circle */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        
        {/* Period segment */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#ef4444" strokeWidth="12"
          strokeDasharray={`${(periodLen / cycleLen) * circumference} ${circumference}`}
          strokeLinecap="round" />
        
        {/* Follicular segment */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#ec4899" strokeWidth="12"
          strokeDasharray={`${((cycleLen - 16 - periodLen) / cycleLen) * circumference} ${circumference}`}
          strokeDashoffset={-((periodLen / cycleLen) * circumference)}
          strokeLinecap="round" />
        
        {/* Ovulation segment */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#eab308" strokeWidth="12"
          strokeDasharray={`${(4 / cycleLen) * circumference} ${circumference}`}
          strokeDashoffset={-((periodLen + (cycleLen - 16 - periodLen)) / cycleLen) * circumference}
          strokeLinecap="round" />
        
        {/* Luteal segment */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#a855f7" strokeWidth="12"
          strokeDasharray={`${(12 / cycleLen) * circumference} ${circumference}`}
          strokeDashoffset={-((periodLen + (cycleLen - 16 - periodLen) + 4) / cycleLen) * circumference}
          strokeLinecap="round" />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-3xl font-bold">Day</div>
        <div className="font-display text-4xl font-bold">{dayOfCycle}</div>
        <div className="text-xs text-muted-foreground mt-1 capitalize">{phase.toLowerCase()}</div>
      </div>
    </div>
  );
}

function CycleCalendar({ currentMonth, setCurrentMonth, logs, cycleLen, periodLen, lastStart }: any) {
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const days = [];
  const totalDays = daysInMonth(currentMonth);
  const startingDayOfWeek = firstDayOfMonth(currentMonth);
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of month
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }
  
  const getDateColor = (day: number) => {
    if (!lastStart) return "bg-transparent";
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const start = new Date(lastStart + "T00:00:00");
    const diff = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const dayOfCycle = ((diff % cycleLen) + cycleLen) % cycleLen + 1;
    
    if (dayOfCycle <= periodLen) return "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100";
    if (dayOfCycle <= cycleLen - 16) return "bg-pink-100 dark:bg-pink-900 text-pink-900 dark:text-pink-100";
    if (dayOfCycle <= cycleLen - 12) return "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100";
    return "bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100";
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };
  
  return (
    <div className="rounded-3xl bg-card p-8 shadow-[var(--shadow-neumorphic)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-bold">
          {currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => (
          <div key={idx} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${
            day === null ? "" : `${getDateColor(day)} ${isToday(day) ? "ring-2 ring-primary" : ""}`
          }`}>
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 p-3">
      <div className="text-[10px] uppercase opacity-80">{label}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

// keep Navigate import used
void Navigate;
