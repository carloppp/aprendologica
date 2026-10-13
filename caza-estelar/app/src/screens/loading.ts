import type { Screen } from "../app";
import { sound } from "../audio/sound";
import { loadBundledCatalog } from "../content/catalogLoader";
import { preloadCharacterArt } from "../ui/characters";
import { h, svg } from "../ui/dom";
import { ambientLayer, paintedLights, sparkle } from "../ui/scenery";
import { accessScreen } from "./access";
import { background } from "./common";
import { recoveryScreen } from "./recovery";

const MINIMUM_SPLASH_MS = 2600;

/** Luces de `bg-terrace.jpg`: la constelación pintada y los cristales del barandal. */
function sceneLights(): SVGSVGElement {
  return paintedLights({
    stars: [[730, 70], [705, 120], [603, 150], [575, 197], [780, 172], [665, 247], [818, 240], [880, 210], [920, 153], [950, 215], [898, 272], [1010, 303], [1075, 355], [1008, 413]],
    lamps: [[55, 545], [755, 490], [958, 585], [60, 750], [507, 795]]
  });
}

/** Intro sobre la terraza del observatorio mientras se carga y valida el catálogo empaquetado. */
export const loadingScreen: Screen = (stage, app) => {
  stage.append(
    h(
      "div",
      { class: "screen loading" },
      background("assets/images/bg-terrace.jpg", "is-drifting"),
      sceneLights(),
      ambientLayer({ seed: 3, shootingStars: 6, motes: 24, skyHeight: 520 }),
      h(
        "div",
        { class: "splash" },
        h(
          "div",
          { class: "splash-logo-wrap" },
          h("img", { class: "splash-logo", src: "assets/branding/logo.png", alt: "Aprendo Lógica" }),
          ...[[-30, 40], [770, 10], [700, 250], [40, 250]].map(([x, y], i) => {
            const mark = svg("svg", { class: "logo-sparkle", viewBox: "-1.1 -1.1 2.2 2.2", style: `left:${x}px;top:${y}px;animation-delay:${(i * 0.6).toFixed(1)}s`, "aria-hidden": "true" });
            mark.append(sparkle(0, 0, 1, i % 2 ? "#8CCDFD" : "#FEDD76"));
            return mark;
          })
        ),
        h("div", { class: "loading-bar", role: "progressbar", "aria-label": app.settings.t({ es: "Cargando", en: "Loading" }) }, h("span")),
        h(
          "p",
          { class: "loading-text" },
          app.settings.t({ es: "Encendiendo las estrellas", en: "Lighting up the stars" }),
          h("span", { class: "dots" }, h("i", {}, "."), h("i", {}, "."), h("i", {}, "."))
        )
      )
    )
  );
  preloadCharacterArt();
  sound.music("sky");

  let cancelled = false;
  Promise.all([loadBundledCatalog(), new Promise((resolve) => setTimeout(resolve, MINIMUM_SPLASH_MS))]).then(([result]) => {
    if (cancelled) return;
    if (result.ok) {
      app.catalog = result.catalog;
      app.go(accessScreen);
    } else {
      // Los detalles quedan en consola para desarrollo; nunca contienen datos del jugador.
      console.warn("[AprendoLogica] catálogo inválido", result.issues.map((it) => it.field));
      app.go(recoveryScreen);
    }
  });
  return () => {
    cancelled = true;
  };
};
