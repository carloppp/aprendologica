import type { Screen } from "../app";
import { h, STAR_PATH, svg } from "../ui/dom";
import { starJourney } from "../ui/journey";
import { ambientLayer, skyBackdrop, sparkle } from "../ui/scenery";
import { THEME_GROUPS, THEME_LAYOUT, THEME_TITLE, type ThemeIcon } from "../ui/themeGroups";
import { accessScreen } from "./access";
import { sound } from "../audio/sound";
import { backButton, languageToggle, soundToggle, titlePill } from "./common";
import { constellationScreen } from "./constellation";
import { INTRO_STORY, storyScreen } from "./story";
import { icon } from "../ui/icons";

/**
 * Pantalla 1 (guía 2D `navegacion/logic-sets-theme-selector-v2`): seis estrellas grandes e
 * independientes; ninguna bloquea a otra. Los grupos sin constelación publicada avisan "¡Muy pronto!".
 */
export const selectorScreen: Screen = (stage, app) => {
  const t = app.settings.t.bind(app.settings);
  const toast = h("p", { class: "toast", role: "status", "aria-live": "polite" });
  let toastTimer = 0;
  let traveling = false;
  const screen = h("div", { class: "screen selector" });

  const stars = THEME_GROUPS.map((group, index) => {
    const constellation = app.catalog?.constellations.find((it) => it.id === group.constellationId);
    const position = THEME_LAYOUT[index]!;
    return h(
      "button",
      {
        class: `theme-star${constellation ? "" : " is-soon"}`,
        type: "button",
        style: `left:${position.x}px;top:${position.y}px;--accent:${group.color}`,
        "aria-label": constellation ? t(group.label) : `${t(group.label)}: ${t({ es: "muy pronto", en: "coming soon" })}`,
        onclick: (event: Event) => {
          if (traveling) return;
          if (constellation) {
            traveling = true;
            const chosen = event.currentTarget as HTMLElement;
            sound.play("warp");
            // La orquesta entra durante el viaje y ya suena al llegar a la constelación.
            sound.music("epic");
            void starJourney(screen, chosen, group.color).then(() => app.go(constellationScreen(constellation.id, group.color, undefined, true)));
            return;
          }
          toast.textContent = t({ es: "¡Muy pronto! Esta constelación todavía se está formando.", en: "Coming soon! This constellation is still forming." });
          toast.classList.add("is-visible");
          sound.play("soon");
          window.clearTimeout(toastTimer);
          toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
        }
      },
      themeStar(group.color, group.icon),
      h("span", { class: "theme-label" }, t(group.label))
    );
  });

  screen.append(
      skyBackdrop(7),
      ambientLayer({ seed: 21, shootingStars: 3, motes: 12 }),
      titlePill(t(THEME_TITLE), "#8E7BFF", "is-corner"),
      ...stars,
      toast,
      backButton(app, () => {
        app.auth.signOut();
        app.session = undefined;
        app.progress = undefined;
        app.go(accessScreen);
      }),
      // Volver a ver la historia de inicio.
      h(
        "button",
        {
          class: "round-button story-button",
          type: "button",
          "aria-label": t({ es: "Ver la historia", en: "Watch the story" }),
          onclick: () => !traveling && app.go(storyScreen(INTRO_STORY, selectorScreen))
        },
        icon("book", 64)
      ),
      soundToggle(app),
      languageToggle(app)
  );
  stage.append(screen);
  return () => window.clearTimeout(toastTimer);
};

/** Estrella redondeada con brillo y el icono del grupo en azul marino. */
function themeStar(color: string, icon: ThemeIcon): SVGSVGElement {
  const root = svg("svg", { class: "theme-art", viewBox: "-1.45 -1.4 2.9 2.8", "aria-hidden": "true" });
  const order = THEME_GROUPS.findIndex((it) => it.icon === icon);
  const glint = sparkle(0.62, -0.62, 0.26, "#ffffff", 1, "theme-glint");
  glint.firstElementChild!.setAttribute("style", `animation-delay:${(order * 0.9).toFixed(1)}s`);
  const shineId = `theme-shine-${icon}`;
  const shine = svg("linearGradient", { id: shineId, x1: 0, y1: 0, x2: 1, y2: 0.4 });
  shine.append(
    svg("stop", { offset: "0.35", "stop-color": "#ffffff", "stop-opacity": 0 }),
    svg("stop", { offset: "0.5", "stop-color": "#ffffff", "stop-opacity": 0.55 }),
    svg("stop", { offset: "0.65", "stop-color": "#ffffff", "stop-opacity": 0 })
  );
  // El reflejo cruza la estrella cada pocos segundos; cada grupo empieza en un momento distinto.
  if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    shine.append(
      svg("animateTransform", {
        attributeName: "gradientTransform",
        type: "translate",
        values: "-1.2 0; 1.2 0; 1.2 0",
        keyTimes: "0; 0.35; 1",
        dur: "5s",
        begin: `${(order * 0.8).toFixed(1)}s`,
        repeatCount: "indefinite"
      })
    );
  }
  const mask = svg("mask", { id: `${shineId}-mask` });
  mask.append(svg("path", { d: STAR_PATH, fill: "#ffffff", stroke: "#ffffff", "stroke-width": 0.58, "stroke-linejoin": "round" }));
  const defs = svg("defs");
  defs.append(shine, mask);
  root.append(defs);
  root.append(
    svg("path", { d: STAR_PATH, fill: color, stroke: color, "stroke-width": 0.6, "stroke-linejoin": "round", opacity: 0.45, class: "theme-glow" }),
    // Contorno blanco por fuera: el trazo blanco es más ancho y queda debajo de la estrella de color.
    svg("path", { d: STAR_PATH, fill: "#ffffff", stroke: "#ffffff", "stroke-width": 0.58, "stroke-linejoin": "round" }),
    svg("path", { d: STAR_PATH, fill: color, stroke: color, "stroke-width": 0.42, "stroke-linejoin": "round" }),
    // Brillo que cruza la estrella y destello que aparece en una punta.
    // Reflejo en una sola capa, recortado con la silueta redondeada completa (contorno incluido).
    svg("rect", { x: -1.45, y: -1.4, width: 2.9, height: 2.8, fill: `url(#${shineId})`, mask: `url(#${shineId}-mask)`, class: "theme-shine" }),
    glint
  );
  const ink = "#0A1340";
  const g = svg("g", { fill: ink, stroke: ink, "stroke-width": 0.02, "stroke-linecap": "round", "stroke-linejoin": "round" });
  switch (icon) {
    case "sets":
      g.append(
        svg("circle", { cx: -0.2, cy: 0.05, r: 0.34 }),
        svg("circle", { cx: 0.2, cy: 0.05, r: 0.34 }),
        svg("path", { d: "M0,-0.21 A0.34 0.34 0 0 1 0,0.31 A0.34 0.34 0 0 1 0,-0.21 Z", fill: color, stroke: "none", opacity: 0.85 })
      );
      break;
    case "sorting":
      g.append(
        svg("circle", { cx: -0.33, cy: -0.13, r: 0.13 }),
        svg("path", { d: "M-0.33,0.06 L-0.15,0.36 L-0.51,0.36 Z" }),
        svg("line", { x1: -0.02, y1: -0.36, x2: -0.02, y2: 0.4, "stroke-width": 0.07 }),
        svg("rect", { x: 0.1, y: -0.15, width: 0.38, height: 0.34, rx: 0.04 })
      );
      break;
    case "relations":
      g.append(svg("circle", { cx: -0.35, cy: 0.04, r: 0.17 }), svg("circle", { cx: 0.35, cy: 0.04, r: 0.17 }), svg("line", { x1: -0.3, y1: 0.04, x2: 0.3, y2: 0.04, "stroke-width": 0.07 }));
      break;
    case "patterns":
      g.append(svg("circle", { cx: -0.45, cy: 0.04, r: 0.13 }));
      for (const x of [-0.15, 0.15, 0.45]) g.append(svg("circle", { cx: x, cy: 0.04, r: 0.11, fill: "none", "stroke-width": 0.06 }));
      break;
    case "sequences":
      g.append(
        svg("rect", { x: -0.5, y: 0.12, width: 0.18, height: 0.18, rx: 0.03 }),
        svg("rect", { x: -0.24, y: -0.04, width: 0.3, height: 0.34, rx: 0.04 }),
        svg("rect", { x: 0.12, y: -0.26, width: 0.4, height: 0.56, rx: 0.05 })
      );
      break;
    case "reasoning":
      g.append(
        svg("circle", { cx: 0, cy: -0.32, r: 0.13 }),
        svg("path", { d: "M0,-0.2 L0,-0.02 M-0.3,-0.02 L0.3,-0.02 M-0.3,-0.02 L-0.3,0.12 M0.3,-0.02 L0.3,0.12", fill: "none", "stroke-width": 0.05 }),
        svg("rect", { x: -0.46, y: 0.12, width: 0.3, height: 0.24, rx: 0.03 }),
        svg("rect", { x: 0.16, y: 0.12, width: 0.3, height: 0.24, rx: 0.03 })
      );
      break;
  }
  root.append(g);
  return root;
}
