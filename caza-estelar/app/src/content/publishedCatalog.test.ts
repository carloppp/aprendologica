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
});

describe("constellationStars", () => {
  const conjuntos = catalog.constellations[0]!;
  const versionOf = (levelId: string) => conjuntos.levels.find((it) => it.id === levelId)!.version;
  const done = (levelId: string, levelVersion = versionOf(levelId)) => ({
    levelId, levelVersion, completed: true, bestScore: 100, attemptsUsed: 1, lastDurationMs: 0, updatedAtEpochMs: 0
  });

  it("links only consecutive completed stars", () => {
    const ids = conjuntos.levels.map((it) => it.id);
    const progress = Object.fromEntries([ids[0]!, ids[1]!, ids[3]!].map((id) => [id, done(id)]));
    const { stars, links } = constellationStars(conjuntos, progress);
    expect(stars.map((it) => it.completed)).toEqual([true, true, false, true, false, false]);
    expect(links).toEqual([[0, 1]]);
  });

  it("closes the ring between the last and the first star", () => {
    const ids = conjuntos.levels.map((it) => it.id);
    const progress = Object.fromEntries([ids[0]!, ids[5]!].map((id) => [id, done(id)]));
    expect(constellationStars(conjuntos, progress).links).toEqual([[5, 0]]);
  });

  it("ignores progress from an older level version", () => {
    const id = conjuntos.levels[0]!.id;
    expect(constellationStars(conjuntos, { [id]: done(id, versionOf(id) - 1) }).stars[0]?.completed).toBe(false);
  });
});
