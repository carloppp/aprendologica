import type { MultipleChoiceConfig } from "../../content/model";
import { h } from "../../ui/dom";
import { holoTable } from "../../ui/scenery";
import type { MechanicContext, RoundView } from "./types";

/** Selección múltiple del contrato v2 (una ronda): elegir una opción y comprobar. */
export function choiceRound(config: MultipleChoiceConfig, ctx: MechanicContext): RoundView {
  let chosen: string | undefined;
  const correct = config.options.find((it) => it.correct)?.id;
  const buttons = config.options.map((option) =>
    h(
      "button",
      {
        class: "choice-option",
        type: "button",
        "data-id": option.id,
        "aria-pressed": "false",
        onclick: () => {
          if (!ctx.enabled()) return;
          chosen = option.id;
          buttons.forEach((it) => it.setAttribute("aria-pressed", String(it.dataset.id === chosen)));
        }
      },
      ctx.t(option.text)
    )
  );
  const layer = h(
    "div",
    { class: "board" },
    holoTable(960, 640, 600, 260),
    h("div", { class: "choice-panel" }, h("h2", { class: "choice-question" }, ctx.t(config.question)), h("div", { class: "choice-options" }, ...buttons))
  );
  return {
    layer,
    mode: "check",
    hint: config.retryFeedback,
    evaluate: () => (chosen === undefined ? null : chosen === correct),
    onWrong: () => buttons.find((it) => it.dataset.id === chosen)?.classList.add("is-wrong"),
    reveal: () => buttons.find((it) => it.dataset.id === correct)?.classList.add("is-answer"),
    reset: () => {
      chosen = undefined;
      buttons.forEach((it) => it.setAttribute("aria-pressed", "false"));
    }
  };
}
