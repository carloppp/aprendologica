import { h } from "./dom";
import { STAGE_HEIGHT, STAGE_WIDTH } from "./stage";

export const JOURNEY_MS = 1900;

/**
 * Viaje estelar hacia una constelación: la estrella elegida vuela al centro y crece hasta pasar
 * de largo, el cielo se estira en estelas de hiperespacio teñidas del color del grupo y un
 * destello final da paso a la constelación. Se resuelve cuando termina la animación.
 */
export function starJourney(screen: HTMLElement, chosen: HTMLElement, color: string): Promise<void> {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();

  const overlay = h("div", { class: "journey", style: `--journey:${color}`, "aria-hidden": "true" });
  const center = { x: STAGE_WIDTH / 2, y: STAGE_HEIGHT / 2 };

  // Estelas que nacen cerca del centro y salen disparadas hacia los bordes, cada vez más rápido.
  for (let i = 0; i < 90; i++) {
    const angle = (i / 90) * 360 + Math.random() * 4;
    const delay = 0.25 + Math.random() * 0.9;
    const length = 120 + Math.random() * 260;
    const tinted = Math.random() > 0.55;
    overlay.append(
      h(
        "span",
        {
          class: "warp-line",
          style: `left:${center.x}px;top:${center.y}px;transform:rotate(${angle.toFixed(1)}deg)`
        },
        h("i", {
          style: `width:${length.toFixed(0)}px;animation-delay:${delay.toFixed(2)}s;animation-duration:${(0.55 + Math.random() * 0.35).toFixed(2)}s;background:linear-gradient(90deg, transparent, ${tinted ? color : "#ffffff"})`
        })
      )
    );
  }

  // Copia de la estrella elegida que viaja desde su lugar hasta el centro y "atraviesa" la pantalla.
  const art = chosen.querySelector("svg")!.cloneNode(true) as SVGSVGElement;
  art.removeAttribute("class");
  const left = parseFloat(chosen.style.left);
  const top = parseFloat(chosen.style.top);
  const traveler = h("div", { class: "journey-star", style: `left:${left}px;top:${top}px;--dx:${center.x - left}px;--dy:${center.y - top}px` }, art);
  overlay.append(traveler, h("div", { class: "journey-flash" }));

  screen.classList.add("is-traveling");
  chosen.classList.add("is-chosen");
  screen.append(overlay);
  return new Promise((resolve) => window.setTimeout(resolve, JOURNEY_MS));
}
