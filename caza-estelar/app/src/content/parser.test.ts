import { describe, expect, it } from "vitest";
import { findLevel } from "./model";
import { parseCatalog } from "./parser";

// Mismo catálogo de muestra que `CatalogParserV2Test.kt`.
const sample = JSON.stringify({
  schemaVersion: 2,
  publishedVersion: "2026.09.15.1",
  revision: 3,
  minimumAppVersion: "0.3.0",
  assets: [],
  constellations: [
    {
      id: "fracciones",
      version: 2,
      order: 1,
      area: "numbers_and_operations",
      title: { es: "Fracciones", en: "Fractions" },
      description: { es: "Desc", en: "Desc" },
      visual: { coverAssetId: null, accentColor: "#7C8CFF" },
      levels: [
        {
          id: "fracciones-reconocer",
          version: 1,
          order: 1,
          title: { es: "Reconocer", en: "Recognize" },
          instruction: { es: "Elige", en: "Choose" },
          mechanic: { type: "telescope_hunt", schemaVersion: 1, config: { targetCount: 4, lockRadius: 80 } },
          unlock: { prerequisiteLevelIds: [] },
          completion: { type: "minimum_score", value: 60 },
          reward: { experience: 100, badgeId: null },
          media: { promptAssetId: null, narrationAssetId: null, backgroundAssetId: null }
        },
        {
          id: "fracciones-comparar",
          version: 1,
          order: 2,
          title: { es: "Comparar", en: "Compare" },
          instruction: { es: "Compara", en: "Compare" },
          mechanic: {
            type: "multiple_choice",
            schemaVersion: 1,
            config: {
              question: { es: "P", en: "Q" },
              options: [
                { id: "a", text: { es: "A", en: "A" }, correct: true },
                { id: "b", text: { es: "B", en: "B" }, correct: false }
              ],
              attempts: 2,
              successFeedback: { es: "Bien", en: "Good" },
              retryFeedback: { es: "Otra", en: "Retry" }
            }
          },
          unlock: { prerequisiteLevelIds: ["fracciones-reconocer"] },
          completion: { type: "minimum_score", value: 70 }
        }
      ]
    }
  ]
});

describe("parseCatalog", () => {
  it("parses catalog header and hierarchy", () => {
    const catalog = parseCatalog(sample);
    expect(catalog.schemaVersion).toBe(2);
    expect(catalog.publishedVersion).toBe("2026.09.15.1");
    expect(catalog.revision).toBe(3);
    expect(catalog.minimumAppVersion).toBe("0.3.0");
    expect(catalog.constellations).toHaveLength(1);
    expect(catalog.constellations[0]?.levels).toHaveLength(2);
    expect(catalog.constellations[0]?.area).toBe("numbers_and_operations");
  });

  it("parses typed mechanic configs", () => {
    const catalog = parseCatalog(sample);
    const hunt = findLevel(catalog, "fracciones-reconocer")?.mechanic.config;
    expect(hunt).toMatchObject({ kind: "telescope_hunt", targetCount: 4, lockRadius: 80 });

    const second = findLevel(catalog, "fracciones-comparar");
    expect(second?.mechanic.config.kind).toBe("multiple_choice");
    if (second?.mechanic.config.kind === "multiple_choice") {
      expect(second.mechanic.config.options).toHaveLength(2);
    }
    expect(second?.unlock.prerequisiteLevelIds).toEqual(["fracciones-reconocer"]);
  });

  it("defaults optional blocks and keeps completion", () => {
    const second = findLevel(parseCatalog(sample), "fracciones-comparar");
    expect(second?.completion).toEqual({ type: "minimum_score", value: 70 });
    expect(second?.reward.experience).toBe(0);
    expect(second?.media.backgroundAssetId).toBeNull();
  });

  it("unknown mechanic becomes unsupported config", () => {
    const catalog = parseCatalog(sample.replace('"telescope_hunt"', '"matching"'));
    expect(findLevel(catalog, "fracciones-reconocer")?.mechanic.config.kind).toBe("unsupported");
  });

  it("falls back to Spanish when English text is missing", () => {
    const catalog = parseCatalog(sample.replace('"title":{"es":"Fracciones","en":"Fractions"}', '"title":{"es":"Fracciones"}'));
    expect(catalog.constellations[0]?.title).toEqual({ es: "Fracciones", en: "Fracciones" });
  });
});
