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

/** Dificultad de una ronda del banco: 1 fácil, 2 media, 3 difícil. */
export type RoundDifficulty = 1 | 2 | 3;

interface Graded {
  difficulty: RoundDifficulty;
}

/**
 * Campos comunes de las mecánicas de conjuntos. `rounds` es un banco de variantes; cada partida
 * juega `roundsPerPlay` de ellas, sorteadas de fácil a difícil (ver `gameplay/roundPlan.ts`).
 */
interface RoundsConfig {
  attempts: number;
  roundsPerPlay: number;
  successFeedback: LocalizedText;
  retryFeedback: LocalizedText;
}

/** ELEMENTOS: elegir de la mesa las piezas que cumplen la propiedad. */
export interface SetSelectConfig extends RoundsConfig {
  kind: "set_select";
  rounds: ({ prompt: LocalizedText; pieces: Piece[]; target: PieceFilter } & Graded)[];
}

/** PERTENENCIA: decidir si la pieza candidata pertenece al conjunto. */
export interface SetMembershipConfig extends RoundsConfig {
  kind: "set_membership";
  rounds: ({ set: Piece[]; candidate: Piece } & Graded)[];
}

/** SUBCONJUNTOS: colocar dentro del conjunto el único grupo que es subconjunto. */
export interface SetSubsetConfig extends RoundsConfig {
  kind: "set_subset";
  rounds: ({ set: Piece[]; groups: Piece[][] } & Graded)[];
}

/** INTERSECCIÓN: colocar al centro las piezas que cumplen las dos propiedades. */
export interface SetIntersectionConfig extends RoundsConfig {
  kind: "set_intersection";
  rounds: ({ a: PieceFilter; b: PieceFilter; pieces: Piece[] } & Graded)[];
}

/** UNIÓN: reunir en A ∪ B cada elemento de A y de B una sola vez. */
export interface SetUnionConfig extends RoundsConfig {
  kind: "set_union";
  rounds: ({ a: Piece[]; b: Piece[] } & Graded)[];
}

/** DIFERENCIA: elegir lo que está en A y no en B. */
export interface SetDifferenceConfig extends RoundsConfig {
  kind: "set_difference";
  rounds: ({ a: Piece[]; b: Piece[] } & Graded)[];
}

/** Atributo de las piezas con el que se forman grupos. */
export type PieceAttribute = "shape" | "color";

/** FORMAR CONJUNTOS: repartir todas las piezas en aros, cada uno con una característica común. */
export interface SetGroupConfig extends RoundsConfig {
  kind: "set_group";
  /** `by` es el atributo de la respuesta que se muestra; se acepta cualquier reparto válido. */
  rounds: ({ pieces: Piece[]; by: PieceAttribute } & Graded)[];
}

/** ELEMENTOS Y DIAGRAMAS: colocar cada pieza en su región del diagrama de Venn (A, o A y B). */
export interface SetDiagramConfig extends RoundsConfig {
  kind: "set_diagram";
  rounds: ({ a: PieceFilter; b: PieceFilter | null; pieces: Piece[] } & Graded)[];
}

/** ENTRE LLAVES: escribir por extensión, A = { … }, cada elemento del diagrama una sola vez. */
export interface SetBracesConfig extends RoundsConfig {
  kind: "set_braces";
  /** `set` puede repetir piezas: en las llaves se escriben una sola vez. */
  rounds: ({ set: Piece[]; extra: Piece[] } & Graded)[];
}

/** DESCRIBE EL CONJUNTO: elegir la descripción por comprensión que cumplen todos sus elementos. */
export interface SetDescribeConfig extends RoundsConfig {
  kind: "set_describe";
  rounds: ({ set: Piece[]; options: PieceFilter[] } & Graded)[];
}

/** Clases de conjuntos según su cantidad de elementos. */
export type SetClass = "empty" | "unit" | "finite" | "infinite";
export const SET_CLASSES: readonly SetClass[] = ["empty", "unit", "finite", "infinite"];

/** CLASES DE CONJUNTOS: decidir si el conjunto es vacío, unitario, finito o infinito. */
export interface SetKindConfig extends RoundsConfig {
  kind: "set_kind";
  /** Con `infinite`, las piezas son el comienzo de una serie que sigue sin fin ("…"). */
  rounds: ({ set: Piece[]; infinite: boolean } & Graded)[];
}

/** UNIÓN E INTERSECCIÓN: armar A ∪ B o A ∩ B con los elementos de A y de B. */
export interface SetOperationConfig extends RoundsConfig {
  kind: "set_operation";
  rounds: ({ op: "union" | "intersection"; a: Piece[]; b: Piece[] } & Graded)[];
}

export type SetMechanicConfig =
  | SetSelectConfig
  | SetMembershipConfig
  | SetSubsetConfig
  | SetIntersectionConfig
  | SetUnionConfig
  | SetDifferenceConfig
  | SetGroupConfig
  | SetDiagramConfig
  | SetBracesConfig
  | SetDescribeConfig
  | SetKindConfig
  | SetOperationConfig;

export const SET_MECHANICS: readonly SetMechanicConfig["kind"][] = [
  "set_select",
  "set_membership",
  "set_subset",
  "set_intersection",
  "set_union",
  "set_difference",
  "set_group",
  "set_diagram",
  "set_braces",
  "set_describe",
  "set_kind",
  "set_operation"
];

/**
 * Mecánicas de PATRONES (guía 2D `niveles/patrones-puente`): las piezas forman las baldosas de un
 * puente hacia el portal. Las respuestas se derivan del contenido (`gameplay/patterns.ts`).
 */

/** REPETIR: copiar debajo, en el puente, exactamente la secuencia del modelo. */
export interface PatternCopyConfig extends RoundsConfig {
  kind: "pattern_copy";
  rounds: ({ sequence: Piece[]; extra: Piece[] } & Graded)[];
}

/** ALTERNAR, CONTINUAR y COMPLETAR: el puente repite `unit` y hay que llenar los huecos. */
export interface PatternFillConfig extends RoundsConfig {
  kind: "pattern_fill";
  rounds: ({ unit: Piece[]; length: number; blanks: number[]; extra: Piece[] } & Graded)[];
}

/** DETECTAR: tres caminos; solo uno sigue `unit`, los otros traen un error cada uno. */
export interface PatternSpotConfig extends RoundsConfig {
  kind: "pattern_spot";
  rounds: ({ unit: Piece[]; length: number; mistakes: { index: number; piece: Piece }[] } & Graded)[];
}

/** DESCUBRIR LA UNIDAD: el puente completo repite `unit`; elegir, entre tres, la parte que se repite. */
export interface PatternUnitConfig extends RoundsConfig {
  kind: "pattern_unit";
  rounds: ({ unit: Piece[]; length: number } & Graded)[];
}

/** CREAR: llenar el puente con un patrón propio que se repita al menos dos veces. */
export interface PatternCreateConfig extends RoundsConfig {
  kind: "pattern_create";
  rounds: ({ length: number; palette: Piece[] } & Graded)[];
}

export type PatternMechanicConfig = PatternCopyConfig | PatternFillConfig | PatternSpotConfig | PatternUnitConfig | PatternCreateConfig;

export const PATTERN_MECHANICS: readonly PatternMechanicConfig["kind"][] = ["pattern_copy", "pattern_fill", "pattern_spot", "pattern_unit", "pattern_create"];

/**
 * Mecánicas de CLASIFICACIÓN (guía 2D `interfaz/niveles/imagenes-niveles-clasificacion-v1` y
 * `assets/assets-y-fondos-clasificacion-v1`). Usan su propia familia de piezas (fichas v2 de
 * `assets/clasificacion-v2`): cuatro formas, tres colores y tres tamaños.
 */
export type SortShape = "circle" | "triangle" | "square" | "star";
export type SortColor = "yellow" | "cyan" | "purple";
export type SortSize = "small" | "medium" | "large";
export const SORT_SHAPES: readonly SortShape[] = ["circle", "triangle", "square", "star"];
/** Colores de las fichas v2 (`guia-visual-2d/assets/clasificacion-v2`), los mismos de los contenedores. */
export const SORT_COLORS: readonly SortColor[] = ["yellow", "cyan", "purple"];
export const SORT_SIZES: readonly SortSize[] = ["small", "medium", "large"];
/** Colores con contenedor en el kit (`zonas/contenedor-*`). */
export const SORT_BIN_COLORS: readonly SortColor[] = ["yellow", "cyan", "purple"];

export interface SortPiece {
  shape: SortShape;
  color: SortColor;
  size: SortSize;
}

/** Característica con la que se clasifica. */
export type SortAttribute = "color" | "shape" | "size";
export const SORT_ATTRIBUTES: readonly SortAttribute[] = ["color", "shape", "size"];

/** COLOR, FORMA y TAMAÑO: repartir todas las piezas en el grupo de su color, forma o tamaño. */
export interface SortGroupsConfig extends RoundsConfig {
  kind: "sort_groups";
  rounds: ({ by: SortAttribute; pieces: SortPiece[] } & Graded)[];
}

/** TIPO: repartir objetos (frutas, animales, útiles…) en su familia. `items` son ids de `TYPE_ITEMS`. */
export interface SortTypeConfig extends RoundsConfig {
  kind: "sort_type";
  rounds: ({ items: string[] } & Graded)[];
}

/** DOS CARACTERÍSTICAS: separar lo que cumple las dos condiciones (forma y color) de lo que no. */
export interface SortRuleConfig extends RoundsConfig {
  kind: "sort_rule";
  rounds: ({ rule: { shape: SortShape; color: SortColor }; pieces: SortPiece[] } & Graded)[];
}

/** DESCUBRE LA REGLA: ver un grupo y elegir la característica con la que se formó. */
export interface SortDiscoverConfig extends RoundsConfig {
  kind: "sort_discover";
  /** `group` comparte una sola característica; `others` (fuera del grupo) no la tienen. */
  rounds: ({ group: SortPiece[]; others: SortPiece[] } & Graded)[];
}

export type SortMechanicConfig = SortGroupsConfig | SortTypeConfig | SortRuleConfig | SortDiscoverConfig;

export const SORT_MECHANICS: readonly SortMechanicConfig["kind"][] = ["sort_groups", "sort_type", "sort_rule", "sort_discover"];

/** Mecánica no instalada en esta versión; se conserva el JSON original para diagnóstico. */
export interface UnsupportedMechanicConfig {
  kind: "unsupported";
  rawJson: string;
}

export type MechanicConfig =
  | TelescopeHuntConfig
  | MultipleChoiceConfig
  | SetMechanicConfig
  | PatternMechanicConfig
  | SortMechanicConfig
  | UnsupportedMechanicConfig;

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
  /** De qué trata el nivel, en una frase; se muestra en el panel antes de jugar (opcional). */
  description: LocalizedText;
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
