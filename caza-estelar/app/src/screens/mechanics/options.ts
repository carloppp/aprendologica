import { h } from "../../ui/dom";
import type { MechanicContext } from "./types";

/** Espera antes de revisar sola una respuesta, para que se vea lo que se eligió. */
export const AUTO_CHECK_MS = 450;

/**
 * Fila de tarjetas de respuesta bajo el diagrama (DESCRIBE EL CONJUNTO y CLASES DE CONJUNTOS): se
 * elige una tocándola y se comprueba con el botón de la escena, o sola con `autoCheck`.
 */
export function optionCards(ctx: MechanicContext, cards: { label: string; content: (Node | string)[] }[], y: number, autoCheck = false) {
  let chosen = -1;
  const buttons = cards.map((card, i) =>
    h(
      "button",
      {
        class: "option-card",
        type: "button",
        "aria-pressed": "false",
        "aria-label": card.label,
        onclick: () => {
          if (!ctx.enabled()) return;
          select(chosen === i ? -1 : i);
          if (autoCheck && chosen === i) window.setTimeout(() => ctx.enabled() && chosen === i && ctx.submit(), AUTO_CHECK_MS);
        }
      },
      ...card.content
    )
  );
  const select = (index: number) => {
    chosen = index;
    buttons.forEach((it, i) => {
      it.setAttribute("aria-pressed", String(i === index));
      it.classList.remove("is-wrong");
    });
  };
  return {
    element: h("div", { class: "option-cards", style: `top:${y}px` }, ...buttons),
    chosen: () => chosen,
    /** Sacude la tarjeta elegida y la suelta. */
    reject: () => {
      const button = buttons[chosen];
      if (!button) return;
      button.classList.remove("is-wrong");
      void button.offsetWidth;
      button.classList.add("is-wrong");
      chosen = -1;
      button.setAttribute("aria-pressed", "false");
    },
    reveal: (index: number) => {
      select(index);
      buttons[index]!.classList.add("is-answer");
    },
    reset: () => select(-1)
  };
}
