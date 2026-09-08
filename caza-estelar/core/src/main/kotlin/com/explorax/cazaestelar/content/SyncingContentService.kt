package com.explorax.cazaestelar.content

import com.badlogic.gdx.Gdx
import com.explorax.cazaestelar.content.cache.CatalogCache
import com.explorax.cazaestelar.content.model.ContentCatalog
import com.explorax.cazaestelar.content.remote.CatalogRemoteSource
import com.explorax.cazaestelar.content.validation.CatalogValidator
import com.explorax.cazaestelar.content.validation.MissionValidator

class SyncingContentService(
    private val bundledAssetPath: String,
    private val parser: CatalogParser,
    private val cache: CatalogCache,
    private val remoteSource: CatalogRemoteSource?,
    private val supportedMechanics: Set<String>
) : RefreshableContentService {
    @Volatile private var currentCatalog: ContentCatalog? = null

    @Synchronized
    override fun loadPublishedCatalog(): ContentCatalog {
        currentCatalog?.let { return it }
        val bundled = parseValid(Gdx.files.internal(bundledAssetPath).readString("UTF-8"))
            ?: error("The bundled catalog is invalid")
        val cachedRaw = cache.load()
        val cached = cachedRaw?.let(::parseValid)
        if (cached == null && cachedRaw != null) cache.clear()
        return CatalogUpdatePolicy.selectStartup(bundled, cached)
            .also { currentCatalog = it }
    }

    override fun refresh(callback: ContentRefreshCallback) {
        val active = loadPublishedCatalog()
        val source = remoteSource
        if (source == null) {
            callback.onComplete(ContentRefreshResult(ContentRefreshStatus.UP_TO_DATE, active))
            return
        }
        source.fetch { rawJson, error ->
            if (rawJson == null) {
                callback.onComplete(ContentRefreshResult(ContentRefreshStatus.OFFLINE, active, error.orEmpty()))
                return@fetch
            }
            if (rawJson.toByteArray(Charsets.UTF_8).size > MAX_CATALOG_BYTES) {
                callback.onComplete(ContentRefreshResult(ContentRefreshStatus.REJECTED, active, "Catalog is too large"))
                return@fetch
            }
            val candidate = parseValid(rawJson)
            if (candidate == null) {
                callback.onComplete(ContentRefreshResult(ContentRefreshStatus.REJECTED, active, "Catalog validation failed"))
                return@fetch
            }
            if (!CatalogUpdatePolicy.isNewer(active, candidate)) {
                callback.onComplete(ContentRefreshResult(ContentRefreshStatus.UP_TO_DATE, active))
                return@fetch
            }
            cache.save(rawJson)
            currentCatalog = candidate
            callback.onComplete(ContentRefreshResult(ContentRefreshStatus.UPDATED, candidate))
        }
    }

    private fun parseValid(rawJson: String): ContentCatalog? = runCatching {
        parser.parse(rawJson)
    }.getOrNull()?.takeIf { catalog ->
        CatalogValidator.validate(catalog).isEmpty() && catalog.constellations
            .flatMap { it.themes }
            .flatMap { it.missions }
            .filter { it.mechanic.type in supportedMechanics }
            .all { MissionValidator.validate(it, supportedMechanics).isEmpty() }
    }

    private companion object {
        const val MAX_CATALOG_BYTES = 1_048_576
    }
}
