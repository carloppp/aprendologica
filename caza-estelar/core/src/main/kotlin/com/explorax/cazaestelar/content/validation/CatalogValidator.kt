package com.explorax.cazaestelar.content.validation

import com.explorax.cazaestelar.content.model.ContentCatalog
import com.explorax.cazaestelar.content.model.MissionDefinition
import com.explorax.cazaestelar.content.model.ContentAssetType

object CatalogValidator {
    fun validate(catalog: ContentCatalog): List<ValidationIssue> {
        val issues = mutableListOf<ValidationIssue>()
        if (catalog.schemaVersion != 1) issues += ValidationIssue("schemaVersion", "La app solo admite el esquema de contenido 1")
        if (catalog.revision < 1) issues += ValidationIssue("revision", "La revisión del catálogo debe ser positiva")
        if (catalog.publishedVersion.isBlank()) issues += ValidationIssue("publishedVersion", "Falta la versión publicada")
        if (catalog.constellations.isEmpty()) issues += ValidationIssue("constellations", "El catálogo debe contener al menos una constelación")
        val constellationIds = catalog.constellations.map { it.id }
        if (constellationIds.any(String::isBlank) || constellationIds.distinct().size != constellationIds.size) {
            issues += ValidationIssue("constellations.id", "Los identificadores de constelación deben existir y ser únicos")
        }
        catalog.constellations.forEach { constellation ->
            if (constellation.themes.isEmpty()) {
                issues += ValidationIssue("constellations.${constellation.id}.themes", "Una constelación publicada necesita al menos un tema")
            }
            val themeIds = constellation.themes.map { it.id }
            if (themeIds.any(String::isBlank) || themeIds.distinct().size != themeIds.size) {
                issues += ValidationIssue("constellations.${constellation.id}.themes.id", "Los identificadores de tema deben existir y ser únicos")
            }
            constellation.themes.filter { it.missions.isEmpty() }.forEach { theme ->
                issues += ValidationIssue(
                    "constellations.${constellation.id}.themes.${theme.id}.missions",
                    "Un tema publicado necesita al menos una misión"
                )
            }
        }
        val assetIds = catalog.assets.map { it.id }
        if (assetIds.any(String::isBlank) || assetIds.distinct().size != assetIds.size) {
            issues += ValidationIssue("assets.id", "Los identificadores de recursos deben existir y ser únicos")
        }
        catalog.assets.forEach { asset ->
            if (!asset.url.startsWith("https://")) issues += ValidationIssue("assets.${asset.id}.url", "Los recursos remotos deben usar HTTPS")
            val allowedMimeTypes = when (asset.type) {
                ContentAssetType.IMAGE -> setOf("image/png", "image/jpeg")
                ContentAssetType.AUDIO -> setOf("audio/mpeg", "audio/ogg", "audio/wav")
            }
            if (asset.mimeType !in allowedMimeTypes) issues += ValidationIssue("assets.${asset.id}.mimeType", "El tipo MIME no coincide con el recurso")
            if (!asset.sha256.matches(Regex("^[a-f0-9]{64}$"))) issues += ValidationIssue("assets.${asset.id}.sha256", "El recurso necesita un SHA-256 válido")
            if (asset.sizeBytes !in 1..MAX_ASSET_BYTES) issues += ValidationIssue("assets.${asset.id}.sizeBytes", "El tamaño del recurso está fuera del límite permitido")
        }
        val assetsById = catalog.assets.associateBy { it.id }
        val missions = catalog.constellations
            .flatMap { it.themes }
            .flatMap { it.missions }
        val missionIds = missions.map { it.id }
        if (missionIds.any(String::isBlank) || missionIds.distinct().size != missionIds.size) {
            issues += ValidationIssue("missions.id", "Los identificadores de misión deben existir y ser únicos en todo el catálogo")
        }
        val knownIds = missionIds.toSet()
        missions.forEach { mission ->
            mission.prerequisiteMissionIds.filterNot(knownIds::contains).forEach { missing ->
                issues += ValidationIssue(
                    "missions.${mission.id}.unlock",
                    "El prerrequisito $missing no existe en el catálogo"
                )
            }
            val media = mission.media
            listOfNotNull(media.promptAssetId, media.narrationAssetId, media.backgroundAssetId)
                .filterNot(assetsById::containsKey).forEach { missing ->
                    issues += ValidationIssue("missions.${mission.id}.media", "El recurso $missing no existe en el catálogo")
                }
            media.promptAssetId?.let { id ->
                assetsById[id]?.let { if (it.type != ContentAssetType.IMAGE) issues += ValidationIssue("missions.${mission.id}.media.promptAssetId", "El recurso de pregunta debe ser una imagen") }
            }
            media.backgroundAssetId?.let { id ->
                assetsById[id]?.let { if (it.type != ContentAssetType.IMAGE) issues += ValidationIssue("missions.${mission.id}.media.backgroundAssetId", "El fondo debe ser una imagen") }
            }
            media.narrationAssetId?.let { id ->
                assetsById[id]?.let { if (it.type != ContentAssetType.AUDIO) issues += ValidationIssue("missions.${mission.id}.media.narrationAssetId", "La narración debe ser audio") }
            }
        }
        if (hasDependencyCycle(missions.associateBy { it.id })) {
            issues += ValidationIssue("missions.unlock", "Los prerrequisitos contienen un ciclo")
        }
        return issues
    }

    private fun hasDependencyCycle(missions: Map<String, MissionDefinition>): Boolean {
        val visiting = mutableSetOf<String>()
        val visited = mutableSetOf<String>()
        fun visit(id: String): Boolean {
            if (id in visiting) return true
            if (id in visited) return false
            val mission = missions[id] ?: return false
            visiting += id
            if (mission.prerequisiteMissionIds.any(::visit)) return true
            visiting -= id
            visited += id
            return false
        }
        return missions.keys.any(::visit)
    }

    private const val MAX_ASSET_BYTES = 26_214_400L
}
