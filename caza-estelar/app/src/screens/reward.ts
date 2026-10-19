import type { Screen } from "../app";
import { sound } from "../audio/sound";
import { h, starIcon } from "../ui/dom";
import { ambientLayer } from "../ui/scenery";
import { background } from "./common";
import { constellationScreen } from "./constellation";
import { levelScreen } from "./level";

const MAXIMUM_STARS = 3;

/** Recompensa (paso 4 del flujo de nivel): estrellas obtenidas sobre la escena de celebración. */
export function rewardScreen(result: {
  constellationId: string;
  levelId: string;
  color: string;
  stars: number;
  passed: boolean;
  /** La estrella del nivel brilla más que antes (subió de 0, 1 o 2 estrellas). */
  newlyLit: boolean;
}): Screen {
  return (stage, app) => {
    const t = app.settings.t.bind(app.settings);
    const constellation = app.catalog?.constellations.find((it) => it.id === result.constellationId);
    const levels = constellation ? [...constellation.levels].sort((a, b) => a.order - b.order) : [];
    const next = levels[levels.findIndex((it) => it.id === result.levelId) + 1];
    const toConstellation = () => app.go(constellationScreen(result.constellationId, result.color, result.newlyLit ? result.levelId : undefined));
    const showNext = result.passed && next !== undefined;

    sound.music("sky");
    sound.play(result.passed ? "victory" : "tryAgain");
    // Cada estrella ganada suena cuando termina de aparecer (animación `pop` con `--delay`).
    for (let i = 0; i < Math.min(result.stars, MAXIMUM_STARS); i++) sound.playStar(i, 0.55 + i * 0.25);

    stage.append(
      h(
        "div",
        { class: `screen reward${result.passed ? " is-passed" : ""}` },
        background("assets/images/bg-celebration.jpg"),
        ambientLayer({ seed: 17, shootingStars: 4, motes: 18, skyHeight: 600 }),
        h(
          "div",
          { class: "reward-card" },
          h("h1", { class: "reward-title" }, t(result.passed ? { es: "¡NIVEL COMPLETADO!", en: "LEVEL COMPLETE!" } : { es: "¡BUEN INTENTO!", en: "NICE TRY!" })),
          h(
            "div",
            { class: "reward-stars", role: "img", "aria-label": t({ es: `${result.stars} de ${MAXIMUM_STARS} estrellas`, en: `${result.stars} of ${MAXIMUM_STARS} stars` }) },
            ...Array.from({ length: MAXIMUM_STARS }, (_, i) => {
              const star = starIcon(i < result.stars ? "#FFD43B" : "#3A4A9A", 150);
              star.style.setProperty("--delay", `${0.25 + i * 0.25}s`);
              star.classList.add(i < result.stars ? "is-earned" : "is-empty");
              return star;
            })
          ),
          h(
            "p",
            { class: "reward-message" },
            t(
              result.passed
                ? result.newlyLit
                  ? result.stars >= MAXIMUM_STARS
                    ? { es: "¡Tu estrella brilla con toda su luz!", en: "Your star shines with all its light!" }
                    : { es: "¡Tu estrella brilla más en la constelación!", en: "Your star shines brighter in the constellation!" }
                  : { es: "¡Tu estrella sigue brillando!", en: "Your star keeps shining!" }
                : result.newlyLit
                  ? { es: "¡Tu estrella empezó a brillar! Juega otra vez para que brille más.", en: "Your star started to shine! Play again to make it brighter." }
                  : { es: "Practica otra vez para encender la estrella.", en: "Practice again to light the star." }
            )
          ),
          h(
            "div",
            { class: "reward-actions" },
            h(
              "button",
              { class: "button-outline", type: "button", onclick: () => app.go(levelScreen(result.constellationId, result.levelId, result.color)) },
              t({ es: "REPETIR", en: "REPLAY" })
            ),
            showNext &&
              h(
                "button",
                { class: "button-brand", type: "button", onclick: () => app.go(levelScreen(result.constellationId, next.id, result.color)) },
                t({ es: "SIGUIENTE", en: "NEXT" })
              ),
            h("button", { class: showNext ? "button-outline" : "button-brand", type: "button", onclick: toConstellation }, t({ es: "CONSTELACIÓN", en: "CONSTELLATION" }))
          )
        )
      )
    );
  };
}
