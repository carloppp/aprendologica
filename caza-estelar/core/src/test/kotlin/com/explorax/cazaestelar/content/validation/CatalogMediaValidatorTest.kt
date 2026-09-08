package com.explorax.cazaestelar.content.validation

import com.explorax.cazaestelar.content.model.ConstellationDefinition
import com.explorax.cazaestelar.content.model.ContentAssetDefinition
import com.explorax.cazaestelar.content.model.ContentAssetType
import com.explorax.cazaestelar.content.model.ContentCatalog
import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.MechanicDefinition
import com.explorax.cazaestelar.content.model.MissionDefinition
import com.explorax.cazaestelar.content.model.MissionMedia
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import com.explorax.cazaestelar.content.model.ThemeDefinition
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class CatalogMediaValidatorTest {
    @Test
    fun `accepts a referenced HTTPS image with integrity metadata`() {
        val asset = imageAsset("image-1")
        assertTrue(CatalogValidator.validate(catalog(asset, "image-1")).isEmpty())
    }

    @Test
    fun `rejects an unknown media reference`() {
        val issues = CatalogValidator.validate(catalog(imageAsset("image-1"), "missing"))
        assertEquals(1, issues.size)
    }

    private fun imageAsset(id: String) = ContentAssetDefinition(
        id = id,
        type = ContentAssetType.IMAGE,
        mimeType = "image/png",
        url = "https://example.test/$id.png",
        sha256 = "a".repeat(64),
        sizeBytes = 128,
        required = false
    )

    private fun catalog(asset: ContentAssetDefinition, promptAssetId: String): ContentCatalog {
        val mission = MissionDefinition(
            id = "mission",
            version = 1,
            title = LocalizedText("Misión"),
            instruction = LocalizedText("Completa"),
            mechanic = MechanicDefinition("telescope_hunt", TelescopeHuntConfig(3, 92f)),
            maximumStars = 3,
            media = MissionMedia(promptAssetId = promptAssetId)
        )
        return ContentCatalog(
            schemaVersion = 1,
            publishedVersion = "test",
            revision = 1,
            constellations = listOf(
                ConstellationDefinition(
                    "constellation", LocalizedText("Constelación"),
                    listOf(ThemeDefinition("theme", LocalizedText("Tema"), listOf(mission)))
                )
            ),
            assets = listOf(asset)
        )
    }
}
