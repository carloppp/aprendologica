package com.explorax.cazaestelar.content

import com.explorax.cazaestelar.content.model.ContentCatalog
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class CatalogUpdatePolicyTest {
    @Test
    fun `starts with the newer valid catalog`() {
        val bundled = catalog(1)
        val cached = catalog(3)
        assertEquals(3L, CatalogUpdatePolicy.selectStartup(bundled, cached).revision)
        assertEquals(1L, CatalogUpdatePolicy.selectStartup(bundled, catalog(1)).revision)
    }

    @Test
    fun `accepts only a strictly newer remote revision`() {
        assertTrue(CatalogUpdatePolicy.isNewer(catalog(2), catalog(3)))
        assertFalse(CatalogUpdatePolicy.isNewer(catalog(2), catalog(2)))
        assertFalse(CatalogUpdatePolicy.isNewer(catalog(2), catalog(1)))
    }

    private fun catalog(revision: Long) = ContentCatalog(
        schemaVersion = 1,
        publishedVersion = "test-$revision",
        revision = revision,
        constellations = emptyList()
    )
}
