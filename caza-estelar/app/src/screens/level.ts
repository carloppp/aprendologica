import type { Screen } from "../app";
import { sound } from "../audio/sound";
import { findLevel, PATTERN_MECHANICS, type LevelDefinition, type LocalizedText, type RoundDifficulty } from "../content/model";
import { planRounds, shuffled } from "../gameplay/roundPlan";
import { RoundSession, type RoundResult } from "../gameplay/roundSession";
import { starsForScore } from "../progress/levelProgress";
import { characterFace, characterSprite, setMood, setPose as applyPose, type Character, type Mood, type Pose } from "../ui/characters";
import { h, STAR_PATH, svg } from "../ui/dom";
import { icon } from "../ui/icons";
import { paintedLights } from "../ui/scenery";
import { background, backButton, soundToggle } from "./common";
import { constellationScreen } from "./constellation";
import { copyRound, createRound, fillRound, resetWalker, spotRound, unitRound } from "./mechanics/bridge";
import { bracesRound } from "./mechanics/braces";
import { choiceRound } from "./mechanics/choice";
import { describeRound } from "./mechanics/describe";
import { diagramRound } from "./mechanics/diagram";
import { differenceRound } from "./mechanics/difference";
import { groupRound } from "./mechanics/group";
import { intersectionRound } from "./mechanics/intersection";
import { kindRound } from "./mechanics/kind";
import { membershipRound } from "./mechanics/membership";
import { selectRound } from "./mechanics/select";
import { sortDiscoverRound, sortGroupsRound, sortRuleRound, sortTypeRound } from "./mechanics/sorting";
import { subsetRound } from "./mechanics/subset";
import type { MechanicContext, RoundView } from "./mechanics/types";
import { unionRound } from "./mechanics/union";
import { rewardScreen } from "./reward";

const NEXT_ROUND_MS = 1500;
const REVEAL_MS = 2600;
const IDLE_MS = 9000;
/** Tiempo que saltan Stella y Luma al llegar al portal antes de la siguiente ronda. */
const ARRIVAL_CHEER_MS = 1100;

interface RoundFactory {
  count: number;
  attempts: number;
  create: (index: number, ctx: MechanicContext) => RoundView;
}

/** Rondas jugadas en la partida anterior de cada nivel, para que REPETIR traiga otras. */
const lastPlayed = new Map<string, number[]>();

/**
 * Sortea las rondas de una partida en el banco del nivel (de fácil a difícil) y baraja sus piezas,
 * así dos jugadores, o dos partidas seguidas, casi nunca ven la misma pregunta.
 */
function planOf<T extends { difficulty: RoundDifficulty }>(levelId: string, bank: readonly T[], perPlay: number, mix: (round: T) => T): T[] {
  const indices = planRounds(bank, perPlay, Math.random, new Set(lastPlayed.get(levelId) ?? []));
  lastPlayed.set(levelId, indices);
  return indices.map((i) => mix(bank[i]!));
}

const mixed = <T>(items: readonly T[]) => shuffled(items, Math.random);

/** Rondas de la mecánica del nivel; `undefined` si la mecánica no tiene pantalla en esta versión. */
function roundFactory(level: LevelDefinition): RoundFactory | undefined {
  const config = level.mechanic.config;
  const from = <T>(rounds: T[], create: (round: T, ctx: MechanicContext) => RoundView): RoundFactory => ({
    count: rounds.length,
    attempts: "attempts" in config ? config.attempts : 1,
    create: (i, ctx) => create(rounds[i]!, ctx)
  });
  switch (config.kind) {
    case "set_select":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, pieces: mixed(r.pieces) })), selectRound);
    case "set_membership":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, set: mixed(r.set) })), membershipRound);
    case "set_subset":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, set: mixed(r.set), groups: mixed(r.groups.map(mixed)) })), subsetRound);
    case "set_intersection":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, pieces: mixed(r.pieces) })), intersectionRound);
    case "set_union":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, a: mixed(r.a), b: mixed(r.b) })), unionRound);
    case "set_difference":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, a: mixed(r.a), b: mixed(r.b) })), differenceRound);
    case "set_group":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, pieces: mixed(r.pieces) })), groupRound);
    case "set_diagram":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, pieces: mixed(r.pieces) })), diagramRound);
    case "set_braces":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, set: mixed(r.set) })), bracesRound);
    case "set_describe":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, set: mixed(r.set), options: mixed(r.options) })), describeRound);
    case "set_kind":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => (r.infinite ? r : { ...r, set: mixed(r.set) })), kindRound);
    case "set_operation":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, a: mixed(r.a), b: mixed(r.b) })), (r, ctx) => unionRound(r, ctx, r.op));
    case "pattern_copy":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => r), copyRound);
    case "pattern_fill":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => r), fillRound);
    case "pattern_spot":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => r), spotRound);
    case "pattern_unit":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => r), unitRound);
    case "pattern_create":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, palette: mixed(r.palette) })), createRound);
    case "sort_groups":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, pieces: mixed(r.pieces) })), sortGroupsRound);
    case "sort_type":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, items: mixed(r.items) })), sortTypeRound);
    case "sort_rule":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, pieces: mixed(r.pieces) })), sortRuleRound);
    case "sort_discover":
      return from(planOf(level.id, config.rounds, config.roundsPerPlay, (r) => ({ ...r, group: mixed(r.group), others: mixed(r.others) })), sortDiscoverRound);
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

/**
 * Escena del nivel: la mesa holográfica del observatorio (CONJUNTOS) o el puente de las islas
 * flotantes (PATRONES). En el puente, las poses genéricas se cambian por las del cruce.
 */
type Scene = "table" | "bridge";

const BRIDGE_POSES: Record<Character, Partial<Record<Pose, Pose>>> = {
  stella: { pointing: "ready", holding: "ready", presenting: "ready", waving: "ready", celebrating: "arrive", thinking: "balance", running: "step-right" },
  luma: { holding: "offer", pointing: "offer", arranging: "offer", clapping: "cheer", celebrating: "cheer", asking: "hint" }
};

/**
 * Pose de reposo de Stella y Luma en cada nivel de CLASIFICACIÓN, elegida según lo que se trabaja
 * (guía 2D `personajes/poses-clasificacion-v1`):
 * - `sort-type`: Stella con dos pelotas iguales; Luma con lupa (comparar, investigar).
 * - `sort-color`: Stella señala con su estrella; Luma carga figuras de colores.
 * - `sort-shape`: Stella encaja un triángulo en su marco; Luma con una pelota.
 * - `sort-size`: Stella con una estrella gigante; Luma con estrellas que crecen.
 * - `sort-rule`: Stella con pelota y ✓; Luma con ✓ y ✗ (cumple o no cumple).
 * - `sort-discover`: Luma sentado ordenando bloques (la de Stella no se usa: sus figuras quedan flotando).
 */
const LEVEL_POSES: Record<string, { stella: Pose; luma: Pose }> = {
  "clasificacion-color": { stella: "sort-color", luma: "sort-color" },
  "clasificacion-forma": { stella: "sort-shape", luma: "sort-shape" },
  "clasificacion-tamano": { stella: "sort-size", luma: "sort-size" },
  // Cosas del mismo tipo: Stella muestra dos iguales y Luma ordena sus bloques.
  "clasificacion-tipo": { stella: "sort-type", luma: "sort-discover" },
  "clasificacion-dos": { stella: "sort-rule", luma: "sort-rule" },
  // Stella muestra dos pelotas iguales (lo que tienen en común) y Luma investiga con lupa la regla.
  "clasificacion-regla": { stella: "sort-type", luma: "sort-type" }
};

function sceneOf(level: LevelDefinition): Scene {
  return (PATTERN_MECHANICS as readonly string[]).includes(level.mechanic.type) ? "bridge" : "table";
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
    const scene = sceneOf(level);
    // CLASIFICACIÓN se juega como la mesa, pero sobre la plataforma de las islas flotantes.
    const sky = level.mechanic.type.startsWith("sort_");
    // En CLASIFICACIÓN, pose de reposo de cada personaje según lo que se trabaja (ver `LEVEL_POSES`).
    const restPose = LEVEL_POSES[level.id];
    const setPose = (sprite: HTMLElement, pose: Pose) => {
      const who: Character = sprite.classList.contains("character-luma") ? "luma" : "stella";
      applyPose(sprite, scene === "bridge" ? BRIDGE_POSES[who][pose] ?? pose : pose);
    };
    const feedback = feedbackOf(level);
    const startedAt = performance.now();
    const timers: number[] = [];
    let locked = false;
    let view: RoundView | undefined;

    // Stella señala la mesa y Luma sostiene una ficha.
    const stella = characterSprite("stella", scene === "bridge" ? "ready" : "pointing");
    const luma = characterSprite("luma", scene === "bridge" ? "offer" : "holding");
    const face = characterFace("stella", "happy");
    let idleTimer = 0;
    const instruction = h("p", { class: "hud-instruction", role: "status", "aria-live": "polite" });
    let instructionText = "";
    let restoreTimer = 0;
    const progress = h("div", { class: "round-progress", role: "img" });
    // El tablero se dibuja en coordenadas 1920×1080 y se reduce con CSS; el puntero convierte sus
    // posiciones con este mismo elemento, así que arrastrar sigue siendo exacto.
    const boardHost = h("div", { class: "board-host" });
    const ctx: MechanicContext = { stage: boardHost, t, enabled: () => !locked, submit: () => answer() };

    // Botones redondos abajo a la derecha, debajo de Luma: cheque y reiniciar (cheque y equis en PERTENENCIA).
    const answerButton = (kind: "check" | "yes" | "no", label: LocalizedText, onclick: () => void) =>
      h(
        "button",
        { class: `round-button answer-${kind}`, type: "button", "data-sound": "none", "aria-label": t(label), onclick: () => !locked && onclick() },
        icon(kind === "no" ? "cross" : "check", 96)
      );
    const resetButton = h(
      "button",
      { class: "round-button answer-reset", type: "button", "aria-label": t({ es: "Empezar de nuevo", en: "Start over" }), onclick: () => {
        if (locked) return;
        view?.reset();
        // Luma se agacha a reacomodar las piezas.
        setPose(luma, "arranging");
        window.clearTimeout(cheerTimer);
        cheerTimer = window.setTimeout(() => !locked && restPoses(), 900);
      } },
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

    /**
     * En CONJUNTOS (la mesa) reaccionan los dos a lo que hace el estudiante. En el puente de PATRONES
     * solo reacciona Luma: Stella se queda lista en la entrada y solo se mueve para cruzar al acertar.
     */
    const stellaMoves = scene === "table";
    const stellaRest: Pose = scene === "bridge" ? "ready" : "pointing";
    const lumaPose = (pose: Pose) => setPose(luma, pose);
    const stellaPose = (pose: Pose) => stellaMoves && setPose(stella, pose);
    /** Poses de reposo, distintas en cada ronda: Stella señala la mesa o muestra su ficha; Luma sostiene su estrella o señala. */
    const restPoses = () => {
      stellaPose(restPose?.stella ?? (session.round % 2 === 0 ? "pointing" : "holding"));
      lumaPose(restPose?.luma ?? (session.round % 2 === 0 ? "holding" : "pointing"));
    };
    /** Reacción breve al mover una pieza: Luma aplaude (en la mesa, en las rondas impares celebra Stella). */
    let cheerTimer = 0;
    const cheerMove = () => {
      if (locked) return;
      window.clearTimeout(cheerTimer);
      const watcher = stellaMoves && session.round % 2 === 1 ? stella : luma;
      setPose(watcher, watcher === luma ? "clapping" : "celebrating");
      setMood(watcher, "surprised");
      cheerTimer = window.setTimeout(() => !locked && restPoses(), 700);
    };
    /** Entre rondas, corren hacia la siguiente (en el puente, Stella ya cruzó caminando: ver `celebrate`). */
    const dash = () => {
      if (scene === "bridge") return;
      for (const sprite of [stella, luma]) {
        setPose(sprite, "running");
        sprite.classList.add("is-dashing");
      }
      later(560, () => [stella, luma].forEach((sprite) => sprite.classList.remove("is-dashing")));
    };
    /** La cara de Stella en el globo cambia de expresión; en la mesa, también su cuerpo. */
    const react = (stellaMood: Mood, lumaMood: Mood) => {
      face.src = `assets/characters/stella-${stellaMood}.png`;
      if (stellaMoves) setMood(stella, stellaMood);
      setMood(luma, lumaMood);
    };
    /** Si el estudiante no interactúa por un rato, Luma se pone a pensar y se le enciende el foquito. */
    const armIdle = () => {
      window.clearTimeout(idleTimer);
      luma.classList.remove("is-idle");
      idleTimer = window.setTimeout(() => {
        if (locked) return;
        setPose(luma, "thinking");
        stellaPose("thinking");
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
    // En el puente Stella no se toca: está sobre las baldosas y estorbaría al quitar una pieza.
    if (scene === "table") {
      makeTappable(stella, { es: "Stella: repetir la consigna", en: "Stella: repeat the instructions" }, () => {
        stellaPose("presenting");
        setMood(stella, "surprised");
        sound.play("tap");
        say(view?.prompt ?? level.instruction, "hint");
        armIdle();
      });
    }
    // Tras un rato sin actividad a Luma se le enciende un foquito (ver `armIdle`): se le puede pedir una pista.
    luma.append(h("span", { class: "hint-badge", "aria-hidden": "true" }, lightBulb()));
    makeTappable(luma, { es: "Luma: pedir una pista", en: "Luma: ask for a hint" }, () => {
      if (!view) return;
      setPose(luma, "asking");
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

    let roundTimer = 0;
    const startRound = (intro = false) => {
      resetWalker(stella);
      view = factory.create(session.round, ctx);
      boardHost.replaceChildren(view.layer);
      checkActions.hidden = view.mode !== "check";
      yesNoActions.hidden = view.mode !== "yesno";
      window.clearTimeout(restoreTimer);
      instructionText = t(view.prompt ?? level.instruction);
      instruction.textContent = instructionText;
      instruction.className = "hud-instruction";
      face.src = "assets/characters/stella-happy.png";
      // En la mesa, Stella presenta el reto de cada ronda (al entrar, antes saluda); en el puente se
      // queda lista. Luma toma su pose de reposo.
      window.clearTimeout(roundTimer);
      setPose(stella, stellaMoves ? (intro ? "waving" : "presenting") : stellaRest);
      if (stellaMoves && intro) later(1100, () => !locked && setPose(stella, "presenting"));
      lumaPose(restPose?.luma ?? (session.round % 2 === 0 ? "holding" : "pointing"));
      roundTimer = window.setTimeout(() => !locked && restPoses(), intro ? 2500 : 1400);
      react("happy", "happy");
      renderProgress();
      locked = false;
      armIdle();
    };

    const finish = () => {
      const score = session.score;
      const passed = score >= level.completion.value;
      const before = app.progress?.get(level.id);
      // La estrella se anima en la constelación cada vez que brilla más que antes.
      const starsBefore = before && before.levelVersion === level.version ? starsForScore(before.bestScore) : 0;
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
      app.go(rewardScreen({ constellationId, levelId: level.id, color, stars: session.starsEarned, passed, newlyLit: session.starsEarned > starsBefore }));
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
        say(view.incomplete ?? { es: "Primero mueve piezas", en: "First move some pieces" }, "hint");
        sound.play("tap");
        return;
      }
      const result = session.submit(correct);
      if (result.outcome === "correct") {
        locked = true;
        say(feedback.success, "success");
        lumaPose("clapping");
        stellaPose("celebrating");
        react("joy", "joy");
        burst();
        sound.play("correct");
        // En el puente, Stella cruza hasta el portal; al llegar, los dos saltan de alegría y luego
        // empieza la siguiente ronda.
        const walk = view.celebrate ? view.celebrate(stella) : 0;
        if (walk > 0) {
          later(walk, () => {
            // Los dos usan la celebración de CONJUNTOS (brazos arriba) con el salto de alegría.
            applyPose(stella, "celebrating");
            applyPose(luma, "celebrating");
            setMood(stella, "joy");
            setMood(luma, "joy");
            sound.play("portal");
          });
        }
        afterRound(result, walk > 0 ? walk + ARRIVAL_CHEER_MS : NEXT_ROUND_MS);
      } else if (result.outcome === "retry") {
        say(feedback.retry, "retry");
        // Stella se queda pensando y Luma señala la mesa para que se mire otra vez.
        lumaPose("asking");
        stellaPose("thinking");
        react("sad", "surprised");
        view.onWrong();
        sound.play("retry");
      } else {
        locked = true;
        say({ es: "¡Así se resuelve! Mira bien.", en: "Here is how! Take a look." }, "reveal");
        // Stella señala la respuesta y Luma la acomoda en la mesa.
        lumaPose("arranging");
        stellaPose("pointing");
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
        { class: `screen level is-${scene}${sky ? " is-sky" : ""}`, style: `--accent:${color}` },
        ...(scene === "bridge"
          ? [
              background("assets/images/bg-patterns.jpg"),
              // Estrellas doradas del cielo y de las columnas de las islas (coordenadas de la ilustración).
              paintedLights({
                stars: [[320, 68], [1238, 107], [1588, 45], [1390, 565], [112, 125], [426, 155], [800, 250], [1190, 160], [485, 410], [1523, 150]],
                twinkles: [[550, 232], [1010, 208], [998, 352], [470, 60], [1015, 45], [1300, 300], [880, 120], [1110, 495]]
              })
            ]
          : sky
            ? [background("assets/images/bg-sorting.jpg")]
            : [
              background("assets/images/bg-level.jpg"),
              // Luces del fondo (coordenadas de la ilustración): constelaciones del ventanal que lanzan
              // destellos, estrellitas del cielo que titilan y las estrellas doradas de las columnas.
              paintedLights({
                stars: [[630, 167], [577, 205], [675, 232], [997, 112], [943, 140], [1045, 150], [962, 210], [1027, 210], [1340, 172], [1405, 160], [1385, 193], [1305, 232], [1360, 243]],
                lamps: [[92, 140], [1577, 140]],
                lampRadius: 95,
                twinkles: [[577, 40], [755, 40], [445, 80], [703, 92], [1218, 75], [1097, 45], [350, 185], [765, 178], [272, 215], [462, 247], [890, 243], [1220, 200], [720, 280], [1082, 263], [1037, 295], [618, 302]]
              })
            ]),
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
    // Cada constelación suena a su lugar: el observatorio (CONJUNTOS) o las islas flotantes (PATRONES).
    sound.music(scene === "bridge" || sky ? "islands" : "observatory");
    startRound(true);
    return () => {
      timers.forEach((it) => window.clearTimeout(it));
      window.clearTimeout(restoreTimer);
      window.clearTimeout(idleTimer);
      window.clearTimeout(cheerTimer);
      window.clearTimeout(roundTimer);
    };
  };
}
