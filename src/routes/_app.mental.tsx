import { createFileRoute } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Brain, Send, Wind, Sparkles, Smile, BookOpen, Trash2, AlertCircle, Music, RotateCcw, Gamepad2, MessageCircle, Flower2, Leaf, Waves, Flame, Star, Moon, Sun, Leaf as LeafIcon, Puzzle, Palette, Hash, Zap, CheckCircle2, Cloud, ThumbsUp, TrendingDown, AlertTriangle, Frown, Phone, ExternalLink, Play, Square } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry, chatWithSage, getAISuggestions } from "@/lib/backend-api";
import { MUSIC_MOODS, TRACKS, youtubeUrl, spotifyUrl, type MusicMood } from "@/lib/music";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_BASE_URL } from "@/lib/api";

export const Route = createFileRoute("/_app/mental")({
  component: MentalPage,
});

type MentalTab = "chat" | "breath" | "games" | "music" | "mood" | "journal";

// Lets any section switch tabs (e.g. Mood -> "Go to Breathing")
const MentalTabContext = createContext<(tab: MentalTab) => void>(() => {});
const useGoToTab = () => useContext(MentalTabContext);

const MENTAL_TABS: { value: MentalTab; label: string; icon: typeof Brain }[] = [
  { value: "chat", label: "Therapist", icon: Brain },
  { value: "breath", label: "Breathe", icon: Wind },
  { value: "games", label: "Games", icon: Gamepad2 },
  { value: "music", label: "Music", icon: Music },
  { value: "mood", label: "Mood", icon: Smile },
  { value: "journal", label: "Journal", icon: BookOpen },
];

function MentalPage() {
  const [tab, setTab] = useState<MentalTab>("chat");
  const goToTab = (next: MentalTab) => {
    setTab(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <MentalTabContext.Provider value={goToTab}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Mental Health</h1>
          <p className="text-sm text-muted-foreground">Breathe, talk, play, reflect.</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as MentalTab)}>
          <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 sm:grid sm:grid-cols-6">
            {MENTAL_TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="flex shrink-0 items-center gap-2 rounded-full border border-transparent bg-transparent px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[var(--shadow-glow)] data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted"
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="chat" className="mt-6"><Therapist /></TabsContent>
          <TabsContent value="breath" className="mt-6"><Breathing /></TabsContent>
          <TabsContent value="games" className="mt-6"><Games /></TabsContent>
          <TabsContent value="music" className="mt-6"><MusicTab /></TabsContent>
          <TabsContent value="mood" className="mt-6"><Mood /></TabsContent>
          <TabsContent value="journal" className="mt-6"><Journal /></TabsContent>
        </Tabs>
      </div>
    </MentalTabContext.Provider>
  );
}

type Msg = { role: "user" | "assistant"; content: string };

function Therapist() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi, I'm Sage. I'm here to listen. How are you feeling right now?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setBusy(true);

    try {
      const response = await chatWithSage(next, conversationId);
      if (response.conversationId) setConversationId(response.conversationId);
      setMessages(m => [...m, {
        role: "assistant",
        content: response.reply || "I appreciate you sharing that with me.",
      }]);
    } catch (e) {
      console.error("Sage error:", e);
      toast.error("Sage couldn't respond. Your message is back in the box, try sending again.");
      // Remove the user message and put the text back so they can retry
      setMessages(m => m.slice(0, -1));
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  function startNewSession() {
    setMessages([
      { role: "assistant", content: "Hi, I'm Sage. I'm here to listen. How are you feeling right now?" },
    ]);
    setConversationId(undefined);
    setInput("");
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer Banner */}
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Sage is not a licensed therapist and is not a substitute for professional mental health care.
          If you're in crisis, call <a href="tel:1122" className="font-semibold underline">1122</a> or
          Umang <a href="tel:03117786264" className="font-semibold underline">0311-7786264</a> (Pakistan), or your local emergency number.
        </AlertDescription>
      </Alert>

      {/* Chat Container */}
      <div className="rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
        <div ref={scrollRef} className="h-[500px] overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div className={`fade-in max-w-[85%] sm:max-w-[70%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.role === "assistant"
                  ? <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown>{m.content || "…"}</ReactMarkdown></div>
                  : m.content}
              </div>
            </div>
          ))}
          {/* Typing Indicator */}
          {busy && (
            <div className="flex justify-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Quick Reply Chips */}
        {!busy && (
          <div className="border-t p-4 flex flex-wrap gap-2">
            {["Pretty good", "Not great", "Anxious", "Stressed", "Overwhelmed"].map((chip) => (
              <button
                key={chip}
                onClick={() => void send(chip)}
                className="rounded-full bg-primary/10 border border-primary px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 border-t p-4">
          <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Share what's on your mind…" rows={1}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={busy} />
          <Button onClick={() => void send()} disabled={busy || !input.trim()} size="icon" className="h-10 w-10 shrink-0" aria-label="Send"><Send className="h-4 w-4" /></Button>
          <Button onClick={startNewSession} disabled={busy} size="icon" className="h-10 w-10 shrink-0" variant="outline" title="Start new session" aria-label="Start new session"><RotateCcw className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

type BreathKind = "in" | "hold" | "out" | "rest";
type BreathPattern = { key: string; name: string; desc: string; phases: { kind: BreathKind; secs: number }[] };

const BREATH_PATTERNS: BreathPattern[] = [
  {
    key: "478",
    name: "4-7-8",
    desc: "Inhale 4, hold 7, exhale 8. Great for winding down and sleep.",
    phases: [{ kind: "in", secs: 4 }, { kind: "hold", secs: 7 }, { kind: "out", secs: 8 }],
  },
  {
    key: "box",
    name: "Box",
    desc: "Inhale 4, hold 4, exhale 4, hold 4. Steadies you under stress.",
    phases: [{ kind: "in", secs: 4 }, { kind: "hold", secs: 4 }, { kind: "out", secs: 4 }, { kind: "rest", secs: 4 }],
  },
  {
    key: "46",
    name: "4-6",
    desc: "Inhale 4, exhale 6. A longer exhale calms the nervous system.",
    phases: [{ kind: "in", secs: 4 }, { kind: "out", secs: 6 }],
  },
];

const BREATH_LABEL: Record<BreathKind, string> = { in: "Breathe in", hold: "Hold", out: "Breathe out", rest: "Hold" };
const SCALE_SMALL = 0.8;
const SCALE_LARGE = 1.4;

function Breathing() {
  const [patternKey, setPatternKey] = useState(BREATH_PATTERNS[0].key);
  const [totalRounds, setTotalRounds] = useState(4);
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [remaining, setRemaining] = useState(BREATH_PATTERNS[0].phases[0].secs);
  const [round, setRound] = useState(1);

  const pattern = BREATH_PATTERNS.find(p => p.key === patternKey) ?? BREATH_PATTERNS[0];
  const phase = pattern.phases[phaseIdx];

  function reset(p: BreathPattern = pattern) {
    setRunning(false);
    setPhaseIdx(0);
    setRemaining(p.phases[0].secs);
    setRound(1);
  }

  // One tick per second while running
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // Advance to the next phase / round when the current phase runs out
  useEffect(() => {
    if (!running || remaining > 0) return;
    const nextIdx = (phaseIdx + 1) % pattern.phases.length;
    if (nextIdx === 0) {
      if (round >= totalRounds) {
        reset();
        toast.success(`Nice work. ${totalRounds} rounds of ${pattern.name} breathing done.`);
        return;
      }
      setRound(r => r + 1);
    }
    setPhaseIdx(nextIdx);
    setRemaining(pattern.phases[nextIdx].secs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  // The circle grows over the whole inhale and shrinks over the whole exhale;
  // holds keep it where it is.
  let scale = SCALE_SMALL;
  if (running) {
    if (phase.kind === "in" || phase.kind === "hold") scale = SCALE_LARGE;
  }
  const transitionSecs = running && (phase.kind === "in" || phase.kind === "out") ? phase.secs : 0.6;

  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-10">
      {/* Pattern picker */}
      <div role="radiogroup" aria-label="Breathing pattern" className="flex flex-wrap justify-center gap-2">
        {BREATH_PATTERNS.map(p => (
          <button
            key={p.key}
            role="radio"
            aria-checked={p.key === patternKey}
            onClick={() => { setPatternKey(p.key); reset(p); }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              p.key === patternKey ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="mt-3 max-w-sm text-center text-sm text-muted-foreground">{pattern.desc}</p>

      <div className="relative my-10 h-64 w-64 flex-shrink-0 sm:h-80 sm:w-80">
        <div
          className="pointer-events-none absolute inset-0 rounded-full bg-primary-soft"
          style={{
            transform: `scale(${scale})`,
            transitionProperty: "transform",
            transitionDuration: `${transitionSecs}s`,
            transitionTimingFunction: "ease-in-out",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center" aria-live="polite">
            <div className="font-display text-3xl font-bold">{running ? BREATH_LABEL[phase.kind] : "Ready"}</div>
            <div className="mt-2 font-display text-6xl font-bold tabular-nums text-primary">{running ? remaining : pattern.phases[0].secs}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="text-sm font-medium text-muted-foreground tabular-nums">
          Round {round} of {totalRounds}
        </div>
        <select
          aria-label="Number of rounds"
          value={totalRounds}
          disabled={running}
          onChange={e => setTotalRounds(Number(e.target.value))}
          className="rounded-lg border bg-background px-2 py-1 text-sm"
        >
          {[3, 4, 6, 8, 10].map(n => <option key={n} value={n}>{n} rounds</option>)}
        </select>
      </div>

      <Button size="lg" onClick={() => (running ? reset() : setRunning(true))} className="mt-6 min-w-[140px]">
        {running ? <><Square className="h-4 w-4" /> Stop</> : <><Play className="h-4 w-4" /> Start</>}
      </Button>
    </div>
  );
}

function Games() {
  const [game, setGame] = useState<string | null>(null);
  const games = [
    { key: "memory", name: "Memory Match", desc: "Find matching pairs to sharpen recall and focus.", difficulty: "Easy", icon: Puzzle },
    { key: "tap", name: "Color Tap", desc: "Tap the correct color as fast as you can.", difficulty: "Medium", icon: Palette },
    { key: "count", name: "Mindful Counting", desc: "Count to 100 by 7s — clears racing thoughts.", difficulty: "Medium", icon: Hash },
    { key: "breath-bubble", name: "Bubble Breath", desc: "Pop bubbles in rhythm with your breathing.", difficulty: "Easy", icon: Zap },
  ];
  if (game) return <GameRunner gameKey={game} onExit={() => setGame(null)} />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {games.map(g => (
        <div key={g.key} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-glow)]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <g.icon className="h-8 w-8 text-primary" />
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              g.difficulty === "Easy" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
              g.difficulty === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" :
              "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            }`}>{g.difficulty}</span>
          </div>
          <h3 className="font-display text-lg font-bold">{g.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{g.desc}</p>
          <Button onClick={() => setGame(g.key)} className="mt-4 w-full bg-primary hover:bg-primary/90">
            Play
          </Button>
        </div>
      ))}
    </div>
  );
}

const MOOD_STYLE: Record<MusicMood, { card: string; chip: string; icon: typeof Moon }> = {
  Calm: { card: "from-teal-500 to-cyan-400", chip: "bg-primary/15 text-primary", icon: Cloud },
  Focus: { card: "from-amber-500 to-orange-400", chip: "bg-warning/15 text-warning", icon: Sparkles },
  Sleep: { card: "from-indigo-700 to-slate-600", chip: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300", icon: Moon },
  Energise: { card: "from-rose-500 to-orange-400", chip: "bg-secondary/15 text-secondary", icon: Sun },
};

function MusicTab() {
  const [mood, setMood] = useState<MusicMood | null>(null);
  const tracks = mood ? TRACKS.filter(t => t.mood === mood) : TRACKS;
  const blurb = mood ? MUSIC_MOODS.find(m => m.mood === mood)?.blurb : "Well-known tracks for every state of mind. Open them on YouTube or Spotify.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[null, ...MUSIC_MOODS.map(m => m.mood)].map((m) => (
          <button
            key={m ?? "all"}
            onClick={() => setMood(m)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              mood === m ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {m ?? "All"}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{blurb}</p>

      <div key={mood ?? "all"} className="fade-in grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((t) => {
          const style = MOOD_STYLE[t.mood];
          const Icon = style.icon;
          return (
            <div key={`${t.title}-${t.artist}`} className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]">
              <div className={`flex h-24 items-center justify-center bg-gradient-to-br ${style.card}`}>
                <Icon className="h-10 w-10 text-white/85" />
              </div>
              <div className="p-4">
                <h3 className="font-display text-base font-bold line-clamp-1" title={t.title}>{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.artist}</p>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t.note}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.chip}`}>{t.mood}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{t.genre}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={youtubeUrl(t)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  >
                    <Play className="h-3.5 w-3.5" /> YouTube
                  </a>
                  <a
                    href={spotifyUrl(t)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-600/40 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-600/10 dark:text-green-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Spotify
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GameRunner({ gameKey, onExit }: { gameKey: string; onExit: () => void }) {
  if (gameKey === "memory") return <MemoryGame onExit={onExit} />;
  if (gameKey === "tap") return <TapGame onExit={onExit} />;
  if (gameKey === "count") return <CountGame onExit={onExit} />;
  return <BubbleBreath onExit={onExit} />;
}

function MemoryGame({ onExit }: { onExit: () => void }) {
  const ICONS = [Flower2, Leaf, Waves, Flame, Star, Moon, Sun, LeafIcon];
  const [cards, setCards] = useState(() => 
    [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, i) => ({ icon, i, flipped: false, matched: false }))
  );
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  function flip(i: number) {
    if (cards[i].flipped || cards[i].matched || flipped.length === 2) return;
    const next = cards.map((c, idx) => idx === i ? { ...c, flipped: true } : c);
    const open = [...flipped, i];
    setCards(next); setFlipped(open);
    if (open.length === 2) {
      setMoves(m => m + 1);
      setTimeout(() => {
        if (next[open[0]].icon === next[open[1]].icon) {
          setCards(cs => cs.map((c, idx) => open.includes(idx) ? { ...c, matched: true } : c));
        } else {
          setCards(cs => cs.map((c, idx) => open.includes(idx) ? { ...c, flipped: false } : c));
        }
        setFlipped([]);
      }, 700);
    }
  }
  const won = cards.every(c => c.matched);

  return (
    <GameShell title="Memory Match" onExit={onExit} subtitle={`Moves: ${moves}${won ? " · You won!" : ""}`}>
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <button key={i} onClick={() => flip(i)} disabled={c.matched}
              className={`grid aspect-square place-items-center rounded-xl text-2xl font-bold transition ${c.flipped || c.matched ? "bg-teal-500 text-white" : "bg-muted hover:bg-muted/70 cursor-pointer"}`}>
              {c.flipped || c.matched ? <Icon className="h-6 w-6" /> : "?"}
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}

function TapGame({ onExit }: { onExit: () => void }) {
  const COLORS = ["bg-red-500","bg-blue-500","bg-emerald-500","bg-amber-500"];
  const NAMES = ["Red","Blue","Green","Yellow"];
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);

  // Single interval for the whole round — avoid recreating on every tick
  useEffect(() => {
    const t = setInterval(() => {
      setTime((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setTarget(Math.floor(Math.random() * 4)); }, [score]);

  function restart() { setScore(0); setTime(20); setTarget(Math.floor(Math.random() * 4)); }

  return (
    <GameShell title="Color Tap" onExit={onExit} subtitle={time > 0 ? `Tap: ${NAMES[target]} · Score ${score} · ${time}s` : `Final score: ${score}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {COLORS.map((c, i) => (
            <button key={i} disabled={time <= 0} onClick={() => i === target ? setScore(s => s + 1) : setScore(s => Math.max(0, s - 1))}
              className={`h-20 w-20 rounded-xl ${c} transition active:scale-95 font-bold text-white text-sm`}
              title={NAMES[i]}>
              {NAMES[i]}
            </button>
          ))}
        </div>
        {time <= 0 && <Button className="mt-4" onClick={restart}>Play again</Button>}
      </div>
    </GameShell>
  );
}

function CountGame({ onExit }: { onExit: () => void }) {
  const [n, setN] = useState(0);
  const [input, setInput] = useState("");
  const target = n + 7;
  return (
    <GameShell title="Mindful Counting (by 7s)" onExit={onExit} subtitle={`Now at ${n} · next: ${target}`}>
      <div className="space-y-3">
        <Textarea rows={1} inputMode="numeric" value={input} onChange={e => setInput(e.target.value.replace(/[^\d-]/g, ""))} placeholder={`Type ${target}`} />
        <Button className="w-full" onClick={() => {
          try {
            const trimmed = input.trim();
            if (!trimmed) { toast.error("Type a number first."); return; }
            const v = Number(trimmed);
            if (!Number.isFinite(v)) { toast.error("Numbers only please."); return; }
            if (v === target) { setN(target); setInput(""); if (target >= 100) toast.success("Beautiful focus 🌟"); }
            else toast.error("Not quite — breathe and try again.");
          } catch { toast.error("Something went wrong. Try again."); }
        }}>Submit</Button>
        <Button variant="ghost" className="w-full" onClick={() => { setN(0); setInput(""); }}>Reset</Button>
      </div>
    </GameShell>
  );
}

function BubbleBreath({ onExit }: { onExit: () => void }) {
  const [popped, setPopped] = useState(0);
  const [bubbles, setBubbles] = useState<{ id: number; x: number }[]>([]);
  useEffect(() => {
    const LIFE = 5000;
    const t = setInterval(() => {
      const id = Date.now() + Math.random();
      setBubbles(b => [...b, { id, x: Math.random() * 80 + 10 }].slice(-6));
      // auto-remove after the float animation completes so DOM stays light
      setTimeout(() => setBubbles(b => b.filter(x => x.id !== id)), LIFE);
    }, 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <GameShell title="Bubble Breath" onExit={onExit} subtitle={`Popped: ${popped} · breathe slowly as you tap`}>
      <div className="relative h-[400px] overflow-hidden rounded-2xl bg-gradient-to-b from-primary-soft to-card">
        {bubbles.map(b => (
          <button key={b.id} onClick={() => { setPopped(p => p + 1); setBubbles(bs => bs.filter(x => x.id !== b.id)); }}
            className="absolute h-14 w-14 rounded-full bg-primary/40 backdrop-blur will-change-transform"
            style={{ left: `${b.x}%`, bottom: -60, animation: "float 5s linear forwards" }} />
        ))}
      </div>
      <style>{`@keyframes float { from { transform: translateY(0); opacity: 0.9; } to { transform: translateY(-460px); opacity: 0; } }`}</style>
    </GameShell>
  );
}

function GameShell({ title, subtitle, children, onExit }: { title: string; subtitle: string; children: React.ReactNode; onExit: () => void }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>Exit</Button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Mood() {
  const goToTab = useGoToTab();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [mood, setMood] = useState(3);
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [avgMood, setAvgMood] = useState(0);
  const [avgAnxiety, setAvgAnxiety] = useState(0);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const FACES = ["😢","😕","😐","🙂","😄"];

  useEffect(() => { if (user) refresh(); }, [user]);
  
  async function refresh() {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/mental-health?days=7`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        
        // Calculate trend data and statistics
        if (data.length > 0) {
          const sortedData = [...data].sort((a, b) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime());
          
          const chartData = sortedData.map(log => ({
            date: new Date(log.date || log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            mood: parseInt(log.mood) || 0,
            anxiety: log.anxiety_level || 0,
          }));
          
          setTrendData(chartData);
          
          // Calculate averages
          const totalMood = sortedData.reduce((sum, log) => sum + (parseInt(log.mood) || 0), 0);
          const totalAnxiety = sortedData.reduce((sum, log) => sum + (log.anxiety_level || 0), 0);
          setAvgMood(Math.round((totalMood / sortedData.length) * 10) / 10);
          setAvgAnxiety(Math.round((totalAnxiety / sortedData.length) * 10) / 10);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  async function save() {
    if (!user) return;
    const token = localStorage.getItem("authToken");
    
    try {
      const res = await fetch(`${API_BASE_URL}/mental-health`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mood: String(mood), anxiety_level: anxietyLevel, notes: note, stress_level: 0 })
      });
      if (!res.ok) throw new Error("Failed to save mood");
      toast.success("Mood saved 💚"); 
      setNote(""); 
      refresh();
      
      // Fetch AI recommendations after mood is saved
      setLoadingRecommendations(true);
      try {
        const suggestions = await getAISuggestions(profile, undefined, mood, anxietyLevel);
        setRecommendations(suggestions);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        toast.error("Could not fetch recommendations");
      } finally {
        setLoadingRecommendations(false);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* High Anxiety Alert */}
      {anxietyLevel >= 8 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold text-amber-900">Take a moment to breathe</h3>
              <p className="mt-2 text-sm text-amber-800">
                Your anxiety level is elevated. Try some breathing exercises to help calm your mind and body.
              </p>
              <Button 
                className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => goToTab("breath")}
              >
                Go to Breathing Exercises
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mood Input Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h3 className="font-display text-lg font-bold">How do you feel?</h3>
        <div className="mt-4 flex justify-between">
          {FACES.map((f, i) => (
            <button key={i} onClick={() => setMood(i + 1)}
              className={`grid h-16 w-16 place-items-center rounded-full text-3xl transition ${mood === i + 1 ? "bg-primary-soft scale-110" : "bg-muted"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Anxiety Level Slider */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold">Anxiety Level</label>
            <span className="text-sm font-bold text-primary">{anxietyLevel}/10</span>
          </div>
          <SliderPrimitive.Root
            value={[anxietyLevel]}
            onValueChange={(value) => setAnxietyLevel(value[0])}
            min={1}
            max={10}
            step={1}
            className="relative flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
              <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-white shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
          </SliderPrimitive.Root>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>None</span>
            <span>Severe</span>
          </div>
        </div>

        <Textarea className="mt-4" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Anything on your mind? (optional)" />
        <Button className="mt-3" onClick={save}>Save check-in</Button>
      </div>

      {/* AI Recommendations Card */}
      {recommendations && (
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold">Personalized Recommendations</h3>
          </div>
          
          {/* Focus Games Section */}
          {recommendations.focusGames && recommendations.focusGames.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3">Recommended Focus Games</h4>
              <div className="flex flex-wrap gap-2">
                {recommendations.focusGames.slice(0, 2).map((game: string, idx: number) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => goToTab("games")}
                    className="cursor-pointer"
                  >
                    {game}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Calming Songs Section */}
          {recommendations.calmingSongs && recommendations.calmingSongs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Recommended Calming Songs</h4>
              <div className="space-y-2">
                {recommendations.calmingSongs.slice(0, 2).map((song: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => goToTab("music")}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition text-sm text-primary hover:underline"
                  >
                    🎵 {song}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="text-sm font-semibold">Recent</div>
          <ul className="mt-2 divide-y rounded-xl border">
            {logs.map(l => (
              <li key={l.id} className="flex items-center gap-3 p-3">
                <span className="text-2xl">{FACES[parseInt(l.mood) - 1] || FACES[2]}</span>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{new Date(l.date || l.created_at).toLocaleString()}</div>
                  <div className="text-xs mt-1">
                    {l.anxiety_level && <span className="inline-block mr-3">Anxiety: {l.anxiety_level}/10</span>}
                    {l.notes && <span className="text-sm">{l.notes}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Statistics */}
      {trendData.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="text-xs text-muted-foreground font-semibold">Average Mood (7 days)</div>
            <div className="mt-2 font-display text-3xl font-bold text-primary">{avgMood}</div>
            <div className="mt-1 text-xs text-muted-foreground">{FACES[Math.round(avgMood) - 1] || FACES[2]}</div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="text-xs text-muted-foreground font-semibold">Average Anxiety (7 days)</div>
            <div className="mt-2 font-display text-3xl font-bold text-secondary">{avgAnxiety}</div>
            <div className="mt-1 text-xs text-muted-foreground">out of 10</div>
          </div>
        </div>
      )}

      {/* 7-Day Trend Chart */}
      {trendData.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-lg font-bold mb-4">7-Day Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" domain={[0, 10]} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-primary)", r: 4 }}
                activeDot={{ r: 6 }}
                name="Mood"
              />
              <Line 
                type="monotone" 
                dataKey="anxiety" 
                stroke="var(--color-secondary)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-secondary)", r: 4 }}
                activeDot={{ r: 6 }}
                name="Anxiety"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// Daily prompts for journaling
const JOURNAL_PROMPTS = [
  "What are three things you're grateful for today?",
  "How did you show kindness to yourself or others today?",
  "What challenged you today, and how did you handle it?",
  "What brought you joy or made you smile today?",
  "What are you looking forward to tomorrow?",
  "How are you feeling right now, and why?",
  "What did you learn about yourself today?",
  "What would make tomorrow a great day?",
  "Who made a positive impact on your day?",
  "What are you proud of accomplishing today?",
];

interface JournalEntry {
  _id: string;
  content: string;
  prompt?: string;
  createdAt: string;
  updatedAt: string;
}

function Journal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  // Get today's prompt based on day of year
  const getTodayPrompt = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length];
  };

  // Calculate journaling streak
  const calculateStreak = (journalEntries: JournalEntry[]) => {
    if (journalEntries.length === 0) return 0;

    const sortedEntries = [...journalEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let streakCount = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor(
        (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === streakCount) {
        streakCount++;
      } else {
        break;
      }
    }

    return streakCount;
  };

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  async function loadEntries() {
    try {
      setLoading(true);
      const data = await getJournalEntries();
      setEntries(data);
      setStreak(calculateStreak(data));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  }

  async function saveEntry() {
    if (!content.trim()) {
      toast.error("Please write something before saving");
      return;
    }

    try {
      setLoading(true);
      const prompt = getTodayPrompt();
      await createJournalEntry(content, prompt);
      toast.success("Entry saved 📝");
      setContent("");
      await loadEntries();
    } catch (error: any) {
      toast.error(error.message || "Failed to save entry");
    } finally {
      setLoading(false);
    }
  }

  async function updateEntry() {
    if (!editContent.trim()) {
      toast.error("Please write something before saving");
      return;
    }

    try {
      setLoading(true);
      await updateJournalEntry(editingId!, editContent);
      toast.success("Entry updated 📝");
      setEditingId(null);
      setEditContent("");
      await loadEntries();
    } catch (error: any) {
      toast.error(error.message || "Failed to update entry");
    } finally {
      setLoading(false);
    }
  }

  async function deleteEntry() {
    try {
      setLoading(true);
      await deleteJournalEntry(deleteConfirmId!);
      toast.success("Entry deleted");
      setDeleteConfirmId(null);
      await loadEntries();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete entry");
    } finally {
      setLoading(false);
    }
  }

  if (editingId) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h3 className="font-display text-lg font-bold">Edit Entry</h3>
        <Textarea
          className="mt-4"
          rows={8}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="Write your thoughts..."
        />
        <div className="mt-4 flex gap-2">
          <Button onClick={updateEntry} disabled={loading}>
            Save changes
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setEditingId(null);
              setEditContent("");
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Streak Counter - Warm Welcome */}
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold">Welcome back!</h3>
            <p className="text-sm text-muted-foreground mt-1">Your reflections matter. Keep going.</p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold text-primary">{streak}</div>
            <div className="text-xs text-muted-foreground">
              {streak === 1 ? "day streak" : "days streak"}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Prompt */}
      <div className="rounded-2xl border-l-4 border-l-primary bg-primary/5 p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-primary uppercase">Today's Prompt</p>
            <p className="mt-2 text-base font-medium italic">{getTodayPrompt()}</p>
          </div>
        </div>
      </div>

      {/* Mood Selection */}
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h3 className="font-display text-lg font-bold mb-4">How are you feeling right now?</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { mood: "Good", icon: ThumbsUp, color: "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
            { mood: "Low", icon: TrendingDown, color: "border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300" },
            { mood: "Anxious", icon: AlertTriangle, color: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
            { mood: "Frustrated", icon: Frown, color: "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
            { mood: "Tired", icon: Moon, color: "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
          ].map(({ mood, icon: Icon, color }) => (
            <button
              key={mood}
              className={`rounded-full px-4 py-2 text-sm font-medium transition border-2 flex items-center gap-2 ${color}`}
            >
              <Icon className="h-4 w-4" /> {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h3 className="font-display text-lg font-bold mb-4">Write your thoughts, feelings, and reflections...</h3>
        <Textarea
          className="mt-2"
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share what's on your mind..."
        />
        <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={saveEntry} disabled={loading}>
          Save entry
        </Button>
      </div>

      {/* Past Entries */}
      {entries.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-lg font-bold">Past entries</h3>
          <div className="mt-4 space-y-2">
            {entries.map((entry) => (
              <button
                key={entry._id}
                onClick={() => {
                  setEditingId(entry._id);
                  setEditContent(entry.content);
                }}
                className="w-full rounded-lg border bg-muted/30 p-4 text-left transition hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm">
                      {entry.content.substring(0, 100)}
                      {entry.content.length > 100 ? "..." : ""}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(entry._id);
                    }}
                    className="ml-2 rounded p-1 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The entry will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
