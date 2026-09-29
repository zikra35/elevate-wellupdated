import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export type Profile = {
  id: string;
  email?: string;
  name?: string;
  avatar_seed?: string;
  avatar_config?: any;
  gender?: string;
  tdee?: number;
  dietary_preferences?: string[];
  onboarding_completed?: boolean;
  // Body metrics
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  date_of_birth?: string;
  goal?: string;
  desired_weight_kg?: number;
  activity_level?: string;
  // Cycle tracking
  cycle_tracking_enabled?: boolean;
  cycle_length_days?: number;
  period_length_days?: number;
  last_period_start?: string;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      // data returned from /auth/me is { user: { id, email, name, ... } }
      setProfile(data.user);
    } catch (error) {
      console.error(error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { profile, loading, refresh };
}
