package com.explorax.cazaestelar.content.validation

import com.explorax.cazaestelar.content.model.ConstellationDefinition
import com.explorax.cazaestelar.content.model.ContentCatalog
import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.MechanicDefinition
import com.explorax.cazaestelar.content.model.MissionDefinition
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import com.explorax.cazaestelar.content.model.ThemeDefinition
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class CatalogValidatorTest {
    @Test
    fun `accepts existing acyclic prerequisites`() {
        val catalog = catalogOf(mission("a"), mission("b", listOf("a")))
        assertTrue(CatalogValidator.validate(catalog).isEmpty())
    }

    @Test
    fun `rejects missing prerequisites and dependency cycles`() {
        val missing = CatalogValidator.validate(catalogOf(mission("a", listOf("missing"))))
        assertEquals(1, missing.size)

        val cycle = CatalogValidator.validate(
            catalogOf(mission("a", listOf("b")), mission("b", listOf("a")))
        )
        assertEquals(1, cycle.size)
    }

    private fun mission(id: String, prerequisites: List<String> = emptyList()) = MissionDefinition(
        id = id,
        version = 1,
        title = LocalizedText(id),
        instruction = LocalizedText("Completa"),
        mechanic = MechanicDefinition("telescope_hunt", TelescopeHuntConfig(3, 92f)),
        maximumStars = 3,
        prerequisiteMissionIds = prerequisites
    )

    private fun catalogOf(vararg missions: MissionDefinition) = ContentCatalog(
        schemaVersion = 1,
        publishedVersion = "test",
        revision = 1,
        constellations = listOf(
            ConstellationDefinition(
                "constellation", LocalizedText("Constelación"),
                listOf(ThemeDefinition("theme", LocalizedText("Tema"), missions.toList()))
            )
        )
    )
}
