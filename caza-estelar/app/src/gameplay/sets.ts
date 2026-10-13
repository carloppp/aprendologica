import type { Piece, PieceFilter } from "../content/model";

/**
 * Reglas de las mecánicas de conjuntos. Las respuestas correctas se derivan del contenido, así el
 * catálogo no puede declarar una respuesta que contradiga sus propias piezas.
 */

/** Identidad de un elemento: dos piezas con la misma forma y color son el mismo elemento. */
export function kindOf(piece: Piece): string {
  return `${piece.shape}:${piece.color}`;
}

export function matches(piece: Piece, filter: PieceFilter): boolean {
  return (filter.shape === null || piece.shape === filter.shape) && (filter.color === null || piece.color === filter.color);
}

export function hasDistinctElements(set: readonly Piece[]): boolean {
  return new Set(set.map(kindOf)).size === set.length;
}

export function contains(set: readonly Piece[], piece: Piece): boolean {
  const kind = kindOf(piece);
  return set.some((it) => kindOf(it) === kind);
}

export function isSubset(group: readonly Piece[], set: readonly Piece[]): boolean {
  return group.every((piece) => contains(set, piece));
}

/** Índices de las piezas que cumplen el filtro (ELEMENTOS). */
export function selectAnswer(pieces: readonly Piece[], target: PieceFilter): number[] {
  return indicesWhere(pieces, (piece) => matches(piece, target));
}

/** Índices de las piezas que cumplen A y B (INTERSECCIÓN). */
export function intersectionAnswer(pieces: readonly Piece[], a: PieceFilter, b: PieceFilter): number[] {
  return indicesWhere(pieces, (piece) => matches(piece, a) && matches(piece, b));
}

/** Índices de los grupos que son subconjunto; el contenido válido tiene exactamente uno. */
export function subsetGroups(set: readonly Piece[], groups: readonly Piece[][]): number[] {
  return indicesWhere(groups, (group) => group.length > 0 && isSubset(group, set));
}

/** Regiones de un diagrama de Venn: solo en A, en ambos y solo en B, sin repetir elementos. */
export function vennRegions(a: readonly Piece[], b: readonly Piece[]): { onlyA: Piece[]; both: Piece[]; onlyB: Piece[] } {
  return {
    onlyA: distinct(a.filter((piece) => !contains(b, piece))),
    both: distinct(a.filter((piece) => contains(b, piece))),
    onlyB: distinct(b.filter((piece) => !contains(a, piece)))
  };
}

export function union(a: readonly Piece[], b: readonly Piece[]): Piece[] {
  return distinct([...a, ...b]);
}

export function difference(a: readonly Piece[], b: readonly Piece[]): Piece[] {
  return vennRegions(a, b).onlyA;
}

/** Igualdad de conjuntos de elementos, sin importar el orden. */
export function sameElements(left: readonly Piece[], right: readonly Piece[]): boolean {
  const a = new Set(left.map(kindOf));
  const b = new Set(right.map(kindOf));
  return a.size === b.size && [...a].every((kind) => b.has(kind));
}

export function sameIndices(left: readonly number[], right: readonly number[]): boolean {
  const a = new Set(left);
  return a.size === right.length && right.every((index) => a.has(index));
}

function distinct(pieces: readonly Piece[]): Piece[] {
  const seen = new Set<string>();
  return pieces.filter((piece) => {
    const kind = kindOf(piece);
    if (seen.has(kind)) return false;
    seen.add(kind);
    return true;
  });
}

function indicesWhere<T>(items: readonly T[], predicate: (item: T) => boolean): number[] {
  return items.flatMap((item, index) => (predicate(item) ? [index] : []));
}
