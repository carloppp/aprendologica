import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { constellationStars } from "../progress/constellationProgress";
import { CONSTELLATION_LAYOUT, THEME_GROUPS } from "../ui/themeGroups";
import { validateCatalogWithLevels } from "./catalogValidator";
import { INSTALLED_MECHANICS } from "./catalogLoader";
import { parseCatalog } from "./parser";

// Equivalente a `PublishedCatalogIntegrationTest.kt`: el catálogo empaquetado debe ser válido.
const catalog = parseCatalog(readFileSync(new URL("../../public/content/catalog.json", import.meta.url), "utf8"));

describe("published catalog", () => {
  it("passes full validation with installed mechanics", () => {
    expect(validateCatalogWithLevels(catalog, INSTALLED_MECHANICS)).toEqual([]);
  });

  it("only publishes constellations known to the selector and fitting its layout", () => {
    const known = new Set(THEME_GROUPS.map((it) => it.constellationId));
    for (const constellation of catalog.constellations) {
      expect(known.has(constellation.id)).toBe(true);
      expect(constellation.levels.length).toBeLessThanOrEqual(CONSTELLATION_LAYOUT.length);
    }
  });

  it("has English text for every level", () => {
    for (const level of catalog.constellations.flatMap((it) => it.levels)) {
      expect(level.title.en.trim()).not.toBe("");
      expect(level.instruction.en.trim()).not.toBe("");
    }
  });

  it("describes every level for its panel, in both languages", () => {
    for (const level of catalog.constellations.flatMap((it) => it.levels)) {
      expect(level.description.es.trim()).not.toBe("");
      expect(level.description.en.trim()).not.toBe("");
      expect(level.description.en).not.toBe(level.description.es);
    }
  });
});

describe("constellationStars", () => {
  const conjuntos = catalog.constellations[0]!;
  const ids = conjuntos.levels.map((it) => it.id);
  const versionOf = (levelId: string) => conjuntos.levels.find((it) => it.id === levelId)!.version;
  const scored = (levelId: string, bestScore: number, levelVersion = versionOf(levelId)) => ({
    levelId, levelVersion, completed: bestScore >= 60, bestScore, attemptsUsed: 1, lastDurationMs: 0, updatedAtEpochMs: 0
  });
  const progressOf = (entries: [number, number][]) =>
    Object.fromEntries(entries.map(([index, score]) => [ids[index]!, scored(ids[index]!, score)]));

  it("lights each star by the stars earned in its level", () => {
    const { stars } = constellationStars(conjuntos, progressOf([[0, 100], [1, 75], [2, 40]]));
    expect(stars.map((it) => it.stars)).toEqual([3, 2, 1, 0, 0, 0]);
    expect(stars.map((it) => it.completed)).toEqual([true, true, false, false, false, false]);
  });

  it("links only stars with at least two stars, weak unless both have three", () => {
    const { links } = constellationStars(conjuntos, progressOf([[0, 100], [1, 100], [2, 75], [3, 40]]));
    expect(links).toEqual([
      { from: 0, to: 1, strength: 3 },
      { from: 1, to: 2, strength: 2 }
    ]);
  });

  it("closes the ring between the last and the first star", () => {
    expect(constellationStars(conjuntos, progressOf([[0, 100], [5, 100]])).links).toEqual([{ from: 5, to: 0, strength: 3 }]);
  });

  it("ignores progress from an older level version", () => {
    const id = ids[0]!;
    const { stars } = constellationStars(conjuntos, { [id]: scored(id, 100, versionOf(id) - 1) });
    expect(stars[0]).toEqual({ levelId: id, stars: 0, completed: false });
  });
});
