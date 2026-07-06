import { INITIAL_SNAKE_LENGTH } from "./constants";
import type {
  Direction,
  GameConfig,
  GameState,
  Point,
  Rng,
} from "./types";

const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Are two directions exact opposites (i.e. would cause a 180° reversal)? */
export function isReversal(a: Direction, b: Direction): boolean {
  return OPPOSITE[a] === b;
}

/**
 * Pick a random empty cell for food. Returns null when the board is completely
 * filled by the snake (the win condition).
 */
export function spawnFood(
  snake: Point[],
  config: GameConfig,
  rng: Rng,
): Point | null {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const empty: Point[] = [];
  for (let y = 0; y < config.rows; y++) {
    for (let x = 0; x < config.cols; x++) {
      if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
    }
  }
  if (empty.length === 0) return null;
  const index = Math.min(empty.length - 1, Math.floor(rng() * empty.length));
  return empty[index];
}

/**
 * Build a fresh game in the `idle` state. The snake starts horizontally
 * centred, heading right, with food already placed.
 */
export function createInitialState(
  config: GameConfig,
  rng: Rng = Math.random,
): GameState {
  const midY = Math.floor(config.rows / 2);
  const startX = Math.floor(config.cols / 2);
  const snake: Point[] = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    // Head first; body trails to the left so the snake heads right.
    snake.push({ x: startX - i, y: midY });
  }
  return {
    config,
    snake,
    food: spawnFood(snake, config, rng),
    direction: "right",
    pendingDirection: "right",
    status: "idle",
    score: 0,
  };
}

/**
 * Queue a direction change for the next tick. Ignored if it would reverse the
 * snake directly onto itself. Also starts an `idle` game.
 */
export function setDirection(state: GameState, next: Direction): GameState {
  if (state.status === "gameover") return state;
  if (isReversal(state.direction, next)) return state;

  const status = state.status === "idle" ? "running" : state.status;
  return { ...state, pendingDirection: next, status };
}

export function pause(state: GameState): GameState {
  if (state.status !== "running") return state;
  return { ...state, status: "paused" };
}

export function resume(state: GameState): GameState {
  if (state.status !== "paused") return state;
  return { ...state, status: "running" };
}

/** Transition an idle or paused game into the running state. */
export function start(state: GameState): GameState {
  if (state.status === "idle" || state.status === "paused") {
    return { ...state, status: "running" };
  }
  return state;
}

/**
 * Advance the simulation by a single step. Only has an effect while `running`.
 * Handles movement, wall/self collision, eating, growth and win detection.
 */
export function tick(state: GameState, rng: Rng = Math.random): GameState {
  if (state.status !== "running") return state;

  const direction = state.pendingDirection;
  const delta = DELTAS[direction];
  const head = state.snake[0];
  const newHead: Point = { x: head.x + delta.x, y: head.y + delta.y };

  // Wall collision.
  if (
    newHead.x < 0 ||
    newHead.y < 0 ||
    newHead.x >= state.config.cols ||
    newHead.y >= state.config.rows
  ) {
    return { ...state, direction, status: "gameover" };
  }

  const willEat = state.food != null && pointsEqual(newHead, state.food);

  // When not eating, the tail moves out of the way this tick, so colliding with
  // the current tail cell is allowed.
  const body = willEat ? state.snake : state.snake.slice(0, -1);
  if (body.some((cell) => pointsEqual(cell, newHead))) {
    return { ...state, direction, status: "gameover" };
  }

  const newSnake = [newHead, ...(willEat ? state.snake : state.snake.slice(0, -1))];

  if (!willEat) {
    return { ...state, snake: newSnake, direction };
  }

  const nextFood = spawnFood(newSnake, state.config, rng);
  const score = state.score + state.config.pointsPerFood;
  // Board full -> the player has won; no more food can spawn.
  const status: GameState["status"] = nextFood == null ? "gameover" : "running";

  return {
    ...state,
    snake: newSnake,
    food: nextFood,
    direction,
    score,
    status,
  };
}
