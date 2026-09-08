package com.explorax.cazaestelar.content.remote

fun interface CatalogFetchCallback {
    fun onComplete(rawJson: String?, errorMessage: String?)
}

interface CatalogRemoteSource {
    fun fetch(callback: CatalogFetchCallback)
}
