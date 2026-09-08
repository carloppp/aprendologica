package com.explorax.cazaestelar.media

import com.badlogic.gdx.files.FileHandle
import com.explorax.cazaestelar.content.cache.CatalogIntegrity
import com.explorax.cazaestelar.content.model.ContentAssetDefinition
import com.explorax.cazaestelar.content.model.ContentCatalog
import com.explorax.cazaestelar.content.model.MissionDefinition
import java.util.concurrent.atomic.AtomicInteger

fun interface MediaReadyCallback {
    fun onComplete(file: FileHandle?, errorMessage: String?)
}

fun interface MediaPreparationCallback {
    fun onComplete()
}

class RemoteMediaManager(
    private val cache: MediaCache,
    private val remote: MediaRemoteSource
) {
    @Volatile private var assetsById: Map<String, ContentAssetDefinition> = emptyMap()
    private val waiting = mutableMapOf<String, MutableList<MediaReadyCallback>>()

    fun setCatalog(catalog: ContentCatalog) {
        assetsById = catalog.assets.associateBy { it.id }
        cache.prune(catalog.assets)
        catalog.assets.filter { it.required }.forEach { ensure(it.id) { _, _ -> } }
    }

    fun findCached(assetId: String?): FileHandle? {
        if (assetId == null) return null
        return assetsById[assetId]?.let(cache::find)
    }

    fun ensure(assetId: String, callback: MediaReadyCallback) {
        val asset = assetsById[assetId]
        if (asset == null) {
            callback.onComplete(null, "Unknown media asset: $assetId")
            return
        }
        cache.find(asset)?.let {
            callback.onComplete(it, null)
            return
        }
        synchronized(waiting) {
            val existing = waiting[assetId]
            if (existing != null) {
                existing += callback
                return
            }
            waiting[assetId] = mutableListOf(callback)
        }
        remote.fetch(asset) { bytes, error ->
            if (bytes == null) {
                complete(assetId, null, error ?: "Media download failed")
                return@fetch
            }
            if (bytes.size.toLong() != asset.sizeBytes || CatalogIntegrity.sha256(bytes) != asset.sha256) {
                complete(assetId, null, "Media integrity validation failed")
                return@fetch
            }
            if (assetsById[assetId]?.sha256 != asset.sha256) {
                complete(assetId, null, "Media definition changed during download")
                return@fetch
            }
            val file = runCatching { cache.store(asset, bytes) }.getOrNull()
            if (file == null) complete(assetId, null, "Media cache write failed")
            else complete(assetId, file, null)
        }
    }

    fun ensureMissionMedia(mission: MissionDefinition, callback: MediaPreparationCallback) {
        val media = mission.media
        val assetIds = listOfNotNull(
            media.promptAssetId, media.narrationAssetId, media.backgroundAssetId
        ).distinct()
        if (assetIds.isEmpty()) {
            callback.onComplete()
            return
        }
        val remaining = AtomicInteger(assetIds.size)
        assetIds.forEach { assetId ->
            ensure(assetId) { _, _ ->
                if (remaining.decrementAndGet() == 0) callback.onComplete()
            }
        }
    }

    private fun complete(assetId: String, file: FileHandle?, error: String?) {
        val callbacks = synchronized(waiting) { waiting.remove(assetId).orEmpty() }
        callbacks.forEach { it.onComplete(file, error) }
    }
}
