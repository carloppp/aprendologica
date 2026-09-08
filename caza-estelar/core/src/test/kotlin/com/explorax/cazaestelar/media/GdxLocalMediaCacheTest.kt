package com.explorax.cazaestelar.media

import com.badlogic.gdx.files.FileHandle
import com.explorax.cazaestelar.content.cache.CatalogIntegrity
import com.explorax.cazaestelar.content.model.ContentAssetDefinition
import com.explorax.cazaestelar.content.model.ContentAssetType
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path

class GdxLocalMediaCacheTest {
    @TempDir lateinit var directory: Path

    @Test
    fun `stores valid media and removes corrupted data`() {
        val bytes = "valid-image-placeholder".toByteArray()
        val asset = ContentAssetDefinition(
            id = "prompt-1",
            type = ContentAssetType.IMAGE,
            mimeType = "image/png",
            url = "https://example.test/prompt.png",
            sha256 = CatalogIntegrity.sha256(bytes),
            sizeBytes = bytes.size.toLong(),
            required = true
        )
        val cache = GdxLocalMediaCache(FileHandle(directory.toFile()))
        val stored = cache.store(asset, bytes)
        assertNotNull(cache.find(asset))
        stored.writeBytes("corrupt".toByteArray(), false)
        assertNull(cache.find(asset))
    }
}
