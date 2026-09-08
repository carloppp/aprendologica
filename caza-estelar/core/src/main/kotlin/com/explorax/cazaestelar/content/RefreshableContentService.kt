package com.explorax.cazaestelar.content

import com.explorax.cazaestelar.content.model.ContentCatalog

enum class ContentRefreshStatus { UPDATED, UP_TO_DATE, OFFLINE, REJECTED }

data class ContentRefreshResult(
    val status: ContentRefreshStatus,
    val catalog: ContentCatalog,
    val message: String = ""
)

fun interface ContentRefreshCallback {
    fun onComplete(result: ContentRefreshResult)
}

interface RefreshableContentService : ContentService {
    fun refresh(callback: ContentRefreshCallback)
}
