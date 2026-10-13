import {
  DEFAULT_ACCENT,
  type ChoiceOption,
  type ConstellationDefinition,
  type ContentAssetDefinition,
  type ContentAssetType,
  type ContentCatalog,
  type LevelDefinition,
  type LocalizedText,
  type MechanicConfig,
  type Piece,
  type PieceColor,
  type PieceFilter,
  type PieceShape
} from "./model";

/**
 * Interpreta un catálogo `schemaVersion: 2`. Port de `CatalogParserV2.kt`.
 *
 * El parser tolera campos ausentes y produce un modelo; la validez del contenido la deciden
 * `validateCatalog` y `validateLevel`. No lee catálogos v1: la migración es directa (decisión 1).
 */
export function parseCatalog(rawJson: string): ContentCatalog {
  const root = asObject(JSON.parse(rawJson));
  return {
    schemaVersion: int(root, "schemaVersion", 0),
    publishedVersion: str(root, "publishedVersion", ""),
    revision: int(root, "revision", 0),
    minimumAppVersion: str(root, "minimumAppVersion", ""),
    constellations: elements(root["constellations"]).map(parseConstellation),
    assets: elements(root["assets"]).map(parseAsset)
  };
}

type Json = Record<string, unknown>;

function parseAsset(value: Json): ContentAssetDefinition {
  return {
    id: str(value, "id", ""),
    type: parseAssetType(str(value, "type", "")),
    mimeType: str(value, "mimeType", ""),
    url: str(value, "url", ""),
    sha256: str(value, "sha256", "").toLowerCase(),
    sizeBytes: int(value, "sizeBytes", 0),
    required: bool(value, "required", false)
  };
}

function parseAssetType(raw: string): ContentAssetType {
  return raw.toUpperCase() === "AUDIO" ? "AUDIO" : "IMAGE";
}

function parseConstellation(value: Json): ConstellationDefinition {
  const visual = optObject(value["visual"]);
  return {
    id: str(value, "id", ""),
    version: int(value, "version", 0),
    order: int(value, "order", 0),
    area: str(value, "area", ""),
    title: localized(value["title"]),
    description: localized(value["description"]),
    visual: {
      coverAssetId: visual ? nullableStr(visual, "coverAssetId") : null,
      accentColor: visual ? str(visual, "accentColor", DEFAULT_ACCENT) : DEFAULT_ACCENT
    },
    levels: elements(value["levels"]).map(parseLevel)
  };
}

function parseLevel(value: Json): LevelDefinition {
  const mechanic = optObject(value["mechanic"]) ?? {};
  const mechanicType = str(mechanic, "type", "");
  const completion = optObject(value["completion"]);
  const reward = optObject(value["reward"]);
  const media = optObject(value["media"]);
  const unlock = optObject(value["unlock"]);
  return {
    id: str(value, "id", ""),
    version: int(value, "version", 0),
    order: int(value, "order", 0),
    title: localized(value["title"]),
    instruction: localized(value["instruction"]),
    mechanic: {
      type: mechanicType,
      config: parseMechanicConfig(mechanicType, optObject(mechanic["config"]), mechanic["config"])
    },
    unlock: {
      prerequisiteLevelIds: unlock
        ? asArray(unlock["prerequisiteLevelIds"]).filter((it): it is string => typeof it === "string")
        : []
    },
    completion: { type: "minimum_score", value: completion ? int(completion, "value", 0) : 0 },
    reward: {
      experience: reward ? int(reward, "experience", 0) : 0,
      badgeId: reward ? nullableStr(reward, "badgeId") : null
    },
    media: {
      promptAssetId: media ? nullableStr(media, "promptAssetId") : null,
      narrationAssetId: media ? nullableStr(media, "narrationAssetId") : null,
      backgroundAssetId: media ? nullableStr(media, "backgroundAssetId") : null
    }
  };
}

function parseMechanicConfig(type: string, config: Json | undefined, raw: unknown): MechanicConfig {
  switch (type) {
    case "telescope_hunt":
      return {
        kind: "telescope_hunt",
        targetCount: config ? int(config, "targetCount", 3) : 3,
        lockRadius: config ? num(config, "lockRadius", 92) : 92
      };
    case "multiple_choice":
      return {
        kind: "multiple_choice",
        question: localized(config?.["question"]),
        options: elements(config?.["options"]).map(
          (option): ChoiceOption => ({
            id: str(option, "id", ""),
            text: localized(option["text"]),
            correct: bool(option, "correct", false)
          })
        ),
        attempts: config ? int(config, "attempts", 2) : 2,
        successFeedback: localized(config?.["successFeedback"]),
        retryFeedback: localized(config?.["retryFeedback"])
      };
    case "set_select":
      return {
        kind: "set_select",
        ...setCommon(config),
        rounds: rounds(config).map((round) => ({
          prompt: localized(round["prompt"]),
          pieces: pieces(round["pieces"]),
          target: filter(round["target"])
        }))
      };
    case "set_membership":
      return {
        kind: "set_membership",
        ...setCommon(config),
        rounds: rounds(config).map((round) => ({ set: pieces(round["set"]), candidate: piece(asObject(round["candidate"])) }))
      };
    case "set_subset":
      return {
        kind: "set_subset",
        ...setCommon(config),
        rounds: rounds(config).map((round) => ({ set: pieces(round["set"]), groups: asArray(round["groups"]).map(pieces) }))
      };
    case "set_intersection":
      return {
        kind: "set_intersection",
        ...setCommon(config),
        rounds: rounds(config).map((round) => ({ a: filter(round["a"]), b: filter(round["b"]), pieces: pieces(round["pieces"]) }))
      };
    case "set_union":
    case "set_difference":
      return {
        kind: type,
        ...setCommon(config),
        rounds: rounds(config).map((round) => ({ a: pieces(round["a"]), b: pieces(round["b"]) }))
      };
    default:
      return { kind: "unsupported", rawJson: JSON.stringify(raw ?? null) };
  }
}

function setCommon(config: Json | undefined) {
  return {
    attempts: config ? int(config, "attempts", 2) : 2,
    successFeedback: localized(config?.["successFeedback"]),
    retryFeedback: localized(config?.["retryFeedback"])
  };
}

function rounds(config: Json | undefined): Json[] {
  return elements(config?.["rounds"]);
}

/** Forma y color se copian tal cual; `validateLevel` rechaza valores fuera del catálogo de piezas. */
function piece(value: Json): Piece {
  return { shape: str(value, "shape", "") as PieceShape, color: str(value, "color", "") as PieceColor };
}

function pieces(value: unknown): Piece[] {
  return elements(value).map(piece);
}

function filter(value: unknown): PieceFilter {
  const obj = asObject(value);
  return { shape: nullableStr(obj, "shape") as PieceShape | null, color: nullableStr(obj, "color") as PieceColor | null };
}

/** `en` vacío o ausente cae a `es`, igual que el parser Kotlin. */
function localized(value: unknown): LocalizedText {
  const obj = optObject(value);
  if (!obj) return { es: "", en: "" };
  const es = str(obj, "es", "");
  return { es, en: str(obj, "en", es) };
}

function asObject(value: unknown): Json {
  return optObject(value) ?? {};
}

function optObject(value: unknown): Json | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Json) : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function elements(value: unknown): Json[] {
  return asArray(value).map(asObject);
}

function str(obj: Json, key: string, fallback: string): string {
  const value = obj[key];
  return typeof value === "string" ? value : fallback;
}

function nullableStr(obj: Json, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" ? value : null;
}

function num(obj: Json, key: string, fallback: number): number {
  const value = obj[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function int(obj: Json, key: string, fallback: number): number {
  return Math.trunc(num(obj, key, fallback));
}

function bool(obj: Json, key: string, fallback: boolean): boolean {
  const value = obj[key];
  return typeof value === "boolean" ? value : fallback;
}
