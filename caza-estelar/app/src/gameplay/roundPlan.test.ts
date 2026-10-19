import { describe, expect, it } from "vitest";
import type { RoundDifficulty } from "../content/model";
import { difficultyRamp, planRounds, shuffled } from "./roundPlan";

/** Generador repetible para las pruebas. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const bankOf = (...difficulties: RoundDifficulty[]) => difficulties.map((difficulty) => ({ difficulty }));
const bank = bankOf(1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3);

describe("round plan", () => {
  it("ramps from easy to hard", () => {
    expect(difficultyRamp(4)).toEqual([1, 2, 2, 3]);
    expect(difficultyRamp(3)).toEqual([1, 2, 3]);
    expect(difficultyRamp(1)).toEqual([2]);
  });

  it("picks distinct rounds that follow the ramp", () => {
    const plan = planRounds(bank, 4, seeded(7));
    expect(new Set(plan).size).toBe(4);
    expect(plan.map((i) => bank[i]!.difficulty)).toEqual([1, 2, 2, 3]);
  });

  it("varies between players", () => {
    const plans = new Set(Array.from({ length: 20 }, (_, i) => planRounds(bank, 4, seeded(i + 1)).join(",")));
    expect(plans.size).toBeGreaterThan(10);
  });

  it("avoids the previous play while there are other rounds", () => {
    const first = planRounds(bank, 4, seeded(3));
    const second = planRounds(bank, 4, seeded(3), new Set(first));
    expect(second.some((i) => first.includes(i))).toBe(false);
  });

  it("falls back to the nearest difficulty and never plays more rounds than the bank has", () => {
    expect(planRounds(bankOf(2, 2), 4, seeded(1)).sort()).toEqual([0, 1]);
    const plan = planRounds(bankOf(1, 3, 3), 3, seeded(2));
    expect(plan.map((i) => [1, 3, 3][i])).toEqual([1, 3, 3]);
  });

  it("shuffles a copy without losing items", () => {
    const items = [1, 2, 3, 4, 5];
    const copy = shuffled(items, seeded(9));
    expect(items).toEqual([1, 2, 3, 4, 5]);
    expect([...copy].sort()).toEqual(items);
  });
});
