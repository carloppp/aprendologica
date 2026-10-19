import type { Piece } from "../../content/model";
import { contains, kindOf, operationResult, sameElements } from "../../gameplay/sets";
import { h, svg } from "../../ui/dom";
import { holoTable } from "../../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import { tapOrDrag } from "../../ui/pointer";
import { inside, pieceToken, placeAt, rowSlots, slotsIn, type Zone } from "./board";
import type { MechanicContext, RoundView } from "./types";
import { A_COLOR, B_COLOR, setLabel } from "./venn";

const A: Zone = { cx: 650, cy: 420, rx: 230, ry: 110 };
const B: Zone = { cx: 1270, cy: 420, rx: 230, ry: 110 };
const UNION: Zone = { cx: 960, cy: 745, rx: 340, ry: 150 };
const PIECE = 116;

/**
 * UNIÓN (y UNIÓN E INTERSECCIÓN): copiar en A ∪ B cada elemento de A y de B, o en A ∩ B solo los
 * que están en los dos. Un elemento que ya está no se repite: la ficha rebota en lugar de duplicarse.
 */
export function unionRound(round: { a: Piece[]; b: Piece[] }, ctx: MechanicContext, op: "union" | "intersection" = "union"): RoundView {
  const expected = operationResult(op, round.a, round.b);
  const symbol = op === "union" ? "A ∪ B" : "A ∩ B";
  const decor = svg("svg", { class: "board-decor", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  decor.append(
    oval(A, "#0B2A8C", A_COLOR),
    oval(B, "#2A1A8C", B_COLOR),
    oval(UNION, "#14206A", "#FFD84A"),
    arrow("M700,545 Q740,610 790,640", A_COLOR),
    arrow("M1220,545 Q1180,610 1130,640", B_COLOR)
  );
  const layer = h(
    "div",
    { class: "board" },
    holoTable(960, 640, 620, 280),
    decor,
    setLabel("A", A.cx, A.cy - A.ry - 6, A_COLOR),
    setLabel("B", B.cx, B.cy - B.ry - 6, B_COLOR),
    setLabel(symbol, UNION.cx, UNION.cy - UNION.ry - 6, "#FFD84A")
  );

  const placed: { piece: Piece; element: HTMLElement }[] = [];
  const layoutUnion = () => {
    const slots = slotsIn({ ...UNION, rx: UNION.rx - 60 }, placed.length, 124);
    placed.forEach((entry, index) => placeAt(entry.element, slots[index]!, 0.9));
  };
  const remove = (entry: { piece: Piece; element: HTMLElement }) => {
    const index = placed.indexOf(entry);
    if (index < 0) return;
    placed.splice(index, 1);
    entry.element.remove();
    layoutUnion();
  };
  const copyIntoUnion = (piece: Piece, from: { x: number; y: number }) => {
    const existing = placed.find((entry) => kindOf(entry.piece) === kindOf(piece));
    if (existing) {
      bounce(existing.element);
      return;
    }
    const element = pieceToken(piece, PIECE, ctx.t);
    element.classList.add("is-placed");
    const entry = { piece, element };
    tapOrDrag(element, ctx.stage, {
      enabled: ctx.enabled,
      onTap: () => remove(entry),
      onDrop: (point) => {
        if (!inside(UNION, point)) remove(entry);
        return true;
      }
    });
    placeAt(element, from);
    layer.append(element);
    placed.push(entry);
    requestAnimationFrame(() => requestAnimationFrame(layoutUnion));
  };

  const addSource = (set: Piece[], zone: Zone) => {
    const homes = rowSlots(zone.cx, zone.cy, set.length, 134);
    set.forEach((piece, index) => {
      const token = pieceToken(piece, PIECE, ctx.t);
      placeAt(token, homes[index]!);
      tapOrDrag(token, ctx.stage, {
        enabled: ctx.enabled,
        onTap: () => copyIntoUnion(piece, homes[index]!),
        onDrop: (point) => {
          if (inside(UNION, point)) copyIntoUnion(piece, point);
          return true;
        }
      });
      layer.append(token);
    });
  };
  addSource(round.a, A);
  addSource(round.b, B);

  const clear = () => [...placed].forEach(remove);
  return {
    layer,
    mode: "check",
    prompt:
      op === "union"
        ? { es: "Reúne A y B en A ∪ B", en: "Put A and B together in A ∪ B" }
        : { es: "Pon en A ∩ B lo que está en A y también en B", en: "Put in A ∩ B what is in A and also in B" },
    hint:
      op === "union"
        ? { es: `Pon cada pieza de A y de B una sola vez. Son ${expected.length} en total.`, en: `Put each piece from A and B only once. There are ${expected.length} in all.` }
        : { es: `Busca las piezas que se repiten en A y en B. Son ${expected.length}.`, en: `Find the pieces that are in both A and B. There are ${expected.length}.` },
    evaluate: () => (placed.length === 0 ? null : sameElements(placed.map((it) => it.piece), expected)),
    onWrong: () => {
      // Lo que no va se sacude y sale; si todo lo puesto va, falta algo y rebota todo.
      const wrong = placed.filter((entry) => !contains(expected, entry.piece));
      (wrong.length > 0 ? wrong : placed).forEach((entry) => bounce(entry.element));
      if (wrong.length > 0) window.setTimeout(() => wrong.forEach(remove), 450);
    },
    reveal: () => {
      clear();
      expected.forEach((piece) => copyIntoUnion(piece, { x: UNION.cx, y: UNION.cy }));
      placed.forEach((entry) => entry.element.classList.add("is-answer"));
    },
    reset: clear
  };
}

function oval(zone: Zone, fill: string, stroke: string) {
  return svg("ellipse", { cx: zone.cx, cy: zone.cy, rx: zone.rx, ry: zone.ry, fill, stroke, "stroke-width": 10 });
}

function arrow(d: string, color: string) {
  return svg("path", { d, fill: "none", stroke: color, "stroke-width": 7, "stroke-dasharray": "14 12", "stroke-linecap": "round" });
}

function bounce(element: HTMLElement) {
  element.classList.remove("is-shaking");
  void element.offsetWidth;
  element.classList.add("is-shaking");
}
