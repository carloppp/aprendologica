import type { RoundDifficulty } from "../content/model";

/** Generador de números en [0, 1); `Math.random` en el juego, uno fijo en las pruebas. */
export type Random = () => number;

/**
 * Dificultad de cada ronda de una partida de `count` rondas: empieza fácil y sube hasta difícil.
 * Con 4 rondas: 1, 2, 2, 3.
 */
export function difficultyRamp(count: number): RoundDifficulty[] {
  if (count <= 1) return [2];
  return Array.from({ length: count }, (_, i) => Math.round(1 + (2 * i) / (count - 1)) as RoundDifficulty);
}

/**
 * Elige del banco las rondas de una partida: `count` rondas distintas al azar que siguen la
 * rampa de dificultad. Si falta una dificultad usa la más cercana. Evita, mientras haya otras,
 * las rondas de `avoid` (las de la partida anterior), para que REPETIR no muestre lo mismo.
 * Devuelve índices del banco en el orden en que se juegan.
 */
export function planRounds(
  bank: readonly { difficulty: RoundDifficulty }[],
  count: number,
  random: Random,
  avoid: ReadonlySet<number> = new Set()
): number[] {
  const total = Math.min(count, bank.length);
  const used = new Set<number>();
  const plan: number[] = [];
  for (const wanted of difficultyRamp(total)) {
    const free = bank.map((_, i) => i).filter((i) => !used.has(i));
    const fresh = free.filter((i) => !avoid.has(i));
    const pool = fresh.length > 0 ? fresh : free;
    // La dificultad más cercana a la buscada entre las rondas disponibles.
    const distance = (i: number) => Math.abs(bank[i]!.difficulty - wanted);
    const best = Math.min(...pool.map(distance));
    const candidates = pool.filter((i) => distance(i) === best);
    const pick = candidates[Math.floor(random() * candidates.length)]!;
    used.add(pick);
    plan.push(pick);
  }
  return plan;
}

/** Copia barajada (Fisher–Yates); el original no cambia. */
export function shuffled<T>(items: readonly T[], random: Random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
