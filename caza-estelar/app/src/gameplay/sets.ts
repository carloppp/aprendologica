import type { Piece, PieceAttribute, PieceFilter, SetClass } from "../content/model";

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

/** Cuántos grupos salen al juntar las piezas por `by` (FORMAR CONJUNTOS). */
export function groupCount(pieces: readonly Piece[], by: PieceAttribute): number {
  return new Set(pieces.map((piece) => piece[by])).size;
}

/**
 * FORMAR CONJUNTOS: el reparto es correcto si están todas las piezas y los grupos son exactamente
 * los que salen al juntarlas por forma o por color (cada grupo comparte una característica).
 */
export function isValidGrouping(pieces: readonly Piece[], groups: readonly (readonly number[])[]): boolean {
  const placed = groups.flat();
  if (placed.length !== pieces.length || new Set(placed).size !== pieces.length) return false;
  const filled = groups.filter((group) => group.length > 0);
  return (["shape", "color"] as const).some((by) => {
    const values = filled.map((group) => new Set(group.map((i) => pieces[i]![by])));
    return values.every((it) => it.size === 1) && new Set(values.map((it) => [...it][0])).size === filled.length;
  });
}

/**
 * Piezas mal agrupadas en FORMAR CONJUNTOS: las que no comparten la característica de la mayoría de
 * su aro, por forma o por color (lo que deje menos errores). Si dos aros juntan la misma
 * característica, sobra el más pequeño. Las piezas sin colocar no cuentan.
 */
export function groupingMistakes(pieces: readonly Piece[], groups: readonly (readonly number[])[]): number[] {
  const byLargest = groups.filter((group) => group.length > 0).sort((a, b) => b.length - a.length);
  const mistakesBy = (by: PieceAttribute) => {
    const taken = new Set<string>();
    return byLargest.flatMap((group) => {
      const counts = new Map<string, number>();
      group.forEach((i) => counts.set(pieces[i]![by], (counts.get(pieces[i]![by]) ?? 0) + 1));
      const majority = [...counts].sort((a, b) => b[1] - a[1])[0]![0];
      if (taken.has(majority)) return [...group];
      taken.add(majority);
      return group.filter((i) => pieces[i]![by] !== majority);
    });
  };
  const byShape = mistakesBy("shape");
  const byColor = mistakesBy("color");
  return byColor.length < byShape.length ? byColor : byShape;
}

/** Grupos de la respuesta de FORMAR CONJUNTOS: índices de las piezas juntadas por `by`. */
export function groupAnswer(pieces: readonly Piece[], by: PieceAttribute): number[][] {
  const groups = new Map<string, number[]>();
  pieces.forEach((piece, index) => groups.set(piece[by], [...(groups.get(piece[by]) ?? []), index]));
  return [...groups.values()];
}

/** Región del diagrama de Venn donde va una pieza (ELEMENTOS Y DIAGRAMAS); `b` nulo es un solo conjunto. */
export type DiagramRegion = "a" | "both" | "b" | "none";

export function diagramRegion(piece: Piece, a: PieceFilter, b: PieceFilter | null): DiagramRegion {
  const inA = matches(piece, a);
  const inB = b !== null && matches(piece, b);
  return inA && inB ? "both" : inA ? "a" : inB ? "b" : "none";
}

/** Elementos de un conjunto dibujado, escritos una sola vez (ENTRE LLAVES). */
export function elementsOf(set: readonly Piece[]): Piece[] {
  return distinct(set);
}

/** Opciones de DESCRIBE EL CONJUNTO que cumplen todos los elementos; el contenido válido tiene una. */
export function describeAnswer(set: readonly Piece[], options: readonly PieceFilter[]): number[] {
  return indicesWhere(options, (option) => set.length > 0 && set.every((piece) => matches(piece, option)));
}

/** Clase de un conjunto (CLASES DE CONJUNTOS): las piezas iguales cuentan como un solo elemento. */
export function setClass(set: readonly Piece[], infinite: boolean): SetClass {
  if (infinite) return "infinite";
  const count = distinct(set).length;
  return count === 0 ? "empty" : count === 1 ? "unit" : "finite";
}

/** Resultado de UNIÓN E INTERSECCIÓN. */
export function operationResult(op: "union" | "intersection", a: readonly Piece[], b: readonly Piece[]): Piece[] {
  return op === "union" ? union(a, b) : vennRegions(a, b).both;
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
