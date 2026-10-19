import type { Piece, SetBracesConfig } from "../../content/model";
import { trayPieces } from "../../gameplay/patterns";
import { contains, elementsOf, kindOf, sameElements } from "../../gameplay/sets";
import { sound } from "../../audio/sound";
import { h, svg } from "../../ui/dom";
import { pieceName, pieceSvg } from "../../ui/pieces";
import { tapOrDrag } from "../../ui/pointer";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { pieceToken, placeAt, rowSlots, slotsIn, staticPiece, type Zone } from "./board";
import { AUTO_CHECK_MS } from "./options";
import type { MechanicContext, RoundView } from "./types";
import { A_COLOR, setLabel } from "./venn";

const SET: Zone = { cx: 960, cy: 410, rx: 400, ry: 165 };
/** Renglón donde se escribe A = { … }. */
const BRACES_Y = 670;
const TRAY_Y = 890;

/**
 * ENTRE LLAVES: escribir el conjunto del diagrama por extensión, A = { … }. Las piezas de la
 * bandeja se tocan (o arrastran al renglón) para escribirlas; cada elemento va una sola vez,
 * aunque en el diagrama se vea repetido, y tocar uno escrito lo borra.
 */
export function bracesRound(round: SetBracesConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const expected = elementsOf(round.set);
  const decor = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  decor.append(svg("ellipse", { cx: SET.cx, cy: SET.cy, rx: SET.rx, ry: SET.ry, fill: "#0B2A8C", stroke: A_COLOR, "stroke-width": 12 }));
  const items = h("span", { class: "braces-items" });
  const line = h(
    "div",
    { class: "braces-line", style: `left:960px;top:${BRACES_Y}px`, role: "group", "aria-label": ctx.t({ es: "Conjunto A entre llaves", en: "Set A in braces" }) },
    h("span", { class: "braces-name" }, "A ="),
    h("span", { class: "braces-glyph" }, "{"),
    items,
    h("span", { class: "braces-glyph" }, "}")
  );
  const layer = h("div", { class: "board" }, holoTable(960, 600, 680, 300), decor, setLabel("A", 560, 262, A_COLOR), line);
  const slots = slotsIn({ ...SET, rx: SET.rx - 70, ry: SET.ry - 30 }, round.set.length, 118);
  round.set.forEach((piece, i) => layer.append(staticPiece(piece, 100, slots[i]!, ctx.t)));

  const written: { piece: Piece; element: HTMLElement }[] = [];
  const render = () => {
    items.replaceChildren(...written.flatMap((entry, i) => (i === 0 ? [entry.element] : [h("span", { class: "braces-comma" }, ","), entry.element])));
  };
  const shake = (element: HTMLElement) => {
    element.classList.remove("is-shaking");
    void element.offsetWidth;
    element.classList.add("is-shaking");
  };
  const erase = (entry: { piece: Piece; element: HTMLElement }) => {
    const index = written.indexOf(entry);
    if (index < 0) return;
    written.splice(index, 1);
    render();
  };
  /** Escribe la pieza entre las llaves; si ya está, la que está se sacude y no se repite. */
  const write = (piece: Piece) => {
    const existing = written.find((entry) => kindOf(entry.piece) === kindOf(piece));
    if (existing) {
      shake(existing.element);
      return false;
    }
    const entry = { piece, element: h("button", { class: "braces-item", type: "button", "aria-label": ctx.t(pieceName(piece)) }, pieceSvg(piece, 84)) };
    entry.element.addEventListener("click", () => {
      if (!ctx.enabled()) return;
      sound.play("tap");
      erase(entry);
    });
    written.push(entry);
    render();
    // Con tantos elementos como tiene el conjunto, se revisa sola.
    if (written.length === expected.length) {
      window.setTimeout(() => ctx.enabled() && written.length === expected.length && ctx.submit(), AUTO_CHECK_MS);
    }
    return true;
  };

  // Orden fijo por forma y color, para que la posición en la bandeja no delate la respuesta.
  const tray = trayPieces([...expected, ...round.extra]);
  const homes = rowSlots(960, TRAY_Y, tray.length, 170);
  tray.forEach((piece, i) => {
    const token = pieceToken(piece, 110, ctx.t);
    placeAt(token, homes[i]!);
    tapOrDrag(token, ctx.stage, {
      enabled: ctx.enabled,
      onTap: () => void write(piece),
      onDrop: (point) => Math.abs(point.y - BRACES_Y) < 110 && write(piece)
    });
    layer.append(token);
  });

  return {
    layer,
    mode: "auto",
    incomplete: { es: "Primero escribe elementos entre las llaves", en: "First write some elements in the braces" },
    hint: {
      es: `Escribe cada elemento de A una sola vez, aunque se vea repetido. Son ${expected.length}.`,
      en: `Write each element of A only once, even if you see it twice. There are ${expected.length}.`
    },
    evaluate: () => (written.length === 0 ? null : sameElements(written.map((it) => it.piece), expected)),
    onWrong: () => {
      const wrong = written.filter((entry) => !contains(expected, entry.piece));
      wrong.forEach((entry) => shake(entry.element));
      window.setTimeout(() => wrong.forEach(erase), 450);
    },
    reveal: () => {
      written.splice(0);
      expected.forEach(write);
      written.forEach((entry) => entry.element.classList.add("is-answer"));
    },
    reset: () => {
      written.splice(0);
      render();
    }
  };
}
