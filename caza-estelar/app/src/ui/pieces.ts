import type { LocalizedText, Piece, PieceColor, PieceFilter, PieceShape } from "../content/model";
import { svg } from "./dom";

/** Paleta de las piezas: relleno, brillo y contorno. */
export const PIECE_PALETTE: Record<PieceColor, { fill: string; light: string; dark: string }> = {
  yellow: { fill: "#FFD43B", light: "#FFF0A6", dark: "#D99A00" },
  cyan: { fill: "#5BD8F7", light: "#C8F5FF", dark: "#1A9CCB" },
  purple: { fill: "#A766F2", light: "#DDBBFF", dark: "#6B2FC0" },
  blue: { fill: "#3D8BFF", light: "#A9CDFF", dark: "#1D57C8" },
  pink: { fill: "#F48FD8", light: "#FFD2F2", dark: "#C9479F" }
};

const SHAPES: Record<PieceShape, string> = {
  // Estrella de cinco puntas; el trazo grueso y redondeado suaviza las puntas.
  star: "M0,-40 L11.6,-15.4 L38,-12.4 L18.4,6.2 L23.6,32.4 L0,19.2 L-23.6,32.4 L-18.4,6.2 L-38,-12.4 L-11.6,-15.4 Z",
  moon: "M8,-39 A40 40 0 1 0 39,9 A31 31 0 1 1 8,-39 Z",
  gem: "M0,-42 L34,0 L0,42 L-34,0 Z",
  circle: "M0,-38 A38 38 0 1 1 0,38 A38 38 0 1 1 0,-38 Z"
};

/** Trazo de cada forma, centrado en el origen y de unos 80 px de lado. */
export const SHAPE_PATHS: Readonly<Record<PieceShape, string>> = SHAPES;

/** Pieza vectorial brillante, centrada en un cuadro de `size` píxeles. */
export function pieceSvg(piece: Piece, size: number): SVGSVGElement {
  const palette = PIECE_PALETTE[piece.color];
  const root = svg("svg", { viewBox: "-50 -50 100 100", width: size, height: size, class: "piece-art", "aria-hidden": "true" });
  root.append(
    svg("path", { d: SHAPES[piece.shape], fill: palette.fill, stroke: palette.dark, "stroke-width": 6, "stroke-linejoin": "round" })
  );
  if (piece.shape === "gem") {
    root.append(svg("path", { d: "M0,-30 L20,0 L0,30 L-20,0 Z", fill: palette.light, opacity: 0.45 }));
  }
  const shine = piece.shape === "moon" ? { cx: -22, cy: -12 } : piece.shape === "star" ? { cx: -6, cy: -14 } : { cx: -13, cy: -17 };
  root.append(svg("ellipse", { cx: shine.cx, cy: shine.cy, rx: 8, ry: 5, fill: "#fff", opacity: 0.75, transform: `rotate(-35 ${shine.cx} ${shine.cy})` }));
  return root;
}

/** Contorno blanco de una forma, para mostrar una propiedad "por forma" (B = estrellas). */
export function shapeOutline(shape: PieceShape, size: number, color = "#fff"): SVGSVGElement {
  const root = svg("svg", { viewBox: "-50 -50 100 100", width: size, height: size, "aria-hidden": "true" });
  root.append(svg("path", { d: SHAPES[shape], fill: "none", stroke: color, "stroke-width": 9, "stroke-linejoin": "round" }));
  return root;
}

const SHAPE_NAMES: Record<PieceShape, { es: string; en: string; feminine: boolean; esPlural: string; enPlural: string }> = {
  star: { es: "estrella", en: "star", feminine: true, esPlural: "estrellas", enPlural: "stars" },
  moon: { es: "luna", en: "moon", feminine: true, esPlural: "lunas", enPlural: "moons" },
  gem: { es: "gema", en: "gem", feminine: true, esPlural: "gemas", enPlural: "gems" },
  circle: { es: "círculo", en: "circle", feminine: false, esPlural: "círculos", enPlural: "circles" }
};

const COLOR_NAMES: Record<PieceColor, { es: [string, string]; en: string }> = {
  yellow: { es: ["amarillo", "amarilla"], en: "yellow" },
  cyan: { es: ["celeste", "celeste"], en: "light blue" },
  purple: { es: ["morado", "morada"], en: "purple" },
  blue: { es: ["azul", "azul"], en: "blue" },
  pink: { es: ["rosado", "rosada"], en: "pink" }
};

/** Nombre accesible de una pieza: "estrella amarilla" / "yellow star". */
export function pieceName(piece: Piece): LocalizedText {
  const shape = SHAPE_NAMES[piece.shape];
  const color = COLOR_NAMES[piece.color];
  return { es: `${shape.es} ${color.es[shape.feminine ? 1 : 0]}`, en: `${color.en} ${shape.en}` };
}

/** Nombre de una propiedad: "estrellas", "lo azul", "círculos azules". */
export function filterName(filter: PieceFilter): LocalizedText {
  if (filter.shape && filter.color) {
    const shape = SHAPE_NAMES[filter.shape];
    const color = COLOR_NAMES[filter.color];
    const esColor = color.es[shape.feminine ? 1 : 0];
    return { es: `${shape.esPlural} ${esColor.endsWith("l") ? `${esColor}es` : `${esColor}s`}`, en: `${color.en} ${shape.enPlural}` };
  }
  if (filter.shape) return { es: SHAPE_NAMES[filter.shape].esPlural, en: SHAPE_NAMES[filter.shape].enPlural };
  const color = COLOR_NAMES[filter.color!];
  return { es: `lo ${color.es[0]}`, en: `${color.en} things` };
}

/** Plural de un color en español: "amarillas", "azules". */
function colorPlural(color: PieceColor, feminine: boolean): string {
  const singular = COLOR_NAMES[color].es[feminine ? 1 : 0];
  return singular.endsWith("l") ? `${singular}es` : `${singular}s`;
}

/**
 * Descripción de un conjunto por comprensión, para leer entre llaves: "estrellas", "piezas azules",
 * "círculos amarillos" (DESCRIBE EL CONJUNTO).
 */
export function describeName(filter: PieceFilter): LocalizedText {
  if (filter.shape) {
    const shape = SHAPE_NAMES[filter.shape];
    if (!filter.color) return { es: shape.esPlural, en: shape.enPlural };
    return { es: `${shape.esPlural} ${colorPlural(filter.color, shape.feminine)}`, en: `${COLOR_NAMES[filter.color].en} ${shape.enPlural}` };
  }
  return { es: `piezas ${colorPlural(filter.color!, true)}`, en: `${COLOR_NAMES[filter.color!].en} pieces` };
}
