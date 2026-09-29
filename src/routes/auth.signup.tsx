import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthShell, Field } from "./auth.login";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
});

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await signup(email, password, name);
      toast.success("Account created! Please log in.");
      await navigate({ to: "/auth/login", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Create your account" subtitle="Start your personalized wellness journey">
    <form onSubmit={onSubmit} className="space-y-4">
      <Field id="name" label="Full name" value={name} onChange={setName} required />
      <Field id="email" label="Email" type="email" value={email} onChange={setEmail} required />
      <Field id="password" label="Password" type="password" value={password} onChange={setPassword} required />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already a member? <Link to="/auth/login" className="font-medium text-primary">Sign in</Link>
      </p>
    </form>
  </AuthShell>;
}
