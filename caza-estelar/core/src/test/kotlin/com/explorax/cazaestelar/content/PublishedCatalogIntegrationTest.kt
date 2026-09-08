package com.explorax.cazaestelar.content

import com.explorax.cazaestelar.content.validation.CatalogValidator
import com.explorax.cazaestelar.content.validation.MissionValidator
import com.explorax.cazaestelar.mechanics.MechanicRegistry
import java.nio.file.Files
import java.nio.file.Paths
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class PublishedCatalogIntegrationTest {
    @Test
    fun `bundled catalog is executable by the installed app`() {
        val assetsDirectory = Paths.get(System.getProperty("caza.assets.dir"))
        val rawCatalog = Files.readString(assetsDirectory.resolve("content/catalog.json"))
        val catalog = CatalogParser().parse(rawCatalog)
        val supportedMechanics = MechanicRegistry.defaultRegistry().supportedTypes()
        val catalogIssues = CatalogValidator.validate(catalog)
        val missions = catalog.constellations.flatMap { constellation ->
            constellation.themes.flatMap { it.missions }
        }
        val missionIssues = missions.flatMap { mission ->
            MissionValidator.validate(mission, supportedMechanics).map { mission.id to it }
        }

        assertTrue(catalogIssues.isEmpty()) {
            catalogIssues.joinToString { "${it.field}: ${it.message}" }
        }
        assertTrue(missions.isNotEmpty(), "The published catalog must contain missions")
        assertTrue(missionIssues.isEmpty()) {
            missionIssues.joinToString { (missionId, issue) ->
                "$missionId/${issue.field}: ${issue.message}"
            }
        }
    }
}
