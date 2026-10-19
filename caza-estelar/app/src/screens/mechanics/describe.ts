import type { SetDescribeConfig } from "../../content/model";
import { describeAnswer } from "../../gameplay/sets";
import { h, svg } from "../../ui/dom";
import { describeName } from "../../ui/pieces";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { slotsIn, staticPiece, type Zone } from "./board";
import { optionCards } from "./options";
import type { MechanicContext, RoundView } from "./types";
import { A_COLOR, propertyIcon, setLabel } from "./venn";

const SET: Zone = { cx: 960, cy: 430, rx: 400, ry: 175 };

/**
 * DESCRIBE EL CONJUNTO: elegir la descripción por comprensión, A = { estrellas }, que cumplen
 * todos los elementos del diagrama. Las otras la cumplen solo algunos.
 */
export function describeRound(round: SetDescribeConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const answer = describeAnswer(round.set, round.options)[0] ?? -1;
  const decor = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  decor.append(svg("ellipse", { cx: SET.cx, cy: SET.cy, rx: SET.rx, ry: SET.ry, fill: "#0B2A8C", stroke: A_COLOR, "stroke-width": 12 }));
  const cards = optionCards(
    ctx,
    round.options.map((option) => {
      const name = ctx.t(describeName(option));
      return {
        label: `A = { ${name} }`,
        // Compacta: arriba A = { dibujo } y debajo el nombre, para caber entre Stella y Luma.
        content: [
          h(
            "span",
            { class: "option-head" },
            h("span", { class: "option-braces" }, "A = {"),
            h("span", { class: "option-icon" }, propertyIcon(option, 58)),
            h("span", { class: "option-braces" }, "}")
          ),
          h("span", { class: "option-text" }, name)
        ]
      };
    }),
    830,
    true
  );
  const layer = h("div", { class: "board" }, holoTable(960, 600, 680, 300), decor, setLabel("A", 560, 272, A_COLOR), cards.element);
  const slots = slotsIn({ ...SET, rx: SET.rx - 70, ry: SET.ry - 35 }, round.set.length, 120);
  round.set.forEach((piece, i) => layer.append(staticPiece(piece, 104, slots[i]!, ctx.t)));

  return {
    layer,
    // Al tocar una descripción se revisa sola.
    mode: "auto",
    incomplete: { es: "Primero elige una descripción", en: "First pick a description" },
    hint: {
      es: "¿Qué tienen en común todos los elementos de A: la forma, el color o los dos? Revisa cada uno.",
      en: "What do all the elements of A have in common: the shape, the color or both? Check each one."
    },
    evaluate: () => (cards.chosen() < 0 ? null : cards.chosen() === answer),
    onWrong: () => cards.reject(),
    reveal: () => cards.reveal(answer),
    reset: () => cards.reset()
  };
}
