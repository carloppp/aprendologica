package com.explorax.cazaestelar.content.v2

import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.MechanicDefinition
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import com.explorax.cazaestelar.content.v2.model.ConstellationDefinitionV2
import com.explorax.cazaestelar.content.v2.model.ContentCatalogV2
import com.explorax.cazaestelar.content.v2.model.CurriculumArea
import com.explorax.cazaestelar.content.v2.model.LevelCompletion
import com.explorax.cazaestelar.content.v2.model.LevelDefinition
import com.explorax.cazaestelar.content.v2.model.LevelProgress
import com.explorax.cazaestelar.content.v2.model.LevelUnlock
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Prueba de concepto del modelo v2 (septiembre 2026). Verifica que el modelo compila y que la
 * derivación de estrellas/porcentaje sigue los rangos acordados. No cubre parser ni navegación.
 */
class ContentModelsV2Test {

    private fun level(id: String, prerequisites: List<String> = emptyList()) = LevelDefinition(
        id = id,
        version = 1,
        order = 1,
        title = LocalizedText("Nivel", "Level"),
        instruction = LocalizedText("Instrucción", "Instruction"),
        mechanic = MechanicDefinition("telescope_hunt", TelescopeHuntConfig(3, 92f)),
        unlock = LevelUnlock(prerequisites),
        completion = LevelCompletion.MinimumScore(60)
    )

    private fun catalog(vararg levels: LevelDefinition) = ContentCatalogV2(
        schemaVersion = 2,
        publishedVersion = "2026.09.15.1",
        revision = 1,
        minimumAppVersion = "0.3.0",
        constellations = listOf(
            ConstellationDefinitionV2(
                id = "fracciones",
                version = 1,
                order = 1,
                area = CurriculumArea("numbers_and_operations"),
                title = LocalizedText("Fracciones", "Fractions"),
                description = LocalizedText("Descripción", "Description"),
                levels = levels.toList()
            )
        )
    )

    @Test
    fun `catalog resolves levels by id`() {
        val catalog = catalog(level("a"), level("b"))
        assertEquals("a", catalog.firstLevel()?.id)
        assertEquals("b", catalog.level("b")?.id)
        assertNull(catalog.level("missing"))
    }

    @Test
    fun `stars derive from score ranges`() {
        fun stars(score: Int) = LevelProgress("a", 1, score >= 60, score, 1, 0L, 0L).stars
        assertEquals(0, stars(0))
        assertEquals(0, stars(29))
        assertEquals(1, stars(30))
        assertEquals(1, stars(59))
        assertEquals(2, stars(60))
        assertEquals(2, stars(89))
        assertEquals(3, stars(90))
        assertEquals(3, stars(100))
    }

    @Test
    fun `passing requires at least two stars`() {
        assertTrue(LevelProgress("a", 1, true, 60, 1, 0L, 0L).passed)
        assertTrue(!LevelProgress("a", 1, false, 45, 1, 0L, 0L).passed)
    }
}
