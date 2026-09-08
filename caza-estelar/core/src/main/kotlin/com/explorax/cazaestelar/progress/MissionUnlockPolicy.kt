package com.explorax.cazaestelar.progress

import com.explorax.cazaestelar.content.model.MissionDefinition

object MissionUnlockPolicy {
    fun isUnlocked(mission: MissionDefinition, completedMissionIds: Set<String>): Boolean =
        mission.prerequisiteMissionIds.all(completedMissionIds::contains)
}
