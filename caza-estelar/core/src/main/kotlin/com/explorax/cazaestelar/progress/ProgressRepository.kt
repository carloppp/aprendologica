package com.explorax.cazaestelar.progress

interface ProgressRepository {
    fun find(playerId: String, missionId: String): MissionProgress?

    fun recordResult(
        playerId: String,
        missionId: String,
        missionVersion: Int,
        starsEarned: Int
    ): MissionProgress

    fun merge(playerId: String, remote: MissionProgress): MissionProgress
}
