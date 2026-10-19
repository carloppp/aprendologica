import type {
  LocalizedText,
  PatternCopyConfig,
  PatternCreateConfig,
  PatternFillConfig,
  PatternSpotConfig,
  PatternUnitConfig,
  Piece
} from "../../content/model";
import { expandPattern, isRepeatedPattern, spotPaths, trayPieces, unitOptions } from "../../gameplay/patterns";
import { kindOf } from "../../gameplay/sets";
import { sound } from "../../audio/sound";
import { setPose } from "../../ui/characters";
import { h, svg } from "../../ui/dom";
import { pieceName } from "../../ui/pieces";
import { tapOrDrag, type StagePoint } from "../../ui/pointer";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../ui/stage";
import type { MechanicContext, RoundView } from "./types";

/**
 * Puente de PATRONES (guía 2D `niveles/patrones-puente-nivel-v1`): baldosas pegadas una tras otra
 * desde los pies de Stella hacia el portal de la isla. Las baldosas con hueco se llenan con las piezas de
 * la bandeja (tocar o arrastrar); al acertar, Stella cruza el puente y entra al portal.
 */

/**
 * Baldosas de `assets/patterns/tile-*.webp`, tal como vienen en la guía 2D
 * (`assets/patrones-recuadros-uniformes-v2`): estrella amarilla, círculo celeste, rombo morado y el
 * hueco punteado. Miden 320 × 264 y tienen la cara superior centrada en (156, 108).
 */
const TILE_IMAGE = { w: 320, h: 264, faceX: 156, faceY: 108 };
/**
 * El puente avanza exactamente por el borde de la cara de cada baldosa, (182, -86) en la imagen,
 * así quedan pegadas en línea recta. Ese borde sube más empinado que el camino hasta el portal, por
 * eso todas se giran lo mismo (`TILT`) para que el puente quede derecho hacia la isla.
 */
const EDGE = { x: 182, y: -86 };
const TILT_DEGREES = 7.8;
const TILT = (TILT_DEGREES * Math.PI) / 180;
const STEP = {
  x: EDGE.x * Math.cos(TILT) - EDGE.y * Math.sin(TILT),
  y: EDGE.x * Math.sin(TILT) + EDGE.y * Math.cos(TILT)
};

interface Tile {
  /** Centro de la cara superior, en el escenario. */
  c: StagePoint;
  /** Escala de la imagen de la baldosa. */
  scale: number;
}

/** Fila recta de baldosas pegadas que empieza en `start`. */
interface Strip {
  start: StagePoint;
  scale: number;
}

/** Donde espera Stella: sobre la baldosa lisa de salida, la primera del puente. */
const STELLA_FEET: StagePoint = { x: 300, y: 845 };
const BRIDGE_START = STELLA_FEET;
/** Portal de la isla del fondo, donde termina el recorrido de Stella. */
const PORTAL: StagePoint = { x: 1752, y: 382 };
/** Las baldosas crecen hasta este tamaño en puentes cortos y se achican para que los largos lleguen a la isla. */
const MAX_SCALE = 0.78;
const BRIDGE_END: StagePoint = { x: 1650, y: 420 };
/** Bandeja bajo el tramo alto del puente, para no tapar las primeras baldosas. */
const TRAY_X = 960;
// Sin botones de comprobar, la bandeja baja para dejar más espacio al puente.
const TRAY_Y = 945;
/** Stella está detrás de Luma, así que se ve un poco más pequeña (igual en CSS: `.is-bridge .character-stella`). */
const STELLA_SCALE = 0.9;
/** Espera antes de revisar solo el puente completo, para que se vea el saltito de la última pieza. */
const AUTO_CHECK_MS = 450;
/** Vuelo de una pieza de la bandeja a su baldosa al tocarla. */
const FLY_MS = 480;
const FLY_WIDTH = 140;

/** Separación ligera entre baldosas: cada una avanza un poco más que el borde de su cara. */
const GAP = 1.1;

function stripTiles(strip: Strip, count: number): Tile[] {
  return Array.from({ length: count }, (_, i) => ({
    c: { x: strip.start.x + STEP.x * GAP * strip.scale * i, y: strip.start.y + STEP.y * GAP * strip.scale * i },
    scale: strip.scale
  }));
}

/** Cuánto se achica la última baldosa respecto de la primera (perspectiva hacia la isla). */
const SHRINK = 0.45;

/**
 * Puente principal en perspectiva: la baldosa lisa de salida bajo Stella, las `count` baldosas del
 * patrón y después baldosas lisas hasta la isla del portal. Cada baldosa es un poco más pequeña que la anterior, como si estuviera
 * más lejos, y avanza lo que miden las dos juntas para que sigan pegadas. El tamaño de la primera se
 * ajusta para que el patrón quepa entero antes de llegar a la isla.
 */
function bridgeTiles(patternCount: number): { start: Tile; pattern: Tile[]; filler: Tile[] } {
  const count = patternCount + 1;
  const dx = BRIDGE_END.x - BRIDGE_START.x;
  const dy = BRIDGE_END.y - BRIDGE_START.y;
  const reach = Math.hypot(dx, dy);
  const stepLength = Math.hypot(STEP.x, STEP.y);
  const along = (front: number) => {
    const scaleAt = (p: number) => front * (1 - SHRINK * Math.min(1, p / reach));
    const tiles: { p: number; scale: number }[] = [{ p: 0, scale: front }];
    for (;;) {
      const last = tiles[tiles.length - 1]!;
      const next = last.p + stepLength * GAP * scaleAt(last.p + (stepLength * last.scale) / 2);
      if (next > reach && tiles.length >= count) break;
      tiles.push({ p: next, scale: scaleAt(next) });
      if (tiles.length > 40) break;
    }
    return tiles;
  };
  // La primera baldosa más grande con la que el patrón entero queda antes de la isla.
  let front = MAX_SCALE;
  while (front > 0.3 && along(front)[count - 1]!.p > reach) front -= 0.01;
  const tiles = along(front).map(({ p, scale }) => ({ c: { x: BRIDGE_START.x + (dx * p) / reach, y: BRIDGE_START.y + (dy * p) / reach }, scale }));
  return { start: tiles[0]!, pattern: tiles.slice(1, count), filler: tiles.slice(count) };
}

function tileSource(piece: Piece | null | "base"): string {
  const name = piece === "base" ? "tile-base" : piece ? `tile-${piece.shape}-${piece.color}` : "tile-hole";
  return `assets/patterns/${name}.webp`;
}

/** Baldosa del puente, apoyada con su cara superior en `tile.c`; `"base"` es la baldosa lisa del final. */
function tileArt(tile: Tile, piece: Piece | null | "base"): SVGGElement {
  const { c, scale } = tile;
  const g = svg("g", { class: `bridge-tile is-${piece === "base" ? "base" : piece ? "piece" : "hole"}` });
  g.append(
    svg("image", {
      href: tileSource(piece),
      x: (c.x - TILE_IMAGE.faceX * scale).toFixed(1),
      y: (c.y - TILE_IMAGE.faceY * scale).toFixed(1),
      width: (TILE_IMAGE.w * scale).toFixed(1),
      height: (TILE_IMAGE.h * scale).toFixed(1),
      transform: `rotate(${TILT_DEGREES} ${c.x.toFixed(1)} ${c.y.toFixed(1)})`
    })
  );
  return g;
}

/** Baldosa de la bandeja o del modelo: la misma imagen del puente. */
function flatTile(piece: Piece, width: number): HTMLImageElement {
  return h("img", { class: "piece-art", src: tileSource(piece), width, height: Math.round((width * TILE_IMAGE.h) / TILE_IMAGE.w), alt: "", draggable: "false" });
}

/** Cartel con el modelo o el patrón indicado, arriba en el centro. */
function modelSign(pieces: readonly Piece[], title: LocalizedText, t: (text: LocalizedText) => string): HTMLElement {
  return h(
    "div",
    { class: "bridge-model", role: "img", "aria-label": `${t(title)}: ${pieces.map((it) => t(pieceName(it))).join(", ")}` },
    h("span", { class: "bridge-model-title" }, t(title)),
    h("div", { class: "bridge-model-row" }, ...pieces.map((piece) => flatTile(piece, 96)))
  );
}

/** Anima a Stella sobre los centros de las baldosas hasta el portal, donde se queda a celebrar. */
const walks = new WeakMap<HTMLElement, Animation[]>();

/** Tiempo de cada paso de Stella sobre el puente. */
const WALK_STEP_MS = 230;

function walkAcross(stella: HTMLElement, tiles: readonly Tile[], scaleOf: (tile: Tile) => number = () => 1): number {
  resetWalker(stella);
  const from = tiles[0]!.c;
  const step = WALK_STEP_MS;
  const points = [...tiles.map((tile) => ({ at: tile.c, scale: scaleOf(tile) })), { at: PORTAL, scale: 0.5 }];
  const duration = step * (points.length - 1);
  const keyframes = points.map((point, i) => ({
    translate: `${(point.at.x - from.x).toFixed(0)}px ${(point.at.y - from.y).toFixed(0)}px`,
    scale: String((STELLA_SCALE * point.scale).toFixed(3)),
    offset: i / (points.length - 1)
  }));
  const move = stella.animate(keyframes, { duration, easing: "linear", fill: "forwards" });
  walks.set(stella, [move]);
  for (let i = 0; i < points.length - 1; i++) {
    window.setTimeout(() => {
      if (!stella.isConnected || walks.get(stella)?.[0] !== move) return;
      setPose(stella, i % 2 === 0 ? "step-left" : "step-right");
      sound.bridgeStep(i);
    }, i * step);
  }
  // Llega al portal y se queda ahí; la pantalla del nivel hace saltar a los dos personajes.
  return duration;
}

/** Devuelve a Stella a la entrada del puente (al empezar cada ronda). */
export function resetWalker(stella: HTMLElement): void {
  walks.get(stella)?.forEach((animation) => animation.cancel());
  walks.delete(stella);
}

/**
 * Puente editable: baldosas fijas y huecos que se llenan desde la bandeja. Lo usan REPETIR,
 * ALTERNAR, CONTINUAR, COMPLETAR y CREAR.
 */
function fillBridge(
  ctx: MechanicContext,
  layer: HTMLElement,
  given: readonly (Piece | null)[],
  tray: readonly Piece[],
  labels?: readonly string[]
) {
  // Stella sobre la baldosa lisa de salida, luego el patrón y, detrás, baldosas lisas hasta la isla.
  const { start, pattern: tiles, filler } = bridgeTiles(given.length);
  const art = svg("svg", { class: "bridge-art", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  // De atrás hacia adelante, para que las baldosas cercanas tapen a las lejanas.
  [...filler].reverse().forEach((tile) => art.append(tileArt(tile, "base")));
  const groups: SVGGElement[] = tiles.map(() => svg("g"));
  [...groups].reverse().forEach((g) => art.append(g));
  art.append(tileArt(start, "base"));
  layer.append(art);

  const values: (Piece | null)[] = [...given];
  const editable = given.map((it) => it === null);
  const slots: HTMLButtonElement[] = [];
  const draw = (i: number, placed = false) => {
    const piece = values[i];
    const art = tileArt(tiles[i]!, piece ?? null);
    // La baldosa que se acaba de colocar da un saltito.
    if (placed && piece) art.classList.add("is-popping");
    groups[i]!.replaceChildren(art);
    const slot = slots[i];
    if (slot) {
      slot.setAttribute("aria-label", `${ctx.t({ es: `Baldosa ${i + 1}`, en: `Tile ${i + 1}` })}: ${piece ? ctx.t(pieceName(piece)) : ctx.t({ es: "vacía", en: "empty" })}`);
      slot.classList.toggle("is-filled", !!piece);
    }
  };
  values.forEach((_, i) => {
    if (editable[i]) {
      const tile = tiles[i]!;
      const slot = h("button", {
        class: "bridge-slot",
        type: "button",
        style: `left:${tile.c.x}px;top:${tile.c.y}px;width:${(TILE_IMAGE.w * tile.scale * 0.62).toFixed(0)}px;height:${(TILE_IMAGE.h * tile.scale * 0.5).toFixed(0)}px`,
        onclick: () => {
          if (!ctx.enabled() || values[i] === null) return;
          sound.play("tileRemove");
          values[i] = null;
          draw(i);
        }
      }, labels?.[i] ? h("span", { class: "bridge-slot-label" }, labels[i]!) : null);
      slots[i] = slot;
      layer.append(slot);
    }
    draw(i);
  });

  const firstEmpty = () => values.findIndex((it, i) => editable[i] && it === null);
  // Cuando el puente queda completo se revisa solo, sin botón.
  let checkTimer = 0;
  let flying = 0;
  const land = (target: number, piece: Piece) => {
    // Si mientras volaba se quitó o cambió la pieza de ese hueco, no se dibuja.
    if (values[target] === piece) {
      draw(target, true);
      sound.play("tileLand");
    }
    window.clearTimeout(checkTimer);
    if (flying === 0 && values.every((it) => it !== null)) {
      checkTimer = window.setTimeout(() => ctx.enabled() && flying === 0 && values.every((it) => it !== null) && ctx.submit(), AUTO_CHECK_MS);
    }
  };
  /**
   * Coloca una pieza en un hueco. Al tocarla en la bandeja (`from`), una copia vuela en arco hasta
   * su baldosa: crece al tamaño de la baldosa, se inclina como el puente y aterriza con un saltito.
   */
  const place = (target: number, piece: Piece, from?: StagePoint) => {
    values[target] = piece;
    if (!from) return land(target, piece);
    const tile = tiles[target]!;
    const flyer = h("div", { class: "bridge-flyer", style: `left:${from.x}px;top:${from.y}px` }, flatTile(piece, FLY_WIDTH));
    layer.append(flyer);
    sound.play("tileFly");
    flying++;
    const dx = tile.c.x - from.x;
    const dy = tile.c.y - from.y;
    const end = (TILE_IMAGE.w * tile.scale) / FLY_WIDTH;
    const arc = Math.min(dy, 0) - 140;
    flyer
      .animate(
        [
          { transform: "translate(-50%, -50%) translate(0px, 0px) scale(1) rotate(0deg)" },
          { transform: `translate(-50%, -50%) translate(${dx * 0.5}px, ${arc}px) scale(${(1 + end) / 2 + 0.15}) rotate(${TILT_DEGREES / 2}deg)`, offset: 0.5 },
          { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${end}) rotate(${TILT_DEGREES}deg)` }
        ],
        { duration: FLY_MS, easing: "cubic-bezier(0.45, 0, 0.35, 1)" }
      )
      .finished.catch(() => undefined)
      .then(() => {
        flyer.remove();
        flying--;
        land(target, piece);
      });
  };
  const nearestSlot = (point: StagePoint) => {
    let best = -1;
    let bestDistance = Infinity;
    values.forEach((_, i) => {
      if (!editable[i]) return;
      const tile = tiles[i]!;
      const distance = Math.hypot(point.x - tile.c.x, point.y - tile.c.y);
      if (distance < TILE_IMAGE.w * tile.scale * 0.5 && distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    return best;
  };

  // Bandeja: cada pieza se puede usar las veces que haga falta (sin piezas, no hay bandeja).
  const trayHost = h("div", { class: "bridge-tray", style: `--count:${tray.length}` });
  tray.forEach((piece, i) => {
    const button = h("button", { class: "token bridge-tray-tile", type: "button", "aria-label": ctx.t(pieceName(piece)) }, flatTile(piece, 140));
    const x = TRAY_X + (i - (tray.length - 1) / 2) * 150;
    button.style.left = `${x}px`;
    button.style.top = `${TRAY_Y}px`;
    tapOrDrag(button, ctx.stage, {
      enabled: ctx.enabled,
      onTap: () => {
        const target = firstEmpty();
        if (target >= 0) place(target, piece, { x, y: TRAY_Y });
      },
      onDrop: (point) => {
        const target = nearestSlot(point);
        if (target < 0) return false;
        place(target, piece);
        return true;
      }
    });
    trayHost.append(button);
  });
  if (tray.length > 0) layer.append(h("div", { class: "bridge-tray-back", style: `left:${TRAY_X}px;top:${TRAY_Y}px;width:${tray.length * 150 + 36}px` }), trayHost);

  return {
    tiles,
    values: () => values,
    complete: () => values.every((it) => it !== null),
    empty: () => values.every((it, i) => !editable[i] || it === null),
    set: (i: number, piece: Piece | null) => {
      values[i] = piece;
      draw(i);
    },
    /** Saca del puente las piezas de estos huecos, con una sacudida. */
    clear: (indices: readonly number[]) => {
      if (indices.length > 0) sound.play("tilesOff", 0.15);
      for (const i of indices) {
        slots[i]?.classList.remove("is-shaking");
        void slots[i]?.offsetWidth;
        slots[i]?.classList.add("is-shaking");
      }
      window.setTimeout(() => indices.forEach((i) => {
        values[i] = null;
        draw(i);
      }), 380);
    },
    highlight: (indices: readonly number[]) => indices.forEach((i) => slots[i]?.classList.add("is-answer")),
    reset: () => values.forEach((_, i) => {
      if (editable[i]) {
        values[i] = null;
        draw(i);
        slots[i]?.classList.remove("is-answer");
      }
    }),
    // Stella se achica con las baldosas mientras se aleja.
    walk: (stella: HTMLElement) => walkAcross(stella, [start, ...tiles, ...filler], (tile) => tile.scale / start.scale)
  };
}

const INCOMPLETE: LocalizedText = { es: "Primero llena todos los huecos del puente", en: "First fill every gap in the bridge" };

/** "estrella amarilla, círculo celeste" para las pistas. */
function unitName(unit: readonly Piece[]): LocalizedText {
  return { es: unit.map((it) => pieceName(it).es).join(", "), en: unit.map((it) => pieceName(it).en).join(", ") };
}

/** REPETIR: copiar el modelo en el puente. */
export function copyRound(round: PatternCopyConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const layer = h("div", { class: "board bridge-board" }, modelSign(round.sequence, { es: "MODELO", en: "MODEL" }, ctx.t));
  const bridge = fillBridge(ctx, layer, round.sequence.map(() => null), trayPieces([...round.sequence, ...round.extra]));
  const wrong = () => bridge.values().flatMap((piece, i) => (piece && kindOf(piece) === kindOf(round.sequence[i]!) ? [] : [i]));
  return {
    layer,
    mode: "check",
    incomplete: INCOMPLETE,
    hint: { es: `Copia el modelo en orden: ${unitName(round.sequence).es}.`, en: `Copy the model in order: ${unitName(round.sequence).en}.` },
    evaluate: () => (bridge.empty() ? null : bridge.complete() ? wrong().length === 0 : null),
    onWrong: () => bridge.clear(wrong()),
    reveal: () => {
      round.sequence.forEach((piece, i) => bridge.set(i, piece));
      bridge.highlight(round.sequence.map((_, i) => i));
    },
    reset: () => bridge.reset(),
    celebrate: bridge.walk
  };
}

/** ALTERNAR, CONTINUAR y COMPLETAR: llenar los huecos de un puente que repite la unidad. */
export function fillRound(round: PatternFillConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const answer = expandPattern(round.unit, round.length);
  const blanks = new Set(round.blanks);
  const layer = h("div", { class: "board bridge-board" });
  const bridge = fillBridge(ctx, layer, answer.map((piece, i) => (blanks.has(i) ? null : piece)), trayPieces([...round.unit, ...round.extra]));
  const wrong = () => round.blanks.filter((i) => {
    const piece = bridge.values()[i];
    return !piece || kindOf(piece) !== kindOf(answer[i]!);
  });
  const name = unitName(round.unit);
  return {
    layer,
    mode: "check",
    incomplete: INCOMPLETE,
    hint: { es: `Lo que se repite es: ${name.es}. Sigue ese orden.`, en: `What repeats is: ${name.en}. Follow that order.` },
    evaluate: () => (bridge.empty() ? null : bridge.complete() ? wrong().length === 0 : null),
    onWrong: () => bridge.clear(wrong()),
    reveal: () => {
      round.blanks.forEach((i) => bridge.set(i, answer[i]!));
      bridge.highlight(round.blanks);
    },
    reset: () => bridge.reset(),
    celebrate: bridge.walk
  };
}

/** CREAR: llenar el puente con un patrón propio que se repita al menos dos veces. */
export function createRound(round: PatternCreateConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const layer = h("div", { class: "board bridge-board" });
  const bridge = fillBridge(ctx, layer, Array.from({ length: round.length }, () => null), round.palette);
  return {
    layer,
    mode: "check",
    incomplete: INCOMPLETE,
    hint: {
      es: "Elige un grupo de 2 o 3 piezas y repítelo en el mismo orden hasta llenar el puente.",
      en: "Pick a group of 2 or 3 pieces and repeat it in the same order until the bridge is full."
    },
    evaluate: () => (bridge.empty() || !bridge.complete() ? null : isRepeatedPattern(bridge.values() as Piece[])),
    onWrong: () => bridge.clear(bridge.values().map((_, i) => i)),
    reveal: () => {
      // Un ejemplo con las dos primeras piezas: A B A B…
      expandPattern(round.palette.slice(0, 2), round.length).forEach((piece, i) => bridge.set(i, piece));
      bridge.highlight(Array.from({ length: round.length }, (_, i) => i));
    },
    reset: () => bridge.reset(),
    celebrate: bridge.walk
  };
}

/** Tres caminos paralelos hacia el portal, para DETECTAR, con baldosas más pequeñas. */
const LANES: Strip[] = [0, 1, 2].map((k) => ({ start: { x: 620, y: 600 + k * 165 }, scale: 0.42 }));

/** Armado del puente en DETECTAR: los otros caminos se opacan y las baldosas vuelan una tras otra. */
const SPOT_FADE_MS = 350;
const SPOT_FLY_MS = 520;
const SPOT_STAGGER_MS = 170;
/** Las baldosas lisas que completan el puente hasta la isla aparecen una tras otra. */
const SPOT_FILL_STAGGER_MS = 80;
const SPOT_SETTLE_MS = 350;

/** Centro de la imagen de una baldosa (la cara superior no está en el centro de la imagen). */
function imageCenter(tile: Tile): StagePoint {
  return { x: tile.c.x + (TILE_IMAGE.w / 2 - TILE_IMAGE.faceX) * tile.scale, y: tile.c.y + (TILE_IMAGE.h / 2 - TILE_IMAGE.faceY) * tile.scale };
}

/**
 * DETECTAR: elegir el único camino que sigue el patrón indicado. Al acertar, los otros caminos se
 * opacan y las baldosas del elegido vuelan a armar el puente desde la base de Stella; después se
 * completa con baldosas lisas hasta la isla y Stella lo cruza hasta el portal.
 */
export function spotRound(round: PatternSpotConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const paths = spotPaths(round.unit, round.length, round.mistakes);
  // El camino correcto cae en un carril al azar.
  const order = [0, 1, 2].sort(() => Math.random() - 0.5);
  const correctLane = order.indexOf(0);
  const layer = h("div", { class: "board bridge-board spot-board" }, modelSign(round.unit, { es: "PATRÓN", en: "PATTERN" }, ctx.t));
  // Puente principal: la base de Stella se ve desde el principio; el patrón y el resto, al acertar.
  const bridge = bridgeTiles(round.length);
  const bridgeArt = svg("svg", { class: "bridge-art", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  const fillerGroups = bridge.filler.map(() => svg("g"));
  const patternGroups = bridge.pattern.map(() => svg("g"));
  [...fillerGroups].reverse().forEach((g) => bridgeArt.append(g));
  [...patternGroups].reverse().forEach((g) => bridgeArt.append(g));
  bridgeArt.append(tileArt(bridge.start, "base"));
  const art = svg("svg", { class: "bridge-art", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
  // El puente va encima de los caminos, que quedan opacados detrás.
  layer.append(art, bridgeArt);
  let chosen = -1;
  const lanes = order.map((pathIndex, lane) => {
    const path = LANES[lane]!;
    const tiles = stripTiles(path, round.length);
    const size = TILE_IMAGE.w * path.scale;
    const glow = svg("polyline", {
      points: tiles.map((tile) => `${tile.c.x},${tile.c.y + size * 0.12}`).join(" "),
      class: "lane-glow",
      fill: "none",
      "stroke-width": size * 0.85,
      "stroke-linecap": "round"
    });
    const g = svg("g", { class: "lane" });
    g.append(glow);
    // Cada baldosa por separado, para esconderla cuando sale volando hacia el puente.
    const tileArts = tiles.map((tile, k) => tileArt(tile, paths[pathIndex]![k]!));
    [...tileArts].reverse().forEach((it) => g.append(it));
    art.append(g);
    const first = tiles[0]!.c;
    const last = tiles[tiles.length - 1]!.c;
    const button = h(
      "button",
      {
        class: "bridge-lane",
        type: "button",
        "aria-pressed": "false",
        "aria-label": `${ctx.t({ es: `Camino ${lane + 1}`, en: `Path ${lane + 1}` })}: ${paths[pathIndex]!.map((it) => ctx.t(pieceName(it))).join(", ")}`,
        style: `left:${(first.x + last.x) / 2}px;top:${(first.y + last.y) / 2 + size * 0.1}px;width:${Math.hypot(last.x - first.x, last.y - first.y) + size * 0.7}px;height:${size * 0.55}px;rotate:${Math.atan2(last.y - first.y, last.x - first.x)}rad`,
        onclick: () => {
          if (!ctx.enabled()) return;
          sound.play("tap");
          select(chosen === lane ? -1 : lane);
          // Al elegir un camino se revisa solo.
          if (chosen >= 0) window.setTimeout(() => ctx.enabled() && chosen === lane && ctx.submit(), AUTO_CHECK_MS);
        }
      },
      h("span", { class: "bridge-lane-number" }, String(lane + 1))
    );
    layer.append(button);
    return { g, button, tiles, tileArts, pieces: paths[pathIndex]! };
  });
  const select = (lane: number) => {
    chosen = lane;
    // Al tocar el camino correcto, los números se van en ese momento (la revisión llega después).
    layer.classList.toggle("is-numbers-hidden", lane === correctLane);
    lanes.forEach((it, i) => {
      it.g.classList.toggle("is-chosen", i === lane);
      it.button.setAttribute("aria-pressed", String(i === lane));
    });
  };
  /** Opaca los caminos que no son `lane` y bloquea los toques. */
  const fadeOthers = (lane: number) => {
    layer.classList.add("is-solved");
    lanes.forEach((it, i) => {
      it.g.classList.toggle("is-faded", i !== lane);
      it.button.classList.toggle("is-faded", i !== lane);
    });
  };
  /** La baldosa `k` del camino correcto vuela hasta su lugar en el puente y aterriza con un saltito. */
  const flyTile = (k: number, delay: number) => {
    const { tiles, tileArts, pieces } = lanes[correctLane]!;
    const from = tiles[k]!;
    const to = bridge.pattern[k]!;
    window.setTimeout(() => {
      if (!layer.isConnected) return;
      const start = imageCenter(from);
      const end = imageCenter(to);
      tileArts[k]!.style.visibility = "hidden";
      const flyer = h("div", { class: "bridge-flyer", style: `left:${start.x}px;top:${start.y}px` }, flatTile(pieces[k]!, Math.round(TILE_IMAGE.w * from.scale)));
      layer.append(flyer);
      sound.play("tileFly");
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const grow = to.scale / from.scale;
      const tilt = `rotate(${TILT_DEGREES}deg)`;
      flyer
        .animate(
          [
            { transform: `translate(-50%, -50%) translate(0px, 0px) scale(1) ${tilt}` },
            { transform: `translate(-50%, -50%) translate(${dx * 0.5}px, ${Math.min(dy, 0) * 0.5 - 120}px) scale(${(1 + grow) / 2 + 0.15}) ${tilt}`, offset: 0.5 },
            { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${grow}) ${tilt}` }
          ],
          { duration: SPOT_FLY_MS, easing: "cubic-bezier(0.45, 0, 0.35, 1)", fill: "forwards" }
        )
        .finished.catch(() => undefined)
        .then(() => {
          flyer.remove();
          if (!layer.isConnected) return;
          const placed = tileArt(to, pieces[k]!);
          placed.classList.add("is-popping");
          patternGroups[k]!.replaceChildren(placed);
          sound.play("tileLand");
        });
    }, delay);
  };
  /** Arma el puente con el camino correcto y lo completa hasta la isla; devuelve cuánto tarda. */
  const build = () => {
    fadeOthers(correctLane);
    lanes[correctLane]!.g.classList.add("is-building");
    for (let k = 0; k < round.length; k++) flyTile(k, SPOT_FADE_MS + k * SPOT_STAGGER_MS);
    const landed = SPOT_FADE_MS + (round.length - 1) * SPOT_STAGGER_MS + SPOT_FLY_MS;
    window.setTimeout(() => layer.isConnected && layer.classList.add("is-built"), landed);
    // Las baldosas lisas completan el puente hasta la isla, de la más cercana a la más lejana.
    const fillFrom = landed + 120;
    bridge.filler.forEach((tile, i) =>
      window.setTimeout(() => {
        if (!layer.isConnected) return;
        const base = tileArt(tile, "base");
        base.classList.add("is-appearing");
        fillerGroups[i]!.replaceChildren(base);
        if (i === 0) sound.play("tileLand");
      }, fillFrom + i * SPOT_FILL_STAGGER_MS)
    );
    return fillFrom + bridge.filler.length * SPOT_FILL_STAGGER_MS + SPOT_SETTLE_MS;
  };
  const name = unitName(round.unit);
  return {
    layer,
    mode: "check",
    incomplete: { es: "Primero toca un camino", en: "First tap a path" },
    hint: { es: `El patrón es: ${name.es}. Revisa cada camino baldosa por baldosa.`, en: `The pattern is: ${name.en}. Check each path tile by tile.` },
    evaluate: () => (chosen < 0 ? null : chosen === correctLane),
    onWrong: () => {
      const lane = lanes[chosen];
      lane?.button.classList.remove("is-shaking");
      void lane?.button.offsetWidth;
      lane?.button.classList.add("is-shaking");
      lane?.g.classList.add("is-wrong");
      window.setTimeout(() => select(-1), 380);
    },
    reveal: () => {
      select(correctLane);
      fadeOthers(correctLane);
      lanes[correctLane]!.g.classList.add("is-answer");
    },
    reset: () => select(-1),
    celebrate: (stella) => {
      // Primero se arma el puente; luego Stella lo cruza desde su base hasta el portal.
      const buildMs = build();
      const walkTiles = [bridge.start, ...bridge.pattern, ...bridge.filler];
      window.setTimeout(() => {
        if (layer.isConnected) walkAcross(stella, walkTiles, (tile) => tile.scale / bridge.start.scale);
      }, buildMs);
      return buildMs + WALK_STEP_MS * walkTiles.length;
    }
  };
}

/**
 * DESCUBRIR LA UNIDAD: el puente ya está completo y repite una unidad. Abajo hay tres carteles con
 * posibles unidades (la correcta, una más corta y una más larga); al tocar uno se revisa solo y, si
 * es la unidad, Stella cruza el puente.
 */
export function unitRound(round: PatternUnitConfig["rounds"][number], ctx: MechanicContext): RoundView {
  const layer = h("div", { class: "board bridge-board" });
  const bridge = fillBridge(ctx, layer, expandPattern(round.unit, round.length), []);
  // La unidad correcta cae en un cartel al azar.
  const options = unitOptions(round.unit);
  const order = options.map((_, i) => i).sort(() => Math.random() - 0.5);
  const correct = order.indexOf(0);
  let chosen = -1;
  const cards = order.map((optionIndex, i) => {
    const pieces = options[optionIndex]!;
    return h(
      "button",
      {
        class: "unit-option",
        type: "button",
        "aria-pressed": "false",
        "aria-label": pieces.map((it) => ctx.t(pieceName(it))).join(", "),
        onclick: () => {
          if (!ctx.enabled()) return;
          sound.play("tap");
          select(chosen === i ? -1 : i);
          // Al tocar un cartel se revisa solo.
          if (chosen === i) window.setTimeout(() => ctx.enabled() && chosen === i && ctx.submit(), AUTO_CHECK_MS);
        }
      },
      ...pieces.map((piece) => flatTile(piece, 74))
    );
  });
  const select = (index: number) => {
    chosen = index;
    cards.forEach((card, i) => {
      card.setAttribute("aria-pressed", String(i === index));
      card.classList.remove("is-wrong");
    });
  };
  layer.append(h("div", { class: "unit-options", style: `left:${TRAY_X}px;top:${TRAY_Y}px` }, ...cards));
  return {
    layer,
    mode: "auto",
    incomplete: { es: "Primero toca un cartel", en: "First tap a sign" },
    hint: {
      es: `Mira desde la primera baldosa: ¿cuándo vuelve a empezar lo mismo? Son ${round.unit.length} piezas.`,
      en: `Look from the first tile: when does the same thing start again? It is ${round.unit.length} pieces.`
    },
    evaluate: () => (chosen < 0 ? null : chosen === correct),
    onWrong: () => {
      const card = cards[chosen];
      card?.classList.remove("is-wrong");
      void card?.offsetWidth;
      card?.classList.add("is-wrong");
      window.setTimeout(() => select(-1), 380);
    },
    reveal: () => {
      select(correct);
      cards[correct]!.classList.add("is-answer");
    },
    reset: () => select(-1),
    celebrate: bridge.walk
  };
}
