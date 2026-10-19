import { h } from "./dom";

export type Character = "stella" | "luma";
export type Mood = "happy" | "joy" | "surprised" | "sad";
/** Poses recortadas de `guia-visual-2d/personajes/poses`. */
export type Pose =
  | "pointing"
  | "holding"
  | "thinking"
  | "celebrating"
  | "running"
  // Solo Stella.
  | "presenting"
  | "waving"
  | "observing"
  // Solo Luma.
  | "clapping"
  | "arranging"
  | "asking"
  // Puente de PATRONES (guía 2D `personajes/poses-patrones-puente`). Stella cruza el puente…
  | "ready"
  | "step-left"
  | "step-right"
  | "balance"
  | "jump"
  | "arrive"
  // …y Luma la ayuda desde fuera.
  | "offer"
  | "hint"
  | "cheer"
  // CLASIFICACIÓN (guía 2D `personajes/poses-clasificacion-v1`): una pose de cada uno por nivel.
  | "sort-type"
  | "sort-color"
  | "sort-shape"
  | "sort-size"
  | "sort-rule"
  | "sort-discover";

const NAMES: Record<Character, string> = { stella: "Stella", luma: "Luma" };
const SHARED: readonly Pose[] = [
  "pointing",
  "holding",
  "thinking",
  "celebrating",
  "running",
  "sort-type",
  "sort-color",
  "sort-shape",
  "sort-size",
  "sort-rule"
];
const POSES: Record<Character, readonly Pose[]> = {
  // "observing" (Stella mirando hacia abajo) queda reservada para otros niveles.
  stella: [...SHARED, "presenting", "waving", "ready", "step-left", "step-right", "balance", "jump", "arrive"],
  // "sort-discover" (sentado con bloques) solo es de Luma: la de Stella deja sus figuras flotando.
  luma: [...SHARED, "clapping", "arranging", "asking", "offer", "hint", "cheer", "sort-discover"]
};
/** Poses dibujadas mirando a la izquierda; el resto mira a la derecha. */
const FACING_LEFT = new Set(["stella-observing", "luma-arranging", "luma-hint"]);

/**
 * Cada personaje mira hacia la mesa: Stella (a la izquierda) hacia la derecha y Luma (a la
 * derecha) hacia la izquierda. Se refleja el dibujo cuando la pose mira al lado contrario.
 */
function mirrored(who: Character, pose: Pose): boolean {
  const facesLeft = FACING_LEFT.has(`${who}-${pose}`);
  return who === "stella" ? facesLeft : !facesLeft;
}

function poseSource(who: Character, pose: Pose): string {
  return `assets/characters/poses/${who}-${pose}.webp`;
}

/**
 * Personaje de cuerpo entero. `setPose` cambia el dibujo y `setMood` dispara una reacción
 * animada. El dibujo se refleja según la pose para que siempre mire hacia la mesa.
 */
export function characterSprite(who: Character, pose: Pose = "pointing", extraClass = ""): HTMLElement {
  return h(
    "div",
    { class: `character character-${who} ${extraClass}`.trim(), "data-mood": "happy", "data-pose": pose, "data-mirrored": String(mirrored(who, pose)) },
    h("img", { src: poseSource(who, pose), alt: NAMES[who], draggable: "false" })
  );
}

/** Cambia la pose; si el personaje no tiene esa pose, la ignora. */
export function setPose(sprite: HTMLElement, pose: Pose): void {
  if (sprite.dataset.pose === pose) return;
  const who: Character = sprite.classList.contains("character-luma") ? "luma" : "stella";
  if (!POSES[who].includes(pose)) return;
  sprite.dataset.pose = pose;
  sprite.dataset.mirrored = String(mirrored(who, pose));
  sprite.querySelector("img")!.src = poseSource(who, pose);
}

/**
 * Cambia la pose con un fundido cruzado: la pose anterior se desvanece encima mientras la nueva
 * aparece, sin perder el vaivén. Espera a que la imagen nueva esté decodificada para no parpadear.
 */
export function fadeToPose(sprite: HTMLElement, pose: Pose, duration = 450): void {
  const who: Character = sprite.classList.contains("character-luma") ? "luma" : "stella";
  if (sprite.dataset.pose === pose || !POSES[who].includes(pose)) return;
  const img = sprite.querySelector<HTMLImageElement>("img:not(.pose-ghost)")!;
  const next = new Image();
  next.src = poseSource(who, pose);
  void next.decode().catch(() => undefined).then(() => {
    const ghost = img.cloneNode() as HTMLImageElement;
    ghost.classList.add("pose-ghost");
    ghost.style.transform = sprite.dataset.mirrored === "true" ? "scaleX(-1)" : "none";
    sprite.append(ghost);
    // El fantasma sigue el mismo vaivén que la imagen original.
    const phase = img.getAnimations()[0]?.currentTime ?? null;
    ghost.getAnimations().forEach((animation) => (animation.currentTime = phase));
    ghost.animate([{ opacity: 1 }, { opacity: 0, scale: "0.97" }], { duration, easing: "ease-in", fill: "forwards" }).finished.then(() => ghost.remove(), () => ghost.remove());
    setPose(sprite, pose);
    img.animate([{ opacity: 0, scale: "0.96" }, { opacity: 1, scale: "1" }], { duration, easing: "ease-out" });
  });
}

/** Cara del personaje con una expresión, para el globo de diálogo. */
export function characterFace(who: Character, mood: Mood): HTMLImageElement {
  return h("img", { class: "character-face", src: `assets/characters/${who}-${mood}.png`, alt: "", draggable: "false" });
}

/** Cambia la reacción; la animación se reinicia aunque se repita la misma emoción. */
export function setMood(sprite: HTMLElement, mood: Mood): void {
  sprite.dataset.mood = "";
  void sprite.offsetWidth;
  sprite.dataset.mood = mood;
}

/** Precarga caras y poses para que los cambios durante el juego sean instantáneos. */
export function preloadCharacterArt(): void {
  for (const who of ["stella", "luma"] as const) {
    for (const mood of ["happy", "joy", "surprised", "sad"] as const) new Image().src = `assets/characters/${who}-${mood}.png`;
    for (const pose of POSES[who]) new Image().src = poseSource(who, pose);
  }
}
