/**
 * Progreso por nivel (contrato v2). El cliente guarda `bestScore`; porcentaje y estrellas se
 * derivan de él (rangos de `DOCUMENTACION_PROYECTO.md` §2.8). Port de `LevelProgress` en
 * `ContentModelsV2.kt`.
 */
export interface LevelProgress {
  levelId: string;
  levelVersion: number;
  completed: boolean;
  bestScore: number;
  attemptsUsed: number;
  lastDurationMs: number;
  updatedAtEpochMs: number;
}

export function percentage(progress: LevelProgress): number {
  return Math.min(100, Math.max(0, progress.bestScore));
}

export function stars(progress: LevelProgress): number {
  return starsForScore(percentage(progress));
}

/** Rangos de estrellas: 90 o más, 3; 60 o más, 2; 30 o más, 1. */
export function starsForScore(value: number): number {
  if (value >= 90) return 3;
  if (value >= 60) return 2;
  if (value >= 30) return 1;
  return 0;
}

export function passed(progress: LevelProgress): boolean {
  return stars(progress) >= 2;
}

/** Mezcla que nunca reduce logros: conserva el mejor puntaje y una finalización ya obtenida. */
export function mergeProgress(current: LevelProgress | undefined, incoming: LevelProgress): LevelProgress {
  if (!current || current.levelVersion !== incoming.levelVersion) return incoming;
  return {
    ...incoming,
    completed: current.completed || incoming.completed,
    bestScore: Math.max(current.bestScore, incoming.bestScore),
    attemptsUsed: current.attemptsUsed + incoming.attemptsUsed,
    updatedAtEpochMs: Math.max(current.updatedAtEpochMs, incoming.updatedAtEpochMs)
  };
}
