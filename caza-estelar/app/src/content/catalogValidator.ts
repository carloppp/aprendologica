import { isBlank, validateLevel } from "./levelValidator";
import type { ContentCatalog, LevelDefinition, ValidationIssue } from "./model";

/**
 * Valida un catálogo v2 completo: estructura, identidad, prerrequisitos, ciclos y recursos.
 * Port de `CatalogValidatorV2.kt`. La validación de cada mecánica la hace `validateLevel`,
 * que `validateCatalogWithLevels` combina antes de activar un catálogo.
 */
export const SUPPORTED_SCHEMA_VERSION = 2;
const MAX_ASSET_BYTES = 26_214_400;
const SHA256 = /^[a-f0-9]{64}$/;
const ALLOWED_MIME = {
  IMAGE: new Set(["image/png", "image/jpeg", "image/webp"]),
  AUDIO: new Set(["audio/mpeg", "audio/ogg", "audio/wav"])
} as const;

export function validateCatalog(catalog: ContentCatalog): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (field: string, message: string) => issues.push({ field, message });

  if (catalog.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    add("schemaVersion", `La app solo admite el esquema de contenido ${SUPPORTED_SCHEMA_VERSION}`);
  }
  if (catalog.revision < 1) add("revision", "La revisión del catálogo debe ser positiva");
  if (isBlank(catalog.publishedVersion)) add("publishedVersion", "Falta la versión publicada");
  if (isBlank(catalog.minimumAppVersion)) add("minimumAppVersion", "Falta la versión mínima de app");
  if (catalog.constellations.length === 0) add("constellations", "El catálogo debe contener al menos una constelación");

  const constellationIds = catalog.constellations.map((it) => it.id);
  if (constellationIds.some(isBlank) || hasDuplicates(constellationIds)) {
    add("constellations.id", "Los identificadores de constelación deben existir y ser únicos");
  }
  for (const constellation of catalog.constellations) {
    const where = `constellations.${constellation.id}`;
    if (constellation.version < 1) add(`${where}.version`, "La versión de la constelación debe ser positiva");
    if (isBlank(constellation.area)) add(`${where}.area`, "La constelación necesita un área curricular");
    if (isBlank(constellation.title.es)) add(`${where}.title.es`, "Falta el título de la constelación");
    if (constellation.levels.length === 0) add(`${where}.levels`, "Una constelación publicada necesita al menos un nivel");
  }

  const assetIds = catalog.assets.map((it) => it.id);
  if (assetIds.some(isBlank) || hasDuplicates(assetIds)) {
    add("assets.id", "Los identificadores de recursos deben existir y ser únicos");
  }
  for (const asset of catalog.assets) {
    if (!asset.url.startsWith("https://")) add(`assets.${asset.id}.url`, "Los recursos remotos deben usar HTTPS");
    if (!ALLOWED_MIME[asset.type].has(asset.mimeType)) add(`assets.${asset.id}.mimeType`, "El tipo MIME no coincide con el recurso");
    if (!SHA256.test(asset.sha256)) add(`assets.${asset.id}.sha256`, "El recurso necesita un SHA-256 válido");
    if (asset.sizeBytes < 1 || asset.sizeBytes > MAX_ASSET_BYTES) {
      add(`assets.${asset.id}.sizeBytes`, "El tamaño del recurso está fuera del límite permitido");
    }
  }

  const levels = catalog.constellations.flatMap((it) => it.levels);
  const levelIds = levels.map((it) => it.id);
  if (levelIds.some(isBlank) || hasDuplicates(levelIds)) {
    add("levels.id", "Los identificadores de nivel deben existir y ser únicos en todo el catálogo");
  }
  const knownLevelIds = new Set(levelIds);
  const assetsById = new Map(catalog.assets.map((it) => [it.id, it]));
  for (const level of levels) {
    for (const missing of level.unlock.prerequisiteLevelIds.filter((id) => !knownLevelIds.has(id))) {
      add(`levels.${level.id}.unlock`, `El prerrequisito ${missing} no existe en el catálogo`);
    }
    const { promptAssetId, narrationAssetId, backgroundAssetId } = level.media;
    for (const id of [promptAssetId, narrationAssetId, backgroundAssetId]) {
      if (id !== null && !assetsById.has(id)) add(`levels.${level.id}.media`, `El recurso ${id} no existe en el catálogo`);
    }
    const typeOf = (id: string | null) => (id === null ? undefined : assetsById.get(id)?.type);
    const promptType = typeOf(promptAssetId);
    const backgroundType = typeOf(backgroundAssetId);
    const narrationType = typeOf(narrationAssetId);
    if (promptType && promptType !== "IMAGE") {
      add(`levels.${level.id}.media.promptAssetId`, "El recurso de pregunta debe ser una imagen");
    }
    if (backgroundType && backgroundType !== "IMAGE") {
      add(`levels.${level.id}.media.backgroundAssetId`, "El fondo debe ser una imagen");
    }
    if (narrationType && narrationType !== "AUDIO") {
      add(`levels.${level.id}.media.narrationAssetId`, "La narración debe ser audio");
    }
  }
  if (hasDependencyCycle(new Map(levels.map((it) => [it.id, it])))) {
    add("levels.unlock", "Los prerrequisitos contienen un ciclo");
  }
  return issues;
}

/** Validación completa antes de activar un catálogo: estructura más cada nivel con prefijo de ruta. */
export function validateCatalogWithLevels(
  catalog: ContentCatalog,
  supportedMechanics: ReadonlySet<string>
): ValidationIssue[] {
  const levelIssues = catalog.constellations
    .flatMap((it) => it.levels)
    .flatMap((level) =>
      validateLevel(level, supportedMechanics).map((issue) => ({ ...issue, field: `levels.${level.id}.${issue.field}` }))
    );
  return [...validateCatalog(catalog), ...levelIssues];
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

function hasDependencyCycle(levels: Map<string, LevelDefinition>): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    const level = levels.get(id);
    if (!level) return false;
    visiting.add(id);
    if (level.unlock.prerequisiteLevelIds.some(visit)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return [...levels.keys()].some(visit);
}
