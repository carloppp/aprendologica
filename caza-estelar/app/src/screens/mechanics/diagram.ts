import type { SetDiagramConfig } from "../../content/model";
import { diagramRegion, type DiagramRegion } from "../../gameplay/sets";
import { h, svg } from "../../ui/dom";
import { describeName, filterName, PIECE_PALETTE } from "../../ui/pieces";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { inside, pieceToken, placeAt, rowSlots, slotsIn, SortBoard, type Zone } from "./board";
import type { MechanicContext, RoundView } from "./types";
import { A_COLOR, B_COLOR, propertyBadge, setLabel, vennDecor } from "./venn";

/** Un solo conjunto: un aro grande al centro. */
const SINGLE: Zone = { cx: 960, cy: 520, rx: 360, ry: 200 };
/** Dos conjuntos que se cruzan, y las tres regiones donde se acomodan las piezas. */
const A: Zone = { cx: 790, cy: 520, rx: 300, ry: 200 };
const B: Zone = { cx: 1130, cy: 520, rx: 300, ry: 200 };
const ONLY_A: Zone = { cx: 640, cy: 520, rx: 110, ry: 150 };
const BOTH: Zone = { cx: 960, cy: 520, rx: 70, ry: 140 };
const ONLY_B: Zone = { cx: 1280, cy: 520, rx: 110, ry: 150 };
const TRAY_Y = 905;

/**
 * ELEMENTOS Y DIAGRAMAS: llevar cada pieza a su región del diagrama de Venn. Con un conjunto, las
 * que cumplen A van dentro; con dos, las que cumplen A y B van en el centro. Las demás se quedan
 * fuera, en la bandeja.
 */
export function diagramRound(round: SetDiagramConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const two = round.b !== null;
  const zones = two ? [ONLY_A, BOTH, ONLY_B] : [SINGLE];
  const regionIndex: Record<DiagramRegion, number> = two ? { a: 0, both: 1, b: 2, none: -1 } : { a: 0, both: 0, b: -1, none: -1 };
  const expected = round.pieces.map((piece) => regionIndex[diagramRegion(piece, round.a, round.b)]);

  const decor = two ? vennDecor(A, B) : svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  if (!two) {
    // Más oscuro que la mesa, para que el conjunto se distinga.
    decor.append(svg("ellipse", { cx: SINGLE.cx, cy: SINGLE.cy, rx: SINGLE.rx, ry: SINGLE.ry, fill: "#0B2A8C", stroke: A_COLOR, "stroke-width": 12 }));
  }
  const layer = h(
    "div",
    { class: "board" },
    holoTable(960, 600, 680, 300),
    decor,
    ...(two
      ? [setLabel("A", 560, 290, A_COLOR), propertyBadge(round.a, 720, 262, ctx.t), setLabel("B", 1360, 290, B_COLOR), propertyBadge(round.b!, 1200, 262, ctx.t)]
      : [setLabel("A", 760, 300, A_COLOR), propertyBadge(round.a, 960, 262, ctx.t)])
  );
  const board = new SortBoard(ctx.stage, layer, {
    regionAt: (point) => {
      if (!two) return inside(SINGLE, point, 1) ? 0 : -1;
      const inA = inside(A, point, 1);
      const inB = inside(B, point, 1);
      return inA && inB ? 1 : inA ? 0 : inB ? 2 : -1;
    },
    slots: (region, n) => slotsIn(zones[region]!, n, two ? 92 : 112),
    zoneScale: two ? 0.7 : 0.8,
    enabled: ctx.enabled
  });
  const homes = rowSlots(960, TRAY_Y, round.pieces.length, 175);
  round.pieces.forEach((piece, index) => {
    const pedestal = h("div", { class: "pedestal", style: `--pedestal:${PIECE_PALETTE[piece.color].fill}` });
    placeAt(pedestal, { x: homes[index]!.x, y: homes[index]!.y + 52 });
    const token = pieceToken(piece, 108, ctx.t);
    layer.append(pedestal, token);
    board.add(token, homes[index]!);
  });
  const misplaced = () => board.regions.flatMap((region, i) => (region >= 0 && region !== expected[i] ? [i] : []));

  const a = filterName(round.a);
  const b = round.b ? filterName(round.b) : undefined;
  const single = describeName(round.a);
  return {
    layer,
    mode: "check",
    hint: b
      ? { es: `Lo que es de A (${a.es}) y también de B (${b.es}) va en el centro. Lo que no es de ninguno se queda fuera.`, en: `What is in A (${a.en}) and also in B (${b.en}) goes in the middle. What is in neither stays out.` }
      : { es: `A es el conjunto de: ${single.es}. Pon dentro sus elementos y deja lo demás fuera.`, en: `A is the set of ${single.en}. Put its elements inside and leave the rest out.` },
    evaluate: () => (board.regions.every((it) => it < 0) ? null : board.regions.every((region, i) => region === expected[i])),
    onWrong: () => board.reject(misplaced()),
    reveal: () => {
      board.place(expected);
      board.highlight(expected.flatMap((region, i) => (region >= 0 ? [i] : [])));
    },
    reset: () => board.reset()
  };
}
