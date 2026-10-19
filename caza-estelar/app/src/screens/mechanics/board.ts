import type { LocalizedText, Piece } from "../../content/model";
import { h } from "../../ui/dom";
import { pieceName, pieceSvg } from "../../ui/pieces";
import { tapOrDrag, toStage, type StagePoint } from "../../ui/pointer";

/** Zona elíptica del tablero, en coordenadas de escenario. */
export interface Zone {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export function inside(zone: Zone, point: StagePoint, margin = 1.15): boolean {
  const dx = (point.x - zone.cx) / (zone.rx * margin);
  const dy = (point.y - zone.cy) / (zone.ry * margin);
  return dx * dx + dy * dy <= 1;
}

/** Posiciones en cuadrícula centradas en la zona; elige filas según la proporción de la zona. */
export function slotsIn(zone: Zone, count: number, spacing: number): StagePoint[] {
  if (count === 0) return [];
  const aspect = zone.rx / zone.ry;
  let columns = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * aspect))));
  const rows = Math.ceil(count / columns);
  columns = Math.ceil(count / rows);
  const slots: StagePoint[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / columns);
    const inRow = row === rows - 1 ? count - row * columns : columns;
    const col = i % columns;
    slots.push({ x: zone.cx + (col - (inRow - 1) / 2) * spacing, y: zone.cy + (row - (rows - 1) / 2) * spacing * 0.86 });
  }
  return slots;
}

/** Posiciones repartidas sobre una elipse (piezas alrededor de la mesa). */
export function ringSlots(zone: Zone, count: number, startDegrees = -150): StagePoint[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((startDegrees + (360 * i) / count) * Math.PI) / 180;
    return { x: zone.cx + Math.cos(angle) * zone.rx, y: zone.cy + Math.sin(angle) * zone.ry };
  });
}

/** Posiciones en una fila horizontal centrada. */
export function rowSlots(cx: number, y: number, count: number, spacing: number): StagePoint[] {
  return Array.from({ length: count }, (_, i) => ({ x: cx + (i - (count - 1) / 2) * spacing, y }));
}

export function placeAt(element: HTMLElement, point: StagePoint, scale = 1): void {
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
  element.style.setProperty("--scale", String(scale));
}

/** Pieza fija (no interactiva), p. ej. los elementos de un conjunto dado. */
export function staticPiece(piece: Piece, size: number, point: StagePoint, t: (text: LocalizedText) => string): HTMLElement {
  const element = h("div", { class: "token is-static", role: "img", "aria-label": t(pieceName(piece)) }, pieceSvg(piece, size));
  placeAt(element, point);
  return element;
}

export function pieceToken(piece: Piece, size: number, t: (text: LocalizedText) => string): HTMLButtonElement {
  return h("button", { class: "token", type: "button", "aria-label": t(pieceName(piece)) }, pieceSvg(piece, size));
}

/**
 * Fichas que se mueven entre su lugar de origen y una zona objetivo, por toque o arrastre.
 * Lo usan ELEMENTOS, SUBCONJUNTOS, INTERSECCIÓN y DIFERENCIA.
 */
export class SelectionBoard {
  private readonly tokens: { element: HTMLElement; home: StagePoint; selected: boolean }[] = [];

  constructor(
    private readonly stage: HTMLElement,
    private readonly zone: Zone,
    private readonly options: {
      spacing: number;
      zoneScale: number;
      capacity?: number;
      enabled: () => boolean;
      onChange?: () => void;
      /** Posiciones dentro de la zona; por defecto, una cuadrícula centrada. */
      layout?: (count: number) => StagePoint[];
    }
  ) {}

  add(element: HTMLElement, home: StagePoint): void {
    const index = this.tokens.length;
    this.tokens.push({ element, home, selected: false });
    placeAt(element, home);
    tapOrDrag(element, this.stage, {
      enabled: this.options.enabled,
      onTap: () => this.toggle(index, !this.tokens[index]!.selected),
      onDrop: (point) => {
        this.toggle(index, inside(this.zone, point));
        return true;
      }
    });
    this.updateLabel(index);
  }

  get selected(): number[] {
    return this.tokens.flatMap((token, index) => (token.selected ? [index] : []));
  }

  /** Coloca exactamente estas fichas en la zona (para mostrar la respuesta). */
  select(indices: readonly number[]): void {
    this.tokens.forEach((token, index) => (token.selected = indices.includes(index)));
    this.layout();
  }

  /** Devuelve a su lugar las fichas indicadas, con una sacudida. */
  reject(indices: readonly number[]): void {
    for (const index of indices) {
      const token = this.tokens[index]!;
      token.element.classList.remove("is-shaking");
      void token.element.offsetWidth;
      token.element.classList.add("is-shaking");
      token.selected = false;
    }
    window.setTimeout(() => this.layout(), 450);
  }

  highlight(indices: readonly number[]): void {
    this.tokens.forEach((token, index) => token.element.classList.toggle("is-answer", indices.includes(index)));
  }

  reset(): void {
    this.select([]);
  }

  private toggle(index: number, selected: boolean): void {
    const token = this.tokens[index]!;
    if (selected && !token.selected && this.options.capacity !== undefined) {
      const placed = this.selected;
      if (placed.length >= this.options.capacity) this.tokens[placed[0]!]!.selected = false;
    }
    token.selected = selected;
    this.layout();
    this.options.onChange?.();
  }

  private layout(): void {
    const placed = this.selected;
    const slots = this.options.layout?.(placed.length) ?? slotsIn(this.zone, placed.length, this.options.spacing);
    this.tokens.forEach((token, index) => {
      const slot = placed.indexOf(index);
      token.element.classList.toggle("is-placed", slot >= 0);
      if (slot >= 0) placeAt(token.element, slots[slot]!, this.options.zoneScale);
      else placeAt(token.element, token.home);
      this.updateLabel(index);
    });
  }

  private updateLabel(index: number): void {
    const token = this.tokens[index]!;
    token.element.setAttribute("aria-pressed", String(token.selected));
  }
}

/**
 * Fichas que se reparten entre varias regiones (aros de FORMAR CONJUNTOS, regiones de un diagrama de
 * Venn). Se arrastran a su región, o se toca la ficha para elegirla y luego la región. Tocar una
 * ficha ya colocada la devuelve a su lugar. La región -1 es "fuera" (su lugar de origen).
 */
export class SortBoard {
  private readonly tokens: { element: HTMLElement; home: StagePoint; region: number }[] = [];
  private picked = -1;

  constructor(
    private readonly stage: HTMLElement,
    layer: HTMLElement,
    private readonly options: {
      /** Región bajo un punto del escenario, o -1 si queda fuera de todas. */
      regionAt: (point: StagePoint) => number;
      /** Posiciones de `count` fichas dentro de una región. */
      slots: (region: number, count: number) => StagePoint[];
      zoneScale: number;
      enabled: () => boolean;
      onChange?: () => void;
    }
  ) {
    // Con una ficha elegida, tocar una región la lleva ahí.
    layer.addEventListener("click", (event) => {
      if (this.picked < 0 || !this.options.enabled() || (event.target as Element).closest(".token")) return;
      const region = this.options.regionAt(toStage(this.stage, event.clientX, event.clientY));
      if (region >= 0) this.move(this.picked, region);
    });
  }

  add(element: HTMLElement, home: StagePoint): void {
    const index = this.tokens.length;
    this.tokens.push({ element, home, region: -1 });
    placeAt(element, home);
    tapOrDrag(element, this.stage, {
      enabled: this.options.enabled,
      onTap: () => {
        const token = this.tokens[index]!;
        if (token.region >= 0) this.move(index, -1);
        else this.pick(this.picked === index ? -1 : index);
      },
      onDrop: (point) => {
        this.move(index, this.options.regionAt(point));
        return true;
      }
    });
    this.updateLabel(index);
  }

  /** Región de cada ficha, en el orden en que se agregaron (-1 = fuera). */
  get regions(): number[] {
    return this.tokens.map((token) => token.region);
  }

  /** Fichas de cada una de las `count` regiones. */
  groups(count: number): number[][] {
    return Array.from({ length: count }, (_, region) => this.tokens.flatMap((token, index) => (token.region === region ? [index] : [])));
  }

  /** Coloca cada ficha en la región indicada (para mostrar la respuesta). */
  place(regions: readonly number[]): void {
    this.pick(-1);
    this.tokens.forEach((token, index) => (token.region = regions[index] ?? -1));
    this.layout();
  }

  /** Devuelve a su lugar las fichas indicadas, con una sacudida. */
  reject(indices: readonly number[]): void {
    for (const index of indices) {
      const token = this.tokens[index]!;
      token.element.classList.remove("is-shaking");
      void token.element.offsetWidth;
      token.element.classList.add("is-shaking");
      token.region = -1;
    }
    window.setTimeout(() => this.layout(), 450);
  }

  highlight(indices: readonly number[]): void {
    this.tokens.forEach((token, index) => token.element.classList.toggle("is-answer", indices.includes(index)));
  }

  reset(): void {
    this.place([]);
  }

  private pick(index: number): void {
    this.picked = index;
    this.tokens.forEach((token, i) => token.element.classList.toggle("is-picked", i === index));
  }

  private move(index: number, region: number): void {
    this.pick(-1);
    this.tokens[index]!.region = region;
    this.layout();
    this.options.onChange?.();
  }

  private layout(): void {
    const byRegion = new Map<number, number[]>();
    this.tokens.forEach((token, index) => {
      if (token.region >= 0) byRegion.set(token.region, [...(byRegion.get(token.region) ?? []), index]);
    });
    const slots = new Map([...byRegion].map(([region, members]) => [region, this.options.slots(region, members.length)]));
    this.tokens.forEach((token, index) => {
      const placed = token.region >= 0;
      token.element.classList.toggle("is-placed", placed);
      if (placed) placeAt(token.element, slots.get(token.region)![byRegion.get(token.region)!.indexOf(index)]!, this.options.zoneScale);
      else placeAt(token.element, token.home);
      this.updateLabel(index);
    });
  }

  private updateLabel(index: number): void {
    this.tokens[index]!.element.setAttribute("aria-pressed", String(this.tokens[index]!.region >= 0));
  }
}
