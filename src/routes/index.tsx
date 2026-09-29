import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Brain, Moon, Salad, Sparkles, Heart, Zap, Flame } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: "var(--gradient-soft)" }}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000" />
      </div>

      {/* Nav */}
      <header className="relative flex items-center justify-between px-6 py-5 md:px-12 z-10">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground animate-bounce">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">ELEVATE WELL</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth/login"><Button variant="ghost">Login</Button></Link>
          <Link to="/auth/signup"><Button>Sign Up</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-12 pb-20 md:px-12 md:pt-20 z-10">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-3 mb-6 animate-fade-in">
              <div className="h-1 w-12 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full shadow-lg shadow-teal-400/50" />
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 px-4 py-2 text-sm font-semibold text-teal-700 shadow-md border border-teal-200">
                <Flame className="h-4 w-4" />
                Holistic wellness, beautifully simple
              </div>
              <div className="h-1 w-12 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full shadow-lg shadow-cyan-400/50" />
            </div>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Your wellness,<br/>
              <span style={{ background: "var(--gradient-hero)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                elevated daily.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Personalized workouts, sleep guidance, mental health support, and AI-crafted meals — all in one calm, clean space.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth/signup">
                <Button size="lg" className="shadow-[var(--shadow-glow)] hover:scale-105 transition-transform">Start free</Button>
              </Link>
              <Link to="/auth/login"><Button size="lg" variant="outline" className="hover:scale-105 transition-transform">I have an account</Button></Link>
            </div>
          </div>

          {/* Animated feature cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Activity, label: "Workouts", desc: "Video-led strength, yoga, and HIIT sessions", color: "from-orange-400 to-orange-600" },
              { icon: Moon, label: "Sleep", desc: "Smart wind-down routines and sounds", color: "from-blue-400 to-indigo-600" },
              { icon: Brain, label: "Wellness", desc: "Expert tips, recovery, and mindset tools", color: "from-purple-400 to-purple-600" },
              { icon: Salad, label: "Meals", desc: "AI meal plans and recipe ideas", color: "from-emerald-400 to-teal-600" },
            ].map((f, idx) => (
              <div 
                key={f.label} 
                className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${f.color} text-white animate-spin-slow`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-semibold">{f.label}</div>
                <div className="text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-6 md:px-12 z-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Meal planning made simple", body: "Generate balanced AI meal plans, swap plates, and keep recipe steps handy.", icon: Salad },
            { title: "Workout videos on demand", body: "Follow guided sessions with expert energy and complete routines from anywhere.", icon: Activity },
            { title: "Healthy living resources", body: "Discover wellness tips, routines, and daily habits to feel stronger every day.", icon: Sparkles },
          ].map((item, idx) => (
            <div key={item.title} className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)] hover:shadow-lg transition-all duration-300">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Floating animated icons section */}
      <section className="relative mx-auto max-w-6xl px-6 py-20 md:px-12 z-10">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold">Built for your wellness journey</h2>
          <p className="mt-3 text-muted-foreground">Track, improve, and celebrate every step</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Heart, label: "Track", desc: "Monitor cycles, moods, and metrics" },
            { icon: Zap, label: "Improve", desc: "AI-powered personalized guidance" },
            { icon: Sparkles, label: "Celebrate", desc: "Watch your wellness bloom" },
          ].map((item, idx) => (
            <div key={item.label} className="text-center animate-fade-in" style={{ animationDelay: `${idx * 0.15}s` }}>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-foreground/50 grid place-items-center animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }}>
                <item.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg">{item.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Animated CTA section */}
      <section className="relative mx-auto max-w-4xl px-6 py-20 md:px-12 text-center z-10">
        <div className="rounded-3xl border bg-card/50 backdrop-blur p-8 md:p-12 shadow-lg animate-fade-in">
          <h2 className="font-display text-3xl font-bold">Ready to elevate your wellness?</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Join thousands transforming their health with personalized, compassionate wellness tools.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/auth/signup">
              <Button size="lg" className="shadow-[var(--shadow-glow)] hover:scale-105 transition-transform">
                Start your journey
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
