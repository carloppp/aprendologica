import { describe, expect, it } from "vitest";
import type { SortPiece } from "../content/model";
import { meetsRule, sharedAttributes, sortGroupValues, sortTargets, TYPE_ITEMS, typeFamilies } from "./sorting";

const big = (shape: SortPiece["shape"], color: SortPiece["color"]): SortPiece => ({ shape, color, size: "large" });
const small = (shape: SortPiece["shape"], color: SortPiece["color"]): SortPiece => ({ shape, color, size: "small" });

describe("sorting rules", () => {
  it("makes one group per value, in a fixed order", () => {
    const pieces = [big("star", "purple"), small("circle", "yellow"), small("star", "yellow")];
    expect(sortGroupValues(pieces, "color")).toEqual(["yellow", "purple"]);
    expect(sortGroupValues(pieces, "size")).toEqual(["small", "large"]);
    expect(sortTargets(pieces, "shape", sortGroupValues(pieces, "shape"))).toEqual([1, 0, 1]);
  });

  it("needs both features for the two-feature rule", () => {
    const rule = { shape: "circle", color: "yellow" } as const;
    expect([big("circle", "yellow"), big("circle", "purple"), big("star", "yellow")].map((it) => meetsRule(it, rule))).toEqual([true, false, false]);
  });

  it("finds the feature a group shares", () => {
    expect(sharedAttributes([big("star", "purple"), small("circle", "purple"), big("square", "purple")])).toEqual(["color"]);
    expect(sharedAttributes([big("star", "purple"), big("star", "cyan")])).toEqual(["shape", "size"]);
  });

  it("knows the family of every object", () => {
    expect(typeFamilies(["apple", "dog", "pear"])).toEqual(["fruit", "animal"]);
    expect(Object.values(TYPE_ITEMS).every((it) => it.glyph && it.es && it.en)).toBe(true);
  });
});
