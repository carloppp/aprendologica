package com.explorax.cazaestelar.mechanics

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class MechanicRegistryTest {
    @Test
    fun `default app version exposes installed mechanics`() {
        val registry = MechanicRegistry.defaultRegistry()
        assertTrue(registry.supports("telescope_hunt"))
        assertTrue(registry.supports("multiple_choice"))
        assertFalse(registry.supports("ordering"))
    }
}
