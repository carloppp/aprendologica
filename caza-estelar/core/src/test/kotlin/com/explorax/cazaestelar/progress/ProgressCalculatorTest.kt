package com.explorax.cazaestelar.progress

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ProgressCalculatorTest {
    @Test
    fun `keeps the best score while counting every play`() {
        val first = ProgressCalculator.record(null, "mission-1", 1, 3)
        val second = ProgressCalculator.record(first, "mission-1", 2, 1)
        assertEquals(3, second.bestStars)
        assertEquals(2, second.playCount)
        assertEquals(2, second.completionCount)
        assertEquals(2, second.lastPlayedVersion)
        assertTrue(second.completed)
    }

    @Test
    fun `failed play does not mark a mission as completed`() {
        val progress = ProgressCalculator.record(null, "mission-1", 1, 0)
        assertFalse(progress.completed)
        assertEquals(1, progress.playCount)
        assertEquals(0, progress.completionCount)
    }
}
