import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Trash2, Play, Pause, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_app/plans')({
  component: PlansPage,
});

interface Plan {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'disabled';
  suggestions: {
    workouts: any[];
    meals: any[];
    schedule: any[];
  };
  progress: {
    workoutsCompleted: number;
    mealsLogged: number;
    scheduleAdherence: number;
  };
  isMockGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    // Listen for meal and workout logging events
    const handleMealLogged = () => loadPlans();
    const handleWorkoutLogged = () => loadPlans();

    window.addEventListener('mealLogged', handleMealLogged);
    window.addEventListener('workoutLogged', handleWorkoutLogged);

    return () => {
      window.removeEventListener('mealLogged', handleMealLogged);
      window.removeEventListener('workoutLogged', handleWorkoutLogged);
    };
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${API_BASE_URL}/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      } else {
        console.error('Failed to load plans');
      }
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(planId: string) {
    try {
      setActionLoading(planId);
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${API_BASE_URL}/plans/${planId}/activate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        await loadPlans();
      }
    } catch (err) {
      console.error('Error activating plan:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeactivate(planId: string) {
    try {
      setActionLoading(planId);
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${API_BASE_URL}/plans/${planId}/deactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        await loadPlans();
      }
    } catch (err) {
      console.error('Error deactivating plan:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(planId: string) {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      setActionLoading(planId);
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${API_BASE_URL}/plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        await loadPlans();
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
    } finally {
      setActionLoading(null);
    }
  }



  if (loading) {
    return (
      <div className="mx-auto max-w-6xl flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">My Plans</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personalized wellness plans
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-3xl bg-card p-12 shadow-[var(--shadow-neumorphic)] text-center">
          <p className="text-muted-foreground mb-4">
            You don't have any plans yet. Complete your onboarding to get started!
          </p>
          <Button onClick={() => navigate({ to: '/dashboard' })}>
            Go to Dashboard
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => (
            <div
              key={plan._id}
              className="rounded-3xl bg-card shadow-[var(--shadow-neumorphic)] overflow-hidden"
            >
              {/* Plan Header */}
              <button
                onClick={() => setExpandedPlan(expandedPlan === plan._id ? null : plan._id)}
                className="w-full p-6 hover:bg-muted/20 transition flex items-center justify-between"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        plan.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {plan.status === 'active' ? 'ACTIVE' : 'DISABLED'}
                    </span>
                    {plan.isMockGenerated && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        Mock
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    expandedPlan === plan._id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Plan Details */}
              {expandedPlan === plan._id && (
                <div className="border-t border-border p-6 space-y-6 bg-muted/10">
                  {/* Progress Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-muted/40 p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {plan.progress.workoutsCompleted}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Workouts Completed</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {plan.progress.mealsLogged}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Meals Logged</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {plan.progress.scheduleAdherence}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Schedule Adherence</p>
                    </div>
                  </div>

                  {/* Suggestions Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-900">
                        {plan.suggestions?.workouts?.length || 0} Workouts
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {plan.suggestions?.workouts
                          ?.slice(0, 2)
                          .map(w => w.name)
                          .join(', ') || 'No workouts'}
                        {(plan.suggestions?.workouts?.length || 0) > 2 && '...'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-green-50 p-4">
                      <p className="text-sm font-semibold text-green-900">
                        {plan.suggestions?.meals?.length || 0} Meals
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        7-day meal plan included
                      </p>
                    </div>
                    <div className="rounded-2xl bg-purple-50 p-4">
                      <p className="text-sm font-semibold text-purple-900">
                        {plan.suggestions?.schedule?.length || 0} Activities
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        Daily schedule included
                      </p>
                    </div>
                  </div>



                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    {plan.status === 'disabled' ? (
                      <Button
                        onClick={() => handleActivate(plan._id)}
                        disabled={actionLoading === plan._id}
                        className="flex items-center gap-2"
                      >
                        {actionLoading === plan._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Activate Plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleDeactivate(plan._id)}
                        disabled={actionLoading === plan._id}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {actionLoading === plan._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                        Deactivate
                      </Button>
                    )}

                    <Button
                      onClick={() => handleDelete(plan._id)}
                      disabled={actionLoading === plan._id}
                      variant="outline"
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      {actionLoading === plan._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
