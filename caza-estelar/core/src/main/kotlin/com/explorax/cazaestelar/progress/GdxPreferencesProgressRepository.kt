package com.explorax.cazaestelar.progress

import com.badlogic.gdx.Gdx
import com.badlogic.gdx.Preferences

class GdxPreferencesProgressRepository(private val preferences: Preferences) : ProgressRepository {
    override fun find(playerId: String, missionId: String): MissionProgress? {
        val prefix = keyPrefix(playerId, missionId)
        if (!preferences.contains(prefix + "playCount")) return null
        return MissionProgress(
            missionId = missionId,
            lastPlayedVersion = preferences.getInteger(prefix + "version", 1),
            bestStars = preferences.getInteger(prefix + "bestStars", 0),
            playCount = preferences.getInteger(prefix + "playCount", 0),
            completionCount = preferences.getInteger(prefix + "completionCount", 0),
            completed = preferences.getBoolean(prefix + "completed", false)
        )
    }

    override fun recordResult(
        playerId: String,
        missionId: String,
        missionVersion: Int,
        starsEarned: Int
    ): MissionProgress {
        val updated = ProgressCalculator.record(
            find(playerId, missionId), missionId, missionVersion, starsEarned
        )
        save(playerId, updated)
        return updated
    }

    override fun merge(playerId: String, remote: MissionProgress): MissionProgress {
        val merged = ProgressMergePolicy.merge(find(playerId, remote.missionId), remote)
        save(playerId, merged)
        return merged
    }

    private fun save(playerId: String, progress: MissionProgress) {
        val prefix = keyPrefix(playerId, progress.missionId)
        preferences
            .putInteger(prefix + "version", progress.lastPlayedVersion)
            .putInteger(prefix + "bestStars", progress.bestStars)
            .putInteger(prefix + "playCount", progress.playCount)
            .putInteger(prefix + "completionCount", progress.completionCount)
            .putBoolean(prefix + "completed", progress.completed)
            .flush()
    }

    private fun keyPrefix(playerId: String, missionId: String) =
        "player::$playerId::mission::$missionId::"

    companion object {
        @JvmStatic
        fun createDefault() = GdxPreferencesProgressRepository(
            Gdx.app.getPreferences("caza-estelar-progress-v1")
        )
    }
}
