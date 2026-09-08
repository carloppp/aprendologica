package com.explorax.cazaestelar.progress

data class MissionProgress(
    val missionId: String,
    val lastPlayedVersion: Int,
    val bestStars: Int,
    val playCount: Int,
    val completionCount: Int,
    val completed: Boolean
)
