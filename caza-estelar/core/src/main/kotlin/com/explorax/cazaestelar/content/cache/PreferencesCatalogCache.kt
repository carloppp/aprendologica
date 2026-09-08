package com.explorax.cazaestelar.content.cache

import com.badlogic.gdx.Preferences

class PreferencesCatalogCache(private val preferences: Preferences) : CatalogCache {
    override fun load(): String? {
        if (!preferences.contains(RAW_KEY) || !preferences.contains(HASH_KEY)) return null
        val rawJson = preferences.getString(RAW_KEY)
        val expectedHash = preferences.getString(HASH_KEY)
        if (CatalogIntegrity.sha256(rawJson) != expectedHash) {
            clear()
            return null
        }
        return rawJson
    }

    override fun save(rawJson: String) {
        preferences
            .putString(RAW_KEY, rawJson)
            .putString(HASH_KEY, CatalogIntegrity.sha256(rawJson))
            .flush()
    }

    override fun clear() {
        preferences.remove(RAW_KEY)
        preferences.remove(HASH_KEY)
        preferences.flush()
    }

    private companion object {
        const val RAW_KEY = "catalog.raw.v1"
        const val HASH_KEY = "catalog.sha256.v1"
    }
}
