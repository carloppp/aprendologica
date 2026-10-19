import type { LocalizedText } from "../../content/model";

export interface MechanicContext {
  /** Escenario 1920×1080, para convertir posiciones del puntero. */
  stage: HTMLElement;
  t: (text: LocalizedText) => string;
  /** Falso mientras se muestra una respuesta o se pasa a la siguiente ronda. */
  enabled: () => boolean;
  /** Comprueba la respuesta sin botón (el puente de PATRONES se revisa solo al completarse). */
  submit: () => void;
}

/** Vista de una ronda: dibuja el tablero y evalúa la respuesta del estudiante. */
export interface RoundView {
  layer: HTMLElement;
  /**
   * `check`: comprobar y reiniciar; `yesno`: responder sí o no; `auto`: sin botones, la ronda se
   * revisa sola (`MechanicContext.submit`) cuando la respuesta está completa.
   */
  mode: "check" | "yesno" | "auto";
  /** Consigna propia de la ronda; si falta se usa la instrucción del nivel. */
  prompt?: LocalizedText;
  /** Aviso cuando se comprueba antes de terminar; por defecto, "Primero mueve piezas". */
  incomplete?: LocalizedText;
  /**
   * Animación al acertar (el puente de PATRONES: Stella cruza hasta el portal). Devuelve cuánto
   * dura, para esperar antes de la siguiente ronda.
   */
  celebrate?: (stella: HTMLElement) => number;
  /** Pista que da Luma cuando el estudiante la toca. */
  hint: LocalizedText;
  /** `null` cuando todavía no hay nada que evaluar. */
  evaluate(choice?: boolean): boolean | null;
  onWrong(): void;
  reveal(): void;
  reset(): void;
}
