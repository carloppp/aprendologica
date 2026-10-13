import type { Screen } from "../app";
import { sound } from "../audio/sound";
import { findLevel, type LevelDefinition, type LocalizedText } from "../content/model";
import { RoundSession, type RoundResult } from "../gameplay/roundSession";
import { characterFace, characterSprite, setMood, setPose, type Character, type Mood, type Pose } from "../ui/characters";
import { h, STAR_PATH, svg } from "../ui/dom";
import { icon } from "../ui/icons";
import { background, backButton, soundToggle } from "./common";
import { constellationScreen } from "./constellation";
import { choiceRound } from "./mechanics/choice";
import { differenceRound } from "./mechanics/difference";
import { intersectionRound } from "./mechanics/intersection";
import { membershipRound } from "./mechanics/membership";
import { selectRound } from "./mechanics/select";
import { subsetRound } from "./mechanics/subset";
import type { MechanicContext, RoundView } from "./mechanics/types";
import { unionRound } from "./mechanics/union";
import { rewardScreen } from "./reward";

const NEXT_ROUND_MS = 1500;
const REVEAL_MS = 2600;
const IDLE_MS = 9000;

interface RoundFactory {
  count: number;
  attempts: number;
  create: (index: number, ctx: MechanicContext) => RoundView;
}

/** Rondas de la mecánica del nivel; `undefined` si la mecánica no tiene pantalla en esta versión. */
function roundFactory(level: LevelDefinition): RoundFactory | undefined {
  const config = level.mechanic.config;
  switch (config.kind) {
    case "set_select":
      return { count: config.rounds.length, attempts: config.attempts, create: (i, ctx) => selectRound(config.rounds[i]!, ctx) };
    case "set_membership":
      return { count: config.rounds.length, attempts: config.attempts, create: (i, ctx) => membershipRound(config.rounds[i]!, ctx) };
    case "set_subset":
      return { count: config.rounds.length, attempts: config.attempts, create: (i, ctx) => subsetRound(config.rounds[i]!, ctx) };
    case "set_intersection":
      return { count: config.rounds.length, attempts: config.attempts, create: (i, ctx) => intersectionRound(config.rounds[i]!, ctx) };
    case "set_union":
      return { count: config.rounds.length, attempts: config.attempts, create: (i, ctx) => unionRound(config.rounds[i]!, ctx) };
    case "set_difference":
      return { count: config.rounds.length, attempts: config.attempts, create: (i, ctx) => differenceRound(config.rounds[i]!, ctx) };
    case "multiple_choice":
      return { count: 1, attempts: config.attempts, create: (_, ctx) => choiceRound(config, ctx) };
    default:
      return undefined;
  }
}

/** Foquito encendido con rayitos, para la idea de Luma. */
function lightBulb(): SVGSVGElement {
  const root = svg("svg", { class: "bulb", viewBox: "-50 -56 100 108" });
  root.append(
    svg("path", { d: "M-38,-40 L-46,-48 M38,-40 L46,-48 M-48,-6 L-56,-6 M48,-6 L56,-6 M0,-50 L0,-56", stroke: "#FFC93C", "stroke-width": 7, "stroke-linecap": "round" }),
    svg("path", { d: "M0,-40 C22,-40 34,-24 34,-6 C34,10 22,18 18,30 L-18,30 C-22,18 -34,10 -34,-6 C-34,-24 -22,-40 0,-40 Z", fill: "#FFE066", stroke: "#E0A800", "stroke-width": 5, "stroke-linejoin": "round" }),
    svg("ellipse", { cx: -12, cy: -18, rx: 7, ry: 11, fill: "#fff", opacity: 0.8, transform: "rotate(25 -12 -18)" }),
    svg("rect", { x: -18, y: 32, width: 36, height: 16, rx: 5, fill: "#8A94C9" })
  );
  return root;
}

function feedbackOf(level: LevelDefinition): { success: LocalizedText; retry: LocalizedText } {
  const config = level.mechanic.config;
  return "successFeedback" in config
    ? { success: config.successFeedback, retry: config.retryFeedback }
    : { success: { es: "¡Bien!", en: "Great!" }, retry: { es: "Inténtalo otra vez", en: "Try again" } };
}

/**
 * Nivel por rondas (guía 2D `niveles/conjuntos-desarrollo`): objetivo en el globo de Stella,
 * interacción en la mesa holográfica, respuesta con reacción de los personajes y recompensa al final.
 */
export function levelScreen(constellationId: string, levelId: string, color: string): Screen {
  return (stage, app) => {
    const t = app.settings.t.bind(app.settings);
    const level = app.catalog ? findLevel(app.catalog, levelId) : undefined;
    const factory = level ? roundFactory(level) : undefined;
    const backToConstellation = () => app.go(constellationScreen(constellationId, color));
    if (!level || !factory) {
      backToConstellation();
      return;
    }

    const session = new RoundSession(factory.count, factory.attempts);
    const feedback = feedbackOf(level);
    const startedAt = performance.now();
    const timers: number[] = [];
    let locked = false;
    let view: RoundView | undefined;

    // Stella señala la mesa y Luma sostiene una ficha.
    const stella = characterSprite("stella", "pointing");
    const luma = characterSprite("luma", "holding");
    const face = characterFace("stella", "happy");
    let idleTimer = 0;
    const instruction = h("p", { class: "hud-instruction", role: "status", "aria-live": "polite" });
    let instructionText = "";
    let restoreTimer = 0;
    const progress = h("div", { class: "round-progress", role: "img" });
    // El tablero se dibuja en coordenadas 1920×1080 y se reduce con CSS; el puntero convierte sus
    // posiciones con este mismo elemento, así que arrastrar sigue siendo exacto.
    const boardHost = h("div", { class: "board-host" });
    const ctx: MechanicContext = { stage: boardHost, t, enabled: () => !locked };

    // Botones redondos abajo a la derecha, debajo de Luma: cheque y reiniciar (cheque y equis en PERTENENCIA).
    const answerButton = (kind: "check" | "yes" | "no", label: LocalizedText, onclick: () => void) =>
      h(
        "button",
        { class: `round-button answer-${kind}`, type: "button", "data-sound": "none", "aria-label": t(label), onclick: () => !locked && onclick() },
        icon(kind === "no" ? "cross" : "check", 96)
      );
    const resetButton = h(
      "button",
      { class: "round-button answer-reset", type: "button", "aria-label": t({ es: "Empezar de nuevo", en: "Start over" }), onclick: () => !locked && view?.reset() },
      icon("retry", 84)
    );
    const checkActions = h("div", { class: "answer-bar" }, answerButton("check", { es: "Comprobar", en: "Check" }, () => answer()), resetButton);
    const yesNoActions = h(
      "div",
      { class: "answer-bar" },
      answerButton("yes", { es: "Sí pertenece", en: "Yes, it belongs" }, () => answer(true)),
      answerButton("no", { es: "No pertenece", en: "No, it does not belong" }, () => answer(false))
    );

    const later = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));
    /** Stella dice la retroalimentación en su globo; los avisos pasajeros vuelven a la consigna. */
    const say = (text: LocalizedText, tone: "success" | "retry" | "hint" | "reveal", speaker: Character = "stella") => {
      window.clearTimeout(restoreTimer);
      instruction.textContent = t(text);
      instruction.className = `hud-instruction is-${tone}`;
      // Cuando habla Luma (pistas), su cara ocupa el lugar de la de Stella en el globo de arriba.
      if (speaker === "luma") face.src = "assets/characters/luma-happy.png";
      if (tone === "retry" || tone === "hint") {
        restoreTimer = window.setTimeout(() => {
          instruction.textContent = instructionText;
          instruction.className = "hud-instruction";
          face.src = "assets/characters/stella-happy.png";
          if (!locked) restPoses();
        }, speaker === "luma" ? 4500 : 2600);
      }
    };

    const setPoses = (stellaPose: Pose, lumaPose: Pose) => {
      setPose(stella, stellaPose);
      setPose(luma, lumaPose);
    };
    /**
     * Poses de reposo, distintas en cada ronda: en las pares Stella señala la mesa y Luma sostiene
     * su estrella; en las impares Stella muestra su ficha y Luma señala.
     */
    const restPoses = () => (session.round % 2 === 0 ? setPoses("pointing", "holding") : setPoses("holding", "pointing"));
    /** Reacción breve al mover una pieza: el otro personaje se anima y vuelve a su pose de reposo. */
    let cheerTimer = 0;
    const cheerMove = () => {
      if (locked) return;
      window.clearTimeout(cheerTimer);
      const watcher = session.round % 2 === 0 ? luma : stella;
      setPose(watcher, "celebrating");
      setMood(watcher, "surprised");
      cheerTimer = window.setTimeout(() => !locked && restPoses(), 700);
    };
    /** Entre rondas, los dos corren hacia la siguiente. */
    const dash = () => {
      setPoses("running", "running");
      stella.classList.add("is-dashing");
      luma.classList.add("is-dashing");
      later(560, () => {
        stella.classList.remove("is-dashing");
        luma.classList.remove("is-dashing");
      });
    };
    const react = (stellaMood: Mood, lumaMood: Mood) => {
      face.src = `assets/characters/stella-${stellaMood}.png`;
      setMood(stella, stellaMood);
      setMood(luma, lumaMood);
    };
    /** Si el estudiante no interactúa por un rato, Luma se pone a pensar y se le enciende el foquito. */
    const armIdle = () => {
      window.clearTimeout(idleTimer);
      luma.classList.remove("is-idle");
      idleTimer = window.setTimeout(() => {
        if (locked) return;
        setPose(luma, "thinking");
        luma.classList.add("is-idle");
        sound.play("hint");
      }, IDLE_MS);
    };
    /** Lluvia de estrellas desde la mesa al acertar. */
    const burst = () => {
      const host = h("div", { class: "star-burst", "aria-hidden": "true" });
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
        const distance = 260 + Math.random() * 220;
        const size = 46 + Math.random() * 30;
        const star = svg("svg", { viewBox: "-1.3 -1.3 2.6 2.6", width: size, height: size, class: "burst-star" });
        star.setAttribute("style", `--bx:${(Math.cos(angle) * distance).toFixed(0)}px;--by:${(Math.sin(angle) * distance * 0.7 - 120).toFixed(0)}px;animation-delay:${(Math.random() * 0.15).toFixed(2)}s`);
        star.append(svg("path", { d: STAR_PATH, fill: i % 3 ? "#FFD43B" : "#8CE8FF", stroke: "#fff", "stroke-width": 0.12, "stroke-linejoin": "round" }));
        host.append(star);
      }
      screen.append(host);
      later(1300, () => host.remove());
    };

    // Tocar a Stella repite la consigna; tocar a Luma da una pista.
    const makeTappable = (sprite: HTMLElement, label: LocalizedText, onTap: () => void) => {
      sprite.setAttribute("role", "button");
      sprite.setAttribute("tabindex", "0");
      sprite.setAttribute("aria-label", t(label));
      sprite.addEventListener("click", () => !locked && onTap());
      sprite.addEventListener("keydown", (event) => {
        if ((event.key === "Enter" || event.key === " ") && !locked) {
          event.preventDefault();
          onTap();
        }
      });
    };
    makeTappable(stella, { es: "Stella: repetir la consigna", en: "Stella: repeat the instructions" }, () => {
      setPose(stella, "pointing");
      setMood(stella, "surprised");
      sound.play("tap");
      say(view?.prompt ?? level.instruction, "hint");
      armIdle();
    });
    // Tras un rato sin actividad a Luma se le enciende un foquito (ver `armIdle`): se le puede pedir una pista.
    luma.append(h("span", { class: "hint-badge", "aria-hidden": "true" }, lightBulb()));
    makeTappable(luma, { es: "Luma: pedir una pista", en: "Luma: ask for a hint" }, () => {
      if (!view) return;
      setPose(luma, "pointing");
      setMood(luma, "surprised");
      sound.play("hint");
      say(view.hint, "hint", "luma");
      armIdle();
    });

    const renderProgress = () => {
      const current = Math.min(session.round + 1, session.totalRounds);
      progress.setAttribute("aria-label", t({ es: `Ronda ${current} de ${session.totalRounds}`, en: `Round ${current} of ${session.totalRounds}` }));
      progress.replaceChildren();
      for (let i = 0; i < session.totalRounds; i++) {
        const state = i < session.round ? "done" : i === session.round ? "current" : "next";
        const dot = h("span", { class: `round-dot is-${state}` });
        if (state === "done") {
          const star = svg("svg", { viewBox: "-1.3 -1.3 2.6 2.6", width: 40, height: 40, "aria-hidden": "true" });
          star.append(svg("path", { d: STAR_PATH, fill: "#FFD43B", stroke: "#FFD43B", "stroke-width": 0.25, "stroke-linejoin": "round" }));
          dot.append(star);
        } else if (state === "current") {
          dot.textContent = String(i + 1);
        }
        progress.append(dot);
      }
    };

    const startRound = () => {
      view = factory.create(session.round, ctx);
      boardHost.replaceChildren(view.layer);
      checkActions.hidden = view.mode !== "check";
      yesNoActions.hidden = view.mode !== "yesno";
      window.clearTimeout(restoreTimer);
      instructionText = t(view.prompt ?? level.instruction);
      instruction.textContent = instructionText;
      instruction.className = "hud-instruction";
      face.src = "assets/characters/stella-happy.png";
      restPoses();
      react("happy", "happy");
      renderProgress();
      locked = false;
      armIdle();
    };

    const finish = () => {
      const score = session.score;
      const passed = score >= level.completion.value;
      const before = app.progress?.get(level.id);
      const wasCompleted = !!before && before.levelVersion === level.version && before.completed;
      app.progress?.record({
        levelId: level.id,
        levelVersion: level.version,
        completed: passed,
        bestScore: score,
        attemptsUsed: 1,
        lastDurationMs: Math.round(performance.now() - startedAt),
        updatedAtEpochMs: Date.now()
      });
      window.clearTimeout(idleTimer);
      app.go(rewardScreen({ constellationId, levelId: level.id, color, stars: session.starsEarned, passed, newlyLit: passed && !wasCompleted }));
    };

    const afterRound = (result: RoundResult, delay: number) => {
      renderProgress();
      // Al final de la ronda corren hacia la siguiente (o hacia la recompensa).
      later(delay - 560, dash);
      later(delay, () => (result.levelFinished ? finish() : startRound()));
    };

    const answer = (choice?: boolean) => {
      if (!view || locked) return;
      armIdle();
      const correct = view.evaluate(choice);
      if (correct === null) {
        say({ es: "Primero mueve piezas", en: "First move some pieces" }, "hint");
        sound.play("tap");
        return;
      }
      const result = session.submit(correct);
      if (result.outcome === "correct") {
        locked = true;
        say(feedback.success, "success");
        setPoses("celebrating", "celebrating");
        react("joy", "joy");
        burst();
        sound.play("correct");
        afterRound(result, NEXT_ROUND_MS);
      } else if (result.outcome === "retry") {
        say(feedback.retry, "retry");
        // Stella se queda pensando y Luma señala la mesa para que se mire otra vez.
        setPoses("thinking", "pointing");
        react("sad", "surprised");
        view.onWrong();
        sound.play("retry");
      } else {
        locked = true;
        say({ es: "¡Así se resuelve! Mira bien.", en: "Here is how! Take a look." }, "reveal");
        // Stella señala la respuesta y Luma la muestra con su ficha.
        setPoses("pointing", "holding");
        react("surprised", "happy");
        view.reveal();
        sound.play("reveal");
        afterRound(result, REVEAL_MS);
      }
    };

    boardHost.addEventListener("pointerdown", armIdle);
    boardHost.addEventListener("pointerup", cheerMove);
    const screen = h(
        "div",
        { class: "screen level", style: `--accent:${color}` },
        background("assets/images/bg-level.jpg"),
        stella,
        luma,
        boardHost,
        h(
          "div",
          { class: "hud-bubble" },
          h("div", { class: "hud-avatar" }, face),
          h("div", { class: "hud-text" }, h("h1", { class: "hud-title" }, t(level.title).toUpperCase()), instruction)
        ),
        progress,
        checkActions,
        yesNoActions,
        backButton(app, backToConstellation),
        soundToggle(app)
    );
    stage.append(screen);
    sound.music("play");
    startRound();
    return () => {
      timers.forEach((it) => window.clearTimeout(it));
      window.clearTimeout(restoreTimer);
      window.clearTimeout(idleTimer);
      window.clearTimeout(cheerTimer);
    };
  };
}
