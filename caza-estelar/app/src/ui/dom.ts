type Child = Node | string | null | undefined | false;
type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

/** Crea un elemento HTML. Las claves `on*` registran eventos; `false`/`undefined` omiten el atributo. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "style" && typeof value === "string") {
      element.style.cssText = value;
    } else {
      element.setAttribute(key, value === true ? "" : String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child);
  }
  return element;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  return element;
}

/** Estrella de cinco puntas redondeada, centrada en (0,0), con radio exterior 1. */
export const STAR_PATH =
  "M0,-1 L0.27,-0.37 L0.95,-0.31 L0.44,0.14 L0.59,0.81 L0,0.46 L-0.59,0.81 L-0.44,0.14 L-0.95,-0.31 L-0.27,-0.37 Z";

/** Icono de estrella como SVG independiente (para botones y recompensas). */
export function starIcon(color: string, size: number, filled = true): SVGSVGElement {
  const root = svg("svg", { viewBox: "-1.2 -1.2 2.4 2.4", width: size, height: size, "aria-hidden": "true" });
  root.append(
    svg("path", {
      d: STAR_PATH,
      fill: filled ? color : "none",
      stroke: color,
      "stroke-width": 0.12,
      "stroke-linejoin": "round"
    })
  );
  return root;
}
