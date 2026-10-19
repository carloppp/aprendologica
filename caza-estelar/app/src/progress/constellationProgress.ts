import type { ConstellationDefinition } from "../content/model";
import { starsForScore, type LevelProgress } from "./levelProgress";

export interface ConstellationStar {
  levelId: string;
  /** Estrellas obtenidas en el nivel (0 a 3): definen cuánto brilla su estrella. */
  stars: number;
  /** Nivel aprobado (el criterio del contrato v2). */
  completed: boolean;
}

export interface ConstellationLink {
  from: number;
  to: number;
  /** 2: tramo visible pero suave; 3: tramo completo. */
  strength: 2 | 3;
}

/** Mínimo de estrellas en ambos extremos para que aparezca un tramo. */
export const LINK_MIN_STARS = 2;

/**
 * Estado visual de una constelación. Cada estrella brilla según las estrellas obtenidas en su
 * nivel: 0 apagada, 1 luz muy tenue, 2 luz más fuerte, 3 brillo completo. Un tramo entre estrellas
 * consecutivas aparece cuando ambas tienen al menos 2 estrellas; es suave si alguna tiene 2 y
 * completo si ambas tienen 3. Si la constelación es un anillo (`closed`), la última también se une
 * con la primera. El progreso nunca bloquea el acceso.
 */
export function constellationStars(
  constellation: ConstellationDefinition,
  progress: Record<string, LevelProgress>,
  closed = true
): { stars: ConstellationStar[]; links: ConstellationLink[] } {
  const stars = [...constellation.levels]
    .sort((a, b) => a.order - b.order)
    .map((level) => {
      const entry = progress[level.id];
      const current = !!entry && entry.levelVersion === level.version;
      return {
        levelId: level.id,
        stars: current ? starsForScore(entry.bestScore) : 0,
        completed: current && entry.completed
      };
    });
  const links: ConstellationLink[] = [];
  const link = (from: number, to: number) => {
    const strength = Math.min(stars[from]!.stars, stars[to]!.stars);
    if (strength >= LINK_MIN_STARS) links.push({ from, to, strength: strength >= 3 ? 3 : 2 });
  };
  for (let i = 1; i < stars.length; i++) link(i - 1, i);
  if (closed && stars.length >= 3) link(stars.length - 1, 0);
  return { stars, links };
}
