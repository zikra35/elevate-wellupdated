import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Trash2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, localDateString, tzOffset } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HistoryRange = "today" | "7d" | "30d" | "all";

const RANGES: { value: HistoryRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All" },
];

const RANGE_DAYS: Record<HistoryRange, number | null> = { today: 1, "7d": 7, "30d": 30, all: null };

/** Query string for the history endpoints, using the user's local calendar. */
export function historyQuery(range: HistoryRange): string {
  const today = new Date();
  const params = new URLSearchParams({ to: localDateString(today), tzOffset: String(tzOffset()) });
  const days = RANGE_DAYS[range];
  if (days) {
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
    params.set("from", localDateString(from));
  }
  return params.toString();
}

/** "2026-09-30" -> "Today" / "Yesterday" / "Mon, 28 Sep 2026" */
export function dayLabel(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (day === localDateString(today)) return "Today";
  if (day === localDateString(yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

type BaseItem = { id: string; date: string; name: string };

/**
 * Shared history page body: range filter, per-day groups, delete with confirm,
 * loading/error/empty states. Pages supply how to fetch, render and delete items.
 */
export function HistoryList<T extends BaseItem>({
  endpoint,
  itemsKey,
  refreshEvent,
  noun,
  renderItem,
  renderDaySummary,
  deletePath,
  empty,
}: {
  endpoint: string;
  itemsKey: string;
  refreshEvent: string;
  noun: string;
  renderItem: (item: T) => ReactNode;
  renderDaySummary?: (items: T[]) => ReactNode;
  deletePath: (item: T) => string;
  empty: { icon: ReactNode; title: string; body: string; action?: ReactNode };
}) {
  const [range, setRange] = useState<HistoryRange>("7d");
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load(r: HistoryRange = range) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${endpoint}?${historyQuery(r)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Couldn't load your ${noun} history`);
      setItems(data[itemsKey] || []);
    } catch (e: any) {
      setError(e?.message || `Couldn't load your ${noun} history`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Refresh when something is logged from the top bar while this page is open
  useEffect(() => {
    const onLogged = () => void load();
    window.addEventListener(refreshEvent, onLogged);
    return () => window.removeEventListener(refreshEvent, onLogged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, refreshEvent]);

  const groups = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
  }, [items]);

  async function confirmDelete() {
    const item = pendingDelete;
    setPendingDelete(null);
    if (!item) return;
    setDeletingId(item.id);
    try {
      const res = await apiFetch(deletePath(item), { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Delete failed");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`Deleted "${item.name}"`);
    } catch (e: any) {
      toast.error(e?.message || `Couldn't delete that ${noun}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Date range" className="inline-flex rounded-xl border bg-card p-1 shadow-[var(--shadow-soft)]">
          {RANGES.map((r) => (
            <button
              key={r.value}
              role="tab"
              aria-selected={range === r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                range === r.value ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading} aria-label="Refresh">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void load()}>Try again</Button>
        </div>
      ) : groups.length === 0 ? (
        <div className="fade-in rounded-3xl border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">{empty.icon}</div>
          <h2 className="font-display text-lg font-bold">{empty.title}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{empty.body}</p>
          {empty.action && <div className="mt-5">{empty.action}</div>}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, dayItems]) => (
            <section key={day} className="fade-in">
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">{dayLabel(day)}</h2>
                <span className="text-xs text-muted-foreground">
                  {renderDaySummary ? renderDaySummary(dayItems) : `${dayItems.length} ${noun}${dayItems.length === 1 ? "" : "s"}`}
                </span>
              </div>
              <ul className="space-y-2">
                {dayItems.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)] transition-opacity",
                      deletingId === item.id && "opacity-50",
                    )}
                  >
                    <div className="min-w-0 flex-1">{renderItem(item)}</div>
                    <button
                      onClick={() => setPendingDelete(item)}
                      disabled={deletingId === item.id}
                      aria-label={`Delete ${item.name}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Delete this ${noun}?`}
        description={pendingDelete ? `"${pendingDelete.name}" will be removed from your history. This can't be undone.` : undefined}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
