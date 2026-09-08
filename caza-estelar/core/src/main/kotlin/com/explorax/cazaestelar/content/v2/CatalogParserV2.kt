package com.explorax.cazaestelar.content.v2

import com.badlogic.gdx.utils.JsonReader
import com.badlogic.gdx.utils.JsonValue
import com.badlogic.gdx.utils.JsonWriter
import com.explorax.cazaestelar.content.model.ChoiceOption
import com.explorax.cazaestelar.content.model.ContentAssetDefinition
import com.explorax.cazaestelar.content.model.ContentAssetType
import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.MechanicConfig
import com.explorax.cazaestelar.content.model.MechanicDefinition
import com.explorax.cazaestelar.content.model.MultipleChoiceConfig
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import com.explorax.cazaestelar.content.model.UnsupportedMechanicConfig
import com.explorax.cazaestelar.content.v2.model.ConstellationDefinitionV2
import com.explorax.cazaestelar.content.v2.model.ConstellationVisual
import com.explorax.cazaestelar.content.v2.model.ContentCatalogV2
import com.explorax.cazaestelar.content.v2.model.CurriculumArea
import com.explorax.cazaestelar.content.v2.model.LevelCompletion
import com.explorax.cazaestelar.content.v2.model.LevelDefinition
import com.explorax.cazaestelar.content.v2.model.LevelMedia
import com.explorax.cazaestelar.content.v2.model.LevelReward
import com.explorax.cazaestelar.content.v2.model.LevelUnlock

/**
 * Interpreta un catálogo `schemaVersion: 2` (`constelación → nivel`). Ver
 * `docs/CONTENT_SCHEMA_V2.md`. No lee catálogos v1: la migración es directa (decisión 1).
 *
 * El parser tolera campos ausentes y produce un modelo; la validez del contenido la deciden
 * [com.explorax.cazaestelar.content.v2.validation.CatalogValidatorV2] y
 * [com.explorax.cazaestelar.content.v2.validation.LevelValidator].
 */
class CatalogParserV2 {

    fun parse(rawJson: String): ContentCatalogV2 {
        val root = JsonReader().parse(rawJson)
        return ContentCatalogV2(
            schemaVersion = root.getInt("schemaVersion", 0),
            publishedVersion = root.getString("publishedVersion", ""),
            revision = root.getLong("revision", 0L),
            minimumAppVersion = root.getString("minimumAppVersion", ""),
            constellations = root.get("constellations").elements().map(::parseConstellation).toList(),
            assets = root.get("assets")?.elements()?.map(::parseAsset)?.toList() ?: emptyList()
        )
    }

    private fun parseAsset(value: JsonValue) = ContentAssetDefinition(
        id = value.getString("id", ""),
        type = parseAssetType(value.getString("type", "")),
        mimeType = value.getString("mimeType", ""),
        url = value.getString("url", ""),
        sha256 = value.getString("sha256", "").lowercase(),
        sizeBytes = value.getLong("sizeBytes", 0L),
        required = value.getBoolean("required", false)
    )

    private fun parseAssetType(raw: String): ContentAssetType =
        runCatching { ContentAssetType.valueOf(raw.uppercase()) }.getOrDefault(ContentAssetType.IMAGE)

    private fun parseConstellation(value: JsonValue): ConstellationDefinitionV2 {
        val visual = value.get("visual")
        return ConstellationDefinitionV2(
            id = value.getString("id", ""),
            version = value.getInt("version", 0),
            order = value.getInt("order", 0),
            area = CurriculumArea(value.getString("area", "")),
            title = value.get("title").localizedText(),
            description = value.get("description").localizedText(),
            visual = ConstellationVisual(
                coverAssetId = visual?.get("coverAssetId")?.takeUnless { it.isNull }?.asString(),
                accentColor = visual?.getString("accentColor", DEFAULT_ACCENT) ?: DEFAULT_ACCENT
            ),
            levels = value.get("levels").elements().map(::parseLevel).toList()
        )
    }

    private fun parseLevel(value: JsonValue): LevelDefinition {
        val mechanic = value.get("mechanic")
        val mechanicType = mechanic.getString("type", "")
        val completion = value.get("completion")
        val reward = value.get("reward")
        val media = value.get("media")
        return LevelDefinition(
            id = value.getString("id", ""),
            version = value.getInt("version", 0),
            order = value.getInt("order", 0),
            title = value.get("title").localizedText(),
            instruction = value.get("instruction").localizedText(),
            mechanic = MechanicDefinition(
                type = mechanicType,
                config = parseMechanicConfig(mechanicType, mechanic.get("config"))
            ),
            unlock = LevelUnlock(
                prerequisiteLevelIds = value.get("unlock")?.get("prerequisiteLevelIds")
                    ?.elements()?.map { it.asString() }?.toList() ?: emptyList()
            ),
            completion = LevelCompletion.MinimumScore(completion?.getInt("value", 0) ?: 0),
            reward = LevelReward(
                experience = reward?.getInt("experience", 0) ?: 0,
                badgeId = reward?.get("badgeId")?.takeUnless { it.isNull }?.asString()
            ),
            media = LevelMedia(
                promptAssetId = media?.get("promptAssetId")?.takeUnless { it.isNull }?.asString(),
                narrationAssetId = media?.get("narrationAssetId")?.takeUnless { it.isNull }?.asString(),
                backgroundAssetId = media?.get("backgroundAssetId")?.takeUnless { it.isNull }?.asString()
            )
        )
    }

    private fun parseMechanicConfig(type: String, config: JsonValue?): MechanicConfig = when (type) {
        "telescope_hunt" -> TelescopeHuntConfig(
            targetCount = config?.getInt("targetCount", 3) ?: 3,
            lockRadius = config?.getFloat("lockRadius", 92f) ?: 92f
        )
        "multiple_choice" -> MultipleChoiceConfig(
            question = config?.get("question")?.localizedText() ?: LocalizedText(""),
            options = config?.get("options")?.elements()?.map { option ->
                ChoiceOption(
                    id = option.getString("id", ""),
                    text = option.get("text")?.localizedText() ?: LocalizedText(""),
                    correct = option.getBoolean("correct", false)
                )
            }?.toList() ?: emptyList(),
            attempts = config?.getInt("attempts", 2) ?: 2,
            successFeedback = config?.get("successFeedback")?.localizedText() ?: LocalizedText(""),
            retryFeedback = config?.get("retryFeedback")?.localizedText() ?: LocalizedText("")
        )
        else -> UnsupportedMechanicConfig(config?.toJson(JsonWriter.OutputType.json) ?: "null")
    }

    private fun JsonValue?.localizedText(): LocalizedText {
        if (this == null) return LocalizedText("")
        val es = getString("es", "")
        return LocalizedText(es = es, en = getString("en", es))
    }

    private fun JsonValue?.elements(): Sequence<JsonValue> = sequence {
        var item = this@elements?.child
        while (item != null) {
            yield(item)
            item = item.next
        }
    }

    private companion object {
        const val DEFAULT_ACCENT = "#7C8CFF"
    }
}
