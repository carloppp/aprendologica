import { describe, expect, it } from "vitest";
import { SET_MECHANICS } from "./model";
import { validateLevel } from "./levelValidator";
import { parseCatalog } from "./parser";

const installed = new Set<string>(SET_MECHANICS);
const feedback = { successFeedback: { es: "¡Bien!", en: "Great!" }, retryFeedback: { es: "Otra vez", en: "Again" } };

function catalogWith(type: string, config: Record<string, unknown>): string {
  return JSON.stringify({
    schemaVersion: 2,
    publishedVersion: "2026.10.12.1",
    revision: 2,
    minimumAppVersion: "0.5.0",
    assets: [],
    constellations: [
      {
        id: "conjuntos",
        version: 1,
        order: 1,
        area: "logic_and_sets",
        title: { es: "Conjuntos", en: "Sets" },
        description: { es: "D", en: "D" },
        levels: [
          {
            id: "nivel",
            version: 1,
            order: 1,
            title: { es: "Nivel", en: "Level" },
            instruction: { es: "Haz", en: "Do" },
            mechanic: { type, schemaVersion: 1, config: { attempts: 2, ...feedback, ...config } },
            completion: { type: "minimum_score", value: 60 }
          }
        ]
      }
    ]
  });
}

const issuesFor = (type: string, config: Record<string, unknown>) => {
  const level = parseCatalog(catalogWith(type, config)).constellations[0]!.levels[0]!;
  return validateLevel(level, installed).map((it) => it.field);
};

const star = { shape: "star", color: "yellow" };
const moon = { shape: "moon", color: "cyan" };
const gem = { shape: "gem", color: "purple" };

describe("set mechanics in the v2 contract", () => {
  it("parses a selection round", () => {
    const level = parseCatalog(
      catalogWith("set_select", { rounds: [{ prompt: { es: "Elige las estrellas" }, pieces: [star, moon], target: { shape: "star" } }] })
    ).constellations[0]!.levels[0]!;
    expect(level.mechanic.config).toEqual({
      kind: "set_select",
      attempts: 2,
      ...feedback,
      rounds: [
        {
          prompt: { es: "Elige las estrellas", en: "Elige las estrellas" },
          pieces: [star, moon],
          target: { shape: "star", color: null }
        }
      ]
    });
  });

  it("accepts valid rounds for every set mechanic", () => {
    expect(issuesFor("set_select", { rounds: [{ prompt: { es: "P" }, pieces: [star, moon, star], target: { shape: "star" } }] })).toEqual([]);
    expect(issuesFor("set_membership", { rounds: [{ set: [star, gem], candidate: moon }] })).toEqual([]);
    expect(issuesFor("set_subset", { rounds: [{ set: [star, moon, gem], groups: [[star, moon], [star, { shape: "circle", color: "blue" }]] }] })).toEqual([]);
    expect(issuesFor("set_intersection", { rounds: [{ a: { color: "yellow" }, b: { shape: "star" }, pieces: [star, moon] }] })).toEqual([]);
    expect(issuesFor("set_union", { rounds: [{ a: [star, moon], b: [moon, gem] }] })).toEqual([]);
    expect(issuesFor("set_difference", { rounds: [{ a: [star, moon], b: [moon, gem] }] })).toEqual([]);
  });

  it("rejects unknown pieces, empty properties and repeated elements", () => {
    expect(issuesFor("set_membership", { rounds: [{ set: [star, star], candidate: { shape: "heart", color: "red" } }] })).toEqual(
      expect.arrayContaining(["mechanic.config.rounds[0].set", "mechanic.config.rounds[0].candidate"])
    );
    expect(issuesFor("set_intersection", { rounds: [{ a: {}, b: { shape: "star" }, pieces: [moon, gem] }] })).toEqual(
      expect.arrayContaining(["mechanic.config.rounds[0].a", "mechanic.config.rounds[0].pieces"])
    );
  });

  it("rejects rounds without a unique answer", () => {
    expect(issuesFor("set_select", { rounds: [{ prompt: { es: "P" }, pieces: [star, star], target: { shape: "star" } }] })).toContain(
      "mechanic.config.rounds[0].target"
    );
    expect(issuesFor("set_subset", { rounds: [{ set: [star, moon], groups: [[star], [moon]] }] })).toContain("mechanic.config.rounds[0].groups");
  });

  it("rejects missing rounds and attempts out of range", () => {
    expect(issuesFor("set_union", { rounds: [], attempts: 7 })).toEqual(
      expect.arrayContaining(["mechanic.config.rounds", "mechanic.config.attempts"])
    );
  });
});
