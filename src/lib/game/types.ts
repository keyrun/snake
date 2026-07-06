export type Point = { x: number; y: number };

export type Direction = "up" | "down" | "left" | "right";

export type GameStatus = "idle" | "running" | "paused" | "gameover";

export type GameConfig = {
  /** Number of columns in the grid. */
  cols: number;
  /** Number of rows in the grid. */
  rows: number;
  /** Points awarded per food eaten. */
  pointsPerFood: number;
};

export type GameState = {
  config: GameConfig;
  /** Snake body cells, head first. */
  snake: Point[];
  /** Current food cell, or null if the board is full (win state). */
  food: Point | null;
  /** Direction the snake is currently travelling. */
  direction: Direction;
  /**
   * Direction queued for the next tick. Kept separate from `direction` so that
   * multiple key presses within a single tick cannot cause a 180° reversal.
   */
  pendingDirection: Direction;
  status: GameStatus;
  score: number;
};

/** A source of randomness in the range [0, 1). Injectable for deterministic tests. */
export type Rng = () => number;
