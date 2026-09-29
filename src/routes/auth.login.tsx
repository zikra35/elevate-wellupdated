import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, Heart, Droplets, Brain, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Welcome back" subtitle="Sign in to continue your wellness journey">
    <form onSubmit={onSubmit} className="space-y-4">
      <Field id="email" label="Email" type="email" value={email} onChange={setEmail} required />
      <Field id="password" label="Password" type="password" value={password} onChange={setPassword} required />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here? <Link to="/auth/signup" className="font-medium text-primary">Create an account</Link>
      </p>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Enhanced Left Side with Gradient & Animations */}
      <div className="hidden md:flex md:flex-col bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700">
        <div className="relative flex h-full flex-col justify-between p-10 text-white overflow-hidden">
          {/* Animated gradient orbs background */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Large animated orb - top left */}
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
            
            {/* Medium animated orb - bottom right */}
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
            
            {/* Small animated orb - center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />
            
            {/* Accent orb - top right */}
            <div className="absolute top-20 right-20 w-40 h-40 bg-coral-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4.5s", animationDelay: "0.5s" }} />
          </div>

          {/* Floating animated icons with enhanced styling */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Heart - top left */}
            <div className="absolute top-1/4 left-1/4 animate-float opacity-30 drop-shadow-lg">
              <div className="relative">
                <Heart className="h-16 w-16 text-white" fill="white" />
              </div>
            </div>
            
            {/* Droplets - bottom right */}
            <div className="absolute bottom-1/3 right-1/4 animate-float-delayed opacity-25 drop-shadow-lg" style={{ animationDelay: "1s" }}>
              <Droplets className="h-14 w-14 text-white" fill="white" />
            </div>
            
            {/* Brain - top right */}
            <div className="absolute top-1/3 right-1/3 animate-float opacity-20 drop-shadow-lg" style={{ animationDelay: "2s" }}>
              <Brain className="h-16 w-16 text-white" />
            </div>
            
            {/* Moon - bottom left */}
            <div className="absolute bottom-1/4 left-1/3 animate-float-delayed opacity-25 drop-shadow-lg" style={{ animationDelay: "1.5s" }}>
              <Moon className="h-14 w-14 text-white" fill="white" />
            </div>
          </div>

          {/* Animated gradient line accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />

          {/* Header Content */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Sparkles className="h-6 w-6 text-white animate-spin-slow group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight group-hover:text-cyan-100 transition-colors">ELEVATE WELL</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="relative z-10">
            <h2 className="font-display text-4xl font-bold leading-tight animate-fade-in text-white drop-shadow-lg">
              Tiny daily steps.<br/>
              <span className="bg-gradient-to-r from-cyan-100 to-white bg-clip-text text-transparent">Lifelong wellness.</span>
            </h2>
            <p className="mt-4 max-w-sm text-white/90 animate-fade-in text-lg leading-relaxed drop-shadow-md" style={{ animationDelay: "0.2s" }}>
              A calmer, smarter, more personalized way to take care of you. Your wellness journey starts here.
            </p>
            
            {/* Feature highlights */}
            <div className="mt-8 space-y-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-sm">AI-powered personalized recommendations</span>
              </div>
              <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-sm">Track your health & wellness goals</span>
              </div>
              <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-sm">Join a supportive wellness community</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs text-white/60">© 2026 Elevate Well</span>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0s" }} />
              <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0.3s" }} />
              <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0.6s" }} />
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(5deg); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(30px) rotate(-5deg); }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-float {
            animation: float 5s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 5s ease-in-out infinite;
          }
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
          .animate-fade-in {
            animation: fade-in 0.8s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      </div>

      {/* Right Side - Form with Glassmorphism */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background via-background to-background/80 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-32 h-32 bg-teal-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
          <div className="absolute bottom-20 left-10 w-40 h-40 bg-coral-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Form Container with Glassmorphism */}
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl p-8 shadow-2xl border border-white/20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {/* Header */}
            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {/* Form Content */}
            <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {children}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="mt-6 flex justify-center gap-2 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  id, label, type = "text", value, onChange, required, autoComplete,
}: { id: string; label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean; autoComplete?: string }) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="text-foreground font-semibold text-sm">{label}</Label>
      <div className="relative group">
        <Input 
          id={id} 
          type={type} 
          value={value} 
          required={required} 
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full transition-all duration-300"
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-400/0 to-cyan-400/0 group-focus-within:from-teal-400/20 group-focus-within:to-cyan-400/20 pointer-events-none transition-all duration-300" />
      </div>
    </div>
  );
}
