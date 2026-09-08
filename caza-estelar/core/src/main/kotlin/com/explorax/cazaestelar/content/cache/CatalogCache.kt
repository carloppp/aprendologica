package com.explorax.cazaestelar.content.cache

interface CatalogCache {
    fun load(): String?
    fun save(rawJson: String)
    fun clear()
}
