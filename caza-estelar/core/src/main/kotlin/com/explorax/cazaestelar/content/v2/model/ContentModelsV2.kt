package com.explorax.cazaestelar.content.v2.model

import com.explorax.cazaestelar.content.model.ContentAssetDefinition
import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.MechanicDefinition

/**
 * Modelo del contrato de contenido v2 (planteamiento de septiembre 2026).
 *
 * Jerarquía plana `constelación → nivel`: se elimina [com.explorax.cazaestelar.content.model.ThemeDefinition].
 * Este paquete es una prueba de concepto verificable (compila) y NO está conectado al parser,
 * la navegación ni el progreso. La Fase 2 lo integra. Ver `docs/CONTENT_SCHEMA_V2.md`.
 */

/** Área curricular de una constelación, p. ej. `numbers_and_operations`, `geometry`, `patterns`. */
@JvmInline
value class CurriculumArea(val value: String)

data class ConstellationVisual(
    val coverAssetId: String? = null,
    val accentColor: String = "#7C8CFF"
)

data class LevelMedia(
    val promptAssetId: String? = null,
    val narrationAssetId: String? = null,
    val backgroundAssetId: String? = null
)

/** Criterio de finalización. Por ahora solo `minimum_score`. */
sealed interface LevelCompletion {
    data class MinimumScore(val value: Int) : LevelCompletion
}

data class LevelReward(
    val experience: Int = 0,
    val badgeId: String? = null
)

data class LevelUnlock(
    val prerequisiteLevelIds: List<String> = emptyList()
)

data class LevelDefinition(
    val id: String,
    val version: Int,
    val order: Int,
    val title: LocalizedText,
    val instruction: LocalizedText,
    val mechanic: MechanicDefinition,
    val unlock: LevelUnlock = LevelUnlock(),
    val completion: LevelCompletion,
    val reward: LevelReward = LevelReward(),
    val media: LevelMedia = LevelMedia()
)

data class ConstellationDefinitionV2(
    val id: String,
    val version: Int,
    val order: Int,
    val area: CurriculumArea,
    val title: LocalizedText,
    val description: LocalizedText,
    val visual: ConstellationVisual = ConstellationVisual(),
    val levels: List<LevelDefinition>
)

data class ContentCatalogV2(
    val schemaVersion: Int,
    val publishedVersion: String,
    val revision: Long,
    val minimumAppVersion: String,
    val constellations: List<ConstellationDefinitionV2>,
    val assets: List<ContentAssetDefinition> = emptyList()
) {
    fun level(levelId: String): LevelDefinition? =
        constellations.asSequence().flatMap { it.levels }.firstOrNull { it.id == levelId }

    fun firstLevel(): LevelDefinition? =
        constellations.firstOrNull()?.levels?.firstOrNull()
}

/**
 * Progreso por nivel (planteamiento v2). El cliente guarda `score`; el porcentaje y las
 * estrellas se derivan de él (rangos de `DOCUMENTACION_PROYECTO.md` §2.8).
 */
data class LevelProgress(
    val levelId: String,
    val levelVersion: Int,
    val completed: Boolean,
    val bestScore: Int,
    val attemptsUsed: Int,
    val lastDurationMs: Long,
    val updatedAtEpochMs: Long
) {
    val percentage: Int get() = bestScore.coerceIn(0, 100)

    val stars: Int
        get() = when {
            percentage >= 90 -> 3
            percentage >= 60 -> 2
            percentage >= 30 -> 1
            else -> 0
        }

    val passed: Boolean get() = stars >= 2
}
