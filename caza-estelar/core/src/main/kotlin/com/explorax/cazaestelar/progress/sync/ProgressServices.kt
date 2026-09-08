package com.explorax.cazaestelar.progress.sync

import com.badlogic.gdx.Gdx
import com.explorax.cazaestelar.network.config.NetworkConfigurationPolicy
import com.explorax.cazaestelar.network.config.NetworkServicesConfig
import com.explorax.cazaestelar.network.config.NetworkServicesConfigParser
import com.explorax.cazaestelar.progress.ProgressRepository
import com.explorax.cazaestelar.session.AuthTokenStore

object ProgressServices {
    @JvmStatic
    fun createDefault(
        configPath: String,
        local: ProgressRepository,
        tokenStore: AuthTokenStore
    ): SyncingProgressRepository {
        return create(NetworkServicesConfigParser.loadInternal(configPath), local, tokenStore)
    }

    @JvmStatic
    fun create(
        config: NetworkServicesConfig,
        local: ProgressRepository,
        tokenStore: AuthTokenStore
    ): SyncingProgressRepository {
        val progress = config.progress
        val client = if (
            progress.remoteEnabled && NetworkConfigurationPolicy.isSecureHttpsUrl(progress.syncUrl)
        ) {
            GdxHttpProgressSyncClient(progress.syncUrl)
        } else null
        return SyncingProgressRepository(
            local = local,
            queue = PreferencesProgressSyncQueue(
                Gdx.app.getPreferences("caza-estelar-progress-sync-queue-v1")
            ),
            client = client,
            tokenStore = tokenStore
        )
    }
}
