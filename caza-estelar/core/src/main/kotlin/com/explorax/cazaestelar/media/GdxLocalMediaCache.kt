package com.explorax.cazaestelar.media

import com.badlogic.gdx.files.FileHandle
import com.explorax.cazaestelar.content.cache.CatalogIntegrity
import com.explorax.cazaestelar.content.model.ContentAssetDefinition
import com.explorax.cazaestelar.content.model.ContentAssetType

class GdxLocalMediaCache(private val root: FileHandle) : MediaCache {
    override fun find(asset: ContentAssetDefinition): FileHandle? {
        val file = fileFor(asset)
        if (!file.exists()) return null
        if (file.length() != asset.sizeBytes || CatalogIntegrity.sha256(file.readBytes()) != asset.sha256) {
            file.delete()
            return null
        }
        return file
    }

    override fun store(asset: ContentAssetDefinition, bytes: ByteArray): FileHandle {
        require(bytes.size.toLong() == asset.sizeBytes) { "Downloaded media size does not match" }
        require(CatalogIntegrity.sha256(bytes) == asset.sha256) { "Downloaded media hash does not match" }
        root.mkdirs()
        return fileFor(asset).also { it.writeBytes(bytes, false) }
    }

    override fun prune(activeAssets: Collection<ContentAssetDefinition>) {
        if (!root.exists()) return
        val activeNames = activeAssets.map(::fileFor).map { it.name() }.toSet()
        root.list().filter { !it.isDirectory && it.name() !in activeNames }.forEach { it.delete() }
    }

    private fun fileFor(asset: ContentAssetDefinition): FileHandle {
        val safeId = asset.id.replace(Regex("[^a-zA-Z0-9_-]"), "-")
        val extension = when (asset.mimeType) {
            "image/png" -> "png"
            "image/jpeg" -> "jpg"
            "audio/mpeg" -> "mp3"
            "audio/ogg" -> "ogg"
            "audio/wav" -> "wav"
            else -> when (asset.type) {
                ContentAssetType.IMAGE -> "img"
                ContentAssetType.AUDIO -> "audio"
            }
        }
        return root.child("$safeId-${asset.sha256.take(16)}.$extension")
    }
}
