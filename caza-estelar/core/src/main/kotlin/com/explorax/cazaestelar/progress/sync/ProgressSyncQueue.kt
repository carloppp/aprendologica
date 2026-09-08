package com.explorax.cazaestelar.progress.sync

data class ProgressSyncEvent(
    val eventId: String,
    val playerId: String,
    val missionId: String,
    val missionVersion: Int,
    val starsEarned: Int
)

interface ProgressSyncQueue {
    fun enqueue(event: ProgressSyncEvent)
    fun pending(): List<ProgressSyncEvent>
    fun remove(eventIds: Set<String>)
}
