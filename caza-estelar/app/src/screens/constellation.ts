import type { Screen } from "../app";
import { constellationStars } from "../progress/constellationProgress";
import type { LevelDefinition } from "../content/model";
import { h, svg } from "../ui/dom";
import { ambientLayer, skyBackdrop, SPARKLE_PATH } from "../ui/scenery";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../ui/stage";
import { constellationLayout } from "../ui/themeGroups";
import { sound } from "../audio/sound";
import { backButton, languageToggle, soundToggle, titlePill } from "./common";
import { levelScreen } from "./level";
import { selectorScreen } from "./selector";

/**
 * Pantalla 2 (guía 2D `navegacion/sets-constellation-levels-v3`): estrellas de cuatro puntas del
 * tono del grupo que brillan según las estrellas obtenidas en cada nivel (ver `constellationStars`).
 * Al tocar una se abre un panel con sus estrellas y la opción de jugar, repetir o dejarlo.
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
    const layout = constellationLayout(constellation.id);
    // Con menos de tres estrellas no hay anillo que cerrar (RELACIONES aún tiene dos niveles).
    const { stars, links } = constellationStars(constellation, app.progress?.all() ?? {}, layout.closed && levels.length > 2);
    const done = stars.filter((it) => it.completed).length;

    const sky = svg("svg", { class: "constellation-lines", viewBox: `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`, "aria-hidden": "true" });
    for (const { from, to, strength } of links) {
      const a = layout.points[from]!;
      const b = layout.points[to]!;
      const lit = litLevelId !== undefined && (levels[from]!.id === litLevelId || levels[to]!.id === litLevelId);
      // Tramo suave (2 estrellas) o completo (3), con una luz que lo recorre solo cuando es completo.
      const group = svg("g", { class: `link is-strength-${strength}` });
      group.append(svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: color, "stroke-width": strength === 3 ? 7 : 4, "stroke-linecap": "round", class: lit ? "is-new" : "" }));
      if (strength === 3) {
        // Con `pathLength` el recorrido de la luz no depende del largo del tramo.
        group.append(svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, pathLength: 100, stroke: "#ffffff", "stroke-width": 12, "stroke-linecap": "round", "stroke-dasharray": "0.1 200", class: "link-flow" }));
      }
      group.append(svg("circle", { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, r: strength === 3 ? 11 : 7, fill: color, class: "link-node" }));
      sky.append(group);
    }

    // Panel previo a cada nivel: estrellas obtenidas, JUGAR o REPETIR, y una equis (o tocar fuera) para salir.
    const panelHost = h("div", { class: "level-panel-host", hidden: true });
    const closePanel = () => {
      panelHost.hidden = true;
      panelHost.replaceChildren();
    };
    const openPanel = (level: LevelDefinition, earned: number) => {
      sound.play("tap");
      panelHost.replaceChildren(levelPanel(level, earned));
      panelHost.hidden = false;
      panelHost.querySelector<HTMLButtonElement>(".level-panel-play")?.focus({ preventScroll: true });
    };
    /**
     * Panel del nivel (diseño de referencia del 13 de octubre de 2026): tarjeta alta con borde
     * luminoso, medallón con estrella arriba, estrellas obtenidas en arco, de qué trata el nivel y JUGAR/REPETIR.
     */
    const levelPanel = (level: LevelDefinition, earned: number) => {
      // Assets del paquete `entregables/panel-union-assets-v1.zip` (public/assets/ui/level-panel).
      const art = (name: string, className: string, alt = "") =>
        h("img", { class: className, src: `assets/ui/level-panel/${name}.svg`, alt, draggable: "false" });

      const stars = h(
        "div",
        { class: "level-panel-progress", role: "img", "aria-label": t({ es: `${earned} de 3 estrellas`, en: `${earned} of 3 stars` }) },
        art("arco-progreso", "level-panel-orbit"),
        h(
          "div",
          { class: "level-panel-stars" },
          ...Array.from({ length: 3 }, (_, i) => {
            const star = art(i < earned ? "estrella-llena" : "estrella-vacia", i < earned ? "is-earned" : "is-empty");
            star.style.setProperty("--delay", `${0.1 + i * 0.12}s`);
            return star;
          })
        )
      );

      // Destellos cian y amarillos alrededor del panel, que titilan desfasados.
      const spots: [number, number, number, "cian" | "amarillo"][] = [
        [-70, 198, 55, "cian"], [668, 360, 55, "cian"], [-34, 600, 40, "cian"], [470, -70, 36, "cian"],
        [96, -30, 30, "amarillo"], [-60, 300, 18, "amarillo"], [650, 270, 18, "amarillo"], [640, 520, 16, "amarillo"], [420, 760, 16, "amarillo"]
      ];
      const glints = h(
        "div",
        { class: "level-panel-glints", "aria-hidden": "true" },
        ...spots.map(([x, y, size, tone], i) => {
          const mark = art(`destello-${tone}`, "glint");
          mark.style.cssText = `left:${x}px;top:${y}px;width:${size}px;animation-delay:${(-i * 0.45).toFixed(2)}s`;
          return mark;
        })
      );

      return h(
        "div",
        {
          class: "level-panel",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": t(level.title),
          onclick: (event: Event) => event.stopPropagation()
        },
        glints,
        art("emblema-mision", "level-panel-emblem"),
        h(
          "button",
          { class: "level-panel-close", type: "button", "aria-label": t({ es: "Cerrar", en: "Close" }), onclick: closePanel },
          art("cerrar", "")
        ),
        h("h2", { class: "level-panel-title" }, t(level.title).toUpperCase()),
        stars,
        h("p", { class: "level-panel-count" }, t({ es: `${earned} DE 3 ESTRELLAS`, en: `${earned} OF 3 STARS` })),
        // De qué trata el nivel, en una frase (sin descripción, la instrucción).
        h("p", { class: "level-panel-message" }, t(level.description.es.trim() ? level.description : level.instruction)),
        h(
          "button",
          { class: "level-panel-play", type: "button", onclick: () => app.go(levelScreen(constellation.id, level.id, color)) },
          t(earned === 0 ? { es: "JUGAR", en: "PLAY" } : { es: "REPETIR", en: "REPLAY" })
        )
      );
    };
    panelHost.addEventListener("click", closePanel);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !panelHost.hidden) closePanel();
    };
    window.addEventListener("keydown", onKey);

    const buttons = levels.map((level, index) => {
      const position = layout.points[index]!;
      const earned = stars[index]?.stars ?? 0;
      const art = svg("svg", { class: "level-star-art", viewBox: "-1.25 -1.25 2.5 2.5", "aria-hidden": "true" });
      art.append(svg("path", { d: SPARKLE_PATH, class: "level-star-shape" }));
      return h(
        "button",
        {
          class: `level-star${earned > 0 ? " is-lit" : ""}${level.id === litLevelId ? " is-new" : ""}${arriving ? " is-arriving" : ""}`,
          "data-stars": earned,
          type: "button",
          style: `left:${position.x}px;top:${position.y}px;--accent:${color};--delay:${(-index * 0.7).toFixed(1)}s;--order:${index}`,
          "aria-label": `${t(level.title)}: ${t({ es: `${earned} de 3 estrellas`, en: `${earned} of 3 stars` })}`,
          onclick: () => openPanel(level, earned)
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
        panelHost,
        soundToggle(app),
        languageToggle(app)
      )
    );
    sound.music("epic");
    // Tras el viaje estelar, cada estrella titila al aparecer (animación `arrive`, que empieza a
    // los 0.35 s + 0.14 s por estrella y se hace visible ~0.12 s después).
    if (arriving) {
      levels.forEach((_, index) => {
        const position = layout.points[index]!;
        sound.twinkleStar(index, 0.47 + index * 0.14, (position.x / STAGE_WIDTH - 0.5) * 1.4);
      });
    }
    // La estrella recién encendida brilla a mitad de su animación (`light-up`, 1.4 s).
    if (litLevelId !== undefined) sound.play("lit", 0.7);
    return () => window.removeEventListener("keydown", onKey);
  };
}
