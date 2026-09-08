package com.explorax.cazaestelar.media

import com.badlogic.gdx.Gdx

object MediaServices {
    @JvmStatic
    fun createDefault() = RemoteMediaManager(
        cache = GdxLocalMediaCache(Gdx.files.local("content-cache/media")),
        remote = GdxHttpMediaRemoteSource()
    )
}
