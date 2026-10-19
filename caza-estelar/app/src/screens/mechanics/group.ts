import type { SetGroupConfig } from "../../content/model";
import { groupAnswer, groupCount, groupingMistakes, isValidGrouping } from "../../gameplay/sets";
import { h, svg } from "../../ui/dom";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { inside, pieceToken, rowSlots, slotsIn, SortBoard, type Zone } from "./board";
import type { MechanicContext, RoundView } from "./types";

/** Aros vacíos abajo de la mesa, uno por grupo, cada uno de un tono. */
const RING_COLORS = ["#FFD84A", "#5BE6FF", "#E1A0F1"];
const PIECE = 140;

function ringsFor(count: number): Zone[] {
  return count === 2
    ? [{ cx: 700, cy: 740, rx: 250, ry: 140 }, { cx: 1220, cy: 740, rx: 250, ry: 140 }]
    : [{ cx: 540, cy: 740, rx: 195, ry: 130 }, { cx: 960, cy: 740, rx: 195, ry: 130 }, { cx: 1380, cy: 740, rx: 195, ry: 130 }];
}

/** Lugar de origen de las piezas: una o dos filas arriba de los aros. */
function homesFor(count: number) {
  if (count <= 5) return rowSlots(960, 400, count, 190);
  const top = Math.ceil(count / 2);
  return [...rowSlots(960, 330, top, 190), ...rowSlots(960, 475, count - top, 190)];
}

/**
 * FORMAR CONJUNTOS: repartir todas las piezas en los aros de modo que cada grupo comparta una
 * característica. Se acepta juntarlas por forma o por color (`isValidGrouping`).
 */
export function groupRound(round: SetGroupConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const count = groupCount(round.pieces, round.by);
  const rings = ringsFor(count);
  const decor = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  rings.forEach((ring, i) =>
    decor.append(
      svg("ellipse", { cx: ring.cx, cy: ring.cy, rx: ring.rx, ry: ring.ry, fill: "#0B2A8C", "fill-opacity": 0.85, stroke: RING_COLORS[i]!, "stroke-width": 9 }),
      svg("ellipse", { cx: ring.cx, cy: ring.cy, rx: ring.rx - 34, ry: ring.ry - 22, fill: "none", stroke: RING_COLORS[i]!, "stroke-opacity": 0.5, "stroke-width": 4, "stroke-dasharray": "14 12" })
    )
  );
  const layer = h("div", { class: "board" }, holoTable(960, 600, 680, 300), decor);
  const board = new SortBoard(ctx.stage, layer, {
    regionAt: (point) => rings.findIndex((ring) => inside(ring, point)),
    slots: (region, n) => slotsIn({ ...rings[region]!, rx: rings[region]!.rx - 50 }, n, 112),
    zoneScale: 0.82,
    enabled: ctx.enabled
  });
  const homes = homesFor(round.pieces.length);
  round.pieces.forEach((piece, index) => {
    const token = pieceToken(piece, PIECE, ctx.t);
    layer.append(token);
    board.add(token, homes[index]!);
  });
  const answer = groupAnswer(round.pieces, round.by);
  const placed = () => board.regions.filter((it) => it >= 0).length;

  return {
    layer,
    mode: "check",
    prompt: { es: `Forma ${count} conjuntos con las piezas que se parecen`, en: `Make ${count} sets with the pieces that look alike` },
    incomplete: { es: "Pon todas las piezas en los aros", en: "Put every piece in a ring" },
    hint:
      round.by === "shape"
        ? { es: `Junta las piezas que tienen la misma forma. Salen ${count} conjuntos.`, en: `Put together the pieces with the same shape. You get ${count} sets.` }
        : { es: `Junta las piezas que tienen el mismo color. Salen ${count} conjuntos.`, en: `Put together the pieces with the same color. You get ${count} sets.` },
    evaluate: () => (placed() < round.pieces.length ? null : isValidGrouping(round.pieces, board.groups(count))),
    onWrong: () => board.reject(groupingMistakes(round.pieces, board.groups(count))),
    reveal: () => {
      const regions: number[] = [];
      answer.forEach((group, ring) => group.forEach((index) => (regions[index] = ring)));
      board.place(regions);
      board.highlight(round.pieces.map((_, i) => i));
    },
    reset: () => board.reset()
  };
}
