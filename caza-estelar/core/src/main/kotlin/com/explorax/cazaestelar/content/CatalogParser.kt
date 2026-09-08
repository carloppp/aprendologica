package com.explorax.cazaestelar.content

import com.badlogic.gdx.utils.JsonReader
import com.badlogic.gdx.utils.JsonValue
import com.badlogic.gdx.utils.JsonWriter
import com.explorax.cazaestelar.content.model.ChoiceOption
import com.explorax.cazaestelar.content.model.ContentAssetDefinition
import com.explorax.cazaestelar.content.model.ContentAssetType
import com.explorax.cazaestelar.content.model.ConstellationDefinition
import com.explorax.cazaestelar.content.model.ContentCatalog
import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.MechanicConfig
import com.explorax.cazaestelar.content.model.MechanicDefinition
import com.explorax.cazaestelar.content.model.MissionDefinition
import com.explorax.cazaestelar.content.model.MissionMedia
import com.explorax.cazaestelar.content.model.MultipleChoiceConfig
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import com.explorax.cazaestelar.content.model.ThemeDefinition
import com.explorax.cazaestelar.content.model.UnsupportedMechanicConfig

class CatalogParser {
    fun parse(rawJson: String): ContentCatalog {
        val root = JsonReader().parse(rawJson)
        return ContentCatalog(
            schemaVersion = root.getInt("schemaVersion"),
            publishedVersion = root.getString("publishedVersion"),
            revision = root.getLong("revision", 0L),
            constellations = root.get("constellations").elements().map(::parseConstellation).toList(),
            assets = root.get("assets")?.elements()?.map(::parseAsset)?.toList() ?: emptyList()
        )
    }

    private fun parseAsset(value: JsonValue) = ContentAssetDefinition(
        id = value.getString("id", ""),
        type = ContentAssetType.valueOf(value.getString("type").uppercase()),
        mimeType = value.getString("mimeType", ""),
        url = value.getString("url", ""),
        sha256 = value.getString("sha256", "").lowercase(),
        sizeBytes = value.getLong("sizeBytes", 0L),
        required = value.getBoolean("required", false)
    )

    private fun parseConstellation(value: JsonValue) = ConstellationDefinition(
        id = value.getString("id"),
        title = value.get("title").localizedText(),
        themes = value.get("themes").elements().map(::parseTheme).toList()
    )

    private fun parseTheme(value: JsonValue) = ThemeDefinition(
        id = value.getString("id"),
        title = value.get("title").localizedText(),
        missions = value.get("missions").elements().map(::parseMission).toList()
    )

    private fun parseMission(value: JsonValue): MissionDefinition {
        val mechanic = value.get("mechanic")
        val mechanicType = mechanic.getString("type")
        return MissionDefinition(
            id = value.getString("id"),
            version = value.getInt("version"),
            title = value.get("title").localizedText(),
            instruction = value.get("instruction").localizedText(),
            mechanic = MechanicDefinition(
                type = mechanicType,
                config = parseMechanicConfig(mechanicType, mechanic.get("config"))
            ),
            maximumStars = value.get("rewards").getInt("maximumStars"),
            prerequisiteMissionIds = value.get("unlock")?.get("prerequisiteMissionIds")
                ?.elements()?.map { it.asString() }?.toList() ?: emptyList(),
            media = value.get("media")?.let { media ->
                MissionMedia(
                    promptAssetId = media.get("promptAssetId")?.asString(),
                    narrationAssetId = media.get("narrationAssetId")?.asString(),
                    backgroundAssetId = media.get("backgroundAssetId")?.asString()
                )
            } ?: MissionMedia()
        )
    }

    private fun parseMechanicConfig(type: String, config: JsonValue): MechanicConfig = when (type) {
        "telescope_hunt" -> TelescopeHuntConfig(
            targetCount = config.getInt("targetCount", 3),
            lockRadius = config.getFloat("lockRadius", 92f)
        )
        "multiple_choice" -> MultipleChoiceConfig(
            question = config.get("question")?.localizedText() ?: LocalizedText(""),
            options = config.get("options")?.elements()?.map { option ->
                ChoiceOption(
                    id = option.getString("id", ""),
                    text = option.get("text")?.localizedText() ?: LocalizedText(""),
                    correct = option.getBoolean("correct", false)
                )
            }?.toList() ?: emptyList(),
            attempts = config.getInt("attempts", 2),
            successFeedback = config.get("successFeedback")?.localizedText() ?: LocalizedText(""),
            retryFeedback = config.get("retryFeedback")?.localizedText() ?: LocalizedText("")
        )
        else -> UnsupportedMechanicConfig(config.toJson(JsonWriter.OutputType.json))
    }

    private fun JsonValue.localizedText() = LocalizedText(
        es = getString("es"),
        en = getString("en", getString("es"))
    )

    private fun JsonValue.elements(): Sequence<JsonValue> = sequence {
        var item = child
        while (item != null) {
            yield(item)
            item = item.next
        }
    }
}
