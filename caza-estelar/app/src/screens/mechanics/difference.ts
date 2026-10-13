import type { Piece, SetDifferenceConfig } from "../../content/model";
import { difference, sameElements, vennRegions } from "../../gameplay/sets";
import { h, svg } from "../../ui/dom";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { pieceToken, rowSlots, SelectionBoard, slotsIn, type Zone } from "./board";
import type { MechanicContext, RoundView } from "./types";
import { A_COLOR, B_COLOR, setLabel, vennDecor } from "./venn";

const A: Zone = { cx: 790, cy: 500, rx: 300, ry: 195 };
const B: Zone = { cx: 1130, cy: 500, rx: 300, ry: 195 };
const ONLY_A: Zone = { cx: 640, cy: 500, rx: 120, ry: 150 };
const BOTH: Zone = { cx: 960, cy: 500, rx: 95, ry: 140 };
const ONLY_B: Zone = { cx: 1280, cy: 500, rx: 120, ry: 150 };
const TRAY: Zone = { cx: 960, cy: 880, rx: 250, ry: 80 };

/** DIFERENCIA: llevar a la bandeja A − B lo que está en A y no en B. */
export function differenceRound(round: SetDifferenceConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const regions = vennRegions(round.a, round.b);
  const answerElements = difference(round.a, round.b);
  const tray = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  tray.append(
    svg("path", { d: "M690,870 L690,935 A270 70 0 0 0 1230,935 L1230,870 Z", fill: "#B9821A" }),
    svg("ellipse", { cx: 960, cy: 870, rx: 270, ry: 70, fill: "#6E4A08", stroke: "#FFD84A", "stroke-width": 12 })
  );
  const layer = h(
    "div",
    { class: "board" },
    holoTable(960, 540, 640, 280),
    vennDecor(A, B),
    tray,
    setLabel("A", 700, 278, A_COLOR),
    setLabel("B", 1220, 278, B_COLOR),
    setLabel("A − B", 960, 990, "#FFD84A")
  );

  const pieces: Piece[] = [];
  const homes = [
    ...placeRegion(regions.onlyA, ONLY_A, pieces),
    ...placeRegion(regions.both, BOTH, pieces),
    ...placeRegion(regions.onlyB, ONLY_B, pieces)
  ];
  const board = new SelectionBoard(ctx.stage, TRAY, {
    spacing: 112,
    zoneScale: 0.86,
    enabled: ctx.enabled,
    layout: (count) => rowSlots(TRAY.cx, TRAY.cy - 6, count, 112)
  });
  pieces.forEach((piece, index) => {
    const token = pieceToken(piece, 104, ctx.t);
    layer.append(token);
    board.add(token, homes[index]!);
  });
  const answer = pieces.flatMap((piece, index) => (answerElements.includes(piece) ? [index] : []));

  return {
    layer,
    mode: "check",
    hint: { es: "Lo que está en el centro también está en B: eso no va.", en: "What is in the middle is also in B: that does not go." },
    evaluate: () => (board.selected.length === 0 ? null : sameElements(board.selected.map((index) => pieces[index]!), answerElements)),
    onWrong: () => board.reject(board.selected.filter((index) => !answer.includes(index))),
    reveal: () => {
      board.select(answer);
      board.highlight(answer);
    },
    reset: () => board.reset()
  };
}

function placeRegion(region: Piece[], zone: Zone, into: Piece[]) {
  into.push(...region);
  return slotsIn(zone, region.length, 110);
}
