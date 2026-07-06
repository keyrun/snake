"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_CONFIG,
  DEFAULT_SPEED_LEVEL,
  SPEED_LEVELS,
  type SpeedLevel,
} from "@/lib/game/constants";
import {
  createInitialState,
  pause,
  resume,
  setDirection,
  start,
  tick,
} from "@/lib/game/engine";
import type { Direction, GameState } from "@/lib/game/types";
import { useGameLoop } from "@/lib/hooks/use-game-loop";
import { useHighScores } from "@/lib/hooks/use-high-scores";
import { useTheme } from "@/components/theme/theme-provider";
import { GameBoard } from "./game-board";
import { ScorePanel } from "./score-panel";
import { HighScores } from "./high-scores";
import { GameOverlay } from "./game-overlay";
import { DirectionPad } from "./direction-pad";

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

const MIN_SWIPE = 24;

export function SnakeGame() {
  const [speedLevel, setSpeedLevel] = useState<SpeedLevel>(DEFAULT_SPEED_LEVEL);
  const [state, setState] = useState<GameState>(() =>
    createInitialState(DEFAULT_CONFIG),
  );
  const [boardSize, setBoardSize] = useState(400);
  const [recorded, setRecorded] = useState(false);

  const boardWrapRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const highScores = useHighScores();

  // Advance the simulation while running.
  const running = state.status === "running";
  useGameLoop(
    () => setState((prev) => tick(prev)),
    running ? SPEED_LEVELS[speedLevel] : null,
  );

  // Responsive square board sized to its container.
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      setBoardSize(Math.max(260, Math.min(480, Math.floor(width))));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const changeDirection = useCallback((dir: Direction) => {
    setState((prev) => setDirection(prev, dir));
  }, []);

  const togglePause = useCallback(() => {
    setState((prev) =>
      prev.status === "running"
        ? pause(prev)
        : prev.status === "paused"
          ? resume(prev)
          : prev,
    );
  }, []);

  const startGame = useCallback(() => {
    setState((prev) => start(prev));
  }, []);

  const restart = useCallback(() => {
    setRecorded(false);
    setState(createInitialState(DEFAULT_CONFIG));
  }, []);

  // Keyboard controls.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore game shortcuts while the user is typing (e.g. the high-score name).
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA")
      ) {
        return;
      }

      const dir = KEY_TO_DIRECTION[e.key];
      if (dir) {
        e.preventDefault();
        changeDirection(dir);
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        setState((prev) => {
          if (prev.status === "idle") return start(prev);
          if (prev.status === "running") return pause(prev);
          if (prev.status === "paused") return resume(prev);
          return prev;
        });
      } else if (e.key === "Enter" && state.status === "gameover") {
        restart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changeDirection, restart, state.status]);

  // Touch / swipe controls on the board.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < MIN_SWIPE && Math.abs(dy) < MIN_SWIPE) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection(dx > 0 ? "right" : "left");
    } else {
      changeDirection(dy > 0 ? "down" : "up");
    }
    touchStart.current = null;
  };

  // Record a qualifying score once when the game ends.
  const gameOver = state.status === "gameover";
  const qualifies = gameOver && !recorded && highScores.qualifies(state.score);

  const submitScore = useCallback(
    (name: string) => {
      highScores.addScore({ name, score: state.score, level: speedLevel });
      setRecorded(true);
    },
    [highScores, state.score, speedLevel],
  );

  const dismissScore = useCallback(() => setRecorded(true), []);

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <ScorePanel
          score={state.score}
          best={highScores.bestScore}
          length={state.snake.length}
        />

        <div
          ref={boardWrapRef}
          className="relative mx-auto flex w-full max-w-[480px] items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <GameBoard state={state} size={boardSize} themeKey={resolvedTheme} />
          <GameOverlay
            status={state.status}
            score={state.score}
            qualifies={qualifies}
            onStart={startGame}
            onResume={togglePause}
            onRestart={restart}
            onSubmitScore={submitScore}
            onDismissScore={dismissScore}
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <DirectionPad onDirection={changeDirection} />
          <GameControls
            status={state.status}
            speedLevel={speedLevel}
            onSpeedChange={setSpeedLevel}
            onTogglePause={togglePause}
            onStart={startGame}
            onRestart={restart}
          />
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <HighScores
          scores={highScores.scores}
          onClear={highScores.clear}
        />
        <ControlsHelp />
      </aside>
    </div>
  );
}

function GameControls({
  status,
  speedLevel,
  onSpeedChange,
  onTogglePause,
  onStart,
  onRestart,
}: {
  status: GameState["status"];
  speedLevel: SpeedLevel;
  onSpeedChange: (level: SpeedLevel) => void;
  onTogglePause: () => void;
  onStart: () => void;
  onRestart: () => void;
}) {
  const levels = Object.keys(SPEED_LEVELS) as SpeedLevel[];
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Difficulty"
        className="inline-flex rounded-full border border-border bg-surface p-1"
      >
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={level === speedLevel}
            disabled={status === "running" || status === "paused"}
            onClick={() => onSpeedChange(level)}
            className={`rounded-full px-3 py-1 text-sm capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              level === speedLevel
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-muted"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {status === "idle" ? (
          <PrimaryButton onClick={onStart}>Start</PrimaryButton>
        ) : status === "gameover" ? (
          <PrimaryButton onClick={onRestart}>Play again</PrimaryButton>
        ) : (
          <>
            <PrimaryButton onClick={onTogglePause}>
              {status === "paused" ? "Resume" : "Pause"}
            </PrimaryButton>
            <SecondaryButton onClick={onRestart}>Restart</SecondaryButton>
          </>
        )}
      </div>
    </div>
  );
}

function PrimaryButton({
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
      className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground transition-transform hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
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

function ControlsHelp() {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
        How to play
      </h2>
      <ul className="flex flex-col gap-1.5">
        <li>
          <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
            ← ↑ → ↓
          </kbd>{" "}
          or{" "}
          <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
            WASD
          </kbd>{" "}
          to steer
        </li>
        <li>
          <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
            Space
          </kbd>{" "}
          to pause / resume
        </li>
        <li>Swipe on the board on touch devices</li>
        <li>Eat the food to grow and score. Avoid the walls and yourself!</li>
      </ul>
    </section>
  );
}
