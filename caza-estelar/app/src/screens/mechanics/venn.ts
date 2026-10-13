import type { LocalizedText, PieceFilter } from "../../content/model";
import { h, svg } from "../../ui/dom";
import { filterName, PIECE_PALETTE, shapeOutline } from "../../ui/pieces";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import type { Zone } from "./board";

export const A_COLOR = "#45D6FF";
export const B_COLOR = "#B36BFF";

/** Dos elipses que se cruzan, con relleno translúcido, en un SVG del tamaño del escenario. */
export function vennDecor(a: Zone, b: Zone): SVGSVGElement {
  const decor = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  decor.append(
    svg("ellipse", { cx: a.cx, cy: a.cy, rx: a.rx, ry: a.ry, fill: "#1446C8", "fill-opacity": 0.75, stroke: A_COLOR, "stroke-width": 10 }),
    svg("ellipse", { cx: b.cx, cy: b.cy, rx: b.rx, ry: b.ry, fill: "#5A2BC2", "fill-opacity": 0.55, stroke: B_COLOR, "stroke-width": 10 })
  );
  return decor;
}

/** Etiqueta de conjunto ("A", "B", "A ∪ B") en forma de píldora. */
export function setLabel(text: string, x: number, y: number, color: string): HTMLElement {
  return h("div", { class: "set-label", style: `left:${x}px;top:${y}px;--label:${color}` }, text);
}

/** Insignia que muestra la propiedad de un conjunto: una mancha de color o el contorno de una forma. */
export function propertyBadge(filter: PieceFilter, x: number, y: number, t: (text: LocalizedText) => string): HTMLElement {
  const badge = h("div", { class: "property-badge", style: `left:${x}px;top:${y}px` });
  if (filter.color) {
    const color = PIECE_PALETTE[filter.color];
    badge.append(
      filter.shape
        ? shapeOutline(filter.shape, 64, color.fill)
        : h("span", { class: "color-dot", style: `background:${color.fill};border-color:${color.light}` })
    );
  } else if (filter.shape) {
    badge.append(shapeOutline(filter.shape, 64));
  }
  badge.append(h("span", { class: "property-text" }, t(filterName(filter))));
  return badge;
}
