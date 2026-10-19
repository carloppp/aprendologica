import { describe, expect, it } from "vitest";
import type { Piece } from "../content/model";
import { expandPattern, isRepeatedPattern, minimalPeriod, spotPaths, trayPieces, unitOptions } from "./patterns";

const star: Piece = { shape: "star", color: "yellow" };
const circle: Piece = { shape: "circle", color: "cyan" };
const gem: Piece = { shape: "gem", color: "purple" };

describe("patterns", () => {
  it("offers the unit, a shorter one and a longer one", () => {
    expect(unitOptions([star, star, circle])).toEqual([[star, star, circle], [star, star], [star, star, circle, star]]);
  });

  it("expands a unit along the bridge", () => {
    expect(expandPattern([star, circle], 5)).toEqual([star, circle, star, circle, star]);
  });

  it("finds the shortest repeating period", () => {
    expect(minimalPeriod([star, circle, star, circle])).toBe(2);
    expect(minimalPeriod([star, star, circle, star, star, circle])).toBe(3);
    expect(minimalPeriod([star, circle, gem])).toBe(3);
  });

  it("accepts a created pattern only when a unit repeats at least twice", () => {
    expect(isRepeatedPattern([star, circle, star, circle])).toBe(true);
    expect(isRepeatedPattern([star, circle, gem, star, circle, gem, star])).toBe(true);
    expect(isRepeatedPattern([star, circle, gem, star])).toBe(false);
    expect(isRepeatedPattern([star, star, star, star])).toBe(false);
  });

  it("builds the correct path first and one path per mistake", () => {
    const paths = spotPaths([star, circle], 4, [{ index: 2, piece: gem }, { index: 3, piece: star }]);
    expect(paths).toEqual([
      [star, circle, star, circle],
      [star, circle, gem, circle],
      [star, circle, star, star]
    ]);
  });

  it("lists each tray piece once in a fixed order", () => {
    expect(trayPieces([gem, circle, star, circle])).toEqual([star, circle, gem]);
  });
});
