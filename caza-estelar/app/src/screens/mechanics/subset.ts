import type { SetSubsetConfig } from "../../content/model";
import { subsetGroups } from "../../gameplay/sets";
import { h, svg } from "../../ui/dom";
import { pieceName, pieceSvg } from "../../ui/pieces";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { rowSlots, SelectionBoard, slotsIn, staticPiece, type Zone } from "./board";
import type { MechanicContext, RoundView } from "./types";

const SET: Zone = { cx: 960, cy: 565, rx: 340, ry: 175 };
const SET_PIECES: Zone = { cx: 960, cy: 490, rx: 260, ry: 70 };
const GROUP_SLOT = { x: 960, y: 662 };

/** SUBCONJUNTOS: llevar dentro del conjunto el grupo cuyas piezas están todas en él. */
export function subsetRound(round: SetSubsetConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const answer = subsetGroups(round.set, round.groups);
  const decor = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  decor.append(svg("ellipse", { cx: SET.cx, cy: SET.cy, rx: SET.rx, ry: SET.ry, fill: "#0B2A8C", stroke: "#5BE6FF", "stroke-width": 10 }));
  const layer = h("div", { class: "board" }, holoTable(960, 590, 600, 265), decor);
  const slots = slotsIn(SET_PIECES, round.set.length, 104);
  round.set.forEach((piece, index) => layer.append(staticPiece(piece, 92, slots[index]!, ctx.t)));

  const board = new SelectionBoard(ctx.stage, SET, { spacing: 0, zoneScale: 0.92, capacity: 1, enabled: ctx.enabled, layout: () => [GROUP_SLOT] });
  const homes = rowSlots(960, 925, round.groups.length, round.groups.length === 2 ? 560 : 440);
  round.groups.forEach((group, index) => {
    const label = group.map((piece) => ctx.t(pieceName(piece))).join(", ");
    const token = h("button", { class: "token group-token", type: "button", "aria-label": label }, ...group.map((piece) => pieceSvg(piece, 84)));
    layer.append(token);
    board.add(token, homes[index]!);
  });

  return {
    layer,
    mode: "check",
    hint: { es: "Revisa cada pieza del grupo: todas deben estar en el conjunto.", en: "Check every piece of the group: all of them must be in the set." },
    evaluate: () => (board.selected.length === 0 ? null : board.selected[0] === answer[0]),
    onWrong: () => board.reject(board.selected),
    reveal: () => {
      board.select(answer);
      board.highlight(answer);
    },
    reset: () => board.reset()
  };
}
