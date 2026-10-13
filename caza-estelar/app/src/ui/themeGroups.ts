import type { LocalizedText } from "../content/model";

export type ThemeIcon = "sets" | "sorting" | "relations" | "patterns" | "sequences" | "reasoning";

/**
 * Selector general de `LÓGICA Y CONJUNTOS` (guía 2D `navegacion/logic-sets-theme-selector-v2`):
 * seis estrellas grandes e independientes en dos filas. Cada grupo apunta a una constelación del
 * catálogo por `id`; si el catálogo publicado aún no la trae, la estrella se marca "pronto".
 */
export interface ThemeGroup {
  constellationId: string;
  label: LocalizedText;
  color: string;
  icon: ThemeIcon;
}

export const THEME_TITLE: LocalizedText = { es: "LÓGICA Y CONJUNTOS", en: "LOGIC AND SETS" };

export const THEME_GROUPS: readonly ThemeGroup[] = [
  { constellationId: "conjuntos", label: { es: "CONJUNTOS", en: "SETS" }, color: "#38E1FF", icon: "sets" },
  { constellationId: "clasificacion", label: { es: "CLASIFICACIÓN", en: "SORTING" }, color: "#FF6B6E", icon: "sorting" },
  { constellationId: "relaciones", label: { es: "RELACIONES", en: "RELATIONS" }, color: "#4FE36E", icon: "relations" },
  { constellationId: "patrones", label: { es: "PATRONES", en: "PATTERNS" }, color: "#B56BF5", icon: "patterns" },
  { constellationId: "secuencias", label: { es: "SECUENCIAS", en: "SEQUENCES" }, color: "#FFD43B", icon: "sequences" },
  { constellationId: "razonamiento", label: { es: "RAZONAMIENTO", en: "REASONING" }, color: "#3FA6FF", icon: "reasoning" }
];

/** Centro de cada estrella del selector (3 columnas × 2 filas). */
export const THEME_LAYOUT: readonly { x: number; y: number }[] = [
  { x: 470, y: 335 },
  { x: 960, y: 335 },
  { x: 1450, y: 335 },
  { x: 470, y: 740 },
  { x: 960, y: 740 },
  { x: 1450, y: 715 }
];

/**
 * Posiciones de las seis estrellas de una constelación, en orden de nivel. Forman un anillo para
 * que los tramos entre niveles consecutivos no se crucen.
 */
export const CONSTELLATION_LAYOUT: readonly { x: number; y: number }[] = [
  { x: 640, y: 330 },
  { x: 1180, y: 300 },
  { x: 1560, y: 520 },
  { x: 1330, y: 800 },
  { x: 820, y: 810 },
  { x: 450, y: 600 }
];
