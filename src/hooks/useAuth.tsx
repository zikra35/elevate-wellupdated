import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type User = {
  id: string;
  email: string;
  name?: string;
  avatar_seed?: string;
  avatar_config?: any;
};

type AuthCtx = {
  session: { user: User; token: string } | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<{ user: User; token: string } | null>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  refreshSession: async () => null,
});

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: User; token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshSession() {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return null;
      }

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem("authToken");
        setSession(null);
        setLoading(false);
        return null;
      }

      const userData = await res.json();
      const newSession = { user: userData, token };
      setSession(newSession);
      setLoading(false);
      return newSession;
    } catch (error) {
      console.error("Session refresh failed:", error);
      setLoading(false);
      return null;
    }
  }

  async function login(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }

      const { user, token } = await res.json();
      localStorage.setItem("authToken", token);
      setSession({ user, token });
    } catch (error) {
      throw error;
    }
  }

  async function signup(email: string, password: string, name: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Signup failed");
      }

      const { user, token } = await res.json();
      localStorage.setItem("authToken", token);
      setSession({ user, token });
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    localStorage.removeItem("authToken");
    setSession(null);
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, login, signup, logout, refreshSession }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
