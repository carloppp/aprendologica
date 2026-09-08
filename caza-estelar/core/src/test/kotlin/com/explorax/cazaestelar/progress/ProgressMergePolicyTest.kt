package com.explorax.cazaestelar.progress

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ProgressMergePolicyTest {
    @Test
    fun `merge never reduces local or remote achievements`() {
        val local = MissionProgress("mission", 2, 3, 4, 2, true)
        val remote = MissionProgress("mission", 3, 2, 6, 3, true)
        val merged = ProgressMergePolicy.merge(local, remote)
        assertEquals(3, merged.lastPlayedVersion)
        assertEquals(3, merged.bestStars)
        assertEquals(6, merged.playCount)
        assertEquals(3, merged.completionCount)
        assertTrue(merged.completed)
    }
}
