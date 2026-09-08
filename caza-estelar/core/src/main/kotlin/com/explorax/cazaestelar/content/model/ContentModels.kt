package com.explorax.cazaestelar.content.model

data class LocalizedText(
    val es: String,
    val en: String = es
) {
    fun resolve(language: String): String = if (language == "en") en else es
}

sealed interface MechanicConfig

enum class ContentAssetType { IMAGE, AUDIO }

data class ContentAssetDefinition(
    val id: String,
    val type: ContentAssetType,
    val mimeType: String,
    val url: String,
    val sha256: String,
    val sizeBytes: Long,
    val required: Boolean
)

data class MissionMedia(
    val promptAssetId: String? = null,
    val narrationAssetId: String? = null,
    val backgroundAssetId: String? = null
)

data class TelescopeHuntConfig(
    val targetCount: Int,
    val lockRadius: Float
) : MechanicConfig

data class ChoiceOption(
    val id: String,
    val text: LocalizedText,
    val correct: Boolean
)

data class MultipleChoiceConfig(
    val question: LocalizedText,
    val options: List<ChoiceOption>,
    val attempts: Int,
    val successFeedback: LocalizedText,
    val retryFeedback: LocalizedText
) : MechanicConfig

data class UnsupportedMechanicConfig(val rawJson: String) : MechanicConfig

data class MechanicDefinition(
    val type: String,
    val config: MechanicConfig
)

data class MissionDefinition(
    val id: String,
    val version: Int,
    val title: LocalizedText,
    val instruction: LocalizedText,
    val mechanic: MechanicDefinition,
    val maximumStars: Int,
    val prerequisiteMissionIds: List<String> = emptyList(),
    val media: MissionMedia = MissionMedia()
)

data class ThemeDefinition(
    val id: String,
    val title: LocalizedText,
    val missions: List<MissionDefinition>
)

data class ConstellationDefinition(
    val id: String,
    val title: LocalizedText,
    val themes: List<ThemeDefinition>
)

data class ContentCatalog(
    val schemaVersion: Int,
    val publishedVersion: String,
    val revision: Long = 0,
    val constellations: List<ConstellationDefinition>,
    val assets: List<ContentAssetDefinition> = emptyList()
) {
    fun firstMission(): MissionDefinition? = constellations.firstOrNull()
        ?.themes?.firstOrNull()
        ?.missions?.firstOrNull()
}
