package com.explorax.cazaestelar.content.remote

import com.badlogic.gdx.Gdx
import com.badlogic.gdx.Net

class GdxHttpCatalogRemoteSource(private val catalogUrl: String) : CatalogRemoteSource {
    init {
        require(catalogUrl.startsWith("https://")) { "The catalog URL must use HTTPS" }
    }

    override fun fetch(callback: CatalogFetchCallback) {
        val request = Net.HttpRequest(Net.HttpMethods.GET).apply {
            url = catalogUrl
            timeOut = 8_000
            setHeader("Accept", "application/json")
        }
        Gdx.net.sendHttpRequest(request, object : Net.HttpResponseListener {
            override fun handleHttpResponse(response: Net.HttpResponse) {
                val status = response.status.statusCode
                if (status in 200..299) callback.onComplete(response.resultAsString, null)
                else callback.onComplete(null, "HTTP $status")
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
