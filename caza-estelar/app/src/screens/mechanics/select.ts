import type { SetSelectConfig } from "../../content/model";
import { sameIndices, selectAnswer } from "../../gameplay/sets";
import { h, svg } from "../../ui/dom";
import { filterName } from "../../ui/pieces";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { pieceToken, ringSlots, SelectionBoard, type Zone } from "./board";
import type { MechanicContext, RoundView } from "./types";

const TABLE: Zone = { cx: 960, cy: 620, rx: 580, ry: 265 };
const TARGET: Zone = { cx: 960, cy: 620, rx: 240, ry: 108 };
const PIECE = 136;

/** ELEMENTOS: llevar al anillo central las piezas que cumplen la consigna. */
export function selectRound(round: SetSelectConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const answer = selectAnswer(round.pieces, round.target);
  const decor = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  decor.append(
    svg("ellipse", { cx: TARGET.cx, cy: TARGET.cy, rx: TARGET.rx, ry: TARGET.ry, fill: "#0B2A8C", stroke: "#5BE6FF", "stroke-width": 9 }),
    svg("ellipse", { cx: TARGET.cx, cy: TARGET.cy, rx: TARGET.rx - 50, ry: TARGET.ry - 24, fill: "none", stroke: "#7FDDFF", "stroke-width": 4, "stroke-dasharray": "14 12" })
  );
  const layer = h("div", { class: "board" }, holoTable(TABLE.cx, TABLE.cy, TABLE.rx, TABLE.ry), decor);
  const board = new SelectionBoard(ctx.stage, TARGET, { spacing: 104, zoneScale: 0.8, enabled: ctx.enabled });
  const homes = ringSlots({ ...TABLE, rx: 440, ry: 190 }, round.pieces.length);
  round.pieces.forEach((piece, index) => {
    const token = pieceToken(piece, PIECE, ctx.t);
    layer.append(token);
    board.add(token, homes[index]!);
  });

  return {
    layer,
    mode: "check",
    prompt: round.prompt,
    hint: (() => {
      const name = filterName(round.target);
      return { es: `Busca ${name.es}: son ${answer.length} piezas. Llévalas al centro.`, en: `Find the ${name.en}: there are ${answer.length}. Move them to the center.` };
    })(),
    evaluate: () => (board.selected.length === 0 ? null : sameIndices(board.selected, answer)),
    onWrong: () => board.reject(board.selected.filter((index) => !answer.includes(index))),
    reveal: () => {
      board.select(answer);
      board.highlight(answer);
    },
    reset: () => board.reset()
  };
}
