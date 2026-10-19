import { describe, expect, it } from "vitest";
import type { Piece } from "../content/model";
import { RoundSession } from "./roundSession";
import {
  contains,
  describeAnswer,
  diagramRegion,
  difference,
  elementsOf,
  groupAnswer,
  groupingMistakes,
  hasDistinctElements,
  intersectionAnswer,
  isValidGrouping,
  operationResult,
  sameElements,
  setClass,
  sameIndices,
  selectAnswer,
  subsetGroups,
  union,
  vennRegions
} from "./sets";

const star: Piece = { shape: "star", color: "yellow" };
const moon: Piece = { shape: "moon", color: "cyan" };
const gem: Piece = { shape: "gem", color: "purple" };
const blueStar: Piece = { shape: "star", color: "blue" };
const blueCircle: Piece = { shape: "circle", color: "blue" };

describe("set rules", () => {
  it("treats pieces with the same shape and color as the same element", () => {
    expect(contains([star, moon], { shape: "star", color: "yellow" })).toBe(true);
    expect(contains([star, moon], blueStar)).toBe(false);
    expect(hasDistinctElements([star, moon, { ...star }])).toBe(false);
  });

  it("selects the pieces that match a property", () => {
    expect(selectAnswer([star, moon, star, gem], { shape: "star", color: null })).toEqual([0, 2]);
    expect(selectAnswer([star, blueStar, blueCircle], { shape: null, color: "blue" })).toEqual([1, 2]);
  });

  it("finds the pieces that match both properties", () => {
    const pieces = [blueCircle, star, blueStar, gem];
    expect(intersectionAnswer(pieces, { shape: null, color: "blue" }, { shape: "star", color: null })).toEqual([2]);
  });

  it("finds the only group that is a subset", () => {
    expect(subsetGroups([star, moon, gem], [[star, blueStar], [star, moon], [blueCircle]])).toEqual([1]);
  });

  it("splits a Venn diagram and computes union and difference without repeats", () => {
    const a = [star, moon, gem];
    const b = [moon, blueCircle];
    expect(vennRegions(a, b)).toEqual({ onlyA: [star, gem], both: [moon], onlyB: [blueCircle] });
    expect(sameElements(union(a, b), [star, moon, gem, blueCircle])).toBe(true);
    expect(union(a, b)).toHaveLength(4);
    expect(difference(a, b)).toEqual([star, gem]);
  });

  it("compares answers regardless of order", () => {
    expect(sameElements([star, moon], [moon, star])).toBe(true);
    expect(sameElements([star], [star, moon])).toBe(false);
    expect(sameIndices([2, 0], [0, 2])).toBe(true);
    expect(sameIndices([0], [0, 2])).toBe(false);
  });
});

describe("new CONJUNTOS levels", () => {
  // Estrella amarilla, estrella azul, luna celeste, círculo azul.
  const table = [star, blueStar, moon, blueCircle];

  it("accepts a grouping by shape or by color, with every piece placed", () => {
    expect(isValidGrouping(table, [[0, 1], [2], [3]])).toBe(true);
    expect(isValidGrouping(table, [[0], [1, 3], [2]])).toBe(true);
    expect(isValidGrouping(table, [[0, 1], [2, 3]])).toBe(false);
    expect(isValidGrouping(table, [[0, 1], [2]])).toBe(false);
    // Dos aros con la misma característica no forman conjuntos distintos.
    expect(isValidGrouping([star, star, moon], [[0], [1], [2]])).toBe(false);
    expect(groupAnswer(table, "color")).toEqual([[0], [1, 3], [2]]);
  });

  it("points at the misplaced pieces of a grouping", () => {
    expect(groupingMistakes(table, [[0, 1, 2], [3]])).toEqual([2]);
    expect(groupingMistakes(table, [[0, 1], [2], [3]])).toEqual([]);
  });

  it("finds the region of each piece in the diagram", () => {
    const yellow = { shape: null, color: "yellow" } as const;
    const stars = { shape: "star", color: null } as const;
    expect([star, blueStar, { shape: "moon", color: "yellow" } as Piece, moon].map((it) => diagramRegion(it, yellow, stars))).toEqual(["both", "b", "a", "none"]);
    expect(diagramRegion(blueStar, stars, null)).toBe("a");
  });

  it("writes each element once and classifies sets", () => {
    expect(elementsOf([star, moon, star])).toEqual([star, moon]);
    expect(setClass([], false)).toBe("empty");
    expect(setClass([star, star], false)).toBe("unit");
    expect(setClass([star, moon], false)).toBe("finite");
    expect(setClass([star, moon], true)).toBe("infinite");
  });

  it("describes a set by the property all its elements share", () => {
    expect(describeAnswer([star, blueStar], [{ shape: null, color: "blue" }, { shape: "star", color: null }])).toEqual([1]);
  });

  it("solves union and intersection", () => {
    expect(operationResult("union", [star, moon], [moon, gem])).toEqual([star, moon, gem]);
    expect(operationResult("intersection", [star, moon], [moon, gem])).toEqual([moon]);
  });
});

describe("RoundSession", () => {
  it("gives full score for first-try answers", () => {
    const session = new RoundSession(3, 2);
    expect(session.submit(true)).toEqual({ outcome: "correct", roundFinished: true, levelFinished: false });
    session.submit(true);
    expect(session.submit(true).levelFinished).toBe(true);
    expect(session.score).toBe(100);
    expect(session.starsEarned).toBe(3);
  });

  it("gives half a point after a retry and reveals after the last attempt", () => {
    const session = new RoundSession(2, 2);
    expect(session.submit(false).outcome).toBe("retry");
    expect(session.attemptsRemaining).toBe(1);
    expect(session.submit(true).outcome).toBe("correct");
    session.submit(false);
    expect(session.submit(false)).toEqual({ outcome: "reveal", roundFinished: true, levelFinished: true });
    expect(session.score).toBe(25);
    expect(session.starsEarned).toBe(0);
    expect(() => session.submit(true)).toThrow();
  });
});
