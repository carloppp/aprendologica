package com.explorax.cazaestelar.content.cache

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Test

class CatalogIntegrityTest {
    @Test
    fun `matches standard SHA-256 vectors`() {
        assertEquals(
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            CatalogIntegrity.sha256("")
        )
        assertEquals(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            CatalogIntegrity.sha256("abc")
        )
    }

    @Test
    fun `produces a stable checksum and detects changes`() {
        val first = CatalogIntegrity.sha256("{\"revision\":1}")
        assertEquals(first, CatalogIntegrity.sha256("{\"revision\":1}"))
        assertNotEquals(first, CatalogIntegrity.sha256("{\"revision\":2}"))
    }
}
