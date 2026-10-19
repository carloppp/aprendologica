import { describe, expect, it } from "vitest";
import { validateCatalog, validateCatalogWithLevels } from "./catalogValidator";
import { validateLevel } from "./levelValidator";
import type { ContentCatalog, LevelDefinition, MechanicDefinition } from "./model";

const installed = new Set(["telescope_hunt", "multiple_choice"]);
const telescope: MechanicDefinition = { type: "telescope_hunt", config: { kind: "telescope_hunt", targetCount: 3, lockRadius: 92 } };

function level(id: string, overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id,
    version: 1,
    order: 1,
    title: { es: "Nivel", en: "Level" },
    description: { es: "", en: "" },
    instruction: { es: "Instrucción", en: "Instruction" },
    mechanic: telescope,
    unlock: { prerequisiteLevelIds: [] },
    completion: { type: "minimum_score", value: 60 },
    reward: { experience: 0, badgeId: null },
    media: { promptAssetId: null, narrationAssetId: null, backgroundAssetId: null },
    ...overrides
  };
}

const requires = (...ids: string[]) => ({ unlock: { prerequisiteLevelIds: ids } });

function catalog(levels: LevelDefinition[], header: Partial<ContentCatalog> = {}): ContentCatalog {
  return {
    schemaVersion: 2,
    publishedVersion: "2026.09.15.1",
    revision: 1,
    minimumAppVersion: "0.3.0",
    assets: [],
    constellations: [
      {
        id: "fracciones",
        version: 1,
        order: 1,
        area: "numbers_and_operations",
        title: { es: "Fracciones", en: "Fractions" },
        description: { es: "Desc", en: "Desc" },
        visual: { coverAssetId: null, accentColor: "#7C8CFF" },
        levels
      }
    ],
    ...header
  };
}

const fields = (issues: { field: string }[]) => issues.map((it) => it.field);

describe("validateCatalog (port de CatalogValidatorV2Test)", () => {
  it("accepts a well-formed catalog", () => {
    expect(validateCatalog(catalog([level("a"), level("b", requires("a"))]))).toEqual([]);
  });

  it("rejects wrong schema version and non-positive revision", () => {
    const issues = fields(validateCatalog(catalog([level("a")], { schemaVersion: 1, revision: 0 })));
    expect(issues).toContain("schemaVersion");
    expect(issues).toContain("revision");
  });

  it("rejects constellation without levels", () => {
    expect(fields(validateCatalog(catalog([]))).some((it) => it.endsWith(".levels"))).toBe(true);
  });

  it("rejects duplicate level ids across the catalog", () => {
    expect(fields(validateCatalog(catalog([level("dup"), level("dup")])))).toContain("levels.id");
  });

  it("rejects missing prerequisite", () => {
    expect(fields(validateCatalog(catalog([level("a", requires("ghost"))]))).some((it) => it.startsWith("levels.a.unlock"))).toBe(true);
  });

  it("detects prerequisite cycle", () => {
    expect(fields(validateCatalog(catalog([level("a", requires("b")), level("b", requires("a"))])))).toContain("levels.unlock");
  });

  it("rejects non-HTTPS and malformed assets", () => {
    const issues = fields(
      validateCatalog(
        catalog([level("a")], {
          assets: [{ id: "img", type: "IMAGE", mimeType: "audio/mpeg", url: "http://x", sha256: "abc", sizeBytes: 0, required: true }]
        })
      )
    );
    expect(issues).toEqual(expect.arrayContaining(["assets.img.url", "assets.img.mimeType", "assets.img.sha256", "assets.img.sizeBytes"]));
  });

  it("combines level issues with a path prefix", () => {
    const issues = fields(validateCatalogWithLevels(catalog([level("a", { completion: { type: "minimum_score", value: 140 } })]), installed));
    expect(issues).toContain("levels.a.completion.value");
  });
});

describe("validateLevel (port de LevelValidatorTest)", () => {
  const levelFields = (it: LevelDefinition) => fields(validateLevel(it, installed));

  it("accepts a valid telescope level", () => {
    expect(levelFields(level("nivel"))).toEqual([]);
  });

  it("rejects completion score out of range", () => {
    expect(levelFields(level("nivel", { completion: { type: "minimum_score", value: 140 } }))).toContain("completion.value");
  });

  it("rejects self prerequisite and duplicates", () => {
    const issues = levelFields(level("nivel", requires("nivel", "otro", "otro")));
    expect(issues.filter((it) => it === "unlock.prerequisiteLevelIds")).toHaveLength(2);
  });

  it("rejects uninstalled mechanic", () => {
    expect(levelFields(level("nivel", { mechanic: { ...telescope, type: "matching" } }))).toContain("mechanic.type");
  });

  it("validates multiple choice rules", () => {
    const issues = levelFields(
      level("nivel", {
        mechanic: {
          type: "multiple_choice",
          config: {
            kind: "multiple_choice",
            question: { es: "", en: "" },
            options: [
              { id: "a", text: { es: "A", en: "A" }, correct: true },
              { id: "a", text: { es: "B", en: "B" }, correct: true }
            ],
            attempts: 9,
            successFeedback: { es: "ok", en: "ok" },
            retryFeedback: { es: "retry", en: "retry" }
          }
        }
      })
    );
    expect(issues).toEqual(
      expect.arrayContaining([
        "mechanic.config.question.es",
        "mechanic.config.options.id",
        "mechanic.config.options.correct",
        "mechanic.config.attempts"
      ])
    );
  });
});
