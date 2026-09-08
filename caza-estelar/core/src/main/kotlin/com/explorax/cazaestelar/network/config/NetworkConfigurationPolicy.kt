package com.explorax.cazaestelar.network.config

import java.net.URI

object NetworkConfigurationPolicy {
    @JvmStatic
    fun validate(config: NetworkServicesConfig): List<String> = buildList {
        val authentication = config.authentication
        val progress = config.progress

        if (authentication.remoteEnabled && !isSecureHttpsUrl(authentication.signInUrl)) {
            add("authentication.signInUrl must be an HTTPS URL when remote authentication is enabled")
        }
        if (progress.remoteEnabled && !isSecureHttpsUrl(progress.syncUrl)) {
            add("progress.syncUrl must be an HTTPS URL when remote progress is enabled")
        }
        if (!config.developmentMode) {
            if (!authentication.remoteEnabled) {
                add("Remote authentication is required outside development mode")
            }
            if (!progress.remoteEnabled) {
                add("Remote progress synchronization is required outside development mode")
            }
        }
    }

    @JvmStatic
    fun isSecureHttpsUrl(value: String): Boolean = runCatching {
        URI(value.trim()).let { uri ->
            uri.scheme.equals("https", ignoreCase = true) &&
                !uri.host.isNullOrBlank() && uri.userInfo == null
        }
    }.getOrDefault(false)
}
