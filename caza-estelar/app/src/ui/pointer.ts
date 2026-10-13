import { sound } from "../audio/sound";
import { STAGE_WIDTH } from "./stage";

export interface StagePoint {
  x: number;
  y: number;
}

const DRAG_THRESHOLD = 14;

/** Convierte una posición de pantalla a coordenadas del escenario 1920×1080. */
export function toStage(stage: HTMLElement, clientX: number, clientY: number): StagePoint {
  const rect = stage.getBoundingClientRect();
  const scale = rect.width / STAGE_WIDTH;
  return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
}

/**
 * Tocar o arrastrar: un toque llama a `onTap`; un arrastre mueve el elemento con el dedo y al
 * soltar llama a `onDrop` con el punto en coordenadas de escenario. Si `onDrop` devuelve false, el
 * elemento vuelve a su lugar.
 */
export function tapOrDrag(
  element: HTMLElement,
  stage: HTMLElement,
  handlers: { onTap: () => void; onDrop: (point: StagePoint) => boolean; enabled: () => boolean }
): void {
  let start: StagePoint | undefined;
  let dragging = false;
  let pointerId = -1;

  element.addEventListener("pointerdown", (event) => {
    if (!handlers.enabled() || pointerId !== -1) return;
    pointerId = event.pointerId;
    start = toStage(stage, event.clientX, event.clientY);
    dragging = false;
    element.setPointerCapture(event.pointerId);
  });

  element.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId || !start) return;
    const point = toStage(stage, event.clientX, event.clientY);
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!dragging) sound.play("lift");
    dragging = true;
    element.classList.add("is-dragging");
    element.style.translate = `${dx}px ${dy}px`;
  });

  const finish = (event: PointerEvent, cancelled: boolean) => {
    if (event.pointerId !== pointerId || !start) return;
    pointerId = -1;
    const point = toStage(stage, event.clientX, event.clientY);
    const wasDragging = dragging;
    start = undefined;
    dragging = false;
    element.classList.remove("is-dragging");
    element.style.translate = "";
    if (cancelled || !handlers.enabled()) return;
    // Al soltar, la pieza suena al caer; si no cabía, el toque suave acompaña su regreso.
    if (wasDragging) sound.play(handlers.onDrop(point) ? "drop" : "tap");
    else {
      sound.play("drop");
      handlers.onTap();
    }
  };
  element.addEventListener("pointerup", (event) => finish(event, false));
  element.addEventListener("pointercancel", (event) => finish(event, true));
  // Teclado: Enter o Espacio equivalen a un toque.
  element.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && handlers.enabled()) {
      event.preventDefault();
      sound.play("drop");
      handlers.onTap();
    }
  });
}
