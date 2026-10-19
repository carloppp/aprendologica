import {
  SORT_ATTRIBUTES,
  type LocalizedText,
  type SortAttribute,
  type SortColor,
  type SortDiscoverConfig,
  type SortGroupsConfig,
  type SortPiece,
  type SortRuleConfig,
  type SortShape,
  type SortSize,
  type SortTypeConfig
} from "../../content/model";
import { DISCOVER_ATTRIBUTES, discoverAnswer, meetsRule, sortGroupValues, sortTargets, TYPE_ITEMS, typeFamilies, type TypeFamily } from "../../gameplay/sorting";
import { sound } from "../../audio/sound";
import { h, svg } from "../../ui/dom";
import { SHAPE_PATHS } from "../../ui/pieces";
import type { StagePoint } from "../../ui/pointer";
import { SORT_ATTRIBUTE_NAMES, sortPieceArt, sortPieceName, sortRuleColor, sortRuleName, sortValueName } from "../../ui/sortPieces";
import { placeAt, rowSlots, slotsIn, SortBoard, type Zone } from "./board";
import { AUTO_CHECK_MS } from "./options";
import type { MechanicContext, RoundView } from "./types";

/**
 * CLASIFICACIÓN (guía 2D `interfaz/niveles/imagenes-niveles-clasificacion-v1`): sobre las islas
 * flotantes, grupos arriba (contenedores, tarjetas o bases) y abajo la bandeja con las piezas, que
 * se arrastran o se tocan para elegirlas y luego se toca su grupo.
 */

/** Tamaño en la bandeja de la pieza grande (las demás, a escala: `SORT_SIZE_SCALE`). */
const LARGE = 180;
const TRAY_Y = 840;
const TRAY_STEP = 196;
/** Centro de los grupos: apoyados sobre la plataforma central del fondo (`bg-sorting.jpg`). */
const BIN_Y = 315;
/** Tarjetas de TAMAÑO (diseño del 2026-10-15): más altas, con su borde de abajo sobre la plataforma. */
const SIZE_CARD_Y = 290;
/** Lado de la silueta guía de cada tamaño, en la misma proporción que las piezas. */
const SIZE_GUIDE: Record<SortSize, number> = { small: 110, medium: 165, large: 235 };

/** Colores de las manchas que acompañan los nombres de color (los del kit). */
const SWATCH: Record<SortColor, string> = { yellow: "#FFD43B", cyan: "#20C8F5", purple: "#B45CF5" };

const FAMILY_NAMES: Record<TypeFamily, LocalizedText & { glyph: string }> = {
  fruit: { es: "FRUTAS", en: "FRUIT", glyph: "🧺" },
  animal: { es: "ANIMALES", en: "ANIMALS", glyph: "🐾" },
  school: { es: "ÚTILES", en: "SCHOOL", glyph: "🏫" },
  vehicle: { es: "VEHÍCULOS", en: "VEHICLES", glyph: "🛣️" }
};

/** Centro de cada grupo: dos o tres a lo ancho. */
function binXs(count: number): number[] {
  return count === 2 ? [740, 1180] : [530, 960, 1390];
}

/** Lugares de las piezas en la bandeja: una fila hasta 5, dos filas si son más. */
function trayHomes(count: number): StagePoint[] {
  if (count <= 5) return rowSlots(960, TRAY_Y, count, TRAY_STEP);
  const top = Math.ceil(count / 2);
  return [...rowSlots(960, TRAY_Y - 90, top, TRAY_STEP), ...rowSlots(960, TRAY_Y + 90, count - top, TRAY_STEP)];
}

function trayPanel(count: number): HTMLElement {
  const perRow = count <= 5 ? count : Math.ceil(count / 2);
  const rows = count <= 5 ? 1 : 2;
  return h("div", { class: "sort-tray", style: `left:960px;top:${TRAY_Y}px;width:${perRow * TRAY_STEP + 60}px;height:${rows * 180 + 40}px` });
}

function pieceToken(piece: SortPiece, ctx: MechanicContext): HTMLButtonElement {
  return h("button", { class: "token sort-token", type: "button", "aria-label": ctx.t(sortPieceName(piece)) }, sortPieceArt(piece, LARGE));
}

/** Silueta blanca de una forma (la pieza del kit teñida de blanco), para rótulos. */
function silhouette(shape: SortShape, size: number): HTMLImageElement {
  return h("img", { class: "sort-silhouette", src: `assets/sorting/piece-${shape}-purple.webp`, width: size, height: size, alt: "", draggable: "false" });
}

interface Bin {
  element: HTMLElement;
  /** Zona donde se suelta o se toca el grupo. */
  hit: Zone;
  /** Zona donde se acomodan las piezas dentro del grupo. */
  drop: Zone;
}

function binAt(className: string, x: number, label: string, ...content: Node[]): HTMLElement {
  const element = h("div", { class: `sort-bin ${className}`, role: "group", "aria-label": label }, ...content);
  placeAt(element, { x, y: BIN_Y });
  return element;
}

/** Contenedor de color (`zonas/contenedor-*`). */
function colorBin(color: SortColor, x: number, ctx: MechanicContext): Bin {
  return {
    element: binAt("is-color", x, ctx.t(sortValueName("color", color)), h("img", { src: `assets/sorting/bin-${color}.webp`, width: 360, alt: "", draggable: "false" })),
    hit: { cx: x, cy: BIN_Y, rx: 190, ry: 160 },
    drop: { cx: x, cy: BIN_Y - 40, rx: 130, ry: 60 }
  };
}

/** Tarjeta de forma: la silueta arriba y el espacio punteado para las piezas. */
function shapeBin(shape: SortShape, x: number, ctx: MechanicContext): Bin {
  return {
    element: binAt(
      "is-card",
      x,
      ctx.t(sortValueName("shape", shape)),
      h("img", { src: "assets/sorting/card-shape.webp", width: 360, alt: "", draggable: "false" }),
      h("span", { class: "sort-bin-tab" }, silhouette(shape, 64))
    ),
    hit: { cx: x, cy: BIN_Y, rx: 190, ry: 140 },
    drop: { cx: x, cy: BIN_Y + 5, rx: 130, ry: 70 }
  };
}

/** Tarjeta de un tamaño, con su nombre arriba y una estrella tenue de ese tamaño como guía. */
function sizeBin(size: SortSize, x: number, ctx: MechanicContext): Bin {
  const guide = svg("svg", { class: "sort-size-guide", viewBox: "-50 -50 100 100", width: SIZE_GUIDE[size], height: SIZE_GUIDE[size], "aria-hidden": "true" });
  guide.append(svg("path", { d: SHAPE_PATHS.star, fill: "#f9c7bd", stroke: "#f9c7bd", "stroke-width": 10, "stroke-linejoin": "round" }));
  const element = binAt(
    "is-size",
    x,
    ctx.t(sortValueName("size", size)),
    h("span", { class: "sort-bin-tab is-text" }, ctx.t(sortValueName("size", size)).toUpperCase()),
    guide
  );
  element.style.top = `${SIZE_CARD_Y}px`;
  return {
    element,
    hit: { cx: x, cy: SIZE_CARD_Y, rx: 210, ry: 185 },
    drop: { cx: x, cy: SIZE_CARD_Y + 15, rx: 140, ry: 100 }
  };
}

/** Tarjeta de familia (TIPO). */
function familyBin(family: TypeFamily, x: number, ctx: MechanicContext): Bin {
  const name = FAMILY_NAMES[family];
  return {
    element: binAt(
      "is-card",
      x,
      ctx.t(name),
      h("img", { src: "assets/sorting/card-group.webp", width: 360, alt: "", draggable: "false" }),
      h("span", { class: "sort-bin-tab is-text" }, h("span", { "aria-hidden": "true" }, name.glyph), ctx.t(name))
    ),
    hit: { cx: x, cy: BIN_Y, rx: 190, ry: 140 },
    drop: { cx: x, cy: BIN_Y + 5, rx: 130, ry: 70 }
  };
}

/** Zona CUMPLE / NO CUMPLE, dibujada para que el texto se traduzca. */
function verdictBin(yes: boolean, x: number, ctx: MechanicContext): Bin {
  const label = yes ? { es: "CUMPLE", en: "FITS" } : { es: "NO CUMPLE", en: "DOES NOT FIT" };
  const element = binAt(`is-verdict ${yes ? "is-yes" : "is-no"}`, x, ctx.t(label), h("span", { class: "sort-verdict-title" }, h("span", { class: "sort-verdict-mark" }, yes ? "✓" : "✕"), ctx.t(label)));
  // Más bajas que los demás grupos, para dejar arriba la tarjeta de la regla sin tocar el globo.
  const cy = BIN_Y + 25;
  element.style.top = `${cy}px`;
  return {
    element,
    hit: { cx: x, cy, rx: 210, ry: 130 },
    drop: { cx: x, cy: cy + 15, rx: 150, ry: 55 }
  };
}

/**
 * Reparto en grupos: cada ficha va a su grupo (`target`). Con `auto`, se revisa sola al colocar la
 * última; si no, con el botón de comprobar.
 */
function binsView(
  ctx: MechanicContext,
  layer: HTMLElement,
  bins: Bin[],
  items: { element: HTMLElement; target: number }[],
  auto: boolean
): Pick<RoundView, "evaluate" | "onWrong" | "reveal" | "reset"> {
  bins.forEach((bin) => layer.append(bin.element));
  layer.append(trayPanel(items.length));
  const allPlaced = () => board.regions.every((it) => it >= 0);
  const board: SortBoard = new SortBoard(ctx.stage, layer, {
    regionAt: (point) => bins.findIndex((bin) => Math.abs(point.x - bin.hit.cx) <= bin.hit.rx && Math.abs(point.y - bin.hit.cy) <= bin.hit.ry),
    slots: (region, count) => slotsIn(bins[region]!.drop, count, 100),
    zoneScale: 0.56,
    enabled: ctx.enabled,
    onChange: () => {
      if (auto && allPlaced()) window.setTimeout(() => ctx.enabled() && allPlaced() && ctx.submit(), AUTO_CHECK_MS);
    }
  });
  const homes = trayHomes(items.length);
  items.forEach((item, i) => {
    layer.append(item.element);
    board.add(item.element, homes[i]!);
  });
  const targets = items.map((it) => it.target);
  return {
    evaluate: () => (allPlaced() ? board.regions.every((region, i) => region === targets[i]) : null),
    onWrong: () => board.reject(board.regions.flatMap((region, i) => (region >= 0 && region !== targets[i] ? [i] : []))),
    reveal: () => {
      board.place(targets);
      board.highlight(targets.map((_, i) => i));
    },
    reset: () => board.reset()
  };
}

const PLACE_ALL: LocalizedText = { es: "Pon todas las piezas en su grupo", en: "Put every piece in its group" };

/** COLOR, FORMA y TAMAÑO: repartir las piezas en el grupo de su color, forma o tamaño. Se revisa sola. */
export function sortGroupsRound(round: SortGroupsConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const values = sortGroupValues(round.pieces, round.by);
  const xs = binXs(values.length);
  const bins = values.map((value, i) =>
    round.by === "color" ? colorBin(value as SortColor, xs[i]!, ctx) : round.by === "shape" ? shapeBin(value as SortShape, xs[i]!, ctx) : sizeBin(value as SortSize, xs[i]!, ctx)
  );
  const layer = h("div", { class: "board sort-board" });
  const targets = sortTargets(round.pieces, round.by, values);
  const view = binsView(ctx, layer, bins, round.pieces.map((piece, i) => ({ element: pieceToken(piece, ctx), target: targets[i]! })), true);
  const hints: Record<SortAttribute, LocalizedText> = {
    color: { es: "Mira solo el color: cada pieza va al contenedor de su color.", en: "Look only at the color: each piece goes in the box of its color." },
    shape: { es: "Mira solo la forma: no importa el color ni el tamaño.", en: "Look only at the shape: color and size do not matter." },
    size: { es: "Compara los tamaños: pequeño, mediano y grande. No importa la forma.", en: "Compare the sizes: small, medium and large. The shape does not matter." }
  };
  return { layer, mode: "auto", incomplete: PLACE_ALL, hint: hints[round.by], ...view };
}

/** TIPO: repartir los objetos en su familia (frutas, animales, útiles, vehículos). Se revisa sola. */
export function sortTypeRound(round: SortTypeConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const families = typeFamilies(round.items);
  const xs = binXs(families.length);
  const layer = h("div", { class: "board sort-board" });
  const items = round.items.map((id) => {
    const item = TYPE_ITEMS[id]!;
    return {
      element: h("button", { class: "token sort-token sort-item", type: "button", "aria-label": ctx.t(item) }, h("span", { class: "sort-glyph", "aria-hidden": "true" }, item.glyph)),
      target: families.indexOf(item.family)
    };
  });
  const view = binsView(ctx, layer, families.map((family, i) => familyBin(family, xs[i]!, ctx)), items, true);
  return {
    layer,
    mode: "auto",
    incomplete: PLACE_ALL,
    hint: { es: "Piensa qué es cada cosa: ¿se come, es un animal, se usa en la escuela o sirve para viajar?", en: "Think about what each thing is: food, an animal, something for school or something to travel in?" },
    ...view
  };
}

/** DOS CARACTERÍSTICAS: separar lo que cumple la forma y el color de lo que no. Se comprueba con el botón. */
export function sortRuleRound(round: SortRuleConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const layer = h("div", { class: "board sort-board" });
  const name = sortRuleName(round.rule);
  const shapeName = sortValueName("shape", round.rule.shape);
  layer.append(
    h(
      "div",
      { class: "sort-rule-card", role: "note", "aria-label": ctx.t(name) },
      h("span", { class: "sort-rule-part" }, silhouette(round.rule.shape, 58), ctx.t(shapeName).toUpperCase()),
      h("span", { class: "sort-rule-plus" }, "+"),
      h("span", { class: "sort-rule-part" }, h("span", { class: "sort-swatch", style: `background:${SWATCH[round.rule.color]}` }), ctx.t(sortRuleColor(round.rule)).toUpperCase())
    )
  );
  const view = binsView(
    ctx,
    layer,
    [verdictBin(true, 740, ctx), verdictBin(false, 1180, ctx)],
    round.pieces.map((piece) => ({ element: pieceToken(piece, ctx), target: meetsRule(piece, round.rule) ? 0 : 1 })),
    false
  );
  return {
    layer,
    mode: "check",
    incomplete: PLACE_ALL,
    hint: { es: `Cumple si es de las dos cosas a la vez: ${name.es}. Si le falta una, no cumple.`, en: `It fits only if it is both at once: ${name.en}. If one is missing, it does not fit.` },
    ...view
  };
}

/** DESCUBRE LA REGLA: elegir si el grupo se formó por color o por forma. Se revisa sola al tocar. */
export function sortDiscoverRound(round: SortDiscoverConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const answer = DISCOVER_ATTRIBUTES.indexOf(discoverAnswer(round.group)[0]!);
  const layer = h("div", { class: "board sort-board" });
  const group = h(
    "div",
    { class: "sort-group", role: "group", "aria-label": ctx.t({ es: "Grupo", en: "Group" }) },
    ...round.group.map((piece) => h("span", { class: "sort-group-piece", role: "img", "aria-label": ctx.t(sortPieceName(piece)) }, sortPieceArt(piece, 120)))
  );
  layer.append(group);
  if (round.others.length > 0) {
    layer.append(
      h(
        "div",
        { class: "sort-others" },
        h("span", { class: "sort-others-title" }, ctx.t({ es: "NO SON DEL GRUPO", en: "NOT IN THE GROUP" })),
        h("span", { class: "sort-others-row" }, ...round.others.map((piece) => h("span", { role: "img", "aria-label": ctx.t(sortPieceName(piece)) }, sortPieceArt(piece, 84))))
      )
    );
  }
  let chosen = -1;
  const icons: Partial<Record<SortAttribute, Node>> = {
    color: h("span", { class: "sort-swatch is-rainbow" }),
    shape: silhouette("triangle", 48)
  };
  const buttons = DISCOVER_ATTRIBUTES.map((by, i) =>
    h(
      "button",
      {
        class: "sort-rule-option",
        type: "button",
        "aria-pressed": "false",
        onclick: () => {
          if (!ctx.enabled()) return;
          sound.play("tap");
          select(chosen === i ? -1 : i);
          if (chosen === i) window.setTimeout(() => ctx.enabled() && chosen === i && ctx.submit(), AUTO_CHECK_MS);
        }
      },
      icons[by] ?? null,
      ctx.t(SORT_ATTRIBUTE_NAMES[by]).toUpperCase()
    )
  );
  const select = (index: number) => {
    chosen = index;
    buttons.forEach((button, i) => {
      button.setAttribute("aria-pressed", String(i === index));
      button.classList.remove("is-wrong");
    });
  };
  layer.append(h("div", { class: "sort-rule-options" }, ...buttons));
  return {
    layer,
    mode: "auto",
    incomplete: { es: "Primero elige una regla", en: "First pick a rule" },
    hint: { es: "¿Qué tienen igual todas las piezas del grupo: el color o la forma?", en: "What is the same in every piece of the group: the color or the shape?" },
    evaluate: () => (chosen < 0 ? null : chosen === answer),
    onWrong: () => {
      const button = buttons[chosen];
      button?.classList.remove("is-wrong");
      void button?.offsetWidth;
      button?.classList.add("is-wrong");
      window.setTimeout(() => select(-1), 380);
    },
    reveal: () => {
      select(answer);
      buttons[answer]!.classList.add("is-answer");
    },
    reset: () => select(-1)
  };
}
