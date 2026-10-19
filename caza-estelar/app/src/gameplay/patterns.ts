import type { Piece } from "../content/model";
import { kindOf } from "./sets";

/**
 * Reglas de las mecánicas de PATRONES. Como en conjuntos, las respuestas se derivan del contenido:
 * el catálogo da la unidad que se repite y la app calcula qué va en cada baldosa.
 */

/** Puente de `length` baldosas que repite `unit`: A B A B A… */
export function expandPattern(unit: readonly Piece[], length: number): Piece[] {
  return Array.from({ length }, (_, i) => unit[i % unit.length]!);
}

/** Periodo más corto de una secuencia: 2 para A B A B, 3 para A A B A A B, su largo si no se repite. */
export function minimalPeriod(sequence: readonly Piece[]): number {
  const kinds = sequence.map(kindOf);
  for (let period = 1; period < kinds.length; period++) {
    if (kinds.every((kind, i) => kind === kinds[i % period])) return period;
  }
  return kinds.length;
}

/**
 * DESCUBRIR LA UNIDAD: la unidad correcta (la primera) y dos que no se repiten en el puente: una
 * pieza más corta y una pieza más larga (A B → A, y A B A).
 */
export function unitOptions(unit: readonly Piece[]): Piece[][] {
  return [[...unit], unit.slice(0, -1), [...unit, unit[0]!]];
}

export function distinctKinds(pieces: readonly Piece[]): number {
  return new Set(pieces.map(kindOf)).size;
}

/**
 * CREAR: la secuencia es un patrón si una unidad de al menos dos piezas distintas se repite
 * completa al menos dos veces (la última repetición puede quedar a medias: A B C A B C A).
 */
export function isRepeatedPattern(sequence: readonly Piece[]): boolean {
  if (distinctKinds(sequence) < 2) return false;
  return minimalPeriod(sequence) * 2 <= sequence.length;
}

/** DETECTAR: el camino correcto y uno por cada error del catálogo (el primero es el correcto). */
export function spotPaths(unit: readonly Piece[], length: number, mistakes: readonly { index: number; piece: Piece }[]): Piece[][] {
  const correct = expandPattern(unit, length);
  return [correct, ...mistakes.map((mistake) => correct.map((piece, i) => (i === mistake.index ? mistake.piece : piece)))];
}

/**
 * Piezas de la bandeja: cada elemento distinto una vez, en un orden fijo por forma y color, para
 * que la posición en la bandeja no delate la respuesta.
 */
export function trayPieces(pieces: readonly Piece[]): Piece[] {
  const seen = new Map<string, Piece>();
  for (const piece of pieces) if (!seen.has(kindOf(piece))) seen.set(kindOf(piece), piece);
  const order = (piece: Piece) => `${SHAPE_ORDER.indexOf(piece.shape)}${COLOR_ORDER.indexOf(piece.color)}`;
  return [...seen.values()].sort((a, b) => order(a).localeCompare(order(b)));
}

const SHAPE_ORDER = ["star", "circle", "gem", "moon"];
const COLOR_ORDER = ["yellow", "cyan", "purple", "blue", "pink"];
