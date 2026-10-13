import { hasDistinctElements, intersectionAnswer, selectAnswer, subsetGroups } from "../gameplay/sets";
import {
  PIECE_COLORS,
  PIECE_SHAPES,
  SET_MECHANICS,
  type LevelDefinition,
  type Piece,
  type PieceFilter,
  type SetMechanicConfig,
  type ValidationIssue
} from "./model";

/**
 * Valida un nivel contra las reglas del contrato v2 y las mecánicas instaladas.
 * Port de `LevelValidator.kt`. Ver `docs/CONTENT_SCHEMA_V2.md`.
 */
export function validateLevel(level: LevelDefinition, supportedMechanics: ReadonlySet<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (field: string, message: string) => issues.push({ field, message });

  if (isBlank(level.id)) add("id", "El nivel necesita un identificador");
  if (level.version < 1) add("version", "La versión debe ser mayor que cero");
  if (isBlank(level.title.es)) add("title.es", "Falta el título en español");
  if (isBlank(level.instruction.es)) add("instruction.es", "Falta la instrucción");

  if (!inRange(level.completion.value, 0, 100)) {
    add("completion.value", "El puntaje mínimo debe estar entre 0 y 100");
  }
  if (level.reward.experience < 0) add("reward.experience", "La experiencia no puede ser negativa");

  const prerequisites = level.unlock.prerequisiteLevelIds;
  if (prerequisites.includes(level.id)) {
    add("unlock.prerequisiteLevelIds", "Un nivel no puede depender de sí mismo");
  }
  if (new Set(prerequisites).size !== prerequisites.length) {
    add("unlock.prerequisiteLevelIds", "Los prerrequisitos no pueden repetirse");
  }

  if (!supportedMechanics.has(level.mechanic.type)) {
    add("mechanic.type", "La mecánica no está instalada en esta versión");
  }
  const config = level.mechanic.config;
  switch (level.mechanic.type) {
    case "telescope_hunt":
      if (config.kind !== "telescope_hunt") {
        add("mechanic.config", "La configuración del telescopio tiene un formato incorrecto");
      } else {
        if (!inRange(config.targetCount, 1, 6)) add("mechanic.config.targetCount", "El telescopio admite entre 1 y 6 objetivos");
        if (!inRange(config.lockRadius, 40, 180)) add("mechanic.config.lockRadius", "El radio de captura debe estar entre 40 y 180");
      }
      break;
    case "multiple_choice":
      if (config.kind !== "multiple_choice") {
        add("mechanic.config", "La selección múltiple tiene un formato incorrecto");
      } else {
        if (isBlank(config.question.es)) add("mechanic.config.question.es", "Falta la pregunta");
        if (!inRange(config.options.length, 2, 6)) add("mechanic.config.options", "Debe haber entre 2 y 6 opciones");
        if (new Set(config.options.map((it) => it.id)).size !== config.options.length) {
          add("mechanic.config.options.id", "Los identificadores de opción deben ser únicos");
        }
        if (config.options.filter((it) => it.correct).length !== 1) {
          add("mechanic.config.options.correct", "Debe existir exactamente una respuesta correcta");
        }
        if (config.options.some((it) => isBlank(it.text.es))) {
          add("mechanic.config.options.text.es", "Todas las opciones necesitan texto");
        }
        if (!inRange(config.attempts, 1, 5)) add("mechanic.config.attempts", "Los intentos deben estar entre 1 y 5");
        if (isBlank(config.successFeedback.es)) add("mechanic.config.successFeedback.es", "Falta la retroalimentación de éxito");
        if (isBlank(config.retryFeedback.es)) add("mechanic.config.retryFeedback.es", "Falta la retroalimentación de reintento");
      }
      break;
    default:
      if ((SET_MECHANICS as readonly string[]).includes(level.mechanic.type)) {
        if (config.kind !== level.mechanic.type) add("mechanic.config", "La mecánica de conjuntos tiene un formato incorrecto");
        else validateSetMechanic(config as SetMechanicConfig, add);
      }
  }
  return issues;
}

const MAX_ROUNDS = 6;
const MAX_TABLE_PIECES = 8;
const MAX_SET_ELEMENTS = 6;

/** Reglas de las mecánicas de conjuntos: cada ronda debe tener una respuesta posible y única. */
function validateSetMechanic(config: SetMechanicConfig, add: (field: string, message: string) => void): void {
  const base = "mechanic.config";
  if (!inRange(config.rounds.length, 1, MAX_ROUNDS)) add(`${base}.rounds`, `Debe haber entre 1 y ${MAX_ROUNDS} rondas`);
  if (!inRange(config.attempts, 1, 3)) add(`${base}.attempts`, "Los intentos por ronda deben estar entre 1 y 3");
  if (isBlank(config.successFeedback.es)) add(`${base}.successFeedback.es`, "Falta la retroalimentación de éxito");
  if (isBlank(config.retryFeedback.es)) add(`${base}.retryFeedback.es`, "Falta la retroalimentación de reintento");

  const pieceIssues = (pieces: readonly Piece[], field: string) => {
    if (pieces.some((it) => !PIECE_SHAPES.includes(it.shape) || !PIECE_COLORS.includes(it.color))) {
      add(field, "Cada pieza necesita una forma y un color conocidos");
    }
  };
  const filterIssues = (filter: PieceFilter, field: string) => {
    if (filter.shape === null && filter.color === null) add(field, "La propiedad necesita forma o color");
    if (filter.shape !== null && !PIECE_SHAPES.includes(filter.shape)) add(`${field}.shape`, "Forma desconocida");
    if (filter.color !== null && !PIECE_COLORS.includes(filter.color)) add(`${field}.color`, "Color desconocido");
  };
  const setIssues = (set: readonly Piece[], field: string, min = 1) => {
    pieceIssues(set, field);
    if (!inRange(set.length, min, MAX_SET_ELEMENTS)) add(field, `Un conjunto tiene entre ${min} y ${MAX_SET_ELEMENTS} elementos`);
    if (!hasDistinctElements(set)) add(field, "Un conjunto no repite elementos");
  };

  const field = (index: number) => `${base}.rounds[${index}]`;
  switch (config.kind) {
    case "set_select":
      config.rounds.forEach((r, i) => {
        if (isBlank(r.prompt.es)) add(`${field(i)}.prompt.es`, "Falta la consigna de la ronda");
        pieceIssues(r.pieces, `${field(i)}.pieces`);
        filterIssues(r.target, `${field(i)}.target`);
        if (!inRange(r.pieces.length, 2, MAX_TABLE_PIECES)) add(`${field(i)}.pieces`, `La mesa tiene entre 2 y ${MAX_TABLE_PIECES} piezas`);
        const answer = selectAnswer(r.pieces, r.target).length;
        if (answer === 0 || answer === r.pieces.length) add(`${field(i)}.target`, "Debe haber piezas que cumplan y piezas que no");
      });
      break;
    case "set_membership":
      config.rounds.forEach((r, i) => {
        setIssues(r.set, `${field(i)}.set`);
        pieceIssues([r.candidate], `${field(i)}.candidate`);
      });
      break;
    case "set_subset":
      config.rounds.forEach((r, i) => {
        setIssues(r.set, `${field(i)}.set`, 2);
        if (!inRange(r.groups.length, 2, 3)) add(`${field(i)}.groups`, "Debe haber 2 o 3 grupos");
        r.groups.forEach((group, g) => setIssues(group, `${field(i)}.groups[${g}]`));
        if (subsetGroups(r.set, r.groups).length !== 1) add(`${field(i)}.groups`, "Exactamente un grupo debe ser subconjunto");
      });
      break;
    case "set_intersection":
      config.rounds.forEach((r, i) => {
        filterIssues(r.a, `${field(i)}.a`);
        filterIssues(r.b, `${field(i)}.b`);
        pieceIssues(r.pieces, `${field(i)}.pieces`);
        if (!inRange(r.pieces.length, 2, 7)) add(`${field(i)}.pieces`, "La bandeja tiene entre 2 y 7 piezas");
        if (intersectionAnswer(r.pieces, r.a, r.b).length === 0) add(`${field(i)}.pieces`, "Al menos una pieza debe cumplir A y B");
      });
      break;
    case "set_union":
    case "set_difference":
      config.rounds.forEach((r, i) => {
        setIssues(r.a, `${field(i)}.a`);
        setIssues(r.b, `${field(i)}.b`);
      });
      break;
  }
}

export function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
