package com.explorax.cazaestelar.content.v2.validation

import com.explorax.cazaestelar.content.model.ContentAssetType
import com.explorax.cazaestelar.content.validation.ValidationIssue
import com.explorax.cazaestelar.content.v2.model.ContentCatalogV2
import com.explorax.cazaestelar.content.v2.model.LevelDefinition

/**
 * Valida un [ContentCatalogV2] completo: estructura, identidad, prerrequisitos, ciclos y
 * recursos. Reemplaza a `CatalogValidator`. La validación de cada mecánica la hace
 * [LevelValidator]. Ver `docs/CONTENT_SCHEMA_V2.md`.
 */
object CatalogValidatorV2 {

    const val SUPPORTED_SCHEMA_VERSION = 2
    private const val MAX_ASSET_BYTES = 26_214_400L
    private val SHA256 = Regex("^[a-f0-9]{64}$")

    fun validate(catalog: ContentCatalogV2): List<ValidationIssue> {
        val issues = mutableListOf<ValidationIssue>()

        if (catalog.schemaVersion != SUPPORTED_SCHEMA_VERSION) {
            issues += ValidationIssue("schemaVersion", "La app solo admite el esquema de contenido $SUPPORTED_SCHEMA_VERSION")
        }
        if (catalog.revision < 1) issues += ValidationIssue("revision", "La revisión del catálogo debe ser positiva")
        if (catalog.publishedVersion.isBlank()) issues += ValidationIssue("publishedVersion", "Falta la versión publicada")
        if (catalog.minimumAppVersion.isBlank()) issues += ValidationIssue("minimumAppVersion", "Falta la versión mínima de app")
        if (catalog.constellations.isEmpty()) issues += ValidationIssue("constellations", "El catálogo debe contener al menos una constelación")

        val constellationIds = catalog.constellations.map { it.id }
        if (constellationIds.any(String::isBlank) || constellationIds.distinct().size != constellationIds.size) {
            issues += ValidationIssue("constellations.id", "Los identificadores de constelación deben existir y ser únicos")
        }
        catalog.constellations.forEach { constellation ->
            val where = "constellations.${constellation.id}"
            if (constellation.version < 1) issues += ValidationIssue("$where.version", "La versión de la constelación debe ser positiva")
            if (constellation.area.value.isBlank()) issues += ValidationIssue("$where.area", "La constelación necesita un área curricular")
            if (constellation.title.es.isBlank()) issues += ValidationIssue("$where.title.es", "Falta el título de la constelación")
            if (constellation.levels.isEmpty()) issues += ValidationIssue("$where.levels", "Una constelación publicada necesita al menos un nivel")
        }

        issues += validateAssets(catalog, ::asset)

        val levels = catalog.constellations.flatMap { it.levels }
        val levelIds = levels.map { it.id }
        if (levelIds.any(String::isBlank) || levelIds.distinct().size != levelIds.size) {
            issues += ValidationIssue("levels.id", "Los identificadores de nivel deben existir y ser únicos en todo el catálogo")
        }
        val knownLevelIds = levelIds.toSet()
        val assetsById = catalog.assets.associateBy { it.id }
        levels.forEach { level ->
            level.unlock.prerequisiteLevelIds.filterNot(knownLevelIds::contains).forEach { missing ->
                issues += ValidationIssue("levels.${level.id}.unlock", "El prerrequisito $missing no existe en el catálogo")
            }
            val media = level.media
            listOfNotNull(media.promptAssetId, media.narrationAssetId, media.backgroundAssetId)
                .filterNot(assetsById::containsKey).forEach { missing ->
                    issues += ValidationIssue("levels.${level.id}.media", "El recurso $missing no existe en el catálogo")
                }
            media.promptAssetId?.let { id ->
                assetsById[id]?.let { if (it.type != ContentAssetType.IMAGE) issues += ValidationIssue("levels.${level.id}.media.promptAssetId", "El recurso de pregunta debe ser una imagen") }
            }
            media.backgroundAssetId?.let { id ->
                assetsById[id]?.let { if (it.type != ContentAssetType.IMAGE) issues += ValidationIssue("levels.${level.id}.media.backgroundAssetId", "El fondo debe ser una imagen") }
            }
            media.narrationAssetId?.let { id ->
                assetsById[id]?.let { if (it.type != ContentAssetType.AUDIO) issues += ValidationIssue("levels.${level.id}.media.narrationAssetId", "La narración debe ser audio") }
            }
        }
        if (hasDependencyCycle(levels.associateBy { it.id })) {
            issues += ValidationIssue("levels.unlock", "Los prerrequisitos contienen un ciclo")
        }
        return issues
    }

    private fun validateAssets(
        catalog: ContentCatalogV2,
        where: (String) -> String
    ): List<ValidationIssue> {
        val issues = mutableListOf<ValidationIssue>()
        val ids = catalog.assets.map { it.id }
        if (ids.any(String::isBlank) || ids.distinct().size != ids.size) {
            issues += ValidationIssue("assets.id", "Los identificadores de recursos deben existir y ser únicos")
        }
        catalog.assets.forEach { asset ->
            if (!asset.url.startsWith("https://")) issues += ValidationIssue(where("${asset.id}.url"), "Los recursos remotos deben usar HTTPS")
            val allowed = when (asset.type) {
                ContentAssetType.IMAGE -> setOf("image/png", "image/jpeg", "image/webp")
                ContentAssetType.AUDIO -> setOf("audio/mpeg", "audio/ogg", "audio/wav")
            }
            if (asset.mimeType !in allowed) issues += ValidationIssue(where("${asset.id}.mimeType"), "El tipo MIME no coincide con el recurso")
            if (!asset.sha256.matches(SHA256)) issues += ValidationIssue(where("${asset.id}.sha256"), "El recurso necesita un SHA-256 válido")
            if (asset.sizeBytes !in 1..MAX_ASSET_BYTES) issues += ValidationIssue(where("${asset.id}.sizeBytes"), "El tamaño del recurso está fuera del límite permitido")
        }
        return issues
    }

    private fun asset(suffix: String) = "assets.$suffix"

    private fun hasDependencyCycle(levels: Map<String, LevelDefinition>): Boolean {
        val visiting = mutableSetOf<String>()
        val visited = mutableSetOf<String>()
        fun visit(id: String): Boolean {
            if (id in visiting) return true
            if (id in visited) return false
            val level = levels[id] ?: return false
            visiting += id
            if (level.unlock.prerequisiteLevelIds.any(::visit)) return true
            visiting -= id
            visited += id
            return false
        }
        return levels.keys.any(::visit)
    }
}
