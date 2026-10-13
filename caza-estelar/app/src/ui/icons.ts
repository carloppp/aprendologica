import { svg } from "./dom";

type IconName = "check" | "cross" | "retry" | "back" | "code" | "next" | "sound" | "mute" | "book";

const PATHS: Record<IconName, string> = {
  check: "M-26,2 L-8,20 L28,-18",
  cross: "M-20,-20 L20,20 M20,-20 L-20,20",
  retry: "M18,-14 A24 24 0 1 0 22,10 M22,-26 L18,-14 L6,-16",
  back: "M8,-22 L-12,0 L8,22",
  next: "M-8,-22 L12,0 L-8,22",
  // Ondas o equis a la derecha del parlante (el parlante se dibuja aparte, relleno).
  sound: "M10,-11 A15 15 0 0 1 10,11 M19,-22 A30 30 0 0 1 19,22",
  mute: "M12,-11 L32,11 M32,-11 L12,11",
  // Libro abierto (historia).
  book: "M0,-16 C-8,-24 -22,-26 -32,-22 L-32,22 C-22,18 -8,20 0,28 C8,20 22,18 32,22 L32,-22 C22,-26 8,-24 0,-16 Z M0,-16 L0,28",
  code: ""
};

/** Iconos de trazo grueso para los botones redondos. */
export function icon(name: IconName, size: number, color = "#fff"): SVGSVGElement {
  const root = svg("svg", { viewBox: "-40 -40 80 80", width: size, height: size, "aria-hidden": "true" });
  if (name === "code") {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        root.append(svg("rect", { x: -27 + col * 20, y: -27 + row * 20, width: 14, height: 14, rx: 3, fill: color }));
      }
    }
    return root;
  }
  if (name === "sound" || name === "mute") {
    root.append(svg("path", { d: "M-32,-9 L-20,-9 L-4,-23 L-4,23 L-20,9 L-32,9 Z", fill: color, stroke: color, "stroke-width": 6, "stroke-linejoin": "round" }));
  }
  root.append(
    svg("path", { d: PATHS[name], fill: "none", stroke: color, "stroke-width": 11, "stroke-linecap": "round", "stroke-linejoin": "round" })
  );
  return root;
}
