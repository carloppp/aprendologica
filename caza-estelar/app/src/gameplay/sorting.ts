import type { SortAttribute, SortColor, SortPiece, SortShape } from "../content/model";
import { SORT_ATTRIBUTES, SORT_COLORS, SORT_SHAPES, SORT_SIZES } from "../content/model";

/**
 * Reglas de CLASIFICACIÓN. Como en conjuntos y patrones, las respuestas se derivan del contenido:
 * el catálogo da las piezas y la app calcula a qué grupo va cada una.
 */

export function sortKindOf(piece: SortPiece): string {
  return `${piece.shape}:${piece.color}:${piece.size}`;
}

const ORDER: Record<SortAttribute, readonly string[]> = { color: SORT_COLORS, shape: SORT_SHAPES, size: SORT_SIZES };

/** Valores distintos de `by`, en orden fijo (de pequeño a grande en tamaño): un grupo por valor. */
export function sortGroupValues(pieces: readonly SortPiece[], by: SortAttribute): string[] {
  const present = new Set<string>(pieces.map((piece) => piece[by]));
  return ORDER[by].filter((value) => present.has(value));
}

/** Grupo (índice en `values`) al que va cada pieza. */
export function sortTargets(pieces: readonly SortPiece[], by: SortAttribute, values: readonly string[]): number[] {
  return pieces.map((piece) => values.indexOf(piece[by]));
}

/** DOS CARACTERÍSTICAS: cumple si tiene la forma y también el color de la regla. */
export function meetsRule(piece: SortPiece, rule: { shape: SortShape; color: SortColor }): boolean {
  return piece.shape === rule.shape && piece.color === rule.color;
}

/** Características que comparten todas las piezas del grupo. */
export function sharedAttributes(group: readonly SortPiece[]): SortAttribute[] {
  return SORT_ATTRIBUTES.filter((by) => group.length > 0 && group.every((piece) => piece[by] === group[0]![by]));
}

/** DESCUBRE LA REGLA se juega solo con color y forma (las piezas son todas del mismo tamaño). */
export const DISCOVER_ATTRIBUTES: readonly SortAttribute[] = ["color", "shape"];

/** Regla del grupo entre color y forma; el contenido válido tiene exactamente una. */
export function discoverAnswer(group: readonly SortPiece[]): SortAttribute[] {
  return sharedAttributes(group).filter((by) => DISCOVER_ATTRIBUTES.includes(by));
}

/** Familias de objetos para TIPO. */
export type TypeFamily = "fruit" | "animal" | "school" | "vehicle";
export const TYPE_FAMILIES: readonly TypeFamily[] = ["fruit", "animal", "school", "vehicle"];

/**
 * Objetos de TIPO. El kit todavía no trae ilustraciones de objetos: por ahora se dibujan con emoji
 * (`glyph`), hasta que haya assets.
 */
export const TYPE_ITEMS: Readonly<Record<string, { family: TypeFamily; glyph: string; es: string; en: string }>> = {
  apple: { family: "fruit", glyph: "🍎", es: "manzana", en: "apple" },
  banana: { family: "fruit", glyph: "🍌", es: "banano", en: "banana" },
  grapes: { family: "fruit", glyph: "🍇", es: "uvas", en: "grapes" },
  strawberry: { family: "fruit", glyph: "🍓", es: "fresa", en: "strawberry" },
  pear: { family: "fruit", glyph: "🍐", es: "pera", en: "pear" },
  dog: { family: "animal", glyph: "🐶", es: "perro", en: "dog" },
  cat: { family: "animal", glyph: "🐱", es: "gato", en: "cat" },
  fish: { family: "animal", glyph: "🐟", es: "pez", en: "fish" },
  rabbit: { family: "animal", glyph: "🐰", es: "conejo", en: "rabbit" },
  turtle: { family: "animal", glyph: "🐢", es: "tortuga", en: "turtle" },
  pencil: { family: "school", glyph: "✏️", es: "lápiz", en: "pencil" },
  book: { family: "school", glyph: "📘", es: "libro", en: "book" },
  scissors: { family: "school", glyph: "✂️", es: "tijeras", en: "scissors" },
  ruler: { family: "school", glyph: "📏", es: "regla", en: "ruler" },
  backpack: { family: "school", glyph: "🎒", es: "mochila", en: "backpack" },
  car: { family: "vehicle", glyph: "🚗", es: "carro", en: "car" },
  bus: { family: "vehicle", glyph: "🚌", es: "bus", en: "bus" },
  bike: { family: "vehicle", glyph: "🚲", es: "bicicleta", en: "bike" },
  plane: { family: "vehicle", glyph: "✈️", es: "avión", en: "plane" },
  boat: { family: "vehicle", glyph: "⛵", es: "bote", en: "boat" }
};

/** Familias de los objetos, en el orden en que aparecen: un grupo por familia. */
export function typeFamilies(items: readonly string[]): TypeFamily[] {
  return [...new Set(items.map((id) => TYPE_ITEMS[id]!.family))];
}
