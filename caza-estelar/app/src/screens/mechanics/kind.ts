import { SET_CLASSES, type LocalizedText, type SetClass, type SetKindConfig } from "../../content/model";
import { setClass } from "../../gameplay/sets";
import { h, svg } from "../../ui/dom";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { rowSlots, slotsIn, staticPiece, type Zone } from "./board";
import { optionCards } from "./options";
import type { MechanicContext, RoundView } from "./types";
import { A_COLOR, setLabel } from "./venn";

const SET: Zone = { cx: 960, cy: 430, rx: 420, ry: 175 };

const CLASS_NAMES: Record<SetClass, LocalizedText> = {
  empty: { es: "VACÍO", en: "EMPTY" },
  unit: { es: "UNITARIO", en: "SINGLETON" },
  finite: { es: "FINITO", en: "FINITE" },
  infinite: { es: "INFINITO", en: "INFINITE" }
};

/** Dibujito de cada clase en su tarjeta: un aro vacío, con uno, con varios, o con varios y "…". */
function classIcon(kind: SetClass): SVGSVGElement {
  const root = svg("svg", { class: "class-icon", viewBox: "0 0 140 80", width: 140, height: 80, "aria-hidden": "true" });
  root.append(svg("ellipse", { cx: 70, cy: 40, rx: 64, ry: 34, fill: "#dbe9ff", stroke: "#2f6fd6", "stroke-width": 5 }));
  const dots = { empty: [], unit: [70], finite: [44, 70, 96], infinite: [34, 56, 78] }[kind];
  dots.forEach((x) => root.append(svg("circle", { cx: x, cy: 40, r: 9, fill: "#f5b301", stroke: "#c98a00", "stroke-width": 3 })));
  if (kind === "infinite") [96, 106, 116].forEach((x) => root.append(svg("circle", { cx: x, cy: 46, r: 3.5, fill: "#2f6fd6" })));
  return root;
}

/**
 * CLASES DE CONJUNTOS: decidir si el conjunto del diagrama es vacío, unitario, finito o infinito.
 * Un conjunto infinito muestra sus primeras piezas, cada vez más lejos, y sigue con "…".
 */
export function kindRound(round: SetKindConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const answer = SET_CLASSES.indexOf(setClass(round.set, round.infinite));
  const decor = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  decor.append(svg("ellipse", { cx: SET.cx, cy: SET.cy, rx: SET.rx, ry: SET.ry, fill: "#0B2A8C", stroke: A_COLOR, "stroke-width": 12 }));
  const cards = optionCards(
    ctx,
    SET_CLASSES.map((kind) => ({ label: ctx.t(CLASS_NAMES[kind]), content: [classIcon(kind), h("span", { class: "option-text" }, ctx.t(CLASS_NAMES[kind]))] })),
    830,
    true
  );
  const layer = h("div", { class: "board" }, holoTable(960, 600, 680, 300), decor, setLabel("A", 540, 272, A_COLOR), cards.element);
  if (round.infinite) {
    // Las piezas se alejan (cada una más pequeña) y la serie sigue sin fin.
    const slots = rowSlots(SET.cx - 70, SET.cy, round.set.length, 135);
    round.set.forEach((piece, i) => layer.append(staticPiece(piece, 112 - i * 14, slots[i]!, ctx.t)));
    const last = slots[slots.length - 1]!;
    layer.append(h("div", { class: "set-ellipsis", style: `left:${last.x + 150}px;top:${SET.cy}px`, role: "img", "aria-label": ctx.t({ es: "y siguen sin fin", en: "and they go on forever" }) }, "…"));
  } else {
    const slots = slotsIn({ ...SET, rx: SET.rx - 80, ry: SET.ry - 35 }, round.set.length, 120);
    round.set.forEach((piece, i) => layer.append(staticPiece(piece, 104, slots[i]!, ctx.t)));
  }

  return {
    layer,
    // Al tocar una clase se revisa sola.
    mode: "auto",
    incomplete: { es: "Primero elige una clase de conjunto", en: "First pick a kind of set" },
    hint: {
      es: "Cuenta los elementos de A: ninguno es vacío, uno es unitario, varios que se terminan es finito, y si nunca se terminan es infinito.",
      en: "Count the elements of A: none is empty, one is a singleton, some that end is finite, and if they never end it is infinite."
    },
    evaluate: () => (cards.chosen() < 0 ? null : cards.chosen() === answer),
    onWrong: () => cards.reject(),
    reveal: () => cards.reveal(answer),
    reset: () => cards.reset()
  };
}
