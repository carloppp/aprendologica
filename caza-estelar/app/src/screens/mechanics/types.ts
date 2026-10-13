import type { LocalizedText } from "../../content/model";

export interface MechanicContext {
  /** Escenario 1920×1080, para convertir posiciones del puntero. */
  stage: HTMLElement;
  t: (text: LocalizedText) => string;
  /** Falso mientras se muestra una respuesta o se pasa a la siguiente ronda. */
  enabled: () => boolean;
}

/** Vista de una ronda: dibuja el tablero y evalúa la respuesta del estudiante. */
export interface RoundView {
  layer: HTMLElement;
  /** `check`: comprobar y reiniciar; `yesno`: responder sí o no. */
  mode: "check" | "yesno";
  /** Consigna propia de la ronda; si falta se usa la instrucción del nivel. */
  prompt?: LocalizedText;
  /** Pista que da Luma cuando el estudiante la toca. */
  hint: LocalizedText;
  /** `null` cuando todavía no hay nada que evaluar. */
  evaluate(choice?: boolean): boolean | null;
  onWrong(): void;
  reveal(): void;
  reset(): void;
}
