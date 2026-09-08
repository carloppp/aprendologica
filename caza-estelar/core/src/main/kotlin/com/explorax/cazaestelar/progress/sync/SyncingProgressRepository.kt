package com.explorax.cazaestelar.progress.sync

import com.explorax.cazaestelar.progress.MissionProgress
import com.explorax.cazaestelar.progress.ProgressRepository
import com.explorax.cazaestelar.session.AuthTokenStore
import java.util.UUID

class SyncingProgressRepository(
    private val local: ProgressRepository,
    private val queue: ProgressSyncQueue,
    private val client: ProgressSyncClient?,
    private val tokenStore: AuthTokenStore
) : ProgressRepository {
    @Volatile private var synchronizing = false

    override fun find(playerId: String, missionId: String): MissionProgress? =
        local.find(playerId, missionId)

    override fun recordResult(
        playerId: String,
        missionId: String,
        missionVersion: Int,
        starsEarned: Int
    ): MissionProgress {
        val result = local.recordResult(playerId, missionId, missionVersion, starsEarned)
        queue.enqueue(
            ProgressSyncEvent(
                eventId = UUID.randomUUID().toString(),
                playerId = playerId,
                missionId = missionId,
                missionVersion = missionVersion,
                starsEarned = starsEarned
            )
        )
        synchronize()
        return result
    }

    override fun merge(playerId: String, remote: MissionProgress): MissionProgress =
        local.merge(playerId, remote)

    fun synchronize() {
        val syncClient = client ?: return
        val token = tokenStore.load() ?: return
        if (token.isExpired(System.currentTimeMillis() / 1000L)) {
            tokenStore.clear()
            return
        }
        val batch = queue.pending().filter { it.playerId == token.playerId() }.take(MAX_BATCH_SIZE)
        if (batch.isEmpty()) return
        synchronized(this) {
            if (synchronizing) return
            synchronizing = true
        }
        syncClient.sync(token, batch) { response, error ->
            var acceptedAny = false
            if (response != null) {
                val sentIds = batch.map { it.eventId }.toSet()
                val accepted = response.acceptedEventIds.intersect(sentIds)
                acceptedAny = accepted.isNotEmpty()
                queue.remove(accepted)
                response.canonicalProgress.forEach { local.merge(token.playerId(), it) }
            }
            if (error == "HTTP 401" || error == "HTTP 403") tokenStore.clear()
            synchronized(this) { synchronizing = false }
            if (acceptedAny && queue.pending().any { it.playerId == token.playerId() }) {
                synchronize()
            }
        }
    }

    private companion object {
        const val MAX_BATCH_SIZE = 100
    }
}
