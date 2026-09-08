package com.explorax.cazaestelar.content.v2.validation

import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.MechanicDefinition
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import com.explorax.cazaestelar.content.v2.model.ConstellationDefinitionV2
import com.explorax.cazaestelar.content.v2.model.ContentCatalogV2
import com.explorax.cazaestelar.content.v2.model.CurriculumArea
import com.explorax.cazaestelar.content.v2.model.LevelCompletion
import com.explorax.cazaestelar.content.v2.model.LevelDefinition
import com.explorax.cazaestelar.content.v2.model.LevelUnlock
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class CatalogValidatorV2Test {

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

    private fun catalog(vararg levels: LevelDefinition, schemaVersion: Int = 2, revision: Long = 1) =
        ContentCatalogV2(
            schemaVersion = schemaVersion,
            publishedVersion = "2026.09.15.1",
            revision = revision,
            minimumAppVersion = "0.3.0",
            constellations = listOf(
                ConstellationDefinitionV2(
                    id = "fracciones",
                    version = 1,
                    order = 1,
                    area = CurriculumArea("numbers_and_operations"),
                    title = LocalizedText("Fracciones", "Fractions"),
                    description = LocalizedText("Desc", "Desc"),
                    levels = levels.toList()
                )
            )
        )

    private fun fieldsWith(issues: List<com.explorax.cazaestelar.content.validation.ValidationIssue>) =
        issues.map { it.field }

    @Test
    fun `accepts a well-formed catalog`() {
        val issues = CatalogValidatorV2.validate(catalog(level("a"), level("b", listOf("a"))))
        assertTrue(issues.isEmpty()) { "esperaba catálogo válido, issues=$issues" }
    }

    @Test
    fun `rejects wrong schema version and non-positive revision`() {
        val issues = CatalogValidatorV2.validate(catalog(level("a"), schemaVersion = 1, revision = 0))
        assertTrue("schemaVersion" in fieldsWith(issues))
        assertTrue("revision" in fieldsWith(issues))
    }

    @Test
    fun `rejects constellation without levels`() {
        val empty = ContentCatalogV2(
            schemaVersion = 2, publishedVersion = "v", revision = 1, minimumAppVersion = "0.3.0",
            constellations = listOf(
                ConstellationDefinitionV2(
                    "c", 1, 1, CurriculumArea("area"),
                    LocalizedText("C"), LocalizedText("C"), levels = emptyList()
                )
            )
        )
        assertTrue(fieldsWith(CatalogValidatorV2.validate(empty)).any { it.endsWith(".levels") })
    }

    @Test
    fun `rejects duplicate level ids across the catalog`() {
        val issues = CatalogValidatorV2.validate(catalog(level("dup"), level("dup")))
        assertTrue("levels.id" in fieldsWith(issues))
    }

    @Test
    fun `rejects missing prerequisite`() {
        val issues = CatalogValidatorV2.validate(catalog(level("a", listOf("ghost"))))
        assertTrue(fieldsWith(issues).any { it.startsWith("levels.a.unlock") })
    }

    @Test
    fun `detects prerequisite cycle`() {
        val issues = CatalogValidatorV2.validate(catalog(level("a", listOf("b")), level("b", listOf("a"))))
        assertTrue("levels.unlock" in fieldsWith(issues))
    }
}
