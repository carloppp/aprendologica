import { h, svg } from "./dom";
import { STAGE_HEIGHT, STAGE_WIDTH } from "./stage";

/** Generador pseudoaleatorio fijo: el cielo es el mismo en cada visita. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Destello de cuatro puntas centrado en (0,0) con radio 1. */
export const SPARKLE_PATH = "M0,-1 C0.14,-0.14 0.14,-0.14 1,0 C0.14,0.14 0.14,0.14 0,1 C-0.14,0.14 -0.14,0.14 -1,0 C-0.14,-0.14 -0.14,-0.14 0,-1 Z";

/**
 * Destello posicionado. La posición va en el grupo y la forma en el trazado, así una animación CSS
 * puede escalar o girar el trazado sin perder su lugar.
 */
export function sparkle(x: number, y: number, radius: number, fill: string, opacity = 1, className = ""): SVGGElement {
  const group = svg("g", { transform: `translate(${x} ${y}) scale(${radius})`, opacity });
  group.append(svg("path", { d: SPARKLE_PATH, fill, class: className }));
  return group;
}

/** Retardo y duración pseudoaleatorios para que las luces no parpadeen al unísono. */
function rhythm(next: () => number, base: number, spread: number): string {
  return `animation-delay:${(-next() * (base + spread)).toFixed(2)}s;animation-duration:${(base + next() * spread).toFixed(2)}s`;
}

function starField(root: SVGSVGElement, seed: number, area: { x: number; y: number; w: number; h: number }, dots: number, sparkles: number, animated = true) {
  const next = random(seed);
  for (let i = 0; i < dots; i++) {
    const dot = svg("circle", {
      cx: area.x + next() * area.w,
      cy: area.y + next() * area.h,
      r: 1.5 + next() * 2.5,
      fill: next() > 0.7 ? "#9DB4FF" : "#ffffff",
      opacity: 0.45 + next() * 0.5
    });
    // Solo una parte de los puntos titila, para no cargar tabletas modestas.
    if (next() > 0.55 && animated) {
      dot.classList.add("twinkle-dot");
      dot.setAttribute("style", rhythm(next, 2.4, 3));
    }
    root.append(dot);
  }
  for (let i = 0; i < sparkles; i++) {
    const color = next() > 0.6 ? "#8F7BFF" : next() > 0.5 ? "#7FC8FF" : "#ffffff";
    const star = sparkle(area.x + next() * area.w, area.y + next() * area.h, 10 + next() * 14, color, 0.9, animated ? "twinkle-sparkle" : "");
    if (animated) star.firstElementChild!.setAttribute("style", rhythm(next, 2.8, 3.5));
    root.append(star);
  }
}

/**
 * Nube de círculos. La nube completa se mece despacio y cada bulto se infla a destiempo, como si
 * respirara; `index` desfasa el movimiento entre nubes.
 */
function cloud(root: SVGSVGElement, circles: [number, number, number][], fill: string, shade: string, index: number) {
  const group = svg("g", { class: "cloud", style: `animation-delay:${(-index * 2.3).toFixed(1)}s;animation-duration:${(9 + index * 1.7).toFixed(1)}s` });
  const puff = (i: number) => `animation-delay:${(-(i * 1.3 + index)).toFixed(1)}s;animation-duration:${(4 + (i % 3) * 1.2).toFixed(1)}s`;
  circles.forEach(([cx, cy, r], i) => group.append(svg("circle", { cx, cy: cy + 14, r, fill: shade, class: "cloud-puff", style: puff(i) })));
  circles.forEach(([cx, cy, r], i) => group.append(svg("circle", { cx, cy, r, fill, class: "cloud-puff", style: puff(i) })));
  // Borde iluminado arriba, como luz de luna sobre la nube.
  const [cx, cy, r] = circles.reduce((top, it) => (it[1] - it[2] < top[1] - top[2] ? it : top));
  group.append(svg("path", { d: `M${cx - r * 0.6},${cy - r * 0.8} A${r} ${r} 0 0 1 ${cx + r * 0.6},${cy - r * 0.8}`, fill: "none", stroke: "#8D7BFF", "stroke-width": 6, "stroke-linecap": "round", class: "cloud-rim", style: puff(1) }));
  root.append(group);
}

/** Cielo abierto con nubes moradas en las esquinas (selector y constelación). */
export function skyBackdrop(seed = 7): HTMLElement {
  const root = svg("svg", { class: "backdrop", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true" });
  const defs = svg("defs");
  const gradient = svg("radialGradient", { id: "sky-glow", cx: "50%", cy: "45%", r: "70%" });
  gradient.append(svg("stop", { offset: "0%", "stop-color": "#101A5C" }), svg("stop", { offset: "100%", "stop-color": "#070C34" }));
  defs.append(gradient);
  root.append(defs, svg("rect", { width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: "url(#sky-glow)" }));
  starField(root, seed, { x: 0, y: 0, w: STAGE_WIDTH, h: STAGE_HEIGHT }, 120, 22);

  const fill = "#3B2BC0";
  const shade = "#2B1F96";
  cloud(root, [[-20, 900, 170], [150, 990, 150], [330, 1060, 130], [40, 720, 110], [-40, 560, 90]], fill, shade, 0);
  cloud(root, [[1940, 860, 180], [1760, 990, 160], [1580, 1070, 120], [1900, 660, 110]], fill, shade, 1);
  cloud(root, [[1860, 60, 150], [1720, -20, 120], [1950, 220, 110]], fill, shade, 2);
  cloud(root, [[-30, 330, 80], [40, 420, 70]], fill, shade, 3);
  return h("div", { class: "backdrop-host" }, root);
}

/** Mesa holográfica: tapa elíptica luminosa con cuadrícula y base cilíndrica. */
export function holoTable(cx: number, cy: number, rx: number, ry: number): SVGSVGElement {
  const root = svg("svg", { class: "holo-table", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  const defs = svg("defs");
  const top = svg("radialGradient", { id: "table-top", cx: "50%", cy: "50%", r: "50%" });
  top.append(svg("stop", { offset: "0%", "stop-color": "#2150D8" }), svg("stop", { offset: "100%", "stop-color": "#11298A" }));
  const glow = svg("filter", { id: "table-glow", x: "-20%", y: "-20%", width: "140%", height: "140%" });
  glow.append(svg("feGaussianBlur", { stdDeviation: 9 }));
  defs.append(top, glow);
  root.append(defs);

  const depth = 100;
  root.append(
    svg("path", { d: `M${cx - rx},${cy} L${cx - rx},${cy + depth} A${rx} ${ry} 0 0 0 ${cx + rx},${cy + depth} L${cx + rx},${cy} Z`, fill: "#0E1D6A" }),
    svg("ellipse", { cx, cy: cy + depth, rx, ry, fill: "none", stroke: "#0A1550", "stroke-width": 6 }),
    svg("ellipse", { cx, cy, rx: rx + 8, ry: ry + 6, fill: "#46D2FF", opacity: 0.55, filter: "url(#table-glow)" }),
    svg("ellipse", { cx, cy, rx, ry, fill: "url(#table-top)", stroke: "#46D2FF", "stroke-width": 10 }),
    svg("ellipse", { cx, cy, rx: rx - 34, ry: ry - 16, fill: "none", stroke: "#2D8EF2", "stroke-width": 5 })
  );
  for (const f of [0.66, 0.36]) {
    root.append(svg("ellipse", { cx, cy, rx: rx * f, ry: ry * f, fill: "none", stroke: "#3A8BEA", "stroke-width": 3, opacity: 0.7 }));
  }
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const x = cx + Math.cos(angle) * (rx - 34);
    const y = cy + Math.sin(angle) * (ry - 16);
    root.append(svg("line", { x1: cx + Math.cos(angle) * rx * 0.36, y1: cy + Math.sin(angle) * ry * 0.36, x2: x, y2: y, stroke: "#3A8BEA", "stroke-width": 3, opacity: 0.6 }));
    root.append(svg("circle", { cx: cx + Math.cos(angle) * rx * 0.66, cy: cy + Math.sin(angle) * ry * 0.66, r: 9, fill: "#4FC3FF" }));
  }
  return root;
}

/**
 * Capa de ambiente: estrellas fugaces que cruzan el cielo de vez en cuando y motas de luz que
 * suben despacio. Solo usa opacidad y transformaciones, que el navegador anima sin repintar.
 */
export function ambientLayer(options: { seed: number; shootingStars: number; motes: number; skyHeight?: number }): HTMLElement {
  const next = random(options.seed);
  const layer = h("div", { class: "ambient", "aria-hidden": "true" });
  const skyHeight = options.skyHeight ?? 620;
  for (let i = 0; i < options.shootingStars; i++) {
    const duration = 7 + next() * 6;
    layer.append(
      h("span", {
        class: "shooting-star",
        style: `left:${300 + next() * 1500}px;top:${20 + next() * skyHeight * 0.45}px;animation-duration:${duration.toFixed(1)}s;animation-delay:${(i * 2.7 + next() * 2).toFixed(1)}s`
      })
    );
  }
  const colors = ["#FFE27A", "#9BE7FF", "#D8B4FF", "#FFFFFF"];
  for (let i = 0; i < options.motes; i++) {
    const size = 6 + next() * 10;
    layer.append(
      h("span", {
        class: "mote",
        style: `left:${next() * 1920}px;top:${260 + next() * 820}px;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;--mote:${colors[Math.floor(next() * colors.length)]};animation-duration:${(9 + next() * 9).toFixed(1)}s;animation-delay:${(-next() * 18).toFixed(1)}s`
      })
    );
  }
  return layer;
}

type Point = readonly [number, number];

/** Las ilustraciones de la guía miden 1672 px de ancho; el escenario, 1920. */
const GUIDE_SCALE = STAGE_WIDTH / 1672;

/**
 * Luces animadas sobre una ilustración fija, con coordenadas tomadas de la imagen de la guía
 * (1672 px de ancho): estrellas pintadas que lanzan destellos, lámparas que parpadean como velas,
 * resplandores que respiran (p. ej. la mesa holográfica) y destellos que titilan en el cielo.
 */
export function paintedLights(options: {
  stars?: readonly Point[];
  lamps?: readonly Point[];
  glows?: readonly { at: Point; rx: number; ry: number; color: string }[];
  twinkles?: readonly Point[];
  lampRadius?: number;
}): SVGSVGElement {
  const at = ([x, y]: Point) => [x * GUIDE_SCALE, y * GUIDE_SCALE] as const;
  const root = svg("svg", { class: "scene-lights", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  const defs = svg("defs");
  const halo = svg("radialGradient", { id: "lamp-halo" });
  halo.append(svg("stop", { offset: "0%", "stop-color": "#FFE9A0", "stop-opacity": 0.85 }), svg("stop", { offset: "100%", "stop-color": "#FFB830", "stop-opacity": 0 }));
  defs.append(halo);
  root.append(defs);

  options.glows?.forEach((glow, i) => {
    const id = `painted-glow-${i}`;
    const gradient = svg("radialGradient", { id });
    gradient.append(svg("stop", { offset: "0%", "stop-color": glow.color, "stop-opacity": 0.75 }), svg("stop", { offset: "100%", "stop-color": glow.color, "stop-opacity": 0 }));
    defs.append(gradient);
    const [cx, cy] = at(glow.at);
    root.append(svg("ellipse", { cx, cy, rx: glow.rx * GUIDE_SCALE, ry: glow.ry * GUIDE_SCALE, fill: `url(#${id})`, class: "painted-glow", style: `animation-delay:${(-i * 1.1).toFixed(1)}s` }));
  });
  options.lamps?.forEach((point, i) => {
    const [cx, cy] = at(point);
    root.append(svg("circle", { cx, cy, r: options.lampRadius ?? 70, fill: "url(#lamp-halo)", class: "lamp-flicker", style: `animation-delay:${(-i * 0.37).toFixed(2)}s;animation-duration:${(1.6 + (i % 3) * 0.5).toFixed(1)}s` }));
  });
  options.stars?.forEach((point, i) => {
    const [x, y] = at(point);
    const star = sparkle(x, y, 26, "#ffffff", 1, "star-flare");
    star.firstElementChild!.setAttribute("style", `animation-delay:${(i * 0.45).toFixed(2)}s`);
    root.append(star);
  });
  options.twinkles?.forEach((point, i) => {
    const [x, y] = at(point);
    const star = sparkle(x, y, 18, "#ffffff", 0.95, "twinkle-sparkle");
    star.firstElementChild!.setAttribute("style", `animation-delay:${(-i * 0.8).toFixed(1)}s;animation-duration:${(2.6 + (i % 3) * 0.9).toFixed(1)}s`);
    root.append(star);
  });
  return root;
}
