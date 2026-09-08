package com.explorax.cazaestelar.content

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class CatalogParserTest {
    @Test
    fun `reads revision and typed telescope configuration`() {
        val raw = """
            {
              "schemaVersion": 1,
              "publishedVersion": "test",
              "revision": 7,
              "constellations": [{
                "id": "c",
                "title": {"es": "C"},
                "themes": [{
                  "id": "t",
                  "title": {"es": "T"},
                  "missions": [{
                    "id": "m",
                    "version": 1,
                    "title": {"es": "M"},
                    "instruction": {"es": "I"},
                    "mechanic": {
                      "type": "telescope_hunt",
                      "config": {"targetCount": 4, "lockRadius": 80}
                    },
                    "rewards": {"maximumStars": 3},
                    "unlock": {"prerequisiteMissionIds": []}
                  }]
                }]
              }]
            }
        """.trimIndent()
        val catalog = CatalogParser().parse(raw)
        assertEquals(7L, catalog.revision)
        assertEquals("m", catalog.firstMission()?.id)
    }
}
