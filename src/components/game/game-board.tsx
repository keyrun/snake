"use client";

import { useEffect, useRef } from "react";
import type { GameState } from "@/lib/game/types";

type GameBoardProps = {
  state: GameState;
  /** Rendered pixel size (width & height) of the square board. */
  size: number;
  /** Changes when the theme changes, forcing a recolor redraw. */
  themeKey?: string;
};

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/**
 * Canvas renderer for the game grid. Redraws whenever the state, size, or theme
 * (via `resolvedTheme`) changes. Uses device-pixel-ratio scaling for crisp
 * rendering on high-DPI displays.
 */
export function GameBoard({ state, size, themeKey }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cols, rows } = state.config;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cellW = size / cols;
    const cellH = size / rows;

    const colors = {
      bg: cssVar("--board-bg", "#ffffff"),
      grid: cssVar("--board-grid", "#eef2f7"),
      head: cssVar("--snake-head", "#15803d"),
      body: cssVar("--snake-body", "#22c55e"),
      food: cssVar("--food", "#ef4444"),
    };

    // Background.
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, size, size);

    // Grid lines.
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < cols; x++) {
      ctx.moveTo(Math.round(x * cellW) + 0.5, 0);
      ctx.lineTo(Math.round(x * cellW) + 0.5, size);
    }
    for (let y = 1; y < rows; y++) {
      ctx.moveTo(0, Math.round(y * cellH) + 0.5);
      ctx.lineTo(size, Math.round(y * cellH) + 0.5);
    }
    ctx.stroke();

    const radius = Math.min(cellW, cellH) * 0.22;
    const roundRect = (px: number, py: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.roundRect(px, py, w, h, radius);
      ctx.fill();
    };

    // Food (pulsing dot).
    if (state.food) {
      ctx.fillStyle = colors.food;
      const fx = state.food.x * cellW;
      const fy = state.food.y * cellH;
      roundRect(fx + cellW * 0.18, fy + cellH * 0.18, cellW * 0.64, cellH * 0.64);
    }

    // Snake.
    state.snake.forEach((cell, index) => {
      ctx.fillStyle = index === 0 ? colors.head : colors.body;
      const gap = index === 0 ? 0.06 : 0.1;
      roundRect(
        cell.x * cellW + cellW * gap,
        cell.y * cellH + cellH * gap,
        cellW * (1 - gap * 2),
        cellH * (1 - gap * 2),
      );
    });
  }, [state, size, cols, rows, themeKey]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Snake game board. Score ${state.score}.`}
      style={{ width: size, height: size }}
      className="rounded-xl border border-border shadow-sm"
    />
  );
}
