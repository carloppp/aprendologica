package com.explorax.cazaestelar.session

import com.explorax.cazaestelar.network.config.NetworkConfigurationPolicy
import com.explorax.cazaestelar.network.config.NetworkServicesConfig
import com.explorax.cazaestelar.network.config.NetworkServicesConfigParser

object AuthenticationServices {
    @JvmStatic
    fun createDefault(configPath: String, tokenStore: AuthTokenStore): AuthenticationService {
        return create(NetworkServicesConfigParser.loadInternal(configPath), tokenStore)
    }

    @JvmStatic
    fun create(config: NetworkServicesConfig, tokenStore: AuthTokenStore): AuthenticationService {
        val authentication = config.authentication
        return when {
            authentication.remoteEnabled -> {
                if (NetworkConfigurationPolicy.isSecureHttpsUrl(authentication.signInUrl)) {
                    GdxHttpAuthenticationService(authentication.signInUrl, tokenStore)
                } else {
                    UnavailableAuthenticationService()
                }
            }
            config.developmentMode -> LocalDevelopmentAuthenticationService()
            else -> UnavailableAuthenticationService()
        }
    }
}
