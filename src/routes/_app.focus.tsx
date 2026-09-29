import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Brain, Zap } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const Route = createFileRoute("/_app/focus")({
  component: FocusPage,
});

function FocusPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGames();
    }
  }, [user]);

  async function loadGames() {
    try {
      setLoading(true);
      const data = await apiCall("/games");
      setGames(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load focused games.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="rounded-3xl p-8 text-primary-foreground shadow-[var(--shadow-neumorphic)]" style={{ background: "linear-gradient(135deg, #FFBABA 0%, #88C8C8 100%)" }}>
        <div className="flex items-center gap-3">
          <Brain className="h-10 w-10 text-white" />
          <div>
            <h1 className="font-display text-4xl font-bold text-white">Focus & React</h1>
            <p className="text-sm text-white/90 font-medium mt-1">Boost your mental clarity and reaction speed.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {games.length > 0 ? games.map((g) => (
          <div key={g._id} className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)] flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer">
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-[var(--shadow-neumorphic-sm)] mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-xl">{g.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{g.description}</p>
            </div>
            <Button className="mt-6 w-full shadow-[var(--shadow-neumorphic-sm)]" asChild>
              <a href={g.url} target="_blank" rel="noopener noreferrer">Play Game</a>
            </Button>
          </div>
        )) : (
          <div className="col-span-full rounded-3xl bg-card p-8 text-center shadow-[var(--shadow-neumorphic)]">
            <p className="text-muted-foreground">No active focus games suggested by your coach right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
