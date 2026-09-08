package com.explorax.cazaestelar.network.config

import com.badlogic.gdx.Gdx
import com.badlogic.gdx.utils.JsonReader

object NetworkServicesConfigParser {
    @JvmStatic
    fun loadInternal(path: String): NetworkServicesConfig =
        parse(Gdx.files.internal(path).readString("UTF-8"))

    @JvmStatic
    fun parse(rawJson: String): NetworkServicesConfig {
        val root = JsonReader().parse(rawJson)
        val authentication = root.get("authentication")
        val progress = root.get("progress")
        return NetworkServicesConfig(
            developmentMode = root.getBoolean("developmentMode", false),
            authentication = AuthenticationEndpointConfig(
                remoteEnabled = authentication?.getBoolean("remoteEnabled", false) ?: false,
                signInUrl = authentication?.getString("signInUrl", "")?.trim().orEmpty()
            ),
            progress = ProgressEndpointConfig(
                remoteEnabled = progress?.getBoolean("remoteEnabled", false) ?: false,
                syncUrl = progress?.getString("syncUrl", "")?.trim().orEmpty()
            )
        )
    }
}
