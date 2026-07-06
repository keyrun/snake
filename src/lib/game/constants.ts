import type { GameConfig } from "./types";

/** Default playfield: a square grid that reads well on both desktop and mobile. */
export const DEFAULT_CONFIG: GameConfig = {
  cols: 20,
  rows: 20,
  pointsPerFood: 10,
};

/** Starting length of the snake when a new game begins. */
export const INITIAL_SNAKE_LENGTH = 3;

/**
 * Game speed presets, expressed as the delay between ticks in milliseconds.
 * Lower is faster. The UI exposes these as difficulty levels.
 */
export const SPEED_LEVELS = {
  easy: 140,
  normal: 100,
  hard: 70,
} as const;

export type SpeedLevel = keyof typeof SPEED_LEVELS;

export const DEFAULT_SPEED_LEVEL: SpeedLevel = "normal";
