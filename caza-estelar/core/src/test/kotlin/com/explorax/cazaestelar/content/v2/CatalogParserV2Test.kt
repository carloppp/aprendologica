package com.explorax.cazaestelar.content.v2

import com.explorax.cazaestelar.content.model.MultipleChoiceConfig
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import com.explorax.cazaestelar.content.model.UnsupportedMechanicConfig
import com.explorax.cazaestelar.content.v2.model.LevelCompletion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class CatalogParserV2Test {

    private val sample = """
        {
          "schemaVersion": 2,
          "publishedVersion": "2026.09.15.1",
          "revision": 3,
          "minimumAppVersion": "0.3.0",
          "assets": [],
          "constellations": [{
            "id": "fracciones",
            "version": 2,
            "order": 1,
            "area": "numbers_and_operations",
            "title": {"es": "Fracciones", "en": "Fractions"},
            "description": {"es": "Desc", "en": "Desc"},
            "visual": {"coverAssetId": null, "accentColor": "#7C8CFF"},
            "levels": [
              {
                "id": "fracciones-reconocer",
                "version": 1,
                "order": 1,
                "title": {"es": "Reconocer", "en": "Recognize"},
                "instruction": {"es": "Elige", "en": "Choose"},
                "mechanic": {
                  "type": "telescope_hunt",
                  "schemaVersion": 1,
                  "config": {"targetCount": 4, "lockRadius": 80}
                },
                "unlock": {"prerequisiteLevelIds": []},
                "completion": {"type": "minimum_score", "value": 60},
                "reward": {"experience": 100, "badgeId": null},
                "media": {"promptAssetId": null, "narrationAssetId": null, "backgroundAssetId": null}
              },
              {
                "id": "fracciones-comparar",
                "version": 1,
                "order": 2,
                "title": {"es": "Comparar", "en": "Compare"},
                "instruction": {"es": "Compara", "en": "Compare"},
                "mechanic": {
                  "type": "multiple_choice",
                  "schemaVersion": 1,
                  "config": {
                    "question": {"es": "P", "en": "Q"},
                    "options": [
                      {"id": "a", "text": {"es": "A", "en": "A"}, "correct": true},
                      {"id": "b", "text": {"es": "B", "en": "B"}, "correct": false}
                    ],
                    "attempts": 2,
                    "successFeedback": {"es": "Bien", "en": "Good"},
                    "retryFeedback": {"es": "Otra", "en": "Retry"}
                  }
                },
                "unlock": {"prerequisiteLevelIds": ["fracciones-reconocer"]},
                "completion": {"type": "minimum_score", "value": 70}
              }
            ]
          }]
        }
    """.trimIndent()

    @Test
    fun `parses catalog header and hierarchy`() {
        val catalog = CatalogParserV2().parse(sample)
        assertEquals(2, catalog.schemaVersion)
        assertEquals("2026.09.15.1", catalog.publishedVersion)
        assertEquals(3L, catalog.revision)
        assertEquals("0.3.0", catalog.minimumAppVersion)
        assertEquals(1, catalog.constellations.size)
        assertEquals(2, catalog.constellations.first().levels.size)
        assertEquals("numbers_and_operations", catalog.constellations.first().area.value)
    }

    @Test
    fun `parses typed mechanic configs`() {
        val catalog = CatalogParserV2().parse(sample)
        val first = catalog.level("fracciones-reconocer")!!
        val hunt = assertInstanceOf(TelescopeHuntConfig::class.java, first.mechanic.config)
        assertEquals(4, hunt.targetCount)
        assertEquals(80f, hunt.lockRadius)

        val second = catalog.level("fracciones-comparar")!!
        val choice = assertInstanceOf(MultipleChoiceConfig::class.java, second.mechanic.config)
        assertEquals(2, choice.options.size)
        assertEquals(listOf("fracciones-reconocer"), second.unlock.prerequisiteLevelIds)
    }

    @Test
    fun `defaults optional blocks and keeps completion`() {
        val catalog = CatalogParserV2().parse(sample)
        val second = catalog.level("fracciones-comparar")!!
        assertEquals(LevelCompletion.MinimumScore(70), second.completion)
        assertEquals(0, second.reward.experience)
        assertNull(second.media.backgroundAssetId)
    }

    @Test
    fun `unknown mechanic becomes unsupported config`() {
        val raw = sample.replace("\"telescope_hunt\"", "\"matching\"")
        val catalog = CatalogParserV2().parse(raw)
        assertTrue(catalog.level("fracciones-reconocer")!!.mechanic.config is UnsupportedMechanicConfig)
    }
}
