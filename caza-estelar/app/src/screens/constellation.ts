import type { Screen } from "../app";
import { constellationStars } from "../progress/constellationProgress";
import { h, svg } from "../ui/dom";
import { ambientLayer, skyBackdrop, SPARKLE_PATH } from "../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../ui/stage";
import { CONSTELLATION_LAYOUT } from "../ui/themeGroups";
import { sound } from "../audio/sound";
import { backButton, languageToggle, soundToggle, titlePill } from "./common";
import { levelScreen } from "./level";
import { selectorScreen } from "./selector";

/**
 * Pantalla 2 (guía 2D `navegacion/sets-constellation-levels-v3`): estrellas de cuatro puntas del
 * tono del grupo. Apagadas si el nivel no está completado, encendidas si lo está, y un
 * tramo solo entre dos estrellas consecutivas completadas. Todas siguen siendo seleccionables.
 * `litLevelId` anima la estrella que se acaba de encender; `arriving` (tras el viaje estelar) hace
 * aparecer las estrellas una por una.
 */
export function constellationScreen(constellationId: string, color: string, litLevelId?: string, arriving = false): Screen {
  return (stage, app) => {
    const t = app.settings.t.bind(app.settings);
    const constellation = app.catalog?.constellations.find((it) => it.id === constellationId);
    if (!constellation) {
      app.go(selectorScreen);
      return;
    }
    const levels = [...constellation.levels].sort((a, b) => a.order - b.order);
    const { stars, links } = constellationStars(constellation, app.progress?.all() ?? {});
    const done = stars.filter((it) => it.completed).length;

    const sky = svg("svg", { class: "constellation-lines", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
    for (const [from, to] of links) {
      const a = CONSTELLATION_LAYOUT[from]!;
      const b = CONSTELLATION_LAYOUT[to]!;
      const lit = litLevelId !== undefined && (levels[from]!.id === litLevelId || levels[to]!.id === litLevelId);
      sky.append(
        svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: color, "stroke-width": 7, "stroke-linecap": "round", class: lit ? "is-new" : "" }),
        // Una luz recorre el tramo de una estrella a otra (con `pathLength` el recorrido no depende del largo).
        svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, pathLength: 100, stroke: "#ffffff", "stroke-width": 12, "stroke-linecap": "round", "stroke-dasharray": "0.1 200", class: "link-flow" }),
        svg("circle", { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, r: 11, fill: color, class: "link-node" })
      );
    }

    const buttons = levels.map((level, index) => {
      const position = CONSTELLATION_LAYOUT[index]!;
      const completed = stars[index]?.completed ?? false;
      const art = svg("svg", { class: "level-star-art", viewBox: "-1.25 -1.25 2.5 2.5", "aria-hidden": "true" });
      art.append(svg("path", { d: SPARKLE_PATH, class: "level-star-shape" }));
      return h(
        "button",
        {
          class: `level-star${completed ? " is-complete" : ""}${level.id === litLevelId ? " is-new" : ""}${arriving ? " is-arriving" : ""}`,
          type: "button",
          style: `left:${position.x}px;top:${position.y}px;--accent:${color};--delay:${(-index * 0.7).toFixed(1)}s;--order:${index}`,
          "aria-label": `${t(level.title)}: ${completed ? t({ es: "completado", en: "completed" }) : t({ es: "pendiente", en: "pending" })}`,
          onclick: () => app.go(levelScreen(constellation.id, level.id, color))
        },
        art,
        h("span", { class: "level-label" }, t(level.title).toUpperCase())
      );
    });

    stage.append(
      h(
        "div",
        { class: `screen constellation${arriving ? " is-arriving" : ""}`, style: `--accent:${color}` },
        skyBackdrop(23),
        ambientLayer({ seed: 31, shootingStars: 3, motes: 10 }),
        sky,
        h(
          "div",
          { class: "constellation-header" },
          titlePill(t(constellation.title).toUpperCase(), color),
          h("p", { class: "count-pill", style: `--pill:${color}` }, t({ es: `${done} DE ${levels.length} ESTRELLAS`, en: `${done} OF ${levels.length} STARS` }))
        ),
        ...buttons,
        backButton(app, () => app.go(selectorScreen)),
        soundToggle(app),
        languageToggle(app)
      )
    );
    sound.music("epic");
    // Tras el viaje estelar, cada estrella titila al aparecer (animación `arrive`, que empieza a
    // los 0.35 s + 0.14 s por estrella y se hace visible ~0.12 s después).
    if (arriving) {
      levels.forEach((_, index) => {
        const position = CONSTELLATION_LAYOUT[index]!;
        sound.twinkleStar(index, 0.47 + index * 0.14, (position.x / STAGE_WIDTH - 0.5) * 1.4);
      });
    }
    // La estrella recién encendida brilla a mitad de su animación (`light-up`, 1.4 s).
    if (litLevelId !== undefined) sound.play("lit", 0.7);
  };
}
