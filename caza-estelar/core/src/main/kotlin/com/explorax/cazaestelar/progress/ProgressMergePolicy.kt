package com.explorax.cazaestelar.progress

object ProgressMergePolicy {
    fun merge(local: MissionProgress?, remote: MissionProgress): MissionProgress {
        if (local == null) return remote
        require(local.missionId == remote.missionId)
        return MissionProgress(
            missionId = local.missionId,
            lastPlayedVersion = maxOf(local.lastPlayedVersion, remote.lastPlayedVersion),
            bestStars = maxOf(local.bestStars, remote.bestStars),
            playCount = maxOf(local.playCount, remote.playCount),
            completionCount = maxOf(local.completionCount, remote.completionCount),
            completed = local.completed || remote.completed
        )
    }
}
