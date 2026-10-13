import { h } from "./dom";

export type Character = "stella" | "luma";
export type Mood = "happy" | "joy" | "surprised" | "sad";
/** Poses recortadas de `guia-visual-2d/personajes/poses` (todas miran a la derecha). */
export type Pose = "pointing" | "holding" | "thinking" | "celebrating" | "running";

const NAMES: Record<Character, string> = { stella: "Stella", luma: "Luma" };
const POSES: readonly Pose[] = ["pointing", "holding", "thinking", "celebrating", "running"];

function poseSource(who: Character, pose: Pose): string {
  return `assets/characters/poses/${who}-${pose}.webp`;
}

/**
 * Personaje de cuerpo entero. `setPose` cambia el dibujo y `setMood` dispara una reacción
 * animada. Luma está a la derecha de la escena, así que se refleja para mirar hacia la mesa.
 */
export function characterSprite(who: Character, pose: Pose = "pointing", extraClass = ""): HTMLElement {
  return h(
    "div",
    { class: `character character-${who} ${extraClass}`.trim(), "data-mood": "happy", "data-pose": pose },
    h("img", { src: poseSource(who, pose), alt: NAMES[who], draggable: "false" })
  );
}

export function setPose(sprite: HTMLElement, pose: Pose): void {
  if (sprite.dataset.pose === pose) return;
  const who = sprite.classList.contains("character-luma") ? "luma" : "stella";
  sprite.dataset.pose = pose;
  sprite.querySelector("img")!.src = poseSource(who, pose);
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
    for (const pose of POSES) new Image().src = poseSource(who, pose);
  }
}
