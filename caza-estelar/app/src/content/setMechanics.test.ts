import { describe, expect, it } from "vitest";
import { PATTERN_MECHANICS, SET_MECHANICS, SORT_MECHANICS } from "./model";
import { validateLevel } from "./levelValidator";
import { parseCatalog } from "./parser";

const installed = new Set<string>([...SET_MECHANICS, ...PATTERN_MECHANICS, ...SORT_MECHANICS]);
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
      // Sin `roundsPerPlay` se juega todo el banco; sin `difficulty` la ronda es media.
      roundsPerPlay: 1,
      ...feedback,
      rounds: [
        {
          prompt: { es: "Elige las estrellas", en: "Elige las estrellas" },
          pieces: [star, moon],
          target: { shape: "star", color: null },
          difficulty: 2
        }
      ]
    });
  });

  it("validates the variant bank: difficulty, rounds per play and repeated rounds", () => {
    const round = { set: [star, gem], candidate: moon, difficulty: 1 };
    expect(issuesFor("set_membership", { roundsPerPlay: 2, rounds: [round, { ...round, candidate: star, difficulty: 3 }] })).toEqual([]);
    expect(issuesFor("set_membership", { rounds: [{ ...round, difficulty: 4 }] })).toEqual(["mechanic.config.rounds[0].difficulty"]);
    expect(issuesFor("set_membership", { roundsPerPlay: 3, rounds: [round, { ...round, candidate: star }] })).toEqual(["mechanic.config.roundsPerPlay"]);
    expect(issuesFor("set_membership", { rounds: [round, { ...round, difficulty: 2 }] })).toEqual(["mechanic.config.rounds[1]"]);
  });

  it("rejects a difference with nothing left in A", () => {
    expect(issuesFor("set_difference", { rounds: [{ a: [star], b: [star, moon] }] })).toEqual(["mechanic.config.rounds[0].b"]);
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

  it("validates the new CONJUNTOS mechanics", () => {
    const blueStar = { shape: "star", color: "blue" };
    const blueMoon = { shape: "moon", color: "blue" };
    expect(issuesFor("set_group", { rounds: [{ pieces: [star, blueStar, moon, blueMoon], by: "shape" }] })).toEqual([]);
    expect(issuesFor("set_group", { rounds: [{ pieces: [star, blueStar, star, blueStar], by: "shape" }] })).toEqual(["mechanic.config.rounds[0].by"]);
    expect(issuesFor("set_diagram", { rounds: [{ a: { shape: "star" }, b: null, pieces: [star, blueStar, moon] }] })).toEqual([]);
    expect(issuesFor("set_diagram", { rounds: [{ a: { shape: "star" }, b: { color: "blue" }, pieces: [star, blueStar] }] })).toEqual([
      "mechanic.config.rounds[0].pieces",
      "mechanic.config.rounds[0].pieces"
    ]);
    expect(issuesFor("set_braces", { rounds: [{ set: [star, moon, star], extra: [gem] }] })).toEqual([]);
    expect(issuesFor("set_braces", { rounds: [{ set: [star, moon], extra: [star] }] })).toEqual(["mechanic.config.rounds[0].extra"]);
    expect(issuesFor("set_describe", { rounds: [{ set: [star, blueStar], options: [{ shape: "star" }, { color: "blue" }] }] })).toEqual([]);
    // Las dos descripciones las cumplen todos: no hay una sola respuesta.
    expect(issuesFor("set_describe", { rounds: [{ set: [blueStar, blueMoon], options: [{ color: "blue" }, { color: "blue", shape: null }] }] })).toEqual(
      expect.arrayContaining(["mechanic.config.rounds[0].options"])
    );
    expect(issuesFor("set_kind", { rounds: [{ set: [], infinite: false }, { set: [star, moon], infinite: true, difficulty: 3 }] })).toEqual([]);
    expect(issuesFor("set_kind", { rounds: [{ set: [star], infinite: true }] })).toEqual(["mechanic.config.rounds[0].set"]);
    expect(issuesFor("set_operation", { rounds: [{ op: "intersection", a: [star, moon], b: [moon, gem] }] })).toEqual([]);
    expect(issuesFor("set_operation", { rounds: [{ op: "intersection", a: [star], b: [gem] }, { op: "resta", a: [star], b: [gem], difficulty: 3 }] })).toEqual([
      "mechanic.config.rounds[0].b",
      "mechanic.config.rounds[1].op"
    ]);
  });

  it("validates the CLASIFICACIÓN mechanics", () => {
    const piece = (shape: string, color: string, size = "medium") => ({ shape, color, size });
    const yellows = [piece("circle", "yellow"), piece("star", "yellow"), piece("square", "cyan"), piece("star", "cyan")];
    expect(issuesFor("sort_groups", { rounds: [{ by: "color", pieces: yellows }] })).toEqual([]);
    // Solo hay fichas amarillas, celestes y moradas (coral ya no existe), y una forma desconocida no se acepta.
    expect(issuesFor("sort_groups", { rounds: [{ by: "color", pieces: [...yellows, piece("circle", "coral")] }] })).toEqual(["mechanic.config.rounds[0].pieces"]);
    expect(issuesFor("sort_groups", { rounds: [{ by: "size", pieces: [piece("heart", "purple", "small"), piece("star", "purple", "large"), piece("star", "cyan"), piece("star", "cyan")] }] })).toEqual([
      "mechanic.config.rounds[0].pieces"
    ]);
    expect(issuesFor("sort_type", { rounds: [{ items: ["apple", "pear", "dog", "cat"] }] })).toEqual([]);
    expect(issuesFor("sort_type", { rounds: [{ items: ["apple", "pear", "banana", "grapes"] }] })).toEqual(["mechanic.config.rounds[0].items"]);
    expect(issuesFor("sort_rule", { rounds: [{ rule: { shape: "circle", color: "yellow" }, pieces: [piece("circle", "yellow"), ...yellows.slice(1)] }] })).toEqual([]);
    expect(issuesFor("sort_rule", { rounds: [{ rule: { shape: "circle", color: "yellow" }, pieces: [piece("circle", "cyan"), ...yellows.slice(1)] }] })).toEqual(["mechanic.config.rounds[0].pieces"]);
    const corals = [piece("circle", "purple"), piece("star", "purple"), piece("square", "purple")];
    expect(issuesFor("sort_discover", { rounds: [{ group: corals, others: [piece("circle", "cyan")] }] })).toEqual([]);
    // Una pieza de fuera con el mismo color no puede estar fuera del grupo.
    expect(issuesFor("sort_discover", { rounds: [{ group: corals, others: [piece("circle", "purple")] }] })).toEqual(["mechanic.config.rounds[0].others"]);
    // Solo color y forma: no se mezclan tamaños.
    expect(issuesFor("sort_discover", { rounds: [{ group: [...corals.slice(1), piece("circle", "purple", "large")], others: [] }] })).toEqual(["mechanic.config.rounds[0].group"]);
  });

  it("validates the pattern mechanics", () => {
    const circle = { shape: "circle", color: "cyan" };
    expect(issuesFor("pattern_copy", { rounds: [{ sequence: [star, circle, star], extra: [gem] }] })).toEqual([]);
    expect(issuesFor("pattern_copy", { rounds: [{ sequence: [star, star, star], extra: [star] }] })).toEqual([
      "mechanic.config.rounds[0].sequence",
      "mechanic.config.rounds[0].extra"
    ]);
    expect(issuesFor("pattern_fill", { rounds: [{ unit: [star, circle], length: 6, blanks: [2, 5], extra: [] }] })).toEqual([]);
    // A B A B no es una unidad, y un hueco que no se ve en ninguna otra repetición no se puede deducir.
    expect(issuesFor("pattern_fill", { rounds: [{ unit: [star, circle, star, circle], length: 8, blanks: [4], extra: [] }] })).toEqual(["mechanic.config.rounds[0].unit"]);
    expect(issuesFor("pattern_fill", { rounds: [{ unit: [star, circle], length: 4, blanks: [1, 3], extra: [] }] })).toEqual(["mechanic.config.rounds[0].blanks"]);
    expect(issuesFor("pattern_spot", { rounds: [{ unit: [star, circle], length: 6, mistakes: [{ index: 2, piece: gem }, { index: 3, piece: star }] }] })).toEqual([]);
    expect(issuesFor("pattern_spot", { rounds: [{ unit: [star, circle], length: 6, mistakes: [{ index: 2, piece: star }, { index: 3, piece: gem }] }] })).toEqual([
      "mechanic.config.rounds[0].mistakes[0]"
    ]);
    expect(issuesFor("pattern_unit", { rounds: [{ unit: [star, circle, gem], length: 7 }] })).toEqual([]);
    expect(issuesFor("pattern_unit", { rounds: [{ unit: [star, circle, star, circle], length: 3 }] })).toEqual([
      "mechanic.config.rounds[0].unit",
      "mechanic.config.rounds[0].length"
    ]);
    expect(issuesFor("pattern_create", { rounds: [{ length: 6, palette: [star, gem, circle] }] })).toEqual([]);
    expect(issuesFor("pattern_create", { rounds: [{ length: 12, palette: [star] }] })).toEqual([
      "mechanic.config.rounds[0].length",
      "mechanic.config.rounds[0].palette"
    ]);
  });
});
