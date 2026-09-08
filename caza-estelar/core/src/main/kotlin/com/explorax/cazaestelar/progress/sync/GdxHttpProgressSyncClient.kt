package com.explorax.cazaestelar.progress.sync

import com.badlogic.gdx.Gdx
import com.badlogic.gdx.Net
import com.badlogic.gdx.utils.JsonReader
import com.badlogic.gdx.utils.JsonValue
import com.explorax.cazaestelar.network.JsonEncoding
import com.explorax.cazaestelar.progress.MissionProgress
import com.explorax.cazaestelar.session.AuthToken

class GdxHttpProgressSyncClient(private val syncUrl: String) : ProgressSyncClient {
    init {
        require(syncUrl.startsWith("https://")) { "Progress sync URL must use HTTPS" }
    }

    override fun sync(token: AuthToken, events: List<ProgressSyncEvent>, callback: ProgressSyncCallback) {
        val body = events.joinToString(",", prefix = "{\"events\":[", postfix = "]}") { event ->
            "{\"eventId\":${JsonEncoding.quote(event.eventId)}," +
                "\"missionId\":${JsonEncoding.quote(event.missionId)}," +
                "\"missionVersion\":${event.missionVersion}," +
                "\"starsEarned\":${event.starsEarned}}"
        }
        val request = Net.HttpRequest(Net.HttpMethods.POST).apply {
            url = syncUrl
            timeOut = 10_000
            setHeader("Content-Type", "application/json")
            setHeader("Authorization", "Bearer ${token.accessToken()}")
            content = body
        }
        Gdx.net.sendHttpRequest(request, object : Net.HttpResponseListener {
            override fun handleHttpResponse(response: Net.HttpResponse) {
                if (response.status.statusCode !in 200..299) {
                    callback.onComplete(null, "HTTP ${response.status.statusCode}")
                    return
                }
                val rawResponse = response.resultAsString
                if (rawResponse.toByteArray(Charsets.UTF_8).size > 524_288) {
                    callback.onComplete(null, "Progress response is too large")
                    return
                }
                val parsed = runCatching { parseResponse(rawResponse) }.getOrNull()
                if (parsed == null) callback.onComplete(null, "Invalid progress response")
                else callback.onComplete(parsed, null)
            }

            override fun failed(cause: Throwable) {
                callback.onComplete(null, cause.message ?: "Network error")
            }

            override fun cancelled() {
                callback.onComplete(null, "Request cancelled")
            }
        })
    }

    private fun parseResponse(rawJson: String): ProgressSyncResponse {
        val root = JsonReader().parse(rawJson)
        val accepted = root.get("acceptedEventIds")?.elements()?.map { it.asString() }?.toSet()
            ?: emptySet()
        val progress = root.get("progress")?.elements()?.map { value ->
            val item = MissionProgress(
                missionId = value.getString("missionId"),
                lastPlayedVersion = value.getInt("lastPlayedVersion"),
                bestStars = value.getInt("bestStars"),
                playCount = value.getInt("playCount"),
                completionCount = value.getInt("completionCount"),
                completed = value.getBoolean("completed")
            )
            require(item.missionId.isNotBlank())
            require(item.lastPlayedVersion >= 1)
            require(item.bestStars in 0..3)
            require(item.playCount >= 0 && item.completionCount in 0..item.playCount)
            item
        }?.toList() ?: emptyList()
        return ProgressSyncResponse(accepted, progress)
    }

    private fun JsonValue.elements(): Sequence<JsonValue> = sequence {
        var item = child
        while (item != null) {
            yield(item)
            item = item.next
        }
    }
}
