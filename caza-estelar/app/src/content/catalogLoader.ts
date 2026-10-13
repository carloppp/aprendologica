import { validateCatalogWithLevels } from "./catalogValidator";
import { SET_MECHANICS, type ContentCatalog, type ValidationIssue } from "./model";
import { parseCatalog } from "./parser";

/**
 * Mecánicas instaladas en esta versión. `telescope_hunt` sigue en el contrato, pero su pantalla
 * todavía no se portó a la app TypeScript; los niveles con esa mecánica se rechazan al validar.
 */
export const INSTALLED_MECHANICS: ReadonlySet<string> = new Set(["multiple_choice", ...SET_MECHANICS]);

export type CatalogLoadResult =
  | { ok: true; catalog: ContentCatalog }
  | { ok: false; issues: ValidationIssue[] };

/** Carga el catálogo empaquetado y lo valida completo antes de activarlo. */
export async function loadBundledCatalog(url = "content/catalog.json"): Promise<CatalogLoadResult> {
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) return { ok: false, issues: [{ field: "catalog", message: `HTTP ${response.status}` }] };
    const catalog = parseCatalog(await response.text());
    const issues = validateCatalogWithLevels(catalog, INSTALLED_MECHANICS);
    return issues.length === 0 ? { ok: true, catalog } : { ok: false, issues };
  } catch {
    return { ok: false, issues: [{ field: "catalog", message: "No se pudo leer el catálogo" }] };
  }
}
