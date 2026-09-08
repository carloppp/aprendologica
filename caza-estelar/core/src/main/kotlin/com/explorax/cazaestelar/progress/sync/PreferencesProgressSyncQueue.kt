package com.explorax.cazaestelar.progress.sync

import com.badlogic.gdx.Preferences
import java.nio.charset.StandardCharsets
import java.util.Base64

class PreferencesProgressSyncQueue(private val preferences: Preferences) : ProgressSyncQueue {
    override fun enqueue(event: ProgressSyncEvent) {
        val events = pending().toMutableList()
        events += event
        save(events)
    }

    override fun pending(): List<ProgressSyncEvent> = preferences.getString(EVENTS_KEY, "")
        .lineSequence().filter(String::isNotBlank).mapNotNull(::decode).toList()

    override fun remove(eventIds: Set<String>) {
        if (eventIds.isEmpty()) return
        save(pending().filterNot { it.eventId in eventIds })
    }

    private fun save(events: List<ProgressSyncEvent>) {
        preferences.putString(EVENTS_KEY, events.joinToString("\n", transform = ::encode)).flush()
    }

    private fun encode(event: ProgressSyncEvent) = listOf(
        event.eventId,
        base64(event.playerId),
        base64(event.missionId),
        event.missionVersion.toString(),
        event.starsEarned.toString()
    ).joinToString("|")

    private fun decode(value: String): ProgressSyncEvent? = runCatching {
        val fields = value.split('|')
        require(fields.size == 5)
        ProgressSyncEvent(
            eventId = fields[0],
            playerId = unbase64(fields[1]),
            missionId = unbase64(fields[2]),
            missionVersion = fields[3].toInt(),
            starsEarned = fields[4].toInt()
        )
    }.getOrNull()

    private fun base64(value: String) = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(value.toByteArray(StandardCharsets.UTF_8))

    private fun unbase64(value: String) = String(
        Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8
    )

    private companion object {
        const val EVENTS_KEY = "progress.events.v1"
    }
}
