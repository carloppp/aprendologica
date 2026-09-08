package com.explorax.cazaestelar.content.cache

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Test

class CatalogIntegrityTest {
    @Test
    fun `produces a stable checksum and detects changes`() {
        val first = CatalogIntegrity.sha256("{\"revision\":1}")
        assertEquals(first, CatalogIntegrity.sha256("{\"revision\":1}"))
        assertNotEquals(first, CatalogIntegrity.sha256("{\"revision\":2}"))
    }
}
