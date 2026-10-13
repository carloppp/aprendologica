import type { SetIntersectionConfig } from "../../content/model";
import { intersectionAnswer, sameIndices } from "../../gameplay/sets";
import { h } from "../../ui/dom";
import { filterName, PIECE_PALETTE } from "../../ui/pieces";
import { holoTable } from "../../ui/scenery";
import { pieceToken, placeAt, rowSlots, SelectionBoard, type Zone } from "./board";
import type { MechanicContext, RoundView } from "./types";
import { A_COLOR, B_COLOR, propertyBadge, setLabel, vennDecor } from "./venn";

const A: Zone = { cx: 790, cy: 560, rx: 300, ry: 200 };
const B: Zone = { cx: 1130, cy: 560, rx: 300, ry: 200 };
const LENS: Zone = { cx: 960, cy: 560, rx: 105, ry: 150 };

/** INTERSECCIÓN: llevar al centro del diagrama las piezas que cumplen A y B. */
export function intersectionRound(round: SetIntersectionConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const answer = intersectionAnswer(round.pieces, round.a, round.b);
  const layer = h(
    "div",
    { class: "board" },
    holoTable(960, 600, 640, 280),
    vennDecor(A, B),
    setLabel("A", 640, 352, A_COLOR),
    setLabel("B", 1280, 352, B_COLOR),
    propertyBadge(round.a, 660, 560, ctx.t),
    propertyBadge(round.b, 1260, 560, ctx.t)
  );
  const board = new SelectionBoard(ctx.stage, LENS, { spacing: 92, zoneScale: 0.72, enabled: ctx.enabled });
  const homes = rowSlots(960, 915, round.pieces.length, 175);
  round.pieces.forEach((piece, index) => {
    const pedestal = h("div", { class: "pedestal", style: `--pedestal:${PIECE_PALETTE[piece.color].fill}` });
    placeAt(pedestal, { x: homes[index]!.x, y: homes[index]!.y + 52 });
    const token = pieceToken(piece, 108, ctx.t);
    layer.append(pedestal, token);
    board.add(token, homes[index]!);
  });

  return {
    layer,
    mode: "check",
    hint: {
      es: `Debe cumplir A (${filterName(round.a).es}) y también B (${filterName(round.b).es}).`,
      en: `It must fit A (${filterName(round.a).en}) and also B (${filterName(round.b).en}).`
    },
    evaluate: () => (board.selected.length === 0 ? null : sameIndices(board.selected, answer)),
    onWrong: () => board.reject(board.selected.filter((index) => !answer.includes(index))),
    reveal: () => {
      board.select(answer);
      board.highlight(answer);
    },
    reset: () => board.reset()
  };
}
