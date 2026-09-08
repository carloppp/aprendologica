package com.explorax.cazaestelar.media

import com.badlogic.gdx.Gdx
import com.badlogic.gdx.Net
import com.explorax.cazaestelar.content.model.ContentAssetDefinition

class GdxHttpMediaRemoteSource : MediaRemoteSource {
    override fun fetch(asset: ContentAssetDefinition, callback: MediaFetchCallback) {
        if (!asset.url.startsWith("https://")) {
            callback.onComplete(null, "Media URL must use HTTPS")
            return
        }
        val request = Net.HttpRequest(Net.HttpMethods.GET).apply {
            url = asset.url
            timeOut = 12_000
        }
        Gdx.net.sendHttpRequest(request, object : Net.HttpResponseListener {
            override fun handleHttpResponse(response: Net.HttpResponse) {
                val status = response.status.statusCode
                if (status !in 200..299) {
                    callback.onComplete(null, "HTTP $status")
                    return
                }
                val reportedSize = response.getHeader("Content-Length")?.toLongOrNull()
                if (reportedSize != null && reportedSize > asset.sizeBytes) {
                    callback.onComplete(null, "Media response exceeds declared size")
                    return
                }
                val responseType = response.getHeader("Content-Type")
                    ?.substringBefore(';')?.trim()?.lowercase()
                if (responseType != null && responseType != asset.mimeType) {
                    callback.onComplete(null, "Media response type does not match")
                    return
                }
                callback.onComplete(response.result, null)
            }

            override fun failed(cause: Throwable) {
                callback.onComplete(null, cause.message ?: "Network error")
            }

            override fun cancelled() {
                callback.onComplete(null, "Request cancelled")
            }
        })
    }
}
