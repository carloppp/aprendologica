import type { LocalizedText, SortAttribute, SortColor, SortPiece, SortShape, SortSize } from "../content/model";
import { h } from "./dom";

/** Escala de cada tamaño respecto de la pieza grande. */
export const SORT_SIZE_SCALE: Record<SortSize, number> = { small: 0.55, medium: 0.77, large: 1 };

/** Pieza del kit de CLASIFICACIÓN (`assets/sorting/piece-*.webp`), del tamaño que le toca. */
export function sortPieceArt(piece: SortPiece, large: number): HTMLImageElement {
  const size = Math.round(large * SORT_SIZE_SCALE[piece.size]);
  return h("img", { class: "piece-art sort-piece", src: `assets/sorting/piece-${piece.shape}-${piece.color}.webp`, width: size, height: size, alt: "", draggable: "false" });
}

const SHAPES: Record<SortShape, { es: string; esPlural: string; en: string; enPlural: string; feminine: boolean }> = {
  circle: { es: "círculo", esPlural: "círculos", en: "circle", enPlural: "circles", feminine: false },
  triangle: { es: "triángulo", esPlural: "triángulos", en: "triangle", enPlural: "triangles", feminine: false },
  square: { es: "cuadrado", esPlural: "cuadrados", en: "square", enPlural: "squares", feminine: false },
  star: { es: "estrella", esPlural: "estrellas", en: "star", enPlural: "stars", feminine: true }
};

const COLORS: Record<SortColor, { es: [string, string]; en: string }> = {
  yellow: { es: ["amarillo", "amarilla"], en: "yellow" },
  cyan: { es: ["celeste", "celeste"], en: "light blue" },
  purple: { es: ["morado", "morada"], en: "purple" }
};

const SIZES: Record<SortSize, { es: [string, string]; en: string }> = {
  small: { es: ["pequeño", "pequeña"], en: "small" },
  medium: { es: ["mediano", "mediana"], en: "medium" },
  large: { es: ["grande", "grande"], en: "large" }
};

/** "círculo coral grande" / "large coral circle". */
export function sortPieceName(piece: SortPiece): LocalizedText {
  const shape = SHAPES[piece.shape];
  const g = shape.feminine ? 1 : 0;
  return { es: `${shape.es} ${COLORS[piece.color].es[g]} ${SIZES[piece.size].es[g]}`, en: `${SIZES[piece.size].en} ${COLORS[piece.color].en} ${shape.en}` };
}

function plural(word: string): string {
  return /[aeiou]$/.test(word) ? `${word}s` : `${word}es`;
}

/** Nombre de un grupo: "AMARILLO", "CÍRCULOS", "GRANDE". */
export function sortValueName(by: SortAttribute, value: string): LocalizedText {
  if (by === "shape") return { es: SHAPES[value as SortShape].esPlural, en: SHAPES[value as SortShape].enPlural };
  if (by === "color") return { es: COLORS[value as SortColor].es[0], en: COLORS[value as SortColor].en };
  return { es: SIZES[value as SortSize].es[0], en: SIZES[value as SortSize].en };
}

/** Regla de DOS CARACTERÍSTICAS: "círculos amarillos" / "yellow circles". */
export function sortRuleName(rule: { shape: SortShape; color: SortColor }): LocalizedText {
  const shape = SHAPES[rule.shape];
  return { es: `${shape.esPlural} ${plural(COLORS[rule.color].es[shape.feminine ? 1 : 0])}`, en: `${COLORS[rule.color].en} ${shape.enPlural}` };
}

/** Color de la regla concordando con su forma: "amarillos" (círculos), "celestes" (estrellas). */
export function sortRuleColor(rule: { shape: SortShape; color: SortColor }): LocalizedText {
  return { es: plural(COLORS[rule.color].es[SHAPES[rule.shape].feminine ? 1 : 0]), en: COLORS[rule.color].en };
}

/** Nombre de una característica: "COLOR", "FORMA", "TAMAÑO". */
export const SORT_ATTRIBUTE_NAMES: Record<SortAttribute, LocalizedText> = {
  color: { es: "color", en: "color" },
  shape: { es: "forma", en: "shape" },
  size: { es: "tamaño", en: "size" }
};
