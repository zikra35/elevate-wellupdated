import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Supplement {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string[];
  takenToday: boolean;
  lastTakenDate?: string;
}

interface SuggestionItem {
  name: string;
  dosage: string;
  bestTime: string;
  rationale: string;
}

export function SupplementsSection() {
  const { profile } = useProfile();
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", dosage: "", frequency: "", timeOfDay: [] });

  useEffect(() => {
    loadSupplements();
    loadSuggestions();
  }, [profile]);

  async function loadSupplements() {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/supplements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSupplements(data);
      }
    } catch (error) {
      console.error("Failed to load supplements:", error);
    }
  }

  async function loadSuggestions() {
    if (!profile) return;
    setSuggestionsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/ai/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile,
          phase: profile.gender === "female" ? profile.cycle_phase : null,
          mood: null,
          anxietyLevel: null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Parse suggestions if they come as a string
        if (data.supplements) {
          setSuggestions(Array.isArray(data.supplements) ? data.supplements : []);
        }
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function addSupplement() {
    if (!form.name) {
      toast.error("Please enter a supplement name");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/supplements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const newSupplement = await res.json();
        setSupplements([...supplements, newSupplement]);
        setForm({ name: "", dosage: "", frequency: "", timeOfDay: [] });
        setOpen(false);
        toast.success("Supplement added!");
      } else {
        toast.error("Failed to add supplement");
      }
    } catch (error) {
      toast.error("Error adding supplement");
    } finally {
      setLoading(false);
    }
  }

  async function addSuggestion(suggestion: SuggestionItem) {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/supplements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: suggestion.name,
          dosage: suggestion.dosage,
          frequency: "Daily",
          timeOfDay: [suggestion.bestTime],
        }),
      });

      if (res.ok) {
        const newSupplement = await res.json();
        setSupplements([...supplements, newSupplement]);
        toast.success(`Added ${suggestion.name}!`);
      }
    } catch (error) {
      toast.error("Error adding supplement");
    } finally {
      setLoading(false);
    }
  }

  async function markTaken(id: string) {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/supplements/${id}/taken`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const updated = await res.json();
        setSupplements(supplements.map((s) => (s._id === id ? updated : s)));
        toast.success("Marked as taken!");
      }
    } catch (error) {
      toast.error("Error updating supplement");
    }
  }

  async function deleteSupplement(id: string) {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/supplements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSupplements(supplements.filter((s) => s._id !== id));
        toast.success("Supplement deleted");
      }
    } catch (error) {
      toast.error("Error deleting supplement");
    }
  }

  return (
    <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold">Vitamins & Supplements</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Supplement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Supplement Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Vitamin D3"
                />
              </div>
              <div>
                <Label>Dosage</Label>
                <Input
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  placeholder="e.g., 2000 IU"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Input
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  placeholder="e.g., Daily"
                />
              </div>
              <div>
                <Label>Time of Day</Label>
                <div className="flex gap-2 mt-2">
                  {["Morning", "Afternoon", "Evening"].map((time) => (
                    <Button
                      key={time}
                      variant={form.timeOfDay.includes(time) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const updated = form.timeOfDay.includes(time)
                          ? form.timeOfDay.filter((t) => t !== time)
                          : [...form.timeOfDay, time];
                        setForm({ ...form, timeOfDay: updated });
                      }}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={addSupplement} disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Supplement"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {supplements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No supplements yet. Add one to get started!
          </p>
        ) : (
          supplements.map((supp) => (
            <div
              key={supp._id}
              className="rounded-2xl bg-muted/40 p-3 shadow-[var(--shadow-neumorphic-inset-sm)] flex justify-between items-center"
            >
              <div className="flex items-center gap-3 flex-1">
                <Checkbox
                  checked={supp.takenToday}
                  onCheckedChange={() => markTaken(supp._id)}
                />
                <div>
                  <div className="font-medium text-sm">{supp.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {supp.dosage} · {supp.timeOfDay.join(", ")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {supp.takenToday && <Badge variant="secondary" className="text-xs">Taken</Badge>}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete supplement?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove {supp.name} from your list.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteSupplement(supp._id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Suggestions Section */}
      <div className="mt-6 border-t pt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Suggestions
          </h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadSuggestions}
            disabled={suggestionsLoading}
          >
            {suggestionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {suggestionsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggestions available</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((sugg, idx) => (
              <div key={idx} className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      {sugg.name}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {sugg.dosage} · {sugg.bestTime}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {sugg.rationale}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addSuggestion(sugg)}
                    disabled={loading}
                    className="ml-2"
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground italic">
        Supplement suggestions are informational only and not a substitute for medical advice.
      </div>
    </div>
  );
}
