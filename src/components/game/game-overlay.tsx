"use client";

import { useState } from "react";
import type { GameStatus } from "@/lib/game/types";

type GameOverlayProps = {
  status: GameStatus;
  score: number;
  qualifies: boolean;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  onSubmitScore: (name: string) => void;
  onDismissScore: () => void;
};

const panelClass =
  "absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-background/80 p-6 text-center backdrop-blur-sm";

export function GameOverlay({
  status,
  score,
  qualifies,
  onStart,
  onResume,
  onRestart,
  onSubmitScore,
  onDismissScore,
}: GameOverlayProps) {
  const [name, setName] = useState("");

  if (status === "running") return null;

  if (status === "idle") {
    return (
      <div className={panelClass}>
        <h2 className="text-2xl font-bold">Ready to play?</h2>
        <p className="text-sm text-muted-foreground">
          Press an arrow key, Space, or Start to begin.
        </p>
        <OverlayButton onClick={onStart}>Start</OverlayButton>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className={panelClass}>
        <h2 className="text-2xl font-bold">Paused</h2>
        <OverlayButton onClick={onResume}>Resume</OverlayButton>
      </div>
    );
  }

  // Game over.
  return (
    <div className={panelClass}>
      <h2 className="text-2xl font-bold">Game over</h2>
      <p className="text-sm text-muted-foreground">
        You scored <span className="font-mono font-semibold">{score}</span>.
      </p>

      {qualifies ? (
        <form
          className="flex w-full max-w-xs flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitScore(name);
          }}
        >
          <p className="font-medium text-primary">🎉 New high score!</p>
          <input
            autoFocus
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            aria-label="Your name"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          <div className="flex justify-center gap-2">
            <OverlayButton type="submit">Save score</OverlayButton>
            <OverlaySecondary onClick={onDismissScore}>Skip</OverlaySecondary>
          </div>
        </form>
      ) : (
        <OverlayButton onClick={onRestart}>Play again</OverlayButton>
      )}
    </div>
  );
}

function OverlayButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground transition-transform hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </button>
  );
}

function OverlaySecondary({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border bg-surface px-5 py-2 font-medium transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </button>
  );
}
