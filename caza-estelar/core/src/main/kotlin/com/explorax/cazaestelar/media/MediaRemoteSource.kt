package com.explorax.cazaestelar.media

import com.explorax.cazaestelar.content.model.ContentAssetDefinition

fun interface MediaFetchCallback {
    fun onComplete(bytes: ByteArray?, errorMessage: String?)
}

interface MediaRemoteSource {
    fun fetch(asset: ContentAssetDefinition, callback: MediaFetchCallback)
}
