import type { Screen } from "../app";
import { ProgressStore } from "../progress/progressStore";
import { CODE_MAX_LENGTH } from "../session/authentication";
import { safeLocalStorage } from "../settings";
import { h, STAR_PATH, svg } from "../ui/dom";
import { icon } from "../ui/icons";
import { ambientLayer, paintedLights, sparkle } from "../ui/scenery";
import { sound } from "../audio/sound";
import { background, languageToggle, soundToggle } from "./common";
import { selectorScreen } from "./selector";
import { INTRO_STORY, storyProgress, storyScreen } from "./story";

/** Borrador para no perder lo escrito cuando se redibuja al cambiar el idioma. */
const draft = { code: "" };

/** Acceso con el código del estudiante, visible (guía 2D `interfaz/autenticacion/inicio-sesion-codigo-visible-v3`). */
export const accessScreen: Screen = (stage, app) => {
  const t = app.settings.t.bind(app.settings);

  const input = h("input", {
    id: "access-code",
    class: "code-input",
    type: "text",
    inputmode: "text",
    autocomplete: "off",
    autocapitalize: "characters",
    spellcheck: "false",
    maxlength: CODE_MAX_LENGTH + 4,
    value: draft.code,
    "aria-label": t({ es: "Tu código", en: "Your code" }),
    oninput: () => {
      input.value = input.value.toUpperCase();
      draft.code = input.value;
      error.textContent = "";
    }
  });
  const error = h("p", { class: "form-error", role: "alert" });
  const submit = h("button", { class: "button-brand", type: "submit" }, t({ es: "ENTRAR", en: "ENTER" }));

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    submit.disabled = true;
    const result = await app.auth.signIn(input.value);
    submit.disabled = false;
    if (!result.ok) return void (error.textContent = t(result.message));
    draft.code = "";
    app.enrollment.markReturning();
    app.session = result.session;
    app.progress = new ProgressStore(safeLocalStorage() ?? { getItem: () => null, setItem: () => undefined }, result.session.playerKey);
    // La primera vez que entra un estudiante ve la historia antes del selector.
    app.go(storyProgress().hasSeen(result.session.playerKey, INTRO_STORY.id) ? selectorScreen : storyScreen(INTRO_STORY, selectorScreen));
  };

  const title = app.enrollment.returning ? { es: "¡HOLA DE NUEVO!", en: "HELLO AGAIN!" } : { es: "¡HOLA!", en: "HELLO!" };

  const form = h(
    "form",
    { class: "access-card", novalidate: true, onsubmit: onSubmit },
    shiningStar(),
    h("h1", { class: "access-title" }, t(title)),
    h(
      "label",
      { class: "access-label", for: "access-code" },
      t({ es: "INGRESA TU CÓDIGO", en: "ENTER YOUR CODE" })
    ),
    h("div", { class: "code-field" }, icon("code", 54, "#7C83C9"), input),
    error,
    submit,
    divider()
  );

  stage.append(
    h(
      "div",
      { class: "screen access" },
      background("assets/images/bg-observatory.jpg", "is-drifting-soft"),
      paintedLights({
        stars: [[190, 148], [343, 182], [230, 208], [298, 222], [215, 262], [320, 290], [275, 310], [490, 123], [580, 153], [453, 186], [568, 232], [508, 256], [728, 186], [680, 243], [782, 245], [610, 272], [720, 295], [637, 318], [660, 358]],
        lamps: [[55, 240]],
        lampRadius: 150,
        glows: [{ at: [680, 585], rx: 300, ry: 80, color: "#5FE3FF" }],
        twinkles: [[712, 105], [455, 305], [258, 132], [1032, 235], [1040, 466], [1590, 380], [1413, 690], [1550, 105], [1525, 305], [1245, 580]]
      }),
      ambientLayer({ seed: 9, shootingStars: 2, motes: 8, skyHeight: 420 }),
      h("img", { class: "corner-logo", src: "assets/branding/logo.png", alt: "Aprendo Lógica" }),
      form,
      soundToggle(app),
      languageToggle(app)
    )
  );
  sound.music("sky");
  requestAnimationFrame(() => input.focus({ preventScroll: true }));
};

function shiningStar(): SVGSVGElement {
  const root = svg("svg", { class: "access-star", viewBox: "-2.2 -1.4 4.4 2.6", "aria-hidden": "true" });
  root.append(svg("path", { d: STAR_PATH, fill: "#FFC93C", stroke: "#FFC93C", "stroke-width": 0.22, "stroke-linejoin": "round" }));
  for (const [x1, y1, x2, y2] of [[-1.25, -0.75, -1.0, -0.55], [1.25, -0.75, 1.0, -0.55], [-1.6, 0.05, -1.25, 0.08], [1.6, 0.05, 1.25, 0.08]] as const) {
    root.append(svg("line", { x1, y1, x2, y2, stroke: "#FFC93C", "stroke-width": 0.16, "stroke-linecap": "round" }));
  }
  return root;
}

/** Separador con destello y luna, como en la guía. */
function divider(): HTMLElement {
  const mark = svg("svg", { viewBox: "-1.2 -1 3.6 2", width: 96, height: 54, "aria-hidden": "true" });
  mark.append(
    sparkle(0, 0, 0.9, "#FFC93C"),
    svg("path", { d: "M2.0,-0.75 A0.8 0.8 0 1 0 2.3,0.55 A0.62 0.62 0 1 1 2.0,-0.75 Z", fill: "#5BCBFF" })
  );
  return h("div", { class: "access-divider" }, h("span"), mark, h("span"));
}

