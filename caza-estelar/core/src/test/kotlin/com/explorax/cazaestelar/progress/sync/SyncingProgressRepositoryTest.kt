package com.explorax.cazaestelar.progress.sync

import com.explorax.cazaestelar.progress.MissionProgress
import com.explorax.cazaestelar.progress.ProgressCalculator
import com.explorax.cazaestelar.progress.ProgressMergePolicy
import com.explorax.cazaestelar.progress.ProgressRepository
import com.explorax.cazaestelar.session.AuthToken
import com.explorax.cazaestelar.session.InMemoryAuthTokenStore
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class SyncingProgressRepositoryTest {
    @Test
    fun `records locally and removes an event after server acceptance`() {
        val local = MemoryProgressRepository()
        val queue = MemoryQueue()
        val tokens = InMemoryAuthTokenStore().apply {
            save(AuthToken("player", "Player", "token", Long.MAX_VALUE))
        }
        val client = ProgressSyncClient { _, events, callback ->
            callback.onComplete(
                ProgressSyncResponse(events.map { it.eventId }.toSet(), emptyList()), null
            )
        }
        val repository = SyncingProgressRepository(local, queue, client, tokens)
        repository.recordResult("player", "mission", 1, 3)
        assertTrue(queue.pending().isEmpty())
        assertEquals(3, repository.find("player", "mission")?.bestStars)
    }

    private class MemoryQueue : ProgressSyncQueue {
        private val events = mutableListOf<ProgressSyncEvent>()
        override fun enqueue(event: ProgressSyncEvent) { events += event }
        override fun pending(): List<ProgressSyncEvent> = events.toList()
        override fun remove(eventIds: Set<String>) { events.removeAll { it.eventId in eventIds } }
    }

    private class MemoryProgressRepository : ProgressRepository {
        private val values = mutableMapOf<Pair<String, String>, MissionProgress>()
        override fun find(playerId: String, missionId: String) = values[playerId to missionId]
        override fun recordResult(playerId: String, missionId: String, missionVersion: Int, starsEarned: Int): MissionProgress {
            return ProgressCalculator.record(find(playerId, missionId), missionId, missionVersion, starsEarned)
                .also { values[playerId to missionId] = it }
        }
        override fun merge(playerId: String, remote: MissionProgress): MissionProgress {
            return ProgressMergePolicy.merge(find(playerId, remote.missionId), remote)
                .also { values[playerId to remote.missionId] = it }
        }
    }
}
