import { beforeEach, describe, expect, it } from "vitest";
import {
  addHighScore,
  clearHighScores,
  HIGH_SCORES_STORAGE_KEY,
  loadHighScores,
  MAX_HIGH_SCORES,
  qualifiesForHighScore,
  type HighScore,
} from "./high-scores";

function make(score: number): HighScore {
  return {
    id: `id-${score}`,
    name: "P",
    score,
    level: "normal",
    date: new Date().toISOString(),
  };
}

describe("high-scores storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when nothing is stored", () => {
    expect(loadHighScores()).toEqual([]);
  });

  it("ignores corrupt data", () => {
    window.localStorage.setItem(HIGH_SCORES_STORAGE_KEY, "not json");
    expect(loadHighScores()).toEqual([]);
    window.localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify([{ x: 1 }]));
    expect(loadHighScores()).toEqual([]);
  });

  it("adds and sorts scores, persisting them", () => {
    addHighScore({ name: "Alice", score: 50, level: "normal" });
    const list = addHighScore({ name: "Bob", score: 120, level: "hard" });
    expect(list.map((s) => s.score)).toEqual([120, 50]);
    expect(loadHighScores().map((s) => s.score)).toEqual([120, 50]);
  });

  it("caps the list at MAX_HIGH_SCORES", () => {
    let list: HighScore[] = [];
    for (let i = 1; i <= MAX_HIGH_SCORES + 5; i++) {
      list = addHighScore({ name: `P${i}`, score: i * 10, level: "easy" }, list);
    }
    expect(list).toHaveLength(MAX_HIGH_SCORES);
    expect(list[0].score).toBe((MAX_HIGH_SCORES + 5) * 10);
  });

  it("trims and defaults blank names", () => {
    const [entry] = addHighScore({ name: "   ", score: 10, level: "normal" });
    expect(entry.name).toBe("Anonymous");
  });

  it("clears scores", () => {
    addHighScore({ name: "A", score: 10, level: "normal" });
    expect(clearHighScores()).toEqual([]);
    expect(loadHighScores()).toEqual([]);
  });

  describe("qualifiesForHighScore", () => {
    it("rejects non-positive scores", () => {
      expect(qualifiesForHighScore(0, [])).toBe(false);
    });

    it("accepts any positive score when the board has room", () => {
      expect(qualifiesForHighScore(5, [make(10)])).toBe(true);
    });

    it("requires beating the lowest score when the board is full", () => {
      const full = Array.from({ length: MAX_HIGH_SCORES }, (_, i) =>
        make((MAX_HIGH_SCORES - i) * 10),
      );
      expect(qualifiesForHighScore(5, full)).toBe(false);
      expect(qualifiesForHighScore(15, full)).toBe(true);
    });
  });
});
