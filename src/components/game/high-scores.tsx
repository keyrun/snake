"use client";

import type { HighScore } from "@/lib/storage/high-scores";

const MEDALS = ["🥇", "🥈", "🥉"];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HighScores({
  scores,
  onClear,
}: {
  scores: HighScore[];
  onClear: () => void;
}) {
  return (
    <section
      aria-labelledby="high-scores-heading"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex items-center justify-between">
        <h2 id="high-scores-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          High Scores
        </h2>
        {scores.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Clear
          </button>
        )}
      </div>

      {scores.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No scores yet. Be the first!
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {scores.map((entry, index) => (
            <li
              key={entry.id}
              className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-sm odd:bg-surface-muted/50"
            >
              <span className="text-center" aria-hidden>
                {MEDALS[index] ?? index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{entry.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {entry.level} · {formatDate(entry.date)}
                </span>
              </span>
              <span className="font-mono font-semibold tabular-nums">
                {entry.score}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
