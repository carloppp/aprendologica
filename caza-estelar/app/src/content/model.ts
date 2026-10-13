/**
 * Modelo del contrato de contenido v2 (`constelación → nivel`). Port directo de
 * `core/.../content/v2/model/ContentModelsV2.kt`. Ver `docs/CONTENT_SCHEMA_V2.md`.
 */

export interface LocalizedText {
  es: string;
  en: string;
}

export type ContentAssetType = "IMAGE" | "AUDIO";

export interface ContentAssetDefinition {
  id: string;
  type: ContentAssetType;
  mimeType: string;
  url: string;
  sha256: string;
  sizeBytes: number;
  required: boolean;
}

export interface TelescopeHuntConfig {
  kind: "telescope_hunt";
  targetCount: number;
  lockRadius: number;
}

export interface ChoiceOption {
  id: string;
  text: LocalizedText;
  correct: boolean;
}

export interface MultipleChoiceConfig {
  kind: "multiple_choice";
  question: LocalizedText;
  options: ChoiceOption[];
  attempts: number;
  successFeedback: LocalizedText;
  retryFeedback: LocalizedText;
}

/** Pieza de las mecánicas de conjuntos: dos piezas son el mismo elemento si comparten forma y color. */
export type PieceShape = "star" | "moon" | "gem" | "circle";
export type PieceColor = "yellow" | "cyan" | "purple" | "blue" | "pink";
export const PIECE_SHAPES: readonly PieceShape[] = ["star", "moon", "gem", "circle"];
export const PIECE_COLORS: readonly PieceColor[] = ["yellow", "cyan", "purple", "blue", "pink"];

export interface Piece {
  shape: PieceShape;
  color: PieceColor;
}

/** Propiedad que define un conjunto por comprensión ("las estrellas", "lo azul"). */
export interface PieceFilter {
  shape: PieceShape | null;
  color: PieceColor | null;
}

/** Campos comunes de las mecánicas de conjuntos: varias rondas con intentos por ronda. */
interface SetRoundsConfig {
  attempts: number;
  successFeedback: LocalizedText;
  retryFeedback: LocalizedText;
}

/** ELEMENTOS: elegir de la mesa las piezas que cumplen la propiedad. */
export interface SetSelectConfig extends SetRoundsConfig {
  kind: "set_select";
  rounds: { prompt: LocalizedText; pieces: Piece[]; target: PieceFilter }[];
}

/** PERTENENCIA: decidir si la pieza candidata pertenece al conjunto. */
export interface SetMembershipConfig extends SetRoundsConfig {
  kind: "set_membership";
  rounds: { set: Piece[]; candidate: Piece }[];
}

/** SUBCONJUNTOS: colocar dentro del conjunto el único grupo que es subconjunto. */
export interface SetSubsetConfig extends SetRoundsConfig {
  kind: "set_subset";
  rounds: { set: Piece[]; groups: Piece[][] }[];
}

/** INTERSECCIÓN: colocar al centro las piezas que cumplen las dos propiedades. */
export interface SetIntersectionConfig extends SetRoundsConfig {
  kind: "set_intersection";
  rounds: { a: PieceFilter; b: PieceFilter; pieces: Piece[] }[];
}

/** UNIÓN: reunir en A ∪ B cada elemento de A y de B una sola vez. */
export interface SetUnionConfig extends SetRoundsConfig {
  kind: "set_union";
  rounds: { a: Piece[]; b: Piece[] }[];
}

/** DIFERENCIA: elegir lo que está en A y no en B. */
export interface SetDifferenceConfig extends SetRoundsConfig {
  kind: "set_difference";
  rounds: { a: Piece[]; b: Piece[] }[];
}

export type SetMechanicConfig =
  | SetSelectConfig
  | SetMembershipConfig
  | SetSubsetConfig
  | SetIntersectionConfig
  | SetUnionConfig
  | SetDifferenceConfig;

export const SET_MECHANICS: readonly SetMechanicConfig["kind"][] = [
  "set_select",
  "set_membership",
  "set_subset",
  "set_intersection",
  "set_union",
  "set_difference"
];

/** Mecánica no instalada en esta versión; se conserva el JSON original para diagnóstico. */
export interface UnsupportedMechanicConfig {
  kind: "unsupported";
  rawJson: string;
}

export type MechanicConfig = TelescopeHuntConfig | MultipleChoiceConfig | SetMechanicConfig | UnsupportedMechanicConfig;

export interface MechanicDefinition {
  type: string;
  config: MechanicConfig;
}

export interface ConstellationVisual {
  coverAssetId: string | null;
  accentColor: string;
}

export interface LevelMedia {
  promptAssetId: string | null;
  narrationAssetId: string | null;
  backgroundAssetId: string | null;
}

/** Criterio de finalización. Por ahora solo `minimum_score`. */
export interface LevelCompletion {
  type: "minimum_score";
  value: number;
}

export interface LevelReward {
  experience: number;
  badgeId: string | null;
}

export interface LevelUnlock {
  prerequisiteLevelIds: string[];
}

export interface LevelDefinition {
  id: string;
  version: number;
  order: number;
  title: LocalizedText;
  instruction: LocalizedText;
  mechanic: MechanicDefinition;
  unlock: LevelUnlock;
  completion: LevelCompletion;
  reward: LevelReward;
  media: LevelMedia;
}

export interface ConstellationDefinition {
  id: string;
  version: number;
  order: number;
  /** Área curricular, p. ej. `logic_and_sets`. */
  area: string;
  title: LocalizedText;
  description: LocalizedText;
  visual: ConstellationVisual;
  levels: LevelDefinition[];
}

export interface ContentCatalog {
  schemaVersion: number;
  publishedVersion: string;
  revision: number;
  minimumAppVersion: string;
  constellations: ConstellationDefinition[];
  assets: ContentAssetDefinition[];
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export function findLevel(catalog: ContentCatalog, levelId: string): LevelDefinition | undefined {
  for (const constellation of catalog.constellations) {
    const level = constellation.levels.find((it) => it.id === levelId);
    if (level) return level;
  }
  return undefined;
}

export const DEFAULT_ACCENT = "#7C8CFF";
