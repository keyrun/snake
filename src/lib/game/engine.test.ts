import { describe, expect, it } from "vitest";
import {
  createInitialState,
  isReversal,
  pause,
  resume,
  setDirection,
  spawnFood,
  start,
  tick,
} from "./engine";
import type { GameConfig, Rng } from "./types";

const CONFIG: GameConfig = { cols: 10, rows: 10, pointsPerFood: 10 };

/** Deterministic RNG that always returns 0 (picks the first empty cell). */
const zeroRng: Rng = () => 0;

describe("createInitialState", () => {
  it("creates a centred snake heading right with food placed", () => {
    const state = createInitialState(CONFIG, zeroRng);
    expect(state.snake).toHaveLength(3);
    expect(state.snake[0]).toEqual({ x: 5, y: 5 });
    expect(state.direction).toBe("right");
    expect(state.status).toBe("idle");
    expect(state.score).toBe(0);
    expect(state.food).not.toBeNull();
  });

  it("never spawns food on the snake", () => {
    const state = createInitialState(CONFIG, zeroRng);
    const onSnake = state.snake.some(
      (p) => p.x === state.food!.x && p.y === state.food!.y,
    );
    expect(onSnake).toBe(false);
  });
});

describe("setDirection", () => {
  it("ignores 180-degree reversals", () => {
    const state = createInitialState(CONFIG, zeroRng);
    const next = setDirection(state, "left");
    expect(next.pendingDirection).toBe("right");
  });

  it("starts an idle game when a valid direction is set", () => {
    const state = createInitialState(CONFIG, zeroRng);
    const next = setDirection(state, "up");
    expect(next.status).toBe("running");
    expect(next.pendingDirection).toBe("up");
  });

  it("does nothing after game over", () => {
    const state = { ...createInitialState(CONFIG, zeroRng), status: "gameover" as const };
    expect(setDirection(state, "up")).toBe(state);
  });
});

describe("tick movement", () => {
  it("moves the snake forward without growing when no food is eaten", () => {
    let state = createInitialState(CONFIG, zeroRng);
    state = { ...start(state), food: { x: 0, y: 0 } };
    const next = tick(state, zeroRng);
    expect(next.snake[0]).toEqual({ x: 6, y: 5 });
    expect(next.snake).toHaveLength(3);
    expect(next.score).toBe(0);
  });

  it("only advances while running", () => {
    const state = createInitialState(CONFIG, zeroRng);
    expect(tick(state, zeroRng)).toBe(state); // idle
    expect(tick(pause(start(state)), zeroRng).status).toBe("paused");
  });
});

describe("tick collisions", () => {
  it("ends the game on wall collision", () => {
    let state = createInitialState({ ...CONFIG, cols: 7 }, zeroRng);
    state = { ...start(state), food: { x: 0, y: 0 } };
    // Head at x=3 (cols/2) moving right; needs to reach x=7.
    state = tick(state, zeroRng); // x=4
    state = tick(state, zeroRng); // x=5
    state = tick(state, zeroRng); // x=6
    state = tick(state, zeroRng); // x=7 -> wall
    expect(state.status).toBe("gameover");
  });

  it("ends the game when the snake hits itself", () => {
    // Build a snake long enough to curl back on itself.
    const snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 },
    ];
    const state = {
      config: CONFIG,
      snake,
      food: { x: 0, y: 0 },
      direction: "right" as const,
      pendingDirection: "down" as const,
      status: "running" as const,
      score: 0,
    };
    const next = tick(state, zeroRng); // head moves to (5,6), a non-tail body cell
    expect(next.status).toBe("gameover");
  });

  it("allows moving into the current tail cell", () => {
    const snake = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 },
    ];
    const state = {
      config: CONFIG,
      snake,
      food: { x: 0, y: 0 },
      direction: "up" as const,
      pendingDirection: "right" as const,
      status: "running" as const,
      score: 0,
    };
    // Head -> (6,5), the tail vacates it the same tick.
    const next = tick(state, zeroRng);
    expect(next.status).toBe("running");
    expect(next.snake[0]).toEqual({ x: 6, y: 5 });
  });
});

describe("tick eating", () => {
  it("grows the snake and scores when food is eaten", () => {
    let state = createInitialState(CONFIG, zeroRng);
    state = { ...start(state), food: { x: 6, y: 5 } };
    const next = tick(state, zeroRng);
    expect(next.snake).toHaveLength(4);
    expect(next.score).toBe(10);
    expect(next.food).not.toBeNull();
  });

  it("wins (game over) when the board is completely filled", () => {
    // 1x2 board: snake fills one cell, food the other.
    const config: GameConfig = { cols: 2, rows: 1, pointsPerFood: 10 };
    const state = {
      config,
      snake: [{ x: 0, y: 0 }],
      food: { x: 1, y: 0 },
      direction: "right" as const,
      pendingDirection: "right" as const,
      status: "running" as const,
      score: 0,
    };
    const next = tick(state, zeroRng);
    expect(next.snake).toHaveLength(2);
    expect(next.food).toBeNull();
    expect(next.status).toBe("gameover");
  });
});

describe("pause and resume", () => {
  it("pauses and resumes a running game", () => {
    const running = start(createInitialState(CONFIG, zeroRng));
    const paused = pause(running);
    expect(paused.status).toBe("paused");
    expect(resume(paused).status).toBe("running");
  });
});

describe("helpers", () => {
  it("detects reversals", () => {
    expect(isReversal("left", "right")).toBe(true);
    expect(isReversal("up", "left")).toBe(false);
  });

  it("spawnFood returns null on a full board", () => {
    const config: GameConfig = { cols: 1, rows: 1, pointsPerFood: 10 };
    expect(spawnFood([{ x: 0, y: 0 }], config, zeroRng)).toBeNull();
  });
});
