package com.explorax.cazaestelar.network.config

import com.explorax.cazaestelar.session.AuthenticationServices
import com.explorax.cazaestelar.session.InMemoryAuthTokenStore
import com.explorax.cazaestelar.session.LocalDevelopmentAuthenticationService
import com.explorax.cazaestelar.session.UnavailableAuthenticationService
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class NetworkConfigurationPolicyTest {
    @Test
    fun `development mode explicitly permits local services`() {
        val config = config(developmentMode = true)

        assertTrue(NetworkConfigurationPolicy.validate(config).isEmpty())
        assertTrue(
            AuthenticationServices.create(config, InMemoryAuthTokenStore()) is
                LocalDevelopmentAuthenticationService
        )
    }

    @Test
    fun `production rejects missing remote services and never enables local access`() {
        val config = config(developmentMode = false)

        assertTrue(NetworkConfigurationPolicy.validate(config).isNotEmpty())
        assertTrue(
            AuthenticationServices.create(config, InMemoryAuthTokenStore()) is
                UnavailableAuthenticationService
        )
    }

    @Test
    fun `production accepts secure remote endpoints`() {
        val config = NetworkServicesConfig(
            developmentMode = false,
            authentication = AuthenticationEndpointConfig(true, "https://api.example.org/auth/sign-in"),
            progress = ProgressEndpointConfig(true, "https://api.example.org/progress/sync")
        )

        assertTrue(NetworkConfigurationPolicy.validate(config).isEmpty())
    }

    @Test
    fun `an explicitly enabled but invalid remote login never falls back to local access`() {
        val config = NetworkServicesConfig(
            developmentMode = true,
            authentication = AuthenticationEndpointConfig(true, "http://insecure.example.org/login"),
            progress = ProgressEndpointConfig(false, "")
        )

        assertTrue(NetworkConfigurationPolicy.validate(config).isNotEmpty())
        assertTrue(
            AuthenticationServices.create(config, InMemoryAuthTokenStore()) is
                UnavailableAuthenticationService
        )
    }

    @Test
    fun `parser defaults an omitted development flag to the safe production value`() {
        val parsed = NetworkServicesConfigParser.parse(
            """{"authentication":{},"progress":{}}"""
        )

        assertTrue(!parsed.developmentMode)
        assertTrue(NetworkConfigurationPolicy.validate(parsed).isNotEmpty())
    }

    private fun config(developmentMode: Boolean) = NetworkServicesConfig(
        developmentMode = developmentMode,
        authentication = AuthenticationEndpointConfig(false, ""),
        progress = ProgressEndpointConfig(false, "")
    )
}
