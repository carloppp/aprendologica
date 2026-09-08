package com.explorax.cazaestelar.progress.sync

import com.explorax.cazaestelar.progress.MissionProgress
import com.explorax.cazaestelar.session.AuthToken

data class ProgressSyncResponse(
    val acceptedEventIds: Set<String>,
    val canonicalProgress: List<MissionProgress>
)

fun interface ProgressSyncCallback {
    fun onComplete(response: ProgressSyncResponse?, errorMessage: String?)
}

fun interface ProgressSyncClient {
    fun sync(token: AuthToken, events: List<ProgressSyncEvent>, callback: ProgressSyncCallback)
}
