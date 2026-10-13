import { describe, expect, it } from "vitest";
import { mergeProgress, passed, stars, type LevelProgress } from "../progress/levelProgress";
import { ProgressStore, type KeyValueStorage } from "../progress/progressStore";
import { MultipleChoiceSession } from "./multipleChoiceSession";

describe("MultipleChoiceSession", () => {
  it("awards full stars on the first correct answer", () => {
    const session = new MultipleChoiceSession("a", 2, 3);
    const result = session.submit("a");
    expect(result).toEqual({ correct: true, attemptsRemaining: 2, starsEarned: 3, finished: true });
    expect(session.scoreFor(result)).toBe(100);
  });

  it("subtracts one star per error and finishes when attempts run out", () => {
    const session = new MultipleChoiceSession("a", 2, 3);
    expect(session.submit("b")).toMatchObject({ correct: false, attemptsRemaining: 1, finished: false });
    expect(session.submit("a").starsEarned).toBe(2);

    const failing = new MultipleChoiceSession("a", 1, 3);
    expect(failing.submit("b")).toMatchObject({ finished: true, starsEarned: 0 });
    expect(() => failing.submit("a")).toThrow();
  });
});

describe("level progress", () => {
  const progress = (bestScore: number, overrides: Partial<LevelProgress> = {}): LevelProgress => ({
    levelId: "l",
    levelVersion: 1,
    completed: bestScore >= 60,
    bestScore,
    attemptsUsed: 1,
    lastDurationMs: 0,
    updatedAtEpochMs: 1,
    ...overrides
  });

  it("derives stars from score ranges", () => {
    expect([0, 29, 30, 59, 60, 89, 90, 140].map((it) => stars(progress(it)))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(passed(progress(60))).toBe(true);
    expect(passed(progress(59))).toBe(false);
  });

  it("never reduces achievements when merging", () => {
    const merged = mergeProgress(progress(100), progress(20, { updatedAtEpochMs: 5 }));
    expect(merged).toMatchObject({ bestScore: 100, completed: true, attemptsUsed: 2, updatedAtEpochMs: 5 });
  });

  it("restarts progress when the level version changes", () => {
    expect(mergeProgress(progress(100), progress(20, { levelVersion: 2 })).bestScore).toBe(20);
  });

  it("persists per player and survives a new store instance", () => {
    const data = new Map<string, string>();
    const storage: KeyValueStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
    new ProgressStore(storage, "ana").record(progress(70));
    expect(new ProgressStore(storage, "ana").get("l")?.bestScore).toBe(70);
    expect(new ProgressStore(storage, "otro").get("l")).toBeUndefined();
  });
});
