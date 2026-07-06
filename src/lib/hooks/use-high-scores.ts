"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { SpeedLevel } from "@/lib/game/constants";
import {
  addHighScore,
  clearHighScores,
  getHighScoresServerSnapshot,
  getHighScoresSnapshot,
  qualifiesForHighScore,
  subscribeHighScores,
  type HighScore,
} from "@/lib/storage/high-scores";

type UseHighScores = {
  scores: HighScore[];
  addScore: (entry: { name: string; score: number; level: SpeedLevel }) => void;
  clear: () => void;
  qualifies: (score: number) => boolean;
  bestScore: number;
};

/**
 * Hook exposing the persisted high-score leaderboard. Backed by an external
 * store so it stays in sync across components and browser tabs, and renders
 * correctly under SSR (server snapshot is empty).
 */
export function useHighScores(): UseHighScores {
  const scores = useSyncExternalStore(
    subscribeHighScores,
    getHighScoresSnapshot,
    getHighScoresServerSnapshot,
  );

  const addScore = useCallback(
    (entry: { name: string; score: number; level: SpeedLevel }) => {
      addHighScore(entry);
    },
    [],
  );

  const clear = useCallback(() => {
    clearHighScores();
  }, []);

  const qualifies = useCallback(
    (score: number) => qualifiesForHighScore(score, scores),
    [scores],
  );

  return {
    scores,
    addScore,
    clear,
    qualifies,
    bestScore: scores.length > 0 ? scores[0].score : 0,
  };
}
