import type { Screen } from "../app";
import { sound } from "../audio/sound";
import { StoryProgress } from "../session/storyProgress";
import { safeLocalStorage } from "../settings";
import type { LocalizedText } from "../content/model";
import { h } from "../ui/dom";

interface Panel {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Un cómic de cuatro cuadros: imagen 1920×1080, cuadros en orden de lectura y texto accesible. */
export interface StoryDefinition {
  id: string;
  image: string;
  panels: readonly Panel[];
  description: LocalizedText;
}

/** Historia de inicio (`guia-visual-2d/historia/comic-intro-v1.webp`). */
export const INTRO_STORY: StoryDefinition = {
  id: "intro",
  image: "assets/images/comic-intro.jpg",
  panels: [
    { x: 29, y: 36, w: 924, h: 485 },
    { x: 963, y: 36, w: 927, h: 485 },
    { x: 29, y: 531, w: 924, h: 457 },
    { x: 963, y: 531, w: 927, h: 457 }
  ],
  description: {
    es: "Historia: una noche el cielo dejó de brillar. Las estrellas se han dormido. La lógica puede despertarlas. ¿Nos ayudas a encender el cielo?",
    en: "Story: one night the sky stopped shining. The stars have fallen asleep. Logic can wake them up. Will you help us light up the sky?"
  }
};

/**
 * Historias en cómic visibles. Ocultas por ahora (decisión del 13 de octubre de 2026): ni se
 * muestran al primer acceso ni aparece el botón para verlas. Poner en `true` para activarlas.
 */
export const STORIES_ENABLED = false;

export function storyProgress(): StoryProgress {
  return new StoryProgress(safeLocalStorage() ?? { getItem: () => null, setItem: () => undefined });
}

/**
 * Historia en forma de cómic. El primer cuadro se ve de entrada; los demás están tapados por nubes
 * blancas que se disipan, una por toque, en el orden de lectura. Al terminar aparece el botón para
 * continuar a `next`. Cada historia se muestra sola la primera vez y luego se puede volver a ver.
 */
export function storyScreen(story: StoryDefinition, next: Screen): Screen {
  const PANELS = story.panels;
  return (stage, app) => {
    const t = app.settings.t.bind(app.settings);
    let revealed = 1;
    const timers: number[] = [];

    // Una sola nube cubre el cómic; el primer cuadro ya está despejado.
    const veil = new CloudVeil(PANELS);
    veil.render(revealed);
    const fade = h("canvas", { class: "story-veil story-fade", width: WIDTH, height: HEIGHT, "aria-hidden": "true" });

    const finish = () => {
      if (app.session) storyProgress().markSeen(app.session.playerKey, story.id);
      sound.play("tap");
      app.go(next);
    };
    const go = h("button", { class: "button-brand story-go", type: "button", hidden: true, onclick: finish }, t({ es: "¡VAMOS!", en: "LET'S GO!" }));
    const hint = h("p", { class: "story-hint", role: "status", "aria-live": "polite" }, t({ es: "Toca para seguir la historia", en: "Tap to continue the story" }));

    /** La nube del cuadro siguiente se desvanece entera, de una vez y rápido. */
    let animating = false;
    // Toques que llegan mientras una nube se disuelve: se aplican al terminar, no se pierden.
    let pending = 0;
    const advance = () => {
      if (revealed >= PANELS.length) return;
      if (animating) {
        pending = Math.min(pending + 1, PANELS.length - revealed - 1);
        return;
      }
      animating = true;
      sound.play(revealed + 1 === PANELS.length ? "lit" : "whoosh");
      // La nube que tapa el cuadro pasa a una capa propia que se desvanece con una transición CSS;
      // debajo, el lienzo ya muestra el cuadro despejado con su orilla de nube.
      veil.copyPanel(fade, PANELS[revealed]!);
      revealed++;
      veil.render(revealed);
      fade.classList.remove("is-fading");
      void fade.offsetWidth;
      fade.classList.add("is-fading");
      timers.push(
        window.setTimeout(() => {
          animating = false;
          if (revealed === PANELS.length) {
            hint.hidden = true;
            go.hidden = false;
          } else if (pending > 0) {
            pending--;
            advance();
          }
        }, CLEAR_MS)
      );
    };

    const comic = h(
      "div",
      { class: "story-comic", role: "img", "aria-label": t(story.description) },
      h("img", { class: "story-image", src: story.image, alt: "", draggable: "false" }),
      veil.canvas,
      fade
    );
    comic.addEventListener("click", advance);

    stage.append(
      h(
        "div",
        { class: "screen story" },
        comic,
        hint,
        h("button", { class: "story-skip", type: "button", onclick: finish }, t({ es: "Saltar", en: "Skip" })),
        go
      )
    );
    sound.music("sky");
    return () => {
      timers.forEach((it) => window.clearTimeout(it));
    };
  };
}

const CLEAR_MS = 850;
const WIDTH = 1920;
const HEIGHT = 1080;
/** Cuánto entra la nube sobre las orillas de un cuadro ya despejado. */
const RIM = 46;

interface Puff {
  x: number;
  y: number;
  r: number;
}

/**
 * Nube blanca dibujada en un lienzo del tamaño del escenario. Por dentro es densa, con bultos
 * sombreados en lila muy claro. Los cuadros por revelar quedan tapados por completo; los ya
 * revelados conservan una orilla de nube translúcida que tapa sus bordes.
 */
class CloudVeil {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  /** Textura de la nube, pintada una vez y copiada en cada cuadro de animación. */
  private readonly base: HTMLCanvasElement;
  /** Máscara de las orillas; se rellena con la textura para que se funda con el resto de la nube. */
  private readonly rimLayer: HTMLCanvasElement;
  private readonly rims: Puff[][][];
  private seed = 7;

  constructor(private readonly panels: readonly Panel[]) {
    this.canvas = h("canvas", { class: "story-veil", width: WIDTH, height: HEIGHT, "aria-hidden": "true" });
    this.ctx = this.canvas.getContext("2d")!;
    this.base = h("canvas", { width: WIDTH, height: HEIGHT });
    this.paintTexture(this.base.getContext("2d")!);
    this.rimLayer = h("canvas", { width: WIDTH, height: HEIGHT });
    this.rims = panels.map((panel) => this.makeRims(panel));
  }

  private random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private paintTexture(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Bultos: sombra lila suave abajo a la derecha y brillo blanco arriba, para dar volumen.
    for (let i = 0; i < 170; i++) {
      const x = this.random() * WIDTH;
      const y = this.random() * HEIGHT;
      const r = 70 + this.random() * 130;
      const shadow = ctx.createRadialGradient(x + r * 0.22, y + r * 0.28, 0, x + r * 0.22, y + r * 0.28, r);
      shadow.addColorStop(0, "rgba(206, 214, 250, 0.42)");
      shadow.addColorStop(1, "rgba(206, 214, 250, 0)");
      ctx.fillStyle = shadow;
      ctx.fillRect(x - r, y - r, r * 2.5, r * 2.5);
      const light = ctx.createRadialGradient(x - r * 0.15, y - r * 0.2, 0, x - r * 0.15, y - r * 0.2, r * 0.85);
      light.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      light.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = light;
      ctx.fillRect(x - r * 1.1, y - r * 1.1, r * 2, r * 2);
    }
  }

  /** Bultos de orilla por lado del cuadro: arriba, derecha, abajo, izquierda. */
  private makeRims(panel: Panel): Puff[][] {
    const along = (x0: number, y0: number, x1: number, y1: number) => {
      const length = Math.hypot(x1 - x0, y1 - y0);
      const puffs: Puff[] = [];
      for (let d = -20; d <= length + 20; d += 30) {
        const t = d / length;
        puffs.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, r: RIM * (1 + this.random() * 0.7) });
      }
      return puffs;
    };
    const { x, y, w, h: height } = panel;
    return [along(x, y, x + w, y), along(x + w, y, x + w, y + height), along(x, y + height, x + w, y + height), along(x, y, x, y + height)];
  }

  /** Lado del cuadro `index` que toca a otro cuadro (por cercanía): -1 si da al borde de la página. */
  private neighbor(index: number, side: number): number {
    const panel = this.panels[index]!;
    const probe = [
      { x: panel.x + panel.w / 2, y: panel.y - 20 },
      { x: panel.x + panel.w + 20, y: panel.y + panel.h / 2 },
      { x: panel.x + panel.w / 2, y: panel.y + panel.h + 20 },
      { x: panel.x - 20, y: panel.y + panel.h / 2 }
    ][side]!;
    return this.panels.findIndex((it) => probe.x >= it.x && probe.x <= it.x + it.w && probe.y >= it.y && probe.y <= it.y + it.h);
  }

  private puff(ctx: CanvasRenderingContext2D, puff: Puff, alpha: number, color: string): void {
    const gradient = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.r);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.55, `rgba(${color}, ${alpha * 0.75})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(puff.x - puff.r, puff.y - puff.r, puff.r * 2, puff.r * 2);
  }

  /**
   * Dibuja la nube con `revealed` cuadros despejados.
   * Los cuadros por revelar quedan opacos; las orillas de los revelados, tapadas por bultos suaves.
   */
  /** Copia en `target` la nube que hoy tapa `panel` (con un margen para la orilla). */
  copyPanel(target: HTMLCanvasElement, panel: Panel): void {
    const ctx = target.getContext("2d")!;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(this.canvas, panel.x, panel.y, panel.w, panel.h, panel.x, panel.y, panel.w, panel.h);
  }

  render(revealed: number): void {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(this.base, 0, 0);

    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < revealed; i++) {
      const panel = this.panels[i]!;
      ctx.fillStyle = "#000";
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    }

    // Orillas: la nube vuelve a entrar sobre los bordes de los cuadros despejados que dan a la nube.
    // Se dibujan como máscara y luego se rellenan con la misma textura, sin cortes de color.
    const rims = this.rimLayer.getContext("2d")!;
    rims.globalCompositeOperation = "source-over";
    rims.clearRect(0, 0, WIDTH, HEIGHT);
    const open = (index: number) => index >= 0 && index < revealed;
    for (let i = 0; i < revealed; i++) {
      // Solo dentro del cuadro: por fuera ya hay nube y aclararla dejaría un marco visible.
      const panel = this.panels[i]!;
      rims.save();
      rims.beginPath();
      rims.rect(panel.x, panel.y, panel.w, panel.h);
      rims.clip();
      for (let side = 0; side < 4; side++) {
        const neighbor = this.neighbor(i, side);
        // Arriba de la página no se tapa: ahí van los globos de texto del cómic.
        if (open(neighbor) || (side === 0 && neighbor === -1)) continue;
        for (const puff of this.rims[i]![side]!) this.puff(rims, puff, 0.95, "255, 255, 255");
      }
      rims.restore();
    }
    rims.globalCompositeOperation = "source-in";
    rims.drawImage(this.base, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.rimLayer, 0, 0);
  }
}
