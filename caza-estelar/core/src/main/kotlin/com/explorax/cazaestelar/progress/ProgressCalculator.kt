package com.explorax.cazaestelar.progress

object ProgressCalculator {
    fun record(
        previous: MissionProgress?,
        missionId: String,
        missionVersion: Int,
        starsEarned: Int
    ): MissionProgress {
        require(starsEarned in 0..3) { "starsEarned must be between 0 and 3" }
        val completedNow = starsEarned > 0
        return MissionProgress(
            missionId = missionId,
            lastPlayedVersion = missionVersion,
            bestStars = maxOf(previous?.bestStars ?: 0, starsEarned),
            playCount = (previous?.playCount ?: 0) + 1,
            completionCount = (previous?.completionCount ?: 0) + if (completedNow) 1 else 0,
            completed = previous?.completed == true || completedNow
        )
    }
}
