import { starsForScore } from "../progress/levelProgress";

export type RoundOutcome = "correct" | "retry" | "reveal";

export interface RoundResult {
  outcome: RoundOutcome;
  /** La ronda terminó (acierto o intentos agotados) y la siguiente puede empezar. */
  roundFinished: boolean;
  /** Era la última ronda. */
  levelFinished: boolean;
}

/**
 * Sesión de un nivel por rondas. Un acierto al primer intento vale 1 punto; un acierto posterior,
 * medio punto; agotar los intentos, 0 y se muestra la respuesta. El puntaje 0-100 del contrato v2
 * es el porcentaje de puntos.
 */
export class RoundSession {
  private index = 0;
  private errors = 0;
  private points = 0;
  private done = false;

  constructor(
    readonly totalRounds: number,
    private readonly attemptsPerRound: number
  ) {
    if (totalRounds < 1 || attemptsPerRound < 1) throw new Error("A level needs rounds and attempts");
  }

  get round(): number {
    return this.index;
  }

  get finished(): boolean {
    return this.done;
  }

  get attemptsRemaining(): number {
    return this.attemptsPerRound - this.errors;
  }

  submit(correct: boolean): RoundResult {
    if (this.done) throw new Error("The level has already finished");
    if (correct) {
      this.points += this.errors === 0 ? 1 : 0.5;
      return this.advance("correct");
    }
    this.errors++;
    if (this.errors < this.attemptsPerRound) return { outcome: "retry", roundFinished: false, levelFinished: false };
    return this.advance("reveal");
  }

  get score(): number {
    return Math.round((100 * this.points) / this.totalRounds);
  }

  /** Estrellas de resultado con los mismos rangos que el progreso guardado. */
  get starsEarned(): number {
    return starsForScore(this.score);
  }

  private advance(outcome: RoundOutcome): RoundResult {
    this.errors = 0;
    this.index++;
    this.done = this.index >= this.totalRounds;
    return { outcome, roundFinished: true, levelFinished: this.done };
  }
}
