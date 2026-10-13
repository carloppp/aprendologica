/** Port de `MultipleChoiceSession.kt`: intentos limitados y estrellas según errores. */
export interface ChoiceAnswerResult {
  correct: boolean;
  attemptsRemaining: number;
  starsEarned: number;
  finished: boolean;
}

export class MultipleChoiceSession {
  private remaining: number;
  private done = false;

  constructor(
    private readonly correctOptionId: string,
    private readonly maximumAttempts: number,
    private readonly maximumStars: number
  ) {
    this.remaining = maximumAttempts;
  }

  get attemptsRemaining(): number {
    return this.remaining;
  }

  get finished(): boolean {
    return this.done;
  }

  submit(optionId: string): ChoiceAnswerResult {
    if (this.done) throw new Error("The activity has already finished");
    if (optionId === this.correctOptionId) {
      this.done = true;
      const errors = this.maximumAttempts - this.remaining;
      return { correct: true, attemptsRemaining: this.remaining, starsEarned: Math.max(1, this.maximumStars - errors), finished: true };
    }
    this.remaining--;
    this.done = this.remaining === 0;
    return { correct: false, attemptsRemaining: this.remaining, starsEarned: 0, finished: this.done };
  }

  /** Puntaje 0-100 del contrato v2 a partir de las estrellas obtenidas. */
  scoreFor(result: ChoiceAnswerResult): number {
    return Math.round((100 * result.starsEarned) / this.maximumStars);
  }
}
