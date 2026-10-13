import type { ConstellationDefinition } from "../content/model";
import type { LevelProgress } from "./levelProgress";

export interface ConstellationStar {
  levelId: string;
  completed: boolean;
}

/**
 * Estado visual de una constelación (PWA_MIGRATION.md §Navegación): estrella encendida si su nivel
 * está completado, y un tramo entre estrellas consecutivas solo cuando ambas lo están. La
 * constelación es un anillo: la última estrella también se une con la primera.
 * El progreso nunca bloquea el acceso.
 */
export function constellationStars(
  constellation: ConstellationDefinition,
  progress: Record<string, LevelProgress>
): { stars: ConstellationStar[]; links: [number, number][] } {
  const stars = [...constellation.levels]
    .sort((a, b) => a.order - b.order)
    .map((level) => {
      const entry = progress[level.id];
      const completed = !!entry && entry.levelVersion === level.version && entry.completed;
      return { levelId: level.id, completed };
    });
  const links: [number, number][] = [];
  for (let i = 1; i < stars.length; i++) {
    if (stars[i - 1]?.completed && stars[i]?.completed) links.push([i - 1, i]);
  }
  const last = stars.length - 1;
  if (last >= 2 && stars[last]?.completed && stars[0]?.completed) links.push([last, 0]);
  return { stars, links };
}
