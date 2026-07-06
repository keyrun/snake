import type { SpeedLevel } from "@/lib/game/constants";

export const HIGH_SCORES_STORAGE_KEY = "snake:high-scores";
export const MAX_HIGH_SCORES = 10;

export type HighScore = {
  id: string;
  name: string;
  score: number;
  /** Difficulty the score was achieved on. */
  level: SpeedLevel;
  /** ISO timestamp. */
  date: string;
};

function isHighScore(value: unknown): value is HighScore {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.score === "number" &&
    typeof v.level === "string" &&
    typeof v.date === "string"
  );
}

/** Read and validate the persisted high-score list. Returns [] on any failure. */
export function loadHighScores(): HighScore[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHighScore).sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

function persist(scores: HighScore[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HIGH_SCORES_STORAGE_KEY,
      JSON.stringify(scores),
    );
  } catch {
    // Ignore storage failures (quota, private mode, etc.).
  }
}

/** Would `score` earn a place on the (already trimmed) leaderboard? */
export function qualifiesForHighScore(
  score: number,
  scores: HighScore[],
): boolean {
  if (score <= 0) return false;
  if (scores.length < MAX_HIGH_SCORES) return true;
  return score > scores[scores.length - 1].score;
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Insert a new score, keeping the list sorted and capped at MAX_HIGH_SCORES.
 * Returns the new list (also persisted to localStorage).
 */
export function addHighScore(
  entry: { name: string; score: number; level: SpeedLevel },
  existing: HighScore[] = loadHighScores(),
): HighScore[] {
  const record: HighScore = {
    id: createId(),
    name: entry.name.trim().slice(0, 20) || "Anonymous",
    score: entry.score,
    level: entry.level,
    date: new Date().toISOString(),
  };
  const next = [...existing, record]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HIGH_SCORES);
  persist(next);
  emitChange();
  return next;
}

export function clearHighScores(): HighScore[] {
  persist([]);
  emitChange();
  return [];
}

/* --------------------------------------------------------------------------
 * External store (for React's useSyncExternalStore)
 * ------------------------------------------------------------------------ */

const EMPTY: HighScore[] = [];
let snapshotCache: HighScore[] | null = null;
const listeners = new Set<() => void>();

function emitChange(): void {
  snapshotCache = null;
  for (const listener of listeners) listener();
}

export function subscribeHighScores(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === HIGH_SCORES_STORAGE_KEY) emitChange();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(onChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

/** Client snapshot — memoised so React sees a stable reference between changes. */
export function getHighScoresSnapshot(): HighScore[] {
  if (snapshotCache === null) snapshotCache = loadHighScores();
  return snapshotCache;
}

/** Server snapshot — always empty (no localStorage during SSR). */
export function getHighScoresServerSnapshot(): HighScore[] {
  return EMPTY;
}
