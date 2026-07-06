"use client";

import type { Direction } from "@/lib/game/types";

const BUTTONS: { dir: Direction; label: string; area: string }[] = [
  { dir: "up", label: "▲", area: "up" },
  { dir: "left", label: "◀", area: "left" },
  { dir: "right", label: "▶", area: "right" },
  { dir: "down", label: "▼", area: "down" },
];

/**
 * On-screen D-pad, primarily for touch devices. Hidden on large screens where
 * keyboard controls are expected.
 */
export function DirectionPad({
  onDirection,
}: {
  onDirection: (dir: Direction) => void;
}) {
  return (
    <div
      aria-label="Direction controls"
      className="grid select-none gap-1.5 sm:hidden"
      style={{
        gridTemplateAreas: '". up ." "left . right" ". down ."',
        gridTemplateColumns: "repeat(3, 3.25rem)",
      }}
    >
      {BUTTONS.map(({ dir, label, area }) => (
        <button
          key={dir}
          type="button"
          aria-label={`Move ${dir}`}
          onClick={() => onDirection(dir)}
          style={{ gridArea: area }}
          className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-lg border border-border bg-surface text-lg transition-colors hover:bg-surface-muted active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span aria-hidden>{label}</span>
        </button>
      ))}
    </div>
  );
}
