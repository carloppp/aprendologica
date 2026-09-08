package com.explorax.cazaestelar.content

import com.badlogic.gdx.Gdx
import com.badlogic.gdx.utils.JsonReader
import com.explorax.cazaestelar.content.cache.PreferencesCatalogCache
import com.explorax.cazaestelar.content.remote.GdxHttpCatalogRemoteSource

object ContentServices {
    @JvmStatic
    fun createDefault(
        bundledCatalogPath: String,
        sourceConfigPath: String,
        supportedMechanics: Set<String>
    ): SyncingContentService {
        val config = JsonReader().parse(Gdx.files.internal(sourceConfigPath))
        val enabled = config.getBoolean("remoteEnabled", false)
        val url = config.getString("catalogUrl", "")
        val remote = if (enabled && url.startsWith("https://")) {
            GdxHttpCatalogRemoteSource(url)
        } else null
        return SyncingContentService(
            bundledAssetPath = bundledCatalogPath,
            parser = CatalogParser(),
            cache = PreferencesCatalogCache(Gdx.app.getPreferences("caza-estelar-content-cache-v1")),
            remoteSource = remote,
            supportedMechanics = supportedMechanics
        )
    }
}
