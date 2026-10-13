import type { App } from "../app";
import { sound } from "../audio/sound";
import { h } from "../ui/dom";
import { icon } from "../ui/icons";
import { sparkle } from "../ui/scenery";
import { svg } from "../ui/dom";

/** Botón ES/EN; el cambio de idioma redibuja la pantalla actual. */
export function languageToggle(app: App): HTMLElement {
  const next = app.settings.language === "es" ? "en" : "es";
  return h(
    "button",
    {
      class: "language-toggle",
      type: "button",
      "aria-label": app.settings.t({ es: "Cambiar idioma a inglés", en: "Switch language to Spanish" }),
      onclick: () => (app.settings.language = next)
    },
    next.toUpperCase()
  );
}

/**
 * Botón de sonido (música y efectos juntos). Se actualiza en su lugar, sin redibujar la pantalla,
 * así que también sirve en medio de un nivel.
 */
export function soundToggle(app: App): HTMLElement {
  const button = h("button", { class: "sound-toggle", type: "button", "data-sound": "none" });
  const paint = () => {
    const on = app.settings.soundEnabled;
    button.replaceChildren(icon(on ? "sound" : "mute", 60));
    button.classList.toggle("is-muted", !on);
    button.setAttribute("aria-pressed", String(on));
    button.setAttribute("aria-label", app.settings.t({ es: "Sonido", en: "Sound" }));
  };
  button.addEventListener("click", () => {
    app.settings.soundEnabled = !app.settings.soundEnabled;
    paint();
    sound.play("tap");
  });
  paint();
  return button;
}

/** Botón redondo de volver, en la esquina inferior izquierda. */
export function backButton(app: App, onBack: () => void): HTMLElement {
  return h(
    "button",
    { class: "round-button back-button", type: "button", "aria-label": app.settings.t({ es: "Volver", en: "Back" }), onclick: onBack },
    icon("back", 64)
  );
}

export function background(src: string, extraClass = ""): HTMLElement {
  return h("div", { class: `background ${extraClass}`.trim(), style: `background-image:url("${src}")` });
}

/** Destello de cuatro puntas como SVG suelto (títulos y adornos). */
export function sparkleIcon(color: string, size: number): SVGSVGElement {
  const root = svg("svg", { viewBox: "-1.1 -1.1 2.2 2.2", width: size, height: size, "aria-hidden": "true" });
  root.append(sparkle(0, 0, 1, color));
  return root;
}

/** Píldora de título con destellos, como en el selector y la constelación. */
export function titlePill(text: string, color: string, extraClass = ""): HTMLElement {
  return h(
    "h1",
    { class: `title-pill ${extraClass}`.trim(), style: `--pill:${color}` },
    sparkleIcon(color, 44),
    h("span", {}, text),
    sparkleIcon(color, 44)
  );
}
