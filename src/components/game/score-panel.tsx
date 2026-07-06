"use client";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-2xl font-semibold tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function ScorePanel({
  score,
  best,
  length,
}: {
  score: number;
  best: number;
  length: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Score" value={score} />
      <StatCard label="Best" value={best} />
      <StatCard label="Length" value={length} />
    </div>
  );
}
