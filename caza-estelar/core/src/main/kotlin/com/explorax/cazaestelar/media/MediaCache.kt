package com.explorax.cazaestelar.media

import com.badlogic.gdx.files.FileHandle
import com.explorax.cazaestelar.content.model.ContentAssetDefinition

interface MediaCache {
    fun find(asset: ContentAssetDefinition): FileHandle?
    fun store(asset: ContentAssetDefinition, bytes: ByteArray): FileHandle
    fun prune(activeAssets: Collection<ContentAssetDefinition>)
}
