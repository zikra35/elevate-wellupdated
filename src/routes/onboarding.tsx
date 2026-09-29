import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { usePlans } from "@/hooks/usePlans";
import { SuggestionPopup } from "@/components/SuggestionPopup";
import { calcAge, calcBMI, bmiCategory, calcTDEE } from "@/lib/health";
import { UserAvatar, type AvatarConfig } from "@/components/UserAvatar";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const GOALS = [
  { v: "lose_weight", l: "Lose Weight" },
  { v: "build_muscle", l: "Build Muscle" },
  { v: "endurance", l: "Improve Endurance" },
  { v: "wellness", l: "General Wellness" },
];

const ACTIVITY = [
  { v: "sedentary", l: "Sedentary", d: "Little to no exercise" },
  { v: "light", l: "Lightly active", d: "1–3 days / week" },
  { v: "moderate", l: "Moderately active", d: "3–5 days / week" },
  { v: "active", l: "Very active", d: "6–7 days / week" },
  { v: "very_active", l: "Athlete", d: "Daily intense training" },
];

const DIETARY = ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Nut-Free", "Pescatarian", "Keto", "Halal", "Kosher"];

function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isGenerating, suggestions, isMockGenerated, generateSuggestions, createPlan, clearSuggestions } = usePlans();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("female");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("wellness");
  const [desiredWeight, setDesiredWeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [avatar, setAvatar] = useState<AvatarConfig>({ gender: "female" });
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const [diets, setDiets] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/auth/login" }); return; }
    
    const token = localStorage.getItem("authToken");
    if (token) {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data?.user?.onboarding_completed) navigate({ to: "/dashboard" });
        if (data?.user?.name) setName(data.user.name);
      })
      .catch(console.error);
    }
  }, [user, authLoading, navigate]);

  const heightN = +height || 0;
  const weightN = +weight || 0;
  const bmi = calcBMI(heightN, weightN);
  const cat = bmiCategory(bmi);
  const age = calcAge(dob);
  const tdee = calcTDEE({ weightKg: weightN, heightCm: heightN, age, gender, activityLevel: activity });

  const totalSteps = 5;
  const pct = (step / totalSteps) * 100;

  function next() {
    if (step === 1 && (!name || !dob)) return toast.error("Please fill in your name and date of birth.");
    if (step === 2 && (!heightN || !weightN)) return toast.error("Please enter your height and weight.");
    if (step === 3 && !activity) return toast.error("Please select your activity level.");
    setStep((s) => Math.min(s + 1, totalSteps));
  }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  async function finish() {
    if (!user) return;
    setSaving(true);
    
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          date_of_birth: dob,
          gender,
          height_cm: heightN,
          weight_kg: weightN,
          bmi,
          goal: null,  // Goal will be auto-determined from BMI by ML API
          desired_weight_kg: null,  // Not used - BMI-based personalization only
          activity_level: activity,
          tdee,
          avatar_config: avatar,
          avatar_seed: avatarSeed,
          dietary_preferences: diets,
          onboarding_completed: true,
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save profile");
      }
      
      toast.success("Profile saved! Generating your personalized plan...");
      
      // Generate suggestions
      await generateSuggestions();
      setShowSuggestionPopup(true);
    } catch (error: any) {
      toast.error(error.message);
      setSaving(false);
    }
  }

  async function handleAcceptPlan() {
    try {
      await createPlan('active', 'My Personalized Plan', 'AI-generated personalized wellness plan');
      toast.success("Plan created and activated!");
      setShowSuggestionPopup(false);
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleRejectPlan() {
    try {
      await createPlan('disabled', 'My Personalized Plan', 'AI-generated personalized wellness plan');
      toast.success("Plan created! You can activate it anytime from the Plans page.");
      setShowSuggestionPopup(false);
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  function handleCloseSuggestionPopup() {
    // Default to creating disabled plan if user closes
    handleRejectPlan();
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <SuggestionPopup
        isOpen={showSuggestionPopup}
        suggestions={suggestions}
        isLoading={isGenerating}
        isMockGenerated={isMockGenerated}
        onAccept={handleAcceptPlan}
        onReject={handleRejectPlan}
        onClose={handleCloseSuggestionPopup}
      />
      
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-display font-bold tracking-tight">ELEVATE WELL</span>
        </div>
        <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
      </header>

      <div className="mx-auto max-w-xl px-6">
        <Progress value={pct} className="h-2" />
        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
          {step === 1 && (
            <Section title="Tell us about you" subtitle="The basics help us personalize everything.">
              <div className="space-y-4">
                <FieldRow label="Your name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aria Chen" />
                </FieldRow>
                <FieldRow label="Date of birth">
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </FieldRow>
                <FieldRow label="Gender">
                  <RadioGroup value={gender} onValueChange={(g) => {
                    setGender(g);
                    setAvatar({ gender: g });
                  }} className="grid grid-cols-3 gap-2">
                    {["female","male","other"].map((g) => (
                      <label key={g} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 capitalize hover:bg-muted">
                        <RadioGroupItem value={g} />{g}
                      </label>
                    ))}
                  </RadioGroup>
                </FieldRow>
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section title="Body metrics" subtitle="Used to calculate BMI and energy needs.">
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Height (cm)">
                  <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
                </FieldRow>
                <FieldRow label="Weight (kg)">
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" />
                </FieldRow>
              </div>
              {bmi > 0 && (
                <div className="mt-6 rounded-xl bg-primary-soft p-4">
                  <div className="text-xs uppercase text-muted-foreground">Your BMI</div>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="font-display text-3xl font-bold">{bmi}</span>
                    <span className={`text-sm font-medium ${cat.color}`}>{cat.label}</span>
                  </div>
                </div>
              )}
            </Section>
          )}

          {step === 3 && (
            <Section title="Your fitness profile" subtitle="We'll automatically recommend the best plan for your BMI.">
              <div className="space-y-3">
                <div className="rounded-xl bg-accent p-4">
                  <div className="text-xs uppercase text-muted-foreground">Your BMI Category</div>
                  <div className="font-display text-2xl font-bold text-accent-foreground">{cat.label}</div>
                  <div className="text-sm text-accent-foreground/80 mt-1">{cat.description}</div>
                </div>
                
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-start gap-2">
                    <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Your personalized plan will be based on your BMI to help you achieve optimal fitness.</span>
                  </div>
                </div>

                <FieldRow label="Activity level">
                  <div className="space-y-2">
                    {ACTIVITY.map((a) => (
                      <button key={a.v} type="button" onClick={() => setActivity(a.v)}
                        className={`flex w-full items-start justify-between rounded-lg border p-3 text-left transition ${activity === a.v ? "border-primary bg-primary-soft" : "hover:bg-muted"}`}>
                        <div>
                          <div className="text-sm font-medium">{a.l}</div>
                          <div className="text-xs text-muted-foreground">{a.d}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </FieldRow>
                {tdee > 0 && (
                  <div className="rounded-xl bg-accent p-4">
                    <div className="text-xs uppercase text-muted-foreground">Estimated daily calories (TDEE)</div>
                    <div className="font-display text-3xl font-bold text-accent-foreground">{tdee} kcal</div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section title="Create your avatar" subtitle="This is the friendly face you'll see on every screen.">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <UserAvatar seed={avatarSeed} config={{ ...avatar, gender }} size={140} />
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
                    className="gap-2"
                  >
                    🔄 Regenerate
                  </Button>
                  <Button className="gap-2">
                    ✓ Keep This Avatar
                  </Button>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 w-full">
                  <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span><span className="font-medium">Don't like this avatar?</span> Click "Regenerate" to get a new one. You can change it anytime in your profile settings.</span>
                  </p>
                </div>
              </div>
            </Section>
          )}

          {step === 5 && (
            <Section title="Dietary preferences" subtitle="Optional — skip if none apply.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DIETARY.map((d) => {
                  const checked = diets.includes(d);
                  return (
                    <label key={d} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition ${checked ? "border-primary bg-primary-soft" : "hover:bg-muted"}`}>
                      <Checkbox checked={checked} onCheckedChange={(c) => {
                        setDiets(c ? [...diets, d] : diets.filter((x) => x !== d));
                      }} />
                      {d}
                    </label>
                  );
                })}
              </div>
            </Section>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 1}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < totalSteps ? (
              <Button onClick={next}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={finish} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finish & enter app"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Picker({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 flex flex-wrap gap-1">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)}
            className={`rounded-full border px-3 py-1 text-xs capitalize transition ${value === o ? "border-primary bg-primary-soft text-primary" : "hover:bg-muted"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
