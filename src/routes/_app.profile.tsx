import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { DietaryPreferencesSelector } from "@/components/DietaryPreferencesSelector";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
function getToken() { return localStorage.getItem("authToken"); }
import { UserAvatar, type AvatarConfig } from "@/components/UserAvatar";
import { calcAge, calcBMI, calcTDEE } from "@/lib/health";
import { Download, LogOut, Trash2, Loader2, Camera, Check, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refresh } = useProfile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState(false);

  // form state mirrors profile
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (profile) setForm({ ...profile }); }, [profile]);

  if (!profile || !form) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  function set<K extends string>(k: K, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    if (!user) return;
    setSaving(true);
    const heightN = +form.height_cm || 0;
    const weightN = +form.weight_kg || 0;
    const bmi = calcBMI(heightN, weightN);
    const age = calcAge(form.date_of_birth);
    const tdee = calcTDEE({ weightKg: weightN, heightCm: heightN, age, gender: form.gender, activityLevel: form.activity_level });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          name: form.name, date_of_birth: form.date_of_birth, gender: form.gender,
          height_cm: heightN, weight_kg: weightN, bmi, tdee,
          goal: form.goal, desired_weight_kg: form.desired_weight_kg, activity_level: form.activity_level,
          avatar_config: form.avatar_config, dietary_preferences: form.dietary_preferences,
          cycle_tracking_enabled: form.cycle_tracking_enabled, last_period_start: form.last_period_start,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Save failed");
      toast.success("Profile updated"); 
      setSaveConfirm(true);
      setTimeout(() => setSaveConfirm(false), 2500);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    if (!user) return;
    const headers = { Authorization: `Bearer ${getToken()}` };
    const [sleeps, workouts, moods] = await Promise.all([
      fetch(`${API_BASE_URL}/sleep`, { headers }).then(r => r.json()),
      fetch(`${API_BASE_URL}/workouts`, { headers }).then(r => r.json()),
      fetch(`${API_BASE_URL}/mental-health`, { headers }).then(r => r.json()),
    ]);
    const blob = new Blob([JSON.stringify({
      profile, sleep_logs: sleeps, workout_sessions: workouts, mood_logs: moods,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "elevate-well-export.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Your data is downloading");
  }

  async function signOut() {
    await logout();
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar seed={profile.avatar_seed ?? profile.name ?? "u"} config={{ ...((profile.avatar_config as AvatarConfig) ?? {}), gender: profile.gender ?? undefined }} size={80} />
            <div className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white shadow-lg">
              <Camera className="h-4 w-4" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Weight" value={`${profile.weight_kg ?? "—"} kg`} />
          <Stat label="Goal" value={`${profile.desired_weight_kg ?? "—"} kg`} />
          <Stat label="BMI" value={`${profile.bmi ?? "—"}`} />
          <Stat label="TDEE" value={`${profile.tdee ?? "—"}`} />
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-4 bg-transparent gap-2 h-auto p-0">
          <TabsTrigger value="info" className="data-[state=active]:bg-[#2cc9a8] data-[state=active]:text-white rounded-full px-4 py-2 flex items-center gap-2 bg-transparent border border-transparent data-[state=inactive]:text-muted-foreground">Info</TabsTrigger>
          <TabsTrigger value="body" className="data-[state=active]:bg-[#2cc9a8] data-[state=active]:text-white rounded-full px-4 py-2 flex items-center gap-2 bg-transparent border border-transparent data-[state=inactive]:text-muted-foreground">Body & Goal</TabsTrigger>
          <TabsTrigger value="cycle" className="data-[state=active]:bg-[#2cc9a8] data-[state=active]:text-white rounded-full px-4 py-2 flex items-center gap-2 bg-transparent border border-transparent data-[state=inactive]:text-muted-foreground">Cycle</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#2cc9a8] data-[state=active]:text-white rounded-full px-4 py-2 flex items-center gap-2 bg-transparent border border-transparent data-[state=inactive]:text-muted-foreground">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="grid grid-cols-2 gap-4">
            <Field label={<><span>Name</span><span className="text-red-500 ml-1">*</span></>}><Input value={form.name ?? ""} onChange={e => set("name", e.target.value)} /></Field>
            <Field label="Date of birth"><Input type="date" value={form.date_of_birth ?? ""} onChange={e => set("date_of_birth", e.target.value)} /></Field>
          </div>
          <Field label="Gender">
            <div className="flex gap-2">{["female","male","other"].map(g => (
              <button key={g} onClick={() => set("gender", g)}
                className={`flex-1 rounded-lg border p-2 text-sm capitalize ${form.gender === g ? "border-primary bg-primary-soft" : ""}`}>{g}</button>
            ))}</div>
          </Field>
        </TabsContent>

        <TabsContent value="body" className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Height (cm)"><Input type="number" value={form.height_cm ?? ""} onChange={e => set("height_cm", e.target.value)} /></Field>
            <Field label="Weight (kg)"><Input type="number" value={form.weight_kg ?? ""} onChange={e => set("weight_kg", e.target.value)} /></Field>
          </div>
          
          <div className="rounded-xl bg-muted/40 p-4">
            <div className="text-xs uppercase text-muted-foreground font-semibold">Goal Progress</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold">{form.weight_kg ?? "—"} kg</span>
              <span className="text-sm text-muted-foreground">{form.desired_weight_kg ? `${Math.abs((form.desired_weight_kg - form.weight_kg).toFixed(1))} kg left` : "—"}</span>
            </div>
            {form.weight_kg && form.desired_weight_kg && (
              <div className="mt-3">
                <Progress value={Math.max(0, Math.min(100, ((form.weight_kg - form.desired_weight_kg) / (form.weight_kg - form.desired_weight_kg + 10)) * 100))} className="h-2" />
              </div>
            )}
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs uppercase text-amber-900 font-semibold">BMI Status</div>
                <div className="mt-1 text-sm text-amber-900">Overweight range</div>
              </div>
            </div>
          </div>

          <Field label="Goal weight (kg)"><Input type="number" value={form.desired_weight_kg ?? ""} onChange={e => set("desired_weight_kg", e.target.value)} /></Field>
          
          <Field label="Goal">
            <div className="grid grid-cols-2 gap-2">{[{v:"lose_weight",l:"Lose Weight"},{v:"build_muscle",l:"Build Muscle"},{v:"endurance",l:"Endurance"},{v:"wellness",l:"Wellness"}].map(g => (
              <button key={g.v} onClick={() => set("goal", g.v)}
                className={`rounded-lg border p-2 text-sm ${form.goal === g.v ? "border-primary bg-primary-soft" : ""}`}>{g.l}</button>
            ))}</div>
          </Field>
          <Field label="Activity level">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{["sedentary","light","moderate","active","very_active"].map(a => (
              <button key={a} onClick={() => set("activity_level", a)}
                className={`rounded-lg border p-2 text-xs capitalize ${form.activity_level === a ? "border-primary bg-primary-soft" : ""}`}>{a.replace("_"," ")}</button>
            ))}</div>
          </Field>

          <div className="rounded-xl bg-muted/40 p-4">
            <div className="text-xs uppercase text-muted-foreground font-semibold">Daily Energy Needs</div>
            <div className="mt-1 font-display text-2xl font-bold">{form.tdee ?? "—"}</div>
            <div className="text-xs text-muted-foreground">kcal/day</div>
          </div>

          <div className="border-t pt-4">
            <Field label="Dietary Preferences">
              <DietaryPreferencesSelector
                selected={form.dietary_preferences || []}
                onChange={(prefs) => set("dietary_preferences", prefs)}
                showPrompt={false}
              />
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="cycle" className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable cycle tracking</Label>
              <p className="text-xs text-muted-foreground">Get tailored insights through your cycle phases.</p>
            </div>
            <Switch checked={!!form.cycle_tracking_enabled} onCheckedChange={(v) => set("cycle_tracking_enabled", v)} />
          </div>
          {form.cycle_tracking_enabled && (
            <Field label="Last period start"><Input type="date" value={form.last_period_start ?? ""} onChange={e => set("last_period_start", e.target.value)} /></Field>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <Toggle label="Push notifications" checked={!!form.push_notifications} onChange={v => set("push_notifications", v)} />
          <Toggle label="Smart suggestions" checked={!!form.smart_suggestions} onChange={v => set("smart_suggestions", v)} />
          <Field label="Units">
            <div className="flex gap-2">{["metric","imperial"].map(u => (
              <button key={u} onClick={() => set("unit_system", u)}
                className={`flex-1 rounded-lg border p-2 text-sm capitalize ${form.unit_system === u ? "border-primary bg-primary-soft" : ""}`}>{u}</button>
            ))}</div>
          </Field>

          <div className="border-t pt-4">
            <Button variant="outline" onClick={exportData}><Download className="mr-2 h-4 w-4" /> Export my data</Button>
          </div>

          <div className="border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes your profile and all logs. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                    if (!user) return;
                    try {
                      await fetch(`${API_BASE_URL}/auth/account`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${getToken()}` },
                      });
                    } catch {}
                    await logout();
                    toast.success("Account data removed");
                    navigate({ to: "/" });
                  }}>Delete forever</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 flex justify-end gap-2">
        <Button variant="outline" size="lg" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
        <div className="relative">
          <Button size="lg" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
          {saveConfirm && (
            <div className="absolute right-0 bottom-full mb-2 flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700 whitespace-nowrap">
              <Check className="h-4 w-4" />
              <span>Changes saved</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
    </div>
  );
}
function Field({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
