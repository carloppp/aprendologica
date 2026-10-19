import { distinctKinds, expandPattern, minimalPeriod } from "../gameplay/patterns";
import {
  contains,
  describeAnswer,
  diagramRegion,
  difference,
  elementsOf,
  groupCount,
  hasDistinctElements,
  intersectionAnswer,
  kindOf,
  operationResult,
  selectAnswer,
  subsetGroups
} from "../gameplay/sets";
import { discoverAnswer, meetsRule, sortGroupValues, sortKindOf, typeFamilies, TYPE_ITEMS } from "../gameplay/sorting";
import {
  PATTERN_MECHANICS,
  SORT_ATTRIBUTES,
  SORT_BIN_COLORS,
  SORT_COLORS,
  SORT_MECHANICS,
  SORT_SHAPES,
  SORT_SIZES,
  type SortColor,
  type SortMechanicConfig,
  type SortPiece,
  PIECE_COLORS,
  PIECE_SHAPES,
  SET_MECHANICS,
  type LevelDefinition,
  type PatternMechanicConfig,
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
      if (([...SET_MECHANICS, ...PATTERN_MECHANICS, ...SORT_MECHANICS] as string[]).includes(level.mechanic.type)) {
        if (config.kind !== level.mechanic.type) add("mechanic.config", "La mecánica por rondas tiene un formato incorrecto");
        else validateRoundMechanic(config as SetMechanicConfig | PatternMechanicConfig | SortMechanicConfig, add);
      }
  }
  return issues;
}

/** Banco de variantes de un nivel y rondas que se juegan en cada partida. */
const MAX_BANK_ROUNDS = 60;
const MAX_ROUNDS_PER_PLAY = 6;
const MAX_TABLE_PIECES = 8;
const MAX_SET_ELEMENTS = 6;
/** Bandeja de CLASIFICACIÓN: dos filas de cinco. */
const MAX_SORT_PIECES = 10;

/** Baldosas que caben en el puente de PATRONES (en DETECTAR, en cada uno de los tres caminos). */
const MAX_BRIDGE_TILES = 9;
const MAX_PATH_TILES = 8;
/** Baldosas que existen para el puente (guía 2D `assets/patrones-recuadros-uniformes-v2`). */
const BRIDGE_TILES = new Set(["star:yellow", "circle:cyan", "gem:purple"]);

/**
 * Reglas de las mecánicas por rondas (conjuntos y patrones): banco de variantes y, en cada ronda,
 * una respuesta posible y única.
 */
function validateRoundMechanic(config: SetMechanicConfig | PatternMechanicConfig | SortMechanicConfig, add: (field: string, message: string) => void): void {
  const base = "mechanic.config";
  if (!inRange(config.rounds.length, 1, MAX_BANK_ROUNDS)) add(`${base}.rounds`, `El banco tiene entre 1 y ${MAX_BANK_ROUNDS} rondas`);
  if (!inRange(config.roundsPerPlay, 1, Math.min(MAX_ROUNDS_PER_PLAY, config.rounds.length))) {
    add(`${base}.roundsPerPlay`, `Cada partida juega entre 1 y ${MAX_ROUNDS_PER_PLAY} rondas del banco`);
  }
  const seen = new Set<string>();
  config.rounds.forEach((round, i) => {
    if (!inRange(round.difficulty, 1, 3)) add(`${base}.rounds[${i}].difficulty`, "La dificultad es 1, 2 o 3");
    const key = JSON.stringify({ ...round, difficulty: 0 });
    if (seen.has(key)) add(`${base}.rounds[${i}]`, "La ronda repite otra del banco");
    seen.add(key);
  });
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

  // Unidad que se repite: 2 a 4 piezas, al menos dos distintas y sin repetirse ella misma (A B A B no es unidad).
  const unitIssues = (unit: readonly Piece[], at: string) => {
    pieceIssues(unit, at);
    if (!inRange(unit.length, 2, 4) || distinctKinds(unit) < 2 || minimalPeriod(unit) !== unit.length) {
      add(at, "La unidad tiene de 2 a 4 piezas, al menos dos distintas, y no se repite dentro de sí");
    }
  };
  // Distractores de la bandeja: hasta 2, distintos entre sí y que no estén en el patrón.
  const extraIssues = (extra: readonly Piece[], used: readonly Piece[], at: string) => {
    pieceIssues(extra, at);
    if (extra.length > 2 || !hasDistinctElements(extra) || extra.some((piece) => contains(used, piece))) {
      add(at, "Hasta 2 piezas extra, distintas y que no estén en el patrón");
    }
  };
  // El puente de PATRONES solo tiene baldosas de estrella amarilla, círculo celeste y rombo morado.
  const bridgeIssues = (pieces: readonly Piece[], at: string) => {
    if (pieces.some((piece) => !BRIDGE_TILES.has(kindOf(piece)))) add(at, "El puente solo tiene baldosas de estrella amarilla, círculo celeste y rombo morado");
  };
  const field = (index: number) => `${base}.rounds[${index}]`;
  // Piezas del kit de CLASIFICACIÓN: forma, color y tamaño conocidos.
  const sortPieceIssues = (pieces: readonly SortPiece[], at: string) => {
    if (pieces.some((it) => !SORT_SHAPES.includes(it.shape) || !SORT_COLORS.includes(it.color) || !SORT_SIZES.includes(it.size))) {
      add(at, "Cada pieza necesita una forma, un color y un tamaño conocidos");
    }
  };
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
        if (config.kind === "set_difference" && difference(r.a, r.b).length === 0) add(`${field(i)}.b`, "A − B no puede quedar vacío");
      });
      break;
    case "set_group":
      config.rounds.forEach((r, i) => {
        pieceIssues(r.pieces, `${field(i)}.pieces`);
        if (!inRange(r.pieces.length, 4, MAX_TABLE_PIECES)) add(`${field(i)}.pieces`, `La mesa tiene entre 4 y ${MAX_TABLE_PIECES} piezas`);
        if (r.by !== "shape" && r.by !== "color") add(`${field(i)}.by`, "Se agrupa por forma (shape) o por color (color)");
        else if (!inRange(groupCount(r.pieces, r.by), 2, 3)) add(`${field(i)}.by`, "Las piezas forman 2 o 3 grupos");
      });
      break;
    case "set_diagram":
      config.rounds.forEach((r, i) => {
        filterIssues(r.a, `${field(i)}.a`);
        if (r.b) filterIssues(r.b, `${field(i)}.b`);
        pieceIssues(r.pieces, `${field(i)}.pieces`);
        if (!inRange(r.pieces.length, 3, 7)) add(`${field(i)}.pieces`, "La bandeja tiene entre 3 y 7 piezas");
        const regions = r.pieces.map((piece) => diagramRegion(piece, r.a, r.b));
        if (!regions.some((it) => it === "a" || it === "both")) add(`${field(i)}.pieces`, "Al menos una pieza va en A");
        if (r.b && !regions.some((it) => it === "b" || it === "both")) add(`${field(i)}.pieces`, "Al menos una pieza va en B");
        if (!regions.includes("none")) add(`${field(i)}.pieces`, "Al menos una pieza queda fuera del diagrama");
      });
      break;
    case "set_braces":
      config.rounds.forEach((r, i) => {
        pieceIssues(r.set, `${field(i)}.set`);
        if (!inRange(r.set.length, 1, MAX_SET_ELEMENTS + 2) || !inRange(elementsOf(r.set).length, 1, 5)) {
          add(`${field(i)}.set`, "El diagrama tiene de 1 a 8 piezas y de 1 a 5 elementos distintos");
        }
        extraIssues(r.extra, r.set, `${field(i)}.extra`);
      });
      break;
    case "set_describe":
      config.rounds.forEach((r, i) => {
        setIssues(r.set, `${field(i)}.set`, 2);
        if (!inRange(r.options.length, 2, 3)) add(`${field(i)}.options`, "Hay 2 o 3 descripciones para elegir");
        r.options.forEach((option, k) => filterIssues(option, `${field(i)}.options[${k}]`));
        if (new Set(r.options.map((it) => JSON.stringify(it))).size !== r.options.length) add(`${field(i)}.options`, "Las descripciones no se repiten");
        if (describeAnswer(r.set, r.options).length !== 1) add(`${field(i)}.options`, "Exactamente una descripción la cumplen todos los elementos");
      });
      break;
    case "set_kind":
      config.rounds.forEach((r, i) => {
        pieceIssues(r.set, `${field(i)}.set`);
        if (!hasDistinctElements(r.set)) add(`${field(i)}.set`, "Un conjunto no repite elementos");
        if (r.infinite ? !inRange(r.set.length, 2, 4) : r.set.length > MAX_SET_ELEMENTS) {
          add(`${field(i)}.set`, r.infinite ? "Un conjunto infinito muestra de 2 a 4 piezas y sigue con «…»" : `Un conjunto tiene hasta ${MAX_SET_ELEMENTS} elementos`);
        }
      });
      break;
    case "set_operation":
      config.rounds.forEach((r, i) => {
        if (r.op !== "union" && r.op !== "intersection") add(`${field(i)}.op`, "La operación es union o intersection");
        setIssues(r.a, `${field(i)}.a`);
        setIssues(r.b, `${field(i)}.b`);
        if (r.op === "intersection" && operationResult(r.op, r.a, r.b).length === 0) add(`${field(i)}.b`, "A ∩ B no puede quedar vacío");
      });
      break;
    case "pattern_copy":
      config.rounds.forEach((r, i) => {
        pieceIssues(r.sequence, `${field(i)}.sequence`);
        bridgeIssues([...r.sequence, ...r.extra], `${field(i)}.sequence`);
        if (!inRange(r.sequence.length, 3, 6)) add(`${field(i)}.sequence`, "El modelo tiene entre 3 y 6 piezas");
        if (distinctKinds(r.sequence) < 2) add(`${field(i)}.sequence`, "El modelo necesita al menos dos piezas distintas");
        extraIssues(r.extra, r.sequence, `${field(i)}.extra`);
      });
      break;
    case "pattern_fill":
      config.rounds.forEach((r, i) => {
        unitIssues(r.unit, `${field(i)}.unit`);
        bridgeIssues([...r.unit, ...r.extra], `${field(i)}.unit`);
        if (!inRange(r.length, r.unit.length * 2, MAX_BRIDGE_TILES)) add(`${field(i)}.length`, `El puente muestra la unidad dos veces y tiene hasta ${MAX_BRIDGE_TILES} baldosas`);
        const blanks = new Set(r.blanks);
        if (!inRange(r.blanks.length, 1, 4) || blanks.size !== r.blanks.length || r.blanks.some((b) => !inRange(b, 0, r.length - 1))) {
          add(`${field(i)}.blanks`, "Entre 1 y 4 huecos distintos dentro del puente");
        } else {
          // Cada hueco debe poder deducirse: su posición en la unidad se ve en otra baldosa.
          const visible = new Set(Array.from({ length: r.length }, (_, k) => k).filter((k) => !blanks.has(k)).map((k) => k % r.unit.length));
          if (r.blanks.some((b) => !visible.has(b % r.unit.length))) add(`${field(i)}.blanks`, "Cada hueco debe verse en otra repetición de la unidad");
        }
        extraIssues(r.extra, r.unit, `${field(i)}.extra`);
      });
      break;
    case "pattern_spot":
      config.rounds.forEach((r, i) => {
        unitIssues(r.unit, `${field(i)}.unit`);
        bridgeIssues([...r.unit, ...r.mistakes.map((m) => m.piece)], `${field(i)}.unit`);
        if (!inRange(r.length, r.unit.length * 2, MAX_PATH_TILES)) add(`${field(i)}.length`, `Cada camino muestra la unidad dos veces y tiene hasta ${MAX_PATH_TILES} baldosas`);
        if (r.mistakes.length !== 2) add(`${field(i)}.mistakes`, "Hay dos caminos con un error cada uno");
        const correct = expandPattern(r.unit, r.length);
        r.mistakes.forEach((m, k) => {
          pieceIssues([m.piece], `${field(i)}.mistakes[${k}].piece`);
          if (!inRange(m.index, 0, r.length - 1) || kindOf(m.piece) === kindOf(correct[m.index]!)) add(`${field(i)}.mistakes[${k}]`, "El error cambia una baldosa del camino por otra pieza");
        });
        if (r.mistakes.length === 2 && r.mistakes[0]!.index === r.mistakes[1]!.index && kindOf(r.mistakes[0]!.piece) === kindOf(r.mistakes[1]!.piece)) {
          add(`${field(i)}.mistakes`, "Los dos caminos con error deben ser distintos");
        }
      });
      break;
    case "pattern_unit":
      config.rounds.forEach((r, i) => {
        unitIssues(r.unit, `${field(i)}.unit`);
        bridgeIssues(r.unit, `${field(i)}.unit`);
        if (!inRange(r.length, r.unit.length * 2, MAX_BRIDGE_TILES)) add(`${field(i)}.length`, `El puente muestra la unidad dos veces y tiene hasta ${MAX_BRIDGE_TILES} baldosas`);
      });
      break;
    case "sort_groups":
      config.rounds.forEach((r, i) => {
        sortPieceIssues(r.pieces, `${field(i)}.pieces`);
        if (!inRange(r.pieces.length, 4, MAX_SORT_PIECES)) add(`${field(i)}.pieces`, `La bandeja tiene entre 4 y ${MAX_SORT_PIECES} piezas`);
        if (!SORT_ATTRIBUTES.includes(r.by)) add(`${field(i)}.by`, "Se clasifica por color, forma (shape) o tamaño (size)");
        else {
          const values = sortGroupValues(r.pieces, r.by);
          if (!inRange(values.length, 2, 3)) add(`${field(i)}.by`, "Las piezas forman 2 o 3 grupos");
          if (r.by === "color" && values.some((it) => !SORT_BIN_COLORS.includes(it as SortColor))) add(`${field(i)}.pieces`, "Solo hay contenedores amarillo, celeste y morado");
        }
      });
      break;
    case "sort_type":
      config.rounds.forEach((r, i) => {
        if (r.items.some((it) => !(it in TYPE_ITEMS))) add(`${field(i)}.items`, "Objeto desconocido");
        else if (!inRange(typeFamilies(r.items).length, 2, 3)) add(`${field(i)}.items`, "Los objetos forman 2 o 3 familias");
        if (!inRange(r.items.length, 4, MAX_TABLE_PIECES) || new Set(r.items).size !== r.items.length) add(`${field(i)}.items`, `Entre 4 y ${MAX_TABLE_PIECES} objetos distintos`);
      });
      break;
    case "sort_rule":
      config.rounds.forEach((r, i) => {
        if (!SORT_SHAPES.includes(r.rule.shape) || !SORT_COLORS.includes(r.rule.color)) add(`${field(i)}.rule`, "La regla tiene una forma y un color conocidos");
        sortPieceIssues(r.pieces, `${field(i)}.pieces`);
        if (!inRange(r.pieces.length, 4, 7)) add(`${field(i)}.pieces`, "La bandeja tiene entre 4 y 7 piezas");
        const yes = r.pieces.filter((it) => meetsRule(it, r.rule)).length;
        if (yes === 0 || yes === r.pieces.length) add(`${field(i)}.pieces`, "Debe haber piezas que cumplan y piezas que no");
      });
      break;
    case "sort_discover":
      config.rounds.forEach((r, i) => {
        sortPieceIssues([...r.group, ...r.others], `${field(i)}.group`);
        if (!inRange(r.group.length, 3, 5) || new Set(r.group.map(sortKindOf)).size !== r.group.length) add(`${field(i)}.group`, "El grupo tiene de 3 a 5 piezas distintas");
        if (new Set([...r.group, ...r.others].map((it) => it.size)).size > 1) add(`${field(i)}.group`, "Todas las piezas son del mismo tamaño: se juega con color y forma");
        const shared = discoverAnswer(r.group);
        if (shared.length !== 1) add(`${field(i)}.group`, "El grupo comparte exactamente una característica: el color o la forma");
        else if (r.others.length > 3 || r.others.some((it) => it[shared[0]!] === r.group[0]![shared[0]!])) add(`${field(i)}.others`, "Hasta 3 piezas fuera del grupo, sin su característica");
      });
      break;
    case "pattern_create":
      config.rounds.forEach((r, i) => {
        if (!inRange(r.length, 4, 8)) add(`${field(i)}.length`, "El puente para crear tiene entre 4 y 8 baldosas");
        setIssues(r.palette, `${field(i)}.palette`, 2);
        bridgeIssues(r.palette, `${field(i)}.palette`);
        if (r.palette.length > 4) add(`${field(i)}.palette`, "La bandeja ofrece hasta 4 piezas");
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
