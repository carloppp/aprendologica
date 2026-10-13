import type { Screen } from "../app";
import { h } from "../ui/dom";
import { background } from "./common";
import { loadingScreen } from "./loading";

/** Pantalla segura cuando el catálogo no pasa la validación: no se activa contenido inválido. */
export const recoveryScreen: Screen = (stage, app) => {
  const t = app.settings.t.bind(app.settings);
  stage.append(
    h(
      "div",
      { class: "screen recovery" },
      background("assets/images/bg-terrace.jpg", "is-dimmed"),
      h(
        "div",
        { class: "reward-card" },
        h("h1", { class: "reward-title" }, t({ es: "No pudimos cargar las actividades", en: "We could not load the activities" })),
        h("p", { class: "reward-message" }, t({ es: "Revisa tu conexión e inténtalo de nuevo.", en: "Check your connection and try again." })),
        h(
          "div",
          { class: "reward-actions" },
          h("button", { class: "button-brand", type: "button", onclick: () => app.go(loadingScreen) }, t({ es: "REINTENTAR", en: "TRY AGAIN" }))
        )
      )
    )
  );
};
