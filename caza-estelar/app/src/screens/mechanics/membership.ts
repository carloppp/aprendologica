import type { SetMembershipConfig } from "../../content/model";
import { contains } from "../../gameplay/sets";
import { h, svg } from "../../ui/dom";
import { icon } from "../../ui/icons";
import { pieceSvg } from "../../ui/pieces";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { slotsIn, staticPiece, type Zone } from "./board";
import type { MechanicContext, RoundView } from "./types";

const SET: Zone = { cx: 960, cy: 650, rx: 300, ry: 125 };

/** PERTENENCIA: decidir con sí o no si la pieza de la tarjeta está en el conjunto. */
export function membershipRound(round: SetMembershipConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const belongs = contains(round.set, round.candidate);
  const decor = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  decor.append(
    svg("ellipse", { cx: SET.cx, cy: SET.cy, rx: SET.rx, ry: SET.ry, fill: "#0B2A8C", stroke: "#FFD84A", "stroke-width": 9 }),
    svg("path", { d: "M960,440 L960,505", stroke: "#fff", "stroke-width": 8, "stroke-dasharray": "12 10", "stroke-linecap": "round" }),
    svg("path", { d: "M940,500 L960,524 L980,500", fill: "none", stroke: "#fff", "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" })
  );
  const layer = h("div", { class: "board" }, holoTable(960, 650, 560, 240), decor);
  const slots = slotsIn({ ...SET, rx: SET.rx - 40 }, round.set.length, 120);
  round.set.forEach((piece, index) => layer.append(staticPiece(piece, 104, slots[index]!, ctx.t)));
  const card = h("div", { class: "candidate-card" }, pieceSvg(round.candidate, 150));
  layer.append(card);

  return {
    layer,
    mode: "yesno",
    hint: { es: "¿Ves una pieza igual dentro del conjunto? Mira la forma y el color.", en: "Do you see the same piece inside the set? Check the shape and the color." },
    evaluate: (choice) => (choice === undefined ? null : choice === belongs),
    onWrong: () => {
      card.classList.remove("is-shaking");
      void card.offsetWidth;
      card.classList.add("is-shaking");
    },
    reveal: () => card.append(h("span", { class: `card-badge ${belongs ? "is-yes" : "is-no"}` }, icon(belongs ? "check" : "cross", 60))),
    reset: () => undefined
  };
}
