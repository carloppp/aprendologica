package com.explorax.cazaestelar.progress

import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.MechanicDefinition
import com.explorax.cazaestelar.content.model.MissionDefinition
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class MissionUnlockPolicyTest {
    @Test
    fun `unlocks only after every prerequisite is completed`() {
        val mission = MissionDefinition(
            id = "mission-2",
            version = 1,
            title = LocalizedText("Misión 2"),
            instruction = LocalizedText("Completa"),
            mechanic = MechanicDefinition("telescope_hunt", TelescopeHuntConfig(3, 92f)),
            maximumStars = 3,
            prerequisiteMissionIds = listOf("mission-1", "mission-extra")
        )
        assertFalse(MissionUnlockPolicy.isUnlocked(mission, setOf("mission-1")))
        assertTrue(MissionUnlockPolicy.isUnlocked(mission, setOf("mission-1", "mission-extra")))
    }
}
